import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'
import { obterStatusSemanal, getPeriodoAtual } from '@/lib/sistema-notas'

// Mapeamento de dificuldade para ordenação correta
const ORDEM_DIFICULDADE: Record<string, number> = {
  'facil': 1,
  'medio': 2,
  'dificil': 3,
}

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
    const modo = searchParams.get('modo') || 'estudo'

    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente inválido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // ═══════════════════════════════════════════════════════════════════════
    // VERIFICAR STATUS SEMANAL (apenas para modo estudo)
    // ═══════════════════════════════════════════════════════════════════════

    let statusSemanal = null
    let periodo = null

    if (modo === 'estudo') {
      statusSemanal = await obterStatusSemanal(supabase, sessao.userId, componente)
      periodo = getPeriodoAtual()

      // Se atingiu limite semanal no modo estudo (apenas durante período letivo)
      if (periodo && statusSemanal.limite_semanal !== null && !statusSemanal.pode_responder) {
        return NextResponse.json({
          sucesso: true,
          status: 'LIMITE_SEMANAL',
          mensagem: `Você atingiu o limite de ${statusSemanal.limite_semanal} questões esta semana. Volte na segunda-feira!`,
          limite: {
            questoes_semana: statusSemanal.questoes_semana,
            limite_semanal: statusSemanal.limite_semanal,
            pode_responder: false,
          },
        })
      }

      // Fora do período letivo = modo prática livre (sem limite)
      // Permite acesso normal às questões
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BUSCAR QUESTÕES
    // ═══════════════════════════════════════════════════════════════════════

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

    // Buscar IDs das questões já respondidas pelo usuário
    const { data: respostasUsuario } = await supabase
      .from('respostas')
      .select('questao_id')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)

    const questoesRespondidasSet = new Set(respostasUsuario?.map(r => r.questao_id) || [])

    // Buscar questões ativas do ano e componente
    const { data: todasQuestoes, error } = await supabase
      .from('questoes')
      .select('*')
      .eq('componente', componente)
      .eq('ano', usuario.ano)
      .eq('status', 'ativa')
      .limit(500)

    if (error) {
      console.error('Erro ao buscar questões:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar questões' },
        { status: 500 }
      )
    }

    // Filtrar questões não respondidas
    const questoesDisponiveis = todasQuestoes?.filter(q => !questoesRespondidasSet.has(q.id)) || []

    // Se não há questões disponíveis
    if (!questoesDisponiveis || questoesDisponiveis.length === 0) {
      const { count: totalQuestoes } = await supabase
        .from('questoes')
        .select('*', { count: 'exact', head: true })
        .eq('componente', componente)
        .eq('ano', usuario.ano)
        .eq('status', 'ativa')

      if (totalQuestoes && questoesRespondidasSet.size >= totalQuestoes) {
        return NextResponse.json({
          sucesso: true,
          status: 'COMPLETOU',
          mensagem: 'Você completou todas as questões disponíveis!',
          limite: statusSemanal,
        })
      }

      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: 'Nenhuma questão disponível no momento.',
        limite: statusSemanal,
      })
    }

    // Ordenar questões por dificuldade e selecionar a primeira
    const questoesOrdenadas = questoesDisponiveis.sort((a, b) => {
      const ordemA = ORDEM_DIFICULDADE[a.dificuldade] || 2
      const ordemB = ORDEM_DIFICULDADE[b.dificuldade] || 2
      return ordemA - ordemB
    })

    const questaoSelecionada = questoesOrdenadas[0]

    // Remover resposta correta da questão enviada ao cliente
    const { resposta_correta, ...questaoSemResposta } = questaoSelecionada

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoSemResposta,
      // Informações do limite semanal (apenas modo estudo)
      limite: statusSemanal ? {
        questoes_semana: statusSemanal.questoes_semana,
        limite_semanal: statusSemanal.limite_semanal,
        restantes: statusSemanal.restantes,
        pode_responder: statusSemanal.pode_responder,
      } : null,
      // Informações do período (apenas modo estudo)
      periodo: periodo ? {
        bimestre: periodo.bimestre,
        tipo: periodo.tipo,
        dias_restantes: periodo.diasRestantes,
      } : null,
    })
  } catch (error) {
    console.error('Erro ao buscar questão:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
