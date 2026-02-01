export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { ALERTAS_CONFIG } from '@/lib/utils'
import type { Componente, AlertaEstudante, DesempenhoTurma, EstatisticasComponente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES DE CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

const MAX_ALERTAS = 10
const CAMPOS_NECESSARIOS = [
  'id', 'nome', 'turma', 'componentes',
  'fis_pontos', 'fis_questoes_total', 'fis_questoes_corretas', 'fis_ultimo_estudo',
  'mat_pontos', 'mat_questoes_total', 'mat_questoes_corretas', 'mat_ultimo_estudo'
] as const

// Tipos de alerta
type TipoAlerta = 'inativo' | 'baixo_desempenho'

export async function GET(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    // Suporte a paginação (opcional)
    const searchParams = request.nextUrl.searchParams
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = Math.min(parseInt(searchParams.get('limite') || '500'), 1000)
    const offset = (pagina - 1) * limite

    const supabase = getSupabaseAdmin()

    // Buscar estudantes com campos específicos (evita SELECT *)
    // Usa paginação para evitar sobrecarga
    const { data: estudantes, count, error } = await supabase
      .from('usuarios')
      .select(CAMPOS_NECESSARIOS.join(','), { count: 'exact' })
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .range(offset, offset + limite - 1)

    if (error) {
      logger.error('Erro ao buscar estudantes:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar dados' },
        { status: 500 }
      )
    }

    if (!estudantes || estudantes.length === 0) {
      return NextResponse.json({
        sucesso: true,
        fisica: criarEstatisticasVazias(),
        matematica: criarEstatisticasVazias(),
        alertas: [],
        desempenho_turmas: [],
        paginacao: { pagina, limite, total: 0 },
      })
    }

    const hoje = new Date()
    const seteDiasAtras = new Date(hoje.getTime() - ALERTAS_CONFIG.DIAS_INATIVIDADE_ALERTA * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    // Cast para o tipo correto (Supabase retorna tipo genérico)
    const estudantesTyped = estudantes as unknown as EstudanteData[]

    // Calcular estatísticas por componente
    const fisicaStats = calcularEstatisticasComponente(estudantesTyped, 'fisica', seteDiasAtras)
    const matematicaStats = calcularEstatisticasComponente(estudantesTyped, 'matematica', seteDiasAtras)

    // Gerar alertas
    const alertas = gerarAlertas(estudantesTyped, seteDiasAtras, hoje)

    // Calcular desempenho por turma
    const desempenho_turmas = calcularDesempenhoPorTurma(estudantesTyped)

    // Calcular totais únicos (sem duplicar alunos com múltiplos componentes)
    const totalAlunosUnicos = estudantesTyped.length
    const ativosUnicosSet = new Set<string>()
    estudantesTyped.forEach(e => {
      const fisAtivo = e.fis_ultimo_estudo && e.fis_ultimo_estudo >= seteDiasAtras
      const matAtivo = e.mat_ultimo_estudo && e.mat_ultimo_estudo >= seteDiasAtras
      if (fisAtivo || matAtivo) {
        ativosUnicosSet.add(e.id)
      }
    })
    const ativosUnicos = ativosUnicosSet.size

    return NextResponse.json({
      sucesso: true,
      fisica: fisicaStats,
      matematica: matematicaStats,
      alertas: alertas.slice(0, MAX_ALERTAS),
      desempenho_turmas,
      // Totais únicos para evitar contagem duplicada no dashboard
      total_alunos_unicos: totalAlunosUnicos,
      ativos_unicos: ativosUnicos,
      paginacao: {
        pagina,
        limite,
        total: count || estudantes.length,
      },
    })
  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

function criarEstatisticasVazias(): EstatisticasComponente {
  return {
    total_estudantes: 0,
    total_respostas: 0,
    taxa_acerto: 0,
    ativos_semana: 0,
    media_pontos: 0,
  }
}

interface EstudanteData {
  id: string
  nome: string
  turma: string
  componentes: Componente[]
  fis_pontos: number
  fis_questoes_total: number
  fis_questoes_corretas: number
  fis_ultimo_estudo: string | null
  mat_pontos: number
  mat_questoes_total: number
  mat_questoes_corretas: number
  mat_ultimo_estudo: string | null
}

function calcularEstatisticasComponente(
  estudantes: EstudanteData[],
  componente: Componente,
  seteDiasAtras: string
): EstatisticasComponente {
  const ehFisica = componente === 'fisica'
  const estudantesComponente = estudantes.filter(e => e.componentes.includes(componente))

  if (estudantesComponente.length === 0) {
    return criarEstatisticasVazias()
  }

  const totalRespostas = estudantesComponente.reduce(
    (acc, e) => acc + (ehFisica ? e.fis_questoes_total : e.mat_questoes_total) || 0,
    0
  )

  const totalCorretas = estudantesComponente.reduce(
    (acc, e) => acc + (ehFisica ? e.fis_questoes_corretas : e.mat_questoes_corretas) || 0,
    0
  )

  const ativosSemana = estudantesComponente.filter(e => {
    const ultimoEstudo = ehFisica ? e.fis_ultimo_estudo : e.mat_ultimo_estudo
    return ultimoEstudo && ultimoEstudo >= seteDiasAtras
  }).length

  const totalPontos = estudantesComponente.reduce(
    (acc, e) => acc + (ehFisica ? e.fis_pontos : e.mat_pontos) || 0,
    0
  )

  return {
    total_estudantes: estudantesComponente.length,
    total_respostas: totalRespostas,
    taxa_acerto: totalRespostas > 0 ? Math.round((totalCorretas / totalRespostas) * 100) : 0,
    ativos_semana: ativosSemana,
    media_pontos: Math.round(totalPontos / estudantesComponente.length),
  }
}

function gerarAlertas(
  estudantes: EstudanteData[],
  seteDiasAtras: string,
  hoje: Date
): AlertaEstudante[] {
  const alertas: AlertaEstudante[] = []

  for (const e of estudantes) {
    // Alertas de física
    if (e.componentes.includes('fisica')) {
      gerarAlertasComponente(alertas, e, 'fisica', seteDiasAtras, hoje)
    }

    // Alertas de matemática
    if (e.componentes.includes('matematica')) {
      gerarAlertasComponente(alertas, e, 'matematica', seteDiasAtras, hoje)
    }
  }

  return alertas
}

function gerarAlertasComponente(
  alertas: AlertaEstudante[],
  estudante: EstudanteData,
  componente: Componente,
  seteDiasAtras: string,
  hoje: Date
): void {
  const ehFisica = componente === 'fisica'
  const ultimoEstudo = ehFisica ? estudante.fis_ultimo_estudo : estudante.mat_ultimo_estudo
  const questoesTotal = ehFisica ? estudante.fis_questoes_total : estudante.mat_questoes_total
  const questoesCorretas = ehFisica ? estudante.fis_questoes_corretas : estudante.mat_questoes_corretas
  const nomeComponente = ehFisica ? 'Física' : 'Matemática'

  // Alerta de inatividade
  if (ultimoEstudo && ultimoEstudo < seteDiasAtras) {
    const diasInativo = Math.floor(
      (hoje.getTime() - new Date(ultimoEstudo).getTime()) / (1000 * 60 * 60 * 24)
    )
    alertas.push({
      usuario_id: estudante.id,
      nome: estudante.nome,
      turma: estudante.turma,
      componente,
      tipo: 'inativo' as TipoAlerta,
      descricao: `${diasInativo} dias sem estudar ${nomeComponente}`,
    })
  }

  // Alerta de baixo desempenho
  if (questoesTotal >= ALERTAS_CONFIG.MIN_QUESTOES_PARA_ALERTA) {
    const taxa = (questoesCorretas / questoesTotal) * 100
    if (taxa < ALERTAS_CONFIG.TAXA_ACERTO_MINIMA) {
      alertas.push({
        usuario_id: estudante.id,
        nome: estudante.nome,
        turma: estudante.turma,
        componente,
        tipo: 'baixo_desempenho' as TipoAlerta,
        descricao: `Taxa de acerto ${Math.round(taxa)}% em ${nomeComponente}`,
      })
    }
  }
}

function calcularDesempenhoPorTurma(estudantes: EstudanteData[]): DesempenhoTurma[] {
  // Filtrar apenas turmas do ensino médio (1x, 2x, 3x)
  const isTurmaEM = (t: string) => /^[123]/.test(t)
  const turmas = [...new Set(estudantes.filter(e => isTurmaEM(e.turma)).map(e => e.turma))]

  return turmas.flatMap(turma => {
    const dasTurma = estudantes.filter(e => e.turma === turma)
    const result: DesempenhoTurma[] = []

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
}
