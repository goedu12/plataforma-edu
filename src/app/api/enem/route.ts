import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AreaENEM, SubareaENEM, QuestaoENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Buscar questão
// GET /api/enem?area=ciencias-natureza&subarea=fisica&ano=2023&conteudo=mecanica
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

    const searchParams = request.nextUrl.searchParams
    const area = searchParams.get('area') as AreaENEM | null
    const subarea = searchParams.get('subarea') as SubareaENEM | null
    const anoStr = searchParams.get('ano')
    const ano = anoStr ? parseInt(anoStr) : null
    const conteudo = searchParams.get('conteudo')
    const modo = searchParams.get('modo') || 'aleatorio'

    const supabase = getSupabaseAdmin()

    // Verificar se usuário é do Ensino Médio
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nivel, ano')
      .eq('id', sessao.userId)
      .single()

    if (!usuario || usuario.nivel !== 'EM' || usuario.ano !== 3) {
      return NextResponse.json({
        sucesso: false,
        status: 'ACESSO_NEGADO',
        erro: 'O Simulado ENEM está disponível apenas para alunos da 3ª série do Ensino Médio.',
      }, { status: 403 })
    }

    // Buscar IDs das questões já respondidas
    const { data: respostasUsuario } = await supabase
      .from('respostas_enem')
      .select('questao_id')
      .eq('usuario_id', sessao.userId)

    const questoesRespondidasSet = new Set(
      respostasUsuario?.map(r => r.questao_id) || []
    )

    // Construir query de questões
    let query = supabase
      .from('questoes_enem')
      .select('*')
      .eq('status', 'ativa')

    // Aplicar filtros
    if (area) {
      query = query.eq('area', area)
    }
    if (subarea) {
      query = query.eq('subarea', subarea)
    }
    if (ano) {
      query = query.eq('ano_prova', ano)
    }
    if (conteudo) {
      // Buscar por conteúdo principal ou no array de conteúdos
      query = query.or(`conteudo_principal.eq.${conteudo},conteudos.cs.{${conteudo}}`)
    }

    // Buscar questões
    const { data: questoes, error } = await query.limit(500)

    if (error) {
      console.error('Erro ao buscar questões ENEM:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar questões' },
        { status: 500 }
      )
    }

    // Filtrar não respondidas (se modo não for 'todas')
    let questoesDisponiveis = questoes || []
    if (modo !== 'todas') {
      questoesDisponiveis = questoesDisponiveis.filter(
        q => !questoesRespondidasSet.has(q.id)
      )
    }

    // Se não há questões disponíveis
    if (questoesDisponiveis.length === 0) {
      const totalArea = questoes?.length || 0
      const respondidas = questoesRespondidasSet.size

      if (totalArea > 0 && respondidas >= totalArea) {
        return NextResponse.json({
          sucesso: true,
          status: 'COMPLETOU',
          mensagem: 'Você respondeu todas as questões disponíveis com esses filtros!',
          estatisticas: {
            total_filtro: totalArea,
            respondidas: respondidas,
            restantes: 0,
          },
        })
      }

      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: 'Nenhuma questão disponível com os filtros selecionados.',
        estatisticas: {
          total_filtro: totalArea,
          respondidas: Math.min(respondidas, totalArea),
          restantes: 0,
        },
      })
    }

    // Selecionar questão (aleatória ou primeira)
    const questaoSelecionada = modo === 'sequencial'
      ? questoesDisponiveis[0]
      : questoesDisponiveis[Math.floor(Math.random() * questoesDisponiveis.length)]

    // Remover resposta correta antes de enviar ao cliente
    const { resposta_correta, ...questaoPublica } = questaoSelecionada as QuestaoENEM

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoPublica,
      estatisticas: {
        total_filtro: questoes?.length || 0,
        respondidas: questoesRespondidasSet.size,
        restantes: questoesDisponiveis.length,
      },
      filtros_aplicados: {
        area,
        subarea,
        ano,
        conteudo,
      },
    })
  } catch (error) {
    console.error('Erro na API ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
