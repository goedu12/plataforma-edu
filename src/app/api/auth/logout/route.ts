import { NextResponse } from 'next/server'
import { logout } from '@/lib/auth'

export async function POST() {
  try {
    await logout()
    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error('Erro no logout:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao encerrar sessão' },
      { status: 500 }
    )
  }
}
