-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  CORREÇÕES DE APRESENTAÇÃO - ENEM (TODAS AS QUESTÕES)                       ║
-- ║  Padronização como Elaborador de Questões ENEM                              ║
-- ║  Data: 2026-02-04                                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- CORREÇÃO 1: PADRONIZAR FONTES BIBLIOGRÁFICAS
-- Garantir que todas as fontes usem tag <small>
-- ============================================================================

SELECT 'CORREÇÃO 1: Padronizando fontes bibliográficas...' as etapa;

-- Adicionar <small> em fontes que não têm
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    '(Disponível em:[^<]+(?:Acesso em:[^<]+)?)',
    '<small>\1</small>',
    'gi'
)
WHERE contexto ~* 'Disponível em:'
  AND contexto NOT LIKE '%<small>%Disponível em%';

-- Padronizar "Disponivel" para "Disponível" (com acento)
UPDATE questoes_enem
SET contexto = REPLACE(contexto, 'Disponivel em:', 'Disponível em:')
WHERE contexto LIKE '%Disponivel em:%';

UPDATE questoes_enem
SET contexto = REPLACE(contexto, 'DISPONÍVEL EM:', 'Disponível em:')
WHERE contexto LIKE '%DISPONÍVEL EM:%';

-- ============================================================================
-- CORREÇÃO 2: PADRONIZAR DESCRIÇÕES DE IMAGENS
-- Formato padrão: <em>[Descrição da imagem]</em>
-- ============================================================================

SELECT 'CORREÇÃO 2: Padronizando descrições de imagens...' as etapa;

-- Descrições entre colchetes sem <em>
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    '\[([^\]]{20,})\]',
    '<em>[\1]</em>',
    'g'
)
WHERE contexto ~ '\[[^\]]{20,}\]'
  AND contexto NOT LIKE '%<em>[%';

-- ============================================================================
-- CORREÇÃO 3: LIMPAR QUEBRAS DE LINHA LITERAIS
-- ============================================================================

SELECT 'CORREÇÃO 3: Limpando quebras de linha...' as etapa;

-- Substituir \n literal por espaço
UPDATE questoes_enem
SET contexto = REPLACE(REPLACE(contexto, '\n', ' '), '\r', ' ')
WHERE contexto LIKE '%\n%' OR contexto LIKE '%\r%';

UPDATE questoes_enem
SET comando = REPLACE(REPLACE(comando, '\n', ' '), '\r', ' ')
WHERE comando LIKE '%\n%' OR comando LIKE '%\r%';

-- Substituir múltiplas quebras de linha por uma
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(contexto, E'\n{2,}', E'\n\n', 'g')
WHERE contexto ~ E'\n{3,}';

-- ============================================================================
-- CORREÇÃO 4: PADRONIZAR TÍTULOS DE TEXTOS
-- Formato: <strong>TEXTO I</strong>, <strong>TEXTO II</strong>
-- ============================================================================

SELECT 'CORREÇÃO 4: Padronizando títulos de textos...' as etapa;

-- TEXTO I sem formatação
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    '(?<!<strong>)(TEXTO\s+[IVX]+)(?!</strong>)',
    '<strong>\1</strong>',
    'gi'
)
WHERE contexto ~* 'TEXTO\s+[IVX]+'
  AND contexto NOT LIKE '%<strong>TEXTO%';

-- ============================================================================
-- CORREÇÃO 5: PADRONIZAR PONTUAÇÃO DOS COMANDOS
-- Comandos devem terminar com ? ou :
-- ============================================================================

SELECT 'CORREÇÃO 5: Padronizando comandos...' as etapa;

-- Adicionar ":" no final de comandos que não terminam com pontuação
UPDATE questoes_enem
SET comando = TRIM(comando) || ':'
WHERE comando IS NOT NULL
  AND TRIM(comando) != ''
  AND RIGHT(TRIM(comando), 1) NOT IN ('.', '?', ':', '!', ')', '"')
  AND LENGTH(comando) > 10;

-- ============================================================================
-- CORREÇÃO 6: NORMALIZAR ESPAÇOS E CARACTERES
-- ============================================================================

SELECT 'CORREÇÃO 6: Normalizando espaços...' as etapa;

-- Remover espaços antes de pontuação
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(contexto, '\s+([,.:;?!])', '\1', 'g')
WHERE contexto ~ '\s+[,.:;?!]';

-- Remover espaços duplos
UPDATE questoes_enem
SET
    contexto = REGEXP_REPLACE(contexto, ' {2,}', ' ', 'g'),
    comando = REGEXP_REPLACE(comando, ' {2,}', ' ', 'g'),
    alternativa_a = REGEXP_REPLACE(alternativa_a, ' {2,}', ' ', 'g'),
    alternativa_b = REGEXP_REPLACE(alternativa_b, ' {2,}', ' ', 'g'),
    alternativa_c = REGEXP_REPLACE(alternativa_c, ' {2,}', ' ', 'g'),
    alternativa_d = REGEXP_REPLACE(alternativa_d, ' {2,}', ' ', 'g'),
    alternativa_e = REGEXP_REPLACE(alternativa_e, ' {2,}', ' ', 'g')
WHERE contexto ~ ' {2,}'
   OR comando ~ ' {2,}'
   OR alternativa_a ~ ' {2,}'
   OR alternativa_b ~ ' {2,}'
   OR alternativa_c ~ ' {2,}'
   OR alternativa_d ~ ' {2,}'
   OR alternativa_e ~ ' {2,}';

-- ============================================================================
-- CORREÇÃO 7: PADRONIZAR ALTERNATIVAS
-- Remover letras no início (A), B), etc se existirem
-- ============================================================================

SELECT 'CORREÇÃO 7: Padronizando alternativas...' as etapa;

-- Remover letra no início das alternativas (A) ou a)
UPDATE questoes_enem
SET alternativa_a = REGEXP_REPLACE(alternativa_a, '^[Aa]\s*[\)\.]\s*', '', 'g')
WHERE alternativa_a ~ '^[Aa]\s*[\)\.]';

UPDATE questoes_enem
SET alternativa_b = REGEXP_REPLACE(alternativa_b, '^[Bb]\s*[\)\.]\s*', '', 'g')
WHERE alternativa_b ~ '^[Bb]\s*[\)\.]';

UPDATE questoes_enem
SET alternativa_c = REGEXP_REPLACE(alternativa_c, '^[Cc]\s*[\)\.]\s*', '', 'g')
WHERE alternativa_c ~ '^[Cc]\s*[\)\.]';

UPDATE questoes_enem
SET alternativa_d = REGEXP_REPLACE(alternativa_d, '^[Dd]\s*[\)\.]\s*', '', 'g')
WHERE alternativa_d ~ '^[Dd]\s*[\)\.]';

UPDATE questoes_enem
SET alternativa_e = REGEXP_REPLACE(alternativa_e, '^[Ee]\s*[\)\.]\s*', '', 'g')
WHERE alternativa_e ~ '^[Ee]\s*[\)\.]';

-- ============================================================================
-- CORREÇÃO 8: TRIM FINAL EM TODOS OS CAMPOS
-- ============================================================================

SELECT 'CORREÇÃO 8: Trim final...' as etapa;

UPDATE questoes_enem
SET
    contexto = TRIM(contexto),
    comando = TRIM(comando),
    alternativa_a = TRIM(alternativa_a),
    alternativa_b = TRIM(alternativa_b),
    alternativa_c = TRIM(alternativa_c),
    alternativa_d = TRIM(alternativa_d),
    alternativa_e = TRIM(alternativa_e)
WHERE TRUE;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'VERIFICAÇÃO FINAL:' as etapa;

SELECT
    'Total de questões' as metrica,
    COUNT(*)::text as valor
FROM questoes_enem
UNION ALL
SELECT
    'Com comando válido' as metrica,
    COUNT(*)::text as valor
FROM questoes_enem
WHERE comando IS NOT NULL AND TRIM(comando) != '' AND LENGTH(comando) > 10
UNION ALL
SELECT
    'Com fonte formatada' as metrica,
    COUNT(*)::text as valor
FROM questoes_enem
WHERE contexto LIKE '%<small>%'
UNION ALL
SELECT
    'Com descrição de imagem' as metrica,
    COUNT(*)::text as valor
FROM questoes_enem
WHERE contexto LIKE '%<em>[%';

-- ============================================================================
-- RESULTADO
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║              CORREÇÕES DE APRESENTAÇÃO APLICADAS                            ║';
SELECT '╠══════════════════════════════════════════════════════════════════════════════╣';
SELECT '║                                                                              ║';
SELECT '║  ✅ Fontes bibliográficas padronizadas (<small>)                             ║';
SELECT '║  ✅ Descrições de imagens padronizadas (<em>[...]</em>)                      ║';
SELECT '║  ✅ Quebras de linha normalizadas                                            ║';
SELECT '║  ✅ Títulos de textos formatados (<strong>)                                  ║';
SELECT '║  ✅ Comandos com pontuação correta                                           ║';
SELECT '║  ✅ Espaços normalizados                                                     ║';
SELECT '║  ✅ Alternativas sem letras duplicadas                                       ║';
SELECT '║  ✅ Trim aplicado em todos os campos                                         ║';
SELECT '║                                                                              ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';
