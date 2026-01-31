export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import {
  registrarHeartbeat,
  sinalizarProfessorMonitorando,
  isProfessorMonitorando,
  consultarHeartbeats,
} from '@/lib/heartbeat-store'

// POST: Estudante envia heartbeat / Professor sinaliza monitoramento
export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    if (sessao.tipo === 'professor') {
      sinalizarProfessorMonitorando()
      return NextResponse.json({ ok: true })
    }

    const body = await request.json().catch(() => ({}))
    const ultimaInteracao = body.ultimaInteracao || Date.now()

    registrarHeartbeat(sessao.userId, ultimaInteracao)

    return NextResponse.json({
      ok: true,
      monitorando: isProfessorMonitorando(),
    }, {
      headers: { 'Cache-Control': 'no-store' }
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// GET: Professor consulta heartbeats
export async function GET() {
  try {
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json({ ok: false }, { status: 403 })
    }

    const resultado = consultarHeartbeats()

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
