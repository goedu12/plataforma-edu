/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SISTEMA DE RATE LIMITING
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Implementa rate limiting em memória para proteger as APIs.
 * Em produção, considere usar Redis para persistência entre instâncias.
 */

import { RATE_LIMIT_CONFIG } from './utils'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Armazenamento em memória (para produção, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 1000) // Limpa a cada minuto

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // segundos até reset
  limit: number
}

/**
 * Verifica se uma requisição deve ser permitida baseada no rate limit
 * @param identifier - Identificador único (userId, IP, etc.)
 * @param limit - Número máximo de requisições permitidas
 * @param windowMs - Janela de tempo em milissegundos
 * @returns Resultado do rate limiting
 */
export function checkRateLimit(
  identifier: string,
  limit: number = RATE_LIMIT_CONFIG.MAX_REQUESTS_API,
  windowMs: number = RATE_LIMIT_CONFIG.WINDOW_MS
): RateLimitResult {
  const now = Date.now()
  const key = `rate:${identifier}`

  let entry = rateLimitStore.get(key)

  // Se não existe ou expirou, criar nova entrada
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)
  }

  // Incrementar contador
  entry.count++

  const allowed = entry.count <= limit
  const remaining = Math.max(0, limit - entry.count)
  const resetIn = Math.ceil((entry.resetTime - now) / 1000)

  return {
    allowed,
    remaining,
    resetIn,
    limit,
  }
}

/**
 * Rate limiter específico para respostas de questões
 * Mais restritivo para evitar abuso
 */
export function checkRespostaRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(
    `resposta:${userId}`,
    RATE_LIMIT_CONFIG.MAX_REQUESTS_RESPOSTA,
    RATE_LIMIT_CONFIG.WINDOW_MS
  )
}

/**
 * Rate limiter para APIs gerais
 */
export function checkApiRateLimit(identifier: string): RateLimitResult {
  return checkRateLimit(
    `api:${identifier}`,
    RATE_LIMIT_CONFIG.MAX_REQUESTS_API,
    RATE_LIMIT_CONFIG.WINDOW_MS
  )
}

/**
 * Gera headers de rate limit para resposta HTTP
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetIn.toString(),
  }
}

/**
 * Reseta o rate limit para um identificador específico
 * Útil para testes ou situações especiais
 */
export function resetRateLimit(identifier: string): void {
  const key = `rate:${identifier}`
  rateLimitStore.delete(key)
}

// ═══════════════════════════════════════════════════════════════════════════
// DETECÇÃO DE PADRÕES SUSPEITOS (Anti-automação)
// ═══════════════════════════════════════════════════════════════════════════

interface PatternEntry {
  respostas: Array<{ tempo: number; correta: boolean; timestamp: number }>
  alertas: number
}

const patternStore = new Map<string, PatternEntry>()

// Limpar padrões antigos a cada 5 minutos
setInterval(() => {
  const agora = Date.now()
  const EXPIRACAO = 10 * 60 * 1000 // 10 minutos
  for (const [key, entry] of patternStore.entries()) {
    // Remover respostas antigas
    entry.respostas = entry.respostas.filter(r => agora - r.timestamp < EXPIRACAO)
    if (entry.respostas.length === 0 && entry.alertas === 0) {
      patternStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface SuspiciousResult {
  suspeito: boolean
  motivo?: string
  nivel: 'ok' | 'atencao' | 'suspeito' | 'bloqueado'
  alertas: number
}

/**
 * Registra e analisa padrões de resposta para detectar automação
 */
export function analisarPadrao(
  userId: string,
  tempoSegundos: number,
  correta: boolean
): SuspiciousResult {
  const key = `pattern:${userId}`
  const agora = Date.now()

  let entry = patternStore.get(key)
  if (!entry) {
    entry = { respostas: [], alertas: 0 }
    patternStore.set(key, entry)
  }

  // Registrar resposta
  entry.respostas.push({ tempo: tempoSegundos, correta, timestamp: agora })

  // Manter apenas últimas 20 respostas
  if (entry.respostas.length > 20) {
    entry.respostas = entry.respostas.slice(-20)
  }

  const respostasRecentes = entry.respostas.filter(
    r => agora - r.timestamp < 5 * 60 * 1000 // últimos 5 minutos
  )

  // Análise de padrões suspeitos
  let motivo: string | undefined
  let nivel: SuspiciousResult['nivel'] = 'ok'

  // 1. Muitas respostas muito rápidas
  const respostasRapidas = respostasRecentes.filter(
    r => r.tempo < RATE_LIMIT_CONFIG.TEMPO_SUSPEITO_SEGUNDOS
  )
  if (respostasRapidas.length >= 5) {
    motivo = 'Muitas respostas em tempo muito curto'
    nivel = 'suspeito'
    entry.alertas++
  }

  // 2. Taxa de acerto perfeita com tempo baixo (muito suspeito)
  if (respostasRecentes.length >= 8) {
    const todasCorretas = respostasRecentes.every(r => r.correta)
    const tempoMedio = respostasRecentes.reduce((s, r) => s + r.tempo, 0) / respostasRecentes.length
    if (todasCorretas && tempoMedio < 10) {
      motivo = '100% de acerto com tempo médio muito baixo'
      nivel = 'suspeito'
      entry.alertas += 2
    }
  }

  // 3. Tempo exatamente igual em múltiplas respostas (automação)
  const temposIguais = respostasRecentes.filter(r => r.tempo === tempoSegundos)
  if (temposIguais.length >= 4 && tempoSegundos < 10) {
    motivo = 'Tempo de resposta idêntico repetidamente'
    nivel = 'suspeito'
    entry.alertas++
  }

  // 4. Resposta instantânea (tempo 0 ou 1)
  if (tempoSegundos <= 1) {
    motivo = 'Resposta instantânea (possível automação)'
    nivel = nivel === 'suspeito' ? 'bloqueado' : 'atencao'
    entry.alertas++
  }

  // Nível de bloqueio por acúmulo de alertas
  if (entry.alertas >= 10) {
    nivel = 'bloqueado'
    motivo = 'Muitos padrões suspeitos detectados'
  } else if (entry.alertas >= 5) {
    nivel = nivel === 'ok' ? 'atencao' : nivel
  }

  return {
    suspeito: nivel === 'suspeito' || nivel === 'bloqueado',
    motivo,
    nivel,
    alertas: entry.alertas,
  }
}

/**
 * Verifica tempo mínimo de resposta
 */
export function verificarTempoMinimo(tempoSegundos: number): {
  valido: boolean
  tempoMinimo: number
} {
  return {
    valido: tempoSegundos >= RATE_LIMIT_CONFIG.TEMPO_MINIMO_RESPOSTA_SEGUNDOS,
    tempoMinimo: RATE_LIMIT_CONFIG.TEMPO_MINIMO_RESPOSTA_SEGUNDOS,
  }
}
