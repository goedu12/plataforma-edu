-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES EXTRAS - FÍSICA E MATEMÁTICA
-- 100 questões para expandir o banco de dados
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA - 1º ANO (Cinemática e Dinâmica) - 25 questões
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (componente, ano, tema, subtema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, explicacao, dica) VALUES

-- Cinemática - Fáceis
('fisica', 1, 'Cinemática', 'Conceitos Básicos', 'facil',
'Um objeto percorre 200 metros em 20 segundos com velocidade constante. Qual é sua velocidade?',
'5 m/s', '10 m/s', '20 m/s', '40 m/s', 'B',
'Velocidade = distância / tempo = 200m / 20s = 10 m/s.',
'v = d / t'),

('fisica', 1, 'Cinemática', 'Conceitos Básicos', 'facil',
'Qual a unidade de velocidade no Sistema Internacional (SI)?',
'km/h', 'm/s', 'cm/s', 'km/s', 'B',
'No SI, a unidade de velocidade é metro por segundo (m/s).',
'Pense nas unidades básicas: metro e segundo'),

('fisica', 1, 'Cinemática', 'MRU', 'facil',
'Um trem viaja a 90 km/h. Qual é essa velocidade em m/s?',
'15 m/s', '25 m/s', '30 m/s', '90 m/s', 'B',
'Para converter km/h para m/s, divide-se por 3,6. 90 / 3,6 = 25 m/s.',
'Divida por 3,6'),

('fisica', 1, 'Cinemática', 'MRU', 'facil',
'Uma bicicleta percorre 3 km em 10 minutos. Qual sua velocidade média em km/h?',
'18 km/h', '30 km/h', '3 km/h', '0,3 km/h', 'A',
'10 minutos = 1/6 hora. v = 3 / (1/6) = 3 × 6 = 18 km/h.',
'Converta minutos para horas'),

('fisica', 1, 'Cinemática', 'Velocidade', 'facil',
'Se um carro dobra sua velocidade, em quanto tempo ele percorre a mesma distância?',
'O dobro do tempo', 'Metade do tempo', 'O mesmo tempo', 'Um quarto do tempo', 'B',
'Se v dobra e d é constante, t = d/v cai pela metade.',
'Pense na relação inversa entre velocidade e tempo'),

-- Cinemática - Médias
('fisica', 1, 'Cinemática', 'MRUV', 'medio',
'Um carro parte do repouso e atinge 20 m/s em 5 segundos. Qual sua aceleração?',
'2 m/s²', '4 m/s²', '5 m/s²', '100 m/s²', 'B',
'a = (v - v0) / t = (20 - 0) / 5 = 4 m/s².',
'Use a = Δv / t'),

('fisica', 1, 'Cinemática', 'MRUV', 'medio',
'Um objeto com velocidade inicial de 10 m/s acelera a 2 m/s² por 6 segundos. Qual a velocidade final?',
'12 m/s', '22 m/s', '32 m/s', '72 m/s', 'B',
'v = v0 + at = 10 + 2×6 = 10 + 12 = 22 m/s.',
'v = v0 + at'),

('fisica', 1, 'Cinemática', 'MRUV', 'medio',
'Uma moto freia uniformemente de 30 m/s até parar em 6 segundos. Qual a desaceleração?',
'-5 m/s²', '-6 m/s²', '5 m/s²', '180 m/s²', 'A',
'a = (0 - 30) / 6 = -5 m/s². O sinal negativo indica desaceleração.',
'Velocidade final é zero'),

('fisica', 1, 'Cinemática', 'Queda Livre', 'medio',
'Um objeto cai do repouso. Qual sua velocidade após 3 segundos? (g = 10 m/s²)',
'10 m/s', '20 m/s', '30 m/s', '45 m/s', 'C',
'v = g × t = 10 × 3 = 30 m/s.',
'Na queda livre, v = gt'),

('fisica', 1, 'Cinemática', 'Queda Livre', 'medio',
'Qual a altura máxima atingida por uma bola lançada para cima com 20 m/s? (g = 10 m/s²)',
'10 m', '20 m', '40 m', '200 m', 'B',
'h = v²/(2g) = 400/20 = 20 m.',
'No ponto mais alto, v = 0'),

-- Cinemática - Difíceis
('fisica', 1, 'Cinemática', 'MRUV', 'dificil',
'Um carro acelera de 10 m/s a 30 m/s percorrendo 200 m. Qual a aceleração?',
'1 m/s²', '2 m/s²', '4 m/s²', '8 m/s²', 'B',
'v² = v0² + 2ad → 900 = 100 + 2a(200) → 800 = 400a → a = 2 m/s².',
'Use a equação de Torricelli'),

('fisica', 1, 'Cinemática', 'MRUV', 'dificil',
'Um projétil é lançado verticalmente com 50 m/s. Após quanto tempo retorna ao solo? (g = 10 m/s²)',
'5 s', '10 s', '15 s', '25 s', 'B',
'Tempo de subida = v0/g = 5s. Tempo total = 2 × 5 = 10s.',
'O tempo de subida é igual ao de descida'),

-- Dinâmica - Fáceis
('fisica', 1, 'Dinâmica', 'Leis de Newton', 'facil',
'Qual lei de Newton explica por que usamos cinto de segurança?',
'Primeira Lei (Inércia)', 'Segunda Lei', 'Terceira Lei', 'Lei da Gravitação', 'A',
'O cinto nos protege porque nosso corpo tende a continuar em movimento (inércia).',
'Pense no que acontece quando o carro freia bruscamente'),

('fisica', 1, 'Dinâmica', 'Força', 'facil',
'Qual a força resultante necessária para acelerar um objeto de 5 kg a 3 m/s²?',
'3 N', '5 N', '15 N', '1,67 N', 'C',
'F = m × a = 5 × 3 = 15 N.',
'Use F = ma'),

('fisica', 1, 'Dinâmica', 'Peso', 'facil',
'Uma pessoa tem massa de 70 kg. Qual seu peso na Terra? (g = 10 m/s²)',
'7 N', '70 N', '700 N', '7000 N', 'C',
'P = m × g = 70 × 10 = 700 N.',
'Peso = massa × gravidade'),

-- Dinâmica - Médias
('fisica', 1, 'Dinâmica', 'Segunda Lei', 'medio',
'Duas forças de 8 N e 6 N atuam perpendicularmente sobre um objeto. Qual a força resultante?',
'2 N', '10 N', '14 N', '48 N', 'B',
'FR = √(8² + 6²) = √(64 + 36) = √100 = 10 N.',
'Use o teorema de Pitágoras'),

('fisica', 1, 'Dinâmica', 'Atrito', 'medio',
'Um bloco de 10 kg está sobre uma superfície com coeficiente de atrito 0,3. Qual a força de atrito máxima? (g = 10 m/s²)',
'3 N', '30 N', '100 N', '300 N', 'B',
'Fat = μ × N = 0,3 × 10 × 10 = 30 N.',
'Fat = μ × mg'),

('fisica', 1, 'Dinâmica', 'Terceira Lei', 'medio',
'Um livro de 2 kg repousa sobre uma mesa. Com que força a mesa empurra o livro? (g = 10 m/s²)',
'0 N', '2 N', '20 N', '200 N', 'C',
'A força normal é igual ao peso: N = mg = 2 × 10 = 20 N.',
'Ação e reação'),

-- Dinâmica - Difíceis
('fisica', 1, 'Dinâmica', 'Plano Inclinado', 'dificil',
'Um bloco de 5 kg está em um plano inclinado de 30°. Qual a componente do peso paralela ao plano? (g = 10 m/s², sen30° = 0,5)',
'25 N', '43,3 N', '50 N', '100 N', 'A',
'Px = m × g × sen(θ) = 5 × 10 × 0,5 = 25 N.',
'Decomponha o peso em componentes'),

('fisica', 1, 'Dinâmica', 'Sistema de Corpos', 'dificil',
'Dois blocos de 3 kg e 2 kg estão ligados por um fio sobre uma superfície sem atrito. Uma força de 10 N é aplicada no bloco de 3 kg. Qual a aceleração do sistema?',
'1 m/s²', '2 m/s²', '3,33 m/s²', '5 m/s²', 'B',
'a = F / (m1 + m2) = 10 / 5 = 2 m/s².',
'Os blocos aceleram juntos'),

-- Energia - Fáceis
('fisica', 1, 'Energia', 'Trabalho', 'facil',
'Uma força de 20 N desloca um objeto 5 metros na mesma direção. Qual o trabalho realizado?',
'4 J', '25 J', '100 J', '500 J', 'C',
'W = F × d = 20 × 5 = 100 J.',
'Trabalho = Força × Deslocamento'),

('fisica', 1, 'Energia', 'Potência', 'facil',
'Uma máquina realiza 600 J de trabalho em 20 segundos. Qual sua potência?',
'30 W', '120 W', '12000 W', '580 W', 'A',
'P = W / t = 600 / 20 = 30 W.',
'Potência = Trabalho / Tempo'),

-- Energia - Médias
('fisica', 1, 'Energia', 'Energia Cinética', 'medio',
'Um carro de 800 kg viaja a 15 m/s. Qual sua energia cinética?',
'6.000 J', '12.000 J', '90.000 J', '180.000 J', 'C',
'Ec = ½mv² = ½ × 800 × 225 = 90.000 J.',
'Ec = ½mv²'),

('fisica', 1, 'Energia', 'Conservação', 'medio',
'Uma bola de 2 kg cai de 5 m de altura. Qual sua velocidade ao chegar ao solo? (g = 10 m/s²)',
'5 m/s', '10 m/s', '50 m/s', '100 m/s', 'B',
'mgh = ½mv² → v = √(2gh) = √(2×10×5) = √100 = 10 m/s.',
'Use conservação de energia');

-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA - 2º ANO (Termologia e Ondas) - 25 questões
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (componente, ano, tema, subtema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, explicacao, dica) VALUES

-- Termologia - Fáceis
('fisica', 2, 'Termologia', 'Escalas', 'facil',
'Qual a temperatura de ebulição da água na escala Fahrenheit?',
'100°F', '180°F', '212°F', '273°F', 'C',
'A água ferve a 100°C, que equivale a 212°F.',
'100°C = 212°F'),

('fisica', 2, 'Termologia', 'Escalas', 'facil',
'Converta 20°C para Kelvin.',
'253 K', '273 K', '293 K', '313 K', 'C',
'K = °C + 273 = 20 + 273 = 293 K.',
'Some 273'),

('fisica', 2, 'Termologia', 'Calor', 'facil',
'O que acontece quando dois corpos de temperaturas diferentes entram em contato?',
'O mais frio ganha calor', 'O mais quente perde calor', 'Calor flui do mais quente para o mais frio', 'Todas as anteriores', 'D',
'O calor sempre flui do corpo mais quente para o mais frio até o equilíbrio térmico.',
'Lei Zero da Termodinâmica'),

('fisica', 2, 'Termologia', 'Dilatação', 'facil',
'Por que deixamos folgas em trilhos de trem?',
'Para reduzir ruído', 'Para permitir dilatação térmica', 'Para economizar material', 'Para facilitar curvas', 'B',
'Os trilhos dilatam com o calor. Sem folgas, deformariam.',
'Pense no que acontece quando o metal aquece'),

-- Termologia - Médias
('fisica', 2, 'Termologia', 'Calorimetria', 'medio',
'Quantas calorias são necessárias para aquecer 500g de água de 20°C a 80°C?',
'3.000 cal', '30.000 cal', '300 cal', '60.000 cal', 'B',
'Q = mcΔT = 500 × 1 × 60 = 30.000 cal.',
'c da água = 1 cal/g°C'),

('fisica', 2, 'Termologia', 'Calorimetria', 'medio',
'Um metal de 200g e calor específico 0,1 cal/g°C recebe 400 cal. Qual a variação de temperatura?',
'2°C', '8°C', '20°C', '80°C', 'C',
'ΔT = Q/(mc) = 400/(200×0,1) = 400/20 = 20°C.',
'Isole ΔT na fórmula'),

('fisica', 2, 'Termologia', 'Mudança de Fase', 'medio',
'Durante a fusão do gelo, a temperatura...',
'aumenta', 'diminui', 'permanece constante', 'varia aleatoriamente', 'C',
'Durante a mudança de fase, a temperatura permanece constante.',
'A energia é usada para quebrar ligações'),

-- Termologia - Difíceis
('fisica', 2, 'Termologia', 'Calorimetria', 'dificil',
'Mistura-se 100g de água a 80°C com 200g de água a 20°C. Qual a temperatura de equilíbrio?',
'30°C', '40°C', '50°C', '60°C', 'B',
'm1c(T-T1) + m2c(T-T2) = 0 → 100(T-80) + 200(T-20) = 0 → T = 40°C.',
'Use a equação do equilíbrio térmico'),

-- Ondas - Fáceis
('fisica', 2, 'Ondas', 'Conceitos', 'facil',
'O que é o período de uma onda?',
'Distância entre duas cristas', 'Tempo para completar um ciclo', 'Velocidade da onda', 'Altura da onda', 'B',
'Período (T) é o tempo necessário para a onda completar uma oscilação.',
'Período = 1/frequência'),

('fisica', 2, 'Ondas', 'Conceitos', 'facil',
'Qual a relação entre frequência e período?',
'f = T', 'f = 1/T', 'f = T²', 'f = 2T', 'B',
'Frequência é o inverso do período: f = 1/T.',
'São grandezas inversas'),

('fisica', 2, 'Ondas', 'Som', 'facil',
'O som pode se propagar no vácuo?',
'Sim, rapidamente', 'Sim, lentamente', 'Não', 'Depende da frequência', 'C',
'O som é uma onda mecânica e precisa de um meio material para se propagar.',
'Som precisa de moléculas'),

-- Ondas - Médias
('fisica', 2, 'Ondas', 'Equação', 'medio',
'Uma onda tem frequência de 200 Hz e comprimento de onda de 1,7 m. Qual sua velocidade?',
'117,6 m/s', '340 m/s', '1700 m/s', '200 m/s', 'B',
'v = f × λ = 200 × 1,7 = 340 m/s.',
'v = f × λ'),

('fisica', 2, 'Ondas', 'Equação', 'medio',
'Uma onda sonora de 680 Hz viaja a 340 m/s. Qual seu comprimento de onda?',
'0,5 m', '1 m', '2 m', '340 m', 'A',
'λ = v/f = 340/680 = 0,5 m.',
'λ = v/f'),

-- Óptica - Fáceis
('fisica', 2, 'Óptica', 'Reflexão', 'facil',
'Qual a lei da reflexão?',
'Ângulo de incidência igual ao de refração', 'Ângulo de incidência igual ao de reflexão', 'Luz viaja em linha curva', 'Luz não reflete', 'B',
'O ângulo de incidência é sempre igual ao ângulo de reflexão.',
'i = r'),

('fisica', 2, 'Óptica', 'Espelhos', 'facil',
'A imagem formada por um espelho plano é:',
'Real e invertida', 'Virtual e direita', 'Real e direita', 'Virtual e invertida', 'B',
'Espelhos planos formam imagens virtuais, direitas e do mesmo tamanho.',
'Pense em como você se vê no espelho'),

-- Óptica - Médias
('fisica', 2, 'Óptica', 'Espelhos Esféricos', 'medio',
'Um objeto está a 30 cm de um espelho côncavo de distância focal 10 cm. A imagem é:',
'Real e maior', 'Real e menor', 'Virtual e maior', 'Virtual e menor', 'B',
'Objeto além do centro: imagem real, invertida e menor.',
'Use a equação dos espelhos'),

('fisica', 2, 'Óptica', 'Refração', 'medio',
'Quando a luz passa do ar para a água, ela:',
'Acelera e afasta da normal', 'Desacelera e aproxima da normal', 'Mantém velocidade', 'Não refrata', 'B',
'Ao entrar em meio mais denso, a luz desacelera e aproxima-se da normal.',
'Água é mais densa que ar'),

-- Termodinâmica - Médias
('fisica', 2, 'Termodinâmica', 'Primeira Lei', 'medio',
'Um gás recebe 500 J de calor e realiza 200 J de trabalho. Qual a variação da energia interna?',
'300 J', '500 J', '700 J', '-300 J', 'A',
'ΔU = Q - W = 500 - 200 = 300 J.',
'ΔU = Q - W'),

('fisica', 2, 'Termodinâmica', 'Processos', 'medio',
'Em uma transformação isotérmica, o que permanece constante?',
'Pressão', 'Volume', 'Temperatura', 'Energia interna apenas', 'C',
'Isotérmico significa temperatura constante.',
'Iso = igual, térmico = temperatura'),

-- Termodinâmica - Difíceis
('fisica', 2, 'Termodinâmica', 'Segunda Lei', 'dificil',
'Por que é impossível construir uma máquina com 100% de eficiência?',
'Falta tecnologia', 'Sempre há perdas por atrito e calor', 'A Segunda Lei proíbe', 'B e C estão corretas', 'D',
'A Segunda Lei da Termodinâmica estabelece que sempre há aumento de entropia.',
'Pense na entropia'),

('fisica', 2, 'Óptica', 'Lentes', 'dificil',
'Uma lente convergente de distância focal 20 cm forma imagem real a 30 cm. A que distância está o objeto?',
'60 cm', '50 cm', '12 cm', '10 cm', 'A',
'1/f = 1/p + 1/p'' → 1/20 = 1/p + 1/30 → p = 60 cm.',
'Use a equação de Gauss'),

('fisica', 2, 'Ondas', 'Doppler', 'dificil',
'Uma ambulância se aproxima com sirene de 500 Hz. O observador percebe frequência:',
'Menor que 500 Hz', 'Igual a 500 Hz', 'Maior que 500 Hz', 'Zero', 'C',
'Quando a fonte se aproxima, as ondas são comprimidas e a frequência aumenta.',
'Efeito Doppler'),

('fisica', 2, 'Ondas', 'Interferência', 'dificil',
'O que acontece quando duas ondas de mesma fase se encontram?',
'Interferência destrutiva', 'Interferência construtiva', 'Cancelamento total', 'Reflexão', 'B',
'Ondas em fase somam suas amplitudes (interferência construtiva).',
'Em fase = cristas se encontram');

-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA - 3º ANO (Eletricidade) - 25 questões
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (componente, ano, tema, subtema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, explicacao, dica) VALUES

-- Eletrostática - Fáceis
('fisica', 3, 'Eletrostática', 'Carga', 'facil',
'Qual a carga elementar (do elétron)?',
'1,6 × 10⁻¹⁹ C', '1,6 × 10⁻⁹ C', '9,1 × 10⁻³¹ kg', '6 × 10²³', 'A',
'A carga do elétron é aproximadamente 1,6 × 10⁻¹⁹ coulombs.',
'É uma constante fundamental'),

('fisica', 3, 'Eletrostática', 'Carga', 'facil',
'O que acontece quando atritamos um bastão de vidro com seda?',
'Vidro fica positivo', 'Vidro fica negativo', 'Seda fica positiva', 'Nada acontece', 'A',
'O vidro perde elétrons para a seda e fica positivo.',
'Vidro perde elétrons'),

('fisica', 3, 'Eletrostática', 'Campo', 'facil',
'As linhas de campo elétrico saem de cargas:',
'Negativas', 'Positivas', 'Neutras', 'Qualquer uma', 'B',
'Linhas de campo elétrico saem de cargas positivas e entram em negativas.',
'+ para -'),

-- Eletrostática - Médias
('fisica', 3, 'Eletrostática', 'Lei de Coulomb', 'medio',
'Duas cargas de 2 μC estão a 0,1 m de distância. Qual a força entre elas? (k = 9×10⁹)',
'0,36 N', '3,6 N', '36 N', '360 N', 'B',
'F = k×q₁×q₂/d² = 9×10⁹ × 4×10⁻¹² / 0,01 = 3,6 N.',
'Use a Lei de Coulomb'),

('fisica', 3, 'Eletrostática', 'Campo', 'medio',
'Qual o campo elétrico a 0,3 m de uma carga de 3 μC? (k = 9×10⁹)',
'100.000 N/C', '300.000 N/C', '900.000 N/C', '3.000.000 N/C', 'B',
'E = k×q/d² = 9×10⁹ × 3×10⁻⁶ / 0,09 = 300.000 N/C.',
'E = kq/d²'),

-- Eletrodinâmica - Fáceis
('fisica', 3, 'Eletrodinâmica', 'Corrente', 'facil',
'O que é corrente elétrica?',
'Movimento de prótons', 'Movimento ordenado de cargas', 'Acúmulo de cargas', 'Energia potencial', 'B',
'Corrente elétrica é o movimento ordenado de cargas elétricas.',
'Cargas em movimento'),

('fisica', 3, 'Eletrodinâmica', 'Lei de Ohm', 'facil',
'A resistência elétrica é medida em:',
'Ampères', 'Volts', 'Ohms', 'Watts', 'C',
'A unidade de resistência no SI é o ohm (Ω).',
'R = V/I'),

('fisica', 3, 'Eletrodinâmica', 'Lei de Ohm', 'facil',
'Um resistor de 20 Ω é submetido a 100 V. Qual a corrente?',
'0,5 A', '2 A', '5 A', '2000 A', 'C',
'I = V/R = 100/20 = 5 A.',
'I = V/R'),

-- Eletrodinâmica - Médias
('fisica', 3, 'Eletrodinâmica', 'Potência', 'medio',
'Um chuveiro de 5500 W ligado em 220 V consome qual corrente?',
'25 A', '50 A', '1210 A', '0,04 A', 'A',
'I = P/V = 5500/220 = 25 A.',
'P = V × I'),

('fisica', 3, 'Eletrodinâmica', 'Energia', 'medio',
'Uma lâmpada de 100 W ligada por 10 horas consome quantos kWh?',
'0,1 kWh', '1 kWh', '10 kWh', '1000 kWh', 'B',
'E = P × t = 100 × 10 = 1000 Wh = 1 kWh.',
'kWh = kW × h'),

('fisica', 3, 'Eletrodinâmica', 'Circuitos', 'medio',
'Três resistores de 6 Ω estão em série. Qual a resistência equivalente?',
'2 Ω', '6 Ω', '18 Ω', '1/18 Ω', 'C',
'Em série: Req = R1 + R2 + R3 = 6 + 6 + 6 = 18 Ω.',
'Série: soma'),

('fisica', 3, 'Eletrodinâmica', 'Circuitos', 'medio',
'Três resistores de 6 Ω estão em paralelo. Qual a resistência equivalente?',
'2 Ω', '6 Ω', '18 Ω', '1/18 Ω', 'A',
'Em paralelo: 1/Req = 1/6 + 1/6 + 1/6 = 3/6. Req = 2 Ω.',
'Paralelo: inverso da soma dos inversos'),

-- Eletrodinâmica - Difíceis
('fisica', 3, 'Eletrodinâmica', 'Circuitos Mistos', 'dificil',
'Dois resistores de 4 Ω em série estão em paralelo com um de 4 Ω. Qual a Req?',
'2 Ω', '4 Ω', '8/3 Ω', '12 Ω', 'C',
'Série: 4+4=8Ω. Paralelo com 4Ω: 1/Req = 1/8 + 1/4 = 3/8. Req = 8/3 Ω.',
'Resolva por partes'),

-- Eletromagnetismo - Fáceis
('fisica', 3, 'Eletromagnetismo', 'Campo Magnético', 'facil',
'O que gera um campo magnético?',
'Cargas em repouso', 'Cargas em movimento', 'Temperatura', 'Pressão', 'B',
'Cargas elétricas em movimento geram campo magnético.',
'Corrente elétrica gera campo'),

('fisica', 3, 'Eletromagnetismo', 'Ímãs', 'facil',
'É possível isolar um polo magnético?',
'Sim, cortando o ímã', 'Não, sempre aparecem dois polos', 'Só polos norte', 'Só polos sul', 'B',
'Monopolos magnéticos não existem. Ao cortar um ímã, surgem novos polos.',
'Sempre N-S juntos'),

-- Eletromagnetismo - Médias
('fisica', 3, 'Eletromagnetismo', 'Força Magnética', 'medio',
'Uma carga de 2 C move-se a 3 m/s perpendicular a um campo de 0,5 T. Qual a força?',
'1 N', '3 N', '0,5 N', '6 N', 'B',
'F = qvBsen(90°) = 2 × 3 × 0,5 × 1 = 3 N.',
'F = qvB'),

('fisica', 3, 'Eletromagnetismo', 'Indução', 'medio',
'O que é necessário para induzir uma corrente em uma espira?',
'Campo magnético constante', 'Variação do fluxo magnético', 'Campo elétrico', 'Temperatura alta', 'B',
'Lei de Faraday: a corrente induzida surge da variação do fluxo magnético.',
'Fluxo deve variar'),

-- Física Moderna - Fáceis
('fisica', 3, 'Física Moderna', 'Relatividade', 'facil',
'Qual a velocidade da luz no vácuo?',
'300 km/s', '3.000 km/s', '300.000 km/s', '3.000.000 km/s', 'C',
'A velocidade da luz é aproximadamente 3 × 10⁸ m/s = 300.000 km/s.',
'c ≈ 3 × 10⁸ m/s'),

('fisica', 3, 'Física Moderna', 'Quântica', 'facil',
'Quem propôs que a luz é formada por fótons?',
'Newton', 'Einstein', 'Bohr', 'Maxwell', 'B',
'Einstein propôs o conceito de fóton em 1905 ao explicar o efeito fotoelétrico.',
'Nobel de 1921'),

-- Física Moderna - Médias
('fisica', 3, 'Física Moderna', 'Efeito Fotoelétrico', 'medio',
'No efeito fotoelétrico, o que determina se elétrons serão arrancados?',
'Intensidade da luz', 'Frequência da luz', 'Cor do metal', 'Temperatura', 'B',
'A frequência deve ser maior que a frequência de corte do metal.',
'Energia do fóton depende da frequência'),

('fisica', 3, 'Física Moderna', 'Átomo de Bohr', 'medio',
'No modelo de Bohr, os elétrons:',
'Podem ter qualquer energia', 'Ocupam órbitas de energias quantizadas', 'Estão no núcleo', 'Não existem', 'B',
'Bohr propôs que elétrons só ocupam órbitas com energias específicas (quantizadas).',
'Energias discretas'),

-- Física Moderna - Difíceis
('fisica', 3, 'Física Moderna', 'E=mc²', 'dificil',
'Quanta energia é liberada quando 1 g de matéria é convertida? (c = 3×10⁸ m/s)',
'9 × 10¹⁰ J', '9 × 10¹³ J', '3 × 10⁸ J', '9 × 10¹⁶ J', 'B',
'E = mc² = 0,001 × (3×10⁸)² = 0,001 × 9×10¹⁶ = 9×10¹³ J.',
'E = mc²'),

('fisica', 3, 'Eletromagnetismo', 'Transformador', 'dificil',
'Um transformador tem 100 espiras no primário e 500 no secundário. Se Vp = 110 V, qual Vs?',
'22 V', '110 V', '550 V', '55000 V', 'C',
'Vs/Vp = Ns/Np → Vs = 110 × 500/100 = 550 V.',
'Relação de espiras'),

('fisica', 3, 'Eletrostática', 'Capacitores', 'dificil',
'Dois capacitores de 4 μF em série têm capacitância equivalente de:',
'8 μF', '4 μF', '2 μF', '1 μF', 'C',
'Em série: 1/Ceq = 1/C1 + 1/C2 = 1/4 + 1/4 = 1/2. Ceq = 2 μF.',
'Capacitores em série: como resistores em paralelo');

-- ═══════════════════════════════════════════════════════════════════════════
-- MATEMÁTICA - 6º e 7º ANO (25 questões)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (componente, ano, tema, subtema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, explicacao, dica) VALUES

-- 6º Ano - Fáceis
('matematica', 6, 'Números', 'Operações', 'facil',
'Quanto é 347 + 528?',
'775', '875', '865', '885', 'B',
'347 + 528 = 875. Some unidade com unidade, dezena com dezena.',
'Some da direita para esquerda'),

('matematica', 6, 'Números', 'Operações', 'facil',
'Qual o resultado de 1500 - 847?',
'653', '663', '753', '647', 'A',
'1500 - 847 = 653.',
'Empreste quando necessário'),

('matematica', 6, 'Números', 'Multiplicação', 'facil',
'Quanto é 25 × 4?',
'80', '90', '100', '110', 'C',
'25 × 4 = 100.',
'4 grupos de 25'),

('matematica', 6, 'Frações', 'Conceito', 'facil',
'Uma pizza foi dividida em 8 partes iguais. Se comi 3 partes, que fração comi?',
'3/5', '3/8', '5/8', '8/3', 'B',
'Comi 3 partes de 8, ou seja, 3/8 da pizza.',
'Parte comida / total'),

('matematica', 6, 'Frações', 'Operações', 'facil',
'Quanto é 1/4 + 1/4?',
'2/8', '1/2', '1/8', '2/4', 'B',
'1/4 + 1/4 = 2/4 = 1/2.',
'Denominadores iguais: some numeradores'),

-- 6º Ano - Médias
('matematica', 6, 'Frações', 'Operações', 'medio',
'Quanto é 2/3 + 1/6?',
'3/9', '3/6', '5/6', '1/2', 'C',
'2/3 = 4/6. Então 4/6 + 1/6 = 5/6.',
'Encontre o MMC dos denominadores'),

('matematica', 6, 'Números', 'MMC', 'medio',
'Qual o MMC de 6 e 8?',
'12', '24', '48', '2', 'B',
'Múltiplos de 6: 6,12,18,24... Múltiplos de 8: 8,16,24... MMC = 24.',
'Liste os múltiplos'),

('matematica', 6, 'Números', 'MDC', 'medio',
'Qual o MDC de 12 e 18?',
'2', '3', '6', '36', 'C',
'Divisores de 12: 1,2,3,4,6,12. Divisores de 18: 1,2,3,6,9,18. MDC = 6.',
'Maior divisor comum'),

('matematica', 6, 'Geometria', 'Perímetro', 'medio',
'Qual o perímetro de um retângulo de 8 cm por 5 cm?',
'13 cm', '26 cm', '40 cm', '80 cm', 'B',
'P = 2×(8+5) = 2×13 = 26 cm.',
'Some os lados e multiplique por 2'),

-- 6º Ano - Difíceis
('matematica', 6, 'Frações', 'Problemas', 'dificil',
'João tem R$ 120. Gastou 1/3 e depois 1/4 do que sobrou. Quanto gastou no total?',
'R$ 40', 'R$ 60', 'R$ 70', 'R$ 80', 'C',
'1/3 de 120 = 40. Sobrou 80. 1/4 de 80 = 20. Total: 40 + 30 = 70.',
'Calcule por etapas'),

-- 7º Ano - Fáceis
('matematica', 7, 'Álgebra', 'Equações', 'facil',
'Resolva: x + 7 = 15',
'x = 7', 'x = 8', 'x = 22', 'x = -8', 'B',
'x = 15 - 7 = 8.',
'Isole o x'),

('matematica', 7, 'Álgebra', 'Equações', 'facil',
'Resolva: 3x = 21',
'x = 7', 'x = 18', 'x = 63', 'x = 24', 'A',
'x = 21/3 = 7.',
'Divida ambos os lados por 3'),

('matematica', 7, 'Números', 'Inteiros', 'facil',
'Quanto é (-5) + (-3)?',
'-8', '-2', '8', '2', 'A',
'Dois negativos: somam os valores e mantém negativo. -5 + (-3) = -8.',
'Sinais iguais: soma'),

('matematica', 7, 'Números', 'Inteiros', 'facil',
'Quanto é (-4) × (-2)?',
'-8', '-6', '6', '8', 'D',
'Negativo vezes negativo é positivo: (-4) × (-2) = 8.',
'Menos com menos dá mais'),

-- 7º Ano - Médias
('matematica', 7, 'Álgebra', 'Equações', 'medio',
'Resolva: 4x - 5 = 15',
'x = 2,5', 'x = 5', 'x = 10', 'x = 20', 'B',
'4x = 20, logo x = 5.',
'Primeiro some 5 aos dois lados'),

('matematica', 7, 'Proporcionalidade', 'Regra de Três', 'medio',
'Se 4 canetas custam R$ 12, quanto custam 7 canetas?',
'R$ 21', 'R$ 28', 'R$ 19', 'R$ 84', 'A',
'4/12 = 7/x → x = 12×7/4 = 21.',
'Monte a proporção'),

('matematica', 7, 'Proporcionalidade', 'Porcentagem', 'medio',
'Qual é 15% de 200?',
'15', '30', '45', '300', 'B',
'15% de 200 = 0,15 × 200 = 30.',
'Transforme % em decimal'),

('matematica', 7, 'Geometria', 'Ângulos', 'medio',
'Dois ângulos são complementares. Um mede 35°. Quanto mede o outro?',
'145°', '55°', '35°', '325°', 'B',
'Complementares somam 90°. 90 - 35 = 55°.',
'Complementar: soma = 90°'),

-- 7º Ano - Difíceis
('matematica', 7, 'Álgebra', 'Equações', 'dificil',
'Resolva: 2(x + 3) = 5x - 9',
'x = 3', 'x = 5', 'x = 15', 'x = -1', 'B',
'2x + 6 = 5x - 9 → 15 = 3x → x = 5.',
'Distribua primeiro'),

('matematica', 7, 'Proporcionalidade', 'Inversa', 'dificil',
'Se 6 operários fazem uma obra em 10 dias, em quantos dias 4 operários fazem?',
'6,67 dias', '15 dias', '40 dias', '4 dias', 'B',
'Proporcionalidade inversa: 6×10 = 4×x → x = 15 dias.',
'Mais operários = menos dias'),

-- Extra 7º
('matematica', 7, 'Números', 'Potenciação', 'medio',
'Quanto é 2⁵?',
'10', '25', '32', '64', 'C',
'2⁵ = 2×2×2×2×2 = 32.',
'Multiplique 2 cinco vezes'),

('matematica', 7, 'Números', 'Raiz', 'medio',
'Qual é √144?',
'11', '12', '13', '14', 'B',
'12 × 12 = 144, então √144 = 12.',
'Qual número ao quadrado dá 144?'),

('matematica', 7, 'Geometria', 'Triângulos', 'medio',
'A soma dos ângulos internos de um triângulo é:',
'90°', '180°', '270°', '360°', 'B',
'Todo triângulo tem soma dos ângulos internos igual a 180°.',
'Propriedade fundamental'),

('matematica', 7, 'Álgebra', 'Expressões', 'dificil',
'Simplifique: 3x + 2y - x + 5y',
'2x + 7y', '4x + 7y', '3x + 7y', '2x + 3y', 'A',
'3x - x = 2x e 2y + 5y = 7y. Resultado: 2x + 7y.',
'Agrupe termos semelhantes'),

('matematica', 7, 'Proporcionalidade', 'Escala', 'dificil',
'Em um mapa de escala 1:50000, 3 cm representam quantos km na realidade?',
'0,15 km', '1,5 km', '15 km', '150 km', 'B',
'3 cm × 50000 = 150000 cm = 1500 m = 1,5 km.',
'Multiplique pela escala');

-- ═══════════════════════════════════════════════════════════════════════════
-- MATEMÁTICA - 8º e 9º ANO (25 questões)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (componente, ano, tema, subtema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, resposta_correta, explicacao, dica) VALUES

-- 8º Ano - Fáceis
('matematica', 8, 'Geometria', 'Área', 'facil',
'Qual a área de um quadrado de lado 9 cm?',
'18 cm²', '36 cm²', '81 cm²', '324 cm²', 'C',
'A = L² = 9² = 81 cm².',
'Lado ao quadrado'),

('matematica', 8, 'Geometria', 'Área', 'facil',
'Qual a área de um triângulo de base 10 cm e altura 6 cm?',
'16 cm²', '30 cm²', '60 cm²', '120 cm²', 'B',
'A = (b × h)/2 = (10 × 6)/2 = 30 cm².',
'Base vezes altura dividido por 2'),

('matematica', 8, 'Álgebra', 'Notação Científica', 'facil',
'Como escrever 5.000.000 em notação científica?',
'5 × 10⁵', '5 × 10⁶', '50 × 10⁵', '0,5 × 10⁷', 'B',
'5.000.000 = 5 × 1.000.000 = 5 × 10⁶.',
'Conte os zeros'),

-- 8º Ano - Médias
('matematica', 8, 'Geometria', 'Pitágoras', 'medio',
'Em um triângulo retângulo, os catetos medem 5 cm e 12 cm. Qual a hipotenusa?',
'13 cm', '17 cm', '60 cm', '169 cm', 'A',
'h² = 5² + 12² = 25 + 144 = 169. h = 13 cm.',
'a² + b² = c²'),

('matematica', 8, 'Geometria', 'Pitágoras', 'medio',
'A hipotenusa mede 10 cm e um cateto mede 6 cm. Qual o outro cateto?',
'4 cm', '8 cm', '16 cm', '64 cm', 'B',
'c² = 10² - 6² = 100 - 36 = 64. c = 8 cm.',
'Isole o cateto desconhecido'),

('matematica', 8, 'Geometria', 'Volume', 'medio',
'Qual o volume de um cubo de aresta 4 cm?',
'16 cm³', '48 cm³', '64 cm³', '256 cm³', 'C',
'V = a³ = 4³ = 64 cm³.',
'Aresta ao cubo'),

('matematica', 8, 'Estatística', 'Média', 'medio',
'A média de 3, 5, 7, 9 e 11 é:',
'5', '6', '7', '8', 'C',
'Média = (3+5+7+9+11)/5 = 35/5 = 7.',
'Soma dividida pela quantidade'),

('matematica', 8, 'Estatística', 'Mediana', 'medio',
'Qual a mediana de: 2, 8, 4, 9, 5?',
'4', '5', '5,6', '8', 'B',
'Ordenando: 2, 4, 5, 8, 9. O valor central é 5.',
'Ordene primeiro'),

-- 8º Ano - Difíceis
('matematica', 8, 'Geometria', 'Círculo', 'dificil',
'Qual a área de um círculo de raio 5 cm? (π = 3,14)',
'31,4 cm²', '78,5 cm²', '157 cm²', '314 cm²', 'B',
'A = πr² = 3,14 × 25 = 78,5 cm².',
'A = πr²'),

('matematica', 8, 'Álgebra', 'Sistemas', 'dificil',
'Resolva: x + y = 10 e x - y = 4. Qual o valor de x?',
'3', '7', '14', '6', 'B',
'Somando: 2x = 14 → x = 7.',
'Some as equações'),

-- 9º Ano - Fáceis
('matematica', 9, 'Álgebra', 'Equação 2º Grau', 'facil',
'Quais são as raízes de x² - 9 = 0?',
'x = 3', 'x = -3', 'x = 9 e x = -9', 'x = 3 e x = -3', 'D',
'x² = 9 → x = ±3.',
'Raiz quadrada de 9'),

('matematica', 9, 'Álgebra', 'Equação 2º Grau', 'facil',
'Qual o valor de Δ (delta) para x² - 5x + 6 = 0?',
'-1', '1', '49', '0', 'B',
'Δ = b² - 4ac = 25 - 24 = 1.',
'Δ = b² - 4ac'),

-- 9º Ano - Médias
('matematica', 9, 'Álgebra', 'Equação 2º Grau', 'medio',
'Resolva: x² - 7x + 12 = 0',
'x = 3 e x = 4', 'x = -3 e x = -4', 'x = 2 e x = 6', 'x = 1 e x = 12', 'A',
'Soma = 7, Produto = 12. Os números são 3 e 4.',
'Soma e produto das raízes'),

('matematica', 9, 'Álgebra', 'Equação 2º Grau', 'medio',
'Para x² + 4x - 5 = 0, qual a soma das raízes?',
'-4', '4', '5', '-5', 'A',
'Soma das raízes = -b/a = -4/1 = -4.',
'Relação de Girard'),

('matematica', 9, 'Funções', 'Função Afim', 'medio',
'Na função f(x) = 2x - 3, qual o valor de f(4)?',
'5', '8', '11', '2', 'A',
'f(4) = 2(4) - 3 = 8 - 3 = 5.',
'Substitua x por 4'),

('matematica', 9, 'Funções', 'Função Afim', 'medio',
'Qual o zero da função f(x) = 3x - 12?',
'x = 3', 'x = 4', 'x = 12', 'x = -4', 'B',
'3x - 12 = 0 → 3x = 12 → x = 4.',
'Iguale a função a zero'),

('matematica', 9, 'Trigonometria', 'Razões', 'medio',
'Em um triângulo retângulo, o cateto oposto mede 3 e a hipotenusa 5. Qual o seno do ângulo?',
'3/5', '4/5', '3/4', '5/3', 'A',
'sen = cateto oposto / hipotenusa = 3/5.',
'SOH: Seno = Oposto / Hipotenusa'),

('matematica', 9, 'Trigonometria', 'Razões', 'medio',
'Se sen(θ) = 0,6, qual o valor de cos(θ)? (triângulo retângulo)',
'0,4', '0,6', '0,8', '1,0', 'C',
'sen²θ + cos²θ = 1 → 0,36 + cos²θ = 1 → cos²θ = 0,64 → cosθ = 0,8.',
'Use a identidade fundamental'),

-- 9º Ano - Difíceis
('matematica', 9, 'Álgebra', 'Equação 2º Grau', 'dificil',
'Resolva por Bhaskara: 2x² - 8x + 6 = 0',
'x = 1 e x = 3', 'x = 2 e x = 6', 'x = -1 e x = -3', 'x = 4 e x = 2', 'A',
'Δ = 64 - 48 = 16. x = (8±4)/4. x = 3 ou x = 1.',
'Calcule o delta primeiro'),

('matematica', 9, 'Funções', 'Função Quadrática', 'dificil',
'Qual o vértice da parábola y = x² - 6x + 5?',
'(3, -4)', '(3, 4)', '(-3, -4)', '(6, 5)', 'A',
'xv = -b/2a = 6/2 = 3. yv = 9 - 18 + 5 = -4.',
'xv = -b/2a'),

('matematica', 9, 'Geometria', 'Semelhança', 'dificil',
'Dois triângulos semelhantes têm lados na razão 2:3. Se a área do menor é 20 cm², qual a área do maior?',
'30 cm²', '45 cm²', '60 cm²', '90 cm²', 'B',
'Razão de áreas = razão dos lados ao quadrado = 4:9. Área = 20 × 9/4 = 45 cm².',
'Área: razão ao quadrado'),

('matematica', 9, 'Probabilidade', 'Básica', 'medio',
'Ao lançar dois dados, qual a probabilidade de somar 7?',
'1/6', '1/12', '6/36', '7/36', 'A',
'Combinações que somam 7: (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) = 6. P = 6/36 = 1/6.',
'Conte as combinações favoráveis'),

('matematica', 9, 'Probabilidade', 'Básica', 'dificil',
'Uma urna tem 3 bolas vermelhas e 2 azuis. Retirando 2 bolas sem reposição, qual a probabilidade de ambas serem vermelhas?',
'9/25', '6/20', '3/10', '2/5', 'C',
'P = (3/5) × (2/4) = 6/20 = 3/10.',
'Multiplique as probabilidades');
