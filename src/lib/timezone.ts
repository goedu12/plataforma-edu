/**
 * Utilitário de Timezone - America/Sao_Paulo
 *
 * Padroniza todas as operações de data/hora para o fuso brasileiro.
 * Essencial para:
 * - Dias ativos
 * - Streak/sequência
 * - Limites diários (IA)
 * - Relatórios por dia/semana
 */

// Fuso horário padrão
export const TIMEZONE = 'America/Sao_Paulo'
export const LOCALE = 'pt-BR'

/**
 * Retorna a data/hora atual no fuso de São Paulo
 */
export function agora(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: TIMEZONE })
  )
}

/**
 * Retorna a data atual (sem hora) no fuso de São Paulo
 * Formato: YYYY-MM-DD
 */
export function hoje(): string {
  const now = agora()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Retorna a data de ontem no fuso de São Paulo
 * Formato: YYYY-MM-DD
 */
export function ontem(): string {
  const now = agora()
  now.setDate(now.getDate() - 1)
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Converte uma data para o fuso de São Paulo
 */
export function paraFusoBrasil(data: Date | string): Date {
  const d = typeof data === 'string' ? new Date(data) : data
  return new Date(
    d.toLocaleString('en-US', { timeZone: TIMEZONE })
  )
}

/**
 * Extrai apenas a data (YYYY-MM-DD) de um timestamp
 */
export function extrairData(data: Date | string | null | undefined): string | null {
  if (!data) return null
  const d = paraFusoBrasil(data)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Verifica se uma data é hoje no fuso de São Paulo
 */
export function ehHojeBrasil(data: Date | string | null | undefined): boolean {
  if (!data) return false
  return extrairData(data) === hoje()
}

/**
 * Verifica se uma data é ontem no fuso de São Paulo
 */
export function ehOntemBrasil(data: Date | string | null | undefined): boolean {
  if (!data) return false
  return extrairData(data) === ontem()
}

/**
 * Retorna a segunda-feira da semana para uma data
 * Usado para reset semanal de questões
 */
export function getSegundaFeiraSemana(data?: Date | string): string {
  const d = data ? paraFusoBrasil(data) : agora()
  const dayOfWeek = d.getDay()
  // Domingo = 0, Segunda = 1, ...
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  d.setDate(d.getDate() - diff)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Verifica se duas datas são do mesmo dia no fuso de São Paulo
 */
export function mesmoDia(data1: Date | string | null, data2: Date | string | null): boolean {
  if (!data1 || !data2) return false
  return extrairData(data1) === extrairData(data2)
}

/**
 * Verifica se a data é de dias consecutivos (para streak)
 */
export function diasConsecutivos(dataAnterior: Date | string | null, dataAtual: Date | string | null): boolean {
  if (!dataAnterior || !dataAtual) return false

  const anterior = extrairData(dataAnterior)
  const atual = extrairData(dataAtual)
  const ontemStr = ontem()

  // Se a data atual é hoje e a anterior é ontem
  if (atual === hoje() && anterior === ontemStr) {
    return true
  }

  // Calcular diferença em dias
  const d1 = new Date(anterior!)
  const d2 = new Date(atual!)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays === 1
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
export function formatarDataBrasil(data: Date | string | null | undefined): string {
  if (!data) return '-'
  const d = paraFusoBrasil(data)
  return d.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formata data e hora para exibição (DD/MM/YYYY HH:mm)
 */
export function formatarDataHoraBrasil(data: Date | string | null | undefined): string {
  if (!data) return '-'
  const d = paraFusoBrasil(data)
  return d.toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Retorna timestamp ISO no fuso de São Paulo
 * Útil para salvar no banco com o fuso correto
 */
export function timestampBrasil(): string {
  return new Date().toLocaleString('sv-SE', {
    timeZone: TIMEZONE
  }).replace(' ', 'T') + '.000Z'
}

/**
 * Verifica se está dentro do período de um bimestre
 */
export function dentroDoPeríodo(inicio: string, fim: string): boolean {
  const hojeStr = hoje()
  return hojeStr >= inicio && hojeStr <= fim
}

/**
 * Retorna o início do dia no fuso de São Paulo
 */
export function inicioDoDia(data?: Date | string): Date {
  const d = data ? paraFusoBrasil(data) : agora()
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Retorna o fim do dia no fuso de São Paulo
 */
export function fimDoDia(data?: Date | string): Date {
  const d = data ? paraFusoBrasil(data) : agora()
  d.setHours(23, 59, 59, 999)
  return d
}
