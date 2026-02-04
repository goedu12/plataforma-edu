/**
 * Utilitários para limpeza e formatação de texto das questões ENEM
 * Versão 3.1 - Limpeza completa de markdown, filtros de qualidade e sanitização XSS
 */

// Valores que devem ser tratados como vazio
const VALORES_INVALIDOS = ['nan', 'none', 'null', 'undefined', 'NaN', 'None', 'NULL', '']

// Tags HTML permitidas (sanitização XSS)
const TAGS_PERMITIDAS = new Set([
  'p', 'br', 'em', 'strong', 'span', 'div', 'img',
  'b', 'i', 'u', 'sub', 'sup', 'ul', 'ol', 'li',
  'small' // Para fontes/referências em tamanho menor (como na prova ENEM)
])

// Atributos permitidos por tag
const ATRIBUTOS_PERMITIDOS: Record<string, Set<string>> = {
  'img': new Set(['src', 'alt', 'class', 'loading', 'width', 'height']),
  'span': new Set(['class', 'style']),
  'div': new Set(['class', 'style']),
  'p': new Set(['class', 'style']),
}

/**
 * Sanitiza HTML removendo tags e atributos perigosos (proteção XSS)
 * Permite apenas tags seguras e remove event handlers
 */
export function sanitizarHTML(html: string): string {
  if (!html || typeof html !== 'string') return ''

  let sanitizado = html

  // 1. Remover scripts completamente
  sanitizado = sanitizado.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  sanitizado = sanitizado.replace(/<script[^>]*>/gi, '')
  sanitizado = sanitizado.replace(/<\/script>/gi, '')

  // 2. Remover styles inline perigosos
  sanitizado = sanitizado.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // 3. Remover event handlers (onclick, onerror, onload, etc.)
  sanitizado = sanitizado.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitizado = sanitizado.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '')

  // 4. Remover javascript: URLs
  sanitizado = sanitizado.replace(/javascript\s*:/gi, '')
  sanitizado = sanitizado.replace(/vbscript\s*:/gi, '')
  sanitizado = sanitizado.replace(/data\s*:\s*text\/html/gi, '')

  // 5. Remover tags não permitidas mas manter conteúdo
  sanitizado = sanitizado.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    const tagLower = tag.toLowerCase()
    if (TAGS_PERMITIDAS.has(tagLower)) {
      // Tag permitida - sanitizar atributos
      return sanitizarAtributos(match, tagLower)
    }
    // Tag não permitida - remover completamente
    return ''
  })

  // 6. Remover comentários HTML
  sanitizado = sanitizado.replace(/<!--[\s\S]*?-->/g, '')

  // 7. Remover CDATA
  sanitizado = sanitizado.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')

  return sanitizado
}

/**
 * Sanitiza atributos de uma tag HTML
 */
function sanitizarAtributos(tagCompleta: string, tagName: string): string {
  const atributosPermitidos = ATRIBUTOS_PERMITIDOS[tagName] || new Set(['class'])

  // Extrair nome da tag e verificar se é auto-fechada
  const isAutoClose = tagCompleta.endsWith('/>')
  const isFechamento = tagCompleta.startsWith('</')

  if (isFechamento) {
    return `</${tagName}>`
  }

  // Extrair atributos
  const atributoRegex = /([a-z][a-z0-9-]*)\s*=\s*["']([^"']*)["']/gi
  const atributosLimpos: string[] = []
  let match

  while ((match = atributoRegex.exec(tagCompleta)) !== null) {
    const [, attrName, attrValue] = match
    const attrNameLower = attrName.toLowerCase()

    // Só incluir atributos permitidos
    if (atributosPermitidos.has(attrNameLower)) {
      // Sanitizar valor do atributo
      let valorLimpo = attrValue
        .replace(/javascript\s*:/gi, '')
        .replace(/vbscript\s*:/gi, '')
        .replace(/on\w+\s*=/gi, '')

      // Para src de imagens, validar URL
      if (attrNameLower === 'src') {
        if (!valorLimpo.startsWith('http') && !valorLimpo.startsWith('data:image')) {
          continue // Pular src inválido
        }
      }

      // Para style, remover expressions e urls perigosas
      if (attrNameLower === 'style') {
        valorLimpo = valorLimpo
          .replace(/expression\s*\(/gi, '')
          .replace(/url\s*\([^)]*javascript/gi, '')
          .replace(/behavior\s*:/gi, '')
      }

      atributosLimpos.push(`${attrNameLower}="${valorLimpo}"`)
    }
  }

  // Reconstruir tag
  const atributosStr = atributosLimpos.length > 0 ? ' ' + atributosLimpos.join(' ') : ''
  return `<${tagName}${atributosStr}${isAutoClose ? ' /' : ''}>`
}

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
 * Extrai URLs de imagens do texto e retorna as URLs encontradas
 */
function extrairImagensDoTexto(texto: string): string[] {
  const imagensExtraidas: string[] = []

  // Padrão 1: !(url) - imagem markdown sem alt
  const padraoSemAlt = /!\(([^)]+)\)/g
  let match
  while ((match = padraoSemAlt.exec(texto)) !== null) {
    if (isValidImageUrl(match[1])) {
      imagensExtraidas.push(match[1].trim())
    }
  }

  // Padrão 2: ![alt](url) - imagem markdown com alt
  const padraoComAlt = /!\[[^\]]*\]\(([^)]+)\)/g
  while ((match = padraoComAlt.exec(texto)) !== null) {
    if (isValidImageUrl(match[1])) {
      imagensExtraidas.push(match[1].trim())
    }
  }

  // Padrão 3: URLs de imagem soltas no texto
  const padraoUrl = /\(?(https?:\/\/[^\s\)<>]+\.(png|jpg|jpeg|gif|webp|svg))\)?/gi
  while ((match = padraoUrl.exec(texto)) !== null) {
    if (isValidImageUrl(match[1])) {
      imagensExtraidas.push(match[1].trim())
    }
  }

  return [...new Set(imagensExtraidas)]
}

/**
 * Remove URLs de imagens do texto (para quando as imagens são exibidas separadamente)
 */
function removerImagensDoTexto(texto: string): string {
  let limpo = texto

  // Remove !(url)
  limpo = limpo.replace(/!\([^)]+\)/g, '')

  // Remove ![alt](url)
  limpo = limpo.replace(/!\[[^\]]*\]\([^)]+\)/g, '')

  // Remove URLs de imagem soltas (com ou sem parênteses)
  limpo = limpo.replace(/\(?(https?:\/\/[^\s\)<>]+\.(png|jpg|jpeg|gif|webp|svg))\)?/gi, '')

  // Limpar espaços extras deixados pela remoção
  limpo = limpo.replace(/\s{2,}/g, ' ')
  limpo = limpo.replace(/\n\s*\n\s*\n/g, '\n\n')

  return limpo.trim()
}

/**
 * Converte URLs de imagens em tags <img> clicáveis (usado quando NÃO há galeria separada)
 */
function converterImagensEmbutidas(texto: string): { html: string; imagensExtraidas: string[] } {
  const imagensExtraidas = extrairImagensDoTexto(texto)
  let html = texto

  // Padrão 1: !(url) - imagem markdown sem alt
  html = html.replace(/!\(([^)]+)\)/g, (_, url) => {
    if (isValidImageUrl(url)) {
      return `<div class="imagem-embutida"><img src="${url.trim()}" alt="Figura" class="imagem-contexto" loading="lazy" /></div>`
    }
    return ''
  })

  // Padrão 2: ![alt](url) - imagem markdown com alt
  html = html.replace(/!\[[^\]]*\]\(([^)]+)\)/g, (_, url) => {
    if (isValidImageUrl(url)) {
      return `<div class="imagem-embutida"><img src="${url.trim()}" alt="Figura" class="imagem-contexto" loading="lazy" /></div>`
    }
    return ''
  })

  // Padrão 3: URLs de imagem soltas no texto (entre parênteses ou não)
  html = html.replace(
    /\(?(https?:\/\/[^\s\)<>]+\.(png|jpg|jpeg|gif|webp|svg))\)?/gi,
    (match, url) => {
      if (isValidImageUrl(url)) {
        return `<div class="imagem-embutida"><img src="${url.trim()}" alt="Figura" class="imagem-contexto" loading="lazy" /></div>`
      }
      return ''
    }
  )

  return { html, imagensExtraidas }
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
 * @param texto - O texto a ser processado
 * @param opcoes - Opções de processamento
 * @param opcoes.removerImagens - Se true, remove imagens do texto (para quando são exibidas em galeria separada)
 */
export function processarContexto(
  texto: string | null | undefined,
  opcoes?: { removerImagens?: boolean }
): string {
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

  // Remover informações redundantes do início (já aparecem nos badges)
  // Remove linhas tipo "ENEM 2014", "Questão 162", "Matemática" no início
  processado = processado
    .replace(/^ENEM\s+\d{4}\s*/i, '')
    .replace(/^Questão\s+\d+\s*/i, '')
    .replace(/^(Matemática|Física|Química|Biologia|Português|Literatura|História|Geografia|Filosofia|Sociologia|Inglês|Espanhol)\s*/i, '')

  // Estilizar referências a figuras/tabelas como badges discretos
  // Para figuras: mostra abreviado pois a imagem aparece na galeria com legenda
  processado = processado
    .replace(/\b(Figura|figura)\s*(\d+)\b/g, '<span class="ref-figura">(Fig. $2)</span>')
    .replace(/\b(Imagem|imagem)\s*(\d+)\b/g, '<span class="ref-figura">(Img. $2)</span>')
    .replace(/\b(Quadro|quadro)\s*(\d+)\b/g, '<span class="ref-tabela">Quadro $2</span>')
    .replace(/\b(Tabela|tabela)\s*(\d+)\b/g, '<span class="ref-tabela">Tabela $2</span>')
    .replace(/\b(Gráfico|gráfico)\s*(\d+)\b/g, '<span class="ref-tabela">Gráfico $2</span>')

  // Tratar imagens: remover ou converter dependendo da opção
  if (opcoes?.removerImagens) {
    processado = removerImagensDoTexto(processado)
  } else {
    const { html: comImagens } = converterImagensEmbutidas(processado)
    processado = comImagens
  }

  // Formatar seções TEXTO I, II (antes de remover markdown)
  processado = formatarSecoes(processado)

  // Converter markdown para HTML
  // _texto_ para itálico (underscore)
  processado = processado.replace(/_([^_<]+)_/g, '<em>$1</em>')

  // **texto** para negrito
  processado = processado.replace(/\*\*([^*<]+)\*\*/g, '<strong>$1</strong>')

  // *texto* para itálico
  processado = processado.replace(/\*([^*<]+)\*/g, '<em>$1</em>')

  // Remove asteriscos e underscores restantes
  processado = processado.replace(/\*+/g, '')
  processado = processado.replace(/_+/g, ' ')

  // Formatar matemática
  processado = formatarMatematica(processado)

  // Converter quebras de linha em parágrafos para melhor espaçamento
  // Primeiro normaliza múltiplas quebras
  processado = processado.replace(/\n{3,}/g, '\n\n')

  // Quebras duplas viram parágrafos
  processado = processado.replace(/\n\n/g, '</p><p>')

  // Quebras simples viram <br>
  processado = processado.replace(/\n/g, '<br>')

  // Envolver em parágrafos se não estiver
  if (!processado.startsWith('<p>') && !processado.startsWith('<div')) {
    processado = '<p>' + processado + '</p>'
  }

  // Limpar espaços extras e elementos vazios
  processado = processado.replace(/\uFFFD/g, '')
  processado = processado.replace(/<br>\s*<br>\s*<br>/g, '<br>')
  processado = processado.replace(/<p>\s*<\/p>/g, '')
  processado = processado.replace(/<p>\s*<br>\s*<\/p>/g, '')
  processado = processado.replace(/\s{2,}/g, ' ')
  processado = processado.replace(/<br>\s*<br>/g, '<br>')

  // SEGURANÇA: Sanitizar HTML final para prevenir XSS
  processado = sanitizarHTML(processado)

  return processado.trim()
}

/**
 * Detecta padrões repetitivos no texto (ex: "ENEM2025ENEM2025ENEM2025...")
 * Retorna true se detectar padrão repetitivo suspeito
 */
function temPadraoRepetitivo(texto: string): boolean {
  if (!texto || texto.length < 20) return false

  // Verifica se há um padrão de 4-20 caracteres repetido 3+ vezes consecutivas
  const padraoRepetitivo = /(.{4,20})\1{2,}/i
  if (padraoRepetitivo.test(texto)) {
    return true
  }

  // Verifica padrões específicos conhecidos (ENEM + ano repetido)
  if (/ENEM\d{4}ENEM\d{4}/i.test(texto)) {
    return true
  }

  return false
}

/**
 * Verifica se uma questão tem qualidade suficiente para exibição
 * Retorna true se a questão pode ser exibida, false se deve ser ocultada
 * Critérios rigorosos para garantir boa experiência ao estudante
 */
export function questaoTemQualidade(questao: {
  contexto: string | null
  alternativa_a: string | null
  alternativa_b: string | null
  alternativa_c: string | null
  alternativa_d: string | null
  alternativa_e: string | null
  comando?: string | null
  imagem_principal?: string | null
  imagens_extras?: string[] | null
}): { valida: boolean; motivo?: string } {
  const contexto = questao.contexto || ''
  const comando = questao.comando || ''

  // 0. Verificar padrões repetitivos no comando ou contexto (dados mal formatados)
  if (temPadraoRepetitivo(comando) || temPadraoRepetitivo(contexto)) {
    return { valida: false, motivo: 'padrao_repetitivo' }
  }

  // 1. Contexto deve existir e ter conteúdo mínimo
  const contextoLimpo = limparTexto(contexto)
  if (!contextoLimpo || contextoLimpo.length < 30) {
    return { valida: false, motivo: 'contexto_vazio' }
  }

  // 2. Verificar se tem referência a figura/imagem sem ter imagem válida
  const temReferenciaFigura = /\b(Figura|Imagem|Quadro|Tabela|Gráfico)\s*\d+/i.test(contexto)
  const temImagemValida = isValidImageUrl(questao.imagem_principal) ||
    (questao.imagens_extras && questao.imagens_extras.some(img => isValidImageUrl(img))) ||
    /!\([^)]+\)/.test(contexto) || // !(url) no texto
    /!\[[^\]]*\]\([^)]+\)/.test(contexto) // ![alt](url) no texto

  if (temReferenciaFigura && !temImagemValida) {
    return { valida: false, motivo: 'referencia_figura_sem_imagem' }
  }

  // 3. Verificar problemas de formatação graves
  // URLs soltas no texto (não formatadas como imagem)
  const urlsSoltas = contexto.match(/https?:\/\/[^\s<>"]+/g) || []
  const urlsNaoImagem = urlsSoltas.filter(url => !isValidImageUrl(url))
  if (urlsNaoImagem.length > 2) {
    return { valida: false, motivo: 'muitas_urls_soltas' }
  }

  // 4. Verificar se tem muito markdown não processável
  const asteriscosExcessivos = (contexto.match(/\*{3,}/g) || []).length
  if (asteriscosExcessivos > 3) {
    return { valida: false, motivo: 'formatacao_quebrada' }
  }

  // 5. Verificar se contexto é JSON ou array malformado
  if (/^\s*[\[\{]/.test(contexto) && /[\]\}]\s*$/.test(contexto)) {
    return { valida: false, motivo: 'contexto_json' }
  }

  // 6. Verificar alternativas - pelo menos 4 devem ter texto válido
  const alternativas = [
    questao.alternativa_a,
    questao.alternativa_b,
    questao.alternativa_c,
    questao.alternativa_d,
    questao.alternativa_e,
  ]

  // 6a. Verificar padrões repetitivos nas alternativas
  for (const alt of alternativas) {
    if (alt && temPadraoRepetitivo(alt)) {
      return { valida: false, motivo: 'alternativa_padrao_repetitivo' }
    }
  }

  const alternativasValidas = alternativas.filter(alt => {
    if (!alt) return false
    const textoLimpo = limparTexto(alt)
    // Alternativa válida se tem texto de pelo menos 1 caractere
    // Aceita numerais romanos (I, II, III, IV, V) como válidos
    return textoLimpo && textoLimpo.length >= 1
  })

  if (alternativasValidas.length < 4) {
    return { valida: false, motivo: 'alternativas_insuficientes' }
  }

  // 7. Verificar se alternativas são apenas letras/números isolados sem sentido
  const alternativasComConteudo = alternativas.filter(alt => {
    if (!alt) return false
    const limpo = limparTexto(alt)
    // Deve ter mais que apenas um caractere ou ser numeral romano
    return limpo && (limpo.length > 2 || /^[IVX]+$/i.test(limpo) || /^\d+$/.test(limpo))
  })

  if (alternativasComConteudo.length < 3) {
    return { valida: false, motivo: 'alternativas_sem_conteudo' }
  }

  // 8. Verificar se tem TEXTO I e TEXTO II mas sem conteúdo entre eles
  if (/TEXTO\s+I/i.test(contexto) && /TEXTO\s+II/i.test(contexto)) {
    const partes = contexto.split(/TEXTO\s+I+/i)
    if (partes.length > 1) {
      const textoI = partes[1]?.split(/TEXTO\s+II/i)[0] || ''
      const textoII = partes[1]?.split(/TEXTO\s+II/i)[1] || ''
      if (limparTexto(textoI).length < 20 || limparTexto(textoII).length < 20) {
        return { valida: false, motivo: 'textos_vazios' }
      }
    }
  }

  return { valida: true }
}

/**
 * Extrai tags <small> do texto HTML e retorna o texto separado em duas partes:
 * - textoSemSmall: o texto original sem as tags <small>
 * - fontes: array com o conteúdo de cada tag <small>
 *
 * Usado para renderizar as fontes/referências em posição diferente (ex: após imagens)
 */
export function extrairFontesDoContexto(html: string): {
  textoSemSmall: string
  fontes: string[]
} {
  if (!html || typeof html !== 'string') {
    return { textoSemSmall: '', fontes: [] }
  }

  const fontes: string[] = []

  // 1. Primeiro, tentar extrair de tags <small>...</small>
  const smallRegex = /<small[^>]*>([\s\S]*?)<\/small>/gi
  let match
  while ((match = smallRegex.exec(html)) !== null) {
    const conteudo = match[1].trim()
    if (conteudo) {
      fontes.push(conteudo)
    }
  }

  // Remover todas as tags <small>...</small> do texto original
  let textoSemSmall = html.replace(/<small[^>]*>[\s\S]*?<\/small>/gi, '')

  // 2. Se não encontrou fontes em <small>, detectar automaticamente
  if (fontes.length === 0) {
    // Padrões de fonte ENEM (última linha que parece referência)
    const linhas = textoSemSmall.split(/\n|<br\s*\/?>/gi).map(l => l.trim()).filter(l => l)

    // Verificar as últimas linhas (pode ter múltiplas fontes)
    for (let i = linhas.length - 1; i >= Math.max(0, linhas.length - 3); i--) {
      const linha = linhas[i]

      // Padrões que indicam fonte/referência:
      const ehFonte =
        // Padrão: SOBRENOME, Nome. Título... (autor em maiúsculas)
        /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+,\s*[A-Z]/.test(linha) ||
        // Padrão: Disponível em: URL
        /Dispon[ií]vel\s+em:/i.test(linha) ||
        // Padrão: Acesso em: DATA
        /Acesso\s+em:/i.test(linha) ||
        // Padrão: (adaptado) ou (Adaptado)
        /\(adaptado\)/i.test(linha) ||
        // Padrão: Revista/Jornal Nome, n. XX
        /^(Revista|Jornal)\s+/i.test(linha) ||
        // Padrão: termina com ano entre parênteses ou ponto
        /,\s*\d{4}\.?\s*(\(adaptado\))?\.?\s*$/i.test(linha) ||
        // Padrão: URL no final
        /\.(com|org|gov|edu|br)\b/i.test(linha)

      if (ehFonte && linha.length > 15 && linha.length < 500) {
        fontes.unshift(linha) // Adiciona no início para manter ordem
        // Remover a linha do texto
        textoSemSmall = textoSemSmall.replace(linha, '').trim()
      }
    }
  }

  // Limpar espaços extras deixados pela remoção
  textoSemSmall = textoSemSmall
    .replace(/<br>\s*<br>\s*<br>/g, '<br>')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return { textoSemSmall, fontes }
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
