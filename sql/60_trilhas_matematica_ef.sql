-- ============================================================================
-- 60_TRILHAS_MATEMATICA_EF.SQL
-- Expansao do sistema de trilhas para Matematica do Ensino Fundamental
-- 6o ao 9o ano com 4 alternativas (A, B, C, D)
--
-- Criado em: 2025-01-15
-- Autor: Sistema Claude - Analista Master Senior
-- ============================================================================

-- ============================================================================
-- 1. ADICIONAR COLUNA COMPONENTE NA TABELA questoes_trilha
-- ============================================================================

ALTER TABLE questoes_trilha
ADD COLUMN IF NOT EXISTS componente VARCHAR(20) DEFAULT 'fisica'
CHECK (componente IN ('fisica', 'matematica'));

COMMENT ON COLUMN questoes_trilha.componente IS 'Componente curricular: fisica ou matematica';

-- ============================================================================
-- 2. ADICIONAR COLUNA NIVEL_ENSINO
-- ============================================================================

ALTER TABLE questoes_trilha
ADD COLUMN IF NOT EXISTS nivel_ensino VARCHAR(5) DEFAULT 'EM'
CHECK (nivel_ensino IN ('EF', 'EM'));

COMMENT ON COLUMN questoes_trilha.nivel_ensino IS 'Nivel de ensino: EF (Fundamental) ou EM (Medio)';

-- ============================================================================
-- 3. ADICIONAR COLUNA NUM_ALTERNATIVAS
-- ============================================================================

ALTER TABLE questoes_trilha
ADD COLUMN IF NOT EXISTS num_alternativas INTEGER DEFAULT 5
CHECK (num_alternativas IN (4, 5));

COMMENT ON COLUMN questoes_trilha.num_alternativas IS 'Numero de alternativas: 4 (EF) ou 5 (EM)';

-- ============================================================================
-- 4. ALTERAR CONSTRAINT DE SERIE PARA INCLUIR EF
-- ============================================================================

-- Primeiro, remover a constraint antiga
ALTER TABLE questoes_trilha DROP CONSTRAINT IF EXISTS questoes_trilha_serie_check;

-- Criar nova constraint com todas as series
ALTER TABLE questoes_trilha
ADD CONSTRAINT questoes_trilha_serie_check
CHECK (serie IN ('6EF', '7EF', '8EF', '9EF', '1EM', '2EM', '3EM'));

-- ============================================================================
-- 5. ALTERAR CONSTRAINT DE RESPOSTA_CORRETA
-- ============================================================================

-- Remover constraint antiga
ALTER TABLE questoes_trilha DROP CONSTRAINT IF EXISTS questoes_trilha_resposta_correta_check;

-- Nova constraint mais flexivel (valida via trigger)
ALTER TABLE questoes_trilha
ADD CONSTRAINT questoes_trilha_resposta_correta_check
CHECK (resposta_correta IN ('A', 'B', 'C', 'D', 'E'));

-- ============================================================================
-- 6. TRIGGER PARA VALIDAR RESPOSTA vs NUM_ALTERNATIVAS
-- ============================================================================

CREATE OR REPLACE FUNCTION validar_resposta_alternativas()
RETURNS TRIGGER AS $$
BEGIN
    -- Se tem 4 alternativas (EF), resposta so pode ser A, B, C ou D
    IF NEW.num_alternativas = 4 AND NEW.resposta_correta = 'E' THEN
        RAISE EXCEPTION 'Questao com 4 alternativas nao pode ter resposta E';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_validar_resposta ON questoes_trilha;
CREATE TRIGGER tr_validar_resposta
    BEFORE INSERT OR UPDATE ON questoes_trilha
    FOR EACH ROW EXECUTE FUNCTION validar_resposta_alternativas();

-- ============================================================================
-- 7. TRIGGER PARA AUTO-DEFINIR NIVEL_ENSINO E NUM_ALTERNATIVAS
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_definir_nivel_ensino()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-definir nivel_ensino baseado na serie
    IF NEW.serie IN ('6EF', '7EF', '8EF', '9EF') THEN
        NEW.nivel_ensino := 'EF';
        NEW.num_alternativas := 4;
    ELSIF NEW.serie IN ('1EM', '2EM', '3EM') THEN
        NEW.nivel_ensino := 'EM';
        NEW.num_alternativas := 5;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_auto_nivel_ensino ON questoes_trilha;
CREATE TRIGGER tr_auto_nivel_ensino
    BEFORE INSERT ON questoes_trilha
    FOR EACH ROW EXECUTE FUNCTION auto_definir_nivel_ensino();

-- ============================================================================
-- 8. ATUALIZAR CONSTRAINT DE SERIE NA TABELA usuario_trilha
-- ============================================================================

ALTER TABLE usuario_trilha DROP CONSTRAINT IF EXISTS usuario_trilha_serie_check;

ALTER TABLE usuario_trilha
ADD CONSTRAINT usuario_trilha_serie_check
CHECK (serie IN ('6EF', '7EF', '8EF', '9EF', '1EM', '2EM', '3EM'));

-- Adicionar coluna componente se nao existir
ALTER TABLE usuario_trilha
ADD COLUMN IF NOT EXISTS componente VARCHAR(20) DEFAULT 'fisica'
CHECK (componente IN ('fisica', 'matematica'));

-- ============================================================================
-- 9. ATUALIZAR CONSTRAINT DE SERIE NA TABELA progresso_semanal
-- ============================================================================

-- Nota: progresso_semanal nao tem constraint de serie definida, apenas column

-- Adicionar coluna componente se nao existir
ALTER TABLE progresso_semanal
ADD COLUMN IF NOT EXISTS componente VARCHAR(20) DEFAULT 'fisica'
CHECK (componente IN ('fisica', 'matematica'));

-- ============================================================================
-- 10. ATUALIZAR TABELA respostas_trilha PARA 4 ALTERNATIVAS
-- ============================================================================

-- Remover constraint antiga
ALTER TABLE respostas_trilha DROP CONSTRAINT IF EXISTS respostas_trilha_resposta_dada_check;

-- Nova constraint
ALTER TABLE respostas_trilha
ADD CONSTRAINT respostas_trilha_resposta_dada_check
CHECK (resposta_dada IN ('A', 'B', 'C', 'D', 'E'));

-- ============================================================================
-- 11. INDICES ADICIONAIS PARA COMPONENTE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_qt_componente ON questoes_trilha(componente);
CREATE INDEX IF NOT EXISTS idx_qt_nivel_ensino ON questoes_trilha(nivel_ensino);
CREATE INDEX IF NOT EXISTS idx_qt_componente_serie ON questoes_trilha(componente, serie);
CREATE INDEX IF NOT EXISTS idx_ut_componente ON usuario_trilha(componente);
CREATE INDEX IF NOT EXISTS idx_ps_componente ON progresso_semanal(componente);

-- ============================================================================
-- 12. ATUALIZAR REGISTROS EXISTENTES (FISICA EM)
-- ============================================================================

-- Garantir que registros existentes tenham componente='fisica' e nivel_ensino='EM'
UPDATE questoes_trilha
SET componente = 'fisica',
    nivel_ensino = 'EM',
    num_alternativas = 5
WHERE serie IN ('1EM', '2EM', '3EM')
  AND (componente IS NULL OR componente = 'fisica');

-- ============================================================================
-- 13. FUNCAO RPC: BUSCAR QUESTOES POR COMPONENTE E SERIE
-- ============================================================================

CREATE OR REPLACE FUNCTION buscar_questoes_trilha_v2(
    p_componente VARCHAR(20),
    p_serie VARCHAR(10),
    p_semana INTEGER,
    p_ano_letivo INTEGER DEFAULT EXTRACT(YEAR FROM NOW())
)
RETURNS TABLE (
    id BIGINT,
    serie VARCHAR(10),
    semana INTEGER,
    ordem INTEGER,
    tema VARCHAR(100),
    subtema TEXT,
    tipo_questao VARCHAR(50),
    contexto_cotidiano VARCHAR(50),
    enunciado TEXT,
    alternativas JSONB,
    resposta_correta VARCHAR(1),
    dica TEXT,
    feedback JSONB,
    dificuldade VARCHAR(20),
    num_alternativas INTEGER,
    nivel_ensino VARCHAR(5),
    componente VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        qt.id,
        qt.serie,
        qt.semana,
        qt.ordem,
        qt.tema,
        qt.subtema,
        qt.tipo_questao,
        qt.contexto_cotidiano,
        qt.enunciado,
        qt.alternativas,
        qt.resposta_correta,
        qt.dica,
        qt.feedback,
        qt.dificuldade,
        qt.num_alternativas,
        qt.nivel_ensino,
        qt.componente
    FROM questoes_trilha qt
    WHERE qt.componente = p_componente
      AND qt.serie = p_serie
      AND qt.semana = p_semana
      AND qt.ano_letivo = p_ano_letivo
      AND qt.ativa = TRUE
    ORDER BY qt.ordem;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 14. FUNCAO RPC: ESTATISTICAS POR COMPONENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION estatisticas_trilha_componente(
    p_usuario_id UUID,
    p_componente VARCHAR(20)
)
RETURNS TABLE (
    total_questoes BIGINT,
    questoes_respondidas BIGINT,
    questoes_corretas BIGINT,
    taxa_acerto NUMERIC,
    semanas_concluidas BIGINT,
    pontos_total BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(ps.questoes_total), 0)::BIGINT as total_questoes,
        COALESCE(SUM(ps.questoes_respondidas), 0)::BIGINT as questoes_respondidas,
        COALESCE(SUM(ps.questoes_corretas), 0)::BIGINT as questoes_corretas,
        CASE
            WHEN COALESCE(SUM(ps.questoes_respondidas), 0) > 0
            THEN ROUND((COALESCE(SUM(ps.questoes_corretas), 0)::NUMERIC / COALESCE(SUM(ps.questoes_respondidas), 0)::NUMERIC) * 100, 1)
            ELSE 0
        END as taxa_acerto,
        COUNT(CASE WHEN ps.status = 'concluida' THEN 1 END)::BIGINT as semanas_concluidas,
        COALESCE(SUM(ps.pontos_semana), 0)::BIGINT as pontos_total
    FROM progresso_semanal ps
    WHERE ps.usuario_id = p_usuario_id
      AND ps.componente = p_componente;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIM DA MIGRACAO
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Migracao para Matematica EF concluida!';
    RAISE NOTICE '';
    RAISE NOTICE 'Novas colunas:';
    RAISE NOTICE '  - componente: fisica | matematica';
    RAISE NOTICE '  - nivel_ensino: EF | EM';
    RAISE NOTICE '  - num_alternativas: 4 | 5';
    RAISE NOTICE '';
    RAISE NOTICE 'Series suportadas:';
    RAISE NOTICE '  - EF: 6EF, 7EF, 8EF, 9EF (4 alternativas)';
    RAISE NOTICE '  - EM: 1EM, 2EM, 3EM (5 alternativas)';
    RAISE NOTICE '';
    RAISE NOTICE 'Novas funcoes RPC:';
    RAISE NOTICE '  - buscar_questoes_trilha_v2()';
    RAISE NOTICE '  - estatisticas_trilha_componente()';
    RAISE NOTICE '============================================';
END $$;
