-- ================================================================
-- CORREÇÃO AUTOMÁTICA - QUESTÕES ENEM
-- ================================================================
-- Execute este script APÓS rodar o diagnóstico (17_diagnostico...)
-- para corrigir os problemas encontrados automaticamente
-- ================================================================

-- ████████████████████████████████████████████████████████████████
-- 1. CORRIGIR RESPOSTAS INVÁLIDAS
-- ████████████████████████████████████████████████████████████████

-- Padronizar respostas para maiúsculo e remover espaços
UPDATE questoes_enem
SET resposta_correta = UPPER(TRIM(resposta_correta))
WHERE resposta_correta != UPPER(TRIM(resposta_correta));

-- Extrair apenas a letra válida de respostas com lixo
UPDATE questoes_enem
SET resposta_correta = SUBSTRING(
    REGEXP_REPLACE(resposta_correta, '[^A-Ea-e]', '', 'g')
    FROM 1 FOR 1
)
WHERE resposta_correta NOT IN ('A', 'B', 'C', 'D', 'E')
  AND REGEXP_REPLACE(resposta_correta, '[^A-Ea-e]', '', 'g') != '';

-- Se ainda houver respostas inválidas, definir como 'A' (fallback)
UPDATE questoes_enem
SET resposta_correta = 'A'
WHERE resposta_correta IS NULL
   OR resposta_correta NOT IN ('A', 'B', 'C', 'D', 'E');

-- ████████████████████████████████████████████████████████████████
-- 2. LIMPAR VALORES 'nan', 'None', 'null' COMO TEXTO
-- ████████████████████████████████████████████████████████████████

-- Contexto
UPDATE questoes_enem
SET contexto = NULL
WHERE LOWER(TRIM(contexto)) IN ('nan', 'none', 'null', 'undefined', '');

-- Comando
UPDATE questoes_enem
SET comando = NULL
WHERE LOWER(TRIM(comando)) IN ('nan', 'none', 'null', 'undefined', '');

-- Alternativas - substituir nan por texto vazio
UPDATE questoes_enem
SET alternativa_a = ''
WHERE LOWER(TRIM(alternativa_a)) IN ('nan', 'none', 'null');

UPDATE questoes_enem
SET alternativa_b = ''
WHERE LOWER(TRIM(alternativa_b)) IN ('nan', 'none', 'null');

UPDATE questoes_enem
SET alternativa_c = ''
WHERE LOWER(TRIM(alternativa_c)) IN ('nan', 'none', 'null');

UPDATE questoes_enem
SET alternativa_d = ''
WHERE LOWER(TRIM(alternativa_d)) IN ('nan', 'none', 'null');

UPDATE questoes_enem
SET alternativa_e = ''
WHERE LOWER(TRIM(alternativa_e)) IN ('nan', 'none', 'null');

-- ████████████████████████████████████████████████████████████████
-- 3. CORRIGIR ESCAPES DE TEXTO
-- ████████████████████████████████████████████████████████████████

-- Substituir \n literal por quebra de linha real
UPDATE questoes_enem
SET contexto = REPLACE(contexto, '\n', E'\n')
WHERE contexto LIKE '%\\n%';

UPDATE questoes_enem
SET contexto = REPLACE(contexto, '\t', E'\t')
WHERE contexto LIKE '%\\t%';

UPDATE questoes_enem
SET contexto = REPLACE(contexto, '\r', '')
WHERE contexto LIKE '%\\r%';

-- Mesmo para alternativas
UPDATE questoes_enem
SET alternativa_a = REPLACE(REPLACE(REPLACE(alternativa_a, '\n', E'\n'), '\t', E'\t'), '\r', '')
WHERE alternativa_a LIKE '%\\n%' OR alternativa_a LIKE '%\\t%' OR alternativa_a LIKE '%\\r%';

UPDATE questoes_enem
SET alternativa_b = REPLACE(REPLACE(REPLACE(alternativa_b, '\n', E'\n'), '\t', E'\t'), '\r', '')
WHERE alternativa_b LIKE '%\\n%' OR alternativa_b LIKE '%\\t%' OR alternativa_b LIKE '%\\r%';

UPDATE questoes_enem
SET alternativa_c = REPLACE(REPLACE(REPLACE(alternativa_c, '\n', E'\n'), '\t', E'\t'), '\r', '')
WHERE alternativa_c LIKE '%\\n%' OR alternativa_c LIKE '%\\t%' OR alternativa_c LIKE '%\\r%';

UPDATE questoes_enem
SET alternativa_d = REPLACE(REPLACE(REPLACE(alternativa_d, '\n', E'\n'), '\t', E'\t'), '\r', '')
WHERE alternativa_d LIKE '%\\n%' OR alternativa_d LIKE '%\\t%' OR alternativa_d LIKE '%\\r%';

UPDATE questoes_enem
SET alternativa_e = REPLACE(REPLACE(REPLACE(alternativa_e, '\n', E'\n'), '\t', E'\t'), '\r', '')
WHERE alternativa_e LIKE '%\\n%' OR alternativa_e LIKE '%\\t%' OR alternativa_e LIKE '%\\r%';

-- ████████████████████████████████████████████████████████████████
-- 4. DECODIFICAR HTML ENTITIES
-- ████████████████████████████████████████████████████████████████

-- &amp; -> &
UPDATE questoes_enem
SET contexto = REPLACE(contexto, '&amp;', '&')
WHERE contexto LIKE '%&amp;%';

-- &lt; -> <
UPDATE questoes_enem
SET contexto = REPLACE(contexto, '&lt;', '<')
WHERE contexto LIKE '%&lt;%';

-- &gt; -> >
UPDATE questoes_enem
SET contexto = REPLACE(contexto, '&gt;', '>')
WHERE contexto LIKE '%&gt;%';

-- &nbsp; -> espaço
UPDATE questoes_enem
SET contexto = REPLACE(contexto, '&nbsp;', ' ')
WHERE contexto LIKE '%&nbsp;%';

-- &quot; -> "
UPDATE questoes_enem
SET contexto = REPLACE(contexto, '&quot;', '"')
WHERE contexto LIKE '%&quot;%';

-- &#39; -> '
UPDATE questoes_enem
SET contexto = REPLACE(contexto, '&#39;', '''')
WHERE contexto LIKE '%&#39;%';

-- ████████████████████████████████████████████████████████████████
-- 5. PADRONIZAR ÁREAS
-- ████████████████████████████████████████████████████████████████

-- Garantir que áreas estejam no formato correto
UPDATE questoes_enem
SET area = 'ciencias-natureza'
WHERE LOWER(area) LIKE '%natureza%'
   OR LOWER(area) LIKE '%natural%'
   OR LOWER(area) IN ('fisica', 'física', 'quimica', 'química', 'biologia');

UPDATE questoes_enem
SET area = 'matematica'
WHERE LOWER(area) LIKE '%matemat%';

UPDATE questoes_enem
SET area = 'linguagens'
WHERE LOWER(area) LIKE '%linguag%'
   OR LOWER(area) LIKE '%portugu%'
   OR LOWER(area) LIKE '%liter%';

UPDATE questoes_enem
SET area = 'ciencias-humanas'
WHERE LOWER(area) LIKE '%humanas%'
   OR LOWER(area) LIKE '%histor%'
   OR LOWER(area) LIKE '%geogr%';

-- ████████████████████████████████████████████████████████████████
-- 6. GERAR TÍTULOS FALTANTES
-- ████████████████████████████████████████████████████████████████

UPDATE questoes_enem
SET titulo = 'ENEM ' || ano_prova || ' - Questão ' || numero_questao
WHERE titulo IS NULL OR TRIM(titulo) = '';

-- ████████████████████████████████████████████████████████████████
-- 7. DEFINIR STATUS PADRÃO
-- ████████████████████████████████████████████████████████████████

UPDATE questoes_enem
SET status = 'ativa'
WHERE status IS NULL OR TRIM(status) = '';

-- ████████████████████████████████████████████████████████████████
-- 8. DEFINIR DIFICULDADE PADRÃO
-- ████████████████████████████████████████████████████████████████

UPDATE questoes_enem
SET dificuldade = 'medio'
WHERE dificuldade IS NULL OR TRIM(dificuldade) = '';

-- Garantir valores válidos
UPDATE questoes_enem
SET dificuldade = 'medio'
WHERE dificuldade NOT IN ('facil', 'medio', 'dificil');

-- ████████████████████████████████████████████████████████████████
-- 9. REMOVER QUESTÕES COMPLETAMENTE INVÁLIDAS
-- ████████████████████████████████████████████████████████████████

-- Deletar questões sem contexto E sem alternativas
DELETE FROM questoes_enem
WHERE (contexto IS NULL OR TRIM(contexto) = '')
  AND (alternativa_a IS NULL OR TRIM(alternativa_a) = '')
  AND (alternativa_b IS NULL OR TRIM(alternativa_b) = '');

-- ████████████████████████████████████████████████████████████████
-- 10. MARCAR QUESTÕES PROBLEMÁTICAS COMO INATIVAS
-- ████████████████████████████████████████████████████████████████

-- Questões com encoding quebrado
UPDATE questoes_enem
SET status = 'revisao'
WHERE contexto LIKE '%�%'
   OR alternativa_a LIKE '%�%'
   OR alternativa_b LIKE '%�%';

-- Questões com contexto muito curto
UPDATE questoes_enem
SET status = 'revisao'
WHERE LENGTH(contexto) < 20
  AND status = 'ativa';

-- ████████████████████████████████████████████████████████████████
-- VERIFICAÇÃO FINAL
-- ████████████████████████████████████████████████████████████████

SELECT '=== RESULTADO DAS CORREÇÕES ===' as info;

SELECT
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE status = 'ativa') as questoes_ativas,
    COUNT(*) FILTER (WHERE status = 'revisao') as questoes_em_revisao,
    COUNT(*) FILTER (WHERE resposta_correta IN ('A','B','C','D','E')) as respostas_validas,
    COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '') as com_imagem
FROM questoes_enem;

SELECT '=== DISTRIBUIÇÃO POR ÁREA (APÓS CORREÇÃO) ===' as info;

SELECT
    area,
    COUNT(*) as quantidade,
    COUNT(*) FILTER (WHERE status = 'ativa') as ativas
FROM questoes_enem
GROUP BY area
ORDER BY quantidade DESC;
