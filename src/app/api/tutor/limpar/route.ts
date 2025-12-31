import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { componente } = await request.json()

    if (!componente) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente não informado' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Limpar histórico de chat do usuário para o componente
    await supabase
      .from('historico_chat')
      .delete()
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro ao limpar chat:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
