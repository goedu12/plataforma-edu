/**
 * Utilitários para limpeza e formatação de texto das questões ENEM
 */

// Valores que devem ser tratados como vazio
const VALORES_INVALIDOS = ['nan', 'none', 'null', 'undefined', 'NaN', 'None', 'NULL']

/**
 * Limpa texto de alternativas/enunciado removendo caracteres problemáticos
 */
export function limparTexto(texto: string | null | undefined): string {
  if (!texto || typeof texto !== 'string') return ''

  let limpo = texto.trim()

  // Verificar valores inválidos
  if (VALORES_INVALIDOS.includes(limpo) || VALORES_INVALIDOS.includes(limpo.toLowerCase())) {
    return ''
  }

  // Remover escapes literais (quando \n vem como texto, não como quebra)
  limpo = limpo
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\r/g, '')
    .replace(/\\\\/g, '')

  // Decodificar HTML entities comuns
  limpo = limpo
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))

  // Remover caracteres de controle e invisíveis (exceto quebras de linha)
  limpo = limpo.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Remover caractere de substituição Unicode (indica encoding quebrado)
  limpo = limpo.replace(/\uFFFD/g, '')

  // Normalizar espaços múltiplos
  limpo = limpo.replace(/\s+/g, ' ').trim()

  // Remover prefixos comuns de alternativas (a), A., a., A), etc.
  limpo = limpo.replace(/^[a-eA-E][\.\)\-\:]\s*/i, '')

  return limpo
}

/**
 * Limpa e formata contexto/enunciado para exibição
 */
export function limparContexto(texto: string | null | undefined): string {
  if (!texto || typeof texto !== 'string') return ''

  let limpo = texto.trim()

  // Verificar valores inválidos
  if (VALORES_INVALIDOS.includes(limpo) || VALORES_INVALIDOS.includes(limpo.toLowerCase())) {
    return ''
  }

  // Remover escapes literais
  limpo = limpo
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '')

  // Decodificar HTML entities
  limpo = limpo
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))

  // Converter quebras de linha em <br> para HTML
  limpo = limpo.replace(/\n/g, '<br>')

  // Remover caractere de substituição
  limpo = limpo.replace(/\uFFFD/g, '')

  return limpo.trim()
}

/**
 * Verifica se o texto é válido (não vazio ou inválido)
 */
export function isTextoValido(texto: string | null | undefined): boolean {
  if (!texto || typeof texto !== 'string') return false

  const trimmed = texto.trim()
  if (!trimmed) return false

  if (VALORES_INVALIDOS.includes(trimmed) || VALORES_INVALIDOS.includes(trimmed.toLowerCase())) {
    return false
  }

  return true
}

/**
 * Formata LaTeX básico para exibição (se necessário)
 * Remove delimitadores $...$ e formata de forma legível
 */
export function formatarMatematica(texto: string): string {
  if (!texto) return ''

  // Substituir frações LaTeX por formato mais legível
  let formatado = texto
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, '$1√($2)')

  // Substituir potências
  formatado = formatado
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^\{(\d+)\}/g, '^$1')

  // Substituir símbolos comuns
  formatado = formatado
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi/g, 'π')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\omega/g, 'ω')

  // Remover delimitadores $ de LaTeX inline
  formatado = formatado.replace(/\$([^$]+)\$/g, '$1')

  // Remover comandos LaTeX não reconhecidos
  formatado = formatado.replace(/\\[a-zA-Z]+/g, '')

  // Remover chaves vazias
  formatado = formatado.replace(/\{\}/g, '')
  formatado = formatado.replace(/\{([^{}]+)\}/g, '$1')

  return formatado.trim()
}

/**
 * Processa texto completo (limpeza + formatação matemática)
 */
export function processarTexto(texto: string | null | undefined): string {
  const limpo = limparTexto(texto)
  return formatarMatematica(limpo)
}

/**
 * Processa contexto completo (limpeza + formatação)
 */
export function processarContexto(texto: string | null | undefined): string {
  const limpo = limparContexto(texto)
  return formatarMatematica(limpo)
}
