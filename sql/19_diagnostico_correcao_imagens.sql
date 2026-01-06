-- ================================================================
-- DIAGNÓSTICO E CORREÇÃO DE IMAGENS - QUESTÕES ENEM
-- ================================================================
-- Execute este script no Supabase SQL Editor para:
-- 1. Diagnosticar problemas com URLs de imagens
-- 2. Identificar padrões inválidos
-- 3. Corrigir/limpar dados problemáticos
-- ================================================================

-- ████████████████████████████████████████████████████████████████
-- SEÇÃO 1: DIAGNÓSTICO COMPLETO DE IMAGENS
-- ████████████████████████████████████████████████████████████████

-- 1.1 Visão geral de imagens no banco
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  DIAGNÓSTICO COMPLETO DE IMAGENS - QUESTÕES ENEM';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
END $$;

SELECT '=== ESTATÍSTICAS GERAIS DE IMAGENS ===' as secao;

WITH stats AS (
    SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '') as com_img_principal,
        COUNT(*) FILTER (WHERE imagens_extras IS NOT NULL AND array_length(imagens_extras, 1) > 0) as com_imgs_extras,
        COUNT(*) FILTER (WHERE imagem_a IS NOT NULL AND TRIM(imagem_a) != '') as com_img_a,
        COUNT(*) FILTER (WHERE imagem_b IS NOT NULL AND TRIM(imagem_b) != '') as com_img_b,
        COUNT(*) FILTER (WHERE imagem_c IS NOT NULL AND TRIM(imagem_c) != '') as com_img_c,
        COUNT(*) FILTER (WHERE imagem_d IS NOT NULL AND TRIM(imagem_d) != '') as com_img_d,
        COUNT(*) FILTER (WHERE imagem_e IS NOT NULL AND TRIM(imagem_e) != '') as com_img_e
    FROM questoes_enem
)
SELECT
    total as "Total Questões",
    com_img_principal as "Com Imagem Principal",
    com_imgs_extras as "Com Imagens Extras",
    com_img_a as "Com Imagem Alt A",
    com_img_b as "Com Imagem Alt B",
    com_img_c as "Com Imagem Alt C",
    com_img_d as "Com Imagem Alt D",
    com_img_e as "Com Imagem Alt E",
    ROUND((com_img_principal::numeric / NULLIF(total, 0)) * 100, 1) as "% Com Imagem"
FROM stats;

-- 1.2 Distribuição de imagens por ano
SELECT '=== IMAGENS POR ANO ===' as secao;

SELECT
    ano_prova,
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '') as com_imagem,
    ROUND(
        (COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '')::numeric /
         NULLIF(COUNT(*), 0)) * 100, 1
    ) as percentual
FROM questoes_enem
GROUP BY ano_prova
ORDER BY ano_prova DESC;

-- 1.3 Distribuição por área
SELECT '=== IMAGENS POR ÁREA ===' as secao;

SELECT
    area,
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '') as com_imagem,
    ROUND(
        (COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '')::numeric /
         NULLIF(COUNT(*), 0)) * 100, 1
    ) as percentual
FROM questoes_enem
GROUP BY area
ORDER BY area;

-- ████████████████████████████████████████████████████████████████
-- SEÇÃO 2: IDENTIFICAÇÃO DE PADRÕES INVÁLIDOS
-- ████████████████████████████████████████████████████████████████

SELECT '=== PADRÕES INVÁLIDOS ENCONTRADOS ===' as secao;

-- 2.1 URLs com valores 'nan', 'None', 'null', 'undefined'
SELECT
    'Valores nan/None/null/undefined em imagem_principal' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE LOWER(TRIM(imagem_principal)) IN ('nan', 'none', 'null', 'undefined', 'nan', 'none')
   OR imagem_principal = 'NaN'
   OR imagem_principal ~ '^(nan|none|null|undefined)$'
UNION ALL
SELECT
    'Valores nan/None/null em alternativas' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE LOWER(TRIM(imagem_a)) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(imagem_b)) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(imagem_c)) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(imagem_d)) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(imagem_e)) IN ('nan', 'none', 'null', 'undefined');

-- 2.2 URLs vazias ou só espaços
SELECT
    'URLs vazias/espaços' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE (imagem_principal IS NOT NULL AND TRIM(imagem_principal) = '')
   OR (imagem_a IS NOT NULL AND TRIM(imagem_a) = '')
   OR (imagem_b IS NOT NULL AND TRIM(imagem_b) = '')
   OR (imagem_c IS NOT NULL AND TRIM(imagem_c) = '')
   OR (imagem_d IS NOT NULL AND TRIM(imagem_d) = '')
   OR (imagem_e IS NOT NULL AND TRIM(imagem_e) = '');

-- 2.3 URLs localhost ou file://
SELECT
    'URLs localhost/file://' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE imagem_principal ~ '^(http://localhost|file://)'
   OR imagem_a ~ '^(http://localhost|file://)'
   OR imagem_b ~ '^(http://localhost|file://)'
   OR imagem_c ~ '^(http://localhost|file://)'
   OR imagem_d ~ '^(http://localhost|file://)'
   OR imagem_e ~ '^(http://localhost|file://)';

-- 2.4 URLs malformadas (não começam com http/https/data:)
SELECT
    'URLs malformadas (não http/https/data:)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE imagem_principal IS NOT NULL
  AND TRIM(imagem_principal) != ''
  AND imagem_principal !~ '^(https?://|data:image/)'
  AND LOWER(imagem_principal) NOT IN ('nan', 'none', 'null', 'undefined');

-- 2.5 Objetos serializados incorretamente
SELECT
    'Objetos [object Object]' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE imagem_principal LIKE '%[object%'
   OR imagem_a LIKE '%[object%'
   OR imagem_b LIKE '%[object%';

-- 2.6 Tags HTML em vez de URLs
SELECT
    'Tags HTML (<img, <figure, etc)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE imagem_principal ~ '^<(img|figure|div|span)'
   OR imagem_a ~ '^<(img|figure|div|span)';

-- ████████████████████████████████████████████████████████████████
-- SEÇÃO 3: AMOSTRA DE URLs PROBLEMÁTICAS
-- ████████████████████████████████████████████████████████████████

SELECT '=== AMOSTRA: URLs PROBLEMÁTICAS ===' as secao;

SELECT
    id,
    id_api,
    ano_prova,
    'imagem_principal' as campo,
    LEFT(imagem_principal, 80) as url_preview,
    CASE
        WHEN LOWER(TRIM(imagem_principal)) IN ('nan', 'none', 'null', 'undefined') THEN 'VALOR_INVALIDO'
        WHEN TRIM(imagem_principal) = '' THEN 'VAZIO'
        WHEN imagem_principal ~ '^http://localhost' THEN 'LOCALHOST'
        WHEN imagem_principal ~ '^file://' THEN 'FILE_LOCAL'
        WHEN imagem_principal LIKE '%[object%' THEN 'OBJETO_JS'
        WHEN imagem_principal ~ '^<' THEN 'HTML_TAG'
        WHEN imagem_principal !~ '^(https?://|data:image/)' THEN 'URL_MALFORMADA'
        ELSE 'VERIFICAR'
    END as tipo_problema
FROM questoes_enem
WHERE imagem_principal IS NOT NULL
  AND (
    LOWER(TRIM(imagem_principal)) IN ('nan', 'none', 'null', 'undefined')
    OR TRIM(imagem_principal) = ''
    OR imagem_principal ~ '^(http://localhost|file://)'
    OR imagem_principal LIKE '%[object%'
    OR imagem_principal ~ '^<'
    OR (imagem_principal !~ '^(https?://|data:image/)' AND LENGTH(imagem_principal) < 50)
  )
LIMIT 20;

-- ████████████████████████████████████████████████████████████████
-- SEÇÃO 4: ANÁLISE DE PADRÕES DE URL VÁLIDOS
-- ████████████████████████████████████████████████████████████████

SELECT '=== PADRÕES DE URL ENCONTRADOS ===' as secao;

SELECT
    CASE
        WHEN imagem_principal ~ '^https://api\.enem\.dev/' THEN 'api.enem.dev'
        WHEN imagem_principal ~ '^https://.*supabase.*storage' THEN 'Supabase Storage'
        WHEN imagem_principal ~ '^https://.*cloudinary' THEN 'Cloudinary'
        WHEN imagem_principal ~ '^https://.*s3\.amazonaws\.com' THEN 'AWS S3'
        WHEN imagem_principal ~ '^https://.*googleusercontent' THEN 'Google'
        WHEN imagem_principal ~ '^https://.*imgur' THEN 'Imgur'
        WHEN imagem_principal ~ '^data:image/' THEN 'Data URI (Base64)'
        WHEN imagem_principal ~ '^https?://' THEN 'Outro HTTPS'
        ELSE 'Desconhecido'
    END as origem,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE imagem_principal IS NOT NULL
  AND TRIM(imagem_principal) != ''
  AND LOWER(TRIM(imagem_principal)) NOT IN ('nan', 'none', 'null', 'undefined')
GROUP BY 1
ORDER BY quantidade DESC;

-- Amostra de URLs válidas por origem
SELECT '=== AMOSTRA: URLs VÁLIDAS ===' as secao;

SELECT
    id_api,
    ano_prova,
    LEFT(imagem_principal, 100) as url_preview
FROM questoes_enem
WHERE imagem_principal ~ '^https?://'
  AND LOWER(TRIM(imagem_principal)) NOT IN ('nan', 'none', 'null', 'undefined')
LIMIT 10;

-- ████████████████████████████████████████████████████████████████
-- SEÇÃO 5: VERIFICAR QUESTÕES DA API ENEM.DEV
-- ████████████████████████████████████████████████████████████████

SELECT '=== QUESTÕES IMPORTADAS DA API ENEM.DEV ===' as secao;

SELECT
    fonte,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != ''
                     AND LOWER(TRIM(imagem_principal)) NOT IN ('nan', 'none', 'null')) as com_imagem_valida
FROM questoes_enem
GROUP BY fonte
ORDER BY total DESC;

-- Verificar se há questões com id_api mas sem fonte
SELECT
    'Questões com id_api sem fonte definida' as verificacao,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE id_api IS NOT NULL AND (fonte IS NULL OR fonte = '');

-- ████████████████████████████████████████████████████████████████
-- SEÇÃO 6: RESUMO DE PROBLEMAS
-- ████████████████████████████████████████████████████████████████

SELECT '=== RESUMO FINAL ===' as secao;

WITH problemas AS (
    SELECT
        COUNT(*) FILTER (WHERE LOWER(TRIM(imagem_principal)) IN ('nan', 'none', 'null', 'undefined')) as nan_none,
        COUNT(*) FILTER (WHERE TRIM(imagem_principal) = '' AND imagem_principal IS NOT NULL) as vazios,
        COUNT(*) FILTER (WHERE imagem_principal ~ '^http://localhost') as localhost,
        COUNT(*) FILTER (WHERE imagem_principal ~ '^file://') as file_local,
        COUNT(*) FILTER (WHERE imagem_principal LIKE '%[object%') as objeto_js,
        COUNT(*) FILTER (WHERE imagem_principal ~ '^<') as html_tag,
        COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL
                         AND TRIM(imagem_principal) != ''
                         AND imagem_principal !~ '^(https?://|data:image/)'
                         AND LOWER(imagem_principal) NOT IN ('nan', 'none', 'null', 'undefined')) as malformadas
    FROM questoes_enem
)
SELECT
    (nan_none + vazios + localhost + file_local + objeto_js + html_tag + malformadas) as total_problemas,
    nan_none as "nan/None/null",
    vazios as "Vazios",
    localhost as "Localhost",
    file_local as "file://",
    objeto_js as "[object]",
    html_tag as "HTML Tags",
    malformadas as "URL Malformada"
FROM problemas;

-- ████████████████████████████████████████████████████████████████████
-- SEÇÃO 7: FUNÇÕES DE CORREÇÃO (NÃO EXECUTAM AUTOMATICAMENTE)
-- ████████████████████████████████████████████████████████████████████

-- ⚠️ AS CORREÇÕES ABAIXO ESTÃO COMENTADAS PARA SEGURANÇA
-- DESCOMENTE E EXECUTE MANUALMENTE APÓS VERIFICAR O DIAGNÓSTICO

/*
-- ═══════════════════════════════════════════════════════════════════
-- CORREÇÃO 1: Limpar valores 'nan', 'None', 'null', 'undefined'
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Imagem principal
    UPDATE questoes_enem
    SET imagem_principal = NULL,
        atualizado_em = NOW()
    WHERE LOWER(TRIM(imagem_principal)) IN ('nan', 'none', 'null', 'undefined', 'nan')
       OR imagem_principal = 'NaN';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Corrigidos % valores inválidos em imagem_principal', v_count;

    -- Alternativas
    UPDATE questoes_enem
    SET
        imagem_a = CASE WHEN LOWER(TRIM(imagem_a)) IN ('nan', 'none', 'null', 'undefined') THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN LOWER(TRIM(imagem_b)) IN ('nan', 'none', 'null', 'undefined') THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN LOWER(TRIM(imagem_c)) IN ('nan', 'none', 'null', 'undefined') THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN LOWER(TRIM(imagem_d)) IN ('nan', 'none', 'null', 'undefined') THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN LOWER(TRIM(imagem_e)) IN ('nan', 'none', 'null', 'undefined') THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE LOWER(TRIM(imagem_a)) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(imagem_b)) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(imagem_c)) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(imagem_d)) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(imagem_e)) IN ('nan', 'none', 'null', 'undefined');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Corrigidos % valores inválidos em alternativas', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- CORREÇÃO 2: Limpar URLs vazias (string vazia mas não NULL)
-- ═══════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET
    imagem_principal = CASE WHEN TRIM(imagem_principal) = '' THEN NULL ELSE imagem_principal END,
    imagem_a = CASE WHEN TRIM(imagem_a) = '' THEN NULL ELSE imagem_a END,
    imagem_b = CASE WHEN TRIM(imagem_b) = '' THEN NULL ELSE imagem_b END,
    imagem_c = CASE WHEN TRIM(imagem_c) = '' THEN NULL ELSE imagem_c END,
    imagem_d = CASE WHEN TRIM(imagem_d) = '' THEN NULL ELSE imagem_d END,
    imagem_e = CASE WHEN TRIM(imagem_e) = '' THEN NULL ELSE imagem_e END,
    atualizado_em = NOW()
WHERE TRIM(COALESCE(imagem_principal, '')) = ''
   OR TRIM(COALESCE(imagem_a, '')) = ''
   OR TRIM(COALESCE(imagem_b, '')) = ''
   OR TRIM(COALESCE(imagem_c, '')) = ''
   OR TRIM(COALESCE(imagem_d, '')) = ''
   OR TRIM(COALESCE(imagem_e, '')) = '';

-- ═══════════════════════════════════════════════════════════════════
-- CORREÇÃO 3: Limpar URLs localhost e file://
-- ═══════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET
    imagem_principal = CASE WHEN imagem_principal ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_principal END,
    imagem_a = CASE WHEN imagem_a ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_a END,
    imagem_b = CASE WHEN imagem_b ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_b END,
    imagem_c = CASE WHEN imagem_c ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_c END,
    imagem_d = CASE WHEN imagem_d ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_d END,
    imagem_e = CASE WHEN imagem_e ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_e END,
    atualizado_em = NOW()
WHERE imagem_principal ~ '^(http://localhost|file://)'
   OR imagem_a ~ '^(http://localhost|file://)'
   OR imagem_b ~ '^(http://localhost|file://)'
   OR imagem_c ~ '^(http://localhost|file://)'
   OR imagem_d ~ '^(http://localhost|file://)'
   OR imagem_e ~ '^(http://localhost|file://)';

-- ═══════════════════════════════════════════════════════════════════
-- CORREÇÃO 4: Limpar objetos JS e tags HTML
-- ═══════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET
    imagem_principal = NULL,
    atualizado_em = NOW()
WHERE imagem_principal LIKE '%[object%'
   OR imagem_principal ~ '^<(img|figure|div|span)';

-- ═══════════════════════════════════════════════════════════════════
-- CORREÇÃO 5: Limpar imagens_extras com valores inválidos
-- ═══════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET
    imagens_extras = (
        SELECT array_agg(elem)
        FROM unnest(imagens_extras) AS elem
        WHERE elem IS NOT NULL
          AND TRIM(elem) != ''
          AND LOWER(TRIM(elem)) NOT IN ('nan', 'none', 'null', 'undefined')
          AND elem ~ '^(https?://|data:image/)'
    ),
    atualizado_em = NOW()
WHERE imagens_extras IS NOT NULL
  AND array_length(imagens_extras, 1) > 0;

*/

-- ████████████████████████████████████████████████████████████████████
-- SEÇÃO 8: VERIFICAÇÃO PÓS-CORREÇÃO
-- ████████████████████████████████████████████████████████████████████

SELECT '=== VERIFICAÇÃO FINAL ===' as secao;

SELECT
    (SELECT COUNT(*) FROM questoes_enem) as total_questoes,
    (SELECT COUNT(*) FROM questoes_enem WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '') as com_imagem_principal,
    (SELECT COUNT(*) FROM questoes_enem
     WHERE imagem_principal IS NOT NULL
       AND TRIM(imagem_principal) != ''
       AND imagem_principal ~ '^(https?://|data:image/)'
       AND LOWER(TRIM(imagem_principal)) NOT IN ('nan', 'none', 'null', 'undefined')
    ) as imagens_validas,
    (SELECT COUNT(*) FROM questoes_enem
     WHERE imagem_principal IS NOT NULL
       AND (
         LOWER(TRIM(imagem_principal)) IN ('nan', 'none', 'null', 'undefined')
         OR TRIM(imagem_principal) = ''
         OR imagem_principal !~ '^(https?://|data:image/)'
       )
    ) as imagens_problematicas;

-- Finalização
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  DIAGNÓSTICO CONCLUÍDO';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '  Para aplicar correções, descomente a SEÇÃO 7 e execute novamente.';
    RAISE NOTICE '';
END $$;
