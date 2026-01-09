import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Banco Local (Supabase) - Tabela enem_questions (CSV)
// GET /api/enem?ano=2023&area=Matemática
// ═══════════════════════════════════════════════════════════════════════════

// Interface da questão conforme CSV importado
// Nota: area e num_questao podem não existir se SQL 30 não foi executado
interface QuestaoCSV {
  id_unico: string
  id: string | null
  num_questao: number | null
  ano: number
  exam: number | null
  area: string | null
  IU: boolean | null
  ledor: boolean | null
  question: string
  description: string | null
  alternatives: string[] | null
  label: string
  figures: string[] | null
  anulada: boolean | null
}

// Interface para o frontend
interface QuestaoFormatada {
  id: string
  ano: number
  numero: number
  contexto: string
  comando: string | null
  imagens: string[]
  alternativas: Array<{ letra: string; texto: string }>
  area: string
}

// Validar se uma URL de imagem é válida
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false
  const invalid = /^(nan|none|null|undefined|\s*)$/i
  if (invalid.test(trimmed)) return false
  return trimmed.startsWith('http') || trimmed.startsWith('data:image')
}

// Formatar questão do CSV para o frontend
function formatarQuestao(q: QuestaoCSV): QuestaoFormatada {
  // Extrair número da questão do campo id se num_questao não existir
  let numero = q.num_questao || 1
  if (!q.num_questao && q.id) {
    const match = q.id.match(/\d+/)
    if (match) numero = parseInt(match[0], 10)
  }

  const letras = ['A', 'B', 'C', 'D', 'E']
  let alternativasArray: string[] = []

  if (q.alternatives) {
    if (Array.isArray(q.alternatives)) {
      alternativasArray = q.alternatives
    } else if (typeof q.alternatives === 'string') {
      try {
        alternativasArray = JSON.parse(q.alternatives)
      } catch {
        alternativasArray = []
      }
    }
  }

  const alternativas = letras.map((letra, i) => ({
    letra,
    texto: alternativasArray[i] ? String(alternativasArray[i]).trim() : ''
  }))

  const imagens: string[] = []
  if (q.figures) {
    let figuresArray: string[] = []
    if (Array.isArray(q.figures)) {
      figuresArray = q.figures
    } else if (typeof q.figures === 'string') {
      try {
        figuresArray = JSON.parse(q.figures)
      } catch {
        if (isValidImageUrl(q.figures)) {
          figuresArray = [q.figures]
        }
      }
    }
    figuresArray.forEach(url => {
      if (isValidImageUrl(url)) {
        imagens.push(url.trim())
      }
    })
  }

  return {
    id: q.id_unico,
    ano: q.ano,
    numero,
    contexto: q.question || '',
    comando: q.description || null,
    imagens,
    alternativas,
    area: q.area || 'Geral'
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const anoParam = searchParams.get('ano')
    const areaParam = searchParams.get('area')
    const ano = anoParam ? parseInt(anoParam) : null

    const supabase = getSupabaseAdmin()

    // Verificar acesso (3ª série EM ou professor)
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nivel, ano, tipo')
      .eq('id', sessao.userId)
      .single()

    const isProfessor = usuario?.tipo === 'professor'
    const isAluno3SerieEM = usuario?.nivel === 'EM' && usuario?.ano === 3

    if (!usuario || (!isProfessor && !isAluno3SerieEM)) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Simulado ENEM disponível apenas para 3ª série do EM.',
      }, { status: 403 })
    }

    // Buscar anos disponíveis
    const { data: anosData } = await supabase
      .from('enem_questions')
      .select('ano')
      .not('ano', 'is', null)
      .order('ano', { ascending: false })

    const anosDisponiveis = [...new Set(anosData?.map(a => a.ano).filter(Boolean) || [])]

    // Buscar áreas disponíveis (pode não existir se SQL 30 não foi executado)
    let areasDisponiveis: string[] = []
    try {
      const { data: areasData } = await supabase
        .from('enem_questions')
        .select('area')
        .not('area', 'is', null)

      areasDisponiveis = [...new Set(areasData?.map(a => a.area).filter(Boolean) || [])]
    } catch {
      // Coluna area pode não existir ainda
      areasDisponiveis = []
    }

    // Buscar IDs já respondidos
    const { data: respostasUsuario } = await supabase
      .from('enem_responses')
      .select('question_id')
      .eq('usuario_id', sessao.userId)

    const idsRespondidos = new Set<string>()
    respostasUsuario?.forEach(r => {
      if (r.question_id) idsRespondidos.add(r.question_id)
    })

    // Construir query - excluir questões anuladas
    let query = supabase
      .from('enem_questions')
      .select('*')
      .or('anulada.is.null,anulada.eq.false')

    if (ano) {
      query = query.eq('ano', ano)
    }
    // Filtro por área só funciona se a coluna existir e tiver dados
    if (areaParam && areasDisponiveis.length > 0) {
      query = query.eq('area', areaParam)
    }

    const { data: questoes, error: erroQuery } = await query.limit(2000)

    if (erroQuery) {
      console.error('Erro ao buscar questões:', erroQuery)
      return NextResponse.json({
        sucesso: false,
        erro: 'Erro ao buscar questões',
      }, { status: 500 })
    }

    if (!questoes || questoes.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: 'Nenhuma questão disponível. Importe o CSV.',
        anos_disponiveis: anosDisponiveis,
        areas_disponiveis: areasDisponiveis,
        respondidas: idsRespondidos.size,
      })
    }

    // Filtrar não respondidas
    const disponiveis = questoes.filter(q => !idsRespondidos.has(q.id_unico))

    if (disponiveis.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'TODAS_RESPONDIDAS',
        mensagem: ano
          ? `Você respondeu todas as questões de ${ano}!`
          : 'Você respondeu todas as questões!',
        anos_disponiveis: anosDisponiveis,
        areas_disponiveis: areasDisponiveis,
        respondidas: idsRespondidos.size,
        total_questoes: questoes.length,
      })
    }

    // Selecionar questão aleatória
    const questaoRaw = disponiveis[Math.floor(Math.random() * disponiveis.length)]
    const questaoFormatada = formatarQuestao(questaoRaw as QuestaoCSV)

    // Resposta correta (codificada em base64)
    const respostaCorreta = (questaoRaw.label || 'A').toUpperCase()

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoFormatada,
      _rc: Buffer.from(respostaCorreta).toString('base64'),
      anos_disponiveis: anosDisponiveis,
      areas_disponiveis: areasDisponiveis,
      respondidas: idsRespondidos.size,
      total_questoes: questoes.length,
      disponiveis: disponiveis.length,
    })
  } catch (error) {
    console.error('Erro na API ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno', detalhes: String(error) },
      { status: 500 }
    )
  }
}
