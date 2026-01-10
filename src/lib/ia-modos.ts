/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PLATAFORMA-EDU - SISTEMA DE MODOS DA IA TUTOR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Modos de operação:
 * - DIRETO: Respostas curtas e objetivas
 * - PASSO_A_PASSO: Resolução detalhada de questões
 * - MAPA_MENTAL: Esquemas visuais de tópicos
 * - ESTIMULAR: Reengajar estudante travado/desmotivado
 * - SOCRATICO: Guiar após erro sem dar resposta
 * - CONVERSACIONAL: Padrão para diálogo natural
 */

export type ModoIA =
  | 'DIRETO'
  | 'PASSO_A_PASSO'
  | 'MAPA_MENTAL'
  | 'ESTIMULAR'
  | 'SOCRATICO'
  | 'CONVERSACIONAL'

export interface ContextoEstudante {
  sequenciaErros?: number
  ultimoResultado?: 'acerto' | 'erro' | null
  nivelFrustracao?: number // 1-10
  nivelEngajamento?: number // 1-10
  precisaMotivacao?: boolean
  msgsSemResposta?: number
}

// ═══════════════════════════════════════════════════════════════════════════
// DETECÇÃO AUTOMÁTICA DE MODO
// ═══════════════════════════════════════════════════════════════════════════

export function detectarModo(mensagem: string, contexto: ContextoEstudante = {}): ModoIA {
  const msg = mensagem.toLowerCase().trim()

  // Verificar estado emocional primeiro (prioridade alta)
  if (contexto.precisaMotivacao || (contexto.sequenciaErros && contexto.sequenciaErros >= 3)) {
    return 'ESTIMULAR'
  }

  // RESPOSTA DIRETA - perguntas objetivas
  const padroesDireto = [
    'qual a fórmula', 'qual é a fórmula', 'fórmula de', 'fórmula da',
    'o que é', 'o que são', 'defina', 'definição de', 'definição da',
    'qual a unidade', 'unidade de', 'quanto vale', 'quanto é',
    'sim ou não', 'verdadeiro ou falso', 'qual o valor',
    'qual é o símbolo', 'como se chama', 'quem descobriu'
  ]
  if (padroesDireto.some(p => msg.includes(p))) {
    return 'DIRETO'
  }

  // PASSO A PASSO - resolver questões
  const padroesPasso = [
    'resolva', 'resolve', 'resolver', 'como resolver', 'como resolvo',
    'me ajuda com essa questão', 'essa questão', 'esse exercício',
    'calcule', 'calcular', 'determine', 'determinar', 'encontre', 'encontrar',
    'ache o valor', 'passo a passo', 'como faço', 'como fazer',
    'me explica como', 'qual o resultado', 'qual é o resultado'
  ]
  if (padroesPasso.some(p => msg.includes(p))) {
    return 'PASSO_A_PASSO'
  }

  // MAPA MENTAL - revisão de conteúdo
  const padroesMapa = [
    'mapa mental', 'mapa conceitual', 'esquema de', 'esquema sobre',
    'resumo de', 'resumo sobre', 'revisão de', 'revisão sobre',
    'visão geral', 'tudo sobre', 'explica tudo sobre',
    'me explica tudo', 'resumão', 'resumir'
  ]
  if (padroesMapa.some(p => msg.includes(p))) {
    return 'MAPA_MENTAL'
  }

  // ESTIMULAR - estudante travado ou passivo
  const padroesTravado = [
    'não sei', 'não entendi', 'não entendo', 'n sei', 'n entendi',
    'tô perdido', 'estou perdido', 'to perdido', 'perdido',
    'não consigo', 'n consigo', 'não consegui',
    'muito difícil', 'difícil demais', 'mt difícil',
    'desisto', 'vou desistir', 'não tô entendendo',
    'complicado', 'confuso', 'tá difícil', 'ta dificil',
    'socorro', 'help', 'ajuda'
  ]
  if (padroesTravado.some(p => msg.includes(p))) {
    return 'ESTIMULAR'
  }

  // Verificar inatividade
  if (contexto.msgsSemResposta && contexto.msgsSemResposta > 2) {
    return 'ESTIMULAR'
  }

  // SOCRÁTICO - após erro (verificado pelo contexto)
  if (contexto.ultimoResultado === 'erro') {
    return 'SOCRATICO'
  }

  // Padrão: conversacional
  return 'CONVERSACIONAL'
}

// ═══════════════════════════════════════════════════════════════════════════
// DETECÇÃO DE TÓPICO
// ═══════════════════════════════════════════════════════════════════════════

export function detectarTopico(mensagem: string): string {
  const msg = mensagem.toLowerCase()

  const topicos: Record<string, string[]> = {
    'cinematica': [
      'velocidade', 'aceleração', 'aceleracao', 'mru', 'mruv',
      'queda livre', 'lançamento', 'lancamento', 'movimento',
      'posição', 'posicao', 'deslocamento', 'trajetória', 'trajetoria'
    ],
    'dinamica': [
      'força', 'forca', 'newton', 'atrito', 'peso', 'normal',
      'tração', 'tracao', 'inércia', 'inercia', 'ação e reação',
      'plano inclinado', 'equilíbrio', 'equilibrio'
    ],
    'energia': [
      'trabalho', 'potência', 'potencia', 'energia cinética',
      'energia potencial', 'conservação', 'conservacao', 'joule', 'watt'
    ],
    'termologia': [
      'temperatura', 'calor', 'dilatação', 'dilatacao',
      'termodinâmica', 'termodinamica', 'celsius', 'kelvin', 'gás', 'gas'
    ],
    'ondas': [
      'onda', 'frequência', 'frequencia', 'período', 'periodo',
      'comprimento de onda', 'som', 'acústica', 'acustica', 'ressonância'
    ],
    'eletricidade': [
      'corrente', 'tensão', 'tensao', 'resistência', 'resistencia',
      'ohm', 'circuito', 'elétrico', 'eletrico', 'carga', 'coulomb', 'volt'
    ],
    'optica': [
      'luz', 'espelho', 'lente', 'refração', 'refracao',
      'reflexão', 'reflexao', 'índice de refração', 'óptica', 'optica'
    ],
    'funcoes': [
      'função', 'funcao', 'quadrática', 'quadratica', 'exponencial',
      'logarítmica', 'logaritmica', 'domínio', 'dominio', 'imagem'
    ],
    'geometria': [
      'triângulo', 'triangulo', 'círculo', 'circulo', 'quadrado',
      'retângulo', 'retangulo', 'área', 'area', 'perímetro', 'perimetro',
      'volume', 'pitágoras', 'pitagoras'
    ],
    'algebra': [
      'equação', 'equacao', 'inequação', 'inequacao', 'sistema',
      'matriz', 'determinante', 'polinômio', 'polinomio'
    ],
    'trigonometria': [
      'seno', 'cosseno', 'tangente', 'trigonometria', 'ângulo', 'angulo',
      'radianos', 'graus'
    ],
    'estatistica': [
      'média', 'media', 'mediana', 'moda', 'probabilidade',
      'estatística', 'estatistica', 'combinatória', 'combinatoria'
    ]
  }

  for (const [topico, palavras] of Object.entries(topicos)) {
    if (palavras.some(p => msg.includes(p))) {
      return topico
    }
  }

  return 'geral'
}

// ═══════════════════════════════════════════════════════════════════════════
// PROMPTS POR MODO
// ═══════════════════════════════════════════════════════════════════════════

export const PROMPT_MODO_DIRETO = `
## MODO: RESPOSTA DIRETA

Pergunta objetiva. Responda de forma direta e precisa.

FORMATO:
1. Resposta em 1-2 frases
2. Formula (se aplicavel): \`formula\`
3. Exemplo rapido (opcional)

REGRAS:
- Maximo 4 linhas
- Va direto ao ponto
- Use **negrito** para termos-chave
- Nao faca perguntas de volta
`

export const PROMPT_MODO_PASSO_A_PASSO = `
## MODO: RESOLVER PASSO A PASSO

O estudante quer resolver uma questao. Guie a resolucao completa.

FORMATO:

**Dados do problema:**
- Dado 1: valor (unidade)
- Dado 2: valor (unidade)
- Incognita: ?

**Formula:**
\`Formula principal\`

**Resolucao:**

Passo 1: [Descricao]
[Calculo]

Passo 2: [Descricao]
[Calculo]

**Resposta:** [Resultado com unidade]

**Observacao:** [Erro comum a evitar ou ponto de atencao]

REGRAS:
- Siga o formato acima
- Nunca pule etapas
- Explique o porquê de cada passo
- Destaque a resposta final
`

export const PROMPT_MODO_MAPA_MENTAL = `
## MODO: MAPA MENTAL VISUAL

O estudante quer uma visao geral organizada do topico.

FORMATO:

1. Breve introducao (2-3 linhas)

2. Mapa mental em formato Mermaid.js:

\`\`\`mermaid
mindmap
  root((TEMA CENTRAL))
    Conceito 1
      Detalhe 1.1
      Detalhe 1.2
    Conceito 2
      Detalhe 2.1
      Detalhe 2.2
\`\`\`

3. Formulas importantes apos o mapa

REGRAS:
- Use ((texto)) para o no central
- Nao use caracteres especiais no mermaid (sem 2a, o, etc)
- Maximo 4 niveis de profundidade
- Formulas ficam FORA do mapa
`

export const PROMPT_MODO_ESTIMULAR = `
## MODO: REENGAJAR ESTUDANTE

O estudante esta travado ou desmotivado. Objetivo: reengaja-lo sem ser condescendente.

ESTRATEGIAS (baseadas em neurociencia):

1. REDUCAO DE CARGA COGNITIVA: Simplifique o problema
   "Vamos focar so nessa parte primeiro..."

2. CONEXAO COM CONHECIMENTO PREVIO:
   "Voce lembra como funciona [conceito mais simples]? E parecido."

3. NORMALIZACAO:
   "Esse conceito confunde bastante gente no inicio. O que exatamente ta travando?"

4. PERGUNTA DIAGNOSTICA:
   "Me conta: o que voce ja tentou? Onde exatamente travou?"

5. MICRODESAFIO:
   "Tenta so essa parte: [problema simplificado]. Depois a gente continua."

REGRAS:
- Nunca seja condescendente ou exageradamente animado
- Faca perguntas especificas, nao genericas
- Maximo 3 frases
- Tom: professor experiente que entende a dificuldade
`

export const PROMPT_MODO_SOCRATICO = `
## MODO: SOCRATICO (apos erro)

O estudante errou. Nao de a resposta - guie o raciocinio.

ESTRATEGIA:

1. Identifique o tipo de erro:
   - Erro de calculo: "Confere esse passo: [indicar onde]"
   - Erro conceitual: "Volta nessa parte: [conceito]. O que ela diz sobre [aspecto]?"
   - Dado errado: "Olha de novo os dados. O que o enunciado diz sobre [variavel]?"

2. Faca UMA pergunta direcionadora:
   "Quando voce fez [passo], considerou que [dica]?"

3. De uma pista especifica (nao a resposta):
   "Lembra que nesse tipo de problema, [principio] sempre se aplica..."

EXEMPLOS:

Erro de calculo:
"Seu raciocinio esta certo. Mas confere o passo onde voce [operacao]. Voce considerou [detalhe]?"

Erro conceitual:
"Voce usou [formula/conceito], mas esse problema e um caso de [outro conceito]. Por que voce acha que e diferente?"

REGRAS:
- Nunca de a resposta direta
- Uma pergunta por vez
- Seja especifico sobre onde esta o problema
- Tom neutro, sem "muito bem" ou "quase la"
`

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO PARA OBTER PROMPT DO MODO
// ═══════════════════════════════════════════════════════════════════════════

export function obterPromptModo(modo: ModoIA): string {
  const prompts: Record<ModoIA, string> = {
    'DIRETO': PROMPT_MODO_DIRETO,
    'PASSO_A_PASSO': PROMPT_MODO_PASSO_A_PASSO,
    'MAPA_MENTAL': PROMPT_MODO_MAPA_MENTAL,
    'ESTIMULAR': PROMPT_MODO_ESTIMULAR,
    'SOCRATICO': PROMPT_MODO_SOCRATICO,
    'CONVERSACIONAL': '' // Usa apenas prompt base do tutor
  }
  return prompts[modo] || ''
}

// ═══════════════════════════════════════════════════════════════════════════
// DESCRIÇÃO DOS MODOS (para UI)
// ═══════════════════════════════════════════════════════════════════════════

export function obterDescricaoModo(modo: ModoIA): { icone: string; nome: string; descricao: string } {
  const descricoes: Record<ModoIA, { icone: string; nome: string; descricao: string }> = {
    'DIRETO': {
      icone: '⚡',
      nome: 'Resposta Direta',
      descricao: 'Resposta curta e objetiva'
    },
    'PASSO_A_PASSO': {
      icone: '📝',
      nome: 'Passo a Passo',
      descricao: 'Resolução detalhada'
    },
    'MAPA_MENTAL': {
      icone: '🗺️',
      nome: 'Mapa Mental',
      descricao: 'Esquema visual do tópico'
    },
    'ESTIMULAR': {
      icone: '💪',
      nome: 'Motivação',
      descricao: 'Ajuda para desbloquear'
    },
    'SOCRATICO': {
      icone: '🎓',
      nome: 'Guia Socrático',
      descricao: 'Perguntas para reflexão'
    },
    'CONVERSACIONAL': {
      icone: '💬',
      nome: 'Conversa',
      descricao: 'Diálogo natural'
    }
  }
  return descricoes[modo]
}
