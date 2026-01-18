/**
 * API para Pausar Trilha
 *
 * POST /api/trilhas/pausar
 *
 * Pausa a trilha ativa do usuário, salvando o progresso
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
    const { trilha_id, serie } = body

    // Validações
    if (!trilha_id) {
      return NextResponse.json(
        { erro: 'trilha_id é obrigatório' },
        { status: 400 }
      )
    }

    // Validar série (EF: 6EF-9EF, EM: 1EM-3EM)
    const seriesValidas = ['6EF', '7EF', '8EF', '9EF', '1EM', '2EM', '3EM']
    if (!serie || !seriesValidas.includes(serie)) {
      return NextResponse.json(
        { erro: 'serie deve ser 6EF, 7EF, 8EF, 9EF, 1EM, 2EM ou 3EM' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Pausar a trilha
    const { error } = await supabase
      .from('usuario_trilha')
      .update({
        ativa: false,
        pausada_em: new Date().toISOString(),
        ultimo_acesso: new Date().toISOString()
      })
      .eq('usuario_id', sessao.userId)
      .eq('trilha_id', trilha_id)
      .eq('serie', serie)

    if (error) {
      console.error('Erro ao pausar trilha:', error)
      return NextResponse.json(
        { erro: 'Erro ao pausar trilha' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Trilha pausada com sucesso. Seu progresso foi salvo.'
    })

  } catch (error) {
    console.error('Erro na API de pausar trilha:', error)
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
