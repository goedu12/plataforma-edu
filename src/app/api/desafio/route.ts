import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'
import { DESAFIO, obterNivelPorPontos } from '@/types'
import { getPeriodoAtual } from '@/lib/sistema-notas'

// GET - Iniciar um novo desafio
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

    // Verificar se o estudante tem acesso ao componente solicitado
    if (!sessao.componentes.includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: `Você não está matriculado em ${componente === 'fisica' ? 'Física' : 'Matemática'}` },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()
    const hoje = new Date().toISOString().split('T')[0]

    // Verificar se há desafio em andamento (SEM LIMITE DIÁRIO)
    const { data: desafioEmAndamento } = await supabase
      .from('desafios')
      .select('id, status')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('status', 'em_andamento')
      .order('criado_em', { ascending: false })
      .limit(1)
      .single()

    if (desafioEmAndamento) {
      // Retornar desafio em andamento
      const { data: desafio } = await supabase
        .from('desafios')
        .select('*')
        .eq('id', desafioEmAndamento.id)
        .single()

      if (desafio) {
        // Buscar questões do desafio
        const { data: questoes } = await supabase
          .from('questoes')
          .select('id, componente, tema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, dica')
          .in('id', desafio.questoes_ids)

        return NextResponse.json({
          sucesso: true,
          status: 'EM_ANDAMENTO',
          desafio: {
            id: desafio.id,
            questoes: questoes,
            respostas_dadas: desafio.respostas_dadas,
            tempo_restante: Math.max(0, DESAFIO.TEMPO_SEGUNDOS - Math.floor((Date.now() - new Date(desafio.iniciado_em).getTime()) / 1000)),
          },
        })
      }
    }

    // SEM LIMITE DIÁRIO - Pode fazer quantos desafios quiser!

    // Buscar dados do usuário
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

    // Buscar questões aleatórias para o desafio
    // Filtrar por bimestre se estiver em período letivo
    const periodo = getPeriodoAtual()

    let queryDesafio = supabase
      .from('questoes')
      .select('id')
      .eq('componente', componente)
      .eq('ano', usuario.ano)
      .eq('status', 'ativa')

    // Se há período ativo, filtrar por bimestre (questões específicas do bimestre OU sem bimestre definido)
    if (periodo) {
      queryDesafio = queryDesafio.or(`bimestre.is.null,bimestre.eq.${periodo.bimestre}`)
    }

    const { data: questoesDisponiveis } = await queryDesafio

    if (!questoesDisponiveis || questoesDisponiveis.length < DESAFIO.QUESTOES) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: `São necessárias pelo menos ${DESAFIO.QUESTOES} questões para o desafio.`,
      })
    }

    // Selecionar questões aleatórias
    const questoesIds = questoesDisponiveis
      .sort(() => Math.random() - 0.5)
      .slice(0, DESAFIO.QUESTOES)
      .map(q => q.id)

    // Criar novo desafio
    const { data: novoDesafio, error } = await supabase
      .from('desafios')
      .insert({
        usuario_id: sessao.userId,
        componente,
        questoes_ids: questoesIds,
        questoes_total: DESAFIO.QUESTOES,
        data_desafio: hoje,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar desafio:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao criar desafio' },
        { status: 500 }
      )
    }

    // Buscar questões completas
    const { data: questoes } = await supabase
      .from('questoes')
      .select('id, componente, tema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, dica')
      .in('id', questoesIds)

    return NextResponse.json({
      sucesso: true,
      status: 'NOVO',
      desafio: {
        id: novoDesafio.id,
        questoes: questoes,
        respostas_dadas: [],
        tempo_restante: DESAFIO.TEMPO_SEGUNDOS,
      },
    })
  } catch (error) {
    console.error('Erro ao iniciar desafio:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Responder uma questão do desafio ou finalizar
export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { desafio_id, questao_id, resposta, finalizar, tempo_total } = await request.json()

    if (!desafio_id) {
      return NextResponse.json(
        { sucesso: false, erro: 'ID do desafio é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar desafio
    const { data: desafio } = await supabase
      .from('desafios')
      .select('*')
      .eq('id', desafio_id)
      .eq('usuario_id', sessao.userId)
      .single()

    if (!desafio) {
      return NextResponse.json(
        { sucesso: false, erro: 'Desafio não encontrado' },
        { status: 404 }
      )
    }

    if (desafio.status !== 'em_andamento') {
      return NextResponse.json(
        { sucesso: false, erro: 'Este desafio já foi finalizado' },
        { status: 400 }
      )
    }

    // Se é para finalizar o desafio
    if (finalizar) {
      // Calcular resultados
      const respostasDadas = desafio.respostas_dadas || []

      // Buscar respostas corretas
      const { data: questoes } = await supabase
        .from('questoes')
        .select('id, resposta_correta, explicacao')
        .in('id', desafio.questoes_ids)

      const questoesMap = new Map(questoes?.map(q => [q.id, q]) || [])

      let acertos = 0
      const resultados = desafio.questoes_ids.map((qId: string, index: number) => {
        const questao = questoesMap.get(qId)
        const respostaDada = respostasDadas[index] || null
        const correta = respostaDada?.toUpperCase() === questao?.resposta_correta?.toUpperCase()
        if (correta) acertos++
        return {
          questao_id: qId,
          resposta_dada: respostaDada,
          resposta_correta: questao?.resposta_correta,
          correta,
          explicacao: questao?.explicacao,
        }
      })

      // Calcular pontos
      let pontosGanhos = acertos * DESAFIO.PONTOS_POR_ACERTO
      let bonusPerfeito = false

      // Bônus de acerto perfeito (5/5)
      if (acertos === DESAFIO.QUESTOES) {
        pontosGanhos += DESAFIO.BONUS_PERFEITO
        bonusPerfeito = true
      }

      // Bônus de tempo (se completar antes de 3 min)
      if (tempo_total && tempo_total < 180) {
        pontosGanhos += DESAFIO.BONUS_TEMPO
      }

      // Atualizar desafio
      await supabase
        .from('desafios')
        .update({
          status: 'completo',
          acertos,
          tempo_total_segundos: tempo_total || DESAFIO.TEMPO_SEGUNDOS,
          pontos_ganhos: pontosGanhos,
          bonus_perfeito: bonusPerfeito,
          finalizado_em: new Date().toISOString(),
        })
        .eq('id', desafio_id)

      // Atualizar pontos do usuário
      const ehFisica = desafio.componente === 'fisica'
      const campoPontos = ehFisica ? 'fis_pontos' : 'mat_pontos'
      const campoNivel = ehFisica ? 'fis_nivel' : 'mat_nivel'

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('fis_pontos, mat_pontos')
        .eq('id', sessao.userId)
        .single()

      if (usuario) {
        const pontosAtuais = (ehFisica ? usuario.fis_pontos : usuario.mat_pontos) || 0
        const novosPontos = pontosAtuais + pontosGanhos
        const novoNivel = obterNivelPorPontos(novosPontos).nome

        await supabase
          .from('usuarios')
          .update({
            [campoPontos]: novosPontos,
            [campoNivel]: novoNivel,
          })
          .eq('id', sessao.userId)
      }

      return NextResponse.json({
        sucesso: true,
        finalizado: true,
        acertos,
        total: DESAFIO.QUESTOES,
        pontos_ganhos: pontosGanhos,
        bonus_perfeito: bonusPerfeito,
        resultados,
      })
    }

    // Se é para registrar uma resposta
    if (!questao_id || !resposta) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Encontrar índice da questão
    const questaoIndex = desafio.questoes_ids.indexOf(questao_id)
    if (questaoIndex === -1) {
      return NextResponse.json(
        { sucesso: false, erro: 'Questão não pertence a este desafio' },
        { status: 400 }
      )
    }

    // Atualizar respostas
    const novasRespostas = [...(desafio.respostas_dadas || [])]
    novasRespostas[questaoIndex] = resposta.toUpperCase()

    await supabase
      .from('desafios')
      .update({ respostas_dadas: novasRespostas })
      .eq('id', desafio_id)

    return NextResponse.json({
      sucesso: true,
      resposta_registrada: true,
    })
  } catch (error) {
    console.error('Erro ao processar desafio:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
