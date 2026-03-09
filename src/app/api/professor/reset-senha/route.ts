export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao, hashSenha } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// Senha padrão para todos os estudantes
const SENHA_PADRAO_ESTUDANTE = '@estudante'

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

    // Resetar para senha padrão @estudante
    const novaSenha = SENHA_PADRAO_ESTUDANTE
    const novaSenhaHash = await hashSenha(novaSenha)

    // Atualizar senha e marcar como não alterada (forçar troca no próximo login)
    await supabase
      .from('usuarios')
      .update({
        senha_hash: novaSenhaHash,
        senha_alterada: true, // Senha padrão @estudante, sem obrigar troca
      })
      .eq('id', usuario_id)

    // Log de auditoria (sem expor a senha)
    logger.info(`Senha resetada pelo professor ${sessao.userId} para estudante ${usuario_id}`)

    // SEGURANCA: Nunca retornar senhas em respostas HTTP
    return NextResponse.json({
      sucesso: true,
      mensagem: 'Senha resetada com sucesso',
      aviso: 'O estudante deverá usar a senha padrão informada em sala de aula.',
    })
  } catch (error) {
    logger.error('Erro ao resetar senha:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
