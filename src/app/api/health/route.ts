import { NextResponse } from 'next/server'

// Força rota dinâmica (sem cache) - essencial para health checks
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Health Check Endpoint para Google Cloud Run
 *
 * Retorna apenas status básico, sem informações sensíveis.
 * Use este endpoint para:
 * - Liveness probes do Cloud Run
 * - Readiness probes
 * - Monitoramento de uptime
 */
export async function GET() {
  try {
    // Verificação básica de que a aplicação está respondendo
    const timestamp = new Date().toISOString()

    return NextResponse.json({
      status: 'ok',
      timestamp
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
  } catch {
    // Se algo falhar, retornar erro genérico
    return NextResponse.json({
      status: 'error'
    }, { status: 500 })
  }
}
