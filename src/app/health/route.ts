import { NextResponse } from 'next/server'

// Endpoint simples para health check / keep-alive
// URL: /health (mais curto que /api/health)
export async function GET() {
  return NextResponse.json({ status: 'ok' }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}

export const dynamic = 'force-dynamic'
