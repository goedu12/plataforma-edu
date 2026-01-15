import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth'
import {
  verificarRateLimit,
  registrarTentativaFalha,
  limparTentativas,
  obterIP,
} from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - proteção contra brute force
    const ip = obterIP(request)
    const rateLimit = verificarRateLimit(ip)

    if (rateLimit.bloqueado) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: rateLimit.mensagem,
          bloqueado: true,
          tempoRestanteMs: rateLimit.tempoRestanteMs,
        },
        { status: 429 }
      )
    }

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
      // Registrar tentativa falha
      const foiBloqueado = registrarTentativaFalha(ip)
      const novoStatus = verificarRateLimit(ip)

      return NextResponse.json(
        {
          sucesso: false,
          erro: resultado.erro,
          tentativasRestantes: novoStatus.tentativasRestantes,
          bloqueado: foiBloqueado,
        },
        { status: 401 }
      )
    }

    // Login bem-sucedido - limpar tentativas
    limparTentativas(ip)

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
