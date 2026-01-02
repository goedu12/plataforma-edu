-- ═══════════════════════════════════════════════════════════════════════════
-- PLATAFORMA EDUCACIONAL - SISTEMA DE NOTAS 2025
-- Versão: 3.0
-- Especificação: Física Bot - Sistema de Notas 2025
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: config_bimestres
-- Configuração dos períodos letivos (bimestres regulares e recuperação)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS config_bimestres (
    id SERIAL PRIMARY KEY,
    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),
    ano_letivo INTEGER NOT NULL,
    tipo VARCHAR(15) NOT NULL CHECK (tipo IN ('regular', 'recuperacao', 'ferias')),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    meta_questoes INTEGER, -- NULL para recuperação (calcula com base nas pendentes)
    limite_semanal INTEGER, -- 15 para regular, NULL para recuperação
    nota_maxima DECIMAL(3,1) DEFAULT 10.0, -- 10.0 para regular, 6.0 para recuperação

    UNIQUE(bimestre, ano_letivo, tipo)
);

-- Inserir dados de 2025 conforme especificação
INSERT INTO config_bimestres (bimestre, ano_letivo, tipo, data_inicio, data_fim, meta_questoes, limite_semanal, nota_maxima)
VALUES
    -- 1º Bimestre
    (1, 2025, 'regular', '2025-02-03', '2025-03-24', 105, 15, 10.0),
    (1, 2025, 'recuperacao', '2025-03-25', '2025-04-03', NULL, NULL, 6.0),

    -- 2º Bimestre
    (2, 2025, 'regular', '2025-04-04', '2025-06-16', 150, 15, 10.0),
    (2, 2025, 'recuperacao', '2025-06-17', '2025-06-26', NULL, NULL, 6.0),

    -- Férias de Julho (informativo)
    (2, 2025, 'ferias', '2025-06-27', '2025-08-03', NULL, NULL, NULL),

    -- 3º Bimestre
    (3, 2025, 'regular', '2025-08-04', '2025-09-23', 105, 15, 10.0),
    (3, 2025, 'recuperacao', '2025-09-24', '2025-10-03', NULL, NULL, 6.0),

    -- 4º Bimestre
    (4, 2025, 'regular', '2025-10-04', '2025-12-04', 135, 15, 10.0),
    (4, 2025, 'recuperacao', '2025-12-05', '2025-12-15', NULL, NULL, 6.0)
ON CONFLICT (bimestre, ano_letivo, tipo) DO UPDATE SET
    data_inicio = EXCLUDED.data_inicio,
    data_fim = EXCLUDED.data_fim,
    meta_questoes = EXCLUDED.meta_questoes,
    limite_semanal = EXCLUDED.limite_semanal,
    nota_maxima = EXCLUDED.nota_maxima;

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: notas_2025 (nova estrutura)
-- Sistema de notas baseado em participação + bônus de frequência
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notas_2025 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(15) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    ano_letivo INTEGER NOT NULL DEFAULT 2025,
    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),

    -- Período Regular
    questoes_respondidas INTEGER DEFAULT 0,
    meta_questoes INTEGER NOT NULL,
    dias_ativos INTEGER DEFAULT 0,
    nota_base DECIMAL(4,2) DEFAULT 0, -- (questões/meta) × 10
    bonus_frequencia DECIMAL(3,1) DEFAULT 0, -- 0, 0.5, 1.0, 1.5, 2.0
    nota_regular DECIMAL(4,2) DEFAULT 0, -- base + bonus (max 10)

    -- Recuperação
    em_recuperacao BOOLEAN DEFAULT FALSE,
    questoes_pendentes INTEGER DEFAULT 0, -- meta - questões_respondidas
    questoes_recuperacao INTEGER DEFAULT 0, -- feitas na recuperação
    nota_recuperacao DECIMAL(4,2), -- (feitas/pendentes) × 6, max 6.0

    -- Nota Final
    nota_final DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'recuperacao', 'aprovado', 'reprovado', 'fechado')),

    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(usuario_id, componente, ano_letivo, bimestre)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notas_2025_usuario ON notas_2025(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_2025_periodo ON notas_2025(ano_letivo, bimestre);
CREATE INDEX IF NOT EXISTS idx_notas_2025_status ON notas_2025(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: controle_semanal
-- Rastreia questões respondidas por semana (limite de 15)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS controle_semanal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(15) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    ano_letivo INTEGER NOT NULL DEFAULT 2025,
    semana_inicio DATE NOT NULL, -- Segunda-feira da semana
    questoes_respondidas INTEGER DEFAULT 0,

    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(usuario_id, componente, ano_letivo, semana_inicio)
);

CREATE INDEX IF NOT EXISTS idx_controle_semanal_usuario ON controle_semanal(usuario_id);
CREATE INDEX IF NOT EXISTS idx_controle_semanal_semana ON controle_semanal(semana_inicio);

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: get_periodo_atual()
-- Retorna o período atual (bimestre/recuperação/férias)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_periodo_atual(p_ano INTEGER DEFAULT 2025)
RETURNS TABLE (
    bimestre INTEGER,
    tipo VARCHAR(15),
    data_inicio DATE,
    data_fim DATE,
    meta_questoes INTEGER,
    limite_semanal INTEGER,
    nota_maxima DECIMAL(3,1),
    dias_restantes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cb.bimestre,
        cb.tipo,
        cb.data_inicio,
        cb.data_fim,
        cb.meta_questoes,
        cb.limite_semanal,
        cb.nota_maxima,
        (cb.data_fim - CURRENT_DATE)::INTEGER as dias_restantes
    FROM config_bimestres cb
    WHERE cb.ano_letivo = p_ano
      AND CURRENT_DATE BETWEEN cb.data_inicio AND cb.data_fim
    ORDER BY cb.data_inicio
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: get_segunda_feira_semana()
-- Retorna a segunda-feira da semana atual
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_segunda_feira_semana(p_data DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
    -- Se for domingo (0), volta 6 dias. Senão, volta (dia_semana - 1) dias
    RETURN p_data - ((EXTRACT(DOW FROM p_data)::INTEGER + 6) % 7);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: contar_questoes_semana()
-- Conta questões respondidas na semana atual
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION contar_questoes_semana(
    p_usuario_id UUID,
    p_componente VARCHAR(15)
)
RETURNS INTEGER AS $$
DECLARE
    v_segunda DATE;
    v_count INTEGER;
BEGIN
    v_segunda := get_segunda_feira_semana();

    SELECT COALESCE(questoes_respondidas, 0) INTO v_count
    FROM controle_semanal
    WHERE usuario_id = p_usuario_id
      AND componente = p_componente
      AND semana_inicio = v_segunda;

    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: pode_responder()
-- Verifica se o estudante pode responder (limite semanal)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION pode_responder(
    p_usuario_id UUID,
    p_componente VARCHAR(15)
)
RETURNS TABLE (
    pode BOOLEAN,
    questoes_semana INTEGER,
    limite INTEGER,
    em_recuperacao BOOLEAN,
    motivo VARCHAR(100)
) AS $$
DECLARE
    v_periodo RECORD;
    v_questoes_semana INTEGER;
    v_nota RECORD;
BEGIN
    -- Busca período atual
    SELECT * INTO v_periodo FROM get_periodo_atual();

    -- Se não há período ativo (férias ou fora do calendário)
    IF v_periodo IS NULL THEN
        RETURN QUERY SELECT
            FALSE::BOOLEAN,
            0::INTEGER,
            0::INTEGER,
            FALSE::BOOLEAN,
            'Fora do período letivo'::VARCHAR(100);
        RETURN;
    END IF;

    -- Verifica se está em recuperação
    SELECT * INTO v_nota
    FROM notas_2025
    WHERE usuario_id = p_usuario_id
      AND componente = p_componente
      AND bimestre = v_periodo.bimestre
      AND ano_letivo = 2025;

    -- Se está em recuperação, sem limite
    IF v_periodo.tipo = 'recuperacao' OR (v_nota IS NOT NULL AND v_nota.em_recuperacao) THEN
        RETURN QUERY SELECT
            TRUE::BOOLEAN,
            0::INTEGER,
            NULL::INTEGER,
            TRUE::BOOLEAN,
            'Período de recuperação - sem limite'::VARCHAR(100);
        RETURN;
    END IF;

    -- Conta questões da semana
    v_questoes_semana := contar_questoes_semana(p_usuario_id, p_componente);

    -- Verifica limite
    IF v_questoes_semana >= 15 THEN
        RETURN QUERY SELECT
            FALSE::BOOLEAN,
            v_questoes_semana,
            15::INTEGER,
            FALSE::BOOLEAN,
            'Limite semanal de 15 questões atingido'::VARCHAR(100);
        RETURN;
    END IF;

    RETURN QUERY SELECT
        TRUE::BOOLEAN,
        v_questoes_semana,
        15::INTEGER,
        FALSE::BOOLEAN,
        'OK'::VARCHAR(100);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: calcular_bonus_frequencia()
-- Calcula o bônus baseado nos dias ativos
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION calcular_bonus_frequencia(p_dias_ativos INTEGER)
RETURNS DECIMAL(3,1) AS $$
BEGIN
    IF p_dias_ativos < 5 THEN
        RETURN 0.0;
    ELSIF p_dias_ativos < 10 THEN
        RETURN 0.5;
    ELSIF p_dias_ativos < 15 THEN
        RETURN 1.0;
    ELSIF p_dias_ativos < 20 THEN
        RETURN 1.5;
    ELSE
        RETURN 2.0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: calcular_nota_regular()
-- Calcula a nota do período regular
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION calcular_nota_regular(
    p_questoes_respondidas INTEGER,
    p_meta_questoes INTEGER,
    p_dias_ativos INTEGER
)
RETURNS TABLE (
    nota_base DECIMAL(4,2),
    bonus_frequencia DECIMAL(3,1),
    nota_final DECIMAL(4,2)
) AS $$
DECLARE
    v_nota_base DECIMAL(4,2);
    v_bonus DECIMAL(3,1);
    v_nota_final DECIMAL(4,2);
BEGIN
    -- Nota base = (questões respondidas / meta) × 10
    v_nota_base := LEAST((p_questoes_respondidas::DECIMAL / GREATEST(p_meta_questoes, 1)) * 10, 10.0);

    -- Bônus de frequência
    v_bonus := calcular_bonus_frequencia(p_dias_ativos);

    -- Nota final = min(base + bônus, 10)
    v_nota_final := LEAST(v_nota_base + v_bonus, 10.0);

    RETURN QUERY SELECT v_nota_base, v_bonus, v_nota_final;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: calcular_nota_recuperacao()
-- Calcula a nota da recuperação
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION calcular_nota_recuperacao(
    p_questoes_feitas INTEGER,
    p_questoes_pendentes INTEGER
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
    v_questoes_contam INTEGER;
BEGIN
    -- Só contam questões até o limite de pendentes
    v_questoes_contam := LEAST(p_questoes_feitas, p_questoes_pendentes);

    -- Nota = (feitas/pendentes) × 6, máximo 6.0
    RETURN LEAST((v_questoes_contam::DECIMAL / GREATEST(p_questoes_pendentes, 1)) * 6, 6.0);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: atualizar_nota_estudante()
-- Atualiza a nota do estudante em tempo real
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION atualizar_nota_estudante(
    p_usuario_id UUID,
    p_componente VARCHAR(15)
)
RETURNS TABLE (
    bimestre INTEGER,
    questoes_respondidas INTEGER,
    meta_questoes INTEGER,
    dias_ativos INTEGER,
    nota_base DECIMAL(4,2),
    bonus_frequencia DECIMAL(3,1),
    nota_atual DECIMAL(4,2),
    em_recuperacao BOOLEAN,
    questoes_pendentes INTEGER,
    questoes_recuperacao INTEGER,
    nota_recuperacao DECIMAL(4,2),
    status VARCHAR(20),
    questoes_semana INTEGER,
    limite_semana INTEGER
) AS $$
DECLARE
    v_periodo RECORD;
    v_nota RECORD;
    v_questoes_respondidas INTEGER;
    v_dias_ativos INTEGER;
    v_calculo RECORD;
    v_questoes_semana INTEGER;
BEGIN
    -- Busca período atual
    SELECT * INTO v_periodo FROM get_periodo_atual();

    IF v_periodo IS NULL THEN
        RETURN;
    END IF;

    -- Conta questões respondidas no período regular do bimestre
    SELECT COUNT(*) INTO v_questoes_respondidas
    FROM respostas r
    JOIN config_bimestres cb ON cb.bimestre = v_periodo.bimestre
        AND cb.ano_letivo = 2025
        AND cb.tipo = 'regular'
    WHERE r.usuario_id = p_usuario_id
      AND r.componente = p_componente
      AND r.modo = 'estudo'
      AND r.criado_em::DATE BETWEEN cb.data_inicio AND cb.data_fim;

    -- Conta dias ativos no período
    SELECT COUNT(DISTINCT r.criado_em::DATE) INTO v_dias_ativos
    FROM respostas r
    JOIN config_bimestres cb ON cb.bimestre = v_periodo.bimestre
        AND cb.ano_letivo = 2025
        AND cb.tipo = 'regular'
    WHERE r.usuario_id = p_usuario_id
      AND r.componente = p_componente
      AND r.modo = 'estudo'
      AND r.criado_em::DATE BETWEEN cb.data_inicio AND cb.data_fim;

    -- Conta questões da semana
    v_questoes_semana := contar_questoes_semana(p_usuario_id, p_componente);

    -- Calcula nota
    SELECT * INTO v_calculo
    FROM calcular_nota_regular(v_questoes_respondidas, v_periodo.meta_questoes, v_dias_ativos);

    -- Busca ou cria registro de nota
    SELECT * INTO v_nota
    FROM notas_2025
    WHERE usuario_id = p_usuario_id
      AND componente = p_componente
      AND bimestre = v_periodo.bimestre
      AND ano_letivo = 2025;

    IF v_nota IS NULL THEN
        -- Cria novo registro
        INSERT INTO notas_2025 (
            usuario_id, componente, ano_letivo, bimestre,
            questoes_respondidas, meta_questoes, dias_ativos,
            nota_base, bonus_frequencia, nota_regular, nota_final,
            status
        ) VALUES (
            p_usuario_id, p_componente, 2025, v_periodo.bimestre,
            v_questoes_respondidas, v_periodo.meta_questoes, v_dias_ativos,
            v_calculo.nota_base, v_calculo.bonus_frequencia, v_calculo.nota_final, v_calculo.nota_final,
            'em_andamento'
        )
        RETURNING * INTO v_nota;
    ELSE
        -- Atualiza registro existente
        UPDATE notas_2025 SET
            questoes_respondidas = v_questoes_respondidas,
            dias_ativos = v_dias_ativos,
            nota_base = v_calculo.nota_base,
            bonus_frequencia = v_calculo.bonus_frequencia,
            nota_regular = v_calculo.nota_final,
            nota_final = CASE
                WHEN em_recuperacao THEN nota_recuperacao
                ELSE v_calculo.nota_final
            END,
            atualizado_em = NOW()
        WHERE id = v_nota.id
        RETURNING * INTO v_nota;
    END IF;

    RETURN QUERY SELECT
        v_nota.bimestre,
        v_nota.questoes_respondidas,
        v_nota.meta_questoes,
        v_nota.dias_ativos,
        v_nota.nota_base,
        v_nota.bonus_frequencia,
        v_nota.nota_regular,
        v_nota.em_recuperacao,
        v_nota.questoes_pendentes,
        v_nota.questoes_recuperacao,
        v_nota.nota_recuperacao,
        v_nota.status,
        v_questoes_semana,
        CASE WHEN v_periodo.tipo = 'recuperacao' OR v_nota.em_recuperacao THEN NULL ELSE 15 END;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER: incrementar_questoes_semana
-- Incrementa contador de questões da semana ao registrar resposta
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION incrementar_questoes_semana()
RETURNS TRIGGER AS $$
DECLARE
    v_segunda DATE;
BEGIN
    -- Só conta questões do modo estudo
    IF NEW.modo != 'estudo' THEN
        RETURN NEW;
    END IF;

    v_segunda := get_segunda_feira_semana();

    INSERT INTO controle_semanal (usuario_id, componente, ano_letivo, semana_inicio, questoes_respondidas)
    VALUES (NEW.usuario_id, NEW.componente, 2025, v_segunda, 1)
    ON CONFLICT (usuario_id, componente, ano_letivo, semana_inicio)
    DO UPDATE SET
        questoes_respondidas = controle_semanal.questoes_respondidas + 1,
        atualizado_em = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remove trigger se existir e recria
DROP TRIGGER IF EXISTS trigger_incrementar_questoes_semana ON respostas;
CREATE TRIGGER trigger_incrementar_questoes_semana
    AFTER INSERT ON respostas
    FOR EACH ROW
    EXECUTE FUNCTION incrementar_questoes_semana();

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: verificar_fim_bimestre()
-- Verifica se o estudante precisa de recuperação e configura
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION verificar_fim_bimestre(
    p_usuario_id UUID,
    p_componente VARCHAR(15),
    p_bimestre INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_nota RECORD;
BEGIN
    SELECT * INTO v_nota
    FROM notas_2025
    WHERE usuario_id = p_usuario_id
      AND componente = p_componente
      AND bimestre = p_bimestre
      AND ano_letivo = 2025;

    IF v_nota IS NULL THEN
        RETURN;
    END IF;

    -- Se nota < 6.0, vai para recuperação
    IF v_nota.nota_regular < 6.0 THEN
        UPDATE notas_2025 SET
            em_recuperacao = TRUE,
            questoes_pendentes = meta_questoes - questoes_respondidas,
            status = 'recuperacao'
        WHERE id = v_nota.id;
    ELSE
        UPDATE notas_2025 SET
            status = 'aprovado'
        WHERE id = v_nota.id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEW: boletim_completo
-- Visualização completa do boletim do estudante
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW boletim_completo AS
SELECT
    n.usuario_id,
    u.nome as nome_estudante,
    u.turma,
    n.componente,
    n.ano_letivo,
    n.bimestre,
    n.questoes_respondidas,
    n.meta_questoes,
    ROUND((n.questoes_respondidas::DECIMAL / GREATEST(n.meta_questoes, 1)) * 100, 1) as percentual_questoes,
    n.dias_ativos,
    n.nota_base,
    n.bonus_frequencia,
    n.nota_regular,
    n.em_recuperacao,
    n.questoes_pendentes,
    n.questoes_recuperacao,
    n.nota_recuperacao,
    n.nota_final,
    n.status,
    cb.data_inicio,
    cb.data_fim,
    (cb.data_fim - CURRENT_DATE) as dias_restantes
FROM notas_2025 n
JOIN usuarios u ON u.id = n.usuario_id
LEFT JOIN config_bimestres cb ON cb.bimestre = n.bimestre
    AND cb.ano_letivo = n.ano_letivo
    AND cb.tipo = CASE WHEN n.em_recuperacao THEN 'recuperacao' ELSE 'regular' END;

-- ═══════════════════════════════════════════════════════════════════════════
-- HABILITAR RLS
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE config_bimestres ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_2025 ENABLE ROW LEVEL SECURITY;
ALTER TABLE controle_semanal ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (drop primeiro para evitar erro de duplicidade)
DROP POLICY IF EXISTS "Service role full access" ON config_bimestres;
DROP POLICY IF EXISTS "Service role full access" ON notas_2025;
DROP POLICY IF EXISTS "Service role full access" ON controle_semanal;

CREATE POLICY "Service role full access" ON config_bimestres FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON notas_2025 FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON controle_semanal FOR ALL TO service_role USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- COMENTÁRIOS
-- ═══════════════════════════════════════════════════════════════════════════
COMMENT ON TABLE config_bimestres IS 'Configuração dos períodos letivos 2025';
COMMENT ON TABLE notas_2025 IS 'Sistema de notas baseado em participação + bônus de frequência';
COMMENT ON TABLE controle_semanal IS 'Controle do limite semanal de 15 questões';
COMMENT ON FUNCTION calcular_bonus_frequencia IS '+0.5 por cada 5 dias ativos, máximo +2.0';
COMMENT ON FUNCTION pode_responder IS 'Verifica limite semanal (15 questões) - liberado na recuperação';
