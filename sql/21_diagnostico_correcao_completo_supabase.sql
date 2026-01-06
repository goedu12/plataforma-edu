-- ════════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO E CORREÇÃO COMPLETO DE IMAGENS - QUESTÕES ENEM
-- ════════════════════════════════════════════════════════════════════════════
-- Execute este script completo no Supabase SQL Editor
-- Ele fará diagnóstico e correção em uma única execução
-- ════════════════════════════════════════════════════════════════════════════

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                        PARTE 1: DIAGNÓSTICO                              ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

DO $$ BEGIN RAISE NOTICE ''; END $$;
DO $$ BEGIN RAISE NOTICE '════════════════════════════════════════════════════════════════════'; END $$;
DO $$ BEGIN RAISE NOTICE '         DIAGNÓSTICO DE IMAGENS - QUESTÕES ENEM'; END $$;
DO $$ BEGIN RAISE NOTICE '════════════════════════════════════════════════════════════════════'; END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1.1 ESTATÍSTICAS GERAIS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ ESTATÍSTICAS GERAIS DE IMAGENS ═══' as secao;

SELECT
    COUNT(*) as "Total Questões",
    COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '') as "Com Imagem Principal",
    COUNT(*) FILTER (WHERE imagens_extras IS NOT NULL AND array_length(imagens_extras, 1) > 0) as "Com Imagens Extras",
    COUNT(*) FILTER (WHERE
        (imagem_a IS NOT NULL AND TRIM(imagem_a) != '') OR
        (imagem_b IS NOT NULL AND TRIM(imagem_b) != '') OR
        (imagem_c IS NOT NULL AND TRIM(imagem_c) != '') OR
        (imagem_d IS NOT NULL AND TRIM(imagem_d) != '') OR
        (imagem_e IS NOT NULL AND TRIM(imagem_e) != '')
    ) as "Com Imagem Alternativas",
    ROUND(
        (COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '')::numeric /
         NULLIF(COUNT(*), 0)) * 100, 1
    ) as "% Com Imagem"
FROM questoes_enem;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1.2 DISTRIBUIÇÃO POR ANO
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ IMAGENS POR ANO ═══' as secao;

SELECT
    ano_prova as "Ano",
    COUNT(*) as "Total",
    COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != ''
                     AND LOWER(TRIM(imagem_principal)) NOT IN ('nan', 'none', 'null', 'undefined')) as "Com Imagem Válida",
    ROUND(
        (COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != ''
                          AND LOWER(TRIM(imagem_principal)) NOT IN ('nan', 'none', 'null', 'undefined'))::numeric /
         NULLIF(COUNT(*), 0)) * 100, 1
    ) as "%"
FROM questoes_enem
GROUP BY ano_prova
ORDER BY ano_prova DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1.3 DISTRIBUIÇÃO POR ÁREA
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ IMAGENS POR ÁREA ═══' as secao;

SELECT
    area as "Área",
    COUNT(*) as "Total",
    COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != ''
                     AND LOWER(TRIM(imagem_principal)) NOT IN ('nan', 'none', 'null', 'undefined')) as "Com Imagem Válida"
FROM questoes_enem
GROUP BY area
ORDER BY area;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1.4 IDENTIFICAR PADRÕES INVÁLIDOS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PROBLEMAS ENCONTRADOS ═══' as secao;

WITH problemas AS (
    SELECT
        -- Valores nan/None/null/undefined
        COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(imagem_principal, ''))) IN ('nan', 'none', 'null', 'undefined', 'nan')) as nan_principal,
        COUNT(*) FILTER (WHERE
            LOWER(TRIM(COALESCE(imagem_a, ''))) IN ('nan', 'none', 'null', 'undefined') OR
            LOWER(TRIM(COALESCE(imagem_b, ''))) IN ('nan', 'none', 'null', 'undefined') OR
            LOWER(TRIM(COALESCE(imagem_c, ''))) IN ('nan', 'none', 'null', 'undefined') OR
            LOWER(TRIM(COALESCE(imagem_d, ''))) IN ('nan', 'none', 'null', 'undefined') OR
            LOWER(TRIM(COALESCE(imagem_e, ''))) IN ('nan', 'none', 'null', 'undefined')
        ) as nan_alternativas,

        -- Strings vazias
        COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) = '') as vazio_principal,

        -- URLs localhost/file://
        COUNT(*) FILTER (WHERE COALESCE(imagem_principal, '') ~ '^(http://localhost|file://)') as localhost_principal,

        -- Objetos [object Object]
        COUNT(*) FILTER (WHERE COALESCE(imagem_principal, '') LIKE '%[object%') as objeto_principal,

        -- Tags HTML
        COUNT(*) FILTER (WHERE COALESCE(imagem_principal, '') ~ '^<(img|figure|div)') as html_principal,

        -- URLs malformadas (não http/https/data:)
        COUNT(*) FILTER (WHERE
            imagem_principal IS NOT NULL
            AND TRIM(imagem_principal) != ''
            AND LOWER(TRIM(imagem_principal)) NOT IN ('nan', 'none', 'null', 'undefined')
            AND imagem_principal !~ '^(https?://|data:image/)'
        ) as malformada_principal
    FROM questoes_enem
)
SELECT
    'nan/None/null/undefined em imagem_principal' as "Problema",
    nan_principal as "Quantidade"
FROM problemas WHERE nan_principal > 0
UNION ALL
SELECT
    'nan/None/null/undefined em alternativas' as "Problema",
    nan_alternativas as "Quantidade"
FROM problemas WHERE nan_alternativas > 0
UNION ALL
SELECT
    'Strings vazias em imagem_principal' as "Problema",
    vazio_principal as "Quantidade"
FROM problemas WHERE vazio_principal > 0
UNION ALL
SELECT
    'URLs localhost/file://' as "Problema",
    localhost_principal as "Quantidade"
FROM problemas WHERE localhost_principal > 0
UNION ALL
SELECT
    'Objetos [object Object]' as "Problema",
    objeto_principal as "Quantidade"
FROM problemas WHERE objeto_principal > 0
UNION ALL
SELECT
    'Tags HTML (<img, <figure, etc)' as "Problema",
    html_principal as "Quantidade"
FROM problemas WHERE html_principal > 0
UNION ALL
SELECT
    'URLs malformadas' as "Problema",
    malformada_principal as "Quantidade"
FROM problemas WHERE malformada_principal > 0;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1.5 AMOSTRA DE URLs PROBLEMÁTICAS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ AMOSTRA: URLs PROBLEMÁTICAS ═══' as secao;

SELECT
    id,
    id_api as "ID API",
    ano_prova as "Ano",
    LEFT(imagem_principal, 60) as "URL (primeiros 60 chars)",
    CASE
        WHEN LOWER(TRIM(imagem_principal)) IN ('nan', 'none', 'null', 'undefined') THEN 'VALOR_INVALIDO'
        WHEN TRIM(imagem_principal) = '' THEN 'VAZIO'
        WHEN imagem_principal ~ '^http://localhost' THEN 'LOCALHOST'
        WHEN imagem_principal ~ '^file://' THEN 'FILE_LOCAL'
        WHEN imagem_principal LIKE '%[object%' THEN 'OBJETO_JS'
        WHEN imagem_principal ~ '^<' THEN 'HTML_TAG'
        WHEN imagem_principal !~ '^(https?://|data:image/)' THEN 'URL_MALFORMADA'
        ELSE 'VERIFICAR'
    END as "Tipo Problema"
FROM questoes_enem
WHERE imagem_principal IS NOT NULL
  AND (
    LOWER(TRIM(imagem_principal)) IN ('nan', 'none', 'null', 'undefined')
    OR TRIM(imagem_principal) = ''
    OR imagem_principal ~ '^(http://localhost|file://)'
    OR imagem_principal LIKE '%[object%'
    OR imagem_principal ~ '^<'
    OR (imagem_principal !~ '^(https?://|data:image/)' AND LENGTH(imagem_principal) < 100)
  )
ORDER BY ano_prova DESC
LIMIT 15;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1.6 AMOSTRA DE URLs VÁLIDAS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ AMOSTRA: URLs VÁLIDAS ═══' as secao;

SELECT
    id_api as "ID API",
    ano_prova as "Ano",
    LEFT(imagem_principal, 80) as "URL (primeiros 80 chars)"
FROM questoes_enem
WHERE imagem_principal ~ '^https?://'
  AND LOWER(TRIM(imagem_principal)) NOT IN ('nan', 'none', 'null', 'undefined')
ORDER BY ano_prova DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1.7 ORIGENS DAS IMAGENS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ ORIGENS DAS IMAGENS ═══' as secao;

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
        WHEN LOWER(TRIM(imagem_principal)) IN ('nan', 'none', 'null', 'undefined') THEN 'INVÁLIDO (nan/null)'
        WHEN TRIM(imagem_principal) = '' THEN 'VAZIO'
        ELSE 'Desconhecido/Malformado'
    END as "Origem",
    COUNT(*) as "Quantidade"
FROM questoes_enem
WHERE imagem_principal IS NOT NULL
GROUP BY 1
ORDER BY "Quantidade" DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1.8 RESUMO PRÉ-CORREÇÃO
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ RESUMO PRÉ-CORREÇÃO ═══' as secao;

WITH stats AS (
    SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL) as com_campo,
        COUNT(*) FILTER (WHERE
            imagem_principal IS NOT NULL
            AND TRIM(imagem_principal) != ''
            AND imagem_principal ~ '^(https?://|data:image/)'
            AND LOWER(TRIM(imagem_principal)) NOT IN ('nan', 'none', 'null', 'undefined')
        ) as validas,
        COUNT(*) FILTER (WHERE
            imagem_principal IS NOT NULL
            AND (
                LOWER(TRIM(imagem_principal)) IN ('nan', 'none', 'null', 'undefined')
                OR TRIM(imagem_principal) = ''
                OR imagem_principal !~ '^(https?://|data:image/)'
            )
        ) as problematicas
    FROM questoes_enem
)
SELECT
    total as "Total Questões",
    com_campo as "Com Campo Preenchido",
    validas as "URLs Válidas",
    problematicas as "URLs Problemáticas",
    ROUND((validas::numeric / NULLIF(total, 0)) * 100, 1) as "% Válidas"
FROM stats;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                        PARTE 2: CORREÇÕES                                ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

DO $$ BEGIN RAISE NOTICE ''; END $$;
DO $$ BEGIN RAISE NOTICE '════════════════════════════════════════════════════════════════════'; END $$;
DO $$ BEGIN RAISE NOTICE '                    APLICANDO CORREÇÕES'; END $$;
DO $$ BEGIN RAISE NOTICE '════════════════════════════════════════════════════════════════════'; END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2.1 CORREÇÃO: Limpar valores nan/None/null/undefined
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_count INTEGER := 0;
    v_total INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 Correção 1: Limpando valores nan/None/null/undefined...';

    -- imagem_principal
    UPDATE questoes_enem
    SET imagem_principal = NULL, atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_principal, ''))) IN ('nan', 'none', 'null', 'undefined')
       OR imagem_principal = 'NaN';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN
        RAISE NOTICE '   ✓ imagem_principal: % registros', v_count;
        v_total := v_total + v_count;
    END IF;

    -- imagem_a
    UPDATE questoes_enem SET imagem_a = NULL, atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_a, ''))) IN ('nan', 'none', 'null', 'undefined');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN v_total := v_total + v_count; END IF;

    -- imagem_b
    UPDATE questoes_enem SET imagem_b = NULL, atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_b, ''))) IN ('nan', 'none', 'null', 'undefined');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN v_total := v_total + v_count; END IF;

    -- imagem_c
    UPDATE questoes_enem SET imagem_c = NULL, atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_c, ''))) IN ('nan', 'none', 'null', 'undefined');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN v_total := v_total + v_count; END IF;

    -- imagem_d
    UPDATE questoes_enem SET imagem_d = NULL, atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_d, ''))) IN ('nan', 'none', 'null', 'undefined');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN v_total := v_total + v_count; END IF;

    -- imagem_e
    UPDATE questoes_enem SET imagem_e = NULL, atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_e, ''))) IN ('nan', 'none', 'null', 'undefined');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN v_total := v_total + v_count; END IF;

    RAISE NOTICE '   ✅ Total Correção 1: % registros', v_total;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2.2 CORREÇÃO: Limpar strings vazias
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 Correção 2: Limpando strings vazias...';

    UPDATE questoes_enem
    SET
        imagem_principal = NULLIF(TRIM(COALESCE(imagem_principal, '')), ''),
        imagem_a = NULLIF(TRIM(COALESCE(imagem_a, '')), ''),
        imagem_b = NULLIF(TRIM(COALESCE(imagem_b, '')), ''),
        imagem_c = NULLIF(TRIM(COALESCE(imagem_c, '')), ''),
        imagem_d = NULLIF(TRIM(COALESCE(imagem_d, '')), ''),
        imagem_e = NULLIF(TRIM(COALESCE(imagem_e, '')), ''),
        atualizado_em = NOW()
    WHERE
        (imagem_principal IS NOT NULL AND TRIM(imagem_principal) = '') OR
        (imagem_a IS NOT NULL AND TRIM(imagem_a) = '') OR
        (imagem_b IS NOT NULL AND TRIM(imagem_b) = '') OR
        (imagem_c IS NOT NULL AND TRIM(imagem_c) = '') OR
        (imagem_d IS NOT NULL AND TRIM(imagem_d) = '') OR
        (imagem_e IS NOT NULL AND TRIM(imagem_e) = '');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Total Correção 2: % registros', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2.3 CORREÇÃO: Limpar URLs localhost e file://
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 Correção 3: Limpando URLs localhost/file://...';

    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN COALESCE(imagem_principal, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN COALESCE(imagem_a, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN COALESCE(imagem_b, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN COALESCE(imagem_c, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN COALESCE(imagem_d, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN COALESCE(imagem_e, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE
        COALESCE(imagem_principal, '') ~ '^(http://localhost|file://)' OR
        COALESCE(imagem_a, '') ~ '^(http://localhost|file://)' OR
        COALESCE(imagem_b, '') ~ '^(http://localhost|file://)' OR
        COALESCE(imagem_c, '') ~ '^(http://localhost|file://)' OR
        COALESCE(imagem_d, '') ~ '^(http://localhost|file://)' OR
        COALESCE(imagem_e, '') ~ '^(http://localhost|file://)';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Total Correção 3: % registros', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2.4 CORREÇÃO: Limpar objetos [object Object]
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 Correção 4: Limpando objetos [object Object]...';

    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN COALESCE(imagem_principal, '') LIKE '%[object%' THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN COALESCE(imagem_a, '') LIKE '%[object%' THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN COALESCE(imagem_b, '') LIKE '%[object%' THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN COALESCE(imagem_c, '') LIKE '%[object%' THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN COALESCE(imagem_d, '') LIKE '%[object%' THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN COALESCE(imagem_e, '') LIKE '%[object%' THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE
        COALESCE(imagem_principal, '') LIKE '%[object%' OR
        COALESCE(imagem_a, '') LIKE '%[object%' OR
        COALESCE(imagem_b, '') LIKE '%[object%' OR
        COALESCE(imagem_c, '') LIKE '%[object%' OR
        COALESCE(imagem_d, '') LIKE '%[object%' OR
        COALESCE(imagem_e, '') LIKE '%[object%';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Total Correção 4: % registros', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2.5 CORREÇÃO: Limpar tags HTML
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 Correção 5: Limpando tags HTML...';

    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN COALESCE(imagem_principal, '') ~ '^<(img|figure|div|span|a)' THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN COALESCE(imagem_a, '') ~ '^<(img|figure|div|span|a)' THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN COALESCE(imagem_b, '') ~ '^<(img|figure|div|span|a)' THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN COALESCE(imagem_c, '') ~ '^<(img|figure|div|span|a)' THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN COALESCE(imagem_d, '') ~ '^<(img|figure|div|span|a)' THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN COALESCE(imagem_e, '') ~ '^<(img|figure|div|span|a)' THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE
        COALESCE(imagem_principal, '') ~ '^<(img|figure|div|span|a)' OR
        COALESCE(imagem_a, '') ~ '^<(img|figure|div|span|a)' OR
        COALESCE(imagem_b, '') ~ '^<(img|figure|div|span|a)' OR
        COALESCE(imagem_c, '') ~ '^<(img|figure|div|span|a)' OR
        COALESCE(imagem_d, '') ~ '^<(img|figure|div|span|a)' OR
        COALESCE(imagem_e, '') ~ '^<(img|figure|div|span|a)';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Total Correção 5: % registros', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2.6 CORREÇÃO: Limpar array imagens_extras
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 Correção 6: Limpando array imagens_extras...';

    UPDATE questoes_enem
    SET
        imagens_extras = (
            SELECT CASE
                WHEN array_agg(elem) IS NULL THEN NULL
                ELSE array_agg(elem)
            END
            FROM unnest(imagens_extras) AS elem
            WHERE elem IS NOT NULL
              AND TRIM(elem) != ''
              AND LOWER(TRIM(elem)) NOT IN ('nan', 'none', 'null', 'undefined')
              AND elem ~ '^(https?://|data:image/)'
        ),
        atualizado_em = NOW()
    WHERE imagens_extras IS NOT NULL
      AND array_length(imagens_extras, 1) > 0
      AND EXISTS (
          SELECT 1 FROM unnest(imagens_extras) AS elem
          WHERE TRIM(elem) = ''
             OR LOWER(TRIM(elem)) IN ('nan', 'none', 'null', 'undefined')
             OR elem !~ '^(https?://|data:image/)'
      );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Total Correção 6: % registros', v_count;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2.7 CORREÇÃO: Normalizar URLs (trim)
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 Correção 7: Normalizando URLs (trim)...';

    UPDATE questoes_enem
    SET
        imagem_principal = TRIM(imagem_principal),
        imagem_a = TRIM(imagem_a),
        imagem_b = TRIM(imagem_b),
        imagem_c = TRIM(imagem_c),
        imagem_d = TRIM(imagem_d),
        imagem_e = TRIM(imagem_e),
        atualizado_em = NOW()
    WHERE
        imagem_principal != TRIM(COALESCE(imagem_principal, '')) OR
        imagem_a != TRIM(COALESCE(imagem_a, '')) OR
        imagem_b != TRIM(COALESCE(imagem_b, '')) OR
        imagem_c != TRIM(COALESCE(imagem_c, '')) OR
        imagem_d != TRIM(COALESCE(imagem_d, '')) OR
        imagem_e != TRIM(COALESCE(imagem_e, ''));

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Total Correção 7: % registros', v_count;
END $$;

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║                     PARTE 3: VERIFICAÇÃO FINAL                           ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

DO $$ BEGIN RAISE NOTICE ''; END $$;
DO $$ BEGIN RAISE NOTICE '════════════════════════════════════════════════════════════════════'; END $$;
DO $$ BEGIN RAISE NOTICE '                    VERIFICAÇÃO FINAL'; END $$;
DO $$ BEGIN RAISE NOTICE '════════════════════════════════════════════════════════════════════'; END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3.1 RESULTADO APÓS CORREÇÕES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ RESULTADO APÓS CORREÇÕES ═══' as secao;

WITH stats AS (
    SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL) as com_campo,
        COUNT(*) FILTER (WHERE
            imagem_principal IS NOT NULL
            AND imagem_principal ~ '^(https?://|data:image/)'
        ) as validas,
        COUNT(*) FILTER (WHERE
            imagem_principal IS NOT NULL
            AND imagem_principal !~ '^(https?://|data:image/)'
        ) as ainda_problematicas
    FROM questoes_enem
)
SELECT
    total as "Total Questões",
    com_campo as "Com Imagem Principal",
    validas as "URLs Válidas",
    ainda_problematicas as "Ainda Problemáticas",
    ROUND((validas::numeric / NULLIF(total, 0)) * 100, 1) as "% URLs Válidas"
FROM stats;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3.2 VERIFICAR PROBLEMAS RESTANTES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ PROBLEMAS RESTANTES (se houver) ═══' as secao;

SELECT
    id,
    LEFT(imagem_principal, 60) as "URL Problemática"
FROM questoes_enem
WHERE imagem_principal IS NOT NULL
  AND imagem_principal !~ '^(https?://|data:image/)'
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3.3 ORIGENS APÓS LIMPEZA
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '═══ ORIGENS APÓS LIMPEZA ═══' as secao;

SELECT
    CASE
        WHEN imagem_principal ~ '^https://api\.enem\.dev/' THEN 'api.enem.dev'
        WHEN imagem_principal ~ '^https://.*supabase' THEN 'Supabase'
        WHEN imagem_principal ~ '^https://.*cloudinary' THEN 'Cloudinary'
        WHEN imagem_principal ~ '^https://.*s3\.amazonaws' THEN 'AWS S3'
        WHEN imagem_principal ~ '^data:image/' THEN 'Data URI'
        WHEN imagem_principal ~ '^https?://' THEN 'Outro HTTPS'
        ELSE 'N/A'
    END as "Origem",
    COUNT(*) as "Quantidade"
FROM questoes_enem
WHERE imagem_principal IS NOT NULL
GROUP BY 1
ORDER BY "Quantidade" DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- FINALIZAÇÃO
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  ✅ DIAGNÓSTICO E CORREÇÃO CONCLUÍDOS COM SUCESSO!';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '  As seguintes correções foram aplicadas:';
    RAISE NOTICE '  1. Valores nan/None/null/undefined → NULL';
    RAISE NOTICE '  2. Strings vazias → NULL';
    RAISE NOTICE '  3. URLs localhost/file:// → NULL';
    RAISE NOTICE '  4. Objetos [object Object] → NULL';
    RAISE NOTICE '  5. Tags HTML → NULL';
    RAISE NOTICE '  6. Array imagens_extras filtrado';
    RAISE NOTICE '  7. URLs normalizadas (trim)';
    RAISE NOTICE '';
END $$;
