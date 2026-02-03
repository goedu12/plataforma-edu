// ═══════════════════════════════════════════════════════════════════════════
// Trilha Gabarito Store (In-Memory)
// Cache server-side das respostas corretas das questões de trilhas
// Evita que o client envie resposta_correta (anti-cola)
// ═══════════════════════════════════════════════════════════════════════════

interface GabaritoEntry {
  resposta_correta: string
  timestamp: number
}

const gabaritos = new Map<string, GabaritoEntry>()

// Limpar entradas com mais de 2h (questões expiradas)
const TTL = 2 * 60 * 60 * 1000
const LIMPEZA_INTERVALO = 10 * 60 * 1000
let ultimaLimpeza = Date.now()

function limparExpirados() {
  const agora = Date.now()
  if (agora - ultimaLimpeza < LIMPEZA_INTERVALO) return
  ultimaLimpeza = agora
  for (const [key, entry] of gabaritos.entries()) {
    if (agora - entry.timestamp > TTL) {
      gabaritos.delete(key)
    }
  }
}

/** Registra a resposta correta de uma questão gerada (chamado pela API de questões) */
export function registrarGabarito(questaoId: string, respostaCorreta: string) {
  gabaritos.set(questaoId, {
    resposta_correta: respostaCorreta.toUpperCase(),
    timestamp: Date.now(),
  })
  limparExpirados()
}

/** Busca a resposta correta de uma questão (chamado pela API de responder) */
export function buscarGabarito(questaoId: string): string | null {
  const entry = gabaritos.get(questaoId)
  if (!entry) return null
  if (Date.now() - entry.timestamp > TTL) {
    gabaritos.delete(questaoId)
    return null
  }
  return entry.resposta_correta
}
