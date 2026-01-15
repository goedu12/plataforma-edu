// ═══════════════════════════════════════════════════════════════════════════
// CACHE DE RESPOSTAS IA - Reduz requisições ao Gemini
// Perguntas similares retornam respostas cacheadas
// ═══════════════════════════════════════════════════════════════════════════

interface CacheEntry {
  resposta: string
  timestamp: number
  hits: number
}

// Cache em memória (em produção, usar Redis)
const cacheRespostas = new Map<string, CacheEntry>()

// Configurações
const CONFIG = {
  TTL_MS: 24 * 60 * 60 * 1000, // 24 horas
  MAX_ENTRIES: 1000,           // Máximo de entradas
  SIMILARITY_THRESHOLD: 0.85,  // Similaridade mínima para cache hit
  LIMPEZA_INTERVALO: 60 * 60 * 1000, // Limpar a cada 1 hora
}

let ultimaLimpeza = Date.now()

/**
 * Normaliza texto para comparação
 */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '')          // Remove pontuação
    .replace(/\s+/g, ' ')             // Normaliza espaços
    .trim()
}

/**
 * Gera chave de cache baseada na pergunta normalizada
 */
function gerarChaveCache(componente: string, pergunta: string): string {
  const normalizada = normalizarTexto(pergunta)
  // Usar primeiras 100 chars para chave (perguntas longas)
  const chave = normalizada.slice(0, 100)
  return `${componente}:${chave}`
}

/**
 * Calcula similaridade entre duas strings (Jaccard simplificado)
 */
function calcularSimilaridade(a: string, b: string): number {
  const wordsA = new Set(normalizarTexto(a).split(' '))
  const wordsB = new Set(normalizarTexto(b).split(' '))

  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)))
  const union = new Set([...wordsA, ...wordsB])

  return intersection.size / union.size
}

/**
 * Limpa entradas expiradas do cache
 */
function limparCache(): void {
  const agora = Date.now()

  if (agora - ultimaLimpeza < CONFIG.LIMPEZA_INTERVALO) return
  ultimaLimpeza = agora

  // Remover expiradas
  for (const [chave, entry] of cacheRespostas.entries()) {
    if (agora - entry.timestamp > CONFIG.TTL_MS) {
      cacheRespostas.delete(chave)
    }
  }

  // Se ainda muito cheio, remover as menos usadas
  if (cacheRespostas.size > CONFIG.MAX_ENTRIES) {
    const entries = [...cacheRespostas.entries()]
      .sort((a, b) => a[1].hits - b[1].hits)

    const toRemove = entries.slice(0, entries.length - CONFIG.MAX_ENTRIES)
    toRemove.forEach(([chave]) => cacheRespostas.delete(chave))
  }
}

/**
 * Busca resposta no cache
 */
export function buscarNoCache(
  componente: string,
  pergunta: string
): { encontrado: boolean; resposta?: string; similaridade?: number } {
  limparCache()

  const chavePrincipal = gerarChaveCache(componente, pergunta)

  // Busca exata
  const entryExata = cacheRespostas.get(chavePrincipal)
  if (entryExata && Date.now() - entryExata.timestamp < CONFIG.TTL_MS) {
    entryExata.hits++
    console.log(`[Cache IA] HIT exato para: ${chavePrincipal.slice(0, 50)}...`)
    return { encontrado: true, resposta: entryExata.resposta, similaridade: 1 }
  }

  // Busca por similaridade (mais custosa, mas encontra variações)
  const perguntaNormalizada = normalizarTexto(pergunta)

  for (const [chave, entry] of cacheRespostas.entries()) {
    if (!chave.startsWith(componente + ':')) continue
    if (Date.now() - entry.timestamp > CONFIG.TTL_MS) continue

    const chavePergunta = chave.slice(componente.length + 1)
    const similaridade = calcularSimilaridade(perguntaNormalizada, chavePergunta)

    if (similaridade >= CONFIG.SIMILARITY_THRESHOLD) {
      entry.hits++
      console.log(`[Cache IA] HIT similar (${Math.round(similaridade * 100)}%) para: ${pergunta.slice(0, 50)}...`)
      return { encontrado: true, resposta: entry.resposta, similaridade }
    }
  }

  console.log(`[Cache IA] MISS para: ${pergunta.slice(0, 50)}...`)
  return { encontrado: false }
}

/**
 * Salva resposta no cache
 */
export function salvarNoCache(
  componente: string,
  pergunta: string,
  resposta: string
): void {
  const chave = gerarChaveCache(componente, pergunta)

  cacheRespostas.set(chave, {
    resposta,
    timestamp: Date.now(),
    hits: 1,
  })

  console.log(`[Cache IA] Salvou: ${chave.slice(0, 50)}... (${cacheRespostas.size} entradas)`)
}

/**
 * Estatísticas do cache
 */
export function estatisticasCache(): {
  entradas: number
  hitsTotais: number
  idadeMediaHoras: number
} {
  const agora = Date.now()
  let hitsTotais = 0
  let somaIdade = 0

  for (const entry of cacheRespostas.values()) {
    hitsTotais += entry.hits
    somaIdade += agora - entry.timestamp
  }

  return {
    entradas: cacheRespostas.size,
    hitsTotais,
    idadeMediaHoras: cacheRespostas.size > 0
      ? Math.round((somaIdade / cacheRespostas.size) / (1000 * 60 * 60))
      : 0,
  }
}

/**
 * Lista perguntas mais frequentes (para análise)
 */
export function perguntasFrequentes(limite = 10): Array<{ pergunta: string; hits: number }> {
  return [...cacheRespostas.entries()]
    .map(([chave, entry]) => ({
      pergunta: chave.split(':')[1] || chave,
      hits: entry.hits,
    }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, limite)
}
