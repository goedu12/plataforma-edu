export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'

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

    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente inválido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar todas as conquistas ordenadas por nível
    const { data: todasConquistas } = await supabase
      .from('conquistas')
      .select('*')
      .or(`componente.is.null,componente.eq.${componente}`)
      .order('ordem', { ascending: true })

    // Buscar conquistas desbloqueadas pelo usuário
    const { data: conquistasUsuario } = await supabase
      .from('conquistas_usuarios')
      .select('conquista_id, desbloqueada_em')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)

    const conquistasDesbloqueadas = new Set(conquistasUsuario?.map(c => c.conquista_id) || [])

    // Formatar resposta
    const conquistas = todasConquistas?.map(c => ({
      ...c,
      desbloqueada: conquistasDesbloqueadas.has(c.id),
      desbloqueada_em: conquistasUsuario?.find(cu => cu.conquista_id === c.id)?.desbloqueada_em,
    })) || []

    return NextResponse.json({
      sucesso: true,
      conquistas,
      total: conquistas.length,
      desbloqueadas: conquistasDesbloqueadas.size,
    })
  } catch (error) {
    console.error('Erro ao buscar conquistas:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
