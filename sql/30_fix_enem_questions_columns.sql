-- ================================================================
-- CORREÇÃO: Adicionar colunas faltantes em enem_questions
-- Execute este SQL no Supabase para corrigir a estrutura
-- ================================================================

-- 1. Adicionar coluna 'area' se não existir
ALTER TABLE public.enem_questions ADD COLUMN IF NOT EXISTS area TEXT;

-- 2. Adicionar coluna 'num_questao' se não existir
ALTER TABLE public.enem_questions ADD COLUMN IF NOT EXISTS num_questao INT;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_enem_questions_area ON public.enem_questions(area);
CREATE INDEX IF NOT EXISTS idx_enem_questions_num ON public.enem_questions(num_questao);

-- 4. Extrair num_questao do campo 'id' (formato: questao_01, questao_02, etc)
UPDATE public.enem_questions
SET num_questao = CAST(REGEXP_REPLACE(id, '[^0-9]', '', 'g') AS INTEGER)
WHERE num_questao IS NULL AND id IS NOT NULL AND id ~ '[0-9]';

-- 5. Preencher area com valor padrão onde está NULL
-- (O CSV importado pode não ter essa coluna, então definimos 'Geral')
UPDATE public.enem_questions
SET area = 'Geral'
WHERE area IS NULL;

-- 6. Verificar resultado
SELECT
    COUNT(*) as total,
    COUNT(area) as com_area,
    COUNT(num_questao) as com_numero,
    COUNT(DISTINCT area) as areas_distintas,
    COUNT(DISTINCT ano) as anos_distintos
FROM public.enem_questions;

-- 7. Listar áreas disponíveis
SELECT DISTINCT area, COUNT(*) as quantidade
FROM public.enem_questions
GROUP BY area
ORDER BY quantidade DESC;
