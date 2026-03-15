-- ===============================================================================
-- DIAGNOSTICO COMPLETO: QUESTOES ENEM 2022
-- Compare com o formato padrao de 2024/2025
-- Execute no Supabase SQL Editor
-- Data: 2026-03-15
-- ===============================================================================

-- ===============================================================================
-- 1. VISAO GERAL - Contagem e comparacao por ano
-- ===============================================================================

SELECT '=== 1. VISAO GERAL POR ANO ===' as secao;

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
WHERE ano IN (2022, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- ===============================================================================
-- 2. ESTRUTURA DOS CAMPOS - Comparar preenchimento
-- ===============================================================================

SELECT '=== 2. CAMPOS PREENCHIDOS ===' as secao;

WITH analise AS (
    SELECT
        ano,
        COUNT(*) as total,
        -- Campos basicos
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
    WHERE ano IN (2022, 2024, 2025)
    GROUP BY ano
)
SELECT * FROM analise ORDER BY ano;

-- ===============================================================================
-- 3. ANALISE DA ESTRUTURA JSONB DE ELEMENTOS
-- ===============================================================================

SELECT '=== 3. ESTATISTICAS DOS ELEMENTOS ===' as secao;

SELECT
    ano,
    ROUND(AVG(jsonb_array_length(COALESCE(elementos, '[]'::jsonb))), 2) as media_elementos,
    MIN(jsonb_array_length(COALESCE(elementos, '[]'::jsonb))) as min_elementos,
    MAX(jsonb_array_length(COALESCE(elementos, '[]'::jsonb))) as max_elementos,
    COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(elementos, '[]'::jsonb)) = 0) as sem_elementos
FROM questoes_enem
WHERE ano IN (2022, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- Tipos de elementos usados por ano
SELECT '=== 3.1 TIPOS DE ELEMENTOS POR ANO ===' as secao;

SELECT
    q.ano,
    e->>'tipo' as tipo_elemento,
    COUNT(*) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(COALESCE(q.elementos, '[]'::jsonb)) e
WHERE q.ano IN (2022, 2024, 2025)
GROUP BY q.ano, e->>'tipo'
ORDER BY q.ano, quantidade DESC;

-- ===============================================================================
-- 4. VERIFICAR PROBLEMAS DE FORMATACAO EM 2022
-- ===============================================================================

SELECT '=== 4. PROBLEMAS IDENTIFICADOS - 2022 ===' as secao;

-- 4.1 Elementos vazios ou nulos (PROBLEMA CRITICO)
SELECT
    'Questoes SEM elementos (JSONB vazio ou null)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2022
  AND (elementos IS NULL OR jsonb_array_length(elementos) = 0);

-- 4.2 Fontes misturadas no texto (sem tag <small>)
SELECT
    'Textos com FONTE misturada (sem separacao)' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2022
  AND e->>'tipo' = 'texto'
  AND (
    e->>'conteudo' ILIKE '%Disponivel em:%'
    OR e->>'conteudo' ILIKE '%Acesso em:%'
    OR e->>'conteudo' ILIKE '%Adaptado de%'
    OR e->>'conteudo' ~ '\n[A-Z][A-Z\s,\.]+\.\s+[^\.]+\.\s*\d{4}'
  )
  AND e->>'conteudo' NOT LIKE '%<small%';

-- 4.3 Formulas quimicas nao formatadas (H2O ao inves de H2O)
SELECT
    'Formulas quimicas NAO formatadas (H2O em vez de H2O)' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q
WHERE q.ano = 2022
  AND (
    q.comando ~ '\b(H2O|CO2|O2|N2|H2|CH4|H2SO4|NaOH|HCl|NaCl)\b'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '\b(H2O|CO2|O2|N2|H2|CH4|H2SO4|NaOH|HCl|NaCl)\b'
    )
  )
  AND NOT (
    q.comando ~ '[0123456789]'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '[0123456789]'
    )
  );

-- 4.4 Notacao cientifica nao formatada (10^5 em vez de 10^5)
SELECT
    'Notacao cientifica NAO formatada (10^x em vez de 10^x)' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q
WHERE q.ano = 2022
  AND (
    q.comando ~ '10\^[+-]?\d+'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '10\^[+-]?\d+'
    )
  );

-- 4.5 Areas nao padronizadas
SELECT
    'Areas NAO padronizadas' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2022
  AND area NOT IN (
    'Linguagens, Codigos e suas Tecnologias',
    'Ciencias Humanas e suas Tecnologias',
    'Ciencias da Natureza e suas Tecnologias',
    'Matematica e suas Tecnologias'
  );

-- 4.6 Flag tem_imagem incorreta
SELECT
    'Flag tem_imagem FALSA mas tem imagem nos elementos' as problema,
    COUNT(*) as quantidade
FROM questoes_enem q
WHERE q.ano = 2022
  AND q.tem_imagem = false
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(q.elementos) e
    WHERE e->>'tipo' = 'imagem'
      AND e->>'arquivo' IS NOT NULL
  );

-- 4.7 Flag tem_formula incorreta
SELECT
    'Flag tem_formula FALSA mas tem formulas' as problema,
    COUNT(*) as quantidade
FROM questoes_enem q
WHERE q.ano = 2022
  AND q.tem_formula = false
  AND (
    q.comando ~ '[234567890123456789+x<=>=~pi-><=]'
    OR q.comando ~ '\^[+-]?\d+'
    OR q.comando ~ '\b[A-Z][a-z]?\d[A-Z]'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '[234567890123456789+x<=>=~pi-><=]'
           OR e->>'conteudo' ~ '\^[+-]?\d+'
    )
  );

-- 4.8 URLs de imagem invalidas
SELECT
    'URLs de imagem INVALIDAS (nan, null, etc)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2022
  AND (
    LOWER(TRIM(COALESCE(alt_a_imagem, ''))) IN ('nan', 'none', 'null', 'undefined')
    OR LOWER(TRIM(COALESCE(alt_b_imagem, ''))) IN ('nan', 'none', 'null', 'undefined')
    OR LOWER(TRIM(COALESCE(alt_c_imagem, ''))) IN ('nan', 'none', 'null', 'undefined')
    OR LOWER(TRIM(COALESCE(alt_d_imagem, ''))) IN ('nan', 'none', 'null', 'undefined')
    OR LOWER(TRIM(COALESCE(alt_e_imagem, ''))) IN ('nan', 'none', 'null', 'undefined')
  );

-- 4.9 Prefixos de alternativas redundantes
SELECT
    'Alternativas com prefixo redundante (A), B), etc)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2022
  AND (
    alt_a_texto ~ '^[Aa][\.\)\-]\s*'
    OR alt_b_texto ~ '^[Bb][\.\)\-]\s*'
    OR alt_c_texto ~ '^[Cc][\.\)\-]\s*'
    OR alt_d_texto ~ '^[Dd][\.\)\-]\s*'
    OR alt_e_texto ~ '^[Ee][\.\)\-]\s*'
  );

-- 4.10 Caderno nao definido
SELECT
    'Questoes SEM caderno definido' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2022
  AND (caderno IS NULL OR TRIM(caderno) = '');

-- 4.11 Dia nao definido
SELECT
    'Questoes SEM dia definido' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2022
  AND dia IS NULL;

-- 4.12 Rotulos misturados no conteudo (TEXTO I, TEXTO II)
SELECT
    'Rotulos TEXTO I/II misturados no conteudo' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2022
  AND e->>'tipo' = 'texto'
  AND (e->>'rotulo' IS NULL OR e->>'rotulo' = '')
  AND (
    e->>'conteudo' ~* '^TEXTO\s+[IVX]+\s*\n'
    OR e->>'conteudo' ~* '^\*\*TEXTO\s+[IVX]+\*\*\s*\n'
  );

-- 4.13 Quebras de linha artificiais
SELECT
    'Textos com quebras de linha artificiais (\n no meio de frases)' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2022
  AND e->>'tipo' IN ('texto', 'comando')
  AND e->>'conteudo' ~ '[^\n]\n[^\n]'
  AND e->>'conteudo' NOT LIKE '%<small%';

-- ===============================================================================
-- 5. VERIFICAR DISTRIBUICAO POR AREA
-- ===============================================================================

SELECT '=== 5. DISTRIBUICAO POR AREA - 2022 ===' as secao;

SELECT
    area,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE dia = 1) as dia_1,
    COUNT(*) FILTER (WHERE dia = 2) as dia_2,
    COUNT(*) FILTER (WHERE dia IS NULL) as sem_dia
FROM questoes_enem
WHERE ano = 2022
GROUP BY area
ORDER BY total DESC;

-- ===============================================================================
-- 6. AMOSTRA DE QUESTOES 2022 (incluindo Q144 e Q152 mencionadas)
-- ===============================================================================

SELECT '=== 6. AMOSTRA: QUESTOES ESPECIFICAS 2022 ===' as secao;

-- Questao Q144 (Matematica) - mencionada nas screenshots
SELECT
    'Q144 - Matematica' as referencia,
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
WHERE ano = 2022 AND numero = 144;

-- Questao Q152 (Matematica) - mencionada nas screenshots
SELECT
    'Q152 - Matematica' as referencia,
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
WHERE ano = 2022 AND numero = 152;

-- Amostra geral
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
WHERE ano = 2022
ORDER BY numero
LIMIT 10;

-- ===============================================================================
-- 7. COMPARAR ESTRUTURA DETALHADA (2022 vs 2024)
-- ===============================================================================

SELECT '=== 7. COMPARACAO DETALHADA 2022 vs 2024 ===' as secao;

-- Questao 2024 com fonte separada (para referencia)
SELECT
    'REFERENCIA 2024' as tipo,
    ano, dia, numero, area,
    jsonb_pretty(elementos) as elementos_formatados
FROM questoes_enem
WHERE ano = 2024
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(elementos) e
    WHERE e->>'tipo' = 'fonte'
  )
LIMIT 1;

-- Questao 2022 similar
SELECT
    'QUESTAO 2022' as tipo,
    ano, dia, numero, area,
    jsonb_pretty(elementos) as elementos_formatados
FROM questoes_enem
WHERE ano = 2022
  AND elementos IS NOT NULL
  AND jsonb_array_length(elementos) > 0
LIMIT 1;

-- ===============================================================================
-- 8. VERIFICAR CONSISTENCIA DOS TIPOS DE ELEMENTO
-- ===============================================================================

SELECT '=== 8. TIPOS DE ELEMENTO UNICOS POR ANO ===' as secao;

SELECT DISTINCT
    q.ano,
    e->>'tipo' as tipo_elemento
FROM questoes_enem q,
     jsonb_array_elements(COALESCE(q.elementos, '[]'::jsonb)) e
WHERE q.ano IN (2022, 2024, 2025)
ORDER BY q.ano, tipo_elemento;

-- ===============================================================================
-- 9. RESUMO FINAL
-- ===============================================================================

SELECT '=== 9. RESUMO FINAL ===' as secao;

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
                'Linguagens, Codigos e suas Tecnologias',
                'Ciencias Humanas e suas Tecnologias',
                'Ciencias da Natureza e suas Tecnologias',
                'Matematica e suas Tecnologias'
            )
        ) as completas,
        COUNT(*) FILTER (WHERE
            elementos IS NULL
            OR jsonb_array_length(elementos) = 0
            OR comando IS NULL
            OR TRIM(comando) = ''
        ) as incompletas
    FROM questoes_enem
    WHERE ano IN (2022, 2024, 2025)
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

-- ===============================================================================
-- 10. DIAGNOSTICO ESPECIFICO DE FORMATACAO
-- ===============================================================================

SELECT '=== 10. VERIFICACAO DE FORMATACAO ===' as secao;

-- Questoes com fontes ja em tag <small>
SELECT
    'Fontes JA formatadas com <small>' as status,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2022
  AND (
    e->>'conteudo' LIKE '%<small%'
    OR e->>'tipo' = 'fonte'
  );

-- Questoes com formulas ja Unicode formatadas
SELECT
    'Formulas JA formatadas (Unicode 234)' as status,
    COUNT(*) as quantidade
FROM questoes_enem q
WHERE q.ano = 2022
  AND (
    q.comando ~ '[01234567890123456789]'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '[01234567890123456789]'
    )
  );

-- ===============================================================================
-- 11. ANALISE DE IMAGENS FALTANTES
-- ===============================================================================

SELECT '=== 11. ANALISE DE IMAGENS ===' as secao;

-- Questoes com tem_imagem=true mas sem imagem valida nos elementos
SELECT
    'tem_imagem=true mas SEM imagem valida nos elementos' as problema,
    COUNT(*) as quantidade
FROM questoes_enem q
WHERE q.ano = 2022
  AND q.tem_imagem = true
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(q.elementos) e
    WHERE e->>'tipo' = 'imagem'
      AND e->>'arquivo' IS NOT NULL
      AND TRIM(e->>'arquivo') != ''
      AND LOWER(e->>'arquivo') NOT IN ('nan', 'null', 'none', 'undefined')
  );

-- Questoes com imagens nos elementos que tem URLs problematicas
SELECT
    'Imagens com URLs problematicas (localhost, file://, etc)' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2022
  AND e->>'tipo' = 'imagem'
  AND (
    e->>'arquivo' LIKE 'http://localhost%'
    OR e->>'arquivo' LIKE 'file://%'
    OR e->>'arquivo' LIKE '%[object Object]%'
    OR LOWER(e->>'arquivo') IN ('nan', 'null', 'none', 'undefined')
  );

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '  DIAGNOSTICO ENEM 2022 CONCLUIDO';
    RAISE NOTICE '  Execute corrigir-enem-2022.sql para aplicar correcoes necessarias';
    RAISE NOTICE '========================================================================';
END $$;
