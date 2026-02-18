-- ═══════════════════════════════════════════════════════════════════════════
-- PLATAFORMA EDUCACIONAL - DADOS INICIAIS (SEEDS)
-- Colégio Estadual Cora Coralina
-- Versão: 2.0 - IDEMPOTENTE (pode rodar múltiplas vezes sem erro)
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- CONQUISTAS (idempotente - ON CONFLICT DO NOTHING)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor) VALUES
-- Conquistas de Pontos
('pontos_100', 'Primeiros Passos', 'Alcance 100 pontos', '🎯', NULL, 'pontos', 100),
('pontos_500', 'Em Ascensão', 'Alcance 500 pontos', '📈', NULL, 'pontos', 500),
('pontos_1000', 'Mil Pontos', 'Alcance 1000 pontos', '🌟', NULL, 'pontos', 1000),
('pontos_2500', 'Expert', 'Alcance 2500 pontos', '⭐', NULL, 'pontos', 2500),
('pontos_5000', 'Mestre', 'Alcance 5000 pontos', '👑', NULL, 'pontos', 5000),

-- Conquistas de Questões
('questoes_10', 'Iniciando a Jornada', 'Responda 10 questões', '📝', NULL, 'questoes', 10),
('questoes_50', 'Praticante', 'Responda 50 questões', '📚', NULL, 'questoes', 50),
('questoes_100', 'Centenário', 'Responda 100 questões', '💯', NULL, 'questoes', 100),
('questoes_250', 'Dedicado', 'Responda 250 questões', '💪', NULL, 'questoes', 250),
('questoes_500', 'Maratonista', 'Responda 500 questões', '🏃', NULL, 'questoes', 500),

-- Conquistas de Sequência
('sequencia_3', 'Consistente', 'Estude 3 dias seguidos', '🔥', NULL, 'sequencia', 3),
('sequencia_7', 'Semana Perfeita', 'Estude 7 dias seguidos', '🌟', NULL, 'sequencia', 7),
('sequencia_14', 'Duas Semanas', 'Estude 14 dias seguidos', '🚀', NULL, 'sequencia', 14),
('sequencia_30', 'Mês Completo', 'Estude 30 dias seguidos', '🏆', NULL, 'sequencia', 30),

-- Conquistas de Taxa de Acerto
('acertos_70', 'Precisão', '70% de acertos em 20+ questões', '🎯', NULL, 'acertos', 70),
('acertos_80', 'Alta Performance', '80% de acertos em 30+ questões', '💎', NULL, 'acertos', 80),
('acertos_90', 'Excelência', '90% de acertos em 50+ questões', '🏅', NULL, 'acertos', 90),

-- Conquistas específicas de Física
('fisica_primeira', 'Físico Iniciante', 'Responda sua primeira questão de Física', '🔬', 'fisica', 'questoes', 1),
('fisica_50', 'Aprendiz de Newton', 'Responda 50 questões de Física', '⚛️', 'fisica', 'questoes', 50),
('fisica_100', 'Cientista', 'Responda 100 questões de Física', '🧪', 'fisica', 'questoes', 100),

-- Conquistas específicas de Matemática
('mat_primeira', 'Matemático Iniciante', 'Responda sua primeira questão de Matemática', '🔢', 'matematica', 'questoes', 1),
('mat_50', 'Aprendiz de Pitágoras', 'Responda 50 questões de Matemática', '📐', 'matematica', 'questoes', 50),
('mat_100', 'Calculista', 'Responda 100 questões de Matemática', '🧮', 'matematica', 'questoes', 100)
ON CONFLICT (codigo) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- PROFESSOR PADRÃO (idempotente)
-- Senha: @professor123 (hash bcrypt)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO usuarios (
    email,
    senha_hash,
    nome,
    turma,
    ano,
    nivel,
    componentes,
    tipo
) VALUES (
    'professor@admin',
    '$2a$12$mG354kndJJwSKpaIanlXr.HMKpHA6LxeSO.i803TZnYqxdPFmZxo.', -- @professor123
    'Professor Leonardo',
    'ADMIN',
    1,
    'EM',
    ARRAY['fisica', 'matematica'],
    'professor'
)
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- ESTUDANTES DE EXEMPLO (idempotente)
-- Senha padrão: @estudante (hash bcrypt)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO usuarios (email, senha_hash, nome, turma, ano, nivel, componentes, tipo) VALUES
-- Turma 1A (Ensino Médio - Física e Matemática)
('mariasilvasantos@1a', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Maria Silva Santos', '1A', 1, 'EM', ARRAY['fisica', 'matematica'], 'estudante'),
('joaopedrolima@1a', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'João Pedro Lima', '1A', 1, 'EM', ARRAY['fisica', 'matematica'], 'estudante'),
('anaclarasousa@1a', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Ana Clara Sousa', '1A', 1, 'EM', ARRAY['fisica', 'matematica'], 'estudante'),
('pedrohenriquecosta@1a', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Pedro Henrique Costa', '1A', 1, 'EM', ARRAY['fisica', 'matematica'], 'estudante'),
('juliaferreira@1a', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Julia Ferreira', '1A', 1, 'EM', ARRAY['fisica', 'matematica'], 'estudante'),

-- Turma 2A (Ensino Médio - Física e Matemática)
('lucasoliveira@2a', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Lucas Oliveira', '2A', 2, 'EM', ARRAY['fisica', 'matematica'], 'estudante'),
('gabrielasantos@2a', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Gabriela Santos', '2A', 2, 'EM', ARRAY['fisica', 'matematica'], 'estudante'),
('mateusribeiro@2a', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Mateus Ribeiro', '2A', 2, 'EM', ARRAY['fisica', 'matematica'], 'estudante'),

-- Turma 3A (Ensino Médio - Física e Matemática)
('rafaelalmeida@3a', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Rafael Almeida', '3A', 3, 'EM', ARRAY['fisica', 'matematica'], 'estudante'),
('isabelamartins@3a', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Isabela Martins', '3A', 3, 'EM', ARRAY['fisica', 'matematica'], 'estudante'),

-- Turma 7B (Ensino Fundamental - Apenas Matemática)
('carloseduardosilva@7b', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Carlos Eduardo Silva', '7B', 7, 'EF', ARRAY['matematica'], 'estudante'),
('laurabezerrasouza@7b', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Laura Bezerra Souza', '7B', 7, 'EF', ARRAY['matematica'], 'estudante'),
('thiagopereira@7b', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Thiago Pereira', '7B', 7, 'EF', ARRAY['matematica'], 'estudante'),

-- Turma 9C (Ensino Fundamental - Apenas Matemática)
('fernandacosta@9c', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Fernanda Costa', '9C', 9, 'EF', ARRAY['matematica'], 'estudante'),
('brunocarvalho@9c', '$2a$12$9ilPQ8JKNQSGcQNJUnnvSuowjNbeV7.1iNOjROzGUUGRrH/OMU58O', 'Bruno Carvalho', '9C', 9, 'EF', ARRAY['matematica'], 'estudante')
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES DE FÍSICA - ENSINO MÉDIO (idempotente)
-- Usa hash do enunciado como identificador único
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO questoes (componente, ano, tema, subtema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, explicacao, dica) VALUES

-- Cinemática - 1º Ano
('fisica', 1, 'Cinemática', 'Velocidade Média', 'facil',
'Um carro percorre 100 metros em 5 segundos. Qual é a sua velocidade média?',
'10 m/s', '20 m/s', '50 m/s', '500 m/s', 'B',
'A velocidade média é calculada dividindo a distância pelo tempo: v = d/t = 100m / 5s = 20 m/s.',
'Lembre-se: velocidade = distância ÷ tempo'),

('fisica', 1, 'Cinemática', 'Velocidade Média', 'facil',
'Um atleta corre 400 metros em 50 segundos. Qual é a sua velocidade média?',
'4 m/s', '8 m/s', '12 m/s', '20 m/s', 'B',
'Velocidade média = distância / tempo = 400m / 50s = 8 m/s.',
'Divida a distância pelo tempo'),

('fisica', 1, 'Cinemática', 'Movimento Uniforme', 'medio',
'Um carro viaja a 72 km/h. Quantos metros ele percorre em 10 segundos?',
'100 m', '200 m', '720 m', '7200 m', 'B',
'Primeiro, converta 72 km/h para m/s: 72 ÷ 3,6 = 20 m/s. Depois: d = v × t = 20 × 10 = 200 m.',
'Converta km/h para m/s dividindo por 3,6'),

('fisica', 1, 'Cinemática', 'MRU', 'medio',
'Um trem parte de uma estação com velocidade constante de 90 km/h. Quanto tempo levará para percorrer 45 km?',
'20 minutos', '30 minutos', '45 minutos', '60 minutos', 'B',
't = d/v = 45km / 90km/h = 0,5h = 30 minutos.',
'Use a fórmula t = d/v'),

('fisica', 1, 'Cinemática', 'MRUV', 'dificil',
'Um carro parte do repouso e acelera uniformemente a 2 m/s². Qual será sua velocidade após 8 segundos?',
'4 m/s', '8 m/s', '16 m/s', '32 m/s', 'C',
'Usando v = v₀ + at: v = 0 + 2 × 8 = 16 m/s.',
'Partindo do repouso, v₀ = 0'),

-- Dinâmica - 1º Ano
('fisica', 1, 'Dinâmica', 'Leis de Newton', 'facil',
'Qual das alternativas melhor descreve a Primeira Lei de Newton?',
'Todo corpo permanece em repouso ou em movimento retilíneo uniforme, a menos que uma força atue sobre ele',
'Força é igual à massa vezes aceleração',
'Para toda ação há uma reação igual e oposta',
'A energia não pode ser criada nem destruída',
'A',
'A Primeira Lei de Newton, ou Lei da Inércia, afirma que um corpo mantém seu estado de movimento até que uma força externa o modifique.',
'Pense na inércia dos corpos'),

('fisica', 1, 'Dinâmica', 'Segunda Lei de Newton', 'medio',
'Uma força de 20 N é aplicada a um objeto de 4 kg. Qual é a aceleração resultante?',
'2 m/s²', '5 m/s²', '16 m/s²', '80 m/s²', 'B',
'Pela Segunda Lei de Newton: F = m × a, logo a = F/m = 20/4 = 5 m/s².',
'Use F = m × a'),

('fisica', 1, 'Dinâmica', 'Peso', 'facil',
'Qual é o peso de um objeto de 10 kg na superfície da Terra? (g = 10 m/s²)',
'1 N', '10 N', '100 N', '1000 N', 'C',
'Peso = massa × gravidade = 10 kg × 10 m/s² = 100 N.',
'Peso = m × g'),

-- Energia - 2º Ano
('fisica', 2, 'Energia', 'Trabalho', 'facil',
'Uma força de 50 N desloca um objeto por 4 metros na mesma direção da força. Qual o trabalho realizado?',
'12,5 J', '46 J', '54 J', '200 J', 'D',
'Trabalho = Força × Deslocamento = 50 N × 4 m = 200 J.',
'τ = F × d'),

('fisica', 2, 'Energia', 'Energia Cinética', 'medio',
'Um carro de 1000 kg viaja a 20 m/s. Qual é sua energia cinética?',
'10.000 J', '20.000 J', '100.000 J', '200.000 J', 'D',
'Ec = ½ × m × v² = ½ × 1000 × 20² = ½ × 1000 × 400 = 200.000 J.',
'Ec = ½mv²'),

('fisica', 2, 'Energia', 'Energia Potencial', 'medio',
'Um objeto de 5 kg está a 10 metros de altura. Qual sua energia potencial gravitacional? (g = 10 m/s²)',
'50 J', '100 J', '250 J', '500 J', 'D',
'Ep = m × g × h = 5 × 10 × 10 = 500 J.',
'Ep = mgh'),

-- Termodinâmica - 2º Ano
('fisica', 2, 'Termodinâmica', 'Calor', 'facil',
'Em que escala a água ferve a 100°?',
'Kelvin', 'Fahrenheit', 'Celsius', 'Rankine', 'C',
'Na escala Celsius, a água ferve a 100°C ao nível do mar.',
'Pense nas escalas mais usadas no Brasil'),

('fisica', 2, 'Termodinâmica', 'Calor', 'medio',
'Quantos Kelvin correspondem a 27°C?',
'246 K', '273 K', '300 K', '327 K', 'C',
'K = °C + 273, então K = 27 + 273 = 300 K.',
'Some 273 à temperatura em Celsius'),

-- Eletricidade - 3º Ano
('fisica', 3, 'Eletricidade', 'Lei de Ohm', 'facil',
'Um resistor de 10 Ω é submetido a uma tensão de 20 V. Qual a corrente elétrica?',
'0,5 A', '2 A', '30 A', '200 A', 'B',
'Pela Lei de Ohm: I = V/R = 20/10 = 2 A.',
'I = V/R'),

('fisica', 3, 'Eletricidade', 'Potência Elétrica', 'medio',
'Uma lâmpada de 60 W fica ligada por 5 horas. Qual a energia consumida em kWh?',
'0,3 kWh', '12 kWh', '300 kWh', '3000 kWh', 'A',
'E = P × t = 60W × 5h = 300 Wh = 0,3 kWh.',
'Converta Watts para kilowatts'),

('fisica', 3, 'Eletricidade', 'Circuitos', 'dificil',
'Dois resistores de 6 Ω estão em paralelo. Qual a resistência equivalente?',
'0,5 Ω', '3 Ω', '6 Ω', '12 Ω', 'B',
'Para resistores em paralelo: 1/Req = 1/R1 + 1/R2 = 1/6 + 1/6 = 2/6. Logo Req = 3 Ω.',
'Em paralelo, a resistência equivalente é menor'),

-- Ondas - 2º Ano
('fisica', 2, 'Ondas', 'Velocidade', 'medio',
'Uma onda tem frequência de 500 Hz e comprimento de onda de 0,68 m. Qual sua velocidade?',
'340 m/s', '500 m/s', '680 m/s', '735 m/s', 'A',
'v = f × λ = 500 × 0,68 = 340 m/s.',
'v = f × λ'),

('fisica', 2, 'Ondas', 'Som', 'facil',
'Qual é a velocidade aproximada do som no ar?',
'30 m/s', '300 m/s', '340 m/s', '3400 m/s', 'C',
'A velocidade do som no ar ao nível do mar é aproximadamente 340 m/s.',
'É uma velocidade de três dígitos')
ON CONFLICT (enunciado) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES DE MATEMÁTICA - ENSINO FUNDAMENTAL (idempotente)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO questoes (componente, ano, tema, subtema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, explicacao, dica) VALUES

-- 6º Ano - Números
('matematica', 6, 'Números', 'Operações Básicas', 'facil',
'Quanto é 456 + 789?',
'1.135', '1.245', '1.345', '1.235', 'B',
'456 + 789 = 1.245. Some unidade com unidade, dezena com dezena, centena com centena.',
'Some coluna por coluna'),

('matematica', 6, 'Números', 'Operações Básicas', 'facil',
'Qual é o resultado de 1.000 - 367?',
'533', '633', '733', '643', 'B',
'1.000 - 367 = 633.',
'Empreste quando necessário'),

('matematica', 6, 'Números', 'Múltiplos', 'medio',
'Qual é o menor múltiplo comum (MMC) de 4 e 6?',
'2', '6', '12', '24', 'C',
'Múltiplos de 4: 4, 8, 12, 16... Múltiplos de 6: 6, 12, 18... O menor comum é 12.',
'Liste os múltiplos até encontrar o primeiro comum'),

-- 7º Ano - Álgebra Básica
('matematica', 7, 'Álgebra', 'Equações', 'facil',
'Resolva a equação: x + 5 = 12',
'x = 5', 'x = 7', 'x = 12', 'x = 17', 'B',
'x + 5 = 12 → x = 12 - 5 → x = 7.',
'Isole o x passando o 5 para o outro lado'),

('matematica', 7, 'Álgebra', 'Equações', 'medio',
'Resolva: 2x - 3 = 11',
'x = 4', 'x = 5,5', 'x = 7', 'x = 14', 'C',
'2x - 3 = 11 → 2x = 14 → x = 7.',
'Primeiro isole o termo com x'),

('matematica', 7, 'Álgebra', 'Proporcionalidade', 'medio',
'Se 3 canetas custam R$ 12,00, quanto custam 5 canetas?',
'R$ 15,00', 'R$ 18,00', 'R$ 20,00', 'R$ 25,00', 'C',
'3 canetas = R$ 12,00 → 1 caneta = R$ 4,00 → 5 canetas = R$ 20,00.',
'Encontre o preço de uma caneta primeiro'),

-- 8º Ano - Geometria
('matematica', 8, 'Geometria', 'Área', 'facil',
'Qual é a área de um retângulo com base 8 cm e altura 5 cm?',
'13 cm²', '26 cm²', '40 cm²', '80 cm²', 'C',
'Área do retângulo = base × altura = 8 × 5 = 40 cm².',
'A = b × h'),

('matematica', 8, 'Geometria', 'Teorema de Pitágoras', 'medio',
'Em um triângulo retângulo, os catetos medem 3 cm e 4 cm. Qual o valor da hipotenusa?',
'5 cm', '6 cm', '7 cm', '12 cm', 'A',
'Pelo Teorema de Pitágoras: h² = 3² + 4² = 9 + 16 = 25. Logo h = 5 cm.',
'a² + b² = c²'),

('matematica', 8, 'Geometria', 'Círculo', 'medio',
'Qual é a área de um círculo de raio 7 cm? (Use π = 22/7)',
'44 cm²', '154 cm²', '308 cm²', '616 cm²', 'B',
'A = π × r² = (22/7) × 7² = (22/7) × 49 = 22 × 7 = 154 cm².',
'A = πr²'),

-- 9º Ano - Álgebra Avançada
('matematica', 9, 'Álgebra', 'Equação do 2º Grau', 'medio',
'Quais são as raízes da equação x² - 5x + 6 = 0?',
'x = 2 e x = 3', 'x = 1 e x = 6', 'x = -2 e x = -3', 'x = 2 e x = -3', 'A',
'Fatorando: (x - 2)(x - 3) = 0. Logo x = 2 ou x = 3.',
'Procure dois números que somem 5 e multipliquem 6'),

('matematica', 9, 'Álgebra', 'Equação do 2º Grau', 'dificil',
'Resolva x² + 4x - 21 = 0 usando Bhaskara.',
'x = 3 e x = -7', 'x = -3 e x = 7', 'x = 3 e x = 7', 'x = -3 e x = -7', 'A',
'Δ = 16 + 84 = 100. x = (-4 ± 10)/2. x₁ = 3, x₂ = -7.',
'Calcule o discriminante primeiro'),

('matematica', 9, 'Funções', 'Função Afim', 'medio',
'Dada a função f(x) = 2x + 3, qual é o valor de f(4)?',
'5', '8', '11', '14', 'C',
'f(4) = 2 × 4 + 3 = 8 + 3 = 11.',
'Substitua x por 4')
ON CONFLICT (enunciado) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES DE MATEMÁTICA - ENSINO MÉDIO (idempotente)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO questoes (componente, ano, tema, subtema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, explicacao, dica) VALUES

-- 1º Ano - Funções
('matematica', 1, 'Funções', 'Função do 1º Grau', 'facil',
'Qual é o zero da função f(x) = 3x - 9?',
'x = -3', 'x = 0', 'x = 3', 'x = 9', 'C',
'Zero da função: 3x - 9 = 0 → 3x = 9 → x = 3.',
'Iguale a função a zero'),

('matematica', 1, 'Funções', 'Função do 2º Grau', 'medio',
'Qual é o vértice da parábola y = x² - 4x + 3?',
'(2, -1)', '(2, 1)', '(-2, -1)', '(-2, 1)', 'A',
'xv = -b/2a = 4/2 = 2. yv = 4 - 8 + 3 = -1. Vértice: (2, -1).',
'xv = -b/2a'),

('matematica', 1, 'Funções', 'Função Exponencial', 'medio',
'Simplifique: 2³ × 2⁴',
'2⁷', '2¹²', '4⁷', '4¹²', 'A',
'Na multiplicação de potências de mesma base, somam-se os expoentes: 2³ × 2⁴ = 2⁷.',
'Some os expoentes'),

('matematica', 1, 'Funções', 'Logaritmo', 'medio',
'Qual é o valor de log₂(8)?',
'2', '3', '4', '8', 'B',
'log₂(8) = x significa 2ˣ = 8. Como 2³ = 8, x = 3.',
'2 elevado a quanto dá 8?'),

-- 2º Ano - Trigonometria
('matematica', 2, 'Trigonometria', 'Razões Trigonométricas', 'facil',
'Em um triângulo retângulo, o seno de 30° é igual a:',
'1/2', '√2/2', '√3/2', '1', 'A',
'sen(30°) = 1/2. Este é um valor tabelado importante.',
'Lembre da tabela de valores notáveis'),

('matematica', 2, 'Trigonometria', 'Razões Trigonométricas', 'medio',
'Qual é o valor de cos(60°)?',
'1/2', '√2/2', '√3/2', '0', 'A',
'cos(60°) = 1/2. Este é um valor tabelado.',
'cos(60°) = sen(30°)'),

('matematica', 2, 'Trigonometria', 'Lei dos Senos', 'dificil',
'Em um triângulo, o lado a = 10, o ângulo A = 30° e o ângulo B = 45°. Qual o valor de b? (sen 30° = 0,5, sen 45° = √2/2 ≈ 0,707)',
'≈ 14,14', '≈ 10', '≈ 7,07', '≈ 5', 'A',
'a/senA = b/senB → 10/0,5 = b/0,707 → b = 20 × 0,707 ≈ 14,14.',
'Use a/senA = b/senB'),

-- 2º Ano - Geometria Analítica
('matematica', 2, 'Geometria Analítica', 'Distância', 'medio',
'Qual a distância entre os pontos A(1, 2) e B(4, 6)?',
'3', '4', '5', '7', 'C',
'd = √[(4-1)² + (6-2)²] = √[9 + 16] = √25 = 5.',
'd = √[(x₂-x₁)² + (y₂-y₁)²]'),

('matematica', 2, 'Geometria Analítica', 'Ponto Médio', 'facil',
'Qual é o ponto médio do segmento com extremos A(2, 4) e B(6, 8)?',
'(3, 5)', '(4, 6)', '(4, 5)', '(3, 6)', 'B',
'M = ((2+6)/2, (4+8)/2) = (4, 6).',
'Média das coordenadas'),

-- 3º Ano - Combinatória
('matematica', 3, 'Análise Combinatória', 'Fatorial', 'facil',
'Quanto vale 5!?',
'15', '25', '120', '720', 'C',
'5! = 5 × 4 × 3 × 2 × 1 = 120.',
'Multiplique de 5 até 1'),

('matematica', 3, 'Análise Combinatória', 'Arranjo', 'medio',
'De quantas maneiras podemos escolher 2 representantes de uma turma de 5 alunos, sendo um líder e um vice?',
'10', '20', '25', '60', 'B',
'A(5,2) = 5!/(5-2)! = 5!/3! = 5 × 4 = 20.',
'A ordem importa'),

('matematica', 3, 'Análise Combinatória', 'Combinação', 'medio',
'De quantas formas podemos formar uma comissão de 3 pessoas a partir de 6 candidatos?',
'18', '20', '120', '720', 'B',
'C(6,3) = 6!/(3!×3!) = (6×5×4)/(3×2×1) = 20.',
'A ordem não importa'),

-- 3º Ano - Probabilidade
('matematica', 3, 'Probabilidade', 'Básica', 'facil',
'Ao lançar um dado honesto, qual a probabilidade de sair um número par?',
'1/6', '1/3', '1/2', '2/3', 'C',
'Números pares: 2, 4, 6 (3 casos). Total: 6 faces. P = 3/6 = 1/2.',
'Quantos números pares tem em um dado?'),

('matematica', 3, 'Probabilidade', 'Eventos', 'medio',
'Uma urna tem 4 bolas vermelhas e 6 azuis. Qual a probabilidade de retirar uma bola vermelha?',
'2/5', '3/5', '4/5', '6/10', 'A',
'P = 4/(4+6) = 4/10 = 2/5.',
'P = casos favoráveis / total'),

-- 3º Ano - Estatística
('matematica', 3, 'Estatística', 'Média', 'facil',
'Qual é a média aritmética de 5, 7, 8, 10 e 10?',
'7', '8', '9', '10', 'B',
'Média = (5 + 7 + 8 + 10 + 10) / 5 = 40 / 5 = 8.',
'Some todos e divida pela quantidade'),

('matematica', 3, 'Estatística', 'Mediana', 'medio',
'Qual é a mediana do conjunto {3, 7, 2, 9, 5}?',
'2', '5', '7', '9', 'B',
'Ordenando: 2, 3, 5, 7, 9. A mediana (valor central) é 5.',
'Ordene primeiro, depois encontre o valor do meio')
ON CONFLICT (enunciado) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- ATUALIZAR PROGRESSO DOS ESTUDANTES DE EXEMPLO
-- (Só executa se os registros existirem)
-- ═══════════════════════════════════════════════════════════════════════════

-- Maria Silva - Aluna exemplar
UPDATE usuarios SET
    fis_pontos = 890,
    fis_questoes_total = 95,
    fis_questoes_corretas = 72,
    fis_sequencia_dias = 12,
    fis_nivel = 'Dedicado',
    mat_pontos = 720,
    mat_questoes_total = 80,
    mat_questoes_corretas = 60,
    mat_sequencia_dias = 12,
    mat_nivel = 'Estudioso'
WHERE email = 'mariasilvasantos@1a';

-- João Pedro - Bom aluno
UPDATE usuarios SET
    fis_pontos = 650,
    fis_questoes_total = 70,
    fis_questoes_corretas = 52,
    fis_sequencia_dias = 5,
    fis_nivel = 'Estudioso',
    mat_pontos = 450,
    mat_questoes_total = 50,
    mat_questoes_corretas = 35,
    mat_sequencia_dias = 5,
    mat_nivel = 'Curioso'
WHERE email = 'joaopedrolima@1a';

-- Ana Clara - Aluna mediana
UPDATE usuarios SET
    fis_pontos = 320,
    fis_questoes_total = 40,
    fis_questoes_corretas = 28,
    fis_sequencia_dias = 3,
    fis_nivel = 'Aprendiz',
    mat_pontos = 280,
    mat_questoes_total = 35,
    mat_questoes_corretas = 24,
    mat_sequencia_dias = 3,
    mat_nivel = 'Curioso'
WHERE email = 'anaclarasousa@1a';

-- Carlos Eduardo - Aluno de matemática (EF)
UPDATE usuarios SET
    mat_pontos = 180,
    mat_questoes_total = 25,
    mat_questoes_corretas = 18,
    mat_sequencia_dias = 2,
    mat_nivel = 'Curioso'
WHERE email = 'carloseduardosilva@7b';
