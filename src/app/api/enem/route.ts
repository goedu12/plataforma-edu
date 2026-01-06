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
// A API usa os nomes das áreas do ENEM, não disciplinas específicas
const DISCIPLINA_TO_AREA: Record<string, { area: AreaENEM; subarea: SubareaENEM }> = {
  // Ciências da Natureza - a API pode retornar diferentes formatos
  'ciências da natureza': { area: 'ciencias-natureza', subarea: 'fisica' },
  'ciencias da natureza': { area: 'ciencias-natureza', subarea: 'fisica' },
  'natureza': { area: 'ciencias-natureza', subarea: 'fisica' },
  'física': { area: 'ciencias-natureza', subarea: 'fisica' },
  'fisica': { area: 'ciencias-natureza', subarea: 'fisica' },
  'química': { area: 'ciencias-natureza', subarea: 'quimica' },
  'quimica': { area: 'ciencias-natureza', subarea: 'quimica' },
  'biologia': { area: 'ciencias-natureza', subarea: 'biologia' },
  // Matemática
  'matemática': { area: 'matematica', subarea: 'matematica' },
  'matematica': { area: 'matematica', subarea: 'matematica' },
  'matemática e suas tecnologias': { area: 'matematica', subarea: 'matematica' },
}

// Disciplinas que queremos buscar (Física e Matemática para Studão)
const DISCIPLINAS_ACEITAS = [
  'ciências da natureza',
  'ciencias da natureza',
  'natureza',
  'física',
  'fisica',
  'matemática',
  'matematica',
  'matemática e suas tecnologias',
]

// Buscar questão da API externa enem.dev
async function buscarQuestaoExterna(
  ano: number | null,
  subarea: SubareaENEM | null,
  questoesRespondidasIds: Set<string>
): Promise<QuestaoENEM | null> {
  try {
    // Anos disponíveis na API (2009-2023)
    const anosDisponiveis = ano
      ? [ano]
      : [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016]

    for (const anoAtual of anosDisponiveis) {
      console.log(`[ENEM API] Buscando questões de ${anoAtual}...`)

      const response = await fetch(
        `${API_ENEM_BASE}/exams/${anoAtual}/questions?limit=200`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Studao-Platform/1.0',
          },
          next: { revalidate: 3600 } // Cache 1 hora
        }
      )

      if (!response.ok) {
        console.warn(`[ENEM API] Erro ${response.status} ao buscar ano ${anoAtual}`)
        continue
      }

      const data = await response.json()
      const questoes = data.questions || []

      console.log(`[ENEM API] ${anoAtual}: ${questoes.length} questões encontradas`)

      if (questoes.length === 0) continue

      // Filtrar por disciplinas aceitas
      const questoesFiltradas = questoes.filter((q: any) => {
        const disciplina = (q.discipline || '').toLowerCase().trim()

        // Verificar se é uma disciplina que aceitamos
        const aceita = DISCIPLINAS_ACEITAS.some(d =>
          disciplina.includes(d) || d.includes(disciplina)
        )

        if (!aceita) return false

        // Se tem filtro de subarea, filtrar mais especificamente
        if (subarea) {
          if (subarea === 'fisica') {
            return disciplina.includes('natureza') || disciplina.includes('física') || disciplina.includes('fisica')
          }
          if (subarea === 'matematica') {
            return disciplina.includes('matemática') || disciplina.includes('matematica')
          }
          if (subarea === 'quimica') {
            return disciplina.includes('química') || disciplina.includes('quimica')
          }
          if (subarea === 'biologia') {
            return disciplina.includes('biologia')
          }
        }

        return true
      })

      console.log(`[ENEM API] ${anoAtual}: ${questoesFiltradas.length} após filtro de disciplina`)

      if (questoesFiltradas.length === 0) continue

      // Filtrar questões não respondidas
      const questoesNaoRespondidas = questoesFiltradas.filter((q: any) => {
        const idApi = `enem-${q.year}-${q.index}`
        return !questoesRespondidasIds.has(idApi)
      })

      console.log(`[ENEM API] ${anoAtual}: ${questoesNaoRespondidas.length} não respondidas`)

      if (questoesNaoRespondidas.length === 0) continue

      // Selecionar aleatória
      const questaoExterna = questoesNaoRespondidas[
        Math.floor(Math.random() * questoesNaoRespondidas.length)
      ]

      // Converter para nosso formato
      const disciplina = (questaoExterna.discipline || '').toLowerCase().trim()
      let area: AreaENEM = 'ciencias-natureza'
      let subareaFinal: SubareaENEM = 'fisica'

      // Determinar área e subárea
      if (disciplina.includes('matemática') || disciplina.includes('matematica')) {
        area = 'matematica'
        subareaFinal = 'matematica'
      } else {
        // Ciências da Natureza - usar física como padrão
        area = 'ciencias-natureza'
        subareaFinal = 'fisica'
      }

      const alternativas = questaoExterna.alternatives || []
      const getAlt = (letra: string) => alternativas.find((a: any) => a.letter === letra)

      // Verificar se tem todas as alternativas
      const altA = getAlt('A')
      const altB = getAlt('B')
      const altC = getAlt('C')
      const altD = getAlt('D')
      const altE = getAlt('E')

      if (!altA || !altB || !altC || !altD || !altE) {
        console.warn(`[ENEM API] Questão ${questaoExterna.year}-${questaoExterna.index} sem todas alternativas`)
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
        // Imagens - a API retorna array de URLs
        imagem_principal: questaoExterna.files?.[0] || null,
        imagens_extras: questaoExterna.files?.slice(1) || [],
        // Alternativas
        alternativa_a: altA.text || '',
        alternativa_b: altB.text || '',
        alternativa_c: altC.text || '',
        alternativa_d: altD.text || '',
        alternativa_e: altE.text || '',
        // Imagens das alternativas
        imagem_a: altA.file || null,
        imagem_b: altB.file || null,
        imagem_c: altC.file || null,
        imagem_d: altD.file || null,
        imagem_e: altE.file || null,
        resposta_correta: (questaoExterna.correctAlternative || 'A').toUpperCase(),
        fonte: 'ENEM-API',
        status: 'ativa',
      }

      console.log(`[ENEM API] Retornando questão ${questaoConvertida.id}`)
      return questaoConvertida
    }

    console.log('[ENEM API] Nenhuma questão encontrada após verificar todos os anos')
    return null
  } catch (error) {
    console.error('[ENEM API] Erro ao buscar questão externa:', error)
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
      console.log('[ENEM] Buscando da API externa...')
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
