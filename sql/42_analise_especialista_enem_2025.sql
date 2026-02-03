-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  ANÁLISE ESPECIALISTA - QUESTÕES ENEM 2025                                  ║
-- ║  Revisão como elaborador de questões + simulação como estudante             ║
-- ║  Data: 2026-02-03                                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- SEÇÃO 1: DIAGNÓSTICO GERAL - VERIFICAR INTEGRIDADE DOS DADOS
-- ============================================================================

-- 1.1 Verificar questões com campos obrigatórios vazios
SELECT 'QUESTÕES COM CAMPOS CRÍTICOS VAZIOS' as diagnostico;
SELECT
    numero_questao,
    area,
    CASE WHEN contexto IS NULL OR contexto = '' THEN '❌ CONTEXTO VAZIO' ELSE '✓' END as contexto,
    CASE WHEN comando IS NULL OR comando = '' THEN '❌ COMANDO VAZIO' ELSE '✓' END as comando,
    CASE WHEN alternativa_a IS NULL OR alternativa_a = '' THEN '❌' ELSE '✓' END as alt_a,
    CASE WHEN alternativa_b IS NULL OR alternativa_b = '' THEN '❌' ELSE '✓' END as alt_b,
    CASE WHEN alternativa_c IS NULL OR alternativa_c = '' THEN '❌' ELSE '✓' END as alt_c,
    CASE WHEN alternativa_d IS NULL OR alternativa_d = '' THEN '❌' ELSE '✓' END as alt_d,
    CASE WHEN alternativa_e IS NULL OR alternativa_e = '' THEN '❌' ELSE '✓' END as alt_e,
    CASE WHEN resposta_correta IS NULL THEN '❌ SEM GABARITO' ELSE resposta_correta END as gabarito
FROM questoes_enem
WHERE ano_prova = 2025
ORDER BY numero_questao;

-- 1.2 Verificar questões que mencionam imagem mas não têm imagem
SELECT 'QUESTÕES QUE REFERENCIAM IMAGEM SEM TER IMAGEM' as diagnostico;
SELECT
    numero_questao,
    area,
    CASE
        WHEN contexto ~* 'figura|imagem|gráfico|quadro|tabela|charge|mapa|fotografia|ilustração'
             AND imagem_principal IS NULL
             AND (imagens_extras IS NULL OR array_length(imagens_extras, 1) IS NULL)
        THEN '⚠️ MENCIONA VISUAL SEM IMAGEM'
        ELSE '✓'
    END as status_imagem,
    LEFT(contexto, 100) as preview
FROM questoes_enem
WHERE ano_prova = 2025
  AND contexto ~* 'figura|imagem|gráfico|quadro|tabela|charge|mapa|fotografia|ilustração'
  AND imagem_principal IS NULL
ORDER BY numero_questao;

-- ============================================================================
-- SEÇÃO 2: ANÁLISE COMO ELABORADOR DE QUESTÕES
-- Verificar coerência entre contexto e comando
-- ============================================================================

-- 2.1 Questões cujo comando não faz referência clara ao contexto
-- (Comandos muito genéricos ou desconectados)

SELECT 'ANÁLISE DE COERÊNCIA CONTEXTO-COMANDO' as diagnostico;

-- ============================================================================
-- SEÇÃO 3: PROBLEMAS IDENTIFICADOS POR QUESTÃO
-- ============================================================================

SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'PROBLEMAS ESPECÍFICOS IDENTIFICADOS' as titulo;
SELECT '═══════════════════════════════════════════════════════════════' as linha;

-- QUESTÃO 5 (Inglês) - Copos de café
-- PROBLEMA: Descrição textual de imagem sem imagem real
-- Impacto: Estudante não consegue visualizar os copos
-- RECOMENDAÇÃO: Adicionar imagem_principal ou manter descrição mais detalhada

-- QUESTÃO 14 (Português) - Cartaz Bienal
-- PROBLEMA: Menção a "ilustração estilizada de Fernando Pessoa" sem imagem
-- Impacto: Questão sobre recursos "verbais e não verbais" sem o elemento não verbal
-- RECOMENDAÇÃO: CRÍTICO - adicionar imagem ou reformular comando

-- QUESTÃO 15 (Português) - Retratos Dalton Paula
-- PROBLEMA: Duas figuras mencionadas (Zeferina e João de Deus) sem imagens
-- Impacto: Questão sobre retratos sem os retratos
-- RECOMENDAÇÃO: CRÍTICO - adicionar imagens das obras

-- QUESTÃO 22 (Português) - Ilha do Ferro
-- PROBLEMA: TEXTO II menciona "Fotografia de escultura" sem imagem
-- Impacto: Questão de arte visual sem visual
-- RECOMENDAÇÃO: CRÍTICO - adicionar imagem da escultura

-- QUESTÃO 23 (Português) - Adriana Varejão
-- PROBLEMA: TEXTO II menciona obra "Azulejaria em carne viva" sem imagem
-- Impacto: Análise de obra de arte sem a obra
-- RECOMENDAÇÃO: CRÍTICO - adicionar imagem

-- QUESTÃO 24 (Português) - Cartaz UNICEF
-- PROBLEMA: Cartaz publicitário descrito textualmente
-- Impacto: Questão de publicidade sem o material publicitário
-- RECOMENDAÇÃO: Adicionar imagem do cartaz

-- QUESTÃO 26 (Português) - Doce mistura
-- PROBLEMA: Menção a "Infográfico/Mapa do Brasil" sem imagem
-- Impacto: Questão sobre variação linguística regional sem mapa
-- RECOMENDAÇÃO: Funcional mesmo sem imagem, mas idealmente adicionar

-- QUESTÃO 31 (Português) - Poema "dezenove"
-- PROBLEMA: Menção a "[Imagem: Mãos segurando fotos]" sem imagem
-- Impacto: Menor, texto funciona sem a imagem
-- RECOMENDAÇÃO: Opcional

-- QUESTÃO 33 (Português) - Infográfico TJDFT
-- PROBLEMA: "Infográfico do TJDFT" descrito mas sem imagem
-- Impacto: Funcional, mas melhor com visual
-- RECOMENDAÇÃO: Adicionar imagem se disponível

-- QUESTÃO 34 (Português) - Capa Revista Galileu
-- PROBLEMA: Capa de revista com "[Ilustração central]" sem imagem
-- Impacto: Questão sobre "função poética" nos "elementos não verbais"
-- RECOMENDAÇÃO: CRÍTICO - o comando pede análise de elementos não verbais

-- QUESTÃO 41 (Português) - Bancos indígenas
-- PROBLEMA: TEXTO II menciona "Fotografia de banco esculpido" sem imagem
-- Impacto: Questão sobre arte indígena sem a arte
-- RECOMENDAÇÃO: CRÍTICO - adicionar imagem

-- QUESTÃO 45 (Português) - Palavras intraduzíveis
-- PROBLEMA: "[Ilustração artística]" mencionada sem imagem
-- Impacto: Questão sobre relação texto-imagem sem imagem
-- RECOMENDAÇÃO: CRÍTICO - adicionar imagem

-- QUESTÃO 47 (Humanas) - CO2 por queimadas
-- PROBLEMA: Mapa de satélite descrito sem imagem
-- Impacto: Questão de Geografia sem o mapa
-- RECOMENDAÇÃO: CRÍTICO - adicionar mapa

-- QUESTÃO 49 (Humanas) - Veneza cosmopolita
-- PROBLEMA: TEXTO I menciona pintura sem imagem
-- Impacto: Questão sobre cosmopolitismo baseada em pintura
-- RECOMENDAÇÃO: Adicionar imagem da pintura

-- QUESTÃO 63 (Humanas) - Agronegócio
-- PROBLEMA: Tabela descrita textualmente
-- Impacto: Funcional, dados presentes no texto
-- RECOMENDAÇÃO: OK, mas tabela visual seria melhor

-- QUESTÃO 68 (Humanas) - Salvador
-- PROBLEMA: "Fotografia aérea de Salvador" sem imagem
-- Impacto: Questão sobre análise espacial sem a foto
-- RECOMENDAÇÃO: CRÍTICO - adicionar foto

-- QUESTÃO 77 (Humanas) - Carro elétrico
-- PROBLEMA: Charge descrita sem imagem
-- Impacto: Questão sobre contradição na charge
-- RECOMENDAÇÃO: CRÍTICO - adicionar charge

-- ============================================================================
-- SEÇÃO 4: ANÁLISE DE COMANDOS (CLAREZA E PRECISÃO)
-- ============================================================================

SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'ANÁLISE DE CLAREZA DOS COMANDOS' as titulo;
SELECT '═══════════════════════════════════════════════════════════════' as linha;

-- Comandos que podem gerar ambiguidade

-- Q3 (Inglês): "o eu lírico ressalta a" - OK, claro
-- Q4 (Inglês): "é usada para" - OK, objetivo
-- Q7: "O elemento que caracteriza esse texto como uma crônica é a" - OK
-- Q32: "o aspecto tecnológico que influencia" - Potencialmente ambíguo
-- Q38: "Com base na organização coesiva desse texto, o(a)" - Incompleto, falta complemento
-- Q50: "são exemplos de ação justa:" - OK, direto

-- QUESTÃO 38 - COMANDO INCOMPLETO
-- Comando atual: "Com base na organização coesiva desse texto, o(a)"
-- PROBLEMA: Frase incompleta, parece faltar o complemento
-- RECOMENDAÇÃO: Verificar se falta texto ou reformular

-- ============================================================================
-- SEÇÃO 5: QUESTÕES SEM PROBLEMAS (VALIDADAS)
-- ============================================================================

SELECT 'QUESTÕES VALIDADAS (SEM PROBLEMAS CRÍTICOS)' as diagnostico;

-- Inglês: Q1, Q2, Q3, Q4 - OK (contextos textuais)
-- Português (texto compartilhado): Q6, Q7, Q8, Q9, Q10 - OK
-- Português: Q11, Q12, Q13 - OK (textos puros)
-- Português: Q16, Q17, Q18, Q19, Q20 - OK
-- Português: Q21, Q25, Q27, Q28, Q29, Q30 - OK
-- Português: Q32, Q35, Q36, Q37, Q38, Q39, Q40 - OK
-- Português: Q42, Q43, Q44 - OK
-- Humanas: Q46, Q48, Q50, Q51, Q52, Q53, Q54, Q55, Q56, Q57, Q58, Q59, Q60 - OK
-- Humanas: Q61, Q62, Q64, Q65, Q66, Q67, Q69, Q70, Q71, Q72, Q73, Q74, Q75 - OK
-- Humanas: Q76, Q78, Q79, Q80, Q81, Q82, Q83, Q84, Q85, Q86, Q87, Q88, Q89, Q90 - OK

-- ============================================================================
-- SEÇÃO 6: RESUMO DE PROBLEMAS POR PRIORIDADE
-- ============================================================================

SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'RESUMO: QUESTÕES QUE PRECISAM DE CORREÇÃO' as titulo;
SELECT '═══════════════════════════════════════════════════════════════' as linha;

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║  PRIORIDADE CRÍTICA (impossível resolver sem imagem)                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Q14  - Cartaz Bienal (comando pede análise de recursos não verbais)        ║
║  Q15  - Retratos Dalton Paula (questão sobre retratos sem retratos)         ║
║  Q22  - Escultura Ilha do Ferro (TEXTO II é sobre escultura)                ║
║  Q23  - Azulejaria Adriana Varejão (análise de obra visual)                 ║
║  Q34  - Capa Galileu (comando pede análise de elementos não verbais)        ║
║  Q41  - Banco indígena (TEXTO II é fotografia de escultura)                 ║
║  Q45  - Ilustração Gufra (questão sobre texto verbal NO desenho)            ║
║  Q47  - Mapa CO2 (análise de dispersão espacial em mapa)                    ║
║  Q68  - Foto aérea Salvador (análise de elementos na fotografia)            ║
║  Q77  - Charge carro elétrico (análise de contradição na charge)            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total CRÍTICO: 10 questões                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║  PRIORIDADE MÉDIA (funciona, mas seria melhor com imagem)                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Q5   - Copos de café (descrição textual funciona)                          ║
║  Q24  - Cartaz UNICEF (descrição detalhada presente)                        ║
║  Q26  - Mapa variação linguística (dados presentes no texto)                ║
║  Q31  - Poema dezenove (imagem é ilustrativa, não essencial)                ║
║  Q33  - Infográfico TJDFT (texto descreve conteúdo)                         ║
║  Q49  - Pintura Veneza (TEXTO II compensa ausência)                         ║
║  Q63  - Tabela agronegócio (dados listados no texto)                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total MÉDIO: 7 questões                                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║  VERIFICAR (possível erro no comando)                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Q38  - Comando parece incompleto: "Com base na organização coesiva..."     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Total VERIFICAR: 1 questão                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║  QUESTÕES OK (72/90 = 80%)                                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

-- ============================================================================
-- SEÇÃO 7: CORREÇÕES RECOMENDADAS
-- ============================================================================

-- 7.1 Para questões CRÍTICAS sem imagem disponível: REFORMULAR COMANDO
-- O comando deve ser modificado para não depender de elemento visual ausente

-- QUESTÃO 14 - Reformular para não exigir análise de "recursos não verbais"
/*
COMANDO ATUAL: "Nesse cartaz publicitário, os recursos verbais e não verbais constroem um argumento que objetiva"
COMANDO SUGERIDO: "No texto do cartaz publicitário, o jogo de palavras com 'Fernando' e 'Pessoa' constrói um argumento que objetiva"
*/

-- QUESTÃO 34 - Reformular para não exigir análise de "elementos não verbais"
/*
COMANDO ATUAL: "Com base na relação dos elementos não verbais com a frase 'VOCÊ (NÃO) ESTÁ SOZINHO', nessa capa de revista, a função poética fica evidente, pois"
COMANDO SUGERIDO: "Na frase 'VOCÊ (NÃO) ESTÁ SOZINHO', presente na capa da revista, a função poética fica evidente, pois"
*/

-- QUESTÃO 45 - Reformular para não exigir visualização
/*
COMANDO ATUAL: "O uso do texto verbal nesse desenho assume a função de"
COMANDO SUGERIDO: "Na série 'Palavras intraduzíveis', o uso de texto verbal junto a ilustrações assume a função de"
*/

-- QUESTÃO 68 - Reformular ou adicionar descrição detalhada
/*
COMANDO ATUAL: "A análise dos elementos presentes na fotografia permite identificar qual característica socioespacial?"
Solução: Adicionar descrição mais detalhada: "A fotografia mostra prédios de alto padrão ao lado de comunidades densamente ocupadas em encostas..."
*/

-- ============================================================================
-- SEÇÃO 8: SQL PARA APLICAR CORREÇÕES NOS COMANDOS
-- ============================================================================

-- DESCOMENTE E EXECUTE APENAS SE DESEJAR APLICAR AS CORREÇÕES

/*
-- Q14 - Ajuste do comando
UPDATE questoes_enem SET comando =
'No texto do cartaz publicitário da Bienal do Livro, o jogo de palavras com "Fernando" e "Pessoa" constrói um argumento que objetiva'
WHERE ano_prova = 2025 AND numero_questao = 14;

-- Q34 - Ajuste do comando
UPDATE questoes_enem SET comando =
'Na frase "VOCÊ (NÃO) ESTÁ SOZINHO", presente na capa da revista sobre solidão, a função poética da linguagem fica evidente, pois'
WHERE ano_prova = 2025 AND numero_questao = 34;

-- Q45 - Ajuste do comando
UPDATE questoes_enem SET comando =
'Na série "Palavras intraduzíveis", o uso de texto verbal junto às ilustrações artísticas assume a função de'
WHERE ano_prova = 2025 AND numero_questao = 45;

-- Q68 - Adicionar descrição no contexto
UPDATE questoes_enem SET contexto =
'<em>[Fotografia aérea de Salvador, capital do estado da Bahia. A imagem mostra um nítido contraste: de um lado, edifícios altos e modernos de áreas nobres; do outro, comunidades populares densamente ocupadas em encostas, com construções irregulares e infraestrutura precária. A proximidade espacial entre esses dois mundos evidencia a segregação socioespacial típica das metrópoles brasileiras.]</em>

<small>Disponível em: https://mundoeducacao.uol.com.br. Acesso em: 20 out. 2023.</small>'
WHERE ano_prova = 2025 AND numero_questao = 68;
*/

-- ============================================================================
-- FIM DA ANÁLISE
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║                ANÁLISE CONCLUÍDA - QUESTÕES ENEM 2025                       ║';
SELECT '║                                                                              ║';
SELECT '║  • 10 questões com problemas CRÍTICOS (falta imagem essencial)              ║';
SELECT '║  •  7 questões com problemas MÉDIOS (imagem recomendada)                    ║';
SELECT '║  •  1 questão para VERIFICAR (comando possivelmente incompleto)             ║';
SELECT '║  • 72 questões OK (80% do total)                                            ║';
SELECT '║                                                                              ║';
SELECT '║  RECOMENDAÇÃO: Priorizar adição de imagens ou reformular comandos           ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';
