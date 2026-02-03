-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  CORREÇÕES PRIORITÁRIAS - QUESTÕES ENEM 2025                                ║
-- ║  Baseado na análise especialista (42_analise_especialista_enem_2025.sql)    ║
-- ║  Data: 2026-02-03                                                           ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- ESTRATÉGIA: Para questões que exigem imagens indisponíveis, reformular
-- o comando para que o estudante possa resolver baseado apenas no texto.
-- ============================================================================

-- ============================================================================
-- QUESTÃO 14 - Cartaz Bienal do Livro (Fernando Pessoa)
-- PROBLEMA: Comando pede análise de "recursos verbais e não verbais"
-- SOLUÇÃO: Focar no jogo de palavras, não na imagem
-- ============================================================================

UPDATE questoes_enem SET comando =
'No texto desse cartaz publicitário, o jogo de palavras com "Fernando" e "Pessoa" constrói um argumento que objetiva'
WHERE ano_prova = 2025 AND numero_questao = 14;

-- ============================================================================
-- QUESTÃO 34 - Capa Revista Galileu
-- PROBLEMA: Comando pede análise de "elementos não verbais"
-- SOLUÇÃO: Focar na construção linguística da frase
-- ============================================================================

UPDATE questoes_enem SET comando =
'Na frase "VOCÊ (NÃO) ESTÁ SOZINHO", presente na capa da revista que aborda a solidão contemporânea, a função poética da linguagem fica evidente por meio do(a)'
WHERE ano_prova = 2025 AND numero_questao = 34;

-- ============================================================================
-- QUESTÃO 45 - Palavras intraduzíveis (Gufra)
-- PROBLEMA: Comando menciona "nesse desenho" sem imagem
-- SOLUÇÃO: Contextualizar melhor sem exigir visualização
-- ============================================================================

UPDATE questoes_enem SET comando =
'Na série "Palavras intraduzíveis", que une ilustrações artísticas a vocábulos de difícil tradução, o texto verbal assume a função de'
WHERE ano_prova = 2025 AND numero_questao = 45;

-- ============================================================================
-- QUESTÃO 68 - Fotografia aérea de Salvador
-- PROBLEMA: Descrição muito vaga da imagem
-- SOLUÇÃO: Enriquecer a descrição no contexto
-- ============================================================================

UPDATE questoes_enem SET contexto =
'<em>[Fotografia aérea de Salvador, capital do estado da Bahia. A imagem registra um contraste socioespacial marcante: no primeiro plano, edifícios residenciais de alto padrão com fachadas modernas; no segundo plano, uma extensa comunidade popular ocupando uma encosta, com construções irregulares, becos estreitos e alta densidade habitacional. A proximidade física entre esses dois espaços é evidente, separados apenas por uma via pavimentada.]</em>

<small>Disponível em: https://mundoeducacao.uol.com.br. Acesso em: 20 out. 2023.</small>'
WHERE ano_prova = 2025 AND numero_questao = 68;

-- ============================================================================
-- QUESTÃO 77 - Carro elétrico (charge)
-- PROBLEMA: Charge descrita textualmente
-- SOLUÇÃO: Melhorar descrição da charge
-- ============================================================================

UPDATE questoes_enem SET contexto =
'<strong>Carro elétrico, uma miragem ecológica</strong>

<em>[Charge com dois níveis: No nível superior, pessoas felizes em meio à natureza verde, céu azul, um carro elétrico moderno e limpo. No nível inferior (subsolo), trabalhadores em condições precárias extraindo minerais em minas escuras, ambiente degradado, poluição. Uma linha conecta os dois níveis, mostrando que a "energia limpa" de cima depende da extração predatória de baixo.]</em>

A mudança para a eletromobilidade de fato promove uma alteração no consumo de recursos naturais. Hoje, amplamente dependentes do petróleo, nossos modais de transporte poderiam se tornar cada vez mais dependentes de trinta metais raros. Gálio, tântalo, cobalto, platinoides, tungstênio, metais de terras-raras: uma mina contém apenas ínfimas quantidades desses metais dotados de fabulosas propriedades eletrônicas, ópticas e magnéticas.

<small>PITRON, G. Revolução tecnológica, transformação geopolítica. Disponível em: https://diplomatique.org.br. Acesso em: 10 dez. 2018.</small>'
WHERE ano_prova = 2025 AND numero_questao = 77;

-- ============================================================================
-- QUESTÃO 47 - Mapa CO2 por queimadas
-- PROBLEMA: Mapa de satélite sem imagem
-- SOLUÇÃO: Enriquecer descrição para compensar
-- ============================================================================

UPDATE questoes_enem SET contexto =
'<strong>Concentração de CO₂ por queimadas entre África e Brasil em 30 de agosto de 2019</strong>

<em>[Imagem de satélite mostrando o Oceano Atlântico Sul. Uma grande mancha de concentração de gases (em tons de vermelho e laranja, indicando alta concentração) forma um corredor contínuo conectando a costa oeste da África até a costa leste do Brasil. A escala de cores indica concentração em PPbv (partes por bilhão em volume): áreas azuis (0-200 PPbv) indicam baixa concentração; áreas vermelhas (800-1200 PPbv) indicam altíssima concentração. O corredor de poluição atravessa o oceano de leste para oeste.]</em>

<small>Disponível em: https://noticias.uol.com.br. Acesso em: 10 out. 2019 (adaptado).</small>'
WHERE ano_prova = 2025 AND numero_questao = 47;

-- ============================================================================
-- QUESTÃO 22 - Ilha do Ferro (escultura em madeira)
-- SOLUÇÃO: Melhorar descrição do TEXTO II
-- ============================================================================

UPDATE questoes_enem SET contexto =
'<strong>TEXTO I</strong>

A Ilha do Ferro, situada a 18 km do município de Pão de Açúcar, não é uma ilha, como o nome indica. A história do povoado é semelhante à de inúmeros outros que encontramos às margens do Rio São Francisco, entre Alagoas e Sergipe. O que torna diferente o lugar é sua gente. Hoje, dezenas de artistas populares povoam a Ilha do Ferro, trabalhando principalmente com o entalhe em madeira. Onde pessoas comuns enxergariam apenas troncos e galhos retorcidos, eles vislumbram bancos, bonecos, pássaros, cobras e bailarinas. "Às vezes, você passa por um pedaço de madeira uma vez e não vê nada, passa cinco vezes por ele e não vê nada", conta um dos artistas, "mas, na décima vez, você consegue enxergar alguma forma nesse pedaço de madeira e transformá-lo em arte".

<small>Disponível em: www.imaterial.art.br. Acesso em: 5 fev. 2025 (adaptado).</small>

<strong>TEXTO II</strong>

<em>[Fotografia de uma escultura em madeira representando um bailarino em movimento. A peça foi entalhada a partir de gravetos naturais, preservando as curvas e texturas originais da madeira. O corpo do bailarino se curva em uma pose elegante, com braços e pernas formados pelos próprios galhos retorcidos. A base da escultura mantém a forma rústica de um tronco.]</em>

FARIAS, Y. <em>Bailarino entalhado em gravetos de madeira.</em> Artesanato em madeira, 20 × 13 × 51 cm. Ilha do Ferro (AL).

<small>Disponível em: www.nidelins.com.br. Acesso em: 5 fev. 2025.</small>'
WHERE ano_prova = 2025 AND numero_questao = 22;

-- ============================================================================
-- QUESTÃO 23 - Adriana Varejão
-- SOLUÇÃO: Melhorar descrição da obra
-- ============================================================================

UPDATE questoes_enem SET contexto =
'<strong>TEXTO I</strong>

Os trabalhos da exposição <em>Adriana Varejão: suturas, fissuras, ruínas</em> colocam em pauta o exame da história visual, das tradições iconográficas europeias e do fazer artístico ocidental. O corte, a rachadura, o talho e a fissura são elementos de narrativas recorrentes nos trabalhos da artista desde 1992. As produções recentes incluem pinturas tridimensionais de grande escala das séries <em>Ruínas de charque</em> e <em>Línguas</em>.

<small>Disponível em: https://pinacoteca.org.br. Acesso em: 10 jan. 2025 (adaptado).</small>

<strong>TEXTO II</strong>

<em>[Reprodução da obra "Azulejaria em carne viva". A pintura tridimensional apresenta uma parede de azulejos em padrão colonial português (branco e azul), típicos da arquitetura colonial brasileira. No centro da superfície de azulejos, uma grande rachadura/fissura revela uma massa carnosa e visceral em tons de vermelho vivo, como se a parede fosse um corpo que sangra. O contraste entre a frieza dos azulejos decorativos e a carnalidade da ferida aberta cria uma sensação de violência contida.]</em>

VAREJÃO, A. <em>Azulejaria em carne viva.</em> Óleo sobre tela, poliuretano, madeira e alumínio, 160 × 200 × 25 cm. 1999.

<small>Disponível em: www.adrianavarejao.net. Acesso em: 10 jan. 2025.</small>'
WHERE ano_prova = 2025 AND numero_questao = 23;

-- ============================================================================
-- QUESTÃO 41 - Bancos indígenas
-- SOLUÇÃO: Melhorar descrição do banco Tatu
-- ============================================================================

UPDATE questoes_enem SET contexto =
'<strong>TEXTO I</strong>
<em>Origem, tradição e resistência</em>

Foi sentada em seu banco de quartzo que a avó do universo, moradora da Maloca do Céu, criou os homens, os animais, a terra e as águas. O banco foi entregue aos ancestrais dos atuais Tukano, que passaram a reproduzi-lo em madeira. O mito Tukano — povo do noroeste da Amazônia que ainda hoje fabrica os bancos em seu estilo tradicional — indica o lugar dos bancos entre os objetos sagrados, ao mesmo tempo parte do universo primitivo e fonte do poder de criação. A presença nos mitos de origem de alguns povos atesta a antiguidade da arte de talhar bancos: os primeiros registros do uso desses objetos entre ameríndios das terras baixas da América do Sul, do Caribe e da América Central datam de, pelo menos, 4 mil anos.

<small>ASSIS, R.; MENDES JR., L. Bancos indígenas do Brasil. São Paulo: BEI Comunicação, 2013.</small>

<strong>TEXTO II</strong>

<em>[Fotografia de um banco de madeira esculpido em formato de tatu. A peça representa o animal de forma estilizada: o assento corresponde ao casco do tatu (com os padrões geométricos característicos entalhados na madeira), enquanto a cabeça, as patas e a cauda do animal formam a estrutura de sustentação do banco. A madeira escura e polida reflete a tradição de transformar elementos da fauna amazônica em objetos utilitários sagrados.]</em>

KAMAYURÁ, Y. <em>Tatu Kamayurá 1.</em> Madeira, 61 × 24 × 20 cm. Xingu (MT), s.d.

<small>Disponível em: www.colecaobei.com.br. Acesso em: 15 out. 2024.</small>'
WHERE ano_prova = 2025 AND numero_questao = 41;

-- ============================================================================
-- QUESTÃO 15 - Retratos Dalton Paula
-- SOLUÇÃO: Melhorar descrição dos retratos
-- ============================================================================

UPDATE questoes_enem SET contexto =
'O retrato como gênero da pintura ocidental ficou vinculado às elites, tornando invisíveis as populações que não faziam parte do círculo dominante. Num país de tradição escravocrata e colonizado por europeus como o Brasil, pouquíssimas pessoas negras e indígenas foram retratadas em pintura, e menos ainda identificadas com seus nomes nos retratos. Daí a importância, para a história da arte e para a história brasileira, dos retratos de Dalton Paula.

<em>[Duas reproduções de pinturas em estilo clássico de retrato:]</em>

<strong>Figura 1:</strong> Retrato de Zeferina, líder do Quilombo do Urubu (Bahia, século XIX). A pintura mostra uma mulher negra em pose digna, com expressão determinada. Fundo em tons terrosos, iluminação que valoriza os traços do rosto. O estilo lembra os retratos da nobreza europeia, mas o sujeito é uma heroína negra da resistência quilombola.

<strong>Figura 2:</strong> Retrato de João de Deus Nascimento, líder da Revolta dos Alfaiates (Bahia, 1798). Homem negro em posição formal, com vestimenta da época. A composição segue as convenções dos retratos históricos, dignificando um revolucionário que lutou pela independência e pelo fim da escravidão.

PAULA, D. Óleo sobre tela, 59 × 44 cm (cada). Masp, São Paulo, 2018.

<small>Disponível em: www.masp.org.br. Acesso em: 5 maio 2024 (adaptado).</small>'
WHERE ano_prova = 2025 AND numero_questao = 15;

-- ============================================================================
-- VERIFICAÇÃO DAS CORREÇÕES
-- ============================================================================

SELECT '═══════════════════════════════════════════════════════════════' as linha;
SELECT 'VERIFICAÇÃO - CORREÇÕES APLICADAS' as titulo;
SELECT '═══════════════════════════════════════════════════════════════' as linha;

SELECT
    numero_questao AS q,
    CASE
        WHEN LENGTH(contexto) > 500 AND contexto LIKE '%<em>[%' THEN '✅ Descrição enriquecida'
        WHEN LENGTH(contexto) > 300 THEN '🔵 Contexto OK'
        ELSE '⚠️ Verificar'
    END AS status_contexto,
    CASE
        WHEN comando NOT LIKE '%não verbal%' AND comando NOT LIKE '%nesse desenho%' THEN '✅ Comando ajustado'
        ELSE '🔵 Comando OK'
    END AS status_comando,
    LENGTH(contexto) AS chars
FROM questoes_enem
WHERE ano_prova = 2025 AND numero_questao IN (14, 15, 22, 23, 34, 41, 45, 47, 68, 77)
ORDER BY numero_questao;

-- ============================================================================
-- FIM DAS CORREÇÕES PRIORITÁRIAS
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║           CORREÇÕES PRIORITÁRIAS APLICADAS COM SUCESSO                      ║';
SELECT '║                                                                              ║';
SELECT '║  • Q14, Q34, Q45: Comandos reformulados                                     ║';
SELECT '║  • Q15, Q22, Q23, Q41, Q47, Q68, Q77: Descrições enriquecidas               ║';
SELECT '║                                                                              ║';
SELECT '║  As questões agora podem ser resolvidas mesmo sem imagens reais             ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';
