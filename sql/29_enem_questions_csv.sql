-- ================================================================
-- TABELA: enem_questions
-- Questões do ENEM importadas de CSV
-- ================================================================

-- 1. Remove a tabela antiga para evitar conflitos
DROP TABLE IF EXISTS public.enem_questions;

-- 2. Cria a tabela com os tipos de dados corretos
CREATE TABLE public.enem_questions (
    -- Usaremos o 'id_unico' do CSV como a Chave Primária (ex: questao_01_2022)
    id TEXT PRIMARY KEY,

    -- Colunas de identificação
    original_id TEXT,     -- Coluna 'id' do CSV (ex: questao_01)
    year INT,             -- Coluna 'ano'
    exam_year INT,        -- Coluna 'exam'

    -- Colunas Booleanas (True/False)
    image_usage BOOLEAN,      -- Coluna 'IU'
    reader_required BOOLEAN,  -- Coluna 'ledor'
    is_cancelled BOOLEAN,     -- Coluna 'anulada'

    -- Texto da questão e gabarito
    question_text TEXT,       -- Coluna 'question'
    correct_answer TEXT,      -- Coluna 'label'

    -- Colunas JSON (Arrays e Objetos)
    image_description JSONB,  -- Coluna 'description'
    alternatives JSONB,       -- Coluna 'alternatives'
    figure_urls JSONB         -- Coluna 'figures'
);

-- 3. Índices para performance
CREATE INDEX idx_enem_questions_year ON public.enem_questions(year);
CREATE INDEX idx_enem_questions_exam_year ON public.enem_questions(exam_year);
CREATE INDEX idx_enem_questions_cancelled ON public.enem_questions(is_cancelled);

-- 4. Habilita segurança
ALTER TABLE public.enem_questions ENABLE ROW LEVEL SECURITY;

-- 5. Política de leitura pública
DROP POLICY IF EXISTS "Leitura pública" ON public.enem_questions;
CREATE POLICY "Leitura pública" ON public.enem_questions FOR SELECT USING (true);

-- 6. Tabela de respostas do usuário para a nova estrutura
CREATE TABLE IF NOT EXISTS public.enem_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES enem_questions(id) ON DELETE CASCADE,
    resposta_dada TEXT NOT NULL,
    correta BOOLEAN NOT NULL,
    tempo_segundos INTEGER DEFAULT 0,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, question_id)
);

-- Índices para respostas
CREATE INDEX IF NOT EXISTS idx_enem_responses_usuario ON public.enem_responses(usuario_id);
CREATE INDEX IF NOT EXISTS idx_enem_responses_question ON public.enem_responses(question_id);

-- RLS para respostas
ALTER TABLE public.enem_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuario ve suas respostas" ON public.enem_responses;
CREATE POLICY "Usuario ve suas respostas" ON public.enem_responses
    FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Usuario insere suas respostas" ON public.enem_responses;
CREATE POLICY "Usuario insere suas respostas" ON public.enem_responses
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- Grants
GRANT ALL ON public.enem_questions TO authenticated;
GRANT ALL ON public.enem_responses TO authenticated;

-- ================================================================
-- MAPEAMENTO DO CSV PARA IMPORTAÇÃO:
--
-- id_unico (CSV)    -> id (Tabela)
-- id (CSV)          -> original_id
-- ano (CSV)         -> year
-- exam (CSV)        -> exam_year
-- IU (CSV)          -> image_usage
-- ledor (CSV)       -> reader_required
-- anulada (CSV)     -> is_cancelled
-- question (CSV)    -> question_text
-- label (CSV)       -> correct_answer
-- description (CSV) -> image_description (jsonb)
-- alternatives (CSV)-> alternatives (jsonb)
-- figures (CSV)     -> figure_urls (jsonb)
-- ================================================================
