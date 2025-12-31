import { NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar todos os estudantes
    const { data: estudantes } = await supabase
      .from('usuarios')
      .select('*')
      .eq('tipo', 'estudante')
      .eq('ativo', true)

    if (!estudantes) {
      return NextResponse.json({
        sucesso: true,
        fisica: { total_estudantes: 0, total_respostas: 0, taxa_acerto: 0, ativos_semana: 0, media_pontos: 0 },
        matematica: { total_estudantes: 0, total_respostas: 0, taxa_acerto: 0, ativos_semana: 0, media_pontos: 0 },
        alertas: [],
        desempenho_turmas: [],
      })
    }

    const hoje = new Date()
    const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Estatísticas de Física
    const estudantesFisica = estudantes.filter(e => e.componentes.includes('fisica'))
    const fisicaStats = {
      total_estudantes: estudantesFisica.length,
      total_respostas: estudantesFisica.reduce((acc, e) => acc + (e.fis_questoes_total || 0), 0),
      taxa_acerto: 0,
      ativos_semana: estudantesFisica.filter(e => e.fis_ultimo_estudo && e.fis_ultimo_estudo >= seteDiasAtras).length,
      media_pontos: 0,
    }

    const totalCorretasFis = estudantesFisica.reduce((acc, e) => acc + (e.fis_questoes_corretas || 0), 0)
    if (fisicaStats.total_respostas > 0) {
      fisicaStats.taxa_acerto = Math.round((totalCorretasFis / fisicaStats.total_respostas) * 100)
    }
    if (estudantesFisica.length > 0) {
      fisicaStats.media_pontos = Math.round(estudantesFisica.reduce((acc, e) => acc + (e.fis_pontos || 0), 0) / estudantesFisica.length)
    }

    // Estatísticas de Matemática
    const estudantesMatematica = estudantes.filter(e => e.componentes.includes('matematica'))
    const matematicaStats = {
      total_estudantes: estudantesMatematica.length,
      total_respostas: estudantesMatematica.reduce((acc, e) => acc + (e.mat_questoes_total || 0), 0),
      taxa_acerto: 0,
      ativos_semana: estudantesMatematica.filter(e => e.mat_ultimo_estudo && e.mat_ultimo_estudo >= seteDiasAtras).length,
      media_pontos: 0,
    }

    const totalCorretasMat = estudantesMatematica.reduce((acc, e) => acc + (e.mat_questoes_corretas || 0), 0)
    if (matematicaStats.total_respostas > 0) {
      matematicaStats.taxa_acerto = Math.round((totalCorretasMat / matematicaStats.total_respostas) * 100)
    }
    if (estudantesMatematica.length > 0) {
      matematicaStats.media_pontos = Math.round(estudantesMatematica.reduce((acc, e) => acc + (e.mat_pontos || 0), 0) / estudantesMatematica.length)
    }

    // Alertas
    const alertas: Array<{
      usuario_id: string
      nome: string
      turma: string
      componente: string
      tipo: string
      descricao: string
    }> = []

    estudantes.forEach(e => {
      // Alertas de física
      if (e.componentes.includes('fisica')) {
        // Inativo há mais de 7 dias
        if (e.fis_ultimo_estudo && e.fis_ultimo_estudo < seteDiasAtras) {
          const diasInativo = Math.floor((hoje.getTime() - new Date(e.fis_ultimo_estudo).getTime()) / (1000 * 60 * 60 * 24))
          alertas.push({
            usuario_id: e.id,
            nome: e.nome,
            turma: e.turma,
            componente: 'fisica',
            tipo: 'inativo',
            descricao: `${diasInativo} dias sem estudar Física`,
          })
        }

        // Baixo desempenho
        if (e.fis_questoes_total >= 10) {
          const taxa = (e.fis_questoes_corretas / e.fis_questoes_total) * 100
          if (taxa < 40) {
            alertas.push({
              usuario_id: e.id,
              nome: e.nome,
              turma: e.turma,
              componente: 'fisica',
              tipo: 'baixo_desempenho',
              descricao: `Taxa de acerto ${Math.round(taxa)}% em Física`,
            })
          }
        }
      }

      // Alertas de matemática
      if (e.componentes.includes('matematica')) {
        if (e.mat_ultimo_estudo && e.mat_ultimo_estudo < seteDiasAtras) {
          const diasInativo = Math.floor((hoje.getTime() - new Date(e.mat_ultimo_estudo).getTime()) / (1000 * 60 * 60 * 24))
          alertas.push({
            usuario_id: e.id,
            nome: e.nome,
            turma: e.turma,
            componente: 'matematica',
            tipo: 'inativo',
            descricao: `${diasInativo} dias sem estudar Matemática`,
          })
        }

        if (e.mat_questoes_total >= 10) {
          const taxa = (e.mat_questoes_corretas / e.mat_questoes_total) * 100
          if (taxa < 40) {
            alertas.push({
              usuario_id: e.id,
              nome: e.nome,
              turma: e.turma,
              componente: 'matematica',
              tipo: 'baixo_desempenho',
              descricao: `Taxa de acerto ${Math.round(taxa)}% em Matemática`,
            })
          }
        }
      }
    })

    // Desempenho por turma
    const turmas = [...new Set(estudantes.map(e => e.turma))]
    const desempenho_turmas = turmas.flatMap(turma => {
      const dasTurma = estudantes.filter(e => e.turma === turma)
      const result = []

      // Física
      const comFisica = dasTurma.filter(e => e.componentes.includes('fisica'))
      if (comFisica.length > 0) {
        const totalResp = comFisica.reduce((a, e) => a + (e.fis_questoes_total || 0), 0)
        const totalCorr = comFisica.reduce((a, e) => a + (e.fis_questoes_corretas || 0), 0)
        result.push({
          turma,
          componente: 'fisica',
          media_acerto: totalResp > 0 ? Math.round((totalCorr / totalResp) * 100) : 0,
          total_estudantes: comFisica.length,
        })
      }

      // Matemática
      const comMat = dasTurma.filter(e => e.componentes.includes('matematica'))
      if (comMat.length > 0) {
        const totalResp = comMat.reduce((a, e) => a + (e.mat_questoes_total || 0), 0)
        const totalCorr = comMat.reduce((a, e) => a + (e.mat_questoes_corretas || 0), 0)
        result.push({
          turma,
          componente: 'matematica',
          media_acerto: totalResp > 0 ? Math.round((totalCorr / totalResp) * 100) : 0,
          total_estudantes: comMat.length,
        })
      }

      return result
    })

    return NextResponse.json({
      sucesso: true,
      fisica: fisicaStats,
      matematica: matematicaStats,
      alertas: alertas.slice(0, 10), // Limitar a 10 alertas
      desempenho_turmas,
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
