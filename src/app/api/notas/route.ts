import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA DE NOTAS 2025 - NOVA FÓRMULA
// ═══════════════════════════════════════════════════════════════════════════
//
// FÓRMULA: NOTA = (ACERTOS_QUESTÕES ÷ 12) + (ACERTOS_REVISÃO × 0,05)
//
// QUESTÕES (modo estudo): 15/semana, cada 12 acertos = +1.0 ponto
// REVISÃO (modo revisão): SEM LIMITE, cada acerto = +0.05 pontos
// DESAFIO (modo desafio): SEM LIMITE, não conta para nota
//
// NOTA MÁXIMA: 10.0
// ═══════════════════════════════════════════════════════════════════════════

// Configuração dos bimestres 2025 e 2026
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
  2026: {
    1: {
      regular: { inicio: '2026-01-01', fim: '2026-03-24', meta: 105 },
      recuperacao: { inicio: '2026-03-25', fim: '2026-04-03' },
    },
    2: {
      regular: { inicio: '2026-04-04', fim: '2026-06-16', meta: 150 },
      recuperacao: { inicio: '2026-06-17', fim: '2026-06-26' },
    },
    3: {
      regular: { inicio: '2026-08-04', fim: '2026-09-23', meta: 105 },
      recuperacao: { inicio: '2026-09-24', fim: '2026-10-03' },
    },
    4: {
      regular: { inicio: '2026-10-04', fim: '2026-12-04', meta: 135 },
      recuperacao: { inicio: '2026-12-05', fim: '2026-12-15' },
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

// NOVA FÓRMULA: NOTA = (ACERTOS_QUESTÕES ÷ 12) + (ACERTOS_REVISÃO × 0,05)
function calcularNotaNova(
  acertosQuestoes: number,
  acertosRevisao: number
): { nota_questoes: number; nota_revisao: number; nota_final: number } {
  const nota_questoes = acertosQuestoes / 12
  const nota_revisao = acertosRevisao * 0.05
  const nota_final = Math.min(nota_questoes + nota_revisao, 10.0)

  return {
    nota_questoes: Math.round(nota_questoes * 100) / 100,
    nota_revisao: Math.round(nota_revisao * 100) / 100,
    nota_final: Math.round(nota_final * 100) / 100,
  }
}

// @deprecated - mantido para compatibilidade
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

// Função para gerar lista de datas entre duas datas
function gerarListaDatas(inicio: string, fim: string): string[] {
  const datas: string[] = []
  const dataAtual = new Date(inicio)
  const dataFim = new Date(fim)

  while (dataAtual <= dataFim) {
    datas.push(dataAtual.toISOString().split('T')[0])
    dataAtual.setDate(dataAtual.getDate() + 1)
  }

  return datas
}

// Função para agrupar respostas por semana
function agruparPorSemana(respostas: { criado_em: string }[], dataInicio: string): { semana: number; questoes: number; inicio: string; fim: string }[] {
  const semanas: Map<number, { questoes: number; inicio: string; fim: string }> = new Map()
  const dataBase = new Date(dataInicio)

  respostas.forEach(r => {
    const dataResposta = new Date(r.criado_em.split('T')[0])
    const diffDays = Math.floor((dataResposta.getTime() - dataBase.getTime()) / (1000 * 60 * 60 * 24))
    const semana = Math.floor(diffDays / 7) + 1

    if (!semanas.has(semana)) {
      const inicioSemana = new Date(dataBase)
      inicioSemana.setDate(inicioSemana.getDate() + (semana - 1) * 7)
      const fimSemana = new Date(inicioSemana)
      fimSemana.setDate(fimSemana.getDate() + 6)

      semanas.set(semana, {
        questoes: 0,
        inicio: inicioSemana.toISOString().split('T')[0],
        fim: fimSemana.toISOString().split('T')[0],
      })
    }

    const semanaData = semanas.get(semana)!
    semanaData.questoes++
  })

  return Array.from(semanas.entries())
    .map(([semana, data]) => ({ semana, ...data }))
    .sort((a, b) => a.semana - b.semana)
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
    // BUSCAR DADOS DO PERÍODO - NOVA FÓRMULA
    // ═══════════════════════════════════════════════════════════════════════

    // Buscar respostas do período regular (modo estudo) - ACERTOS
    const { data: respostasEstudo } = await supabase
      .from('respostas')
      .select('id, criado_em, correta')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('modo', 'estudo')
      .gte('criado_em', config.regular.inicio)
      .lte('criado_em', config.regular.fim + 'T23:59:59')
      .order('criado_em', { ascending: true })

    // Buscar respostas de REVISÃO - ACERTOS (SEM LIMITE)
    const { data: respostasRevisao } = await supabase
      .from('respostas')
      .select('id, correta')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('modo', 'revisao')
      .eq('correta', true)
      .gte('criado_em', config.regular.inicio)
      .lte('criado_em', config.regular.fim + 'T23:59:59')

    // Contadores para nova fórmula
    const acertosQuestoes = respostasEstudo?.filter(r => r.correta === true).length || 0
    const acertosRevisao = respostasRevisao?.length || 0
    const questoesRespondidas = respostasEstudo?.length || 0

    // Contar dias ativos (datas distintas com respostas)
    const diasAtivosSet = new Set(
      respostasEstudo?.map(r => r.criado_em.split('T')[0]) || []
    )
    const diasAtivos = diasAtivosSet.size

    // NOVA FÓRMULA: NOTA = (ACERTOS_QUESTÕES ÷ 12) + (ACERTOS_REVISÃO × 0,05)
    const notaNova = calcularNotaNova(acertosQuestoes, acertosRevisao)

    // Manter cálculo antigo para compatibilidade
    const notaRegular = calcularNotaRegular(
      questoesRespondidas,
      config.regular.meta,
      diasAtivos
    )

    // ═══════════════════════════════════════════════════════════════════════
    // GERAR DADOS PARA TIMELINE E GRÁFICOS
    // ═══════════════════════════════════════════════════════════════════════

    // Contagem de questões por dia
    const questoesPorDia: { [data: string]: number } = {}
    respostasEstudo?.forEach(r => {
      const data = r.criado_em.split('T')[0]
      questoesPorDia[data] = (questoesPorDia[data] || 0) + 1
    })

    // Gerar evolução diária (questões acumuladas e nota)
    const hoje = new Date().toISOString().split('T')[0]
    const dataFimGrafico = hoje < config.regular.fim ? hoje : config.regular.fim
    const todasAsDatas = gerarListaDatas(config.regular.inicio, dataFimGrafico)

    let questoesAcumuladas = 0
    let diasAtivosAcumulados = 0
    const evolucaoDiaria = todasAsDatas.map(data => {
      const questoesDia = questoesPorDia[data] || 0
      questoesAcumuladas += questoesDia
      if (questoesDia > 0) diasAtivosAcumulados++

      const notaDia = calcularNotaRegular(questoesAcumuladas, config.regular.meta, diasAtivosAcumulados)

      return {
        data,
        dataFormatada: new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        questoes_dia: questoesDia,
        questoes_acumuladas: questoesAcumuladas,
        dias_ativos: diasAtivosAcumulados,
        nota: Math.round(notaDia.nota_final * 100) / 100,
      }
    })

    // Agrupar por semana para timeline
    const progressoSemanal = agruparPorSemana(respostasEstudo || [], config.regular.inicio)
      .map(s => ({
        ...s,
        limite: 15,
        percentual: Math.round((s.questoes / 15) * 100),
      }))

    // Calcular semana atual
    const diffDaysHoje = Math.floor((new Date(hoje).getTime() - new Date(config.regular.inicio).getTime()) / (1000 * 60 * 60 * 24))
    const semanaAtual = Math.max(1, Math.floor(diffDaysHoje / 7) + 1)

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
    // DETERMINAR NOTA FINAL E STATUS (usando nova fórmula)
    // ═══════════════════════════════════════════════════════════════════════

    let notaFinal = notaNova.nota_final // Usar nova fórmula
    let status: 'em_andamento' | 'recuperacao' | 'aprovado' | 'reprovado' = 'em_andamento'

    if (emRecuperacao && notaRecuperacao !== null) {
      notaFinal = notaRecuperacao
      status = 'recuperacao'

      // Se recuperação encerrou
      if (hojeBR > config.recuperacao.fim) {
        status = notaRecuperacao >= 6.0 ? 'aprovado' : 'reprovado'
      }
    } else if (periodoRegularEncerrou && !emRecuperacao) {
      status = notaNova.nota_final >= 6.0 ? 'aprovado' : 'reprovado'
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SALVAR/ATUALIZAR NOTA NO BANCO (opcional - não bloqueia se falhar)
    // ═══════════════════════════════════════════════════════════════════════

    try {
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
        // Nova fórmula
        acertos_questoes: acertosQuestoes,
        acertos_revisao: acertosRevisao,
        nota_questoes: notaNova.nota_questoes,
        nota_revisao: notaNova.nota_revisao,
        // Legado (mantido para compatibilidade)
        nota_base: notaRegular.nota_base,
        bonus_frequencia: notaRegular.bonus_frequencia,
        nota_regular: notaRegular.nota_final,
        em_recuperacao: emRecuperacao,
        questoes_pendentes: questoesPendentes,
        questoes_recuperacao: questoesRecuperacao,
        nota_recuperacao: notaRecuperacao,
        nota_final: notaNova.nota_final, // Usar nova fórmula
        status,
        atualizado_em: new Date().toISOString(),
      }

      if (notaExistente) {
        await supabase.from('notas_2025').update(dadosNota).eq('id', notaExistente.id)
      } else {
        await supabase.from('notas_2025').insert(dadosNota)
      }
    } catch (e) {
      // Tabela pode não existir ainda - continua sem salvar
      console.warn('Não foi possível salvar nota no banco:', e)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BUSCAR HISTÓRICO
    // ═══════════════════════════════════════════════════════════════════════

    let historico: Array<Record<string, unknown>> = []
    try {
      const { data } = await supabase
        .from('notas_2025')
        .select('*')
        .eq('usuario_id', sessao.userId)
        .eq('componente', componente)
        .order('ano_letivo', { ascending: false })
        .order('bimestre', { ascending: false })
      historico = data || []
    } catch (e) {
      console.warn('Não foi possível buscar histórico:', e)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ESTATÍSTICAS ADICIONAIS
    // ═══════════════════════════════════════════════════════════════════════

    // Média de questões por dia ativo
    const mediaQuestoesPorDia = diasAtivos > 0 ? Math.round((questoesRespondidas / diasAtivos) * 10) / 10 : 0

    // Projeção de nota final (se mantiver o ritmo atual)
    const diasDecorridos = Math.max(1, Math.floor((new Date(hoje).getTime() - new Date(config.regular.inicio).getTime()) / (1000 * 60 * 60 * 24)))
    const diasTotais = Math.floor((new Date(config.regular.fim).getTime() - new Date(config.regular.inicio).getTime()) / (1000 * 60 * 60 * 24))
    const taxaDiaria = questoesRespondidas / diasDecorridos
    const projecaoQuestoes = Math.round(taxaDiaria * diasTotais)
    const projecaoNota = calcularNotaRegular(
      Math.min(projecaoQuestoes, config.regular.meta * 2), // Cap em 2x a meta
      config.regular.meta,
      Math.min(Math.round((diasAtivos / diasDecorridos) * diasTotais), diasTotais)
    )

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

        // NOVA FÓRMULA
        acertos_questoes: acertosQuestoes,
        acertos_revisao: acertosRevisao,
        nota_questoes: notaNova.nota_questoes,
        nota_revisao: notaNova.nota_revisao,
        nota_final: notaNova.nota_final,  // Usar nova fórmula

        // Dados do regular (legado, mantido para compatibilidade)
        questoes_respondidas: questoesRespondidas,
        meta_questoes: config.regular.meta,
        percentual_questoes: Math.round((questoesRespondidas / config.regular.meta) * 100),
        dias_ativos: diasAtivos,
        nota_base: notaNova.nota_questoes,  // Mapear para nova fórmula
        bonus_frequencia: notaNova.nota_revisao,  // Mapear revisão como "bônus"
        nota_regular: notaNova.nota_final,

        // Recuperação (se aplicável)
        em_recuperacao: emRecuperacao,
        questoes_pendentes: questoesPendentes,
        questoes_recuperacao: questoesRecuperacao,
        nota_recuperacao: notaRecuperacao,

        // Status
        status,

        // Controle semanal
        questoes_semana: questoesSemanaAtual,
        limite_semanal: limiteSemanal,
        pode_responder: podeResponder,
        semana_atual: semanaAtual,
      },

      // Dados para gráficos
      evolucao_diaria: evolucaoDiaria,
      progresso_semanal: progressoSemanal,

      // Estatísticas
      estatisticas: {
        media_questoes_por_dia: mediaQuestoesPorDia,
        dias_decorridos: diasDecorridos,
        dias_totais: diasTotais,
        projecao_questoes: projecaoQuestoes,
        projecao_nota: projecaoNota.nota_final,
        // Nova fórmula
        acertos_para_nota_10: Math.ceil((10 - notaNova.nota_final) / 0.05), // Quantos acertos de revisão faltam
      },

      historico,

      // Tabela explicativa da nova fórmula
      formula_notas: {
        titulo: 'NOTA = (Acertos Questões ÷ 12) + (Acertos Revisão × 0,05)',
        questoes: {
          descricao: 'Cada 12 acertos = +1.0 ponto',
          limite: '15 questões/semana',
          atual: acertosQuestoes,
          contribuicao: notaNova.nota_questoes,
        },
        revisao: {
          descricao: 'Cada acerto = +0.05 pontos',
          limite: 'Sem limite!',
          atual: acertosRevisao,
          contribuicao: notaNova.nota_revisao,
        },
        nota_maxima: 10.0,
      },

      // Tabela de bônus legada (para compatibilidade)
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
