/**
 * API para Responder Questão da Trilha
 *
 * POST /api/trilhas/responder
 *
 * Body: { questao_id, resposta, tempo_segundos, usou_dica }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verificarAutenticacao } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = await verificarAutenticacao(request)
    if (!auth) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { questao_id, resposta, tempo_segundos = 0, usou_dica = false } = body

    // Validações
    if (!questao_id) {
      return NextResponse.json(
        { erro: 'questao_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!resposta || !['A', 'B', 'C', 'D', 'E'].includes(resposta.toUpperCase())) {
      return NextResponse.json(
        { erro: 'resposta deve ser A, B, C, D ou E' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Responder questão usando função SQL
    const { data, error } = await supabase.rpc('responder_questao_trilha', {
      p_usuario_id: auth.id,
      p_questao_id: questao_id,
      p_resposta: resposta.toUpperCase(),
      p_tempo_segundos: tempo_segundos,
      p_usou_dica: usou_dica
    })

    if (error) {
      console.error('Erro ao responder questão:', error)
      return NextResponse.json(
        { erro: 'Erro ao registrar resposta' },
        { status: 500 }
      )
    }

    // Verificar se a função retornou erro
    if (data && data.erro) {
      return NextResponse.json(
        { erro: data.erro },
        { status: 400 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro na API de responder:', error)
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
