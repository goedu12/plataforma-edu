// ═══════════════════════════════════════════════════════════════════════════
// Heartbeat Store - Estado compartilhado entre APIs
// Armazenamento em memória (sem custo no Supabase)
// ═══════════════════════════════════════════════════════════════════════════

interface HeartbeatEntry {
  ultimo_ping: number
  ultima_interacao: number
  componente: string
}

// Cache em memória - chave = usuario_id
const heartbeats = new Map<string, HeartbeatEntry>()

const LIMPEZA_INTERVALO = 2 * 60 * 1000
const HEARTBEAT_TTL = 3 * 60 * 1000 // 3 min sem ping = offline
let ultimaLimpeza = Date.now()

function limparAntigas() {
  const agora = Date.now()
  if (agora - ultimaLimpeza < LIMPEZA_INTERVALO) return
  ultimaLimpeza = agora
  for (const [key, entry] of heartbeats.entries()) {
    if (agora - entry.ultimo_ping > HEARTBEAT_TTL) {
      heartbeats.delete(key)
    }
  }
}

export function getHeartbeats(): Map<string, HeartbeatEntry> {
  limparAntigas()
  return heartbeats
}

export function setHeartbeat(userId: string, entry: HeartbeatEntry) {
  heartbeats.set(userId, entry)
}

export function getHeartbeat(userId: string): HeartbeatEntry | undefined {
  return heartbeats.get(userId)
}

// Classificação: ocioso se >60s sem interação real
export const OCIOSO_TIMEOUT_MS = 60 * 1000

// Professor monitoring
const professorHeartbeats = new Map<string, number>()
const PROFESSOR_TTL = 15 * 1000

export function setProfessorHeartbeat(userId: string) {
  professorHeartbeats.set(userId, Date.now())
}

export function isProfessorMonitorando(): boolean {
  const agora = Date.now()
  for (const [key, timestamp] of professorHeartbeats.entries()) {
    if (agora - timestamp > PROFESSOR_TTL) {
      professorHeartbeats.delete(key)
    }
  }
  return professorHeartbeats.size > 0
}
