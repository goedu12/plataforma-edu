// ═══════════════════════════════════════════════════════════════════════════
// Heartbeat Store (In-Memory Compartilhado)
// Módulo singleton usado por /api/heartbeat e /api/professor/atividades-tempo-real
// Evita fetch HTTP interno (self-call) que falha em serverless
// ═══════════════════════════════════════════════════════════════════════════

export interface HeartbeatEntry {
  userId: string
  timestamp: number
  ultimaInteracao: number
}

export interface HeartbeatStatus {
  status: 'ativo' | 'ocioso'
  ultimoHeartbeat: number
  ultimaInteracao: number
  tempoOcioso: number // segundos
}

const HEARTBEAT_EXPIRY = 5 * 60 * 1000 // 5 min sem heartbeat = offline
const OCIOSO_THRESHOLD = 2 * 60 * 1000 // 2 min sem interação = ocioso
const LIMPEZA_INTERVALO = 10 * 60 * 1000 // limpar a cada 10 min

const heartbeats = new Map<string, HeartbeatEntry>()
let ultimaLimpeza = Date.now()

// Flag: professor monitorando
let professorMonitorando = false
let professorMonitorandoTimestamp = 0
const MONITOR_EXPIRY = 30 * 1000 // 30s

function limparExpirados() {
  const agora = Date.now()
  if (agora - ultimaLimpeza < LIMPEZA_INTERVALO) return
  ultimaLimpeza = agora
  for (const [key, entry] of heartbeats.entries()) {
    if (agora - entry.timestamp > HEARTBEAT_EXPIRY) {
      heartbeats.delete(key)
    }
  }
}

// Estudante registra heartbeat
export function registrarHeartbeat(userId: string, ultimaInteracao: number) {
  heartbeats.set(userId, {
    userId,
    timestamp: Date.now(),
    ultimaInteracao,
  })
  limparExpirados()
}

// Professor sinaliza que está monitorando
export function sinalizarProfessorMonitorando() {
  professorMonitorando = true
  professorMonitorandoTimestamp = Date.now()
}

// Estudante consulta se professor está monitorando
export function isProfessorMonitorando(): boolean {
  return professorMonitorando &&
    (Date.now() - professorMonitorandoTimestamp) < MONITOR_EXPIRY
}

// Professor consulta todos os heartbeats (usado direto, sem HTTP)
export function consultarHeartbeats(): Record<string, HeartbeatStatus> {
  sinalizarProfessorMonitorando()
  limparExpirados()

  const agora = Date.now()
  const resultado: Record<string, HeartbeatStatus> = {}

  for (const [userId, entry] of heartbeats.entries()) {
    if (agora - entry.timestamp > HEARTBEAT_EXPIRY) continue

    const tempoSemInteracao = agora - entry.ultimaInteracao
    const isOcioso = tempoSemInteracao > OCIOSO_THRESHOLD

    resultado[userId] = {
      status: isOcioso ? 'ocioso' : 'ativo',
      ultimoHeartbeat: entry.timestamp,
      ultimaInteracao: entry.ultimaInteracao,
      tempoOcioso: isOcioso ? Math.floor(tempoSemInteracao / 1000) : 0,
    }
  }

  return resultado
}
