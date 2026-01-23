-- ═══════════════════════════════════════════════════════════════════════════
-- PLATAFORMA EDUCACIONAL - SCHEMA DO BANCO DE DADOS
-- Colégio Estadual Cora Coralina
-- Versão: 1.0
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: usuarios
-- Armazena dados de estudantes e professores
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Login
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,

    -- Dados pessoais
    nome VARCHAR(100) NOT NULL,
    turma VARCHAR(10) NOT NULL,
    ano INTEGER NOT NULL CHECK (ano BETWEEN 1 AND 9),
    nivel VARCHAR(5) NOT NULL CHECK (nivel IN ('EF', 'EM')),

    -- Componentes (array) - 'fisica' e/ou 'matematica'
    componentes TEXT[] NOT NULL DEFAULT '{}',

    -- ═══════════════════════════════════════════════════════════════════════
    -- PROGRESSO FÍSICA
    -- ═══════════════════════════════════════════════════════════════════════
    fis_pontos INTEGER DEFAULT 0,
    fis_questoes_total INTEGER DEFAULT 0,
    fis_questoes_corretas INTEGER DEFAULT 0,
    fis_sequencia_dias INTEGER DEFAULT 0,
    fis_nivel VARCHAR(30) DEFAULT 'Iniciante',
    fis_uso_ia_hoje INTEGER DEFAULT 0,
    fis_data_uso_ia DATE,
    fis_ultimo_estudo DATE,

    -- ═══════════════════════════════════════════════════════════════════════
    -- PROGRESSO MATEMÁTICA
    -- ═══════════════════════════════════════════════════════════════════════
    mat_pontos INTEGER DEFAULT 0,
    mat_questoes_total INTEGER DEFAULT 0,
    mat_questoes_corretas INTEGER DEFAULT 0,
    mat_sequencia_dias INTEGER DEFAULT 0,
    mat_nivel VARCHAR(30) DEFAULT 'Iniciante',
    mat_uso_ia_hoje INTEGER DEFAULT 0,
    mat_data_uso_ia DATE,
    mat_ultimo_estudo DATE,

    -- Tipo e status
    tipo VARCHAR(20) DEFAULT 'estudante' CHECK (tipo IN ('estudante', 'professor')),
    ativo BOOLEAN DEFAULT TRUE,
    senha_alterada BOOLEAN DEFAULT FALSE,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraint: componentes não pode ser vazio para estudantes
    CONSTRAINT componentes_validos
        CHECK (array_length(componentes, 1) > 0 OR tipo = 'professor')
);

-- Índices para performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_turma ON usuarios(turma);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_usuarios_componentes ON usuarios USING GIN(componentes);

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: questoes
-- Banco de questões de física e matemática
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE questoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Classificação
    componente VARCHAR(15) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    ano INTEGER NOT NULL CHECK (ano BETWEEN 1 AND 9),
    bimestre INTEGER CHECK (bimestre IS NULL OR bimestre BETWEEN 1 AND 4),
    tema VARCHAR(100) NOT NULL,
    subtema VARCHAR(100),
    dificuldade VARCHAR(10) DEFAULT 'medio' CHECK (dificuldade IN ('facil', 'medio', 'dificil')),

    -- Conteúdo
    enunciado TEXT NOT NULL,
    alternativa_a TEXT NOT NULL,
    alternativa_b TEXT NOT NULL,
    alternativa_c TEXT NOT NULL,
    alternativa_d TEXT NOT NULL,
    alternativa_e TEXT,
    resposta_correta CHAR(1) NOT NULL CHECK (resposta_correta IN ('A', 'B', 'C', 'D', 'E')),
    explicacao TEXT NOT NULL,
    dica TEXT,

    -- Status
    status VARCHAR(10) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_questoes_componente ON questoes(componente);
CREATE INDEX idx_questoes_ano ON questoes(ano);
CREATE INDEX idx_questoes_bimestre ON questoes(bimestre);
CREATE INDEX idx_questoes_tema ON questoes(tema);
CREATE INDEX idx_questoes_status ON questoes(status);
CREATE INDEX idx_questoes_dificuldade ON questoes(dificuldade);
CREATE INDEX idx_questoes_componente_ano_bimestre ON questoes(componente, ano, bimestre) WHERE status = 'ativa';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: respostas
-- Histórico de respostas dos estudantes
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE respostas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    questao_id UUID NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
    componente VARCHAR(15) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    resposta_dada CHAR(1) NOT NULL CHECK (resposta_dada IN ('A', 'B', 'C', 'D', 'E')),
    correta BOOLEAN NOT NULL,
    tempo_segundos INTEGER NOT NULL DEFAULT 0,
    usou_dica BOOLEAN DEFAULT FALSE,
    pontos_ganhos INTEGER DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_respostas_usuario ON respostas(usuario_id);
CREATE INDEX idx_respostas_questao ON respostas(questao_id);
CREATE INDEX idx_respostas_componente ON respostas(componente);
CREATE INDEX idx_respostas_data ON respostas(criado_em);

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: conquistas
-- Definição das conquistas disponíveis
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE conquistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NOT NULL,
    icone VARCHAR(10) NOT NULL,
    componente VARCHAR(15) CHECK (componente IN ('fisica', 'matematica')),
    requisito_tipo VARCHAR(20) NOT NULL CHECK (requisito_tipo IN ('pontos', 'questoes', 'sequencia', 'acertos')),
    requisito_valor INTEGER NOT NULL
);

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: conquistas_usuarios
-- Conquistas desbloqueadas por cada usuário
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE conquistas_usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    conquista_id UUID NOT NULL REFERENCES conquistas(id) ON DELETE CASCADE,
    componente VARCHAR(15) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    desbloqueada_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Evitar duplicatas
    UNIQUE(usuario_id, conquista_id, componente)
);

-- Índices para performance
CREATE INDEX idx_conquistas_usuarios_usuario ON conquistas_usuarios(usuario_id);
CREATE INDEX idx_conquistas_usuarios_componente ON conquistas_usuarios(componente);

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: historico_chat
-- Histórico de conversas com tutores IA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE historico_chat (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(15) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_historico_chat_usuario ON historico_chat(usuario_id);
CREATE INDEX idx_historico_chat_componente ON historico_chat(componente);
CREATE INDEX idx_historico_chat_data ON historico_chat(criado_em);

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Ranking de Física por turma
CREATE OR REPLACE VIEW ranking_fisica AS
SELECT
    u.id,
    u.nome,
    u.turma,
    u.fis_pontos as pontos,
    u.fis_nivel as nivel,
    u.fis_questoes_total as questoes_total,
    CASE
        WHEN u.fis_questoes_total > 0
        THEN ROUND((u.fis_questoes_corretas::numeric / u.fis_questoes_total) * 100)
        ELSE 0
    END as taxa_acerto,
    ROW_NUMBER() OVER (PARTITION BY u.turma ORDER BY u.fis_pontos DESC) as posicao
FROM usuarios u
WHERE u.tipo = 'estudante'
  AND u.ativo = true
  AND 'fisica' = ANY(u.componentes);

-- View: Ranking de Matemática por turma
CREATE OR REPLACE VIEW ranking_matematica AS
SELECT
    u.id,
    u.nome,
    u.turma,
    u.mat_pontos as pontos,
    u.mat_nivel as nivel,
    u.mat_questoes_total as questoes_total,
    CASE
        WHEN u.mat_questoes_total > 0
        THEN ROUND((u.mat_questoes_corretas::numeric / u.mat_questoes_total) * 100)
        ELSE 0
    END as taxa_acerto,
    ROW_NUMBER() OVER (PARTITION BY u.turma ORDER BY u.mat_pontos DESC) as posicao
FROM usuarios u
WHERE u.tipo = 'estudante'
  AND u.ativo = true
  AND 'matematica' = ANY(u.componentes);

-- View: Estatísticas por turma
CREATE OR REPLACE VIEW estatisticas_turma AS
SELECT
    turma,
    'fisica' as componente,
    COUNT(*) FILTER (WHERE 'fisica' = ANY(componentes)) as total_estudantes,
    COALESCE(AVG(fis_pontos) FILTER (WHERE 'fisica' = ANY(componentes)), 0) as media_pontos,
    COALESCE(SUM(fis_questoes_total) FILTER (WHERE 'fisica' = ANY(componentes)), 0) as total_respostas,
    CASE
        WHEN SUM(fis_questoes_total) FILTER (WHERE 'fisica' = ANY(componentes)) > 0
        THEN ROUND((SUM(fis_questoes_corretas) FILTER (WHERE 'fisica' = ANY(componentes))::numeric /
                    SUM(fis_questoes_total) FILTER (WHERE 'fisica' = ANY(componentes))) * 100)
        ELSE 0
    END as taxa_acerto
FROM usuarios
WHERE tipo = 'estudante' AND ativo = true
GROUP BY turma
UNION ALL
SELECT
    turma,
    'matematica' as componente,
    COUNT(*) FILTER (WHERE 'matematica' = ANY(componentes)) as total_estudantes,
    COALESCE(AVG(mat_pontos) FILTER (WHERE 'matematica' = ANY(componentes)), 0) as media_pontos,
    COALESCE(SUM(mat_questoes_total) FILTER (WHERE 'matematica' = ANY(componentes)), 0) as total_respostas,
    CASE
        WHEN SUM(mat_questoes_total) FILTER (WHERE 'matematica' = ANY(componentes)) > 0
        THEN ROUND((SUM(mat_questoes_corretas) FILTER (WHERE 'matematica' = ANY(componentes))::numeric /
                    SUM(mat_questoes_total) FILTER (WHERE 'matematica' = ANY(componentes))) * 100)
        ELSE 0
    END as taxa_acerto
FROM usuarios
WHERE tipo = 'estudante' AND ativo = true
GROUP BY turma;

-- ═══════════════════════════════════════════════════════════════════════════
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar RLS nas tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conquistas_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_chat ENABLE ROW LEVEL SECURITY;

-- Política: Service role tem acesso total
CREATE POLICY "Service role full access" ON usuarios FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON questoes FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON respostas FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON conquistas FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON conquistas_usuarios FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON historico_chat FOR ALL TO service_role USING (true);

-- Comentários nas tabelas para documentação
COMMENT ON TABLE usuarios IS 'Tabela de usuários (estudantes e professores)';
COMMENT ON TABLE questoes IS 'Banco de questões de física e matemática';
COMMENT ON TABLE respostas IS 'Histórico de respostas dos estudantes';
COMMENT ON TABLE conquistas IS 'Definição das conquistas disponíveis';
COMMENT ON TABLE conquistas_usuarios IS 'Conquistas desbloqueadas por usuário';
COMMENT ON TABLE historico_chat IS 'Histórico de conversas com tutores IA';
