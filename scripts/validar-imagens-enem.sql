-- ===============================================================================
-- VALIDACAO DE IMAGENS: QUESTOES ENEM 2022/2023
-- Identificar e corrigir URLs de imagem problematicas
-- Execute no Supabase SQL Editor
-- Data: 2026-03-15
-- ===============================================================================

-- ===============================================================================
-- 1. DIAGNOSTICO DE IMAGENS
-- ===============================================================================

SELECT '=== 1. VISAO GERAL DE IMAGENS ===' as secao;

SELECT
    ano,
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE tem_imagem = true) as flag_tem_imagem,
    COUNT(*) FILTER (WHERE tem_imagem_alternativa = true) as flag_tem_img_alt,
    COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(elementos) e
        WHERE e->>'tipo' = 'imagem'
    )) as com_elemento_imagem,
    COUNT(*) FILTER (WHERE
        alt_a_imagem IS NOT NULL AND TRIM(alt_a_imagem) != '' AND LOWER(alt_a_imagem) NOT IN ('nan', 'null', 'none')
        OR alt_b_imagem IS NOT NULL AND TRIM(alt_b_imagem) != '' AND LOWER(alt_b_imagem) NOT IN ('nan', 'null', 'none')
        OR alt_c_imagem IS NOT NULL AND TRIM(alt_c_imagem) != '' AND LOWER(alt_c_imagem) NOT IN ('nan', 'null', 'none')
        OR alt_d_imagem IS NOT NULL AND TRIM(alt_d_imagem) != '' AND LOWER(alt_d_imagem) NOT IN ('nan', 'null', 'none')
        OR alt_e_imagem IS NOT NULL AND TRIM(alt_e_imagem) != '' AND LOWER(alt_e_imagem) NOT IN ('nan', 'null', 'none')
    ) as com_img_alternativa_valida
FROM questoes_enem
WHERE ano IN (2022, 2023, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- ===============================================================================
-- 2. IDENTIFICAR URLs PROBLEMATICAS
-- ===============================================================================

SELECT '=== 2. URLs PROBLEMATICAS NOS ELEMENTOS ===' as secao;

-- 2.1 URLs com valores invalidos (nan, null, etc)
SELECT
    'URLs invalidas (nan, null, etc)' as tipo_problema,
    ano,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano IN (2022, 2023)
  AND e->>'tipo' = 'imagem'
  AND (
    LOWER(TRIM(e->>'arquivo')) IN ('nan', 'null', 'none', 'undefined', '')
    OR e->>'arquivo' IS NULL
  )
GROUP BY ano
ORDER BY ano;

-- 2.2 URLs localhost (desenvolvimento)
SELECT
    'URLs localhost' as tipo_problema,
    ano,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano IN (2022, 2023)
  AND e->>'tipo' = 'imagem'
  AND e->>'arquivo' LIKE '%localhost%'
GROUP BY ano
ORDER BY ano;

-- 2.3 URLs file:// (arquivo local)
SELECT
    'URLs file://' as tipo_problema,
    ano,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano IN (2022, 2023)
  AND e->>'tipo' = 'imagem'
  AND e->>'arquivo' LIKE 'file://%'
GROUP BY ano
ORDER BY ano;

-- 2.4 URLs com [object Object]
SELECT
    'URLs [object Object]' as tipo_problema,
    ano,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano IN (2022, 2023)
  AND e->>'tipo' = 'imagem'
  AND e->>'arquivo' LIKE '%[object Object]%'
GROUP BY ano
ORDER BY ano;

-- 2.5 URLs relativas (sem https://)
SELECT
    'URLs relativas (sem https://)' as tipo_problema,
    ano,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano IN (2022, 2023)
  AND e->>'tipo' = 'imagem'
  AND e->>'arquivo' IS NOT NULL
  AND e->>'arquivo' NOT LIKE 'https://%'
  AND e->>'arquivo' NOT LIKE 'http://%'
  AND e->>'arquivo' NOT LIKE 'data:%'
  AND LOWER(TRIM(e->>'arquivo')) NOT IN ('nan', 'null', 'none', 'undefined', '')
GROUP BY ano
ORDER BY ano;

-- ===============================================================================
-- 3. IDENTIFICAR URLs PROBLEMATICAS NAS ALTERNATIVAS
-- ===============================================================================

SELECT '=== 3. URLs PROBLEMATICAS NAS ALTERNATIVAS ===' as secao;

SELECT
    ano,
    SUM(CASE WHEN LOWER(TRIM(COALESCE(alt_a_imagem, ''))) IN ('nan', 'null', 'none', 'undefined') THEN 1 ELSE 0 END) as alt_a_invalidas,
    SUM(CASE WHEN LOWER(TRIM(COALESCE(alt_b_imagem, ''))) IN ('nan', 'null', 'none', 'undefined') THEN 1 ELSE 0 END) as alt_b_invalidas,
    SUM(CASE WHEN LOWER(TRIM(COALESCE(alt_c_imagem, ''))) IN ('nan', 'null', 'none', 'undefined') THEN 1 ELSE 0 END) as alt_c_invalidas,
    SUM(CASE WHEN LOWER(TRIM(COALESCE(alt_d_imagem, ''))) IN ('nan', 'null', 'none', 'undefined') THEN 1 ELSE 0 END) as alt_d_invalidas,
    SUM(CASE WHEN LOWER(TRIM(COALESCE(alt_e_imagem, ''))) IN ('nan', 'null', 'none', 'undefined') THEN 1 ELSE 0 END) as alt_e_invalidas
FROM questoes_enem
WHERE ano IN (2022, 2023)
GROUP BY ano
ORDER BY ano;

-- ===============================================================================
-- 4. AMOSTRA DE URLs PROBLEMATICAS
-- ===============================================================================

SELECT '=== 4. AMOSTRA DE URLs PROBLEMATICAS ===' as secao;

SELECT
    q.ano,
    q.numero,
    q.area,
    e->>'arquivo' as url_problematica,
    CASE
        WHEN LOWER(TRIM(e->>'arquivo')) IN ('nan', 'null', 'none', 'undefined', '') THEN 'INVALIDA'
        WHEN e->>'arquivo' LIKE '%localhost%' THEN 'LOCALHOST'
        WHEN e->>'arquivo' LIKE 'file://%' THEN 'FILE://'
        WHEN e->>'arquivo' LIKE '%[object Object]%' THEN 'OBJECT'
        WHEN e->>'arquivo' NOT LIKE 'https://%' AND e->>'arquivo' NOT LIKE 'data:%' THEN 'RELATIVA'
        ELSE 'OUTRO'
    END as tipo_problema
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano IN (2022, 2023)
  AND e->>'tipo' = 'imagem'
  AND (
    LOWER(TRIM(e->>'arquivo')) IN ('nan', 'null', 'none', 'undefined', '')
    OR e->>'arquivo' LIKE '%localhost%'
    OR e->>'arquivo' LIKE 'file://%'
    OR e->>'arquivo' LIKE '%[object Object]%'
    OR (e->>'arquivo' NOT LIKE 'https://%' AND e->>'arquivo' NOT LIKE 'data:%')
  )
LIMIT 20;

-- ===============================================================================
-- 5. CORRECAO: LIMPAR URLs INVALIDAS NOS ELEMENTOS
-- ===============================================================================

SELECT '=== 5. LIMPAR URLs INVALIDAS NOS ELEMENTOS ===' as secao;

-- Remover elementos de imagem com URLs invalidas
UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(e ORDER BY (e->>'ordem')::int NULLS LAST)
    FROM jsonb_array_elements(q.elementos) e
    WHERE NOT (
        e->>'tipo' = 'imagem'
        AND (
            e->>'arquivo' IS NULL
            OR LOWER(TRIM(e->>'arquivo')) IN ('nan', 'null', 'none', 'undefined', '')
            OR e->>'arquivo' LIKE '%localhost%'
            OR e->>'arquivo' LIKE 'file://%'
            OR e->>'arquivo' LIKE '%[object Object]%'
        )
    )
)
WHERE q.ano IN (2022, 2023)
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(q.elementos) e
    WHERE e->>'tipo' = 'imagem'
      AND (
        e->>'arquivo' IS NULL
        OR LOWER(TRIM(e->>'arquivo')) IN ('nan', 'null', 'none', 'undefined', '')
        OR e->>'arquivo' LIKE '%localhost%'
        OR e->>'arquivo' LIKE 'file://%'
        OR e->>'arquivo' LIKE '%[object Object]%'
      )
  );

SELECT 'URLs invalidas removidas dos elementos' as acao;

-- ===============================================================================
-- 6. CORRECAO: LIMPAR URLs INVALIDAS NAS ALTERNATIVAS
-- ===============================================================================

SELECT '=== 6. LIMPAR URLs INVALIDAS NAS ALTERNATIVAS ===' as secao;

UPDATE questoes_enem
SET
    alt_a_imagem = CASE
        WHEN LOWER(TRIM(COALESCE(alt_a_imagem, ''))) IN ('nan', 'null', 'none', 'undefined', '')
          OR alt_a_imagem LIKE '%localhost%'
          OR alt_a_imagem LIKE 'file://%'
          OR alt_a_imagem LIKE '%[object Object]%'
        THEN NULL
        ELSE alt_a_imagem
    END,
    alt_b_imagem = CASE
        WHEN LOWER(TRIM(COALESCE(alt_b_imagem, ''))) IN ('nan', 'null', 'none', 'undefined', '')
          OR alt_b_imagem LIKE '%localhost%'
          OR alt_b_imagem LIKE 'file://%'
          OR alt_b_imagem LIKE '%[object Object]%'
        THEN NULL
        ELSE alt_b_imagem
    END,
    alt_c_imagem = CASE
        WHEN LOWER(TRIM(COALESCE(alt_c_imagem, ''))) IN ('nan', 'null', 'none', 'undefined', '')
          OR alt_c_imagem LIKE '%localhost%'
          OR alt_c_imagem LIKE 'file://%'
          OR alt_c_imagem LIKE '%[object Object]%'
        THEN NULL
        ELSE alt_c_imagem
    END,
    alt_d_imagem = CASE
        WHEN LOWER(TRIM(COALESCE(alt_d_imagem, ''))) IN ('nan', 'null', 'none', 'undefined', '')
          OR alt_d_imagem LIKE '%localhost%'
          OR alt_d_imagem LIKE 'file://%'
          OR alt_d_imagem LIKE '%[object Object]%'
        THEN NULL
        ELSE alt_d_imagem
    END,
    alt_e_imagem = CASE
        WHEN LOWER(TRIM(COALESCE(alt_e_imagem, ''))) IN ('nan', 'null', 'none', 'undefined', '')
          OR alt_e_imagem LIKE '%localhost%'
          OR alt_e_imagem LIKE 'file://%'
          OR alt_e_imagem LIKE '%[object Object]%'
        THEN NULL
        ELSE alt_e_imagem
    END
WHERE ano IN (2022, 2023);

SELECT 'URLs invalidas limpas nas alternativas' as acao;

-- ===============================================================================
-- 7. ATUALIZAR FLAGS
-- ===============================================================================

SELECT '=== 7. ATUALIZAR FLAGS ===' as secao;

-- Recalcular tem_imagem
UPDATE questoes_enem q
SET tem_imagem = EXISTS (
    SELECT 1 FROM jsonb_array_elements(q.elementos) e
    WHERE e->>'tipo' = 'imagem'
      AND e->>'arquivo' IS NOT NULL
      AND TRIM(e->>'arquivo') != ''
      AND e->>'arquivo' LIKE 'https://%'
)
WHERE q.ano IN (2022, 2023);

-- Recalcular tem_imagem_alternativa
UPDATE questoes_enem
SET tem_imagem_alternativa = (
    (alt_a_imagem IS NOT NULL AND TRIM(alt_a_imagem) != '' AND alt_a_imagem LIKE 'https://%')
    OR (alt_b_imagem IS NOT NULL AND TRIM(alt_b_imagem) != '' AND alt_b_imagem LIKE 'https://%')
    OR (alt_c_imagem IS NOT NULL AND TRIM(alt_c_imagem) != '' AND alt_c_imagem LIKE 'https://%')
    OR (alt_d_imagem IS NOT NULL AND TRIM(alt_d_imagem) != '' AND alt_d_imagem LIKE 'https://%')
    OR (alt_e_imagem IS NOT NULL AND TRIM(alt_e_imagem) != '' AND alt_e_imagem LIKE 'https://%')
)
WHERE ano IN (2022, 2023);

SELECT 'Flags atualizadas' as acao;

-- ===============================================================================
-- 8. VERIFICACAO FINAL
-- ===============================================================================

SELECT '=== 8. VERIFICACAO FINAL ===' as secao;

SELECT
    ano,
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE tem_imagem = true) as com_imagem,
    COUNT(*) FILTER (WHERE tem_imagem_alternativa = true) as com_img_alt,
    COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(elementos) e
        WHERE e->>'tipo' = 'imagem'
          AND e->>'arquivo' IS NOT NULL
          AND e->>'arquivo' LIKE 'https://%'
    )) as imagens_validas
FROM questoes_enem
WHERE ano IN (2022, 2023, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- ===============================================================================
-- 9. RELATORIO DE QUESTOES SEM IMAGEM (que deveriam ter)
-- ===============================================================================

SELECT '=== 9. QUESTOES QUE PODEM PRECISAR DE IMAGEM ===' as secao;

-- Questoes de Matematica/Ciencias sem imagem podem precisar de grafico/figura
SELECT
    ano,
    area,
    COUNT(*) as questoes_sem_imagem
FROM questoes_enem
WHERE ano IN (2022, 2023)
  AND tem_imagem = false
  AND area IN ('Matematica e suas Tecnologias', 'Ciencias da Natureza e suas Tecnologias')
GROUP BY ano, area
ORDER BY ano, area;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '  VALIDACAO DE IMAGENS CONCLUIDA';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '  Acoes realizadas:';
    RAISE NOTICE '    - URLs invalidas removidas dos elementos';
    RAISE NOTICE '    - URLs invalidas limpas nas alternativas';
    RAISE NOTICE '    - Flags tem_imagem e tem_imagem_alternativa recalculadas';
    RAISE NOTICE '';
    RAISE NOTICE '  NOTA: Algumas questoes podem precisar de imagens que foram';
    RAISE NOTICE '  perdidas durante a importacao. Verifique o relatorio acima.';
    RAISE NOTICE '';
END $$;
