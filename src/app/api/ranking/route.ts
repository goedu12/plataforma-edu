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
    const turma = searchParams.get('turma')

    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente inválido' },
        { status: 400 }
      )
    }

    if (!turma) {
      return NextResponse.json(
        { sucesso: false, erro: 'Turma não informada' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar ranking
    const camposPontos = componente === 'fisica' ? 'fis_pontos' : 'mat_pontos'
    const camposNivel = componente === 'fisica' ? 'fis_nivel' : 'mat_nivel'
    const camposTotal = componente === 'fisica' ? 'fis_questoes_total' : 'mat_questoes_total'
    const camposCorretas = componente === 'fisica' ? 'fis_questoes_corretas' : 'mat_questoes_corretas'

    // Limitar a 100 resultados por turma para performance
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select(`id, nome, turma, ${camposPontos}, ${camposNivel}, ${camposTotal}, ${camposCorretas}`)
      .eq('turma', turma)
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .contains('componentes', [componente])
      .order(camposPontos, { ascending: false })
      .limit(100)

    if (error) {
      console.error('Erro ao buscar ranking:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar ranking' },
        { status: 500 }
      )
    }

    // Formatar ranking
    const ranking = usuarios.map((u, index) => {
      const total = u[camposTotal as keyof typeof u] as number || 0
      const corretas = u[camposCorretas as keyof typeof u] as number || 0

      return {
        posicao: index + 1,
        usuario_id: u.id,
        nome: u.nome,
        turma: u.turma,
        pontos: u[camposPontos as keyof typeof u] as number || 0,
        nivel: u[camposNivel as keyof typeof u] as string || 'Iniciante',
        questoes_total: total,
        taxa_acerto: total > 0 ? Math.round((corretas / total) * 100) : 0,
        eh_usuario_atual: u.id === sessao.userId,
      }
    })

    return NextResponse.json({
      sucesso: true,
      ranking,
    })
  } catch (error) {
    console.error('Erro ao buscar ranking:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
