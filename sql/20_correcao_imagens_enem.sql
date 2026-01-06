-- ================================================================
-- CORREÇÃO DE IMAGENS - QUESTÕES ENEM
-- ================================================================
-- ⚠️ ATENÇÃO: Este script FAZ ALTERAÇÕES no banco de dados!
-- Execute apenas após verificar o diagnóstico (19_diagnostico_correcao_imagens.sql)
-- ================================================================

-- ████████████████████████████████████████████████████████████████████
-- PRÉ-VERIFICAÇÃO: Mostrar o que será corrigido
-- ████████████████████████████████████████████████████████████████████

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  CORREÇÃO DE IMAGENS - QUESTÕES ENEM';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

SELECT '=== PROBLEMAS A SEREM CORRIGIDOS ===' as secao;

SELECT
    'Valores nan/None/null/undefined' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE LOWER(TRIM(COALESCE(imagem_principal, ''))) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(COALESCE(imagem_a, ''))) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(COALESCE(imagem_b, ''))) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(COALESCE(imagem_c, ''))) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(COALESCE(imagem_d, ''))) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(COALESCE(imagem_e, ''))) IN ('nan', 'none', 'null', 'undefined')
UNION ALL
SELECT
    'Strings vazias em campos de imagem' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE (imagem_principal IS NOT NULL AND TRIM(imagem_principal) = '')
   OR (imagem_a IS NOT NULL AND TRIM(imagem_a) = '')
   OR (imagem_b IS NOT NULL AND TRIM(imagem_b) = '')
   OR (imagem_c IS NOT NULL AND TRIM(imagem_c) = '')
   OR (imagem_d IS NOT NULL AND TRIM(imagem_d) = '')
   OR (imagem_e IS NOT NULL AND TRIM(imagem_e) = '')
UNION ALL
SELECT
    'URLs localhost/file://' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE COALESCE(imagem_principal, '') ~ '^(http://localhost|file://)'
   OR COALESCE(imagem_a, '') ~ '^(http://localhost|file://)'
   OR COALESCE(imagem_b, '') ~ '^(http://localhost|file://)'
UNION ALL
SELECT
    'Objetos [object Object]' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE COALESCE(imagem_principal, '') LIKE '%[object%'
   OR COALESCE(imagem_a, '') LIKE '%[object%'
UNION ALL
SELECT
    'Tags HTML em vez de URLs' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE COALESCE(imagem_principal, '') ~ '^<(img|figure|div)';

-- ████████████████████████████████████████████████████████████████████
-- CORREÇÃO 1: Limpar valores 'nan', 'None', 'null', 'undefined'
-- ████████████████████████████████████████████████████████████████████

DO $$
DECLARE
    v_count INTEGER := 0;
    v_total INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CORREÇÃO 1: Limpando valores nan/None/null/undefined...';

    -- Imagem principal
    UPDATE questoes_enem
    SET imagem_principal = NULL,
        atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_principal, ''))) IN ('nan', 'none', 'null', 'undefined')
       OR imagem_principal = 'NaN';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '   - imagem_principal: % registros corrigidos', v_count;

    -- Alternativa A
    UPDATE questoes_enem
    SET imagem_a = NULL, atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_a, ''))) IN ('nan', 'none', 'null', 'undefined');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    IF v_count > 0 THEN RAISE NOTICE '   - imagem_a: % registros corrigidos', v_count; END IF;

    -- Alternativa B
    UPDATE questoes_enem
    SET imagem_b = NULL, atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_b, ''))) IN ('nan', 'none', 'null', 'undefined');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    IF v_count > 0 THEN RAISE NOTICE '   - imagem_b: % registros corrigidos', v_count; END IF;

    -- Alternativa C
    UPDATE questoes_enem
    SET imagem_c = NULL, atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_c, ''))) IN ('nan', 'none', 'null', 'undefined');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    IF v_count > 0 THEN RAISE NOTICE '   - imagem_c: % registros corrigidos', v_count; END IF;

    -- Alternativa D
    UPDATE questoes_enem
    SET imagem_d = NULL, atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_d, ''))) IN ('nan', 'none', 'null', 'undefined');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    IF v_count > 0 THEN RAISE NOTICE '   - imagem_d: % registros corrigidos', v_count; END IF;

    -- Alternativa E
    UPDATE questoes_enem
    SET imagem_e = NULL, atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_e, ''))) IN ('nan', 'none', 'null', 'undefined');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    IF v_count > 0 THEN RAISE NOTICE '   - imagem_e: % registros corrigidos', v_count; END IF;

    RAISE NOTICE '   ✅ Total CORREÇÃO 1: % registros', v_total;
END $$;

-- ████████████████████████████████████████████████████████████████████
-- CORREÇÃO 2: Limpar strings vazias
-- ████████████████████████████████████████████████████████████████████

DO $$
DECLARE
    v_count INTEGER := 0;
    v_total INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CORREÇÃO 2: Limpando strings vazias...';

    -- Todos os campos de uma vez
    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN TRIM(COALESCE(imagem_principal, '')) = '' THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN TRIM(COALESCE(imagem_a, '')) = '' THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN TRIM(COALESCE(imagem_b, '')) = '' THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN TRIM(COALESCE(imagem_c, '')) = '' THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN TRIM(COALESCE(imagem_d, '')) = '' THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN TRIM(COALESCE(imagem_e, '')) = '' THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE (imagem_principal IS NOT NULL AND TRIM(imagem_principal) = '')
       OR (imagem_a IS NOT NULL AND TRIM(imagem_a) = '')
       OR (imagem_b IS NOT NULL AND TRIM(imagem_b) = '')
       OR (imagem_c IS NOT NULL AND TRIM(imagem_c) = '')
       OR (imagem_d IS NOT NULL AND TRIM(imagem_d) = '')
       OR (imagem_e IS NOT NULL AND TRIM(imagem_e) = '');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Total CORREÇÃO 2: % registros', v_count;
END $$;

-- ████████████████████████████████████████████████████████████████████
-- CORREÇÃO 3: Limpar URLs localhost e file://
-- ████████████████████████████████████████████████████████████████████

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CORREÇÃO 3: Limpando URLs localhost/file://...';

    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN COALESCE(imagem_principal, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN COALESCE(imagem_a, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN COALESCE(imagem_b, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN COALESCE(imagem_c, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN COALESCE(imagem_d, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN COALESCE(imagem_e, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE COALESCE(imagem_principal, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_a, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_b, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_c, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_d, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_e, '') ~ '^(http://localhost|file://)';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Total CORREÇÃO 3: % registros', v_count;
END $$;

-- ████████████████████████████████████████████████████████████████████
-- CORREÇÃO 4: Limpar objetos JS [object Object]
-- ████████████████████████████████████████████████████████████████████

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CORREÇÃO 4: Limpando objetos [object Object]...';

    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN COALESCE(imagem_principal, '') LIKE '%[object%' THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN COALESCE(imagem_a, '') LIKE '%[object%' THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN COALESCE(imagem_b, '') LIKE '%[object%' THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN COALESCE(imagem_c, '') LIKE '%[object%' THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN COALESCE(imagem_d, '') LIKE '%[object%' THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN COALESCE(imagem_e, '') LIKE '%[object%' THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE COALESCE(imagem_principal, '') LIKE '%[object%'
       OR COALESCE(imagem_a, '') LIKE '%[object%'
       OR COALESCE(imagem_b, '') LIKE '%[object%'
       OR COALESCE(imagem_c, '') LIKE '%[object%'
       OR COALESCE(imagem_d, '') LIKE '%[object%'
       OR COALESCE(imagem_e, '') LIKE '%[object%';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Total CORREÇÃO 4: % registros', v_count;
END $$;

-- ████████████████████████████████████████████████████████████████████
-- CORREÇÃO 5: Limpar tags HTML
-- ████████████████████████████████████████████████████████████████████

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CORREÇÃO 5: Limpando tags HTML...';

    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN COALESCE(imagem_principal, '') ~ '^<(img|figure|div|span|a)' THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN COALESCE(imagem_a, '') ~ '^<(img|figure|div|span|a)' THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN COALESCE(imagem_b, '') ~ '^<(img|figure|div|span|a)' THEN NULL ELSE imagem_b END,
        atualizado_em = NOW()
    WHERE COALESCE(imagem_principal, '') ~ '^<(img|figure|div|span|a)'
       OR COALESCE(imagem_a, '') ~ '^<(img|figure|div|span|a)'
       OR COALESCE(imagem_b, '') ~ '^<(img|figure|div|span|a)';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Total CORREÇÃO 5: % registros', v_count;
END $$;

-- ████████████████████████████████████████████████████████████████████
-- CORREÇÃO 6: Limpar imagens_extras com valores inválidos
-- ████████████████████████████████████████████████████████████████████

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CORREÇÃO 6: Limpando array imagens_extras...';

    -- Filtrar elementos válidos do array
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
    RAISE NOTICE '   ✅ Total CORREÇÃO 6: % registros', v_count;
END $$;

-- ████████████████████████████████████████████████████████████████████
-- CORREÇÃO 7: Normalizar URLs (remover espaços, trim)
-- ████████████████████████████████████████████████████████████████████

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 CORREÇÃO 7: Normalizando URLs (trim)...';

    UPDATE questoes_enem
    SET
        imagem_principal = NULLIF(TRIM(imagem_principal), ''),
        imagem_a = NULLIF(TRIM(imagem_a), ''),
        imagem_b = NULLIF(TRIM(imagem_b), ''),
        imagem_c = NULLIF(TRIM(imagem_c), ''),
        imagem_d = NULLIF(TRIM(imagem_d), ''),
        imagem_e = NULLIF(TRIM(imagem_e), ''),
        atualizado_em = NOW()
    WHERE imagem_principal != TRIM(COALESCE(imagem_principal, ''))
       OR imagem_a != TRIM(COALESCE(imagem_a, ''))
       OR imagem_b != TRIM(COALESCE(imagem_b, ''))
       OR imagem_c != TRIM(COALESCE(imagem_c, ''))
       OR imagem_d != TRIM(COALESCE(imagem_d, ''))
       OR imagem_e != TRIM(COALESCE(imagem_e, ''));

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   ✅ Total CORREÇÃO 7: % registros', v_count;
END $$;

-- ████████████████████████████████████████████████████████████████████
-- VERIFICAÇÃO PÓS-CORREÇÃO
-- ████████████████████████████████████████████████████████████████████

SELECT '=== RESULTADO APÓS CORREÇÕES ===' as secao;

SELECT
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL) as com_imagem_principal,
    COUNT(*) FILTER (WHERE imagem_principal ~ '^https?://') as imagens_http,
    COUNT(*) FILTER (WHERE imagem_principal ~ '^data:image/') as imagens_base64
FROM questoes_enem;

-- Verificar se ainda há problemas
SELECT '=== PROBLEMAS RESTANTES ===' as secao;

SELECT
    'Ainda problemáticos' as verificacao,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE imagem_principal IS NOT NULL
  AND imagem_principal !~ '^(https?://|data:image/)';

-- Finalização
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  ✅ CORREÇÕES CONCLUÍDAS COM SUCESSO!';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;
