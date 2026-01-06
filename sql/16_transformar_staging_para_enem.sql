-- ================================================================
-- PASSO 3: TRANSFORMAR STAGING → QUESTOES_ENEM
-- ================================================================
-- Execute APÓS importar o CSV para a tabela enem_staging
-- ================================================================


-- Verificar se há dados na staging
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM enem_staging;

    IF v_count = 0 THEN
        RAISE EXCEPTION '❌ Tabela enem_staging está vazia! Importe o CSV primeiro.';
    ELSE
        RAISE NOTICE '✅ Encontradas % linhas na staging', v_count;
    END IF;
END $$;


-- ================================================================
-- INSERIR NA TABELA PRINCIPAL (questoes_enem)
-- ================================================================

INSERT INTO questoes_enem (
    id_api,
    ano_prova,
    numero_questao,
    area,
    subarea,
    titulo,
    contexto,
    comando,
    imagem_principal,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    alternativa_e,
    resposta_correta,
    dificuldade,
    fonte,
    status
)
SELECT
    -- ID único baseado no CSV
    'csv-' || COALESCE(exam, '2020') || '-' || ROW_NUMBER() OVER () || '-' || COALESCE(id, 'q' || ROW_NUMBER() OVER ()) as id_api,

    -- Ano da prova
    COALESCE(NULLIF(exam, '')::INTEGER, NULLIF(ano, '')::INTEGER, 2020) as ano_prova,

    -- Número da questão (extrair do ID ou usar sequência)
    ROW_NUMBER() OVER (PARTITION BY COALESCE(exam, ano) ORDER BY id) as numero_questao,

    -- Área (detectar ou usar default)
    CASE
        WHEN LOWER(COALESCE(area, '')) LIKE '%natureza%' THEN 'ciencias-natureza'
        WHEN LOWER(COALESCE(area, '')) LIKE '%matemática%' OR LOWER(COALESCE(area, '')) LIKE '%matematica%' THEN 'matematica'
        WHEN LOWER(COALESCE(area, '')) LIKE '%linguagens%' THEN 'linguagens'
        WHEN LOWER(COALESCE(area, '')) LIKE '%humanas%' THEN 'ciencias-humanas'
        ELSE 'ciencias-natureza'
    END as area,

    -- Subárea (default para física se ciências da natureza)
    CASE
        WHEN LOWER(COALESCE(area, '')) LIKE '%natureza%' THEN 'fisica'
        WHEN LOWER(COALESCE(area, '')) LIKE '%matemática%' OR LOWER(COALESCE(area, '')) LIKE '%matematica%' THEN 'matematica'
        ELSE 'fisica'
    END as subarea,

    -- Título
    'ENEM ' || COALESCE(exam, ano, '2020') || ' - Questão ' || ROW_NUMBER() OVER () as titulo,

    -- Contexto (enunciado)
    COALESCE(NULLIF(question, ''), NULLIF(description, ''), '') as contexto,

    -- Comando (descrição para acessibilidade)
    NULLIF(description, '') as comando,

    -- Imagem principal (primeira URL do array figures)
    CASE
        WHEN figures IS NOT NULL AND figures != '' AND figures != '[]' THEN
            -- Extrair primeira URL do array
            REGEXP_REPLACE(
                SPLIT_PART(REPLACE(REPLACE(figures, '[', ''), ']', ''), ',', 1),
                '[''"]', '', 'g'
            )
        ELSE NULL
    END as imagem_principal,

    -- Alternativas (priorizar colunas separadas, depois lista)
    COALESCE(
        NULLIF("A", ''),
        -- Se não tem coluna A, tentar extrair do alternatives
        CASE WHEN alternatives IS NOT NULL AND alternatives LIKE '[%' THEN
            TRIM(BOTH '''' FROM TRIM(BOTH '"' FROM SPLIT_PART(REPLACE(REPLACE(alternatives, '[', ''), ']', ''), ',', 1)))
        ELSE '' END
    ) as alternativa_a,

    COALESCE(
        NULLIF("B", ''),
        CASE WHEN alternatives IS NOT NULL AND alternatives LIKE '[%' THEN
            TRIM(BOTH '''' FROM TRIM(BOTH '"' FROM SPLIT_PART(REPLACE(REPLACE(alternatives, '[', ''), ']', ''), ',', 2)))
        ELSE '' END
    ) as alternativa_b,

    COALESCE(
        NULLIF("C", ''),
        CASE WHEN alternatives IS NOT NULL AND alternatives LIKE '[%' THEN
            TRIM(BOTH '''' FROM TRIM(BOTH '"' FROM SPLIT_PART(REPLACE(REPLACE(alternatives, '[', ''), ']', ''), ',', 3)))
        ELSE '' END
    ) as alternativa_c,

    COALESCE(
        NULLIF("D", ''),
        CASE WHEN alternatives IS NOT NULL AND alternatives LIKE '[%' THEN
            TRIM(BOTH '''' FROM TRIM(BOTH '"' FROM SPLIT_PART(REPLACE(REPLACE(alternatives, '[', ''), ']', ''), ',', 4)))
        ELSE '' END
    ) as alternativa_d,

    COALESCE(
        NULLIF("E", ''),
        CASE WHEN alternatives IS NOT NULL AND alternatives LIKE '[%' THEN
            TRIM(BOTH '''' FROM TRIM(BOTH '"' FROM SPLIT_PART(REPLACE(REPLACE(alternatives, '[', ''), ']', ''), ',', 5)))
        ELSE '' END
    ) as alternativa_e,

    -- Resposta correta
    UPPER(COALESCE(NULLIF(label, ''), 'A')) as resposta_correta,

    -- Dificuldade
    CASE
        WHEN level IS NOT NULL AND level ~ '^\d+$' THEN
            CASE
                WHEN level::INTEGER <= 1 THEN 'facil'
                WHEN level::INTEGER >= 4 THEN 'dificil'
                ELSE 'medio'
            END
        ELSE 'medio'
    END as dificuldade,

    'ENEM-CSV' as fonte,
    'ativa' as status

FROM enem_staging
WHERE
    -- Filtrar linhas vazias
    (question IS NOT NULL AND question != '' AND question != 'nan')
    OR (description IS NOT NULL AND description != '' AND description != 'nan')

ON CONFLICT (id_api) DO UPDATE SET
    contexto = EXCLUDED.contexto,
    alternativa_a = EXCLUDED.alternativa_a,
    alternativa_b = EXCLUDED.alternativa_b,
    alternativa_c = EXCLUDED.alternativa_c,
    alternativa_d = EXCLUDED.alternativa_d,
    alternativa_e = EXCLUDED.alternativa_e,
    resposta_correta = EXCLUDED.resposta_correta,
    atualizado_em = NOW();


-- ================================================================
-- RESULTADO
-- ================================================================

DO $$
DECLARE
    v_staging INTEGER;
    v_importadas INTEGER;
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_staging FROM enem_staging;
    SELECT COUNT(*) INTO v_importadas FROM questoes_enem WHERE fonte = 'ENEM-CSV';
    SELECT COUNT(*) INTO v_total FROM questoes_enem;

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '              🎉 IMPORTAÇÃO CONCLUÍDA!                       ';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '  📊 Linhas no CSV (staging): %', v_staging;
    RAISE NOTICE '  ✅ Questões importadas do CSV: %', v_importadas;
    RAISE NOTICE '  📝 Total de questões no banco: %', v_total;
    RAISE NOTICE '';
    RAISE NOTICE '  As questões já estão disponíveis no Simulado ENEM!';
    RAISE NOTICE '  Acesse: /fisica/simulado-enem';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;


-- ================================================================
-- LIMPAR TABELA DE STAGING (opcional)
-- Descomente se quiser remover após importação
-- ================================================================
-- DROP TABLE enem_staging;
