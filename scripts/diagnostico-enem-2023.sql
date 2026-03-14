-- ═══════════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO COMPLETO: QUESTÕES ENEM 2023
-- Compare com o formato padrão de 2024/2025
-- Execute no Supabase SQL Editor
-- Data: 2026-03-14
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. VISÃO GERAL - Contagem e comparação por ano
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ 1. VISÃO GERAL POR ANO ═══' as secao;

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
WHERE ano IN (2023, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. ESTRUTURA DOS CAMPOS - Comparar preenchimento
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ 2. CAMPOS PREENCHIDOS ═══' as secao;

WITH analise AS (
    SELECT
        ano,
        COUNT(*) as total,
        -- Campos básicos
        COUNT(*) FILTER (WHERE dia IS NOT NULL) as tem_dia,
        COUNT(*) FILTER (WHERE caderno IS NOT NULL AND TRIM(caderno) != '') as tem_caderno,
        COUNT(*) FILTER (WHERE area IS NOT NULL AND TRIM(area) != '') as tem_area,
        COUNT(*) FILTER (WHERE lingua_estrangeira IS NOT NULL) as tem_lingua,
        COUNT(*) FILTER (WHERE numero IS NOT NULL) as tem_numero,
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
    WHERE ano IN (2023, 2024, 2025)
    GROUP BY ano
)
SELECT * FROM analise ORDER BY ano;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. ANÁLISE DA ESTRUTURA JSONB DE ELEMENTOS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ 3. ESTATÍSTICAS DOS ELEMENTOS ═══' as secao;

SELECT
    ano,
    ROUND(AVG(jsonb_array_length(COALESCE(elementos, '[]'::jsonb))), 2) as media_elementos,
    MIN(jsonb_array_length(COALESCE(elementos, '[]'::jsonb))) as min_elementos,
    MAX(jsonb_array_length(COALESCE(elementos, '[]'::jsonb))) as max_elementos,
    COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(elementos, '[]'::jsonb)) = 0) as sem_elementos
FROM questoes_enem
WHERE ano IN (2023, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- Tipos de elementos usados por ano
SELECT '═══ 3.1 TIPOS DE ELEMENTOS POR ANO ═══' as secao;

SELECT
    q.ano,
    e->>'tipo' as tipo_elemento,
    COUNT(*) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(COALESCE(q.elementos, '[]'::jsonb)) e
WHERE q.ano IN (2023, 2024, 2025)
GROUP BY q.ano, e->>'tipo'
ORDER BY q.ano, quantidade DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. VERIFICAR PROBLEMAS DE FORMATAÇÃO EM 2023
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ 4. PROBLEMAS IDENTIFICADOS - 2023 ═══' as secao;

-- 4.1 Fontes misturadas no texto (sem tag <small>)
SELECT
    'Textos com FONTE misturada (sem separação)' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND e->>'tipo' = 'texto'
  AND (
    e->>'conteudo' ILIKE '%Disponível em:%'
    OR e->>'conteudo' ILIKE '%Acesso em:%'
    OR e->>'conteudo' ILIKE '%Adaptado de%'
    OR e->>'conteudo' ~ '\n[A-Z][A-Z\s,\.]+\.\s+[^\.]+\.\s*\d{4}'
  )
  AND e->>'conteudo' NOT LIKE '%<small%';

-- 4.2 Fórmulas químicas não formatadas (H2O ao invés de H₂O)
SELECT
    'Fórmulas químicas NÃO formatadas (H2O em vez de H₂O)' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q
WHERE q.ano = 2023
  AND (
    q.comando ~ '\b(H2O|CO2|O2|N2|H2|CH4|H2SO4|NaOH|HCl|NaCl)\b'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '\b(H2O|CO2|O2|N2|H2|CH4|H2SO4|NaOH|HCl|NaCl)\b'
    )
  )
  AND NOT (
    q.comando ~ '[₀₁₂₃₄₅₆₇₈₉]'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '[₀₁₂₃₄₅₆₇₈₉]'
    )
  );

-- 4.3 Notação científica não formatada (10^5 em vez de 10⁵)
SELECT
    'Notação científica NÃO formatada (10^x em vez de 10ˣ)' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q
WHERE q.ano = 2023
  AND (
    q.comando ~ '10\^[+-]?\d+'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '10\^[+-]?\d+'
    )
  );

-- 4.4 Áreas não padronizadas
SELECT
    'Áreas NÃO padronizadas' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2023
  AND area NOT IN (
    'Linguagens, Códigos e suas Tecnologias',
    'Ciências Humanas e suas Tecnologias',
    'Ciências da Natureza e suas Tecnologias',
    'Matemática e suas Tecnologias'
  );

-- 4.5 Flag tem_imagem incorreta
SELECT
    'Flag tem_imagem FALSA mas tem imagem nos elementos' as problema,
    COUNT(*) as quantidade
FROM questoes_enem q
WHERE q.ano = 2023
  AND q.tem_imagem = false
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(q.elementos) e
    WHERE e->>'tipo' = 'imagem'
      AND e->>'arquivo' IS NOT NULL
  );

-- 4.6 Flag tem_formula incorreta
SELECT
    'Flag tem_formula FALSA mas tem fórmulas' as problema,
    COUNT(*) as quantidade
FROM questoes_enem q
WHERE q.ano = 2023
  AND q.tem_formula = false
  AND (
    q.comando ~ '[²³⁴⁵⁶⁷⁸⁹⁰₀₁₂₃₄₅₆₇₈₉±×÷≤≥≠≈∞∆Δπ→⇌]'
    OR q.comando ~ '\^[+-]?\d+'
    OR q.comando ~ '\b[A-Z][a-z]?\d[A-Z]'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '[²³⁴⁵⁶⁷⁸⁹⁰₀₁₂₃₄₅₆₇₈₉±×÷≤≥≠≈∞∆Δπ→⇌]'
           OR e->>'conteudo' ~ '\^[+-]?\d+'
    )
  );

-- 4.7 URLs de imagem inválidas
SELECT
    'URLs de imagem INVÁLIDAS (nan, null, etc)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2023
  AND (
    LOWER(TRIM(COALESCE(alt_a_imagem, ''))) IN ('nan', 'none', 'null', 'undefined')
    OR LOWER(TRIM(COALESCE(alt_b_imagem, ''))) IN ('nan', 'none', 'null', 'undefined')
    OR LOWER(TRIM(COALESCE(alt_c_imagem, ''))) IN ('nan', 'none', 'null', 'undefined')
    OR LOWER(TRIM(COALESCE(alt_d_imagem, ''))) IN ('nan', 'none', 'null', 'undefined')
    OR LOWER(TRIM(COALESCE(alt_e_imagem, ''))) IN ('nan', 'none', 'null', 'undefined')
  );

-- 4.8 Prefixos de alternativas redundantes
SELECT
    'Alternativas com prefixo redundante (A), B), etc)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2023
  AND (
    alt_a_texto ~ '^[Aa][\.\)\-]\s*'
    OR alt_b_texto ~ '^[Bb][\.\)\-]\s*'
    OR alt_c_texto ~ '^[Cc][\.\)\-]\s*'
    OR alt_d_texto ~ '^[Dd][\.\)\-]\s*'
    OR alt_e_texto ~ '^[Ee][\.\)\-]\s*'
  );

-- 4.9 Caderno não definido
SELECT
    'Questões SEM caderno definido' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2023
  AND (caderno IS NULL OR TRIM(caderno) = '');

-- 4.10 Dia não definido
SELECT
    'Questões SEM dia definido' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2023
  AND dia IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. VERIFICAR DISTRIBUIÇÃO POR ÁREA
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ 5. DISTRIBUIÇÃO POR ÁREA - 2023 ═══' as secao;

SELECT
    area,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE dia = 1) as dia_1,
    COUNT(*) FILTER (WHERE dia = 2) as dia_2,
    COUNT(*) FILTER (WHERE dia IS NULL) as sem_dia
FROM questoes_enem
WHERE ano = 2023
GROUP BY area
ORDER BY total DESC;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. AMOSTRA DE QUESTÕES 2023
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ 6. AMOSTRA: 5 QUESTÕES 2023 ═══' as secao;

SELECT
    id,
    ano,
    dia,
    numero,
    area,
    LEFT(comando, 80) as comando_preview,
    jsonb_array_length(COALESCE(elementos, '[]'::jsonb)) as qtd_elementos,
    tem_imagem,
    tem_formula,
    gabarito
FROM questoes_enem
WHERE ano = 2023
ORDER BY numero
LIMIT 5;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. COMPARAR ESTRUTURA DETALHADA (2023 vs 2024)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ 7. COMPARAÇÃO DETALHADA 2023 vs 2024 ═══' as secao;

-- Questão 2024 com fonte separada (para referência)
SELECT
    'REFERÊNCIA 2024' as tipo,
    ano, dia, numero, area,
    jsonb_pretty(elementos) as elementos_formatados
FROM questoes_enem
WHERE ano = 2024
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(elementos) e
    WHERE e->>'tipo' = 'fonte'
  )
LIMIT 1;

-- Questão 2023 similar
SELECT
    'QUESTÃO 2023' as tipo,
    ano, dia, numero, area,
    jsonb_pretty(elementos) as elementos_formatados
FROM questoes_enem
WHERE ano = 2023
  AND elementos IS NOT NULL
  AND jsonb_array_length(elementos) > 2
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. VERIFICAR CONSISTÊNCIA DOS TIPOS DE ELEMENTO
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ 8. TIPOS DE ELEMENTO ÚNICOS POR ANO ═══' as secao;

SELECT DISTINCT
    q.ano,
    e->>'tipo' as tipo_elemento
FROM questoes_enem q,
     jsonb_array_elements(COALESCE(q.elementos, '[]'::jsonb)) e
WHERE q.ano IN (2023, 2024, 2025)
ORDER BY q.ano, tipo_elemento;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. RESUMO FINAL
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ 9. RESUMO FINAL ═══' as secao;

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
            AND dia IS NOT NULL
            AND area IN (
                'Linguagens, Códigos e suas Tecnologias',
                'Ciências Humanas e suas Tecnologias',
                'Ciências da Natureza e suas Tecnologias',
                'Matemática e suas Tecnologias'
            )
        ) as completas,
        COUNT(*) FILTER (WHERE
            elementos IS NULL
            OR jsonb_array_length(elementos) = 0
            OR comando IS NULL
            OR TRIM(comando) = ''
        ) as incompletas
    FROM questoes_enem
    WHERE ano IN (2023, 2024, 2025)
    GROUP BY ano
)
SELECT
    ano,
    total,
    completas,
    incompletas,
    ROUND((completas::numeric / NULLIF(total, 0)) * 100, 1) as pct_completas
FROM resumo
ORDER BY ano;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. DIAGNÓSTICO ESPECÍFICO DE FORMATAÇÃO
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ 10. VERIFICAÇÃO DE FORMATAÇÃO ═══' as secao;

-- Questões com fontes já em tag <small>
SELECT
    'Fontes JÁ formatadas com <small>' as status,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND (
    e->>'conteudo' LIKE '%<small%'
    OR e->>'tipo' = 'fonte'
  );

-- Questões com fórmulas já Unicode formatadas
SELECT
    'Fórmulas JÁ formatadas (Unicode ₂₃⁴)' as status,
    COUNT(*) as quantidade
FROM questoes_enem q
WHERE q.ano = 2023
  AND (
    q.comando ~ '[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]'
    )
  );

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  DIAGNÓSTICO ENEM 2023 CONCLUÍDO';
    RAISE NOTICE '  Execute corrigir-enem-2023.sql para aplicar correções necessárias';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
END $$;
