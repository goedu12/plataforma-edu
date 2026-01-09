-- ================================================================
-- REMOVER QUESTÕES DUPLICADAS/PROBLEMÁTICAS DO ENEM
-- ATENÇÃO: Execute primeiro o script 32 para IDENTIFICAR antes de remover!
-- ================================================================

-- ============================================================
-- OPÇÃO 1: Remover questões duplicadas mantendo apenas uma
-- (mantém a primeira ocorrência baseada no id)
-- ============================================================

-- Primeiro, veja quais serão removidas:
SELECT id, ano, LEFT(contexto, 80) as contexto_resumo
FROM public.enem_questions q1
WHERE EXISTS (
    SELECT 1 FROM public.enem_questions q2
    WHERE q2.ano = q1.ano
      AND LEFT(q2.contexto, 80) = LEFT(q1.contexto, 80)
      AND q2.id < q1.id  -- mantém o menor id
);

-- Para REMOVER (descomente quando estiver pronto):
/*
DELETE FROM public.enem_questions
WHERE id IN (
    SELECT q1.id
    FROM public.enem_questions q1
    WHERE EXISTS (
        SELECT 1 FROM public.enem_questions q2
        WHERE q2.ano = q1.ano
          AND LEFT(q2.contexto, 80) = LEFT(q1.contexto, 80)
          AND q2.id < q1.id
    )
);
*/

-- ============================================================
-- OPÇÃO 2: Remover questões com texto extremamente longo
-- (provavelmente são concatenações de múltiplas questões)
-- ============================================================

-- Primeiro, veja quais serão removidas:
SELECT id, ano, LENGTH(contexto) as tamanho
FROM public.enem_questions
WHERE LENGTH(contexto) > 3000;

-- Para REMOVER (descomente quando estiver pronto):
/*
DELETE FROM public.enem_questions
WHERE LENGTH(contexto) > 3000;
*/

-- ============================================================
-- OPÇÃO 3: Remover questões onde o mesmo texto aparece 2x
-- (detecta repetição interna do conteúdo)
-- ============================================================

-- Primeiro, identifique:
SELECT id, ano, LENGTH(contexto) as tamanho
FROM public.enem_questions
WHERE contexto LIKE CONCAT('%', LEFT(contexto, 100), '%', LEFT(contexto, 100), '%')
  AND LENGTH(contexto) > 200;

-- Para REMOVER (descomente quando estiver pronto):
/*
DELETE FROM public.enem_questions
WHERE contexto LIKE CONCAT('%', LEFT(contexto, 100), '%', LEFT(contexto, 100), '%')
  AND LENGTH(contexto) > 200;
*/

-- ============================================================
-- OPÇÃO 4: Remover questões com padrões de duplicação
-- ============================================================

-- Primeiro, identifique:
SELECT id, ano
FROM public.enem_questions
WHERE contexto ~ 'QUESTÃO [0-9]+.*QUESTÃO [0-9]+'  -- Dois cabeçalhos de questão
   OR contexto ~ 'ENEM 20[0-9]{2}.*ENEM 20[0-9]{2}'  -- Dois anos ENEM
   OR contexto ~ '\(ENEM.*\).*\(ENEM.*\)';          -- Duas referências ENEM

-- Para REMOVER (descomente quando estiver pronto):
/*
DELETE FROM public.enem_questions
WHERE contexto ~ 'QUESTÃO [0-9]+.*QUESTÃO [0-9]+'
   OR contexto ~ 'ENEM 20[0-9]{2}.*ENEM 20[0-9]{2}'
   OR contexto ~ '\(ENEM.*\).*\(ENEM.*\)';
*/

-- ============================================================
-- VERIFICAÇÃO FINAL: Contagem após limpeza
-- ============================================================
SELECT
    COUNT(*) as total_questoes,
    COUNT(DISTINCT ano) as anos_distintos,
    MIN(ano) as ano_mais_antigo,
    MAX(ano) as ano_mais_recente
FROM public.enem_questions;
