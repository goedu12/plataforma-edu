import { NextResponse } from 'next/server'

// Endpoint de diagnóstico simples - BUILD ID: 20260104-v1
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    build: '20260104-v1',
    env: {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_ANON: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
      SUPABASE_SERVICE: (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'SET' : 'MISSING',
      GEMINI: process.env.GEMINI_API_KEY ? 'SET' : 'MISSING',
      JWT: process.env.JWT_SECRET ? 'SET' : 'MISSING',
    }
  })
}
