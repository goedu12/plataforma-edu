export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao, hashSenha } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { gerarSenhaTemporaria } from '@/lib/utils'
import { logger } from '@/lib/logger'

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
      .select('id, tipo, nome, email')
      .eq('id', usuario_id)
      .single()

    if (!usuario || usuario.tipo !== 'estudante') {
      return NextResponse.json(
        { sucesso: false, erro: 'Usuário não encontrado ou não é estudante' },
        { status: 404 }
      )
    }

    // Gerar senha temporária única
    const novaSenha = gerarSenhaTemporaria()
    const novaSenhaHash = await hashSenha(novaSenha)

    // Atualizar senha e marcar como não alterada (forçar troca no próximo login)
    await supabase
      .from('usuarios')
      .update({
        senha_hash: novaSenhaHash,
        senha_alterada: false,
      })
      .eq('id', usuario_id)

    // Log de auditoria (sem expor a senha)
    logger.info(`Senha resetada pelo professor ${sessao.userId} para estudante ${usuario_id}`)

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Senha temporária gerada com sucesso',
      nova_senha: novaSenha, // Exibida apenas uma vez para o professor informar ao aluno
      aviso: 'Informe esta senha ao estudante. Ele deverá alterá-la no primeiro acesso.',
    })
  } catch (error) {
    logger.error('Erro ao resetar senha:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
