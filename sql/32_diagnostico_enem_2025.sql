-- ═══════════════════════════════════════════════════════════════════════════
-- DIAGNÓSTICO: Questões ENEM 2025
-- Verificar problemas com dados inseridos
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Ver todas as questões de 2025
SELECT
    id,
    numero_questao,
    area,
    subarea,
    LENGTH(contexto) as len_contexto,
    LEFT(contexto, 100) as contexto_preview,
    LEFT(comando, 100) as comando_preview,
    LEFT(alternativa_a, 50) as alt_a_preview,
    LEFT(alternativa_b, 50) as alt_b_preview,
    resposta_correta,
    status
FROM questoes_enem
WHERE ano_prova = 2025
ORDER BY numero_questao;

-- 2. Verificar questões com "ENEM2025" repetido no comando
SELECT
    id,
    numero_questao,
    area,
    comando
FROM questoes_enem
WHERE ano_prova = 2025
  AND comando LIKE '%ENEM2025ENEM2025%';

-- 3. Verificar questões com alternativas suspeitas (padrões repetitivos)
SELECT
    id,
    numero_questao,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    alternativa_e
FROM questoes_enem
WHERE ano_prova = 2025
  AND (
    alternativa_a LIKE '%ENEM2025%' OR
    alternativa_b LIKE '%ENEM2025%' OR
    alternativa_c LIKE '%ENEM2025%' OR
    alternativa_d LIKE '%ENEM2025%' OR
    alternativa_e LIKE '%ENEM2025%'
  );

-- 4. Contar questões por status
SELECT
    status,
    COUNT(*) as total
FROM questoes_enem
WHERE ano_prova = 2025
GROUP BY status;

-- 5. Ver estatísticas gerais das questões de 2025
SELECT
    area,
    subarea,
    COUNT(*) as total,
    AVG(LENGTH(contexto)) as media_len_contexto,
    AVG(LENGTH(alternativa_a)) as media_len_alt_a
FROM questoes_enem
WHERE ano_prova = 2025
GROUP BY area, subarea
ORDER BY area, subarea;
