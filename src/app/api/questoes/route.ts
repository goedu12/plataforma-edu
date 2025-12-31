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

    // Buscar dados do usuário para saber o ano
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('ano')
      .eq('id', sessao.userId)
      .single()

    if (!usuario) {
      return NextResponse.json(
        { sucesso: false, erro: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Buscar próxima questão não respondida
    const { data: questao } = await supabase
      .from('questoes')
      .select('*')
      .eq('componente', componente)
      .eq('ano', usuario.ano)
      .eq('status', 'ativa')
      .not('id', 'in', `(
        SELECT questao_id FROM respostas
        WHERE usuario_id = '${sessao.userId}'
      )`)
      .order('dificuldade', { ascending: true })
      .limit(1)
      .single()

    if (!questao) {
      // Verificar se completou todas as questões
      const { count } = await supabase
        .from('questoes')
        .select('*', { count: 'exact', head: true })
        .eq('componente', componente)
        .eq('ano', usuario.ano)
        .eq('status', 'ativa')

      const { count: respondidas } = await supabase
        .from('respostas')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', sessao.userId)
        .eq('componente', componente)

      if (count && respondidas && respondidas >= count) {
        return NextResponse.json({
          sucesso: true,
          status: 'COMPLETOU',
          mensagem: 'Você completou todas as questões disponíveis!',
        })
      }

      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: 'Nenhuma questão disponível no momento.',
      })
    }

    // Remover resposta correta da questão enviada ao cliente
    const { resposta_correta, ...questaoSemResposta } = questao

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoSemResposta,
    })
  } catch (error) {
    console.error('Erro ao buscar questão:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
