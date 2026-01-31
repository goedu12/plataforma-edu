export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { obterUsuarioAtual } from '@/lib/auth'

export async function GET() {
  try {
    const usuario = await obterUsuarioAtual()

    if (!usuario) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      usuario,
    })
  } catch (error) {
    console.error('Erro ao obter usuário:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
