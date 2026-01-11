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

  // Remover referências a "Figura X" (as imagens já estão na galeria)
  processado = processado
    .replace(/\bFigura\s*\d+\b/gi, '')
    .replace(/\bImagem\s*\d+\b/gi, '')
    .replace(/\bQuadro\s*\d+\b/gi, '')
    .replace(/\bTabela\s*\d+\b/gi, '')
    .replace(/\bGráfico\s*\d+\b/gi, '')

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

  return processado.trim()
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
  imagem_principal?: string | null
  imagens_extras?: string[] | null
}): { valida: boolean; motivo?: string } {
  const contexto = questao.contexto || ''

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
