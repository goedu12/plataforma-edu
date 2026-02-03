-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO DETALHADO: Formatação das questões ENEM 2025
-- Execute para ver o estado de todas as questões
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. VISÃO GERAL: Todas as questões com status de formatação
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
    numero_questao as q,
    area,
    COALESCE(subarea, '-') as subarea,
    CASE
        WHEN contexto IS NULL OR contexto = '' THEN '❌ VAZIO'
        WHEN LENGTH(contexto) < 50 THEN '⚠️ CURTO'
        WHEN contexto LIKE '%<small>%' AND contexto LIKE '%<strong>%' THEN '✅ COMPLETO'
        WHEN contexto LIKE '%<small>%' THEN '🔵 FONTE OK'
        WHEN contexto LIKE '%<strong>%' THEN '🟡 TÍTULO OK'
        WHEN contexto ~ 'Disponível em:|Acesso em:' THEN '🟠 PRECISA SMALL'
        ELSE '⚪ SEM HTML'
    END as status_formatacao,
    LENGTH(contexto) as chars
FROM questoes_enem
WHERE ano_prova = 2025
ORDER BY numero_questao;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. QUESTÕES SEM TAG <small> (fontes não formatadas)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
    numero_questao,
    area,
    'PRECISA <small>' as acao,
    RIGHT(contexto, 150) as final_do_texto
FROM questoes_enem
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND (contexto LIKE '%Disponível em:%' OR contexto LIKE '%Acesso em:%')
ORDER BY numero_questao;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. QUESTÕES VAZIAS OU COM CONTEXTO MUITO CURTO
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
    numero_questao,
    area,
    subarea,
    LENGTH(contexto) as tamanho,
    contexto as contexto_completo
FROM questoes_enem
WHERE ano_prova = 2025
  AND (contexto IS NULL OR LENGTH(contexto) < 100)
ORDER BY numero_questao;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. VER CONTEXTO COMPLETO DE CADA QUESTÃO (executar em partes)
-- ═══════════════════════════════════════════════════════════════════════════

-- Questões 1-10
SELECT numero_questao, area, contexto
FROM questoes_enem
WHERE ano_prova = 2025 AND numero_questao BETWEEN 1 AND 10
ORDER BY numero_questao;

-- Questões 11-20
SELECT numero_questao, area, contexto
FROM questoes_enem
WHERE ano_prova = 2025 AND numero_questao BETWEEN 11 AND 20
ORDER BY numero_questao;

-- Questões 21-30
SELECT numero_questao, area, contexto
FROM questoes_enem
WHERE ano_prova = 2025 AND numero_questao BETWEEN 21 AND 30
ORDER BY numero_questao;

-- Questões 31-40
SELECT numero_questao, area, contexto
FROM questoes_enem
WHERE ano_prova = 2025 AND numero_questao BETWEEN 31 AND 40
ORDER BY numero_questao;

-- Questões 41-50
SELECT numero_questao, area, contexto
FROM questoes_enem
WHERE ano_prova = 2025 AND numero_questao BETWEEN 41 AND 50
ORDER BY numero_questao;

-- Questões 51-60
SELECT numero_questao, area, contexto
FROM questoes_enem
WHERE ano_prova = 2025 AND numero_questao BETWEEN 51 AND 60
ORDER BY numero_questao;

-- Questões 61-70
SELECT numero_questao, area, contexto
FROM questoes_enem
WHERE ano_prova = 2025 AND numero_questao BETWEEN 61 AND 70
ORDER BY numero_questao;

-- Questões 71-80
SELECT numero_questao, area, contexto
FROM questoes_enem
WHERE ano_prova = 2025 AND numero_questao BETWEEN 71 AND 80
ORDER BY numero_questao;

-- Questões 81-90
SELECT numero_questao, area, contexto
FROM questoes_enem
WHERE ano_prova = 2025 AND numero_questao BETWEEN 81 AND 90
ORDER BY numero_questao;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. RESUMO POR ÁREA
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
    area,
    COUNT(*) as total,
    SUM(CASE WHEN contexto LIKE '%<small>%' THEN 1 ELSE 0 END) as com_small,
    SUM(CASE WHEN contexto LIKE '%<strong>%' THEN 1 ELSE 0 END) as com_strong,
    SUM(CASE WHEN contexto IS NULL OR LENGTH(contexto) < 50 THEN 1 ELSE 0 END) as problematicas
FROM questoes_enem
WHERE ano_prova = 2025
GROUP BY area
ORDER BY area;
