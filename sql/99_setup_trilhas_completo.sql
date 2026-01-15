-- ============================================================================
-- SQL COMPLETO PARA SETUP DE TRILHAS
-- Execute este arquivo UMA VEZ no SQL Editor do Supabase
-- ============================================================================

-- 1. CRIAR TABELAS
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

CREATE TABLE IF NOT EXISTS questoes_trilha (
    id BIGSERIAL PRIMARY KEY,
    serie VARCHAR(10) NOT NULL CHECK (serie IN ('1EM', '2EM', '3EM')),
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
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(serie, semana, ano_letivo, ordem)
);

CREATE TABLE IF NOT EXISTS usuario_trilha (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    trilha_id VARCHAR(50) NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    serie VARCHAR(10) NOT NULL CHECK (serie IN ('1EM', '2EM', '3EM')),
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

CREATE TABLE IF NOT EXISTS progresso_semanal (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    trilha_id VARCHAR(50) NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    serie VARCHAR(10) NOT NULL,
    semana INTEGER NOT NULL CHECK (semana BETWEEN 1 AND 40),
    ano_letivo INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),
    questoes_total INTEGER DEFAULT 5,
    questoes_respondidas INTEGER DEFAULT 0,
    questoes_corretas INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'bloqueada',
    pontos_semana INTEGER DEFAULT 0,
    desbloqueada_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, trilha_id, serie, semana, ano_letivo)
);

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

-- 2. INSERIR TRILHA INICIAL
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

-- 3. CRIAR FUNÇÕES

-- Função para listar trilhas
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

-- Função para iniciar trilha
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
BEGIN
    SELECT * INTO v_trilha FROM trilhas WHERE id = p_trilha_id AND ativa = TRUE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('sucesso', FALSE, 'erro', 'Trilha não encontrada');
    END IF;

    -- Pausar trilhas anteriores
    UPDATE usuario_trilha SET ativa = FALSE, pausada_em = NOW()
    WHERE usuario_id = p_usuario_id AND serie = p_serie AND ativa = TRUE;

    -- Criar nova trilha
    INSERT INTO usuario_trilha (usuario_id, trilha_id, serie, ativa, semana_atual)
    VALUES (p_usuario_id, p_trilha_id, p_serie, TRUE, 1)
    ON CONFLICT (usuario_id, trilha_id, serie)
    DO UPDATE SET ativa = TRUE, pausada_em = NULL, ultimo_acesso = NOW();

    -- Desbloquear semana 1
    INSERT INTO progresso_semanal (usuario_id, trilha_id, serie, semana, status, desbloqueada_em)
    VALUES (p_usuario_id, p_trilha_id, p_serie, 1, 'disponivel', NOW())
    ON CONFLICT (usuario_id, trilha_id, serie, semana, ano_letivo) DO NOTHING;

    RETURN jsonb_build_object('sucesso', TRUE, 'trilha_id', v_trilha.id, 'trilha_nome', v_trilha.nome);
END;
$$;

-- Função para buscar questões
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
    usou_dica BOOLEAN
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
        COALESCE(rt.usou_dica, FALSE) AS usou_dica
    FROM questoes_trilha q
    LEFT JOIN respostas_trilha rt ON (rt.questao_id = q.id AND rt.usuario_id = p_usuario_id)
    WHERE q.serie = p_serie AND q.semana = v_semana_atual AND q.ano_letivo = v_ano_letivo AND q.ativa = TRUE
    ORDER BY q.is_desafio ASC, q.ordem ASC;
END;
$$;

-- Função para responder questão
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
BEGIN
    SELECT * INTO v_questao FROM questoes_trilha WHERE id = p_questao_id AND ativa = TRUE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('sucesso', FALSE, 'erro', 'Questão não encontrada');
    END IF;

    IF EXISTS(SELECT 1 FROM respostas_trilha WHERE usuario_id = p_usuario_id AND questao_id = p_questao_id) THEN
        RETURN jsonb_build_object('sucesso', FALSE, 'erro', 'Você já respondeu esta questão');
    END IF;

    SELECT ut.trilha_id INTO v_trilha_id
    FROM usuario_trilha ut WHERE ut.usuario_id = p_usuario_id AND ut.serie = v_questao.serie AND ut.ativa = TRUE;

    v_correta := (UPPER(p_resposta) = UPPER(v_questao.resposta_correta));
    v_pontos := CASE WHEN v_correta AND NOT p_usou_dica THEN 10 WHEN v_correta THEN 5 ELSE 0 END;

    INSERT INTO respostas_trilha (usuario_id, questao_id, trilha_id, resposta_dada, correta, tempo_segundos, usou_dica, pontos_ganhos)
    VALUES (p_usuario_id, p_questao_id, v_trilha_id, UPPER(p_resposta), v_correta, p_tempo_segundos, p_usou_dica, v_pontos);

    UPDATE progresso_semanal
    SET questoes_respondidas = questoes_respondidas + 1,
        questoes_corretas = questoes_corretas + (CASE WHEN v_correta THEN 1 ELSE 0 END),
        pontos_semana = pontos_semana + v_pontos,
        status = 'em_progresso'
    WHERE usuario_id = p_usuario_id AND trilha_id = v_trilha_id AND serie = v_questao.serie AND semana = v_questao.semana;

    UPDATE usuario_trilha
    SET questoes_total = questoes_total + 1,
        questoes_corretas = questoes_corretas + (CASE WHEN v_correta THEN 1 ELSE 0 END),
        pontos_trilha = pontos_trilha + v_pontos
    WHERE usuario_id = p_usuario_id AND trilha_id = v_trilha_id AND serie = v_questao.serie;

    RETURN jsonb_build_object(
        'sucesso', TRUE,
        'correta', v_correta,
        'resposta_certa', v_questao.resposta_correta,
        'pontos', v_pontos,
        'feedback', v_questao.feedback
    );
END;
$$;

-- 4. HABILITAR RLS (necessário para segurança)
ALTER TABLE trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes_trilha ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_trilha ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_trilha ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura
DROP POLICY IF EXISTS trilhas_select ON trilhas;
CREATE POLICY trilhas_select ON trilhas FOR SELECT USING (ativa = TRUE);

DROP POLICY IF EXISTS questoes_trilha_select ON questoes_trilha;
CREATE POLICY questoes_trilha_select ON questoes_trilha FOR SELECT USING (ativa = TRUE);

DROP POLICY IF EXISTS questoes_trilha_insert ON questoes_trilha;
CREATE POLICY questoes_trilha_insert ON questoes_trilha FOR INSERT WITH CHECK (TRUE);

-- ============================================================================
-- PRONTO! Agora configure GEMINI_API_KEY no Vercel e faça redeploy
-- ============================================================================
