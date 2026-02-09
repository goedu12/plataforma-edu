-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES DE MATEMÁTICA - ENSINO MÉDIO (3ª SÉRIE)
-- 100 questões cobrindo os 4 bimestres
-- Temas: PA, PG, Estatística, Análise Combinatória, Probabilidade,
--        Geometria Analítica, Polinômios, Números Complexos
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 3ª SÉRIE - 1º BIMESTRE
-- Temas: Progressão Aritmética (PA), Progressão Geométrica (PG), Estatística
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

-- PA - Fáceis
(
    'matematica', 3, 1, 'Progressão Aritmética', 'Razão da PA', 'facil',
    'Na PA (2, 5, 8, 11, ...), qual é a razão?',
    '2', '3', '4', '5', NULL,
    'B',
    'A razão é a diferença entre termos consecutivos: 5 - 2 = 3.',
    'Razão = termo posterior - termo anterior',
    'ativa'
),

(
    'matematica', 3, 1, 'Progressão Aritmética', 'Termo Geral', 'facil',
    'Qual é o 10º termo da PA (3, 7, 11, 15, ...)?',
    '35', '39', '41', '43', NULL,
    'B',
    'a₁ = 3, r = 4. a₁₀ = 3 + (10-1)×4 = 3 + 36 = 39.',
    'Use aₙ = a₁ + (n-1)×r',
    'ativa'
),

(
    'matematica', 3, 1, 'Progressão Aritmética', 'Termo Geral', 'facil',
    'O primeiro termo de uma PA é 5 e a razão é 3. Qual é o 6º termo?',
    '18', '20', '23', '15', NULL,
    'B',
    'a₆ = 5 + (6-1)×3 = 5 + 15 = 20.',
    'aₙ = a₁ + (n-1)×r',
    'ativa'
),

-- PA - Médias
(
    'matematica', 3, 1, 'Progressão Aritmética', 'Soma da PA', 'medio',
    'Qual é a soma dos 20 primeiros termos da PA (1, 4, 7, 10, ...)?',
    '570', '580', '590', '600', NULL,
    'C',
    'a₁ = 1, r = 3. a₂₀ = 1 + 19×3 = 58. S₂₀ = (1 + 58)×20/2 = 59×10 = 590.',
    'Sₙ = (a₁ + aₙ)×n/2',
    'ativa'
),

(
    'matematica', 3, 1, 'Progressão Aritmética', 'Soma da PA', 'medio',
    'A soma dos 10 primeiros termos de uma PA é 100. Se a₁ = 1, qual é a razão?',
    '1', '2', '3', '4', NULL,
    'B',
    'S₁₀ = (2×1 + 9r)×10/2 = (2 + 9r)×5 = 100. Então 2 + 9r = 20, logo 9r = 18 e r = 2.',
    'Use Sₙ = (2a₁ + (n-1)r)×n/2',
    'ativa'
),

(
    'matematica', 3, 1, 'Progressão Aritmética', 'Propriedades', 'medio',
    'Em uma PA de 5 termos, o termo central é 15. Qual é a soma dos 5 termos?',
    '60', '75', '80', '90', NULL,
    'B',
    'Em uma PA, a soma dos termos equidistantes dos extremos é constante e igual a 2× termo central. S₅ = 5 × 15 = 75.',
    'Soma = n × termo central (quando n é ímpar)',
    'ativa'
),

-- PA - Difíceis
(
    'matematica', 3, 1, 'Progressão Aritmética', 'Aplicação', 'dificil',
    'Um teatro tem 20 fileiras. A 1ª fileira tem 15 lugares e cada fileira seguinte tem 2 lugares a mais. Quantos lugares tem o teatro?',
    '660', '680', '700', '720', NULL,
    'B',
    'PA com a₁ = 15, r = 2, n = 20. a₂₀ = 15 + 19×2 = 53. S₂₀ = (15 + 53)×20/2 = 68×10 = 680.',
    'Total de lugares = soma dos termos da PA',
    'ativa'
),

(
    'matematica', 3, 1, 'Progressão Aritmética', 'Interpolação', 'dificil',
    'Interpole 4 meios aritméticos entre 3 e 33. Qual é o terceiro meio aritmético?',
    '15', '18', '21', '24', NULL,
    'C',
    'PA: 3, _, _, _, _, 33. São 6 termos. r = (33-3)/(6-1) = 30/5 = 6. Os meios: 9, 15, 21, 27. O terceiro é 21.',
    'r = (aₙ - a₁)/(n - 1)',
    'ativa'
),

-- PG - Fáceis
(
    'matematica', 3, 1, 'Progressão Geométrica', 'Razão da PG', 'facil',
    'Na PG (3, 6, 12, 24, ...), qual é a razão?',
    '2', '3', '4', '6', NULL,
    'A',
    'A razão é o quociente entre termos consecutivos: 6/3 = 2.',
    'Razão = termo posterior / termo anterior',
    'ativa'
),

(
    'matematica', 3, 1, 'Progressão Geométrica', 'Termo Geral', 'facil',
    'Qual é o 5º termo da PG (2, 6, 18, ...)?',
    '54', '108', '162', '216', NULL,
    'C',
    'a₁ = 2, q = 3. a₅ = 2 × 3⁴ = 2 × 81 = 162.',
    'aₙ = a₁ × q^(n-1)',
    'ativa'
),

(
    'matematica', 3, 1, 'Progressão Geométrica', 'Classificação', 'facil',
    'Uma PG tem razão q = -2 e a₁ = 1. A PG é:',
    'Crescente', 'Decrescente', 'Oscilante', 'Constante', NULL,
    'C',
    'Quando q < 0, os termos alternam de sinal: 1, -2, 4, -8, ... É uma PG oscilante.',
    'q < 0 → termos alternam de sinal',
    'ativa'
),

-- PG - Médias
(
    'matematica', 3, 1, 'Progressão Geométrica', 'Soma da PG', 'medio',
    'Qual a soma dos 6 primeiros termos da PG (1, 2, 4, 8, ...)?',
    '31', '63', '127', '32', NULL,
    'B',
    'a₁ = 1, q = 2, n = 6. S₆ = 1×(2⁶ - 1)/(2 - 1) = (64 - 1)/1 = 63.',
    'Sₙ = a₁(qⁿ - 1)/(q - 1) quando q ≠ 1',
    'ativa'
),

(
    'matematica', 3, 1, 'Progressão Geométrica', 'Soma da PG infinita', 'medio',
    'Qual a soma da PG infinita (8, 4, 2, 1, ...)?',
    '15', '16', '32', 'Não existe', NULL,
    'B',
    'q = 1/2, |q| < 1. S = a₁/(1-q) = 8/(1 - 1/2) = 8/(1/2) = 16.',
    'S∞ = a₁/(1-q) quando |q| < 1',
    'ativa'
),

(
    'matematica', 3, 1, 'Progressão Geométrica', 'Propriedades', 'medio',
    'Em uma PG de 3 termos, o produto dos termos é 64 e a razão é 2. Qual é o primeiro termo?',
    '1', '2', '4', '8', NULL,
    'B',
    'Sejam a/q, a, aq os termos. Produto = a³ = 64, então a = 4. Primeiro termo: a/q = 4/2 = 2.',
    'Use a propriedade: produto de PG simétrica = (termo central)ⁿ',
    'ativa'
),

-- PG - Difíceis
(
    'matematica', 3, 1, 'Progressão Geométrica', 'Aplicação', 'dificil',
    'Uma bola é solta de 10 m de altura e, a cada quique, atinge 60% da altura anterior. Qual a altura máxima após o 3º quique?',
    '1,296 m', '2,16 m', '3,6 m', '6 m', NULL,
    'B',
    'PG: 10, 6, 3.6, 2.16, ... Após 3º quique: 10 × 0,6³ = 10 × 0,216 = 2,16 m.',
    'Cada quique multiplica a altura por 0,6',
    'ativa'
),

-- ESTATÍSTICA - Fáceis
(
    'matematica', 3, 1, 'Estatística', 'Média Aritmética', 'facil',
    'A média aritmética dos valores 4, 7, 8, 5 e 6 é:',
    '5', '5,5', '6', '6,5', NULL,
    'C',
    'Média = (4 + 7 + 8 + 5 + 6)/5 = 30/5 = 6.',
    'Some todos os valores e divida pela quantidade',
    'ativa'
),

(
    'matematica', 3, 1, 'Estatística', 'Moda', 'facil',
    'No conjunto de dados {3, 5, 7, 5, 9, 5, 2}, a moda é:',
    '3', '5', '7', '9', NULL,
    'B',
    'A moda é o valor que aparece com maior frequência. O 5 aparece 3 vezes.',
    'Moda = valor mais frequente',
    'ativa'
),

(
    'matematica', 3, 1, 'Estatística', 'Mediana', 'facil',
    'A mediana do conjunto {2, 8, 4, 10, 6} é:',
    '4', '6', '8', '10', NULL,
    'B',
    'Ordenando: 2, 4, 6, 8, 10. Com 5 valores, a mediana é o 3º: 6.',
    'Ordene os dados e encontre o valor central',
    'ativa'
),

-- ESTATÍSTICA - Médias
(
    'matematica', 3, 1, 'Estatística', 'Média Ponderada', 'medio',
    'Um aluno obteve notas 7, 8 e 6 com pesos 2, 3 e 5 respectivamente. Sua média ponderada é:',
    '6,2', '6,4', '6,6', '6,8', NULL,
    'D',
    'MP = (7×2 + 8×3 + 6×5)/(2+3+5) = (14 + 24 + 30)/10 = 68/10 = 6,8.',
    'MP = Σ(valor × peso) / Σpesos',
    'ativa'
),

(
    'matematica', 3, 1, 'Estatística', 'Desvio Padrão', 'medio',
    'O conjunto {2, 4, 6} tem variância igual a:',
    '2', '8/3', '4', '16/3', NULL,
    'B',
    'Média = 4. Desvios²: (2-4)²=4, (4-4)²=0, (6-4)²=4. Variância = (4+0+4)/3 = 8/3.',
    'Variância = média dos quadrados dos desvios',
    'ativa'
),

-- ESTATÍSTICA - Difíceis
(
    'matematica', 3, 1, 'Estatística', 'Aplicação', 'dificil',
    'Em uma turma de 30 alunos, a média das notas é 6,5. Se retirarmos os 5 alunos com média 4,0, a nova média da turma será:',
    '7,0', '7,5', '6,8', '7,2', NULL,
    'A',
    'Soma total: 30 × 6,5 = 195. Soma dos 5: 5 × 4,0 = 20. Nova soma: 175. Nova média: 175/25 = 7,0.',
    'Trabalhe com a soma total dos valores',
    'ativa'
),

(
    'matematica', 3, 1, 'Estatística', 'Mediana', 'dificil',
    'Dados: 3, 5, 5, 7, 8, 9, 10, 12. A mediana é:',
    '7', '7,5', '8', '8,5', NULL,
    'B',
    'Com 8 valores (par), a mediana é a média dos 4º e 5º termos: (7 + 8)/2 = 7,5.',
    'Quantidade par: mediana = média dos dois centrais',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 3ª SÉRIE - 2º BIMESTRE
-- Temas: Análise Combinatória, Probabilidade
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

-- PRINCÍPIO FUNDAMENTAL DA CONTAGEM - Fáceis
(
    'matematica', 3, 2, 'Análise Combinatória', 'Princípio Fundamental', 'facil',
    'Uma lanchonete oferece 3 tipos de suco e 4 tipos de sanduíche. De quantas formas um cliente pode escolher um suco e um sanduíche?',
    '7', '12', '24', '3', NULL,
    'B',
    'Pelo PFC: 3 × 4 = 12 combinações possíveis.',
    'PFC: multiplique as possibilidades de cada etapa',
    'ativa'
),

(
    'matematica', 3, 2, 'Análise Combinatória', 'Princípio Fundamental', 'facil',
    'Quantos números de 2 algarismos distintos podem ser formados com os dígitos {1, 2, 3, 4}?',
    '8', '12', '16', '6', NULL,
    'B',
    '1º dígito: 4 opções. 2º dígito: 3 opções (distinto do 1º). Total: 4 × 3 = 12.',
    'Algarismos distintos: desconte o já usado',
    'ativa'
),

-- PERMUTAÇÃO - Fáceis
(
    'matematica', 3, 2, 'Análise Combinatória', 'Permutação', 'facil',
    'De quantas formas 4 pessoas podem se sentar em uma fila de 4 cadeiras?',
    '12', '16', '24', '64', NULL,
    'C',
    'P₄ = 4! = 4 × 3 × 2 × 1 = 24.',
    'Permutação simples: n!',
    'ativa'
),

(
    'matematica', 3, 2, 'Análise Combinatória', 'Permutação', 'facil',
    'Qual o valor de 5!?',
    '60', '100', '120', '150', NULL,
    'C',
    '5! = 5 × 4 × 3 × 2 × 1 = 120.',
    'n! = n × (n-1) × ... × 2 × 1',
    'ativa'
),

-- PERMUTAÇÃO - Médias
(
    'matematica', 3, 2, 'Análise Combinatória', 'Permutação com Repetição', 'medio',
    'Quantos anagramas tem a palavra BANANA?',
    '60', '120', '180', '720', NULL,
    'A',
    'BANANA tem 6 letras: B(1), A(3), N(2). P = 6!/(3!×2!) = 720/(6×2) = 60.',
    'Permutação com repetição: n! dividido pelos fatoriais das repetições',
    'ativa'
),

(
    'matematica', 3, 2, 'Análise Combinatória', 'Permutação Circular', 'medio',
    '6 pessoas se sentam em uma mesa circular. De quantas formas distintas isso é possível?',
    '60', '120', '360', '720', NULL,
    'B',
    'Permutação circular: PC = (n-1)! = 5! = 120.',
    'Mesa circular: (n-1)!',
    'ativa'
),

-- ARRANJO - Médias
(
    'matematica', 3, 2, 'Análise Combinatória', 'Arranjo', 'medio',
    'De um grupo de 8 atletas, de quantas formas podemos escolher 1º, 2º e 3º lugares?',
    '56', '120', '336', '512', NULL,
    'C',
    'A(8,3) = 8!/(8-3)! = 8!/5! = 8 × 7 × 6 = 336.',
    'Arranjo: a ordem importa! A(n,p) = n!/(n-p)!',
    'ativa'
),

(
    'matematica', 3, 2, 'Análise Combinatória', 'Arranjo', 'medio',
    'Quantas placas de carro podem ser formadas com 3 letras (de A a Z, 26 letras) seguidas de 4 dígitos (0 a 9), permitindo repetições?',
    '17.576.000', '175.760.000', '1.757.600', '26 × 10⁴', NULL,
    'B',
    '26³ × 10⁴ = 17.576 × 10.000 = 175.760.000.',
    'Com repetição: multiplique as possibilidades de cada posição',
    'ativa'
),

-- COMBINAÇÃO - Fáceis
(
    'matematica', 3, 2, 'Análise Combinatória', 'Combinação', 'facil',
    'De um grupo de 6 amigos, de quantas formas podemos escolher 2 para uma tarefa?',
    '12', '15', '30', '36', NULL,
    'B',
    'C(6,2) = 6!/(2!×4!) = (6×5)/(2×1) = 15.',
    'Combinação: a ordem NÃO importa. C(n,p) = n!/(p!(n-p)!)',
    'ativa'
),

(
    'matematica', 3, 2, 'Análise Combinatória', 'Combinação', 'facil',
    'Quanto vale C(5,3)?',
    '5', '10', '15', '20', NULL,
    'B',
    'C(5,3) = 5!/(3!×2!) = (5×4)/(2×1) = 10.',
    'C(n,p) = C(n, n-p)',
    'ativa'
),

-- COMBINAÇÃO - Difíceis
(
    'matematica', 3, 2, 'Análise Combinatória', 'Combinação', 'dificil',
    'Uma comissão de 5 pessoas será formada a partir de 6 homens e 4 mulheres, devendo ter exatamente 3 homens e 2 mulheres. Quantas comissões são possíveis?',
    '60', '90', '120', '180', NULL,
    'C',
    'C(6,3) × C(4,2) = 20 × 6 = 120.',
    'Multiplique as combinações de cada grupo',
    'ativa'
),

(
    'matematica', 3, 2, 'Análise Combinatória', 'Combinação', 'dificil',
    'De quantas formas é possível formar um grupo de 4 pessoas a partir de 10 candidatos, sabendo que 2 candidatos específicos não podem estar juntos no grupo?',
    '140', '154', '168', '182', NULL,
    'D',
    'Total sem restrição: C(10,4) = 210. Casos com os 2 juntos: C(8,2) = 28 (escolhe 2 dos 8 restantes para completar o grupo). Resultado: 210 - 28 = 182.',
    'Total - casos proibidos',
    'ativa'
),

-- PROBABILIDADE - Fáceis
(
    'matematica', 3, 2, 'Probabilidade', 'Conceitos', 'facil',
    'Ao lançar um dado honesto, qual a probabilidade de sair um número par?',
    '1/6', '1/3', '1/2', '2/3', NULL,
    'C',
    'Números pares: {2, 4, 6} = 3 casos favoráveis. Total: 6. P = 3/6 = 1/2.',
    'P = casos favoráveis / casos possíveis',
    'ativa'
),

(
    'matematica', 3, 2, 'Probabilidade', 'Conceitos', 'facil',
    'Uma urna tem 3 bolas vermelhas e 7 bolas azuis. Qual a probabilidade de sortear uma bola vermelha?',
    '3/7', '7/10', '3/10', '7/3', NULL,
    'C',
    'P = 3/(3+7) = 3/10.',
    'P = favoráveis / total',
    'ativa'
),

-- PROBABILIDADE - Médias
(
    'matematica', 3, 2, 'Probabilidade', 'Eventos Independentes', 'medio',
    'Ao lançar uma moeda 3 vezes, qual a probabilidade de obter exatamente 2 caras?',
    '1/8', '1/4', '3/8', '1/2', NULL,
    'C',
    'C(3,2) × (1/2)² × (1/2)¹ = 3 × 1/4 × 1/2 = 3/8.',
    'Use a distribuição binomial: C(n,k) × p^k × (1-p)^(n-k)',
    'ativa'
),

(
    'matematica', 3, 2, 'Probabilidade', 'Probabilidade Condicional', 'medio',
    'Em uma caixa há 5 bolas brancas e 3 pretas. Retira-se uma bola sem reposição e depois outra. Qual a probabilidade de ambas serem brancas?',
    '5/14', '25/64', '5/16', '25/56', NULL,
    'A',
    'P = (5/8) × (4/7) = 20/56 = 5/14.',
    'Sem reposição: a 2ª probabilidade muda',
    'ativa'
),

-- PROBABILIDADE - Difíceis
(
    'matematica', 3, 2, 'Probabilidade', 'Aplicação', 'dificil',
    'Em um teste de múltipla escolha com 5 questões e 4 alternativas cada, qual a probabilidade de acertar exatamente 3 questões chutando?',
    '45/512', '90/1024', '45/1024', '135/1024', NULL,
    'B',
    'C(5,3) × (1/4)³ × (3/4)² = 10 × (1/64) × (9/16) = 90/1024.',
    'Binomial: n=5, k=3, p=1/4',
    'ativa'
),

(
    'matematica', 3, 2, 'Probabilidade', 'União de Eventos', 'dificil',
    'A probabilidade de chover amanhã é 0,4 e de fazer frio é 0,3. A probabilidade de chover E fazer frio é 0,1. Qual a probabilidade de chover OU fazer frio?',
    '0,5', '0,6', '0,7', '0,8', NULL,
    'B',
    'P(A ∪ B) = P(A) + P(B) - P(A ∩ B) = 0,4 + 0,3 - 0,1 = 0,6.',
    'P(A ∪ B) = P(A) + P(B) - P(A ∩ B)',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 3ª SÉRIE - 3º BIMESTRE
-- Temas: Geometria Analítica (Ponto, Reta, Circunferência)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

-- PONTO E DISTÂNCIA - Fáceis
(
    'matematica', 3, 3, 'Geometria Analítica', 'Distância entre Pontos', 'facil',
    'Qual a distância entre os pontos A(1, 2) e B(4, 6)?',
    '3', '4', '5', '7', NULL,
    'C',
    'd = √[(4-1)² + (6-2)²] = √[9 + 16] = √25 = 5.',
    'd = √[(x₂-x₁)² + (y₂-y₁)²]',
    'ativa'
),

(
    'matematica', 3, 3, 'Geometria Analítica', 'Ponto Médio', 'facil',
    'Qual o ponto médio do segmento com extremidades A(2, 4) e B(6, 10)?',
    '(3, 6)', '(4, 7)', '(8, 14)', '(2, 3)', NULL,
    'B',
    'M = ((2+6)/2, (4+10)/2) = (4, 7).',
    'M = ((x₁+x₂)/2, (y₁+y₂)/2)',
    'ativa'
),

(
    'matematica', 3, 3, 'Geometria Analítica', 'Distância entre Pontos', 'facil',
    'Os pontos A(0, 0) e B(3, 4) distam entre si:',
    '3', '4', '5', '7', NULL,
    'C',
    'd = √(3² + 4²) = √(9 + 16) = √25 = 5. Triângulo pitagórico clássico 3-4-5.',
    'Lembre do triângulo 3-4-5',
    'ativa'
),

-- PONTO - Médios
(
    'matematica', 3, 3, 'Geometria Analítica', 'Condição de Alinhamento', 'medio',
    'Os pontos A(1, 1), B(3, 5) e C(4, k) são colineares. Qual o valor de k?',
    '5', '6', '7', '8', NULL,
    'C',
    'Coeficiente angular AB: (5-1)/(3-1) = 4/2 = 2. Para C: (k-1)/(4-1) = 2 → k-1 = 6 → k = 7.',
    'Pontos colineares têm mesma inclinação entre pares',
    'ativa'
),

(
    'matematica', 3, 3, 'Geometria Analítica', 'Baricentro', 'medio',
    'O baricentro do triângulo de vértices A(1, 2), B(3, 4) e C(5, 0) é:',
    '(2, 2)', '(3, 2)', '(3, 3)', '(4, 2)', NULL,
    'B',
    'G = ((1+3+5)/3, (2+4+0)/3) = (9/3, 6/3) = (3, 2).',
    'G = ((x₁+x₂+x₃)/3, (y₁+y₂+y₃)/3)',
    'ativa'
),

-- EQUAÇÃO DA RETA - Fáceis
(
    'matematica', 3, 3, 'Geometria Analítica', 'Equação da Reta', 'facil',
    'Qual a equação da reta que passa por (0, 3) com coeficiente angular 2?',
    'y = 2x + 3', 'y = 3x + 2', 'y = 2x - 3', 'y = x + 3', NULL,
    'A',
    'y = mx + n → y = 2x + 3 (m = 2, passa por (0,3) então n = 3).',
    'y = mx + n, onde m é a inclinação e n é o intercepto em y',
    'ativa'
),

(
    'matematica', 3, 3, 'Geometria Analítica', 'Coeficiente Angular', 'facil',
    'Qual o coeficiente angular da reta que passa por A(1, 3) e B(4, 9)?',
    '1', '2', '3', '6', NULL,
    'B',
    'm = (9-3)/(4-1) = 6/3 = 2.',
    'm = (y₂-y₁)/(x₂-x₁)',
    'ativa'
),

-- EQUAÇÃO DA RETA - Médias
(
    'matematica', 3, 3, 'Geometria Analítica', 'Equação da Reta', 'medio',
    'Qual a equação da reta que passa pelos pontos A(1, 2) e B(3, 8)?',
    'y = 3x - 1', 'y = 3x + 1', 'y = 2x', 'y = 2x + 1', NULL,
    'A',
    'm = (8-2)/(3-1) = 6/2 = 3. Usando ponto A: 2 = 3×1 + n → n = -1. Reta: y = 3x - 1.',
    'Calcule m e depois substitua um ponto para achar n',
    'ativa'
),

(
    'matematica', 3, 3, 'Geometria Analítica', 'Retas Paralelas', 'medio',
    'As retas y = 2x + 1 e y = 2x - 5 são:',
    'Concorrentes', 'Paralelas', 'Perpendiculares', 'Coincidentes', NULL,
    'B',
    'Retas com mesmo coeficiente angular (m = 2) e coeficientes lineares diferentes são paralelas.',
    'Paralelas: m₁ = m₂ e n₁ ≠ n₂',
    'ativa'
),

(
    'matematica', 3, 3, 'Geometria Analítica', 'Retas Perpendiculares', 'medio',
    'A reta perpendicular a y = 3x + 1 que passa pela origem tem equação:',
    'y = -3x', 'y = 3x', 'y = -x/3', 'y = x/3', NULL,
    'C',
    'Se m₁ = 3, então m₂ = -1/3 (perpendiculares: m₁ × m₂ = -1). Passa pela origem: y = -x/3.',
    'Perpendiculares: m₁ × m₂ = -1',
    'ativa'
),

-- EQUAÇÃO DA RETA - Difíceis
(
    'matematica', 3, 3, 'Geometria Analítica', 'Distância Ponto-Reta', 'dificil',
    'Qual a distância do ponto P(3, 1) à reta 3x + 4y - 10 = 0?',
    '1/5', '3/5', '1', '7/5', NULL,
    'B',
    'd = |3×3 + 4×1 - 10|/√(3² + 4²) = |9 + 4 - 10|/5 = 3/5.',
    'd = |ax₀ + by₀ + c|/√(a² + b²)',
    'ativa'
),

(
    'matematica', 3, 3, 'Geometria Analítica', 'Área de Triângulo', 'dificil',
    'Qual a área do triângulo de vértices A(0, 0), B(4, 0) e C(0, 6)?',
    '10', '12', '24', '6', NULL,
    'B',
    'Base AB = 4, Altura = 6. Área = (4 × 6)/2 = 12. Ou pelo determinante: |0(0-6) + 4(6-0) + 0(0-0)|/2 = 24/2 = 12.',
    'Triângulo retângulo com catetos nos eixos: Área = base × altura / 2',
    'ativa'
),

-- CIRCUNFERÊNCIA - Fáceis
(
    'matematica', 3, 3, 'Geometria Analítica', 'Circunferência', 'facil',
    'Qual a equação da circunferência de centro (0, 0) e raio 5?',
    'x² + y² = 5', 'x² + y² = 10', 'x² + y² = 25', 'x² + y² = 50', NULL,
    'C',
    'Equação: (x-a)² + (y-b)² = r². Com centro na origem: x² + y² = 25.',
    '(x-a)² + (y-b)² = r²',
    'ativa'
),

(
    'matematica', 3, 3, 'Geometria Analítica', 'Circunferência', 'facil',
    'A circunferência (x-2)² + (y+3)² = 16 tem centro e raio iguais a:',
    '(2, 3) e r = 4', '(2, -3) e r = 4', '(-2, 3) e r = 16', '(2, -3) e r = 16', NULL,
    'B',
    'Centro: (2, -3) — note o sinal invertido para y. Raio: r = √16 = 4.',
    'Centro (a, b) aparece como (x-a)² e (y-b)²; r² = 16 → r = 4',
    'ativa'
),

-- CIRCUNFERÊNCIA - Médias
(
    'matematica', 3, 3, 'Geometria Analítica', 'Circunferência', 'medio',
    'O ponto P(3, 4) pertence à circunferência x² + y² = 25?',
    'Sim, pois 3+4 = 7', 'Não, está fora', 'Sim, pois 9+16 = 25', 'Não, está dentro', NULL,
    'C',
    '3² + 4² = 9 + 16 = 25, que é igual ao raio². Logo, P pertence à circunferência.',
    'Substitua as coordenadas na equação e verifique',
    'ativa'
),

(
    'matematica', 3, 3, 'Geometria Analítica', 'Posição Relativa', 'medio',
    'A reta y = x + 1 e a circunferência x² + y² = 1 são:',
    'Secantes', 'Tangentes', 'Externas', 'Coincidentes', NULL,
    'A',
    'Substituindo y = x+1: x² + (x+1)² = 1 → 2x² + 2x = 0 → 2x(x+1) = 0 → x = 0 ou x = -1. Duas soluções distintas: a reta é secante à circunferência.',
    'Substitua a equação da reta na da circunferência',
    'ativa'
),

-- CIRCUNFERÊNCIA - Difíceis
(
    'matematica', 3, 3, 'Geometria Analítica', 'Circunferência', 'dificil',
    'A equação x² + y² - 6x + 4y - 12 = 0 representa uma circunferência. Qual seu raio?',
    '3', '4', '5', '25', NULL,
    'C',
    'Completando quadrados: (x²-6x+9) + (y²+4y+4) = 12+9+4 → (x-3)² + (y+2)² = 25. Raio = √25 = 5.',
    'Complete os quadrados para obter a forma (x-a)² + (y-b)² = r²',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 3ª SÉRIE - 4º BIMESTRE
-- Temas: Polinômios, Equações Polinomiais, Números Complexos
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

-- POLINÔMIOS - Fáceis
(
    'matematica', 3, 4, 'Polinômios', 'Grau do Polinômio', 'facil',
    'Qual o grau do polinômio P(x) = 3x⁴ - 2x² + x - 7?',
    '2', '3', '4', '7', NULL,
    'C',
    'O grau é o maior expoente da variável: 4.',
    'Grau = maior expoente',
    'ativa'
),

(
    'matematica', 3, 4, 'Polinômios', 'Valor Numérico', 'facil',
    'Se P(x) = x² - 3x + 2, qual o valor de P(4)?',
    '2', '4', '6', '8', NULL,
    'C',
    'P(4) = 16 - 12 + 2 = 6.',
    'Substitua x pelo valor dado',
    'ativa'
),

(
    'matematica', 3, 4, 'Polinômios', 'Raízes', 'facil',
    'As raízes do polinômio P(x) = x² - 5x + 6 são:',
    '1 e 6', '2 e 3', '-2 e -3', '-1 e -6', NULL,
    'B',
    'Δ = 25 - 24 = 1. x = (5 ± 1)/2 → x = 3 ou x = 2.',
    'Use a fórmula de Bhaskara ou fatore',
    'ativa'
),

-- POLINÔMIOS - Médios
(
    'matematica', 3, 4, 'Polinômios', 'Divisão', 'medio',
    'Na divisão de P(x) = x³ - 2x² + x - 3 por D(x) = x - 1, qual o resto?',
    '-3', '-2', '-1', '0', NULL,
    'A',
    'Pelo Teorema do Resto: R = P(1) = 1 - 2 + 1 - 3 = -3.',
    'Teorema do Resto: o resto da divisão por (x-a) é P(a)',
    'ativa'
),

(
    'matematica', 3, 4, 'Polinômios', 'Divisibilidade', 'medio',
    'Para que P(x) = x³ + 2x² - x + k seja divisível por (x + 1), o valor de k deve ser:',
    '-2', '0', '2', '4', NULL,
    'A',
    'P(-1) = 0 → (-1)³ + 2(-1)² - (-1) + k = 0 → -1 + 2 + 1 + k = 0 → k = -2.',
    'Divisível por (x-a) ↔ P(a) = 0',
    'ativa'
),

(
    'matematica', 3, 4, 'Polinômios', 'Operações', 'medio',
    'Se P(x) = 2x² + 3x - 1 e Q(x) = x² - x + 4, qual é P(x) + Q(x)?',
    '3x² + 2x + 3', '3x² + 4x + 3', '2x² + 2x + 3', '3x² + 2x + 5', NULL,
    'A',
    'P + Q = (2x²+x²) + (3x-x) + (-1+4) = 3x² + 2x + 3.',
    'Some os coeficientes de mesma potência',
    'ativa'
),

-- EQUAÇÕES POLINOMIAIS - Médias
(
    'matematica', 3, 4, 'Equações Polinomiais', 'Relações de Girard', 'medio',
    'As raízes de x³ - 6x² + 11x - 6 = 0 são 1, 2 e 3. Confirme: qual é a soma das raízes?',
    '3', '5', '6', '11', NULL,
    'C',
    'Pela relação de Girard, a soma das raízes = -(-6)/1 = 6. De fato: 1 + 2 + 3 = 6.',
    'Soma das raízes = -b/a (para ax³ + bx² + ...)',
    'ativa'
),

(
    'matematica', 3, 4, 'Equações Polinomiais', 'Relações de Girard', 'dificil',
    'Se as raízes de x³ + px² + qx - 6 = 0 são 1, 2 e 3, qual é o valor de p?',
    '-6', '-3', '6', '3', NULL,
    'A',
    'Soma das raízes: 1+2+3 = 6 = -p/1, logo p = -6.',
    'Soma das raízes = -p',
    'ativa'
),

-- NÚMEROS COMPLEXOS - Fáceis
(
    'matematica', 3, 4, 'Números Complexos', 'Unidade Imaginária', 'facil',
    'Qual o valor de i² (onde i é a unidade imaginária)?',
    '1', '-1', 'i', '-i', NULL,
    'B',
    'Por definição, i² = -1.',
    'i é a raiz quadrada de -1, então i² = -1',
    'ativa'
),

(
    'matematica', 3, 4, 'Números Complexos', 'Forma Algébrica', 'facil',
    'Qual a parte real e a parte imaginária do número complexo z = 3 + 5i?',
    'Real: 5, Imag: 3', 'Real: 3, Imag: 5', 'Real: 3, Imag: 5i', 'Real: 8, Imag: 0', NULL,
    'B',
    'z = a + bi → parte real a = 3, parte imaginária b = 5.',
    'z = a + bi: a é a parte real, b é a parte imaginária',
    'ativa'
),

(
    'matematica', 3, 4, 'Números Complexos', 'Potências de i', 'facil',
    'Qual o valor de i⁴?',
    'i', '-1', '-i', '1', NULL,
    'D',
    'i¹ = i, i² = -1, i³ = -i, i⁴ = 1. O ciclo se repete a cada 4.',
    'As potências de i têm ciclo de período 4',
    'ativa'
),

-- NÚMEROS COMPLEXOS - Médios
(
    'matematica', 3, 4, 'Números Complexos', 'Operações', 'medio',
    'Qual o resultado de (2 + 3i) + (4 - i)?',
    '6 + 2i', '6 + 4i', '8 + 2i', '6 - 2i', NULL,
    'A',
    '(2+4) + (3-1)i = 6 + 2i.',
    'Some partes reais e imaginárias separadamente',
    'ativa'
),

(
    'matematica', 3, 4, 'Números Complexos', 'Operações', 'medio',
    'Qual o resultado de (1 + 2i)(3 - i)?',
    '1 + 5i', '5 + 5i', '5 - 5i', '3 + 5i', NULL,
    'B',
    '(1+2i)(3-i) = 3 - i + 6i - 2i² = 3 + 5i - 2(-1) = 3 + 5i + 2 = 5 + 5i.',
    'Use a distributiva e lembre que i² = -1',
    'ativa'
),

(
    'matematica', 3, 4, 'Números Complexos', 'Conjugado', 'medio',
    'Qual o conjugado de z = 4 - 3i?',
    '4 + 3i', '-4 + 3i', '-4 - 3i', '3 - 4i', NULL,
    'A',
    'O conjugado troca o sinal da parte imaginária: z̄ = 4 + 3i.',
    'Conjugado: troca o sinal do i',
    'ativa'
),

(
    'matematica', 3, 4, 'Números Complexos', 'Módulo', 'medio',
    'Qual o módulo do número complexo z = 3 + 4i?',
    '5', '7', '25', '√7', NULL,
    'A',
    '|z| = √(3² + 4²) = √(9 + 16) = √25 = 5.',
    '|z| = √(a² + b²)',
    'ativa'
),

-- NÚMEROS COMPLEXOS - Difíceis
(
    'matematica', 3, 4, 'Números Complexos', 'Divisão', 'dificil',
    'Qual o resultado de (5 + i)/(2 - i)?',
    '2 + i', '9/5 + 7i/5', '3 + i', '11/5 + 3i/5', NULL,
    'B',
    '(5+i)/(2-i) × (2+i)/(2+i) = (10 + 5i + 2i + i²)/(4+1) = (10 + 7i - 1)/5 = (9 + 7i)/5 = 9/5 + 7i/5.',
    'Multiplique pelo conjugado do denominador',
    'ativa'
),

(
    'matematica', 3, 4, 'Números Complexos', 'Potências de i', 'dificil',
    'Qual o valor de i²⁰²⁵?',
    '1', '-1', 'i', '-i', NULL,
    'C',
    '2025 = 4 × 506 + 1. Como o ciclo de i tem período 4, i²⁰²⁵ = i¹ = i.',
    'Divida o expoente por 4 e use o resto',
    'ativa'
),

(
    'matematica', 3, 4, 'Números Complexos', 'Equação', 'dificil',
    'Resolva z² = -9. As soluções são:',
    'z = ±3', 'z = ±3i', 'z = 3i', 'z = -3i', NULL,
    'B',
    'z² = -9 → z = ±√(-9) = ±3i.',
    '√(-a) = i√a',
    'ativa'
);
