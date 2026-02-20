-- =============================================================================
-- DIAGNÓSTICO COMPLETO DE QUESTÕES ENEM - SUPABASE
-- Execute cada bloco separadamente no SQL Editor do Supabase
-- Copie os resultados e envie para análise
-- =============================================================================


-- =============================================================================
-- SCRIPT 1: VISÃO GERAL DO BANCO
-- =============================================================================
SELECT
  '=== VISÃO GERAL ===' AS secao,
  COUNT(*) AS total_questoes,
  COUNT(DISTINCT ano) AS total_anos,
  MIN(ano) AS ano_mais_antigo,
  MAX(ano) AS ano_mais_recente,
  COUNT(*) FILTER (WHERE anulada = true) AS anuladas,
  COUNT(*) FILTER (WHERE tem_imagem = true) AS com_imagem,
  COUNT(*) FILTER (WHERE tem_imagem_alternativa = true) AS com_imagem_alternativa,
  COUNT(*) FILTER (WHERE tem_formula = true) AS com_formula
FROM questoes_enem;

-- Distribuição por área
SELECT
  area,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE tem_imagem = true) AS com_imagem,
  COUNT(*) FILTER (WHERE tem_formula = true) AS com_formula,
  COUNT(*) FILTER (WHERE anulada = true) AS anuladas
FROM questoes_enem
GROUP BY area
ORDER BY area;

-- Distribuição por ano e dia
SELECT
  ano,
  dia,
  COUNT(*) AS total_questoes,
  COUNT(DISTINCT caderno) AS cadernos
FROM questoes_enem
GROUP BY ano, dia
ORDER BY ano DESC, dia;


-- =============================================================================
-- SCRIPT 2: PROBLEMAS NOS ELEMENTOS (JSONB)
-- =============================================================================

-- 2A: Questões SEM elementos (campo vazio ou nulo)
SELECT
  id, ano, dia, numero, area,
  'elementos_vazios' AS problema,
  jsonb_array_length(elementos) AS qtd_elementos
FROM questoes_enem
WHERE elementos IS NULL
   OR elementos = '[]'::jsonb
   OR jsonb_array_length(elementos) = 0
ORDER BY ano DESC, numero;

-- 2B: Questões com FONTE misturada no texto (fonte não está em elemento próprio)
SELECT
  id, ano, dia, numero, area,
  'fonte_misturada_no_texto' AS problema,
  e->>'conteudo' AS trecho_problema
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE e->>'tipo' = 'texto'
  AND (
    e->>'conteudo' ILIKE '%Disponível em:%'
    OR e->>'conteudo' ILIKE '%Acesso em:%'
    OR e->>'conteudo' ILIKE '%Adaptado de:%'
    OR e->>'conteudo' ILIKE '%Fonte:%'
    OR e->>'conteudo' ~ '\. [A-Z][a-zÀ-ú]+, [A-Z]\.'  -- padrão ABNT
    OR e->>'conteudo' ILIKE '%. ed.%'
    OR e->>'conteudo' ILIKE '%. Editora%'
  )
ORDER BY ano DESC, numero;

-- 2C: Questões onde FONTE não é o último elemento
WITH posicoes AS (
  SELECT
    id, ano, numero, area,
    jsonb_array_length(elementos) - 1 AS ultimo_idx,
    (
      SELECT idx
      FROM jsonb_array_elements(elementos) WITH ORDINALITY AS e(elem, idx)
      WHERE elem->>'tipo' = 'fonte'
      ORDER BY idx DESC
      LIMIT 1
    ) - 1 AS idx_fonte
  FROM questoes_enem
  WHERE elementos IS NOT NULL
    AND jsonb_array_length(elementos) > 0
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(elementos) AS e
      WHERE e->>'tipo' = 'fonte'
    )
)
SELECT
  id, ano, numero, area,
  'fonte_fora_do_lugar' AS problema,
  ultimo_idx,
  idx_fonte
FROM posicoes
WHERE idx_fonte < ultimo_idx - 1  -- fonte não está no fim
ORDER BY ano DESC, numero;

-- 2D: Questões com TÍTULO mas sem FONTE (verificação de referência faltando)
SELECT
  id, ano, dia, numero, area,
  'titulo_sem_fonte' AS problema
FROM questoes_enem
WHERE elementos IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(elementos) AS e
    WHERE e->>'tipo' = 'titulo'
  )
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(elementos) AS e
    WHERE e->>'tipo' = 'fonte'
  )
ORDER BY ano DESC, numero;

-- 2E: Contar tipos de elementos por questão (resumo)
SELECT
  ano,
  area,
  SUM((SELECT COUNT(*) FROM jsonb_array_elements(elementos) AS e WHERE e->>'tipo' = 'titulo')) AS total_titulos,
  SUM((SELECT COUNT(*) FROM jsonb_array_elements(elementos) AS e WHERE e->>'tipo' = 'texto')) AS total_textos,
  SUM((SELECT COUNT(*) FROM jsonb_array_elements(elementos) AS e WHERE e->>'tipo' = 'imagem')) AS total_imagens,
  SUM((SELECT COUNT(*) FROM jsonb_array_elements(elementos) AS e WHERE e->>'tipo' = 'fonte')) AS total_fontes,
  SUM((SELECT COUNT(*) FROM jsonb_array_elements(elementos) AS e WHERE e->>'tipo' = 'comando')) AS total_comandos
FROM questoes_enem
WHERE elementos IS NOT NULL
GROUP BY ano, area
ORDER BY ano DESC, area;


-- =============================================================================
-- SCRIPT 3: PROBLEMAS DE IMAGENS
-- =============================================================================

-- 3A: Questões com tem_imagem=true mas SEM imagem nos elementos
SELECT
  id, ano, dia, numero, area,
  'flag_imagem_sem_elemento_imagem' AS problema
FROM questoes_enem
WHERE tem_imagem = true
  AND (
    elementos IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(elementos) AS e
      WHERE e->>'tipo' = 'imagem'
    )
  )
ORDER BY ano DESC, numero;

-- 3B: Questões com imagem nos elementos mas tem_imagem=false (flag incorreta)
SELECT
  id, ano, dia, numero, area,
  'flag_imagem_incorreta_false' AS problema,
  COUNT(*) FILTER (WHERE e->>'tipo' = 'imagem') AS imagens_encontradas
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE tem_imagem = false
  AND e->>'tipo' = 'imagem'
GROUP BY id, ano, dia, numero, area
ORDER BY ano DESC, numero;

-- 3C: Imagens com URL vazia ou nula nos elementos
SELECT
  id, ano, dia, numero, area,
  'imagem_sem_url' AS problema,
  e->>'arquivo' AS arquivo_valor
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE e->>'tipo' = 'imagem'
  AND (
    e->>'arquivo' IS NULL
    OR e->>'arquivo' = ''
    OR e->>'arquivo' = 'null'
  )
ORDER BY ano DESC, numero;

-- 3D: URLs de imagem suspeitas (não são HTTPS ou são muito curtas)
SELECT
  id, ano, dia, numero, area,
  'url_imagem_suspeita' AS problema,
  e->>'arquivo' AS url_imagem
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE e->>'tipo' = 'imagem'
  AND e->>'arquivo' IS NOT NULL
  AND e->>'arquivo' != ''
  AND (
    NOT (e->>'arquivo' ILIKE 'http%')
    OR LENGTH(e->>'arquivo') < 10
    OR e->>'arquivo' ILIKE '%placeholder%'
    OR e->>'arquivo' ILIKE '%lorem%'
    OR e->>'arquivo' ILIKE '%exemplo%'
    OR e->>'arquivo' ILIKE '%teste%'
  )
ORDER BY ano DESC, numero;

-- 3E: Questões com tem_imagem_alternativa=true mas alternativas sem imagem
SELECT
  id, ano, dia, numero, area,
  'flag_imagem_alternativa_sem_imagem' AS problema,
  alt_a_imagem, alt_b_imagem, alt_c_imagem, alt_d_imagem, alt_e_imagem
FROM questoes_enem
WHERE tem_imagem_alternativa = true
  AND alt_a_imagem IS NULL
  AND alt_b_imagem IS NULL
  AND alt_c_imagem IS NULL
  AND alt_d_imagem IS NULL
  AND alt_e_imagem IS NULL
ORDER BY ano DESC, numero;

-- 3F: Alternativas com imagem mas sem texto (alternativa só-imagem)
SELECT
  id, ano, dia, numero, area,
  'alternativa_so_imagem_sem_texto' AS problema,
  CASE
    WHEN alt_a_imagem IS NOT NULL AND (alt_a_texto IS NULL OR alt_a_texto = '') THEN 'A'
    WHEN alt_b_imagem IS NOT NULL AND (alt_b_texto IS NULL OR alt_b_texto = '') THEN 'B'
    WHEN alt_c_imagem IS NOT NULL AND (alt_c_texto IS NULL OR alt_c_texto = '') THEN 'C'
    WHEN alt_d_imagem IS NOT NULL AND (alt_d_texto IS NULL OR alt_d_texto = '') THEN 'D'
    WHEN alt_e_imagem IS NOT NULL AND (alt_e_texto IS NULL OR alt_e_texto = '') THEN 'E'
  END AS alternativa_afetada
FROM questoes_enem
WHERE (alt_a_imagem IS NOT NULL AND (alt_a_texto IS NULL OR alt_a_texto = ''))
   OR (alt_b_imagem IS NOT NULL AND (alt_b_texto IS NULL OR alt_b_texto = ''))
   OR (alt_c_imagem IS NOT NULL AND (alt_c_texto IS NULL OR alt_c_texto = ''))
   OR (alt_d_imagem IS NOT NULL AND (alt_d_texto IS NULL OR alt_d_texto = ''))
   OR (alt_e_imagem IS NOT NULL AND (alt_e_texto IS NULL OR alt_e_texto = ''))
ORDER BY ano DESC, numero;


-- =============================================================================
-- SCRIPT 4: PROBLEMAS NAS ALTERNATIVAS
-- =============================================================================

-- 4A: Questões com alternativas faltando (menos de 5)
SELECT
  id, ano, dia, numero, area,
  'alternativas_incompletas' AS problema,
  CASE WHEN alt_a_texto IS NULL AND alt_a_imagem IS NULL THEN 'A faltando ' ELSE '' END ||
  CASE WHEN alt_b_texto IS NULL AND alt_b_imagem IS NULL THEN 'B faltando ' ELSE '' END ||
  CASE WHEN alt_c_texto IS NULL AND alt_c_imagem IS NULL THEN 'C faltando ' ELSE '' END ||
  CASE WHEN alt_d_texto IS NULL AND alt_d_imagem IS NULL THEN 'D faltando ' ELSE '' END ||
  CASE WHEN alt_e_texto IS NULL AND alt_e_imagem IS NULL THEN 'E faltando ' ELSE '' END AS alternativas_faltando
FROM questoes_enem
WHERE NOT anulada
  AND (
    (alt_a_texto IS NULL AND alt_a_imagem IS NULL)
    OR (alt_b_texto IS NULL AND alt_b_imagem IS NULL)
    OR (alt_c_texto IS NULL AND alt_c_imagem IS NULL)
    OR (alt_d_texto IS NULL AND alt_d_imagem IS NULL)
    OR (alt_e_texto IS NULL AND alt_e_imagem IS NULL)
  )
ORDER BY ano DESC, numero;

-- 4B: Alternativas com texto muito curto (provavelmente cortado)
SELECT
  id, ano, dia, numero, area,
  'alternativa_texto_muito_curto' AS problema,
  CASE
    WHEN LENGTH(alt_a_texto) < 3 AND alt_a_texto IS NOT NULL THEN 'A: "' || alt_a_texto || '"'
    WHEN LENGTH(alt_b_texto) < 3 AND alt_b_texto IS NOT NULL THEN 'B: "' || alt_b_texto || '"'
    WHEN LENGTH(alt_c_texto) < 3 AND alt_c_texto IS NOT NULL THEN 'C: "' || alt_c_texto || '"'
    WHEN LENGTH(alt_d_texto) < 3 AND alt_d_texto IS NOT NULL THEN 'D: "' || alt_d_texto || '"'
    WHEN LENGTH(alt_e_texto) < 3 AND alt_e_texto IS NOT NULL THEN 'E: "' || alt_e_texto || '"'
  END AS detalhe
FROM questoes_enem
WHERE (LENGTH(alt_a_texto) < 3 AND alt_a_texto IS NOT NULL AND alt_a_imagem IS NULL)
   OR (LENGTH(alt_b_texto) < 3 AND alt_b_texto IS NOT NULL AND alt_b_imagem IS NULL)
   OR (LENGTH(alt_c_texto) < 3 AND alt_c_texto IS NOT NULL AND alt_c_imagem IS NULL)
   OR (LENGTH(alt_d_texto) < 3 AND alt_d_texto IS NOT NULL AND alt_d_imagem IS NULL)
   OR (LENGTH(alt_e_texto) < 3 AND alt_e_texto IS NOT NULL AND alt_e_imagem IS NULL)
ORDER BY ano DESC, numero;

-- 4C: Alternativas com letras iniciais erradas (deve começar com A), B), etc. ou texto direto)
SELECT
  id, ano, dia, numero, area,
  'alternativa_com_prefixo_duplicado' AS problema,
  SUBSTRING(alt_a_texto, 1, 10) AS inicio_alt_a,
  SUBSTRING(alt_b_texto, 1, 10) AS inicio_alt_b,
  SUBSTRING(alt_c_texto, 1, 10) AS inicio_alt_c
FROM questoes_enem
WHERE alt_a_texto ILIKE 'a)%'
   OR alt_a_texto ILIKE 'a.%'
   OR alt_b_texto ILIKE 'b)%'
   OR alt_b_texto ILIKE 'b.%'
   OR alt_c_texto ILIKE 'c)%'
   OR alt_d_texto ILIKE 'd)%'
   OR alt_e_texto ILIKE 'e)%'
ORDER BY ano DESC, numero;

-- 4D: Alternativas com gabarito inválido
SELECT
  id, ano, dia, numero, area,
  'gabarito_invalido' AS problema,
  gabarito
FROM questoes_enem
WHERE NOT anulada
  AND (
    gabarito IS NULL
    OR gabarito NOT IN ('A', 'B', 'C', 'D', 'E')
  )
ORDER BY ano DESC, numero;

-- 4E: Gabarito aponta para alternativa sem conteúdo
SELECT
  id, ano, dia, numero, area,
  'gabarito_aponta_alternativa_vazia' AS problema,
  gabarito,
  CASE gabarito
    WHEN 'A' THEN alt_a_texto
    WHEN 'B' THEN alt_b_texto
    WHEN 'C' THEN alt_c_texto
    WHEN 'D' THEN alt_d_texto
    WHEN 'E' THEN alt_e_texto
  END AS texto_alternativa_gabarito
FROM questoes_enem
WHERE NOT anulada
  AND gabarito IN ('A','B','C','D','E')
  AND (
    (gabarito = 'A' AND alt_a_texto IS NULL AND alt_a_imagem IS NULL)
    OR (gabarito = 'B' AND alt_b_texto IS NULL AND alt_b_imagem IS NULL)
    OR (gabarito = 'C' AND alt_c_texto IS NULL AND alt_c_imagem IS NULL)
    OR (gabarito = 'D' AND alt_d_texto IS NULL AND alt_d_imagem IS NULL)
    OR (gabarito = 'E' AND alt_e_texto IS NULL AND alt_e_imagem IS NULL)
  )
ORDER BY ano DESC, numero;


-- =============================================================================
-- SCRIPT 5: PROBLEMAS DE TEXTO E FORMATAÇÃO
-- =============================================================================

-- 5A: Textos com caracteres especiais corrompidos (encoding)
SELECT
  id, ano, dia, numero, area,
  'encoding_corrompido' AS problema,
  SUBSTRING(e->>'conteudo', 1, 100) AS trecho
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE e->>'tipo' IN ('texto', 'titulo', 'fonte', 'comando')
  AND (
    e->>'conteudo' LIKE '%Ã§%'   -- ç corrompido
    OR e->>'conteudo' LIKE '%Ã£%'  -- ã corrompido
    OR e->>'conteudo' LIKE '%Ã©%'  -- é corrompido
    OR e->>'conteudo' LIKE '%Ã³%'  -- ó corrompido
    OR e->>'conteudo' LIKE '%Ã¡%'  -- á corrompido
    OR e->>'conteudo' LIKE '%Ã­%'  -- í corrompido
    OR e->>'conteudo' LIKE '%â€%'  -- aspas corrompidas
    OR e->>'conteudo' LIKE '%Â %'  -- espaço quebrado
  )
ORDER BY ano DESC, numero;

-- 5B: Questões sem COMANDO (texto da pergunta vazio)
SELECT
  id, ano, dia, numero, area,
  'comando_vazio' AS problema
FROM questoes_enem
WHERE (comando IS NULL OR TRIM(comando) = '')
  AND NOT anulada
ORDER BY ano DESC, numero;

-- 5C: Comandos muito curtos (possível corte)
SELECT
  id, ano, dia, numero, area,
  'comando_muito_curto' AS problema,
  LENGTH(comando) AS tamanho,
  comando AS comando_texto
FROM questoes_enem
WHERE comando IS NOT NULL
  AND LENGTH(TRIM(comando)) < 20
  AND NOT anulada
ORDER BY ano DESC, numero;

-- 5D: Textos com marcadores HTML residuais
SELECT
  id, ano, dia, numero, area,
  'html_residual_no_texto' AS problema,
  e->>'tipo' AS tipo_elemento,
  SUBSTRING(e->>'conteudo', 1, 150) AS trecho
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE e->>'tipo' IN ('texto', 'titulo', 'fonte', 'comando')
  AND (
    e->>'conteudo' LIKE '%<p>%'
    OR e->>'conteudo' LIKE '%<br>%'
    OR e->>'conteudo' LIKE '%<br/>%'
    OR e->>'conteudo' LIKE '%<span%'
    OR e->>'conteudo' LIKE '%<div%'
    OR e->>'conteudo' LIKE '%&nbsp;%'
    OR e->>'conteudo' LIKE '%&amp;%'
    OR e->>'conteudo' LIKE '%&lt;%'
    OR e->>'conteudo' LIKE '%&gt;%'
    OR e->>'conteudo' LIKE '%&quot;%'
  )
ORDER BY ano DESC, numero;

-- 5E: Textos com espaços duplos ou quebras de linha excessivas
SELECT
  id, ano, dia, numero, area,
  'espacamento_excessivo' AS problema,
  e->>'tipo' AS tipo_elemento,
  SUBSTRING(e->>'conteudo', 1, 100) AS trecho
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE e->>'tipo' IN ('texto', 'comando')
  AND (
    e->>'conteudo' LIKE '%   %'    -- 3+ espaços consecutivos
    OR e->>'conteudo' LIKE E'%\n\n\n%'  -- 3+ quebras de linha
  )
ORDER BY ano DESC, numero;

-- 5F: Textos em alternativas com HTML residual
SELECT
  id, ano, dia, numero, area,
  'html_em_alternativa' AS problema,
  CASE
    WHEN alt_a_texto LIKE '%<p>%' OR alt_a_texto LIKE '%&nbsp;%' THEN 'A'
    WHEN alt_b_texto LIKE '%<p>%' OR alt_b_texto LIKE '%&nbsp;%' THEN 'B'
    WHEN alt_c_texto LIKE '%<p>%' OR alt_c_texto LIKE '%&nbsp;%' THEN 'C'
    WHEN alt_d_texto LIKE '%<p>%' OR alt_d_texto LIKE '%&nbsp;%' THEN 'D'
    WHEN alt_e_texto LIKE '%<p>%' OR alt_e_texto LIKE '%&nbsp;%' THEN 'E'
  END AS alternativa_afetada
FROM questoes_enem
WHERE alt_a_texto LIKE '%<p>%' OR alt_a_texto LIKE '%&nbsp;%'
   OR alt_b_texto LIKE '%<p>%' OR alt_b_texto LIKE '%&nbsp;%'
   OR alt_c_texto LIKE '%<p>%' OR alt_c_texto LIKE '%&nbsp;%'
   OR alt_d_texto LIKE '%<p>%' OR alt_d_texto LIKE '%&nbsp;%'
   OR alt_e_texto LIKE '%<p>%' OR alt_e_texto LIKE '%&nbsp;%'
ORDER BY ano DESC, numero;


-- =============================================================================
-- SCRIPT 6: PROBLEMAS DE DISPONIBILIDADE / CONSISTÊNCIA
-- =============================================================================

-- 6A: Números de questão duplicados no mesmo caderno/ano/dia
SELECT
  ano, dia, caderno, numero,
  COUNT(*) AS duplicatas,
  array_agg(id) AS ids
FROM questoes_enem
GROUP BY ano, dia, caderno, numero
HAVING COUNT(*) > 1
ORDER BY ano DESC, numero;

-- 6B: Sequência de números com buracos (questões faltando)
WITH sequencia AS (
  SELECT
    ano, dia, caderno,
    numero,
    LAG(numero) OVER (PARTITION BY ano, dia, caderno ORDER BY numero) AS numero_anterior
  FROM questoes_enem
)
SELECT
  ano, dia, caderno,
  numero_anterior AS ultimo_numero,
  numero AS proximo_numero,
  numero - numero_anterior - 1 AS questoes_faltando
FROM sequencia
WHERE numero - numero_anterior > 1
ORDER BY ano DESC, caderno, numero;

-- 6C: Questões de língua estrangeira sem lingua_estrangeira definida
SELECT
  id, ano, dia, numero, area,
  'lingua_estrangeira_indefinida' AS problema,
  caderno
FROM questoes_enem
WHERE area = 'Linguagens, Códigos e suas Tecnologias'
  AND lingua_estrangeira IS NULL
  AND caderno ILIKE '%ingles%'
ORDER BY ano DESC, numero;

-- 6D: Questões com tipo_template nulo (sem template definido)
SELECT
  ano,
  area,
  COUNT(*) AS questoes_sem_template
FROM questoes_enem
WHERE tipo_template IS NULL
GROUP BY ano, area
ORDER BY ano DESC, area;

-- 6E: Resumo de problemas por ano (dashboard executivo)
SELECT
  ano,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE elementos IS NULL OR jsonb_array_length(elementos) = 0) AS sem_elementos,
  COUNT(*) FILTER (WHERE comando IS NULL OR TRIM(comando) = '') AS sem_comando,
  COUNT(*) FILTER (WHERE gabarito IS NULL) AS sem_gabarito,
  COUNT(*) FILTER (WHERE tem_imagem = true AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(elementos) AS e WHERE e->>'tipo' = 'imagem'
  )) AS flag_imagem_errada,
  COUNT(*) FILTER (WHERE NOT anulada AND (
    (alt_a_texto IS NULL AND alt_a_imagem IS NULL)
    OR (alt_b_texto IS NULL AND alt_b_imagem IS NULL)
    OR (alt_c_texto IS NULL AND alt_c_imagem IS NULL)
    OR (alt_d_texto IS NULL AND alt_d_imagem IS NULL)
  )) AS sem_alternativas_completas
FROM questoes_enem
GROUP BY ano
ORDER BY ano DESC;


-- =============================================================================
-- SCRIPT 7: ANÁLISE DE GÊNERO TEXTUAL E TIPOS DE TEXTO
-- =============================================================================

-- 7A: Questões com poemas (detectados por padrão de versos curtos)
SELECT
  id, ano, dia, numero, area,
  'possivel_poema' AS genero_detectado,
  SUBSTRING(e->>'conteudo', 1, 200) AS trecho
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE e->>'tipo' = 'texto'
  AND (
    -- Linhas curtas intercaladas (padrão de verso)
    e->>'conteudo' ~ E'\\n[^\n]{5,40}\\n[^\n]{5,40}\\n'
    OR e->>'conteudo' ILIKE '%estrofe%'
    OR e->>'conteudo' ILIKE '%estrofa%'
    OR e->>'conteudo' ILIKE '%verso%'
  )
ORDER BY ano DESC, numero;

-- 7B: Questões com múltiplos textos (TEXTO I, TEXTO II)
SELECT
  id, ano, dia, numero, area,
  'multiplos_textos' AS tipo_estrutura,
  (
    SELECT COUNT(*)
    FROM jsonb_array_elements(elementos) AS e
    WHERE e->>'tipo' = 'titulo'
      AND (
        e->>'conteudo' ILIKE 'TEXTO I%'
        OR e->>'conteudo' ILIKE 'TEXTO II%'
        OR e->>'conteudo' ILIKE 'TEXTO 1%'
        OR e->>'conteudo' ILIKE 'TEXTO 2%'
      )
  ) AS qtd_textos
FROM questoes_enem
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(elementos) AS e
  WHERE e->>'tipo' = 'titulo'
    AND (
      e->>'conteudo' ILIKE 'TEXTO I%'
      OR e->>'conteudo' ILIKE 'TEXTO II%'
      OR e->>'conteudo' ILIKE 'TEXTO 1%'
      OR e->>'conteudo' ILIKE 'TEXTO 2%'
    )
)
ORDER BY ano DESC, numero;

-- 7C: Textos com citações diretas (ABNT - recuo 4cm)
SELECT
  id, ano, dia, numero, area,
  'citacao_direta_detectada' AS genero_detectado,
  SUBSTRING(e->>'conteudo', 1, 150) AS trecho
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE e->>'tipo' = 'texto'
  AND LENGTH(e->>'conteudo') > 400  -- citações longas
  AND (
    e->>'conteudo' ILIKE '"%"'
    OR e->>'conteudo' LIKE '"%'
    OR e->>'conteudo' LIKE '"%'
  )
ORDER BY ano DESC, numero;

-- 7D: Questões de Matemática sem fórmula detectada (flag incorreta)
SELECT
  id, ano, dia, numero, area,
  'matematica_sem_formula' AS alerta,
  tem_formula
FROM questoes_enem
WHERE area = 'Matemática e suas Tecnologias'
  AND tem_formula = false
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(elementos) AS e
    WHERE e->>'tipo' = 'imagem'  -- pode ter fórmula como imagem
  )
ORDER BY ano DESC, numero;

-- 7E: Questões de Ciências com possíveis fórmulas químicas não formatadas
SELECT
  id, ano, dia, numero, area,
  'formula_quimica_nao_formatada' AS problema,
  SUBSTRING(e->>'conteudo', 1, 200) AS trecho
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE area = 'Ciências da Natureza e suas Tecnologias'
  AND e->>'tipo' IN ('texto', 'comando')
  AND (
    e->>'conteudo' ~ '[A-Z][a-z]?[0-9]{1,2}'  -- H2O, CO2, NaCl, etc.
    OR e->>'conteudo' ILIKE '%H2O%'
    OR e->>'conteudo' ILIKE '%CO2%'
    OR e->>'conteudo' ILIKE '%O2%'
    OR e->>'conteudo' ILIKE '%NH3%'
    OR e->>'conteudo' ILIKE '%H2SO4%'
  )
  AND e->>'conteudo' NOT LIKE '%H₂O%'   -- já formatado corretamente
  AND e->>'conteudo' NOT LIKE '%CO₂%'   -- já formatado corretamente
ORDER BY ano DESC, numero;


-- =============================================================================
-- SCRIPT 8: AMOSTRAGEM DE QUESTÕES PARA REVISÃO MANUAL
-- =============================================================================

-- 8A: 10 questões aleatórias de CADA área para revisão visual
SELECT
  id, ano, dia, numero, area,
  jsonb_array_length(elementos) AS qtd_elementos,
  tem_imagem, tem_formula,
  SUBSTRING(comando, 1, 100) AS inicio_comando,
  (
    SELECT e->>'conteudo'
    FROM jsonb_array_elements(elementos) AS e
    WHERE e->>'tipo' = 'titulo'
    LIMIT 1
  ) AS primeiro_titulo,
  (
    SELECT e->>'conteudo'
    FROM jsonb_array_elements(elementos) AS e
    WHERE e->>'tipo' = 'fonte'
    LIMIT 1
  ) AS primeira_fonte
FROM questoes_enem
WHERE ano = (SELECT MAX(ano) FROM questoes_enem)  -- ano mais recente
ORDER BY RANDOM()
LIMIT 40;

-- 8B: Questões com MAIS elementos (mais complexas - revisar primeiro)
SELECT
  id, ano, dia, numero, area,
  jsonb_array_length(elementos) AS qtd_elementos,
  tem_imagem, tem_formula, tem_imagem_alternativa
FROM questoes_enem
ORDER BY jsonb_array_length(elementos) DESC
LIMIT 20;

-- 8C: Ver conteúdo completo de uma questão específica (substitua o ID)
-- SELECT
--   id, ano, dia, numero, area,
--   elementos,
--   comando,
--   alt_a_texto, alt_b_texto, alt_c_texto, alt_d_texto, alt_e_texto,
--   gabarito, tem_imagem, tem_formula
-- FROM questoes_enem
-- WHERE id = 'SUBSTITUA_PELO_ID'


-- =============================================================================
-- SCRIPT 9: RELATÓRIO CONSOLIDADO DE PROBLEMAS
-- =============================================================================

WITH problemas AS (
  -- Elementos vazios
  SELECT id, 'elementos_vazios' AS tipo_problema FROM questoes_enem
  WHERE elementos IS NULL OR jsonb_array_length(elementos) = 0
  UNION ALL
  -- Sem comando
  SELECT id, 'sem_comando' FROM questoes_enem
  WHERE comando IS NULL OR TRIM(comando) = ''
  UNION ALL
  -- Sem gabarito
  SELECT id, 'sem_gabarito' FROM questoes_enem
  WHERE gabarito IS NULL AND NOT anulada
  UNION ALL
  -- Alternativas incompletas
  SELECT id, 'alternativas_incompletas' FROM questoes_enem
  WHERE NOT anulada
    AND (
      (alt_a_texto IS NULL AND alt_a_imagem IS NULL)
      OR (alt_b_texto IS NULL AND alt_b_imagem IS NULL)
      OR (alt_c_texto IS NULL AND alt_c_imagem IS NULL)
      OR (alt_d_texto IS NULL AND alt_d_imagem IS NULL)
    )
  UNION ALL
  -- Imagem sem elemento
  SELECT id, 'flag_imagem_sem_elemento' FROM questoes_enem
  WHERE tem_imagem = true
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(elementos) AS e WHERE e->>'tipo' = 'imagem'
    )
  UNION ALL
  -- Fonte misturada no texto
  SELECT DISTINCT q.id, 'fonte_misturada'
  FROM questoes_enem q,
       jsonb_array_elements(q.elementos) AS e
  WHERE e->>'tipo' = 'texto'
    AND (e->>'conteudo' ILIKE '%Disponível em:%' OR e->>'conteudo' ILIKE '%Adaptado de:%')
  UNION ALL
  -- Encoding corrompido
  SELECT DISTINCT q.id, 'encoding_corrompido'
  FROM questoes_enem q,
       jsonb_array_elements(q.elementos) AS e
  WHERE e->>'conteudo' LIKE '%Ã§%' OR e->>'conteudo' LIKE '%Ã£%' OR e->>'conteudo' LIKE '%â€%'
)
SELECT
  tipo_problema,
  COUNT(*) AS total_afetadas
FROM problemas
GROUP BY tipo_problema
ORDER BY total_afetadas DESC;


-- =============================================================================
-- SCRIPT 10: VERIFICAÇÃO DE CONSISTÊNCIA POR ANO ESPECÍFICO
-- Use para auditar um ano de prova completo
-- Substitua 2024 pelo ano desejado
-- =============================================================================

SELECT
  numero,
  area,
  dia,
  jsonb_array_length(elementos) AS qtd_elementos,
  tem_imagem,
  tem_formula,
  tem_imagem_alternativa,
  gabarito IS NOT NULL AS tem_gabarito,
  anulada,
  CASE
    WHEN elementos IS NULL OR jsonb_array_length(elementos) = 0 THEN '❌ sem_elementos '
    ELSE ''
  END ||
  CASE
    WHEN comando IS NULL OR TRIM(comando) = '' THEN '❌ sem_comando '
    ELSE ''
  END ||
  CASE
    WHEN gabarito IS NULL AND NOT anulada THEN '❌ sem_gabarito '
    ELSE ''
  END ||
  CASE
    WHEN NOT anulada AND (
      (alt_a_texto IS NULL AND alt_a_imagem IS NULL) OR
      (alt_b_texto IS NULL AND alt_b_imagem IS NULL) OR
      (alt_c_texto IS NULL AND alt_c_imagem IS NULL) OR
      (alt_d_texto IS NULL AND alt_d_imagem IS NULL)
    ) THEN '⚠️ alt_incompleta '
    ELSE ''
  END ||
  CASE
    WHEN tem_imagem = true AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(elementos) AS e WHERE e->>'tipo' = 'imagem'
    ) THEN '⚠️ imagem_flag_errada '
    ELSE ''
  END AS alertas
FROM questoes_enem
WHERE ano = 2024
ORDER BY dia, numero;


-- =============================================================================
-- SCRIPT 11: QUESTÕES COM TABELAS E MARCADORES
-- Verifica questões que possuem tabelas HTML ou listas com marcadores
-- =============================================================================

-- 11A: Questões com TABELAS HTML
SELECT
  '=== QUESTÕES COM TABELAS ===' AS secao,
  id, ano, dia, numero, area,
  SUBSTRING(e->>'conteudo', 1, 200) AS trecho_com_tabela
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE e->>'conteudo' ILIKE '%<table%'
   OR e->>'conteudo' ILIKE '%<tr%'
   OR e->>'conteudo' ILIKE '%<td%'
ORDER BY ano DESC, numero;

-- 11B: Questões com LISTAS HTML (ul, ol, li)
SELECT
  '=== QUESTÕES COM LISTAS HTML ===' AS secao,
  id, ano, dia, numero, area,
  SUBSTRING(e->>'conteudo', 1, 200) AS trecho_com_lista
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE e->>'conteudo' ILIKE '%<ul%'
   OR e->>'conteudo' ILIKE '%<ol%'
   OR e->>'conteudo' ILIKE '%<li%'
ORDER BY ano DESC, numero;

-- 11C: Questões com MARCADORES de texto (•, -, *, números)
SELECT
  '=== QUESTÕES COM MARCADORES TEXTO ===' AS secao,
  id, ano, dia, numero, area,
  SUBSTRING(e->>'conteudo', 1, 200) AS trecho_com_marcador
FROM questoes_enem,
     jsonb_array_elements(elementos) AS e
WHERE e->>'conteudo' ~ E'(^|\\n)\\s*[•\\-\\*●○◦]\\s+'
   OR e->>'conteudo' ~ E'(^|\\n)\\s*[1-9][0-9]?[\\.\\)]\\s+'
   OR e->>'conteudo' ~ E'(^|\\n)\\s*[a-e][\\.\\)]\\s+'
ORDER BY ano DESC, numero;

-- 11D: Contagem resumida
SELECT
  'Resumo de elementos especiais' AS categoria,
  COUNT(DISTINCT CASE WHEN e->>'conteudo' ILIKE '%<table%' THEN q.id END) AS com_tabelas,
  COUNT(DISTINCT CASE WHEN e->>'conteudo' ILIKE '%<ul%' OR e->>'conteudo' ILIKE '%<ol%' THEN q.id END) AS com_listas_html,
  COUNT(DISTINCT CASE WHEN e->>'conteudo' ~ E'(^|\\n)\\s*[•\\-\\*●○◦]\\s+' THEN q.id END) AS com_marcadores_texto
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) AS e;


-- =============================================================================
-- SCRIPT 12: QUESTÕES COM GRÁFICOS E INFOGRÁFICOS
-- Verifica questões que podem ter gráficos (geralmente como imagem)
-- =============================================================================

-- 12A: Questões com menção a gráfico/tabela/quadro no texto
SELECT
  '=== MENÇÕES A GRÁFICOS/TABELAS ===' AS secao,
  id, ano, dia, numero, area,
  tem_imagem,
  CASE
    WHEN comando ILIKE '%gráfico%' THEN 'gráfico'
    WHEN comando ILIKE '%tabela%' THEN 'tabela'
    WHEN comando ILIKE '%quadro%' THEN 'quadro'
    WHEN comando ILIKE '%figura%' THEN 'figura'
    WHEN comando ILIKE '%infográfico%' THEN 'infográfico'
    ELSE 'outro'
  END AS tipo_referencia
FROM questoes_enem
WHERE comando ILIKE '%gráfico%'
   OR comando ILIKE '%tabela%'
   OR comando ILIKE '%quadro%'
   OR comando ILIKE '%figura%'
   OR comando ILIKE '%infográfico%'
ORDER BY ano DESC, numero;

-- 12B: Contagem por tipo de referência visual
SELECT
  'Referências visuais no comando' AS categoria,
  COUNT(*) FILTER (WHERE comando ILIKE '%gráfico%') AS menciona_grafico,
  COUNT(*) FILTER (WHERE comando ILIKE '%tabela%') AS menciona_tabela,
  COUNT(*) FILTER (WHERE comando ILIKE '%quadro%') AS menciona_quadro,
  COUNT(*) FILTER (WHERE comando ILIKE '%figura%') AS menciona_figura,
  COUNT(*) FILTER (WHERE comando ILIKE '%infográfico%') AS menciona_infografico
FROM questoes_enem;
