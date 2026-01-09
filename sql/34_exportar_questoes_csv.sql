-- ================================================================
-- EXPORTAR QUESTÕES DO ENEM PARA ANÁLISE
-- Execute no Supabase SQL Editor
-- Depois clique em "Download CSV" no resultado
-- ================================================================

-- ============================================================
-- OPÇÃO 1: Exportar TODAS as questões (formato simplificado)
-- ============================================================
SELECT
    id,
    ano,
    COALESCE(num_questao, 0) as numero,
    COALESCE(area, 'Não definida') as area,
    LEFT(contexto, 500) as contexto_resumido,
    LENGTH(contexto) as tamanho_contexto,
    COALESCE(comando, '') as comando,
    resposta_correta as gabarito,
    -- Análise de problemas
    CASE
        WHEN LENGTH(contexto) > 3000 THEN 'TEXTO_LONGO'
        WHEN contexto ~ 'ENEM 20[0-9]{2}.*ENEM 20[0-9]{2}' THEN 'DUPLICADO_ANO'
        WHEN contexto ~ 'QUESTÃO [0-9]+.*QUESTÃO [0-9]+' THEN 'DUPLICADO_QUESTAO'
        WHEN contexto LIKE '%##%' THEN 'TEM_MARKDOWN'
        WHEN contexto ~ '\[\s*\]' THEN 'COLCHETE_VAZIO'
        ELSE 'OK'
    END as status_analise
FROM public.enem_questions
ORDER BY ano DESC, id;

-- ============================================================
-- OPÇÃO 2: Exportar APENAS questões com PROBLEMAS
-- ============================================================
/*
SELECT
    id,
    ano,
    num_questao as numero,
    area,
    LEFT(contexto, 300) as contexto_inicio,
    LENGTH(contexto) as tamanho,
    CASE
        WHEN LENGTH(contexto) > 3000 THEN 'TEXTO_LONGO'
        WHEN contexto ~ 'ENEM 20[0-9]{2}.*ENEM 20[0-9]{2}' THEN 'DUPLICADO_ANO'
        WHEN contexto ~ 'QUESTÃO [0-9]+.*QUESTÃO [0-9]+' THEN 'DUPLICADO_QUESTAO'
        WHEN contexto LIKE '%##%' THEN 'TEM_MARKDOWN'
        WHEN contexto ~ '\[\s*\]' THEN 'COLCHETE_VAZIO'
        ELSE 'OK'
    END as problema
FROM public.enem_questions
WHERE
    LENGTH(contexto) > 3000
    OR contexto ~ 'ENEM 20[0-9]{2}.*ENEM 20[0-9]{2}'
    OR contexto ~ 'QUESTÃO [0-9]+.*QUESTÃO [0-9]+'
    OR contexto LIKE '%##%'
    OR contexto ~ '\[\s*\]'
ORDER BY ano DESC, id;
*/

-- ============================================================
-- OPÇÃO 3: Exportar COMPLETO (com alternativas e figuras)
-- ============================================================
/*
SELECT
    id,
    ano,
    num_questao,
    area,
    contexto,
    comando,
    alternativas::text as alternativas_json,
    resposta_correta,
    figuras::text as figuras_json,
    created_at
FROM public.enem_questions
ORDER BY ano DESC, id;
*/

-- ============================================================
-- OPÇÃO 4: Resumo estatístico por ano
-- ============================================================
/*
SELECT
    ano,
    COUNT(*) as total_questoes,
    COUNT(DISTINCT area) as areas_distintas,
    AVG(LENGTH(contexto))::int as media_tamanho_texto,
    MAX(LENGTH(contexto)) as maior_texto,
    SUM(CASE WHEN LENGTH(contexto) > 3000 THEN 1 ELSE 0 END) as textos_longos,
    SUM(CASE WHEN contexto LIKE '%##%' THEN 1 ELSE 0 END) as com_markdown
FROM public.enem_questions
GROUP BY ano
ORDER BY ano DESC;
*/

-- ============================================================
-- OPÇÃO 5: Verificar alternativas vazias ou problemáticas
-- ============================================================
/*
SELECT
    id,
    ano,
    num_questao,
    jsonb_array_length(alternativas) as num_alternativas,
    resposta_correta,
    alternativas::text as alternativas_raw
FROM public.enem_questions
WHERE
    alternativas IS NULL
    OR jsonb_array_length(alternativas) < 5
    OR resposta_correta IS NULL
ORDER BY ano DESC, id;
*/
