-- ═══════════════════════════════════════════════════════════════════════════
-- CORREÇÃO: Inserir contextos faltantes nas questões ENEM 2025
-- Execute cada UPDATE separadamente no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES 6-10: Inserir a crônica "De próprio punho"
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = 'De próprio punho

A escrita e suas tecnologias sofrem interessantes metamorfoses, numa ciranda que vai do simples bilhete aos originais de um livro

Estranhei muito na primeira vez que escutei a expressão "de próprio punho". Parecia que eu ia bater em alguém. Não era bem o caso. Foi numa situação bancária, dessas bem burocráticas, e eu devia escrever algo bem breve, mas com minhas mãos. Na verdade, o que importava era a autenticidade da minha caligrafia, que à época ainda era mais fluente e firme. Depois dos teclados de computador, ela rateia bastante. Minha letra, hoje, tem uma espécie de alternância: dia sim, dia não, trêmula e firme, forte e fraca, mais rotunda e mais cheia de arestas.

É claro que já escrevi muito mais de próprio punho ou, numa palavra mais bonita, manuscrevi (prefiro a mão ao punho, embora ele também seja usado na tarefa). Mas isso não é um feito individual. Em larga medida, é social. Muita gente sente o mesmo que eu, isto é, escreve bem menos usando as mãos, ou melhor, empregando algum tipo de tecnologia (lápis, caneta etc.) para escrever com grafite ou tinta ou giz ou carvão ou sangue e o que mais. É importante lembrar que ainda há gente que não sabe escrever neste país, neste planeta, mas muita gente sabe e tem um combo de tecnologias mais ou menos à disposição para isso. Sou dessas pessoas privilegiadas que têm várias possibilidades, e uma delas nunca deixou de ser o uso das minhas mãos. Ainda hoje, são elas que batucam meu teclado de computador ou que tocam suavemente duas ou três telas sensíveis. Mas não expressam mais a minha letra. No lugar, aparecem Times New Roman, Arial, Calibri e mais uma centena de "letras" à minha escolha. Eu e Deus e o mundo.

A despeito desse rol de chances e ferramentas para escrever, o manuscrito nunca deixou de pintar aqui e ali, muitas vezes como obrigação. Na escola, por exemplo, até hoje ele é soberano. No Enem também. Curioso, não? Fico pensando em que espaços e ocasiões ainda uso minha letra. Olhando ao redor, na minha casa, minha letra está em espaços muito delimitados e específicos: bilhetes. Eles estão principalmente na cozinha, em especial na porta da geladeira, a fim de manter a comunicação com meus coabitantes, sempre muito esquecidos ou relapsos. Mas também há bilhetes em post its na minha mesa do escritório, textinhos em garranchos por meio dos quais me comunico comigo mesma, a evitar um comportamento esquecido e relapso.

No escritório, costumo ser mais suave comigo mesma, mas também muito mais lacônica, a ponto de nem eu me entender, se passar o tempo. Em todos os casos vai minha letra, menos e mais redonda, a lápis e a tinta azul, em post its rosa-choque, colados precariamente, e todos com destino à lixeira, em breve. Justo porque eles funcionam como lembretes de tarefas e coisas que devem ser vencidas e, claro, substituídas por outras, num fluxo infinito, às vezes ansiogênico, com que a maioria dos adultos (e mais ainda as adultas) precisa conviver.

As formas de escrever mudam, as necessidades também, e o resultado é um elenco complexo, em que nada dispensa nada, a depender da tarefa ou da importância das coisas ou de suas funções, claro. A escrita e suas tecnologias incríveis vão se reposicionando, mudando de status, numa ciranda interessante e importante que pode ser vista à luz de certa diversidade que encontra suas oportunidades e seus efeitos, aqui e ali. Não adianta muito pensar sempre como se tudo fosse excludente. Estão aí minha farta comunicação por bilhetes, minha gaveta alegre de post its de toda cor, esperando para serem usados, e o cheque do cartório, em que quase tudo já é digital. "Do punho ao pixel" não é uma frase filosoficamente correta. O negócio é mais "o punho e o pixel".

RIBEIRO, A. E. Disponível em: https://rascunho.com.br. Acesso em: 16 jan. 2024 (adaptado).'
WHERE ano_prova = 2025
  AND numero_questao IN (6, 7, 8, 9, 10);

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÃO 5 (Inglês): Adicionar descrição da imagem dos copos de café
-- A questão depende de uma imagem - adicionar descrição textual
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = 'A imagem mostra três copos de café de tamanhos diferentes em uma cafeteria, cada um com uma mensagem humorística relacionando o tamanho do copo à quantidade de sono da pessoa:

- Copo pequeno (12 oz): "I slept great" (Eu dormi muito bem)
- Copo médio (16 oz): "I slept okay" (Eu dormi razoavelmente)
- Copo grande (20 oz): "What is sleep?" (O que é dormir?)

As mensagens sugerem que quanto menos a pessoa dormiu, maior o copo de café que ela precisa.

Disponível em: https://pt.foursquare.com. Acesso em: 14 maio 2024.'
WHERE ano_prova = 2025
  AND numero_questao = 5
  AND subarea = 'ingles';

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÃO 14: Adicionar descrição do cartaz da Bienal (Fernando Pessoa)
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = 'O cartaz publicitário da 26a Bienal Internacional do Livro de São Paulo apresenta a frase "Você entra Fernando. E sai Pessoa."

Entre as duas partes da frase, há o desenho de um jovem com a cabeça e a camiseta preenchidas por símbolos de Portugal, como um bondinho e uma caravela.

Logo abaixo, estão as informações do evento (local, datas) e o slogan: "Todo mundo sai melhor do que entrou".

O jogo de palavras faz referência ao poeta português Fernando Pessoa, mas também ao significado da palavra "pessoa" (ser humano), sugerindo que a leitura transforma o indivíduo.

Disponível em: www.publishnews.com.br. Acesso em: 19 set. 2024.'
WHERE ano_prova = 2025
  AND numero_questao = 14;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÃO 24: Cartaz UNICEF sobre racismo e educação infantil
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = 'O cartaz da UNICEF apresenta duas crianças lado a lado:

- Uma criança branca com a frase: "Quando crescer, quero ser médico"
- Uma criança negra com a frase: "Quando crescer, quero estar vivo"

O contraste entre as duas frases evidencia a desigualdade racial e como ela afeta as perspectivas de futuro das crianças desde a infância, chamando atenção para os impactos do racismo estrutural na sociedade brasileira.

Disponível em: www.unicef.org.br. Acesso em: 15 jan. 2024 (adaptado).'
WHERE ano_prova = 2025
  AND numero_questao = 24;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÃO 33: Cartaz TJDFT sobre violência escolar
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = 'O cartaz do Tribunal de Justiça do Distrito Federal e dos Territórios (TJDFT) apresenta dados sobre violência escolar contra meninas:

A imagem mostra estatísticas e informações que evidenciam como a violência de gênero afeta estudantes do sexo feminino no ambiente escolar, com dados que demonstram a necessidade de políticas públicas voltadas para a proteção e segurança das alunas.

O material faz parte de uma campanha de conscientização sobre violência escolar e seus impactos na educação.

Disponível em: www.tjdft.jus.br. Acesso em: 15 out. 2024 (adaptado).'
WHERE ano_prova = 2025
  AND numero_questao = 33;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÃO 34: Capa da Revista Galileu "VOCÊ (NÃO) ESTÁ SOZINHO"
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = 'A capa da Revista Galileu apresenta a frase "VOCÊ (NÃO) ESTÁ SOZINHO" com a palavra "NÃO" entre parênteses.

A imagem mostra uma pessoa cercada por ícones e símbolos de redes sociais e tecnologia, sugerindo a contradição entre a hiperconectividade digital e a solidão real.

A construção da frase permite duas leituras simultâneas:
- "VOCÊ ESTÁ SOZINHO" (se ignorarmos os parênteses)
- "VOCÊ NÃO ESTÁ SOZINHO" (leitura completa)

Essa ambiguidade explora a função poética da linguagem, onde a construção do texto possibilita múltiplas interpretações.

Disponível em: https://revistagalileu.globo.com. Acesso em: 18 jun. 2024 (adaptado).'
WHERE ano_prova = 2025
  AND numero_questao = 34;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAR CORREÇÕES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
    numero_questao,
    LENGTH(contexto) as len_contexto,
    LEFT(contexto, 100) as contexto_preview,
    status
FROM questoes_enem
WHERE ano_prova = 2025
  AND numero_questao IN (5, 6, 7, 8, 9, 10, 14, 24, 33, 34)
ORDER BY numero_questao;

-- ═══════════════════════════════════════════════════════════════════════════
-- REATIVAR QUESTÕES (se estavam como 'revisao')
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET status = 'ativa'
WHERE ano_prova = 2025
  AND numero_questao IN (5, 6, 7, 8, 9, 10, 14, 24, 33, 34)
  AND status = 'revisao';

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL: Contar questões por status
-- ═══════════════════════════════════════════════════════════════════════════

SELECT status, COUNT(*) as total
FROM questoes_enem
WHERE ano_prova = 2025
GROUP BY status
ORDER BY total DESC;
