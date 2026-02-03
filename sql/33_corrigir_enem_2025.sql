-- ═══════════════════════════════════════════════════════════════════════════
-- CORREÇÃO: Questões ENEM 2025 com padrões repetitivos
-- Remove "ENEM2025ENEM2025..." e "ENEM" repetido do final dos campos
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. DIAGNÓSTICO: Ver questões afetadas antes da correção
SELECT
    id,
    numero_questao,
    comando,
    CASE
        WHEN comando ~ 'ENEM2025ENEM2025' THEN 'PADRÃO ENEM2025 REPETIDO'
        WHEN comando ~ 'ENEM\s*$' THEN 'TERMINA COM ENEM'
        ELSE 'OK'
    END as problema
FROM questoes_enem
WHERE ano_prova = 2025
  AND (comando ~ 'ENEM2025ENEM2025' OR comando ~ 'ENEM\s*$')
ORDER BY numero_questao;

-- 2. CORREÇÃO: Remover padrões "ENEM2025" repetidos do campo comando
UPDATE questoes_enem
SET comando = REGEXP_REPLACE(
    comando,
    '\s*(ENEM2025)+\s*$',  -- Remove ENEM2025 repetido no final
    '',
    'gi'
)
WHERE ano_prova = 2025
  AND comando ~ 'ENEM2025ENEM2025';

-- 3. CORREÇÃO: Remover "ENEM" solto no final do comando
UPDATE questoes_enem
SET comando = REGEXP_REPLACE(
    comando,
    '\s*ENEM\s*$',  -- Remove ENEM solto no final
    '',
    'gi'
)
WHERE ano_prova = 2025
  AND comando ~ '\s*ENEM\s*$';

-- 4. CORREÇÃO: Fazer o mesmo para o campo contexto (caso tenha o problema)
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    '\s*(ENEM2025)+\s*$',
    '',
    'gi'
)
WHERE ano_prova = 2025
  AND contexto ~ 'ENEM2025ENEM2025';

UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    '\s*ENEM\s*$',
    '',
    'gi'
)
WHERE ano_prova = 2025
  AND contexto ~ '\s*ENEM\s*$';

-- 5. CORREÇÃO: Fazer o mesmo para as alternativas
UPDATE questoes_enem
SET
    alternativa_a = REGEXP_REPLACE(alternativa_a, '\s*(ENEM2025)+\s*$', '', 'gi'),
    alternativa_b = REGEXP_REPLACE(alternativa_b, '\s*(ENEM2025)+\s*$', '', 'gi'),
    alternativa_c = REGEXP_REPLACE(alternativa_c, '\s*(ENEM2025)+\s*$', '', 'gi'),
    alternativa_d = REGEXP_REPLACE(alternativa_d, '\s*(ENEM2025)+\s*$', '', 'gi'),
    alternativa_e = REGEXP_REPLACE(alternativa_e, '\s*(ENEM2025)+\s*$', '', 'gi')
WHERE ano_prova = 2025
  AND (
    alternativa_a ~ 'ENEM2025' OR
    alternativa_b ~ 'ENEM2025' OR
    alternativa_c ~ 'ENEM2025' OR
    alternativa_d ~ 'ENEM2025' OR
    alternativa_e ~ 'ENEM2025'
  );

-- 6. VERIFICAÇÃO: Conferir se ainda há problemas
SELECT
    COUNT(*) as questoes_com_problema
FROM questoes_enem
WHERE ano_prova = 2025
  AND (
    comando ~ 'ENEM2025ENEM2025' OR
    contexto ~ 'ENEM2025ENEM2025' OR
    alternativa_a ~ 'ENEM2025' OR
    alternativa_b ~ 'ENEM2025' OR
    alternativa_c ~ 'ENEM2025' OR
    alternativa_d ~ 'ENEM2025' OR
    alternativa_e ~ 'ENEM2025'
  );

-- 7. RESULTADO: Ver questões corrigidas
SELECT
    id,
    numero_questao,
    area,
    LEFT(comando, 80) as comando_corrigido
FROM questoes_enem
WHERE ano_prova = 2025
ORDER BY numero_questao
LIMIT 20;
