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

    // Buscar questões que o usuário errou e ainda não acertou
    // Usando a view questoes_para_revisao ou fazendo a query diretamente
    const { data: questoesRevisao, error } = await supabase
      .from('respostas')
      .select(`
        questao_id,
        componente,
        criado_em,
        questoes!inner (
          id,
          componente,
          ano,
          tema,
          subtema,
          dificuldade,
          enunciado,
          alternativa_a,
          alternativa_b,
          alternativa_c,
          alternativa_d,
          explicacao,
          dica,
          status
        )
      `)
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('correta', false)
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('Erro ao buscar questões para revisão:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar questões' },
        { status: 500 }
      )
    }

    // Filtrar apenas questões ativas e que o usuário ainda não acertou
    const questoesParaRevisao: Array<{
      questao_id: string
      componente: string
      errou_em: string
      questao: {
        id: string
        componente: string
        tema: string
        dificuldade: string
        enunciado: string
        alternativa_a: string
        alternativa_b: string
        alternativa_c: string
        alternativa_d: string
        explicacao: string
        dica?: string
      }
    }> = []

    // IDs de questões já processadas (para evitar duplicatas)
    const questoesProcessadas = new Set<string>()

    for (const resposta of questoesRevisao || []) {
      const questaoId = resposta.questao_id

      // Evitar duplicatas
      if (questoesProcessadas.has(questaoId)) continue

      // Verificar se a questão está ativa
      const questaoData = resposta.questoes as unknown as {
        id: string
        componente: string
        ano: number
        tema: string
        subtema?: string
        dificuldade: string
        enunciado: string
        alternativa_a: string
        alternativa_b: string
        alternativa_c: string
        alternativa_d: string
        explicacao: string
        dica?: string
        status: string
      }

      if (questaoData.status !== 'ativa') continue

      // Verificar se o usuário já acertou essa questão depois
      const { data: respostaCorreta } = await supabase
        .from('respostas')
        .select('id')
        .eq('usuario_id', sessao.userId)
        .eq('questao_id', questaoId)
        .eq('correta', true)
        .gt('criado_em', resposta.criado_em)
        .limit(1)
        .single()

      // Se já acertou depois, pular
      if (respostaCorreta) continue

      questoesProcessadas.add(questaoId)

      questoesParaRevisao.push({
        questao_id: questaoId,
        componente: resposta.componente,
        errou_em: resposta.criado_em,
        questao: {
          id: questaoData.id,
          componente: questaoData.componente,
          tema: questaoData.tema,
          dificuldade: questaoData.dificuldade,
          enunciado: questaoData.enunciado,
          alternativa_a: questaoData.alternativa_a,
          alternativa_b: questaoData.alternativa_b,
          alternativa_c: questaoData.alternativa_c,
          alternativa_d: questaoData.alternativa_d,
          explicacao: questaoData.explicacao,
          dica: questaoData.dica,
        },
      })
    }

    // Se não há questões para revisão
    if (questoesParaRevisao.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_REVISAO',
        mensagem: 'Você não tem questões para revisar!',
        total: 0,
      })
    }

    // Retornar a primeira questão para revisão
    const primeiraQuestao = questoesParaRevisao[0]

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: primeiraQuestao.questao,
      total_revisao: questoesParaRevisao.length,
      errou_em: primeiraQuestao.errou_em,
    })
  } catch (error) {
    console.error('Erro ao buscar questões para revisão:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
