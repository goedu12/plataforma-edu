import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente, SerieEM, Bimestre } from '@/types'

// ═══════════════════════════════════════════════════════════
// API: Mapas Mentais
// GET - Listar mapas com filtros (série, bimestre)
// Estudantes só veem mapas da sua série/ano
// ═══════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const componente = searchParams.get('componente') as Componente
    const serie = searchParams.get('serie')
    const bimestre = searchParams.get('bimestre')

    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente inválido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar dados do usuário para filtrar por série (estudantes)
    let serieEstudante: number | null = null
    if (sessao.tipo === 'estudante') {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('ano')
        .eq('id', sessao.userId)
        .single()

      if (usuario?.ano) {
        serieEstudante = usuario.ano
      }
    }

    // Construir query base
    let query = supabase
      .from('mapas_mentais')
      .select('*')
      .eq('componente', componente)
      .eq('ativo', true)
      .order('serie', { ascending: true })
      .order('bimestre', { ascending: true })
      .order('criado_em', { ascending: false })

    // Estudantes: filtrar automaticamente pela sua série
    // Professores: podem ver todos ou filtrar manualmente
    if (sessao.tipo === 'estudante' && serieEstudante) {
      query = query.eq('serie', serieEstudante)
    } else if (serie) {
      // Filtro manual (professor ou fallback)
      const serieNum = parseInt(serie) as SerieEM
      if ([1, 2, 3].includes(serieNum)) {
        query = query.eq('serie', serieNum)
      }
    }

    if (bimestre) {
      const bimestreNum = parseInt(bimestre) as Bimestre
      if ([1, 2, 3, 4].includes(bimestreNum)) {
        query = query.eq('bimestre', bimestreNum)
      }
    }

    const { data: mapas, error } = await query

    if (error) {
      console.error('Erro ao buscar mapas:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar mapas mentais' },
        { status: 500 }
      )
    }

    // Buscar curtidas do usuário atual
    const { data: curtidas } = await supabase
      .from('mapas_curtidas')
      .select('mapa_id')
      .eq('usuario_id', sessao.userId)

    const mapasCurtidos = new Set(curtidas?.map(c => c.mapa_id) || [])

    // Adicionar status de curtida a cada mapa
    const mapasComStatus = mapas?.map(mapa => ({
      ...mapa,
      curtido: mapasCurtidos.has(mapa.id)
    })) || []

    // Estatísticas gerais
    const stats = {
      total: mapasComStatus.length,
      totalCurtidas: mapasComStatus.reduce((acc, m) => acc + (m.curtidas || 0), 0),
      totalDownloads: mapasComStatus.reduce((acc, m) => acc + (m.downloads || 0), 0),
    }

    return NextResponse.json({
      sucesso: true,
      mapas: mapasComStatus,
      stats
    })

  } catch (error) {
    console.error('Erro ao buscar mapas mentais:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
