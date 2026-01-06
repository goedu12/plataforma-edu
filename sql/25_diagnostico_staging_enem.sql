-- ════════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO DA TABELA STAGING - IDENTIFICAR COLUNAS DO CSV
-- ════════════════════════════════════════════════════════════════════════════
-- Execute este script para ver quais colunas existem no CSV importado
-- e identificar onde estão as alternativas
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Verificar se a tabela staging existe
SELECT '════════════════════════════════════════' as secao;
SELECT '1. VERIFICANDO TABELA STAGING' as secao;
SELECT '════════════════════════════════════════' as secao;

SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'enem_staging'
ORDER BY ordinal_position;

-- 2. Verificar conteúdo das colunas de alternativas
SELECT '════════════════════════════════════════' as secao;
SELECT '2. COLUNAS DE ALTERNATIVAS NO STAGING' as secao;
SELECT '════════════════════════════════════════' as secao;

-- Se a tabela existe, mostrar amostra das colunas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enem_staging') THEN
        RAISE NOTICE 'Tabela enem_staging EXISTE';
    ELSE
        RAISE NOTICE '⚠️  Tabela enem_staging NÃO existe!';
        RAISE NOTICE '   O CSV precisa ser reimportado.';
    END IF;
END $$;

-- 3. Amostra de dados do staging (se existir)
SELECT '════════════════════════════════════════' as secao;
SELECT '3. AMOSTRA DO STAGING' as secao;
SELECT '════════════════════════════════════════' as secao;

-- Mostrar uma linha para ver o formato dos dados
SELECT *
FROM enem_staging
LIMIT 1;

-- 4. Verificar colunas com dados de alternativas
SELECT '════════════════════════════════════════' as secao;
SELECT '4. COLUNAS COM ALTERNATIVAS' as secao;
SELECT '════════════════════════════════════════' as secao;

SELECT
    COUNT(*) FILTER (WHERE "A" IS NOT NULL AND "A" != '') as col_A,
    COUNT(*) FILTER (WHERE "B" IS NOT NULL AND "B" != '') as col_B,
    COUNT(*) FILTER (WHERE "C" IS NOT NULL AND "C" != '') as col_C,
    COUNT(*) FILTER (WHERE "D" IS NOT NULL AND "D" != '') as col_D,
    COUNT(*) FILTER (WHERE "E" IS NOT NULL AND "E" != '') as col_E,
    COUNT(*) FILTER (WHERE alternatives IS NOT NULL AND alternatives != '') as col_alternatives,
    COUNT(*) as total_rows
FROM enem_staging;

-- 5. Mostrar exemplo de valores nas colunas de alternativas
SELECT '════════════════════════════════════════' as secao;
SELECT '5. EXEMPLO DE ALTERNATIVAS NO STAGING' as secao;
SELECT '════════════════════════════════════════' as secao;

SELECT
    LEFT("A", 80) as alt_A,
    LEFT("B", 80) as alt_B,
    LEFT(alternatives, 100) as alternatives
FROM enem_staging
WHERE "A" IS NOT NULL OR alternatives IS NOT NULL
LIMIT 3;

-- RESUMO
DO $$
DECLARE
    v_total INTEGER;
    v_com_alt INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM enem_staging;
    SELECT COUNT(*) INTO v_com_alt FROM enem_staging
    WHERE ("A" IS NOT NULL AND "A" != '') OR (alternatives IS NOT NULL AND alternatives != '' AND alternatives != '[]');

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '                    DIAGNÓSTICO STAGING                     ';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Total de linhas no staging: %', v_total;
    RAISE NOTICE 'Linhas com alternativas: %', v_com_alt;
    RAISE NOTICE '';

    IF v_com_alt = 0 THEN
        RAISE NOTICE '⚠️  PROBLEMA: Nenhuma linha tem alternativas!';
        RAISE NOTICE '';
        RAISE NOTICE 'Possíveis causas:';
        RAISE NOTICE '  1. O CSV usa nomes de coluna diferentes';
        RAISE NOTICE '  2. As colunas não foram mapeadas na importação';
        RAISE NOTICE '  3. O formato do CSV é diferente do esperado';
        RAISE NOTICE '';
        RAISE NOTICE 'SOLUÇÃO: Verifique o CSV original e as colunas acima.';
    ELSE
        RAISE NOTICE '✅ Staging contém alternativas! Reimporte para questoes_enem.';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;
