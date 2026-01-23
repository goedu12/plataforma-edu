-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES DE MATEMÁTICA - ENSINO MÉDIO (1ª e 2ª SÉRIE)
-- Questões para os modos: Estudar, Desafio e Revisão
-- Execute após as migrations de estrutura de banco
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 1º BIMESTRE
-- Temas: Conjuntos, Funções (Conceitos), Função Afim
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

-- CONJUNTOS - Fáceis
(
    'matematica', 1, 1, 'Conjuntos', 'Operações com Conjuntos', 'facil',
    'Se A = {1, 2, 3, 4} e B = {3, 4, 5, 6}, qual é A ∩ B (interseção)?',
    '{1, 2}', '{3, 4}', '{5, 6}', '{1, 2, 3, 4, 5, 6}', NULL,
    'B',
    'A interseção contém os elementos que pertencem a ambos os conjuntos. Os elementos comuns são 3 e 4.',
    'Interseção = elementos em comum',
    'ativa'
),

(
    'matematica', 1, 1, 'Conjuntos', 'Operações com Conjuntos', 'facil',
    'Se A = {1, 2, 3} e B = {2, 3, 4}, qual é A ∪ B (união)?',
    '{2, 3}', '{1, 4}', '{1, 2, 3, 4}', '{1, 2, 2, 3, 3, 4}', NULL,
    'C',
    'A união contém todos os elementos de ambos os conjuntos, sem repetição: {1, 2, 3, 4}.',
    'União = todos os elementos, sem repetir',
    'ativa'
),

(
    'matematica', 1, 1, 'Conjuntos', 'Pertinência', 'facil',
    'Dado o conjunto A = {x ∈ ℕ | x < 5}, qual das alternativas representa corretamente o conjunto A?',
    '{1, 2, 3, 4}', '{0, 1, 2, 3, 4}', '{1, 2, 3, 4, 5}', '{0, 1, 2, 3, 4, 5}', NULL,
    'B',
    'ℕ inclui o zero. Os naturais menores que 5 são: 0, 1, 2, 3, 4.',
    'Lembre-se: 0 pertence aos naturais',
    'ativa'
),

-- CONJUNTOS - Médias
(
    'matematica', 1, 1, 'Conjuntos', 'Diagrama de Venn', 'medio',
    'Em uma turma de 40 alunos, 25 gostam de futebol, 20 gostam de vôlei e 10 gostam dos dois esportes. Quantos alunos não gostam de nenhum dos dois?',
    '5', '10', '15', '25', NULL,
    'A',
    'Pelo princípio da inclusão-exclusão: n(F ∪ V) = 25 + 20 - 10 = 35. Não gostam de nenhum: 40 - 35 = 5.',
    'Use: n(A ∪ B) = n(A) + n(B) - n(A ∩ B)',
    'ativa'
),

(
    'matematica', 1, 1, 'Conjuntos', 'Subconjuntos', 'medio',
    'Quantos subconjuntos possui o conjunto A = {a, b, c}?',
    '3', '6', '8', '9', NULL,
    'C',
    'Um conjunto com n elementos possui 2^n subconjuntos. Como n = 3, temos 2³ = 8 subconjuntos.',
    'Número de subconjuntos = 2^n',
    'ativa'
),

-- FUNÇÃO AFIM - Fáceis
(
    'matematica', 1, 1, 'Função Afim', 'Lei da Função', 'facil',
    'Na função f(x) = 3x - 5, qual o valor de f(2)?',
    '1', '-1', '6', '11', NULL,
    'A',
    'f(2) = 3(2) - 5 = 6 - 5 = 1.',
    'Substitua x por 2',
    'ativa'
),

(
    'matematica', 1, 1, 'Função Afim', 'Coeficientes', 'facil',
    'Na função f(x) = -2x + 7, quais são o coeficiente angular e o coeficiente linear?',
    'a = -2, b = 7', 'a = 7, b = -2', 'a = 2, b = -7', 'a = -7, b = 2', NULL,
    'A',
    'Na forma f(x) = ax + b, a é o coeficiente angular (-2) e b é o coeficiente linear (7).',
    'f(x) = ax + b',
    'ativa'
),

(
    'matematica', 1, 1, 'Função Afim', 'Zero da Função', 'facil',
    'Qual o zero (raiz) da função f(x) = 2x - 8?',
    'x = 2', 'x = 4', 'x = 8', 'x = -4', NULL,
    'B',
    'Zero: f(x) = 0 → 2x - 8 = 0 → 2x = 8 → x = 4.',
    'Faça f(x) = 0 e resolva',
    'ativa'
),

-- FUNÇÃO AFIM - Médias
(
    'matematica', 1, 1, 'Função Afim', 'Gráfico', 'medio',
    'Uma função afim passa pelos pontos (0, 3) e (2, 7). Qual é a lei dessa função?',
    'f(x) = 2x + 3', 'f(x) = 3x + 2', 'f(x) = 2x - 3', 'f(x) = x + 3', NULL,
    'A',
    'Coef. angular: a = (7-3)/(2-0) = 4/2 = 2. Coef. linear: b = 3 (ponto onde x=0). Logo, f(x) = 2x + 3.',
    'Use dois pontos para encontrar a e b',
    'ativa'
),

(
    'matematica', 1, 1, 'Função Afim', 'Crescimento', 'medio',
    'Qual das funções abaixo é DECRESCENTE?',
    'f(x) = 2x + 1', 'f(x) = x - 5', 'f(x) = -3x + 2', 'f(x) = 0,5x', NULL,
    'C',
    'Uma função afim é decrescente quando o coeficiente angular é negativo. Em f(x) = -3x + 2, a = -3 < 0.',
    'Função decrescente: a < 0',
    'ativa'
),

-- FUNÇÃO AFIM - Difíceis
(
    'matematica', 1, 1, 'Função Afim', 'Problemas', 'dificil',
    'Um táxi cobra R$ 5,00 de bandeirada mais R$ 2,50 por km rodado. Qual a função que representa o valor V em função da distância d (em km)?',
    'V(d) = 5d + 2,5', 'V(d) = 2,5d + 5', 'V(d) = 7,5d', 'V(d) = 5d - 2,5', NULL,
    'B',
    'Valor fixo (bandeirada) = R$ 5,00. Valor variável = R$ 2,50 por km. Logo: V(d) = 2,5d + 5.',
    'Identifique a parte fixa e a variável',
    'ativa'
),

(
    'matematica', 1, 1, 'Função Afim', 'Problemas', 'dificil',
    'As funções f(x) = 2x - 3 e g(x) = -x + 6 se interceptam em qual ponto?',
    '(3, 3)', '(2, 1)', '(1, -1)', '(3, 6)', NULL,
    'A',
    'No ponto de interseção: 2x - 3 = -x + 6 → 3x = 9 → x = 3. Substituindo: f(3) = 2(3) - 3 = 3. Ponto: (3, 3).',
    'Iguale as duas funções',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 2º BIMESTRE
-- Temas: Função Quadrática, Inequações
-- ═══════════════════════════════════════════════════════════════════════════

-- FUNÇÃO QUADRÁTICA - Fáceis
(
    'matematica', 1, 2, 'Função Quadrática', 'Raízes', 'facil',
    'Quais são as raízes da equação x² - 5x + 6 = 0?',
    'x = 2 e x = 3', 'x = -2 e x = -3', 'x = 1 e x = 6', 'x = -1 e x = -6', NULL,
    'A',
    'Soma = 5, Produto = 6. Os números que satisfazem são 2 e 3.',
    'Use soma e produto das raízes',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Discriminante', 'facil',
    'Qual o valor de Δ (delta) para a equação x² - 4x + 4 = 0?',
    '0', '8', '16', '-8', NULL,
    'A',
    'Δ = b² - 4ac = (-4)² - 4(1)(4) = 16 - 16 = 0.',
    'Δ = b² - 4ac',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Concavidade', 'facil',
    'A parábola y = -2x² + 3x - 1 tem concavidade voltada para:',
    'Cima', 'Baixo', 'Direita', 'Esquerda', NULL,
    'B',
    'Quando a < 0, a parábola tem concavidade voltada para baixo. Como a = -2 < 0, a concavidade é para baixo.',
    'a > 0: para cima; a < 0: para baixo',
    'ativa'
),

-- FUNÇÃO QUADRÁTICA - Médias
(
    'matematica', 1, 2, 'Função Quadrática', 'Vértice', 'medio',
    'Qual o vértice da parábola y = x² - 6x + 5?',
    '(3, -4)', '(-3, -4)', '(3, 4)', '(-3, 4)', NULL,
    'A',
    'xv = -b/2a = 6/2 = 3. yv = 3² - 6(3) + 5 = 9 - 18 + 5 = -4. Vértice: (3, -4).',
    'xv = -b/2a',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Valor Máximo/Mínimo', 'medio',
    'Qual o valor máximo da função f(x) = -x² + 4x + 5?',
    '5', '9', '4', '-4', NULL,
    'B',
    'Como a = -1 < 0, o vértice é ponto de máximo. yv = -Δ/4a = -(-4)/4(-1) = 9. Ou: xv = 2, f(2) = -4 + 8 + 5 = 9.',
    'Máximo quando a < 0, no vértice',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Bhaskara', 'medio',
    'Resolva: 2x² - 7x + 3 = 0',
    'x = 3 e x = 1/2', 'x = 3 e x = 2', 'x = 1 e x = 3', 'x = -3 e x = -1/2', NULL,
    'A',
    'Δ = 49 - 24 = 25. x = (7 ± 5)/4. x1 = 12/4 = 3, x2 = 2/4 = 1/2.',
    'Use a fórmula de Bhaskara',
    'ativa'
),

-- FUNÇÃO QUADRÁTICA - Difíceis
(
    'matematica', 1, 2, 'Função Quadrática', 'Problemas', 'dificil',
    'Um projétil é lançado e sua altura h (em metros) é dada por h(t) = -5t² + 30t, onde t é o tempo em segundos. Qual a altura máxima atingida?',
    '30 m', '45 m', '90 m', '60 m', NULL,
    'B',
    'tv = -30/2(-5) = 3s. h(3) = -5(9) + 30(3) = -45 + 90 = 45 m.',
    'Altura máxima no vértice',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Problemas', 'dificil',
    'Determine m para que a equação x² - 4x + m = 0 tenha duas raízes reais e iguais.',
    'm = 4', 'm = -4', 'm = 2', 'm = 0', NULL,
    'A',
    'Raízes iguais: Δ = 0. 16 - 4m = 0 → m = 4.',
    'Raízes iguais significa Δ = 0',
    'ativa'
),

-- INEQUAÇÕES - Fáceis
(
    'matematica', 1, 2, 'Inequações', '1º Grau', 'facil',
    'Resolva: 2x - 6 > 0',
    'x > 3', 'x < 3', 'x > -3', 'x < -3', NULL,
    'A',
    '2x > 6 → x > 3.',
    'Isole x mantendo a desigualdade',
    'ativa'
),

(
    'matematica', 1, 2, 'Inequações', '1º Grau', 'facil',
    'Resolva: -3x + 9 ≤ 0',
    'x ≤ 3', 'x ≥ 3', 'x ≤ -3', 'x ≥ -3', NULL,
    'B',
    '-3x ≤ -9 → x ≥ 3 (inverte o sinal ao dividir por negativo).',
    'Cuidado: dividir por negativo inverte o sinal',
    'ativa'
),

-- INEQUAÇÕES - Médias
(
    'matematica', 1, 2, 'Inequações', '2º Grau', 'medio',
    'Resolva: x² - 9 < 0',
    '-3 < x < 3', 'x < -3 ou x > 3', 'x > 3', 'x < -3', NULL,
    'A',
    'x² < 9 → -3 < x < 3. A parábola é positiva fora das raízes (-3 e 3), logo é negativa entre elas.',
    'Analise o sinal da parábola',
    'ativa'
),

(
    'matematica', 1, 2, 'Inequações', '2º Grau', 'medio',
    'Para quais valores de x a função f(x) = x² - 4x + 3 é positiva?',
    '1 < x < 3', 'x < 1 ou x > 3', 'x > 3', 'x < 1', NULL,
    'B',
    'Raízes: x = 1 e x = 3. Como a > 0, f(x) > 0 fora das raízes: x < 1 ou x > 3.',
    'a > 0: parábola positiva fora das raízes',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 3º BIMESTRE
-- Temas: Função Exponencial, Função Logarítmica
-- ═══════════════════════════════════════════════════════════════════════════

-- FUNÇÃO EXPONENCIAL - Fáceis
(
    'matematica', 1, 3, 'Função Exponencial', 'Potências', 'facil',
    'Qual o valor de 2⁴?',
    '6', '8', '16', '32', NULL,
    'C',
    '2⁴ = 2 × 2 × 2 × 2 = 16.',
    'Multiplique a base 4 vezes',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Exponencial', 'Potências', 'facil',
    'Simplifique: 3² × 3³',
    '3⁵', '3⁶', '9⁵', '9⁶', NULL,
    'A',
    'Mesma base: soma os expoentes. 3² × 3³ = 3^(2+3) = 3⁵.',
    'Mesma base: soma expoentes',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Exponencial', 'Equações', 'facil',
    'Resolva: 2^x = 8',
    'x = 2', 'x = 3', 'x = 4', 'x = 8', NULL,
    'B',
    '8 = 2³, então 2^x = 2³ → x = 3.',
    'Escreva 8 como potência de 2',
    'ativa'
),

-- FUNÇÃO EXPONENCIAL - Médias
(
    'matematica', 1, 3, 'Função Exponencial', 'Equações', 'medio',
    'Resolva: 4^x = 32',
    'x = 2', 'x = 2,5', 'x = 3', 'x = 8', NULL,
    'B',
    '4^x = 32 → (2²)^x = 2⁵ → 2^(2x) = 2⁵ → 2x = 5 → x = 2,5.',
    'Reduza a mesma base',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Exponencial', 'Gráfico', 'medio',
    'A função f(x) = 2^x é crescente ou decrescente?',
    'Crescente', 'Decrescente', 'Constante', 'Nem crescente nem decrescente', NULL,
    'A',
    'Quando a base é maior que 1 (no caso, 2 > 1), a função exponencial é crescente.',
    'Base > 1: crescente; 0 < base < 1: decrescente',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Exponencial', 'Propriedades', 'medio',
    'Simplifique: (2³)² ÷ 2⁴',
    '2', '4', '2²', '2⁴', NULL,
    'C',
    '(2³)² = 2⁶. Logo: 2⁶ ÷ 2⁴ = 2^(6-4) = 2².',
    'Potência de potência: multiplica expoentes',
    'ativa'
),

-- FUNÇÃO LOGARÍTMICA - Fáceis
(
    'matematica', 1, 3, 'Função Logarítmica', 'Definição', 'facil',
    'Qual o valor de log₂ 8?',
    '2', '3', '4', '8', NULL,
    'B',
    'log₂ 8 = x significa 2^x = 8. Como 2³ = 8, então log₂ 8 = 3.',
    'Pense: 2 elevado a quanto dá 8?',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Logarítmica', 'Definição', 'facil',
    'Qual o valor de log₁₀ 100?',
    '1', '2', '10', '100', NULL,
    'B',
    'log₁₀ 100 = x significa 10^x = 100. Como 10² = 100, então log₁₀ 100 = 2.',
    '10 elevado a quanto dá 100?',
    'ativa'
),

-- FUNÇÃO LOGARÍTMICA - Médias
(
    'matematica', 1, 3, 'Função Logarítmica', 'Propriedades', 'medio',
    'Simplifique: log 2 + log 5 (base 10)',
    'log 7', 'log 10', '1', '2', NULL,
    'C',
    'log 2 + log 5 = log(2 × 5) = log 10 = 1.',
    'log a + log b = log(ab)',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Logarítmica', 'Propriedades', 'medio',
    'Calcule: log₃ 81',
    '2', '3', '4', '27', NULL,
    'C',
    'log₃ 81 = x significa 3^x = 81. Como 3⁴ = 81, então log₃ 81 = 4.',
    '3 elevado a quanto dá 81?',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Logarítmica', 'Equações', 'medio',
    'Resolva: log₂ x = 5',
    'x = 10', 'x = 25', 'x = 32', 'x = 64', NULL,
    'C',
    'log₂ x = 5 → x = 2⁵ = 32.',
    'Converta para forma exponencial',
    'ativa'
),

-- EXPONENCIAL/LOGARITMO - Difíceis
(
    'matematica', 1, 3, 'Função Exponencial', 'Problemas', 'dificil',
    'Uma população de bactérias dobra a cada hora. Se inicialmente há 100 bactérias, quantas haverá após 5 horas?',
    '500', '1000', '1600', '3200', NULL,
    'D',
    'P(t) = 100 × 2^t. P(5) = 100 × 2⁵ = 100 × 32 = 3200.',
    'Modelo exponencial: P = P₀ × 2^t',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Logarítmica', 'Propriedades', 'dificil',
    'Simplifique: log₂ 16 - log₂ 4 + log₂ 2',
    '2', '3', '4', '5', NULL,
    'B',
    'log₂ 16 = 4, log₂ 4 = 2, log₂ 2 = 1. Resultado: 4 - 2 + 1 = 3.',
    'Calcule cada logaritmo separadamente',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 4º BIMESTRE
-- Temas: Progressões Aritméticas (PA), Progressões Geométricas (PG)
-- ═══════════════════════════════════════════════════════════════════════════

-- PA - Fáceis
(
    'matematica', 1, 4, 'Progressão Aritmética', 'Razão', 'facil',
    'Na PA (2, 5, 8, 11, ...), qual é a razão?',
    '2', '3', '5', '8', NULL,
    'B',
    'Razão = diferença entre termos consecutivos: r = 5 - 2 = 3.',
    'r = a₂ - a₁',
    'ativa'
),

(
    'matematica', 1, 4, 'Progressão Aritmética', 'Termo Geral', 'facil',
    'Qual o 10º termo da PA (3, 7, 11, 15, ...)?',
    '35', '39', '43', '47', NULL,
    'B',
    'a₁ = 3, r = 4. a₁₀ = a₁ + (n-1)r = 3 + 9×4 = 3 + 36 = 39.',
    'aₙ = a₁ + (n-1)r',
    'ativa'
),

(
    'matematica', 1, 4, 'Progressão Aritmética', 'Termo Geral', 'facil',
    'Na PA em que a₁ = 5 e r = 3, qual o valor de a₅?',
    '14', '17', '20', '23', NULL,
    'B',
    'a₅ = 5 + (5-1)×3 = 5 + 12 = 17.',
    'aₙ = a₁ + (n-1)r',
    'ativa'
),

-- PA - Médias
(
    'matematica', 1, 4, 'Progressão Aritmética', 'Soma', 'medio',
    'Qual a soma dos 20 primeiros termos da PA (1, 3, 5, 7, ...)?',
    '200', '400', '380', '420', NULL,
    'B',
    'a₁ = 1, r = 2. a₂₀ = 1 + 19×2 = 39. S₂₀ = (a₁ + a₂₀)×n/2 = (1+39)×20/2 = 400.',
    'Sₙ = (a₁ + aₙ)×n/2',
    'ativa'
),

(
    'matematica', 1, 4, 'Progressão Aritmética', 'Interpolação', 'medio',
    'Quantos meios aritméticos existem entre 3 e 27 em uma PA de 7 termos?',
    '3', '4', '5', '6', NULL,
    'C',
    'Se a PA tem 7 termos, há 5 meios aritméticos entre o primeiro (3) e o último (27).',
    'Meios = total de termos - 2',
    'ativa'
),

-- PA - Difíceis
(
    'matematica', 1, 4, 'Progressão Aritmética', 'Problemas', 'dificil',
    'O primeiro termo de uma PA é 7 e a soma dos 10 primeiros termos é 250. Qual é a razão?',
    '4', '5', '6', '7', NULL,
    'A',
    'S₁₀ = (2a₁ + 9r)×10/2 → 250 = (14 + 9r)×5 → 50 = 14 + 9r → r = 4.',
    'Use a fórmula da soma',
    'ativa'
),

-- PG - Fáceis
(
    'matematica', 1, 4, 'Progressão Geométrica', 'Razão', 'facil',
    'Na PG (2, 6, 18, 54, ...), qual é a razão?',
    '2', '3', '4', '6', NULL,
    'B',
    'Razão = quociente entre termos consecutivos: q = 6/2 = 3.',
    'q = a₂/a₁',
    'ativa'
),

(
    'matematica', 1, 4, 'Progressão Geométrica', 'Termo Geral', 'facil',
    'Qual o 5º termo da PG (2, 4, 8, 16, ...)?',
    '24', '32', '64', '128', NULL,
    'B',
    'a₁ = 2, q = 2. a₅ = a₁ × q^(n-1) = 2 × 2⁴ = 2 × 16 = 32.',
    'aₙ = a₁ × q^(n-1)',
    'ativa'
),

-- PG - Médias
(
    'matematica', 1, 4, 'Progressão Geométrica', 'Termo Geral', 'medio',
    'Na PG em que a₁ = 3 e q = 2, qual o valor de a₆?',
    '48', '64', '96', '192', NULL,
    'C',
    'a₆ = 3 × 2^(6-1) = 3 × 2⁵ = 3 × 32 = 96.',
    'aₙ = a₁ × q^(n-1)',
    'ativa'
),

(
    'matematica', 1, 4, 'Progressão Geométrica', 'Soma', 'medio',
    'Qual a soma dos 5 primeiros termos da PG (1, 2, 4, 8, ...)?',
    '15', '31', '63', '127', NULL,
    'B',
    'Sₙ = a₁(q^n - 1)/(q - 1) = 1(2⁵ - 1)/(2-1) = 31.',
    'Sₙ = a₁(qⁿ - 1)/(q - 1)',
    'ativa'
),

-- PG - Difíceis
(
    'matematica', 1, 4, 'Progressão Geométrica', 'Problemas', 'dificil',
    'Em uma PG, a₂ = 6 e a₄ = 54. Qual é a razão?',
    '2', '3', '6', '9', NULL,
    'B',
    'a₄ = a₂ × q² → 54 = 6 × q² → q² = 9 → q = 3.',
    'Use a relação entre termos',
    'ativa'
),

(
    'matematica', 1, 4, 'Progressão Geométrica', 'Soma Infinita', 'dificil',
    'Qual a soma da PG infinita (1, 1/2, 1/4, 1/8, ...)?',
    '1', '2', '3', '4', NULL,
    'B',
    'PG decrescente: S∞ = a₁/(1-q) = 1/(1-0,5) = 1/0,5 = 2.',
    'S∞ = a₁/(1-q) quando |q| < 1',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 1º BIMESTRE
-- Temas: Trigonometria, Matrizes
-- ═══════════════════════════════════════════════════════════════════════════

-- TRIGONOMETRIA - Fáceis
(
    'matematica', 2, 1, 'Trigonometria', 'Razões Trigonométricas', 'facil',
    'Em um triângulo retângulo, se o cateto oposto mede 3 e a hipotenusa mede 5, qual o seno do ângulo?',
    '3/4', '3/5', '4/5', '5/3', NULL,
    'B',
    'sen = cateto oposto / hipotenusa = 3/5.',
    'SOH: Seno = Oposto / Hipotenusa',
    'ativa'
),

(
    'matematica', 2, 1, 'Trigonometria', 'Razões Trigonométricas', 'facil',
    'Qual o valor de sen 30°?',
    '1/2', '√2/2', '√3/2', '1', NULL,
    'A',
    'sen 30° = 1/2 é um valor notável da trigonometria.',
    'Memorize: sen 30° = 1/2',
    'ativa'
),

(
    'matematica', 2, 1, 'Trigonometria', 'Razões Trigonométricas', 'facil',
    'Qual o valor de cos 60°?',
    '1/2', '√2/2', '√3/2', '1', NULL,
    'A',
    'cos 60° = 1/2. Note que sen 30° = cos 60°.',
    'cos 60° = sen 30° = 1/2',
    'ativa'
),

-- TRIGONOMETRIA - Médias
(
    'matematica', 2, 1, 'Trigonometria', 'Identidades', 'medio',
    'Se sen θ = 0,6 e θ é um ângulo agudo, qual o valor de cos θ?',
    '0,4', '0,6', '0,8', '1,0', NULL,
    'C',
    'sen²θ + cos²θ = 1 → 0,36 + cos²θ = 1 → cos²θ = 0,64 → cosθ = 0,8.',
    'Use a identidade fundamental',
    'ativa'
),

(
    'matematica', 2, 1, 'Trigonometria', 'Ciclo Trigonométrico', 'medio',
    'Em qual quadrante o seno é positivo e o cosseno é negativo?',
    '1º quadrante', '2º quadrante', '3º quadrante', '4º quadrante', NULL,
    'B',
    'No 2º quadrante: sen > 0 e cos < 0.',
    'Memorize o sinal em cada quadrante',
    'ativa'
),

(
    'matematica', 2, 1, 'Trigonometria', 'Tangente', 'medio',
    'Se sen θ = 4/5 e cos θ = 3/5, qual o valor de tg θ?',
    '3/4', '4/3', '5/3', '5/4', NULL,
    'B',
    'tg θ = sen θ / cos θ = (4/5) / (3/5) = 4/3.',
    'tg = sen/cos',
    'ativa'
),

-- MATRIZES - Fáceis
(
    'matematica', 2, 1, 'Matrizes', 'Elementos', 'facil',
    'Na matriz A = [[1, 2, 3], [4, 5, 6]], qual o elemento a₂₃?',
    '3', '5', '6', '4', NULL,
    'C',
    'a₂₃ está na 2ª linha e 3ª coluna, que é o elemento 6.',
    'aᵢⱼ = linha i, coluna j',
    'ativa'
),

(
    'matematica', 2, 1, 'Matrizes', 'Soma', 'facil',
    'Se A = [[1, 2], [3, 4]] e B = [[5, 6], [7, 8]], qual o elemento da posição (1,1) de A + B?',
    '5', '6', '7', '8', NULL,
    'B',
    '(A + B)₁₁ = a₁₁ + b₁₁ = 1 + 5 = 6.',
    'Some elemento a elemento',
    'ativa'
),

-- MATRIZES - Médias
(
    'matematica', 2, 1, 'Matrizes', 'Multiplicação por Escalar', 'medio',
    'Se A = [[2, -1], [0, 3]] e k = 3, qual é a matriz 3A?',
    '[[6, -3], [0, 9]]', '[[5, 2], [3, 6]]', '[[6, -1], [0, 9]]', '[[2, -3], [0, 9]]', NULL,
    'A',
    '3A = [[3×2, 3×(-1)], [3×0, 3×3]] = [[6, -3], [0, 9]].',
    'Multiplique cada elemento por k',
    'ativa'
),

(
    'matematica', 2, 1, 'Matrizes', 'Transposta', 'medio',
    'Qual a transposta da matriz A = [[1, 2, 3], [4, 5, 6]]?',
    '[[1, 4], [2, 5], [3, 6]]', '[[6, 5, 4], [3, 2, 1]]', '[[1, 2], [3, 4], [5, 6]]', '[[4, 5, 6], [1, 2, 3]]', NULL,
    'A',
    'Na transposta, linhas viram colunas. A^t = [[1, 4], [2, 5], [3, 6]].',
    'Troque linhas por colunas',
    'ativa'
),

(
    'matematica', 2, 1, 'Matrizes', 'Multiplicação', 'medio',
    'Se A = [[1, 2], [3, 4]] e B = [[5], [6]], qual é o elemento (1,1) do produto AB?',
    '11', '17', '23', '39', NULL,
    'B',
    '(AB)₁₁ = 1×5 + 2×6 = 5 + 12 = 17.',
    'Linha de A × Coluna de B',
    'ativa'
),

-- MATRIZES/TRIG - Difíceis
(
    'matematica', 2, 1, 'Trigonometria', 'Equações', 'dificil',
    'Resolva em [0°, 360°]: 2sen x - 1 = 0',
    'x = 30° e x = 150°', 'x = 30° e x = 330°', 'x = 60° e x = 120°', 'x = 45° e x = 135°', NULL,
    'A',
    'sen x = 1/2. No círculo, sen = 1/2 em x = 30° (1º quad) e x = 150° (2º quad).',
    'sen = 1/2 em dois quadrantes',
    'ativa'
),

(
    'matematica', 2, 1, 'Matrizes', 'Multiplicação', 'dificil',
    'Se A = [[2, 1], [0, 3]] e B = [[1, 4], [2, 0]], qual é AB?',
    '[[4, 8], [6, 0]]', '[[4, 8], [0, 6]]', '[[2, 4], [0, 0]]', '[[4, 0], [6, 8]]', NULL,
    'A',
    'AB₁₁ = 2×1 + 1×2 = 4. AB₁₂ = 2×4 + 1×0 = 8. AB₂₁ = 0×1 + 3×2 = 6. AB₂₂ = 0×4 + 3×0 = 0.',
    'Calcule cada elemento: linha × coluna',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 2º BIMESTRE
-- Temas: Determinantes, Sistemas Lineares
-- ═══════════════════════════════════════════════════════════════════════════

-- DETERMINANTES - Fáceis
(
    'matematica', 2, 2, 'Determinantes', '2x2', 'facil',
    'Calcule o determinante: |2  3| |4  5|',
    '-2', '2', '22', '-22', NULL,
    'A',
    'det = 2×5 - 3×4 = 10 - 12 = -2.',
    'det 2×2 = ad - bc',
    'ativa'
),

(
    'matematica', 2, 2, 'Determinantes', '2x2', 'facil',
    'Calcule: |1  0| |0  1|',
    '0', '1', '-1', '2', NULL,
    'B',
    'det = 1×1 - 0×0 = 1. Esta é a matriz identidade.',
    'det(I) = 1',
    'ativa'
),

-- DETERMINANTES - Médias
(
    'matematica', 2, 2, 'Determinantes', '3x3', 'medio',
    'Calcule o determinante da matriz A = [[1, 0, 0], [0, 2, 0], [0, 0, 3]] (diagonal)',
    '0', '5', '6', '9', NULL,
    'C',
    'O determinante de matriz diagonal é o produto dos elementos da diagonal: 1 × 2 × 3 = 6.',
    'Matriz diagonal: det = produto da diagonal',
    'ativa'
),

(
    'matematica', 2, 2, 'Determinantes', 'Propriedades', 'medio',
    'Se det(A) = 5, qual o valor de det(3A) para uma matriz 2x2?',
    '15', '25', '45', '125', NULL,
    'C',
    'Para matriz n×n: det(kA) = k^n × det(A). Como n=2: det(3A) = 3² × 5 = 9 × 5 = 45.',
    'det(kA) = k^n × det(A)',
    'ativa'
),

-- SISTEMAS LINEARES - Fáceis
(
    'matematica', 2, 2, 'Sistemas Lineares', 'Substituição', 'facil',
    'Resolva o sistema: x + y = 10 e x - y = 2. Qual o valor de x?',
    '4', '6', '8', '10', NULL,
    'B',
    'Somando: 2x = 12 → x = 6.',
    'Some ou subtraia as equações',
    'ativa'
),

(
    'matematica', 2, 2, 'Sistemas Lineares', 'Substituição', 'facil',
    'No sistema acima (x + y = 10, x - y = 2), qual o valor de y?',
    '2', '4', '6', '8', NULL,
    'B',
    'Como x = 6: 6 + y = 10 → y = 4.',
    'Substitua o valor encontrado',
    'ativa'
),

-- SISTEMAS LINEARES - Médias
(
    'matematica', 2, 2, 'Sistemas Lineares', 'Cramer', 'medio',
    'Usando a regra de Cramer, resolva: 2x + y = 7 e x - y = 2. Qual o valor de x?',
    '2', '3', '4', '5', NULL,
    'B',
    'D = 2(-1) - 1(1) = -3. Dx = 7(-1) - 1(2) = -9. x = Dx/D = -9/-3 = 3.',
    'x = Dx/D',
    'ativa'
),

(
    'matematica', 2, 2, 'Sistemas Lineares', 'Classificação', 'medio',
    'Um sistema é SPD (Sistema Possível Determinado) quando:',
    'D = 0', 'D ≠ 0', 'D = Dx = Dy = 0', 'D = 0 e Dx ≠ 0', NULL,
    'B',
    'SPD: determinante principal diferente de zero (D ≠ 0), com solução única.',
    'D ≠ 0 → solução única',
    'ativa'
),

-- SISTEMAS LINEARES - Difíceis
(
    'matematica', 2, 2, 'Sistemas Lineares', 'Problemas', 'dificil',
    'A soma de dois números é 15 e a diferença é 3. Qual o maior número?',
    '6', '7', '8', '9', NULL,
    'D',
    'x + y = 15 e x - y = 3. Somando: 2x = 18 → x = 9 (maior). y = 6 (menor).',
    'Monte o sistema a partir do enunciado',
    'ativa'
),

(
    'matematica', 2, 2, 'Determinantes', '3x3 Sarrus', 'dificil',
    'Usando Sarrus, calcule o determinante: |1 2 3| |4 5 6| |7 8 9|',
    '0', '6', '-6', '54', NULL,
    'A',
    'Diag principais: 1×5×9 + 2×6×7 + 3×4×8 = 45 + 84 + 96 = 225. Diag secundárias: 3×5×7 + 1×6×8 + 2×4×9 = 105 + 48 + 72 = 225. det = 225 - 225 = 0.',
    'Regra de Sarrus',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 3º BIMESTRE
-- Temas: Geometria Analítica (Ponto, Reta), Geometria de Posição
-- ═══════════════════════════════════════════════════════════════════════════

-- GEOMETRIA ANALÍTICA - PONTO - Fáceis
(
    'matematica', 2, 3, 'Geometria Analítica', 'Distância entre Pontos', 'facil',
    'Qual a distância entre os pontos A(1, 2) e B(4, 6)?',
    '3', '4', '5', '7', NULL,
    'C',
    'd = √[(4-1)² + (6-2)²] = √[9 + 16] = √25 = 5.',
    'd = √[(x₂-x₁)² + (y₂-y₁)²]',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Analítica', 'Ponto Médio', 'facil',
    'Qual o ponto médio do segmento de extremidades A(2, 4) e B(8, 10)?',
    '(4, 6)', '(5, 7)', '(6, 8)', '(3, 5)', NULL,
    'B',
    'M = ((2+8)/2, (4+10)/2) = (5, 7).',
    'M = ((x₁+x₂)/2, (y₁+y₂)/2)',
    'ativa'
),

-- GEOMETRIA ANALÍTICA - RETA - Fáceis
(
    'matematica', 2, 3, 'Geometria Analítica', 'Equação da Reta', 'facil',
    'Qual o coeficiente angular da reta y = 3x - 5?',
    '-5', '3', '5', '-3', NULL,
    'B',
    'Na forma y = mx + n, m é o coeficiente angular. Logo, m = 3.',
    'y = mx + n → m é o coeficiente angular',
    'ativa'
),

-- GEOMETRIA ANALÍTICA - Médias
(
    'matematica', 2, 3, 'Geometria Analítica', 'Coeficiente Angular', 'medio',
    'Qual o coeficiente angular da reta que passa por A(1, 3) e B(4, 9)?',
    '1', '2', '3', '6', NULL,
    'B',
    'm = (y₂ - y₁)/(x₂ - x₁) = (9-3)/(4-1) = 6/3 = 2.',
    'm = Δy/Δx',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Analítica', 'Equação da Reta', 'medio',
    'Qual a equação da reta que passa por (0, 4) com coeficiente angular 2?',
    'y = 2x + 4', 'y = 4x + 2', 'y = 2x - 4', 'y = -2x + 4', NULL,
    'A',
    'Forma reduzida: y = mx + n. Com m = 2 e n = 4 (pois x=0 → y=4): y = 2x + 4.',
    'Use y = mx + n',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Analítica', 'Retas Paralelas', 'medio',
    'As retas y = 3x + 2 e y = 3x - 5 são:',
    'Paralelas', 'Perpendiculares', 'Coincidentes', 'Concorrentes', NULL,
    'A',
    'Retas com mesmo coeficiente angular (m = 3) são paralelas.',
    'Paralelas: mesmo m',
    'ativa'
),

-- GEOMETRIA ANALÍTICA - Difíceis
(
    'matematica', 2, 3, 'Geometria Analítica', 'Retas Perpendiculares', 'dificil',
    'Se uma reta tem coeficiente angular m = 2, qual o coeficiente angular de uma reta perpendicular a ela?',
    '-2', '1/2', '-1/2', '2', NULL,
    'C',
    'Retas perpendiculares: m₁ × m₂ = -1. Logo: 2 × m₂ = -1 → m₂ = -1/2.',
    'Perpendiculares: m₁ × m₂ = -1',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Analítica', 'Distância Ponto-Reta', 'dificil',
    'Qual a distância do ponto P(1, 2) à reta 3x + 4y - 10 = 0?',
    '1', '5/7', '1/5', '1/7', NULL,
    'C',
    'd = |3(1) + 4(2) - 10| / √(9+16) = |3 + 8 - 10| / 5 = 1/5.',
    'd = |ax₀ + by₀ + c| / √(a² + b²)',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 4º BIMESTRE
-- Temas: Geometria Analítica (Circunferência), Geometria Espacial
-- ═══════════════════════════════════════════════════════════════════════════

-- CIRCUNFERÊNCIA - Fáceis
(
    'matematica', 2, 4, 'Geometria Analítica', 'Circunferência', 'facil',
    'Qual o centro da circunferência (x - 3)² + (y + 2)² = 25?',
    '(3, 2)', '(-3, 2)', '(3, -2)', '(-3, -2)', NULL,
    'C',
    'Na forma (x - a)² + (y - b)² = r², o centro é (a, b). Logo: (3, -2).',
    'Troque os sinais dentro dos parênteses',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Analítica', 'Circunferência', 'facil',
    'Qual o raio da circunferência (x - 1)² + (y - 3)² = 16?',
    '2', '4', '8', '16', NULL,
    'B',
    'r² = 16 → r = 4.',
    'r = √(termo independente)',
    'ativa'
),

-- CIRCUNFERÊNCIA - Médias
(
    'matematica', 2, 4, 'Geometria Analítica', 'Circunferência', 'medio',
    'Qual a equação da circunferência de centro (2, -1) e raio 3?',
    '(x - 2)² + (y + 1)² = 9', '(x + 2)² + (y - 1)² = 9', '(x - 2)² + (y + 1)² = 3', '(x - 2)² + (y - 1)² = 9', NULL,
    'A',
    '(x - 2)² + (y - (-1))² = 3² → (x - 2)² + (y + 1)² = 9.',
    'Substitua centro e raio na forma reduzida',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Analítica', 'Posição Ponto-Circunferência', 'medio',
    'O ponto P(5, 0) está dentro, na ou fora da circunferência x² + y² = 16?',
    'Dentro', 'Na circunferência', 'Fora', 'Não é possível determinar', NULL,
    'C',
    'd² = 5² + 0² = 25 > 16 = r². Como d > r, o ponto está fora.',
    'Compare d² com r²',
    'ativa'
),

-- GEOMETRIA ESPACIAL - Fáceis
(
    'matematica', 2, 4, 'Geometria Espacial', 'Prismas', 'facil',
    'Qual o volume de um paralelepípedo de dimensões 4 cm × 5 cm × 3 cm?',
    '12 cm³', '35 cm³', '60 cm³', '120 cm³', NULL,
    'C',
    'V = a × b × c = 4 × 5 × 3 = 60 cm³.',
    'V = comprimento × largura × altura',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Espacial', 'Cubo', 'facil',
    'Qual a área total de um cubo de aresta 3 cm?',
    '27 cm²', '36 cm²', '54 cm²', '81 cm²', NULL,
    'C',
    'Área total = 6 × (área da face) = 6 × 3² = 6 × 9 = 54 cm².',
    'Cubo tem 6 faces quadradas',
    'ativa'
),

-- GEOMETRIA ESPACIAL - Médias
(
    'matematica', 2, 4, 'Geometria Espacial', 'Cilindro', 'medio',
    'Qual o volume de um cilindro de raio 3 cm e altura 10 cm? (Use π = 3,14)',
    '90 cm³', '188,4 cm³', '282,6 cm³', '94,2 cm³', NULL,
    'C',
    'V = πr²h = 3,14 × 9 × 10 = 282,6 cm³.',
    'V = πr²h',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Espacial', 'Cone', 'medio',
    'Qual o volume de um cone de raio 6 cm e altura 8 cm? (Use π = 3,14)',
    '100,48 cm³', '301,44 cm³', '904,32 cm³', '150,72 cm³', NULL,
    'B',
    'V = (1/3)πr²h = (1/3) × 3,14 × 36 × 8 = 301,44 cm³.',
    'V = (1/3)πr²h',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Espacial', 'Esfera', 'medio',
    'Qual o volume de uma esfera de raio 3 cm? (Use π = 3)',
    '36 cm³', '72 cm³', '108 cm³', '324 cm³', NULL,
    'C',
    'V = (4/3)πr³ = (4/3) × 3 × 27 = 4 × 27 = 108 cm³.',
    'V = (4/3)πr³',
    'ativa'
),

-- GEOMETRIA ESPACIAL - Difíceis
(
    'matematica', 2, 4, 'Geometria Espacial', 'Pirâmide', 'dificil',
    'Uma pirâmide tem base quadrada de lado 6 cm e altura 10 cm. Qual seu volume?',
    '120 cm³', '180 cm³', '360 cm³', '600 cm³', NULL,
    'A',
    'Área da base = 6² = 36 cm². V = (1/3) × Ab × h = (1/3) × 36 × 10 = 120 cm³.',
    'V = (1/3) × Área da base × altura',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Espacial', 'Tronco de Cone', 'dificil',
    'Um tronco de cone tem raios das bases 4 cm e 2 cm, e altura 6 cm. Qual seu volume? (Use π = 3)',
    '84 cm³', '126 cm³', '168 cm³', '252 cm³', NULL,
    'C',
    'V = (1/3)πh(R² + Rr + r²) = (1/3) × 3 × 6 × (16 + 8 + 4) = 6 × 28 = 168 cm³.',
    'Fórmula do tronco: V = (1/3)πh(R² + Rr + r²)',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES SEM BIMESTRE (disponíveis o ano todo)
-- Para revisão geral
-- ═══════════════════════════════════════════════════════════════════════════

-- 1ª SÉRIE - Gerais
(
    'matematica', 1, NULL, 'Conceitos Fundamentais', 'Notação Matemática', 'facil',
    'O símbolo ∈ significa:',
    'Pertence', 'Contém', 'União', 'Interseção', NULL,
    'A',
    'O símbolo ∈ indica que um elemento pertence a um conjunto. Ex: 3 ∈ ℕ.',
    'Pense em "elemento"',
    'ativa'
),

(
    'matematica', 1, NULL, 'Conceitos Fundamentais', 'Conjuntos Numéricos', 'facil',
    'Qual conjunto numérico contém os números negativos?',
    'ℕ (Naturais)', 'ℤ (Inteiros)', 'ℕ* (Naturais não-nulos)', 'Nenhum dos anteriores', NULL,
    'B',
    'Os números inteiros (ℤ) incluem positivos, negativos e zero.',
    'ℤ = {..., -2, -1, 0, 1, 2, ...}',
    'ativa'
),

(
    'matematica', 1, NULL, 'Funções', 'Domínio', 'medio',
    'Qual o domínio da função f(x) = √(x - 4)?',
    'x ≥ 4', 'x > 4', 'x ≤ 4', 'x < 4', NULL,
    'A',
    'Para √(x-4) existir em ℝ: x - 4 ≥ 0 → x ≥ 4.',
    'Radicando deve ser ≥ 0',
    'ativa'
),

(
    'matematica', 1, NULL, 'Funções', 'Imagem', 'medio',
    'Qual a imagem da função f(x) = x² + 1?',
    'y ≥ 0', 'y ≥ 1', 'y > 1', 'Todos os reais', NULL,
    'B',
    'Como x² ≥ 0 para todo x, então x² + 1 ≥ 1. Logo, Im = [1, +∞) ou y ≥ 1.',
    'x² é sempre ≥ 0',
    'ativa'
),

-- 2ª SÉRIE - Gerais
(
    'matematica', 2, NULL, 'Conceitos Fundamentais', 'Ângulos', 'facil',
    'Quantos graus tem um ângulo reto?',
    '45°', '90°', '180°', '360°', NULL,
    'B',
    'Um ângulo reto mede exatamente 90°.',
    'Ângulo de um canto de uma folha',
    'ativa'
),

(
    'matematica', 2, NULL, 'Conceitos Fundamentais', 'Radianos', 'medio',
    'Converta 180° para radianos:',
    'π/2 rad', 'π rad', '2π rad', '3π/2 rad', NULL,
    'B',
    '180° = π rad. Esta é uma das conversões fundamentais.',
    '180° = π rad',
    'ativa'
),

(
    'matematica', 2, NULL, 'Trigonometria', 'Ângulos Notáveis', 'medio',
    'Qual o valor de tg 45°?',
    '0', '1', '√3', 'Não existe', NULL,
    'B',
    'tg 45° = sen 45° / cos 45° = (√2/2) / (√2/2) = 1.',
    'sen 45° = cos 45°',
    'ativa'
),

(
    'matematica', 2, NULL, 'Geometria Analítica', 'Distância Origem', 'medio',
    'Qual a distância do ponto P(3, 4) à origem?',
    '5', '7', '12', '25', NULL,
    'A',
    'd = √(3² + 4²) = √(9 + 16) = √25 = 5.',
    'Triângulo retângulo 3-4-5',
    'ativa'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════════════════

-- Contar questões por série e bimestre
SELECT
    ano as serie,
    bimestre,
    dificuldade,
    COUNT(*) as total_questoes
FROM questoes
WHERE componente = 'matematica' AND status = 'ativa' AND ano IN (1, 2)
GROUP BY ano, bimestre, dificuldade
ORDER BY ano, bimestre, dificuldade;

-- Total geral
SELECT
    ano as serie,
    COUNT(*) as total
FROM questoes
WHERE componente = 'matematica' AND status = 'ativa' AND ano IN (1, 2)
GROUP BY ano
ORDER BY ano;
