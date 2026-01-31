import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AreaENEM, SubareaENEM, ConteudoENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Listar conteúdos para filtragem
// GET /api/enem/conteudos?area=ciencias-natureza&subarea=fisica
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verificar se usuário é da 3ª série do Ensino Médio (ou professor)
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nivel, ano, tipo')
      .eq('id', sessao.userId)
      .single()

    const isProfessor = usuario?.tipo === 'professor'
    const isAlunoEM = usuario?.nivel === 'EM'

    if (!usuario || (!isProfessor && !isAlunoEM)) {
      return NextResponse.json({
        sucesso: false,
        erro: 'O Simulado ENEM está disponível apenas para alunos do Ensino Médio.',
      }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const area = searchParams.get('area') as AreaENEM | null
    const subarea = searchParams.get('subarea') as SubareaENEM | null

    // Construir query
    let query = supabase
      .from('conteudos_enem')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    // Aplicar filtros
    if (area) {
      query = query.eq('area', area)
    }
    if (subarea) {
      query = query.eq('subarea', subarea)
    }

    const { data: conteudos, error } = await query

    if (error) {
      console.error('Erro ao buscar conteúdos ENEM:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar conteúdos' },
        { status: 500 }
      )
    }

    // Agrupar por subárea se não houver filtro de subárea
    let conteudosAgrupados: Record<string, ConteudoENEM[]> | null = null

    if (!subarea && conteudos && conteudos.length > 0) {
      conteudosAgrupados = {}
      for (const c of conteudos) {
        if (!conteudosAgrupados[c.subarea]) {
          conteudosAgrupados[c.subarea] = []
        }
        conteudosAgrupados[c.subarea].push(c as ConteudoENEM)
      }
    }

    return NextResponse.json({
      sucesso: true,
      conteudos: conteudos || [],
      agrupados: conteudosAgrupados,
      filtros_aplicados: {
        area,
        subarea,
      },
    })
  } catch (error) {
    console.error('Erro nos conteúdos ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
