-- ============================================================================
-- 53_QUESTOES_EXEMPLO_TRILHAS.SQL
-- Questões de exemplo para testar o Sistema de Trilhas
-- Execute este script no Supabase SQL Editor
-- ============================================================================

-- Limpar questões de exemplo anteriores (se existirem)
DELETE FROM questoes_trilha WHERE id LIKE 'exemplo-%';

-- ============================================================================
-- QUESTÕES DE FÍSICA - 1ª SÉRIE EM - SEMANA 1
-- Tema: Cinemática - Conceitos Básicos
-- ============================================================================

INSERT INTO questoes_trilha (
    id, trilha_id, serie, semana, ordem, tema, subtema,
    tipo_questao, dificuldade, contexto, enunciado,
    alternativas, resposta_correta, dica, feedback
) VALUES

-- Questão 1: Conceitual
('exemplo-1em-s1-q1', 'passar_ano', '1EM', 1, 1, 'Cinemática', 'Conceitos Básicos',
'conceitual', 'facil', 'Cotidiano - Transporte',
'Um ônibus escolar percorre 12 km em 20 minutos. Qual é a velocidade média do ônibus?',
'{"A": "36 km/h", "B": "24 km/h", "C": "12 km/h", "D": "60 km/h", "E": "0,6 km/h"}',
'A',
'Lembre-se: velocidade média = distância ÷ tempo. Converta os minutos para horas!',
'A velocidade média é calculada dividindo a distância pelo tempo. 12 km ÷ (20/60 h) = 12 km ÷ 0,333 h = 36 km/h. Resposta: A'),

-- Questão 2: Cálculo Direto
('exemplo-1em-s1-q2', 'passar_ano', '1EM', 1, 2, 'Cinemática', 'MRU',
'calculo_direto', 'facil', 'Cotidiano - Esporte',
'Um atleta corre com velocidade constante de 5 m/s. Quanto tempo ele leva para percorrer 100 metros?',
'{"A": "10 s", "B": "20 s", "C": "500 s", "D": "0,05 s", "E": "50 s"}',
'B',
'Use a fórmula: tempo = distância ÷ velocidade',
'No MRU, t = d/v. Então: t = 100m ÷ 5m/s = 20s. O atleta leva 20 segundos. Resposta: B'),

-- Questão 3: Situação Problema
('exemplo-1em-s1-q3', 'passar_ano', '1EM', 1, 3, 'Cinemática', 'Velocidade Média',
'situacao_problema', 'medio', 'Cotidiano - Viagem',
'Maria vai de sua casa até a escola, que fica a 6 km de distância. Na ida, ela demora 30 minutos. Na volta, por causa do trânsito, demora 1 hora. Qual foi a velocidade média de Maria no trajeto completo (ida e volta)?',
'{"A": "6 km/h", "B": "8 km/h", "C": "9 km/h", "D": "12 km/h", "E": "4 km/h"}',
'B',
'Velocidade média total = distância total ÷ tempo total. Cuidado: não é a média das velocidades!',
'Distância total = 6 + 6 = 12 km. Tempo total = 0,5 + 1 = 1,5 h. Velocidade média = 12 ÷ 1,5 = 8 km/h. Resposta: B'),

-- Questão 4: Interpretação de Gráfico
('exemplo-1em-s1-q4', 'passar_ano', '1EM', 1, 4, 'Cinemática', 'Gráficos',
'interpretacao_grafico', 'medio', 'Cotidiano - Transporte',
'Um carro parte do repouso e acelera uniformemente. Após 10 segundos, sua velocidade é de 20 m/s. Mantendo essa aceleração, qual será a velocidade após 15 segundos do início?',
'{"A": "25 m/s", "B": "30 m/s", "C": "35 m/s", "D": "40 m/s", "E": "22 m/s"}',
'B',
'Primeiro calcule a aceleração: a = Δv/Δt. Depois use v = v₀ + at',
'Aceleração: a = 20/10 = 2 m/s². Em 15s: v = 0 + 2×15 = 30 m/s. Resposta: B'),

-- Questão 5: Análise de Fenômeno
('exemplo-1em-s1-q5', 'passar_ano', '1EM', 1, 5, 'Cinemática', 'Conceitos',
'analise_fenomeno', 'facil', 'Cotidiano - Observação',
'Uma pessoa dentro de um trem em movimento olha pela janela e vê as árvores "andando para trás". Por que isso acontece?',
'{"A": "As árvores realmente se movem", "B": "É uma ilusão de ótica causada pela luz", "C": "O movimento é relativo: em relação à pessoa, as árvores se movem", "D": "O vento empurra as árvores", "E": "É um erro de percepção do cérebro"}',
'C',
'Pense no conceito de referencial em Física',
'O movimento é sempre relativo a um referencial. Para a pessoa no trem, que está em movimento em relação ao solo, as árvores parecem se mover no sentido oposto. Resposta: C'),

-- Questão 6: Comparação
('exemplo-1em-s1-q6', 'passar_ano', '1EM', 1, 6, 'Cinemática', 'Unidades',
'comparacao', 'facil', 'Cotidiano - Conversão',
'Um carro viaja a 72 km/h. Qual é essa velocidade em m/s?',
'{"A": "7,2 m/s", "B": "20 m/s", "C": "72 m/s", "D": "2 m/s", "E": "720 m/s"}',
'B',
'Para converter km/h para m/s, divida por 3,6',
'72 km/h ÷ 3,6 = 20 m/s. Dica: para converter km/h → m/s, divida por 3,6. Resposta: B'),

-- Questão 7
('exemplo-1em-s1-q7', 'passar_ano', '1EM', 1, 7, 'Cinemática', 'Deslocamento',
'conceitual', 'facil', 'Cotidiano - Caminhada',
'João caminha 300m para o norte e depois 400m para o leste. Qual foi o deslocamento total de João?',
'{"A": "100 m", "B": "700 m", "C": "500 m", "D": "350 m", "E": "1 m"}',
'C',
'Use o teorema de Pitágoras: o deslocamento é a hipotenusa!',
'O deslocamento forma um triângulo retângulo: d² = 300² + 400² = 90000 + 160000 = 250000. d = 500m. Resposta: C'),

-- Questão 8
('exemplo-1em-s1-q8', 'passar_ano', '1EM', 1, 8, 'Cinemática', 'MRU',
'calculo_direto', 'medio', 'Cotidiano - Viagem',
'Um trem viaja a 90 km/h. Quantos quilômetros ele percorre em 2 horas e 30 minutos?',
'{"A": "180 km", "B": "225 km", "C": "200 km", "D": "270 km", "E": "45 km"}',
'B',
'd = v × t. Converta 2h30min para horas decimais',
'd = 90 km/h × 2,5 h = 225 km. Resposta: B'),

-- Questão 9
('exemplo-1em-s1-q9', 'passar_ano', '1EM', 1, 9, 'Cinemática', 'Aceleração',
'situacao_problema', 'medio', 'Cotidiano - Carro',
'Um carro freia de 20 m/s até parar em 4 segundos. Qual é a aceleração (desaceleração) do carro?',
'{"A": "5 m/s²", "B": "-5 m/s²", "C": "80 m/s²", "D": "-80 m/s²", "E": "4 m/s²"}',
'B',
'a = (v_final - v_inicial) / tempo. Cuidado com o sinal!',
'a = (0 - 20) / 4 = -20/4 = -5 m/s². O sinal negativo indica desaceleração. Resposta: B'),

-- Questão 10
('exemplo-1em-s1-q10', 'passar_ano', '1EM', 1, 10, 'Cinemática', 'Queda Livre',
'analise_fenomeno', 'medio', 'Cotidiano - Observação',
'Desprezando a resistência do ar, se você soltar uma bola de tênis e uma bola de boliche da mesma altura ao mesmo tempo, qual chegará primeiro ao chão?',
'{"A": "A bola de boliche, por ser mais pesada", "B": "A bola de tênis, por ser mais leve", "C": "Chegam ao mesmo tempo", "D": "Depende da altura", "E": "A bola de tênis, pois tem menos inércia"}',
'C',
'Pense no experimento de Galileu: a aceleração da gravidade é igual para todos os corpos',
'Na queda livre (sem resistência do ar), todos os corpos caem com a mesma aceleração g ≈ 10 m/s², independente da massa. Chegam juntos! Resposta: C');

-- ============================================================================
-- QUESTÕES DE FÍSICA - 2ª SÉRIE EM - SEMANA 1
-- Tema: Termologia - Temperatura e Calor
-- ============================================================================

INSERT INTO questoes_trilha (
    id, trilha_id, serie, semana, ordem, tema, subtema,
    tipo_questao, dificuldade, contexto, enunciado,
    alternativas, resposta_correta, dica, feedback
) VALUES

('exemplo-2em-s1-q1', 'passar_ano', '2EM', 1, 1, 'Termologia', 'Temperatura',
'conceitual', 'facil', 'Cotidiano - Clima',
'A temperatura ambiente está em 25°C. Qual é essa temperatura em Kelvin?',
'{"A": "248 K", "B": "298 K", "C": "25 K", "D": "273 K", "E": "300 K"}',
'B',
'K = °C + 273',
'Para converter Celsius para Kelvin: K = 25 + 273 = 298 K. Resposta: B'),

('exemplo-2em-s1-q2', 'passar_ano', '2EM', 1, 2, 'Termologia', 'Calor',
'conceitual', 'facil', 'Cotidiano - Cozinha',
'Ao colocar uma colher de metal em uma panela quente, a colher esquenta rapidamente. Isso ocorre principalmente por qual processo?',
'{"A": "Convecção", "B": "Radiação", "C": "Condução", "D": "Evaporação", "E": "Sublimação"}',
'C',
'O calor se propaga pelo contato direto entre a panela e a colher',
'A condução é a transferência de calor através do contato direto entre materiais. Metais são bons condutores térmicos. Resposta: C'),

('exemplo-2em-s1-q3', 'passar_ano', '2EM', 1, 3, 'Termologia', 'Calor Sensível',
'calculo_direto', 'medio', 'Cotidiano - Cozinha',
'Quantas calorias são necessárias para aquecer 500g de água de 20°C para 80°C? (calor específico da água = 1 cal/g°C)',
'{"A": "30000 cal", "B": "40000 cal", "C": "500 cal", "D": "3000 cal", "E": "60 cal"}',
'A',
'Use Q = m × c × ΔT',
'Q = 500 × 1 × (80-20) = 500 × 60 = 30000 cal. Resposta: A'),

('exemplo-2em-s1-q4', 'passar_ano', '2EM', 1, 4, 'Termologia', 'Dilatação',
'situacao_problema', 'medio', 'Cotidiano - Construção',
'Por que existem pequenas frestas entre os trilhos de trem?',
'{"A": "Para economizar material", "B": "Para permitir a dilatação térmica", "C": "Para reduzir o barulho", "D": "Para facilitar a instalação", "E": "Por erro de construção"}',
'B',
'Metais expandem quando aquecidos',
'Os trilhos se expandem no calor. Sem as frestas, a dilatação causaria deformação e acidentes. Resposta: B'),

('exemplo-2em-s1-q5', 'passar_ano', '2EM', 1, 5, 'Termologia', 'Equilíbrio Térmico',
'analise_fenomeno', 'facil', 'Cotidiano - Bebidas',
'Ao colocar gelo em um copo com água, o que acontece?',
'{"A": "Só a água esfria", "B": "Só o gelo esquenta", "C": "A água cede calor ao gelo até o equilíbrio térmico", "D": "Nada acontece", "E": "O gelo cede calor à água"}',
'C',
'O calor flui do corpo mais quente para o mais frio',
'A água (mais quente) cede calor ao gelo (mais frio) até atingirem a mesma temperatura - equilíbrio térmico. Resposta: C');

-- ============================================================================
-- QUESTÕES DE FÍSICA - 3ª SÉRIE EM - SEMANA 1
-- Tema: Eletromagnetismo - Eletrostática
-- ============================================================================

INSERT INTO questoes_trilha (
    id, trilha_id, serie, semana, ordem, tema, subtema,
    tipo_questao, dificuldade, contexto, enunciado,
    alternativas, resposta_correta, dica, feedback
) VALUES

('exemplo-3em-s1-q1', 'passar_ano', '3EM', 1, 1, 'Eletrostática', 'Cargas',
'conceitual', 'facil', 'Cotidiano - Roupas',
'Ao tirar uma blusa de lã, você percebe pequenos estalos e faíscas. Isso ocorre devido a:',
'{"A": "Corrente elétrica", "B": "Campo magnético", "C": "Eletricidade estática (atrito)", "D": "Ondas eletromagnéticas", "E": "Curto-circuito"}',
'C',
'O atrito entre materiais diferentes pode transferir elétrons',
'O atrito entre a blusa e a pele/cabelo transfere elétrons, criando cargas elétricas estáticas que se descarregam em faíscas. Resposta: C'),

('exemplo-3em-s1-q2', 'passar_ano', '3EM', 1, 2, 'Eletrostática', 'Lei de Coulomb',
'calculo_direto', 'medio', 'Laboratório',
'Duas cargas de +2μC estão separadas por 10 cm. Se a distância for duplicada para 20 cm, a força entre elas será:',
'{"A": "O dobro", "B": "A metade", "C": "Um quarto", "D": "Quatro vezes maior", "E": "Igual"}',
'C',
'A força é inversamente proporcional ao quadrado da distância',
'Pela Lei de Coulomb, F ∝ 1/d². Se d dobra, F fica 1/4 do valor original. Resposta: C'),

('exemplo-3em-s1-q3', 'passar_ano', '3EM', 1, 3, 'Eletrostática', 'Campo Elétrico',
'conceitual', 'medio', 'Conceitual',
'O campo elétrico gerado por uma carga positiva aponta:',
'{"A": "Para a carga", "B": "Para longe da carga", "C": "Em círculos ao redor", "D": "Para cima", "E": "Não existe campo"}',
'B',
'Pense no que aconteceria com uma carga de prova positiva',
'O campo elétrico de uma carga positiva aponta radialmente para fora (afastando-se da carga). Resposta: B'),

('exemplo-3em-s1-q4', 'passar_ano', '3EM', 1, 4, 'Eletrostática', 'Condutores',
'analise_fenomeno', 'facil', 'Cotidiano - Segurança',
'Por que para-raios são feitos de metal e conectados ao solo?',
'{"A": "Porque metal é bonito", "B": "Porque metal conduz eletricidade para o solo", "C": "Porque metal é barato", "D": "Porque metal é pesado", "E": "Porque metal não conduz"}',
'B',
'Metais são bons condutores elétricos',
'O metal conduz a eletricidade do raio com segurança até o solo, protegendo a edificação. Resposta: B'),

('exemplo-3em-s1-q5', 'passar_ano', '3EM', 1, 5, 'Eletrostática', 'Cargas',
'comparacao', 'facil', 'Conceitual',
'Um átomo neutro tem:',
'{"A": "Mais prótons que elétrons", "B": "Mais elétrons que prótons", "C": "Mesmo número de prótons e elétrons", "D": "Apenas prótons", "E": "Apenas elétrons"}',
'C',
'Neutro significa carga total zero',
'Um átomo neutro possui o mesmo número de prótons (+) e elétrons (-), resultando em carga líquida zero. Resposta: C');

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT
    serie,
    trilha_id,
    semana,
    COUNT(*) as total_questoes
FROM questoes_trilha
WHERE id LIKE 'exemplo-%'
GROUP BY serie, trilha_id, semana
ORDER BY serie, semana;
