-- ════════════════════════════════════════════════════════════════════════════
-- LIMPAR QUESTÕES DO CSV E USAR APENAS API EXTERNA
-- ════════════════════════════════════════════════════════════════════════════
-- Este script remove as questões importadas via CSV (com problemas)
-- e configura o sistema para usar apenas a API externa api.enem.dev
-- ════════════════════════════════════════════════════════════════════════════

-- 1. DIAGNÓSTICO ANTES DA LIMPEZA
SELECT '════════════════════════════════════════' as secao;
SELECT '1. ANTES DA LIMPEZA' as secao;
SELECT '════════════════════════════════════════' as secao;

SELECT
    COALESCE(fonte, 'NULL') as fonte,
    COUNT(*) as quantidade
FROM questoes_enem
GROUP BY fonte
ORDER BY quantidade DESC;

-- 2. DELETAR QUESTÕES DO CSV
SELECT '════════════════════════════════════════' as secao;
SELECT '2. DELETANDO QUESTÕES DO CSV' as secao;
SELECT '════════════════════════════════════════' as secao;

-- Primeiro, deletar respostas associadas às questões do CSV
DELETE FROM respostas_enem
WHERE questao_id IN (
    SELECT id FROM questoes_enem WHERE fonte = 'ENEM-CSV'
);

-- Agora deletar as questões do CSV
DELETE FROM questoes_enem
WHERE fonte = 'ENEM-CSV';

-- 3. LIMPAR TABELA DE STAGING (se existir)
DROP TABLE IF EXISTS enem_staging;

-- 4. VERIFICAR RESULTADO
SELECT '════════════════════════════════════════' as secao;
SELECT '4. APÓS LIMPEZA' as secao;
SELECT '════════════════════════════════════════' as secao;

SELECT
    COALESCE(fonte, 'NULL') as fonte,
    COUNT(*) as quantidade
FROM questoes_enem
GROUP BY fonte
ORDER BY quantidade DESC;

-- Total de questões restantes
SELECT 'Total de questões no banco:' as info, COUNT(*) as total FROM questoes_enem;

-- RESUMO FINAL
DO $$
DECLARE
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM questoes_enem;

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '                    ✅ LIMPEZA CONCLUÍDA                     ';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Questões do CSV removidas com sucesso!';
    RAISE NOTICE 'Tabela enem_staging removida.';
    RAISE NOTICE '';
    RAISE NOTICE 'Questões restantes no banco: %', v_total;
    RAISE NOTICE '';
    RAISE NOTICE 'O sistema agora usará apenas a API externa (api.enem.dev)';
    RAISE NOTICE 'para buscar questões do ENEM em tempo real.';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;
