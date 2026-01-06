import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM v2 - Abordagem simplificada usando apenas API externa
// GET /api/enem?ano=2023
// ═══════════════════════════════════════════════════════════════════════════

const API_ENEM_BASE = 'https://api.enem.dev/v1'

// Anos disponíveis no ENEM (API suporta 2009-2023)
const ANOS_DISPONIVEIS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]

// Interface da questão retornada pela API externa
interface QuestaoAPI {
  title: string | null
  index: number
  discipline: string
  language: string | null
  year: number
  context: string
  files: string[]
  correctAlternative: string
  alternativesIntroduction: string | null
  alternatives: Array<{
    letter: string
    text: string
    file: string | null
    isCorrect: boolean
  }>
}

// Interface da questão formatada para o frontend
interface QuestaoFormatada {
  id: string
  ano: number
  numero: number
  disciplina: string
  titulo: string | null
  contexto: string
  comando: string | null
  imagens: string[]
  alternativas: Array<{
    letra: string
    texto: string
    imagem: string | null
  }>
  resposta_correta: string
}

// Buscar questões da API externa
async function buscarQuestoesAPI(ano: number, limite: number = 100): Promise<QuestaoAPI[]> {
  try {
    const response = await fetch(
      `${API_ENEM_BASE}/exams/${ano}/questions?limit=${limite}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Studao-Platform/2.0',
        },
        next: { revalidate: 3600 } // Cache 1 hora
      }
    )

    if (!response.ok) {
      console.error(`[ENEM API] Erro ${response.status} ao buscar ano ${ano}`)
      return []
    }

    const data = await response.json()
    return data.questions || []
  } catch (error) {
    console.error(`[ENEM API] Erro ao buscar questões de ${ano}:`, error)
    return []
  }
}

// Formatar questão para o frontend
function formatarQuestao(q: QuestaoAPI): QuestaoFormatada | null {
  // Verificar se tem todas as alternativas válidas
  const alternativas = q.alternatives || []
  if (alternativas.length < 5) {
    return null
  }

  // Verificar se todas as alternativas A-E existem
  const letras = ['A', 'B', 'C', 'D', 'E']
  const alternativasOrdenadas = letras.map(letra => {
    const alt = alternativas.find(a => a.letter === letra)
    return alt ? {
      letra,
      texto: alt.text || '',
      imagem: alt.file || null
    } : null
  })

  if (alternativasOrdenadas.some(a => a === null)) {
    return null
  }

  return {
    id: `enem-${q.year}-${q.index}`,
    ano: q.year,
    numero: q.index,
    disciplina: q.discipline || 'Não especificada',
    titulo: q.title || null,
    contexto: q.context || '',
    comando: q.alternativesIntroduction || null,
    imagens: q.files || [],
    alternativas: alternativasOrdenadas as Array<{ letra: string; texto: string; imagem: string | null }>,
    resposta_correta: (q.correctAlternative || 'A').toUpperCase()
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const anoParam = searchParams.get('ano')
    const ano = anoParam ? parseInt(anoParam) : null

    const supabase = getSupabaseAdmin()

    // Verificar se usuário pode acessar (3ª série EM ou professor)
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

    // Buscar IDs das questões já respondidas
    const { data: respostasUsuario } = await supabase
      .from('respostas_enem')
      .select('id_api_questao')
      .eq('usuario_id', sessao.userId)

    const questoesRespondidasIds = new Set<string>(
      respostasUsuario?.map(r => r.id_api_questao).filter(Boolean) || []
    )

    // Determinar anos para buscar
    const anosParaBuscar = ano ? [ano] : ANOS_DISPONIVEIS.slice(0, 5) // Se não especificar, busca dos 5 anos mais recentes

    // Buscar questões
    let questaoSelecionada: QuestaoFormatada | null = null

    for (const anoAtual of anosParaBuscar) {
      const questoesRaw = await buscarQuestoesAPI(anoAtual, 180)

      if (questoesRaw.length === 0) continue

      // Formatar e filtrar questões válidas
      const questoesFormatadas = questoesRaw
        .map(formatarQuestao)
        .filter((q): q is QuestaoFormatada => q !== null)

      // Filtrar não respondidas
      const questoesDisponiveis = questoesFormatadas.filter(
        q => !questoesRespondidasIds.has(q.id)
      )

      if (questoesDisponiveis.length > 0) {
        // Selecionar aleatória
        questaoSelecionada = questoesDisponiveis[
          Math.floor(Math.random() * questoesDisponiveis.length)
        ]
        break
      }
    }

    if (!questaoSelecionada) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: ano
          ? `Você já respondeu todas as questões de ${ano} ou não há questões disponíveis.`
          : 'Você já respondeu todas as questões disponíveis.',
        anos_disponiveis: ANOS_DISPONIVEIS,
        respondidas: questoesRespondidasIds.size,
      })
    }

    // Retornar questão (sem a resposta correta no objeto principal)
    const { resposta_correta, ...questaoPublica } = questaoSelecionada

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoPublica,
      // Resposta correta codificada (base64) para validação no cliente
      _rc: Buffer.from(resposta_correta).toString('base64'),
      anos_disponiveis: ANOS_DISPONIVEIS,
      respondidas: questoesRespondidasIds.size,
    })
  } catch (error) {
    console.error('Erro na API ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
