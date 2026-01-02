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

    // Query otimizada: buscar questões erradas que NÃO foram acertadas depois
    // Usando uma única query com subquery para melhor performance
    const { data: questoesErradas, error: erroQuestoes } = await supabase
      .from('respostas')
      .select('questao_id, criado_em')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('correta', false)
      .order('criado_em', { ascending: false })
      .limit(50)

    if (erroQuestoes) {
      console.error('Erro ao buscar respostas:', erroQuestoes)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar questões' },
        { status: 500 }
      )
    }

    if (!questoesErradas || questoesErradas.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_REVISAO',
        mensagem: 'Você não tem questões para revisar!',
        total: 0,
      })
    }

    // Buscar respostas corretas do usuário
    const { data: respostasCorretas } = await supabase
      .from('respostas')
      .select('questao_id, criado_em')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('correta', true)

    // Criar mapa de respostas corretas por questão (mais recente)
    const corretasMap = new Map<string, string>()
    respostasCorretas?.forEach(r => {
      const atual = corretasMap.get(r.questao_id)
      if (!atual || r.criado_em > atual) {
        corretasMap.set(r.questao_id, r.criado_em)
      }
    })

    // Filtrar questões erradas que não foram acertadas depois
    const questoesParaRevisao: Array<{ questao_id: string; errou_em: string }> = []
    const questoesVistas = new Set<string>()

    for (const resposta of questoesErradas) {
      if (questoesVistas.has(resposta.questao_id)) continue
      questoesVistas.add(resposta.questao_id)

      const dataCorreta = corretasMap.get(resposta.questao_id)
      // Se nunca acertou OU acertou antes de errar
      if (!dataCorreta || dataCorreta < resposta.criado_em) {
        questoesParaRevisao.push({
          questao_id: resposta.questao_id,
          errou_em: resposta.criado_em,
        })
      }
    }

    if (questoesParaRevisao.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_REVISAO',
        mensagem: 'Você não tem questões para revisar!',
        total: 0,
      })
    }

    // Buscar dados da primeira questão
    const primeiraQuestao = questoesParaRevisao[0]
    const { data: questaoData, error: erroQuestao } = await supabase
      .from('questoes')
      .select('id, componente, tema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, explicacao, dica, status')
      .eq('id', primeiraQuestao.questao_id)
      .eq('status', 'ativa')
      .single()

    if (erroQuestao || !questaoData) {
      // Tentar próxima questão se a primeira não está ativa
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_REVISAO',
        mensagem: 'Você não tem questões para revisar!',
        total: 0,
      })
    }

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
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
