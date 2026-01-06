-- ════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO DE ALTERNATIVAS VAZIAS - QUESTÕES ENEM
-- ════════════════════════════════════════════════════════════════════════════
-- Problema identificado: Questões importadas com alternativas vazias
-- ════════════════════════════════════════════════════════════════════════════

-- 1. DIAGNÓSTICO - Quantas questões têm alternativas vazias?
SELECT '════════════════════════════════════════' as secao;
SELECT '1. DIAGNÓSTICO DE ALTERNATIVAS' as secao;
SELECT '════════════════════════════════════════' as secao;

SELECT
    'Total de questões' as metrica,
    COUNT(*) as valor
FROM questoes_enem
UNION ALL
SELECT
    'Questões com TODAS alternativas vazias' as metrica,
    COUNT(*) as valor
FROM questoes_enem
WHERE (alternativa_a IS NULL OR TRIM(alternativa_a) = '')
  AND (alternativa_b IS NULL OR TRIM(alternativa_b) = '')
  AND (alternativa_c IS NULL OR TRIM(alternativa_c) = '')
  AND (alternativa_d IS NULL OR TRIM(alternativa_d) = '')
  AND (alternativa_e IS NULL OR TRIM(alternativa_e) = '')
UNION ALL
SELECT
    'Questões com pelo menos UMA alternativa preenchida' as metrica,
    COUNT(*) as valor
FROM questoes_enem
WHERE (alternativa_a IS NOT NULL AND TRIM(alternativa_a) != '')
   OR (alternativa_b IS NOT NULL AND TRIM(alternativa_b) != '')
   OR (alternativa_c IS NOT NULL AND TRIM(alternativa_c) != '')
   OR (alternativa_d IS NOT NULL AND TRIM(alternativa_d) != '')
   OR (alternativa_e IS NOT NULL AND TRIM(alternativa_e) != '');

-- 2. Verificar fonte das questões
SELECT '════════════════════════════════════════' as secao;
SELECT '2. QUESTÕES POR FONTE' as secao;
SELECT '════════════════════════════════════════' as secao;

SELECT
    COALESCE(fonte, 'NULL') as fonte,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE
        (alternativa_a IS NULL OR TRIM(alternativa_a) = '') AND
        (alternativa_b IS NULL OR TRIM(alternativa_b) = '')
    ) as sem_alternativas
FROM questoes_enem
GROUP BY fonte
ORDER BY total DESC;

-- 3. Amostra de questões com alternativas vazias
SELECT '════════════════════════════════════════' as secao;
SELECT '3. AMOSTRA DE QUESTÕES SEM ALTERNATIVAS' as secao;
SELECT '════════════════════════════════════════' as secao;

SELECT
    id,
    id_api,
    fonte,
    ano_prova,
    area,
    LEFT(contexto, 80) as contexto_preview,
    alternativa_a,
    alternativa_b
FROM questoes_enem
WHERE (alternativa_a IS NULL OR TRIM(alternativa_a) = '')
  AND (alternativa_b IS NULL OR TRIM(alternativa_b) = '')
LIMIT 5;

-- 4. CORREÇÃO - Marcar questões sem alternativas como INATIVAS
SELECT '════════════════════════════════════════' as secao;
SELECT '4. MARCANDO QUESTÕES INVÁLIDAS' as secao;
SELECT '════════════════════════════════════════' as secao;

UPDATE questoes_enem
SET status = 'inativa'
WHERE (alternativa_a IS NULL OR TRIM(alternativa_a) = '')
  AND (alternativa_b IS NULL OR TRIM(alternativa_b) = '')
  AND (alternativa_c IS NULL OR TRIM(alternativa_c) = '')
  AND (alternativa_d IS NULL OR TRIM(alternativa_d) = '')
  AND (alternativa_e IS NULL OR TRIM(alternativa_e) = '');

-- 5. Verificar questões restantes ATIVAS
SELECT '════════════════════════════════════════' as secao;
SELECT '5. QUESTÕES ATIVAS APÓS CORREÇÃO' as secao;
SELECT '════════════════════════════════════════' as secao;

SELECT
    area,
    COUNT(*) as total_ativas
FROM questoes_enem
WHERE status = 'ativa'
GROUP BY area
ORDER BY total_ativas DESC;

-- 6. Amostra de questões VÁLIDAS (com alternativas)
SELECT '════════════════════════════════════════' as secao;
SELECT '6. AMOSTRA DE QUESTÕES VÁLIDAS' as secao;
SELECT '════════════════════════════════════════' as secao;

SELECT
    id,
    ano_prova,
    area,
    subarea,
    LEFT(alternativa_a, 50) as alt_a,
    LEFT(alternativa_b, 50) as alt_b,
    resposta_correta
FROM questoes_enem
WHERE status = 'ativa'
  AND alternativa_a IS NOT NULL
  AND TRIM(alternativa_a) != ''
  AND alternativa_b IS NOT NULL
  AND TRIM(alternativa_b) != ''
LIMIT 5;

-- RESUMO FINAL
DO $$
DECLARE
    v_total INTEGER;
    v_ativas INTEGER;
    v_sem_alt INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM questoes_enem;
    SELECT COUNT(*) INTO v_ativas FROM questoes_enem WHERE status = 'ativa';
    SELECT COUNT(*) INTO v_sem_alt FROM questoes_enem
    WHERE (alternativa_a IS NULL OR TRIM(alternativa_a) = '')
      AND (alternativa_b IS NULL OR TRIM(alternativa_b) = '');

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '                      RESUMO FINAL                          ';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Total de questões no banco: %', v_total;
    RAISE NOTICE 'Questões sem alternativas: % (marcadas como inativas)', v_sem_alt;
    RAISE NOTICE 'Questões ATIVAS válidas: %', v_ativas;
    RAISE NOTICE '';

    IF v_ativas = 0 THEN
        RAISE NOTICE '⚠️  ATENÇÃO: Nenhuma questão válida!';
        RAISE NOTICE '   As questões foram importadas sem alternativas.';
        RAISE NOTICE '   É necessário reimportar os dados corretamente.';
    ELSE
        RAISE NOTICE '✅ Banco corrigido! % questões disponíveis.', v_ativas;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;
