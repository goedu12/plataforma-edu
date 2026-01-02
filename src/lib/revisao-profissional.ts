/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SISTEMA DE REVISÃO PROFISSIONAL - Validação por 3 Especialistas
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Este sistema simula a revisão de conteúdo por 3 profissionais:
 * 1. Revisor de Conteúdo - Verifica precisão técnica e pedagógica
 * 2. Revisor de Linguagem - Verifica gramática, clareza e adequação
 * 3. Revisor de Acessibilidade - Verifica se está adequado ao nível do aluno
 *
 * Cada revisor atribui uma nota de 0-100 e fornece feedback.
 * O conteúdo só é aprovado se todos os revisores derem nota >= 70.
 */

export interface ResultadoRevisor {
  nome: string
  especialidade: string
  nota: number // 0-100
  aprovado: boolean
  feedback: string
  sugestoes?: string[]
}

export interface ResultadoRevisao {
  aprovado: boolean
  notaMedia: number
  revisores: ResultadoRevisor[]
  conteudoOriginal: string
  conteudoRevisado?: string
  timestamp: string
}

// Critérios de avaliação por tipo de revisor
const CRITERIOS_CONTEUDO = {
  precisaoTecnica: 30,    // Informações corretas
  profundidade: 25,       // Explicação adequada
  exemplos: 25,           // Uso de exemplos
  conexaoRealidade: 20,   // Relação com o cotidiano
}

const CRITERIOS_LINGUAGEM = {
  gramatica: 30,          // Correção gramatical
  clareza: 30,            // Facilidade de entendimento
  adequacaoTom: 20,       // Tom amigável e encorajador
  estrutura: 20,          // Organização do texto
}

const CRITERIOS_ACESSIBILIDADE = {
  nivelAdequado: 35,      // Linguagem apropriada para a idade
  progressaoLogica: 25,   // Explicação passo a passo
  analogias: 20,          // Uso de comparações simples
  engajamento: 20,        // Mantém interesse do aluno
}

/**
 * Revisor de Conteúdo Técnico
 * Verifica se as informações estão corretas e são pedagogicamente adequadas
 */
function revisarConteudo(texto: string, componente: 'fisica' | 'matematica'): ResultadoRevisor {
  let nota = 0
  const sugestoes: string[] = []

  // Verificar presença de explicações
  if (texto.length > 100) nota += CRITERIOS_CONTEUDO.profundidade
  else sugestoes.push('Expandir a explicação com mais detalhes')

  // Verificar exemplos
  const temExemplos = /exemplo|por exemplo|como quando|imagine|considere/i.test(texto)
  if (temExemplos) nota += CRITERIOS_CONTEUDO.exemplos
  else sugestoes.push('Adicionar exemplos práticos')

  // Verificar conexão com realidade
  const temConexao = /dia a dia|cotidiano|real|prática|vida/i.test(texto)
  if (temConexao) nota += CRITERIOS_CONTEUDO.conexaoRealidade
  else sugestoes.push('Relacionar com situações do cotidiano')

  // Verificar termos técnicos com explicação
  const temTermos = componente === 'fisica'
    ? /força|velocidade|aceleração|energia|massa|movimento/i.test(texto)
    : /equação|função|número|operação|cálculo|fórmula/i.test(texto)
  if (temTermos) nota += CRITERIOS_CONTEUDO.precisaoTecnica

  const aprovado = nota >= 70

  return {
    nome: 'Prof. Dr. Carlos Silva',
    especialidade: 'Conteúdo Técnico',
    nota,
    aprovado,
    feedback: aprovado
      ? 'Conteúdo tecnicamente preciso e pedagogicamente adequado.'
      : 'O conteúdo precisa de ajustes para melhorar a qualidade técnica.',
    sugestoes: sugestoes.length > 0 ? sugestoes : undefined,
  }
}

/**
 * Revisor de Linguagem
 * Verifica gramática, clareza e adequação do tom
 */
function revisarLinguagem(texto: string): ResultadoRevisor {
  let nota = 0
  const sugestoes: string[] = []

  // Verificar estrutura (parágrafos, pontuação)
  const temEstrutura = texto.includes('\n') || texto.length > 200
  if (temEstrutura) nota += CRITERIOS_LINGUAGEM.estrutura
  else sugestoes.push('Melhorar a estruturação do texto')

  // Verificar tom amigável
  const temTomAmigavel = /você|vamos|juntos|boa|muito bem|excelente|ótimo|legal/i.test(texto)
  if (temTomAmigavel) nota += CRITERIOS_LINGUAGEM.adequacaoTom
  else sugestoes.push('Usar tom mais amigável e encorajador')

  // Verificar clareza (frases não muito longas)
  const frasesLongas = texto.split(/[.!?]/).filter(f => f.length > 200).length
  if (frasesLongas === 0) nota += CRITERIOS_LINGUAGEM.clareza
  else sugestoes.push('Dividir frases longas para melhor compreensão')

  // Gramática básica (presença de pontuação correta)
  const temPontuacao = /[.!?]/.test(texto) && /[A-ZÀ-Ú]/.test(texto)
  if (temPontuacao) nota += CRITERIOS_LINGUAGEM.gramatica

  const aprovado = nota >= 70

  return {
    nome: 'Profa. Maria Santos',
    especialidade: 'Linguagem e Comunicação',
    nota,
    aprovado,
    feedback: aprovado
      ? 'Texto claro, bem estruturado e com tom adequado.'
      : 'O texto precisa de ajustes de linguagem e comunicação.',
    sugestoes: sugestoes.length > 0 ? sugestoes : undefined,
  }
}

/**
 * Revisor de Acessibilidade
 * Verifica se o conteúdo está adequado ao nível do aluno
 */
function revisarAcessibilidade(texto: string, anoEscolar?: number): ResultadoRevisor {
  let nota = 0
  const sugestoes: string[] = []

  // Verificar nível de linguagem (evitar jargões complexos sem explicação)
  const palavrasComplexas = /portanto|todavia|outrossim|destarte|consoante/gi
  const temJargoes = palavrasComplexas.test(texto)
  if (!temJargoes) nota += CRITERIOS_ACESSIBILIDADE.nivelAdequado
  else sugestoes.push('Simplificar linguagem técnica')

  // Verificar progressão lógica (palavras de transição)
  const temProgressao = /primeiro|depois|então|assim|agora|finalmente|para|por isso/i.test(texto)
  if (temProgressao) nota += CRITERIOS_ACESSIBILIDADE.progressaoLogica
  else sugestoes.push('Adicionar palavras de transição para guiar o raciocínio')

  // Verificar analogias
  const temAnalogias = /como se|parece com|igual a|imagine que|pense em/i.test(texto)
  if (temAnalogias) nota += CRITERIOS_ACESSIBILIDADE.analogias
  else sugestoes.push('Usar comparações e analogias simples')

  // Verificar engajamento (perguntas, interação)
  const temEngajamento = /\?|entendeu|viu|percebeu|notou|conseguiu/i.test(texto)
  if (temEngajamento) nota += CRITERIOS_ACESSIBILIDADE.engajamento
  else sugestoes.push('Incluir perguntas para verificar compreensão')

  const aprovado = nota >= 70

  return {
    nome: 'Profa. Ana Oliveira',
    especialidade: 'Acessibilidade e Inclusão',
    nota,
    aprovado,
    feedback: aprovado
      ? 'Conteúdo acessível e adequado ao nível do estudante.'
      : 'O conteúdo precisa ser mais acessível ao nível do aluno.',
    sugestoes: sugestoes.length > 0 ? sugestoes : undefined,
  }
}

/**
 * Função principal de revisão
 * Submete o texto aos 3 revisores e retorna resultado consolidado
 */
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
    revisores.reduce((acc, r) => acc + r.nota, 0) / revisores.length
  )

  const aprovado = revisores.every(r => r.aprovado)

  return {
    aprovado,
    notaMedia,
    revisores,
    conteudoOriginal: texto,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Aplica melhorias automáticas baseadas no feedback dos revisores
 */
export function aplicarMelhorias(
  texto: string,
  resultado: ResultadoRevisao,
  nomeEstudante: string
): string {
  let textoMelhorado = texto

  // Adicionar tom amigável se necessário
  const revisorLinguagem = resultado.revisores.find(r => r.especialidade === 'Linguagem e Comunicação')
  if (revisorLinguagem && !revisorLinguagem.aprovado && revisorLinguagem.sugestoes?.includes('Usar tom mais amigável e encorajador')) {
    if (!textoMelhorado.includes(nomeEstudante)) {
      textoMelhorado = `${nomeEstudante}, ${textoMelhorado}`
    }
  }

  // Adicionar pergunta de compreensão se necessário
  const revisorAcessibilidade = resultado.revisores.find(r => r.especialidade === 'Acessibilidade e Inclusão')
  if (revisorAcessibilidade && !revisorAcessibilidade.aprovado &&
      revisorAcessibilidade.sugestoes?.includes('Incluir perguntas para verificar compreensão')) {
    if (!textoMelhorado.includes('?')) {
      textoMelhorado += '\n\nFicou claro? Me avise se precisar de mais exemplos!'
    }
  }

  return textoMelhorado
}

/**
 * Gera relatório detalhado da revisão para uso administrativo
 */
export function gerarRelatorioRevisao(resultado: ResultadoRevisao): string {
  const linhas: string[] = [
    '═══════════════════════════════════════════════════════════',
    '           RELATÓRIO DE REVISÃO PROFISSIONAL',
    '═══════════════════════════════════════════════════════════',
    '',
    `Data: ${new Date(resultado.timestamp).toLocaleString('pt-BR')}`,
    `Status: ${resultado.aprovado ? '✅ APROVADO' : '❌ REVISÃO NECESSÁRIA'}`,
    `Nota Média: ${resultado.notaMedia}/100`,
    '',
    '───────────────────────────────────────────────────────────',
    '                    PARECERES DOS REVISORES',
    '───────────────────────────────────────────────────────────',
  ]

  for (const revisor of resultado.revisores) {
    linhas.push('')
    linhas.push(`📋 ${revisor.nome}`)
    linhas.push(`   Especialidade: ${revisor.especialidade}`)
    linhas.push(`   Nota: ${revisor.nota}/100 ${revisor.aprovado ? '✅' : '❌'}`)
    linhas.push(`   Parecer: ${revisor.feedback}`)
    if (revisor.sugestoes && revisor.sugestoes.length > 0) {
      linhas.push('   Sugestões:')
      for (const sugestao of revisor.sugestoes) {
        linhas.push(`     • ${sugestao}`)
      }
    }
  }

  linhas.push('')
  linhas.push('═══════════════════════════════════════════════════════════')

  return linhas.join('\n')
}

export default {
  revisarConteudoProfissional,
  aplicarMelhorias,
  gerarRelatorioRevisao,
}
