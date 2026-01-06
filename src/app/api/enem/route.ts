import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Apenas Banco Local (Supabase)
// GET /api/enem?ano=2023&area=matematica
// ═══════════════════════════════════════════════════════════════════════════

const ANOS_DISPONIVEIS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016]

// Interface da questão do banco local
interface QuestaoLocal {
  id: string
  id_api: string | null
  ano_prova: number
  numero_questao: number
  area: string
  area_nome: string | null
  subarea: string | null
  titulo: string | null
  contexto: string
  comando: string | null
  imagem_principal: string | null
  imagens_extras: string[] | null
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  imagem_a: string | null
  imagem_b: string | null
  imagem_c: string | null
  imagem_d: string | null
  imagem_e: string | null
  resposta_correta: string
  fonte: string | null
  status: string
}

// Interface para o frontend
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

// Formatar questão do banco local
function formatarQuestao(q: QuestaoLocal): QuestaoFormatada {
  const imagens: string[] = []
  if (q.imagem_principal) imagens.push(q.imagem_principal)
  if (q.imagens_extras) imagens.push(...q.imagens_extras)

  // Mapear área para nome legível
  const disciplinaMap: Record<string, string> = {
    'ciencias-natureza': 'Ciências da Natureza e suas Tecnologias',
    'matematica': 'Matemática e suas Tecnologias',
    'linguagens': 'Linguagens, Códigos e suas Tecnologias',
    'ciencias-humanas': 'Ciências Humanas e suas Tecnologias',
  }

  return {
    id: q.id_api || q.id,
    ano: q.ano_prova,
    numero: q.numero_questao,
    disciplina: disciplinaMap[q.area] || q.area_nome || q.area,
    titulo: q.titulo,
    contexto: q.contexto,
    comando: q.comando,
    imagens,
    alternativas: [
      { letra: 'A', texto: q.alternativa_a, imagem: q.imagem_a },
      { letra: 'B', texto: q.alternativa_b, imagem: q.imagem_b },
      { letra: 'C', texto: q.alternativa_c, imagem: q.imagem_c },
      { letra: 'D', texto: q.alternativa_d, imagem: q.imagem_d },
      { letra: 'E', texto: q.alternativa_e, imagem: q.imagem_e },
    ],
    resposta_correta: q.resposta_correta,
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
    const area = areaParam || null

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

    // Buscar IDs já respondidos
    const { data: respostasUsuario } = await supabase
      .from('respostas_enem')
      .select('questao_id, id_api_questao')
      .eq('usuario_id', sessao.userId)

    const idsRespondidos = new Set<string>()
    respostasUsuario?.forEach(r => {
      if (r.questao_id) idsRespondidos.add(r.questao_id)
      if (r.id_api_questao) idsRespondidos.add(r.id_api_questao)
    })

    // Construir query
    let query = supabase
      .from('questoes_enem')
      .select('*')
      .eq('status', 'ativa')

    if (ano) {
      query = query.eq('ano_prova', ano)
    }

    if (area) {
      query = query.eq('area', area)
    }

    const { data: questoesLocais, error: erroLocal } = await query.limit(500)

    if (erroLocal) {
      console.error('Erro ao buscar questões:', erroLocal)
      return NextResponse.json({
        sucesso: false,
        erro: 'Erro ao buscar questões do banco de dados',
      }, { status: 500 })
    }

    if (!questoesLocais || questoesLocais.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: 'Nenhuma questão disponível. Execute o script SQL para popular o banco.',
        anos_disponiveis: ANOS_DISPONIVEIS,
        respondidas: idsRespondidos.size,
      })
    }

    // Filtrar não respondidas
    const disponiveis = questoesLocais.filter(q => {
      const idApi = q.id_api || `local-${q.id}`
      return !idsRespondidos.has(q.id) && !idsRespondidos.has(idApi)
    })

    if (disponiveis.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'TODAS_RESPONDIDAS',
        mensagem: 'Você já respondeu todas as questões disponíveis!',
        anos_disponiveis: ANOS_DISPONIVEIS,
        respondidas: idsRespondidos.size,
        total_questoes: questoesLocais.length,
      })
    }

    // Selecionar questão aleatória
    const questao = disponiveis[Math.floor(Math.random() * disponiveis.length)]
    const questaoFormatada = formatarQuestao(questao)

    // Retornar questão (sem a resposta correta visível)
    const { resposta_correta, ...questaoPublica } = questaoFormatada

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoPublica,
      _rc: Buffer.from(resposta_correta).toString('base64'),
      anos_disponiveis: ANOS_DISPONIVEIS,
      respondidas: idsRespondidos.size,
      total_questoes: questoesLocais.length,
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
