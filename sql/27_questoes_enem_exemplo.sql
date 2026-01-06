-- ================================================================
-- QUESTÕES DE EXEMPLO DO ENEM
-- Para garantir que o simulado funcione mesmo sem API externa
-- Execute este script no Supabase para popular o banco
-- ================================================================

-- Limpar questões antigas com problemas
DELETE FROM respostas_enem WHERE questao_id IN (
    SELECT id FROM questoes_enem WHERE alternativa_a = '' OR alternativa_a IS NULL
);
DELETE FROM questoes_enem WHERE alternativa_a = '' OR alternativa_a IS NULL;

-- ================================================================
-- QUESTÕES DE MATEMÁTICA
-- ================================================================

INSERT INTO questoes_enem (
    id_api, ano_prova, numero_questao, area, area_nome, subarea,
    titulo, contexto, comando,
    alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, fonte, status
) VALUES
(
    'enem-2023-136',
    2023, 136,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 136 - ENEM 2023',
    'Uma empresa de telefonia oferece dois planos de internet móvel. O plano A cobra uma taxa fixa mensal de R$ 50,00 mais R$ 0,10 por megabyte (MB) excedente. O plano B cobra uma taxa fixa mensal de R$ 30,00 mais R$ 0,20 por megabyte (MB) excedente. Um usuário deseja escolher o plano mais econômico baseado em seu consumo mensal.',
    'Para qual consumo mensal de dados excedentes os dois planos têm o mesmo custo?',
    '100 MB',
    '150 MB',
    '200 MB',
    '250 MB',
    '300 MB',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
(
    'enem-2023-137',
    2023, 137,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 137 - ENEM 2023',
    'Um reservatório de água tem a forma de um cilindro circular reto com raio da base igual a 2 metros e altura igual a 3 metros. A água contida no reservatório ocupa 75% de sua capacidade total.',
    'O volume de água contido no reservatório, em metros cúbicos, é igual a:',
    '6π',
    '9π',
    '12π',
    '15π',
    '18π',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
(
    'enem-2022-140',
    2022, 140,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 140 - ENEM 2022',
    'Uma pesquisa sobre o consumo de energia elétrica em uma cidade revelou que 40% das residências consomem até 100 kWh por mês, 35% consomem entre 100 kWh e 200 kWh, e o restante consome mais de 200 kWh. Sabe-se que a cidade tem 500.000 residências.',
    'O número de residências que consomem mais de 200 kWh por mês é:',
    '75.000',
    '100.000',
    '125.000',
    '150.000',
    '175.000',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
(
    'enem-2021-145',
    2021, 145,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 145 - ENEM 2021',
    'Um investidor aplicou R$ 10.000,00 em um fundo que rende juros compostos de 10% ao ano. Após 2 anos, ele resgatou todo o valor.',
    'O montante resgatado pelo investidor foi de:',
    'R$ 11.000,00',
    'R$ 12.000,00',
    'R$ 12.100,00',
    'R$ 12.200,00',
    'R$ 12.500,00',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),

-- ================================================================
-- QUESTÕES DE CIÊNCIAS DA NATUREZA (FÍSICA)
-- ================================================================

(
    'enem-2023-91',
    2023, 91,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'fisica',
    'Questão 91 - ENEM 2023',
    'Um carro parte do repouso e acelera uniformemente, atingindo uma velocidade de 20 m/s após percorrer 100 metros. Considere que o movimento ocorre em linha reta e que não há atrito.',
    'A aceleração do carro, em m/s², é igual a:',
    '1',
    '2',
    '4',
    '5',
    '10',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
(
    'enem-2023-92',
    2023, 92,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'fisica',
    'Questão 92 - ENEM 2023',
    'Uma lâmpada incandescente de 60 W é substituída por uma lâmpada LED de 9 W que produz a mesma quantidade de luz. Considerando que ambas as lâmpadas ficam acesas durante 5 horas por dia, e que o preço do kWh é R$ 0,80.',
    'A economia mensal (30 dias) com a troca da lâmpada é de aproximadamente:',
    'R$ 4,12',
    'R$ 6,12',
    'R$ 8,12',
    'R$ 10,12',
    'R$ 12,12',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
(
    'enem-2022-95',
    2022, 95,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'fisica',
    'Questão 95 - ENEM 2022',
    'Um bloco de gelo de 500 g a 0°C é colocado em um recipiente contendo 2 kg de água a 25°C. O sistema é isolado termicamente do ambiente. O calor latente de fusão do gelo é 80 cal/g e o calor específico da água é 1 cal/(g·°C).',
    'A temperatura de equilíbrio do sistema será aproximadamente:',
    '0°C',
    '5°C',
    '10°C',
    '15°C',
    '20°C',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),

-- ================================================================
-- QUESTÕES DE CIÊNCIAS DA NATUREZA (QUÍMICA)
-- ================================================================

(
    'enem-2023-101',
    2023, 101,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'quimica',
    'Questão 101 - ENEM 2023',
    'A chuva ácida é um fenômeno causado principalmente pela emissão de óxidos de enxofre (SOx) e óxidos de nitrogênio (NOx) na atmosfera. Esses óxidos reagem com a água presente na atmosfera, formando ácidos que precipitam com a chuva.',
    'O principal ácido formado pela reação do dióxido de enxofre (SO₂) com a água atmosférica é:',
    'Ácido sulfúrico (H₂SO₄)',
    'Ácido sulfuroso (H₂SO₃)',
    'Ácido nítrico (HNO₃)',
    'Ácido carbônico (H₂CO₃)',
    'Ácido clorídrico (HCl)',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),

-- ================================================================
-- QUESTÕES DE CIÊNCIAS DA NATUREZA (BIOLOGIA)
-- ================================================================

(
    'enem-2023-111',
    2023, 111,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'biologia',
    'Questão 111 - ENEM 2023',
    'A fotossíntese é um processo fundamental para a vida na Terra. Durante esse processo, as plantas convertem energia luminosa em energia química, armazenada em moléculas orgânicas. O processo ocorre principalmente nos cloroplastos das células vegetais.',
    'Os produtos finais da fase clara (fotoquímica) da fotossíntese são:',
    'Glicose e oxigênio',
    'ATP, NADPH e oxigênio',
    'Gás carbônico e água',
    'ATP e glicose',
    'NADPH e gás carbônico',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),

-- ================================================================
-- QUESTÕES DE CIÊNCIAS HUMANAS
-- ================================================================

(
    'enem-2023-46',
    2023, 46,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'historia',
    'Questão 46 - ENEM 2023',
    'A Revolução Industrial, iniciada na Inglaterra no século XVIII, provocou profundas transformações econômicas, sociais e políticas. Uma das principais características desse processo foi a substituição do trabalho manual pelo trabalho mecânico, com o uso de máquinas movidas inicialmente a vapor.',
    'Uma consequência social direta da Revolução Industrial foi:',
    'A melhoria imediata das condições de vida dos trabalhadores',
    'O surgimento da classe operária urbana e suas reivindicações',
    'A diminuição do êxodo rural e a valorização do campo',
    'O fortalecimento das corporações de ofício medievais',
    'A redução da jornada de trabalho desde o início do processo',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),

-- ================================================================
-- QUESTÕES DE LINGUAGENS
-- ================================================================

(
    'enem-2023-1',
    2023, 1,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'portugues',
    'Questão 1 - ENEM 2023',
    'A linguagem é uma forma de ação sobre o mundo. Por meio dela, não apenas descrevemos a realidade, mas também a construímos, modificamos e interpretamos. Os diferentes gêneros textuais cumprem funções específicas nas práticas sociais de comunicação.',
    'A principal função de um editorial de jornal é:',
    'Narrar fatos de interesse público de forma objetiva',
    'Expor a opinião do veículo sobre temas da atualidade',
    'Entreter o leitor com histórias fictícias',
    'Instruir o leitor sobre como realizar determinada tarefa',
    'Descrever detalhadamente um objeto ou lugar',
    'B',
    'ENEM-EXEMPLO', 'ativa'
)

ON CONFLICT (id_api) DO UPDATE SET
    contexto = EXCLUDED.contexto,
    alternativa_a = EXCLUDED.alternativa_a,
    alternativa_b = EXCLUDED.alternativa_b,
    alternativa_c = EXCLUDED.alternativa_c,
    alternativa_d = EXCLUDED.alternativa_d,
    alternativa_e = EXCLUDED.alternativa_e,
    resposta_correta = EXCLUDED.resposta_correta,
    status = 'ativa',
    atualizado_em = NOW();

-- ================================================================
-- VERIFICAÇÃO
-- ================================================================

SELECT
    area,
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE status = 'ativa') as ativas
FROM questoes_enem
GROUP BY area
ORDER BY area;
