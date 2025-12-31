import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'
import { PONTUACAO, obterNivelPorPontos } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { questao_id, componente, resposta, tempo_segundos, usou_dica } = await request.json()

    // Validações
    if (!questao_id || !componente || !resposta) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (!['A', 'B', 'C', 'D'].includes(resposta.toUpperCase())) {
      return NextResponse.json(
        { sucesso: false, erro: 'Resposta inválida' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar questão para verificar resposta
    const { data: questao } = await supabase
      .from('questoes')
      .select('resposta_correta, explicacao')
      .eq('id', questao_id)
      .single()

    if (!questao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Questão não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já respondeu
    const { data: respostaExistente } = await supabase
      .from('respostas')
      .select('id')
      .eq('usuario_id', sessao.userId)
      .eq('questao_id', questao_id)
      .single()

    if (respostaExistente) {
      return NextResponse.json(
        { sucesso: false, erro: 'Você já respondeu esta questão' },
        { status: 400 }
      )
    }

    // Calcular pontos
    const correta = resposta.toUpperCase() === questao.resposta_correta
    let pontosGanhos = 0

    if (correta) {
      pontosGanhos = usou_dica ? PONTUACAO.RESPOSTA_COM_DICA : PONTUACAO.RESPOSTA_CORRETA

      // Bônus de velocidade
      if (tempo_segundos < 30) {
        pontosGanhos += PONTUACAO.BONUS_VELOCIDADE
      }
    }

    // Registrar resposta
    await supabase.from('respostas').insert({
      usuario_id: sessao.userId,
      questao_id,
      componente,
      resposta_dada: resposta.toUpperCase(),
      correta,
      tempo_segundos: tempo_segundos || 0,
      usou_dica: usou_dica || false,
      pontos_ganhos: pontosGanhos,
    })

    // Atualizar progresso do usuário
    const camposPontos = componente === 'fisica' ? 'fis_pontos' : 'mat_pontos'
    const camposTotal = componente === 'fisica' ? 'fis_questoes_total' : 'mat_questoes_total'
    const camposCorretas = componente === 'fisica' ? 'fis_questoes_corretas' : 'mat_questoes_corretas'
    const camposNivel = componente === 'fisica' ? 'fis_nivel' : 'mat_nivel'
    const camposUltimoEstudo = componente === 'fisica' ? 'fis_ultimo_estudo' : 'mat_ultimo_estudo'
    const camposSequencia = componente === 'fisica' ? 'fis_sequencia_dias' : 'mat_sequencia_dias'

    // Buscar dados atuais
    const { data: usuario } = await supabase
      .from('usuarios')
      .select(`${camposPontos}, ${camposUltimoEstudo}, ${camposSequencia}`)
      .eq('id', sessao.userId)
      .single()

    if (!usuario) {
      return NextResponse.json(
        { sucesso: false, erro: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const pontosAtuais = usuario[camposPontos as keyof typeof usuario] as number
    const ultimoEstudo = usuario[camposUltimoEstudo as keyof typeof usuario] as string | null
    let sequencia = (usuario[camposSequencia as keyof typeof usuario] as number) || 0

    const hoje = new Date().toISOString().split('T')[0]
    const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Calcular sequência
    if (!ultimoEstudo || ultimoEstudo < ontem) {
      sequencia = 1
    } else if (ultimoEstudo === ontem) {
      sequencia += 1
      // Bônus de sequência de 7 dias
      if (sequencia === 7) {
        pontosGanhos += PONTUACAO.BONUS_SEQUENCIA_7_DIAS
      }
    }
    // Se já estudou hoje, mantém a sequência

    const novosPontos = pontosAtuais + pontosGanhos
    const novoNivel = obterNivelPorPontos(novosPontos).nome

    // Atualizar usuário
    await supabase
      .from('usuarios')
      .update({
        [camposPontos]: novosPontos,
        [camposTotal]: supabase.rpc('increment', { x: 1 }),
        [camposCorretas]: correta ? supabase.rpc('increment', { x: 1 }) : supabase.rpc('increment', { x: 0 }),
        [camposNivel]: novoNivel,
        [camposUltimoEstudo]: hoje,
        [camposSequencia]: sequencia,
      })
      .eq('id', sessao.userId)

    return NextResponse.json({
      sucesso: true,
      correta,
      pontos_ganhos: pontosGanhos,
      explicacao: questao.explicacao,
      novo_nivel: novoNivel,
      nova_pontuacao: novosPontos,
    })
  } catch (error) {
    console.error('Erro ao responder questão:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
