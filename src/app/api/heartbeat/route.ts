import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import {
  getHeartbeat,
  setHeartbeat,
  setProfessorHeartbeat,
  isProfessorMonitorando,
} from '@/lib/heartbeat-store'

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const agora = Date.now()

    if (sessao.tipo === 'professor') {
      setProfessorHeartbeat(sessao.userId)
      return NextResponse.json({ ok: true })
    }

    // Estudante ping
    const existente = getHeartbeat(sessao.userId)

    setHeartbeat(sessao.userId, {
      ultimo_ping: agora,
      ultima_interacao: body.ativo ? agora : (existente?.ultima_interacao || agora),
      componente: body.componente || existente?.componente || '',
    })

    return NextResponse.json({
      ok: true,
      monitorado: isProfessorMonitorando(),
    })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
