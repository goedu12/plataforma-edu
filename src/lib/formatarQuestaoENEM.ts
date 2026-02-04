// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  FORMATADOR DE QUESTÕES ENEM - PADRÃO OFICIAL                               ║
// ║                                                                              ║
// ║  Este módulo fornece funções para formatar questões seguindo o padrão       ║
// ║  oficial do ENEM, com estrutura clara e responsiva.                         ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ESTRUTURA PADRÃO DE UMA QUESTÃO ENEM
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 1. **TÍTULO** (negrito) - Nome da obra, texto ou identificador
 *    Formato: <strong>Título da Obra</strong>
 *
 * 2. SUBTÍTULO (itálico) - Linha fina ou descrição breve
 *    Formato: <em>Subtítulo explicativo</em>
 *
 * 3. TEXTO-BASE - Conteúdo principal
 *    - Para múltiplos textos: <strong>TEXTO I</strong>, <strong>TEXTO II</strong>
 *    - Parágrafos separados por quebras de linha
 *
 * 4. [DESCRIÇÃO DE IMAGEM] (itálico entre colchetes)
 *    Formato: <em>[Descrição detalhada da imagem, gráfico ou figura]</em>
 *
 * 5. FONTE (tamanho menor)
 *    Formato: <small>AUTOR. Título. Local: Editora, Ano (adaptado).</small>
 *
 * 6. COMANDO (pergunta)
 *    Texto claro e objetivo antes das alternativas
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export interface QuestaoFormatada {
  titulo?: string
  subtitulo?: string
  textos: {
    identificador?: string  // "TEXTO I", "TEXTO II", etc.
    titulo?: string
    conteudo: string
  }[]
  imagensDescricoes: string[]
  fontes: string[]
  comando: string
}

/**
 * Formata o título de uma questão
 *
 * @example
 * formatarTitulo("De próprio punho")
 * // Retorna: <strong>De próprio punho</strong>
 */
export function formatarTitulo(titulo: string): string {
  if (!titulo) return ''
  return `<strong>${titulo.trim()}</strong>`
}

/**
 * Formata o subtítulo/linha fina
 *
 * @example
 * formatarSubtitulo("A escrita e suas tecnologias sofrem interessantes metamorfoses")
 * // Retorna: <em>A escrita e suas tecnologias sofrem interessantes metamorfoses</em>
 */
export function formatarSubtitulo(subtitulo: string): string {
  if (!subtitulo) return ''
  return `<em>${subtitulo.trim()}</em>`
}

/**
 * Formata identificador de texto múltiplo
 *
 * @example
 * formatarIdentificadorTexto("I")
 * // Retorna: <strong>TEXTO I</strong>
 */
export function formatarIdentificadorTexto(numero: string | number): string {
  const romano = typeof numero === 'number' ? converterParaRomano(numero) : numero
  return `<strong>TEXTO ${romano}</strong>`
}

/**
 * Formata descrição de imagem (para questões sem imagem real)
 *
 * @example
 * formatarDescricaoImagem("Gráfico de barras mostrando o consumo de energia por região")
 * // Retorna: <em>[Gráfico de barras mostrando o consumo de energia por região]</em>
 */
export function formatarDescricaoImagem(descricao: string): string {
  if (!descricao) return ''
  // Remove colchetes existentes para evitar duplicação
  const textoLimpo = descricao.replace(/^\[|\]$/g, '').trim()
  return `<em>[${textoLimpo}]</em>`
}

/**
 * Formata a fonte/referência bibliográfica
 *
 * @example
 * formatarFonte({
 *   autor: "RIBEIRO, A. E.",
 *   url: "https://rascunho.com.br",
 *   dataAcesso: "16 jan. 2024",
 *   adaptado: true
 * })
 * // Retorna: <small>RIBEIRO, A. E. Disponível em: https://rascunho.com.br. Acesso em: 16 jan. 2024 (adaptado).</small>
 */
export interface FonteOptions {
  autor?: string
  titulo?: string
  local?: string
  editora?: string
  ano?: string | number
  url?: string
  dataAcesso?: string
  adaptado?: boolean
}

export function formatarFonte(opcoes: FonteOptions): string {
  const partes: string[] = []

  // Autor (SOBRENOME, Nome)
  if (opcoes.autor) {
    partes.push(opcoes.autor)
  }

  // Título em itálico (para livros)
  if (opcoes.titulo) {
    partes.push(`<em>${opcoes.titulo}</em>.`)
  }

  // Local: Editora, Ano
  if (opcoes.local && opcoes.editora && opcoes.ano) {
    partes.push(`${opcoes.local}: ${opcoes.editora}, ${opcoes.ano}.`)
  } else if (opcoes.editora && opcoes.ano) {
    partes.push(`${opcoes.editora}, ${opcoes.ano}.`)
  }

  // URL
  if (opcoes.url) {
    partes.push(`Disponível em: ${opcoes.url}.`)
  }

  // Data de acesso
  if (opcoes.dataAcesso) {
    partes.push(`Acesso em: ${opcoes.dataAcesso}`)
  }

  // Adaptado
  if (opcoes.adaptado) {
    partes.push('(adaptado).')
  } else if (partes.length > 0 && !partes[partes.length - 1].endsWith('.')) {
    partes.push('.')
  }

  const texto = partes.join(' ').replace(/\.\s*\./g, '.').replace(/\s+/g, ' ').trim()
  return `<small>${texto}</small>`
}

/**
 * Formata uma fonte simples a partir de string
 */
export function formatarFonteSimples(fonte: string): string {
  if (!fonte) return ''
  // Remove tags <small> existentes
  const textoLimpo = fonte.replace(/<\/?small>/gi, '').trim()
  return `<small>${textoLimpo}</small>`
}

/**
 * Formata legenda de figura
 *
 * @example
 * formatarLegendaFigura({
 *   numero: 1,
 *   autor: "PAULA, D.",
 *   titulo: "Zeferina",
 *   tecnica: "Óleo sobre tela",
 *   dimensoes: "59 × 44 cm",
 *   local: "Masp, São Paulo",
 *   ano: 2018
 * })
 */
export interface LegendaFiguraOptions {
  numero: number
  autor?: string
  titulo: string
  tecnica?: string
  dimensoes?: string
  local?: string
  ano?: string | number
}

export function formatarLegendaFigura(opcoes: LegendaFiguraOptions): string {
  const partes: string[] = []

  // Número da figura
  partes.push(`<strong>Figura ${opcoes.numero}:</strong>`)

  // Autor
  if (opcoes.autor) {
    partes.push(opcoes.autor)
  }

  // Título em itálico
  partes.push(`<em>${opcoes.titulo}.</em>`)

  // Técnica e dimensões
  if (opcoes.tecnica) {
    let tecnicaCompleta = opcoes.tecnica
    if (opcoes.dimensoes) {
      tecnicaCompleta += `, ${opcoes.dimensoes}`
    }
    partes.push(tecnicaCompleta + '.')
  }

  // Local e ano
  if (opcoes.local && opcoes.ano) {
    partes.push(`${opcoes.local}, ${opcoes.ano}.`)
  } else if (opcoes.ano) {
    partes.push(`${opcoes.ano}.`)
  }

  return partes.join(' ')
}

/**
 * Monta o contexto completo de uma questão
 */
export function montarContexto(questao: {
  titulo?: string
  subtitulo?: string
  textos: { identificador?: string; titulo?: string; conteudo: string }[]
  imagensDescricoes?: string[]
  legendasFiguras?: LegendaFiguraOptions[]
  fontes: (string | FonteOptions)[]
}): string {
  const partes: string[] = []

  // 1. Título
  if (questao.titulo) {
    partes.push(formatarTitulo(questao.titulo))
    partes.push('')  // Linha em branco
  }

  // 2. Subtítulo
  if (questao.subtitulo) {
    partes.push(formatarSubtitulo(questao.subtitulo))
    partes.push('')
  }

  // 3. Textos
  for (const texto of questao.textos) {
    if (texto.identificador) {
      partes.push(formatarIdentificadorTexto(texto.identificador))
      partes.push('')
    }
    if (texto.titulo) {
      partes.push(formatarTitulo(texto.titulo))
      partes.push('')
    }
    partes.push(texto.conteudo)
    partes.push('')
  }

  // 4. Descrições de imagens
  if (questao.imagensDescricoes && questao.imagensDescricoes.length > 0) {
    for (const descricao of questao.imagensDescricoes) {
      partes.push(formatarDescricaoImagem(descricao))
      partes.push('')
    }
  }

  // 5. Legendas de figuras
  if (questao.legendasFiguras && questao.legendasFiguras.length > 0) {
    for (const legenda of questao.legendasFiguras) {
      partes.push(formatarLegendaFigura(legenda))
    }
    partes.push('')
  }

  // 6. Fontes
  for (const fonte of questao.fontes) {
    if (typeof fonte === 'string') {
      partes.push(formatarFonteSimples(fonte))
    } else {
      partes.push(formatarFonte(fonte))
    }
  }

  return partes.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Converte número para algarismo romano
 */
function converterParaRomano(num: number): string {
  const romanos: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ]
  let resultado = ''
  for (const [valor, simbolo] of romanos) {
    while (num >= valor) {
      resultado += simbolo
      num -= valor
    }
  }
  return resultado
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTILOS CSS RECOMENDADOS PARA IMAGENS RESPONSIVAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Classes CSS para imagens responsivas em questões ENEM
 * Use estas classes para garantir que as imagens sejam visíveis em várias telas
 */
export const ESTILOS_IMAGEM = {
  // Container da imagem
  container: `
    relative w-full my-4
    flex justify-center items-center
  `,

  // Imagem principal (única)
  imagemPrincipal: `
    max-w-full h-auto
    max-h-[50vh] sm:max-h-[60vh]
    object-contain
    rounded-lg
    cursor-pointer
    transition-transform hover:scale-[1.02]
  `,

  // Grid para múltiplas imagens
  gridMultiplas: `
    grid gap-4
    grid-cols-1 sm:grid-cols-2
    max-w-4xl mx-auto
  `,

  // Imagem em grid
  imagemGrid: `
    w-full h-auto
    max-h-[40vh]
    object-contain
    rounded-lg
    cursor-pointer
  `,

  // Botão de expandir
  botaoExpandir: `
    absolute top-2 right-2
    p-2 rounded-full
    bg-black/50 hover:bg-black/70
    text-white
    transition-colors
  `,

  // Modal de imagem expandida
  modal: `
    fixed inset-0 z-50
    flex items-center justify-center
    bg-black/90
    p-4
  `,

  imagemModal: `
    max-w-[95vw] max-h-[95vh]
    object-contain
  `,
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDAÇÃO DE FORMATAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidacaoResultado {
  valido: boolean
  erros: string[]
  avisos: string[]
}

/**
 * Valida se uma questão está formatada corretamente
 */
export function validarFormatacao(contexto: string, comando: string): ValidacaoResultado {
  const erros: string[] = []
  const avisos: string[] = []

  // Verificar se há fonte
  if (!/<small>/.test(contexto)) {
    erros.push('Questão não possui fonte (tag <small>)')
  }

  // Verificar se título está formatado
  if (contexto.startsWith('"') || contexto.startsWith("'")) {
    avisos.push('Título pode estar sem formatação. Use <strong> para títulos.')
  }

  // Verificar descrições de imagem
  const descricaoSemFormato = /\[[^\]]+\](?!<\/em>)/
  if (descricaoSemFormato.test(contexto)) {
    avisos.push('Descrição de imagem pode estar sem formatação. Use <em>[descrição]</em>')
  }

  // Verificar comando
  if (!comando || comando.trim().length < 10) {
    erros.push('Comando muito curto ou ausente')
  }

  // Verificar se comando termina com pontuação adequada
  if (comando && !/[?:.]$/.test(comando.trim())) {
    avisos.push('Comando não termina com pontuação (?, :, ou .)')
  }

  // Verificar quebras de linha excessivas
  if (/\n{4,}/.test(contexto)) {
    avisos.push('Muitas quebras de linha consecutivas')
  }

  return {
    valido: erros.length === 0,
    erros,
    avisos,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLOS DE USO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @example Questão com texto simples
 * ```typescript
 * const contexto = montarContexto({
 *   titulo: "De próprio punho",
 *   subtitulo: "A escrita e suas tecnologias sofrem interessantes metamorfoses",
 *   textos: [{
 *     conteudo: "Estranhei muito na primeira vez que escutei..."
 *   }],
 *   fontes: [{
 *     autor: "RIBEIRO, A. E.",
 *     url: "https://rascunho.com.br",
 *     dataAcesso: "16 jan. 2024",
 *     adaptado: true
 *   }]
 * })
 * ```
 *
 * @example Questão com múltiplos textos
 * ```typescript
 * const contexto = montarContexto({
 *   textos: [
 *     { identificador: "I", conteudo: "Primeiro texto..." },
 *     { identificador: "II", conteudo: "Segundo texto..." }
 *   ],
 *   fontes: ["Fonte do texto I", "Fonte do texto II"]
 * })
 * ```
 *
 * @example Questão com imagem
 * ```typescript
 * const contexto = montarContexto({
 *   titulo: "Retratos de Dalton Paula",
 *   textos: [{
 *     conteudo: "O retrato como gênero da pintura ocidental..."
 *   }],
 *   imagensDescricoes: ["Duas reproduções de pinturas lado a lado"],
 *   legendasFiguras: [
 *     { numero: 1, autor: "PAULA, D.", titulo: "Zeferina", tecnica: "Óleo sobre tela", dimensoes: "59 × 44 cm", local: "Masp, São Paulo", ano: 2018 }
 *   ],
 *   fontes: [{
 *     url: "www.masp.org.br",
 *     dataAcesso: "5 maio 2024",
 *     adaptado: true
 *   }]
 * })
 * ```
 */
