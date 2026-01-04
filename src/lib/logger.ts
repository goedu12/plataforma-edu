/**
 * Utilitário de Logging Seguro
 *
 * - Mascara dados sensíveis (PII)
 * - Debug apenas com DEBUG=true
 * - Nunca expõe senhas, chaves ou emails completos
 */

// Padrões para identificar dados sensíveis
const SENSITIVE_PATTERNS = {
  // Emails: mostra apenas primeiros 3 caracteres
  email: /([a-zA-Z0-9._+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  // Chaves de API (Supabase, Gemini, JWT)
  apiKey: /(eyJ[a-zA-Z0-9_-]+\.?[a-zA-Z0-9_-]*\.?[a-zA-Z0-9_-]*)/g,
  geminiKey: /(AIza[a-zA-Z0-9_-]{35})/g,
  // Senhas (quando em objetos)
  password: /(senha|password|secret|key)["']?\s*[:=]\s*["']?([^"'\s,}]+)/gi,
  // CPF
  cpf: /(\d{3})[.\s]?(\d{3})[.\s]?(\d{3})[.\s-]?(\d{2})/g,
  // Telefone
  phone: /(\(\d{2}\)\s?|\d{2}[\s.-]?)(\d{4,5})[\s.-]?(\d{4})/g,
}

/**
 * Mascara dados sensíveis em uma string
 */
export function maskSensitiveData(data: unknown): string {
  if (data === null || data === undefined) {
    return String(data)
  }

  let text: string
  if (typeof data === 'object') {
    try {
      text = JSON.stringify(data, null, 2)
    } catch {
      text = String(data)
    }
  } else {
    text = String(data)
  }

  // Mascarar emails: joao***@***.com
  text = text.replace(SENSITIVE_PATTERNS.email, (_, user, domain) => {
    const maskedUser = user.slice(0, 3) + '***'
    const domainParts = domain.split('.')
    const maskedDomain = '***.' + domainParts[domainParts.length - 1]
    return `${maskedUser}@${maskedDomain}`
  })

  // Mascarar chaves JWT/Supabase
  text = text.replace(SENSITIVE_PATTERNS.apiKey, 'eyJ***[REDACTED]')

  // Mascarar chaves Gemini
  text = text.replace(SENSITIVE_PATTERNS.geminiKey, 'AIza***[REDACTED]')

  // Mascarar senhas
  text = text.replace(SENSITIVE_PATTERNS.password, '$1: "[REDACTED]"')

  // Mascarar CPF
  text = text.replace(SENSITIVE_PATTERNS.cpf, '$1.***.***-**')

  // Mascarar telefone
  text = text.replace(SENSITIVE_PATTERNS.phone, '($1) ****-$3')

  return text
}

/**
 * Verifica se debug está habilitado
 */
function isDebugEnabled(): boolean {
  return process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development'
}

/**
 * Logger seguro com níveis
 */
export const logger = {
  /**
   * Log de debug (apenas em desenvolvimento ou DEBUG=true)
   */
  debug(message: string, data?: unknown): void {
    if (!isDebugEnabled()) return
    const masked = data !== undefined ? maskSensitiveData(data) : ''
    console.log(`[DEBUG] ${message}`, masked)
  },

  /**
   * Log de informação
   */
  info(message: string, data?: unknown): void {
    const masked = data !== undefined ? maskSensitiveData(data) : ''
    console.info(`[INFO] ${message}`, masked)
  },

  /**
   * Log de aviso
   */
  warn(message: string, data?: unknown): void {
    const masked = data !== undefined ? maskSensitiveData(data) : ''
    console.warn(`[WARN] ${message}`, masked)
  },

  /**
   * Log de erro
   */
  error(message: string, error?: unknown): void {
    // Para erros, mascarar stack trace também
    let errorInfo = ''
    if (error instanceof Error) {
      errorInfo = maskSensitiveData({
        name: error.name,
        message: error.message,
        stack: isDebugEnabled() ? error.stack : undefined
      })
    } else if (error !== undefined) {
      errorInfo = maskSensitiveData(error)
    }
    console.error(`[ERROR] ${message}`, errorInfo)
  },

  /**
   * Log de requisição API (sem dados sensíveis)
   */
  request(method: string, path: string, statusCode?: number): void {
    const status = statusCode ? `[${statusCode}]` : ''
    console.info(`[REQUEST] ${method} ${path} ${status}`)
  }
}

/**
 * Verifica se SUPABASE_SERVICE_KEY está sendo usada corretamente
 * Deve ser chamada apenas no servidor
 */
export function auditServiceKey(): void {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    logger.warn('SUPABASE_SERVICE_KEY não configurada')
    return
  }

  // Em produção, verificar que não está exposta
  if (process.env.NODE_ENV === 'production') {
    // Verificar que não começa com NEXT_PUBLIC_
    if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY) {
      logger.error('ALERTA DE SEGURANÇA: SUPABASE_SERVICE_KEY está exposta como NEXT_PUBLIC_!')
      throw new Error('Configuração de segurança inválida')
    }
  }
}

export default logger
