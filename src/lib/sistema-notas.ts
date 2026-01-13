/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SISTEMA DE NOTAS 2025 - FÓRMULA v2
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FÓRMULA: NOTA = Pontos por Acertos (máx 6.0) + Pontos por Tempo (máx 4.0)
 *
 * PONTOS POR ACERTOS (máximo 6.0 pontos):
 * ───────────────────────────────────────────────────────────────────────────
 * - Modo Estudar: cada acerto = +0.04 pontos
 * - Modo Revisão: cada acerto = +0.02 pontos
 * - Modo Desafio: cada acerto = +0.01 pontos
 *
 * PONTOS POR TEMPO DE USO (máximo 4.0 pontos):
 * ───────────────────────────────────────────────────────────────────────────
 * - 2 horas de uso = 1.0 ponto
 * - 3 horas de uso = 2.0 pontos
 * - 4 horas de uso = 3.0 pontos
 * - 5+ horas de uso = 4.0 pontos
 *
 * NOTA MÁXIMA: 10.0
 *
 * NÍVEIS DE VERIFICAÇÃO:
 * ═══════════════════════════════════════════════════════════════════════════
 * NÍVEL 1: Validação de Entrada
 * NÍVEL 2: Autenticação e Sessão
 * NÍVEL 3: Regras de Negócio (limites semanais para estudo)
 * NÍVEL 4: Processamento e Cálculo
 * NÍVEL 5: Persistência e Notificação
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

export type ModoEstudo = 'estudo' | 'desafio' | 'revisao'
export type TipoPeriodo = 'regular' | 'recuperacao' | 'ferias'
export type StatusNota = 'em_andamento' | 'recuperacao' | 'aprovado' | 'reprovado'

export interface ConfigBimestre {
  bimestre: 1 | 2 | 3 | 4
  regular: { inicio: string; fim: string; meta: number }
  recuperacao: { inicio: string; fim: string }
}

export interface ResultadoVerificacao {
  nivel: number
  passou: boolean
  erro?: string
  codigo?: string
  dados?: Record<string, unknown>
}

export interface NotaAtualizada {
  nota_anterior: number
  nota_nova: number
  // Fórmula v2
  acertos_estudo: number
  acertos_revisao: number
  acertos_desafio: number
  tempo_uso_horas: number
  nota_acertos: number   // máx 6.0
  nota_tempo: number     // máx 4.0
  detalhes: { estudo: number; revisao: number; desafio: number }
  // Controle semanal
  questoes_semana: number
  limite_semanal: number | null
  pode_responder: boolean
  // Legado (mantido para compatibilidade)
  questoes_respondidas: number
  meta_questoes: number
  dias_ativos: number
  bonus_frequencia: number
  percentual: number
}

export interface VerificacaoCompleta {
  niveis: ResultadoVerificacao[]
  sucesso: boolean
  pode_responder: boolean
  motivo?: string
  dados_nota?: NotaAtualizada
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DOS BIMESTRES 2025 e 2026
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG_BIMESTRES: Record<number, Record<1 | 2 | 3 | 4, ConfigBimestre>> = {
  2025: {
    1: {
      bimestre: 1,
      regular: { inicio: '2025-02-03', fim: '2025-03-24', meta: 105 },
      recuperacao: { inicio: '2025-03-25', fim: '2025-04-03' },
    },
    2: {
      bimestre: 2,
      regular: { inicio: '2025-04-04', fim: '2025-06-16', meta: 150 },
      recuperacao: { inicio: '2025-06-17', fim: '2025-06-26' },
    },
    3: {
      bimestre: 3,
      regular: { inicio: '2025-08-04', fim: '2025-09-23', meta: 105 },
      recuperacao: { inicio: '2025-09-24', fim: '2025-10-03' },
    },
    4: {
      bimestre: 4,
      regular: { inicio: '2025-10-04', fim: '2025-12-04', meta: 135 },
      recuperacao: { inicio: '2025-12-05', fim: '2025-12-15' },
    },
  },
  2026: {
    1: {
      bimestre: 1,
      regular: { inicio: '2026-02-02', fim: '2026-03-24', meta: 105 },
      recuperacao: { inicio: '2026-03-25', fim: '2026-04-03' },
    },
    2: {
      bimestre: 2,
      regular: { inicio: '2026-04-04', fim: '2026-06-16', meta: 150 },
      recuperacao: { inicio: '2026-06-17', fim: '2026-06-26' },
    },
    3: {
      bimestre: 3,
      regular: { inicio: '2026-08-04', fim: '2026-09-23', meta: 105 },
      recuperacao: { inicio: '2026-09-24', fim: '2026-10-03' },
    },
    4: {
      bimestre: 4,
      regular: { inicio: '2026-10-04', fim: '2026-12-04', meta: 135 },
      recuperacao: { inicio: '2026-12-05', fim: '2026-12-15' },
    },
  },
}

// Limites
const LIMITE_SEMANAL_ESTUDO = 15
const NOTA_MAXIMA_REGULAR = 10.0
const NOTA_MAXIMA_RECUPERACAO = 6.0

// Constantes para cálculo de nota v2
const VALOR_ACERTO_ESTUDO = 0.04  // Cada acerto no modo estudar = +0.04 pontos
const VALOR_ACERTO_REVISAO = 0.02 // Cada acerto no modo revisão = +0.02 pontos
const VALOR_ACERTO_DESAFIO = 0.01 // Cada acerto no modo desafio = +0.01 pontos
const NOTA_MAXIMA_ACERTOS = 6.0   // Máximo de pontos por acertos
const NOTA_MAXIMA_TEMPO = 4.0     // Máximo de pontos por tempo de uso

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retorna a segunda-feira da semana de uma data
 */
export function getSegundaFeiraSemana(data: Date = new Date()): string {
  const d = new Date(data)
  const dia = d.getDay()
  const diff = d.getDate() - dia + (dia === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

/**
 * Calcula pontos por tempo de uso
 * 2h = 1pt, 3h = 2pt, 4h = 3pt, 5h+ = 4pt
 */
export function calcularPontosTempo(tempoHoras: number): number {
  if (tempoHoras >= 5) return 4.0
  if (tempoHoras >= 4) return 3.0
  if (tempoHoras >= 3) return 2.0
  if (tempoHoras >= 2) return 1.0
  return 0
}

/**
 * FÓRMULA v2 - 2025
 * Calcula nota baseada em acertos + tempo de uso
 *
 * NOTA = Pontos por Acertos (máx 6.0) + Pontos por Tempo (máx 4.0)
 * - Estudar: +0.04 por acerto
 * - Revisão: +0.02 por acerto
 * - Desafio: +0.01 por acerto
 * - Tempo: 2h=1pt, 3h=2pt, 4h=3pt, 5h+=4pt
 *
 * Máximo: 10.0
 */
export function calcularNotaNova(
  acertosEstudo: number,
  acertosRevisao: number,
  acertosDesafio: number = 0,
  tempoUsoHoras: number = 0
): {
  notaAcertos: number
  notaTempo: number
  notaFinal: number
  detalhes: { estudo: number; revisao: number; desafio: number }
} {
  // Pontos por acertos (máximo 6.0)
  const pontosEstudo = acertosEstudo * VALOR_ACERTO_ESTUDO
  const pontosRevisao = acertosRevisao * VALOR_ACERTO_REVISAO
  const pontosDesafio = acertosDesafio * VALOR_ACERTO_DESAFIO
  const notaAcertos = Math.min(NOTA_MAXIMA_ACERTOS, pontosEstudo + pontosRevisao + pontosDesafio)

  // Pontos por tempo de uso (máximo 4.0)
  const notaTempo = calcularPontosTempo(tempoUsoHoras)

  // Nota final = min(soma, 10.0)
  const notaFinal = Math.min(notaAcertos + notaTempo, NOTA_MAXIMA_REGULAR)

  return {
    notaAcertos: Math.round(notaAcertos * 100) / 100,
    notaTempo: Math.round(notaTempo * 100) / 100,
    notaFinal: Math.round(notaFinal * 100) / 100,
    detalhes: {
      estudo: Math.round(pontosEstudo * 100) / 100,
      revisao: Math.round(pontosRevisao * 100) / 100,
      desafio: Math.round(pontosDesafio * 100) / 100,
    },
  }
}

/**
 * @deprecated Use calcularNotaNova em vez desta função
 * Calcula bônus de frequência baseado nos dias ativos (legado)
 */
export function calcularBonusFrequencia(diasAtivos: number): number {
  if (diasAtivos < 5) return 0.0
  if (diasAtivos < 10) return 0.5
  if (diasAtivos < 15) return 1.0
  if (diasAtivos < 20) return 1.5
  return 2.0
}

/**
 * Identifica o período atual do calendário letivo
 * Suporta anos 2025 e 2026
 */
export function getPeriodoAtual(ano?: number): {
  bimestre: 1 | 2 | 3 | 4
  tipo: TipoPeriodo
  config: ConfigBimestre
  diasRestantes: number
} | null {
  const hoje = new Date().toISOString().split('T')[0]
  const anoAtual = ano || new Date().getFullYear()

  // Buscar configuração do ano
  const configAno = CONFIG_BIMESTRES[anoAtual]
  if (!configAno) return null

  for (const bim of [1, 2, 3, 4] as const) {
    const config = configAno[bim]

    // Período regular
    if (hoje >= config.regular.inicio && hoje <= config.regular.fim) {
      const diasRestantes = Math.ceil(
        (new Date(config.regular.fim).getTime() - new Date(hoje).getTime()) / (1000 * 60 * 60 * 24)
      )
      return { bimestre: bim, tipo: 'regular', config, diasRestantes }
    }

    // Período recuperação
    if (hoje >= config.recuperacao.inicio && hoje <= config.recuperacao.fim) {
      const diasRestantes = Math.ceil(
        (new Date(config.recuperacao.fim).getTime() - new Date(hoje).getTime()) / (1000 * 60 * 60 * 24)
      )
      return { bimestre: bim, tipo: 'recuperacao', config, diasRestantes }
    }
  }

  return null // Férias ou fora do período
}

/**
 * Calcula a nota do período regular
 */
export function calcularNotaRegular(
  questoesRespondidas: number,
  metaQuestoes: number,
  diasAtivos: number
): { notaBase: number; bonus: number; notaFinal: number } {
  const notaBase = Math.min((questoesRespondidas / Math.max(metaQuestoes, 1)) * 10, 10)
  const bonus = calcularBonusFrequencia(diasAtivos)
  const notaFinal = Math.min(notaBase + bonus, NOTA_MAXIMA_REGULAR)

  return {
    notaBase: Math.round(notaBase * 100) / 100,
    bonus,
    notaFinal: Math.round(notaFinal * 100) / 100,
  }
}

/**
 * Calcula a nota da recuperação
 */
export function calcularNotaRecuperacao(questoesFeitas: number, questoesPendentes: number): number {
  const questoesContam = Math.min(questoesFeitas, questoesPendentes)
  return Math.round(Math.min((questoesContam / Math.max(questoesPendentes, 1)) * 6, NOTA_MAXIMA_RECUPERACAO) * 100) / 100
}

// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA DE VERIFICAÇÃO HIERÁRQUICA DE 5 NÍVEIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * NÍVEL 1: Validação de Entrada
 */
export function nivel1ValidacaoEntrada(
  componente: string | null,
  modo: string | null
): ResultadoVerificacao {
  // Validar componente
  if (!componente || !['fisica', 'matematica'].includes(componente)) {
    return {
      nivel: 1,
      passou: false,
      erro: 'Componente inválido. Use "fisica" ou "matematica".',
      codigo: 'COMPONENTE_INVALIDO',
    }
  }

  // Validar modo
  const modosValidos: ModoEstudo[] = ['estudo', 'desafio', 'revisao']
  const modoValidado = modosValidos.includes(modo as ModoEstudo) ? (modo as ModoEstudo) : 'estudo'

  return {
    nivel: 1,
    passou: true,
    dados: {
      componente: componente as Componente,
      modo: modoValidado,
    },
  }
}

/**
 * NÍVEL 2: Verificação de Autenticação e Sessão
 */
export async function nivel2AutenticacaoSessao(
  supabase: SupabaseClient,
  userId: string | null
): Promise<ResultadoVerificacao> {
  if (!userId) {
    return {
      nivel: 2,
      passou: false,
      erro: 'Usuário não autenticado.',
      codigo: 'NAO_AUTENTICADO',
    }
  }

  // Verificar se usuário existe
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id, nome, turma, ano')
    .eq('id', userId)
    .single()

  if (error || !usuario) {
    return {
      nivel: 2,
      passou: false,
      erro: 'Usuário não encontrado.',
      codigo: 'USUARIO_NAO_ENCONTRADO',
    }
  }

  return {
    nivel: 2,
    passou: true,
    dados: { usuario },
  }
}

/**
 * NÍVEL 3: Verificação de Regras de Negócio e Limites
 * Este é o nível mais importante para controlar as questões semanais
 */
export async function nivel3RegrasNegocio(
  supabase: SupabaseClient,
  userId: string,
  componente: Componente,
  modo: ModoEstudo
): Promise<ResultadoVerificacao> {
  // Modo revisão não tem limite - é apenas prática
  if (modo === 'revisao') {
    return {
      nivel: 3,
      passou: true,
      dados: {
        limite_semanal: null,
        questoes_semana: 0,
        pode_responder: true,
        motivo: 'Modo revisão - sem limite',
        conta_para_nota: false,
      },
    }
  }

  // Modo desafio é ilimitado e não conta para nota bimestral
  if (modo === 'desafio') {
    return {
      nivel: 3,
      passou: true,
      dados: {
        limite_semanal: null,
        questoes_semana: 0,
        pode_responder: true,
        motivo: 'Modo desafio - sem limite',
        conta_para_nota: false,
      },
    }
  }

  // MODO ESTUDO: Verifica período e limite semanal
  const periodo = getPeriodoAtual()

  // Fora do período letivo - permite acesso, mas sem contagem para nota
  if (!periodo) {
    return {
      nivel: 3,
      passou: true,
      dados: {
        limite_semanal: null,
        questoes_semana: 0,
        pode_responder: true,
        motivo: 'Fora do período letivo - modo prática livre',
        conta_para_nota: false,
      },
    }
  }

  // Período de recuperação - sem limite semanal
  if (periodo.tipo === 'recuperacao') {
    return {
      nivel: 3,
      passou: true,
      dados: {
        limite_semanal: null,
        questoes_semana: 0,
        pode_responder: true,
        motivo: 'Período de recuperação - sem limite',
        conta_para_nota: true,
        periodo,
      },
    }
  }

  // PERÍODO REGULAR: Verificar limite de 15 questões por semana
  const segundaFeira = getSegundaFeiraSemana()
  const domingoFim = new Date(segundaFeira)
  domingoFim.setDate(domingoFim.getDate() + 6)
  const domingoFimStr = domingoFim.toISOString().split('T')[0]

  // Contar questões respondidas esta semana (apenas modo estudo)
  const { data: respostasSemana } = await supabase
    .from('respostas')
    .select('id')
    .eq('usuario_id', userId)
    .eq('componente', componente)
    .eq('modo', 'estudo')
    .gte('criado_em', segundaFeira)
    .lte('criado_em', domingoFimStr + 'T23:59:59')

  const questoesSemana = respostasSemana?.length || 0

  // Verificar se atingiu o limite
  if (questoesSemana >= LIMITE_SEMANAL_ESTUDO) {
    return {
      nivel: 3,
      passou: false,
      erro: `Limite semanal atingido (${questoesSemana}/${LIMITE_SEMANAL_ESTUDO}). Volte na segunda-feira!`,
      codigo: 'LIMITE_SEMANAL_ATINGIDO',
      dados: {
        limite_semanal: LIMITE_SEMANAL_ESTUDO,
        questoes_semana: questoesSemana,
        pode_responder: false,
        proxima_segunda: getProximaSegunda(),
      },
    }
  }

  return {
    nivel: 3,
    passou: true,
    dados: {
      limite_semanal: LIMITE_SEMANAL_ESTUDO,
      questoes_semana: questoesSemana,
      restantes_semana: LIMITE_SEMANAL_ESTUDO - questoesSemana,
      pode_responder: true,
      conta_para_nota: true,
      periodo,
    },
  }
}

/**
 * Retorna a data da próxima segunda-feira
 */
function getProximaSegunda(): string {
  const hoje = new Date()
  const dia = hoje.getDay()
  const diff = dia === 0 ? 1 : 8 - dia
  hoje.setDate(hoje.getDate() + diff)
  return hoje.toISOString().split('T')[0]
}

/**
 * NÍVEL 4: Processamento e Cálculo de Nota
 * FÓRMULA v2: NOTA = Pontos Acertos (máx 6) + Pontos Tempo (máx 4)
 */
export async function nivel4ProcessamentoCalculo(
  supabase: SupabaseClient,
  userId: string,
  componente: Componente,
  periodo: { bimestre: 1 | 2 | 3 | 4; tipo: TipoPeriodo; config: ConfigBimestre; diasRestantes?: number } | null
): Promise<ResultadoVerificacao> {
  if (!periodo) {
    return {
      nivel: 4,
      passou: true,
      dados: { nota_atualizada: null },
    }
  }

  const config = periodo.config
  const hoje = new Date().toISOString().split('T')[0]

  // Determinar intervalo de datas para buscar respostas
  // Se estamos fora do período (diasRestantes = 0 e data atual < inicio), usar últimos 30 dias
  const periodoReal = getPeriodoAtual()
  let dataInicio: string
  let dataFim: string

  if (periodoReal) {
    // Período real ativo - usar datas do bimestre
    dataInicio = config.regular.inicio
    dataFim = config.regular.fim
  } else {
    // Fora do período (férias/prática) - usar últimos 30 dias
    const data30DiasAtras = new Date()
    data30DiasAtras.setDate(data30DiasAtras.getDate() - 30)
    dataInicio = data30DiasAtras.toISOString().split('T')[0]
    dataFim = hoje
  }

  try {
    // Buscar respostas do modo estudo (acertos + tempo)
    const { data: respostasEstudo } = await supabase
      .from('respostas')
      .select('id, criado_em, correta, tempo_segundos')
      .eq('usuario_id', userId)
      .eq('componente', componente)
      .eq('modo', 'estudo')
      .gte('criado_em', dataInicio)
      .lte('criado_em', dataFim + 'T23:59:59')

    // Buscar respostas do modo revisão (acertos + tempo)
    const { data: respostasRevisao } = await supabase
      .from('respostas')
      .select('id, correta, tempo_segundos')
      .eq('usuario_id', userId)
      .eq('componente', componente)
      .eq('modo', 'revisao')
      .eq('correta', true)
      .gte('criado_em', dataInicio)
      .lte('criado_em', dataFim + 'T23:59:59')

    // Buscar respostas do modo desafio (acertos + tempo)
    const { data: respostasDesafio } = await supabase
      .from('respostas')
      .select('id, correta, tempo_segundos')
      .eq('usuario_id', userId)
      .eq('componente', componente)
      .eq('modo', 'desafio')
      .eq('correta', true)
      .gte('criado_em', dataInicio)
      .lte('criado_em', dataFim + 'T23:59:59')

    // Contadores
    const questoesRespondidas = respostasEstudo?.length || 0
    const acertosEstudo = respostasEstudo?.filter(r => r.correta === true).length || 0
    const acertosRevisao = respostasRevisao?.length || 0
    const acertosDesafio = respostasDesafio?.length || 0

    // Calcular tempo total de uso em horas
    const tempoEstudo = respostasEstudo?.reduce((acc, r) => acc + (r.tempo_segundos || 0), 0) || 0
    const tempoRevisao = respostasRevisao?.reduce((acc, r) => acc + (r.tempo_segundos || 0), 0) || 0
    const tempoDesafio = respostasDesafio?.reduce((acc, r) => acc + (r.tempo_segundos || 0), 0) || 0
    const tempoTotalSegundos = tempoEstudo + tempoRevisao + tempoDesafio
    const tempoTotalHoras = tempoTotalSegundos / 3600

    // Contar dias ativos
    const diasAtivosSet = new Set(respostasEstudo?.map(r => r.criado_em.split('T')[0]) || [])
    const diasAtivos = diasAtivosSet.size

    // FÓRMULA v2: Acertos + Tempo
    const { notaAcertos, notaTempo, notaFinal, detalhes } = calcularNotaNova(
      acertosEstudo,
      acertosRevisao,
      acertosDesafio,
      tempoTotalHoras
    )

    // Buscar questões da semana atual
    const segundaFeira = getSegundaFeiraSemana()
    const domingoFim = new Date(segundaFeira)
    domingoFim.setDate(domingoFim.getDate() + 6)

    const { data: questoesSemanaData } = await supabase
      .from('respostas')
      .select('id')
      .eq('usuario_id', userId)
      .eq('componente', componente)
      .eq('modo', 'estudo')
      .gte('criado_em', segundaFeira)
      .lte('criado_em', domingoFim.toISOString().split('T')[0] + 'T23:59:59')

    const questoesSemana = questoesSemanaData?.length || 0
    const limiteSemanal = periodo.tipo === 'recuperacao' ? null : LIMITE_SEMANAL_ESTUDO

    const notaAtualizada: NotaAtualizada = {
      nota_anterior: 0, // Será preenchido depois
      nota_nova: notaFinal,
      // Fórmula v2
      acertos_estudo: acertosEstudo,
      acertos_revisao: acertosRevisao,
      acertos_desafio: acertosDesafio,
      tempo_uso_horas: tempoTotalHoras,
      nota_acertos: notaAcertos,
      nota_tempo: notaTempo,
      detalhes,
      // Controle semanal
      questoes_semana: questoesSemana,
      limite_semanal: limiteSemanal,
      pode_responder: limiteSemanal === null || questoesSemana < limiteSemanal,
      // Legado (mantido para compatibilidade)
      questoes_respondidas: questoesRespondidas,
      meta_questoes: config.regular.meta,
      dias_ativos: diasAtivos,
      bonus_frequencia: detalhes.revisao + detalhes.desafio,
      percentual: Math.round((questoesRespondidas / config.regular.meta) * 100),
    }

    return {
      nivel: 4,
      passou: true,
      dados: {
        nota_atualizada: notaAtualizada,
        nota_acertos: notaAcertos,
        nota_tempo: notaTempo,
        nota_final: notaFinal,
      },
    }
  } catch (error) {
    console.error('Erro no nível 4 (processamento):', error)
    return {
      nivel: 4,
      passou: false,
      erro: 'Erro ao calcular nota.',
      codigo: 'ERRO_CALCULO',
    }
  }
}

/**
 * NÍVEL 5: Persistência e Notificação
 * Salva a nota atualizada no banco e retorna feedback
 */
export async function nivel5PersistenciaNotificacao(
  supabase: SupabaseClient,
  userId: string,
  componente: Componente,
  notaAtualizada: NotaAtualizada,
  periodo: { bimestre: 1 | 2 | 3 | 4; config: ConfigBimestre }
): Promise<ResultadoVerificacao> {
  try {
    const { bimestre, config } = periodo
    const anoLetivo = new Date().getFullYear() // Ano dinâmico

    // Verificar se registro existe
    const { data: notaExistente } = await supabase
      .from('notas_2025')
      .select('id, nota_final')
      .eq('usuario_id', userId)
      .eq('componente', componente)
      .eq('ano_letivo', anoLetivo)
      .eq('bimestre', bimestre)
      .single()

    const notaAnterior = notaExistente?.nota_final || 0
    notaAtualizada.nota_anterior = notaAnterior

    const dadosNota = {
      usuario_id: userId,
      componente,
      ano_letivo: anoLetivo,
      bimestre,
      questoes_respondidas: notaAtualizada.questoes_respondidas,
      meta_questoes: notaAtualizada.meta_questoes,
      dias_ativos: notaAtualizada.dias_ativos,
      nota_base: notaAtualizada.nota_nova - notaAtualizada.bonus_frequencia,
      bonus_frequencia: notaAtualizada.bonus_frequencia,
      nota_regular: notaAtualizada.nota_nova,
      nota_final: notaAtualizada.nota_nova,
      status: notaAtualizada.nota_nova >= 6.0 ? 'em_andamento' : 'em_andamento',
      atualizado_em: new Date().toISOString(),
    }

    if (notaExistente) {
      await supabase.from('notas_2025').update(dadosNota).eq('id', notaExistente.id)
    } else {
      await supabase.from('notas_2025').insert(dadosNota)
    }

    const houveMudanca = notaAtualizada.nota_nova !== notaAnterior

    return {
      nivel: 5,
      passou: true,
      dados: {
        nota_salva: true,
        nota_anterior: notaAnterior,
        nota_nova: notaAtualizada.nota_nova,
        mudanca: houveMudanca,
        diferenca: Math.round((notaAtualizada.nota_nova - notaAnterior) * 100) / 100,
      },
    }
  } catch (error) {
    console.warn('Erro no nível 5 (persistência):', error)
    // Não bloqueia - a nota foi calculada, só não foi salva
    return {
      nivel: 5,
      passou: true, // Ainda passou, apenas não salvou
      dados: {
        nota_salva: false,
        erro_persistencia: true,
      },
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL: Verificação Completa de 5 Níveis
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Executa verificação completa de 5 níveis antes de permitir resposta
 * Retorna se o usuário pode responder e dados atualizados da nota
 */
export async function verificacaoCompletaParaResponder(
  supabase: SupabaseClient,
  userId: string | null,
  componente: string | null,
  modo: string | null
): Promise<VerificacaoCompleta> {
  const niveis: ResultadoVerificacao[] = []

  // NÍVEL 1: Validação de Entrada
  const nivel1 = nivel1ValidacaoEntrada(componente, modo)
  niveis.push(nivel1)
  if (!nivel1.passou) {
    return { niveis, sucesso: false, pode_responder: false, motivo: nivel1.erro }
  }

  const componenteValidado = nivel1.dados?.componente as Componente
  const modoValidado = nivel1.dados?.modo as ModoEstudo

  // NÍVEL 2: Autenticação
  const nivel2 = await nivel2AutenticacaoSessao(supabase, userId)
  niveis.push(nivel2)
  if (!nivel2.passou) {
    return { niveis, sucesso: false, pode_responder: false, motivo: nivel2.erro }
  }

  // NÍVEL 3: Regras de Negócio
  const nivel3 = await nivel3RegrasNegocio(supabase, userId!, componenteValidado, modoValidado)
  niveis.push(nivel3)
  if (!nivel3.passou) {
    return {
      niveis,
      sucesso: false,
      pode_responder: false,
      motivo: nivel3.erro,
      dados_nota: {
        nota_anterior: 0,
        nota_nova: 0,
        // Fórmula v2
        acertos_estudo: 0,
        acertos_revisao: 0,
        acertos_desafio: 0,
        tempo_uso_horas: 0,
        nota_acertos: 0,
        nota_tempo: 0,
        detalhes: { estudo: 0, revisao: 0, desafio: 0 },
        // Controle semanal
        questoes_semana: nivel3.dados?.questoes_semana as number || 0,
        limite_semanal: nivel3.dados?.limite_semanal as number || null,
        pode_responder: false,
        // Legado
        questoes_respondidas: 0,
        meta_questoes: 0,
        dias_ativos: 0,
        bonus_frequencia: 0,
        percentual: 0,
      },
    }
  }

  return {
    niveis,
    sucesso: true,
    pode_responder: true,
    motivo: nivel3.dados?.motivo as string,
    dados_nota: {
      nota_anterior: 0,
      nota_nova: 0,
      // Fórmula v2
      acertos_estudo: 0,
      acertos_revisao: 0,
      acertos_desafio: 0,
      tempo_uso_horas: 0,
      nota_acertos: 0,
      nota_tempo: 0,
      detalhes: { estudo: 0, revisao: 0, desafio: 0 },
      // Controle semanal
      questoes_semana: nivel3.dados?.questoes_semana as number || 0,
      limite_semanal: nivel3.dados?.limite_semanal as number | null,
      pode_responder: true,
      // Legado
      questoes_respondidas: 0,
      meta_questoes: 0,
      dias_ativos: 0,
      bonus_frequencia: 0,
      percentual: 0,
    },
  }
}

/**
 * Atualiza nota em tempo real após uma resposta correta
 * Esta função é chamada APÓS registrar a resposta
 *
 * IMPORTANTE: Funciona mesmo fora do período letivo (modo prática)
 */
export async function atualizarNotaTempoReal(
  supabase: SupabaseClient,
  userId: string,
  componente: Componente,
  modo: ModoEstudo
): Promise<NotaAtualizada | null> {
  // Todos os modos contam para nota bimestral (v2):
  // - Estudar: +0.04 por acerto
  // - Revisão: +0.02 por acerto
  // - Desafio: +0.01 por acerto

  let periodo = getPeriodoAtual()

  // Se não há período ativo, criar período de prática (não persiste notas oficiais)
  // Isso permite feedback em tempo real mesmo fora do calendário letivo
  if (!periodo) {
    // Usar o próximo bimestre disponível ou criar período de prática
    const anoAtual = new Date().getFullYear()
    const configAno = CONFIG_BIMESTRES[anoAtual] || CONFIG_BIMESTRES[2025]

    // Criar período virtual de prática baseado no 1º bimestre
    periodo = {
      bimestre: 1,
      tipo: 'regular' as TipoPeriodo,
      config: configAno[1],
      diasRestantes: 0,
    }
  }

  // NÍVEL 4: Calcular nota atualizada
  const nivel4 = await nivel4ProcessamentoCalculo(supabase, userId, componente, periodo)
  if (!nivel4.passou || !nivel4.dados?.nota_atualizada) {
    return null
  }

  const notaAtualizada = nivel4.dados.nota_atualizada as NotaAtualizada

  // Só persiste nota se estiver em período ativo real
  const periodoReal = getPeriodoAtual()
  if (periodoReal) {
    await nivel5PersistenciaNotificacao(supabase, userId, componente, notaAtualizada, periodoReal)
  }

  return notaAtualizada
}

/**
 * Obtém status atual do limite semanal
 */
export async function obterStatusSemanal(
  supabase: SupabaseClient,
  userId: string,
  componente: Componente
): Promise<{
  questoes_semana: number
  limite_semanal: number | null
  pode_responder: boolean
  restantes: number | null
}> {
  const periodo = getPeriodoAtual()

  // Fora do período ou em recuperação = sem limite
  if (!periodo || periodo.tipo === 'recuperacao') {
    return {
      questoes_semana: 0,
      limite_semanal: null,
      pode_responder: true,
      restantes: null,
    }
  }

  const segundaFeira = getSegundaFeiraSemana()
  const domingoFim = new Date(segundaFeira)
  domingoFim.setDate(domingoFim.getDate() + 6)

  const { data: respostasSemana } = await supabase
    .from('respostas')
    .select('id')
    .eq('usuario_id', userId)
    .eq('componente', componente)
    .eq('modo', 'estudo')
    .gte('criado_em', segundaFeira)
    .lte('criado_em', domingoFim.toISOString().split('T')[0] + 'T23:59:59')

  const questoesSemana = respostasSemana?.length || 0
  const podeResponder = questoesSemana < LIMITE_SEMANAL_ESTUDO

  return {
    questoes_semana: questoesSemana,
    limite_semanal: LIMITE_SEMANAL_ESTUDO,
    pode_responder: podeResponder,
    restantes: LIMITE_SEMANAL_ESTUDO - questoesSemana,
  }
}
