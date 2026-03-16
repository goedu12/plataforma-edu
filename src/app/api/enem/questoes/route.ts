export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

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
    const ano = searchParams.get('ano') // 2024 ou 2025
    const dia = searchParams.get('dia') // 1 ou 2
    const area = searchParams.get('area') // área do ENEM

    const supabase = getSupabaseAdmin()

    // Buscar IDs das questões ENEM já respondidas
    const { data: respostasUsuario } = await supabase
      .from('respostas_enem')
      .select('questao_enem_id')
      .eq('usuario_id', sessao.userId)

    const respondidas = new Set(respostasUsuario?.map(r => r.questao_enem_id) || [])

    // Buscar questões ENEM (excluir anuladas, variantes de língua estrangeira e anos 2022/2023)
    let query = supabase
      .from('questoes_enem')
      .select('*')
      .eq('anulada', false)
      .or('lingua_estrangeira.is.null,lingua_estrangeira.eq.inglês')
      .not('ano', 'in', '(2022,2023)')

    if (ano) query = query.eq('ano', parseInt(ano))
    if (dia) query = query.eq('dia', parseInt(dia))
    if (area) query = query.eq('area', area)

    query = query.order('numero', { ascending: true })

    const { data: questoes, error } = await query.limit(500)

    if (error) {
      console.error('Erro ao buscar questões ENEM:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar questões' },
        { status: 500 }
      )
    }

    // Filtrar questões não respondidas
    const disponiveis = questoes?.filter(q => !respondidas.has(q.id)) || []

    if (disponiveis.length === 0) {
      // Verificar se completou todas
      const total = questoes?.length || 0
      if (total > 0 && respondidas.size >= total) {
        return NextResponse.json({
          sucesso: true,
          status: 'COMPLETOU',
          mensagem: 'Você completou todas as questões ENEM disponíveis!',
          total_questoes: total,
          total_respondidas: respondidas.size,
        })
      }

      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: 'Nenhuma questão ENEM disponível com esses filtros.',
      })
    }

    // Selecionar próxima questão (aleatória)
    const questaoSelecionada = disponiveis[Math.floor(Math.random() * disponiveis.length)]

    // Remover gabarito antes de enviar ao cliente
    const { gabarito, ...questaoSemGabarito } = questaoSelecionada

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoSemGabarito,
      progresso: {
        total: questoes?.length || 0,
        respondidas: respondidas.size,
        restantes: disponiveis.length,
      },
    })
  } catch (error) {
    console.error('Erro na API ENEM questões:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
