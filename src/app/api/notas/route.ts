import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA DE NOTAS 2025
// Baseado em PARTICIPAÇÃO (questões respondidas) + BÔNUS DE FREQUÊNCIA
// ═══════════════════════════════════════════════════════════════════════════

// Configuração dos bimestres 2025
const CONFIG_BIMESTRES = {
  2025: {
    1: {
      regular: { inicio: '2025-02-03', fim: '2025-03-24', meta: 105 },
      recuperacao: { inicio: '2025-03-25', fim: '2025-04-03' },
    },
    2: {
      regular: { inicio: '2025-04-04', fim: '2025-06-16', meta: 150 },
      recuperacao: { inicio: '2025-06-17', fim: '2025-06-26' },
    },
    3: {
      regular: { inicio: '2025-08-04', fim: '2025-09-23', meta: 105 },
      recuperacao: { inicio: '2025-09-24', fim: '2025-10-03' },
    },
    4: {
      regular: { inicio: '2025-10-04', fim: '2025-12-04', meta: 135 },
      recuperacao: { inicio: '2025-12-05', fim: '2025-12-15' },
    },
  },
}

// Função para obter segunda-feira da semana
function getSegundaFeira(data: Date = new Date()): string {
  const d = new Date(data)
  const dia = d.getDay()
  const diff = d.getDate() - dia + (dia === 0 ? -6 : 1) // Ajusta para segunda
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

// Função para calcular bônus de frequência
function calcularBonusFrequencia(diasAtivos: number): number {
  if (diasAtivos < 5) return 0.0
  if (diasAtivos < 10) return 0.5
  if (diasAtivos < 15) return 1.0
  if (diasAtivos < 20) return 1.5
  return 2.0
}

// Função para obter período atual
function getPeriodoAtual(ano: number = 2025): {
  bimestre: 1 | 2 | 3 | 4
  tipo: 'regular' | 'recuperacao' | 'ferias'
  dataInicio: string
  dataFim: string
  meta?: number
  diasRestantes: number
} | null {
  const hoje = new Date().toISOString().split('T')[0]
  const config = CONFIG_BIMESTRES[ano as keyof typeof CONFIG_BIMESTRES]

  if (!config) return null

  for (const bim of [1, 2, 3, 4] as const) {
    const bimConfig = config[bim]

    // Verifica período regular
    if (hoje >= bimConfig.regular.inicio && hoje <= bimConfig.regular.fim) {
      const diasRestantes = Math.ceil(
        (new Date(bimConfig.regular.fim).getTime() - new Date(hoje).getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        bimestre: bim,
        tipo: 'regular',
        dataInicio: bimConfig.regular.inicio,
        dataFim: bimConfig.regular.fim,
        meta: bimConfig.regular.meta,
        diasRestantes,
      }
    }

    // Verifica recuperação
    if (hoje >= bimConfig.recuperacao.inicio && hoje <= bimConfig.recuperacao.fim) {
      const diasRestantes = Math.ceil(
        (new Date(bimConfig.recuperacao.fim).getTime() - new Date(hoje).getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        bimestre: bim,
        tipo: 'recuperacao',
        dataInicio: bimConfig.recuperacao.inicio,
        dataFim: bimConfig.recuperacao.fim,
        diasRestantes,
      }
    }
  }

  // Férias ou fora do período
  return null
}

// Função para calcular nota do período regular
function calcularNotaRegular(
  questoesRespondidas: number,
  metaQuestoes: number,
  diasAtivos: number
): {
  nota_base: number
  bonus_frequencia: number
  nota_final: number
} {
  // Nota base = (questões respondidas / meta) × 10, máximo 10
  const nota_base = Math.min((questoesRespondidas / Math.max(metaQuestoes, 1)) * 10, 10)

  // Bônus de frequência
  const bonus_frequencia = calcularBonusFrequencia(diasAtivos)

  // Nota final = min(base + bônus, 10)
  const nota_final = Math.min(nota_base + bonus_frequencia, 10)

  return {
    nota_base: Math.round(nota_base * 100) / 100,
    bonus_frequencia,
    nota_final: Math.round(nota_final * 100) / 100,
  }
}

// Função para calcular nota da recuperação
function calcularNotaRecuperacao(
  questoesFeitas: number,
  questoesPendentes: number
): number {
  // Só contam questões até o limite de pendentes
  const questoesContam = Math.min(questoesFeitas, questoesPendentes)

  // Nota = (feitas/pendentes) × 6, máximo 6.0
  return Math.round(Math.min((questoesContam / Math.max(questoesPendentes, 1)) * 6, 6) * 100) / 100
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
    const componente = searchParams.get('componente') as Componente
    const bimestreParam = searchParams.get('bimestre')
    const anoParam = searchParams.get('ano')

    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente inválido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const ano = anoParam ? parseInt(anoParam) : 2025

    // Obter período atual
    const periodoAtual = getPeriodoAtual(ano)

    // Usar bimestre do parâmetro ou do período atual
    const bimestre = bimestreParam
      ? (parseInt(bimestreParam) as 1 | 2 | 3 | 4)
      : periodoAtual?.bimestre || 1

    const config = CONFIG_BIMESTRES[ano as keyof typeof CONFIG_BIMESTRES]?.[bimestre]
    if (!config) {
      return NextResponse.json(
        { sucesso: false, erro: 'Configuração de bimestre não encontrada' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BUSCAR DADOS DO PERÍODO REGULAR
    // ═══════════════════════════════════════════════════════════════════════

    // Buscar respostas do período regular (modo estudo)
    const { data: respostasRegular } = await supabase
      .from('respostas')
      .select('id, criado_em')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('modo', 'estudo')
      .gte('criado_em', config.regular.inicio)
      .lte('criado_em', config.regular.fim + 'T23:59:59')

    const questoesRespondidas = respostasRegular?.length || 0

    // Contar dias ativos (datas distintas com respostas)
    const diasAtivosSet = new Set(
      respostasRegular?.map(r => r.criado_em.split('T')[0]) || []
    )
    const diasAtivos = diasAtivosSet.size

    // Calcular nota do período regular
    const notaRegular = calcularNotaRegular(
      questoesRespondidas,
      config.regular.meta,
      diasAtivos
    )

    // ═══════════════════════════════════════════════════════════════════════
    // VERIFICAR RECUPERAÇÃO
    // ═══════════════════════════════════════════════════════════════════════

    let emRecuperacao = false
    let questoesPendentes = 0
    let questoesRecuperacao = 0
    let notaRecuperacao: number | null = null

    // Verifica se está em período de recuperação ou se precisa de recuperação
    const hojeBR = new Date().toISOString().split('T')[0]
    const periodoRegularEncerrou = hojeBR > config.regular.fim
    const emPeriodoRecuperacao =
      hojeBR >= config.recuperacao.inicio && hojeBR <= config.recuperacao.fim

    if (periodoRegularEncerrou && notaRegular.nota_final < 6.0) {
      emRecuperacao = true
      questoesPendentes = config.regular.meta - questoesRespondidas

      // Buscar respostas da recuperação
      const { data: respostasRecup } = await supabase
        .from('respostas')
        .select('id')
        .eq('usuario_id', sessao.userId)
        .eq('componente', componente)
        .eq('modo', 'estudo')
        .gte('criado_em', config.recuperacao.inicio)
        .lte('criado_em', config.recuperacao.fim + 'T23:59:59')

      questoesRecuperacao = respostasRecup?.length || 0
      notaRecuperacao = calcularNotaRecuperacao(questoesRecuperacao, questoesPendentes)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONTROLE SEMANAL (limite de 15 questões)
    // ═══════════════════════════════════════════════════════════════════════

    const segundaFeira = getSegundaFeira()
    const domingoFim = new Date(segundaFeira)
    domingoFim.setDate(domingoFim.getDate() + 6)
    const domingoFimStr = domingoFim.toISOString().split('T')[0]

    // Buscar questões da semana atual
    const { data: questoesSemana } = await supabase
      .from('respostas')
      .select('id')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('modo', 'estudo')
      .gte('criado_em', segundaFeira)
      .lte('criado_em', domingoFimStr + 'T23:59:59')

    const questoesSemanaAtual = questoesSemana?.length || 0
    const limiteSemanal = emRecuperacao || emPeriodoRecuperacao ? null : 15
    const podeResponder = emRecuperacao || emPeriodoRecuperacao || questoesSemanaAtual < 15

    // ═══════════════════════════════════════════════════════════════════════
    // DETERMINAR NOTA FINAL E STATUS
    // ═══════════════════════════════════════════════════════════════════════

    let notaFinal = notaRegular.nota_final
    let status: 'em_andamento' | 'recuperacao' | 'aprovado' | 'reprovado' = 'em_andamento'

    if (emRecuperacao && notaRecuperacao !== null) {
      notaFinal = notaRecuperacao
      status = 'recuperacao'

      // Se recuperação encerrou
      if (hojeBR > config.recuperacao.fim) {
        status = notaRecuperacao >= 6.0 ? 'aprovado' : 'reprovado'
      }
    } else if (periodoRegularEncerrou && !emRecuperacao) {
      status = notaRegular.nota_final >= 6.0 ? 'aprovado' : 'reprovado'
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SALVAR/ATUALIZAR NOTA NO BANCO
    // ═══════════════════════════════════════════════════════════════════════

    const { data: notaExistente } = await supabase
      .from('notas_2025')
      .select('id')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('ano_letivo', ano)
      .eq('bimestre', bimestre)
      .single()

    const dadosNota = {
      usuario_id: sessao.userId,
      componente,
      ano_letivo: ano,
      bimestre,
      questoes_respondidas: questoesRespondidas,
      meta_questoes: config.regular.meta,
      dias_ativos: diasAtivos,
      nota_base: notaRegular.nota_base,
      bonus_frequencia: notaRegular.bonus_frequencia,
      nota_regular: notaRegular.nota_final,
      em_recuperacao: emRecuperacao,
      questoes_pendentes: questoesPendentes,
      questoes_recuperacao: questoesRecuperacao,
      nota_recuperacao: notaRecuperacao,
      nota_final: notaFinal,
      status,
      atualizado_em: new Date().toISOString(),
    }

    if (notaExistente) {
      await supabase.from('notas_2025').update(dadosNota).eq('id', notaExistente.id)
    } else {
      await supabase.from('notas_2025').insert(dadosNota)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BUSCAR HISTÓRICO
    // ═══════════════════════════════════════════════════════════════════════

    const { data: historico } = await supabase
      .from('notas_2025')
      .select('*')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .order('ano_letivo', { ascending: false })
      .order('bimestre', { ascending: false })

    // ═══════════════════════════════════════════════════════════════════════
    // RETORNAR RESPOSTA
    // ═══════════════════════════════════════════════════════════════════════

    return NextResponse.json({
      sucesso: true,
      bimestre_atual: {
        bimestre,
        ano,
        // Período
        tipo_periodo: emRecuperacao || emPeriodoRecuperacao ? 'recuperacao' : 'regular',
        data_inicio: emRecuperacao ? config.recuperacao.inicio : config.regular.inicio,
        data_fim: emRecuperacao ? config.recuperacao.fim : config.regular.fim,
        dias_restantes: periodoAtual?.diasRestantes || 0,

        // Dados do regular
        questoes_respondidas: questoesRespondidas,
        meta_questoes: config.regular.meta,
        percentual_questoes: Math.round((questoesRespondidas / config.regular.meta) * 100),
        dias_ativos: diasAtivos,
        nota_base: notaRegular.nota_base,
        bonus_frequencia: notaRegular.bonus_frequencia,
        nota_regular: notaRegular.nota_final,

        // Recuperação (se aplicável)
        em_recuperacao: emRecuperacao,
        questoes_pendentes: questoesPendentes,
        questoes_recuperacao: questoesRecuperacao,
        nota_recuperacao: notaRecuperacao,

        // Nota final e status
        nota_final: notaFinal,
        status,

        // Controle semanal
        questoes_semana: questoesSemanaAtual,
        limite_semanal: limiteSemanal,
        pode_responder: podeResponder,
      },
      historico: historico || [],

      // Tabela de bônus para referência
      tabela_bonus: [
        { dias: '0-4', bonus: 0.0 },
        { dias: '5-9', bonus: 0.5 },
        { dias: '10-14', bonus: 1.0 },
        { dias: '15-19', bonus: 1.5 },
        { dias: '20+', bonus: 2.0 },
      ],
    })
  } catch (error) {
    console.error('Erro ao calcular notas:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
