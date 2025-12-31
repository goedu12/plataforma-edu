import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json()

    // Validações básicas
    if (!email || !senha) {
      return NextResponse.json(
        { sucesso: false, erro: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Tentar login
    const resultado = await login(email.toLowerCase(), senha)

    if (!resultado.sucesso) {
      return NextResponse.json(
        { sucesso: false, erro: resultado.erro },
        { status: 401 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      tipo: resultado.tipo,
      componentes: resultado.componentes,
      redirecionarPara: resultado.redirecionarPara,
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
