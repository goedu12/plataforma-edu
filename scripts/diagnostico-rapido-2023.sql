-- ═══════════════════════════════════════════════════════════════════════════════
-- DIAGNOSTICO RAPIDO - ENEM 2023
-- Execute no Supabase SQL Editor para verificar estado atual
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ RESUMO ENEM 2023 vs 2024/2025 ═══' as secao;

SELECT
    ano,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE tem_formula = true) as com_formula,
    COUNT(*) FILTER (WHERE tem_imagem = true) as com_imagem,
    COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(elementos) e
        WHERE e->>'rotulo' IS NOT NULL AND e->>'rotulo' != ''
    )) as com_rotulo,
    COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(elementos) e
        WHERE e->>'conteudo' LIKE '%<small>%'
    )) as com_fonte_small,
    COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(elementos) e
        WHERE e->>'conteudo' ~ '[₀₁₂₃₄₅₆₇₈₉]'
    )) as com_unicode
FROM questoes_enem
WHERE ano IN (2023, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ PROBLEMAS PENDENTES - 2023 ═══' as secao;

-- Questoes com TEXTO I/II no conteudo (sem rotulo separado)
SELECT
    'TEXTO I/II no conteudo (deve estar em rotulo)' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND e->>'tipo' = 'texto'
  AND (e->>'rotulo' IS NULL OR e->>'rotulo' = '')
  AND e->>'conteudo' ~* '^(TEXTO\s+[IVX]+|\*\*TEXTO\s+[IVX]+\*\*)\s*\n';

-- Formulas quimicas ainda em ASCII
SELECT
    'Formulas quimicas em ASCII (H2O em vez de H₂O)' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND e->>'conteudo' ~ '\b(H2O|CO2|O2|N2|H2SO4|NH3|CH4)\b';

-- URLs de imagem invalidas
SELECT
    'URLs de imagem vazias ou invalidas' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND e->>'tipo' = 'imagem'
  AND (
    e->>'arquivo' IS NULL
    OR e->>'arquivo' = ''
    OR e->>'arquivo' IN ('nan', 'null', 'undefined')
    OR e->>'arquivo' NOT LIKE 'http%'
  );

-- Fontes sem <small> tags
SELECT
    'Fontes sem formatacao <small>' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND e->>'tipo' = 'fonte'
  AND e->>'conteudo' IS NOT NULL
  AND e->>'conteudo' NOT LIKE '%<small>%';

-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ AMOSTRA DE QUESTOES COM PROBLEMAS ═══' as secao;

-- 5 questoes com TEXTO I/II no conteudo
SELECT
    q.id,
    q.numero,
    q.area,
    LEFT(e->>'conteudo', 80) as inicio_conteudo
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND e->>'tipo' = 'texto'
  AND e->>'conteudo' ~* '^TEXTO\s+[IVX]+'
LIMIT 5;

-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  PROXIMO PASSO: Execute corrigir-enem-2023-v3.sql para corrigir';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
END $$;
