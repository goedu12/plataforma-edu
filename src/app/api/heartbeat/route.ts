import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'

// ═══════════════════════════════════════════════════════════════════════════
// API: Heartbeat do Estudante (In-Memory)
// Registra presença do aluno sem gravar no banco de dados
// Projetado para não consumir quota do Supabase
// ═══════════════════════════════════════════════════════════════════════════

export interface HeartbeatEntry {
  userId: string
  timestamp: number // Date.now()
  ultimaInteracao: number // timestamp da última interação real (click, tecla, scroll)
}

// Store em memória - limpo automaticamente a cada 10 min
const heartbeats = new Map<string, HeartbeatEntry>()
let ultimaLimpeza = Date.now()
const LIMPEZA_INTERVALO = 10 * 60 * 1000 // 10 min
const HEARTBEAT_EXPIRY = 5 * 60 * 1000 // 5 min sem heartbeat = offline

// Flag: professor está monitorando?
let professorMonitorando = false
let professorMonitorandoTimestamp = 0
const MONITOR_EXPIRY = 30 * 1000 // 30s sem refresh = professor saiu

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

// POST: Estudante envia heartbeat
export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    // Professor sinalizando que está monitorando
    if (sessao.tipo === 'professor') {
      professorMonitorando = true
      professorMonitorandoTimestamp = Date.now()
      return NextResponse.json({ ok: true })
    }

    // Estudante enviando heartbeat
    const body = await request.json().catch(() => ({}))
    const ultimaInteracao = body.ultimaInteracao || Date.now()

    heartbeats.set(sessao.userId, {
      userId: sessao.userId,
      timestamp: Date.now(),
      ultimaInteracao,
    })

    limparExpirados()

    // Verificar se professor está monitorando (expira em 30s)
    const monitorando = professorMonitorando &&
      (Date.now() - professorMonitorandoTimestamp) < MONITOR_EXPIRY

    return NextResponse.json({
      ok: true,
      monitorando,
    }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// GET: Professor consulta heartbeats (usado pela API atividades-tempo-real)
export async function GET() {
  try {
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json({ ok: false }, { status: 403 })
    }

    // Sinalizar que professor está monitorando
    professorMonitorando = true
    professorMonitorandoTimestamp = Date.now()

    limparExpirados()

    const agora = Date.now()
    const OCIOSO_THRESHOLD = 2 * 60 * 1000 // 2 min sem interação = ocioso

    const resultado: Record<string, {
      status: 'ativo' | 'ocioso' | 'offline'
      ultimoHeartbeat: number
      ultimaInteracao: number
      tempoOcioso: number // segundos
    }> = {}

    for (const [userId, entry] of heartbeats.entries()) {
      const tempoSemHeartbeat = agora - entry.timestamp
      const tempoSemInteracao = agora - entry.ultimaInteracao

      if (tempoSemHeartbeat > HEARTBEAT_EXPIRY) {
        // Sem heartbeat por muito tempo = offline (será limpo)
        continue
      }

      const isOcioso = tempoSemInteracao > OCIOSO_THRESHOLD
      resultado[userId] = {
        status: isOcioso ? 'ocioso' : 'ativo',
        ultimoHeartbeat: entry.timestamp,
        ultimaInteracao: entry.ultimaInteracao,
        tempoOcioso: isOcioso ? Math.floor(tempoSemInteracao / 1000) : 0,
      }
    }

    return NextResponse.json({
      ok: true,
      heartbeats: resultado,
      total: Object.keys(resultado).length,
    }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
