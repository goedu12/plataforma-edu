import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'
import { getPeriodoAtual, calcularNotaNova, calcularPontosTempo } from '@/lib/sistema-notas'

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
      const { bimestre, ano, dataInicio, dataFim } = calcularBimestreAtual()

      // Buscar estudantes da turma (ou todas se não especificada)
      let queryEstudantes = supabase
        .from('usuarios')
        .select('id, nome, turma, componentes')
        .eq('tipo', 'estudante')
        .eq('ativo', true)

      if (turma) {
        queryEstudantes = queryEstudantes.eq('turma', turma)
      }

      const { data: estudantes } = await queryEstudantes

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

      // Para cada estudante, calcular notas usando FÓRMULA v2
      const notasEstudantes = await Promise.all(estudantes.map(async (est) => {
        const notas: Record<string, {
          // Dados brutos
          acertos_estudo: number
          acertos_revisao: number
          acertos_desafio: number
          tempo_uso_horas: number
          dias_ativos: number
          // Fórmula v2
          nota_acertos: number   // máx 6.0
          nota_tempo: number     // máx 4.0
          nota_final: number     // máx 10.0
          detalhes: { estudo: number; revisao: number; desafio: number }
        }> = {}

        for (const comp of est.componentes as Componente[]) {
          // Buscar respostas modo ESTUDO (acertos + tempo)
          const { data: respostasEstudo } = await supabase
            .from('respostas')
            .select('correta, tempo_segundos')
            .eq('usuario_id', est.id)
            .eq('componente', comp)
            .eq('modo', 'estudo')
            .gte('criado_em', dataInicio)
            .lte('criado_em', dataFim + 'T23:59:59')

          // Buscar respostas modo REVISÃO (apenas acertos corretos)
          const { data: respostasRevisao } = await supabase
            .from('respostas')
            .select('tempo_segundos')
            .eq('usuario_id', est.id)
            .eq('componente', comp)
            .eq('modo', 'revisao')
            .eq('correta', true)
            .gte('criado_em', dataInicio)
            .lte('criado_em', dataFim + 'T23:59:59')

          // Buscar respostas modo DESAFIO (apenas acertos corretos)
          const { data: respostasDesafio } = await supabase
            .from('respostas')
            .select('tempo_segundos')
            .eq('usuario_id', est.id)
            .eq('componente', comp)
            .eq('modo', 'desafio')
            .eq('correta', true)
            .gte('criado_em', dataInicio)
            .lte('criado_em', dataFim + 'T23:59:59')

          // Buscar dias ativos
          const { data: diasAtivos } = await supabase
            .from('dias_ativos')
            .select('id')
            .eq('usuario_id', est.id)
            .eq('componente', comp)
            .gte('data', dataInicio)
            .lte('data', dataFim)

          // Contadores
          const acertosEstudo = respostasEstudo?.filter(r => r.correta).length || 0
          const acertosRevisao = respostasRevisao?.length || 0
          const acertosDesafio = respostasDesafio?.length || 0
          const diasAtivosCount = diasAtivos?.length || 0

          // Tempo total em horas
          const tempoEstudo = respostasEstudo?.reduce((acc, r) => acc + (r.tempo_segundos || 0), 0) || 0
          const tempoRevisao = respostasRevisao?.reduce((acc, r) => acc + (r.tempo_segundos || 0), 0) || 0
          const tempoDesafio = respostasDesafio?.reduce((acc, r) => acc + (r.tempo_segundos || 0), 0) || 0
          const tempoTotalHoras = (tempoEstudo + tempoRevisao + tempoDesafio) / 3600

          // FÓRMULA v2: Usar a mesma função do sistema de notas
          const { notaAcertos, notaTempo, notaFinal, detalhes } = calcularNotaNova(
            acertosEstudo,
            acertosRevisao,
            acertosDesafio,
            tempoTotalHoras
          )

          notas[comp] = {
            acertos_estudo: acertosEstudo,
            acertos_revisao: acertosRevisao,
            acertos_desafio: acertosDesafio,
            tempo_uso_horas: Math.round(tempoTotalHoras * 10) / 10,
            dias_ativos: diasAtivosCount,
            nota_acertos: notaAcertos,
            nota_tempo: notaTempo,
            nota_final: notaFinal,
            detalhes,
          }
        }

        return {
          id: est.id,
          nome: est.nome,
          turma: est.turma,
          componentes: est.componentes,
          notas,
        }
      }))

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
        // Fórmula v2 info
        formula: {
          descricao: 'NOTA = Pontos Acertos (máx 6.0) + Pontos Tempo (máx 4.0)',
          acertos: { estudo: 0.04, revisao: 0.02, desafio: 0.01 },
          tempo: { '2h': 1, '3h': 2, '4h': 3, '5h+': 4 },
        },
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
