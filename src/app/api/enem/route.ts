import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM v3 - Híbrido: Banco Local (Supabase) + API Externa (fallback)
// GET /api/enem?ano=2023
// ═══════════════════════════════════════════════════════════════════════════

const API_ENEM_BASE = 'https://api.enem.dev/v1'
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
function formatarQuestaoLocal(q: QuestaoLocal): QuestaoFormatada {
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

// Buscar da API externa (fallback)
async function buscarQuestaoAPIExterna(ano: number | null): Promise<QuestaoFormatada | null> {
  const anosParaBuscar = ano ? [ano] : ANOS_DISPONIVEIS.slice(0, 3)

  for (const anoAtual of anosParaBuscar) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(
        `${API_ENEM_BASE}/exams/${anoAtual}/questions?limit=50`,
        {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) continue

      const data = await response.json()
      const questoes = data.questions || []

      if (questoes.length === 0) continue

      // Selecionar aleatória
      const q = questoes[Math.floor(Math.random() * questoes.length)]

      // Verificar alternativas
      const alternativas = q.alternatives || []
      const letras = ['A', 'B', 'C', 'D', 'E']
      const altsFormatadas = letras.map(letra => {
        const alt = alternativas.find((a: any) => a.letter === letra)
        return alt ? { letra, texto: alt.text || '', imagem: alt.file || null } : null
      })

      if (altsFormatadas.some(a => a === null)) continue

      return {
        id: `enem-${q.year}-${q.index}`,
        ano: q.year,
        numero: q.index,
        disciplina: q.discipline || 'ENEM',
        titulo: q.title || null,
        contexto: q.context || '',
        comando: q.alternativesIntroduction || null,
        imagens: q.files || [],
        alternativas: altsFormatadas as Array<{ letra: string; texto: string; imagem: string | null }>,
        resposta_correta: (q.correctAlternative || 'A').toUpperCase(),
      }
    } catch (error) {
      console.error(`[ENEM API] Erro ao buscar ano ${anoAtual}:`, error)
      continue
    }
  }

  return null
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

    // ═══════════════════════════════════════════════════════════════════
    // ETAPA 1: Tentar buscar do banco local (Supabase)
    // ═══════════════════════════════════════════════════════════════════

    let questaoSelecionada: QuestaoFormatada | null = null
    let fonteUsada = 'nenhuma'

    // Construir query
    let query = supabase
      .from('questoes_enem')
      .select('*')
      .eq('status', 'ativa')

    if (ano) {
      query = query.eq('ano_prova', ano)
    }

    const { data: questoesLocais, error: erroLocal } = await query.limit(200)

    if (!erroLocal && questoesLocais && questoesLocais.length > 0) {
      // Filtrar não respondidas
      const disponiveis = questoesLocais.filter(q => {
        const idApi = q.id_api || `local-${q.id}`
        return !idsRespondidos.has(q.id) && !idsRespondidos.has(idApi)
      })

      if (disponiveis.length > 0) {
        const questao = disponiveis[Math.floor(Math.random() * disponiveis.length)]
        questaoSelecionada = formatarQuestaoLocal(questao)
        fonteUsada = 'banco_local'
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ETAPA 2: Se não encontrou, tentar API externa
    // ═══════════════════════════════════════════════════════════════════

    if (!questaoSelecionada) {
      console.log('[ENEM] Banco local vazio, tentando API externa...')
      questaoSelecionada = await buscarQuestaoAPIExterna(ano)
      if (questaoSelecionada) {
        fonteUsada = 'api_externa'
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ETAPA 3: Se nenhum funcionou
    // ═══════════════════════════════════════════════════════════════════

    if (!questaoSelecionada) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: 'Nenhuma questão disponível no momento. Tente novamente mais tarde ou escolha outro ano.',
        anos_disponiveis: ANOS_DISPONIVEIS,
        respondidas: idsRespondidos.size,
        debug: {
          questoesLocalEncontradas: questoesLocais?.length || 0,
          fonteUsada,
        },
      })
    }

    // Retornar questão
    const { resposta_correta, ...questaoPublica } = questaoSelecionada

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoPublica,
      _rc: Buffer.from(resposta_correta).toString('base64'),
      anos_disponiveis: ANOS_DISPONIVEIS,
      respondidas: idsRespondidos.size,
      fonte: fonteUsada,
    })
  } catch (error) {
    console.error('Erro na API ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor', detalhes: String(error) },
      { status: 500 }
    )
  }
}
