/**
 * API de Trilhas de Aprendizado
 *
 * GET  /api/trilhas - Lista trilhas disponíveis
 * POST /api/trilhas - Inicia uma trilha para o usuário
 *
 * PONTO DE RESTAURAÇÃO: tag v1.0-pre-trilhas
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'

// GET: Listar trilhas disponíveis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serie = searchParams.get('serie')

    // Verificar autenticação (opcional para listagem)
    const sessao = await obterSessao()
    const usuarioId = sessao?.userId

    const supabase = getSupabaseAdmin()

    // Buscar trilhas usando função SQL
    const { data, error } = await supabase.rpc('listar_trilhas', {
      p_usuario_id: usuarioId || null,
      p_serie: serie || null
    })

    if (error) {
      console.error('Erro ao listar trilhas:', error)
      return NextResponse.json(
        { erro: 'Erro ao buscar trilhas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      trilhas: data || []
    })

  } catch (error) {
    console.error('Erro na API de trilhas:', error)
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST: Iniciar uma trilha
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
    const { trilha_id, serie, data_prova, temas_prova } = body

    // Validações
    if (!trilha_id) {
      return NextResponse.json(
        { erro: 'trilha_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!serie || !['1EM', '2EM', '3EM'].includes(serie)) {
      return NextResponse.json(
        { erro: 'serie deve ser 1EM, 2EM ou 3EM' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Iniciar trilha usando função SQL
    const { data, error } = await supabase.rpc('iniciar_trilha', {
      p_usuario_id: sessao.userId,
      p_trilha_id: trilha_id,
      p_serie: serie,
      p_data_prova: data_prova || null,
      p_temas_prova: temas_prova || null
    })

    if (error) {
      console.error('Erro ao iniciar trilha:', error)
      return NextResponse.json(
        { erro: 'Erro ao iniciar trilha' },
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
    console.error('Erro na API de trilhas:', error)
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
