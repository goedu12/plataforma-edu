-- ================================================================
-- TABELA: enem_questions (NOMES IGUAIS AO CSV)
-- Execute este SQL no Supabase ANTES de importar o CSV
-- ================================================================

-- Remove tabelas antigas
DROP TABLE IF EXISTS public.enem_responses CASCADE;
DROP TABLE IF EXISTS public.enem_questions CASCADE;

-- Cria tabela com nomes IGUAIS ao CSV
CREATE TABLE public.enem_questions (
    id_unico TEXT PRIMARY KEY,   -- Chave primária
    id TEXT,                      -- ID original (questao_01)
    ano INT,                      -- Ano da prova
    exam INT,                     -- Ano do exame
    "IU" BOOLEAN,                 -- Image Usage
    ledor BOOLEAN,                -- Questão com ledor
    anulada BOOLEAN,              -- Questão anulada
    question TEXT,                -- Enunciado da questão
    label TEXT,                   -- Resposta correta (A,B,C,D,E)
    description JSONB,            -- Descrição das imagens
    alternatives JSONB,           -- Array com 5 alternativas
    figures JSONB                 -- Array com URLs das imagens
);

-- Índices
CREATE INDEX idx_enem_ano ON public.enem_questions(ano);
CREATE INDEX idx_enem_anulada ON public.enem_questions(anulada);

-- Segurança - Leitura pública
ALTER TABLE public.enem_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura_publica" ON public.enem_questions FOR SELECT USING (true);

-- Tabela de respostas
CREATE TABLE public.enem_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    resposta_dada TEXT NOT NULL,
    correta BOOLEAN NOT NULL,
    tempo_segundos INTEGER DEFAULT 0,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, question_id)
);

CREATE INDEX idx_resp_usuario ON public.enem_responses(usuario_id);
CREATE INDEX idx_resp_question ON public.enem_responses(question_id);

ALTER TABLE public.enem_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuario_ve_suas" ON public.enem_responses FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "usuario_insere" ON public.enem_responses FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- Grants
GRANT ALL ON public.enem_questions TO authenticated;
GRANT ALL ON public.enem_responses TO authenticated;

-- ================================================================
-- APÓS CRIAR AS TABELAS:
-- 1. Vá em Table Editor → enem_questions
-- 2. Insert → Import from CSV
-- 3. Mapeie: id_unico→id_unico, id→id, ano→ano, etc (1:1)
-- ================================================================
