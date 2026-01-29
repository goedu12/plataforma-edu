import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Força rota dinâmica (sem cache) - essencial para health checks
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const inicio = Date.now()

  try {
    const supabase = getSupabaseAdmin()

    // Verificar conectividade com o banco
    const { error } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1)
      .single()

    const latenciaDb = Date.now() - inicio

    // error code PGRST116 = "no rows" which is fine, means DB is reachable
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({
        status: 'degraded',
        db: 'error',
        dbLatencyMs: latenciaDb,
        timestamp: new Date().toISOString(),
      }, {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    return NextResponse.json({
      status: 'ok',
      db: 'ok',
      dbLatencyMs: latenciaDb,
      timestamp: new Date().toISOString(),
    }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({
      status: 'error',
      dbLatencyMs: Date.now() - inicio,
    }, { status: 500 })
  }
}
