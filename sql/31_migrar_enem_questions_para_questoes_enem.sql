-- ================================================================
-- MIGRAÇÃO: enem_questions (CSV) → questoes_enem (API)
-- Execute este SQL no Supabase para copiar as 540 questões
-- ================================================================

-- 1. Verificar se questoes_enem existe
CREATE TABLE IF NOT EXISTS public.questoes_enem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_api VARCHAR(100) UNIQUE,
    ano_prova INTEGER NOT NULL,
    numero_questao INTEGER,
    caderno VARCHAR(20),
    area VARCHAR(50) NOT NULL,
    area_nome VARCHAR(100),
    subarea VARCHAR(50),
    idioma VARCHAR(20) DEFAULT 'portugues',
    titulo VARCHAR(500),
    contexto TEXT NOT NULL,
    comando TEXT,
    imagem_principal TEXT,
    imagens_extras TEXT[],
    alternativa_a TEXT NOT NULL,
    alternativa_b TEXT NOT NULL,
    alternativa_c TEXT NOT NULL,
    alternativa_d TEXT NOT NULL,
    alternativa_e TEXT NOT NULL,
    imagem_a TEXT,
    imagem_b TEXT,
    imagem_c TEXT,
    imagem_d TEXT,
    imagem_e TEXT,
    resposta_correta CHAR(1) NOT NULL,
    conteudos TEXT[],
    conteudo_principal VARCHAR(100),
    fonte VARCHAR(50) DEFAULT 'ENEM-CSV',
    dificuldade VARCHAR(20) DEFAULT 'medio',
    tags TEXT[],
    status VARCHAR(20) DEFAULT 'ativa',
    importado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_questoes_enem_area ON questoes_enem(area);
CREATE INDEX IF NOT EXISTS idx_questoes_enem_ano ON questoes_enem(ano_prova);
CREATE INDEX IF NOT EXISTS idx_questoes_enem_status ON questoes_enem(status);
CREATE INDEX IF NOT EXISTS idx_questoes_enem_id_api ON questoes_enem(id_api);

-- 3. Criar tabela respostas_enem se não existir
CREATE TABLE IF NOT EXISTS public.respostas_enem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    questao_id UUID REFERENCES questoes_enem(id),
    id_api_questao VARCHAR(100),
    resposta_dada CHAR(1) NOT NULL,
    correta BOOLEAN NOT NULL,
    tempo_segundos INTEGER DEFAULT 0,
    ano_prova INTEGER,
    area VARCHAR(50),
    subarea VARCHAR(50),
    conteudo_principal VARCHAR(100),
    modo VARCHAR(20) DEFAULT 'livre',
    sessao_id UUID,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_questao_ref CHECK (questao_id IS NOT NULL OR id_api_questao IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_respostas_enem_usuario ON respostas_enem(usuario_id);
CREATE INDEX IF NOT EXISTS idx_respostas_enem_questao ON respostas_enem(questao_id);
CREATE INDEX IF NOT EXISTS idx_respostas_enem_id_api ON respostas_enem(id_api_questao);

-- 4. Habilitar RLS
ALTER TABLE questoes_enem ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_enem ENABLE ROW LEVEL SECURITY;

-- Políticas para questoes_enem (leitura pública)
DROP POLICY IF EXISTS "questoes_enem_select" ON questoes_enem;
CREATE POLICY "questoes_enem_select" ON questoes_enem FOR SELECT USING (true);

-- Políticas para respostas_enem
DROP POLICY IF EXISTS "respostas_enem_select" ON respostas_enem;
DROP POLICY IF EXISTS "respostas_enem_insert" ON respostas_enem;
CREATE POLICY "respostas_enem_select" ON respostas_enem FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "respostas_enem_insert" ON respostas_enem FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- 5. MIGRAR DADOS de enem_questions para questoes_enem
-- Usa ON CONFLICT para não duplicar
INSERT INTO questoes_enem (
    id_api,
    ano_prova,
    numero_questao,
    area,
    subarea,
    contexto,
    comando,
    imagem_principal,
    imagens_extras,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    alternativa_e,
    resposta_correta,
    fonte,
    status
)
SELECT
    eq.id_unico as id_api,
    eq.ano as ano_prova,
    COALESCE(
        eq.num_questao,
        CAST(NULLIF(REGEXP_REPLACE(eq.id, '[^0-9]', '', 'g'), '') AS INTEGER)
    ) as numero_questao,
    COALESCE(eq.area, 'ciencias-natureza') as area,
    'fisica' as subarea, -- Padrão para Studão
    eq.question as contexto,
    CASE
        WHEN eq.description IS NOT NULL AND eq.description::text != 'null'
        THEN eq.description::text
        ELSE NULL
    END as comando,
    -- Primeira imagem como principal
    CASE
        WHEN eq.figures IS NOT NULL AND jsonb_array_length(eq.figures) > 0
        THEN eq.figures->>0
        ELSE NULL
    END as imagem_principal,
    -- Demais imagens como extras
    CASE
        WHEN eq.figures IS NOT NULL AND jsonb_array_length(eq.figures) > 1
        THEN ARRAY(SELECT jsonb_array_elements_text(eq.figures) OFFSET 1)
        ELSE NULL
    END as imagens_extras,
    -- Alternativas
    COALESCE(eq.alternatives->>0, '') as alternativa_a,
    COALESCE(eq.alternatives->>1, '') as alternativa_b,
    COALESCE(eq.alternatives->>2, '') as alternativa_c,
    COALESCE(eq.alternatives->>3, '') as alternativa_d,
    COALESCE(eq.alternatives->>4, '') as alternativa_e,
    -- Resposta correta
    UPPER(COALESCE(eq.label, 'A')) as resposta_correta,
    'ENEM-CSV' as fonte,
    CASE WHEN eq.anulada = true THEN 'inativa' ELSE 'ativa' END as status
FROM enem_questions eq
WHERE eq.id_unico IS NOT NULL
  AND eq.question IS NOT NULL
  AND eq.question != ''
ON CONFLICT (id_api) DO UPDATE SET
    ano_prova = EXCLUDED.ano_prova,
    contexto = EXCLUDED.contexto,
    comando = EXCLUDED.comando,
    imagem_principal = EXCLUDED.imagem_principal,
    alternativa_a = EXCLUDED.alternativa_a,
    alternativa_b = EXCLUDED.alternativa_b,
    alternativa_c = EXCLUDED.alternativa_c,
    alternativa_d = EXCLUDED.alternativa_d,
    alternativa_e = EXCLUDED.alternativa_e,
    resposta_correta = EXCLUDED.resposta_correta,
    status = EXCLUDED.status,
    atualizado_em = NOW();

-- 6. Migrar respostas de enem_responses para respostas_enem
INSERT INTO respostas_enem (
    usuario_id,
    id_api_questao,
    resposta_dada,
    correta,
    tempo_segundos,
    modo,
    criado_em
)
SELECT
    er.usuario_id,
    er.question_id as id_api_questao,
    er.resposta_dada,
    er.correta,
    COALESCE(er.tempo_segundos, 0),
    'livre',
    COALESCE(er.criado_em, NOW())
FROM enem_responses er
WHERE er.question_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 7. Verificar resultado
SELECT
    'questoes_enem' as tabela,
    COUNT(*) as total,
    COUNT(DISTINCT ano_prova) as anos,
    COUNT(CASE WHEN status = 'ativa' THEN 1 END) as ativas
FROM questoes_enem
UNION ALL
SELECT
    'respostas_enem' as tabela,
    COUNT(*) as total,
    COUNT(DISTINCT usuario_id) as usuarios,
    COUNT(CASE WHEN correta THEN 1 END) as corretas
FROM respostas_enem;

-- 8. Grants
GRANT SELECT ON questoes_enem TO authenticated;
GRANT SELECT, INSERT, UPDATE ON respostas_enem TO authenticated;
