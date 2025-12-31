import { NextRequest, NextResponse } from 'next/server'
import { obterSessao, hashSenha } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const { usuario_id } = await request.json()

    if (!usuario_id) {
      return NextResponse.json(
        { sucesso: false, erro: 'ID do usuário não informado' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verificar se o usuário existe e é estudante
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, tipo')
      .eq('id', usuario_id)
      .single()

    if (!usuario || usuario.tipo !== 'estudante') {
      return NextResponse.json(
        { sucesso: false, erro: 'Usuário não encontrado ou não é estudante' },
        { status: 404 }
      )
    }

    // Resetar senha
    const novaSenhaHash = await hashSenha('@estudante')

    await supabase
      .from('usuarios')
      .update({
        senha_hash: novaSenhaHash,
        senha_alterada: false,
      })
      .eq('id', usuario_id)

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Senha resetada para @estudante',
    })
  } catch (error) {
    console.error('Erro ao resetar senha:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
