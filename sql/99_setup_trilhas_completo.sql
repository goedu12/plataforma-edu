-- ============================================================================
-- 99_SETUP_TRILHAS_COMPLETO.SQL
-- SQL COMPLETO PARA SETUP DE TRILHAS (EF + EM)
--
-- Execute este arquivo UMA VEZ no SQL Editor do Supabase
-- Suporta:
--   - EF (6o-9o): Matematica com 4 alternativas (A-D)
--   - EM (1o-3o): Fisica com 5 alternativas (A-E)
--
-- Criado em: 2025-01-15
-- Autor: Sistema Claude - Analista Master Senior
-- ============================================================================

-- ============================================================================
-- 1. CRIAR TABELAS
-- ============================================================================

-- Tabela de trilhas disponiveis
CREATE TABLE IF NOT EXISTS trilhas (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    icone VARCHAR(10) NOT NULL,
    cor VARCHAR(7) NOT NULL,
    descricao TEXT NOT NULL,
    descricao_curta VARCHAR(100),
    config JSONB NOT NULL DEFAULT '{}',
    ordem INTEGER DEFAULT 1,
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de questoes (EF + EM)
CREATE TABLE IF NOT EXISTS questoes_trilha (
    id BIGSERIAL PRIMARY KEY,
    serie VARCHAR(10) NOT NULL CHECK (serie IN ('6EF', '7EF', '8EF', '9EF', '1EM', '2EM', '3EM')),
    semana INTEGER NOT NULL CHECK (semana BETWEEN 1 AND 40),
    ano_letivo INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    ordem INTEGER NOT NULL CHECK (ordem BETWEEN 1 AND 10),
    tema VARCHAR(100) NOT NULL,
    subtema TEXT NOT NULL,
    tipo_questao VARCHAR(50) NOT NULL DEFAULT 'conceitual',
    contexto_cotidiano VARCHAR(50) NOT NULL DEFAULT 'todos',
    enunciado TEXT NOT NULL,
    alternativas JSONB NOT NULL,
    resposta_correta VARCHAR(1) NOT NULL CHECK (resposta_correta IN ('A','B','C','D','E')),
    dica TEXT NOT NULL,
    feedback JSONB NOT NULL DEFAULT '{}',
    dificuldade VARCHAR(20) NOT NULL DEFAULT 'medio',
    is_desafio BOOLEAN DEFAULT FALSE,
    -- Novas colunas para EF
    componente VARCHAR(20) DEFAULT 'fisica' CHECK (componente IN ('fisica', 'matematica')),
    nivel_ensino VARCHAR(5) DEFAULT 'EM' CHECK (nivel_ensino IN ('EF', 'EM')),
    num_alternativas INTEGER DEFAULT 5 CHECK (num_alternativas IN (4, 5)),
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(serie, semana, ano_letivo, ordem)
);

-- Tabela de trilha do usuario
CREATE TABLE IF NOT EXISTS usuario_trilha (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    trilha_id VARCHAR(50) NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    serie VARCHAR(10) NOT NULL CHECK (serie IN ('6EF', '7EF', '8EF', '9EF', '1EM', '2EM', '3EM')),
    componente VARCHAR(20) DEFAULT 'fisica' CHECK (componente IN ('fisica', 'matematica')),
    ativa BOOLEAN DEFAULT TRUE,
    iniciada_em TIMESTAMPTZ DEFAULT NOW(),
    pausada_em TIMESTAMPTZ,
    semana_atual INTEGER DEFAULT 1,
    questoes_total INTEGER DEFAULT 0,
    questoes_corretas INTEGER DEFAULT 0,
    pontos_trilha INTEGER DEFAULT 0,
    ultimo_acesso TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, trilha_id, serie)
);

-- Tabela de progresso semanal
CREATE TABLE IF NOT EXISTS progresso_semanal (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    trilha_id VARCHAR(50) NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    serie VARCHAR(10) NOT NULL,
    componente VARCHAR(20) DEFAULT 'fisica' CHECK (componente IN ('fisica', 'matematica')),
    semana INTEGER NOT NULL CHECK (semana BETWEEN 1 AND 40),
    ano_letivo INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    questoes_total INTEGER DEFAULT 5,
    questoes_respondidas INTEGER DEFAULT 0,
    questoes_corretas INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'bloqueada',
    tempo_total_segundos INTEGER DEFAULT 0,
    pontos_semana INTEGER DEFAULT 0,
    desbloqueada_em TIMESTAMPTZ,
    iniciada_em TIMESTAMPTZ,
    concluida_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, trilha_id, serie, semana, ano_letivo)
);

-- Tabela de respostas
CREATE TABLE IF NOT EXISTS respostas_trilha (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    questao_id BIGINT NOT NULL REFERENCES questoes_trilha(id) ON DELETE CASCADE,
    trilha_id VARCHAR(50) REFERENCES trilhas(id) ON DELETE SET NULL,
    resposta_dada VARCHAR(1) NOT NULL CHECK (resposta_dada IN ('A','B','C','D','E')),
    correta BOOLEAN NOT NULL,
    tempo_segundos INTEGER DEFAULT 0,
    usou_dica BOOLEAN DEFAULT FALSE,
    pontos_ganhos INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, questao_id)
);

-- ============================================================================
-- 2. TRIGGER PARA AUTO-DEFINIR NIVEL_ENSINO E NUM_ALTERNATIVAS
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_definir_nivel_ensino()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.serie IN ('6EF', '7EF', '8EF', '9EF') THEN
        NEW.nivel_ensino := 'EF';
        NEW.num_alternativas := 4;
        NEW.componente := COALESCE(NEW.componente, 'matematica');
    ELSIF NEW.serie IN ('1EM', '2EM', '3EM') THEN
        NEW.nivel_ensino := 'EM';
        NEW.num_alternativas := 5;
        NEW.componente := COALESCE(NEW.componente, 'fisica');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_auto_nivel_ensino ON questoes_trilha;
CREATE TRIGGER tr_auto_nivel_ensino
    BEFORE INSERT ON questoes_trilha
    FOR EACH ROW EXECUTE FUNCTION auto_definir_nivel_ensino();

-- Trigger para validar resposta vs num_alternativas
CREATE OR REPLACE FUNCTION validar_resposta_alternativas()
RETURNS TRIGGER AS $$
BEGIN
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
-- 3. INSERIR TRILHA INICIAL
-- ============================================================================

INSERT INTO trilhas (id, nome, icone, cor, descricao, descricao_curta, config, ordem)
VALUES (
    'passar_ano',
    'Passar de Ano',
    '🎓',
    '#22c55e',
    'Trilha focada em dominar o conteúdo do ano letivo. 5 questões por semana, avançando progressivamente pelos temas.',
    'Domine o conteúdo do ano',
    '{"questoes_por_semana": 5, "total_semanas": 40, "acerto_avancar": 60}',
    1
) ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao;

-- ============================================================================
-- 4. FUNCAO: LISTAR TRILHAS
-- ============================================================================

CREATE OR REPLACE FUNCTION listar_trilhas(
    p_usuario_id UUID DEFAULT NULL,
    p_serie VARCHAR(10) DEFAULT NULL
)
RETURNS TABLE (
    trilha_id VARCHAR(50),
    nome VARCHAR(100),
    icone VARCHAR(10),
    cor VARCHAR(7),
    descricao TEXT,
    descricao_curta VARCHAR(100),
    config JSONB,
    ordem INTEGER,
    usuario_ativa BOOLEAN,
    usuario_semana INTEGER,
    usuario_pontos INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id AS trilha_id,
        t.nome,
        t.icone,
        t.cor,
        t.descricao,
        t.descricao_curta,
        t.config,
        t.ordem,
        COALESCE(ut.ativa, FALSE) AS usuario_ativa,
        ut.semana_atual AS usuario_semana,
        ut.pontos_trilha AS usuario_pontos
    FROM trilhas t
    LEFT JOIN usuario_trilha ut ON (
        ut.trilha_id = t.id
        AND ut.usuario_id = p_usuario_id
        AND (p_serie IS NULL OR ut.serie = p_serie)
    )
    WHERE t.ativa = TRUE
    ORDER BY t.ordem;
END;
$$;

-- ============================================================================
-- 5. FUNCAO: INICIAR TRILHA (SUPORTA EF + EM)
-- ============================================================================

CREATE OR REPLACE FUNCTION iniciar_trilha(
    p_usuario_id UUID,
    p_trilha_id VARCHAR(50),
    p_serie VARCHAR(10),
    p_data_prova DATE DEFAULT NULL,
    p_temas_prova TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_trilha trilhas%ROWTYPE;
    v_componente VARCHAR(20);
BEGIN
    SELECT * INTO v_trilha FROM trilhas WHERE id = p_trilha_id AND ativa = TRUE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('sucesso', FALSE, 'erro', 'Trilha nao encontrada');
    END IF;

    -- Validar serie
    IF p_serie NOT IN ('6EF', '7EF', '8EF', '9EF', '1EM', '2EM', '3EM') THEN
        RETURN jsonb_build_object('sucesso', FALSE, 'erro', 'Serie invalida');
    END IF;

    -- Determinar componente
    IF p_serie IN ('6EF', '7EF', '8EF', '9EF') THEN
        v_componente := 'matematica';
    ELSE
        v_componente := 'fisica';
    END IF;

    -- Pausar trilhas anteriores
    UPDATE usuario_trilha SET ativa = FALSE, pausada_em = NOW()
    WHERE usuario_id = p_usuario_id AND serie = p_serie AND ativa = TRUE;

    -- Criar nova trilha
    INSERT INTO usuario_trilha (usuario_id, trilha_id, serie, componente, ativa, semana_atual)
    VALUES (p_usuario_id, p_trilha_id, p_serie, v_componente, TRUE, 1)
    ON CONFLICT (usuario_id, trilha_id, serie)
    DO UPDATE SET ativa = TRUE, pausada_em = NULL, componente = v_componente, ultimo_acesso = NOW();

    -- Desbloquear semana 1
    INSERT INTO progresso_semanal (usuario_id, trilha_id, serie, componente, semana, status, desbloqueada_em)
    VALUES (p_usuario_id, p_trilha_id, p_serie, v_componente, 1, 'disponivel', NOW())
    ON CONFLICT (usuario_id, trilha_id, serie, semana, ano_letivo) DO NOTHING;

    RETURN jsonb_build_object(
        'sucesso', TRUE,
        'trilha_id', v_trilha.id,
        'trilha_nome', v_trilha.nome,
        'componente', v_componente,
        'mensagem', 'Trilha iniciada!'
    );
END;
$$;

-- ============================================================================
-- 6. FUNCAO: BUSCAR QUESTOES DA SEMANA (COM NUM_ALTERNATIVAS)
-- ============================================================================

CREATE OR REPLACE FUNCTION buscar_questoes_semana_trilha(
    p_usuario_id UUID,
    p_serie VARCHAR(10),
    p_semana INTEGER DEFAULT NULL
)
RETURNS TABLE (
    questao_id BIGINT,
    ordem INTEGER,
    tipo_questao VARCHAR(50),
    enunciado TEXT,
    alternativas JSONB,
    dica TEXT,
    dificuldade VARCHAR(20),
    tema VARCHAR(100),
    subtema TEXT,
    contexto VARCHAR(50),
    is_desafio BOOLEAN,
    ja_respondida BOOLEAN,
    resposta_usuario VARCHAR(1),
    acertou BOOLEAN,
    tempo_resposta INTEGER,
    usou_dica BOOLEAN,
    num_alternativas INTEGER,
    nivel_ensino VARCHAR(5),
    componente VARCHAR(20)
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_trilha_id VARCHAR(50);
    v_semana_atual INTEGER;
    v_ano_letivo INTEGER;
BEGIN
    v_ano_letivo := EXTRACT(YEAR FROM NOW())::INTEGER;

    SELECT ut.trilha_id, ut.semana_atual INTO v_trilha_id, v_semana_atual
    FROM usuario_trilha ut
    WHERE ut.usuario_id = p_usuario_id AND ut.serie = p_serie AND ut.ativa = TRUE
    LIMIT 1;

    IF v_trilha_id IS NULL THEN RETURN; END IF;
    IF p_semana IS NOT NULL THEN v_semana_atual := p_semana; END IF;

    -- Atualizar ultimo acesso
    UPDATE usuario_trilha SET ultimo_acesso = NOW()
    WHERE usuario_id = p_usuario_id AND trilha_id = v_trilha_id AND serie = p_serie;

    RETURN QUERY
    SELECT
        q.id AS questao_id,
        q.ordem,
        q.tipo_questao,
        q.enunciado,
        q.alternativas,
        CASE WHEN rt.id IS NULL THEN q.dica ELSE NULL::TEXT END AS dica,
        q.dificuldade,
        q.tema,
        q.subtema,
        q.contexto_cotidiano AS contexto,
        q.is_desafio,
        (rt.id IS NOT NULL) AS ja_respondida,
        rt.resposta_dada AS resposta_usuario,
        rt.correta AS acertou,
        rt.tempo_segundos AS tempo_resposta,
        COALESCE(rt.usou_dica, FALSE) AS usou_dica,
        COALESCE(q.num_alternativas, 5) AS num_alternativas,
        COALESCE(q.nivel_ensino, 'EM') AS nivel_ensino,
        COALESCE(q.componente, 'fisica') AS componente
    FROM questoes_trilha q
    LEFT JOIN respostas_trilha rt ON (rt.questao_id = q.id AND rt.usuario_id = p_usuario_id)
    WHERE q.serie = p_serie AND q.semana = v_semana_atual AND q.ano_letivo = v_ano_letivo AND q.ativa = TRUE
    ORDER BY q.is_desafio ASC, q.ordem ASC;
END;
$$;

-- ============================================================================
-- 7. FUNCAO: RESPONDER QUESTAO (VALIDA NUM_ALTERNATIVAS)
-- ============================================================================

CREATE OR REPLACE FUNCTION responder_questao_trilha(
    p_usuario_id UUID,
    p_questao_id BIGINT,
    p_resposta VARCHAR(1),
    p_tempo_segundos INTEGER DEFAULT 0,
    p_usou_dica BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_questao questoes_trilha%ROWTYPE;
    v_correta BOOLEAN;
    v_pontos INTEGER;
    v_trilha_id VARCHAR(50);
    v_num_alternativas INTEGER;
BEGIN
    SELECT * INTO v_questao FROM questoes_trilha WHERE id = p_questao_id AND ativa = TRUE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('sucesso', FALSE, 'erro', 'Questao nao encontrada');
    END IF;

    v_num_alternativas := COALESCE(v_questao.num_alternativas, 5);

    -- Validar resposta
    IF v_num_alternativas = 4 AND UPPER(p_resposta) NOT IN ('A', 'B', 'C', 'D') THEN
        RETURN jsonb_build_object('sucesso', FALSE, 'erro', 'Resposta invalida. Use A, B, C ou D');
    ELSIF v_num_alternativas = 5 AND UPPER(p_resposta) NOT IN ('A', 'B', 'C', 'D', 'E') THEN
        RETURN jsonb_build_object('sucesso', FALSE, 'erro', 'Resposta invalida. Use A, B, C, D ou E');
    END IF;

    IF EXISTS(SELECT 1 FROM respostas_trilha WHERE usuario_id = p_usuario_id AND questao_id = p_questao_id) THEN
        RETURN jsonb_build_object('sucesso', FALSE, 'erro', 'Voce ja respondeu esta questao');
    END IF;

    SELECT ut.trilha_id INTO v_trilha_id
    FROM usuario_trilha ut WHERE ut.usuario_id = p_usuario_id AND ut.serie = v_questao.serie AND ut.ativa = TRUE;

    v_correta := (UPPER(p_resposta) = UPPER(v_questao.resposta_correta));
    v_pontos := CASE WHEN v_correta AND NOT p_usou_dica THEN 10 WHEN v_correta THEN 5 ELSE 0 END;

    -- Bonus velocidade
    IF v_correta AND p_tempo_segundos > 0 AND p_tempo_segundos < 30 THEN
        v_pontos := v_pontos + 2;
    END IF;

    INSERT INTO respostas_trilha (usuario_id, questao_id, trilha_id, resposta_dada, correta, tempo_segundos, usou_dica, pontos_ganhos)
    VALUES (p_usuario_id, p_questao_id, v_trilha_id, UPPER(p_resposta), v_correta, p_tempo_segundos, p_usou_dica, v_pontos);

    UPDATE progresso_semanal
    SET questoes_respondidas = questoes_respondidas + 1,
        questoes_corretas = questoes_corretas + (CASE WHEN v_correta THEN 1 ELSE 0 END),
        tempo_total_segundos = tempo_total_segundos + p_tempo_segundos,
        pontos_semana = pontos_semana + v_pontos,
        status = CASE WHEN status = 'disponivel' THEN 'em_progresso' ELSE status END,
        iniciada_em = COALESCE(iniciada_em, NOW())
    WHERE usuario_id = p_usuario_id AND trilha_id = v_trilha_id AND serie = v_questao.serie AND semana = v_questao.semana;

    UPDATE usuario_trilha
    SET questoes_total = questoes_total + 1,
        questoes_corretas = questoes_corretas + (CASE WHEN v_correta THEN 1 ELSE 0 END),
        pontos_trilha = pontos_trilha + v_pontos,
        ultimo_acesso = NOW()
    WHERE usuario_id = p_usuario_id AND trilha_id = v_trilha_id AND serie = v_questao.serie;

    RETURN jsonb_build_object(
        'sucesso', TRUE,
        'correta', v_correta,
        'resposta_certa', v_questao.resposta_correta,
        'resposta_dada', UPPER(p_resposta),
        'pontos', v_pontos,
        'feedback', v_questao.feedback,
        'num_alternativas', v_num_alternativas
    );
END;
$$;

-- ============================================================================
-- 8. FUNCAO: AVANCAR SEMANA
-- ============================================================================

CREATE OR REPLACE FUNCTION avancar_semana_trilha(
    p_usuario_id UUID,
    p_serie VARCHAR(10)
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_trilha_id VARCHAR(50);
    v_config JSONB;
    v_semana_atual INTEGER;
    v_corretas INTEGER;
    v_total INTEGER;
    v_taxa_acerto NUMERIC;
    v_acerto_necessario INTEGER;
    v_pode_avancar BOOLEAN;
    v_proxima_semana INTEGER;
    v_componente VARCHAR(20);
BEGIN
    SELECT ut.trilha_id, ut.semana_atual, ut.componente, t.config
    INTO v_trilha_id, v_semana_atual, v_componente, v_config
    FROM usuario_trilha ut
    JOIN trilhas t ON t.id = ut.trilha_id
    WHERE ut.usuario_id = p_usuario_id AND ut.serie = p_serie AND ut.ativa = TRUE;

    IF v_trilha_id IS NULL THEN
        RETURN jsonb_build_object('sucesso', FALSE, 'erro', 'Nenhuma trilha ativa');
    END IF;

    SELECT COUNT(*) FILTER (WHERE rt.correta = TRUE), COUNT(*)
    INTO v_corretas, v_total
    FROM respostas_trilha rt
    JOIN questoes_trilha q ON rt.questao_id = q.id
    WHERE rt.usuario_id = p_usuario_id AND q.serie = p_serie AND q.semana = v_semana_atual AND q.is_desafio = FALSE;

    v_taxa_acerto := CASE WHEN v_total > 0 THEN ROUND((v_corretas::NUMERIC / v_total) * 100, 1) ELSE 0 END;
    v_acerto_necessario := COALESCE((v_config->>'acerto_avancar')::INTEGER, 60);
    v_pode_avancar := v_taxa_acerto >= v_acerto_necessario;
    v_proxima_semana := v_semana_atual + 1;

    IF v_pode_avancar AND v_proxima_semana <= 40 THEN
        UPDATE progresso_semanal SET status = 'concluida', concluida_em = NOW()
        WHERE usuario_id = p_usuario_id AND trilha_id = v_trilha_id AND serie = p_serie AND semana = v_semana_atual;

        INSERT INTO progresso_semanal (usuario_id, trilha_id, serie, componente, semana, status, desbloqueada_em)
        VALUES (p_usuario_id, v_trilha_id, p_serie, v_componente, v_proxima_semana, 'disponivel', NOW())
        ON CONFLICT (usuario_id, trilha_id, serie, semana, ano_letivo) DO UPDATE SET status = 'disponivel';

        UPDATE usuario_trilha SET semana_atual = v_proxima_semana
        WHERE usuario_id = p_usuario_id AND trilha_id = v_trilha_id AND serie = p_serie;

        RETURN jsonb_build_object(
            'sucesso', TRUE,
            'mensagem', 'Parabens! Voce avancou para a semana ' || v_proxima_semana,
            'progresso', jsonb_build_object(
                'semana_atual', v_proxima_semana,
                'taxa_acerto', v_taxa_acerto,
                'avancou', TRUE
            )
        );
    ELSIF NOT v_pode_avancar THEN
        DELETE FROM respostas_trilha
        WHERE usuario_id = p_usuario_id AND questao_id IN (
            SELECT id FROM questoes_trilha WHERE serie = p_serie AND semana = v_semana_atual AND is_desafio = FALSE
        );

        UPDATE progresso_semanal
        SET questoes_respondidas = 0, questoes_corretas = 0, pontos_semana = 0, status = 'disponivel', iniciada_em = NULL
        WHERE usuario_id = p_usuario_id AND trilha_id = v_trilha_id AND serie = p_serie AND semana = v_semana_atual;

        RETURN jsonb_build_object(
            'sucesso', TRUE,
            'mensagem', 'Voce precisa de ' || v_acerto_necessario || '% para avancar. Tente novamente!',
            'progresso', jsonb_build_object(
                'semana_atual', v_semana_atual,
                'taxa_acerto', v_taxa_acerto,
                'avancou', FALSE,
                'semana_resetada', TRUE
            )
        );
    ELSE
        RETURN jsonb_build_object('sucesso', TRUE, 'mensagem', 'Trilha completa!', 'progresso', jsonb_build_object('avancou', FALSE));
    END IF;
END;
$$;

-- ============================================================================
-- 9. INDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_qt_serie ON questoes_trilha(serie);
CREATE INDEX IF NOT EXISTS idx_qt_semana ON questoes_trilha(semana);
CREATE INDEX IF NOT EXISTS idx_qt_componente ON questoes_trilha(componente);
CREATE INDEX IF NOT EXISTS idx_qt_nivel_ensino ON questoes_trilha(nivel_ensino);
CREATE INDEX IF NOT EXISTS idx_qt_serie_semana ON questoes_trilha(serie, semana, ano_letivo);
CREATE INDEX IF NOT EXISTS idx_ut_usuario ON usuario_trilha(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ut_ativa ON usuario_trilha(ativa) WHERE ativa = TRUE;
CREATE INDEX IF NOT EXISTS idx_ps_usuario ON progresso_semanal(usuario_id);
CREATE INDEX IF NOT EXISTS idx_rt_usuario ON respostas_trilha(usuario_id);

-- ============================================================================
-- 10. HABILITAR RLS (SEGURANCA)
-- ============================================================================

ALTER TABLE trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes_trilha ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_trilha ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_trilha ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trilhas_select ON trilhas;
CREATE POLICY trilhas_select ON trilhas FOR SELECT USING (ativa = TRUE);

DROP POLICY IF EXISTS questoes_trilha_select ON questoes_trilha;
CREATE POLICY questoes_trilha_select ON questoes_trilha FOR SELECT USING (ativa = TRUE);

DROP POLICY IF EXISTS questoes_trilha_insert ON questoes_trilha;
CREATE POLICY questoes_trilha_insert ON questoes_trilha FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- CONCLUIDO!
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Setup de Trilhas concluido!';
    RAISE NOTICE '';
    RAISE NOTICE 'Series suportadas:';
    RAISE NOTICE '  EF (6o-9o): Matematica, 4 alternativas (A-D)';
    RAISE NOTICE '  EM (1o-3o): Fisica, 5 alternativas (A-E)';
    RAISE NOTICE '';
    RAISE NOTICE 'Funcoes disponiveis:';
    RAISE NOTICE '  - listar_trilhas()';
    RAISE NOTICE '  - iniciar_trilha()';
    RAISE NOTICE '  - buscar_questoes_semana_trilha()';
    RAISE NOTICE '  - responder_questao_trilha()';
    RAISE NOTICE '  - avancar_semana_trilha()';
    RAISE NOTICE '============================================';
END $$;
