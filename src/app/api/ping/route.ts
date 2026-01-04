import { NextResponse } from 'next/server'

// Força rota dinâmica (sem cache)
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Endpoint de diagnóstico - BLOQUEADO em produção
// Use /api/health para health checks em produção
export async function GET() {
  // Bloquear em produção por segurança
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint desabilitado em produção. Use /api/health' },
      { status: 403 }
    )
  }

  // Apenas desenvolvimento/teste
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    build: '20260104-v3',
    env: {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_ANON: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      SUPABASE_SERVICE: (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'SET' : 'MISSING',
      GEMINI: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
      JWT: process.env.JWT_SECRET ? 'SET' : 'MISSING',
    }
  })
}
