import { NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { EstatisticasENEM, AreaENEM, SubareaENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Estatísticas do usuário
// GET /api/enem/estatisticas
// ═══════════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar todas as respostas do usuário
    const { data: respostas, error } = await supabase
      .from('respostas_enem')
      .select('correta, tempo_segundos, area, subarea, ano_prova')
      .eq('usuario_id', sessao.userId)

    if (error) {
      console.error('Erro ao buscar estatísticas ENEM:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar estatísticas' },
        { status: 500 }
      )
    }

    // Se não há respostas, retornar estatísticas zeradas
    if (!respostas || respostas.length === 0) {
      return NextResponse.json({
        sucesso: true,
        estatisticas: {
          total_questoes: 0,
          total_corretas: 0,
          taxa_acerto: 0,
          tempo_medio: 0,
          por_area: {},
          por_subarea: {},
          por_ano: {},
        } as EstatisticasENEM,
      })
    }

    // Calcular estatísticas gerais
    const totalQuestoes = respostas.length
    const totalCorretas = respostas.filter(r => r.correta).length
    const taxaAcerto = Math.round((totalCorretas / totalQuestoes) * 100)
    const tempoTotal = respostas.reduce((acc, r) => acc + (r.tempo_segundos || 0), 0)
    const tempoMedio = Math.round(tempoTotal / totalQuestoes)

    // Estatísticas por área
    const porArea: EstatisticasENEM['por_area'] = {}
    const areas: AreaENEM[] = ['ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas']

    for (const area of areas) {
      const respostasArea = respostas.filter(r => r.area === area)
      if (respostasArea.length > 0) {
        const corretasArea = respostasArea.filter(r => r.correta).length
        porArea[area] = {
          total: respostasArea.length,
          corretas: corretasArea,
          taxa: Math.round((corretasArea / respostasArea.length) * 100),
        }
      }
    }

    // Estatísticas por subárea
    const porSubarea: EstatisticasENEM['por_subarea'] = {}
    const subareas: SubareaENEM[] = [
      'fisica', 'quimica', 'biologia', 'matematica',
      'portugues', 'literatura', 'ingles', 'espanhol', 'artes',
      'historia', 'geografia', 'filosofia', 'sociologia'
    ]

    for (const subarea of subareas) {
      const respostasSubarea = respostas.filter(r => r.subarea === subarea)
      if (respostasSubarea.length > 0) {
        const corretasSubarea = respostasSubarea.filter(r => r.correta).length
        porSubarea[subarea] = {
          total: respostasSubarea.length,
          corretas: corretasSubarea,
          taxa: Math.round((corretasSubarea / respostasSubarea.length) * 100),
        }
      }
    }

    // Estatísticas por ano da prova
    const porAno: EstatisticasENEM['por_ano'] = {}
    const anosUnicos = [...new Set(respostas.map(r => r.ano_prova))]

    for (const ano of anosUnicos) {
      const respostasAno = respostas.filter(r => r.ano_prova === ano)
      const corretasAno = respostasAno.filter(r => r.correta).length
      porAno[ano] = {
        total: respostasAno.length,
        corretas: corretasAno,
        taxa: Math.round((corretasAno / respostasAno.length) * 100),
      }
    }

    // Buscar total de questões disponíveis por área
    const { data: totaisArea } = await supabase
      .from('questoes_enem')
      .select('area')
      .eq('status', 'ativa')

    const questoesDisponiveisPorArea: Record<string, number> = {}
    if (totaisArea) {
      for (const q of totaisArea) {
        questoesDisponiveisPorArea[q.area] = (questoesDisponiveisPorArea[q.area] || 0) + 1
      }
    }

    const estatisticas: EstatisticasENEM = {
      total_questoes: totalQuestoes,
      total_corretas: totalCorretas,
      taxa_acerto: taxaAcerto,
      tempo_medio: tempoMedio,
      por_area: porArea,
      por_subarea: porSubarea,
      por_ano: porAno,
    }

    return NextResponse.json({
      sucesso: true,
      estatisticas,
      questoes_disponiveis: questoesDisponiveisPorArea,
    })
  } catch (error) {
    console.error('Erro nas estatísticas ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
