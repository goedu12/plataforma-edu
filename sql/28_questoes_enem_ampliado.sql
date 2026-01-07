-- ================================================================
-- QUESTÕES DO ENEM - BANCO AMPLIADO
-- 60 questões de exemplo (15 por área)
-- Execute este script no Supabase para popular o banco
-- ================================================================

-- Limpar questões antigas com problemas
DELETE FROM respostas_enem WHERE questao_id IN (
    SELECT id FROM questoes_enem WHERE alternativa_a = '' OR alternativa_a IS NULL
);
DELETE FROM questoes_enem WHERE alternativa_a = '' OR alternativa_a IS NULL;

-- ================================================================
-- MATEMÁTICA E SUAS TECNOLOGIAS (15 questões)
-- ================================================================

INSERT INTO questoes_enem (
    id_api, ano_prova, numero_questao, area, area_nome, subarea,
    titulo, contexto, comando,
    alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e,
    resposta_correta, fonte, status
) VALUES
-- MAT 1: Função do 1º grau
(
    'enem-2023-mat-136',
    2023, 136,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 136 - ENEM 2023',
    'Uma empresa de telefonia oferece dois planos de internet móvel. O plano A cobra uma taxa fixa mensal de R$ 50,00 mais R$ 0,10 por megabyte (MB) excedente. O plano B cobra uma taxa fixa mensal de R$ 30,00 mais R$ 0,20 por megabyte (MB) excedente.',
    'Para qual consumo mensal de dados excedentes os dois planos têm o mesmo custo?',
    '100 MB',
    '150 MB',
    '200 MB',
    '250 MB',
    '300 MB',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- MAT 2: Geometria - Volume do cilindro
(
    'enem-2023-mat-137',
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
-- MAT 3: Porcentagem
(
    'enem-2022-mat-140',
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
-- MAT 4: Juros compostos
(
    'enem-2021-mat-145',
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
-- MAT 5: Probabilidade
(
    'enem-2023-mat-138',
    2023, 138,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 138 - ENEM 2023',
    'Uma urna contém 5 bolas vermelhas, 3 bolas azuis e 2 bolas verdes. Duas bolas são retiradas ao acaso, sem reposição.',
    'A probabilidade de que ambas as bolas retiradas sejam vermelhas é:',
    '1/9',
    '2/9',
    '1/4',
    '2/5',
    '1/2',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- MAT 6: Progressão aritmética
(
    'enem-2022-mat-141',
    2022, 141,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 141 - ENEM 2022',
    'Em uma progressão aritmética, o primeiro termo é 5 e a razão é 3. Um estudante precisa encontrar a soma dos 20 primeiros termos dessa progressão.',
    'A soma dos 20 primeiros termos é:',
    '570',
    '670',
    '770',
    '870',
    '970',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- MAT 7: Área do triângulo
(
    'enem-2021-mat-146',
    2021, 146,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 146 - ENEM 2021',
    'Um triângulo retângulo tem catetos medindo 6 cm e 8 cm. Um quadrado está inscrito no triângulo, com um lado sobre a hipotenusa.',
    'A área desse triângulo, em cm², é igual a:',
    '20',
    '24',
    '30',
    '40',
    '48',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- MAT 8: Função quadrática
(
    'enem-2020-mat-150',
    2020, 150,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 150 - ENEM 2020',
    'O lucro L de uma empresa, em milhares de reais, é dado pela função L(x) = -x² + 10x - 16, onde x é a quantidade de produtos vendidos, em milhares de unidades.',
    'O lucro máximo que essa empresa pode obter é de:',
    'R$ 5.000,00',
    'R$ 7.000,00',
    'R$ 9.000,00',
    'R$ 11.000,00',
    'R$ 13.000,00',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- MAT 9: Estatística - Média
(
    'enem-2023-mat-139',
    2023, 139,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 139 - ENEM 2023',
    'As notas de um aluno em cinco provas foram: 6, 7, 8, 5 e 9. Para ser aprovado, ele precisa obter média aritmética igual ou superior a 7.',
    'A média aritmética do aluno foi:',
    '6,0',
    '6,5',
    '7,0',
    '7,5',
    '8,0',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- MAT 10: Regra de três
(
    'enem-2022-mat-142',
    2022, 142,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 142 - ENEM 2022',
    'Uma torneira despeja 15 litros de água por minuto. Um reservatório com capacidade de 1.800 litros precisa ser completamente cheio.',
    'O tempo necessário para encher o reservatório é:',
    '1 hora',
    '1 hora e 30 minutos',
    '2 horas',
    '2 horas e 30 minutos',
    '3 horas',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- MAT 11: Trigonometria
(
    'enem-2021-mat-147',
    2021, 147,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 147 - ENEM 2021',
    'Em um triângulo retângulo, um dos ângulos agudos mede 30°. O cateto oposto a esse ângulo mede 5 cm.',
    'A hipotenusa desse triângulo mede:',
    '5 cm',
    '5√3 cm',
    '10 cm',
    '10√3 cm',
    '15 cm',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- MAT 12: Análise combinatória
(
    'enem-2020-mat-151',
    2020, 151,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 151 - ENEM 2020',
    'Em uma reunião, 6 pessoas vão sentar-se em 6 cadeiras dispostas em linha. Duas dessas pessoas, João e Maria, querem sentar-se juntas.',
    'O número de maneiras diferentes de organizar essas pessoas é:',
    '120',
    '240',
    '360',
    '480',
    '720',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- MAT 13: Geometria espacial
(
    'enem-2023-mat-140',
    2023, 140,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 140 - ENEM 2023',
    'Um cone circular reto tem raio da base igual a 3 cm e altura igual a 4 cm.',
    'O volume desse cone, em cm³, é:',
    '9π',
    '12π',
    '15π',
    '36π',
    '48π',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- MAT 14: Logaritmo
(
    'enem-2022-mat-143',
    2022, 143,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 143 - ENEM 2022',
    'Sabendo que log 2 = 0,301 e log 3 = 0,477, um estudante precisa calcular log 12.',
    'O valor de log 12 é aproximadamente:',
    '0,778',
    '0,903',
    '1,079',
    '1,204',
    '1,380',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- MAT 15: Geometria analítica
(
    'enem-2021-mat-148',
    2021, 148,
    'matematica', 'Matemática e suas Tecnologias', 'matematica',
    'Questão 148 - ENEM 2021',
    'Os pontos A(1, 2) e B(5, 6) são extremidades de um segmento de reta no plano cartesiano.',
    'A distância entre os pontos A e B é:',
    '4',
    '4√2',
    '6',
    '8',
    '8√2',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),

-- ================================================================
-- CIÊNCIAS DA NATUREZA E SUAS TECNOLOGIAS (15 questões)
-- ================================================================

-- CN 1: Física - Cinemática
(
    'enem-2023-cn-91',
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
-- CN 2: Física - Energia
(
    'enem-2023-cn-92',
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
-- CN 3: Física - Calorimetria
(
    'enem-2022-cn-95',
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
-- CN 4: Física - Eletricidade
(
    'enem-2023-cn-93',
    2023, 93,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'fisica',
    'Questão 93 - ENEM 2023',
    'Um circuito elétrico possui uma resistência de 10 Ω conectada a uma fonte de tensão de 120 V.',
    'A corrente elétrica que passa pelo circuito e a potência dissipada são, respectivamente:',
    '10 A e 1.200 W',
    '12 A e 1.440 W',
    '12 A e 1.200 W',
    '10 A e 1.000 W',
    '15 A e 1.800 W',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- CN 5: Física - Óptica
(
    'enem-2022-cn-96',
    2022, 96,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'fisica',
    'Questão 96 - ENEM 2022',
    'Um objeto de 10 cm de altura está posicionado a 30 cm de um espelho esférico côncavo com raio de curvatura de 40 cm.',
    'A imagem formada é:',
    'Real, invertida e maior que o objeto',
    'Real, invertida e menor que o objeto',
    'Virtual, direita e maior que o objeto',
    'Virtual, direita e menor que o objeto',
    'Real, direita e do mesmo tamanho',
    'A',
    'ENEM-EXEMPLO', 'ativa'
),
-- CN 6: Química - Chuva ácida
(
    'enem-2023-cn-101',
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
-- CN 7: Química - Estequiometria
(
    'enem-2022-cn-102',
    2022, 102,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'quimica',
    'Questão 102 - ENEM 2022',
    'Na reação de combustão completa do metano (CH₄ + 2O₂ → CO₂ + 2H₂O), são queimados 32 g de metano (massa molar = 16 g/mol).',
    'A massa de água produzida nessa reação é:',
    '18 g',
    '36 g',
    '54 g',
    '72 g',
    '90 g',
    'D',
    'ENEM-EXEMPLO', 'ativa'
),
-- CN 8: Química - pH
(
    'enem-2023-cn-103',
    2023, 103,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'quimica',
    'Questão 103 - ENEM 2023',
    'Uma solução aquosa tem concentração de íons H⁺ igual a 10⁻⁴ mol/L a 25°C.',
    'O pH e a classificação dessa solução são:',
    'pH = 4, ácida',
    'pH = 4, básica',
    'pH = 10, ácida',
    'pH = 10, básica',
    'pH = 7, neutra',
    'A',
    'ENEM-EXEMPLO', 'ativa'
),
-- CN 9: Química - Orgânica
(
    'enem-2022-cn-104',
    2022, 104,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'quimica',
    'Questão 104 - ENEM 2022',
    'O etanol (C₂H₅OH) é amplamente utilizado como combustível no Brasil. Sua produção ocorre principalmente pela fermentação da cana-de-açúcar.',
    'A função orgânica presente no etanol é:',
    'Aldeído',
    'Cetona',
    'Álcool',
    'Éter',
    'Ácido carboxílico',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- CN 10: Química - Eletroquímica
(
    'enem-2021-cn-105',
    2021, 105,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'quimica',
    'Questão 105 - ENEM 2021',
    'Em uma pilha de Daniell, o zinco atua como ânodo e o cobre como cátodo. Durante o funcionamento da pilha, os elétrons fluem do zinco para o cobre através do circuito externo.',
    'No ânodo dessa pilha ocorre:',
    'Redução do Zn²⁺',
    'Oxidação do Zn',
    'Redução do Cu²⁺',
    'Oxidação do Cu',
    'Nenhuma reação',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- CN 11: Biologia - Fotossíntese
(
    'enem-2023-cn-111',
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
-- CN 12: Biologia - Genética
(
    'enem-2022-cn-112',
    2022, 112,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'biologia',
    'Questão 112 - ENEM 2022',
    'Em ervilhas, a cor amarela da semente (A) é dominante sobre a cor verde (a). Cruzando-se duas plantas heterozigotas (Aa × Aa), obteve-se uma descendência de 1.600 sementes.',
    'O número esperado de sementes amarelas é:',
    '400',
    '800',
    '1.200',
    '1.400',
    '1.600',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- CN 13: Biologia - Ecologia
(
    'enem-2023-cn-113',
    2023, 113,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'biologia',
    'Questão 113 - ENEM 2023',
    'Em um ecossistema terrestre, as plantas são os produtores, os gafanhotos são consumidores primários, os sapos são consumidores secundários e as cobras são consumidores terciários.',
    'A energia disponível para as cobras, considerando que em cada nível trófico há perda de 90% da energia, é de aproximadamente:',
    '0,1% da energia inicial',
    '1% da energia inicial',
    '10% da energia inicial',
    '30% da energia inicial',
    '50% da energia inicial',
    'A',
    'ENEM-EXEMPLO', 'ativa'
),
-- CN 14: Biologia - Citologia
(
    'enem-2022-cn-114',
    2022, 114,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'biologia',
    'Questão 114 - ENEM 2022',
    'As mitocôndrias são organelas celulares encontradas em praticamente todas as células eucarióticas. Elas possuem DNA próprio e são responsáveis por um processo metabólico fundamental.',
    'A principal função das mitocôndrias é:',
    'Síntese de proteínas',
    'Digestão intracelular',
    'Respiração celular',
    'Fotossíntese',
    'Armazenamento de substâncias',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- CN 15: Biologia - Evolução
(
    'enem-2021-cn-115',
    2021, 115,
    'ciencias-natureza', 'Ciências da Natureza e suas Tecnologias', 'biologia',
    'Questão 115 - ENEM 2021',
    'Charles Darwin propôs a teoria da evolução por seleção natural em sua obra "A Origem das Espécies" (1859). Segundo essa teoria, os indivíduos mais adaptados ao ambiente têm maior chance de sobreviver e deixar descendentes.',
    'Um exemplo de seleção natural é:',
    'Cruzamento de cães para produzir raças específicas',
    'Aumento da frequência de bactérias resistentes a antibióticos',
    'Modificação genética de plantas para aumentar produtividade',
    'Clonagem de animais para preservação de espécies',
    'Transferência de genes entre espécies diferentes',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),

-- ================================================================
-- CIÊNCIAS HUMANAS E SUAS TECNOLOGIAS (15 questões)
-- ================================================================

-- CH 1: História - Revolução Industrial
(
    'enem-2023-ch-46',
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
-- CH 2: História - Independência do Brasil
(
    'enem-2022-ch-47',
    2022, 47,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'historia',
    'Questão 47 - ENEM 2022',
    'A independência do Brasil, proclamada em 1822, foi um processo que manteve diversas estruturas do período colonial. A elite agrária conseguiu preservar seus interesses, garantindo a continuidade de um sistema excludente.',
    'Uma característica que permaneceu após a independência foi:',
    'O fim do tráfico negreiro',
    'A manutenção do trabalho escravo',
    'A distribuição de terras aos camponeses',
    'O estabelecimento da república',
    'A industrialização acelerada',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 3: Geografia - Urbanização
(
    'enem-2023-ch-48',
    2023, 48,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'geografia',
    'Questão 48 - ENEM 2023',
    'O processo de urbanização brasileiro ocorreu de forma acelerada na segunda metade do século XX. Em 1950, apenas 36% da população vivia em áreas urbanas; em 2010, esse percentual havia saltado para 84%.',
    'Uma consequência desse processo foi:',
    'A redução das desigualdades sociais nas cidades',
    'O crescimento ordenado das metrópoles',
    'O surgimento de ocupações irregulares e favelas',
    'A diminuição dos problemas de mobilidade urbana',
    'O aumento da oferta de emprego no campo',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 4: Geografia - Meio ambiente
(
    'enem-2022-ch-49',
    2022, 49,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'geografia',
    'Questão 49 - ENEM 2022',
    'O desmatamento na Amazônia brasileira aumentou significativamente nos últimos anos. A remoção da cobertura vegetal afeta diretamente o ciclo hidrológico da região, conhecida como "rios voadores".',
    'O principal impacto do desmatamento no ciclo hidrológico é:',
    'O aumento das chuvas na região amazônica',
    'A redução da evapotranspiração e das chuvas em outras regiões',
    'A maior infiltração de água no solo',
    'O aumento do nível dos rios amazônicos',
    'A diminuição da temperatura média da região',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 5: Filosofia - Ética
(
    'enem-2023-ch-50',
    2023, 50,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'filosofia',
    'Questão 50 - ENEM 2023',
    'Para Aristóteles, a felicidade (eudaimonia) é o bem supremo que todos os seres humanos buscam. Ela não consiste apenas em prazeres momentâneos, mas em uma vida virtuosa, que realiza plenamente as potencialidades humanas.',
    'De acordo com o pensamento aristotélico, a felicidade é alcançada por meio:',
    'Da acumulação de riquezas materiais',
    'Da busca constante por prazeres imediatos',
    'Do exercício das virtudes ao longo da vida',
    'Do isolamento social e meditação',
    'Da submissão às leis divinas',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 6: Sociologia - Desigualdade
(
    'enem-2022-ch-51',
    2022, 51,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'sociologia',
    'Questão 51 - ENEM 2022',
    'O Brasil está entre os países mais desiguais do mundo, com um coeficiente de Gini elevado. Essa desigualdade se manifesta em diferentes dimensões: renda, acesso à educação, saúde e habitação.',
    'Segundo a perspectiva sociológica, a desigualdade social é:',
    'Um fenômeno natural e inevitável em qualquer sociedade',
    'Resultado exclusivo das escolhas individuais',
    'Um produto de relações sociais historicamente construídas',
    'Consequência apenas da falta de esforço pessoal',
    'Um problema resolvido com a meritocracia',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 7: História - Era Vargas
(
    'enem-2023-ch-52',
    2023, 52,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'historia',
    'Questão 52 - ENEM 2023',
    'O Estado Novo (1937-1945), período da Era Vargas, foi marcado por uma política trabalhista que criou diversos direitos para os trabalhadores urbanos, como o salário mínimo, a CLT e a Justiça do Trabalho.',
    'Uma característica dessa política trabalhista foi:',
    'A liberdade sindical plena',
    'O controle estatal sobre os sindicatos',
    'A valorização do trabalhador rural',
    'A permissão irrestrita de greves',
    'A independência dos sindicatos em relação ao Estado',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 8: Geografia - Globalização
(
    'enem-2022-ch-53',
    2022, 53,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'geografia',
    'Questão 53 - ENEM 2022',
    'A globalização intensificou os fluxos de mercadorias, capitais, informações e pessoas entre os países. Grandes empresas transnacionais instalaram fábricas em países com mão de obra mais barata, fragmentando a produção.',
    'Essa estratégia das empresas é conhecida como:',
    'Protecionismo comercial',
    'Divisão internacional do trabalho',
    'Substituição de importações',
    'Autossuficiência produtiva',
    'Nacionalização industrial',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 9: Filosofia - Iluminismo
(
    'enem-2021-ch-54',
    2021, 54,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'filosofia',
    'Questão 54 - ENEM 2021',
    'O Iluminismo foi um movimento intelectual do século XVIII que valorizava a razão como instrumento de compreensão do mundo e de crítica às tradições. Pensadores como Voltaire, Rousseau e Montesquieu questionaram o absolutismo e a intolerância religiosa.',
    'Uma ideia central do Iluminismo foi:',
    'A defesa do poder absoluto dos reis',
    'A valorização da tradição religiosa sobre a razão',
    'A crítica ao uso da razão na vida política',
    'A defesa das liberdades individuais e civis',
    'O apoio à concentração de poderes no Estado',
    'D',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 10: Sociologia - Cultura
(
    'enem-2023-ch-55',
    2023, 55,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'sociologia',
    'Questão 55 - ENEM 2023',
    'O conceito de etnocentrismo refere-se à tendência de julgar outras culturas a partir dos valores e padrões da própria cultura, considerando-a como superior ou como referência universal.',
    'Uma atitude etnocêntrica seria:',
    'Reconhecer a diversidade de costumes entre os povos',
    'Considerar os hábitos de outros povos como inferiores',
    'Estudar outras culturas com imparcialidade',
    'Valorizar o intercâmbio cultural entre nações',
    'Respeitar as diferenças religiosas',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 11: História - Segunda Guerra
(
    'enem-2022-ch-56',
    2022, 56,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'historia',
    'Questão 56 - ENEM 2022',
    'A Segunda Guerra Mundial (1939-1945) foi o conflito mais devastador da história da humanidade. O Holocausto, genocídio de milhões de judeus pelo regime nazista, revelou os perigos do totalitarismo e da intolerância.',
    'Uma consequência direta da Segunda Guerra Mundial foi:',
    'O fim das organizações internacionais',
    'A criação da ONU e da Declaração Universal dos Direitos Humanos',
    'O fortalecimento do nazismo na Europa',
    'A expansão do colonialismo na África',
    'O isolamento político dos Estados Unidos',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 12: Geografia - Recursos naturais
(
    'enem-2021-ch-57',
    2021, 57,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'geografia',
    'Questão 57 - ENEM 2021',
    'A matriz energética brasileira é considerada uma das mais limpas do mundo, com grande participação de fontes renováveis. A energia hidrelétrica responde por cerca de 60% da eletricidade gerada no país.',
    'Uma vantagem da energia hidrelétrica é:',
    'Não causar nenhum impacto ambiental',
    'Ser uma fonte renovável de energia',
    'Não depender de condições climáticas',
    'Ocupar pouco espaço para sua instalação',
    'Ter custo de implantação muito baixo',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 13: Filosofia - Política
(
    'enem-2023-ch-58',
    2023, 58,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'filosofia',
    'Questão 58 - ENEM 2023',
    'Para o filósofo John Locke, o Estado surge de um contrato social entre os indivíduos. Seu objetivo é proteger os direitos naturais: vida, liberdade e propriedade. Quando o Estado viola esses direitos, o povo tem legitimidade para resistir.',
    'Essa concepção política de Locke fundamentou:',
    'O absolutismo monárquico',
    'O liberalismo político',
    'O socialismo científico',
    'O anarquismo',
    'O fascismo',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 14: Sociologia - Trabalho
(
    'enem-2022-ch-59',
    2022, 59,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'sociologia',
    'Questão 59 - ENEM 2022',
    'A uberização do trabalho refere-se a um modelo de relação trabalhista em que as pessoas prestam serviços por meio de plataformas digitais, sem vínculo empregatício formal. Esse modelo tem se expandido em diversos setores da economia.',
    'Uma crítica comum a esse modelo é:',
    'O excesso de direitos trabalhistas garantidos',
    'A precarização das condições de trabalho',
    'A alta remuneração dos trabalhadores',
    'A estabilidade no emprego',
    'A limitação da jornada de trabalho',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- CH 15: História - Ditadura
(
    'enem-2021-ch-60',
    2021, 60,
    'ciencias-humanas', 'Ciências Humanas e suas Tecnologias', 'historia',
    'Questão 60 - ENEM 2021',
    'O regime militar brasileiro (1964-1985) foi marcado pela suspensão de direitos civis, censura à imprensa e perseguição política. O AI-5, de 1968, representou o auge do autoritarismo, permitindo ao presidente fechar o Congresso e cassar mandatos.',
    'Uma característica do período conhecido como "Anos de Chumbo" foi:',
    'A ampliação das liberdades individuais',
    'A prática sistemática de tortura contra opositores',
    'O fortalecimento do movimento sindical',
    'A livre manifestação de ideias políticas',
    'O fim da censura prévia',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),

-- ================================================================
-- LINGUAGENS, CÓDIGOS E SUAS TECNOLOGIAS (15 questões)
-- ================================================================

-- LG 1: Português - Gênero textual
(
    'enem-2023-lg-1',
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
),
-- LG 2: Português - Variação linguística
(
    'enem-2022-lg-2',
    2022, 2,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'portugues',
    'Questão 2 - ENEM 2022',
    'A variação linguística é um fenômeno natural de todas as línguas vivas. Ela se manifesta em diferentes dimensões: regional, social, situacional e histórica. Reconhecer essa diversidade é fundamental para combater o preconceito linguístico.',
    'A frase "Nóis vai pro shopping" exemplifica uma variação:',
    'Apenas regional',
    'Diastrática (social)',
    'Apenas histórica',
    'Diacrônica',
    'De registro formal',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 3: Português - Figuras de linguagem
(
    'enem-2023-lg-3',
    2023, 3,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'portugues',
    'Questão 3 - ENEM 2023',
    '"A vida é uma viagem" é uma expressão muito utilizada para representar o percurso existencial do ser humano, com suas idas e vindas, descobertas e obstáculos.',
    'Nessa expressão, a figura de linguagem empregada é:',
    'Metonímia',
    'Metáfora',
    'Hipérbole',
    'Ironia',
    'Personificação',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 4: Português - Coesão textual
(
    'enem-2022-lg-4',
    2022, 4,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'portugues',
    'Questão 4 - ENEM 2022',
    'No trecho: "O governo lançou um programa de combate à fome. Esse programa beneficiará milhões de brasileiros", o termo em destaque é um mecanismo de:',
    '',
    'Coesão referencial por substituição',
    'Coesão sequencial',
    'Incoerência textual',
    'Redundância',
    'Ambiguidade',
    'A',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 5: Literatura - Romantismo
(
    'enem-2023-lg-5',
    2023, 5,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'portugues',
    'Questão 5 - ENEM 2023',
    'O Romantismo brasileiro, iniciado com a publicação de "Suspiros Poéticos e Saudades" (1836), de Gonçalves de Magalhães, teve como características a valorização do nacionalismo, do sentimentalismo e da natureza como refúgio.',
    'O indianismo romântico tinha como objetivo:',
    'Criticar a colonização portuguesa de forma direta',
    'Construir uma identidade nacional valorizando o indígena como herói',
    'Retratar o indígena de forma científica e objetiva',
    'Denunciar a exploração do trabalho indígena',
    'Mostrar a superioridade da cultura europeia',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 6: Literatura - Modernismo
(
    'enem-2022-lg-6',
    2022, 6,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'portugues',
    'Questão 6 - ENEM 2022',
    'A Semana de Arte Moderna de 1922 marcou o início do Modernismo brasileiro. Artistas e escritores propuseram uma ruptura com o academicismo e a valorização da cultura nacional em suas múltiplas manifestações.',
    'Uma característica da primeira fase do Modernismo foi:',
    'A valorização das formas clássicas da literatura',
    'A linguagem experimental e a paródia',
    'O retorno ao indianismo romântico',
    'A defesa da métrica tradicional na poesia',
    'O afastamento dos temas brasileiros',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 7: Artes - Movimentos artísticos
(
    'enem-2023-lg-7',
    2023, 7,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'artes',
    'Questão 7 - ENEM 2023',
    'O Impressionismo, movimento artístico surgido na França no final do século XIX, revolucionou a pintura ao valorizar a luz natural, as cores vibrantes e a impressão visual do momento. Claude Monet, Renoir e Degas foram alguns de seus principais representantes.',
    'Uma característica marcante do Impressionismo é:',
    'O uso de temas religiosos e mitológicos',
    'A representação precisa e detalhada da realidade',
    'A pintura ao ar livre e o registro das variações de luz',
    'O uso predominante de tons escuros e sombrios',
    'A valorização do desenho sobre a cor',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 8: Educação Física
(
    'enem-2022-lg-8',
    2022, 8,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'educacao-fisica',
    'Questão 8 - ENEM 2022',
    'A prática regular de atividade física está associada a diversos benefícios para a saúde, incluindo a redução do risco de doenças cardiovasculares, diabetes tipo 2 e alguns tipos de câncer. A OMS recomenda pelo menos 150 minutos semanais de atividade moderada para adultos.',
    'O sedentarismo está diretamente relacionado ao aumento de:',
    'Resistência cardiovascular',
    'Flexibilidade muscular',
    'Doenças crônicas não transmissíveis',
    'Capacidade pulmonar',
    'Força muscular',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 9: Tecnologias da informação
(
    'enem-2023-lg-9',
    2023, 9,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'tecnologia',
    'Questão 9 - ENEM 2023',
    'As fake news (notícias falsas) se disseminam rapidamente pelas redes sociais, muitas vezes mais que informações verdadeiras. A checagem de fatos (fact-checking) tornou-se uma ferramenta importante para combater a desinformação.',
    'Uma estratégia eficaz para identificar fake news é:',
    'Compartilhar a notícia antes de verificar a fonte',
    'Confiar apenas em manchetes sensacionalistas',
    'Verificar a fonte e buscar confirmação em veículos confiáveis',
    'Ignorar a data de publicação da notícia',
    'Aceitar informações de fontes anônimas',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 10: Português - Argumentação
(
    'enem-2022-lg-10',
    2022, 10,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'portugues',
    'Questão 10 - ENEM 2022',
    'Em um texto argumentativo, o autor defende uma tese utilizando argumentos para convencer o leitor. A redação do ENEM exige a produção de um texto dissertativo-argumentativo sobre um tema de ordem social, científica, cultural ou política.',
    'Em uma dissertação, a estratégia de citar dados estatísticos é usada para:',
    'Emocionar o leitor',
    'Fundamentar os argumentos com evidências',
    'Ornamentar o texto',
    'Distrair o leitor do tema central',
    'Substituir a opinião do autor',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 11: Português - Interpretação
(
    'enem-2023-lg-11',
    2023, 11,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'portugues',
    'Questão 11 - ENEM 2023',
    'A ironia é um recurso linguístico que consiste em afirmar o contrário do que se pensa, geralmente com intenção crítica ou humorística. O contexto é fundamental para identificá-la.',
    'Na frase "Que lindo! Mais um aumento de impostos", a ironia revela:',
    'Satisfação com a medida',
    'Indiferença política',
    'Insatisfação e crítica à medida',
    'Concordância com o governo',
    'Neutralidade do falante',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 12: Literatura - Realismo
(
    'enem-2022-lg-12',
    2022, 12,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'portugues',
    'Questão 12 - ENEM 2022',
    'O Realismo surgiu na segunda metade do século XIX como reação ao Romantismo. Os escritores realistas buscavam retratar a sociedade de forma objetiva, criticando a hipocrisia da burguesia e os problemas sociais da época.',
    'Uma característica do Realismo brasileiro é:',
    'A idealização do amor romântico',
    'A crítica social e a análise psicológica das personagens',
    'A valorização do sentimentalismo',
    'O escapismo para a natureza',
    'A exaltação do nacionalismo',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 13: Artes - Arte contemporânea
(
    'enem-2021-lg-13',
    2021, 13,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'artes',
    'Questão 13 - ENEM 2021',
    'A arte contemporânea, surgida na segunda metade do século XX, questiona os limites tradicionais da arte. Instalações, performances e intervenções urbanas são algumas de suas manifestações, que frequentemente provocam reflexão e interação com o público.',
    'Uma característica da arte contemporânea é:',
    'A busca pela técnica perfeita na representação',
    'O questionamento sobre o que é arte',
    'A valorização exclusiva da pintura',
    'A reprodução fiel da natureza',
    'O afastamento do público',
    'B',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 14: Português - Funções da linguagem
(
    'enem-2023-lg-14',
    2023, 14,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'portugues',
    'Questão 14 - ENEM 2023',
    'As funções da linguagem, segundo Roman Jakobson, relacionam-se aos elementos do processo de comunicação. A função emotiva, por exemplo, está centrada no emissor e expressa seus sentimentos e emoções.',
    'A função da linguagem predominante em textos publicitários é:',
    'Referencial',
    'Emotiva',
    'Conativa (ou apelativa)',
    'Metalinguística',
    'Fática',
    'C',
    'ENEM-EXEMPLO', 'ativa'
),
-- LG 15: Inglês - Interpretação
(
    'enem-2022-lg-15',
    2022, 15,
    'linguagens', 'Linguagens, Códigos e suas Tecnologias', 'ingles',
    'Questão 15 - ENEM 2022',
    'The use of social media has transformed the way people communicate and share information. While these platforms can connect people globally, they also raise concerns about privacy, mental health, and the spread of misinformation.',
    'According to the text, social media:',
    'Has only positive effects on society',
    'Has both benefits and drawbacks',
    'Should be completely banned',
    'Does not affect mental health',
    'Is used only for entertainment',
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

SELECT 'Total de questões:' as info, COUNT(*) as total FROM questoes_enem;
