/**
 * API de Progresso da Trilha
 *
 * GET /api/trilhas/progresso?serie=1EM
 *
 * Retorna o progresso do usuário na trilha
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const serie = searchParams.get('serie')

    const supabase = getSupabaseAdmin()

    // Buscar progresso usando função SQL
    const { data, error } = await supabase.rpc('buscar_progresso_trilha', {
      p_usuario_id: sessao.userId,
      p_serie: serie || null
    })

    if (error) {
      console.error('Erro ao buscar progresso:', error)
      return NextResponse.json(
        { erro: 'Erro ao buscar progresso' },
        { status: 500 }
      )
    }

    // Se não tem trilha ativa
    if (!data || data.length === 0) {
      return NextResponse.json({
        sucesso: true,
        tem_trilha_ativa: false,
        progresso: null,
        mensagem: 'Você ainda não iniciou uma trilha. Escolha uma para começar!'
      })
    }

    // Retornar progresso (pode ter múltiplas trilhas em diferentes séries)
    return NextResponse.json({
      sucesso: true,
      tem_trilha_ativa: true,
      progresso: serie ? data[0] : data
    })

  } catch (error) {
    console.error('Erro na API de progresso:', error)
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE: Pausar trilha
export async function DELETE(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const serie = searchParams.get('serie')

    if (!serie) {
      return NextResponse.json(
        { erro: 'serie é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Pausar trilha usando função SQL
    const { data, error } = await supabase.rpc('pausar_trilha', {
      p_usuario_id: sessao.userId,
      p_serie: serie
    })

    if (error) {
      console.error('Erro ao pausar trilha:', error)
      return NextResponse.json(
        { erro: 'Erro ao pausar trilha' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro na API de progresso:', error)
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
