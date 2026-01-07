import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Banco Local (Supabase) - Tabela enem_questions
// GET /api/enem?ano=2023
// ═══════════════════════════════════════════════════════════════════════════

// Interface da questão do banco (CSV importado)
interface QuestaoCSV {
  id: string                    // id_unico do CSV
  original_id: string | null    // id original
  year: number                  // ano
  exam_year: number | null      // exam
  image_usage: boolean | null   // IU
  reader_required: boolean | null // ledor
  is_cancelled: boolean | null  // anulada
  question_text: string         // question
  correct_answer: string        // label (A, B, C, D, E)
  image_description: unknown    // description (JSONB)
  alternatives: string[] | null // alternatives (JSONB array)
  figure_urls: string[] | null  // figures (JSONB array)
}

// Interface para o frontend
interface QuestaoFormatada {
  id: string
  ano: number
  numero: number
  contexto: string
  imagens: string[]
  alternativas: Array<{
    letra: string
    texto: string
  }>
  resposta_correta: string
}

// Formatar questão do banco CSV
function formatarQuestao(q: QuestaoCSV, index: number): QuestaoFormatada {
  // Extrair número da questão do original_id (ex: "questao_01" -> 1)
  let numero = index + 1
  if (q.original_id) {
    const match = q.original_id.match(/(\d+)/)
    if (match) numero = parseInt(match[1])
  }

  // Formatar alternativas
  const letras = ['A', 'B', 'C', 'D', 'E']
  const alternativas = letras.map((letra, i) => ({
    letra,
    texto: q.alternatives && q.alternatives[i] ? q.alternatives[i] : ''
  }))

  // Imagens
  const imagens: string[] = []
  if (q.figure_urls && Array.isArray(q.figure_urls)) {
    imagens.push(...q.figure_urls.filter(url => url && url.trim()))
  }

  return {
    id: q.id,
    ano: q.year,
    numero,
    contexto: q.question_text || '',
    imagens,
    alternativas,
    resposta_correta: q.correct_answer?.toUpperCase() || 'A',
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
        erro: 'O Simulado ENEM está disponível apenas para alunos da 3ª série do Ensino Médio.',
      }, { status: 403 })
    }

    // Buscar anos disponíveis
    const { data: anosData } = await supabase
      .from('enem_questions')
      .select('year')
      .order('year', { ascending: false })

    const anosDisponiveis = [...new Set(anosData?.map(a => a.year) || [])]

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
      .or('is_cancelled.is.null,is_cancelled.eq.false')

    if (ano) {
      query = query.eq('year', ano)
    }

    const { data: questoes, error: erroQuery } = await query.limit(500)

    if (erroQuery) {
      console.error('Erro ao buscar questões:', erroQuery)
      return NextResponse.json({
        sucesso: false,
        erro: 'Erro ao buscar questões do banco de dados',
      }, { status: 500 })
    }

    if (!questoes || questoes.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: 'Nenhuma questão disponível. Importe o CSV no Supabase.',
        anos_disponiveis: anosDisponiveis,
        respondidas: idsRespondidos.size,
      })
    }

    // Filtrar não respondidas
    const disponiveis = questoes.filter(q => !idsRespondidos.has(q.id))

    if (disponiveis.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'TODAS_RESPONDIDAS',
        mensagem: 'Você já respondeu todas as questões disponíveis!',
        anos_disponiveis: anosDisponiveis,
        respondidas: idsRespondidos.size,
        total_questoes: questoes.length,
      })
    }

    // Selecionar questão aleatória
    const questaoRaw = disponiveis[Math.floor(Math.random() * disponiveis.length)]
    const questaoFormatada = formatarQuestao(questaoRaw, 0)

    // Retornar questão (sem a resposta correta visível)
    const { resposta_correta, ...questaoPublica } = questaoFormatada

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoPublica,
      _rc: Buffer.from(resposta_correta).toString('base64'),
      anos_disponiveis: anosDisponiveis,
      respondidas: idsRespondidos.size,
      total_questoes: questoes.length,
      disponiveis: disponiveis.length,
    })
  } catch (error) {
    console.error('Erro na API ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor', detalhes: String(error) },
      { status: 500 }
    )
  }
}
