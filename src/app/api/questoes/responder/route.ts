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

    const { questao_id, componente, resposta, tempo_segundos, usou_dica, modo = 'estudo' } = await request.json()

    // Validações
    if (!questao_id || !componente || !resposta) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (!['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente inválido' },
        { status: 400 }
      )
    }

    if (!['A', 'B', 'C', 'D'].includes(resposta.toUpperCase())) {
      return NextResponse.json(
        { sucesso: false, erro: 'Resposta inválida' },
        { status: 400 }
      )
    }

    // Validar tempo_segundos
    const tempoValidado = typeof tempo_segundos === 'number' && tempo_segundos >= 0 && tempo_segundos <= 3600
      ? Math.floor(tempo_segundos)
      : 0

    // Validar modo (validar ANTES de verificar resposta existente)
    const modosValidos = ['estudo', 'desafio', 'revisao']
    const modoValidado = modosValidos.includes(modo) ? modo : 'estudo'
    const ehModoRevisao = modoValidado === 'revisao'

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

    // Verificar se já respondeu (PERMITIR re-resposta no modo revisão)
    const { data: respostaExistente } = await supabase
      .from('respostas')
      .select('id')
      .eq('usuario_id', sessao.userId)
      .eq('questao_id', questao_id)
      .single()

    if (respostaExistente && !ehModoRevisao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Você já respondeu esta questão' },
        { status: 400 }
      )
    }

    // Calcular pontos (sem pontos no modo revisão - é apenas prática)
    const correta = resposta.toUpperCase() === questao.resposta_correta
    let pontosGanhos = 0

    if (correta && !ehModoRevisao) {
      pontosGanhos = usou_dica ? PONTUACAO.RESPOSTA_COM_DICA : PONTUACAO.RESPOSTA_CORRETA

      // Bônus de velocidade (usando tempo validado)
      if (tempoValidado > 0 && tempoValidado < 30) {
        pontosGanhos += PONTUACAO.BONUS_VELOCIDADE
      }
    }

    // Registrar ou atualizar resposta
    if (ehModoRevisao && respostaExistente) {
      // No modo revisão, atualizar apenas os campos básicos da resposta existente
      // (não usa colunas 'modo' e 'atualizado_em' para compatibilidade com schema atual)
      const { error: erroAtualizacao } = await supabase
        .from('respostas')
        .update({
          resposta_dada: resposta.toUpperCase(),
          correta,
          tempo_segundos: tempoValidado,
          usou_dica: usou_dica || false,
        })
        .eq('id', respostaExistente.id)

      if (erroAtualizacao) {
        console.error('Erro ao atualizar resposta:', erroAtualizacao)
        return NextResponse.json(
          { sucesso: false, erro: 'Erro ao atualizar resposta' },
          { status: 500 }
        )
      }
    } else {
      // Inserir nova resposta (modo estudo ou desafio)
      // (não usa coluna 'modo' para compatibilidade com schema atual)
      const { error: erroResposta } = await supabase.from('respostas').insert({
        usuario_id: sessao.userId,
        questao_id,
        componente,
        resposta_dada: resposta.toUpperCase(),
        correta,
        tempo_segundos: tempoValidado,
        usou_dica: usou_dica || false,
        pontos_ganhos: pontosGanhos,
      })

      if (erroResposta) {
        console.error('Erro ao registrar resposta:', erroResposta)
        return NextResponse.json(
          { sucesso: false, erro: 'Erro ao registrar resposta' },
          { status: 500 }
        )
      }
    }

    // Variáveis para resposta (valores padrão para modo revisão)
    let novosPontos = 0
    let novoNivel = ''
    let novasQuestoesTotal = 0
    let novasQuestoesCorretas = 0
    let sequencia = 0
    const conquistasDesbloqueadas: Array<{ nome: string; icone: string }> = []

    // Só atualizar estatísticas se NÃO for modo revisão
    if (!ehModoRevisao) {
      // Buscar dados completos do usuário para atualização
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', sessao.userId)
        .single()

      if (!usuario) {
        return NextResponse.json(
          { sucesso: false, erro: 'Usuário não encontrado' },
          { status: 404 }
        )
      }

      // Determinar campos baseado no componente
      const ehFisica = componente === 'fisica'
      const pontosAtuais = ehFisica ? usuario.fis_pontos : usuario.mat_pontos
      const questoesTotalAtuais = ehFisica ? usuario.fis_questoes_total : usuario.mat_questoes_total
      const questoesCorretasAtuais = ehFisica ? usuario.fis_questoes_corretas : usuario.mat_questoes_corretas
      const ultimoEstudo = ehFisica ? usuario.fis_ultimo_estudo : usuario.mat_ultimo_estudo
      sequencia = (ehFisica ? usuario.fis_sequencia_dias : usuario.mat_sequencia_dias) || 0

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

      // Calcular novos valores
      novosPontos = pontosAtuais + pontosGanhos
      novasQuestoesTotal = questoesTotalAtuais + 1
      novasQuestoesCorretas = questoesCorretasAtuais + (correta ? 1 : 0)
      novoNivel = obterNivelPorPontos(novosPontos).nome

      // Atualizar usuário com valores calculados
      const dadosAtualizacao = ehFisica
        ? {
            fis_pontos: novosPontos,
            fis_questoes_total: novasQuestoesTotal,
            fis_questoes_corretas: novasQuestoesCorretas,
            fis_nivel: novoNivel,
            fis_ultimo_estudo: hoje,
            fis_sequencia_dias: sequencia,
          }
        : {
            mat_pontos: novosPontos,
            mat_questoes_total: novasQuestoesTotal,
            mat_questoes_corretas: novasQuestoesCorretas,
            mat_nivel: novoNivel,
            mat_ultimo_estudo: hoje,
            mat_sequencia_dias: sequencia,
          }

      const { error: erroAtualizacaoUsuario } = await supabase
        .from('usuarios')
        .update(dadosAtualizacao)
        .eq('id', sessao.userId)

      if (erroAtualizacaoUsuario) {
        console.error('Erro ao atualizar usuário:', erroAtualizacaoUsuario)
        return NextResponse.json(
          { sucesso: false, erro: 'Erro ao atualizar pontuação. Tente novamente.' },
          { status: 500 }
        )
      }

      // Atualizar ou criar registro de dia ativo (apenas para modo estudo)
      if (modoValidado === 'estudo') {
        const { data: diaAtivo } = await supabase
          .from('dias_ativos')
          .select('id, questoes, acertos, pontos, tempo_total_segundos')
          .eq('usuario_id', sessao.userId)
          .eq('componente', componente)
          .eq('data', hoje)
          .single()

        if (diaAtivo) {
          // Atualizar dia existente
          await supabase
            .from('dias_ativos')
            .update({
              questoes: diaAtivo.questoes + 1,
              acertos: diaAtivo.acertos + (correta ? 1 : 0),
              pontos: diaAtivo.pontos + pontosGanhos,
              tempo_total_segundos: diaAtivo.tempo_total_segundos + tempoValidado,
              atualizado_em: new Date().toISOString(),
            })
            .eq('id', diaAtivo.id)
        } else {
          // Criar novo dia ativo
          await supabase.from('dias_ativos').insert({
            usuario_id: sessao.userId,
            componente,
            data: hoje,
            questoes: 1,
            acertos: correta ? 1 : 0,
            pontos: pontosGanhos,
            tempo_total_segundos: tempoValidado,
          })
        }
      }

      // Verificar e desbloquear conquistas
      const novasConquistas = await verificarEDesbloquearConquistas(
        supabase,
        sessao.userId,
        componente as Componente,
        novosPontos,
        novasQuestoesTotal,
        novasQuestoesCorretas,
        sequencia
      )
      conquistasDesbloqueadas.push(...novasConquistas)
    }

    return NextResponse.json({
      sucesso: true,
      correta,
      pontos_ganhos: pontosGanhos,
      explicacao: questao.explicacao,
      novo_nivel: ehModoRevisao ? undefined : novoNivel,
      nova_pontuacao: ehModoRevisao ? undefined : novosPontos,
      conquistas_desbloqueadas: conquistasDesbloqueadas,
      modo_revisao: ehModoRevisao,
    })
  } catch (error) {
    console.error('Erro ao responder questão:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para verificar e desbloquear conquistas
async function verificarEDesbloquearConquistas(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  usuarioId: string,
  componente: Componente,
  pontos: number,
  questoesTotal: number,
  questoesCorretas: number,
  sequenciaDias: number
): Promise<Array<{ nome: string; icone: string }>> {
  const conquistasDesbloqueadas: Array<{ nome: string; icone: string }> = []

  try {
    // Calcular taxa de acerto
    const taxaAcerto = questoesTotal > 0 ? (questoesCorretas / questoesTotal) * 100 : 0

    // Buscar todas as conquistas que o usuário ainda não desbloqueou
    const { data: conquistasDisponiveis } = await supabase
      .from('conquistas')
      .select('*')
      .or(`componente.is.null,componente.eq.${componente}`)

    if (!conquistasDisponiveis) return conquistasDesbloqueadas

    // Buscar conquistas já desbloqueadas
    const { data: conquistasUsuario } = await supabase
      .from('conquistas_usuarios')
      .select('conquista_id')
      .eq('usuario_id', usuarioId)
      .eq('componente', componente)

    const conquistasJaDesbloqueadas = new Set(
      conquistasUsuario?.map(c => c.conquista_id) || []
    )

    // Verificar cada conquista
    for (const conquista of conquistasDisponiveis) {
      // Pular se já desbloqueou
      if (conquistasJaDesbloqueadas.has(conquista.id)) continue

      let elegivel = false

      switch (conquista.requisito_tipo) {
        case 'pontos':
          elegivel = pontos >= conquista.requisito_valor
          break
        case 'questoes':
          elegivel = questoesTotal >= conquista.requisito_valor
          break
        case 'sequencia':
          elegivel = sequenciaDias >= conquista.requisito_valor
          break
        case 'acertos':
          // Precisa de mínimo de 20 questões para conquistas de taxa de acerto
          elegivel = questoesTotal >= 20 && taxaAcerto >= conquista.requisito_valor
          break
      }

      if (elegivel) {
        // Desbloquear conquista
        const { error } = await supabase.from('conquistas_usuarios').insert({
          usuario_id: usuarioId,
          conquista_id: conquista.id,
          componente,
        })

        if (!error) {
          conquistasDesbloqueadas.push({
            nome: conquista.nome,
            icone: conquista.icone,
          })
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar conquistas:', error)
  }

  return conquistasDesbloqueadas
}
