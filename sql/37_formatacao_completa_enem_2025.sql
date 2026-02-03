-- ═══════════════════════════════════════════════════════════════════════════
-- FORMATAÇÃO COMPLETA: Todas as questões ENEM 2025
-- Aplica formatação automática em todas as 90 questões
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 1: DIAGNÓSTICO - Ver estado atual das questões
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
    numero_questao,
    area,
    subarea,
    LENGTH(contexto) as len_contexto,
    CASE
        WHEN contexto LIKE '%<small>%' THEN '✓ Com <small>'
        WHEN contexto LIKE '%Disponível em:%' OR contexto LIKE '%Acesso em:%' THEN '⚠ Fonte sem formatação'
        ELSE '○ Sem fonte'
    END as status_fonte,
    LEFT(contexto, 80) as preview
FROM questoes_enem
WHERE ano_prova = 2025
ORDER BY numero_questao;

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 2: FORMATAR FONTES COM <small> - Todas as questões
-- Adiciona <small> nas referências bibliográficas (Disponível em:, Acesso em:)
-- ═══════════════════════════════════════════════════════════════════════════

-- 2.1 Formatar padrão: "AUTOR. Disponível em: ... Acesso em: ... (adaptado)."
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    '([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][A-ZÀÁÂÃÉÊÍÓÔÕÚÇ\s,\.]+\.\s*Disponível em:[^\n]+(?:Acesso em:[^\n]+)?(?:\(adaptado\))?\.?)\s*$',
    E'\n\n<small>\\1</small>',
    'gi'
)
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND contexto ~ 'Disponível em:';

-- 2.2 Formatar padrão simples: "Disponível em: ... Acesso em: ..."
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    '(Disponível em:[^\n]+(?:Acesso em:[^\n]+)?(?:\(adaptado\))?\.?)\s*$',
    E'\n\n<small>\\1</small>',
    'gi'
)
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND contexto ~ 'Disponível em:';

-- 2.3 Formatar padrão: "AUTOR, Nome. Título. Editora, Ano."
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    '([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]+,\s*[A-Z][a-zàáâãéêíóôõúç]+\.[^\n]{10,100}(?:19|20)\d{2}[^\n]*\.?)\s*$',
    E'\n\n<small>\\1</small>',
    'g'
)
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND contexto ~ '[A-Z]{2,},\s*[A-Z][a-z]+\.';

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 3: LIMPAR FORMATAÇÃO DUPLICADA
-- Remove tags <small> aninhadas ou duplicadas
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    '<small>\s*<small>',
    '<small>',
    'gi'
)
WHERE ano_prova = 2025
  AND contexto LIKE '%<small>%<small>%';

UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    '</small>\s*</small>',
    '</small>',
    'gi'
)
WHERE ano_prova = 2025
  AND contexto LIKE '%</small>%</small>%';

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 4: REMOVER ESPAÇOS EXTRAS
-- Limpa múltiplas quebras de linha e espaços em excesso
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    '\n{4,}',
    E'\n\n',
    'g'
)
WHERE ano_prova = 2025
  AND contexto ~ '\n{4,}';

UPDATE questoes_enem
SET contexto = TRIM(contexto)
WHERE ano_prova = 2025;

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 5: VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
    numero_questao,
    area,
    CASE
        WHEN contexto LIKE '%<small>%' THEN '✓'
        ELSE '○'
    END as tem_small,
    CASE
        WHEN contexto LIKE '%<strong>%' THEN '✓'
        ELSE '○'
    END as tem_strong,
    CASE
        WHEN contexto LIKE '%<em>%' THEN '✓'
        ELSE '○'
    END as tem_em,
    RIGHT(contexto, 100) as final_contexto
FROM questoes_enem
WHERE ano_prova = 2025
ORDER BY numero_questao;

-- ═══════════════════════════════════════════════════════════════════════════
-- ESTATÍSTICAS
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
    'Total questões 2025' as metrica,
    COUNT(*) as valor
FROM questoes_enem
WHERE ano_prova = 2025

UNION ALL

SELECT
    'Com tag <small>',
    COUNT(*)
FROM questoes_enem
WHERE ano_prova = 2025 AND contexto LIKE '%<small>%'

UNION ALL

SELECT
    'Com tag <strong>',
    COUNT(*)
FROM questoes_enem
WHERE ano_prova = 2025 AND contexto LIKE '%<strong>%'

UNION ALL

SELECT
    'Com tag <em>',
    COUNT(*)
FROM questoes_enem
WHERE ano_prova = 2025 AND contexto LIKE '%<em>%'

UNION ALL

SELECT
    'Sem formatação HTML',
    COUNT(*)
FROM questoes_enem
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND contexto NOT LIKE '%<strong>%'
  AND contexto NOT LIKE '%<em>%';
