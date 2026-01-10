-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES DE FÍSICA - FORMATO COM BIMESTRE
-- Execute após a migration 35_adicionar_bimestre_questoes.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Limpar questões anteriores (OPCIONAL - descomente se necessário)
-- DELETE FROM questoes WHERE componente = 'fisica';

-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 1º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES
-- Exemplo 1: Questão fácil de Cinemática
(
    'fisica',           -- componente
    1,                  -- ano (1ª série EM)
    1,                  -- bimestre (1º bimestre)
    'Cinemática',       -- tema
    'Movimento Uniforme', -- subtema
    'facil',            -- dificuldade
    'Um carro percorre 120 km em 2 horas, mantendo velocidade constante. Qual é a velocidade média do carro?',
    '30 km/h',          -- alternativa_a
    '60 km/h',          -- alternativa_b
    '90 km/h',          -- alternativa_c
    '120 km/h',         -- alternativa_d
    NULL,               -- alternativa_e (opcional)
    'B',                -- resposta_correta
    'A velocidade média é calculada pela fórmula v = d/t. Assim: v = 120 km / 2 h = 60 km/h.',
    'Lembre-se: velocidade = distância dividida pelo tempo.',
    'ativa'
),

-- Exemplo 2: Questão média de Cinemática
(
    'fisica',
    1,
    1,
    'Cinemática',
    'MRU',
    'medio',
    'Um objeto em MRU percorre 50 metros em 10 segundos. Qual a distância percorrida em 25 segundos?',
    '100 m',
    '125 m',
    '150 m',
    '175 m',
    NULL,
    'B',
    'No MRU, v = 50/10 = 5 m/s. Em 25s: d = v × t = 5 × 25 = 125 m.',
    'Primeiro calcule a velocidade, depois a distância.',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 2º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    1,
    2,
    'Dinâmica',
    'Leis de Newton',
    'facil',
    'Qual das alternativas representa corretamente a 1ª Lei de Newton?',
    'A aceleração é proporcional à força aplicada',
    'Todo corpo permanece em repouso ou MRU, a menos que uma força atue sobre ele',
    'A toda ação corresponde uma reação de igual intensidade',
    'A energia não pode ser criada nem destruída',
    NULL,
    'B',
    'A 1ª Lei de Newton, ou Lei da Inércia, afirma que um corpo tende a manter seu estado de movimento (repouso ou MRU) na ausência de forças resultantes.',
    'Pense no que acontece quando você freia bruscamente um carro.',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 3º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    1,
    3,
    'Trabalho e Energia',
    'Energia Cinética',
    'medio',
    'Um carro de 1000 kg está a 20 m/s. Qual sua energia cinética?',
    '10.000 J',
    '20.000 J',
    '100.000 J',
    '200.000 J',
    NULL,
    'D',
    'Ec = (m × v²) / 2 = (1000 × 20²) / 2 = (1000 × 400) / 2 = 200.000 J',
    'Use a fórmula Ec = mv²/2',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 1ª SÉRIE - 4º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    1,
    4,
    'Gravitação',
    'Queda Livre',
    'medio',
    'Um objeto é solto do repouso e cai em queda livre. Qual sua velocidade após 3 segundos? (g = 10 m/s²)',
    '10 m/s',
    '20 m/s',
    '30 m/s',
    '40 m/s',
    NULL,
    'C',
    'Na queda livre: v = g × t = 10 × 3 = 30 m/s',
    'Velocidade inicial é zero, use v = gt.',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 1º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    2,
    1,
    'Termologia',
    'Escalas Termométricas',
    'facil',
    'Converta 100°C para a escala Kelvin:',
    '273 K',
    '373 K',
    '173 K',
    '473 K',
    NULL,
    'B',
    'K = °C + 273. Assim: K = 100 + 273 = 373 K',
    'Some 273 à temperatura em Celsius.',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 2º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    2,
    2,
    'Termodinâmica',
    'Calor',
    'medio',
    'Quantas calorias são necessárias para aquecer 500g de água de 20°C para 70°C? (c = 1 cal/g°C)',
    '15.000 cal',
    '20.000 cal',
    '25.000 cal',
    '35.000 cal',
    NULL,
    'C',
    'Q = m × c × ΔT = 500 × 1 × (70-20) = 500 × 50 = 25.000 cal',
    'Use Q = mcΔT',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 3º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    2,
    3,
    'Óptica',
    'Reflexão da Luz',
    'facil',
    'O ângulo de incidência de um raio de luz em um espelho plano é 30°. Qual o ângulo de reflexão?',
    '15°',
    '30°',
    '60°',
    '90°',
    NULL,
    'B',
    'Pela Lei da Reflexão, o ângulo de incidência é igual ao ângulo de reflexão.',
    'Lembre-se: ângulo de incidência = ângulo de reflexão.',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 2ª SÉRIE - 4º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    2,
    4,
    'Ondas',
    'Características das Ondas',
    'medio',
    'Uma onda tem frequência de 100 Hz e comprimento de onda de 2 m. Qual sua velocidade?',
    '50 m/s',
    '100 m/s',
    '200 m/s',
    '400 m/s',
    NULL,
    'C',
    'v = f × λ = 100 × 2 = 200 m/s',
    'Use a equação fundamental da ondulatória.',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 3ª SÉRIE - 1º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    3,
    1,
    'Eletrostática',
    'Lei de Coulomb',
    'medio',
    'Duas cargas de 2μC e 4μC estão separadas por 20 cm. Se a distância dobrar, a força elétrica será:',
    '4 vezes maior',
    '2 vezes maior',
    '2 vezes menor',
    '4 vezes menor',
    NULL,
    'D',
    'Pela Lei de Coulomb, F é inversamente proporcional a d². Se d dobra, F reduz em 2² = 4 vezes.',
    'A força varia com o inverso do quadrado da distância.',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 3ª SÉRIE - 2º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    3,
    2,
    'Eletrodinâmica',
    'Lei de Ohm',
    'facil',
    'Um resistor de 10Ω está submetido a uma tensão de 20V. Qual a corrente que o atravessa?',
    '0,5 A',
    '2 A',
    '10 A',
    '200 A',
    NULL,
    'B',
    'Pela 1ª Lei de Ohm: I = V/R = 20/10 = 2 A',
    'Use V = R × I',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 3ª SÉRIE - 3º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    3,
    3,
    'Eletromagnetismo',
    'Campo Magnético',
    'medio',
    'O que acontece quando um condutor percorrido por corrente é colocado em um campo magnético?',
    'Nada acontece',
    'O condutor esquenta',
    'Surge uma força sobre o condutor',
    'O condutor perde a corrente',
    NULL,
    'C',
    'Um condutor com corrente em um campo magnético sofre uma força (Força de Lorentz). Este é o princípio dos motores elétricos.',
    'Pense em como funciona um motor elétrico.',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- 3ª SÉRIE - 4º BIMESTRE
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    3,
    4,
    'Física Moderna',
    'Relatividade',
    'dificil',
    'Segundo a Teoria da Relatividade Especial de Einstein, o que acontece com a massa de um objeto quando sua velocidade se aproxima da velocidade da luz?',
    'A massa diminui',
    'A massa permanece constante',
    'A massa aumenta',
    'A massa se torna negativa',
    NULL,
    'C',
    'Na relatividade especial, a massa relativística aumenta com a velocidade, tendendo ao infinito quando v → c.',
    'Pense por que não podemos atingir a velocidade da luz.',
    'ativa'
),

-- ═══════════════════════════════════════════════════════════════════════════
-- QUESTÕES SEM BIMESTRE (disponíveis o ano todo)
-- Use bimestre = NULL para questões de revisão geral
-- ═══════════════════════════════════════════════════════════════════════════

(
    'fisica',
    1,
    NULL,  -- Disponível em todos os bimestres
    'Unidades de Medida',
    'Sistema Internacional',
    'facil',
    'Qual é a unidade de força no Sistema Internacional (SI)?',
    'Quilograma (kg)',
    'Newton (N)',
    'Joule (J)',
    'Watt (W)',
    NULL,
    'B',
    'No SI, a unidade de força é o Newton (N), em homenagem a Isaac Newton.',
    'Lembre-se: F = m × a, onde força é em Newton.',
    'ativa'
),

(
    'fisica',
    2,
    NULL,
    'Conceitos Fundamentais',
    'Grandezas Físicas',
    'facil',
    'Qual das grandezas abaixo é VETORIAL?',
    'Massa',
    'Tempo',
    'Temperatura',
    'Velocidade',
    NULL,
    'D',
    'Velocidade é uma grandeza vetorial pois possui módulo, direção e sentido. Massa, tempo e temperatura são escalares.',
    'Grandezas vetoriais têm direção e sentido.',
    'ativa'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- TEMPLATE PARA ADICIONAR MAIS QUESTÕES
-- ═══════════════════════════════════════════════════════════════════════════
/*
INSERT INTO questoes (
    componente, ano, bimestre, tema, subtema, dificuldade,
    enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, explicacao, dica, status
) VALUES (
    'fisica',           -- 'fisica' ou 'matematica'
    1,                  -- 1, 2 ou 3 (série do EM)
    1,                  -- 1, 2, 3, 4 ou NULL (todos os bimestres)
    'Tema Principal',
    'Subtema',
    'facil',            -- 'facil', 'medio' ou 'dificil'
    'Enunciado da questão aqui?',
    'Alternativa A',
    'Alternativa B',
    'Alternativa C',
    'Alternativa D',
    NULL,               -- Alternativa E (opcional, use NULL se não precisar)
    'A',                -- 'A', 'B', 'C', 'D' ou 'E'
    'Explicação detalhada da resposta correta.',
    'Dica para ajudar o estudante.',
    'ativa'             -- 'ativa' ou 'inativa'
);
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════════════════

-- Contar questões por série e bimestre
SELECT
    ano as serie,
    bimestre,
    COUNT(*) as total_questoes
FROM questoes
WHERE componente = 'fisica' AND status = 'ativa'
GROUP BY ano, bimestre
ORDER BY ano, bimestre;
