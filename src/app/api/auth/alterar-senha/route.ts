import { NextRequest, NextResponse } from 'next/server'
import { obterSessao, hashSenha, verificarSenha } from '@/lib/auth'
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

    const { senha_atual, nova_senha } = await request.json()

    // Validações
    if (!senha_atual || !nova_senha) {
      return NextResponse.json(
        { sucesso: false, erro: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      )
    }

    if (nova_senha.length < 6) {
      return NextResponse.json(
        { sucesso: false, erro: 'A nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar usuário atual com senha
    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('id, senha_hash')
      .eq('id', sessao.userId)
      .single()

    if (erroUsuario || !usuario) {
      return NextResponse.json(
        { sucesso: false, erro: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar senha atual
    const senhaCorreta = await verificarSenha(senha_atual, usuario.senha_hash)
    if (!senhaCorreta) {
      return NextResponse.json(
        { sucesso: false, erro: 'Senha atual incorreta' },
        { status: 400 }
      )
    }

    // Criar hash da nova senha
    const novaHash = await hashSenha(nova_senha)

    // Atualizar senha
    const { error: erroUpdate } = await supabase
      .from('usuarios')
      .update({
        senha_hash: novaHash,
        senha_alterada: true,
      })
      .eq('id', sessao.userId)

    if (erroUpdate) {
      console.error('Erro ao atualizar senha:', erroUpdate)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao salvar nova senha' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Senha alterada com sucesso',
    })
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
