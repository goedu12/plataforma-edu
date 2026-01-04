import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// DEBUG: Testar conexão com Supabase (criando cliente novo, sem cache)
export async function GET() {
  try {
    // Ler variáveis de ambiente diretamente
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    // Verificar se variáveis existem
    if (!url) {
      return NextResponse.json({
        status: 'error',
        message: 'NEXT_PUBLIC_SUPABASE_URL não configurada',
        url_value: url
      }, { status: 500 })
    }

    if (!serviceKey) {
      return NextResponse.json({
        status: 'error',
        message: 'SUPABASE_SERVICE_KEY não configurada',
        service_key_exists: false
      }, { status: 500 })
    }

    // Criar cliente novo (sem usar cache)
    const supabase = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Testar query simples
    const { data, error, count } = await supabase
      .from('usuarios')
      .select('email, nome, tipo, ativo', { count: 'exact' })
      .limit(5)

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Erro ao consultar Supabase',
        error: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details,
        url_used: url.substring(0, 30) + '...',
        service_key_length: serviceKey.length
      }, { status: 500 })
    }

    // Buscar professor especificamente
    const { data: professor, error: profError } = await supabase
      .from('usuarios')
      .select('email, nome, tipo, ativo')
      .eq('email', 'professor@admin')
      .single()

    return NextResponse.json({
      status: 'ok',
      message: 'Conexão com Supabase funcionando',
      url_used: url.substring(0, 30) + '...',
      service_key_length: serviceKey.length,
      totalUsuarios: count,
      professor_encontrado: professor ? true : false,
      professor_data: professor,
      professor_error: profError?.message,
      amostra: data?.map(u => ({
        email: u.email,
        nome: u.nome,
        tipo: u.tipo,
        ativo: u.ativo
      }))
    })
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: 'Exceção ao conectar',
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    }, { status: 500 })
  }
}
