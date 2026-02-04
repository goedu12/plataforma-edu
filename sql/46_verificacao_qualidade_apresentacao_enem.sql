-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  VERIFICAÇÃO DE QUALIDADE DE APRESENTAÇÃO - ENEM                            ║
-- ║  Análise como Elaborador de Questões do ENEM                                ║
-- ║  Foco: Clareza, estrutura e apresentação para o estudante                   ║
-- ║  Data: 2026-02-04                                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- CRITÉRIOS DE AVALIAÇÃO (Padrão INEP/ENEM):
--
-- 1. CONTEXTO: Deve ter texto-base claro e relevante
-- 2. COMANDO: Deve ter pergunta clara e objetiva
-- 3. ALTERNATIVAS: Devem ser plausíveis e mutuamente exclusivas
-- 4. FONTE: Deve ter referência bibliográfica quando aplicável
-- 5. IMAGEM: Se mencionada, deve estar disponível ou descrita
-- 6. FORMATAÇÃO: HTML válido, sem caracteres estranhos
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- FASE 1: VISÃO GERAL DO BANCO
-- ════════════════════════════════════════════════════════════════════════════

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 1: VISÃO GERAL                                                        ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

SELECT
    ano_prova,
    COUNT(*) as total,
    SUM(CASE WHEN comando IS NOT NULL AND TRIM(comando) != '' THEN 1 ELSE 0 END) as com_comando,
    SUM(CASE WHEN imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '' THEN 1 ELSE 0 END) as com_imagem,
    SUM(CASE WHEN contexto LIKE '%<small>%' OR contexto LIKE '%Disponível em%' THEN 1 ELSE 0 END) as com_fonte
FROM questoes_enem
GROUP BY ano_prova
ORDER BY ano_prova DESC;

-- ════════════════════════════════════════════════════════════════════════════
-- FASE 2: VERIFICAÇÃO DE ESTRUTURA PADRÃO ENEM
-- ════════════════════════════════════════════════════════════════════════════

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 2: VERIFICAÇÃO DE ESTRUTURA                                           ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- 2.1 Questões SEM comando (pergunta)
SELECT 'QUESTÕES SEM COMANDO (pergunta explícita):' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    area,
    LEFT(contexto, 80) as contexto_preview,
    '🟡 Adicionar comando' as acao
FROM questoes_enem
WHERE comando IS NULL OR TRIM(comando) = ''
ORDER BY ano_prova DESC, numero_questao
LIMIT 30;

-- 2.2 Questões com contexto muito curto
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'CONTEXTOS MUITO CURTOS (<100 caracteres):' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    LENGTH(contexto) as tamanho,
    contexto as texto_completo,
    '🟠 Verificar completude' as acao
FROM questoes_enem
WHERE LENGTH(COALESCE(contexto, '')) < 100
  AND LENGTH(COALESCE(contexto, '')) > 0
ORDER BY LENGTH(contexto)
LIMIT 20;

-- 2.3 Alternativas muito curtas ou muito longas
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'ALTERNATIVAS COM TAMANHO ANORMAL:' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    LENGTH(alternativa_a) as len_a,
    LENGTH(alternativa_b) as len_b,
    LENGTH(alternativa_c) as len_c,
    LENGTH(alternativa_d) as len_d,
    LENGTH(alternativa_e) as len_e,
    CASE
        WHEN LENGTH(alternativa_a) < 2 OR LENGTH(alternativa_b) < 2 OR
             LENGTH(alternativa_c) < 2 OR LENGTH(alternativa_d) < 2 OR
             LENGTH(alternativa_e) < 2 THEN '🔴 Alt. muito curta'
        WHEN LENGTH(alternativa_a) > 500 OR LENGTH(alternativa_b) > 500 THEN '🟡 Alt. muito longa'
        ELSE '✅ OK'
    END as status
FROM questoes_enem
WHERE LENGTH(alternativa_a) < 2 OR LENGTH(alternativa_b) < 2 OR
      LENGTH(alternativa_c) < 2 OR LENGTH(alternativa_d) < 2 OR
      LENGTH(alternativa_e) < 2 OR
      LENGTH(alternativa_a) > 500
ORDER BY ano_prova DESC
LIMIT 20;

-- ════════════════════════════════════════════════════════════════════════════
-- FASE 3: VERIFICAÇÃO DE FORMATAÇÃO HTML
-- ════════════════════════════════════════════════════════════════════════════

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 3: VERIFICAÇÃO DE FORMATAÇÃO                                          ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- 3.1 Tags HTML não fechadas
SELECT 'POSSÍVEIS TAGS HTML NÃO FECHADAS:' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    CASE
        WHEN (LENGTH(contexto) - LENGTH(REPLACE(contexto, '<strong>', ''))) / 8 !=
             (LENGTH(contexto) - LENGTH(REPLACE(contexto, '</strong>', ''))) / 9 THEN '<strong> não fechada'
        WHEN (LENGTH(contexto) - LENGTH(REPLACE(contexto, '<em>', ''))) / 4 !=
             (LENGTH(contexto) - LENGTH(REPLACE(contexto, '</em>', ''))) / 5 THEN '<em> não fechada'
        WHEN (LENGTH(contexto) - LENGTH(REPLACE(contexto, '<small>', ''))) / 7 !=
             (LENGTH(contexto) - LENGTH(REPLACE(contexto, '</small>', ''))) / 8 THEN '<small> não fechada'
        ELSE 'OK'
    END as problema
FROM questoes_enem
WHERE contexto LIKE '%<strong>%' OR contexto LIKE '%<em>%' OR contexto LIKE '%<small>%'
HAVING problema != 'OK'
LIMIT 20;

-- 3.2 Caracteres especiais problemáticos
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'CARACTERES ESPECIAIS PROBLEMÁTICOS:' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    CASE
        WHEN contexto LIKE '%–%' THEN 'Travessão (–) - OK'
        WHEN contexto LIKE '%—%' THEN 'Travessão longo (—) - OK'
        WHEN contexto LIKE '%"%' OR contexto LIKE '%"%' THEN 'Aspas tipográficas - OK'
        WHEN contexto LIKE '%''%' OR contexto LIKE '%'%' THEN 'Apóstrofo tipográfico - OK'
        WHEN contexto LIKE '%…%' THEN 'Reticências (…) - OK'
        WHEN contexto LIKE '%\n%' THEN '🟡 Quebra de linha literal (\n)'
        WHEN contexto LIKE '%\t%' THEN '🟡 Tab literal (\t)'
        ELSE 'OK'
    END as caracteres
FROM questoes_enem
WHERE contexto LIKE '%\n%' OR contexto LIKE '%\t%'
LIMIT 20;

-- ════════════════════════════════════════════════════════════════════════════
-- FASE 4: VERIFICAÇÃO DE REFERÊNCIAS E FONTES
-- ════════════════════════════════════════════════════════════════════════════

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 4: VERIFICAÇÃO DE FONTES E REFERÊNCIAS                                ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- 4.1 Questões que parecem precisar de fonte mas não têm
SELECT 'TEXTOS LONGOS SEM FONTE IDENTIFICADA:' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    LENGTH(contexto) as tamanho,
    '🟡 Verificar se precisa de fonte' as acao
FROM questoes_enem
WHERE LENGTH(contexto) > 500
  AND contexto NOT LIKE '%Disponível em%'
  AND contexto NOT LIKE '%<small>%'
  AND contexto NOT LIKE '%Acesso em%'
  AND contexto NOT LIKE '%adaptado%'
ORDER BY LENGTH(contexto) DESC
LIMIT 20;

-- 4.2 Fontes com formatação incorreta
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'FONTES COM POSSÍVEL FORMATAÇÃO INCORRETA:' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    CASE
        WHEN contexto LIKE '%Disponível em:%' AND contexto NOT LIKE '%<small>%'
            THEN '🟡 Fonte sem tag <small>'
        WHEN contexto LIKE '%DISPONÍVEL EM%'
            THEN '🟡 Fonte em MAIÚSCULAS'
        WHEN contexto LIKE '%disponivel em%'
            THEN '🟡 "disponível" sem acento'
        ELSE 'OK'
    END as problema
FROM questoes_enem
WHERE contexto LIKE '%isponível%' OR contexto LIKE '%DISPONÍVEL%' OR contexto LIKE '%disponivel%'
HAVING problema != 'OK'
LIMIT 20;

-- ════════════════════════════════════════════════════════════════════════════
-- FASE 5: VERIFICAÇÃO DE IMAGENS E ELEMENTOS VISUAIS
-- ════════════════════════════════════════════════════════════════════════════

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 5: VERIFICAÇÃO DE IMAGENS E ELEMENTOS VISUAIS                         ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- 5.1 Questões que mencionam elementos visuais
SELECT 'MENÇÕES A ELEMENTOS VISUAIS:' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    CASE
        WHEN contexto ~* 'figura|imagem|ilustração' THEN 'Figura/Imagem'
        WHEN contexto ~* 'gráfico' THEN 'Gráfico'
        WHEN contexto ~* 'tabela|quadro' THEN 'Tabela/Quadro'
        WHEN contexto ~* 'mapa' THEN 'Mapa'
        WHEN contexto ~* 'charge|tirinha|cartum' THEN 'Charge/Tirinha'
        WHEN contexto ~* 'fotografia|foto' THEN 'Fotografia'
        WHEN contexto ~* 'pintura|obra|tela|quadro' THEN 'Obra de arte'
        ELSE 'Outro'
    END as tipo_elemento,
    CASE
        WHEN imagem_principal IS NOT NULL AND TRIM(imagem_principal) != '' THEN '✅ Tem imagem'
        WHEN contexto LIKE '%<em>[%' THEN '✅ Tem descrição'
        ELSE '🟡 Verificar'
    END as status,
    LEFT(contexto, 60) as preview
FROM questoes_enem
WHERE contexto ~* 'figura|imagem|gráfico|tabela|mapa|charge|tirinha|fotografia|pintura|obra|tela'
ORDER BY ano_prova DESC, numero_questao
LIMIT 30;

-- 5.2 Questões com descrição de imagem bem formatada
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'DESCRIÇÕES DE IMAGEM (formato [texto]):' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    CASE
        WHEN contexto LIKE '%<em>[%]</em>%' THEN '✅ Formato correto: <em>[descrição]</em>'
        WHEN contexto LIKE '%[%]%' AND contexto NOT LIKE '%<em>[%' THEN '🟡 Colchetes sem <em>'
        ELSE '❓ Verificar formato'
    END as formato_descricao
FROM questoes_enem
WHERE contexto LIKE '%[%]%'
  AND (contexto ~* 'figura|imagem|fotografia|charge|ilustração')
ORDER BY ano_prova DESC
LIMIT 20;

-- ════════════════════════════════════════════════════════════════════════════
-- FASE 6: VERIFICAÇÃO DE CLAREZA DO COMANDO
-- ════════════════════════════════════════════════════════════════════════════

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 6: VERIFICAÇÃO DE CLAREZA DO COMANDO                                  ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- 6.1 Comandos que terminam corretamente
SELECT 'COMANDOS - VERIFICAÇÃO DE FORMATO:' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    comando,
    CASE
        WHEN comando IS NULL OR TRIM(comando) = '' THEN '🔴 Sem comando'
        WHEN comando NOT LIKE '%?' AND comando NOT LIKE '%:' AND comando NOT LIKE '%.'
            THEN '🟡 Comando não termina com pontuação'
        WHEN LENGTH(comando) < 20 THEN '🟡 Comando muito curto'
        WHEN comando ~* '^(o|a|os|as|esse|essa|este|esta|no|na|com)\s'
            THEN '🟡 Comando pode estar incompleto'
        ELSE '✅ OK'
    END as status
FROM questoes_enem
WHERE comando IS NULL
   OR TRIM(comando) = ''
   OR (comando NOT LIKE '%?' AND comando NOT LIKE '%:' AND comando NOT LIKE '%.')
   OR LENGTH(COALESCE(comando, '')) < 20
ORDER BY ano_prova DESC, numero_questao
LIMIT 30;

-- ════════════════════════════════════════════════════════════════════════════
-- FASE 7: VERIFICAÇÃO DE COERÊNCIA DAS ALTERNATIVAS
-- ════════════════════════════════════════════════════════════════════════════

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 7: VERIFICAÇÃO DE COERÊNCIA DAS ALTERNATIVAS                          ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

-- 7.1 Alternativas com padrão similar (começam igual)
SELECT 'ALTERNATIVAS COM INÍCIO SIMILAR:' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    LEFT(alternativa_a, 30) as inicio_a,
    LEFT(alternativa_b, 30) as inicio_b,
    LEFT(alternativa_c, 30) as inicio_c,
    '✅ Padrão consistente' as status
FROM questoes_enem
WHERE LEFT(alternativa_a, 10) = LEFT(alternativa_b, 10)
  AND LEFT(alternativa_b, 10) = LEFT(alternativa_c, 10)
  AND LEFT(alternativa_c, 10) = LEFT(alternativa_d, 10)
ORDER BY ano_prova DESC
LIMIT 10;

-- 7.2 Alternativas com tamanhos muito diferentes
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'ALTERNATIVAS COM TAMANHOS MUITO DIFERENTES:' as verificacao;
SELECT
    id,
    ano_prova,
    numero_questao,
    LENGTH(alternativa_a) as len_a,
    LENGTH(alternativa_b) as len_b,
    LENGTH(alternativa_c) as len_c,
    LENGTH(alternativa_d) as len_d,
    LENGTH(alternativa_e) as len_e,
    GREATEST(LENGTH(alternativa_a), LENGTH(alternativa_b), LENGTH(alternativa_c),
             LENGTH(alternativa_d), LENGTH(alternativa_e)) -
    LEAST(LENGTH(alternativa_a), LENGTH(alternativa_b), LENGTH(alternativa_c),
          LENGTH(alternativa_d), LENGTH(alternativa_e)) as diferenca,
    '🟡 Verificar equilíbrio' as status
FROM questoes_enem
WHERE GREATEST(LENGTH(alternativa_a), LENGTH(alternativa_b), LENGTH(alternativa_c),
               LENGTH(alternativa_d), LENGTH(alternativa_e)) -
      LEAST(LENGTH(alternativa_a), LENGTH(alternativa_b), LENGTH(alternativa_c),
            LENGTH(alternativa_d), LENGTH(alternativa_e)) > 200
ORDER BY diferenca DESC
LIMIT 20;

-- ════════════════════════════════════════════════════════════════════════════
-- FASE 8: RESUMO CONSOLIDADO
-- ════════════════════════════════════════════════════════════════════════════

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║  FASE 8: RESUMO CONSOLIDADO                                                 ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';

SELECT 'CLASSIFICAÇÃO GERAL DAS QUESTÕES:' as resumo;
SELECT
    status,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM questoes_enem), 1) as percentual
FROM (
    SELECT
        id,
        CASE
            -- EXCELENTE: Tem tudo
            WHEN LENGTH(contexto) > 100
                 AND (comando IS NOT NULL AND TRIM(comando) != '' AND LENGTH(comando) > 20)
                 AND LENGTH(alternativa_a) > 5 AND LENGTH(alternativa_b) > 5
                 AND LENGTH(alternativa_c) > 5 AND LENGTH(alternativa_d) > 5
                 AND LENGTH(alternativa_e) > 5
                 AND (contexto LIKE '%<small>%' OR contexto LIKE '%Disponível em%' OR LENGTH(contexto) < 300)
            THEN '✅ EXCELENTE'

            -- BOM: Falta apenas fonte ou comando curto
            WHEN LENGTH(contexto) > 100
                 AND LENGTH(alternativa_a) > 5 AND LENGTH(alternativa_b) > 5
                 AND LENGTH(alternativa_c) > 5 AND LENGTH(alternativa_d) > 5
                 AND LENGTH(alternativa_e) > 5
            THEN '🟢 BOM'

            -- REGULAR: Contexto curto mas funcional
            WHEN LENGTH(contexto) > 50
                 AND LENGTH(alternativa_a) > 2 AND LENGTH(alternativa_b) > 2
                 AND LENGTH(alternativa_c) > 2 AND LENGTH(alternativa_d) > 2
                 AND LENGTH(alternativa_e) > 2
            THEN '🟡 REGULAR'

            -- RUIM: Problemas significativos
            ELSE '🔴 NECESSITA REVISÃO'
        END as status
    FROM questoes_enem
) classificacao
GROUP BY status
ORDER BY
    CASE status
        WHEN '✅ EXCELENTE' THEN 1
        WHEN '🟢 BOM' THEN 2
        WHEN '🟡 REGULAR' THEN 3
        ELSE 4
    END;

-- Resumo por ano
SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'QUALIDADE POR ANO:' as resumo;
SELECT
    ano_prova,
    COUNT(*) as total,
    SUM(CASE WHEN LENGTH(contexto) > 100 AND comando IS NOT NULL AND TRIM(comando) != '' THEN 1 ELSE 0 END) as completas,
    ROUND(SUM(CASE WHEN LENGTH(contexto) > 100 AND comando IS NOT NULL AND TRIM(comando) != '' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 0) as pct_completas
FROM questoes_enem
GROUP BY ano_prova
ORDER BY ano_prova DESC;

-- ════════════════════════════════════════════════════════════════════════════
-- RESULTADO FINAL
-- ════════════════════════════════════════════════════════════════════════════

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║            VERIFICAÇÃO DE QUALIDADE CONCLUÍDA                               ║';
SELECT '╠══════════════════════════════════════════════════════════════════════════════╣';
SELECT '║                                                                              ║';
SELECT '║  Como Elaborador de Questões ENEM, verifiquei:                               ║';
SELECT '║                                                                              ║';
SELECT '║  ✓ Estrutura (contexto, comando, alternativas)                               ║';
SELECT '║  ✓ Formatação HTML (tags, caracteres especiais)                              ║';
SELECT '║  ✓ Referências e fontes bibliográficas                                       ║';
SELECT '║  ✓ Elementos visuais (imagens, descrições)                                   ║';
SELECT '║  ✓ Clareza dos comandos (perguntas)                                          ║';
SELECT '║  ✓ Coerência das alternativas                                                ║';
SELECT '║                                                                              ║';
SELECT '║  📋 Execute as correções específicas para cada problema identificado         ║';
SELECT '║                                                                              ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';
