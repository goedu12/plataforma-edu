-- ================================================================
-- IDENTIFICAR QUESTÕES PROBLEMÁTICAS NO ENEM
-- Execute cada seção para identificar diferentes tipos de problemas
-- ================================================================

-- ============================================================
-- 1. QUESTÕES COM CONTEXTO DUPLICADO (mesmo texto repetido)
-- ============================================================
SELECT id, ano,
       LEFT(contexto, 100) as inicio_contexto,
       LENGTH(contexto) as tamanho,
       CASE
         WHEN contexto LIKE CONCAT('%', LEFT(contexto, 50), '%', LEFT(contexto, 50), '%')
         THEN 'POSSÍVEL DUPLICAÇÃO'
         ELSE 'OK'
       END as status
FROM public.enem_questions
WHERE contexto IS NOT NULL
ORDER BY LENGTH(contexto) DESC
LIMIT 20;

-- ============================================================
-- 2. QUESTÕES TOTALMENTE DUPLICADAS (mesmo ano + mesmo contexto)
-- ============================================================
SELECT ano, LEFT(contexto, 80) as contexto_resumo, COUNT(*) as quantidade
FROM public.enem_questions
GROUP BY ano, LEFT(contexto, 80)
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- ============================================================
-- 3. IDs DUPLICADOS
-- ============================================================
SELECT id, COUNT(*) as quantidade
FROM public.enem_questions
GROUP BY id
HAVING COUNT(*) > 1;

-- ============================================================
-- 4. QUESTÕES COM TEXTO MUITO LONGO (possível concatenação)
-- ============================================================
SELECT id, ano, LENGTH(contexto) as tamanho,
       LEFT(contexto, 150) as inicio
FROM public.enem_questions
WHERE LENGTH(contexto) > 2000
ORDER BY LENGTH(contexto) DESC;

-- ============================================================
-- 5. QUESTÕES COM PADRÕES ESTRANHOS NO TEXTO
-- ============================================================
SELECT id, ano, LEFT(contexto, 100) as contexto_inicio
FROM public.enem_questions
WHERE contexto ~ '\n\n\n'           -- Muitas quebras de linha
   OR contexto ~ '(\.\s+){5,}'       -- Muitos pontos seguidos
   OR contexto ~ 'QUESTÃO [0-9]+'    -- Cabeçalho de questão dentro do texto
   OR contexto LIKE '%ENEM 20%ENEM 20%'  -- Ano aparece duas vezes
LIMIT 20;
