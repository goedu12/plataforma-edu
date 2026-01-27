// ═══════════════════════════════════════════════════════════════════════════
// TEORIA DE FÍSICA - ENSINO MÉDIO
// Baseado na Matriz de Habilidades Essenciais 2026
// ═══════════════════════════════════════════════════════════════════════════

export interface Exemplo {
  enunciado: string
  resolucao: string[]
  resposta: string
}

export interface Formula {
  expressao: string
  descricao: string
  variaveis?: { simbolo: string; significado: string }[]
}

export interface Topico {
  id: string
  titulo: string
  icone: string
  resumo: string
  conteudo: string[]
  formulas: Formula[]
  exemplos: Exemplo[]
  dicaImportante?: string
  conexaoCotidiano?: string
}

export interface ConteudoBimestre {
  bimestre: number
  habilidadePrincipal: string
  codigoHabilidade: string
  topicos: Topico[]
}

export interface ConteudoSerie {
  serie: number
  componente: 'fisica'
  bimestres: ConteudoBimestre[]
}

// ═══════════════════════════════════════════════════════════════════════════
// 1ª SÉRIE - FÍSICA
// ═══════════════════════════════════════════════════════════════════════════

export const FISICA_1_SERIE: ConteudoSerie = {
  serie: 1,
  componente: 'fisica',
  bimestres: [
    {
      bimestre: 1,
      habilidadePrincipal: 'Elaborar explicações, previsões e cálculos a respeito dos movimentos de objetos na Terra, no Sistema Solar e no Universo com base na análise das interações gravitacionais.',
      codigoHabilidade: 'EM13CNT204',
      topicos: [
        {
          id: 'introducao-fisica',
          titulo: 'Introdução à Física',
          icone: '🔬',
          resumo: 'A Física estuda os fenômenos naturais e suas leis fundamentais.',
          conteudo: [
            'A Física é a ciência que estuda a natureza e seus fenômenos, buscando compreender as leis que regem o universo.',
            'Ela se divide em várias áreas: Mecânica, Termologia, Óptica, Ondulatória, Eletromagnetismo e Física Moderna.',
            'O método científico é a base da Física: observação, hipótese, experimentação e conclusão.',
          ],
          formulas: [],
          exemplos: [],
          dicaImportante: 'A Física está em tudo ao nosso redor: no movimento dos carros, na luz do Sol, no som da música!',
          conexaoCotidiano: 'Quando você usa o celular, está usando princípios de eletromagnetismo e ondas.',
        },
        {
          id: 'grandezas-unidades',
          titulo: 'Grandezas e Unidades (SI)',
          icone: '📏',
          resumo: 'O Sistema Internacional de Unidades padroniza as medições científicas.',
          conteudo: [
            'Grandeza física é tudo que pode ser medido: comprimento, massa, tempo, temperatura, etc.',
            'O SI (Sistema Internacional) define 7 unidades básicas para padronizar medições no mundo todo.',
            'As principais unidades básicas são: metro (m), quilograma (kg), segundo (s), ampère (A), kelvin (K), mol (mol) e candela (cd).',
            'Prefixos do SI facilitam expressar valores muito grandes ou pequenos: kilo (k = 10³), mili (m = 10⁻³), micro (μ = 10⁻⁶).',
          ],
          formulas: [
            {
              expressao: '1 km = 1000 m = 10³ m',
              descricao: 'Conversão quilômetro para metro',
            },
            {
              expressao: '1 h = 60 min = 3600 s',
              descricao: 'Conversão hora para segundos',
            },
          ],
          exemplos: [
            {
              enunciado: 'Converta 72 km/h para m/s.',
              resolucao: [
                '72 km/h = 72 × (1000 m) / (3600 s)',
                '72 km/h = 72000 / 3600 m/s',
                '72 km/h = 20 m/s',
              ],
              resposta: '20 m/s',
            },
          ],
          dicaImportante: 'Para converter km/h para m/s, divida por 3,6. Para m/s para km/h, multiplique por 3,6.',
        },
        {
          id: 'notacao-cientifica',
          titulo: 'Notação Científica',
          icone: '🔢',
          resumo: 'Forma de expressar números muito grandes ou muito pequenos.',
          conteudo: [
            'Notação científica expressa números na forma: N × 10ⁿ, onde 1 ≤ N < 10.',
            'É essencial na Física para trabalhar com escalas astronômicas ou atômicas.',
            'Facilita cálculos e evita erros com zeros.',
          ],
          formulas: [
            {
              expressao: 'N × 10ⁿ',
              descricao: 'Forma geral da notação científica',
              variaveis: [
                { simbolo: 'N', significado: 'Número entre 1 e 10' },
                { simbolo: 'n', significado: 'Expoente inteiro' },
              ],
            },
          ],
          exemplos: [
            {
              enunciado: 'Escreva 150.000.000 km (distância Terra-Sol) em notação científica.',
              resolucao: [
                'Mover a vírgula até ter um número entre 1 e 10',
                '150.000.000 = 1,5 × 10⁸',
                'Contamos 8 casas decimais',
              ],
              resposta: '1,5 × 10⁸ km',
            },
          ],
        },
        {
          id: 'referenciais',
          titulo: 'Referenciais Inerciais e Não Inerciais',
          icone: '🎯',
          resumo: 'O movimento depende do ponto de vista do observador.',
          conteudo: [
            'Referencial é o ponto de vista a partir do qual observamos um movimento.',
            'Referencial inercial: está em repouso ou movimento retilíneo uniforme. Nele, as leis de Newton são válidas.',
            'Referencial não inercial: está acelerado. Aparecem "forças fictícias" como a força centrífuga.',
            'Exemplo: dentro de um ônibus freando, você sente ser "jogado para frente" - é uma força fictícia.',
          ],
          formulas: [],
          exemplos: [
            {
              enunciado: 'Um passageiro está sentado em um trem em movimento. Para ele, a árvore na estação está em movimento ou repouso?',
              resolucao: [
                'O referencial do passageiro é o trem',
                'Em relação ao trem, a árvore se move para trás',
                'Em relação à Terra, a árvore está parada',
              ],
              resposta: 'A árvore está em movimento em relação ao passageiro.',
            },
          ],
          conexaoCotidiano: 'No carro em curva, você sente ser "jogado" para fora - é a força centrífuga (fictícia).',
        },
        {
          id: 'grandezas-escalares-vetoriais',
          titulo: 'Grandezas Escalares e Vetoriais',
          icone: '➡️',
          resumo: 'Algumas grandezas precisam de direção e sentido para serem completas.',
          conteudo: [
            'Grandezas escalares: definidas apenas pelo valor numérico (módulo). Ex: massa, temperatura, tempo, energia.',
            'Grandezas vetoriais: precisam de módulo, direção e sentido. Ex: velocidade, aceleração, força.',
            'Vetores são representados por setas: o comprimento indica o módulo, a orientação indica direção e sentido.',
            'Operações com vetores: soma (regra do paralelogramo), subtração, decomposição.',
          ],
          formulas: [
            {
              expressao: '|R| = √(Ax² + Ay²)',
              descricao: 'Módulo do vetor resultante (componentes perpendiculares)',
            },
          ],
          exemplos: [
            {
              enunciado: 'Dois vetores perpendiculares têm módulos 3 e 4. Qual o módulo da resultante?',
              resolucao: [
                'Vetores perpendiculares: usamos Pitágoras',
                'R² = 3² + 4²',
                'R² = 9 + 16 = 25',
                'R = √25 = 5',
              ],
              resposta: 'R = 5',
            },
          ],
          dicaImportante: 'Velocidade é vetor (tem direção), rapidez é escalar (só o valor).',
        },
        {
          id: 'mru',
          titulo: 'Movimento Retilíneo Uniforme (MRU)',
          icone: '🚗',
          resumo: 'Movimento em linha reta com velocidade constante.',
          conteudo: [
            'No MRU, o móvel percorre distâncias iguais em tempos iguais.',
            'A velocidade é constante (não muda) e a aceleração é ZERO.',
            'O gráfico S × t é uma reta inclinada. A inclinação é a velocidade.',
            'O gráfico v × t é uma reta horizontal.',
          ],
          formulas: [
            {
              expressao: 'S = S₀ + v · t',
              descricao: 'Função horária da posição no MRU',
              variaveis: [
                { simbolo: 'S', significado: 'Posição final (m)' },
                { simbolo: 'S₀', significado: 'Posição inicial (m)' },
                { simbolo: 'v', significado: 'Velocidade constante (m/s)' },
                { simbolo: 't', significado: 'Tempo (s)' },
              ],
            },
            {
              expressao: 'v = ΔS / Δt',
              descricao: 'Velocidade média',
            },
          ],
          exemplos: [
            {
              enunciado: 'Um carro viaja a 80 km/h constante. Qual a distância percorrida em 2,5 horas?',
              resolucao: [
                'Dados: v = 80 km/h, t = 2,5 h, S₀ = 0',
                'Fórmula: S = S₀ + v · t',
                'S = 0 + 80 × 2,5',
                'S = 200 km',
              ],
              resposta: 'S = 200 km',
            },
            {
              enunciado: 'Um trem de 100 m atravessa uma ponte de 400 m a 20 m/s. Quanto tempo leva?',
              resolucao: [
                'Distância total: trem + ponte = 100 + 400 = 500 m',
                'v = ΔS / Δt → Δt = ΔS / v',
                'Δt = 500 / 20 = 25 s',
              ],
              resposta: 't = 25 segundos',
            },
          ],
          dicaImportante: 'No MRU, a área sob o gráfico v × t representa o deslocamento.',
        },
        {
          id: 'mruv',
          titulo: 'Movimento Retilíneo Uniformemente Variado (MRUV)',
          icone: '🚀',
          resumo: 'Movimento com aceleração constante (velocidade varia uniformemente).',
          conteudo: [
            'No MRUV, a velocidade aumenta ou diminui de forma constante.',
            'A aceleração é constante e diferente de zero.',
            'Se a > 0 e v > 0: movimento acelerado. Se a < 0 e v > 0: movimento retardado.',
            'O gráfico v × t é uma reta inclinada. O gráfico S × t é uma parábola.',
          ],
          formulas: [
            {
              expressao: 'v = v₀ + a · t',
              descricao: 'Função horária da velocidade',
              variaveis: [
                { simbolo: 'v', significado: 'Velocidade final (m/s)' },
                { simbolo: 'v₀', significado: 'Velocidade inicial (m/s)' },
                { simbolo: 'a', significado: 'Aceleração (m/s²)' },
                { simbolo: 't', significado: 'Tempo (s)' },
              ],
            },
            {
              expressao: 'S = S₀ + v₀·t + (a·t²)/2',
              descricao: 'Função horária da posição',
            },
            {
              expressao: 'v² = v₀² + 2·a·ΔS',
              descricao: 'Equação de Torricelli (sem tempo)',
            },
          ],
          exemplos: [
            {
              enunciado: 'Um carro parte do repouso e acelera a 2 m/s². Qual sua velocidade após 10 s?',
              resolucao: [
                'Dados: v₀ = 0, a = 2 m/s², t = 10 s',
                'Fórmula: v = v₀ + a · t',
                'v = 0 + 2 × 10',
                'v = 20 m/s',
              ],
              resposta: 'v = 20 m/s (ou 72 km/h)',
            },
            {
              enunciado: 'Um carro a 20 m/s freia com aceleração de -5 m/s². Qual a distância até parar?',
              resolucao: [
                'Dados: v₀ = 20 m/s, v = 0 (para), a = -5 m/s²',
                'Torricelli: v² = v₀² + 2·a·ΔS',
                '0 = 400 + 2·(-5)·ΔS',
                '0 = 400 - 10·ΔS',
                'ΔS = 40 m',
              ],
              resposta: 'ΔS = 40 metros',
            },
          ],
          dicaImportante: 'Use Torricelli quando não tiver o tempo. É a fórmula "coringa" do MRUV!',
          conexaoCotidiano: 'A frenagem de um carro é MRUV retardado. Quanto maior a velocidade, maior a distância de frenagem.',
        },
        {
          id: 'graficos-movimento',
          titulo: 'Gráficos do Movimento',
          icone: '📊',
          resumo: 'Interpretar gráficos S×t e v×t é essencial na cinemática.',
          conteudo: [
            'Gráfico S × t: a inclinação (tangente) dá a velocidade instantânea.',
            'Gráfico v × t: a inclinação dá a aceleração. A área sob a curva dá o deslocamento.',
            'MRU: S×t é reta inclinada, v×t é reta horizontal.',
            'MRUV: S×t é parábola, v×t é reta inclinada.',
          ],
          formulas: [
            {
              expressao: 'v = tan(θ) no gráfico S×t',
              descricao: 'Velocidade como inclinação',
            },
            {
              expressao: 'a = tan(θ) no gráfico v×t',
              descricao: 'Aceleração como inclinação',
            },
            {
              expressao: 'ΔS = área sob v×t',
              descricao: 'Deslocamento como área',
            },
          ],
          exemplos: [
            {
              enunciado: 'Em um gráfico v×t, a velocidade vai de 0 a 20 m/s em 4 s (reta). Qual o deslocamento?',
              resolucao: [
                'A área sob o gráfico é um triângulo',
                'Área = (base × altura) / 2',
                'Área = (4 × 20) / 2 = 40 m',
              ],
              resposta: 'ΔS = 40 metros',
            },
          ],
        },
      ],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════
// 2ª SÉRIE - FÍSICA
// ═══════════════════════════════════════════════════════════════════════════

export const FISICA_2_SERIE: ConteudoSerie = {
  serie: 2,
  componente: 'fisica',
  bimestres: [
    {
      bimestre: 1,
      habilidadePrincipal: 'Analisar as propriedades dos materiais para avaliar a adequação de seu uso em diferentes aplicações.',
      codigoHabilidade: 'EM13CNT307',
      topicos: [
        {
          id: 'ondas-introducao',
          titulo: 'Introdução às Ondas',
          icone: '🌊',
          resumo: 'Ondas transportam energia sem transportar matéria.',
          conteudo: [
            'Onda é uma perturbação que se propaga transportando energia, sem transportar matéria.',
            'Exemplos: ondas no mar, som, luz, ondas de rádio, terremotos.',
            'Elementos de uma onda: amplitude (A), comprimento de onda (λ), frequência (f), período (T), velocidade (v).',
            'Relação fundamental: v = λ · f',
          ],
          formulas: [
            {
              expressao: 'v = λ · f',
              descricao: 'Velocidade da onda',
              variaveis: [
                { simbolo: 'v', significado: 'Velocidade (m/s)' },
                { simbolo: 'λ', significado: 'Comprimento de onda (m)' },
                { simbolo: 'f', significado: 'Frequência (Hz)' },
              ],
            },
            {
              expressao: 'T = 1/f',
              descricao: 'Período e frequência',
            },
          ],
          exemplos: [
            {
              enunciado: 'Uma onda tem frequência 100 Hz e comprimento de onda 3 m. Qual sua velocidade?',
              resolucao: [
                'v = λ · f',
                'v = 3 × 100',
                'v = 300 m/s',
              ],
              resposta: 'v = 300 m/s',
            },
          ],
          conexaoCotidiano: 'O Wi-Fi do seu celular usa ondas eletromagnéticas para transmitir dados.',
        },
        {
          id: 'tipos-ondas',
          titulo: 'Tipos de Ondas',
          icone: '📡',
          resumo: 'Classificação das ondas quanto à natureza, direção e dimensão.',
          conteudo: [
            'Quanto à natureza: Mecânicas (precisam de meio material: som, onda no mar) e Eletromagnéticas (não precisam: luz, rádio).',
            'Quanto à direção de vibração: Transversais (vibração perpendicular à propagação) e Longitudinais (vibração paralela).',
            'Quanto à dimensão: Unidimensionais (corda), Bidimensionais (água), Tridimensionais (som no ar).',
            'A luz é transversal e eletromagnética. O som é longitudinal e mecânica.',
          ],
          formulas: [],
          exemplos: [
            {
              enunciado: 'Classifique a onda sonora quanto à natureza e direção de vibração.',
              resolucao: [
                'O som precisa de meio material (ar, água, sólido)',
                'Portanto é uma onda MECÂNICA',
                'As partículas do ar vibram na mesma direção da propagação',
                'Portanto é uma onda LONGITUDINAL',
              ],
              resposta: 'Mecânica e longitudinal.',
            },
          ],
        },
        {
          id: 'reflexao-refracao',
          titulo: 'Reflexão e Refração',
          icone: '🔦',
          resumo: 'Fenômenos que ocorrem quando a luz muda de meio.',
          conteudo: [
            'Reflexão: a luz "volta" ao bater em uma superfície. O ângulo de incidência é igual ao de reflexão.',
            'Refração: a luz muda de direção ao passar de um meio para outro (ex: ar → água).',
            'Índice de refração (n): indica o quanto a luz é "freada" no meio. n = c/v.',
            'Lei de Snell: n₁ · sen(θ₁) = n₂ · sen(θ₂)',
          ],
          formulas: [
            {
              expressao: 'θᵢ = θᵣ',
              descricao: 'Lei da reflexão',
            },
            {
              expressao: 'n = c/v',
              descricao: 'Índice de refração',
              variaveis: [
                { simbolo: 'n', significado: 'Índice de refração' },
                { simbolo: 'c', significado: 'Velocidade da luz no vácuo (3×10⁸ m/s)' },
                { simbolo: 'v', significado: 'Velocidade da luz no meio' },
              ],
            },
            {
              expressao: 'n₁ · sen(θ₁) = n₂ · sen(θ₂)',
              descricao: 'Lei de Snell-Descartes',
            },
          ],
          exemplos: [
            {
              enunciado: 'A luz passa do ar (n=1) para a água (n=1,33) com ângulo de incidência de 45°. Qual o ângulo de refração?',
              resolucao: [
                'Lei de Snell: n₁·sen(θ₁) = n₂·sen(θ₂)',
                '1 × sen(45°) = 1,33 × sen(θ₂)',
                '0,707 = 1,33 × sen(θ₂)',
                'sen(θ₂) = 0,532',
                'θ₂ ≈ 32°',
              ],
              resposta: 'θ₂ ≈ 32°',
            },
          ],
          conexaoCotidiano: 'Quando você vê um "canudo quebrado" dentro do copo d\'água, é a refração!',
        },
        {
          id: 'fibra-optica',
          titulo: 'Fibra Óptica',
          icone: '💡',
          resumo: 'Tecnologia que usa a luz para transmitir informações.',
          conteudo: [
            'A fibra óptica usa o princípio da reflexão interna total para transmitir luz.',
            'A luz fica "presa" dentro da fibra por reflexões sucessivas nas paredes.',
            'Vantagens: alta velocidade, grande capacidade, imunidade a interferências eletromagnéticas.',
            'É usada em internet de alta velocidade, telecomunicações, equipamentos médicos.',
          ],
          formulas: [
            {
              expressao: 'sen(θc) = n₂/n₁',
              descricao: 'Ângulo crítico para reflexão total',
            },
          ],
          exemplos: [
            {
              enunciado: 'Por que a fibra óptica é melhor que cabos de cobre para internet?',
              resolucao: [
                '1. Maior velocidade de transmissão (usa luz)',
                '2. Não sofre interferência eletromagnética',
                '3. Menor perda de sinal em longas distâncias',
                '4. Maior capacidade de dados',
              ],
              resposta: 'Velocidade, imunidade a interferências, menor perda e maior capacidade.',
            },
          ],
          dicaImportante: 'A reflexão interna total só ocorre quando a luz vai do meio mais denso para o menos denso.',
        },
      ],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════
// 3ª SÉRIE - FÍSICA
// ═══════════════════════════════════════════════════════════════════════════

export const FISICA_3_SERIE: ConteudoSerie = {
  serie: 3,
  componente: 'fisica',
  bimestres: [
    {
      bimestre: 1,
      habilidadePrincipal: 'Analisar as propriedades dos materiais para avaliar a adequação de seu uso em diferentes aplicações.',
      codigoHabilidade: 'EM13CNT307',
      topicos: [
        {
          id: 'eletrostatica-introducao',
          titulo: 'Introdução à Eletrostática',
          icone: '⚡',
          resumo: 'Estudo das cargas elétricas em repouso.',
          conteudo: [
            'Eletrostática estuda cargas elétricas paradas (estáticas).',
            'Existem dois tipos de carga: positiva (+) e negativa (-).',
            'Cargas de mesmo sinal se repelem. Cargas de sinais opostos se atraem.',
            'A carga elementar é a do elétron: e = 1,6 × 10⁻¹⁹ C.',
            'A carga de um corpo é sempre múltiplo da carga elementar: Q = n · e.',
          ],
          formulas: [
            {
              expressao: 'Q = n · e',
              descricao: 'Quantização da carga',
              variaveis: [
                { simbolo: 'Q', significado: 'Carga total (C)' },
                { simbolo: 'n', significado: 'Número de elétrons' },
                { simbolo: 'e', significado: '1,6 × 10⁻¹⁹ C' },
              ],
            },
          ],
          exemplos: [
            {
              enunciado: 'Um corpo tem excesso de 5 × 10¹² elétrons. Qual sua carga?',
              resolucao: [
                'Q = n · e',
                'Q = 5 × 10¹² × 1,6 × 10⁻¹⁹',
                'Q = 8 × 10⁻⁷ C',
                'Como são elétrons em excesso, a carga é negativa',
              ],
              resposta: 'Q = -8 × 10⁻⁷ C = -0,8 μC',
            },
          ],
          conexaoCotidiano: 'O choque que você leva ao tocar em uma maçaneta no inverno é eletricidade estática!',
        },
        {
          id: 'processos-eletrizacao',
          titulo: 'Processos de Eletrização',
          icone: '🔋',
          resumo: 'Formas de carregar eletricamente um corpo.',
          conteudo: [
            'Atrito: dois materiais diferentes são atritados. Um perde elétrons, outro ganha. Ficam com cargas opostas.',
            'Contato: um corpo carregado toca um neutro. As cargas se distribuem. Ficam com cargas de mesmo sinal.',
            'Indução: aproximar (sem tocar) um corpo carregado de um neutro. O neutro fica com cargas separadas.',
            'Na indução, se aterrarmos o corpo, ele fica com carga oposta ao indutor.',
          ],
          formulas: [],
          exemplos: [
            {
              enunciado: 'Uma esfera A com carga +8 μC toca uma esfera B neutra, idêntica. Qual a carga final de cada uma?',
              resolucao: [
                'Carga total: +8 μC + 0 = +8 μC',
                'Esferas idênticas: cargas se dividem igualmente',
                'Carga de cada = 8/2 = 4 μC',
              ],
              resposta: 'Cada esfera fica com +4 μC.',
            },
          ],
          dicaImportante: 'No atrito, as cargas são OPOSTAS. No contato, são de MESMO SINAL. Na indução com aterramento, são OPOSTAS.',
        },
        {
          id: 'lei-coulomb',
          titulo: 'Lei de Coulomb',
          icone: '🧲',
          resumo: 'Força de interação entre duas cargas elétricas.',
          conteudo: [
            'A força entre duas cargas é proporcional ao produto das cargas e inversamente proporcional ao quadrado da distância.',
            'É uma força de ação e reação: mesma intensidade, direções opostas.',
            'A constante eletrostática no vácuo é k₀ = 9 × 10⁹ N·m²/C².',
            'Força > 0: repulsão. Força < 0: atração (na convenção de sinais).',
          ],
          formulas: [
            {
              expressao: 'F = k · |Q₁ · Q₂| / d²',
              descricao: 'Lei de Coulomb',
              variaveis: [
                { simbolo: 'F', significado: 'Força elétrica (N)' },
                { simbolo: 'k', significado: '9 × 10⁹ N·m²/C²' },
                { simbolo: 'Q₁, Q₂', significado: 'Cargas (C)' },
                { simbolo: 'd', significado: 'Distância entre cargas (m)' },
              ],
            },
          ],
          exemplos: [
            {
              enunciado: 'Duas cargas de +2 μC estão separadas por 30 cm. Qual a força entre elas?',
              resolucao: [
                'Dados: Q₁ = Q₂ = 2 × 10⁻⁶ C, d = 0,3 m, k = 9 × 10⁹',
                'F = k · Q₁ · Q₂ / d²',
                'F = 9 × 10⁹ × (2 × 10⁻⁶)² / (0,3)²',
                'F = 9 × 10⁹ × 4 × 10⁻¹² / 0,09',
                'F = 0,4 N (repulsão, pois cargas de mesmo sinal)',
              ],
              resposta: 'F = 0,4 N de repulsão',
            },
          ],
          dicaImportante: 'Se a distância DOBRA, a força cai para 1/4. Se a distância cai pela METADE, a força quadruplica!',
        },
        {
          id: 'campo-eletrico',
          titulo: 'Campo Elétrico',
          icone: '📶',
          resumo: 'Região do espaço onde uma carga exerce força sobre outras.',
          conteudo: [
            'Campo elétrico é a região onde uma carga de prova sofre força elétrica.',
            'É representado por linhas de campo que saem de cargas + e chegam em cargas -.',
            'O campo é um vetor: tem módulo, direção e sentido.',
            'Uma carga de prova positiva segue o sentido do campo; negativa, sentido contrário.',
          ],
          formulas: [
            {
              expressao: 'E = F/q',
              descricao: 'Campo como força por unidade de carga',
              variaveis: [
                { simbolo: 'E', significado: 'Campo elétrico (N/C ou V/m)' },
                { simbolo: 'F', significado: 'Força sobre a carga de prova (N)' },
                { simbolo: 'q', significado: 'Carga de prova (C)' },
              ],
            },
            {
              expressao: 'E = k · |Q| / d²',
              descricao: 'Campo de uma carga puntiforme',
            },
          ],
          exemplos: [
            {
              enunciado: 'Uma carga de +4 μC gera campo elétrico. Qual o campo a 20 cm dela?',
              resolucao: [
                'E = k · |Q| / d²',
                'E = 9 × 10⁹ × 4 × 10⁻⁶ / (0,2)²',
                'E = 36 × 10³ / 0,04',
                'E = 9 × 10⁵ N/C',
              ],
              resposta: 'E = 9 × 10⁵ N/C (ou 900 kN/C)',
            },
          ],
        },
        {
          id: 'energia-potencial',
          titulo: 'Energia Potencial Elétrica',
          icone: '🔌',
          resumo: 'Energia armazenada na configuração de cargas.',
          conteudo: [
            'A energia potencial elétrica é a energia armazenada devido à posição das cargas.',
            'O potencial elétrico (V) é a energia por unidade de carga: V = Ep/q.',
            'Cargas de mesmo sinal: Ep > 0 (sistema tende a se afastar).',
            'Cargas de sinais opostos: Ep < 0 (sistema tende a se aproximar).',
          ],
          formulas: [
            {
              expressao: 'Ep = k · Q₁ · Q₂ / d',
              descricao: 'Energia potencial entre duas cargas',
            },
            {
              expressao: 'V = k · Q / d',
              descricao: 'Potencial de uma carga puntiforme',
              variaveis: [
                { simbolo: 'V', significado: 'Potencial elétrico (V)' },
                { simbolo: 'Q', significado: 'Carga fonte (C)' },
                { simbolo: 'd', significado: 'Distância (m)' },
              ],
            },
          ],
          exemplos: [
            {
              enunciado: 'Qual o potencial a 50 cm de uma carga de +10 nC?',
              resolucao: [
                'V = k · Q / d',
                'V = 9 × 10⁹ × 10 × 10⁻⁹ / 0,5',
                'V = 90 / 0,5',
                'V = 180 V',
              ],
              resposta: 'V = 180 V',
            },
          ],
          conexaoCotidiano: 'A tensão da tomada (127V ou 220V) é uma diferença de potencial elétrico!',
        },
        {
          id: 'campo-eletrico-saude',
          titulo: 'Campo Elétrico e Saúde',
          icone: '🏥',
          resumo: 'Efeitos dos campos elétricos e radiações no corpo humano.',
          conteudo: [
            'Campos elétricos intensos podem afetar o funcionamento de células e tecidos.',
            'Equipamentos como celulares emitem radiação não ionizante (baixa energia).',
            'Radiação ionizante (raios X, gama) pode danificar DNA e causar câncer.',
            'Uso consciente de tecnologia e proteção adequada são importantes.',
          ],
          formulas: [],
          exemplos: [
            {
              enunciado: 'Por que se usa avental de chumbo em radiografias?',
              resolucao: [
                'Raios X são radiação ionizante',
                'Podem danificar células e DNA',
                'O chumbo é denso e absorve a radiação',
                'Protege órgãos vitais da exposição desnecessária',
              ],
              resposta: 'O chumbo bloqueia a radiação ionizante, protegendo os órgãos.',
            },
          ],
          dicaImportante: 'Não durma com o celular debaixo do travesseiro. Mantenha distância de fontes de radiação quando possível.',
        },
      ],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAÇÃO GERAL
// ═══════════════════════════════════════════════════════════════════════════

export const FISICA_CONTEUDOS: Record<number, ConteudoSerie> = {
  1: FISICA_1_SERIE,
  2: FISICA_2_SERIE,
  3: FISICA_3_SERIE,
}

export function getTopicosTeoria(serie: number, bimestre: number = 1): Topico[] {
  const conteudo = FISICA_CONTEUDOS[serie]
  if (!conteudo) return []

  const bim = conteudo.bimestres.find(b => b.bimestre === bimestre)
  return bim?.topicos || []
}

export function getTopicoById(serie: number, topicoId: string, bimestre: number = 1): Topico | null {
  const topicos = getTopicosTeoria(serie, bimestre)
  return topicos.find(t => t.id === topicoId) || null
}
