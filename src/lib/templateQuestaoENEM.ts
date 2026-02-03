// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE DE QUESTÕES ENEM
// Sistema de parsing e estruturação de questões para apresentação organizada
// ═══════════════════════════════════════════════════════════════════════════════

export interface QuestaoEstruturada {
  // Identificação
  numero: number
  ano: number
  area: string
  subarea?: string

  // Conteúdo estruturado do contexto
  titulo?: string                    // Título do texto/obra (se houver)
  subtitulo?: string                 // Subtítulo ou linha fina
  textos: TextoEstruturado[]         // Textos do contexto (pode ter TEXTO I, II, etc.)
  imagensDescricoes: DescricaoImagem[] // Descrições de imagens no texto
  fontes: string[]                   // Fontes/referências bibliográficas

  // Comando (pergunta)
  comando: string

  // Alternativas
  alternativas: AlternativaEstruturada[]

  // Resposta
  respostaCorreta: 'A' | 'B' | 'C' | 'D' | 'E'

  // Imagens
  imagemPrincipal?: string
  imagensExtras?: string[]

  // Metadados
  temLatex: boolean
  temTabela: boolean
  temImagem: boolean
  tipoQuestao: TipoQuestao
}

export interface TextoEstruturado {
  identificador?: string  // "TEXTO I", "TEXTO II", etc.
  titulo?: string         // Título do texto específico
  conteudo: string        // Corpo do texto
  tipo: 'prosa' | 'poesia' | 'dialogo' | 'lei' | 'tabela' | 'infografico'
}

export interface DescricaoImagem {
  descricao: string
  figura?: string  // "Figura 1", "Figura 2", etc.
  legenda?: string
  fonte?: string
}

export interface AlternativaEstruturada {
  letra: 'A' | 'B' | 'C' | 'D' | 'E'
  texto: string
  imagem?: string
  temLatex: boolean
}

export type TipoQuestao =
  | 'interpretacao_texto'
  | 'analise_imagem'
  | 'calculo_matematico'
  | 'analise_grafico'
  | 'comparacao_textos'
  | 'lingua_estrangeira'
  | 'misto'

// ═══════════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL: Estruturar questão ENEM
// ═══════════════════════════════════════════════════════════════════════════════

export function estruturarQuestaoENEM(questao: {
  numero_questao: number
  ano_prova: number
  area: string
  subarea?: string
  contexto: string
  comando: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  resposta_correta: string
  imagem_principal?: string
  imagens_extras?: string[]
  imagem_a?: string
  imagem_b?: string
  imagem_c?: string
  imagem_d?: string
  imagem_e?: string
}): QuestaoEstruturada {

  // Extrair partes do contexto
  const { titulo, subtitulo, textos, descricoes, fontes } = parseContexto(questao.contexto)

  // Estruturar alternativas
  const alternativas = estruturarAlternativas(questao)

  // Detectar características
  const temLatex = detectarLatex(questao.contexto + questao.comando +
    alternativas.map(a => a.texto).join(' '))
  const temTabela = detectarTabela(questao.contexto)
  const temImagem = !!(questao.imagem_principal || questao.imagens_extras?.length ||
    descricoes.length > 0)

  // Determinar tipo de questão
  const tipoQuestao = determinarTipoQuestao(questao, textos, descricoes, temLatex, temTabela)

  return {
    numero: questao.numero_questao,
    ano: questao.ano_prova,
    area: questao.area,
    subarea: questao.subarea,
    titulo,
    subtitulo,
    textos,
    imagensDescricoes: descricoes,
    fontes,
    comando: questao.comando,
    alternativas,
    respostaCorreta: questao.resposta_correta as 'A' | 'B' | 'C' | 'D' | 'E',
    imagemPrincipal: questao.imagem_principal,
    imagensExtras: questao.imagens_extras,
    temLatex,
    temTabela,
    temImagem,
    tipoQuestao,
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARSING DO CONTEXTO
// ═══════════════════════════════════════════════════════════════════════════════

function parseContexto(contexto: string): {
  titulo?: string
  subtitulo?: string
  textos: TextoEstruturado[]
  descricoes: DescricaoImagem[]
  fontes: string[]
} {
  if (!contexto) {
    return { textos: [], descricoes: [], fontes: [] }
  }

  let texto = contexto
  const textos: TextoEstruturado[] = []
  const descricoes: DescricaoImagem[] = []
  const fontes: string[] = []
  let titulo: string | undefined
  let subtitulo: string | undefined

  // 1. Extrair título (primeira linha com <strong>)
  const tituloMatch = texto.match(/^<strong>([^<]+)<\/strong>/i)
  if (tituloMatch) {
    titulo = tituloMatch[1].trim()
    texto = texto.replace(tituloMatch[0], '').trim()
  }

  // 2. Extrair subtítulo (primeira linha com <em> após título)
  const subtituloMatch = texto.match(/^<em>([^<]+)<\/em>/i)
  if (subtituloMatch && !subtituloMatch[1].startsWith('[')) {
    subtitulo = subtituloMatch[1].trim()
    texto = texto.replace(subtituloMatch[0], '').trim()
  }

  // 3. Extrair fontes (<small>...</small>)
  const fonteRegex = /<small[^>]*>([\s\S]*?)<\/small>/gi
  let fonteMatch
  while ((fonteMatch = fonteRegex.exec(texto)) !== null) {
    fontes.push(fonteMatch[1].trim())
  }
  texto = texto.replace(/<small[^>]*>[\s\S]*?<\/small>/gi, '')

  // 4. Extrair descrições de imagens (<em>[...]</em>)
  const descricaoRegex = /<em>\s*\[([^\]]+)\]\s*<\/em>/gi
  let descricaoMatch
  while ((descricaoMatch = descricaoRegex.exec(texto)) !== null) {
    descricoes.push({
      descricao: descricaoMatch[1].trim()
    })
  }
  texto = texto.replace(/<em>\s*\[[^\]]+\]\s*<\/em>/gi, '')

  // 5. Extrair figuras com legendas
  const figuraRegex = /<strong>(Figura\s*\d+):?<\/strong>\s*([^<\n]+)/gi
  let figuraMatch
  while ((figuraMatch = figuraRegex.exec(texto)) !== null) {
    descricoes.push({
      figura: figuraMatch[1].trim(),
      descricao: figuraMatch[2].trim()
    })
  }

  // 6. Dividir em TEXTO I, TEXTO II, etc.
  const textosDivididos = texto.split(/<strong>(TEXTO\s+[IVX]+)<\/strong>/i)

  if (textosDivididos.length > 1) {
    // Tem múltiplos textos
    for (let i = 1; i < textosDivididos.length; i += 2) {
      const identificador = textosDivididos[i]?.trim()
      const conteudo = textosDivididos[i + 1]?.trim()
      if (identificador && conteudo) {
        textos.push({
          identificador,
          conteudo: limparTexto(conteudo),
          tipo: detectarTipoTexto(conteudo)
        })
      }
    }
  } else {
    // Texto único
    const conteudoLimpo = limparTexto(texto)
    if (conteudoLimpo) {
      textos.push({
        conteudo: conteudoLimpo,
        tipo: detectarTipoTexto(conteudoLimpo)
      })
    }
  }

  return { titulo, subtitulo, textos, descricoes, fontes }
}

// Limpar texto removendo tags processadas e espaços extras
function limparTexto(texto: string): string {
  return texto
    .replace(/<small[^>]*>[\s\S]*?<\/small>/gi, '')
    .replace(/<em>\s*\[[^\]]+\]\s*<\/em>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Detectar tipo de texto
function detectarTipoTexto(texto: string): TextoEstruturado['tipo'] {
  // Poesia: múltiplas linhas curtas, pode ter rima
  if (texto.split('\n').filter(l => l.trim().length > 0 && l.trim().length < 60).length > 4) {
    return 'poesia'
  }

  // Diálogo: contém travessões ou aspas de diálogo
  if (/^[—–-]\s|"[^"]+"\s*[—–-]|disse|perguntou|respondeu/im.test(texto)) {
    return 'dialogo'
  }

  // Lei/Artigo: contém "Art." ou "§"
  if (/Art\.\s*\d|§\s*\d|inciso|alínea/i.test(texto)) {
    return 'lei'
  }

  // Tabela: contém padrões de tabela
  if (/\|.*\||\t.*\t|^\s*•.*•/m.test(texto)) {
    return 'tabela'
  }

  // Infográfico: menção explícita
  if (/infográfico|gráfico|mapa|charge/i.test(texto)) {
    return 'infografico'
  }

  return 'prosa'
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTRUTURAR ALTERNATIVAS
// ═══════════════════════════════════════════════════════════════════════════════

function estruturarAlternativas(questao: {
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  imagem_a?: string
  imagem_b?: string
  imagem_c?: string
  imagem_d?: string
  imagem_e?: string
}): AlternativaEstruturada[] {
  const letras: Array<'A' | 'B' | 'C' | 'D' | 'E'> = ['A', 'B', 'C', 'D', 'E']

  return letras.map(letra => {
    const chaveTexto = `alternativa_${letra.toLowerCase()}` as keyof typeof questao
    const chaveImagem = `imagem_${letra.toLowerCase()}` as keyof typeof questao
    const texto = questao[chaveTexto] as string || ''

    return {
      letra,
      texto,
      imagem: questao[chaveImagem] as string | undefined,
      temLatex: detectarLatex(texto)
    }
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETECÇÃO DE CARACTERÍSTICAS
// ═══════════════════════════════════════════════════════════════════════════════

function detectarLatex(texto: string): boolean {
  if (!texto) return false

  const padroesLatex = [
    /\$[^$]+\$/,           // $inline$
    /\$\$[^$]+\$\$/,       // $$block$$
    /\\frac\{/,            // frações
    /\\sqrt/,              // raiz quadrada
    /\\sum|\\int|\\lim/,   // operadores
    /\\times|\\div|\\pm/,  // operações
    /\\alpha|\\beta|\\gamma|\\delta|\\pi/i, // letras gregas
    /\^{[^}]+}|_{[^}]+}/,  // sub/superscript
    /\\[a-zA-Z]+\{/,       // comandos LaTeX
    /×\s*10\^/,            // notação científica
  ]

  return padroesLatex.some(p => p.test(texto))
}

function detectarTabela(texto: string): boolean {
  if (!texto) return false

  return /\|.*\|.*\||\t.*\t.*\t|<table|<th|<td/i.test(texto)
}

function determinarTipoQuestao(
  questao: { area: string; subarea?: string },
  textos: TextoEstruturado[],
  descricoes: DescricaoImagem[],
  temLatex: boolean,
  temTabela: boolean
): TipoQuestao {
  // Língua estrangeira
  if (questao.subarea === 'ingles' || questao.subarea === 'espanhol') {
    return 'lingua_estrangeira'
  }

  // Cálculo matemático
  if (temLatex && (questao.area === 'matematica' || questao.area === 'ciencias_natureza')) {
    return 'calculo_matematico'
  }

  // Análise de gráfico/tabela
  if (temTabela || descricoes.some(d =>
    /gráfico|tabela|quadro|chart/i.test(d.descricao)
  )) {
    return 'analise_grafico'
  }

  // Análise de imagem
  if (descricoes.length > 0 || descricoes.some(d =>
    /charge|fotografia|pintura|imagem|figura|mapa/i.test(d.descricao)
  )) {
    return 'analise_imagem'
  }

  // Comparação de textos
  if (textos.length > 1) {
    return 'comparacao_textos'
  }

  // Interpretação de texto (padrão)
  return 'interpretacao_texto'
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS DE FORMATAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

// Formatar número da questão com zeros à esquerda
export function formatarNumeroQuestao(numero: number): string {
  return numero.toString().padStart(2, '0')
}

// Obter cor da área
export function getCorArea(area: string): string {
  const cores: Record<string, string> = {
    linguagens: '#3B82F6',      // Azul
    matematica: '#10B981',      // Verde
    ciencias_humanas: '#F59E0B', // Amarelo
    ciencias_natureza: '#EF4444', // Vermelho
  }
  return cores[area] || '#6B7280'
}

// Obter nome legível da área
export function getNomeArea(area: string): string {
  const nomes: Record<string, string> = {
    linguagens: 'Linguagens e Códigos',
    matematica: 'Matemática',
    ciencias_humanas: 'Ciências Humanas',
    ciencias_natureza: 'Ciências da Natureza',
  }
  return nomes[area] || area
}

// Obter ícone da área (nome do ícone Lucide)
export function getIconeArea(area: string): string {
  const icones: Record<string, string> = {
    linguagens: 'BookOpen',
    matematica: 'Calculator',
    ciencias_humanas: 'Globe',
    ciencias_natureza: 'Atom',
  }
  return icones[area] || 'FileQuestion'
}
