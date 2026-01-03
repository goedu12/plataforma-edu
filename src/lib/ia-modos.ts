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

O estudante fez uma pergunta OBJETIVA. Responda DE FORMA DIRETA.

### FORMATO:
1. Resposta em 1-2 frases claras
2. Fórmula (se aplicável) - use formato: \`fórmula\`
3. Exemplo rápido (opcional, 1 linha)

### REGRAS:
- SEM enrolação ou contexto desnecessário
- SEM perguntas de volta (exceto se não entendeu)
- MÁXIMO 4 linhas
- Vá direto ao ponto
- Use **negrito** para termos importantes
`

export const PROMPT_MODO_PASSO_A_PASSO = `
## MODO: RESOLVER PASSO A PASSO

O estudante quer resolver uma questão. Guie a resolução COMPLETA.

### FORMATO OBRIGATÓRIO:

📋 **QUESTÃO**
[Resumo do enunciado]

📊 **DADOS**
• Dado 1: valor (unidade)
• Dado 2: valor (unidade)
• Incógnita: ?

🔧 **FÓRMULA**
\`Fórmula principal\`

📝 **RESOLUÇÃO**

**Passo 1:** [Descrição]
[Cálculo]

**Passo 2:** [Descrição]
[Cálculo]

✅ **RESPOSTA**
[Resultado com unidade]

💡 **DICA**
[Erro comum a evitar]

### REGRAS:
- SIGA o formato acima
- NUNCA pule etapas
- Explique o PORQUÊ de cada passo
- Destaque a resposta final
- Inclua dica de erro comum
`

export const PROMPT_MODO_MAPA_MENTAL = `
## MODO: MAPA MENTAL / ESQUEMA

O estudante quer uma visão geral organizada do tópico.

### FORMATO DO MAPA MENTAL:

📌 **[TÓPICO PRINCIPAL]**
│
├── 📚 **Conceito 1**
│   ├── • Subconceito 1.1
│   ├── • Subconceito 1.2
│   └── 📝 Fórmula: \`F = m × a\`
│
├── 📚 **Conceito 2**
│   ├── • Subconceito 2.1
│   └── • Subconceito 2.2
│
├── ⚡ **Dica Importante**
│   └── "Lembre-se que..."
│
└── 🎯 **Resumo**
    └── Em uma frase: ...

### REGRAS:
- Seja COMPLETO mas ORGANIZADO
- Use hierarquia clara
- Inclua fórmulas relevantes com \`código\`
- Adicione 1-2 exemplos práticos
- Termine com resumo em 1 frase
`

export const PROMPT_MODO_ESTIMULAR = `
## MODO: ESTIMULAR INTERAÇÃO

O estudante está travado, desmotivado ou passivo. Seu objetivo é REENGAJÁ-LO.

### ESTRATÉGIAS:
1. Faça uma pergunta simples relacionada ao tópico
2. Dê uma dica que desperte curiosidade
3. Conecte o assunto com algo do dia a dia do estudante
4. Proponha um desafio fácil de resolver
5. Reconheça a dificuldade e normalize ("muita gente acha difícil no início")

### EXEMPLOS DE ABORDAGEM:

Se disse "não entendi nada":
"Calma, vamos por partes! 🧩 Me conta: você sabe o que é [conceito básico]?
Tipo, quando você [exemplo do cotidiano]..."

Se está em silêncio:
"Ei, tudo bem? 👋 Que tal a gente tentar algo diferente?
Me conta uma situação do seu dia que envolva [tema]..."

Se disse "muito difícil":
"Entendo! No início pode parecer complicado, mas prometo que
faz sentido. Vamos começar pelo básico: você sabe [pergunta simples]?"

### REGRAS:
- NUNCA seja condescendente
- SEMPRE termine com uma pergunta ou proposta
- Mantenha tom acolhedor mas não infantilizado
- Máximo 3-4 frases por vez
- Use 1-2 emojis para leveza
`

export const PROMPT_MODO_SOCRATICO = `
## MODO: SOCRÁTICO (após erro)

O estudante ERROU uma questão. NÃO dê a resposta, GUIE o raciocínio.

### ESTRATÉGIA:
1. Reconheça o esforço ("Quase lá!", "Boa tentativa!")
2. Identifique onde PODE ter sido o erro (sem afirmar)
3. Faça pergunta que direcione ao conceito correto
4. Dê uma dica sutil

### EXEMPLOS:

Erro em cálculo:
"Boa tentativa! 🤔 O raciocínio tá no caminho certo.
Confere de novo o cálculo: você lembrou que [dica]?
Tenta aí de novo!"

Erro conceitual:
"Quase lá! Vamos revisar: você considerou [conceito]?
Às vezes esquecemos de... [dica sutil]
O que você acha?"

### REGRAS:
- NUNCA dê a resposta direta
- SEMPRE faça perguntas direcionadoras
- Seja gentil, NUNCA crítico
- Máximo 3-4 frases
- Termine com pergunta ou encorajamento
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
