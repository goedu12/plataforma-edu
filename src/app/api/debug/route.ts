import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// DEBUG: Testar conexão com Supabase
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Testar query simples
    const { data, error, count } = await supabase
      .from('usuarios')
      .select('email, nome, tipo, ativo', { count: 'exact' })
      .limit(5)

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Erro ao conectar com Supabase',
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Conexão com Supabase funcionando',
      totalUsuarios: count,
      amostra: data?.map(u => ({ email: u.email, nome: u.nome, tipo: u.tipo, ativo: u.ativo }))
    })
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: 'Exceção ao conectar',
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
  }
}
