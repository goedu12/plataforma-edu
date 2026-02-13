-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  VERIFICAÇÃO E CORREÇÃO DE FORMATAÇÃO + IMAGENS - QUESTÕES ENEM & REGULAR  ║
-- ║  Script completo: Diagnóstico + Correção automática                        ║
-- ║  Tabelas: questoes_enem, questoes                                          ║
-- ║  Data: 2026-02-13                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- PARTE 1: DIAGNÓSTICO COMPLETO (SOMENTE LEITURA)
-- ============================================================================
-- Execute esta parte primeiro para ver o estado atual do banco.
-- Nenhuma alteração é feita aqui.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  1.1  VISÃO GERAL DAS TABELAS                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

SELECT '═══════════════════ 1.1 VISÃO GERAL ═══════════════════' AS secao;

-- questoes_enem: totais por ano
SELECT
    'questoes_enem' AS tabela,
    ano_prova,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'ativa') AS ativas,
    COUNT(*) FILTER (WHERE status = 'inativa') AS inativas,
    COUNT(*) FILTER (WHERE status = 'revisao') AS revisao
FROM questoes_enem
GROUP BY ano_prova
ORDER BY ano_prova DESC;

-- questoes (regulares): totais por componente
SELECT
    'questoes' AS tabela,
    componente,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'ativa') AS ativas,
    COUNT(*) FILTER (WHERE status = 'inativa') AS inativas
FROM questoes
GROUP BY componente
ORDER BY componente;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  1.2  DIAGNÓSTICO DE FORMATAÇÃO - questoes_enem                            ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

SELECT '═══════════════════ 1.2 FORMATAÇÃO ENEM ═══════════════════' AS secao;

-- Classificação geral de formatação
SELECT
    classificacao,
    COUNT(*) AS quantidade,
    ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM questoes_enem), 0), 1) AS percentual
FROM (
    SELECT
        CASE
            WHEN contexto IS NULL OR TRIM(contexto) = '' THEN 'VAZIO - Sem contexto'
            WHEN LENGTH(contexto) < 30 THEN 'CRITICO - Contexto < 30 chars'
            WHEN LENGTH(contexto) < 100 THEN 'CURTO - Contexto < 100 chars'
            WHEN contexto LIKE '%<small>%' AND (comando IS NOT NULL AND TRIM(comando) != '')
                THEN 'COMPLETO - Com fonte e comando'
            WHEN contexto LIKE '%<small>%' THEN 'PARCIAL - Fonte OK, sem comando'
            WHEN contexto ~* 'Disponível em:|Acesso em:' AND contexto NOT LIKE '%<small>%'
                THEN 'FORMATO - Fonte sem tag <small>'
            WHEN comando IS NULL OR TRIM(comando) = '' THEN 'SEM COMANDO'
            ELSE 'BASICO - Sem fonte identificada'
        END AS classificacao
    FROM questoes_enem
) c
GROUP BY classificacao
ORDER BY
    CASE classificacao
        WHEN 'VAZIO - Sem contexto' THEN 1
        WHEN 'CRITICO - Contexto < 30 chars' THEN 2
        WHEN 'CURTO - Contexto < 100 chars' THEN 3
        WHEN 'FORMATO - Fonte sem tag <small>' THEN 4
        WHEN 'SEM COMANDO' THEN 5
        WHEN 'PARCIAL - Fonte OK, sem comando' THEN 6
        WHEN 'BASICO - Sem fonte identificada' THEN 7
        WHEN 'COMPLETO - Com fonte e comando' THEN 8
        ELSE 9
    END;

-- Tags HTML não fechadas no contexto
SELECT '--- Tags HTML não fechadas ---' AS verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    CASE
        WHEN (LENGTH(contexto) - LENGTH(REPLACE(contexto, '<strong>', ''))) / 8 !=
             (LENGTH(contexto) - LENGTH(REPLACE(contexto, '</strong>', ''))) / 9
            THEN '<strong> desbalanceada'
        WHEN (LENGTH(contexto) - LENGTH(REPLACE(contexto, '<em>', ''))) / 4 !=
             (LENGTH(contexto) - LENGTH(REPLACE(contexto, '</em>', ''))) / 5
            THEN '<em> desbalanceada'
        WHEN (LENGTH(contexto) - LENGTH(REPLACE(contexto, '<small>', ''))) / 7 !=
             (LENGTH(contexto) - LENGTH(REPLACE(contexto, '</small>', ''))) / 8
            THEN '<small> desbalanceada'
        WHEN (LENGTH(contexto) - LENGTH(REPLACE(contexto, '<p>', ''))) / 3 !=
             (LENGTH(contexto) - LENGTH(REPLACE(contexto, '</p>', ''))) / 4
            THEN '<p> desbalanceada'
        ELSE NULL
    END AS problema
FROM questoes_enem
WHERE (contexto LIKE '%<strong>%' OR contexto LIKE '%<em>%' OR contexto LIKE '%<small>%' OR contexto LIKE '%<p>%')
  AND (
    (LENGTH(contexto) - LENGTH(REPLACE(contexto, '<strong>', ''))) / 8 !=
    (LENGTH(contexto) - LENGTH(REPLACE(contexto, '</strong>', ''))) / 9
    OR
    (LENGTH(contexto) - LENGTH(REPLACE(contexto, '<em>', ''))) / 4 !=
    (LENGTH(contexto) - LENGTH(REPLACE(contexto, '</em>', ''))) / 5
    OR
    (LENGTH(contexto) - LENGTH(REPLACE(contexto, '<small>', ''))) / 7 !=
    (LENGTH(contexto) - LENGTH(REPLACE(contexto, '</small>', ''))) / 8
    OR
    (LENGTH(contexto) - LENGTH(REPLACE(contexto, '<p>', ''))) / 3 !=
    (LENGTH(contexto) - LENGTH(REPLACE(contexto, '</p>', ''))) / 4
  )
ORDER BY ano_prova DESC, numero_questao
LIMIT 50;

-- Caracteres problemáticos no contexto e alternativas
SELECT '--- Caracteres problemáticos ---' AS verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    CASE
        WHEN contexto LIKE '%\n%' OR contexto LIKE '%\r%' THEN 'Quebra de linha literal (\n\r)'
        WHEN contexto LIKE '%\t%' THEN 'Tab literal (\t)'
        WHEN contexto ~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]' THEN 'Caracteres de controle'
        WHEN contexto LIKE '%&amp;amp;%' THEN 'Entidades HTML duplamente escapadas'
        WHEN contexto LIKE '%&amp;lt;%' OR contexto LIKE '%&amp;gt;%' THEN 'Entidades HTML duplamente escapadas'
        ELSE NULL
    END AS problema
FROM questoes_enem
WHERE contexto LIKE '%\n%' OR contexto LIKE '%\r%' OR contexto LIKE '%\t%'
   OR contexto ~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]'
   OR contexto LIKE '%&amp;amp;%' OR contexto LIKE '%&amp;lt;%'
ORDER BY ano_prova DESC, numero_questao
LIMIT 30;

-- Fontes bibliográficas sem tag <small>
SELECT '--- Fontes sem tag <small> ---' AS verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    area,
    RIGHT(contexto, 120) AS final_contexto
FROM questoes_enem
WHERE (contexto ~* 'Disponível em:' OR contexto ~* 'Acesso em:')
  AND contexto NOT LIKE '%<small>%'
ORDER BY ano_prova DESC, numero_questao
LIMIT 30;

-- Alternativas com problemas
SELECT '--- Alternativas com problemas ---' AS verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    CASE
        WHEN LENGTH(COALESCE(alternativa_a, '')) < 2 THEN 'alt_a vazia/curta'
        WHEN LENGTH(COALESCE(alternativa_b, '')) < 2 THEN 'alt_b vazia/curta'
        WHEN LENGTH(COALESCE(alternativa_c, '')) < 2 THEN 'alt_c vazia/curta'
        WHEN LENGTH(COALESCE(alternativa_d, '')) < 2 THEN 'alt_d vazia/curta'
        WHEN LENGTH(COALESCE(alternativa_e, '')) < 2 THEN 'alt_e vazia/curta'
        ELSE NULL
    END AS problema,
    LENGTH(COALESCE(alternativa_a, '')) AS len_a,
    LENGTH(COALESCE(alternativa_b, '')) AS len_b,
    LENGTH(COALESCE(alternativa_c, '')) AS len_c,
    LENGTH(COALESCE(alternativa_d, '')) AS len_d,
    LENGTH(COALESCE(alternativa_e, '')) AS len_e
FROM questoes_enem
WHERE LENGTH(COALESCE(alternativa_a, '')) < 2
   OR LENGTH(COALESCE(alternativa_b, '')) < 2
   OR LENGTH(COALESCE(alternativa_c, '')) < 2
   OR LENGTH(COALESCE(alternativa_d, '')) < 2
   OR LENGTH(COALESCE(alternativa_e, '')) < 2
ORDER BY ano_prova DESC, numero_questao
LIMIT 30;

-- Alternativas com prefixo duplicado (ex: "A) texto" quando já é alternativa_a)
SELECT '--- Alternativas com prefixo duplicado ---' AS verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    CASE WHEN alternativa_a ~ '^\s*[aA][\)\.\-]\s' THEN 'alt_a com prefixo' ELSE NULL END AS pref_a,
    CASE WHEN alternativa_b ~ '^\s*[bB][\)\.\-]\s' THEN 'alt_b com prefixo' ELSE NULL END AS pref_b,
    CASE WHEN alternativa_c ~ '^\s*[cC][\)\.\-]\s' THEN 'alt_c com prefixo' ELSE NULL END AS pref_c,
    CASE WHEN alternativa_d ~ '^\s*[dD][\)\.\-]\s' THEN 'alt_d com prefixo' ELSE NULL END AS pref_d,
    CASE WHEN alternativa_e ~ '^\s*[eE][\)\.\-]\s' THEN 'alt_e com prefixo' ELSE NULL END AS pref_e
FROM questoes_enem
WHERE alternativa_a ~ '^\s*[aA][\)\.\-]\s'
   OR alternativa_b ~ '^\s*[bB][\)\.\-]\s'
   OR alternativa_c ~ '^\s*[cC][\)\.\-]\s'
   OR alternativa_d ~ '^\s*[dD][\)\.\-]\s'
   OR alternativa_e ~ '^\s*[eE][\)\.\-]\s'
ORDER BY ano_prova DESC, numero_questao
LIMIT 30;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  1.3  DIAGNÓSTICO DE IMAGENS - questoes_enem                               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

SELECT '═══════════════════ 1.3 IMAGENS ENEM ═══════════════════' AS secao;

-- Resumo geral de imagens
SELECT
    'Imagens - Resumo Geral' AS secao,
    COUNT(*) AS total_questoes,
    COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '') AS com_imagem_principal,
    COUNT(*) FILTER (WHERE imagens_extras IS NOT NULL AND array_length(imagens_extras, 1) > 0) AS com_imagens_extras,
    COUNT(*) FILTER (WHERE imagem_a IS NOT NULL OR imagem_b IS NOT NULL OR imagem_c IS NOT NULL
                        OR imagem_d IS NOT NULL OR imagem_e IS NOT NULL) AS com_imagens_alternativas
FROM questoes_enem;

-- Imagens com valores inválidos (nan, None, null, undefined, object, etc.)
SELECT '--- Imagens com valores inválidos ---' AS verificacao;
SELECT
    tipo_problema,
    COUNT(*) AS quantidade
FROM (
    SELECT 'nan/None/null/undefined em imagem_principal' AS tipo_problema
    FROM questoes_enem
    WHERE LOWER(TRIM(COALESCE(imagem_principal, ''))) IN ('nan', 'none', 'null', 'undefined', 'nan', '')

    UNION ALL
    SELECT 'nan/None/null/undefined em imagem_a-e' AS tipo_problema
    FROM questoes_enem
    WHERE LOWER(TRIM(COALESCE(imagem_a, ''))) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(COALESCE(imagem_b, ''))) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(COALESCE(imagem_c, ''))) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(COALESCE(imagem_d, ''))) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(COALESCE(imagem_e, ''))) IN ('nan', 'none', 'null', 'undefined')

    UNION ALL
    SELECT 'Strings vazias em campos de imagem' AS tipo_problema
    FROM questoes_enem
    WHERE (imagem_principal IS NOT NULL AND TRIM(imagem_principal) = '')
       OR (imagem_a IS NOT NULL AND TRIM(imagem_a) = '')
       OR (imagem_b IS NOT NULL AND TRIM(imagem_b) = '')
       OR (imagem_c IS NOT NULL AND TRIM(imagem_c) = '')
       OR (imagem_d IS NOT NULL AND TRIM(imagem_d) = '')
       OR (imagem_e IS NOT NULL AND TRIM(imagem_e) = '')

    UNION ALL
    SELECT 'URLs localhost/file://' AS tipo_problema
    FROM questoes_enem
    WHERE COALESCE(imagem_principal, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_a, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_b, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_c, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_d, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_e, '') ~ '^(http://localhost|file://)'

    UNION ALL
    SELECT '[object Object] em campo de imagem' AS tipo_problema
    FROM questoes_enem
    WHERE COALESCE(imagem_principal, '') LIKE '%[object%'
       OR COALESCE(imagem_a, '') LIKE '%[object%'
       OR COALESCE(imagem_b, '') LIKE '%[object%'

    UNION ALL
    SELECT 'Tags HTML em vez de URL' AS tipo_problema
    FROM questoes_enem
    WHERE COALESCE(imagem_principal, '') ~ '^<(img|figure|div)'
       OR COALESCE(imagem_a, '') ~ '^<(img|figure|div)'

    UNION ALL
    SELECT 'URL sem protocolo (falta http)' AS tipo_problema
    FROM questoes_enem
    WHERE imagem_principal IS NOT NULL
      AND TRIM(imagem_principal) != ''
      AND imagem_principal !~ '^(https?://|data:image/)'
      AND LOWER(TRIM(imagem_principal)) NOT IN ('nan', 'none', 'null', 'undefined')
      AND imagem_principal !~ '^<'
      AND imagem_principal !~ '^\[object'
) problemas
GROUP BY tipo_problema
ORDER BY quantidade DESC;

-- Questões que mencionam figura/imagem mas NÃO têm imagem cadastrada
SELECT '--- Mencionam imagem mas não têm imagem ---' AS verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    area,
    CASE
        WHEN contexto ~* '\b(figura|figure)\b' THEN 'Figura'
        WHEN contexto ~* '\b(gráfico|grafico)\b' THEN 'Gráfico'
        WHEN contexto ~* '\b(tabela)\b' THEN 'Tabela'
        WHEN contexto ~* '\b(mapa)\b' THEN 'Mapa'
        WHEN contexto ~* '\b(charge|tirinha|cartum)\b' THEN 'Charge/Tirinha'
        WHEN contexto ~* '\b(fotografia|foto)\b' THEN 'Fotografia'
        WHEN comando ~* '\b(figura|gráfico|tabela|mapa|charge|imagem)\b' THEN 'No comando'
        ELSE 'Outro visual'
    END AS tipo_referencia,
    LEFT(contexto, 80) AS preview
FROM questoes_enem
WHERE (contexto ~* '\b(figura|gráfico|grafico|tabela|mapa|charge|tirinha|fotografia)\b'
       OR comando ~* '\b(figura|gráfico|tabela|mapa|charge|imagem)\b')
  AND imagem_principal IS NULL
  AND (imagens_extras IS NULL OR array_length(imagens_extras, 1) IS NULL)
  AND contexto NOT LIKE '%<em>[%'  -- Não tem descrição textual da imagem
ORDER BY ano_prova DESC, numero_questao
LIMIT 40;

-- Verificar domínios de URLs de imagem
SELECT '--- Domínios das URLs de imagem ---' AS verificacao;
SELECT
    CASE
        WHEN imagem_principal ~ '^https?://([^/]+)' THEN (regexp_match(imagem_principal, '^https?://([^/]+)'))[1]
        WHEN imagem_principal ~ '^data:image/' THEN 'data:image (base64)'
        ELSE 'outro/inválido'
    END AS dominio,
    COUNT(*) AS quantidade
FROM questoes_enem
WHERE imagem_principal IS NOT NULL AND TRIM(imagem_principal) != ''
GROUP BY dominio
ORDER BY quantidade DESC
LIMIT 20;

-- imagens_extras com elementos inválidos
SELECT '--- Array imagens_extras com problemas ---' AS verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    imagens_extras,
    array_length(imagens_extras, 1) AS total_elementos
FROM questoes_enem
WHERE imagens_extras IS NOT NULL
  AND array_length(imagens_extras, 1) > 0
  AND EXISTS (
      SELECT 1 FROM unnest(imagens_extras) AS elem
      WHERE TRIM(elem) = ''
         OR LOWER(TRIM(elem)) IN ('nan', 'none', 'null', 'undefined')
         OR elem !~ '^(https?://|data:image/)'
  )
LIMIT 20;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  1.4  DIAGNÓSTICO DE FORMATAÇÃO - questoes (regulares)                     ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

SELECT '═══════════════════ 1.4 FORMATAÇÃO QUESTÕES REGULARES ═══════════════════' AS secao;

SELECT
    componente,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE enunciado IS NULL OR TRIM(enunciado) = '') AS sem_enunciado,
    COUNT(*) FILTER (WHERE LENGTH(COALESCE(enunciado, '')) < 30) AS enunciado_curto,
    COUNT(*) FILTER (WHERE LENGTH(COALESCE(alternativa_a, '')) < 2
                        OR LENGTH(COALESCE(alternativa_b, '')) < 2
                        OR LENGTH(COALESCE(alternativa_c, '')) < 2
                        OR LENGTH(COALESCE(alternativa_d, '')) < 2) AS alt_vazia,
    COUNT(*) FILTER (WHERE explicacao IS NULL OR TRIM(explicacao) = '') AS sem_explicacao,
    COUNT(*) FILTER (WHERE enunciado LIKE '%\n%' OR enunciado LIKE '%\r%') AS quebra_linha_literal,
    COUNT(*) FILTER (WHERE enunciado LIKE '%&amp;amp;%' OR enunciado LIKE '%&amp;lt;%') AS html_duplo_escape
FROM questoes
GROUP BY componente
ORDER BY componente;

-- Questões regulares com alternativas problemáticas
SELECT '--- Questões regulares com alt. vazias ---' AS verificacao;
SELECT
    id,
    componente,
    ano,
    tema,
    LENGTH(COALESCE(alternativa_a, '')) AS len_a,
    LENGTH(COALESCE(alternativa_b, '')) AS len_b,
    LENGTH(COALESCE(alternativa_c, '')) AS len_c,
    LENGTH(COALESCE(alternativa_d, '')) AS len_d,
    LENGTH(COALESCE(alternativa_e, '')) AS len_e
FROM questoes
WHERE LENGTH(COALESCE(alternativa_a, '')) < 2
   OR LENGTH(COALESCE(alternativa_b, '')) < 2
   OR LENGTH(COALESCE(alternativa_c, '')) < 2
   OR LENGTH(COALESCE(alternativa_d, '')) < 2
ORDER BY componente, ano
LIMIT 20;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  1.5  RESUMO DE QUALIDADE CONSOLIDADO                                      ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

SELECT '═══════════════════ 1.5 RESUMO CONSOLIDADO ═══════════════════' AS secao;

SELECT
    status_qualidade,
    COUNT(*) AS quantidade,
    ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM questoes_enem), 0), 1) AS pct
FROM (
    SELECT
        CASE
            WHEN contexto IS NULL OR TRIM(contexto) = '' THEN 'CRITICO'
            WHEN LENGTH(contexto) < 30 THEN 'CRITICO'
            WHEN LENGTH(COALESCE(alternativa_a, '')) < 2
                 OR LENGTH(COALESCE(alternativa_b, '')) < 2
                 OR LENGTH(COALESCE(alternativa_c, '')) < 2
                 OR LENGTH(COALESCE(alternativa_d, '')) < 2
                 OR LENGTH(COALESCE(alternativa_e, '')) < 2
                THEN 'RUIM'
            WHEN LENGTH(contexto) > 100
                 AND (comando IS NOT NULL AND TRIM(comando) != '' AND LENGTH(comando) > 15)
                 AND LENGTH(alternativa_a) > 5 AND LENGTH(alternativa_b) > 5
                 AND LENGTH(alternativa_c) > 5 AND LENGTH(alternativa_d) > 5
                 AND LENGTH(alternativa_e) > 5
                 AND (contexto LIKE '%<small>%' OR LENGTH(contexto) < 300)
                THEN 'EXCELENTE'
            WHEN LENGTH(contexto) > 100
                 AND LENGTH(alternativa_a) > 5 AND LENGTH(alternativa_b) > 5
                 AND LENGTH(alternativa_c) > 5 AND LENGTH(alternativa_d) > 5
                THEN 'BOM'
            WHEN LENGTH(contexto) > 50
                THEN 'REGULAR'
            ELSE 'RUIM'
        END AS status_qualidade
    FROM questoes_enem
) q
GROUP BY status_qualidade
ORDER BY
    CASE status_qualidade
        WHEN 'CRITICO' THEN 1
        WHEN 'RUIM' THEN 2
        WHEN 'REGULAR' THEN 3
        WHEN 'BOM' THEN 4
        WHEN 'EXCELENTE' THEN 5
    END;


-- ============================================================================
-- ============================================================================
-- PARTE 2: CORREÇÕES AUTOMÁTICAS
-- ============================================================================
-- ============================================================================
-- ATENÇÃO: Esta parte FAZ ALTERAÇÕES no banco de dados!
-- Revise o diagnóstico acima antes de executar.
-- Recomendação: execute dentro de uma transação (BEGIN ... COMMIT/ROLLBACK)
-- ============================================================================

-- Descomente a linha abaixo para executar com segurança:
-- BEGIN;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  2.1  LIMPEZA DE IMAGENS INVÁLIDAS - questoes_enem                         ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
    v_count INTEGER := 0;
    v_total INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  2.1 LIMPEZA DE IMAGENS INVÁLIDAS';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';

    -- 2.1.1 Limpar valores nan/None/null/undefined/NaN
    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN LOWER(TRIM(COALESCE(imagem_principal, ''))) IN ('nan', 'none', 'null', 'undefined') THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN LOWER(TRIM(COALESCE(imagem_a, ''))) IN ('nan', 'none', 'null', 'undefined') THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN LOWER(TRIM(COALESCE(imagem_b, ''))) IN ('nan', 'none', 'null', 'undefined') THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN LOWER(TRIM(COALESCE(imagem_c, ''))) IN ('nan', 'none', 'null', 'undefined') THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN LOWER(TRIM(COALESCE(imagem_d, ''))) IN ('nan', 'none', 'null', 'undefined') THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN LOWER(TRIM(COALESCE(imagem_e, ''))) IN ('nan', 'none', 'null', 'undefined') THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE LOWER(TRIM(COALESCE(imagem_principal, ''))) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(COALESCE(imagem_a, ''))) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(COALESCE(imagem_b, ''))) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(COALESCE(imagem_c, ''))) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(COALESCE(imagem_d, ''))) IN ('nan', 'none', 'null', 'undefined')
       OR LOWER(TRIM(COALESCE(imagem_e, ''))) IN ('nan', 'none', 'null', 'undefined');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.1.1] nan/None/null/undefined: % registros', v_count;

    -- 2.1.2 Limpar strings vazias
    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN TRIM(COALESCE(imagem_principal, '')) = '' THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN TRIM(COALESCE(imagem_a, '')) = '' THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN TRIM(COALESCE(imagem_b, '')) = '' THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN TRIM(COALESCE(imagem_c, '')) = '' THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN TRIM(COALESCE(imagem_d, '')) = '' THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN TRIM(COALESCE(imagem_e, '')) = '' THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE (imagem_principal IS NOT NULL AND TRIM(imagem_principal) = '')
       OR (imagem_a IS NOT NULL AND TRIM(imagem_a) = '')
       OR (imagem_b IS NOT NULL AND TRIM(imagem_b) = '')
       OR (imagem_c IS NOT NULL AND TRIM(imagem_c) = '')
       OR (imagem_d IS NOT NULL AND TRIM(imagem_d) = '')
       OR (imagem_e IS NOT NULL AND TRIM(imagem_e) = '');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.1.2] Strings vazias: % registros', v_count;

    -- 2.1.3 Limpar URLs localhost/file://
    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN COALESCE(imagem_principal, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN COALESCE(imagem_a, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN COALESCE(imagem_b, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN COALESCE(imagem_c, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN COALESCE(imagem_d, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN COALESCE(imagem_e, '') ~ '^(http://localhost|file://)' THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE COALESCE(imagem_principal, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_a, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_b, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_c, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_d, '') ~ '^(http://localhost|file://)'
       OR COALESCE(imagem_e, '') ~ '^(http://localhost|file://)';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.1.3] URLs localhost/file://: % registros', v_count;

    -- 2.1.4 Limpar [object Object]
    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN COALESCE(imagem_principal, '') LIKE '%[object%' THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN COALESCE(imagem_a, '') LIKE '%[object%' THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN COALESCE(imagem_b, '') LIKE '%[object%' THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN COALESCE(imagem_c, '') LIKE '%[object%' THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN COALESCE(imagem_d, '') LIKE '%[object%' THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN COALESCE(imagem_e, '') LIKE '%[object%' THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE COALESCE(imagem_principal, '') LIKE '%[object%'
       OR COALESCE(imagem_a, '') LIKE '%[object%'
       OR COALESCE(imagem_b, '') LIKE '%[object%'
       OR COALESCE(imagem_c, '') LIKE '%[object%'
       OR COALESCE(imagem_d, '') LIKE '%[object%'
       OR COALESCE(imagem_e, '') LIKE '%[object%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.1.4] [object Object]: % registros', v_count;

    -- 2.1.5 Limpar tags HTML em campo de imagem
    UPDATE questoes_enem
    SET
        imagem_principal = CASE WHEN COALESCE(imagem_principal, '') ~ '^<(img|figure|div|span|a|p)' THEN NULL ELSE imagem_principal END,
        imagem_a = CASE WHEN COALESCE(imagem_a, '') ~ '^<(img|figure|div|span|a|p)' THEN NULL ELSE imagem_a END,
        imagem_b = CASE WHEN COALESCE(imagem_b, '') ~ '^<(img|figure|div|span|a|p)' THEN NULL ELSE imagem_b END,
        imagem_c = CASE WHEN COALESCE(imagem_c, '') ~ '^<(img|figure|div|span|a|p)' THEN NULL ELSE imagem_c END,
        imagem_d = CASE WHEN COALESCE(imagem_d, '') ~ '^<(img|figure|div|span|a|p)' THEN NULL ELSE imagem_d END,
        imagem_e = CASE WHEN COALESCE(imagem_e, '') ~ '^<(img|figure|div|span|a|p)' THEN NULL ELSE imagem_e END,
        atualizado_em = NOW()
    WHERE COALESCE(imagem_principal, '') ~ '^<(img|figure|div|span|a|p)'
       OR COALESCE(imagem_a, '') ~ '^<(img|figure|div|span|a|p)'
       OR COALESCE(imagem_b, '') ~ '^<(img|figure|div|span|a|p)'
       OR COALESCE(imagem_c, '') ~ '^<(img|figure|div|span|a|p)'
       OR COALESCE(imagem_d, '') ~ '^<(img|figure|div|span|a|p)'
       OR COALESCE(imagem_e, '') ~ '^<(img|figure|div|span|a|p)';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.1.5] Tags HTML: % registros', v_count;

    -- 2.1.6 Normalizar URLs (trim de espaços)
    UPDATE questoes_enem
    SET
        imagem_principal = NULLIF(TRIM(imagem_principal), ''),
        imagem_a = NULLIF(TRIM(imagem_a), ''),
        imagem_b = NULLIF(TRIM(imagem_b), ''),
        imagem_c = NULLIF(TRIM(imagem_c), ''),
        imagem_d = NULLIF(TRIM(imagem_d), ''),
        imagem_e = NULLIF(TRIM(imagem_e), ''),
        atualizado_em = NOW()
    WHERE COALESCE(imagem_principal, '') != TRIM(COALESCE(imagem_principal, ''))
       OR COALESCE(imagem_a, '') != TRIM(COALESCE(imagem_a, ''))
       OR COALESCE(imagem_b, '') != TRIM(COALESCE(imagem_b, ''))
       OR COALESCE(imagem_c, '') != TRIM(COALESCE(imagem_c, ''))
       OR COALESCE(imagem_d, '') != TRIM(COALESCE(imagem_d, ''))
       OR COALESCE(imagem_e, '') != TRIM(COALESCE(imagem_e, ''));
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.1.6] URLs com espaços: % registros', v_count;

    -- 2.1.7 Limpar array imagens_extras
    UPDATE questoes_enem
    SET
        imagens_extras = (
            SELECT CASE
                WHEN array_agg(elem) IS NULL THEN NULL
                ELSE array_agg(elem)
            END
            FROM unnest(imagens_extras) AS elem
            WHERE elem IS NOT NULL
              AND TRIM(elem) != ''
              AND LOWER(TRIM(elem)) NOT IN ('nan', 'none', 'null', 'undefined')
              AND elem ~ '^(https?://|data:image/)'
        ),
        atualizado_em = NOW()
    WHERE imagens_extras IS NOT NULL
      AND array_length(imagens_extras, 1) > 0
      AND EXISTS (
          SELECT 1 FROM unnest(imagens_extras) AS elem
          WHERE TRIM(elem) = ''
             OR LOWER(TRIM(elem)) IN ('nan', 'none', 'null', 'undefined')
             OR elem !~ '^(https?://|data:image/)'
      );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.1.7] imagens_extras inválidas: % registros', v_count;

    RAISE NOTICE '';
    RAISE NOTICE '  TOTAL 2.1 (Imagens): % registros corrigidos', v_total;
END $$;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  2.2  CORREÇÃO DE FORMATAÇÃO DO CONTEXTO - questoes_enem                   ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
    v_count INTEGER := 0;
    v_total INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  2.2 CORREÇÃO DE FORMATAÇÃO DO CONTEXTO';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';

    -- 2.2.1 Padronizar fontes: envolver "Disponível em:" em <small> quando não tem
    UPDATE questoes_enem
    SET contexto = REGEXP_REPLACE(
        contexto,
        '((?:^|\n)(?:[A-Z][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ]+(?:,\s*[A-Z][a-záéíóúâêîôûãõç.]+)*\.\s*)?Disponível em:[^<\n]+(?:Acesso em:[^<\n]+)?(?:\(adaptado\))?\.?)',
        '<small>\1</small>',
        'g'
    ),
    atualizado_em = NOW()
    WHERE contexto ~* 'Disponível em:'
      AND contexto NOT LIKE '%<small>%Disponível em%'
      AND contexto NOT LIKE '%<small>%disponível em%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.2.1] Fontes sem <small>: % registros', v_count;

    -- 2.2.2 Corrigir "Disponivel" sem acento
    UPDATE questoes_enem
    SET contexto = REPLACE(contexto, 'Disponivel em:', 'Disponível em:'),
        atualizado_em = NOW()
    WHERE contexto LIKE '%Disponivel em:%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.2.2] "Disponivel" sem acento: % registros', v_count;

    -- 2.2.3 Padronizar "DISPONÍVEL EM" em maiúsculas
    UPDATE questoes_enem
    SET contexto = REPLACE(contexto, 'DISPONÍVEL EM:', 'Disponível em:'),
        atualizado_em = NOW()
    WHERE contexto LIKE '%DISPONÍVEL EM:%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.2.3] "DISPONÍVEL EM" maiúsculas: % registros', v_count;

    -- 2.2.4 Limpar quebras de linha literais (\n, \r como texto, não como chars)
    UPDATE questoes_enem
    SET contexto = REPLACE(REPLACE(contexto, '\n', ' '), '\r', ' '),
        atualizado_em = NOW()
    WHERE contexto LIKE '%\n%' OR contexto LIKE '%\r%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.2.4] Quebras de linha literais no contexto: % registros', v_count;

    -- 2.2.5 Limpar quebras de linha literais no comando
    UPDATE questoes_enem
    SET comando = REPLACE(REPLACE(comando, '\n', ' '), '\r', ' '),
        atualizado_em = NOW()
    WHERE comando LIKE '%\n%' OR comando LIKE '%\r%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.2.5] Quebras de linha literais no comando: % registros', v_count;

    -- 2.2.6 Colapsar múltiplas quebras de linha reais
    UPDATE questoes_enem
    SET contexto = REGEXP_REPLACE(contexto, E'\n{3,}', E'\n\n', 'g'),
        atualizado_em = NOW()
    WHERE contexto ~ E'\n{3,}';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.2.6] Múltiplas quebras de linha: % registros', v_count;

    -- 2.2.7 Corrigir entidades HTML duplamente escapadas
    UPDATE questoes_enem
    SET contexto = REPLACE(REPLACE(REPLACE(contexto,
            '&amp;amp;', '&amp;'),
            '&amp;lt;', '&lt;'),
            '&amp;gt;', '&gt;'),
        atualizado_em = NOW()
    WHERE contexto LIKE '%&amp;amp;%'
       OR contexto LIKE '%&amp;lt;%'
       OR contexto LIKE '%&amp;gt;%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.2.7] Entidades HTML duplas: % registros', v_count;

    -- 2.2.8 Padronizar TEXTO I/II/III com <strong>
    UPDATE questoes_enem
    SET contexto = REGEXP_REPLACE(
        contexto,
        '(?<!</strong>)(TEXTO\s+(?:I{1,3}|IV|V|VI))\b',
        '<strong>\1</strong>',
        'g'
    ),
    atualizado_em = NOW()
    WHERE contexto ~ 'TEXTO\s+(I{1,3}|IV|V|VI)\b'
      AND contexto NOT LIKE '%<strong>TEXTO%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.2.8] TEXTO I/II/III sem <strong>: % registros', v_count;

    -- 2.2.9 Descrições de imagem em colchetes sem <em>
    UPDATE questoes_enem
    SET contexto = REGEXP_REPLACE(
        contexto,
        '\[([^\]]{20,})\]',
        '<em>[\1]</em>',
        'g'
    ),
    atualizado_em = NOW()
    WHERE contexto ~ '\[[^\]]{20,}\]'
      AND contexto NOT LIKE '%<em>[%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.2.9] Descrições sem <em>: % registros', v_count;

    -- 2.2.10 Remover múltiplos espaços
    UPDATE questoes_enem
    SET contexto = REGEXP_REPLACE(contexto, '  +', ' ', 'g'),
        atualizado_em = NOW()
    WHERE contexto ~ '  +';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.2.10] Múltiplos espaços: % registros', v_count;

    RAISE NOTICE '';
    RAISE NOTICE '  TOTAL 2.2 (Formatação): % registros corrigidos', v_total;
END $$;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  2.3  CORREÇÃO DE ALTERNATIVAS - questoes_enem                             ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
    v_count INTEGER := 0;
    v_total INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  2.3 CORREÇÃO DE ALTERNATIVAS';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';

    -- 2.3.1 Remover prefixos duplicados (a), A., a., A), b), B., etc.)
    UPDATE questoes_enem
    SET alternativa_a = REGEXP_REPLACE(alternativa_a, '^\s*[aA][\)\.\-]\s*', ''),
        atualizado_em = NOW()
    WHERE alternativa_a ~ '^\s*[aA][\)\.\-]\s';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    IF v_count > 0 THEN RAISE NOTICE '  [2.3.1] Prefixo alt_a: % registros', v_count; END IF;

    UPDATE questoes_enem
    SET alternativa_b = REGEXP_REPLACE(alternativa_b, '^\s*[bB][\)\.\-]\s*', ''),
        atualizado_em = NOW()
    WHERE alternativa_b ~ '^\s*[bB][\)\.\-]\s';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    IF v_count > 0 THEN RAISE NOTICE '  [2.3.1] Prefixo alt_b: % registros', v_count; END IF;

    UPDATE questoes_enem
    SET alternativa_c = REGEXP_REPLACE(alternativa_c, '^\s*[cC][\)\.\-]\s*', ''),
        atualizado_em = NOW()
    WHERE alternativa_c ~ '^\s*[cC][\)\.\-]\s';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    IF v_count > 0 THEN RAISE NOTICE '  [2.3.1] Prefixo alt_c: % registros', v_count; END IF;

    UPDATE questoes_enem
    SET alternativa_d = REGEXP_REPLACE(alternativa_d, '^\s*[dD][\)\.\-]\s*', ''),
        atualizado_em = NOW()
    WHERE alternativa_d ~ '^\s*[dD][\)\.\-]\s';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    IF v_count > 0 THEN RAISE NOTICE '  [2.3.1] Prefixo alt_d: % registros', v_count; END IF;

    UPDATE questoes_enem
    SET alternativa_e = REGEXP_REPLACE(alternativa_e, '^\s*[eE][\)\.\-]\s*', ''),
        atualizado_em = NOW()
    WHERE alternativa_e ~ '^\s*[eE][\)\.\-]\s';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    IF v_count > 0 THEN RAISE NOTICE '  [2.3.1] Prefixo alt_e: % registros', v_count; END IF;

    -- 2.3.2 Trim de alternativas (espaços no início/fim)
    UPDATE questoes_enem
    SET
        alternativa_a = TRIM(alternativa_a),
        alternativa_b = TRIM(alternativa_b),
        alternativa_c = TRIM(alternativa_c),
        alternativa_d = TRIM(alternativa_d),
        alternativa_e = TRIM(alternativa_e),
        atualizado_em = NOW()
    WHERE alternativa_a != TRIM(COALESCE(alternativa_a, ''))
       OR alternativa_b != TRIM(COALESCE(alternativa_b, ''))
       OR alternativa_c != TRIM(COALESCE(alternativa_c, ''))
       OR alternativa_d != TRIM(COALESCE(alternativa_d, ''))
       OR alternativa_e != TRIM(COALESCE(alternativa_e, ''));
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.3.2] Trim alternativas: % registros', v_count;

    -- 2.3.3 Limpar entidades HTML duplas nas alternativas
    UPDATE questoes_enem
    SET
        alternativa_a = REPLACE(REPLACE(REPLACE(alternativa_a, '&amp;amp;', '&amp;'), '&amp;lt;', '&lt;'), '&amp;gt;', '&gt;'),
        alternativa_b = REPLACE(REPLACE(REPLACE(alternativa_b, '&amp;amp;', '&amp;'), '&amp;lt;', '&lt;'), '&amp;gt;', '&gt;'),
        alternativa_c = REPLACE(REPLACE(REPLACE(alternativa_c, '&amp;amp;', '&amp;'), '&amp;lt;', '&lt;'), '&amp;gt;', '&gt;'),
        alternativa_d = REPLACE(REPLACE(REPLACE(alternativa_d, '&amp;amp;', '&amp;'), '&amp;lt;', '&lt;'), '&amp;gt;', '&gt;'),
        alternativa_e = REPLACE(REPLACE(REPLACE(COALESCE(alternativa_e, ''), '&amp;amp;', '&amp;'), '&amp;lt;', '&lt;'), '&amp;gt;', '&gt;'),
        atualizado_em = NOW()
    WHERE COALESCE(alternativa_a, '') LIKE '%&amp;amp;%' OR COALESCE(alternativa_a, '') LIKE '%&amp;lt;%'
       OR COALESCE(alternativa_b, '') LIKE '%&amp;amp;%' OR COALESCE(alternativa_b, '') LIKE '%&amp;lt;%'
       OR COALESCE(alternativa_c, '') LIKE '%&amp;amp;%' OR COALESCE(alternativa_c, '') LIKE '%&amp;lt;%'
       OR COALESCE(alternativa_d, '') LIKE '%&amp;amp;%' OR COALESCE(alternativa_d, '') LIKE '%&amp;lt;%'
       OR COALESCE(alternativa_e, '') LIKE '%&amp;amp;%' OR COALESCE(alternativa_e, '') LIKE '%&amp;lt;%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.3.3] Entidades HTML duplas nas alt: % registros', v_count;

    RAISE NOTICE '';
    RAISE NOTICE '  TOTAL 2.3 (Alternativas): % registros corrigidos', v_total;
END $$;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  2.4  CORREÇÃO DE FORMATAÇÃO - questoes (regulares)                        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
    v_count INTEGER := 0;
    v_total INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  2.4 CORREÇÃO QUESTÕES REGULARES';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';

    -- 2.4.1 Limpar quebras de linha literais no enunciado
    UPDATE questoes
    SET enunciado = REPLACE(REPLACE(enunciado, '\n', ' '), '\r', ' ')
    WHERE enunciado LIKE '%\n%' OR enunciado LIKE '%\r%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.4.1] Quebras de linha no enunciado: % registros', v_count;

    -- 2.4.2 Múltiplos espaços no enunciado
    UPDATE questoes
    SET enunciado = REGEXP_REPLACE(enunciado, '  +', ' ', 'g')
    WHERE enunciado ~ '  +';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.4.2] Múltiplos espaços no enunciado: % registros', v_count;

    -- 2.4.3 Entidades HTML duplas no enunciado
    UPDATE questoes
    SET enunciado = REPLACE(REPLACE(REPLACE(enunciado,
            '&amp;amp;', '&amp;'),
            '&amp;lt;', '&lt;'),
            '&amp;gt;', '&gt;')
    WHERE enunciado LIKE '%&amp;amp;%'
       OR enunciado LIKE '%&amp;lt;%'
       OR enunciado LIKE '%&amp;gt;%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.4.3] Entidades HTML duplas no enunciado: % registros', v_count;

    -- 2.4.4 Remover prefixos duplicados nas alternativas regulares
    UPDATE questoes
    SET alternativa_a = REGEXP_REPLACE(alternativa_a, '^\s*[aA][\)\.\-]\s*', '')
    WHERE alternativa_a ~ '^\s*[aA][\)\.\-]\s';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;

    UPDATE questoes
    SET alternativa_b = REGEXP_REPLACE(alternativa_b, '^\s*[bB][\)\.\-]\s*', '')
    WHERE alternativa_b ~ '^\s*[bB][\)\.\-]\s';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;

    UPDATE questoes
    SET alternativa_c = REGEXP_REPLACE(alternativa_c, '^\s*[cC][\)\.\-]\s*', '')
    WHERE alternativa_c ~ '^\s*[cC][\)\.\-]\s';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;

    UPDATE questoes
    SET alternativa_d = REGEXP_REPLACE(alternativa_d, '^\s*[dD][\)\.\-]\s*', '')
    WHERE alternativa_d ~ '^\s*[dD][\)\.\-]\s';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.4.4] Prefixos duplicados nas alt regulares: % registros', v_count;

    -- 2.4.5 Trim de alternativas regulares
    UPDATE questoes
    SET
        alternativa_a = TRIM(alternativa_a),
        alternativa_b = TRIM(alternativa_b),
        alternativa_c = TRIM(alternativa_c),
        alternativa_d = TRIM(alternativa_d),
        alternativa_e = NULLIF(TRIM(COALESCE(alternativa_e, '')), '')
    WHERE alternativa_a != TRIM(COALESCE(alternativa_a, ''))
       OR alternativa_b != TRIM(COALESCE(alternativa_b, ''))
       OR alternativa_c != TRIM(COALESCE(alternativa_c, ''))
       OR alternativa_d != TRIM(COALESCE(alternativa_d, ''))
       OR COALESCE(alternativa_e, '') != TRIM(COALESCE(alternativa_e, ''));
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.4.5] Trim alternativas regulares: % registros', v_count;

    -- 2.4.6 Trim do enunciado e explicacao
    UPDATE questoes
    SET
        enunciado = TRIM(enunciado),
        explicacao = TRIM(explicacao)
    WHERE enunciado != TRIM(COALESCE(enunciado, ''))
       OR COALESCE(explicacao, '') != TRIM(COALESCE(explicacao, ''));
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_total := v_total + v_count;
    RAISE NOTICE '  [2.4.6] Trim enunciado/explicacao: % registros', v_count;

    RAISE NOTICE '';
    RAISE NOTICE '  TOTAL 2.4 (Regulares): % registros corrigidos', v_total;
END $$;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  2.5  MARCAR QUESTÕES COM PROBLEMAS GRAVES COMO 'revisao'                 ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DO $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  2.5 MARCAR QUESTÕES PROBLEMÁTICAS COMO REVISÃO';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';

    -- Questões ENEM com contexto vazio ou muito curto
    UPDATE questoes_enem
    SET status = 'revisao',
        atualizado_em = NOW()
    WHERE status = 'ativa'
      AND (contexto IS NULL OR TRIM(contexto) = '' OR LENGTH(contexto) < 30);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  [2.5.1] ENEM - contexto vazio/curto: % marcadas como revisao', v_count;

    -- Questões ENEM com alternativas vazias
    UPDATE questoes_enem
    SET status = 'revisao',
        atualizado_em = NOW()
    WHERE status = 'ativa'
      AND (LENGTH(COALESCE(alternativa_a, '')) < 2
           OR LENGTH(COALESCE(alternativa_b, '')) < 2
           OR LENGTH(COALESCE(alternativa_c, '')) < 2
           OR LENGTH(COALESCE(alternativa_d, '')) < 2
           OR LENGTH(COALESCE(alternativa_e, '')) < 2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  [2.5.2] ENEM - alternativas vazias: % marcadas como revisao', v_count;

    -- Questões ENEM que mencionam figura/imagem mas não têm nenhuma imagem ou descrição
    UPDATE questoes_enem
    SET status = 'revisao',
        atualizado_em = NOW()
    WHERE status = 'ativa'
      AND (contexto ~* '\b(figura|gráfico|grafico)\b'
           OR comando ~* '\b(figura|gráfico)\b')
      AND imagem_principal IS NULL
      AND (imagens_extras IS NULL OR array_length(imagens_extras, 1) IS NULL)
      AND contexto NOT LIKE '%<em>[%';
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  [2.5.3] ENEM - mencionam figura sem imagem: % marcadas como revisao', v_count;

    -- Questões regulares com enunciado vazio
    UPDATE questoes
    SET status = 'inativa'
    WHERE status = 'ativa'
      AND (enunciado IS NULL OR TRIM(enunciado) = '' OR LENGTH(enunciado) < 20);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  [2.5.4] Regulares - enunciado vazio: % marcadas como inativa', v_count;

    -- Questões regulares com alternativas vazias
    UPDATE questoes
    SET status = 'inativa'
    WHERE status = 'ativa'
      AND (LENGTH(COALESCE(alternativa_a, '')) < 2
           OR LENGTH(COALESCE(alternativa_b, '')) < 2
           OR LENGTH(COALESCE(alternativa_c, '')) < 2
           OR LENGTH(COALESCE(alternativa_d, '')) < 2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  [2.5.5] Regulares - alternativas vazias: % marcadas como inativa', v_count;

END $$;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  PARTE 3: VERIFICAÇÃO PÓS-CORREÇÃO                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

SELECT '═══════════════════ 3.1 RESULTADO PÓS-CORREÇÃO ═══════════════════' AS secao;

-- Resumo de imagens após correção
SELECT
    'Imagens Após Correção' AS secao,
    COUNT(*) AS total_questoes,
    COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL) AS com_imagem_principal,
    COUNT(*) FILTER (WHERE imagem_principal ~ '^https?://') AS imagens_http_validas,
    COUNT(*) FILTER (WHERE imagem_principal ~ '^data:image/') AS imagens_base64,
    COUNT(*) FILTER (WHERE imagem_principal IS NOT NULL AND imagem_principal !~ '^(https?://|data:image/)') AS imagens_invalidas_restantes
FROM questoes_enem;

-- Resumo de formatação após correção
SELECT
    'Formatação Após Correção' AS secao,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE contexto LIKE '%<small>%') AS com_fonte_small,
    COUNT(*) FILTER (WHERE contexto LIKE '%<strong>%') AS com_titulo_strong,
    COUNT(*) FILTER (WHERE contexto LIKE '%<em>%') AS com_descricao_em,
    COUNT(*) FILTER (WHERE comando IS NOT NULL AND TRIM(comando) != '') AS com_comando
FROM questoes_enem;

-- Qualidade final por status
SELECT
    status,
    COUNT(*) AS quantidade,
    ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM questoes_enem), 0), 1) AS pct
FROM questoes_enem
GROUP BY status
ORDER BY
    CASE status WHEN 'ativa' THEN 1 WHEN 'revisao' THEN 2 WHEN 'inativa' THEN 3 ELSE 4 END;

-- Qualidade final consolidada
SELECT
    status_qualidade,
    COUNT(*) AS quantidade,
    ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM questoes_enem WHERE status = 'ativa'), 0), 1) AS pct_das_ativas
FROM (
    SELECT
        CASE
            WHEN LENGTH(contexto) > 100
                 AND (comando IS NOT NULL AND TRIM(comando) != '' AND LENGTH(comando) > 15)
                 AND LENGTH(alternativa_a) > 5 AND LENGTH(alternativa_b) > 5
                 AND LENGTH(alternativa_c) > 5 AND LENGTH(alternativa_d) > 5
                 AND LENGTH(alternativa_e) > 5
                 AND (contexto LIKE '%<small>%' OR LENGTH(contexto) < 300)
                THEN 'EXCELENTE'
            WHEN LENGTH(contexto) > 100
                 AND LENGTH(alternativa_a) > 5 AND LENGTH(alternativa_b) > 5
                 AND LENGTH(alternativa_c) > 5 AND LENGTH(alternativa_d) > 5
                THEN 'BOM'
            WHEN LENGTH(contexto) > 50
                THEN 'REGULAR'
            ELSE 'RUIM'
        END AS status_qualidade
    FROM questoes_enem
    WHERE status = 'ativa'
) q
GROUP BY status_qualidade
ORDER BY
    CASE status_qualidade WHEN 'EXCELENTE' THEN 1 WHEN 'BOM' THEN 2 WHEN 'REGULAR' THEN 3 ELSE 4 END;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FINALIZAÇÃO                                                                ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔══════════════════════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  SCRIPT CONCLUIDO COM SUCESSO                                               ║';
    RAISE NOTICE '╠══════════════════════════════════════════════════════════════════════════════╣';
    RAISE NOTICE '║                                                                              ║';
    RAISE NOTICE '║  Verificacoes realizadas:                                                    ║';
    RAISE NOTICE '║  [1.1] Visao geral das tabelas                                              ║';
    RAISE NOTICE '║  [1.2] Diagnostico formatacao ENEM (tags, chars, fontes, alternativas)       ║';
    RAISE NOTICE '║  [1.3] Diagnostico imagens ENEM (invalidas, orfas, dominios)                 ║';
    RAISE NOTICE '║  [1.4] Diagnostico formatacao questoes regulares                             ║';
    RAISE NOTICE '║  [1.5] Resumo de qualidade consolidado                                      ║';
    RAISE NOTICE '║                                                                              ║';
    RAISE NOTICE '║  Correcoes aplicadas:                                                        ║';
    RAISE NOTICE '║  [2.1] Limpeza de imagens invalidas (7 tipos)                                ║';
    RAISE NOTICE '║  [2.2] Correcao de formatacao do contexto (10 tipos)                         ║';
    RAISE NOTICE '║  [2.3] Correcao de alternativas (3 tipos)                                    ║';
    RAISE NOTICE '║  [2.4] Correcao de questoes regulares (6 tipos)                              ║';
    RAISE NOTICE '║  [2.5] Marcacao de questoes problematicas como revisao/inativa               ║';
    RAISE NOTICE '║                                                                              ║';
    RAISE NOTICE '║  Para reverter: descomente BEGIN no inicio e use ROLLBACK em vez de COMMIT   ║';
    RAISE NOTICE '║                                                                              ║';
    RAISE NOTICE '╚══════════════════════════════════════════════════════════════════════════════╝';
END $$;

-- Descomente para confirmar ou reverter as alterações:
-- COMMIT;
-- ROLLBACK;
