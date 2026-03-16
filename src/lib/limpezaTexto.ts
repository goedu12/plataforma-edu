/**
 * Utilitários para limpeza e formatação de texto de questões
 * Limpeza de markdown, sanitização XSS e processamento de conteúdo
 */

// Importar constantes do módulo centralizado
import {
  VALORES_INVALIDOS,
  URLS_PLACEHOLDER,
  TAGS_PERMITIDAS,
  ATRIBUTOS_PERMITIDOS
} from './texto/types'

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

      // Para src de imagens, validar URLs
      if (attrNameLower === 'src') {
        // Bloquear protocolos perigosos
        if (/^(javascript|vbscript):/i.test(valorLimpo)) {
          continue
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
 * Aceita URLs absolutas (http/https), data URIs e caminhos relativos do storage
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false
  if (VALORES_INVALIDOS.includes(trimmed.toLowerCase())) return false
  // Rejeitar URLs de placeholder/imagem quebrada conhecidas
  const lower = trimmed.toLowerCase()
  if (URLS_PLACEHOLDER.some(p => lower.includes(p))) return false
  // Aceitar URLs absolutas, data URIs e caminhos relativos (ex: enem/2024/img.jpeg)
  if (!trimmed.startsWith('http') && !trimmed.startsWith('data:image') && !trimmed.startsWith('//')) {
    // Caminho relativo: verificar se parece um caminho de arquivo válido (não um script/protocolo)
    if (/^(javascript|vbscript):/i.test(trimmed)) return false
    // Aceitar caminhos relativos que parecem ser arquivos de imagem ou paths do storage
    if (!/\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i.test(trimmed) && !trimmed.includes('/')) return false
  }
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
 * Formata fórmulas químicas comuns para Unicode (H2O → H₂O, CO2 → CO₂)
 * Aplicado no texto ANTES da conversão para HTML
 */
function formatarQuimica(texto: string): string {
  if (!texto) return ''

  const formulas: [RegExp, string][] = [
    // Ácidos
    [/\bH2SO4\b/g, 'H₂SO₄'], [/\bH3PO4\b/g, 'H₃PO₄'], [/\bHNO3\b/g, 'HNO₃'],
    [/\bH2CO3\b/g, 'H₂CO₃'], [/\bH2S\b/g, 'H₂S'], [/\bH2O2\b/g, 'H₂O₂'],
    // Bases
    [/\bCa\(OH\)2\b/g, 'Ca(OH)₂'], [/\bMg\(OH\)2\b/g, 'Mg(OH)₂'],
    [/\bAl\(OH\)3\b/g, 'Al(OH)₃'], [/\bNH4OH\b/g, 'NH₄OH'],
    // Óxidos e moléculas comuns
    [/\bCO2\b/g, 'CO₂'], [/\bH2O\b/g, 'H₂O'], [/\bSO2\b/g, 'SO₂'], [/\bSO3\b/g, 'SO₃'],
    [/\bNO2\b/g, 'NO₂'], [/\bN2O\b/g, 'N₂O'], [/\bFe2O3\b/g, 'Fe₂O₃'],
    [/\bAl2O3\b/g, 'Al₂O₃'], [/\bSiO2\b/g, 'SiO₂'],
    // Gases
    [/\bO2\b/g, 'O₂'], [/\bO3\b/g, 'O₃'], [/\bN2\b/g, 'N₂'], [/\bH2\b/g, 'H₂'],
    [/\bCl2\b/g, 'Cl₂'], [/\bNH3\b/g, 'NH₃'],
    // Orgânicos
    [/\bCH4\b/g, 'CH₄'], [/\bC2H5OH\b/g, 'C₂H₅OH'], [/\bC6H12O6\b/g, 'C₆H₁₂O₆'],
    [/\bCH3COOH\b/g, 'CH₃COOH'], [/\bC6H6\b/g, 'C₆H₆'],
    // Sais
    [/\bCaCO3\b/g, 'CaCO₃'], [/\bNa2CO3\b/g, 'Na₂CO₃'], [/\bKMnO4\b/g, 'KMnO₄'],
    // Setas de reação
    [/<=>/g, '⇌'], [/(?<!=)->/g, '→'],
  ]

  let resultado = texto
  for (const [padrao, sub] of formulas) {
    resultado = resultado.replace(padrao, sub)
  }

  // Notação científica: 5x10^12 → 5×10¹²
  const superMap: Record<string, string> = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻' }
  resultado = resultado.replace(/(\d)\s*[xX×]\s*10\^(-?\d+)/g, (_match, n, exp) => {
    return n + '×10' + exp.split('').map((c: string) => superMap[c] || c).join('')
  })

  return resultado
}

/**
 * Formata LaTeX básico para exibição
 */
export function formatarMatematica(texto: string): string {
  if (!texto) return ''

  // Primeiro aplicar formatação química
  let formatado = formatarQuimica(texto)

  formatado = formatado
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

  // Remover referências a imagens quebradas/placeholder
  processado = processado.replace(/!\[[^\]]*\]\([^)]*(?:broken-image|placeholder|no-image|not-available)[^)]*\)/gi, '')
  processado = processado.replace(/!\([^)]*(?:broken-image|placeholder|no-image|not-available)[^)]*\)/gi, '')
  processado = processado.replace(/<img[^>]*src=["'][^"']*(?:broken-image|placeholder|no-image|not-available)[^"']*["'][^>]*\/?>/gi, '')

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

  // ═══════════════════════════════════════════════════════════════════════════
  // FORMATAÇÃO DE PARÁGRAFOS E TRAVESSÕES - Padrão ENEM
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Normalizar travessões para em dash (—)
  processado = processado.replace(/—|–|--/g, '—')

  // 2. Normalizar aspas
  processado = processado.replace(/[""]/g, '"')
  processado = processado.replace(/['']/g, "'")

  // 3. Travessões de diálogo - cada fala em novo parágrafo
  // Travessão após pontuação final (.!?) = novo parágrafo
  processado = processado.replace(/([.!?])\s*—\s*/g, '$1\n\n— ')
  // Travessão após aspas = novo parágrafo
  processado = processado.replace(/([""'])\s*—\s*/g, '$1\n\n— ')
  // Travessão no meio do texto (após palavra) = novo parágrafo
  processado = processado.replace(/([a-záàâãéêíóôõúç])\s+—\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/gi, '$1\n\n— $2')

  // 4. Detecção inteligente de parágrafos
  // Lista de abreviações comuns que NÃO devem quebrar parágrafo
  const abreviacoes = /(?:Dr|Dra|Sr|Sra|Prof|Profa|Fig|Tab|Art|Inc|Ltda|S\.A|etc|vol|p|pp|ed|org|coord|n|nº|ex)\./gi
  const protecoes: string[] = []
  processado = processado.replace(abreviacoes, (match) => {
    protecoes.push(match)
    return `§§ABREV${protecoes.length - 1}§§`
  })

  // Ponto/exclamação/interrogação + 2+ espaços + maiúscula = novo parágrafo
  processado = processado.replace(/([.!?])\s{2,}([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])/g, '$1\n\n$2')

  // Restaurar abreviações
  processado = processado.replace(/§§ABREV(\d+)§§/g, (_, index) => protecoes[parseInt(index)] || '')

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSÃO DE QUEBRAS EM TAGS HTML
  // ═══════════════════════════════════════════════════════════════════════════

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
    // Extrair parágrafos de tags <p> (processarContexto converte \n\n em </p><p>)
    const paragrafos: { textoLimpo: string; htmlOriginal: string }[] = []
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
    let pMatch
    while ((pMatch = pRegex.exec(textoSemSmall)) !== null) {
      const textoLimpo = pMatch[1].replace(/<[^>]+>/g, '').trim()
      if (textoLimpo) {
        paragrafos.push({ textoLimpo, htmlOriginal: pMatch[0] })
      }
    }

    // Fallback: se não tem <p> tags, separar por \n ou <br>
    if (paragrafos.length === 0) {
      const linhas = textoSemSmall.split(/\n|<br\s*\/?>/gi).map(l => l.trim()).filter(l => l)
      for (const linha of linhas) {
        const textoLimpo = linha.replace(/<[^>]+>/g, '').trim()
        if (textoLimpo) {
          paragrafos.push({ textoLimpo, htmlOriginal: linha })
        }
      }
    }

    // Verificar os últimos parágrafos (pode ter múltiplas fontes)
    for (let i = paragrafos.length - 1; i >= Math.max(0, paragrafos.length - 3); i--) {
      const { textoLimpo, htmlOriginal } = paragrafos[i]

      // Padrões que indicam fonte/referência:
      const ehFonte =
        // Padrão: SOBRENOME, Nome. Título... (autor em maiúsculas)
        /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+,\s*[A-Z]/.test(textoLimpo) ||
        // Padrão: Disponível em: URL
        /Dispon[ií]vel\s+em:/i.test(textoLimpo) ||
        // Padrão: Acesso em: DATA
        /Acesso\s+em:/i.test(textoLimpo) ||
        // Padrão: (adaptado) ou (Adaptado)
        /\(adaptado\)/i.test(textoLimpo) ||
        // Padrão: Revista/Jornal Nome, n. XX
        /^(Revista|Jornal)\s+/i.test(textoLimpo) ||
        // Padrão: termina com ano entre parênteses ou ponto
        /,\s*\d{4}\.?\s*(\(adaptado\))?\.?\s*$/i.test(textoLimpo) ||
        // Padrão: URL no final
        /\.(com|org|gov|edu|br)\b/i.test(textoLimpo)

      if (ehFonte && textoLimpo.length > 15 && textoLimpo.length < 500) {
        fontes.unshift(textoLimpo) // Adiciona no início para manter ordem
        // Remover o parágrafo HTML completo do texto
        textoSemSmall = textoSemSmall.replace(htmlOriginal, '').trim()
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
 * Detecta o gênero textual do conteúdo para aplicar formatação adequada
 * Gêneros suportados:
 * - prosa: texto narrativo padrão com parágrafos
 * - poema: versos e estrofes
 * - citacao: texto com recuo (citação longa)
 * - cientifico: texto com fórmulas
 * - dialogo: falas com travessão
 * - lista: itens enumerados
 * - noticia: manchete + lide + corpo
 * - carta: vocativo + corpo + despedida
 * - anuncio: texto publicitário
 * - documento: documentos históricos, proclamações, decretos
 * - tirinha: quadrinhos com balões de fala
 * - artigo_lei: artigos jurídicos com incisos e parágrafos
 * - entrevista: formato pergunta/resposta
 * - letra_musica: letras de música com refrão
 * - infografico: dados estatísticos formatados
 */
export type GeneroTextual = 'prosa' | 'poema' | 'citacao' | 'cientifico' | 'dialogo' | 'lista' | 'noticia' | 'carta' | 'anuncio' | 'documento' | 'tirinha' | 'artigo_lei' | 'entrevista' | 'letra_musica' | 'infografico'

export function detectarGeneroTextual(texto: string): GeneroTextual {
  if (!texto || typeof texto !== 'string') return 'prosa'

  // Normalizar texto: converter HTML breaks para newlines e remover tags
  let textoNormalizado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .trim()

  const linhas = textoNormalizado.split(/\n/).map(l => l.trim()).filter(l => l.length > 0)

  // Sem linhas suficientes = prosa
  if (linhas.length < 2) return 'prosa'

  // ═══════════════════════════════════════════════════════════════════════
  // CARTA: vocativo (Prezado, Caro, Senhor, A quem), despedida (Atenciosamente, Abraços)
  // ═══════════════════════════════════════════════════════════════════════
  const primeiraLinha = linhas[0]
  const ultimasLinhas = linhas.slice(-3).join(' ')
  const vocativoCarta = /^(Prezad[oa]s?|Car[oa]s?|Senhor[a]?|Excelentíssim[oa]|Ilustríssim[oa]|A quem possa interessar)/i.test(primeiraLinha)
  const despedidaCarta = /(Atenciosamente|Cordialmente|Respeitosamente|Abraços?|Saudações|Grato|Obrigad[oa]|Att\.|Atenc\.|Sem mais)/i.test(ultimasLinhas)
  const temDataCarta = /^\d{1,2}\s*(de\s*)?\w+\s*(de\s*)?\d{2,4}|^\w+,?\s*\d{1,2}\s*(de\s*)?\w+/i.test(primeiraLinha)

  if ((vocativoCarta && despedidaCarta) || (vocativoCarta && temDataCarta)) {
    return 'carta'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // NOTÍCIA: manchete curta + lide informativo (quem, o quê, quando, onde)
  // ═══════════════════════════════════════════════════════════════════════
  const mancheteCurta = linhas[0].length < 100 && linhas[0].length > 10
  const temLide = linhas.length > 1 && linhas[1].length > 50
  const palavrasNoticia = /\b(ontem|hoje|amanhã|segundo|conforme|informou|declarou|anunciou|ocorreu|aconteceu|foi\s+(realizado|divulgado|anunciado))\b/i.test(textoNormalizado)
  const fontesJornalisticas = /\b(Folha|Estadão|Globo|Reuters|AFP|EFE|Agência|Jornal|Gazeta|G1|UOL)\b/i.test(textoNormalizado)

  if (mancheteCurta && temLide && (palavrasNoticia || fontesJornalisticas)) {
    return 'noticia'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANÚNCIO/PROPAGANDA: frases curtas imperativas, slogan, call-to-action
  // ═══════════════════════════════════════════════════════════════════════
  const frasesImperativas = linhas.filter(l => /^(Compre|Adquira|Venha|Aproveite|Garanta|Ligue|Acesse|Clique|Descubra|Experimente|Confira|Não\s+perca|Promoção|Oferta|Grátis|Desconto)/i.test(l))
  const temSlogan = linhas.some(l => l.length < 50 && /[!]$/.test(l))
  const temPreco = /R\$\s*\d|%\s*(off|desconto)|parcelas?|à vista/i.test(textoNormalizado)

  if ((frasesImperativas.length >= 1 && temSlogan) || (frasesImperativas.length >= 2) || (temPreco && temSlogan)) {
    return 'anuncio'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // POEMA: linhas curtas, sem pontuação final de prosa, estrutura de versos
  // ═══════════════════════════════════════════════════════════════════════
  const linhasCurtas = linhas.filter(l => l.length > 0 && l.length < 70)
  const proporcaoLinhasCurtas = linhasCurtas.length / linhas.length

  // Versos: não terminam com ponto, podem terminar com vírgula, reticências ou nada
  const linhasVerso = linhas.filter(l => {
    const t = l.trim()
    // Verso típico: curto e não termina com ponto (mas pode ter ! ou ?)
    return t.length > 0 && t.length < 80 && !/\.$/.test(t)
  })
  const proporcaoVersos = linhasVerso.length / linhas.length

  // Indicadores de poema: rimas, repetições, estrutura estrófica
  const temRepeticao = linhas.some((l, i) => i > 0 && linhas.slice(0, i).some(prev => prev === l))
  const mediaComprimento = linhas.reduce((sum, l) => sum + l.length, 0) / linhas.length

  // É poema se: maioria linhas curtas, terminam sem ponto, comprimento médio < 60
  if (linhas.length >= 3 && proporcaoLinhasCurtas > 0.55 && proporcaoVersos > 0.4 && mediaComprimento < 65) {
    return 'poema'
  }
  // Poema com repetição (refrão)
  if (linhas.length >= 4 && temRepeticao && proporcaoLinhasCurtas > 0.5) {
    return 'poema'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DIÁLOGO: linhas começando com travessão
  // ═══════════════════════════════════════════════════════════════════════
  const travessao = /^[\u2014\u2013\-–—]\s*/
  const linhasDialogo = linhas.filter(l => travessao.test(l))
  if (linhasDialogo.length >= 2 && linhasDialogo.length / linhas.length > 0.25) {
    return 'dialogo'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CITAÇÃO: começa com aspas ou tem indicadores acadêmicos
  // ═══════════════════════════════════════════════════════════════════════
  const textoInicio = textoNormalizado.substring(0, 200)
  if (/^[""\[\(«]/.test(textoInicio.trim()) || /apud|op\.\s*cit\.|ibidem|ibid\./i.test(textoNormalizado)) {
    return 'citacao'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LISTA: linhas começando com marcadores ou numeração
  // ═══════════════════════════════════════════════════════════════════════
  const linhasLista = linhas.filter(l => /^[\d]+[\.\)]\s|^[a-e][\.\)]\s|^[\-\*•]\s/i.test(l.trim()))
  if (linhasLista.length >= 3 && linhasLista.length / linhas.length > 0.5) {
    return 'lista'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CIENTÍFICO: fórmulas, símbolos matemáticos, notação científica
  // ═══════════════════════════════════════════════════════════════════════
  if (/\$.*\$|\\frac|\\sqrt|[°±≤≥→⇌∆Δ]|mol\/L|m\/s|km\/h|\d+\s*×\s*10|[A-Z][a-z]?[₂₃₄₅₆]/.test(textoNormalizado)) {
    return 'cientifico'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DOCUMENTO HISTÓRICO: proclamações, decretos, manifestos
  // ═══════════════════════════════════════════════════════════════════════
  const palavrasDocumento = /\b(Decreto|Lei\s+n[°º]|Artigo|Proclama|Declara|Constituição|Manifesto|Carta\s+de|Tratado|Edital|Alvará|Regimento)\b/i.test(textoNormalizado)
  const dataHistorica = /\b(século\s+[IVXLCDM]+|ano\s+de\s+\d{4}|\d{1,2}\s+de\s+\w+\s+de\s+\d{4})\b/i.test(textoNormalizado)
  const linguagemArcaica = /\b(vossa|majestade|senhorias|súditos|mercê|outrossim|destarte|doravante)\b/i.test(textoNormalizado)

  if ((palavrasDocumento && dataHistorica) || (palavrasDocumento && linguagemArcaica)) {
    return 'documento'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ARTIGO DE LEI: incisos (I, II, III), parágrafos (§), alíneas (a, b, c)
  // ═══════════════════════════════════════════════════════════════════════
  const temIncisos = /^[IVXLCDM]+\s*[-–—]\s*/m.test(textoNormalizado) || /\b[IVXLCDM]+\s*[-–—]\s*\w/m.test(textoNormalizado)
  const temParagrafos = /§\s*\d+[°º]?/i.test(textoNormalizado)
  const temAlineas = /\b[a-z]\)\s+\w/m.test(textoNormalizado)
  const temArtigo = /\bArt\.\s*\d+|Artigo\s+\d+/i.test(textoNormalizado)

  if ((temArtigo && (temIncisos || temParagrafos)) || (temIncisos && temParagrafos) || (temArtigo && temAlineas)) {
    return 'artigo_lei'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TIRINHA/QUADRINHO: balões de fala, onomatopeias
  // ═══════════════════════════════════════════════════════════════════════
  const temBalaoFala = /[\[\(]["']|["\'][\)\]]|quadrinho|tirinha|balão/i.test(textoNormalizado)
  const temOnomatopeia = /\b(POW|BAM|CRASH|SPLASH|BOOM|ZAP|WHAM|KABOOM|ARGH|UGH|HMM|HAHA|SNIFF|SOB)\b/i.test(textoNormalizado)
  const temPersonagemFala = /^\w+:\s*["']/m.test(textoNormalizado)

  if ((temBalaoFala && linhas.length <= 10) || (temOnomatopeia && linhas.length <= 10) || temPersonagemFala) {
    return 'tirinha'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ENTREVISTA: formato pergunta/resposta
  // ═══════════════════════════════════════════════════════════════════════
  const temPergunta = linhas.filter(l => /\?$/.test(l.trim())).length
  const temResposta = linhas.filter(l => /^R[:.]|^Resposta:/i.test(l.trim())).length
  const temEntrevistador = /\b(Entrevistador|Repórter|Jornalista|P[:.])\s*[-–—:]/i.test(textoNormalizado)
  const temEntrevistado = /\b(Entrevistado|E[:.])\s*[-–—:]/i.test(textoNormalizado)

  if ((temPergunta >= 2 && temResposta >= 1) || (temEntrevistador && temEntrevistado)) {
    return 'entrevista'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // LETRA DE MÚSICA: refrão repetido, estrutura de estrofes com repetição
  // ═══════════════════════════════════════════════════════════════════════
  const temRefrao = /\[?refrão\]?|bis\]?|\(2x\)|\(3x\)/i.test(textoNormalizado)
  const linhasRepetidas = linhas.filter((l, i) => linhas.slice(i + 1).includes(l)).length

  if (temRefrao || (linhasRepetidas >= 2 && proporcaoLinhasCurtas > 0.6)) {
    return 'letra_musica'
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INFOGRÁFICO: dados estatísticos, percentuais múltiplos, listas de dados
  // ═══════════════════════════════════════════════════════════════════════
  const temPercentuais = (textoNormalizado.match(/\d+[,.]?\d*\s*%/g) || []).length
  const temValoresNumericos = (textoNormalizado.match(/\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?/g) || []).length
  const temUnidadesDados = /\b(mil|milhão|milhões|bilhão|bilhões|habitantes|pessoas|toneladas|hectares)\b/i.test(textoNormalizado)

  if ((temPercentuais >= 3) || (temValoresNumericos >= 5 && temUnidadesDados)) {
    return 'infografico'
  }

  return 'prosa'
}

/**
 * Formata texto de acordo com o gênero textual detectado
 * Aplica recuos, quebras de linha e estilos apropriados
 */
export function formatarPorGenero(texto: string, genero?: GeneroTextual): string {
  if (!texto || typeof texto !== 'string') return ''

  const generoDetectado = genero || detectarGeneroTextual(texto)

  switch (generoDetectado) {
    case 'poema':
      return formatarPoema(texto)
    case 'dialogo':
      return formatarDialogo(texto)
    case 'citacao':
      return formatarCitacao(texto)
    case 'carta':
      return formatarCarta(texto)
    case 'noticia':
      return formatarNoticia(texto)
    case 'anuncio':
      return formatarAnuncio(texto)
    case 'documento':
      return formatarDocumento(texto)
    case 'artigo_lei':
      return formatarArtigoLei(texto)
    case 'tirinha':
      return formatarTirinha(texto)
    case 'entrevista':
      return formatarEntrevista(texto)
    case 'letra_musica':
      return formatarLetraMusica(texto)
    case 'infografico':
      return formatarInfografico(texto)
    default:
      return texto
  }
}

/**
 * Formata texto como poema preservando estrutura de versos e estrofes
 * Lida com texto que pode ter HTML ou texto puro
 */
function formatarPoema(texto: string): string {
  // Normalizar quebras de linha (converter <br> para \n)
  let formatado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')

  // Separar estrofes (linhas em branco)
  const estrofes = formatado.split(/\n\s*\n+/).filter(e => e.trim())

  // Formatar cada estrofe
  const estrofesFormatadas = estrofes.map(estrofe => {
    // Cada linha dentro da estrofe é um verso
    const versos = estrofe.split(/\n/).filter(v => v.trim())
    return `<div class="questao-estrofe">${versos.join('<br class="verso">')}</div>`
  })

  return estrofesFormatadas.join('')
}

/**
 * Formata texto como diálogo com travessões destacados
 * Lida com texto que pode ter HTML ou texto puro
 */
function formatarDialogo(texto: string): string {
  // Normalizar quebras de linha
  let formatado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')

  // Separar falas
  const linhas = formatado.split(/\n/).filter(l => l.trim())

  // Formatar cada fala com destaque no travessão
  const falasFormatadas = linhas.map(linha => {
    // Destacar travessão no início da fala
    const falaFormatada = linha.replace(/^([\u2014\u2013\-–—])\s*/, '<span class="fala-marcador">$1</span> ')
    return `<p class="fala">${falaFormatada}</p>`
  })

  return `<div class="questao-dialogo-wrapper">${falasFormatadas.join('')}</div>`
}

/**
 * Formata texto como citação longa (recuo de 4cm conforme ABNT)
 */
function formatarCitacao(texto: string): string {
  // Não duplicar wrapper se já existe
  if (texto.includes('questao-citacao')) {
    return texto
  }
  return `<blockquote class="questao-citacao">${texto}</blockquote>`
}

/**
 * Formata texto como carta (vocativo, corpo, despedida)
 */
function formatarCarta(texto: string): string {
  // Normalizar quebras de linha
  let formatado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')

  const linhas = formatado.split(/\n/).filter(l => l.trim())

  if (linhas.length < 2) return texto

  // Identificar partes da carta
  const partes: string[] = []

  // Data/Local (se houver)
  const primeiraLinha = linhas[0]
  let inicio = 0
  if (/^\d{1,2}\s*(de\s*)?\w+\s*(de\s*)?\d{2,4}|^\w+,?\s*\d{1,2}\s*(de\s*)?\w+/i.test(primeiraLinha)) {
    partes.push(`<div class="carta-data">${primeiraLinha}</div>`)
    inicio = 1
  }

  // Vocativo
  if (linhas[inicio] && /^(Prezad|Car[oa]|Senhor|Excelentíssim|Ilustríssim|A quem)/i.test(linhas[inicio])) {
    partes.push(`<div class="carta-vocativo">${linhas[inicio]}</div>`)
    inicio++
  }

  // Corpo
  const corpoLinhas: string[] = []
  let fim = linhas.length

  // Identificar despedida (últimas linhas)
  for (let i = linhas.length - 1; i >= inicio && i >= linhas.length - 3; i--) {
    if (/(Atenciosamente|Cordialmente|Respeitosamente|Abraços?|Saudações|Grato|Obrigad[oa]|Att\.|Atenc\.|Sem mais)/i.test(linhas[i])) {
      fim = i
      break
    }
  }

  // Corpo do texto
  for (let i = inicio; i < fim; i++) {
    corpoLinhas.push(`<p class="carta-paragrafo">${linhas[i]}</p>`)
  }
  if (corpoLinhas.length > 0) {
    partes.push(`<div class="carta-corpo">${corpoLinhas.join('')}</div>`)
  }

  // Despedida e assinatura
  if (fim < linhas.length) {
    const despedidaLinhas = linhas.slice(fim).map(l => `<p>${l}</p>`).join('')
    partes.push(`<div class="carta-despedida">${despedidaLinhas}</div>`)
  }

  return `<div class="questao-carta">${partes.join('')}</div>`
}

/**
 * Formata texto como notícia (manchete + lide + corpo)
 */
function formatarNoticia(texto: string): string {
  // Normalizar quebras de linha
  let formatado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')

  const linhas = formatado.split(/\n/).filter(l => l.trim())

  if (linhas.length < 2) return texto

  const partes: string[] = []

  // Manchete (primeira linha, geralmente curta e impactante)
  partes.push(`<h3 class="noticia-manchete">${linhas[0]}</h3>`)

  // Lide (segundo parágrafo - resumo da notícia)
  if (linhas.length > 1) {
    partes.push(`<p class="noticia-lide">${linhas[1]}</p>`)
  }

  // Corpo (demais parágrafos)
  if (linhas.length > 2) {
    const corpoLinhas = linhas.slice(2).map(l => `<p class="noticia-paragrafo">${l}</p>`).join('')
    partes.push(`<div class="noticia-corpo">${corpoLinhas}</div>`)
  }

  return `<article class="questao-noticia">${partes.join('')}</article>`
}

/**
 * Formata texto como anúncio/propaganda
 */
function formatarAnuncio(texto: string): string {
  // Normalizar quebras de linha
  let formatado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')

  const linhas = formatado.split(/\n/).filter(l => l.trim())

  if (linhas.length < 1) return texto

  const partes: string[] = []

  linhas.forEach(linha => {
    // Slogan (linha curta com exclamação)
    if (linha.length < 50 && /[!]$/.test(linha)) {
      partes.push(`<p class="anuncio-slogan">${linha}</p>`)
    }
    // Call-to-action (imperativo)
    else if (/^(Compre|Adquira|Venha|Aproveite|Garanta|Ligue|Acesse|Clique|Descubra|Experimente|Confira|Não\s+perca)/i.test(linha)) {
      partes.push(`<p class="anuncio-cta">${linha}</p>`)
    }
    // Preço/Oferta
    else if (/R\$\s*\d|%\s*(off|desconto)|parcelas?|à vista|Promoção|Oferta|Grátis|Desconto/i.test(linha)) {
      partes.push(`<p class="anuncio-preco">${linha}</p>`)
    }
    // Texto comum
    else {
      partes.push(`<p class="anuncio-texto">${linha}</p>`)
    }
  })

  return `<div class="questao-anuncio">${partes.join('')}</div>`
}

/**
 * Formata texto como documento histórico (proclamações, decretos, manifestos)
 */
function formatarDocumento(texto: string): string {
  // Normalizar quebras de linha
  let formatado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')

  const linhas = formatado.split(/\n/).filter(l => l.trim())

  if (linhas.length < 1) return texto

  const partes: string[] = []

  linhas.forEach((linha, index) => {
    // Título do documento (primeira linha curta ou em maiúsculas)
    if (index === 0 && (linha.length < 80 || linha === linha.toUpperCase())) {
      partes.push(`<h3 class="documento-titulo">${linha}</h3>`)
    }
    // Data histórica
    else if (/^\d{1,2}\s+de\s+\w+\s+de\s+\d{4}|^Anno\s+de\s+\d{4}|^Em\s+\d{1,2}/i.test(linha)) {
      partes.push(`<p class="documento-data">${linha}</p>`)
    }
    // Assinatura
    else if (/^(Assinado|Dado|Feito|Publicado|Promulgado)/i.test(linha) || index === linhas.length - 1 && linha.length < 50) {
      partes.push(`<p class="documento-assinatura">${linha}</p>`)
    }
    // Corpo do documento
    else {
      partes.push(`<p class="documento-paragrafo">${linha}</p>`)
    }
  })

  return `<article class="questao-documento">${partes.join('')}</article>`
}

/**
 * Formata texto como artigo de lei (com incisos, parágrafos, alíneas)
 */
function formatarArtigoLei(texto: string): string {
  // Normalizar quebras de linha
  let formatado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')

  const linhas = formatado.split(/\n/).filter(l => l.trim())

  if (linhas.length < 1) return texto

  const partes: string[] = []

  linhas.forEach(linha => {
    // Artigo principal
    if (/^Art\.\s*\d+|^Artigo\s+\d+/i.test(linha)) {
      partes.push(`<p class="lei-artigo">${linha}</p>`)
    }
    // Parágrafo (§)
    else if (/^§\s*\d+[°º]?/i.test(linha)) {
      partes.push(`<p class="lei-paragrafo">${linha}</p>`)
    }
    // Inciso (I, II, III)
    else if (/^[IVXLCDM]+\s*[-–—]/i.test(linha)) {
      partes.push(`<p class="lei-inciso">${linha}</p>`)
    }
    // Alínea (a, b, c)
    else if (/^[a-z]\)\s+/i.test(linha)) {
      partes.push(`<p class="lei-alinea">${linha}</p>`)
    }
    // Parágrafo único
    else if (/^Parágrafo\s+único/i.test(linha)) {
      partes.push(`<p class="lei-paragrafo-unico">${linha}</p>`)
    }
    // Caput ou texto normal
    else {
      partes.push(`<p class="lei-texto">${linha}</p>`)
    }
  })

  return `<div class="questao-artigo-lei">${partes.join('')}</div>`
}

/**
 * Formata texto como tirinha/quadrinho
 */
function formatarTirinha(texto: string): string {
  // Normalizar quebras de linha
  let formatado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')

  const linhas = formatado.split(/\n/).filter(l => l.trim())

  if (linhas.length < 1) return texto

  const partes: string[] = []

  linhas.forEach(linha => {
    // Fala de personagem (Personagem: "fala")
    if (/^\w+:\s*["']/.test(linha)) {
      const match = linha.match(/^(\w+):\s*["'](.+)["']?$/)
      if (match) {
        partes.push(`<div class="tirinha-fala"><span class="tirinha-personagem">${match[1]}:</span> <span class="tirinha-balao">"${match[2]}"</span></div>`)
      } else {
        partes.push(`<div class="tirinha-fala">${linha}</div>`)
      }
    }
    // Onomatopeia (em maiúsculas)
    else if (/^[A-Z]{2,}!*$/.test(linha.trim())) {
      partes.push(`<p class="tirinha-onomatopeia">${linha}</p>`)
    }
    // Descrição de cena
    else if (/^\[.+\]$/.test(linha) || /^\(.+\)$/.test(linha)) {
      partes.push(`<p class="tirinha-descricao">${linha}</p>`)
    }
    // Texto normal
    else {
      partes.push(`<p class="tirinha-texto">${linha}</p>`)
    }
  })

  return `<div class="questao-tirinha">${partes.join('')}</div>`
}

/**
 * Formata texto como entrevista (pergunta/resposta)
 */
function formatarEntrevista(texto: string): string {
  // Normalizar quebras de linha
  let formatado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')

  const linhas = formatado.split(/\n/).filter(l => l.trim())

  if (linhas.length < 1) return texto

  const partes: string[] = []

  linhas.forEach(linha => {
    // Pergunta
    if (/\?$/.test(linha.trim()) || /^(P[:.]|Pergunta:|Entrevistador:|Repórter:)/i.test(linha)) {
      partes.push(`<p class="entrevista-pergunta">${linha}</p>`)
    }
    // Resposta
    else if (/^(R[:.]|Resposta:|Entrevistado:|E[:.])/i.test(linha)) {
      partes.push(`<p class="entrevista-resposta">${linha}</p>`)
    }
    // Texto normal
    else {
      partes.push(`<p class="entrevista-texto">${linha}</p>`)
    }
  })

  return `<div class="questao-entrevista">${partes.join('')}</div>`
}

/**
 * Formata texto como letra de música (com estrofes e refrão)
 */
function formatarLetraMusica(texto: string): string {
  // Normalizar quebras de linha
  let formatado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')

  // Separar estrofes (linhas em branco)
  const estrofes = formatado.split(/\n\s*\n+/).filter(e => e.trim())

  const estrofesFormatadas = estrofes.map(estrofe => {
    const versos = estrofe.split(/\n/).filter(v => v.trim())

    // Detectar se é refrão
    const ehRefrao = /\[?refrão\]?|bis\]?|\(2x\)|\(3x\)/i.test(estrofe)
    const classe = ehRefrao ? 'musica-refrao' : 'musica-estrofe'

    return `<div class="${classe}">${versos.map(v => `<p class="musica-verso">${v}</p>`).join('')}</div>`
  })

  return `<div class="questao-letra-musica">${estrofesFormatadas.join('')}</div>`
}

/**
 * Formata texto como infográfico (dados estatísticos)
 */
function formatarInfografico(texto: string): string {
  // Normalizar quebras de linha
  let formatado = texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')

  const linhas = formatado.split(/\n/).filter(l => l.trim())

  if (linhas.length < 1) return texto

  const partes: string[] = []

  linhas.forEach(linha => {
    // Título/Categoria
    if (linha.length < 50 && !/\d/.test(linha)) {
      partes.push(`<h4 class="infografico-titulo">${linha}</h4>`)
    }
    // Dado com percentual
    else if (/\d+[,.]?\d*\s*%/.test(linha)) {
      partes.push(`<p class="infografico-percentual">${linha}</p>`)
    }
    // Dado numérico
    else if (/\d{1,3}(?:[.,]\d{3})*/.test(linha)) {
      partes.push(`<p class="infografico-numero">${linha}</p>`)
    }
    // Legenda/Fonte
    else if (/^(Fonte:|Dados:|Pesquisa:)/i.test(linha)) {
      partes.push(`<p class="infografico-fonte">${linha}</p>`)
    }
    // Texto normal
    else {
      partes.push(`<p class="infografico-texto">${linha}</p>`)
    }
  })

  return `<div class="questao-infografico">${partes.join('')}</div>`
}

/**
 * Separa corpo do texto e fonte/referência de forma robusta
 * A fonte deve ficar UMA LINHA ABAIXO do texto principal
 */
export function separarTextoEFonte(texto: string): {
  corpo: string
  fonte: string | null
} {
  if (!texto || typeof texto !== 'string') {
    return { corpo: '', fonte: null }
  }

  // Padrões de fonte/referência (ordem de prioridade)
  const padroesFonte = [
    // 1. Tags <small> explícitas
    /<small[^>]*>([\s\S]+?)<\/small>\s*$/i,
    // 2. Span com classe questao-fonte
    /<span[^>]*class=["']questao-fonte["'][^>]*>([\s\S]+?)<\/span>\s*$/i,
    // 3. ABNT: SOBRENOME, Nome. Título. Local: Editora, ano.
    /\n([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s,]+\.\s+[^.]+\.[^.]+,\s*\d{4}[^)]*\.?\s*)$/,
    // 4. Adaptado de...
    /\n(\(?[Aa]daptado de?\)?[^)]*\.?\s*)$/,
    // 5. Disponível em: URL
    /\n(Dispon[ií]vel\s+em:[^\n]+)$/i,
    // 6. Revista/Jornal, data
    /\n((Revista|Jornal|Folha|O Globo|Estadão|Veja|Época)[^,\n]*,\s*\d+[^\n]*)$/i,
    // 7. In: TÍTULO
    /\n(In:\s+[^\n]+)$/i,
    // 8. Fonte: descrição
    /\n?\(?(Fonte:\s*[^)\n]+)\)?\s*$/i,
    // 9. Texto entre parênteses no final com ano
    /\n?\(([^)]+,\s*\d{4}[^)]*)\)\s*$/,
  ]

  let corpo = texto.trim()
  let fonte: string | null = null

  for (const padrao of padroesFonte) {
    const match = corpo.match(padrao)
    if (match && match[1]) {
      fonte = match[1].trim()
      corpo = corpo.replace(padrao, '').trim()
      break
    }
  }

  // Limpar corpo
  corpo = corpo
    .replace(/<br>\s*$/, '')
    .replace(/\n\s*$/, '')
    .trim()

  return { corpo, fonte }
}

/**
 * Extrai título do texto-base de uma questão.
 * Detecta padrões comuns de títulos:
 * - Primeira linha curta (até 120 chars) sem ponto final
 * - Títulos entre aspas
 * - Títulos em negrito/itálico
 * Retorna o título separado do corpo do texto.
 */
export function extrairTituloDoTexto(texto: string): {
  titulo: string | null
  corpo: string
} {
  if (!texto || typeof texto !== 'string') {
    return { titulo: null, corpo: '' }
  }

  const textoTrimmed = texto.trim()

  // Extrair parágrafos de tags <p> (processarContexto converte \n\n em </p><p>)
  const paragrafos: { textoLimpo: string; htmlOriginal: string; htmlConteudo: string }[] = []
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let pMatch
  while ((pMatch = pRegex.exec(textoTrimmed)) !== null) {
    const textoLimpo = pMatch[1].replace(/<[^>]+>/g, '').trim()
    if (textoLimpo) {
      paragrafos.push({ textoLimpo, htmlOriginal: pMatch[0], htmlConteudo: pMatch[1].trim() })
    }
  }

  // Fallback: se não tem <p> tags, separar por \n ou <br>
  if (paragrafos.length === 0) {
    const linhas = textoTrimmed.split(/\n|<br\s*\/?>/gi).map(l => l.trim()).filter(l => l)
    for (const linha of linhas) {
      const textoLimpo = linha.replace(/<[^>]+>/g, '').trim()
      if (textoLimpo) {
        paragrafos.push({ textoLimpo, htmlOriginal: linha, htmlConteudo: linha })
      }
    }
  }

  if (paragrafos.length < 2) {
    return { titulo: null, corpo: textoTrimmed }
  }

  const primeiraLinhaLimpa = paragrafos[0].textoLimpo
  const primeiraLinhaHtml = paragrafos[0].htmlConteudo

  // Padrões de título (restritivos para evitar falsos positivos com enunciados):
  const ehTitulo =
    // Título entre aspas (linha inteira entre aspas)
    /^["'\u201C\u201D\u00AB][^"'\u201C\u201D\u00BB]+["'\u201C\u201D\u00BB]$/.test(primeiraLinhaLimpa) ||
    // Título em negrito (já processado como <strong> ou **)
    /^<strong>.*<\/strong>$/i.test(primeiraLinhaHtml) ||
    /^\*\*[^*]+\*\*$/.test(primeiraLinhaLimpa) ||
    // Padrão "TEXTO I", "TEXTO II" etc
    /^TEXTO\s+[IVX\d]+$/i.test(primeiraLinhaLimpa) ||
    // Linha curta (≤60 chars) que NÃO parece frase normal do enunciado
    (primeiraLinhaLimpa.length <= 60 && primeiraLinhaLimpa.length >= 3 &&
     !/[.;:,]$/.test(primeiraLinhaLimpa) &&
     // Rejeitar se contém verbos/palavras comuns de frases em português
     !/ (que |tem |são |foi |pode |é |está |era |será |deve |cada |todo |toda |como |mais |muito |por |para |com |sobre |entre |sem |quando |onde |qual |quais )/i.test(' ' + primeiraLinhaLimpa + ' ') &&
     // Rejeitar frases que começam com artigos/pronomes comuns em enunciados
     !/^(Cada|Todo|Toda|Um |Uma |Os |As |No |Na |Nos |Nas |Em |Para |Com |Por |Segundo |De acordo|Conforme|Considere|Observe|Sabendo|Sobre )/i.test(primeiraLinhaLimpa) &&
     (
       /^["'\u201C\u201D\u00AB]/.test(primeiraLinhaLimpa) ||
       // ALL CAPS (ex: "O CORTIÇO", "MEMORIAL DE AIRES")
       /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(primeiraLinhaLimpa) ||
       // Title Case: palavras capitalizadas (ex: "Memórias Póstumas de Brás Cubas")
       /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(\s+(de|do|da|dos|das|e|ou|em|com|a|o|à|ao)\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]?[a-záàâãéêíóôõúç]*|\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)*$/.test(primeiraLinhaLimpa)
     ))

  if (!ehTitulo) {
    return { titulo: null, corpo: textoTrimmed }
  }

  // A segunda linha deve ter conteúdo substancial (indica que a primeira é realmente um título)
  const restoTexto = textoTrimmed.replace(paragrafos[0].htmlOriginal, '').trim()
  const restoLimpo = restoTexto.replace(/<[^>]+>/g, '').trim()
  if (restoLimpo.length < 30) {
    return { titulo: null, corpo: textoTrimmed }
  }

  return {
    titulo: primeiraLinhaLimpa,
    corpo: restoTexto
  }
}

/**
 * Destaca automaticamente o título no início do texto.
 * Se detectar um título (linha curta sem ponto, título entre aspas, etc.),
 * envolve em <h3> para formatação especial.
 * Usado para dar destaque visual ao título como na prova original ENEM.
 */
export function destacarTituloContexto(texto: string): string {
  if (!texto || typeof texto !== 'string') {
    return ''
  }

  const { titulo, corpo } = extrairTituloDoTexto(texto)

  if (!titulo) {
    return texto
  }

  // Envolver título em h3 para destaque visual
  // O handler de h3 no ReactMarkdown vai estilizar corretamente
  const tituloFormatado = `<h3 class="questao-titulo">${titulo}</h3>`

  return `${tituloFormatado}\n\n${corpo}`
}

/**
 * Separa texto que contém múltiplos trechos (TEXTO I, TEXTO II, etc.)
 * Retorna um array de blocos, cada um com título opcional e conteúdo.
 * Se o texto não tem múltiplos blocos, retorna um único bloco sem título.
 */
export function separarMultiplosTextos(texto: string): {
  titulo: string | null
  conteudo: string
}[] {
  if (!texto || typeof texto !== 'string') {
    return [{ titulo: null, conteudo: '' }]
  }

  // Padrões que indicam múltiplos textos/trechos
  const padraoTexto = /(?:^|\n|<br\s*\/?>)\s*(TEXTO\s+[IVX\d]+|Texto\s+[IVX\d]+|TRECHO\s+[IVX\d]+|Trecho\s+[IVX\d]+|FRAGMENTO\s+[IVX\d]+|Fragmento\s+[IVX\d]+)\s*(?:\n|<br\s*\/?>)/gi

  const matches: { index: number; titulo: string }[] = []
  let match: RegExpExecArray | null

  while ((match = padraoTexto.exec(texto)) !== null) {
    matches.push({
      index: match.index,
      titulo: match[1].trim()
    })
  }

  // Se não há múltiplos textos, retornar como um bloco único
  if (matches.length < 2) {
    return [{ titulo: null, conteudo: texto }]
  }

  // Separar os blocos
  const blocos: { titulo: string | null; conteudo: string }[] = []

  // Conteúdo antes do primeiro texto (se houver)
  const antesDosPrimeiro = texto.substring(0, matches[0].index).trim()
  if (antesDosPrimeiro) {
    blocos.push({ titulo: null, conteudo: antesDosPrimeiro })
  }

  // Cada bloco de texto
  for (let i = 0; i < matches.length; i++) {
    const inicio = matches[i].index
    const fim = i < matches.length - 1 ? matches[i + 1].index : texto.length

    let conteudo = texto.substring(inicio, fim)
    // Remover o marcador do título do conteúdo
    conteudo = conteudo.replace(new RegExp(`^\\s*(\\n|<br\\s*\\/?>)?\\s*${matches[i].titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(\\n|<br\\s*\\/?>)?`, 'i'), '').trim()

    blocos.push({
      titulo: matches[i].titulo,
      conteudo: conteudo
    })
  }

  return blocos
}

/**
 * Extrai URLs de imagens embutidas em texto (inline)
 * Retorna as URLs encontradas e o texto limpo (sem as URLs)
 */
export function extrairImagensInline(texto: string): {
  imagens: string[]
  textoLimpo: string
} {
  if (!texto || typeof texto !== 'string') {
    return { imagens: [], textoLimpo: '' }
  }

  const imagens: string[] = []
  let textoLimpo = texto

  // Padrão: URLs de imagem diretas no texto
  const imgUrlRegex = /https?:\/\/[^\s<>"']+\.(png|jpg|jpeg|gif|webp|svg)(\?[^\s<>"']*)?/gi
  let urlMatch: RegExpExecArray | null

  while ((urlMatch = imgUrlRegex.exec(texto)) !== null) {
    const url = urlMatch[0]
    if (isValidImageUrl(url) && !imagens.includes(url)) {
      imagens.push(url)
    }
  }

  // Padrão: Tags <img> no texto
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  while ((urlMatch = imgTagRegex.exec(texto)) !== null) {
    const url = urlMatch[1]
    if (isValidImageUrl(url) && !imagens.includes(url)) {
      imagens.push(url)
    }
    // Remover a tag <img> do texto
    textoLimpo = textoLimpo.replace(urlMatch[0], '')
  }

  // Remover URLs de imagem soltas do texto
  for (const img of imagens) {
    textoLimpo = textoLimpo.replace(img, '')
  }

  // Limpar espaços extras
  textoLimpo = textoLimpo.replace(/\n\s*\n\s*\n/g, '\n\n').trim()

  return { imagens, textoLimpo }
}

