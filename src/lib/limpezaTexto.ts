/**
 * Utilitários para limpeza e formatação de texto das questões ENEM
 * Versão 3.0 - Limpeza completa de markdown e filtros de qualidade
 */

// Valores que devem ser tratados como vazio
const VALORES_INVALIDOS = ['nan', 'none', 'null', 'undefined', 'NaN', 'None', 'NULL', '']

/**
 * Valida se é uma URL de imagem válida
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false
  if (VALORES_INVALIDOS.includes(trimmed.toLowerCase())) return false
  // Deve começar com http ou data:image
  if (!trimmed.startsWith('http') && !trimmed.startsWith('data:image')) return false
  // Rejeitar URLs muito curtas ou claramente inválidas
  if (trimmed.length < 10) return false
  return true
}

/**
 * Remove TODA formatação markdown do texto, deixando apenas texto limpo
 */
function removerMarkdown(texto: string): string {
  let limpo = texto

  // Remove negrito **texto** ou __texto__
  limpo = limpo.replace(/\*\*([^*]+)\*\*/g, '$1')
  limpo = limpo.replace(/__([^_]+)__/g, '$1')

  // Remove itálico *texto* ou _texto_
  limpo = limpo.replace(/\*([^*]+)\*/g, '$1')
  limpo = limpo.replace(/_([^_]+)_/g, '$1')

  // Remove asteriscos soltos
  limpo = limpo.replace(/\*+/g, '')

  // Remove underscores soltos no início/fim de palavras
  limpo = limpo.replace(/\s_|_\s/g, ' ')

  // Remove headers markdown (##, ###, etc)
  limpo = limpo.replace(/^#{1,6}\s*/gm, '')

  // Remove links markdown [texto](url) -> texto
  limpo = limpo.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Remove código inline `código`
  limpo = limpo.replace(/`([^`]+)`/g, '$1')

  // Remove blocos de código ```código```
  limpo = limpo.replace(/```[\s\S]*?```/g, '')

  // Remove blockquotes >
  limpo = limpo.replace(/^>\s*/gm, '')

  // Remove listas - ou *
  limpo = limpo.replace(/^[\-\*]\s+/gm, '• ')

  return limpo
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

  // Remover escapes literais
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

  // Remover TODA formatação markdown
  limpo = removerMarkdown(limpo)

  // Remover caracteres de controle e invisíveis
  limpo = limpo.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Remover caractere de substituição Unicode
  limpo = limpo.replace(/\uFFFD/g, '')

  // Normalizar espaços múltiplos
  limpo = limpo.replace(/\s+/g, ' ').trim()

  // Remover prefixos comuns de alternativas (a), A., a., A), etc.
  limpo = limpo.replace(/^[a-eA-E][\.\)\-\:]\s*/i, '')

  return limpo
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
 * Formata LaTeX básico para exibição
 */
export function formatarMatematica(texto: string): string {
  if (!texto) return ''

  let formatado = texto
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt\[(\d+)\]\{([^}]+)\}/g, '$1√($2)')

  formatado = formatado
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^\{(\d+)\}/g, '^$1')

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

  formatado = formatado.replace(/\$([^$]+)\$/g, '$1')
  formatado = formatado.replace(/\\[a-zA-Z]+/g, '')
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
 * Converte URLs de imagens em tags <img> clicáveis
 */
function converterImagensEmbutidas(texto: string): { html: string; imagensExtraidas: string[] } {
  const imagensExtraidas: string[] = []
  let html = texto

  // Padrão 1: !(url) - imagem markdown sem alt
  html = html.replace(/!\(([^)]+)\)/g, (_, url) => {
    if (isValidImageUrl(url)) {
      imagensExtraidas.push(url.trim())
      return `<div class="imagem-embutida"><img src="${url.trim()}" alt="Figura" class="imagem-contexto" loading="lazy" /></div>`
    }
    return ''
  })

  // Padrão 2: ![alt](url) - imagem markdown com alt
  html = html.replace(/!\[[^\]]*\]\(([^)]+)\)/g, (_, url) => {
    if (isValidImageUrl(url)) {
      imagensExtraidas.push(url.trim())
      return `<div class="imagem-embutida"><img src="${url.trim()}" alt="Figura" class="imagem-contexto" loading="lazy" /></div>`
    }
    return ''
  })

  // Padrão 3: URLs de imagem soltas no texto (entre parênteses ou não)
  html = html.replace(
    /\(?(https?:\/\/[^\s\)<>]+\.(png|jpg|jpeg|gif|webp|svg))\)?/gi,
    (match, url) => {
      if (isValidImageUrl(url)) {
        imagensExtraidas.push(url.trim())
        return `<div class="imagem-embutida"><img src="${url.trim()}" alt="Figura" class="imagem-contexto" loading="lazy" /></div>`
      }
      return ''
    }
  )

  return { html, imagensExtraidas: [...new Set(imagensExtraidas)] }
}

/**
 * Formata seções de texto (TEXTO I, TEXTO II, etc.) com estilo visual
 */
function formatarSecoes(html: string): string {
  // Remove asteriscos ao redor de TEXTO I, TEXTO II, etc.
  html = html.replace(/\*+\s*(TEXTO\s*[IVX\d]+)\s*\*+/gi, (_, texto) => {
    return `<div class="secao-texto-header">${texto.toUpperCase()}</div>`
  })

  // Padrão para TEXTO I, TEXTO II sem asteriscos
  html = html.replace(/(?<![a-zA-Z])(TEXTO\s*[IVX\d]+)(?![a-zA-Z])/gi, (match) => {
    // Evita substituir se já foi processado
    if (match.includes('class=')) return match
    return `<div class="secao-texto-header">${match.toUpperCase()}</div>`
  })

  return html
}

/**
 * Processa contexto completo para exibição
 */
export function processarContexto(texto: string | null | undefined): string {
  if (!texto || typeof texto !== 'string') return ''

  let processado = texto.trim()

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

  // Converter imagens embutidas ANTES de remover markdown
  const { html: comImagens } = converterImagensEmbutidas(processado)
  processado = comImagens

  // Formatar seções TEXTO I, II (antes de remover markdown)
  processado = formatarSecoes(processado)

  // Remover formatação markdown (negrito, itálico, etc.)
  // Mas preservar as tags HTML que já criamos
  processado = processado
    .replace(/\*\*([^*<]+)\*\*/g, '<strong>$1</strong>') // Converte **bold** em <strong>
    .replace(/\*([^*<]+)\*/g, '<em>$1</em>') // Converte *italic* em <em>
    .replace(/\*+/g, '') // Remove asteriscos restantes

  // Formatar matemática
  processado = formatarMatematica(processado)

  // Converter quebras de linha
  processado = processado.replace(/\n/g, '<br>')

  // Limpar
  processado = processado.replace(/\uFFFD/g, '')
  processado = processado.replace(/<br>\s*<br>\s*<br>/g, '<br><br>')
  processado = processado.replace(/\s{2,}/g, ' ')

  return processado.trim()
}

/**
 * Verifica se uma questão tem qualidade suficiente para exibição
 * Retorna true se a questão pode ser exibida, false se deve ser ocultada
 */
export function questaoTemQualidade(questao: {
  contexto: string | null
  alternativa_a: string | null
  alternativa_b: string | null
  alternativa_c: string | null
  alternativa_d: string | null
  alternativa_e: string | null
  imagem_principal?: string | null
}): { valida: boolean; motivo?: string } {
  // 1. Contexto deve existir e ter conteúdo mínimo
  const contextoLimpo = limparTexto(questao.contexto)
  if (!contextoLimpo || contextoLimpo.length < 20) {
    return { valida: false, motivo: 'contexto_vazio' }
  }

  // 2. Verificar alternativas - pelo menos 4 devem ter texto válido
  const alternativas = [
    questao.alternativa_a,
    questao.alternativa_b,
    questao.alternativa_c,
    questao.alternativa_d,
    questao.alternativa_e,
  ]

  const alternativasValidas = alternativas.filter(alt => {
    const textoLimpo = limparTexto(alt)
    // Alternativa válida se tem texto OU é apenas um numeral romano (I, II, III, IV, V)
    return textoLimpo && (textoLimpo.length >= 1)
  })

  if (alternativasValidas.length < 4) {
    return { valida: false, motivo: 'alternativas_insuficientes' }
  }

  // 3. Se tem imagem principal, verificar se é válida
  if (questao.imagem_principal && !isValidImageUrl(questao.imagem_principal)) {
    // Não invalida a questão, mas marca que a imagem é inválida
  }

  return { valida: true }
}

/**
 * Extrai todas as imagens válidas de uma questão
 */
export function extrairImagensQuestao(questao: {
  contexto?: string | null
  imagem_principal?: string | null
  imagens_extras?: string[] | null
  imagem_a?: string | null
  imagem_b?: string | null
  imagem_c?: string | null
  imagem_d?: string | null
  imagem_e?: string | null
}): string[] {
  const imagens: string[] = []

  // Imagem principal
  if (isValidImageUrl(questao.imagem_principal)) {
    imagens.push(questao.imagem_principal!)
  }

  // Imagens extras
  if (questao.imagens_extras) {
    for (const img of questao.imagens_extras) {
      if (isValidImageUrl(img)) {
        imagens.push(img)
      }
    }
  }

  // Imagens do contexto (embutidas no texto)
  if (questao.contexto) {
    const { imagensExtraidas } = converterImagensEmbutidas(questao.contexto)
    imagens.push(...imagensExtraidas)
  }

  // Imagens das alternativas
  const imagensAlternativas = [
    questao.imagem_a,
    questao.imagem_b,
    questao.imagem_c,
    questao.imagem_d,
    questao.imagem_e,
  ]

  for (const img of imagensAlternativas) {
    if (isValidImageUrl(img)) {
      imagens.push(img!)
    }
  }

  // Remove duplicatas
  return [...new Set(imagens)]
}
