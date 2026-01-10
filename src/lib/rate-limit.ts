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
