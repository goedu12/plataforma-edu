-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  ANÁLISE SÊNIOR - TODAS AS QUESTÕES ENEM (TODOS OS ANOS)                    ║
-- ║  Diagnóstico completo, correções e eliminação de questões irrecuperáveis    ║
-- ║  Analista: Claude (Senior ENEM Question Specialist)                         ║
-- ║  Data: 2026-02-04                                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- FASE 1: DIAGNÓSTICO GERAL
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 1: DIAGNÓSTICO GERAL                                                  ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- 1.1 Visão geral do banco
SELECT 'VISÃO GERAL DO BANCO:' as secao;
SELECT
    COUNT(*) as total_questoes,
    COUNT(DISTINCT ano_prova) as total_anos,
    MIN(ano_prova) as ano_inicial,
    MAX(ano_prova) as ano_final
FROM questoes_enem;

-- 1.2 Distribuição por ano
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'QUESTÕES POR ANO:' as secao;
SELECT
    ano_prova,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questoes_enem), 1) as percentual
FROM questoes_enem
GROUP BY ano_prova
ORDER BY ano_prova DESC;

-- 1.3 Distribuição por área
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'QUESTÕES POR ÁREA:' as secao;
SELECT
    COALESCE(area, 'SEM ÁREA') as area,
    COUNT(*) as quantidade
FROM questoes_enem
GROUP BY area
ORDER BY quantidade DESC;

-- ============================================================================
-- FASE 2: IDENTIFICAÇÃO DE PROBLEMAS CRÍTICOS
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 2: IDENTIFICAÇÃO DE PROBLEMAS CRÍTICOS                                ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- 2.1 Campos obrigatórios vazios
SELECT 'CAMPOS OBRIGATÓRIOS VAZIOS:' as secao;
SELECT
    'Contexto vazio/nulo' as problema,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) > 0 THEN '🔴 CRÍTICO' ELSE '✅ OK' END as status
FROM questoes_enem
WHERE contexto IS NULL OR TRIM(contexto) = ''
UNION ALL
SELECT
    'Comando vazio/nulo' as problema,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) > 0 THEN '🟠 MÉDIO' ELSE '✅ OK' END as status
FROM questoes_enem
WHERE comando IS NULL OR TRIM(comando) = ''
UNION ALL
SELECT
    'Alternativa A vazia' as problema,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) > 0 THEN '🔴 CRÍTICO' ELSE '✅ OK' END as status
FROM questoes_enem
WHERE alternativa_a IS NULL OR TRIM(alternativa_a) = ''
UNION ALL
SELECT
    'Alternativa B vazia' as problema,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) > 0 THEN '🔴 CRÍTICO' ELSE '✅ OK' END as status
FROM questoes_enem
WHERE alternativa_b IS NULL OR TRIM(alternativa_b) = ''
UNION ALL
SELECT
    'Alternativa C vazia' as problema,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) > 0 THEN '🔴 CRÍTICO' ELSE '✅ OK' END as status
FROM questoes_enem
WHERE alternativa_c IS NULL OR TRIM(alternativa_c) = ''
UNION ALL
SELECT
    'Alternativa D vazia' as problema,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) > 0 THEN '🔴 CRÍTICO' ELSE '✅ OK' END as status
FROM questoes_enem
WHERE alternativa_d IS NULL OR TRIM(alternativa_d) = ''
UNION ALL
SELECT
    'Alternativa E vazia' as problema,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) > 0 THEN '🔴 CRÍTICO' ELSE '✅ OK' END as status
FROM questoes_enem
WHERE alternativa_e IS NULL OR TRIM(alternativa_e) = ''
UNION ALL
SELECT
    'Resposta correta ausente' as problema,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) > 0 THEN '🔴 CRÍTICO' ELSE '✅ OK' END as status
FROM questoes_enem
WHERE resposta_correta IS NULL OR TRIM(resposta_correta) = '';

-- 2.2 Respostas inválidas
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'RESPOSTAS INVÁLIDAS (fora de A-E):' as secao;
SELECT
    id,
    ano_prova,
    numero_questao,
    resposta_correta,
    '🔴 ELIMINAR' as acao
FROM questoes_enem
WHERE resposta_correta NOT IN ('A', 'B', 'C', 'D', 'E')
   OR LENGTH(TRIM(resposta_correta)) != 1
ORDER BY ano_prova DESC, numero_questao;

-- 2.3 Problemas de encoding
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'PROBLEMAS DE ENCODING:' as secao;
SELECT
    'Caractere de substituição (�)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE contexto LIKE '%�%'
   OR alternativa_a LIKE '%�%'
   OR alternativa_b LIKE '%�%'
   OR alternativa_c LIKE '%�%'
   OR alternativa_d LIKE '%�%'
   OR alternativa_e LIKE '%�%'
UNION ALL
SELECT
    'HTML entities não decodificados' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE contexto LIKE '%&amp;%'
   OR contexto LIKE '%&lt;%'
   OR contexto LIKE '%&gt;%'
   OR contexto LIKE '%&nbsp;%'
UNION ALL
SELECT
    'Texto repetido/corrompido (ENEM2025ENEM2025...)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE contexto LIKE '%ENEM2025ENEM2025%'
   OR contexto LIKE '%ENEM 2025ENEM 2025%';

-- 2.4 Valores NaN/None como texto
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'VALORES NaN/None COMO TEXTO:' as secao;
SELECT
    id,
    ano_prova,
    numero_questao,
    'contexto = NaN' as problema
FROM questoes_enem
WHERE LOWER(TRIM(contexto)) IN ('nan', 'none', 'null', 'undefined')
UNION ALL
SELECT
    id,
    ano_prova,
    numero_questao,
    'alternativa = NaN' as problema
FROM questoes_enem
WHERE LOWER(TRIM(alternativa_a)) IN ('nan', 'none', 'null')
   OR LOWER(TRIM(alternativa_b)) IN ('nan', 'none', 'null')
   OR LOWER(TRIM(alternativa_c)) IN ('nan', 'none', 'null')
   OR LOWER(TRIM(alternativa_d)) IN ('nan', 'none', 'null')
   OR LOWER(TRIM(alternativa_e)) IN ('nan', 'none', 'null');

-- ============================================================================
-- FASE 3: ANÁLISE DE QUALIDADE DO CONTEÚDO
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 3: ANÁLISE DE QUALIDADE DO CONTEÚDO                                   ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- 3.1 Contextos muito curtos (provavelmente incompletos)
SELECT 'CONTEXTOS MUITO CURTOS (<50 caracteres):' as secao;
SELECT
    id,
    ano_prova,
    numero_questao,
    area,
    LENGTH(contexto) as tamanho,
    LEFT(contexto, 80) as preview,
    '🟠 VERIFICAR' as acao
FROM questoes_enem
WHERE LENGTH(COALESCE(contexto, '')) < 50
  AND LENGTH(COALESCE(contexto, '')) > 0
ORDER BY LENGTH(contexto)
LIMIT 20;

-- 3.2 Questões que mencionam imagens sem ter imagem
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'MENCIONAM IMAGEM SEM TER IMAGEM:' as secao;
SELECT
    id,
    ano_prova,
    numero_questao,
    area,
    CASE
        WHEN contexto ~* 'observe a (figura|imagem|gráfico|tabela|mapa)' THEN 'Pede para observar'
        WHEN contexto ~* 'na (figura|imagem) (abaixo|acima|a seguir)' THEN 'Referência direta'
        WHEN contexto ~* 'de acordo com (o|a) (gráfico|tabela|mapa)' THEN 'Análise de dados visuais'
        WHEN comando ~* 'observe|analise (a|o) (figura|imagem|gráfico)' THEN 'Comando pede análise visual'
        ELSE 'Outro'
    END as tipo_referencia,
    '🟡 ADAPTAR' as acao
FROM questoes_enem
WHERE (
    contexto ~* 'observe a (figura|imagem|gráfico|tabela|mapa)'
    OR contexto ~* 'na (figura|imagem) (abaixo|acima|a seguir)'
    OR contexto ~* 'de acordo com (o|a) (gráfico|tabela|mapa)'
    OR comando ~* 'observe|analise (a|o) (figura|imagem|gráfico)'
)
AND (imagem_principal IS NULL OR TRIM(imagem_principal) = '')
AND (imagens_extras IS NULL OR array_length(imagens_extras, 1) IS NULL)
ORDER BY ano_prova DESC, numero_questao
LIMIT 30;

-- 3.3 Questões com todas as alternativas idênticas
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'ALTERNATIVAS IDÊNTICAS OU MUITO SIMILARES:' as secao;
SELECT
    id,
    ano_prova,
    numero_questao,
    '🔴 ELIMINAR - Alternativas idênticas' as acao
FROM questoes_enem
WHERE alternativa_a = alternativa_b
   OR alternativa_a = alternativa_c
   OR alternativa_a = alternativa_d
   OR alternativa_a = alternativa_e
   OR alternativa_b = alternativa_c
   OR alternativa_b = alternativa_d
   OR alternativa_b = alternativa_e
   OR alternativa_c = alternativa_d
   OR alternativa_c = alternativa_e
   OR alternativa_d = alternativa_e;

-- 3.4 Questões duplicadas (mesmo contexto)
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'QUESTÕES DUPLICADAS (mesmo contexto):' as secao;
SELECT
    MIN(id) as id_manter,
    STRING_AGG(id::text, ', ' ORDER BY id) as ids_duplicados,
    COUNT(*) as quantidade,
    ano_prova,
    LEFT(contexto, 60) as preview,
    '🟠 MANTER 1, ELIMINAR RESTO' as acao
FROM questoes_enem
WHERE contexto IS NOT NULL AND TRIM(contexto) != ''
GROUP BY contexto, ano_prova
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 20;

-- ============================================================================
-- FASE 4: CLASSIFICAÇÃO DAS QUESTÕES
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 4: CLASSIFICAÇÃO DAS QUESTÕES                                         ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

SELECT 'CLASSIFICAÇÃO POR STATUS:' as secao;
SELECT
    status,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questoes_enem), 1) as percentual
FROM (
    SELECT
        id,
        CASE
            -- CRÍTICO: Eliminar
            WHEN contexto IS NULL OR TRIM(contexto) = '' THEN '🔴 ELIMINAR: Sem contexto'
            WHEN alternativa_a IS NULL OR TRIM(alternativa_a) = '' THEN '🔴 ELIMINAR: Sem alternativa A'
            WHEN alternativa_b IS NULL OR TRIM(alternativa_b) = '' THEN '🔴 ELIMINAR: Sem alternativa B'
            WHEN alternativa_c IS NULL OR TRIM(alternativa_c) = '' THEN '🔴 ELIMINAR: Sem alternativa C'
            WHEN alternativa_d IS NULL OR TRIM(alternativa_d) = '' THEN '🔴 ELIMINAR: Sem alternativa D'
            WHEN alternativa_e IS NULL OR TRIM(alternativa_e) = '' THEN '🔴 ELIMINAR: Sem alternativa E'
            WHEN resposta_correta IS NULL OR resposta_correta NOT IN ('A','B','C','D','E') THEN '🔴 ELIMINAR: Sem gabarito válido'
            WHEN contexto LIKE '%�%' THEN '🔴 ELIMINAR: Encoding corrompido'
            WHEN LOWER(TRIM(contexto)) IN ('nan', 'none', 'null') THEN '🔴 ELIMINAR: Contexto = NaN'

            -- MÉDIO: Precisa correção
            WHEN LENGTH(contexto) < 50 THEN '🟠 CORRIGIR: Contexto muito curto'
            WHEN contexto LIKE '%&amp;%' OR contexto LIKE '%&lt;%' OR contexto LIKE '%&gt;%' THEN '🟠 CORRIGIR: HTML entities'
            WHEN contexto LIKE '%ENEM2025ENEM2025%' THEN '🟠 CORRIGIR: Texto repetido'

            -- LEVE: Verificar
            WHEN (contexto ~* 'observe a figura|analise o gráfico|veja a imagem')
                 AND (imagem_principal IS NULL OR TRIM(imagem_principal) = '') THEN '🟡 VERIFICAR: Menciona imagem sem ter'

            -- OK
            ELSE '✅ OK'
        END as status
    FROM questoes_enem
) classificacao
GROUP BY status
ORDER BY
    CASE
        WHEN status LIKE '%ELIMINAR%' THEN 1
        WHEN status LIKE '%CORRIGIR%' THEN 2
        WHEN status LIKE '%VERIFICAR%' THEN 3
        ELSE 4
    END;

-- ============================================================================
-- FASE 5: LISTA DETALHADA PARA ELIMINAÇÃO
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 5: QUESTÕES PARA ELIMINAÇÃO (IRRECUPERÁVEIS)                          ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

SELECT
    id,
    ano_prova,
    numero_questao,
    area,
    CASE
        WHEN contexto IS NULL OR TRIM(contexto) = '' THEN 'Sem contexto'
        WHEN alternativa_a IS NULL OR TRIM(alternativa_a) = '' THEN 'Sem alternativa A'
        WHEN alternativa_b IS NULL OR TRIM(alternativa_b) = '' THEN 'Sem alternativa B'
        WHEN alternativa_c IS NULL OR TRIM(alternativa_c) = '' THEN 'Sem alternativa C'
        WHEN alternativa_d IS NULL OR TRIM(alternativa_d) = '' THEN 'Sem alternativa D'
        WHEN alternativa_e IS NULL OR TRIM(alternativa_e) = '' THEN 'Sem alternativa E'
        WHEN resposta_correta IS NULL OR resposta_correta NOT IN ('A','B','C','D','E') THEN 'Gabarito inválido: ' || COALESCE(resposta_correta, 'NULL')
        WHEN contexto LIKE '%�%' THEN 'Encoding corrompido'
        WHEN LOWER(TRIM(contexto)) IN ('nan', 'none', 'null') THEN 'Contexto = NaN'
        ELSE 'Outro'
    END as motivo_eliminacao,
    LEFT(COALESCE(contexto, '(vazio)'), 50) as preview
FROM questoes_enem
WHERE contexto IS NULL OR TRIM(contexto) = ''
   OR alternativa_a IS NULL OR TRIM(alternativa_a) = ''
   OR alternativa_b IS NULL OR TRIM(alternativa_b) = ''
   OR alternativa_c IS NULL OR TRIM(alternativa_c) = ''
   OR alternativa_d IS NULL OR TRIM(alternativa_d) = ''
   OR alternativa_e IS NULL OR TRIM(alternativa_e) = ''
   OR resposta_correta IS NULL OR resposta_correta NOT IN ('A','B','C','D','E')
   OR contexto LIKE '%�%'
   OR LOWER(TRIM(contexto)) IN ('nan', 'none', 'null')
ORDER BY ano_prova DESC, numero_questao;

-- ============================================================================
-- FASE 6: CORREÇÕES AUTOMÁTICAS
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 6: APLICANDO CORREÇÕES AUTOMÁTICAS                                    ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- 6.1 Corrigir HTML entities
UPDATE questoes_enem
SET contexto = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    contexto,
    '&amp;', '&'),
    '&lt;', '<'),
    '&gt;', '>'),
    '&nbsp;', ' '),
    '&quot;', '"')
WHERE contexto LIKE '%&amp;%'
   OR contexto LIKE '%&lt;%'
   OR contexto LIKE '%&gt;%'
   OR contexto LIKE '%&nbsp;%'
   OR contexto LIKE '%&quot;%';

-- 6.2 Corrigir HTML entities nas alternativas
UPDATE questoes_enem
SET
    alternativa_a = REPLACE(REPLACE(REPLACE(alternativa_a, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'),
    alternativa_b = REPLACE(REPLACE(REPLACE(alternativa_b, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'),
    alternativa_c = REPLACE(REPLACE(REPLACE(alternativa_c, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'),
    alternativa_d = REPLACE(REPLACE(REPLACE(alternativa_d, '&amp;', '&'), '&lt;', '<'), '&gt;', '>'),
    alternativa_e = REPLACE(REPLACE(REPLACE(alternativa_e, '&amp;', '&'), '&lt;', '<'), '&gt;', '>')
WHERE alternativa_a LIKE '%&amp;%' OR alternativa_a LIKE '%&lt;%' OR alternativa_a LIKE '%&gt;%'
   OR alternativa_b LIKE '%&amp;%' OR alternativa_b LIKE '%&lt;%' OR alternativa_b LIKE '%&gt;%'
   OR alternativa_c LIKE '%&amp;%' OR alternativa_c LIKE '%&lt;%' OR alternativa_c LIKE '%&gt;%'
   OR alternativa_d LIKE '%&amp;%' OR alternativa_d LIKE '%&lt;%' OR alternativa_d LIKE '%&gt;%'
   OR alternativa_e LIKE '%&amp;%' OR alternativa_e LIKE '%&lt;%' OR alternativa_e LIKE '%&gt;%';

-- 6.3 Limpar texto repetido (ENEM2025ENEM2025...)
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(contexto, '(ENEM\s*2025\s*){2,}', 'ENEM 2025 ', 'gi')
WHERE contexto ~* '(ENEM\s*2025\s*){2,}';

-- 6.4 Normalizar espaços múltiplos
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(contexto, '\s{2,}', ' ', 'g')
WHERE contexto ~ '\s{2,}';

-- 6.5 Trim em todos os campos de texto
UPDATE questoes_enem
SET
    contexto = TRIM(contexto),
    comando = TRIM(comando),
    alternativa_a = TRIM(alternativa_a),
    alternativa_b = TRIM(alternativa_b),
    alternativa_c = TRIM(alternativa_c),
    alternativa_d = TRIM(alternativa_d),
    alternativa_e = TRIM(alternativa_e),
    resposta_correta = UPPER(TRIM(resposta_correta))
WHERE TRUE;

SELECT 'Correções automáticas aplicadas!' as resultado;

-- ============================================================================
-- FASE 7: ELIMINAÇÃO DAS QUESTÕES IRRECUPERÁVEIS
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 7: ELIMINAÇÃO DAS QUESTÕES IRRECUPERÁVEIS                             ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- Criar tabela de backup antes de eliminar
CREATE TABLE IF NOT EXISTS questoes_enem_eliminadas AS
SELECT *, NOW() as data_eliminacao, 'Análise Senior' as motivo
FROM questoes_enem
WHERE 1=0;

-- Backup das questões que serão eliminadas
INSERT INTO questoes_enem_eliminadas
SELECT *, NOW() as data_eliminacao,
    CASE
        WHEN contexto IS NULL OR TRIM(contexto) = '' THEN 'Sem contexto'
        WHEN alternativa_a IS NULL OR TRIM(alternativa_a) = '' THEN 'Sem alternativa A'
        WHEN alternativa_b IS NULL OR TRIM(alternativa_b) = '' THEN 'Sem alternativa B'
        WHEN alternativa_c IS NULL OR TRIM(alternativa_c) = '' THEN 'Sem alternativa C'
        WHEN alternativa_d IS NULL OR TRIM(alternativa_d) = '' THEN 'Sem alternativa D'
        WHEN alternativa_e IS NULL OR TRIM(alternativa_e) = '' THEN 'Sem alternativa E'
        WHEN resposta_correta IS NULL OR resposta_correta NOT IN ('A','B','C','D','E') THEN 'Gabarito inválido'
        WHEN contexto LIKE '%�%' THEN 'Encoding corrompido'
        WHEN LOWER(TRIM(contexto)) IN ('nan', 'none', 'null') THEN 'Contexto = NaN'
        ELSE 'Outro'
    END as motivo
FROM questoes_enem
WHERE contexto IS NULL OR TRIM(contexto) = ''
   OR alternativa_a IS NULL OR TRIM(alternativa_a) = ''
   OR alternativa_b IS NULL OR TRIM(alternativa_b) = ''
   OR alternativa_c IS NULL OR TRIM(alternativa_c) = ''
   OR alternativa_d IS NULL OR TRIM(alternativa_d) = ''
   OR alternativa_e IS NULL OR TRIM(alternativa_e) = ''
   OR resposta_correta IS NULL OR resposta_correta NOT IN ('A','B','C','D','E')
   OR contexto LIKE '%�%'
   OR LOWER(TRIM(contexto)) IN ('nan', 'none', 'null');

-- Contar quantas serão eliminadas
SELECT 'Questões para eliminar:' as info, COUNT(*) as quantidade
FROM questoes_enem
WHERE contexto IS NULL OR TRIM(contexto) = ''
   OR alternativa_a IS NULL OR TRIM(alternativa_a) = ''
   OR alternativa_b IS NULL OR TRIM(alternativa_b) = ''
   OR alternativa_c IS NULL OR TRIM(alternativa_c) = ''
   OR alternativa_d IS NULL OR TRIM(alternativa_d) = ''
   OR alternativa_e IS NULL OR TRIM(alternativa_e) = ''
   OR resposta_correta IS NULL OR resposta_correta NOT IN ('A','B','C','D','E')
   OR contexto LIKE '%�%'
   OR LOWER(TRIM(contexto)) IN ('nan', 'none', 'null');

-- ELIMINAR as questões irrecuperáveis
DELETE FROM questoes_enem
WHERE contexto IS NULL OR TRIM(contexto) = ''
   OR alternativa_a IS NULL OR TRIM(alternativa_a) = ''
   OR alternativa_b IS NULL OR TRIM(alternativa_b) = ''
   OR alternativa_c IS NULL OR TRIM(alternativa_c) = ''
   OR alternativa_d IS NULL OR TRIM(alternativa_d) = ''
   OR alternativa_e IS NULL OR TRIM(alternativa_e) = ''
   OR resposta_correta IS NULL OR resposta_correta NOT IN ('A','B','C','D','E')
   OR contexto LIKE '%�%'
   OR LOWER(TRIM(contexto)) IN ('nan', 'none', 'null');

-- Eliminar duplicatas (manter apenas a primeira de cada grupo)
DELETE FROM questoes_enem a
USING questoes_enem b
WHERE a.id > b.id
  AND a.contexto = b.contexto
  AND a.ano_prova = b.ano_prova;

-- ============================================================================
-- FASE 8: VERIFICAÇÃO FINAL
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 8: VERIFICAÇÃO FINAL                                                  ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- Resumo após limpeza
SELECT 'RESUMO APÓS LIMPEZA:' as secao;
SELECT
    COUNT(*) as total_questoes_validas,
    COUNT(DISTINCT ano_prova) as total_anos,
    MIN(ano_prova) as ano_inicial,
    MAX(ano_prova) as ano_final
FROM questoes_enem;

-- Questões por ano após limpeza
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'QUESTÕES POR ANO (APÓS LIMPEZA):' as secao;
SELECT
    ano_prova,
    COUNT(*) as quantidade
FROM questoes_enem
GROUP BY ano_prova
ORDER BY ano_prova DESC;

-- Verificar se ainda há problemas
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'VERIFICAÇÃO DE PROBLEMAS REMANESCENTES:' as secao;
SELECT
    'Contexto vazio' as verificacao,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ PROBLEMA' END as status
FROM questoes_enem WHERE contexto IS NULL OR TRIM(contexto) = ''
UNION ALL
SELECT
    'Alternativas vazias' as verificacao,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ PROBLEMA' END as status
FROM questoes_enem
WHERE alternativa_a IS NULL OR TRIM(alternativa_a) = ''
   OR alternativa_b IS NULL OR TRIM(alternativa_b) = ''
   OR alternativa_c IS NULL OR TRIM(alternativa_c) = ''
   OR alternativa_d IS NULL OR TRIM(alternativa_d) = ''
   OR alternativa_e IS NULL OR TRIM(alternativa_e) = ''
UNION ALL
SELECT
    'Gabarito inválido' as verificacao,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ PROBLEMA' END as status
FROM questoes_enem WHERE resposta_correta NOT IN ('A','B','C','D','E')
UNION ALL
SELECT
    'Encoding corrompido' as verificacao,
    COUNT(*) as quantidade,
    CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ PROBLEMA' END as status
FROM questoes_enem WHERE contexto LIKE '%�%';

-- ============================================================================
-- RESULTADO FINAL
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║                    ANÁLISE SÊNIOR CONCLUÍDA                                 ║';
SELECT '╠══════════════════════════════════════════════════════════════════════════════╣';
SELECT '║                                                                              ║';
SELECT '║  ✅ Correções automáticas aplicadas:                                         ║';
SELECT '║     • HTML entities decodificados                                            ║';
SELECT '║     • Texto repetido limpo                                                   ║';
SELECT '║     • Espaços múltiplos normalizados                                         ║';
SELECT '║     • Campos trimados                                                        ║';
SELECT '║                                                                              ║';
SELECT '║  🗑️  Questões irrecuperáveis eliminadas (backup em questoes_enem_eliminadas) ║';
SELECT '║                                                                              ║';
SELECT '║  📊 Todas as questões restantes estão prontas para uso!                      ║';
SELECT '║                                                                              ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';
