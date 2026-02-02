export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'
import { NOTAS } from '@/types'
import { getPeriodoAtual } from '@/lib/sistema-notas'

// Calcular bimestre atual usando o sistema centralizado
function calcularBimestreAtual(): { bimestre: 1 | 2 | 3 | 4; ano: number; dataInicio: string; dataFim: string } {
  const ano = new Date().getFullYear()
  const periodo = getPeriodoAtual(ano)

  if (periodo) {
    return {
      bimestre: periodo.bimestre,
      ano,
      dataInicio: periodo.config.regular.inicio,
      dataFim: periodo.config.regular.fim,
    }
  }

  // Fallback: se fora do período, usar bimestre 1 do ano atual
  return {
    bimestre: 1,
    ano,
    dataInicio: `${ano}-01-01`,
    dataFim: `${ano}-03-24`,
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const tipo = searchParams.get('tipo') // 'temas_dificeis' | 'notas_turma'
    const componente = searchParams.get('componente') as Componente | null
    const turma = searchParams.get('turma')
    const bimestreParam = searchParams.get('bimestre')
    const anoParam = searchParams.get('ano')

    const supabase = getSupabaseAdmin()

    // Relatório: Temas Difíceis
    if (tipo === 'temas_dificeis') {
      const { data: temasDificeis, error } = await supabase
        .from('questoes')
        .select(`
          componente,
          tema,
          ano,
          respostas!inner (
            correta
          )
        `)
        .eq('status', 'ativa')

      if (error) {
        console.error('Erro ao buscar temas:', error)
        return NextResponse.json(
          { sucesso: false, erro: 'Erro ao buscar dados' },
          { status: 500 }
        )
      }

      // Agrupar por tema e calcular taxa de acerto
      const temasAgrupados: Record<string, {
        componente: string
        tema: string
        ano: number
        total_respostas: number
        acertos: number
      }> = {}

      temasDificeis?.forEach((q: {
        componente: string
        tema: string
        ano: number
        respostas: Array<{ correta: boolean }>
      }) => {
        const key = `${q.componente}-${q.tema}-${q.ano}`
        if (!temasAgrupados[key]) {
          temasAgrupados[key] = {
            componente: q.componente,
            tema: q.tema,
            ano: q.ano,
            total_respostas: 0,
            acertos: 0,
          }
        }
        q.respostas.forEach((r: { correta: boolean }) => {
          temasAgrupados[key].total_respostas++
          if (r.correta) temasAgrupados[key].acertos++
        })
      })

      // Calcular taxa e ordenar por taxa de acerto (menor primeiro)
      const temasComTaxa = Object.values(temasAgrupados)
        .filter(t => t.total_respostas >= 5) // Mínimo de 5 respostas
        .map(t => ({
          ...t,
          taxa_acerto: Math.round((t.acertos / t.total_respostas) * 100),
        }))
        .sort((a, b) => a.taxa_acerto - b.taxa_acerto)
        .slice(0, 15) // Top 15 temas mais difíceis

      // Filtrar por componente se especificado
      const temasFiltrados = componente
        ? temasComTaxa.filter(t => t.componente === componente)
        : temasComTaxa

      return NextResponse.json({
        sucesso: true,
        tipo: 'temas_dificeis',
        temas: temasFiltrados,
      })
    }

    // Relatório: Notas da Turma
    if (tipo === 'notas_turma') {
      const bimestreAtual = calcularBimestreAtual()
      const bimestre = bimestreParam ? parseInt(bimestreParam) as 1 | 2 | 3 | 4 : bimestreAtual.bimestre
      const ano = anoParam ? parseInt(anoParam) : bimestreAtual.ano

      // Recalcular datas se bimestre/ano foi especificado manualmente
      let dataInicio = bimestreAtual.dataInicio
      let dataFim = bimestreAtual.dataFim
      if (bimestreParam || anoParam) {
        const periodo = getPeriodoAtual(ano)
        if (periodo && periodo.bimestre === bimestre) {
          dataInicio = periodo.config.regular.inicio
          dataFim = periodo.config.regular.fim
        } else {
          // Buscar config diretamente para bimestres que não são o atual
          const configAno = {
            2025: {
              1: { inicio: '2025-02-03', fim: '2025-03-24' },
              2: { inicio: '2025-04-04', fim: '2025-06-16' },
              3: { inicio: '2025-08-04', fim: '2025-09-23' },
              4: { inicio: '2025-10-04', fim: '2025-12-04' },
            },
            2026: {
              1: { inicio: '2026-02-02', fim: '2026-03-24' },
              2: { inicio: '2026-04-04', fim: '2026-06-16' },
              3: { inicio: '2026-08-04', fim: '2026-09-23' },
              4: { inicio: '2026-10-04', fim: '2026-12-04' },
            },
          } as Record<number, Record<number, { inicio: string; fim: string }>>
          const cfg = configAno[ano]?.[bimestre]
          if (cfg) {
            dataInicio = cfg.inicio
            dataFim = cfg.fim
          }
        }
      }

      // Buscar estudantes da turma (ou todas se não especificada)
      let queryEstudantes = supabase
        .from('usuarios')
        .select('id, nome, turma, componentes')
        .eq('tipo', 'estudante')
        .eq('ativo', true)

      if (turma) {
        queryEstudantes = queryEstudantes.eq('turma', turma)
      }

      const { data: estudantesRaw } = await queryEstudantes

      // Filtrar apenas turmas do ensino médio (1x, 2x, 3x)
      const isTurmaEM = (t: string) => /^[123]/.test(t)
      const estudantes = (estudantesRaw || []).filter(e => isTurmaEM(e.turma))

      if (!estudantes || estudantes.length === 0) {
        return NextResponse.json({
          sucesso: true,
          tipo: 'notas_turma',
          turma: turma || 'todas',
          bimestre,
          ano,
          notas: [],
        })
      }

      // ═══════════════════════════════════════════════════════════════════
      // OTIMIZAÇÃO: Buscar TODOS os dados em 2 queries bulk ao invés de N*C
      // Antes: 400 queries para 100 alunos * 2 componentes
      // Agora: 2 queries independente do número de alunos
      // ═══════════════════════════════════════════════════════════════════

      const estudanteIds = estudantes.map(e => e.id)

      // Query 1: Todas as respostas de todos os estudantes no período
      const { data: todasRespostas } = await supabase
        .from('respostas')
        .select('usuario_id, componente, correta')
        .in('usuario_id', estudanteIds)
        .eq('modo', 'estudo')
        .gte('criado_em', dataInicio)
        .lte('criado_em', dataFim + 'T23:59:59')

      // Query 2: Todos os dias ativos de todos os estudantes no período
      const { data: todosDiasAtivos } = await supabase
        .from('dias_ativos')
        .select('usuario_id, componente')
        .in('usuario_id', estudanteIds)
        .gte('data', dataInicio)
        .lte('data', dataFim)

      // Agrupar respostas por usuario_id e componente
      const respostasPorUsuario = new Map<string, Map<string, { total: number; corretas: number }>>()
      todasRespostas?.forEach(r => {
        if (!respostasPorUsuario.has(r.usuario_id)) {
          respostasPorUsuario.set(r.usuario_id, new Map())
        }
        const userMap = respostasPorUsuario.get(r.usuario_id)!
        if (!userMap.has(r.componente)) {
          userMap.set(r.componente, { total: 0, corretas: 0 })
        }
        const stats = userMap.get(r.componente)!
        stats.total++
        if (r.correta) stats.corretas++
      })

      // Agrupar dias ativos por usuario_id e componente
      const diasPorUsuario = new Map<string, Map<string, number>>()
      todosDiasAtivos?.forEach(d => {
        if (!diasPorUsuario.has(d.usuario_id)) {
          diasPorUsuario.set(d.usuario_id, new Map())
        }
        const userMap = diasPorUsuario.get(d.usuario_id)!
        userMap.set(d.componente, (userMap.get(d.componente) || 0) + 1)
      })

      // Processar notas de cada estudante (sem queries adicionais)
      const notasEstudantes = estudantes.map(est => {
        const notas: Record<string, {
          questoes_total: number
          questoes_corretas: number
          dias_ativos: number
          nota_desempenho: number
          nota_participacao: number
          nota_frequencia: number
          nota_final: number
          bloqueio: string | null
        }> = {}

        for (const comp of est.componentes as Componente[]) {
          // Buscar dados pré-carregados
          const respostasUser = respostasPorUsuario.get(est.id)?.get(comp) || { total: 0, corretas: 0 }
          const diasAtivosCount = diasPorUsuario.get(est.id)?.get(comp) || 0

          const questoesTotal = respostasUser.total
          const questoesCorretas = respostasUser.corretas

          // Calcular notas
          const taxaAcerto = questoesTotal > 0 ? questoesCorretas / questoesTotal : 0
          const nota_desempenho = Math.min(10, Math.round(taxaAcerto * 100) / 10)
          const participacao = Math.min(1, questoesTotal / NOTAS.META_QUESTOES_BIMESTRE)
          const nota_participacao = Math.round(participacao * 100) / 10
          const frequencia = Math.min(1, diasAtivosCount / NOTAS.META_DIAS_BIMESTRE)
          const nota_frequencia = Math.round(frequencia * 100) / 10

          let nota_calculada =
            nota_desempenho * NOTAS.PESO_DESEMPENHO +
            nota_participacao * NOTAS.PESO_PARTICIPACAO +
            nota_frequencia * NOTAS.PESO_FREQUENCIA

          nota_calculada = Math.round(nota_calculada * 10) / 10

          let bloqueio: string | null = null
          let nota_final = nota_calculada

          if (nota_desempenho < NOTAS.NOTA_MINIMA_DESEMPENHO) {
            bloqueio = 'desempenho_baixo'
            nota_final = Math.min(nota_final, NOTAS.NOTA_MAXIMA_BLOQUEIO)
          } else if (nota_participacao < NOTAS.NOTA_MINIMA_PARTICIPACAO) {
            bloqueio = 'participacao_baixa'
            nota_final = Math.min(nota_final, NOTAS.NOTA_MAXIMA_BLOQUEIO)
          }

          notas[comp] = {
            questoes_total: questoesTotal,
            questoes_corretas: questoesCorretas,
            dias_ativos: diasAtivosCount,
            nota_desempenho,
            nota_participacao,
            nota_frequencia,
            nota_final,
            bloqueio,
          }
        }

        return {
          id: est.id,
          nome: est.nome,
          turma: est.turma,
          componentes: est.componentes,
          notas,
        }
      })

      // Ordenar por nome
      notasEstudantes.sort((a, b) => a.nome.localeCompare(b.nome))

      // Calcular médias da turma
      const mediasTurma: Record<string, { media: number; count: number }> = {}

      notasEstudantes.forEach(est => {
        Object.entries(est.notas).forEach(([comp, nota]) => {
          if (!mediasTurma[comp]) {
            mediasTurma[comp] = { media: 0, count: 0 }
          }
          mediasTurma[comp].media += nota.nota_final
          mediasTurma[comp].count++
        })
      })

      const medias = Object.entries(mediasTurma).map(([comp, data]) => ({
        componente: comp,
        media: data.count > 0 ? Math.round((data.media / data.count) * 10) / 10 : 0,
        total_estudantes: data.count,
      }))

      return NextResponse.json({
        sucesso: true,
        tipo: 'notas_turma',
        turma: turma || 'todas',
        bimestre,
        ano,
        data_inicio: dataInicio,
        data_fim: dataFim,
        notas: notasEstudantes,
        medias_turma: medias,
        meta_questoes: NOTAS.META_QUESTOES_BIMESTRE,
        meta_dias: NOTAS.META_DIAS_BIMESTRE,
      })
    }

    // Se nenhum tipo especificado, retornar lista de relatórios disponíveis
    return NextResponse.json({
      sucesso: true,
      relatorios_disponiveis: [
        {
          tipo: 'temas_dificeis',
          descricao: 'Temas com menor taxa de acerto',
          parametros: ['componente (opcional)'],
        },
        {
          tipo: 'notas_turma',
          descricao: 'Notas bimestrais dos estudantes',
          parametros: ['turma (opcional)', 'componente (opcional)'],
        },
      ],
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
