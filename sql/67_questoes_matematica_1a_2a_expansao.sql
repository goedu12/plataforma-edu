-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES DE MATEMÁTICA - EXPANSÃO (1ª e 2ª SÉRIE EM)
-- ~80 questões adicionais com distribuição por bimestre
-- Complementa os arquivos 63 e 64 existentes
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 1º BIMESTRE
-- Temas: Conjuntos, Funções
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'matematica', 1, 1, 'Conjuntos', 'Diagrama de Venn', 'facil',
    'Em uma sala, 20 alunos gostam de futebol, 15 gostam de basquete e 8 gostam de ambos. Quantos gostam de pelo menos um dos esportes?',
    '27', '35', '43', '23', NULL,
    'A',
    'n(A ∪ B) = n(A) + n(B) - n(A ∩ B) = 20 + 15 - 8 = 27.',
    'n(A ∪ B) = n(A) + n(B) - n(A ∩ B)',
    'ativa'
),

(
    'matematica', 1, 1, 'Conjuntos', 'Complementar', 'facil',
    'Se U = {1,2,3,4,5,6,7,8,9,10} e A = {2,4,6,8,10}, qual é o complementar de A?',
    '{1,3,5,7,9}', '{2,4,6,8}', '{1,2,3,4,5}', '{3,5,7,9}', NULL,
    'A',
    'Aᶜ = U - A = {1, 3, 5, 7, 9} (elementos de U que não estão em A).',
    'Complementar = elementos do universo que NÃO estão no conjunto',
    'ativa'
),

(
    'matematica', 1, 1, 'Funções', 'Domínio', 'medio',
    'Qual o domínio da função f(x) = √(x - 3)?',
    'x ≥ 0', 'x > 3', 'x ≥ 3', 'x ∈ ℝ', NULL,
    'C',
    'O radicando deve ser ≥ 0: x - 3 ≥ 0 → x ≥ 3.',
    'Raiz quadrada: radicando ≥ 0',
    'ativa'
),

(
    'matematica', 1, 1, 'Funções', 'Imagem', 'medio',
    'Dada f(x) = 2x - 1, qual o valor de f(3)?',
    '3', '4', '5', '6', NULL,
    'C',
    'f(3) = 2(3) - 1 = 6 - 1 = 5.',
    'Substitua x pelo valor dado',
    'ativa'
),

(
    'matematica', 1, 1, 'Função Afim', 'Coeficientes', 'medio',
    'Na função f(x) = -3x + 6, a função é:',
    'Crescente com raiz x = -2', 'Decrescente com raiz x = 2', 'Crescente com raiz x = 2', 'Decrescente com raiz x = -2', NULL,
    'B',
    'Coeficiente angular a = -3 < 0 → decrescente. Raiz: -3x + 6 = 0 → x = 2.',
    'a < 0 = decrescente; raiz: f(x) = 0',
    'ativa'
),

(
    'matematica', 1, 1, 'Função Afim', 'Gráfico', 'dificil',
    'Uma função afim passa pelos pontos (1, 4) e (3, 10). Qual é a lei da função?',
    'f(x) = 3x + 1', 'f(x) = 2x + 2', 'f(x) = 3x - 1', 'f(x) = 4x', NULL,
    'A',
    'a = (10-4)/(3-1) = 6/2 = 3. f(x) = 3x + b. Usando (1,4): 4 = 3+b → b = 1. f(x) = 3x + 1.',
    'Calcule a inclinação e depois o intercepto',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 2º BIMESTRE
-- Temas: Função Quadrática, Inequações
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'matematica', 1, 2, 'Função Quadrática', 'Raízes', 'facil',
    'Quais as raízes de f(x) = x² - 7x + 12?',
    '2 e 6', '3 e 4', '1 e 12', '-3 e -4', NULL,
    'B',
    'Δ = 49 - 48 = 1. x = (7±1)/2 → x = 4 ou x = 3.',
    'Use Bhaskara ou fatore: que dois números somam 7 e multiplicam 12?',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Vértice', 'facil',
    'Qual o vértice da parábola f(x) = x² - 4x + 3?',
    '(2, -1)', '(2, 1)', '(-2, -1)', '(4, 3)', NULL,
    'A',
    'xᵥ = -b/2a = 4/2 = 2. yᵥ = f(2) = 4 - 8 + 3 = -1. V(2, -1).',
    'xᵥ = -b/2a, yᵥ = f(xᵥ)',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Discriminante', 'medio',
    'A equação 2x² + 3x + 5 = 0 possui:',
    'Duas raízes reais distintas', 'Duas raízes reais iguais', 'Nenhuma raiz real', 'Uma raiz real', NULL,
    'C',
    'Δ = 9 - 40 = -31 < 0. Logo, não há raízes reais.',
    'Δ < 0 → sem raízes reais',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Máximo/Mínimo', 'medio',
    'Uma bola é lançada e sua altura é h(t) = -5t² + 20t (metros). Qual a altura máxima?',
    '10 m', '15 m', '20 m', '40 m', NULL,
    'C',
    'tᵥ = -20/(2×(-5)) = 2 s. h(2) = -5(4) + 20(2) = -20 + 40 = 20 m.',
    'a < 0 → parábola com máximo no vértice',
    'ativa'
),

(
    'matematica', 1, 2, 'Inequação', 'Primeiro Grau', 'medio',
    'Resolva: 3x - 7 > 2x + 1',
    'x > 8', 'x > 6', 'x < 8', 'x > -6', NULL,
    'A',
    '3x - 2x > 1 + 7 → x > 8.',
    'Isole x de um lado',
    'ativa'
),

(
    'matematica', 1, 2, 'Função Quadrática', 'Aplicação', 'dificil',
    'O lucro de uma empresa é dado por L(x) = -2x² + 120x - 800, onde x é o preço. Qual preço maximiza o lucro?',
    'R$ 20', 'R$ 30', 'R$ 40', 'R$ 60', NULL,
    'B',
    'xᵥ = -120/(2×(-2)) = -120/(-4) = 30.',
    'Valor de máximo → vértice da parábola',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 3º BIMESTRE
-- Temas: Função Exponencial, Função Logarítmica
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'matematica', 1, 3, 'Função Exponencial', 'Propriedades', 'facil',
    'Qual o valor de 2⁵?',
    '10', '16', '25', '32', NULL,
    'D',
    '2⁵ = 2×2×2×2×2 = 32.',
    'Multiplique a base por ela mesma n vezes',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Exponencial', 'Equação', 'facil',
    'Resolva: 3ˣ = 81',
    'x = 2', 'x = 3', 'x = 4', 'x = 5', NULL,
    'C',
    '81 = 3⁴, logo 3ˣ = 3⁴ → x = 4.',
    'Escreva os dois lados na mesma base',
    'ativa'
),

(
    'matematica', 1, 3, 'Função Exponencial', 'Crescimento', 'medio',
    'Uma população de bactérias dobra a cada hora. Se inicialmente há 100 bactérias, quantas haverá após 5 horas?',
    '500', '1.600', '3.200', '10.000', NULL,
    'C',
    'P(t) = 100 × 2ᵗ. P(5) = 100 × 32 = 3.200.',
    'Dobra = multiplica por 2 a cada período',
    'ativa'
),

(
    'matematica', 1, 3, 'Logaritmo', 'Definição', 'facil',
    'Qual o valor de log₂ 16?',
    '2', '3', '4', '8', NULL,
    'C',
    'log₂ 16 = x → 2ˣ = 16 = 2⁴ → x = 4.',
    'log_b(a) = x ↔ bˣ = a',
    'ativa'
),

(
    'matematica', 1, 3, 'Logaritmo', 'Propriedades', 'medio',
    'Simplifique: log₃ 27 + log₃ 9',
    '5', '6', '8', '36', NULL,
    'A',
    'log₃ 27 = 3 (pois 3³=27), log₃ 9 = 2 (pois 3²=9). Soma: 3 + 2 = 5.',
    'log_b(bⁿ) = n',
    'ativa'
),

(
    'matematica', 1, 3, 'Logaritmo', 'Equação', 'dificil',
    'Resolva: log₂(x + 3) = 5',
    'x = 29', 'x = 32', 'x = 35', 'x = 2', NULL,
    'A',
    'log₂(x+3) = 5 → x+3 = 2⁵ = 32 → x = 29.',
    'Passe para a forma exponencial',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 4º BIMESTRE
-- Temas: Trigonometria no Triângulo Retângulo, Ciclo Trigonométrico
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'matematica', 1, 4, 'Trigonometria', 'Razões Trigonométricas', 'facil',
    'Em um triângulo retângulo, o cateto oposto mede 3 e a hipotenusa mede 5. Qual o seno do ângulo?',
    '3/4', '3/5', '4/5', '5/3', NULL,
    'B',
    'sen θ = cateto oposto / hipotenusa = 3/5.',
    'sen = oposto/hipotenusa',
    'ativa'
),

(
    'matematica', 1, 4, 'Trigonometria', 'Razões Trigonométricas', 'facil',
    'Qual o valor de sen 30°?',
    '1/2', '√2/2', '√3/2', '1', NULL,
    'A',
    'sen 30° = 1/2 (valor notável).',
    'Valores notáveis: sen 30° = 1/2, sen 45° = √2/2, sen 60° = √3/2',
    'ativa'
),

(
    'matematica', 1, 4, 'Trigonometria', 'Valores Notáveis', 'medio',
    'Qual o valor de tg 45°?',
    '0', '1/2', '1', '√3', NULL,
    'C',
    'tg 45° = sen 45° / cos 45° = (√2/2) / (√2/2) = 1.',
    'tg = sen/cos',
    'ativa'
),

(
    'matematica', 1, 4, 'Trigonometria', 'Aplicação', 'medio',
    'Uma escada de 10 m está apoiada em uma parede formando 60° com o chão. A que altura da parede ela chega?',
    '5 m', '5√3 m', '10 m', '10√3 m', NULL,
    'B',
    'sen 60° = h/10 → h = 10 × sen 60° = 10 × √3/2 = 5√3 m.',
    'Identifique catetos e hipotenusa em relação ao ângulo',
    'ativa'
),

(
    'matematica', 1, 4, 'Trigonometria', 'Identidade', 'dificil',
    'Sabendo que sen x = 3/5 e x está no 1º quadrante, qual o valor de cos x?',
    '2/5', '3/5', '4/5', '5/3', NULL,
    'C',
    'sen²x + cos²x = 1 → 9/25 + cos²x = 1 → cos²x = 16/25 → cos x = 4/5 (positivo no 1º quadrante).',
    'sen²x + cos²x = 1',
    'ativa'
),

(
    'matematica', 1, 4, 'Trigonometria', 'Ciclo', 'dificil',
    'Qual o valor de sen 150°?',
    '-1/2', '1/2', '-√3/2', '√3/2', NULL,
    'B',
    '150° = 180° - 30°. sen(180°-α) = sen α. Logo sen 150° = sen 30° = 1/2.',
    'Ângulos suplementares têm mesmo seno',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 1º BIMESTRE
-- Temas: Trigonometria (Funções), Matrizes
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'matematica', 2, 1, 'Matrizes', 'Tipos', 'facil',
    'Uma matriz 3×2 tem quantos elementos?',
    '3', '5', '6', '9', NULL,
    'C',
    'Uma matriz m×n tem m×n elementos. 3×2 = 6.',
    'Total de elementos = linhas × colunas',
    'ativa'
),

(
    'matematica', 2, 1, 'Matrizes', 'Operações', 'facil',
    'Se A = [2, 3; 1, 4] e B = [1, 0; 2, 5], qual é A + B?',
    '[3, 3; 3, 9]', '[2, 3; 2, 20]', '[3, 3; 3, 20]', '[1, 3; 1, 1]', NULL,
    'A',
    'Soma elemento a elemento: [2+1, 3+0; 1+2, 4+5] = [3, 3; 3, 9].',
    'Some os elementos correspondentes',
    'ativa'
),

(
    'matematica', 2, 1, 'Matrizes', 'Transposta', 'medio',
    'Se A = [1, 2, 3; 4, 5, 6], qual é a transposta Aᵀ?',
    '[1, 4; 2, 5; 3, 6]', '[3, 2, 1; 6, 5, 4]', '[6, 5, 4; 3, 2, 1]', '[4, 5, 6; 1, 2, 3]', NULL,
    'A',
    'Na transposta, linhas viram colunas: Aᵀ = [1,4; 2,5; 3,6].',
    'Transposta: troca linhas por colunas',
    'ativa'
),

(
    'matematica', 2, 1, 'Matrizes', 'Multiplicação', 'medio',
    'Se A = [1, 2; 3, 4] e B = [5; 6], qual é A × B?',
    '[17; 39]', '[11; 22]', '[7; 10]', '[5, 12; 15, 24]', NULL,
    'A',
    '[1×5+2×6; 3×5+4×6] = [5+12; 15+24] = [17; 39].',
    'Linha × coluna: some os produtos',
    'ativa'
),

(
    'matematica', 2, 1, 'Matrizes', 'Determinante', 'dificil',
    'Qual o determinante de A = [3, 1; 2, 4]?',
    '5', '10', '14', '11', NULL,
    'B',
    'det(A) = 3×4 - 1×2 = 12 - 2 = 10.',
    'det 2×2: ad - bc',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 2º BIMESTRE
-- Temas: Sistemas Lineares, Determinantes
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'matematica', 2, 2, 'Sistemas Lineares', 'Resolução', 'facil',
    'Resolva o sistema: x + y = 10 e x - y = 4. Qual o valor de x?',
    '3', '5', '7', '10', NULL,
    'C',
    'Somando: 2x = 14 → x = 7. (e y = 3).',
    'Some ou subtraia as equações para eliminar uma variável',
    'ativa'
),

(
    'matematica', 2, 2, 'Sistemas Lineares', 'Resolução', 'facil',
    'No sistema: 2x + y = 8 e x - y = 1. Qual o valor de y?',
    '1', '2', '3', '5', NULL,
    'B',
    'Somando: 3x = 9 → x = 3. Substituindo: 3 - y = 1 → y = 2.',
    'Método da adição ou substituição',
    'ativa'
),

(
    'matematica', 2, 2, 'Sistemas Lineares', 'Classificação', 'medio',
    'O sistema x + 2y = 5 e 2x + 4y = 10 é:',
    'Determinado', 'Indeterminado', 'Impossível', 'Homogêneo', NULL,
    'B',
    'A 2ª equação é o dobro da 1ª (equações proporcionais). Sistema possível e indeterminado (infinitas soluções).',
    'Equações proporcionais = sistema indeterminado',
    'ativa'
),

(
    'matematica', 2, 2, 'Determinantes', 'Regra de Cramer', 'medio',
    'Usando Cramer, resolva: 3x + y = 7 e x + 2y = 4. Qual o valor de x?',
    '1', '2', '3', '4', NULL,
    'B',
    'D = 3×2-1×1 = 5. Dx = 7×2-1×4 = 10. x = Dx/D = 10/5 = 2.',
    'Cramer: x = Dx/D',
    'ativa'
),

(
    'matematica', 2, 2, 'Determinantes', 'Determinante 3×3', 'dificil',
    'Qual o determinante de [1,0,1; 2,1,0; 0,1,3]?',
    '-5', '3', '5', '7', NULL,
    'C',
    'Cofatores pela 1ª linha: 1×det[1,0;1,3] - 0 + 1×det[2,1;0,1] = 1×(3-0) + 1×(2-0) = 3 + 2 = 5.',
    'Use a regra de Sarrus ou expansão por cofatores',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 3º BIMESTRE
-- Temas: Geometria Espacial
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'matematica', 2, 3, 'Geometria Espacial', 'Prisma', 'facil',
    'Qual o volume de um paralelepípedo com dimensões 3 cm, 4 cm e 5 cm?',
    '12 cm³', '30 cm³', '47 cm³', '60 cm³', NULL,
    'D',
    'V = a × b × c = 3 × 4 × 5 = 60 cm³.',
    'V = comprimento × largura × altura',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Espacial', 'Cubo', 'facil',
    'Qual a área total de um cubo de aresta 4 cm?',
    '48 cm²', '64 cm²', '96 cm²', '128 cm²', NULL,
    'C',
    'Área total = 6 × a² = 6 × 16 = 96 cm².',
    'Cubo: 6 faces iguais, cada uma com área a²',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Espacial', 'Cilindro', 'medio',
    'Qual o volume de um cilindro com raio 3 cm e altura 10 cm? (use π ≈ 3,14)',
    '90π cm³', '30π cm³', '60π cm³', '9π cm³', NULL,
    'A',
    'V = πr²h = π × 9 × 10 = 90π cm³.',
    'V_cilindro = πr²h',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Espacial', 'Cone', 'medio',
    'O volume de um cone de raio 6 cm e altura 9 cm é:',
    '54π cm³', '108π cm³', '162π cm³', '324π cm³', NULL,
    'B',
    'V = πr²h/3 = π×36×9/3 = 324π/3 = 108π cm³.',
    'V_cone = πr²h/3 (é 1/3 do cilindro)',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Espacial', 'Esfera', 'medio',
    'Qual o volume de uma esfera de raio 3 cm?',
    '27π cm³', '36π cm³', '108π cm³', '113 cm³', NULL,
    'B',
    'V = 4πr³/3 = 4π×27/3 = 108π/3 = 36π cm³.',
    'V_esfera = 4πr³/3',
    'ativa'
),

(
    'matematica', 2, 3, 'Geometria Espacial', 'Pirâmide', 'dificil',
    'Uma pirâmide de base quadrada tem aresta da base 6 cm e altura 8 cm. Qual seu volume?',
    '48 cm³', '96 cm³', '144 cm³', '288 cm³', NULL,
    'B',
    'V = A_base × h / 3 = 36 × 8 / 3 = 288/3 = 96 cm³.',
    'V_pirâmide = A_base × h / 3',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 4º BIMESTRE
-- Temas: Geometria Plana Avançada, Trigonometria
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'matematica', 2, 4, 'Geometria Plana', 'Área do Triângulo', 'facil',
    'Qual a área de um triângulo com base 10 cm e altura 6 cm?',
    '16 cm²', '30 cm²', '60 cm²', '120 cm²', NULL,
    'B',
    'A = bh/2 = 10×6/2 = 30 cm².',
    'A = base × altura / 2',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Plana', 'Área do Círculo', 'facil',
    'Qual a área de um círculo de raio 5 cm?',
    '10π cm²', '25π cm²', '50π cm²', '5π cm²', NULL,
    'B',
    'A = πr² = π×25 = 25π cm².',
    'A_círculo = πr²',
    'ativa'
),

(
    'matematica', 2, 4, 'Trigonometria', 'Lei dos Cossenos', 'medio',
    'Em um triângulo com lados a=5, b=7 e ângulo entre eles C=60°, qual o valor de c²? (cos 60° = 1/2)',
    '39', '49', '59', '74', NULL,
    'A',
    'c² = a² + b² - 2ab cos C = 25 + 49 - 2×5×7×(1/2) = 74 - 35 = 39.',
    'Lei dos Cossenos: c² = a² + b² - 2ab cos C',
    'ativa'
),

(
    'matematica', 2, 4, 'Trigonometria', 'Lei dos Senos', 'medio',
    'Em um triângulo, a = 6, sen A = 1/2 e sen B = √3/2. Qual o lado b?',
    '6', '6√3', '12', '3√3', NULL,
    'B',
    'a/sen A = b/sen B → 6/(1/2) = b/(√3/2) → 12 = 2b/√3 → b = 6√3.',
    'Lei dos Senos: a/senA = b/senB = c/senC',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Plana', 'Polígonos', 'medio',
    'Qual a soma dos ângulos internos de um hexágono regular?',
    '360°', '540°', '720°', '900°', NULL,
    'C',
    'S = (n-2)×180° = (6-2)×180° = 4×180° = 720°.',
    'S = (n-2)×180°',
    'ativa'
),

(
    'matematica', 2, 4, 'Geometria Plana', 'Teorema de Tales', 'dificil',
    'Três retas paralelas cortam duas transversais. Na 1ª transversal, os segmentos medem 3 e 5. Na 2ª transversal, o 1º segmento mede 6. Qual o 2º segmento?',
    '8', '10', '12', '15', NULL,
    'B',
    'Pelo Teorema de Tales: 3/5 = 6/x → x = 30/3 = 10.',
    'Tales: segmentos proporcionais em retas paralelas cortadas por transversais',
    'ativa'
);
