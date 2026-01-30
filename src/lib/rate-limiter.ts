// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITER - Proteção contra brute force
// ═══════════════════════════════════════════════════════════════════════════

interface RateLimitEntry {
  tentativas: number
  primeiroErro: number
  bloqueadoAte: number | null
}

// Cache em memória para rate limiting
const loginAttempts = new Map<string, RateLimitEntry>()

// Configurações
const CONFIG = {
  MAX_TENTATIVAS: 25,          // Máximo de tentativas antes de bloquear
  JANELA_TEMPO_MS: 15 * 60 * 1000,  // 15 minutos para reset das tentativas
  TEMPO_BLOQUEIO_MS: 15 * 60 * 1000, // 15 minutos de bloqueio
  LIMPEZA_INTERVALO_MS: 5 * 60 * 1000, // Limpar cache a cada 5 minutos
}

// Limpar entradas antigas periodicamente
let ultimaLimpeza = Date.now()

function limparEntradasAntigas() {
  const agora = Date.now()

  // Só limpa se passou o intervalo
  if (agora - ultimaLimpeza < CONFIG.LIMPEZA_INTERVALO_MS) return

  ultimaLimpeza = agora

  for (const [ip, entry] of loginAttempts.entries()) {
    // Remove entradas que não estão bloqueadas e passaram da janela de tempo
    const passouJanela = agora - entry.primeiroErro > CONFIG.JANELA_TEMPO_MS
    const bloqueioExpirou = entry.bloqueadoAte && agora > entry.bloqueadoAte

    if ((passouJanela && !entry.bloqueadoAte) || bloqueioExpirou) {
      loginAttempts.delete(ip)
    }
  }
}

/**
 * Verifica se um IP está bloqueado
 * @returns objeto com status e tempo restante de bloqueio
 */
export function verificarRateLimit(ip: string): {
  bloqueado: boolean
  tentativasRestantes: number
  tempoRestanteMs: number
  mensagem?: string
} {
  limparEntradasAntigas()

  const agora = Date.now()
  const entry = loginAttempts.get(ip)

  // Sem histórico - permitir
  if (!entry) {
    return {
      bloqueado: false,
      tentativasRestantes: CONFIG.MAX_TENTATIVAS,
      tempoRestanteMs: 0,
    }
  }

  // Verificar se está bloqueado
  if (entry.bloqueadoAte) {
    if (agora < entry.bloqueadoAte) {
      const tempoRestante = entry.bloqueadoAte - agora
      const minutosRestantes = Math.ceil(tempoRestante / 60000)
      return {
        bloqueado: true,
        tentativasRestantes: 0,
        tempoRestanteMs: tempoRestante,
        mensagem: `Muitas tentativas falhas. Tente novamente em ${minutosRestantes} minuto${minutosRestantes > 1 ? 's' : ''}.`,
      }
    } else {
      // Bloqueio expirou - limpar
      loginAttempts.delete(ip)
      return {
        bloqueado: false,
        tentativasRestantes: CONFIG.MAX_TENTATIVAS,
        tempoRestanteMs: 0,
      }
    }
  }

  // Verificar se passou a janela de tempo (reset das tentativas)
  if (agora - entry.primeiroErro > CONFIG.JANELA_TEMPO_MS) {
    loginAttempts.delete(ip)
    return {
      bloqueado: false,
      tentativasRestantes: CONFIG.MAX_TENTATIVAS,
      tempoRestanteMs: 0,
    }
  }

  // Retornar tentativas restantes
  const tentativasRestantes = CONFIG.MAX_TENTATIVAS - entry.tentativas
  return {
    bloqueado: false,
    tentativasRestantes: Math.max(0, tentativasRestantes),
    tempoRestanteMs: 0,
  }
}

/**
 * Registra uma tentativa de login falha
 * @returns true se o IP foi bloqueado após esta tentativa
 */
export function registrarTentativaFalha(ip: string): boolean {
  const agora = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry) {
    // Primeira tentativa falha
    loginAttempts.set(ip, {
      tentativas: 1,
      primeiroErro: agora,
      bloqueadoAte: null,
    })
    return false
  }

  // Incrementar tentativas
  entry.tentativas++

  // Verificar se atingiu o limite
  if (entry.tentativas >= CONFIG.MAX_TENTATIVAS) {
    entry.bloqueadoAte = agora + CONFIG.TEMPO_BLOQUEIO_MS
    return true
  }

  return false
}

/**
 * Limpa as tentativas de um IP após login bem-sucedido
 */
export function limparTentativas(ip: string): void {
  loginAttempts.delete(ip)
}

/**
 * Obtém o IP do cliente de uma requisição
 */
export function obterIP(request: Request): string {
  // Tentar headers de proxy reverso
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Pegar o primeiro IP (cliente original)
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback para IP genérico (não ideal, mas funciona para desenvolvimento)
  return 'unknown'
}
