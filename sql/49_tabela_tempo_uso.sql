-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  TABELA DE TEMPO DE USO EFETIVO                                             ║
-- ║  Rastreia tempo gasto em diferentes atividades do app                        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Criar tabela de tempo de uso
CREATE TABLE IF NOT EXISTS tempo_uso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(20) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    atividade VARCHAR(50) NOT NULL, -- 'teoria', 'flashcards', 'mapas', 'tutor', 'menu', 'notas', etc.
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    segundos_total INTEGER NOT NULL DEFAULT 0,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Índice único para agregação por dia
    UNIQUE(usuario_id, componente, atividade, data)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tempo_uso_usuario ON tempo_uso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tempo_uso_componente ON tempo_uso(componente);
CREATE INDEX IF NOT EXISTS idx_tempo_uso_data ON tempo_uso(data);
CREATE INDEX IF NOT EXISTS idx_tempo_uso_busca ON tempo_uso(usuario_id, componente, data);

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION atualizar_tempo_uso_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tempo_uso_timestamp ON tempo_uso;
CREATE TRIGGER trigger_tempo_uso_timestamp
    BEFORE UPDATE ON tempo_uso
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_tempo_uso_timestamp();

-- RLS (Row Level Security)
ALTER TABLE tempo_uso ENABLE ROW LEVEL SECURITY;

-- Política: usuário só vê seus próprios registros
DROP POLICY IF EXISTS tempo_uso_select_own ON tempo_uso;
CREATE POLICY tempo_uso_select_own ON tempo_uso
    FOR SELECT USING (usuario_id = auth.uid());

-- Política: usuário pode inserir seus próprios registros
DROP POLICY IF EXISTS tempo_uso_insert_own ON tempo_uso;
CREATE POLICY tempo_uso_insert_own ON tempo_uso
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- Política: usuário pode atualizar seus próprios registros
DROP POLICY IF EXISTS tempo_uso_update_own ON tempo_uso;
CREATE POLICY tempo_uso_update_own ON tempo_uso
    FOR UPDATE USING (usuario_id = auth.uid());

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FUNÇÃO PARA CALCULAR TEMPO TOTAL DE USO                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION calcular_tempo_uso_total(
    p_usuario_id UUID,
    p_componente VARCHAR(20),
    p_data_inicio DATE,
    p_data_fim DATE
)
RETURNS TABLE (
    tempo_atividades_segundos BIGINT,
    tempo_questoes_segundos BIGINT,
    tempo_total_segundos BIGINT,
    tempo_total_horas NUMERIC,
    pontos_tempo NUMERIC
) AS $$
DECLARE
    v_tempo_atividades BIGINT;
    v_tempo_questoes BIGINT;
    v_tempo_total BIGINT;
BEGIN
    -- Tempo de atividades (teoria, flashcards, mapas, tutor, etc.)
    SELECT COALESCE(SUM(segundos_total), 0)
    INTO v_tempo_atividades
    FROM tempo_uso
    WHERE usuario_id = p_usuario_id
      AND componente = p_componente
      AND data >= p_data_inicio
      AND data <= p_data_fim;

    -- Tempo das questões respondidas
    SELECT COALESCE(SUM(tempo_segundos), 0)
    INTO v_tempo_questoes
    FROM respostas
    WHERE usuario_id = p_usuario_id
      AND componente = p_componente
      AND criado_em >= p_data_inicio
      AND criado_em <= p_data_fim + INTERVAL '1 day';

    v_tempo_total := v_tempo_atividades + v_tempo_questoes;

    RETURN QUERY SELECT
        v_tempo_atividades,
        v_tempo_questoes,
        v_tempo_total,
        ROUND(v_tempo_total / 3600.0, 2),
        CASE
            WHEN v_tempo_total >= 5 * 3600 THEN 4.0
            WHEN v_tempo_total >= 4 * 3600 THEN 3.0
            WHEN v_tempo_total >= 3 * 3600 THEN 2.0
            WHEN v_tempo_total >= 2 * 3600 THEN 1.0
            ELSE 0.0
        END;
END;
$$ LANGUAGE plpgsql;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  EXEMPLO DE USO                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
--
-- SELECT * FROM calcular_tempo_uso_total(
--     'uuid-do-usuario',
--     'fisica',
--     '2025-01-01',
--     '2026-04-15'
-- );
--
-- Resultado:
-- | tempo_atividades_segundos | tempo_questoes_segundos | tempo_total_segundos | tempo_total_horas | pontos_tempo |
-- |---------------------------|-------------------------|----------------------|-------------------|--------------|
-- | 3600                      | 7200                    | 10800                | 3.00              | 2.0          |
