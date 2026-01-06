-- ════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO DE ALTERNATIVAS - QUESTÕES ENEM
-- ════════════════════════════════════════════════════════════════════════════
-- Este script corrige problemas nos textos das alternativas:
-- - Valores nan/None/null
-- - Escapes literais (\n, \t)
-- - HTML entities (&amp;, &lt;, etc)
-- - Prefixos desnecessários (A., B), etc)
-- ════════════════════════════════════════════════════════════════════════════

-- 1. DIAGNÓSTICO INICIAL
SELECT '═══ DIAGNÓSTICO DE ALTERNATIVAS ═══' as secao;

SELECT
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE alternativa_a IS NOT NULL AND TRIM(alternativa_a) != '') as com_alt_a,
    COUNT(*) FILTER (WHERE alternativa_b IS NOT NULL AND TRIM(alternativa_b) != '') as com_alt_b,
    COUNT(*) FILTER (WHERE alternativa_c IS NOT NULL AND TRIM(alternativa_c) != '') as com_alt_c,
    COUNT(*) FILTER (WHERE alternativa_d IS NOT NULL AND TRIM(alternativa_d) != '') as com_alt_d,
    COUNT(*) FILTER (WHERE alternativa_e IS NOT NULL AND TRIM(alternativa_e) != '') as com_alt_e
FROM questoes_enem;

-- 2. IDENTIFICAR PROBLEMAS NAS ALTERNATIVAS
SELECT '═══ PROBLEMAS NAS ALTERNATIVAS ═══' as secao;

SELECT 'Alternativas com nan/None/null' as problema, COUNT(*) as qtd
FROM questoes_enem
WHERE LOWER(TRIM(COALESCE(alternativa_a, ''))) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(COALESCE(alternativa_b, ''))) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(COALESCE(alternativa_c, ''))) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(COALESCE(alternativa_d, ''))) IN ('nan', 'none', 'null', 'undefined')
   OR LOWER(TRIM(COALESCE(alternativa_e, ''))) IN ('nan', 'none', 'null', 'undefined')
UNION ALL
SELECT 'Alternativas com escapes literais (\n, \t)' as problema, COUNT(*) as qtd
FROM questoes_enem
WHERE alternativa_a LIKE '%\\n%' OR alternativa_a LIKE '%\\t%'
   OR alternativa_b LIKE '%\\n%' OR alternativa_b LIKE '%\\t%'
   OR alternativa_c LIKE '%\\n%' OR alternativa_c LIKE '%\\t%'
UNION ALL
SELECT 'Alternativas com HTML entities (&amp;, &lt;)' as problema, COUNT(*) as qtd
FROM questoes_enem
WHERE alternativa_a LIKE '%&amp;%' OR alternativa_a LIKE '%&lt;%' OR alternativa_a LIKE '%&gt;%'
   OR alternativa_b LIKE '%&amp;%' OR alternativa_b LIKE '%&lt;%'
UNION ALL
SELECT 'Contexto com problemas' as problema, COUNT(*) as qtd
FROM questoes_enem
WHERE LOWER(TRIM(COALESCE(contexto, ''))) IN ('nan', 'none', 'null', 'undefined')
   OR contexto LIKE '%\\n%' OR contexto LIKE '%\\t%';

-- 3. AMOSTRA DE ALTERNATIVAS PROBLEMÁTICAS
SELECT '═══ AMOSTRA ALTERNATIVAS ═══' as secao;

SELECT id, id_api, LEFT(alternativa_a, 60) as alt_a_preview
FROM questoes_enem
WHERE LOWER(TRIM(COALESCE(alternativa_a, ''))) IN ('nan', 'none', 'null', 'undefined')
   OR alternativa_a LIKE '%\\n%'
   OR alternativa_a LIKE '%&amp;%'
LIMIT 10;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. CORREÇÕES
-- ════════════════════════════════════════════════════════════════════════════

-- 4.1 Corrigir valores nan/None/null nas alternativas
UPDATE questoes_enem
SET alternativa_a = ''
WHERE LOWER(TRIM(COALESCE(alternativa_a, ''))) IN ('nan', 'none', 'null', 'undefined');

UPDATE questoes_enem
SET alternativa_b = ''
WHERE LOWER(TRIM(COALESCE(alternativa_b, ''))) IN ('nan', 'none', 'null', 'undefined');

UPDATE questoes_enem
SET alternativa_c = ''
WHERE LOWER(TRIM(COALESCE(alternativa_c, ''))) IN ('nan', 'none', 'null', 'undefined');

UPDATE questoes_enem
SET alternativa_d = ''
WHERE LOWER(TRIM(COALESCE(alternativa_d, ''))) IN ('nan', 'none', 'null', 'undefined');

UPDATE questoes_enem
SET alternativa_e = ''
WHERE LOWER(TRIM(COALESCE(alternativa_e, ''))) IN ('nan', 'none', 'null', 'undefined');

-- 4.2 Corrigir escapes literais (\n → espaço, \t → espaço)
UPDATE questoes_enem
SET
    alternativa_a = REPLACE(REPLACE(REPLACE(alternativa_a, '\n', ' '), '\t', ' '), '\r', ''),
    alternativa_b = REPLACE(REPLACE(REPLACE(alternativa_b, '\n', ' '), '\t', ' '), '\r', ''),
    alternativa_c = REPLACE(REPLACE(REPLACE(alternativa_c, '\n', ' '), '\t', ' '), '\r', ''),
    alternativa_d = REPLACE(REPLACE(REPLACE(alternativa_d, '\n', ' '), '\t', ' '), '\r', ''),
    alternativa_e = REPLACE(REPLACE(REPLACE(alternativa_e, '\n', ' '), '\t', ' '), '\r', ''),
    contexto = REPLACE(REPLACE(REPLACE(contexto, '\n', ' '), '\t', ' '), '\r', ''),
    atualizado_em = NOW()
WHERE alternativa_a LIKE '%\n%' OR alternativa_a LIKE '%\t%'
   OR alternativa_b LIKE '%\n%' OR alternativa_b LIKE '%\t%'
   OR alternativa_c LIKE '%\n%' OR alternativa_c LIKE '%\t%'
   OR alternativa_d LIKE '%\n%' OR alternativa_d LIKE '%\t%'
   OR alternativa_e LIKE '%\n%' OR alternativa_e LIKE '%\t%'
   OR contexto LIKE '%\n%' OR contexto LIKE '%\t%';

-- 4.3 Corrigir HTML entities comuns
UPDATE questoes_enem
SET
    alternativa_a = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(alternativa_a, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&nbsp;', ' '),
    alternativa_b = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(alternativa_b, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&nbsp;', ' '),
    alternativa_c = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(alternativa_c, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&nbsp;', ' '),
    alternativa_d = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(alternativa_d, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&nbsp;', ' '),
    alternativa_e = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(alternativa_e, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&nbsp;', ' '),
    contexto = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(contexto, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'), '&quot;', '"'), '&nbsp;', ' '),
    atualizado_em = NOW()
WHERE alternativa_a LIKE '%&amp;%' OR alternativa_a LIKE '%&lt;%' OR alternativa_a LIKE '%&gt;%' OR alternativa_a LIKE '%&nbsp;%'
   OR alternativa_b LIKE '%&amp;%' OR alternativa_b LIKE '%&lt;%'
   OR alternativa_c LIKE '%&amp;%' OR alternativa_c LIKE '%&lt;%'
   OR alternativa_d LIKE '%&amp;%' OR alternativa_d LIKE '%&lt;%'
   OR alternativa_e LIKE '%&amp;%' OR alternativa_e LIKE '%&lt;%'
   OR contexto LIKE '%&amp;%' OR contexto LIKE '%&lt;%';

-- 4.4 Remover prefixos de alternativas (a), A., a., A), etc.
UPDATE questoes_enem
SET alternativa_a = REGEXP_REPLACE(alternativa_a, '^[aA][\.\)\-\:]\s*', '')
WHERE alternativa_a ~ '^[aA][\.\)\-\:]\s';

UPDATE questoes_enem
SET alternativa_b = REGEXP_REPLACE(alternativa_b, '^[bB][\.\)\-\:]\s*', '')
WHERE alternativa_b ~ '^[bB][\.\)\-\:]\s';

UPDATE questoes_enem
SET alternativa_c = REGEXP_REPLACE(alternativa_c, '^[cC][\.\)\-\:]\s*', '')
WHERE alternativa_c ~ '^[cC][\.\)\-\:]\s';

UPDATE questoes_enem
SET alternativa_d = REGEXP_REPLACE(alternativa_d, '^[dD][\.\)\-\:]\s*', '')
WHERE alternativa_d ~ '^[dD][\.\)\-\:]\s';

UPDATE questoes_enem
SET alternativa_e = REGEXP_REPLACE(alternativa_e, '^[eE][\.\)\-\:]\s*', '')
WHERE alternativa_e ~ '^[eE][\.\)\-\:]\s';

-- 4.5 Normalizar espaços múltiplos
UPDATE questoes_enem
SET
    alternativa_a = REGEXP_REPLACE(TRIM(alternativa_a), '\s+', ' ', 'g'),
    alternativa_b = REGEXP_REPLACE(TRIM(alternativa_b), '\s+', ' ', 'g'),
    alternativa_c = REGEXP_REPLACE(TRIM(alternativa_c), '\s+', ' ', 'g'),
    alternativa_d = REGEXP_REPLACE(TRIM(alternativa_d), '\s+', ' ', 'g'),
    alternativa_e = REGEXP_REPLACE(TRIM(alternativa_e), '\s+', ' ', 'g'),
    atualizado_em = NOW()
WHERE alternativa_a ~ '\s{2,}'
   OR alternativa_b ~ '\s{2,}'
   OR alternativa_c ~ '\s{2,}'
   OR alternativa_d ~ '\s{2,}'
   OR alternativa_e ~ '\s{2,}';

-- 4.6 Corrigir contexto com nan/None/null
UPDATE questoes_enem
SET contexto = ''
WHERE LOWER(TRIM(COALESCE(contexto, ''))) IN ('nan', 'none', 'null', 'undefined');

-- ════════════════════════════════════════════════════════════════════════════
-- 5. VERIFICAÇÃO FINAL
-- ════════════════════════════════════════════════════════════════════════════

SELECT '═══ RESULTADO FINAL ═══' as secao;

SELECT
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE alternativa_a IS NOT NULL AND TRIM(alternativa_a) != '') as alt_a_valida,
    COUNT(*) FILTER (WHERE alternativa_b IS NOT NULL AND TRIM(alternativa_b) != '') as alt_b_valida,
    COUNT(*) FILTER (WHERE alternativa_c IS NOT NULL AND TRIM(alternativa_c) != '') as alt_c_valida,
    COUNT(*) FILTER (WHERE alternativa_d IS NOT NULL AND TRIM(alternativa_d) != '') as alt_d_valida,
    COUNT(*) FILTER (WHERE alternativa_e IS NOT NULL AND TRIM(alternativa_e) != '') as alt_e_valida,
    COUNT(*) FILTER (WHERE contexto IS NOT NULL AND TRIM(contexto) != '') as contexto_valido
FROM questoes_enem;

-- Verificar se ainda há problemas
SELECT '═══ PROBLEMAS RESTANTES ═══' as secao;

SELECT id, id_api, 'alternativa vazia' as problema
FROM questoes_enem
WHERE (alternativa_a IS NULL OR TRIM(alternativa_a) = '')
  AND (alternativa_b IS NULL OR TRIM(alternativa_b) = '')
  AND (alternativa_c IS NULL OR TRIM(alternativa_c) = '')
  AND (alternativa_d IS NULL OR TRIM(alternativa_d) = '')
  AND (alternativa_e IS NULL OR TRIM(alternativa_e) = '')
LIMIT 10;

DO $$ BEGIN RAISE NOTICE '✅ Correção de alternativas concluída!'; END $$;
