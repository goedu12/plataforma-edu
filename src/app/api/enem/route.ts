import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Banco Local (Supabase) - Tabela enem_questions (CSV)
// GET /api/enem?ano=2023
// ═══════════════════════════════════════════════════════════════════════════

// Interface da questão do CSV importado
interface QuestaoCSV {
  id_unico: string           // PK - ex: questao_01_2022
  id: string | null          // original_id - ex: questao_01
  ano: number                // year
  exam: number | null        // exam_year
  IU: boolean | null         // image_usage
  ledor: boolean | null      // reader_required
  anulada: boolean | null    // is_cancelled
  question: string           // question_text
  label: string              // correct_answer (A, B, C, D, E)
  description: unknown       // image_description (JSONB)
  alternatives: string[] | null // alternatives (JSONB array)
  figures: string[] | null   // figure_urls (JSONB array)
}

// Interface para o frontend
interface QuestaoFormatada {
  id: string
  ano: number
  numero: number
  contexto: string
  imagens: string[]
  alternativas: Array<{ letra: string; texto: string }>
  resposta_correta: string
}

// Formatar questão do CSV para o frontend
function formatarQuestao(q: QuestaoCSV): QuestaoFormatada {
  // Extrair número da questão do id (ex: "questao_01" -> 1)
  let numero = 1
  if (q.id) {
    const match = q.id.match(/(\d+)/)
    if (match) numero = parseInt(match[1])
  }

  // Formatar alternativas do array JSON
  const letras = ['A', 'B', 'C', 'D', 'E']
  const alternativas = letras.map((letra, i) => ({
    letra,
    texto: q.alternatives && q.alternatives[i] ? String(q.alternatives[i]) : ''
  }))

  // Imagens
  const imagens: string[] = []
  if (q.figures && Array.isArray(q.figures)) {
    q.figures.forEach(url => {
      if (url && typeof url === 'string' && url.trim()) {
        imagens.push(url.trim())
      }
    })
  }

  return {
    id: q.id_unico,
    ano: q.ano,
    numero,
    contexto: q.question || '',
    imagens,
    alternativas,
    resposta_correta: (q.label || 'A').toUpperCase(),
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
        erro: 'Simulado ENEM disponível apenas para 3ª série do EM.',
      }, { status: 403 })
    }

    // Buscar anos disponíveis
    const { data: anosData } = await supabase
      .from('enem_questions')
      .select('ano')
      .order('ano', { ascending: false })

    const anosDisponiveis = [...new Set(anosData?.map(a => a.ano) || [])]

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

    const { data: questoes, error: erroQuery } = await query.limit(1000)

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
        respondidas: idsRespondidos.size,
      })
    }

    // Filtrar não respondidas
    const disponiveis = questoes.filter(q => !idsRespondidos.has(q.id_unico))

    if (disponiveis.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'TODAS_RESPONDIDAS',
        mensagem: 'Você respondeu todas as questões!',
        anos_disponiveis: anosDisponiveis,
        respondidas: idsRespondidos.size,
        total_questoes: questoes.length,
      })
    }

    // Selecionar questão aleatória
    const questaoRaw = disponiveis[Math.floor(Math.random() * disponiveis.length)]
    const questaoFormatada = formatarQuestao(questaoRaw)

    // Retornar sem a resposta correta visível
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
      { sucesso: false, erro: 'Erro interno', detalhes: String(error) },
      { status: 500 }
    )
  }
}
