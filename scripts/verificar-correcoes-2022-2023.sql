-- ===============================================================================
-- VERIFICACAO FINAL: CORRECOES ENEM 2022/2023
-- Validar que as questoes estao no padrao 2024/2025
-- Execute no Supabase SQL Editor APOS rodar os scripts de correcao
-- Data: 2026-03-15
-- ===============================================================================

-- ===============================================================================
-- 1. COMPARACAO ESTRUTURAL: 2022/2023 vs 2024/2025
-- ===============================================================================

SELECT '=== 1. COMPARACAO ESTRUTURAL POR ANO ===' as secao;

SELECT
    ano,
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE elementos IS NOT NULL AND jsonb_array_length(elementos) > 0) as com_elementos,
    ROUND(100.0 * COUNT(*) FILTER (WHERE elementos IS NOT NULL AND jsonb_array_length(elementos) > 0) / COUNT(*), 1) as pct_elementos,
    COUNT(*) FILTER (WHERE comando IS NOT NULL AND TRIM(comando) != '') as com_comando,
    COUNT(*) FILTER (WHERE gabarito IS NOT NULL AND gabarito IN ('A', 'B', 'C', 'D', 'E')) as com_gabarito_valido,
    COUNT(*) FILTER (WHERE tem_imagem = true) as com_imagem,
    COUNT(*) FILTER (WHERE tem_formula = true) as com_formula,
    COUNT(*) FILTER (WHERE tem_imagem_alternativa = true) as com_img_alt
FROM questoes_enem
WHERE ano IN (2022, 2023, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- ===============================================================================
-- 2. VALIDACAO DE ELEMENTOS JSONB
-- ===============================================================================

SELECT '=== 2. DISTRIBUICAO DE TIPOS DE ELEMENTOS ===' as secao;

SELECT
    ano,
    e->>'tipo' as tipo_elemento,
    COUNT(*) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE ano IN (2022, 2023, 2024, 2025)
GROUP BY ano, e->>'tipo'
ORDER BY ano, tipo_elemento;

-- ===============================================================================
-- 3. VALIDACAO DE ROTULOS (TEXTO I, TEXTO II, etc)
-- ===============================================================================

SELECT '=== 3. QUESTOES COM ROTULOS ===' as secao;

SELECT
    ano,
    COUNT(DISTINCT q.id) as questoes_com_rotulo
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE ano IN (2022, 2023, 2024, 2025)
  AND e->>'rotulo' IS NOT NULL
  AND TRIM(e->>'rotulo') != ''
GROUP BY ano
ORDER BY ano;

-- ===============================================================================
-- 4. VALIDACAO DE FORMATACAO UNICODE
-- ===============================================================================

SELECT '=== 4. FORMATACAO UNICODE ===' as secao;

-- Formulas quimicas com subscrito Unicode
SELECT
    'Formulas quimicas Unicode' as tipo,
    ano,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE ano IN (2022, 2023, 2024, 2025)
  AND e->>'conteudo' ~ '[₀₁₂₃₄₅₆₇₈₉]'
GROUP BY ano
ORDER BY ano;

-- Notacao cientifica com expoente Unicode
SELECT
    'Notacao cientifica Unicode' as tipo,
    ano,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE ano IN (2022, 2023, 2024, 2025)
  AND e->>'conteudo' ~ '[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]'
GROUP BY ano
ORDER BY ano;

-- ===============================================================================
-- 5. PROBLEMAS REMANESCENTES (DEVE RETORNAR ZERO)
-- ===============================================================================

SELECT '=== 5. PROBLEMAS REMANESCENTES (OBJETIVO: ZERO) ===' as secao;

-- 5.1 Questoes sem elementos
SELECT
    'Questoes sem elementos' as problema,
    ano,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano IN (2022, 2023)
  AND (elementos IS NULL OR jsonb_array_length(elementos) = 0)
GROUP BY ano
ORDER BY ano;

-- 5.2 Formulas ASCII ainda presentes
SELECT
    'Formulas ASCII (H2O, CO2, etc)' as problema,
    ano,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE ano IN (2022, 2023)
  AND e->>'tipo' IN ('texto', 'comando')
  AND (
    e->>'conteudo' ~ '\mH2O\M'
    OR e->>'conteudo' ~ '\mCO2\M'
    OR e->>'conteudo' ~ '\mH2SO4\M'
  )
GROUP BY ano
ORDER BY ano;

-- 5.3 TEXTO I/II ainda no conteudo (deveria estar em rotulo)
SELECT
    'TEXTO I/II no conteudo' as problema,
    ano,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE ano IN (2022, 2023)
  AND e->>'tipo' = 'texto'
  AND (e->>'rotulo' IS NULL OR e->>'rotulo' = '')
  AND e->>'conteudo' ~* '^TEXTO\s+[IVX]+\s*\n'
GROUP BY ano
ORDER BY ano;

-- 5.4 Fontes sem tag <small>
SELECT
    'Fontes sem <small>' as problema,
    ano,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE ano IN (2022, 2023)
  AND e->>'tipo' = 'fonte'
  AND e->>'conteudo' IS NOT NULL
  AND e->>'conteudo' NOT LIKE '%<small>%'
GROUP BY ano
ORDER BY ano;

-- 5.5 URLs de imagem invalidas
SELECT
    'URLs de imagem invalidas' as problema,
    ano,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE ano IN (2022, 2023)
  AND e->>'tipo' = 'imagem'
  AND (
    e->>'arquivo' IS NULL
    OR LOWER(TRIM(e->>'arquivo')) IN ('nan', 'null', 'none', 'undefined', '')
    OR e->>'arquivo' LIKE '%localhost%'
    OR e->>'arquivo' LIKE 'file://%'
  )
GROUP BY ano
ORDER BY ano;

-- 5.6 Alternativas com prefixo redundante
SELECT
    'Alternativas com prefixo (A), B), etc)' as problema,
    ano,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano IN (2022, 2023)
  AND (
    alt_a_texto ~* '^\s*\(?[aA]\)?[\.\)\:]?\s+'
    OR alt_b_texto ~* '^\s*\(?[bB]\)?[\.\)\:]?\s+'
    OR alt_c_texto ~* '^\s*\(?[cC]\)?[\.\)\:]?\s+'
    OR alt_d_texto ~* '^\s*\(?[dD]\)?[\.\)\:]?\s+'
    OR alt_e_texto ~* '^\s*\(?[eE]\)?[\.\)\:]?\s+'
  )
GROUP BY ano
ORDER BY ano;

-- 5.7 Questoes sem gabarito valido
SELECT
    'Questoes sem gabarito valido' as problema,
    ano,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano IN (2022, 2023)
  AND (gabarito IS NULL OR gabarito NOT IN ('A', 'B', 'C', 'D', 'E'))
GROUP BY ano
ORDER BY ano;

-- 5.8 Flags incorretas
SELECT
    'Flag tem_imagem incorreta' as problema,
    ano,
    COUNT(*) as quantidade
FROM questoes_enem q
WHERE ano IN (2022, 2023)
  AND tem_imagem = true
  AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.elementos) e
      WHERE e->>'tipo' = 'imagem'
        AND e->>'arquivo' IS NOT NULL
        AND e->>'arquivo' LIKE 'https://%'
  )
GROUP BY ano
ORDER BY ano;

-- ===============================================================================
-- 6. VALIDACAO DE METADADOS
-- ===============================================================================

SELECT '=== 6. VALIDACAO DE METADADOS ===' as secao;

-- Areas padronizadas
SELECT
    ano,
    area,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano IN (2022, 2023, 2024, 2025)
GROUP BY ano, area
ORDER BY ano, area;

-- Dias preenchidos
SELECT
    ano,
    dia,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano IN (2022, 2023, 2024, 2025)
GROUP BY ano, dia
ORDER BY ano, dia;

-- ===============================================================================
-- 7. COMPARACAO DETALHADA DE ESTRUTURA DE ELEMENTOS
-- ===============================================================================

SELECT '=== 7. ESTRUTURA MEDIA DE ELEMENTOS POR QUESTAO ===' as secao;

SELECT
    ano,
    ROUND(AVG(jsonb_array_length(elementos)), 2) as media_elementos,
    MIN(jsonb_array_length(elementos)) as min_elementos,
    MAX(jsonb_array_length(elementos)) as max_elementos,
    ROUND(AVG(
        (SELECT COUNT(*) FROM jsonb_array_elements(elementos) e WHERE e->>'tipo' = 'texto')
    ), 2) as media_textos,
    ROUND(AVG(
        (SELECT COUNT(*) FROM jsonb_array_elements(elementos) e WHERE e->>'tipo' = 'imagem')
    ), 2) as media_imagens
FROM questoes_enem
WHERE ano IN (2022, 2023, 2024, 2025)
  AND elementos IS NOT NULL
  AND jsonb_array_length(elementos) > 0
GROUP BY ano
ORDER BY ano;

-- ===============================================================================
-- 8. CHECKSUM DE PARIDADE (COMPARAR 2022/2023 com 2024/2025)
-- ===============================================================================

SELECT '=== 8. CHECKSUM DE PARIDADE ===' as secao;

WITH metricas AS (
    SELECT
        ano,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE elementos IS NOT NULL AND jsonb_array_length(elementos) > 0) as com_elementos,
        COUNT(*) FILTER (WHERE gabarito IN ('A','B','C','D','E')) as com_gabarito,
        COUNT(*) FILTER (WHERE dia IS NOT NULL) as com_dia,
        COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM jsonb_array_elements(elementos) e
            WHERE e->>'conteudo' ~ '[₀₁₂₃₄₅₆₇₈₉]'
        )) as com_unicode
    FROM questoes_enem
    WHERE ano IN (2022, 2023, 2024, 2025)
    GROUP BY ano
),
percentuais AS (
    SELECT
        ano,
        ROUND(100.0 * com_elementos / NULLIF(total, 0), 1) as pct_elementos,
        ROUND(100.0 * com_gabarito / NULLIF(total, 0), 1) as pct_gabarito,
        ROUND(100.0 * com_dia / NULLIF(total, 0), 1) as pct_dia
    FROM metricas
)
SELECT
    p2022.ano as ano_2022,
    p2024.ano as ano_2024,
    CASE
        WHEN ABS(p2022.pct_elementos - p2024.pct_elementos) < 5 THEN 'OK'
        ELSE 'DIVERGENTE'
    END as paridade_elementos,
    CASE
        WHEN ABS(p2022.pct_gabarito - p2024.pct_gabarito) < 5 THEN 'OK'
        ELSE 'DIVERGENTE'
    END as paridade_gabarito,
    CASE
        WHEN ABS(p2022.pct_dia - p2024.pct_dia) < 5 THEN 'OK'
        ELSE 'DIVERGENTE'
    END as paridade_dia
FROM percentuais p2022
CROSS JOIN percentuais p2024
WHERE p2022.ano = 2022 AND p2024.ano = 2024

UNION ALL

SELECT
    p2023.ano as ano_2023,
    p2025.ano as ano_2025,
    CASE
        WHEN ABS(p2023.pct_elementos - p2025.pct_elementos) < 5 THEN 'OK'
        ELSE 'DIVERGENTE'
    END as paridade_elementos,
    CASE
        WHEN ABS(p2023.pct_gabarito - p2025.pct_gabarito) < 5 THEN 'OK'
        ELSE 'DIVERGENTE'
    END as paridade_gabarito,
    CASE
        WHEN ABS(p2023.pct_dia - p2025.pct_dia) < 5 THEN 'OK'
        ELSE 'DIVERGENTE'
    END as paridade_dia
FROM percentuais p2023
CROSS JOIN percentuais p2025
WHERE p2023.ano = 2023 AND p2025.ano = 2025;

-- ===============================================================================
-- 9. AMOSTRA DE QUESTOES CORRIGIDAS (VERIFICACAO VISUAL)
-- ===============================================================================

SELECT '=== 9. AMOSTRA DE QUESTOES PARA VERIFICACAO VISUAL ===' as secao;

-- Questao 19/2023 (Linguagens) - Mencionada nas screenshots
SELECT
    'Questao 19/2023 (Linguagens)' as referencia,
    id,
    numero,
    area,
    jsonb_array_length(elementos) as num_elementos,
    (SELECT string_agg(e->>'tipo', ', ' ORDER BY (e->>'ordem')::int)
     FROM jsonb_array_elements(elementos) e) as tipos_elementos,
    LEFT(comando, 100) as comando_inicio,
    gabarito
FROM questoes_enem
WHERE ano = 2023 AND numero = 19
  AND area ILIKE '%linguagens%'
LIMIT 1;

-- Questao 144/2022 (Matematica) - Mencionada nas screenshots
SELECT
    'Questao 144/2022 (Matematica)' as referencia,
    id,
    numero,
    area,
    jsonb_array_length(elementos) as num_elementos,
    (SELECT string_agg(e->>'tipo', ', ' ORDER BY (e->>'ordem')::int)
     FROM jsonb_array_elements(elementos) e) as tipos_elementos,
    LEFT(comando, 100) as comando_inicio,
    gabarito
FROM questoes_enem
WHERE ano = 2022 AND numero = 144
LIMIT 1;

-- Questao 152/2022 (Matematica) - Mencionada nas screenshots
SELECT
    'Questao 152/2022 (Matematica)' as referencia,
    id,
    numero,
    area,
    jsonb_array_length(elementos) as num_elementos,
    (SELECT string_agg(e->>'tipo', ', ' ORDER BY (e->>'ordem')::int)
     FROM jsonb_array_elements(elementos) e) as tipos_elementos,
    LEFT(comando, 100) as comando_inicio,
    gabarito
FROM questoes_enem
WHERE ano = 2022 AND numero = 152
LIMIT 1;

-- ===============================================================================
-- 10. RESUMO FINAL DE CONFORMIDADE
-- ===============================================================================

SELECT '=== 10. RESUMO FINAL DE CONFORMIDADE ===' as secao;

WITH validacao AS (
    SELECT
        ano,
        -- Criterios de conformidade
        COUNT(*) FILTER (WHERE elementos IS NOT NULL AND jsonb_array_length(elementos) > 0) as v1_elementos,
        COUNT(*) FILTER (WHERE comando IS NOT NULL AND TRIM(comando) != '') as v2_comando,
        COUNT(*) FILTER (WHERE gabarito IN ('A','B','C','D','E')) as v3_gabarito,
        COUNT(*) FILTER (WHERE dia IN (1, 2)) as v4_dia,
        COUNT(*) FILTER (WHERE area IS NOT NULL) as v5_area,
        COUNT(*) as total
    FROM questoes_enem
    WHERE ano IN (2022, 2023)
    GROUP BY ano
)
SELECT
    ano,
    ROUND(100.0 * v1_elementos / total, 1) as "% Elementos OK",
    ROUND(100.0 * v2_comando / total, 1) as "% Comando OK",
    ROUND(100.0 * v3_gabarito / total, 1) as "% Gabarito OK",
    ROUND(100.0 * v4_dia / total, 1) as "% Dia OK",
    ROUND(100.0 * v5_area / total, 1) as "% Area OK",
    CASE
        WHEN v1_elementos = total
             AND v2_comando = total
             AND v3_gabarito = total
             AND v4_dia = total
             AND v5_area = total
        THEN 'CONFORME - Paridade com 2024/2025'
        ELSE 'PENDENTE - Verificar problemas acima'
    END as status_final
FROM validacao
ORDER BY ano;

-- ===============================================================================
-- CONCLUSAO
-- ===============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '  VERIFICACAO DE CORRECOES ENEM 2022/2023 CONCLUIDA';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '  CHECKLIST DE VALIDACAO:';
    RAISE NOTICE '  ';
    RAISE NOTICE '  [ ] Secao 1: Todos os anos com 100%% de elementos preenchidos';
    RAISE NOTICE '  [ ] Secao 5: Todos os problemas com quantidade = 0';
    RAISE NOTICE '  [ ] Secao 8: Paridade OK em todas as metricas';
    RAISE NOTICE '  [ ] Secao 9: Questoes das screenshots com estrutura correta';
    RAISE NOTICE '  [ ] Secao 10: Status CONFORME para 2022 e 2023';
    RAISE NOTICE '';
    RAISE NOTICE '  SE ALGUM CRITERIO FALHAR:';
    RAISE NOTICE '    1. Identifique o problema na secao correspondente';
    RAISE NOTICE '    2. Re-execute o script de correcao apropriado';
    RAISE NOTICE '    3. Execute esta verificacao novamente';
    RAISE NOTICE '';
    RAISE NOTICE '  PROXIMOS PASSOS:';
    RAISE NOTICE '    1. Testar na plataforma: simulados ENEM 2022 e 2023';
    RAISE NOTICE '    2. Verificar renderizacao de imagens e formulas';
    RAISE NOTICE '    3. Comparar visualmente com questoes de 2024/2025';
    RAISE NOTICE '';
END $$;
