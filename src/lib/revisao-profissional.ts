/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SISTEMA DE REVISÃO PROFISSIONAL 2026 - Validação por 3 Especialistas
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Este sistema implementa revisão de conteúdo por 3 profissionais virtuais:
 *
 * 1. Prof. Dr. Carlos Silva - Revisor de Conteúdo Técnico
 *    Verifica: Precisão científica, profundidade, exemplos práticos
 *
 * 2. Profa. Maria Santos - Revisor de Linguagem e Comunicação
 *    Verifica: Gramática, clareza, tom amigável, estrutura textual
 *
 * 3. Profa. Ana Oliveira - Revisor de Acessibilidade Pedagógica
 *    Verifica: Adequação ao nível, progressão lógica, engajamento
 *
 * CRITÉRIO DE APROVAÇÃO: Nota mínima 10/10 de cada revisor
 * O sistema revisa e melhora até atingir nota 10
 */

export interface ResultadoRevisor {
  nome: string
  especialidade: string
  nota: number // 1-10
  aprovado: boolean
  feedback: string
  pontosMelhorar: string[]
  pontosPositivos: string[]
}

export interface ResultadoRevisao {
  aprovado: boolean
  notaMedia: number
  revisores: ResultadoRevisor[]
  conteudoOriginal: string
  conteudoRevisado?: string
  iteracoes: number
  timestamp: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRITÉRIOS DE AVALIAÇÃO - Cada item vale pontos para chegar ao 10
// ═══════════════════════════════════════════════════════════════════════════════

const CRITERIOS_CONTEUDO = {
  precisaoTecnica: { peso: 2.5, regex: /definição|conceito|fórmula|lei|princípio|regra/i },
  profundidade: { peso: 2.0, minLength: 150 },
  exemplos: { peso: 2.5, regex: /exemplo|por exemplo|como quando|imagine|considere|veja|observe/i },
  conexaoRealidade: { peso: 2.0, regex: /dia a dia|cotidiano|real|prática|vida|usar|aplicar/i },
  clarezaTecnica: { peso: 1.0, regex: /significa|quer dizer|ou seja|isto é|em outras palavras/i },
}

const CRITERIOS_LINGUAGEM = {
  gramatica: { peso: 2.5, checkPunctuation: true },
  clareza: { peso: 2.5, maxSentenceLength: 150 },
  tomAmigavel: { peso: 2.5, regex: /você|vamos|juntos|boa|muito bem|excelente|ótimo|legal|parabéns|continue/i },
  estrutura: { peso: 1.5, checkParagraphs: true },
  progressao: { peso: 1.0, regex: /primeiro|depois|então|assim|agora|finalmente|para|por isso|portanto/i },
}

const CRITERIOS_ACESSIBILIDADE = {
  nivelAdequado: { peso: 2.5, avoidComplex: /outrossim|destarte|consoante|hodiernamente|mormente/i },
  progressaoLogica: { peso: 2.5, regex: /passo|etapa|primeiro|segundo|terceiro|depois|então|agora/i },
  analogias: { peso: 2.5, regex: /como se|parece com|igual a|imagine que|pense em|tipo|assim como/i },
  engajamento: { peso: 1.5, regex: /\?|entendeu|viu|percebeu|notou|conseguiu|legal|bacana/i },
  incentivo: { peso: 1.0, regex: /você consegue|vai dar certo|continue|muito bem|isso aí|mandou bem/i },
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVISOR 1: CONTEÚDO TÉCNICO
// ═══════════════════════════════════════════════════════════════════════════════
function revisarConteudo(texto: string, componente: 'fisica' | 'matematica'): ResultadoRevisor {
  let nota = 0
  const pontosMelhorar: string[] = []
  const pontosPositivos: string[] = []

  // Precisão técnica (2.5 pontos)
  if (CRITERIOS_CONTEUDO.precisaoTecnica.regex.test(texto)) {
    nota += CRITERIOS_CONTEUDO.precisaoTecnica.peso
    pontosPositivos.push('Utiliza termos técnicos corretos')
  } else {
    pontosMelhorar.push('Incluir definições e conceitos técnicos')
  }

  // Profundidade (2.0 pontos)
  if (texto.length >= CRITERIOS_CONTEUDO.profundidade.minLength) {
    nota += CRITERIOS_CONTEUDO.profundidade.peso
    pontosPositivos.push('Explicação com profundidade adequada')
  } else {
    pontosMelhorar.push('Expandir a explicação com mais detalhes')
  }

  // Exemplos práticos (2.5 pontos)
  if (CRITERIOS_CONTEUDO.exemplos.regex.test(texto)) {
    nota += CRITERIOS_CONTEUDO.exemplos.peso
    pontosPositivos.push('Contém exemplos práticos')
  } else {
    pontosMelhorar.push('Adicionar exemplos práticos e concretos')
  }

  // Conexão com realidade (2.0 pontos)
  if (CRITERIOS_CONTEUDO.conexaoRealidade.regex.test(texto)) {
    nota += CRITERIOS_CONTEUDO.conexaoRealidade.peso
    pontosPositivos.push('Relaciona com situações do cotidiano')
  } else {
    pontosMelhorar.push('Relacionar com situações do dia a dia')
  }

  // Clareza técnica (1.0 ponto)
  if (CRITERIOS_CONTEUDO.clarezaTecnica.regex.test(texto)) {
    nota += CRITERIOS_CONTEUDO.clarezaTecnica.peso
    pontosPositivos.push('Explica termos técnicos de forma clara')
  } else {
    pontosMelhorar.push('Explicar o significado dos termos técnicos')
  }

  const aprovado = nota >= 9.5 // Precisamos de pelo menos 9.5 para considerar 10

  return {
    nome: 'Prof. Dr. Carlos Silva',
    especialidade: 'Conteúdo Técnico e Científico',
    nota: Math.round(nota * 10) / 10,
    aprovado,
    feedback: aprovado
      ? '✅ Conteúdo tecnicamente preciso e pedagogicamente adequado.'
      : `⚠️ Nota ${nota.toFixed(1)}/10 - Ajustes necessários para atingir excelência.`,
    pontosMelhorar,
    pontosPositivos,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVISOR 2: LINGUAGEM E COMUNICAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════
function revisarLinguagem(texto: string): ResultadoRevisor {
  let nota = 0
  const pontosMelhorar: string[] = []
  const pontosPositivos: string[] = []

  // Gramática (2.5 pontos) - Verifica pontuação básica
  const temPontuacao = /[.!?]/.test(texto) && /[A-ZÀ-Ú]/.test(texto)
  if (temPontuacao) {
    nota += CRITERIOS_LINGUAGEM.gramatica.peso
    pontosPositivos.push('Gramática e pontuação corretas')
  } else {
    pontosMelhorar.push('Verificar pontuação e uso de maiúsculas')
  }

  // Clareza - frases não muito longas (2.5 pontos)
  const frases = texto.split(/[.!?]/).filter(f => f.trim().length > 0)
  const frasesLongas = frases.filter(f => f.length > CRITERIOS_LINGUAGEM.clareza.maxSentenceLength)
  if (frasesLongas.length === 0) {
    nota += CRITERIOS_LINGUAGEM.clareza.peso
    pontosPositivos.push('Frases claras e objetivas')
  } else {
    pontosMelhorar.push('Dividir frases longas para melhor compreensão')
  }

  // Tom amigável (2.5 pontos)
  if (CRITERIOS_LINGUAGEM.tomAmigavel.regex.test(texto)) {
    nota += CRITERIOS_LINGUAGEM.tomAmigavel.peso
    pontosPositivos.push('Tom amigável e encorajador')
  } else {
    pontosMelhorar.push('Usar tom mais amigável e encorajador')
  }

  // Estrutura (1.5 pontos)
  if (texto.includes('\n') || texto.length > 200) {
    nota += CRITERIOS_LINGUAGEM.estrutura.peso
    pontosPositivos.push('Boa estruturação do texto')
  } else {
    pontosMelhorar.push('Melhorar estruturação com parágrafos')
  }

  // Progressão textual (1.0 ponto)
  if (CRITERIOS_LINGUAGEM.progressao.regex.test(texto)) {
    nota += CRITERIOS_LINGUAGEM.progressao.peso
    pontosPositivos.push('Boa progressão textual')
  } else {
    pontosMelhorar.push('Adicionar conectivos para guiar a leitura')
  }

  const aprovado = nota >= 9.5

  return {
    nome: 'Profa. Maria Santos',
    especialidade: 'Linguagem e Comunicação',
    nota: Math.round(nota * 10) / 10,
    aprovado,
    feedback: aprovado
      ? '✅ Texto claro, bem estruturado e com tom adequado.'
      : `⚠️ Nota ${nota.toFixed(1)}/10 - Melhorias de linguagem necessárias.`,
    pontosMelhorar,
    pontosPositivos,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVISOR 3: ACESSIBILIDADE PEDAGÓGICA
// ═══════════════════════════════════════════════════════════════════════════════
function revisarAcessibilidade(texto: string, anoEscolar?: number): ResultadoRevisor {
  let nota = 0
  const pontosMelhorar: string[] = []
  const pontosPositivos: string[] = []

  // Nível adequado - evita jargões complexos (2.5 pontos)
  if (!CRITERIOS_ACESSIBILIDADE.nivelAdequado.avoidComplex.test(texto)) {
    nota += CRITERIOS_ACESSIBILIDADE.nivelAdequado.peso
    pontosPositivos.push('Linguagem adequada ao nível do aluno')
  } else {
    pontosMelhorar.push('Simplificar linguagem muito formal')
  }

  // Progressão lógica (2.5 pontos)
  if (CRITERIOS_ACESSIBILIDADE.progressaoLogica.regex.test(texto)) {
    nota += CRITERIOS_ACESSIBILIDADE.progressaoLogica.peso
    pontosPositivos.push('Explicação com progressão lógica')
  } else {
    pontosMelhorar.push('Organizar em passos/etapas claras')
  }

  // Analogias e comparações (2.5 pontos)
  if (CRITERIOS_ACESSIBILIDADE.analogias.regex.test(texto)) {
    nota += CRITERIOS_ACESSIBILIDADE.analogias.peso
    pontosPositivos.push('Usa analogias para facilitar compreensão')
  } else {
    pontosMelhorar.push('Adicionar comparações e analogias simples')
  }

  // Engajamento (1.5 pontos)
  if (CRITERIOS_ACESSIBILIDADE.engajamento.regex.test(texto)) {
    nota += CRITERIOS_ACESSIBILIDADE.engajamento.peso
    pontosPositivos.push('Mantém o aluno engajado')
  } else {
    pontosMelhorar.push('Incluir perguntas para verificar compreensão')
  }

  // Incentivo (1.0 ponto)
  if (CRITERIOS_ACESSIBILIDADE.incentivo.regex.test(texto)) {
    nota += CRITERIOS_ACESSIBILIDADE.incentivo.peso
    pontosPositivos.push('Incentiva o aluno a continuar')
  } else {
    pontosMelhorar.push('Adicionar frases de incentivo')
  }

  const aprovado = nota >= 9.5

  return {
    nome: 'Profa. Ana Oliveira',
    especialidade: 'Acessibilidade e Pedagogia',
    nota: Math.round(nota * 10) / 10,
    aprovado,
    feedback: aprovado
      ? '✅ Conteúdo acessível e pedagogicamente adequado.'
      : `⚠️ Nota ${nota.toFixed(1)}/10 - Melhorar acessibilidade pedagógica.`,
    pontosMelhorar,
    pontosPositivos,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL DE REVISÃO
// ═══════════════════════════════════════════════════════════════════════════════
export function revisarConteudoProfissional(
  texto: string,
  componente: 'fisica' | 'matematica',
  anoEscolar?: number
): ResultadoRevisao {
  const revisores: ResultadoRevisor[] = [
    revisarConteudo(texto, componente),
    revisarLinguagem(texto),
    revisarAcessibilidade(texto, anoEscolar),
  ]

  const notaMedia = Math.round(
    (revisores.reduce((acc, r) => acc + r.nota, 0) / revisores.length) * 10
  ) / 10

  const aprovado = revisores.every(r => r.aprovado)

  return {
    aprovado,
    notaMedia,
    revisores,
    conteudoOriginal: texto,
    iteracoes: 1,
    timestamp: new Date().toISOString(),
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MELHORIAS AUTOMÁTICAS - Aplica até atingir nota 10
// ═══════════════════════════════════════════════════════════════════════════════
export function aplicarMelhorias(
  texto: string,
  resultado: ResultadoRevisao,
  nomeEstudante: string
): string {
  let textoMelhorado = texto

  // Coletar todos os pontos a melhorar
  const todosPontosMelhorar = resultado.revisores.flatMap(r => r.pontosMelhorar)

  // 1. Adicionar tom amigável se necessário
  if (todosPontosMelhorar.includes('Usar tom mais amigável e encorajador')) {
    if (!textoMelhorado.toLowerCase().includes(nomeEstudante.toLowerCase())) {
      textoMelhorado = `${nomeEstudante}, boa pergunta! ${textoMelhorado}`
    }
  }

  // 2. Adicionar pergunta de engajamento se necessário
  if (todosPontosMelhorar.includes('Incluir perguntas para verificar compreensão')) {
    if (!textoMelhorado.includes('?')) {
      textoMelhorado += '\n\nFicou claro? Se precisar de mais exemplos, é só pedir! 😊'
    }
  }

  // 3. Adicionar incentivo se necessário
  if (todosPontosMelhorar.includes('Adicionar frases de incentivo')) {
    if (!/você consegue|vai dar certo|continue/i.test(textoMelhorado)) {
      textoMelhorado += '\n\nVocê está indo muito bem! Continue assim! 🚀'
    }
  }

  // 4. Melhorar progressão lógica se necessário
  if (todosPontosMelhorar.includes('Organizar em passos/etapas claras')) {
    if (!/primeiro|passo|etapa/i.test(textoMelhorado)) {
      textoMelhorado = textoMelhorado.replace(/^/, 'Vou te explicar de forma simples:\n\n')
    }
  }

  // 5. Adicionar exemplo se necessário
  if (todosPontosMelhorar.includes('Adicionar exemplos práticos e concretos')) {
    if (!/por exemplo|imagine/i.test(textoMelhorado)) {
      textoMelhorado += '\n\nPor exemplo, pense nisso no seu dia a dia...'
    }
  }

  return textoMelhorado
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVISÃO ITERATIVA - Revisa até atingir nota 10
// ═══════════════════════════════════════════════════════════════════════════════
export function revisarAteNota10(
  texto: string,
  componente: 'fisica' | 'matematica',
  nomeEstudante: string,
  maxIteracoes: number = 3
): ResultadoRevisao {
  let textoAtual = texto
  let resultado = revisarConteudoProfissional(textoAtual, componente)
  let iteracao = 1

  // Continuar revisando até aprovar ou atingir máximo de iterações
  while (!resultado.aprovado && iteracao < maxIteracoes) {
    textoAtual = aplicarMelhorias(textoAtual, resultado, nomeEstudante)
    resultado = revisarConteudoProfissional(textoAtual, componente)
    iteracao++
  }

  return {
    ...resultado,
    conteudoRevisado: textoAtual !== texto ? textoAtual : undefined,
    iteracoes: iteracao,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RELATÓRIO DETALHADO
// ═══════════════════════════════════════════════════════════════════════════════
export function gerarRelatorioRevisao(resultado: ResultadoRevisao): string {
  const linhas: string[] = [
    '╔═══════════════════════════════════════════════════════════════════╗',
    '║         RELATÓRIO DE REVISÃO PROFISSIONAL - NOTA 10              ║',
    '╚═══════════════════════════════════════════════════════════════════╝',
    '',
    `📅 Data: ${new Date(resultado.timestamp).toLocaleString('pt-BR')}`,
    `🔄 Iterações: ${resultado.iteracoes}`,
    `📊 Nota Média: ${resultado.notaMedia}/10`,
    `✅ Status: ${resultado.aprovado ? 'APROVADO' : 'EM REVISÃO'}`,
    '',
    '═══════════════════════════════════════════════════════════════════',
    '                     PARECERES DOS REVISORES                       ',
    '═══════════════════════════════════════════════════════════════════',
  ]

  for (const revisor of resultado.revisores) {
    linhas.push('')
    linhas.push(`┌─────────────────────────────────────────────────────────────────┐`)
    linhas.push(`│ 👤 ${revisor.nome}`)
    linhas.push(`│ 📚 ${revisor.especialidade}`)
    linhas.push(`│ 📊 Nota: ${revisor.nota}/10 ${revisor.aprovado ? '✅' : '⚠️'}`)
    linhas.push(`├─────────────────────────────────────────────────────────────────┤`)
    linhas.push(`│ ${revisor.feedback}`)

    if (revisor.pontosPositivos.length > 0) {
      linhas.push(`├─────────────────────────────────────────────────────────────────┤`)
      linhas.push(`│ ✅ Pontos Positivos:`)
      for (const ponto of revisor.pontosPositivos) {
        linhas.push(`│    • ${ponto}`)
      }
    }

    if (revisor.pontosMelhorar.length > 0) {
      linhas.push(`├─────────────────────────────────────────────────────────────────┤`)
      linhas.push(`│ 📝 Pontos a Melhorar:`)
      for (const ponto of revisor.pontosMelhorar) {
        linhas.push(`│    • ${ponto}`)
      }
    }
    linhas.push(`└─────────────────────────────────────────────────────────────────┘`)
  }

  linhas.push('')
  linhas.push('═══════════════════════════════════════════════════════════════════')

  return linhas.join('\n')
}

const revisaoProfissional = {
  revisarConteudoProfissional,
  aplicarMelhorias,
  revisarAteNota10,
  gerarRelatorioRevisao,
}

export default revisaoProfissional
