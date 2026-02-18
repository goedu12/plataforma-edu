-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES EXTRAS DE MATEMÁTICA - ENSINO MÉDIO (1ª e 2ª SÉRIE)
-- Mais questões para expandir o banco de dados
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - QUESTÕES EXTRAS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

-- 1º BIMESTRE - CONJUNTOS E FUNÇÃO AFIM (extras)
(
    'matematica', 1, 1, 'Conjuntos', 'Complementar', 'medio',
    'Se U = {1, 2, 3, 4, 5, 6, 7, 8} e A = {2, 4, 6, 8}, qual é o complementar de A em relação a U?',
    '{1, 3, 5, 7}', '{2, 4, 6, 8}', '{1, 2, 3, 4}', '{5, 6, 7, 8}', NULL,
    'A',
    'O complementar de A contém os elementos de U que não estão em A: {1, 3, 5, 7}.',
    'Complementar = U - A',
    'ativa'
),

(
    'matematica', 1, 1, 'Conjuntos', 'Diferença', 'medio',
    'Se A = {1, 2, 3, 4, 5} e B = {3, 4, 5, 6, 7}, qual é A - B?',
    '{1, 2}', '{6, 7}', '{3, 4, 5}', '{1, 2, 6, 7}', NULL,
    'A',
    'A - B contém os elementos de A que não estão em B: {1, 2}.',
    'Diferença: elementos de A que não pertencem a B',
    'ativa'
),

(
    'matematica', 1, 1, 'Função Afim', 'Gráfico', 'facil',
    'O gráfico de uma função afim é sempre:',
    'Uma parábola', 'Uma reta', 'Uma hipérbole', 'Um círculo', NULL,
    'B',
    'O gráfico de f(x) = ax + b é sempre uma reta.',
    'Afim = 1º grau = reta',
    'ativa'
),

(
    'matematica', 1, 1, 'Função Afim', 'Problemas', 'medio',
    'O preço de uma corrida de táxi é dado por P(x) = 3,50x + 5, onde x é a distância em km. Qual o preço de uma corrida de 10 km?',
    'R$ 35,00', 'R$ 40,00', 'R$ 45,00', 'R$ 50,00', NULL,
    'B',
    'P(10) = 3,50 × 10 + 5 = 35 + 5 = 40 reais.',
    'Substitua x = 10',
    'ativa'
),

(
    'matematica', 1, 1, 'Função Afim', 'Inversa', 'dificil',
    'Qual a inversa da função f(x) = 2x - 6?',
    'f⁻¹(x) = (x + 6)/2', 'f⁻¹(x) = (x - 6)/2', 'f⁻¹(x) = 2x + 6', 'f⁻¹(x) = -2x + 6', NULL,
    'A',
    'y = 2x - 6 → x = (y + 6)/2 → f⁻¹(x) = (x + 6)/2.',
    'Troque x por y e isole',
    'ativa'
),

-- 2º BIMESTRE - FUNÇÃO QUADRÁTICA (extras)
(
    'matematica', 1, 2, 'Função Quadrática', 'Natureza das Raízes', 'medio',
    'Se Δ > 0, a equação do 2º grau possui:',
    'Nenhuma raiz real', 'Uma raiz real', 'Duas raízes reais diferentes', 'Duas raízes reais iguais', NULL,
    'C',
    'Δ > 0: duas raízes reais e distintas. Δ = 0: duas raízes iguais. Δ < 0: nenhuma raiz real.',
    'Δ positivo = duas raízes distintas',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Soma e Produto', 'medio',
    'Se x₁ e x₂ são raízes de x² - 8x + 15 = 0, qual o valor de x₁ + x₂?',
    '-8', '8', '15', '-15', NULL,
    'B',
    'Soma das raízes = -b/a = -(-8)/1 = 8.',
    'Soma = -b/a',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Soma e Produto', 'medio',
    'Se x₁ e x₂ são raízes de x² - 8x + 15 = 0, qual o valor de x₁ × x₂?',
    '-8', '8', '15', '-15', NULL,
    'C',
    'Produto das raízes = c/a = 15/1 = 15.',
    'Produto = c/a',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Fatoração', 'medio',
    'Fatore: x² - 5x + 6',
    '(x - 2)(x - 3)', '(x + 2)(x + 3)', '(x - 1)(x - 6)', '(x + 1)(x + 6)', NULL,
    'A',
    'Raízes: 2 e 3. Logo: x² - 5x + 6 = (x - 2)(x - 3).',
    'Encontre as raízes primeiro',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Problemas', 'dificil',
    'O lucro de uma empresa é dado por L(x) = -2x² + 120x - 1000, onde x é a quantidade vendida. Para qual quantidade o lucro é máximo?',
    '20', '30', '40', '60', NULL,
    'B',
    'xv = -b/2a = -120/2(-2) = -120/-4 = 30.',
    'Lucro máximo no vértice',
    'ativa'
),

(
    'matematica', 1, 2, 'Inequações', '2º Grau', 'dificil',
    'Resolva: x² - 6x + 8 ≤ 0',
    'x ≤ 2 ou x ≥ 4', '2 ≤ x ≤ 4', 'x < 2 ou x > 4', '2 < x < 4', NULL,
    'B',
    'Raízes: 2 e 4. Como a > 0, a parábola é negativa entre as raízes: 2 ≤ x ≤ 4.',
    'Onde a parábola está abaixo ou no eixo x',
    'ativa'
),

-- 3º BIMESTRE - EXPONENCIAL E LOGARITMO (extras)
(
    'matematica', 1, 3, 'Função Exponencial', 'Propriedades', 'facil',
    'Qual o valor de 5⁰?',
    '0', '1', '5', 'Indefinido', NULL,
    'B',
    'Todo número (exceto 0) elevado a 0 é igual a 1.',
    'a⁰ = 1 (a ≠ 0)',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Exponencial', 'Propriedades', 'facil',
    'Simplifique: 2⁻³',
    '-8', '-6', '1/8', '8', NULL,
    'C',
    '2⁻³ = 1/2³ = 1/8.',
    'Expoente negativo: inverte a base',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Exponencial', 'Equações', 'medio',
    'Resolva: 3^(x+1) = 27',
    'x = 1', 'x = 2', 'x = 3', 'x = 8', NULL,
    'B',
    '27 = 3³. Então: 3^(x+1) = 3³ → x + 1 = 3 → x = 2.',
    'Escreva 27 como potência de 3',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Exponencial', 'Problemas', 'dificil',
    'Um capital de R$ 1000 é aplicado a uma taxa de 10% a.a. Qual será o montante após 2 anos (juros compostos)?',
    'R$ 1100', 'R$ 1200', 'R$ 1210', 'R$ 1331', NULL,
    'C',
    'M = C(1 + i)^t = 1000(1,1)² = 1000 × 1,21 = 1210.',
    'Juros compostos: M = C(1 + i)^t',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Logarítmica', 'Propriedades', 'medio',
    'Calcule: log₂ 32',
    '4', '5', '6', '16', NULL,
    'B',
    '2^x = 32 = 2⁵, logo log₂ 32 = 5.',
    '2 elevado a quanto dá 32?',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Logarítmica', 'Propriedades', 'medio',
    'Simplifique: log 100 - log 10 (base 10)',
    '0', '1', '10', '90', NULL,
    'B',
    'log 100 - log 10 = log(100/10) = log 10 = 1.',
    'log a - log b = log(a/b)',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Logarítmica', 'Propriedades', 'dificil',
    'Simplifique: 2log₃ 9',
    '2', '4', '6', '18', NULL,
    'B',
    '2log₃ 9 = log₃ 9² = log₃ 81 = 4 (pois 3⁴ = 81).',
    'n × log a = log aⁿ',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Logarítmica', 'Equações', 'dificil',
    'Resolva: log₅(3x - 1) = 2',
    'x = 8', 'x = 9', 'x = 26/3', 'x = 25/3', NULL,
    'C',
    'log₅(3x - 1) = 2 → 3x - 1 = 5² → 3x - 1 = 25 → 3x = 26 → x = 26/3.',
    'Converta para forma exponencial',
    'ativa'
),

-- 4º BIMESTRE - PA e PG (extras)
(
    'matematica', 1, 4, 'Progressão Aritmética', 'Identificação', 'facil',
    'Qual sequência é uma PA?',
    '(1, 2, 4, 8)', '(2, 4, 6, 8)', '(1, 1, 2, 3, 5)', '(1, 4, 9, 16)', NULL,
    'B',
    '(2, 4, 6, 8) tem razão constante r = 2.',
    'PA: diferença constante',
    'ativa'
),

(
    'matematica', 1, 4, 'Progressão Aritmética', 'Problemas', 'medio',
    'A soma de uma PA é 100, o primeiro termo é 5 e a razão é 3. Quantos termos tem essa PA?',
    '6', '7', '8', '10', NULL,
    'C',
    'Sn = n(2a₁ + (n-1)r)/2. 100 = n(10 + 3n - 3)/2 → 200 = n(7 + 3n) → 3n² + 7n - 200 = 0. n = 8.',
    'Use a fórmula da soma',
    'ativa'
),

(
    'matematica', 1, 4, 'Progressão Geométrica', 'Identificação', 'facil',
    'Qual sequência é uma PG?',
    '(1, 3, 5, 7)', '(2, 5, 8, 11)', '(3, 9, 27, 81)', '(1, 2, 4, 7)', NULL,
    'C',
    '(3, 9, 27, 81) tem razão constante q = 3.',
    'PG: razão (quociente) constante',
    'ativa'
),

(
    'matematica', 1, 4, 'Progressão Geométrica', 'Problemas', 'dificil',
    'A soma dos 3 primeiros termos de uma PG é 21 e a razão é 2. Qual o primeiro termo?',
    '2', '3', '4', '6', NULL,
    'B',
    'S₃ = a₁(q³-1)/(q-1) → 21 = a₁(8-1)/(2-1) = 7a₁ → a₁ = 3.',
    'Use a fórmula da soma da PG',
    'ativa'
),

(
    'matematica', 1, 4, 'Progressão Aritmética', 'Termo Médio', 'medio',
    'Em uma PA, se a₃ = 7 e a₇ = 19, qual o valor de a₅?',
    '11', '12', '13', '14', NULL,
    'C',
    'Em uma PA, o termo médio é a média aritmética dos extremos: a₅ = (a₃ + a₇)/2 = (7 + 19)/2 = 13.',
    'Termo médio = média dos extremos equidistantes',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - QUESTÕES EXTRAS
-- ═══════════════════════════════════════════════════════════════════════════

-- 1º BIMESTRE - TRIGONOMETRIA E MATRIZES (extras)
(
    'matematica', 2, 1, 'Trigonometria', 'Ângulos Notáveis', 'facil',
    'Qual o valor de sen 90°?',
    '0', '1/2', '√2/2', '1', NULL,
    'D',
    'sen 90° = 1 é um valor fundamental.',
    'Máximo do seno',
    'ativa'
),

(
    'matematica', 2, 1, 'Trigonometria', 'Ângulos Notáveis', 'facil',
    'Qual o valor de cos 0°?',
    '0', '1/2', '√2/2', '1', NULL,
    'D',
    'cos 0° = 1 é um valor fundamental.',
    'Máximo do cosseno',
    'ativa'
),

(
    'matematica', 2, 1, 'Trigonometria', 'Arcos', 'medio',
    'Qual o valor de sen 120°?',
    '1/2', '-1/2', '√3/2', '-√3/2', NULL,
    'C',
    'sen 120° = sen(180° - 60°) = sen 60° = √3/2.',
    '120° está no 2º quadrante (sen positivo)',
    'ativa'
),

(
    'matematica', 2, 1, 'Trigonometria', 'Arcos', 'medio',
    'Qual o valor de cos 150°?',
    '1/2', '-1/2', '√3/2', '-√3/2', NULL,
    'D',
    'cos 150° = cos(180° - 30°) = -cos 30° = -√3/2.',
    '150° está no 2º quadrante (cos negativo)',
    'ativa'
),

(
    'matematica', 2, 1, 'Trigonometria', 'Identidades', 'dificil',
    'Sabendo que sec²x = 1 + tg²x, simplifique: sec²x - tg²x',
    '0', '1', 'sen²x', 'cos²x', NULL,
    'B',
    'Pela identidade fundamental: sec²x = 1 + tg²x. Logo: sec²x - tg²x = (1 + tg²x) - tg²x = 1.',
    'Use a identidade sec²x = 1 + tg²x',
    'ativa'
),

(
    'matematica', 2, 1, 'Matrizes', 'Tipos', 'facil',
    'Uma matriz identidade 2×2 é:',
    '[[1, 1], [1, 1]]', '[[1, 0], [0, 1]]', '[[0, 0], [0, 0]]', '[[2, 0], [0, 2]]', NULL,
    'B',
    'A matriz identidade tem 1 na diagonal principal e 0 nas demais posições.',
    '1 na diagonal, 0 no resto',
    'ativa'
),

(
    'matematica', 2, 1, 'Matrizes', 'Operações', 'medio',
    'Se A = [[2, 3], [1, 4]], qual o valor de a₁₁ + a₂₂?',
    '5', '6', '7', '10', NULL,
    'B',
    'a₁₁ = 2 e a₂₂ = 4. Soma = 2 + 4 = 6.',
    'Diagonal principal',
    'ativa'
),

(
    'matematica', 2, 1, 'Matrizes', 'Igualdade', 'medio',
    'Para que [[x, 2], [3, y]] = [[5, 2], [3, -1]], quais os valores de x e y?',
    'x = 5, y = -1', 'x = 2, y = 3', 'x = -1, y = 5', 'x = 3, y = 2', NULL,
    'A',
    'Matrizes iguais: elementos correspondentes iguais. x = 5 e y = -1.',
    'Compare posição por posição',
    'ativa'
),

-- 2º BIMESTRE - DETERMINANTES E SISTEMAS (extras)
(
    'matematica', 2, 2, 'Determinantes', 'Propriedades', 'facil',
    'Se uma linha de uma matriz é formada só por zeros, o determinante é:',
    'Indefinido', '1', '0', 'Infinito', NULL,
    'C',
    'Linha (ou coluna) de zeros → determinante = 0.',
    'Zero na linha = det zero',
    'ativa'
),

(
    'matematica', 2, 2, 'Determinantes', 'Propriedades', 'medio',
    'Se det(A) = 3, qual o valor de det(A^t) (determinante da transposta)?',
    '1/3', '3', '9', '-3', NULL,
    'B',
    'O determinante de uma matriz é igual ao determinante de sua transposta.',
    'det(A) = det(A^t)',
    'ativa'
),

(
    'matematica', 2, 2, 'Determinantes', 'Propriedades', 'medio',
    'Se det(A) = 2 e det(B) = 5, qual o valor de det(AB)?',
    '7', '10', '3', '25', NULL,
    'B',
    'det(AB) = det(A) × det(B) = 2 × 5 = 10.',
    'det(AB) = det(A) × det(B)',
    'ativa'
),

(
    'matematica', 2, 2, 'Sistemas Lineares', 'Escalonamento', 'medio',
    'Ao escalonar um sistema, se obtivermos uma linha 0 = 5, o sistema é:',
    'SPD', 'SPI', 'SI', 'Indeterminado', NULL,
    'C',
    'Uma equação impossível (0 = 5) indica Sistema Impossível (SI).',
    '0 = número não nulo → impossível',
    'ativa'
),

(
    'matematica', 2, 2, 'Sistemas Lineares', 'Homogêneo', 'dificil',
    'Um sistema linear homogêneo (termos independentes todos zero) sempre admite:',
    'Infinitas soluções', 'Uma única solução', 'A solução trivial', 'Nenhuma solução', NULL,
    'C',
    'Sistemas homogêneos sempre admitem pelo menos a solução trivial (x = y = z = ... = 0).',
    'x = 0, y = 0, ... é sempre solução',
    'ativa'
),

-- 3º BIMESTRE - GEOMETRIA ANALÍTICA (extras)
(
    'matematica', 2, 3, 'Geometria Analítica', 'Baricentro', 'medio',
    'Qual o baricentro do triângulo de vértices A(1, 2), B(4, 5) e C(7, 2)?',
    '(3, 3)', '(4, 3)', '(4, 4)', '(3, 4)', NULL,
    'B',
    'G = ((1+4+7)/3, (2+5+2)/3) = (12/3, 9/3) = (4, 3).',
    'Média das coordenadas',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Analítica', 'Área de Triângulo', 'dificil',
    'Qual a área do triângulo de vértices A(0, 0), B(4, 0) e C(0, 3)?',
    '6', '7', '12', '24', NULL,
    'A',
    'Triângulo retângulo com catetos 4 e 3. Área = (4 × 3)/2 = 6.',
    'Triângulo retângulo: A = (b × h)/2',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Analítica', 'Equação da Reta', 'medio',
    'Qual a equação da reta que passa por (2, 3) e (4, 7)?',
    'y = 2x - 1', 'y = 2x + 1', 'y = x + 1', 'y = 3x - 3', NULL,
    'A',
    'm = (7-3)/(4-2) = 2. Usando ponto (2,3): 3 = 2(2) + b → b = -1. y = 2x - 1.',
    'Calcule m e depois b',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Analítica', 'Retas', 'medio',
    'As retas 2x + y = 5 e 4x + 2y = 7 são:',
    'Paralelas', 'Coincidentes', 'Perpendiculares', 'Concorrentes', NULL,
    'A',
    'Ambas têm m = -2. Não são coincidentes (constantes diferentes). São paralelas.',
    'Mesmo coeficiente angular, constantes diferentes',
    'ativa'
),

-- 4º BIMESTRE - CIRCUNFERÊNCIA E GEOMETRIA ESPACIAL (extras)
(
    'matematica', 2, 4, 'Geometria Analítica', 'Circunferência', 'medio',
    'Qual a equação da circunferência de centro na origem e raio 5?',
    'x² + y² = 5', 'x² + y² = 25', '(x-5)² + (y-5)² = 25', 'x² + y² = 10', NULL,
    'B',
    'Centro (0,0) e r = 5: x² + y² = 25.',
    'Centro na origem: x² + y² = r²',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Analítica', 'Tangente', 'dificil',
    'A reta y = 3 é tangente à circunferência x² + y² = 9. A que distância do centro está o ponto de tangência?',
    '0', '3', '6', '9', NULL,
    'B',
    'O ponto de tangência está na reta y = 3. Substituindo: x² + 9 = 9 → x = 0. Ponto: (0, 3). Distância do centro (0,0): 3.',
    'A tangente toca a circunferência em um ponto',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Espacial', 'Prismas', 'facil',
    'Um cubo tem aresta 4 cm. Qual seu volume?',
    '16 cm³', '32 cm³', '64 cm³', '256 cm³', NULL,
    'C',
    'V = a³ = 4³ = 64 cm³.',
    'Volume do cubo = aresta ao cubo',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Espacial', 'Prismas', 'medio',
    'Um prisma tem base triangular com área 20 cm² e altura 15 cm. Qual seu volume?',
    '35 cm³', '150 cm³', '300 cm³', '600 cm³', NULL,
    'C',
    'V = Ab × h = 20 × 15 = 300 cm³.',
    'Volume do prisma = Área da base × altura',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Espacial', 'Esfera', 'medio',
    'Qual a área da superfície de uma esfera de raio 2 cm? (Use π = 3)',
    '24 cm²', '36 cm²', '48 cm²', '96 cm²', NULL,
    'C',
    'A = 4πr² = 4 × 3 × 4 = 48 cm².',
    'Área da esfera = 4πr²',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Espacial', 'Cilindro', 'dificil',
    'A área lateral de um cilindro de raio 3 cm e altura 10 cm é: (Use π = 3,14)',
    '94,2 cm²', '188,4 cm²', '282,6 cm²', '376,8 cm²', NULL,
    'B',
    'A lateral = 2πrh = 2 × 3,14 × 3 × 10 = 188,4 cm².',
    'A lateral = perímetro da base × altura',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES CONTEXTUALIZADAS (ENEM style)
-- ═══════════════════════════════════════════════════════════════════════════

(
    'matematica', 1, NULL, 'Função Afim', 'Problemas', 'medio',
    'Uma empresa de streaming cobra R$ 29,90 mensais mais R$ 4,00 por filme alugado. Se João gastou R$ 49,90 em um mês, quantos filmes ele alugou?',
    '3', '4', '5', '6', NULL,
    'C',
    '29,90 + 4x = 49,90 → 4x = 20 → x = 5 filmes.',
    'Monte a equação com os dados',
    'ativa'
),

(
    'matematica', 1, NULL, 'Função Quadrática', 'Problemas', 'dificil',
    'A altura h de uma bola lançada é dada por h(t) = -4t² + 16t, onde t é o tempo em segundos. Em qual instante a bola atinge a altura máxima?',
    't = 1 s', 't = 2 s', 't = 4 s', 't = 8 s', NULL,
    'B',
    'tv = -b/2a = -16/(-8) = 2 segundos.',
    'Altura máxima no vértice',
    'ativa'
),

(
    'matematica', 1, NULL, 'Progressão Geométrica', 'Problemas', 'dificil',
    'Uma bola é solta de 2 m de altura e, a cada quique, atinge 50% da altura anterior. Qual a altura do terceiro quique?',
    '0,25 m', '0,5 m', '0,125 m', '1 m', NULL,
    'A',
    'PG: a₁ = 1 m (1º quique), q = 0,5. a₃ = 1 × 0,5² = 0,25 m.',
    'Cada quique = 50% do anterior',
    'ativa'
),

(
    'matematica', 2, NULL, 'Trigonometria', 'Problemas', 'medio',
    'Uma escada de 5 m está apoiada em uma parede, formando 60° com o solo. A que altura da parede a escada toca?',
    '2,5 m', '2,5√3 m', '5 m', '5√3 m', NULL,
    'B',
    'sen 60° = h/5 → h = 5 × sen 60° = 5 × (√3/2) = 2,5√3 m.',
    'Use seno: oposto/hipotenusa',
    'ativa'
),

(
    'matematica', 2, NULL, 'Geometria Espacial', 'Problemas', 'medio',
    'Uma caixa dágua cilíndrica tem raio 1 m e altura 2 m. Qual sua capacidade em litros? (Use π = 3,14)',
    '3140 L', '6280 L', '1570 L', '12560 L', NULL,
    'B',
    'V = πr²h = 3,14 × 1 × 2 = 6,28 m³ = 6280 litros.',
    '1 m³ = 1000 litros',
    'ativa'
),

(
    'matematica', 2, NULL, 'Matrizes', 'Problemas', 'medio',
    'Uma loja vende 3 tipos de produtos com preços P = [10, 20, 15] reais. Se um cliente comprou Q = [2, 1, 4] unidades de cada, qual o total gasto?',
    'R$ 100', 'R$ 80', 'R$ 95', 'R$ 120', NULL,
    'A',
    'Total = 10×2 + 20×1 + 15×4 = 20 + 20 + 60 = 100 reais.',
    'Multiplique e some',
    'ativa'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
    'Matemática EM' as componente,
    ano as serie,
    COUNT(*) as total_questoes
FROM questoes
WHERE componente = 'matematica' AND ano IN (1, 2) AND status = 'ativa'
GROUP BY ano
ORDER BY ano;

SELECT
    ano as serie,
    bimestre,
    COUNT(*) as questoes
FROM questoes
WHERE componente = 'matematica' AND ano IN (1, 2) AND status = 'ativa'
GROUP BY ano, bimestre
ORDER BY ano, bimestre;
