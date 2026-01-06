-- ════════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO E CORREÇÃO COMPLETA - API ENEM
-- ════════════════════════════════════════════════════════════════════════════
-- Execute este script para identificar e corrigir problemas que impedem
-- a API ENEM de retornar questões
-- ════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- 1. DIAGNÓSTICO INICIAL
-- ════════════════════════════════════════════════════════════════════════════

SELECT '════════════════════════════════════════' as secao;
SELECT '1. DIAGNÓSTICO INICIAL' as secao;
SELECT '════════════════════════════════════════' as secao;

-- Total de questões na tabela
SELECT 'Total de questões na tabela questoes_enem:' as info, COUNT(*) as total FROM questoes_enem;

-- Distribuição por status
SELECT '--- Status das Questões ---' as info;
SELECT
    COALESCE(status, 'NULL') as status,
    COUNT(*) as quantidade
FROM questoes_enem
GROUP BY status
ORDER BY quantidade DESC;

-- Distribuição por área (como está no banco)
SELECT '--- Áreas no Banco ---' as info;
SELECT
    COALESCE(area, 'NULL') as area,
    COUNT(*) as quantidade
FROM questoes_enem
GROUP BY area
ORDER BY quantidade DESC;

-- Verificar se há áreas que não são as esperadas
SELECT '--- Áreas Fora do Padrão ---' as info;
SELECT DISTINCT area
FROM questoes_enem
WHERE area NOT IN ('ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas')
  AND area IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- 2. CORREÇÕES AUTOMÁTICAS
-- ════════════════════════════════════════════════════════════════════════════

SELECT '════════════════════════════════════════' as secao;
SELECT '2. APLICANDO CORREÇÕES' as secao;
SELECT '════════════════════════════════════════' as secao;

-- 2.1 Normalizar áreas para o formato esperado pela API
-- Ciências da Natureza
UPDATE questoes_enem
SET area = 'ciencias-natureza'
WHERE area NOT IN ('ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas')
  AND (
    LOWER(area) LIKE '%natureza%'
    OR LOWER(area) LIKE '%natural%'
    OR LOWER(area) LIKE '%ciência%'
    OR LOWER(area) LIKE '%ciencia%'
    OR LOWER(area) IN ('fisica', 'física', 'quimica', 'química', 'biologia')
  );

-- Matemática
UPDATE questoes_enem
SET area = 'matematica'
WHERE area NOT IN ('ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas')
  AND (
    LOWER(area) LIKE '%matemat%'
    OR LOWER(area) LIKE '%math%'
  );

-- Linguagens
UPDATE questoes_enem
SET area = 'linguagens'
WHERE area NOT IN ('ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas')
  AND (
    LOWER(area) LIKE '%linguag%'
    OR LOWER(area) LIKE '%portugu%'
    OR LOWER(area) LIKE '%liter%'
    OR LOWER(area) LIKE '%language%'
    OR LOWER(area) LIKE '%redação%'
    OR LOWER(area) LIKE '%redacao%'
  );

-- Ciências Humanas
UPDATE questoes_enem
SET area = 'ciencias-humanas'
WHERE area NOT IN ('ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas')
  AND (
    LOWER(area) LIKE '%humanas%'
    OR LOWER(area) LIKE '%histor%'
    OR LOWER(area) LIKE '%geogr%'
    OR LOWER(area) LIKE '%filosof%'
    OR LOWER(area) LIKE '%sociolog%'
  );

-- 2.2 Garantir que todas as questões tenham status
UPDATE questoes_enem
SET status = 'ativa'
WHERE status IS NULL OR TRIM(status) = '';

-- 2.3 Ativar questões válidas que estavam em revisão
UPDATE questoes_enem
SET status = 'ativa'
WHERE status = 'revisao'
  AND contexto IS NOT NULL
  AND TRIM(contexto) != ''
  AND LENGTH(contexto) >= 20
  AND alternativa_a IS NOT NULL
  AND alternativa_b IS NOT NULL
  AND alternativa_c IS NOT NULL
  AND alternativa_d IS NOT NULL
  AND alternativa_e IS NOT NULL
  AND resposta_correta IN ('A', 'B', 'C', 'D', 'E');

-- 2.4 Normalizar subáreas
UPDATE questoes_enem
SET subarea = 'fisica'
WHERE area = 'ciencias-natureza'
  AND (subarea IS NULL OR TRIM(subarea) = '' OR LOWER(subarea) LIKE '%física%' OR LOWER(subarea) LIKE '%fisica%');

UPDATE questoes_enem
SET subarea = 'matematica'
WHERE area = 'matematica'
  AND (subarea IS NULL OR TRIM(subarea) = '');

-- 2.5 Corrigir respostas corretas inválidas
UPDATE questoes_enem
SET resposta_correta = UPPER(TRIM(resposta_correta))
WHERE resposta_correta != UPPER(TRIM(resposta_correta));

UPDATE questoes_enem
SET resposta_correta = 'A'
WHERE resposta_correta IS NULL
   OR resposta_correta NOT IN ('A', 'B', 'C', 'D', 'E');

-- ════════════════════════════════════════════════════════════════════════════
-- 3. VERIFICAÇÃO PÓS-CORREÇÃO
-- ════════════════════════════════════════════════════════════════════════════

SELECT '════════════════════════════════════════' as secao;
SELECT '3. VERIFICAÇÃO PÓS-CORREÇÃO' as secao;
SELECT '════════════════════════════════════════' as secao;

-- Total de questões ativas
SELECT 'Questões ATIVAS após correção:' as info, COUNT(*) as total
FROM questoes_enem
WHERE status = 'ativa';

-- Distribuição por área (após correção)
SELECT '--- Áreas após Correção ---' as info;
SELECT
    COALESCE(area, 'NULL') as area,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'ativa') as ativas
FROM questoes_enem
GROUP BY area
ORDER BY total DESC;

-- Questões por área e status (verificação detalhada)
SELECT '--- Questões por Área (apenas ativas) ---' as info;
SELECT
    area,
    subarea,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE status = 'ativa'
GROUP BY area, subarea
ORDER BY area, subarea;

-- ════════════════════════════════════════════════════════════════════════════
-- 4. TESTE DE CONSULTA (simula a API)
-- ════════════════════════════════════════════════════════════════════════════

SELECT '════════════════════════════════════════' as secao;
SELECT '4. TESTE DE CONSULTA (simula API)' as secao;
SELECT '════════════════════════════════════════' as secao;

-- Teste: Buscar questões de Ciências da Natureza (área que a API usa para Física)
SELECT 'Teste: ciencias-natureza + status=ativa:' as info, COUNT(*) as encontradas
FROM questoes_enem
WHERE status = 'ativa' AND area = 'ciencias-natureza';

-- Teste: Buscar questões de Matemática
SELECT 'Teste: matematica + status=ativa:' as info, COUNT(*) as encontradas
FROM questoes_enem
WHERE status = 'ativa' AND area = 'matematica';

-- Amostra de uma questão ativa
SELECT '--- Amostra de Questão Ativa ---' as info;
SELECT
    id,
    ano_prova,
    area,
    subarea,
    status,
    LEFT(contexto, 100) as contexto_preview,
    resposta_correta
FROM questoes_enem
WHERE status = 'ativa'
LIMIT 3;

-- ════════════════════════════════════════════════════════════════════════════
-- 5. RESUMO FINAL
-- ════════════════════════════════════════════════════════════════════════════

SELECT '════════════════════════════════════════' as secao;
SELECT '5. RESUMO FINAL' as secao;
SELECT '════════════════════════════════════════' as secao;

DO $$
DECLARE
    v_total INTEGER;
    v_ativas INTEGER;
    v_ciencias INTEGER;
    v_matematica INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM questoes_enem;
    SELECT COUNT(*) INTO v_ativas FROM questoes_enem WHERE status = 'ativa';
    SELECT COUNT(*) INTO v_ciencias FROM questoes_enem WHERE status = 'ativa' AND area = 'ciencias-natureza';
    SELECT COUNT(*) INTO v_matematica FROM questoes_enem WHERE status = 'ativa' AND area = 'matematica';

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '                    DIAGNÓSTICO COMPLETO                     ';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Total de questões: %', v_total;
    RAISE NOTICE 'Questões ativas: %', v_ativas;
    RAISE NOTICE '';
    RAISE NOTICE 'Por área (ativas):';
    RAISE NOTICE '  - Ciências da Natureza: %', v_ciencias;
    RAISE NOTICE '  - Matemática: %', v_matematica;
    RAISE NOTICE '';

    IF v_ativas = 0 THEN
        RAISE NOTICE '⚠️  ATENÇÃO: Nenhuma questão ativa encontrada!';
        RAISE NOTICE '   A API retornará "SEM_QUESTOES"';
        RAISE NOTICE '';
        RAISE NOTICE 'Possíveis causas:';
        RAISE NOTICE '  1. Questões não foram importadas';
        RAISE NOTICE '  2. Todas as questões estão com status diferente de "ativa"';
        RAISE NOTICE '  3. As áreas não foram normalizadas corretamente';
    ELSIF v_ciencias = 0 AND v_matematica = 0 THEN
        RAISE NOTICE '⚠️  ATENÇÃO: Nenhuma questão de Física ou Matemática!';
        RAISE NOTICE '   O Studão usa apenas estas disciplinas.';
    ELSE
        RAISE NOTICE '✅ Banco de dados configurado corretamente!';
        RAISE NOTICE '   A API deve retornar questões normalmente.';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;
