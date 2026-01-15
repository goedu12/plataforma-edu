-- ============================================================================
-- 50_SISTEMA_TRILHAS_SCHEMA.SQL
-- Sistema de Trilhas de Aprendizado + Questoes Semanais
--
-- PONTO DE RESTAURACAO: tag v1.0-pre-trilhas
-- Para voltar: git checkout v1.0-pre-trilhas
--
-- Criado em: 2025-01-15
-- Autor: Sistema Claude - Analista Master Senior
-- ============================================================================

-- Habilitar extensao de vetores (se nao existir)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 1. TABELA: TRILHAS DISPONIVEIS
-- Armazena as 6 trilhas de aprendizado
-- ============================================================================

CREATE TABLE IF NOT EXISTS trilhas (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    icone VARCHAR(10) NOT NULL,
    cor VARCHAR(7) NOT NULL,
    descricao TEXT NOT NULL,
    descricao_curta VARCHAR(100),

    -- Configuracoes da trilha (JSON flexivel)
    config JSONB NOT NULL DEFAULT '{}',

    -- Controle
    ordem INTEGER DEFAULT 1,
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE trilhas IS 'Trilhas de aprendizado disponiveis no sistema';
COMMENT ON COLUMN trilhas.id IS 'Identificador unico: passar_ano, enem, recuperacao, desafio, curiosidade, pressa';
COMMENT ON COLUMN trilhas.config IS 'JSON com: questoes_semana, dificuldade, tipos, acerto_avancar, etc';

-- ============================================================================
-- 2. TABELA: QUESTOES DAS TRILHAS (QUESTOES SEMANAIS)
-- Banco principal de questoes organizadas por semana
-- ============================================================================

CREATE TABLE IF NOT EXISTS questoes_trilha (
    id BIGSERIAL PRIMARY KEY,

    -- Identificacao temporal
    serie VARCHAR(10) NOT NULL CHECK (serie IN ('1EM', '2EM', '3EM')),
    semana INTEGER NOT NULL CHECK (semana BETWEEN 1 AND 40),
    ano_letivo INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
    ordem INTEGER NOT NULL CHECK (ordem BETWEEN 1 AND 10),

    -- Conteudo curricular
    tema VARCHAR(100) NOT NULL,
    subtema TEXT NOT NULL,
    competencias_bncc TEXT[] DEFAULT '{}',

    -- Tipo e contexto
    tipo_questao VARCHAR(50) NOT NULL CHECK (tipo_questao IN (
        'conceitual',           -- Compreensao sem calculos
        'calculo_direto',       -- Aplicacao direta de formula
        'interpretacao_grafico', -- Analise de graficos/tabelas
        'situacao_problema',    -- Problema contextualizado
        'analise_fenomeno',     -- Explicar por que acontece
        'comparacao',           -- Comparar situacoes
        'olimpiada'             -- Nivel olimpiada
    )),
    contexto_cotidiano VARCHAR(50) NOT NULL CHECK (contexto_cotidiano IN (
        'transporte',
        'casa_familia',
        'escola',
        'rua_bairro',
        'corpo_saude',
        'lazer_tecnologia',
        'trabalho_profissoes',
        'todos'
    )),

    -- Questao propriamente dita
    enunciado TEXT NOT NULL,
    alternativas JSONB NOT NULL,  -- {"A": "...", "B": "...", "C": "...", "D": "...", "E": "..."}
    resposta_correta VARCHAR(1) NOT NULL CHECK (resposta_correta IN ('A','B','C','D','E')),

    -- Apoio pedagogico
    dica TEXT NOT NULL,
    feedback JSONB NOT NULL DEFAULT '{}',  -- {explicacao_correta, erros_comuns, conexao_cotidiano, curiosidade}

    -- Metadados
    dificuldade VARCHAR(20) NOT NULL DEFAULT 'medio' CHECK (dificuldade IN ('facil', 'medio', 'dificil', 'olimpiada')),
    tags TEXT[] DEFAULT '{}',
    is_desafio BOOLEAN DEFAULT FALSE,

    -- Busca semantica (RAG)
    embedding VECTOR(768),

    -- Controle
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unicidade: uma questao por posicao em cada semana
    UNIQUE(serie, semana, ano_letivo, ordem)
);

-- Comentarios
COMMENT ON TABLE questoes_trilha IS 'Questoes organizadas por semana para o sistema de trilhas';
COMMENT ON COLUMN questoes_trilha.tipo_questao IS 'Tipo: conceitual, calculo_direto, interpretacao_grafico, situacao_problema, analise_fenomeno, comparacao, olimpiada';
COMMENT ON COLUMN questoes_trilha.contexto_cotidiano IS 'Contexto: transporte, casa_familia, escola, rua_bairro, corpo_saude, lazer_tecnologia, trabalho_profissoes';
COMMENT ON COLUMN questoes_trilha.feedback IS 'JSON: {explicacao_correta, erros_comuns: {A, B, C, D, E}, conexao_cotidiano, curiosidade}';
COMMENT ON COLUMN questoes_trilha.embedding IS 'Vetor 768 dimensoes para busca semantica (RAG)';

-- Indices otimizados
CREATE INDEX IF NOT EXISTS idx_qt_serie ON questoes_trilha(serie);
CREATE INDEX IF NOT EXISTS idx_qt_semana ON questoes_trilha(semana);
CREATE INDEX IF NOT EXISTS idx_qt_ano ON questoes_trilha(ano_letivo);
CREATE INDEX IF NOT EXISTS idx_qt_tema ON questoes_trilha(tema);
CREATE INDEX IF NOT EXISTS idx_qt_tipo ON questoes_trilha(tipo_questao);
CREATE INDEX IF NOT EXISTS idx_qt_dificuldade ON questoes_trilha(dificuldade);
CREATE INDEX IF NOT EXISTS idx_qt_contexto ON questoes_trilha(contexto_cotidiano);
CREATE INDEX IF NOT EXISTS idx_qt_ativa ON questoes_trilha(ativa) WHERE ativa = TRUE;
CREATE INDEX IF NOT EXISTS idx_qt_desafio ON questoes_trilha(is_desafio) WHERE is_desafio = TRUE;

-- Indice para busca vetorial (RAG)
CREATE INDEX IF NOT EXISTS idx_qt_embedding ON questoes_trilha
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Indice composto para busca frequente
CREATE INDEX IF NOT EXISTS idx_qt_serie_semana_ano ON questoes_trilha(serie, semana, ano_letivo);

-- ============================================================================
-- 3. TABELA: TRILHA DO USUARIO
-- Vinculo entre usuario e trilha escolhida
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuario_trilha (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    trilha_id VARCHAR(50) NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    serie VARCHAR(10) NOT NULL CHECK (serie IN ('1EM', '2EM', '3EM')),

    -- Status da trilha
    ativa BOOLEAN DEFAULT TRUE,
    iniciada_em TIMESTAMPTZ DEFAULT NOW(),
    pausada_em TIMESTAMPTZ,
    concluida_em TIMESTAMPTZ,

    -- Progresso geral
    semana_atual INTEGER DEFAULT 1,
    questoes_total INTEGER DEFAULT 0,
    questoes_corretas INTEGER DEFAULT 0,
    pontos_trilha INTEGER DEFAULT 0,
    sequencia_dias INTEGER DEFAULT 0,
    melhor_sequencia INTEGER DEFAULT 0,

    -- Ultimo acesso
    ultimo_acesso TIMESTAMPTZ DEFAULT NOW(),

    -- Diagnostico (para trilha recuperacao)
    diagnostico_feito BOOLEAN DEFAULT FALSE,
    diagnostico_resultado JSONB DEFAULT '{}',
    lacunas_identificadas JSONB DEFAULT '[]',

    -- Trilha pressa (temporaria)
    data_prova DATE,
    temas_prova TEXT[],

    -- Configuracao personalizada (sobrescreve config da trilha)
    config_personalizada JSONB DEFAULT '{}',

    -- Controle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unicidade: um usuario so pode ter uma instancia de cada trilha por serie
    UNIQUE(usuario_id, trilha_id, serie)
);

-- Comentarios
COMMENT ON TABLE usuario_trilha IS 'Vinculo entre usuario e trilha de aprendizado';
COMMENT ON COLUMN usuario_trilha.diagnostico_resultado IS 'Resultado do diagnostico inicial (trilha recuperacao)';
COMMENT ON COLUMN usuario_trilha.lacunas_identificadas IS 'Array de temas com lacunas identificadas';
COMMENT ON COLUMN usuario_trilha.config_personalizada IS 'Configuracoes que sobrescrevem a config padrao da trilha';

-- Indices
CREATE INDEX IF NOT EXISTS idx_ut_usuario ON usuario_trilha(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ut_trilha ON usuario_trilha(trilha_id);
CREATE INDEX IF NOT EXISTS idx_ut_serie ON usuario_trilha(serie);
CREATE INDEX IF NOT EXISTS idx_ut_ativa ON usuario_trilha(ativa) WHERE ativa = TRUE;
CREATE INDEX IF NOT EXISTS idx_ut_usuario_ativa ON usuario_trilha(usuario_id, ativa) WHERE ativa = TRUE;

-- ============================================================================
-- 4. TABELA: PROGRESSO SEMANAL
-- Progresso do usuario em cada semana de cada trilha
-- ============================================================================

CREATE TABLE IF NOT EXISTS progresso_semanal (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    trilha_id VARCHAR(50) NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
    serie VARCHAR(10) NOT NULL,
    semana INTEGER NOT NULL CHECK (semana BETWEEN 1 AND 40),
    ano_letivo INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),

    -- Progresso
    questoes_total INTEGER DEFAULT 5,
    questoes_respondidas INTEGER DEFAULT 0,
    questoes_corretas INTEGER DEFAULT 0,

    -- Desafio
    desafio_disponivel BOOLEAN DEFAULT FALSE,
    desafio_respondido BOOLEAN DEFAULT FALSE,
    desafio_acertou BOOLEAN DEFAULT FALSE,

    -- Status
    status VARCHAR(20) DEFAULT 'bloqueada' CHECK (status IN (
        'bloqueada',      -- Ainda nao liberada
        'disponivel',     -- Liberada, pode comecar
        'em_progresso',   -- Comecou a responder
        'concluida'       -- Todas questoes respondidas
    )),

    -- Tempo e pontuacao
    tempo_total_segundos INTEGER DEFAULT 0,
    pontos_semana INTEGER DEFAULT 0,
    bonus_100_porcento BOOLEAN DEFAULT FALSE,

    -- Timestamps
    desbloqueada_em TIMESTAMPTZ,
    iniciada_em TIMESTAMPTZ,
    concluida_em TIMESTAMPTZ,

    -- Controle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unicidade
    UNIQUE(usuario_id, trilha_id, serie, semana, ano_letivo)
);

-- Comentarios
COMMENT ON TABLE progresso_semanal IS 'Progresso do usuario em cada semana';
COMMENT ON COLUMN progresso_semanal.status IS 'bloqueada, disponivel, em_progresso, concluida';
COMMENT ON COLUMN progresso_semanal.bonus_100_porcento IS 'True se acertou 100% das questoes da semana';

-- Indices
CREATE INDEX IF NOT EXISTS idx_ps_usuario ON progresso_semanal(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ps_trilha ON progresso_semanal(trilha_id);
CREATE INDEX IF NOT EXISTS idx_ps_status ON progresso_semanal(status);
CREATE INDEX IF NOT EXISTS idx_ps_usuario_trilha ON progresso_semanal(usuario_id, trilha_id);
CREATE INDEX IF NOT EXISTS idx_ps_usuario_serie_semana ON progresso_semanal(usuario_id, serie, semana);

-- ============================================================================
-- 5. TABELA: RESPOSTAS DAS TRILHAS
-- Historico de respostas do usuario nas questoes das trilhas
-- ============================================================================

CREATE TABLE IF NOT EXISTS respostas_trilha (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    questao_id BIGINT NOT NULL REFERENCES questoes_trilha(id) ON DELETE CASCADE,
    trilha_id VARCHAR(50) REFERENCES trilhas(id) ON DELETE SET NULL,

    -- Resposta
    resposta_dada VARCHAR(1) NOT NULL CHECK (resposta_dada IN ('A','B','C','D','E')),
    correta BOOLEAN NOT NULL,

    -- Metricas
    tempo_segundos INTEGER DEFAULT 0,
    usou_dica BOOLEAN DEFAULT FALSE,
    tentativa INTEGER DEFAULT 1,

    -- Pontuacao
    pontos_ganhos INTEGER DEFAULT 0,

    -- Controle
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unicidade: uma resposta final por usuario/questao
    UNIQUE(usuario_id, questao_id)
);

-- Comentarios
COMMENT ON TABLE respostas_trilha IS 'Respostas dos usuarios nas questoes das trilhas';
COMMENT ON COLUMN respostas_trilha.tentativa IS 'Numero da tentativa (se permitido tentar novamente)';
COMMENT ON COLUMN respostas_trilha.pontos_ganhos IS 'Pontos: 10 normal, 5 com dica, 0 errado';

-- Indices
CREATE INDEX IF NOT EXISTS idx_rt_usuario ON respostas_trilha(usuario_id);
CREATE INDEX IF NOT EXISTS idx_rt_questao ON respostas_trilha(questao_id);
CREATE INDEX IF NOT EXISTS idx_rt_trilha ON respostas_trilha(trilha_id);
CREATE INDEX IF NOT EXISTS idx_rt_correta ON respostas_trilha(correta);
CREATE INDEX IF NOT EXISTS idx_rt_usuario_correta ON respostas_trilha(usuario_id, correta);

-- ============================================================================
-- 6. TABELA: TEMAS DE CURIOSIDADE (TRILHA CURIOSIDADE)
-- Temas tematicos para a trilha de curiosidade
-- ============================================================================

CREATE TABLE IF NOT EXISTS trilha_temas_curiosidade (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    icone VARCHAR(10) NOT NULL,
    descricao TEXT NOT NULL,

    -- Conteudos relacionados
    conteudos_fisica TEXT[] NOT NULL,  -- ['ondas', 'eletromagnetismo', 'circuitos']

    -- Quantidade de questoes
    total_questoes INTEGER DEFAULT 15,

    -- Controle
    ordem INTEGER DEFAULT 1,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE trilha_temas_curiosidade IS 'Temas tematicos para trilha curiosidade (Fisica do Celular, etc)';

-- ============================================================================
-- 7. TABELA: RANKING (TRILHA DESAFIO)
-- Ranking semanal para a trilha desafio
-- ============================================================================

CREATE TABLE IF NOT EXISTS trilha_ranking (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    serie VARCHAR(10) NOT NULL,
    semana INTEGER NOT NULL,
    ano_letivo INTEGER DEFAULT EXTRACT(YEAR FROM NOW()),

    -- Pontuacao
    pontos_semana INTEGER DEFAULT 0,
    questoes_corretas INTEGER DEFAULT 0,
    tempo_total_segundos INTEGER DEFAULT 0,

    -- Posicao (calculada)
    posicao INTEGER,

    -- Controle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(usuario_id, serie, semana, ano_letivo)
);

-- Comentarios
COMMENT ON TABLE trilha_ranking IS 'Ranking semanal da trilha desafio';

-- Indices
CREATE INDEX IF NOT EXISTS idx_tr_serie_semana ON trilha_ranking(serie, semana, ano_letivo);
CREATE INDEX IF NOT EXISTS idx_tr_pontos ON trilha_ranking(pontos_semana DESC);

-- ============================================================================
-- 8. TRIGGERS PARA UPDATED_AT
-- ============================================================================

-- Funcao generica para atualizar updated_at
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS tr_trilhas_updated ON trilhas;
CREATE TRIGGER tr_trilhas_updated
    BEFORE UPDATE ON trilhas
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

DROP TRIGGER IF EXISTS tr_questoes_trilha_updated ON questoes_trilha;
CREATE TRIGGER tr_questoes_trilha_updated
    BEFORE UPDATE ON questoes_trilha
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

DROP TRIGGER IF EXISTS tr_usuario_trilha_updated ON usuario_trilha;
CREATE TRIGGER tr_usuario_trilha_updated
    BEFORE UPDATE ON usuario_trilha
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

DROP TRIGGER IF EXISTS tr_progresso_semanal_updated ON progresso_semanal;
CREATE TRIGGER tr_progresso_semanal_updated
    BEFORE UPDATE ON progresso_semanal
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

DROP TRIGGER IF EXISTS tr_trilha_ranking_updated ON trilha_ranking;
CREATE TRIGGER tr_trilha_ranking_updated
    BEFORE UPDATE ON trilha_ranking
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes_trilha ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_trilha ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_trilha ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilha_temas_curiosidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilha_ranking ENABLE ROW LEVEL SECURITY;

-- Politicas: trilhas (leitura publica)
DROP POLICY IF EXISTS trilhas_select ON trilhas;
CREATE POLICY trilhas_select ON trilhas FOR SELECT USING (ativa = TRUE);

-- Politicas: questoes_trilha (leitura publica para ativas)
DROP POLICY IF EXISTS questoes_trilha_select ON questoes_trilha;
CREATE POLICY questoes_trilha_select ON questoes_trilha FOR SELECT USING (ativa = TRUE);

-- Politicas: usuario_trilha (usuario ve suas trilhas, professor ve da turma)
DROP POLICY IF EXISTS usuario_trilha_select ON usuario_trilha;
CREATE POLICY usuario_trilha_select ON usuario_trilha FOR SELECT USING (
    usuario_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.id = auth.uid() AND u.tipo = 'professor'
    )
);

DROP POLICY IF EXISTS usuario_trilha_insert ON usuario_trilha;
CREATE POLICY usuario_trilha_insert ON usuario_trilha FOR INSERT WITH CHECK (
    usuario_id = auth.uid()
);

DROP POLICY IF EXISTS usuario_trilha_update ON usuario_trilha;
CREATE POLICY usuario_trilha_update ON usuario_trilha FOR UPDATE USING (
    usuario_id = auth.uid()
);

-- Politicas: progresso_semanal
DROP POLICY IF EXISTS progresso_semanal_select ON progresso_semanal;
CREATE POLICY progresso_semanal_select ON progresso_semanal FOR SELECT USING (
    usuario_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.id = auth.uid() AND u.tipo = 'professor'
    )
);

DROP POLICY IF EXISTS progresso_semanal_insert ON progresso_semanal;
CREATE POLICY progresso_semanal_insert ON progresso_semanal FOR INSERT WITH CHECK (
    usuario_id = auth.uid()
);

DROP POLICY IF EXISTS progresso_semanal_update ON progresso_semanal;
CREATE POLICY progresso_semanal_update ON progresso_semanal FOR UPDATE USING (
    usuario_id = auth.uid()
);

-- Politicas: respostas_trilha
DROP POLICY IF EXISTS respostas_trilha_select ON respostas_trilha;
CREATE POLICY respostas_trilha_select ON respostas_trilha FOR SELECT USING (
    usuario_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM usuarios u
        WHERE u.id = auth.uid() AND u.tipo = 'professor'
    )
);

DROP POLICY IF EXISTS respostas_trilha_insert ON respostas_trilha;
CREATE POLICY respostas_trilha_insert ON respostas_trilha FOR INSERT WITH CHECK (
    usuario_id = auth.uid()
);

-- Politicas: trilha_temas_curiosidade (leitura publica)
DROP POLICY IF EXISTS trilha_temas_curiosidade_select ON trilha_temas_curiosidade;
CREATE POLICY trilha_temas_curiosidade_select ON trilha_temas_curiosidade FOR SELECT USING (ativo = TRUE);

-- Politicas: trilha_ranking (leitura publica)
DROP POLICY IF EXISTS trilha_ranking_select ON trilha_ranking;
CREATE POLICY trilha_ranking_select ON trilha_ranking FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS trilha_ranking_insert ON trilha_ranking;
CREATE POLICY trilha_ranking_insert ON trilha_ranking FOR INSERT WITH CHECK (
    usuario_id = auth.uid()
);

DROP POLICY IF EXISTS trilha_ranking_update ON trilha_ranking;
CREATE POLICY trilha_ranking_update ON trilha_ranking FOR UPDATE USING (
    usuario_id = auth.uid()
);

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================

-- Verificacao
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Schema de trilhas criado com sucesso!';
    RAISE NOTICE 'Tabelas: trilhas, questoes_trilha, usuario_trilha,';
    RAISE NOTICE '         progresso_semanal, respostas_trilha,';
    RAISE NOTICE '         trilha_temas_curiosidade, trilha_ranking';
    RAISE NOTICE '============================================';
END $$;
