/**
 * Utilitários para limpeza e formatação de texto das questões ENEM
 * Versão 2.0 - Com suporte a imagens embutidas e múltiplos textos
 */

// Valores que devem ser tratados como vazio
const VALORES_INVALIDOS = ['nan', 'none', 'null', 'undefined', 'NaN', 'None', 'NULL']

/**
 * Valida se é uma URL de imagem válida
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false
  if (VALORES_INVALIDOS.includes(trimmed.toLowerCase())) return false
  return trimmed.startsWith('http') || trimmed.startsWith('data:image')
}

/**
 * Extrai URLs de imagens embutidas no texto
 * Padrões suportados:
 * - !(url)
 * - ![alt](url)
 * - (url.png) ou (url.jpg) etc
 */
export function extrairImagensDoTexto(texto: string): { textoLimpo: string; imagens: string[] } {
  if (!texto) return { textoLimpo: '', imagens: [] }

  const imagens: string[] = []
  let textoProcessado = texto

  // Padrão 1: !(url) - imagem markdown sem alt
  textoProcessado = textoProcessado.replace(/!\(([^)]+)\)/g, (_, url) => {
    if (isValidImageUrl(url)) {
      imagens.push(url.trim())
    }
    return ''
  })

  // Padrão 2: ![alt](url) - imagem markdown com alt
  textoProcessado = textoProcessado.replace(/!\[[^\]]*\]\(([^)]+)\)/g, (_, url) => {
    if (isValidImageUrl(url)) {
      imagens.push(url.trim())
    }
    return ''
  })

  // Padrão 3: URLs de imagem soltas (https://...png/jpg/gif/webp)
  textoProcessado = textoProcessado.replace(
    /\(?(https?:\/\/[^\s\)]+\.(png|jpg|jpeg|gif|webp|svg))\)?/gi,
    (match, url) => {
      if (isValidImageUrl(url)) {
        imagens.push(url.trim())
      }
      return ''
    }
  )

  return {
    textoLimpo: textoProcessado.replace(/\s{2,}/g, ' ').trim(),
    imagens: [...new Set(imagens)] // Remove duplicatas
  }
}

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
 * Formata seções de texto (TEXTO I, TEXTO II, etc.) com estilo visual
 */
function formatarSecoes(html: string): string {
  // Padrão para TEXTO I, TEXTO II, TEXTO 1, TEXTO 2, etc.
  const padraoTexto = /\b(TEXTO\s*[IVX\d]+)\b/gi

  html = html.replace(padraoTexto, (match) => {
    return `<div class="secao-texto-header">${match.toUpperCase()}</div>`
  })

  // Padrão para Texto I, Texto II (capitalizado)
  const padraoTextoCapitalizado = /\b(Texto\s*[IVX\d]+)\b/g
  html = html.replace(padraoTextoCapitalizado, (match) => {
    return `<div class="secao-texto-header">${match.toUpperCase()}</div>`
  })

  return html
}

/**
 * Converte URLs de imagens em tags <img> clicáveis
 */
function converterImagensEmbutidas(texto: string): { html: string; imagensExtraidas: string[] } {
  const imagensExtraidas: string[] = []
  let html = texto

  // Padrão 1: !(url) - imagem markdown sem alt
  html = html.replace(/!\(([^)]+)\)/g, (_, url) => {
    if (isValidImageUrl(url)) {
      imagensExtraidas.push(url.trim())
      return `<div class="imagem-embutida"><img src="${url.trim()}" alt="Imagem da questão" class="imagem-contexto" loading="lazy" /></div>`
    }
    return ''
  })

  // Padrão 2: ![alt](url) - imagem markdown com alt
  html = html.replace(/!\[[^\]]*\]\(([^)]+)\)/g, (_, url) => {
    if (isValidImageUrl(url)) {
      imagensExtraidas.push(url.trim())
      return `<div class="imagem-embutida"><img src="${url.trim()}" alt="Imagem da questão" class="imagem-contexto" loading="lazy" /></div>`
    }
    return ''
  })

  // Padrão 3: URLs de imagem soltas no texto
  html = html.replace(
    /\(?(https?:\/\/[^\s\)<]+\.(png|jpg|jpeg|gif|webp|svg))\)?/gi,
    (match, url) => {
      if (isValidImageUrl(url)) {
        imagensExtraidas.push(url.trim())
        return `<div class="imagem-embutida"><img src="${url.trim()}" alt="Imagem da questão" class="imagem-contexto" loading="lazy" /></div>`
      }
      return match
    }
  )

  return { html, imagensExtraidas: [...new Set(imagensExtraidas)] }
}

/**
 * Processa contexto completo para exibição com:
 * - Imagens embutidas convertidas em <img>
 * - Seções TEXTO I, TEXTO II formatadas
 * - Formatação matemática
 * - Limpeza de caracteres
 */
export function processarContexto(texto: string | null | undefined): string {
  if (!texto || typeof texto !== 'string') return ''

  let processado = texto.trim()

  // Verificar valores inválidos
  if (VALORES_INVALIDOS.includes(processado) || VALORES_INVALIDOS.includes(processado.toLowerCase())) {
    return ''
  }

  // Remover escapes literais
  processado = processado
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '')

  // Decodificar HTML entities
  processado = processado
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // Converter imagens embutidas em tags <img>
  const { html: comImagens } = converterImagensEmbutidas(processado)
  processado = comImagens

  // Formatar seções de texto (TEXTO I, TEXTO II)
  processado = formatarSecoes(processado)

  // Aplicar formatação matemática
  processado = formatarMatematica(processado)

  // Converter quebras de linha em <br>
  processado = processado.replace(/\n/g, '<br>')

  // Remover caractere de substituição Unicode
  processado = processado.replace(/\uFFFD/g, '')

  // Limpar espaços extras
  processado = processado.replace(/<br>\s*<br>\s*<br>/g, '<br><br>')

  return processado.trim()
}

/**
 * Processa contexto e retorna tanto o HTML quanto as imagens extraídas
 */
export function processarContextoComImagens(texto: string | null | undefined): {
  html: string
  imagensExtraidas: string[]
} {
  if (!texto || typeof texto !== 'string') {
    return { html: '', imagensExtraidas: [] }
  }

  let processado = texto.trim()

  if (VALORES_INVALIDOS.includes(processado) || VALORES_INVALIDOS.includes(processado.toLowerCase())) {
    return { html: '', imagensExtraidas: [] }
  }

  // Remover escapes literais
  processado = processado
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '')

  // Decodificar HTML entities
  processado = processado
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')

  // Converter imagens embutidas e extrair URLs
  const { html: comImagens, imagensExtraidas } = converterImagensEmbutidas(processado)
  processado = comImagens

  // Formatar seções de texto
  processado = formatarSecoes(processado)

  // Aplicar formatação matemática
  processado = formatarMatematica(processado)

  // Converter quebras de linha
  processado = processado.replace(/\n/g, '<br>')

  // Limpar
  processado = processado.replace(/\uFFFD/g, '')
  processado = processado.replace(/<br>\s*<br>\s*<br>/g, '<br><br>')

  return {
    html: processado.trim(),
    imagensExtraidas
  }
}
