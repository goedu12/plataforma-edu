-- ═══════════════════════════════════════════════════════════════════════════
-- FORMATAÇÃO COMPLETA: Textos ENEM 2025 com fontes em tamanho menor
-- As fontes aparecem com <small> para simular a prova original
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES 6-10: Crônica "De próprio punho"
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = '<strong>De próprio punho</strong>

<em>A escrita e suas tecnologias sofrem interessantes metamorfoses, numa ciranda que vai do simples bilhete aos originais de um livro</em>

Estranhei muito na primeira vez que escutei a expressão "de próprio punho". Parecia que eu ia bater em alguém. Não era bem o caso. Foi numa situação bancária, dessas bem burocráticas, e eu devia escrever algo bem breve, mas com minhas mãos. Na verdade, o que importava era a autenticidade da minha caligrafia, que à época ainda era mais fluente e firme. Depois dos teclados de computador, ela rateia bastante. Minha letra, hoje, tem uma espécie de alternância: dia sim, dia não, trêmula e firme, forte e fraca, mais rotunda e mais cheia de arestas.

É claro que já escrevi muito mais de próprio punho ou, numa palavra mais bonita, manuscrevi (prefiro a mão ao punho, embora ele também seja usado na tarefa). Mas isso não é um feito individual. Em larga medida, é social. Muita gente sente o mesmo que eu, isto é, escreve bem menos usando as mãos, ou melhor, empregando algum tipo de tecnologia (lápis, caneta etc.) para escrever com grafite ou tinta ou giz ou carvão ou sangue e o que mais. É importante lembrar que ainda há gente que não sabe escrever neste país, neste planeta, mas muita gente sabe e tem um combo de tecnologias mais ou menos à disposição para isso. Sou dessas pessoas privilegiadas que têm várias possibilidades, e uma delas nunca deixou de ser o uso das minhas mãos. Ainda hoje, são elas que batucam meu teclado de computador ou que tocam suavemente duas ou três telas sensíveis. Mas não expressam mais a minha letra. No lugar, aparecem Times New Roman, Arial, Calibri e mais uma centena de "letras" à minha escolha. Eu e Deus e o mundo.

A despeito desse rol de chances e ferramentas para escrever, o manuscrito nunca deixou de pintar aqui e ali, muitas vezes como obrigação. Na escola, por exemplo, até hoje ele é soberano. No Enem também. Curioso, não? Fico pensando em que espaços e ocasiões ainda uso minha letra. Olhando ao redor, na minha casa, minha letra está em espaços muito delimitados e específicos: bilhetes. Eles estão principalmente na cozinha, em especial na porta da geladeira, a fim de manter a comunicação com meus coabitantes, sempre muito esquecidos ou relapsos. Mas também há bilhetes em post its na minha mesa do escritório, textinhos em garranchos por meio dos quais me comunico comigo mesma, a evitar um comportamento esquecido e relapso.

No escritório, costumo ser mais suave comigo mesma, mas também muito mais lacônica, a ponto de nem eu me entender, se passar o tempo. Em todos os casos vai minha letra, menos e mais redonda, a lápis e a tinta azul, em post its rosa-choque, colados precariamente, e todos com destino à lixeira, em breve. Justo porque eles funcionam como lembretes de tarefas e coisas que devem ser vencidas e, claro, substituídas por outras, num fluxo infinito, às vezes ansiogênico, com que a maioria dos adultos (e mais ainda as adultas) precisa conviver.

As formas de escrever mudam, as necessidades também, e o resultado é um elenco complexo, em que nada dispensa nada, a depender da tarefa ou da importância das coisas ou de suas funções, claro. A escrita e suas tecnologias incríveis vão se reposicionando, mudando de status, numa ciranda interessante e importante que pode ser vista à luz de certa diversidade que encontra suas oportunidades e seus efeitos, aqui e ali. Não adianta muito pensar sempre como se tudo fosse excludente. Estão aí minha farta comunicação por bilhetes, minha gaveta alegre de post its de toda cor, esperando para serem usados, e o cheque do cartório, em que quase tudo já é digital. "Do punho ao pixel" não é uma frase filosoficamente correta. O negócio é mais "o punho e o pixel".

<small>RIBEIRO, A. E. Disponível em: https://rascunho.com.br. Acesso em: 16 jan. 2024 (adaptado).</small>'
WHERE ano_prova = 2025
  AND numero_questao IN (6, 7, 8, 9, 10);

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÃO 5 (Inglês): Copos de café
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = '<em>[Imagem: Três copos de café em tamanhos diferentes, dispostos lado a lado em uma cafeteria. Cada copo possui uma etiqueta com uma frase em inglês:]</em>

<strong>Copo pequeno (12 oz):</strong> "I slept great"
<strong>Copo médio (16 oz):</strong> "I slept okay"
<strong>Copo grande (20 oz):</strong> "What is sleep?"

<small>Disponível em: https://pt.foursquare.com. Acesso em: 14 maio 2024.</small>'
WHERE ano_prova = 2025
  AND numero_questao = 5
  AND subarea = 'ingles';

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÃO 14: Cartaz Bienal do Livro
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = '<em>[Cartaz publicitário da 26ª Bienal Internacional do Livro de São Paulo]</em>

<strong>"Você entra Fernando.
E sai Pessoa."</strong>

<em>[Ilustração de um jovem com a cabeça e a camiseta preenchidas por símbolos de Portugal: bondinho, caravela e elementos típicos portugueses]</em>

<em>"Todo mundo sai melhor do que entrou"</em>

<small>Disponível em: www.publishnews.com.br. Acesso em: 19 set. 2024.</small>'
WHERE ano_prova = 2025
  AND numero_questao = 14;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÃO 24: Cartaz UNICEF
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = '<em>[Cartaz de campanha da UNICEF Brasil]</em>

<em>[Imagem de duas crianças lado a lado:]</em>

<strong>Criança branca:</strong> "Quando crescer, quero ser médico"
<strong>Criança negra:</strong> "Quando crescer, quero estar vivo"

<small>Disponível em: www.unicef.org.br. Acesso em: 15 jan. 2024 (adaptado).</small>'
WHERE ano_prova = 2025
  AND numero_questao = 24;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÃO 33: Cartaz TJDFT
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = '<em>[Cartaz informativo do TJDFT - Tribunal de Justiça do Distrito Federal e dos Territórios]</em>

<strong>Campanha de conscientização sobre violência escolar</strong>

<em>[Infográfico com dados estatísticos sobre violência contra meninas no ambiente escolar, destacando a necessidade de políticas públicas para proteção e segurança das estudantes]</em>

<small>Disponível em: www.tjdft.jus.br. Acesso em: 15 out. 2024 (adaptado).</small>'
WHERE ano_prova = 2025
  AND numero_questao = 33;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÃO 34: Capa Revista Galileu
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE questoes_enem
SET contexto = '<em>[Capa da Revista Galileu]</em>

<strong>VOCÊ (NÃO) ESTÁ SOZINHO</strong>

<em>[Ilustração de uma pessoa cercada por ícones de redes sociais, notificações e símbolos de conectividade digital, sugerindo a contradição entre hiperconectividade e solidão]</em>

<small>Disponível em: https://revistagalileu.globo.com. Acesso em: 18 jun. 2024 (adaptado).</small>'
WHERE ano_prova = 2025
  AND numero_questao = 34;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAR
-- ═══════════════════════════════════════════════════════════════════════════

SELECT numero_questao, RIGHT(contexto, 120) as fonte_preview
FROM questoes_enem
WHERE ano_prova = 2025
  AND numero_questao IN (5, 6, 14, 24, 33, 34)
ORDER BY numero_questao;
