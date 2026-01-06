-- ================================================================
-- DIAGNÓSTICO COMPLETO - QUESTÕES ENEM
-- ================================================================
-- Execute este script no Supabase SQL Editor para identificar
-- todos os problemas de qualidade dos dados
-- ================================================================

-- ████████████████████████████████████████████████████████████████
-- 1. VISÃO GERAL DO BANCO
-- ████████████████████████████████████████████████████████████████

SELECT '=== VISÃO GERAL ===' as diagnostico;

SELECT
    COUNT(*) as total_questoes,
    COUNT(DISTINCT ano_prova) as anos_diferentes,
    COUNT(DISTINCT area) as areas_diferentes,
    MIN(ano_prova) as ano_mais_antigo,
    MAX(ano_prova) as ano_mais_recente
FROM questoes_enem;

-- ████████████████████████████████████████████████████████████████
-- 2. DISTRIBUIÇÃO POR ANO E ÁREA
-- ████████████████████████████████████████████████████████████████

SELECT '=== QUESTÕES POR ANO ===' as diagnostico;

SELECT
    ano_prova,
    COUNT(*) as quantidade
FROM questoes_enem
GROUP BY ano_prova
ORDER BY ano_prova DESC;

SELECT '=== QUESTÕES POR ÁREA ===' as diagnostico;

SELECT
    area,
    COUNT(*) as quantidade
FROM questoes_enem
GROUP BY area
ORDER BY quantidade DESC;

-- ████████████████████████████████████████████████████████████████
-- 3. VERIFICAR CAMPOS OBRIGATÓRIOS VAZIOS/NULOS
-- ████████████████████████████████████████████████████████████████

SELECT '=== CAMPOS VAZIOS/NULOS ===' as diagnostico;

SELECT
    'contexto vazio' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE contexto IS NULL OR TRIM(contexto) = ''
UNION ALL
SELECT
    'alternativa_a vazia' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE alternativa_a IS NULL OR TRIM(alternativa_a) = ''
UNION ALL
SELECT
    'alternativa_b vazia' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE alternativa_b IS NULL OR TRIM(alternativa_b) = ''
UNION ALL
SELECT
    'alternativa_c vazia' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE alternativa_c IS NULL OR TRIM(alternativa_c) = ''
UNION ALL
SELECT
    'alternativa_d vazia' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE alternativa_d IS NULL OR TRIM(alternativa_d) = ''
UNION ALL
SELECT
    'alternativa_e vazia' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE alternativa_e IS NULL OR TRIM(alternativa_e) = ''
UNION ALL
SELECT
    'resposta_correta vazia' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE resposta_correta IS NULL OR TRIM(resposta_correta) = ''
UNION ALL
SELECT
    'titulo vazio' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE titulo IS NULL OR TRIM(titulo) = '';

-- ████████████████████████████████████████████████████████████████
-- 4. VERIFICAR RESPOSTA CORRETA INVÁLIDA
-- ████████████████████████████████████████████████████████████████

SELECT '=== RESPOSTAS CORRETAS ===' as diagnostico;

SELECT
    resposta_correta,
    COUNT(*) as quantidade
FROM questoes_enem
GROUP BY resposta_correta
ORDER BY resposta_correta;

-- Respostas inválidas (fora de A-E)
SELECT '=== RESPOSTAS INVÁLIDAS (fora de A-E) ===' as diagnostico;

SELECT
    id,
    id_api,
    resposta_correta,
    LENGTH(resposta_correta) as tamanho
FROM questoes_enem
WHERE resposta_correta NOT IN ('A', 'B', 'C', 'D', 'E')
   OR LENGTH(resposta_correta) != 1
LIMIT 20;

-- ████████████████████████████████████████████████████████████████
-- 5. VERIFICAR CARACTERES ESTRANHOS/ENCODING
-- ████████████████████████████████████████████████████████████████

SELECT '=== PROBLEMAS DE ENCODING ===' as diagnostico;

-- Caracteres de substituição Unicode (indica encoding quebrado)
SELECT
    'Caractere substituto (�)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE contexto LIKE '%�%'
   OR alternativa_a LIKE '%�%'
   OR alternativa_b LIKE '%�%'
   OR alternativa_c LIKE '%�%'
   OR alternativa_d LIKE '%�%'
   OR alternativa_e LIKE '%�%';

-- Sequências HTML não decodificadas
SELECT
    'HTML entities (&amp; &lt; etc)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE contexto LIKE '%&amp;%'
   OR contexto LIKE '%&lt;%'
   OR contexto LIKE '%&gt;%'
   OR contexto LIKE '%&nbsp;%'
   OR contexto LIKE '%&#%';

-- Barras invertidas escapadas
SELECT
    'Escapes (\\n \\t etc)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE contexto LIKE '%\\n%'
   OR contexto LIKE '%\\t%'
   OR contexto LIKE '%\\r%';

-- LaTeX não renderizado
SELECT
    'LaTeX ($...$ ou \\frac etc)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE contexto LIKE '%$%'
   OR contexto LIKE '%\\frac%'
   OR contexto LIKE '%\\sqrt%'
   OR alternativa_a LIKE '%$%'
   OR alternativa_a LIKE '%\\frac%';

-- ████████████████████████████████████████████████████████████████
-- 6. VERIFICAR VALORES NAN/NULL COMO STRING
-- ████████████████████████████████████████████████████████████████

SELECT '=== VALORES NAN/NONE COMO TEXTO ===' as diagnostico;

SELECT
    'nan/NaN/None em contexto' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE LOWER(contexto) IN ('nan', 'none', 'null', 'undefined')
   OR contexto = 'NaN'
UNION ALL
SELECT
    'nan/NaN/None em alternativas' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE LOWER(alternativa_a) IN ('nan', 'none', 'null')
   OR LOWER(alternativa_b) IN ('nan', 'none', 'null')
   OR LOWER(alternativa_c) IN ('nan', 'none', 'null')
   OR LOWER(alternativa_d) IN ('nan', 'none', 'null')
   OR LOWER(alternativa_e) IN ('nan', 'none', 'null');

-- ████████████████████████████████████████████████████████████████
-- 7. VERIFICAR DUPLICATAS
-- ████████████████████████████████████████████████████████████████

SELECT '=== DUPLICATAS ===' as diagnostico;

-- Por id_api
SELECT
    'IDs API duplicados' as problema,
    COUNT(*) - COUNT(DISTINCT id_api) as quantidade
FROM questoes_enem
WHERE id_api IS NOT NULL;

-- Por conteúdo (contexto idêntico)
SELECT
    'Contextos idênticos' as problema,
    COUNT(*) as quantidade
FROM (
    SELECT contexto
    FROM questoes_enem
    GROUP BY contexto
    HAVING COUNT(*) > 1
) duplicados;

-- ████████████████████████████████████████████████████████████████
-- 8. VERIFICAR ÁREAS E SUBÁREAS VÁLIDAS
-- ████████████████████████████████████████████████████████████████

SELECT '=== ÁREAS CADASTRADAS ===' as diagnostico;

SELECT
    area,
    subarea,
    COUNT(*) as quantidade
FROM questoes_enem
GROUP BY area, subarea
ORDER BY area, subarea;

-- Áreas inválidas (fora do esperado)
SELECT '=== ÁREAS POSSIVELMENTE INVÁLIDAS ===' as diagnostico;

SELECT DISTINCT area
FROM questoes_enem
WHERE area NOT IN (
    'ciencias-natureza',
    'matematica',
    'linguagens',
    'ciencias-humanas'
);

-- ████████████████████████████████████████████████████████████████
-- 9. VERIFICAR TAMANHO DOS CAMPOS
-- ████████████████████████████████████████████████████████████████

SELECT '=== TAMANHO DOS CAMPOS ===' as diagnostico;

SELECT
    'Contexto muito curto (<10 chars)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE LENGTH(contexto) < 10 AND contexto IS NOT NULL
UNION ALL
SELECT
    'Contexto muito longo (>10000 chars)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE LENGTH(contexto) > 10000
UNION ALL
SELECT
    'Alternativas muito curtas (<1 char)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE LENGTH(alternativa_a) < 1
   OR LENGTH(alternativa_b) < 1
   OR LENGTH(alternativa_c) < 1
   OR LENGTH(alternativa_d) < 1
   OR LENGTH(alternativa_e) < 1;

-- ████████████████████████████████████████████████████████████████
-- 10. AMOSTRA DE QUESTÕES PROBLEMÁTICAS
-- ████████████████████████████████████████████████████████████████

SELECT '=== AMOSTRA: QUESTÕES COM PROBLEMAS ===' as diagnostico;

SELECT
    id,
    ano_prova,
    area,
    LEFT(contexto, 100) as contexto_preview,
    resposta_correta,
    CASE
        WHEN contexto IS NULL OR TRIM(contexto) = '' THEN 'SEM CONTEXTO'
        WHEN resposta_correta NOT IN ('A','B','C','D','E') THEN 'RESPOSTA INVALIDA'
        WHEN contexto LIKE '%�%' THEN 'ENCODING QUEBRADO'
        WHEN LENGTH(contexto) < 10 THEN 'CONTEXTO CURTO'
        ELSE 'OUTRO'
    END as tipo_problema
FROM questoes_enem
WHERE contexto IS NULL
   OR TRIM(contexto) = ''
   OR resposta_correta NOT IN ('A','B','C','D','E')
   OR contexto LIKE '%�%'
   OR LENGTH(contexto) < 10
LIMIT 20;

-- ████████████████████████████████████████████████████████████████
-- 11. VERIFICAR IMAGENS
-- ████████████████████████████████████████████████████████████████

SELECT '=== IMAGENS ===' as diagnostico;

SELECT
    'Questões com imagem principal' as tipo,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != ''
UNION ALL
SELECT
    'Questões sem imagem' as tipo,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE imagem_principal IS NULL OR TRIM(imagem_principal) = '';

-- URLs de imagem válidas
SELECT '=== AMOSTRA URLs DE IMAGEM ===' as diagnostico;

SELECT
    id,
    LEFT(imagem_principal, 100) as url_preview
FROM questoes_enem
WHERE imagem_principal IS NOT NULL
  AND TRIM(imagem_principal) != ''
LIMIT 5;

-- ████████████████████████████████████████████████████████████████
-- 12. RESUMO FINAL
-- ████████████████████████████████████████████████████████████████

SELECT '=== RESUMO FINAL ===' as diagnostico;

SELECT
    (SELECT COUNT(*) FROM questoes_enem) as total_questoes,
    (SELECT COUNT(*) FROM questoes_enem WHERE contexto IS NULL OR TRIM(contexto) = '') as sem_contexto,
    (SELECT COUNT(*) FROM questoes_enem WHERE resposta_correta NOT IN ('A','B','C','D','E')) as resposta_invalida,
    (SELECT COUNT(*) FROM questoes_enem WHERE contexto LIKE '%�%') as encoding_quebrado,
    (SELECT COUNT(*) FROM questoes_enem WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '') as com_imagem;
