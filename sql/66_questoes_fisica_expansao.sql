-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES DE FÍSICA - EXPANSÃO (1ª, 2ª e 3ª SÉRIE)
-- ~90 questões adicionais com distribuição por bimestre
-- Execute após as migrations de estrutura de banco
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 1ª SÉRIE - 1º BIMESTRE
-- Temas: Cinemática (MRU, MRUV, Queda Livre)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

-- MRU - Fáceis
(
    'fisica', 1, 1, 'Cinemática', 'MRU', 'facil',
    'Um carro viaja a 72 km/h. Qual é sua velocidade em m/s?',
    '10 m/s', '20 m/s', '36 m/s', '72 m/s', NULL,
    'B',
    'Para converter km/h em m/s, divida por 3,6: 72/3,6 = 20 m/s.',
    'km/h → m/s: divida por 3,6',
    'ativa'
),

(
    'fisica', 1, 1, 'Cinemática', 'MRU', 'facil',
    'Um trem percorre 300 km em 4 horas com velocidade constante. Qual sua velocidade média?',
    '60 km/h', '75 km/h', '80 km/h', '100 km/h', NULL,
    'B',
    'v = Δs/Δt = 300/4 = 75 km/h.',
    'v = distância / tempo',
    'ativa'
),

(
    'fisica', 1, 1, 'Cinemática', 'MRU', 'facil',
    'No MRU, o que permanece constante?',
    'A aceleração', 'A velocidade', 'A posição', 'A distância', NULL,
    'B',
    'No Movimento Retilíneo Uniforme, a velocidade é constante e a aceleração é zero.',
    'Uniforme = velocidade constante',
    'ativa'
),

-- MRUV - Médias
(
    'fisica', 1, 1, 'Cinemática', 'MRUV', 'medio',
    'Um carro parte do repouso e atinge 30 m/s em 10 segundos. Qual sua aceleração?',
    '2 m/s²', '3 m/s²', '5 m/s²', '10 m/s²', NULL,
    'B',
    'a = Δv/Δt = (30-0)/10 = 3 m/s².',
    'a = variação da velocidade / tempo',
    'ativa'
),

(
    'fisica', 1, 1, 'Cinemática', 'MRUV', 'medio',
    'Um objeto parte do repouso com aceleração constante de 4 m/s². Qual a distância percorrida em 5 s?',
    '20 m', '40 m', '50 m', '100 m', NULL,
    'C',
    's = s₀ + v₀t + at²/2 = 0 + 0 + 4×25/2 = 50 m.',
    's = v₀t + at²/2',
    'ativa'
),

(
    'fisica', 1, 1, 'Cinemática', 'MRUV', 'medio',
    'Um veículo a 20 m/s freia com desaceleração de 5 m/s². Após quanto tempo ele para?',
    '2 s', '4 s', '5 s', '10 s', NULL,
    'B',
    'v = v₀ + at → 0 = 20 + (-5)t → t = 4 s.',
    'v = v₀ + at, com v = 0 (parou)',
    'ativa'
),

-- Queda Livre - Difíceis
(
    'fisica', 1, 1, 'Cinemática', 'Queda Livre', 'dificil',
    'Um objeto é lançado para cima com velocidade de 30 m/s (g = 10 m/s²). Qual a altura máxima atingida?',
    '30 m', '45 m', '60 m', '90 m', NULL,
    'B',
    'Na altura máxima v = 0. v² = v₀² - 2gh → 0 = 900 - 20h → h = 45 m.',
    'Na altura máxima, v = 0',
    'ativa'
),

(
    'fisica', 1, 1, 'Cinemática', 'Queda Livre', 'dificil',
    'Uma pedra é solta do alto de um prédio de 80 m (g = 10 m/s²). Qual a velocidade ao chegar ao solo?',
    '20 m/s', '30 m/s', '40 m/s', '80 m/s', NULL,
    'C',
    'v² = v₀² + 2gh = 0 + 2×10×80 = 1600 → v = 40 m/s.',
    'v² = 2gh (partindo do repouso)',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 1ª SÉRIE - 2º BIMESTRE
-- Temas: Dinâmica (Leis de Newton, Trabalho, Energia)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'fisica', 1, 2, 'Dinâmica', 'Segunda Lei de Newton', 'facil',
    'Uma força de 20 N é aplicada em um corpo de 4 kg. Qual a aceleração?',
    '2 m/s²', '4 m/s²', '5 m/s²', '80 m/s²', NULL,
    'C',
    'F = ma → a = F/m = 20/4 = 5 m/s².',
    'F = ma',
    'ativa'
),

(
    'fisica', 1, 2, 'Dinâmica', 'Peso', 'facil',
    'Qual o peso de um objeto de 8 kg na superfície da Terra (g = 10 m/s²)?',
    '8 N', '18 N', '80 N', '800 N', NULL,
    'C',
    'P = mg = 8 × 10 = 80 N.',
    'Peso = massa × gravidade',
    'ativa'
),

(
    'fisica', 1, 2, 'Dinâmica', 'Trabalho', 'medio',
    'Uma força de 50 N desloca um objeto por 4 m na mesma direção da força. Qual o trabalho realizado?',
    '12,5 J', '54 J', '100 J', '200 J', NULL,
    'D',
    'W = F × d = 50 × 4 = 200 J.',
    'Trabalho = Força × deslocamento (mesma direção)',
    'ativa'
),

(
    'fisica', 1, 2, 'Dinâmica', 'Energia Cinética', 'medio',
    'Qual a energia cinética de um corpo de 2 kg a 10 m/s?',
    '20 J', '50 J', '100 J', '200 J', NULL,
    'C',
    'Ec = mv²/2 = 2×100/2 = 100 J.',
    'Ec = mv²/2',
    'ativa'
),

(
    'fisica', 1, 2, 'Dinâmica', 'Energia Potencial', 'medio',
    'Um objeto de 5 kg está a 12 m de altura (g = 10 m/s²). Sua energia potencial gravitacional é:',
    '60 J', '120 J', '300 J', '600 J', NULL,
    'D',
    'Ep = mgh = 5 × 10 × 12 = 600 J.',
    'Ep = mgh',
    'ativa'
),

(
    'fisica', 1, 2, 'Dinâmica', 'Conservação de Energia', 'dificil',
    'Um bloco desliza sem atrito de uma rampa de 5 m de altura (g = 10 m/s²). Qual sua velocidade na base?',
    '5 m/s', '10 m/s', '50 m/s', '100 m/s', NULL,
    'B',
    'mgh = mv²/2 → v = √(2gh) = √(2×10×5) = √100 = 10 m/s.',
    'Conservação: Ep = Ec',
    'ativa'
),

(
    'fisica', 1, 2, 'Dinâmica', 'Atrito', 'dificil',
    'Um bloco de 10 kg está sobre uma superfície com coeficiente de atrito cinético μ = 0,3 (g = 10 m/s²). Qual a força de atrito?',
    '3 N', '10 N', '30 N', '100 N', NULL,
    'C',
    'Fat = μ × N = μ × mg = 0,3 × 10 × 10 = 30 N.',
    'Fat = μN, onde N = mg em superfície horizontal',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 1ª SÉRIE - 3º BIMESTRE
-- Temas: Estática, Hidrostática
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'fisica', 1, 3, 'Estática', 'Equilíbrio', 'facil',
    'Para que um corpo esteja em equilíbrio estático, é necessário que:',
    'Sua velocidade seja nula', 'A resultante das forças seja nula e o torque resultante seja nulo', 'Apenas a resultante das forças seja nula', 'Esteja em repouso absoluto', NULL,
    'B',
    'Equilíbrio estático requer tanto ΣF = 0 (equilíbrio translacional) quanto Στ = 0 (equilíbrio rotacional).',
    'Duas condições: forças e torques',
    'ativa'
),

(
    'fisica', 1, 3, 'Hidrostática', 'Pressão', 'facil',
    'Uma força de 200 N é aplicada sobre uma área de 0,5 m². Qual a pressão exercida?',
    '100 Pa', '200 Pa', '400 Pa', '1000 Pa', NULL,
    'C',
    'P = F/A = 200/0,5 = 400 Pa.',
    'Pressão = Força / Área',
    'ativa'
),

(
    'fisica', 1, 3, 'Hidrostática', 'Pressão Hidrostática', 'medio',
    'Qual a pressão no fundo de uma piscina de 3 m de profundidade? (ρ = 1000 kg/m³, g = 10 m/s², desconsidere a pressão atmosférica)',
    '3.000 Pa', '10.000 Pa', '30.000 Pa', '300.000 Pa', NULL,
    'C',
    'P = ρgh = 1000 × 10 × 3 = 30.000 Pa.',
    'P = ρgh',
    'ativa'
),

(
    'fisica', 1, 3, 'Hidrostática', 'Empuxo', 'medio',
    'Um bloco de 2 kg e volume 0,001 m³ é mergulhado em água (ρ = 1000 kg/m³, g = 10 m/s²). Qual o empuxo?',
    '2 N', '10 N', '20 N', '100 N', NULL,
    'B',
    'E = ρ_fluido × V × g = 1000 × 0,001 × 10 = 10 N.',
    'Empuxo = peso do fluido deslocado',
    'ativa'
),

(
    'fisica', 1, 3, 'Hidrostática', 'Empuxo', 'dificil',
    'Um bloco de madeira (ρ = 600 kg/m³) flutua na água (ρ = 1000 kg/m³). Qual fração do volume fica submersa?',
    '40%', '50%', '60%', '80%', NULL,
    'C',
    'Na flutuação: E = P → ρ_água × V_sub × g = ρ_madeira × V_total × g. V_sub/V_total = 600/1000 = 0,6 = 60%.',
    'Fração submersa = ρ_objeto / ρ_fluido',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 1ª SÉRIE - 4º BIMESTRE
-- Temas: Gravitação, Movimento Circular
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'fisica', 1, 4, 'Movimento Circular', 'Período e Frequência', 'facil',
    'Um ventilador completa 30 rotações em 1 minuto. Qual sua frequência em Hz?',
    '0,5 Hz', '1 Hz', '2 Hz', '30 Hz', NULL,
    'A',
    'f = 30 rotações / 60 s = 0,5 Hz.',
    'f = nº de rotações / tempo (em segundos)',
    'ativa'
),

(
    'fisica', 1, 4, 'Movimento Circular', 'Velocidade Angular', 'medio',
    'Uma roda completa uma volta (2π rad) em 4 s. Qual sua velocidade angular?',
    'π/4 rad/s', 'π/2 rad/s', 'π rad/s', '2π rad/s', NULL,
    'B',
    'ω = 2π/T = 2π/4 = π/2 rad/s.',
    'ω = 2π/T',
    'ativa'
),

(
    'fisica', 1, 4, 'Movimento Circular', 'Aceleração Centrípeta', 'medio',
    'Um objeto em MCU tem velocidade de 10 m/s e raio de 5 m. Qual a aceleração centrípeta?',
    '2 m/s²', '10 m/s²', '20 m/s²', '50 m/s²', NULL,
    'C',
    'acp = v²/R = 100/5 = 20 m/s².',
    'acp = v²/R',
    'ativa'
),

(
    'fisica', 1, 4, 'Gravitação', 'Leis de Kepler', 'medio',
    'A 3ª Lei de Kepler estabelece que:',
    'As órbitas são elípticas', 'A velocidade areolar é constante', 'T²/R³ é constante para todos os planetas do sistema solar', 'A força gravitacional é inversamente proporcional à distância', NULL,
    'C',
    'A 3ª Lei de Kepler: T² = k × R³, ou seja, T²/R³ = constante.',
    'Relaciona período orbital e raio da órbita',
    'ativa'
),

(
    'fisica', 1, 4, 'Gravitação', 'Força Gravitacional', 'dificil',
    'Se a distância entre dois corpos for dobrada, a força gravitacional entre eles será multiplicada por:',
    '1/2', '1/4', '2', '4', NULL,
    'B',
    'F = GMm/r². Se r → 2r: F'' = GMm/(2r)² = GMm/4r² = F/4.',
    'F é proporcional a 1/r²',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 2ª SÉRIE - 1º BIMESTRE
-- Temas: Termometria e Calorimetria
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'fisica', 2, 1, 'Termometria', 'Conversão de Escalas', 'facil',
    'Converta 50°C para a escala Fahrenheit.',
    '100°F', '112°F', '122°F', '150°F', NULL,
    'C',
    'F = 9C/5 + 32 = 9×50/5 + 32 = 90 + 32 = 122°F.',
    'F = 9C/5 + 32',
    'ativa'
),

(
    'fisica', 2, 1, 'Termometria', 'Conversão de Escalas', 'facil',
    'Em qual temperatura as escalas Celsius e Fahrenheit indicam o mesmo valor?',
    '-40°', '0°', '32°', '100°', NULL,
    'A',
    'C = F → C = 9C/5 + 32 → 5C = 9C + 160 → -4C = 160 → C = -40.',
    'Faça C = F na fórmula de conversão',
    'ativa'
),

(
    'fisica', 2, 1, 'Termometria', 'Dilatação', 'medio',
    'Uma barra de alumínio de 2 m sofre aquecimento de 50°C (α = 24×10⁻⁶ °C⁻¹). Qual a dilatação linear?',
    '0,24 mm', '2,4 mm', '24 mm', '240 mm', NULL,
    'B',
    'ΔL = L₀×α×ΔT = 2 × 24×10⁻⁶ × 50 = 2400×10⁻⁶ m = 2,4 mm.',
    'ΔL = L₀αΔT',
    'ativa'
),

(
    'fisica', 2, 1, 'Calorimetria', 'Calor Sensível', 'facil',
    'Quanto calor é necessário para aquecer 500 g de água de 20°C a 80°C? (c = 1 cal/g°C)',
    '3.000 cal', '15.000 cal', '30.000 cal', '40.000 cal', NULL,
    'C',
    'Q = mcΔT = 500 × 1 × (80-20) = 500 × 60 = 30.000 cal.',
    'Q = mcΔT',
    'ativa'
),

(
    'fisica', 2, 1, 'Calorimetria', 'Calor Latente', 'medio',
    'Quanto calor é necessário para derreter 200 g de gelo a 0°C? (L_fusão = 80 cal/g)',
    '2.000 cal', '8.000 cal', '16.000 cal', '80.000 cal', NULL,
    'C',
    'Q = mL = 200 × 80 = 16.000 cal.',
    'Calor latente: Q = mL',
    'ativa'
),

(
    'fisica', 2, 1, 'Calorimetria', 'Equilíbrio Térmico', 'dificil',
    'Misturam-se 200 g de água a 80°C com 300 g de água a 20°C. A temperatura de equilíbrio é:',
    '40°C', '44°C', '50°C', '55°C', NULL,
    'B',
    'Q_quente + Q_frio = 0 → 200(T-80) + 300(T-20) = 0 → 200T - 16000 + 300T - 6000 = 0 → 500T = 22000 → T = 44°C.',
    'ΣQ = 0 (o que um perde, o outro ganha)',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 2ª SÉRIE - 2º BIMESTRE
-- Temas: Termodinâmica, Gases
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'fisica', 2, 2, 'Termodinâmica', 'Primeira Lei', 'facil',
    'Um gás recebe 500 J de calor e realiza 200 J de trabalho. Qual a variação da energia interna?',
    '200 J', '300 J', '500 J', '700 J', NULL,
    'B',
    'ΔU = Q - W = 500 - 200 = 300 J.',
    '1ª Lei: ΔU = Q - W',
    'ativa'
),

(
    'fisica', 2, 2, 'Gases', 'Lei de Boyle', 'facil',
    'Um gás ideal a 2 atm ocupa 6 litros. Se a temperatura for mantida constante e a pressão aumentar para 4 atm, o novo volume será:',
    '2 L', '3 L', '6 L', '12 L', NULL,
    'B',
    'Transformação isotérmica: P₁V₁ = P₂V₂ → 2×6 = 4×V₂ → V₂ = 3 L.',
    'Isotérmica: PV = constante',
    'ativa'
),

(
    'fisica', 2, 2, 'Gases', 'Lei de Charles', 'medio',
    'Um gás a 27°C ocupa 3 L. A que temperatura (em °C) ele ocupará 4 L, mantendo a pressão constante?',
    '36°C', '127°C', '227°C', '327°C', NULL,
    'B',
    'V₁/T₁ = V₂/T₂ → 3/300 = 4/T₂ → T₂ = 400 K = 127°C. (27°C = 300 K)',
    'Use temperatura em Kelvin! K = °C + 273',
    'ativa'
),

(
    'fisica', 2, 2, 'Termodinâmica', 'Transformações', 'medio',
    'Em uma transformação adiabática, qual grandeza é nula?',
    'O trabalho', 'A variação de energia interna', 'A troca de calor', 'A pressão', NULL,
    'C',
    'Adiabática: Q = 0 (sem troca de calor com o meio). Logo ΔU = -W.',
    'Adiabática = sem troca de calor',
    'ativa'
),

(
    'fisica', 2, 2, 'Termodinâmica', 'Segunda Lei', 'dificil',
    'Uma máquina térmica recebe 1000 J da fonte quente e rejeita 600 J para a fonte fria. Seu rendimento é:',
    '20%', '30%', '40%', '60%', NULL,
    'C',
    'η = W/Q_quente = (1000-600)/1000 = 400/1000 = 0,4 = 40%.',
    'η = 1 - Q_frio/Q_quente',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 2ª SÉRIE - 3º BIMESTRE
-- Temas: Óptica Geométrica
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'fisica', 2, 3, 'Óptica', 'Reflexão', 'facil',
    'Um raio de luz incide sobre um espelho plano fazendo um ângulo de 30° com a normal. Qual o ângulo de reflexão?',
    '15°', '30°', '60°', '90°', NULL,
    'B',
    'Lei da Reflexão: ângulo de incidência = ângulo de reflexão. Logo, 30°.',
    'Ângulo de incidência = ângulo de reflexão',
    'ativa'
),

(
    'fisica', 2, 3, 'Óptica', 'Espelhos Planos', 'facil',
    'A imagem formada por um espelho plano é:',
    'Real e invertida', 'Virtual, direita e do mesmo tamanho', 'Real e menor', 'Virtual e maior', NULL,
    'B',
    'Espelho plano: imagem virtual, direita (mesma orientação vertical) e do mesmo tamanho.',
    'Espelho plano: V-D-I (virtual, direita, igual)',
    'ativa'
),

(
    'fisica', 2, 3, 'Óptica', 'Espelhos Esféricos', 'medio',
    'Um objeto está a 30 cm de um espelho côncavo de raio de curvatura 20 cm. A que distância se forma a imagem?',
    '10 cm', '15 cm', '20 cm', '60 cm', NULL,
    'B',
    'f = R/2 = 10 cm. 1/f = 1/p + 1/p'' → 1/10 = 1/30 + 1/p'' → 1/p'' = 1/10 - 1/30 = 2/30 → p'' = 15 cm.',
    'Equação de Gauss: 1/f = 1/p + 1/p''',
    'ativa'
),

(
    'fisica', 2, 3, 'Óptica', 'Refração', 'medio',
    'Um raio de luz passa do ar (n=1) para a água (n=1,33) com ângulo de incidência de 45°. O raio refratado se aproxima ou se afasta da normal?',
    'Se afasta, pois a velocidade aumenta', 'Se aproxima, pois a velocidade diminui', 'Não muda de direção', 'Se reflete totalmente', NULL,
    'B',
    'Ao passar de um meio menos refringente (ar) para um mais refringente (água), o raio se aproxima da normal. n₁ sen θ₁ = n₂ sen θ₂.',
    'Meio mais denso → mais perto da normal',
    'ativa'
),

(
    'fisica', 2, 3, 'Óptica', 'Lentes', 'dificil',
    'Uma lente convergente tem distância focal de 20 cm. Um objeto está a 30 cm da lente. A imagem formada é:',
    'Real e a 60 cm', 'Virtual e a 60 cm', 'Real e a 12 cm', 'Virtual e a 12 cm', NULL,
    'A',
    '1/f = 1/p + 1/p'' → 1/20 = 1/30 + 1/p'' → 1/p'' = 1/20 - 1/30 = 1/60 → p'' = 60 cm (positivo = real).',
    '1/f = 1/p + 1/p'' ; p'' > 0 = real',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 2ª SÉRIE - 4º BIMESTRE
-- Temas: Ondas e Acústica
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'fisica', 2, 4, 'Ondas', 'Velocidade', 'facil',
    'Uma onda tem frequência de 5 Hz e comprimento de onda de 2 m. Qual sua velocidade?',
    '2,5 m/s', '5 m/s', '7 m/s', '10 m/s', NULL,
    'D',
    'v = λf = 2 × 5 = 10 m/s.',
    'v = λf',
    'ativa'
),

(
    'fisica', 2, 4, 'Ondas', 'Classificação', 'facil',
    'As ondas sonoras são classificadas como:',
    'Eletromagnéticas transversais', 'Mecânicas longitudinais', 'Eletromagnéticas longitudinais', 'Mecânicas transversais', NULL,
    'B',
    'O som precisa de meio material (mecânica) e se propaga por compressão e rarefação (longitudinal).',
    'Som precisa de meio material para se propagar',
    'ativa'
),

(
    'fisica', 2, 4, 'Ondas', 'Período', 'medio',
    'Uma onda completa 200 oscilações em 10 segundos. Qual o período da onda?',
    '0,02 s', '0,05 s', '0,5 s', '20 s', NULL,
    'B',
    'f = 200/10 = 20 Hz. T = 1/f = 1/20 = 0,05 s.',
    'T = 1/f',
    'ativa'
),

(
    'fisica', 2, 4, 'Acústica', 'Efeito Doppler', 'dificil',
    'Uma ambulância se aproxima de um observador parado emitindo som de 1000 Hz. O observador percebe um som de frequência:',
    'Menor que 1000 Hz', 'Igual a 1000 Hz', 'Maior que 1000 Hz', 'Depende da velocidade do som', NULL,
    'C',
    'Quando a fonte se aproxima, as ondas se comprimem e a frequência percebida aumenta (Efeito Doppler).',
    'Fonte se aproximando → frequência percebida MAIOR',
    'ativa'
),

(
    'fisica', 2, 4, 'Ondas', 'Interferência', 'dificil',
    'Duas ondas de mesma amplitude A e mesma frequência se encontram em fase. A amplitude resultante é:',
    'A', '2A', 'A²', '0', NULL,
    'B',
    'Interferência construtiva (em fase): as amplitudes se somam. Resultado: A + A = 2A.',
    'Em fase = interferência construtiva',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 3ª SÉRIE - 1º BIMESTRE
-- Temas: Eletrostática
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'fisica', 3, 1, 'Eletrostática', 'Carga Elétrica', 'facil',
    'Um corpo neutro tem:',
    'Apenas prótons', 'Apenas elétrons', 'Número igual de prótons e elétrons', 'Nenhuma partícula carregada', NULL,
    'C',
    'Um corpo neutro tem cargas positivas e negativas em quantidades iguais.',
    'Neutro ≠ sem cargas',
    'ativa'
),

(
    'fisica', 3, 1, 'Eletrostática', 'Lei de Coulomb', 'facil',
    'Duas cargas de mesmo sinal se:',
    'Atraem', 'Repelem', 'Não interagem', 'Anulam', NULL,
    'B',
    'Cargas de mesmo sinal se repelem; cargas de sinais opostos se atraem.',
    'Mesmo sinal → repulsão; sinais opostos → atração',
    'ativa'
),

(
    'fisica', 3, 1, 'Eletrostática', 'Lei de Coulomb', 'medio',
    'Duas cargas q₁ = 2μC e q₂ = 3μC estão separadas por 30 cm (k = 9×10⁹ N·m²/C²). Qual a força entre elas?',
    '0,2 N', '0,6 N', '1,8 N', '6 N', NULL,
    'B',
    'F = kq₁q₂/d² = 9×10⁹ × 2×10⁻⁶ × 3×10⁻⁶ / (0,3)² = 54×10⁻³/0,09 = 0,6 N.',
    'F = kq₁q₂/d² (atenção às unidades!)',
    'ativa'
),

(
    'fisica', 3, 1, 'Eletrostática', 'Campo Elétrico', 'medio',
    'Qual a intensidade do campo elétrico a 2 m de uma carga de 4μC? (k = 9×10⁹)',
    '4.500 N/C', '9.000 N/C', '18.000 N/C', '36.000 N/C', NULL,
    'B',
    'E = kQ/d² = 9×10⁹ × 4×10⁻⁶ / 4 = 36×10³/4 = 9.000 N/C.',
    'E = kQ/d²',
    'ativa'
),

(
    'fisica', 3, 1, 'Eletrostática', 'Potencial Elétrico', 'dificil',
    'O potencial elétrico a 3 m de uma carga Q = 6μC vale (k = 9×10⁹):',
    '2.000 V', '6.000 V', '18.000 V', '54.000 V', NULL,
    'C',
    'V = kQ/d = 9×10⁹ × 6×10⁻⁶ / 3 = 54×10³/3 = 18.000 V.',
    'V = kQ/d (sem elevar ao quadrado)',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 3ª SÉRIE - 2º BIMESTRE
-- Temas: Eletrodinâmica (Circuitos)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'fisica', 3, 2, 'Eletrodinâmica', 'Lei de Ohm', 'facil',
    'Um resistor de 10 Ω é submetido a uma tensão de 20 V. Qual a corrente?',
    '0,5 A', '2 A', '10 A', '200 A', NULL,
    'B',
    'I = U/R = 20/10 = 2 A.',
    'Lei de Ohm: U = RI',
    'ativa'
),

(
    'fisica', 3, 2, 'Eletrodinâmica', 'Potência Elétrica', 'facil',
    'Um chuveiro funciona em 220 V e 10 A. Qual sua potência?',
    '22 W', '220 W', '2.200 W', '22.000 W', NULL,
    'C',
    'P = UI = 220 × 10 = 2.200 W.',
    'P = UI',
    'ativa'
),

(
    'fisica', 3, 2, 'Eletrodinâmica', 'Resistores em Série', 'medio',
    'Três resistores de 4 Ω, 6 Ω e 10 Ω são ligados em série. Qual a resistência equivalente?',
    '10 Ω', '15 Ω', '20 Ω', '240 Ω', NULL,
    'C',
    'Em série: R_eq = R₁ + R₂ + R₃ = 4 + 6 + 10 = 20 Ω.',
    'Série: R_eq = R₁ + R₂ + R₃',
    'ativa'
),

(
    'fisica', 3, 2, 'Eletrodinâmica', 'Resistores em Paralelo', 'medio',
    'Dois resistores de 6 Ω e 3 Ω são ligados em paralelo. Qual a resistência equivalente?',
    '1 Ω', '2 Ω', '4,5 Ω', '9 Ω', NULL,
    'B',
    '1/R_eq = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2 → R_eq = 2 Ω.',
    'Paralelo: 1/R_eq = 1/R₁ + 1/R₂',
    'ativa'
),

(
    'fisica', 3, 2, 'Eletrodinâmica', 'Consumo de Energia', 'dificil',
    'Um aparelho de 1.500 W funciona 4 horas por dia durante 30 dias. Qual o consumo em kWh?',
    '120 kWh', '150 kWh', '180 kWh', '200 kWh', NULL,
    'C',
    'E = P × t = 1,5 kW × 4 h × 30 dias = 180 kWh.',
    'E(kWh) = P(kW) × t(h)',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 3ª SÉRIE - 3º BIMESTRE
-- Temas: Eletromagnetismo
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'fisica', 3, 3, 'Eletromagnetismo', 'Campo Magnético', 'facil',
    'Um ímã em forma de barra possui:',
    'Apenas polo norte', 'Apenas polo sul', 'Polos norte e sul sempre juntos', 'Nenhum polo', NULL,
    'C',
    'Ímãs sempre possuem dois polos (norte e sul). Não é possível isolar um monopolo magnético.',
    'Não existem monopolos magnéticos',
    'ativa'
),

(
    'fisica', 3, 3, 'Eletromagnetismo', 'Força Magnética', 'medio',
    'Uma carga de 2C se move a 5 m/s perpendicularmente a um campo magnético de 3 T. Qual a força magnética?',
    '6 N', '15 N', '30 N', '50 N', NULL,
    'C',
    'F = qvB sen θ = 2 × 5 × 3 × sen 90° = 30 N.',
    'F = qvB sen θ (θ = ângulo entre v e B)',
    'ativa'
),

(
    'fisica', 3, 3, 'Eletromagnetismo', 'Indução', 'medio',
    'Segundo a Lei de Faraday, uma fem é induzida quando:',
    'Há um campo magnético constante', 'Há variação do fluxo magnético', 'Uma carga está em repouso', 'Não há campo magnético', NULL,
    'B',
    'A Lei de Faraday diz que fem = -dΦ/dt. A fem é induzida quando há variação do fluxo magnético.',
    'Variação de fluxo → fem induzida',
    'ativa'
),

(
    'fisica', 3, 3, 'Eletromagnetismo', 'Lei de Lenz', 'dificil',
    'A Lei de Lenz afirma que a corrente induzida:',
    'Tem sempre sentido horário', 'Se opõe à variação de fluxo que a originou', 'Tem mesma direção da variação de fluxo', 'É sempre nula', NULL,
    'B',
    'A Lei de Lenz: a corrente induzida tem sentido tal que se opõe à variação do fluxo que a originou.',
    'A natureza se opõe à mudança',
    'ativa'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FÍSICA 3ª SÉRIE - 4º BIMESTRE
-- Temas: Física Moderna
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES

(
    'fisica', 3, 4, 'Física Moderna', 'Efeito Fotoelétrico', 'facil',
    'O efeito fotoelétrico consiste na:',
    'Emissão de fótons por aquecimento', 'Emissão de elétrons por incidência de luz', 'Divisão do átomo', 'Fusão de núcleos', NULL,
    'B',
    'No efeito fotoelétrico, a luz incidente arranca elétrons da superfície metálica.',
    'Luz → elétrons emitidos',
    'ativa'
),

(
    'fisica', 3, 4, 'Física Moderna', 'Relatividade', 'medio',
    'Segundo a Relatividade Especial de Einstein, a velocidade da luz no vácuo:',
    'Depende da velocidade do observador', 'É sempre a mesma para qualquer observador', 'Pode ser superada por partículas com massa', 'Varia conforme o meio', NULL,
    'B',
    'A velocidade da luz no vácuo (c ≈ 3×10⁸ m/s) é constante e independe do referencial do observador.',
    'c é invariante',
    'ativa'
),

(
    'fisica', 3, 4, 'Física Moderna', 'Dualidade Onda-Partícula', 'medio',
    'De acordo com De Broglie, toda partícula em movimento tem associada:',
    'Uma carga elétrica', 'Um campo gravitacional', 'Uma onda de matéria', 'Um campo magnético', NULL,
    'C',
    'De Broglie propôs que toda partícula com momento p tem um comprimento de onda λ = h/p.',
    'λ = h/p (comprimento de onda de De Broglie)',
    'ativa'
),

(
    'fisica', 3, 4, 'Física Moderna', 'Energia Nuclear', 'dificil',
    'Na equação E = mc², se um corpo perde 1 kg de massa, quanta energia é liberada? (c = 3×10⁸ m/s)',
    '3×10⁸ J', '9×10¹⁶ J', '9×10⁸ J', '3×10¹⁶ J', NULL,
    'B',
    'E = mc² = 1 × (3×10⁸)² = 9×10¹⁶ J.',
    'E = mc²',
    'ativa'
);
