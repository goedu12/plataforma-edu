-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  DIAGNÓSTICO DE NOTA DO ESTUDANTE                                           ║
-- ║  Execute para verificar por que a nota está 0.0                             ║
-- ║  Data: 2026-02-04                                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- 1. VERIFICAR PERÍODO ATUAL
-- O 1º bimestre de 2026 começou em 02/02/2026
-- ============================================================================

SELECT 'PERÍODO ATUAL' as info;
SELECT
    CURRENT_DATE as data_hoje,
    '2026-02-02' as inicio_1_bimestre,
    '2026-03-24' as fim_1_bimestre,
    CASE
        WHEN CURRENT_DATE >= '2026-02-02' AND CURRENT_DATE <= '2026-03-24'
        THEN 'DENTRO do 1º bimestre'
        ELSE 'FORA do período'
    END as status_periodo;

-- ============================================================================
-- 2. VERIFICAR RESPOSTAS DO USUÁRIO NO PERÍODO ATUAL
-- Substitua 'USUARIO_ID_AQUI' pelo ID do usuário Rafael
-- ============================================================================

-- Para encontrar o ID do usuário Rafael:
SELECT 'USUÁRIOS COM NOME RAFAEL' as info;
SELECT id, nome, email, turma
FROM usuarios
WHERE nome ILIKE '%rafael%'
LIMIT 5;

-- ============================================================================
-- 3. VERIFICAR RESPOSTAS NO PERÍODO DO 1º BIMESTRE 2026
-- ============================================================================

SELECT 'RESPOSTAS NO 1º BIMESTRE 2026' as info;
SELECT
    u.nome,
    r.componente,
    r.modo,
    COUNT(*) as total_respostas,
    SUM(CASE WHEN r.correta THEN 1 ELSE 0 END) as acertos,
    SUM(r.tempo_segundos) / 3600.0 as horas_total
FROM respostas r
JOIN usuarios u ON r.usuario_id = u.id
WHERE u.nome ILIKE '%rafael%'
  AND r.criado_em >= '2026-02-02'
  AND r.criado_em <= '2026-03-24 23:59:59'
GROUP BY u.nome, r.componente, r.modo
ORDER BY u.nome, r.componente;

-- ============================================================================
-- 4. VERIFICAR TODAS AS RESPOSTAS DO USUÁRIO (últimos 30 dias)
-- ============================================================================

SELECT 'RESPOSTAS ÚLTIMOS 30 DIAS' as info;
SELECT
    u.nome,
    r.componente,
    r.modo,
    DATE(r.criado_em) as data,
    COUNT(*) as questoes,
    SUM(CASE WHEN r.correta THEN 1 ELSE 0 END) as acertos
FROM respostas r
JOIN usuarios u ON r.usuario_id = u.id
WHERE u.nome ILIKE '%rafael%'
  AND r.criado_em >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.nome, r.componente, r.modo, DATE(r.criado_em)
ORDER BY DATE(r.criado_em) DESC;

-- ============================================================================
-- 5. VERIFICAR DADOS NA TABELA notas_2025
-- ============================================================================

SELECT 'NOTAS REGISTRADAS' as info;
SELECT
    u.nome,
    n.*
FROM notas_2025 n
JOIN usuarios u ON n.usuario_id = u.id
WHERE u.nome ILIKE '%rafael%'
ORDER BY n.ano_letivo DESC, n.bimestre DESC;

-- ============================================================================
-- 6. VERIFICAR PONTOS DO USUÁRIO
-- ============================================================================

SELECT 'DADOS DO USUÁRIO' as info;
SELECT
    id,
    nome,
    turma,
    fis_pontos,
    fis_questoes_total,
    fis_questoes_corretas,
    fis_sequencia_dias,
    mat_pontos,
    mat_questoes_total,
    mat_questoes_corretas,
    mat_sequencia_dias
FROM usuarios
WHERE nome ILIKE '%rafael%';

-- ============================================================================
-- EXPLICAÇÃO DO PROBLEMA
-- ============================================================================
--
-- A nota mostra 0.0 porque:
-- 1. O 1º bimestre de 2026 começou em 02/02/2026 (apenas 2 dias atrás)
-- 2. O sistema calcula a nota baseado nas respostas do BIMESTRE ATUAL
-- 3. Se o usuário não respondeu questões desde 02/02/2026, a nota será 0.0
--
-- Os 1834 pontos que aparecem são históricos (soma de todos os tempos)
-- A nota é calculada apenas para o período do bimestre atual
--
-- SOLUÇÃO:
-- O usuário precisa responder questões no período atual para a nota subir
-- Cada acerto no modo Estudar = +0.04 pontos (máx 6.0)
-- Cada acerto no modo Revisão = +0.02 pontos
-- Cada acerto no modo Desafio = +0.01 pontos
-- Tempo de uso também conta (2h=1pt, 3h=2pt, 4h=3pt, 5h+=4pt, máx 4.0)
-- ============================================================================
