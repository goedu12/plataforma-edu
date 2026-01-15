/**
 * API para Responder Questão da Trilha
 *
 * POST /api/trilhas/responder
 *
 * Body: { questao_id, resposta, tempo_segundos, usou_dica }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { questao_id, resposta, tempo_segundos = 0, usou_dica = false } = body

    // Validações de tipo e formato
    if (!questao_id || typeof questao_id !== 'number' || questao_id <= 0) {
      return NextResponse.json(
        { erro: 'questao_id deve ser um número positivo' },
        { status: 400 }
      )
    }

    if (!resposta || typeof resposta !== 'string' || !['A', 'B', 'C', 'D', 'E'].includes(resposta.toUpperCase())) {
      return NextResponse.json(
        { erro: 'resposta deve ser A, B, C, D ou E' },
        { status: 400 }
      )
    }

    // Validar tempo (máximo 1 hora = 3600 segundos por questão)
    const tempoValidado = Math.max(0, Math.min(3600, Number(tempo_segundos) || 0))

    const supabase = getSupabaseAdmin()

    // Responder questão usando função SQL
    const { data, error } = await supabase.rpc('responder_questao_trilha', {
      p_usuario_id: sessao.userId,
      p_questao_id: questao_id,
      p_resposta: resposta.toUpperCase(),
      p_tempo_segundos: tempoValidado,
      p_usou_dica: Boolean(usou_dica)
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
