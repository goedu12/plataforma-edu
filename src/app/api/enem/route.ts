import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AreaENEM, SubareaENEM, AlternativaENEM } from '@/types'
import { ENEM_CONFIG } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Buscar questões para estudantes da 3ª série
// GET /api/enem - Retorna uma questão aleatória não respondida
// GET /api/enem?area=matematica - Filtra por área
// GET /api/enem?ano=2023 - Filtra por ano da prova
// ═══════════════════════════════════════════════════════════════════════════

// Interface da questão no banco (tabela questoes_enem)
interface QuestaoENEMDB {
  id: string
  id_api: string
  ano_prova: number
  numero_questao: number
  area: AreaENEM
  subarea: SubareaENEM
  idioma: string | null
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
  resposta_correta: AlternativaENEM
  fonte: string
  status: string
}

// Interface para o frontend (sem resposta correta)
interface QuestaoFormatada {
  id: string
  id_api: string
  ano_prova: number
  numero_questao: number
  area: AreaENEM
  area_nome: string
  subarea: SubareaENEM
  subarea_nome: string
  idioma: string | null
  titulo: string | null
  contexto: string
  comando: string | null
  imagem_principal: string | null
  imagens_extras: string[]
  alternativas: Array<{
    letra: AlternativaENEM
    texto: string
    imagem: string | null
  }>
}

// Formatar questão para o frontend
function formatarQuestao(q: QuestaoENEMDB): QuestaoFormatada {
  const areaConfig = ENEM_CONFIG.AREAS[q.area]
  const subareaNome = ENEM_CONFIG.SUBAREAS_LABELS[q.subarea] || q.subarea

  return {
    id: q.id,
    id_api: q.id_api,
    ano_prova: q.ano_prova,
    numero_questao: q.numero_questao,
    area: q.area,
    area_nome: areaConfig?.nome || q.area,
    subarea: q.subarea,
    subarea_nome: subareaNome,
    idioma: q.idioma,
    titulo: q.titulo,
    contexto: q.contexto,
    comando: q.comando,
    imagem_principal: q.imagem_principal,
    imagens_extras: q.imagens_extras || [],
    alternativas: [
      { letra: 'A', texto: q.alternativa_a, imagem: q.imagem_a },
      { letra: 'B', texto: q.alternativa_b, imagem: q.imagem_b },
      { letra: 'C', texto: q.alternativa_c, imagem: q.imagem_c },
      { letra: 'D', texto: q.alternativa_d, imagem: q.imagem_d },
      { letra: 'E', texto: q.alternativa_e, imagem: q.imagem_e },
    ]
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
    const areaParam = searchParams.get('area') as AreaENEM | null
    const subareaParam = searchParams.get('subarea') as SubareaENEM | null
    const ano = anoParam ? parseInt(anoParam) : null

    const supabase = getSupabaseAdmin()

    // Verificar acesso (3ª série EM ou professor)
    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('nivel, ano, tipo')
      .eq('id', sessao.userId)
      .single()

    if (erroUsuario || !usuario) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Usuário não encontrado',
      }, { status: 404 })
    }

    const isProfessor = usuario.tipo === 'professor'
    const isAluno3SerieEM = usuario.nivel === 'EM' && usuario.ano === 3

    if (!isProfessor && !isAluno3SerieEM) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Simulado ENEM disponível apenas para 3ª série do Ensino Médio.',
      }, { status: 403 })
    }

    // Buscar anos disponíveis
    const { data: anosData } = await supabase
      .from('questoes_enem')
      .select('ano_prova')
      .eq('status', 'ativa')

    const anosDisponiveis = [...new Set(anosData?.map(a => a.ano_prova).filter(Boolean) || [])]
      .sort((a, b) => b - a)

    // Buscar áreas disponíveis
    const { data: areasData } = await supabase
      .from('questoes_enem')
      .select('area')
      .eq('status', 'ativa')

    const areasDisponiveis = [...new Set(areasData?.map(a => a.area).filter(Boolean) || [])]

    // Buscar subáreas disponíveis
    const { data: subareasData } = await supabase
      .from('questoes_enem')
      .select('subarea')
      .eq('status', 'ativa')

    const subareasDisponiveis = [...new Set(subareasData?.map(a => a.subarea).filter(Boolean) || [])]

    // Buscar IDs já respondidos pelo usuário
    const { data: respostasUsuario } = await supabase
      .from('respostas_enem')
      .select('questao_id')
      .eq('usuario_id', sessao.userId)

    const idsRespondidos = new Set<string>(
      respostasUsuario?.map(r => r.questao_id).filter(Boolean) || []
    )

    // Construir query
    let query = supabase
      .from('questoes_enem')
      .select('*')
      .eq('status', 'ativa')

    if (ano) {
      query = query.eq('ano_prova', ano)
    }

    if (areaParam) {
      query = query.eq('area', areaParam)
    }

    if (subareaParam) {
      query = query.eq('subarea', subareaParam)
    }

    const { data: questoes, error: erroQuery } = await query.limit(500)

    if (erroQuery) {
      console.error('Erro ao buscar questões ENEM:', erroQuery)
      return NextResponse.json({
        sucesso: false,
        erro: 'Erro ao buscar questões',
        detalhes: erroQuery.message
      }, { status: 500 })
    }

    // Verificar se existem questões
    if (!questoes || questoes.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: 'Nenhuma questão disponível. O professor precisa importar questões.',
        anos_disponiveis: anosDisponiveis,
        areas_disponiveis: areasDisponiveis,
        subareas_disponiveis: subareasDisponiveis,
        respondidas: idsRespondidos.size,
      })
    }

    // Filtrar não respondidas
    const disponiveis = questoes.filter(q => !idsRespondidos.has(q.id))

    if (disponiveis.length === 0) {
      const filtroTexto = []
      if (ano) filtroTexto.push(`de ${ano}`)
      if (areaParam) filtroTexto.push(`de ${ENEM_CONFIG.AREAS[areaParam]?.nome || areaParam}`)

      return NextResponse.json({
        sucesso: true,
        status: 'TODAS_RESPONDIDAS',
        mensagem: filtroTexto.length > 0
          ? `Você respondeu todas as questões ${filtroTexto.join(' ')}!`
          : 'Você respondeu todas as questões disponíveis!',
        anos_disponiveis: anosDisponiveis,
        areas_disponiveis: areasDisponiveis,
        subareas_disponiveis: subareasDisponiveis,
        respondidas: idsRespondidos.size,
        total_questoes: questoes.length,
      })
    }

    // Selecionar questão aleatória
    const questaoRaw = disponiveis[Math.floor(Math.random() * disponiveis.length)] as QuestaoENEMDB
    const questaoFormatada = formatarQuestao(questaoRaw)

    // Resposta correta (codificada em base64)
    const respostaCorreta = questaoRaw.resposta_correta

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoFormatada,
      _rc: Buffer.from(respostaCorreta).toString('base64'),
      anos_disponiveis: anosDisponiveis,
      areas_disponiveis: areasDisponiveis,
      subareas_disponiveis: subareasDisponiveis,
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
