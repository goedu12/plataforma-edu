-- ═══════════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO: QUESTÕES ENEM 2013
-- Compare com o formato padrão de 2024/2025
-- Execute no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. VISÃO GERAL - Contagem de questões por ano
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ VISÃO GERAL POR ANO ═══' as secao;

SELECT
    ano,
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE anulada = true) as anuladas,
    COUNT(*) FILTER (WHERE tem_imagem = true) as com_imagem,
    COUNT(*) FILTER (WHERE tem_imagem_alternativa = true) as com_img_alternativa,
    COUNT(*) FILTER (WHERE tem_formula = true) as com_formula,
    COUNT(*) FILTER (WHERE elementos IS NOT NULL AND jsonb_array_length(elementos) > 0) as com_elementos,
    COUNT(*) FILTER (WHERE comando IS NOT NULL AND LENGTH(comando) > 5) as com_comando
FROM questoes_enem
WHERE ano IN (2013, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. ESTRUTURA - Comparar campos preenchidos
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ CAMPOS PREENCHIDOS ═══' as secao;

WITH analise AS (
    SELECT
        ano,
        COUNT(*) as total,
        -- Campos básicos
        COUNT(*) FILTER (WHERE dia IS NOT NULL) as tem_dia,
        COUNT(*) FILTER (WHERE caderno IS NOT NULL) as tem_caderno,
        COUNT(*) FILTER (WHERE area IS NOT NULL) as tem_area,
        COUNT(*) FILTER (WHERE lingua_estrangeira IS NOT NULL) as tem_lingua,
        -- Elementos e comando
        COUNT(*) FILTER (WHERE elementos IS NOT NULL AND jsonb_array_length(elementos) > 0) as tem_elementos,
        COUNT(*) FILTER (WHERE comando IS NOT NULL AND TRIM(comando) != '') as tem_comando,
        -- Alternativas texto
        COUNT(*) FILTER (WHERE alt_a_texto IS NOT NULL AND TRIM(alt_a_texto) != '') as tem_alt_a,
        COUNT(*) FILTER (WHERE alt_b_texto IS NOT NULL AND TRIM(alt_b_texto) != '') as tem_alt_b,
        COUNT(*) FILTER (WHERE alt_c_texto IS NOT NULL AND TRIM(alt_c_texto) != '') as tem_alt_c,
        COUNT(*) FILTER (WHERE alt_d_texto IS NOT NULL AND TRIM(alt_d_texto) != '') as tem_alt_d,
        COUNT(*) FILTER (WHERE alt_e_texto IS NOT NULL AND TRIM(alt_e_texto) != '') as tem_alt_e,
        -- Gabarito
        COUNT(*) FILTER (WHERE gabarito IS NOT NULL) as tem_gabarito,
        -- Flags
        COUNT(*) FILTER (WHERE tem_imagem = true) as flag_imagem,
        COUNT(*) FILTER (WHERE tem_imagem_alternativa = true) as flag_img_alt,
        COUNT(*) FILTER (WHERE tem_formula = true) as flag_formula
    FROM questoes_enem
    WHERE ano IN (2013, 2024, 2025)
    GROUP BY ano
)
SELECT * FROM analise ORDER BY ano;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. ANÁLISE DOS ELEMENTOS JSONB
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ ESTRUTURA DOS ELEMENTOS ═══' as secao;

-- Quantidade média de elementos por questão
SELECT
    ano,
    ROUND(AVG(jsonb_array_length(COALESCE(elementos, '[]'::jsonb))), 2) as media_elementos,
    MIN(jsonb_array_length(COALESCE(elementos, '[]'::jsonb))) as min_elementos,
    MAX(jsonb_array_length(COALESCE(elementos, '[]'::jsonb))) as max_elementos
FROM questoes_enem
WHERE ano IN (2013, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- Tipos de elementos usados por ano
SELECT '═══ TIPOS DE ELEMENTOS POR ANO ═══' as secao;

SELECT
    q.ano,
    e->>'tipo' as tipo_elemento,
    COUNT(*) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(COALESCE(q.elementos, '[]'::jsonb)) e
WHERE q.ano IN (2013, 2024, 2025)
GROUP BY q.ano, e->>'tipo'
ORDER BY q.ano, quantidade DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. VERIFICAR PROBLEMAS ESPECÍFICOS DE 2013
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ PROBLEMAS IDENTIFICADOS - 2013 ═══' as secao;

-- 4.1 Questões sem elementos
SELECT
    'Questões SEM elementos' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2013
  AND (elementos IS NULL OR jsonb_array_length(elementos) = 0);

-- 4.2 Questões sem comando
SELECT
    'Questões SEM comando' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2013
  AND (comando IS NULL OR TRIM(comando) = '');

-- 4.3 Questões sem gabarito
SELECT
    'Questões SEM gabarito' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2013
  AND gabarito IS NULL;

-- 4.4 Questões com alternativas vazias
SELECT
    'Questões com alternativas vazias' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2013
  AND (
    (alt_a_texto IS NULL OR TRIM(alt_a_texto) = '') AND alt_a_imagem IS NULL
    OR (alt_b_texto IS NULL OR TRIM(alt_b_texto) = '') AND alt_b_imagem IS NULL
    OR (alt_c_texto IS NULL OR TRIM(alt_c_texto) = '') AND alt_c_imagem IS NULL
    OR (alt_d_texto IS NULL OR TRIM(alt_d_texto) = '') AND alt_d_imagem IS NULL
    OR (alt_e_texto IS NULL OR TRIM(alt_e_texto) = '') AND alt_e_imagem IS NULL
  );

-- 4.5 Elementos com fonte misturada no texto
SELECT
    'Elementos com FONTE misturada no texto' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2013
  AND e->>'tipo' = 'texto'
  AND (
    e->>'conteudo' ILIKE '%Disponível em:%'
    OR e->>'conteudo' ILIKE '%Acesso em:%'
    OR e->>'conteudo' ILIKE '%Adaptado de%'
  );

-- 4.6 Flag tem_imagem incorreta
SELECT
    'Flag tem_imagem=false mas tem imagem nos elementos' as problema,
    COUNT(*) as quantidade
FROM questoes_enem q
WHERE q.ano = 2013
  AND q.tem_imagem = false
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(q.elementos) e
    WHERE e->>'tipo' = 'imagem'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. AMOSTRA DE QUESTÕES 2013
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ AMOSTRA: 5 QUESTÕES 2013 ═══' as secao;

SELECT
    id,
    ano,
    dia,
    numero,
    area,
    LEFT(comando, 100) as comando_preview,
    jsonb_array_length(COALESCE(elementos, '[]'::jsonb)) as qtd_elementos,
    tem_imagem,
    tem_formula,
    gabarito
FROM questoes_enem
WHERE ano = 2013
ORDER BY numero
LIMIT 5;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. COMPARAR ESTRUTURA DE ELEMENTOS (2013 vs 2024)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ COMPARAR ESTRUTURA DE UMA QUESTÃO ═══' as secao;

-- Exemplo de questão 2024 (para referência)
SELECT
    'EXEMPLO 2024' as referencia,
    ano, dia, numero, area,
    jsonb_pretty(elementos) as elementos_formatados
FROM questoes_enem
WHERE ano = 2024
  AND elementos IS NOT NULL
  AND jsonb_array_length(elementos) > 2
LIMIT 1;

-- Exemplo de questão 2013 (para comparar)
SELECT
    'QUESTÃO 2013' as referencia,
    ano, dia, numero, area,
    jsonb_pretty(elementos) as elementos_formatados
FROM questoes_enem
WHERE ano = 2013
  AND elementos IS NOT NULL
  AND jsonb_array_length(elementos) > 0
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. VERIFICAR ÁREAS E DISTRIBUIÇÃO
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ DISTRIBUIÇÃO POR ÁREA - 2013 ═══' as secao;

SELECT
    area,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE dia = 1) as dia_1,
    COUNT(*) FILTER (WHERE dia = 2) as dia_2,
    COUNT(*) FILTER (WHERE dia IS NULL) as sem_dia
FROM questoes_enem
WHERE ano = 2013
GROUP BY area
ORDER BY total DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. VERIFICAR CONSISTÊNCIA DOS DIAS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ QUESTÕES POR DIA - 2013 ═══' as secao;

SELECT
    dia,
    COUNT(*) as total_questoes,
    MIN(numero) as primeiro_numero,
    MAX(numero) as ultimo_numero
FROM questoes_enem
WHERE ano = 2013
GROUP BY dia
ORDER BY dia;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. RESUMO FINAL
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ RESUMO FINAL ═══' as secao;

WITH resumo AS (
    SELECT
        ano,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE
            elementos IS NOT NULL
            AND jsonb_array_length(elementos) > 0
            AND comando IS NOT NULL
            AND TRIM(comando) != ''
            AND gabarito IS NOT NULL
            AND alt_a_texto IS NOT NULL
            AND alt_b_texto IS NOT NULL
            AND alt_c_texto IS NOT NULL
            AND alt_d_texto IS NOT NULL
            AND alt_e_texto IS NOT NULL
        ) as completas,
        COUNT(*) FILTER (WHERE
            elementos IS NULL
            OR jsonb_array_length(elementos) = 0
            OR comando IS NULL
            OR TRIM(comando) = ''
        ) as incompletas
    FROM questoes_enem
    WHERE ano IN (2013, 2024, 2025)
    GROUP BY ano
)
SELECT
    ano,
    total,
    completas,
    incompletas,
    ROUND((completas::numeric / total) * 100, 1) as pct_completas
FROM resumo
ORDER BY ano;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  DIAGNÓSTICO CONCLUÍDO';
    RAISE NOTICE '  Analise os resultados acima para identificar ajustes necessários';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
END $$;
