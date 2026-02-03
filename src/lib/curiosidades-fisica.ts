/**
 * Banco de curiosidades de Física organizadas por tema
 * Cada tema tem múltiplas curiosidades que são exibidas na trilha Curiosidade
 */

export interface CuriosidadeFisica {
  voceSabia: string       // Fato curioso exibido ANTES da questão
  saibaMais: string       // Explicação mais detalhada exibida no FEEDBACK
  fonteReal?: string      // Conexão com o mundo real
}

const CURIOSIDADES: Record<string, CuriosidadeFisica[]> = {
  // ═══ MECÂNICA ═══
  'Cinemática': [
    {
      voceSabia: 'Um guepardo acelera de 0 a 100 km/h em apenas 3 segundos — mais rápido que a maioria dos carros esportivos!',
      saibaMais: 'A aceleração do guepardo é de aproximadamente 9,3 m/s², quase igual à aceleração da gravidade. Isso é possível graças às suas garras semi-retráteis que funcionam como travas no chão.',
      fonteReal: 'Engenheiros usam biomimética (imitação da natureza) para projetar pneus com melhor aderência.',
    },
    {
      voceSabia: 'A Estação Espacial Internacional orbita a Terra a 27.600 km/h — ela dá uma volta completa a cada 90 minutos!',
      saibaMais: 'Nessa velocidade, os astronautas veem 16 nascer e pôr do sol por dia. A velocidade orbital é calculada pela fórmula v = √(GM/r), onde G é a constante gravitacional.',
      fonteReal: 'Para manter essa velocidade, a ISS precisa ser reposicionada periodicamente, pois o atrito com a atmosfera rarefeita a desacelera.',
    },
    {
      voceSabia: 'Se você soltar uma bola de boliche e uma pena no vácuo, elas caem exatamente ao mesmo tempo!',
      saibaMais: 'O astronauta David Scott demonstrou isso na Lua em 1971 com um martelo e uma pena. Sem resistência do ar, todos os objetos caem com a mesma aceleração (g ≈ 9,8 m/s² na Terra).',
      fonteReal: 'A NASA tem a maior câmara de vácuo do mundo (Space Power Facility) onde isso é testado regularmente.',
    },
    {
      voceSabia: 'Um raio atinge a Terra com velocidade de até 360.000 km/h — cerca de 1/3 da velocidade da luz!',
      saibaMais: 'A descarga elétrica de um raio aquece o ar ao redor a cerca de 30.000°C, cinco vezes mais quente que a superfície do Sol. O trovão é causado pela rápida expansão desse ar superaquecido.',
    },
  ],

  'Dinâmica': [
    {
      voceSabia: 'Você pesa menos no elevador quando ele está descendo e acelerando — e mais quando está subindo!',
      saibaMais: 'Isso acontece porque a balança mede a força normal, não a massa. Quando o elevador acelera para baixo, a normal diminui (P\' = m(g-a)). Na queda livre, você teria "peso zero"!',
      fonteReal: 'Astronautas treinam em aviões que fazem parábolas de queda livre (o "Vomit Comet") para simular gravidade zero.',
    },
    {
      voceSabia: 'Uma formiga pode carregar até 50 vezes o próprio peso! Se um humano fizesse o mesmo, carregaria 4 toneladas.',
      saibaMais: 'Isso acontece porque a força muscular escala com a área da seção transversal (L²), mas o peso escala com o volume (L³). Animais menores têm uma relação força/peso muito mais favorável.',
      fonteReal: 'Engenheiros de robótica usam esse princípio para criar microrobôs extremamente fortes para seu tamanho.',
    },
    {
      voceSabia: 'Newton não descobriu a gravidade por causa de uma maçã na cabeça — ele observou a maçã cair e se perguntou por quê.',
      saibaMais: 'A grande sacada de Newton foi perceber que a mesma força que puxa a maçã para baixo é a que mantém a Lua em órbita. Ele unificou a física terrestre e celeste com F = Gm₁m₂/r².',
    },
  ],

  'Força': [
    {
      voceSabia: 'A força de atrito entre seus pneus e a estrada é o que permite seu carro curvar — sem atrito, você iria reto!',
      saibaMais: 'Em uma curva, a força centrípeta necessária é F = mv²/r. Quanto maior a velocidade ou menor o raio da curva, mais atrito é necessário. É por isso que curvas acentuadas têm limites de velocidade menores.',
      fonteReal: 'Pistas de corrida da F1 são inclinadas nas curvas (banking) para reduzir a dependência do atrito.',
    },
    {
      voceSabia: 'Seus pés exercem uma pressão no chão de cerca de 20 kPa ao caminhar — quase o dobro de um elefante!',
      saibaMais: 'Pressão = Força/Área. Embora o elefante pese muito mais, suas patas gigantes distribuem o peso em uma área enorme, resultando em pressão menor (cerca de 12 kPa).',
    },
  ],

  // ═══ ENERGIA ═══
  'Energia': [
    {
      voceSabia: 'A energia de um único raio poderia alimentar uma lâmpada de 100W por 3 meses!',
      saibaMais: 'Um raio típico libera cerca de 1 bilhão de joules (1 GJ). O problema é que dura apenas milissegundos, então a potência instantânea é enorme mas a energia total é relativamente pequena.',
      fonteReal: 'Cientistas já tentaram capturar energia de raios, mas a imprevisibilidade e a potência instantânea tornam isso impraticável.',
    },
    {
      voceSabia: 'Se toda a matéria de uma moeda de 1 real fosse convertida em energia (E=mc²), alimentaria o Brasil por um dia!',
      saibaMais: 'Uma moeda de ~7g convertida em energia daria E = 0,007 × (3×10⁸)² = 6,3 × 10¹⁴ J. Isso equivale a cerca de 175 GWh, comparável ao consumo diário do Brasil.',
    },
    {
      voceSabia: 'Uma montanha-russa funciona quase inteiramente por conversão de energia: potencial no topo → cinética na descida!',
      saibaMais: 'O motor só é usado para subir a primeira rampa. Depois disso, toda a energia é gravitacional sendo convertida em movimento. A altura de cada morro subsequente é menor por causa das perdas por atrito.',
      fonteReal: 'Engenheiros de parques calculam cada morro usando mgh = ½mv² + perdas por atrito.',
    },
  ],

  'Trabalho e Energia': [
    {
      voceSabia: 'Uma pessoa subindo um lance de escadas gera cerca de 200W de potência — o mesmo que duas lâmpadas incandescentes!',
      saibaMais: 'Potência = Trabalho/Tempo = mgh/t. Uma pessoa de 70kg subindo 3m em 3s: P = 70 × 10 × 3 / 3 = 700W. Mas nossa eficiência muscular é apenas ~25%, então usamos cerca de 2800W de energia metabólica.',
    },
  ],

  // ═══ TERMODINÂMICA ═══
  'Termodinâmica': [
    {
      voceSabia: 'O zero absoluto (-273,15°C) é a temperatura mais baixa possível — nela, os átomos param quase completamente de se mover!',
      saibaMais: 'Na prática, é impossível atingir exatamente 0 K (terceira lei da termodinâmica). O recorde é 0,000000000038 K, alcançado em laboratório na Alemanha em 2021.',
      fonteReal: 'Computadores quânticos operam próximos do zero absoluto para reduzir o ruído térmico que interfere nos qubits.',
    },
    {
      voceSabia: 'Quando você assopra com a boca aberta, o ar sai quente. Com a boca fechada (como apagando vela), sai frio!',
      saibaMais: 'Com a boca quase fechada, o ar se expande rapidamente (expansão adiabática) e esfria — é o mesmo princípio do ar-condicionado e da geladeira.',
    },
    {
      voceSabia: 'O Sol converte 4 milhões de toneladas de matéria em energia A CADA SEGUNDO e ainda assim vai durar mais 5 bilhões de anos!',
      saibaMais: 'A massa do Sol é tão grande (2 × 10³⁰ kg) que perder 4 × 10⁶ kg/s é insignificante. A fusão nuclear no núcleo converte hidrogênio em hélio, liberando energia via E = mc².',
    },
  ],

  'Calor': [
    {
      voceSabia: 'Panelas de pressão cozinham mais rápido porque a pressão alta faz a água ferver acima de 100°C!',
      saibaMais: 'Dentro da panela, a pressão chega a ~2 atm, e a água ferve a ~120°C. Cada 10°C a mais praticamente dobra a velocidade das reações químicas do cozimento.',
      fonteReal: 'No topo do Everest, onde a pressão é menor, a água ferve a ~70°C e é impossível cozinhar um ovo completamente.',
    },
  ],

  // ═══ ONDAS ═══
  'Ondas': [
    {
      voceSabia: 'No espaço, ninguém pode te ouvir gritar — o som precisa de um meio material para se propagar!',
      saibaMais: 'O som é uma onda mecânica (compressão e rarefação do ar). No vácuo do espaço, sem moléculas para vibrar, não há propagação sonora. Já a luz é uma onda eletromagnética e viaja no vácuo.',
      fonteReal: 'A NASA converteu ondas eletromagnéticas de um buraco negro em som audível — um Si bemol 57 oitavas abaixo do dó central!',
    },
    {
      voceSabia: 'O efeito Doppler explica por que a sirene da ambulância fica mais aguda quando se aproxima e mais grave quando se afasta!',
      saibaMais: 'Quando a ambulância se aproxima, as ondas sonoras são "comprimidas" (menor comprimento de onda = frequência maior). Quando se afasta, são "esticadas". O mesmo efeito ocorre com a luz (redshift das galáxias).',
    },
  ],

  'Acústica': [
    {
      voceSabia: 'O som viaja 4,3 vezes mais rápido na água do que no ar — baleias se comunicam a centenas de quilômetros!',
      saibaMais: 'Velocidade do som: ar ≈ 343 m/s, água ≈ 1.480 m/s, aço ≈ 5.960 m/s. Quanto mais denso e rígido o meio, mais rápido o som se propaga. v = √(B/ρ) onde B é o módulo de elasticidade.',
    },
  ],

  // ═══ ÓPTICA ═══
  'Óptica': [
    {
      voceSabia: 'O céu é azul porque as moléculas da atmosfera espalham mais a luz azul que a vermelha — isso se chama espalhamento Rayleigh!',
      saibaMais: 'A intensidade do espalhamento é proporcional a 1/λ⁴. Como o azul tem comprimento de onda menor (~450nm) que o vermelho (~700nm), é espalhado ~5,5 vezes mais. No pôr do sol, a luz percorre mais atmosfera e o azul já foi todo espalhado, sobrando vermelho/laranja.',
    },
    {
      voceSabia: 'Seus olhos detectam apenas 0,0035% de todo o espectro eletromagnético — o restante é invisível para nós!',
      saibaMais: 'Luz visível vai de ~380nm (violeta) a ~700nm (vermelho). O espectro total vai de raios gama (10⁻¹² m) até ondas de rádio (10³ m). Cobras "enxergam" infravermelho e abelhas veem ultravioleta!',
      fonteReal: 'Câmeras termais detectam infravermelho e são usadas em resgate, medicina e segurança.',
    },
  ],

  // ═══ ELETRICIDADE ═══
  'Eletricidade': [
    {
      voceSabia: 'Os elétrons na fiação da sua casa se movem a apenas 0,1 mm/s — mais lentos que um caracol!',
      saibaMais: 'Apesar da velocidade de deriva ser lenta, o sinal elétrico (campo eletromagnético) viaja a ~2/3 da velocidade da luz. É como uma fila: quando o primeiro empurra, o último sente quase instantaneamente.',
      fonteReal: 'Em um fio de cobre com 1mm² de seção e 10A de corrente, a velocidade de deriva é v = I/(nAe) ≈ 0,074 cm/s.',
    },
    {
      voceSabia: 'Um raio tem voltagem de até 300 milhões de volts — mas a corrente média é de "apenas" 30.000 ampères por microssegundos!',
      saibaMais: 'A potência instantânea de um raio chega a 1 terawatt (10¹² W), mas como dura tão pouco, a energia total é relativamente baixa (~1-5 GJ).',
    },
  ],

  'Eletromagnetismo': [
    {
      voceSabia: 'A Terra é um ímã gigante! O polo norte magnético fica na verdade perto do polo sul geográfico.',
      saibaMais: 'O campo magnético da Terra é gerado pelo movimento do ferro líquido no núcleo externo (efeito dínamo). Esse campo nos protege das partículas solares — sem ele, a atmosfera seria varrida como aconteceu em Marte.',
      fonteReal: 'O polo magnético está se movendo ~55 km/ano em direção à Sibéria. Os polos já se inverteram centenas de vezes na história da Terra.',
    },
  ],

  // ═══ FÍSICA MODERNA ═══
  'Física Moderna': [
    {
      voceSabia: 'Se o átomo fosse do tamanho de um estádio de futebol, o núcleo seria uma ervilha no centro — o resto é vazio!',
      saibaMais: 'O raio do átomo é ~10⁻¹⁰ m e do núcleo ~10⁻¹⁵ m, uma razão de 100.000:1. Quase toda a massa está no núcleo. Se removêssemos o espaço vazio dos átomos, toda a humanidade caberia em um cubo de açúcar.',
    },
    {
      voceSabia: 'O GPS do seu celular só funciona por causa da relatividade de Einstein — sem correção relativística, erraria 10 km por dia!',
      saibaMais: 'Os satélites GPS estão em velocidade alta (dilatação do tempo especial: -7μs/dia) e em gravidade menor (dilatação gravitacional: +45μs/dia). Efeito líquido: +38μs/dia, que sem correção causaria erro de ~10km.',
      fonteReal: 'Cada satélite GPS carrega relógios atômicos que são ajustados para a relatividade antes do lançamento.',
    },
  ],

  'Gravitação': [
    {
      voceSabia: 'Em Júpiter, você pesaria 2,5 vezes mais! Uma pessoa de 70kg pesaria 175kg lá.',
      saibaMais: 'A gravidade na superfície de Júpiter é ~24,8 m/s² (vs 9,8 m/s² na Terra). Curiosamente, apesar de ser 318 vezes mais massivo, sua gravidade superficial é "só" 2,5x maior porque seu raio é 11x maior. g = GM/R².',
    },
    {
      voceSabia: 'Se você pudesse cavar um túnel pelo centro da Terra e pular, levaria 42 minutos para chegar do outro lado!',
      saibaMais: 'Isso é um resultado clássico de MHS (Movimento Harmônico Simples). O período é T = 2π√(R/g) ≈ 84 min, então a ida simples leva metade: ~42 min. Curiosamente, isso independe da massa do objeto.',
    },
  ],

  // ═══ FLUIDOS ═══
  'Hidrostática': [
    {
      voceSabia: 'Se você mergulhar a 10 metros de profundidade, a pressão sobre seu corpo dobra — cada 10m adicionam 1 atmosfera!',
      saibaMais: 'Pressão hidrostática: P = P₀ + ρgh. Com ρ_água = 1000 kg/m³ e g = 10 m/s², a cada 10m: ΔP = 1000 × 10 × 10 = 100.000 Pa = 1 atm. Na fossa das Marianas (11.000m), são ~1.100 atm!',
      fonteReal: 'O peixe-pescador vive a 4.000m de profundidade sob 400 atm de pressão — equivalente a ter um elefante apoiado em cada cm² do corpo.',
    },
  ],

  // ═══ MHs PADRÃO ═══
  'Movimento': [
    {
      voceSabia: 'A Terra gira a ~1.674 km/h no equador, mas você não sente porque tudo ao redor gira junto!',
      saibaMais: 'Pela 1ª lei de Newton, se não há aceleração resultante perceptível, não sentimos o movimento. Na verdade, há uma pequena força centrífuga que faz você pesar ~0,3% menos no equador do que nos polos.',
    },
  ],

  // Fallback genérico
  'Física Geral': [
    {
      voceSabia: 'A Física está em absolutamente tudo: do café esfriando na mesa ao celular que carrega por indução!',
      saibaMais: 'A palavra "Física" vem do grego "physis" que significa natureza. A Física estuda desde as menores partículas subatômicas até a maior estrutura do universo.',
    },
    {
      voceSabia: 'O vidro não é exatamente sólido nem líquido — é um "sólido amorfo" cujas moléculas não têm estrutura cristalina!',
      saibaMais: 'Diferente dos cristais (como o sal), o vidro não tem organização molecular regular. Por isso ele pode ser moldado quando aquecido e é transparente — a desordem das moléculas não espalha a luz.',
    },
  ],
}

// Temas de Matemática
const CURIOSIDADES_MAT: Record<string, CuriosidadeFisica[]> = {
  'Números': [
    {
      voceSabia: 'O número π tem infinitas casas decimais sem repetição — e aparece em círculos, ondas, probabilidade e até rios!',
      saibaMais: 'Albert Einstein nasceu no dia π (14/03 = 3.14). O rio sinuoso tem comprimento/distância direta ≈ π. Em 2024, π foi calculado com 105 trilhões de dígitos.',
    },
  ],
  'Álgebra': [
    {
      voceSabia: 'A palavra "álgebra" vem do árabe "al-jabr", que significa "reunião de partes quebradas" — do livro de Al-Khwarizmi (820 d.C.)!',
      saibaMais: 'Al-Khwarizmi também deu origem à palavra "algoritmo". Seu livro descrevia métodos para resolver equações do 1º e 2º grau — a base de toda a programação moderna.',
    },
  ],
  'Geometria': [
    {
      voceSabia: 'As pirâmides do Egito usam o triângulo 3-4-5 (pitagórico) para garantir ângulos retos perfeitos — há 4.500 anos!',
      saibaMais: 'O teorema de Pitágoras (a² + b² = c²) foi usado por egípcios e babilônios antes de Pitágoras. Existem mais de 400 demonstrações diferentes deste teorema.',
    },
  ],
  'Funções': [
    {
      voceSabia: 'A curva catenária (forma de corrente suspensa) é diferente da parábola — e é a forma mais forte para arcos!',
      saibaMais: 'A equação da catenária é y = a·cosh(x/a). A Sagrada Família de Gaudí usa catenárias invertidas como arcos estruturais. É a forma que minimiza tensões internas.',
    },
  ],
  'Estatística': [
    {
      voceSabia: 'Em uma sala com 23 pessoas, a chance de duas terem o mesmo aniversário é superior a 50%!',
      saibaMais: 'É o "Paradoxo do Aniversário". Com 23 pessoas há 253 pares possíveis. A probabilidade de nenhum par coincidir é (365/365)×(364/365)×...×(343/365) ≈ 49,3%. Então P(coincidência) ≈ 50,7%.',
    },
  ],
  'Matemática Geral': [
    {
      voceSabia: 'O número de ouro (φ ≈ 1,618) aparece na espiral do girassol, na concha do nautilus e na proporção do rosto humano!',
      saibaMais: 'φ = (1+√5)/2. Está ligado à sequência de Fibonacci (1,1,2,3,5,8,13...) onde cada termo dividido pelo anterior converge para φ. A natureza "prefere" essa proporção por otimização de espaço.',
    },
  ],
}

/**
 * Busca uma curiosidade aleatória para o tema dado
 */
export function buscarCuriosidade(tema: string, componente: 'fisica' | 'matematica' = 'fisica'): CuriosidadeFisica {
  const banco = componente === 'matematica' ? CURIOSIDADES_MAT : CURIOSIDADES

  // Tentar match exato primeiro
  if (banco[tema] && banco[tema].length > 0) {
    return banco[tema][Math.floor(Math.random() * banco[tema].length)]
  }

  // Tentar match parcial (ex: tema "Cinemática Escalar" → "Cinemática")
  const temaLower = tema.toLowerCase()
  for (const [key, curiosidades] of Object.entries(banco)) {
    if (temaLower.includes(key.toLowerCase()) || key.toLowerCase().includes(temaLower)) {
      if (curiosidades.length > 0) {
        return curiosidades[Math.floor(Math.random() * curiosidades.length)]
      }
    }
  }

  // Fallback genérico
  const fallbackKey = componente === 'matematica' ? 'Matemática Geral' : 'Física Geral'
  const fallback = banco[fallbackKey]
  if (fallback && fallback.length > 0) {
    return fallback[Math.floor(Math.random() * fallback.length)]
  }

  return {
    voceSabia: componente === 'matematica'
      ? 'A Matemática é a linguagem do universo — de padrões em flores a algoritmos de inteligência artificial!'
      : 'A Física explica desde por que o céu é azul até como funcionam buracos negros!',
    saibaMais: 'Cada questão que você resolve te aproxima de entender melhor o mundo ao redor.',
  }
}
