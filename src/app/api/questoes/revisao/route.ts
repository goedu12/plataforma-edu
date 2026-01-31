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

    // Verificar se o estudante tem acesso ao componente solicitado
    if (!sessao.componentes.includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: `Você não está matriculado em ${componente === 'fisica' ? 'Física' : 'Matemática'}` },
        { status: 403 }
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

    // Buscar respostas do modo revisão (independente de corretas)
    const { data: respostasRevisadas } = await supabase
      .from('respostas')
      .select('questao_id, atualizado_em')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('modo', 'revisao')
      .not('atualizado_em', 'is', null)

    // Criar mapa de respostas corretas por questão (mais recente)
    const corretasMap = new Map<string, string>()
    respostasCorretas?.forEach(r => {
      const atual = corretasMap.get(r.questao_id)
      if (!atual || r.criado_em > atual) {
        corretasMap.set(r.questao_id, r.criado_em)
      }
    })

    // Criar mapa de questões revisadas (respondidas no modo revisão)
    const revisadasMap = new Map<string, string>()
    respostasRevisadas?.forEach(r => {
      if (r.atualizado_em) {
        const atual = revisadasMap.get(r.questao_id)
        if (!atual || r.atualizado_em > atual) {
          revisadasMap.set(r.questao_id, r.atualizado_em)
        }
      }
    })

    // Filtrar questões erradas que não foram acertadas depois E não foram revisadas depois
    const questoesParaRevisao: Array<{ questao_id: string; errou_em: string }> = []
    const questoesVistas = new Set<string>()

    for (const resposta of questoesErradas) {
      if (questoesVistas.has(resposta.questao_id)) continue
      questoesVistas.add(resposta.questao_id)

      const dataCorreta = corretasMap.get(resposta.questao_id)
      const dataRevisada = revisadasMap.get(resposta.questao_id)

      // Verificar se foi acertada depois de errar
      const acertouDepois = dataCorreta && dataCorreta > resposta.criado_em

      // Verificar se foi revisada depois de errar (independente de acertar)
      const revisouDepois = dataRevisada && dataRevisada > resposta.criado_em

      // Só adiciona para revisão se NÃO acertou depois E NÃO revisou depois
      if (!acertouDepois && !revisouDepois) {
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

    // Buscar todas as questões ativas para revisão
    const questoesIds = questoesParaRevisao.map(q => q.questao_id)

    const { data: questoesAtivas, error: erroQuestoes2 } = await supabase
      .from('questoes')
      .select('id, componente, tema, dificuldade, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, explicacao, dica')
      .in('id', questoesIds)
      .eq('status', 'ativa')

    if (erroQuestoes2 || !questoesAtivas || questoesAtivas.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_REVISAO',
        mensagem: 'Você não tem questões ativas para revisar!',
        total: 0,
      })
    }

    // Selecionar aleatoriamente para evitar repetição
    const indiceAleatorio = Math.floor(Math.random() * questoesAtivas.length)
    const questaoEncontrada = questoesAtivas[indiceAleatorio]
    const questaoErradaInfo = questoesParaRevisao.find(q => q.questao_id === questaoEncontrada.id)

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: {
        id: questaoEncontrada.id,
        componente: questaoEncontrada.componente,
        tema: questaoEncontrada.tema,
        dificuldade: questaoEncontrada.dificuldade,
        enunciado: questaoEncontrada.enunciado,
        alternativa_a: questaoEncontrada.alternativa_a,
        alternativa_b: questaoEncontrada.alternativa_b,
        alternativa_c: questaoEncontrada.alternativa_c,
        alternativa_d: questaoEncontrada.alternativa_d,
        alternativa_e: questaoEncontrada.alternativa_e,
        explicacao: questaoEncontrada.explicacao,
        dica: questaoEncontrada.dica,
      },
      total_revisao: questoesAtivas.length,
      errou_em: questaoErradaInfo?.errou_em,
    })
  } catch (error) {
    console.error('Erro ao buscar questões para revisão:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
