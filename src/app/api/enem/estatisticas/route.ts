import { NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { EstatisticasENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Estatísticas do usuário
// GET /api/enem/estatisticas
// Usa tabelas: respostas_enem, questoes_enem
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

    // Verificar se usuário é da 3ª série do Ensino Médio (ou professor)
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

    // Buscar todas as respostas do usuário
    const { data: respostas, error } = await supabase
      .from('respostas_enem')
      .select('questao_id, correta, tempo_segundos')
      .eq('usuario_id', sessao.userId)

    if (error) {
      console.error('Erro ao buscar estatísticas ENEM:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar estatísticas' },
        { status: 500 }
      )
    }

    // Buscar total de questões disponíveis
    const { data: totalQuestoesData } = await supabase
      .from('questoes_enem')
      .select('id, ano_prova, area')
      .or('anulada.is.null,anulada.eq.false')

    const totalDisponivel = totalQuestoesData?.length || 0

    // Agrupar por ano para estatísticas
    const questoesPorAno: Record<number, number> = {}
    const questoesPorArea: Record<string, number> = {}

    totalQuestoesData?.forEach(q => {
      if (q.ano_prova) {
        questoesPorAno[q.ano_prova] = (questoesPorAno[q.ano_prova] || 0) + 1
      }
      if (q.area) {
        questoesPorArea[q.area] = (questoesPorArea[q.area] || 0) + 1
      }
    })

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
        questoes_disponiveis: totalDisponivel,
        por_ano_disponivel: questoesPorAno,
        por_area_disponivel: questoesPorArea,
      })
    }

    // Calcular estatísticas gerais
    const totalQuestoes = respostas.length
    const totalCorretas = respostas.filter(r => r.correta).length
    const taxaAcerto = Math.round((totalCorretas / totalQuestoes) * 100)
    const tempoTotal = respostas.reduce((acc, r) => acc + (r.tempo_segundos || 0), 0)
    const tempoMedio = Math.round(tempoTotal / totalQuestoes)

    // Buscar dados das questões respondidas para estatísticas por ano
    const questionIds = respostas.map(r => r.questao_id).filter(Boolean)

    const { data: questoesRespondidas } = await supabase
      .from('questoes_enem')
      .select('id, ano_prova, area')
      .in('id', questionIds)

    // Mapear questao_id -> dados da questão
    const questaoMap = new Map<string, { ano: number; area: string }>()
    questoesRespondidas?.forEach(q => {
      questaoMap.set(q.id, { ano: q.ano_prova, area: q.area || 'Geral' })
    })

    // Estatísticas por ano da prova
    const porAno: EstatisticasENEM['por_ano'] = {}
    const respostasPorAno = new Map<number, { total: number; corretas: number }>()

    respostas.forEach(r => {
      const questao = questaoMap.get(r.questao_id)
      if (questao?.ano) {
        const atual = respostasPorAno.get(questao.ano) || { total: 0, corretas: 0 }
        atual.total++
        if (r.correta) atual.corretas++
        respostasPorAno.set(questao.ano, atual)
      }
    })

    respostasPorAno.forEach((stats, ano) => {
      porAno[ano] = {
        total: stats.total,
        corretas: stats.corretas,
        taxa: Math.round((stats.corretas / stats.total) * 100),
      }
    })

    // Estatísticas por área
    const porArea: EstatisticasENEM['por_area'] = {}
    const respostasPorArea = new Map<string, { total: number; corretas: number }>()

    respostas.forEach(r => {
      const questao = questaoMap.get(r.questao_id)
      if (questao?.area) {
        const atual = respostasPorArea.get(questao.area) || { total: 0, corretas: 0 }
        atual.total++
        if (r.correta) atual.corretas++
        respostasPorArea.set(questao.area, atual)
      }
    })

    respostasPorArea.forEach((stats, area) => {
      // Type assertion needed since area comes from DB
      porArea[area as keyof typeof porArea] = {
        total: stats.total,
        corretas: stats.corretas,
        taxa: Math.round((stats.corretas / stats.total) * 100),
      }
    })

    const estatisticas: EstatisticasENEM = {
      total_questoes: totalQuestoes,
      total_corretas: totalCorretas,
      taxa_acerto: taxaAcerto,
      tempo_medio: tempoMedio,
      por_area: porArea,
      por_subarea: {},
      por_ano: porAno,
    }

    return NextResponse.json({
      sucesso: true,
      estatisticas,
      questoes_disponiveis: totalDisponivel,
      por_ano_disponivel: questoesPorAno,
      por_area_disponivel: questoesPorArea,
    })
  } catch (error) {
    console.error('Erro nas estatísticas ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
