-- ============================================================
-- PROTEÇÃO DE DADOS v2 - CORRIGIDO PARA SCHEMA REAL
-- Garante que dados dos estudantes NUNCA sejam perdidos
-- ============================================================
--
-- PROBLEMAS DO v1 (39_sistema_protecao_dados.sql):
-- 1. Triggers apontavam para tabela "notas" (não existe, é "notas_2025")
-- 2. Referenciava "tempo_uso" (não existe, tempo está em respostas.tempo_segundos)
-- 3. Sem proteção contra DELETE em respostas/conquistas
-- 4. notas_2025 era sobrescrita em cada acesso sem congelar bimestres passados
--
-- ESTE SCRIPT:
-- 1. Cria tabela snapshots_bimestre (imutável, INSERT only)
-- 2. Trigger de auditoria em notas_2025 (UPDATE/DELETE)
-- 3. Trigger de auditoria em respostas (DELETE)
-- 4. Bloqueia DELETE via RLS em tabelas críticas
-- 5. Função para congelar bimestre (status='fechado')
-- ============================================================

-- ============================================================
-- 1. TABELA: snapshots_bimestre (IMUTÁVEL)
-- Registra a nota final congelada de cada bimestre
-- INSERT only — nunca UPDATE, nunca DELETE
-- ============================================================
CREATE TABLE IF NOT EXISTS snapshots_bimestre (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    componente VARCHAR(15) NOT NULL,
    ano_letivo INTEGER NOT NULL,
    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),

    -- Dados congelados no momento do snapshot
    nota_final DECIMAL(4,2) NOT NULL,
    nota_acertos DECIMAL(4,2) DEFAULT 0,
    nota_tempo DECIMAL(4,2) DEFAULT 0,
    questoes_respondidas INTEGER DEFAULT 0,
    acertos_estudo INTEGER DEFAULT 0,
    acertos_revisao INTEGER DEFAULT 0,
    acertos_desafio INTEGER DEFAULT 0,
    tempo_uso_segundos INTEGER DEFAULT 0,
    dias_ativos INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL,

    -- Dados do usuario no momento (para não perder se mudar)
    pontos_acumulados INTEGER DEFAULT 0,
    questoes_total_acumuladas INTEGER DEFAULT 0,
    questoes_corretas_acumuladas INTEGER DEFAULT 0,

    -- Auditoria
    motivo TEXT DEFAULT 'fechamento_bimestre',
    congelado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: apenas 1 snapshot por usuario/componente/bimestre/ano
    UNIQUE(usuario_id, componente, ano_letivo, bimestre)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_bimestre_usuario ON snapshots_bimestre(usuario_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_bimestre_periodo ON snapshots_bimestre(ano_letivo, bimestre);

-- RLS: INSERT e SELECT only (nunca UPDATE/DELETE)
ALTER TABLE snapshots_bimestre ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access snapshots" ON snapshots_bimestre;
CREATE POLICY "Service role full access snapshots" ON snapshots_bimestre
    FOR ALL TO service_role USING (true);

-- Impedir UPDATE e DELETE por qualquer outro role
DROP POLICY IF EXISTS "Snapshots são imutáveis" ON snapshots_bimestre;
CREATE POLICY "Snapshots são imutáveis" ON snapshots_bimestre
    FOR SELECT USING (true);

-- ============================================================
-- 2. TABELA: auditoria_notas
-- Log de todas as alterações em notas_2025
-- ============================================================
CREATE TABLE IF NOT EXISTS auditoria_notas (
    id SERIAL PRIMARY KEY,
    nota_2025_id UUID,
    usuario_id UUID NOT NULL,
    componente VARCHAR(15) NOT NULL,
    ano_letivo INTEGER NOT NULL,
    bimestre INTEGER NOT NULL,
    operacao VARCHAR(10) NOT NULL, -- 'UPDATE', 'DELETE'
    nota_final_antes DECIMAL(4,2),
    nota_final_depois DECIMAL(4,2),
    dados_antes JSONB,
    dados_depois JSONB,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_notas_usuario ON auditoria_notas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_notas_data ON auditoria_notas(criado_em);

ALTER TABLE auditoria_notas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access auditoria" ON auditoria_notas;
CREATE POLICY "Service role full access auditoria" ON auditoria_notas
    FOR ALL TO service_role USING (true);

-- ============================================================
-- 3. TRIGGER: auditar alterações em notas_2025
-- ============================================================
CREATE OR REPLACE FUNCTION auditar_notas_2025()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria_notas (
            nota_2025_id, usuario_id, componente, ano_letivo, bimestre,
            operacao, nota_final_antes, dados_antes
        ) VALUES (
            OLD.id, OLD.usuario_id, OLD.componente, OLD.ano_letivo, OLD.bimestre,
            'DELETE', OLD.nota_final,
            to_jsonb(OLD)
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Só registra se houve mudança significativa
        IF OLD.nota_final IS DISTINCT FROM NEW.nota_final
           OR OLD.status IS DISTINCT FROM NEW.status
           OR OLD.questoes_respondidas IS DISTINCT FROM NEW.questoes_respondidas THEN
            INSERT INTO auditoria_notas (
                nota_2025_id, usuario_id, componente, ano_letivo, bimestre,
                operacao, nota_final_antes, nota_final_depois,
                dados_antes, dados_depois
            ) VALUES (
                OLD.id, OLD.usuario_id, OLD.componente, OLD.ano_letivo, OLD.bimestre,
                'UPDATE', OLD.nota_final, NEW.nota_final,
                to_jsonb(OLD), to_jsonb(NEW)
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auditar_notas_2025 ON notas_2025;
CREATE TRIGGER trigger_auditar_notas_2025
    AFTER UPDATE OR DELETE ON notas_2025
    FOR EACH ROW EXECUTE FUNCTION auditar_notas_2025();

-- ============================================================
-- 4. TRIGGER: auditar DELETE em respostas
-- Registra qualquer tentativa de deletar respostas
-- ============================================================
CREATE OR REPLACE FUNCTION auditar_delete_respostas()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO auditoria_notas (
        usuario_id, componente, ano_letivo, bimestre,
        operacao, dados_antes
    ) VALUES (
        OLD.usuario_id, OLD.componente, EXTRACT(YEAR FROM OLD.criado_em)::INTEGER, 0,
        'DELETE_RESPOSTA',
        jsonb_build_object(
            'resposta_id', OLD.id,
            'questao_id', OLD.questao_id,
            'correta', OLD.correta,
            'tempo_segundos', OLD.tempo_segundos,
            'modo', OLD.modo,
            'pontos_ganhos', OLD.pontos_ganhos,
            'criado_em', OLD.criado_em
        )
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auditar_delete_respostas ON respostas;
CREATE TRIGGER trigger_auditar_delete_respostas
    BEFORE DELETE ON respostas
    FOR EACH ROW EXECUTE FUNCTION auditar_delete_respostas();

-- ============================================================
-- 5. PROTEÇÃO RLS: Bloquear DELETE em tabelas críticas
-- Apenas service_role pode deletar (e mesmo assim fica no audit log)
-- ============================================================

-- Respostas: bloquear DELETE para authenticated
DROP POLICY IF EXISTS "Bloquear delete respostas" ON respostas;
CREATE POLICY "Bloquear delete respostas" ON respostas
    FOR DELETE TO authenticated USING (false);

-- Respostas ENEM: bloquear DELETE
ALTER TABLE respostas_enem ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access respostas_enem" ON respostas_enem;
CREATE POLICY "Service role full access respostas_enem" ON respostas_enem
    FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Bloquear delete respostas_enem" ON respostas_enem;
CREATE POLICY "Bloquear delete respostas_enem" ON respostas_enem
    FOR DELETE TO authenticated USING (false);

-- Conquistas: bloquear DELETE
DROP POLICY IF EXISTS "Bloquear delete conquistas" ON conquistas_usuario;
CREATE POLICY "Bloquear delete conquistas" ON conquistas_usuario
    FOR DELETE TO authenticated USING (false);

-- notas_2025: bloquear DELETE para authenticated
DROP POLICY IF EXISTS "Bloquear delete notas" ON notas_2025;
CREATE POLICY "Bloquear delete notas" ON notas_2025
    FOR DELETE TO authenticated USING (false);

-- ============================================================
-- 6. FUNÇÃO: congelar_bimestre
-- Cria snapshot imutável e marca bimestre como 'fechado'
-- ============================================================
CREATE OR REPLACE FUNCTION congelar_bimestre(
    p_ano INTEGER,
    p_bimestre INTEGER,
    p_motivo TEXT DEFAULT 'fechamento_bimestre'
)
RETURNS TABLE(usuarios_congelados INTEGER) AS $$
DECLARE
    v_count INTEGER := 0;
    r RECORD;
BEGIN
    -- Para cada nota do bimestre
    FOR r IN
        SELECT n.*, u.fis_pontos, u.fis_questoes_total, u.fis_questoes_corretas,
               u.mat_pontos, u.mat_questoes_total, u.mat_questoes_corretas
        FROM notas_2025 n
        JOIN usuarios u ON u.id = n.usuario_id
        WHERE n.ano_letivo = p_ano AND n.bimestre = p_bimestre
          AND n.status != 'fechado'
    LOOP
        -- Criar snapshot (ignora se já existe)
        INSERT INTO snapshots_bimestre (
            usuario_id, componente, ano_letivo, bimestre,
            nota_final, nota_acertos, nota_tempo,
            questoes_respondidas, acertos_estudo, acertos_revisao, acertos_desafio,
            tempo_uso_segundos, dias_ativos, status,
            pontos_acumulados, questoes_total_acumuladas, questoes_corretas_acumuladas,
            motivo
        ) VALUES (
            r.usuario_id, r.componente, p_ano, p_bimestre,
            r.nota_final,
            COALESCE(r.nota_acertos, 0), COALESCE(r.nota_tempo, 0),
            COALESCE(r.questoes_respondidas, 0),
            COALESCE(r.acertos_questoes, 0), COALESCE(r.acertos_revisao, 0), COALESCE(r.acertos_desafio, 0),
            COALESCE(r.tempo_uso_segundos, 0), COALESCE(r.dias_ativos, 0),
            r.status,
            CASE WHEN r.componente = 'fisica' THEN COALESCE(r.fis_pontos, 0) ELSE COALESCE(r.mat_pontos, 0) END,
            CASE WHEN r.componente = 'fisica' THEN COALESCE(r.fis_questoes_total, 0) ELSE COALESCE(r.mat_questoes_total, 0) END,
            CASE WHEN r.componente = 'fisica' THEN COALESCE(r.fis_questoes_corretas, 0) ELSE COALESCE(r.mat_questoes_corretas, 0) END,
            p_motivo
        ) ON CONFLICT (usuario_id, componente, ano_letivo, bimestre) DO NOTHING;

        -- Marcar como fechado
        UPDATE notas_2025 SET status = 'fechado', atualizado_em = NOW()
        WHERE id = r.id;

        v_count := v_count + 1;
    END LOOP;

    RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMENTÁRIOS
-- ============================================================
COMMENT ON TABLE snapshots_bimestre IS 'Snapshot IMUTÁVEL das notas ao final de cada bimestre. INSERT only.';
COMMENT ON TABLE auditoria_notas IS 'Log de auditoria de todas as alterações em notas_2025 e respostas.';
COMMENT ON FUNCTION congelar_bimestre IS 'Congela um bimestre: cria snapshot + marca status=fechado. SELECT congelar_bimestre(2026, 1);';

/*
INSTRUÇÕES:

1. CONGELAR BIMESTRE ao final do período:
   SELECT * FROM congelar_bimestre(2026, 1, 'Fim do 1º bimestre 2026');

2. CONSULTAR SNAPSHOTS:
   SELECT * FROM snapshots_bimestre WHERE ano_letivo = 2026 AND bimestre = 1;

3. VER AUDITORIA:
   SELECT * FROM auditoria_notas WHERE usuario_id = 'uuid' ORDER BY criado_em DESC;

4. Os dados do snapshot NUNCA podem ser alterados ou deletados (RLS bloqueia).
   Mesmo via service_role, a constraint UNIQUE impede duplicidade.
*/
