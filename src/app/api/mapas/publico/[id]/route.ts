import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════
// API PÚBLICA: Buscar mapa mental por ID
// GET - Retorna dados do mapa para visualização pública
// Não requer autenticação (para links compartilhados)
// ═══════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { sucesso: false, erro: 'ID do mapa não informado' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar mapa
    const { data: mapa, error } = await supabase
      .from('mapas_mentais')
      .select('*')
      .eq('id', id)
      .eq('ativo', true)
      .single()

    if (error || !mapa) {
      return NextResponse.json(
        { sucesso: false, erro: 'Mapa não encontrado' },
        { status: 404 }
      )
    }

    // Incrementar visualizações
    await supabase
      .from('mapas_mentais')
      .update({ visualizacoes: (mapa.visualizacoes || 0) + 1 })
      .eq('id', id)

    return NextResponse.json({
      sucesso: true,
      mapa: {
        id: mapa.id,
        componente: mapa.componente,
        serie: mapa.serie,
        bimestre: mapa.bimestre,
        titulo: mapa.titulo,
        descricao: mapa.descricao,
        tema: mapa.tema,
        imagem_url: mapa.imagem_url,
        thumbnail_url: mapa.thumbnail_url,
        curtidas: mapa.curtidas || 0,
        downloads: mapa.downloads || 0,
        visualizacoes: (mapa.visualizacoes || 0) + 1,
      }
    })

  } catch (error) {
    console.error('Erro ao buscar mapa público:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
