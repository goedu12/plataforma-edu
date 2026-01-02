/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SISTEMA DE NOTAS 2025 - NOVA FÓRMULA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * FÓRMULA: NOTA = (ACERTOS_QUESTÕES ÷ 12) + (ACERTOS_REVISÃO × 0,05)
 *
 * COMPONENTES:
 * ───────────────────────────────────────────────────────────────────────────
 * QUESTÕES (modo estudo):
 *   - Limite: 15 questões por semana
 *   - Valor: cada 12 acertos = +1.0 ponto
 *   - Fórmula: acertos_questoes ÷ 12
 *
 * REVISÃO (modo revisão):
 *   - Limite: SEM LIMITE
 *   - Valor: cada acerto = +0.05 pontos
 *   - Fórmula: acertos_revisao × 0.05
 *
 * DESAFIO (modo desafio):
 *   - Limite: SEM LIMITE (pode fazer quantos quiser)
 *   - Não conta para nota bimestral, apenas pontos
 *
 * NOTA FINAL:
 *   - Máximo: 10.0
 *   - nota_final = min(nota_questoes + nota_revisao, 10.0)
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
  // Nova fórmula
  acertos_questoes: number
  acertos_revisao: number
  nota_questoes: number  // acertos_questoes / 12
  nota_revisao: number   // acertos_revisao * 0.05
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
// CONFIGURAÇÃO DOS BIMESTRES 2025
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG_BIMESTRES_2025: Record<1 | 2 | 3 | 4, ConfigBimestre> = {
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
}

// Limites
const LIMITE_SEMANAL_ESTUDO = 15
const NOTA_MAXIMA_REGULAR = 10.0
const NOTA_MAXIMA_RECUPERACAO = 6.0

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
 * NOVA FÓRMULA 2025
 * Calcula nota baseada em acertos de questões e revisão
 *
 * NOTA = (ACERTOS_QUESTOES / 12) + (ACERTOS_REVISAO * 0.05)
 * Máximo: 10.0
 */
export function calcularNotaNova(
  acertosQuestoes: number,
  acertosRevisao: number
): { notaQuestoes: number; notaRevisao: number; notaFinal: number } {
  // Cada 12 acertos em questões = 1.0 ponto
  const notaQuestoes = acertosQuestoes / 12

  // Cada acerto em revisão = 0.05 pontos
  const notaRevisao = acertosRevisao * 0.05

  // Nota final = min(soma, 10.0)
  const notaFinal = Math.min(notaQuestoes + notaRevisao, 10.0)

  return {
    notaQuestoes: Math.round(notaQuestoes * 100) / 100,
    notaRevisao: Math.round(notaRevisao * 100) / 100,
    notaFinal: Math.round(notaFinal * 100) / 100,
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
 */
export function getPeriodoAtual(ano: number = 2025): {
  bimestre: 1 | 2 | 3 | 4
  tipo: TipoPeriodo
  config: ConfigBimestre
  diasRestantes: number
} | null {
  const hoje = new Date().toISOString().split('T')[0]

  if (ano !== 2025) return null

  for (const bim of [1, 2, 3, 4] as const) {
    const config = CONFIG_BIMESTRES_2025[bim]

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

  // Fora do período letivo
  if (!periodo) {
    return {
      nivel: 3,
      passou: false,
      erro: 'Fora do período letivo. Aguarde o início das aulas.',
      codigo: 'FORA_PERIODO',
      dados: { pode_responder: false },
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
 * NOVA FÓRMULA: NOTA = (ACERTOS_QUESTÕES ÷ 12) + (ACERTOS_REVISÃO × 0,05)
 */
export async function nivel4ProcessamentoCalculo(
  supabase: SupabaseClient,
  userId: string,
  componente: Componente,
  periodo: { bimestre: 1 | 2 | 3 | 4; tipo: TipoPeriodo; config: ConfigBimestre } | null
): Promise<ResultadoVerificacao> {
  if (!periodo) {
    return {
      nivel: 4,
      passou: true,
      dados: { nota_atualizada: null },
    }
  }

  const config = periodo.config

  try {
    // Buscar ACERTOS de questões (modo estudo)
    const { data: respostasEstudo } = await supabase
      .from('respostas')
      .select('id, criado_em, correta')
      .eq('usuario_id', userId)
      .eq('componente', componente)
      .eq('modo', 'estudo')
      .gte('criado_em', config.regular.inicio)
      .lte('criado_em', config.regular.fim + 'T23:59:59')

    // Buscar ACERTOS de revisão (modo revisao)
    const { data: respostasRevisao } = await supabase
      .from('respostas')
      .select('id')
      .eq('usuario_id', userId)
      .eq('componente', componente)
      .eq('modo', 'revisao')
      .eq('correta', true)
      .gte('criado_em', config.regular.inicio)
      .lte('criado_em', config.regular.fim + 'T23:59:59')

    const questoesRespondidas = respostasEstudo?.length || 0
    const acertosQuestoes = respostasEstudo?.filter(r => r.correta === true).length || 0
    const acertosRevisao = respostasRevisao?.length || 0

    // Contar dias ativos
    const diasAtivosSet = new Set(respostasEstudo?.map(r => r.criado_em.split('T')[0]) || [])
    const diasAtivos = diasAtivosSet.size

    // NOVA FÓRMULA
    const { notaQuestoes, notaRevisao, notaFinal } = calcularNotaNova(acertosQuestoes, acertosRevisao)

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
      // Nova fórmula
      acertos_questoes: acertosQuestoes,
      acertos_revisao: acertosRevisao,
      nota_questoes: notaQuestoes,
      nota_revisao: notaRevisao,
      // Controle semanal
      questoes_semana: questoesSemana,
      limite_semanal: limiteSemanal,
      pode_responder: limiteSemanal === null || questoesSemana < limiteSemanal,
      // Legado
      questoes_respondidas: questoesRespondidas,
      meta_questoes: config.regular.meta,
      dias_ativos: diasAtivos,
      bonus_frequencia: notaRevisao, // Mapear revisão como bônus
      percentual: Math.round((questoesRespondidas / config.regular.meta) * 100),
    }

    return {
      nivel: 4,
      passou: true,
      dados: {
        nota_atualizada: notaAtualizada,
        nota_questoes: notaQuestoes,
        nota_revisao: notaRevisao,
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

    // Verificar se registro existe
    const { data: notaExistente } = await supabase
      .from('notas_2025')
      .select('id, nota_final')
      .eq('usuario_id', userId)
      .eq('componente', componente)
      .eq('ano_letivo', 2025)
      .eq('bimestre', bimestre)
      .single()

    const notaAnterior = notaExistente?.nota_final || 0
    notaAtualizada.nota_anterior = notaAnterior

    const dadosNota = {
      usuario_id: userId,
      componente,
      ano_letivo: 2025,
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
        // Nova fórmula
        acertos_questoes: 0,
        acertos_revisao: 0,
        nota_questoes: 0,
        nota_revisao: 0,
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
      // Nova fórmula
      acertos_questoes: 0,
      acertos_revisao: 0,
      nota_questoes: 0,
      nota_revisao: 0,
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
 */
export async function atualizarNotaTempoReal(
  supabase: SupabaseClient,
  userId: string,
  componente: Componente,
  modo: ModoEstudo
): Promise<NotaAtualizada | null> {
  // Apenas modo estudo conta para nota bimestral
  if (modo !== 'estudo') {
    return null
  }

  const periodo = getPeriodoAtual()
  if (!periodo) {
    return null
  }

  // NÍVEL 4: Calcular nota atualizada
  const nivel4 = await nivel4ProcessamentoCalculo(supabase, userId, componente, periodo)
  if (!nivel4.passou || !nivel4.dados?.nota_atualizada) {
    return null
  }

  const notaAtualizada = nivel4.dados.nota_atualizada as NotaAtualizada

  // NÍVEL 5: Persistir nota
  await nivel5PersistenciaNotificacao(supabase, userId, componente, notaAtualizada, periodo)

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
