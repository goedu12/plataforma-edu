import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AreaENEM, SubareaENEM, QuestaoENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Buscar questão (Híbrido: Local + API enem.dev em tempo real)
// GET /api/enem?area=ciencias-natureza&subarea=fisica&ano=2023
// ═══════════════════════════════════════════════════════════════════════════

const API_ENEM_BASE = 'https://api.enem.dev/v1'

// Mapeamento de disciplinas da API externa para nossa estrutura
const DISCIPLINA_MAP: Record<string, { area: AreaENEM; subarea: SubareaENEM }> = {
  'física': { area: 'ciencias-natureza', subarea: 'fisica' },
  'matemática': { area: 'matematica', subarea: 'matematica' },
  'química': { area: 'ciencias-natureza', subarea: 'quimica' },
  'biologia': { area: 'ciencias-natureza', subarea: 'biologia' },
}

// Buscar questão da API externa enem.dev
async function buscarQuestaoExterna(
  ano: number | null,
  subarea: SubareaENEM | null,
  questoesRespondidasIds: Set<string>
): Promise<QuestaoENEM | null> {
  try {
    // Anos disponíveis na API
    const anosDisponiveis = ano ? [ano] : [2023, 2022, 2021, 2020, 2019, 2018]

    for (const anoAtual of anosDisponiveis) {
      const response = await fetch(
        `${API_ENEM_BASE}/exams/${anoAtual}/questions?limit=100`,
        {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 3600 } // Cache 1 hora
        }
      )

      if (!response.ok) continue

      const data = await response.json()
      const questoes = data.questions || []

      // Filtrar por disciplina se especificado
      const questoesFiltradas = questoes.filter((q: any) => {
        const disciplina = q.discipline?.toLowerCase() || ''

        // Se não tem filtro de subarea, aceita física e matemática
        if (!subarea) {
          return disciplina.includes('física') || disciplina.includes('matemática')
        }

        // Filtrar por subarea específica
        if (subarea === 'fisica') return disciplina.includes('física')
        if (subarea === 'matematica') return disciplina.includes('matemática')
        if (subarea === 'quimica') return disciplina.includes('química')
        if (subarea === 'biologia') return disciplina.includes('biologia')

        return false
      })

      // Filtrar questões não respondidas
      const questoesNaoRespondidas = questoesFiltradas.filter((q: any) => {
        const idApi = `enem-${q.year}-${q.index}`
        return !questoesRespondidasIds.has(idApi)
      })

      if (questoesNaoRespondidas.length === 0) continue

      // Selecionar aleatória
      const questaoExterna = questoesNaoRespondidas[
        Math.floor(Math.random() * questoesNaoRespondidas.length)
      ]

      // Converter para nosso formato
      const disciplina = questaoExterna.discipline?.toLowerCase() || ''
      let area: AreaENEM = 'ciencias-natureza'
      let subareaFinal: SubareaENEM = 'fisica'

      for (const [key, value] of Object.entries(DISCIPLINA_MAP)) {
        if (disciplina.includes(key)) {
          area = value.area
          subareaFinal = value.subarea
          break
        }
      }

      const alternativas = questaoExterna.alternatives || []
      const getAlt = (letra: string) => alternativas.find((a: any) => a.letter === letra)

      // Verificar se tem todas as alternativas
      if (!getAlt('A') || !getAlt('B') || !getAlt('C') || !getAlt('D') || !getAlt('E')) {
        continue
      }

      const questaoConvertida: QuestaoENEM = {
        id: `api-${questaoExterna.year}-${questaoExterna.index}`,
        id_api: `enem-${questaoExterna.year}-${questaoExterna.index}`,
        ano_prova: questaoExterna.year,
        numero_questao: questaoExterna.index,
        area,
        subarea: subareaFinal,
        titulo: questaoExterna.title || null,
        contexto: questaoExterna.context || '',
        comando: questaoExterna.alternativesIntroduction || null,
        imagem_principal: questaoExterna.files?.[0] || null,
        imagens_extras: questaoExterna.files?.slice(1) || [],
        alternativa_a: getAlt('A')?.text || '',
        alternativa_b: getAlt('B')?.text || '',
        alternativa_c: getAlt('C')?.text || '',
        alternativa_d: getAlt('D')?.text || '',
        alternativa_e: getAlt('E')?.text || '',
        imagem_a: getAlt('A')?.file || null,
        imagem_b: getAlt('B')?.file || null,
        imagem_c: getAlt('C')?.file || null,
        imagem_d: getAlt('D')?.file || null,
        imagem_e: getAlt('E')?.file || null,
        resposta_correta: questaoExterna.correctAlternative?.toUpperCase() || 'A',
        fonte: 'ENEM-API',
        status: 'ativa',
      }

      return questaoConvertida
    }

    return null
  } catch (error) {
    console.error('Erro ao buscar questão externa:', error)
    return null
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
    const area = searchParams.get('area') as AreaENEM | null
    const subarea = searchParams.get('subarea') as SubareaENEM | null
    const anoStr = searchParams.get('ano')
    const ano = anoStr ? parseInt(anoStr) : null
    const conteudo = searchParams.get('conteudo')
    const modo = searchParams.get('modo') || 'aleatorio'
    const fonte = searchParams.get('fonte') || 'hibrido' // local, api, hibrido

    const supabase = getSupabaseAdmin()

    // Verificar se usuário é da 3ª série do Ensino Médio
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nivel, ano')
      .eq('id', sessao.userId)
      .single()

    if (!usuario || usuario.nivel !== 'EM' || usuario.ano !== 3) {
      return NextResponse.json({
        sucesso: false,
        status: 'ACESSO_NEGADO',
        erro: 'O Simulado ENEM está disponível apenas para alunos da 3ª série do Ensino Médio.',
      }, { status: 403 })
    }

    // Buscar IDs das questões já respondidas (tanto por id quanto por id_api)
    const { data: respostasUsuario } = await supabase
      .from('respostas_enem')
      .select('questao_id, id_api_questao')
      .eq('usuario_id', sessao.userId)

    const questoesRespondidasIds = new Set<string>()
    respostasUsuario?.forEach(r => {
      if (r.questao_id) questoesRespondidasIds.add(r.questao_id)
      if (r.id_api_questao) questoesRespondidasIds.add(r.id_api_questao)
    })

    // ═══════════════════════════════════════════════════════════════════
    // ETAPA 1: Tentar buscar do banco local
    // ═══════════════════════════════════════════════════════════════════

    let questaoSelecionada: QuestaoENEM | null = null
    let totalLocal = 0

    if (fonte !== 'api') {
      let query = supabase
        .from('questoes_enem')
        .select('*')
        .eq('status', 'ativa')

      if (area) query = query.eq('area', area)
      if (subarea) query = query.eq('subarea', subarea)
      if (ano) query = query.eq('ano_prova', ano)
      if (conteudo) {
        query = query.or(`conteudo_principal.eq.${conteudo},conteudos.cs.{${conteudo}}`)
      }

      const { data: questoes } = await query.limit(500)
      totalLocal = questoes?.length || 0

      // Filtrar não respondidas
      const questoesDisponiveis = (questoes || []).filter(
        q => !questoesRespondidasIds.has(q.id) && !questoesRespondidasIds.has(q.id_api || '')
      )

      if (questoesDisponiveis.length > 0) {
        questaoSelecionada = modo === 'sequencial'
          ? questoesDisponiveis[0]
          : questoesDisponiveis[Math.floor(Math.random() * questoesDisponiveis.length)]
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // ETAPA 2: Se não encontrou localmente, buscar da API externa
    // ═══════════════════════════════════════════════════════════════════

    if (!questaoSelecionada && fonte !== 'local') {
      questaoSelecionada = await buscarQuestaoExterna(ano, subarea, questoesRespondidasIds)
    }

    // Se ainda não encontrou
    if (!questaoSelecionada) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: 'Nenhuma questão disponível com os filtros selecionados.',
        estatisticas: {
          total_local: totalLocal,
          respondidas: questoesRespondidasIds.size,
          restantes: 0,
        },
      })
    }

    // Para questões locais, remover resposta correta
    // Para questões da API externa, enviar resposta_correta (necessário para validação)
    const isExterna = questaoSelecionada.fonte === 'ENEM-API'
    const { resposta_correta, ...questaoPublica } = questaoSelecionada

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoPublica,
      fonte: questaoSelecionada.fonte || 'local',
      // Enviar resposta_correta apenas para questões externas (cliente precisa enviar de volta)
      ...(isExterna && { _rc: resposta_correta }),
      estatisticas: {
        total_local: totalLocal,
        respondidas: questoesRespondidasIds.size,
        restantes: totalLocal - questoesRespondidasIds.size,
      },
      filtros_aplicados: { area, subarea, ano, conteudo },
    })
  } catch (error) {
    console.error('Erro na API ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
