export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

// ═══════════════════════════════════════════════════════════
// API: Mapa Mental Individual
// GET - Buscar mapa específico
// POST - Ações: curtir, download, visualizar
// DELETE - Remover mapa (apenas professor)
// ═══════════════════════════════════════════════════════════

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Buscar mapa específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseAdmin()

    const { data: mapa, error } = await supabase
      .from('mapas_mentais')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !mapa) {
      return NextResponse.json(
        { sucesso: false, erro: 'Mapa não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se usuário curtiu
    const { data: curtida } = await supabase
      .from('mapas_curtidas')
      .select('id')
      .eq('mapa_id', id)
      .eq('usuario_id', sessao.userId)
      .single()

    // Incrementar visualizações (atômico via RPC)
    const { data: novasVisualizacoes } = await supabase
      .rpc('incrementar_visualizacao_mapa', { mapa_id: id })

    return NextResponse.json({
      sucesso: true,
      mapa: {
        ...mapa,
        curtido: !!curtida,
        visualizacoes: novasVisualizacoes ?? (mapa.visualizacoes || 0) + 1
      }
    })

  } catch (error) {
    logger.error('Erro ao buscar mapa:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Ações (curtir, download)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { acao } = body // 'curtir' ou 'download'

    const supabase = getSupabaseAdmin()

    // Verificar se mapa existe
    const { data: mapa, error: mapaError } = await supabase
      .from('mapas_mentais')
      .select('id, curtidas, downloads')
      .eq('id', id)
      .single()

    if (mapaError || !mapa) {
      return NextResponse.json(
        { sucesso: false, erro: 'Mapa não encontrado' },
        { status: 404 }
      )
    }

    // ═══════════════════════════════════════════════════════════
    // AÇÃO: CURTIR (toggle)
    // ═══════════════════════════════════════════════════════════
    if (acao === 'curtir') {
      // Verificar se já curtiu
      const { data: curtidaExistente } = await supabase
        .from('mapas_curtidas')
        .select('id')
        .eq('mapa_id', id)
        .eq('usuario_id', sessao.userId)
        .single()

      if (curtidaExistente) {
        // Remover curtida
        await supabase
          .from('mapas_curtidas')
          .delete()
          .eq('id', curtidaExistente.id)

        // Decrementar contador (atômico via RPC)
        const { data: novasCurtidas } = await supabase
          .rpc('decrementar_curtida_mapa', { mapa_id: id })

        return NextResponse.json({
          sucesso: true,
          curtido: false,
          curtidas: novasCurtidas ?? Math.max((mapa.curtidas || 0) - 1, 0),
          mensagem: 'Curtida removida'
        })
      } else {
        // Adicionar curtida
        await supabase
          .from('mapas_curtidas')
          .insert({
            mapa_id: id,
            usuario_id: sessao.userId
          })

        // Incrementar contador (atômico via RPC)
        const { data: novasCurtidas } = await supabase
          .rpc('incrementar_curtida_mapa', { mapa_id: id })

        return NextResponse.json({
          sucesso: true,
          curtido: true,
          curtidas: novasCurtidas ?? (mapa.curtidas || 0) + 1,
          mensagem: 'Mapa curtido!'
        })
      }
    }

    // ═══════════════════════════════════════════════════════════
    // AÇÃO: DOWNLOAD
    // ═══════════════════════════════════════════════════════════
    if (acao === 'download') {
      // Registrar download
      await supabase
        .from('mapas_downloads')
        .insert({
          mapa_id: id,
          usuario_id: sessao.userId
        })

      // Incrementar contador (atômico via RPC)
      const { data: novosDownloads } = await supabase
        .rpc('incrementar_download_mapa', { mapa_id: id })

      return NextResponse.json({
        sucesso: true,
        downloads: novosDownloads ?? (mapa.downloads || 0) + 1,
        mensagem: 'Download registrado'
      })
    }

    return NextResponse.json(
      { sucesso: false, erro: 'Ação inválida' },
      { status: 400 }
    )

  } catch (error) {
    logger.error('Erro na ação do mapa:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover mapa (apenas professor)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = getSupabaseAdmin()

    // Verificar se é professor
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', sessao.userId)
      .single()

    if (!usuario || usuario.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Apenas professores podem remover mapas' },
        { status: 403 }
      )
    }

    // Soft delete (desativar)
    const { error } = await supabase
      .from('mapas_mentais')
      .update({ ativo: false })
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao remover mapa' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Mapa removido com sucesso'
    })

  } catch (error) {
    logger.error('Erro ao remover mapa:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
