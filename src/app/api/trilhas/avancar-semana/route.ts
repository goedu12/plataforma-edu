/**
 * API para Avançar Semana na Trilha
 *
 * POST /api/trilhas/avancar-semana
 *
 * Verifica se o aluno completou a semana atual e avança para a próxima
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { serie } = body

    if (!serie || !['1EM', '2EM', '3EM'].includes(serie)) {
      return NextResponse.json(
        { erro: 'serie deve ser 1EM, 2EM ou 3EM' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar trilha ativa do usuário
    const { data: trilhaAtiva, error: trilhaError } = await supabase
      .from('usuario_trilha')
      .select('id, trilha_id, semana_atual, questoes_corretas, questoes_total')
      .eq('usuario_id', sessao.userId)
      .eq('serie', serie)
      .eq('ativa', true)
      .single()

    if (trilhaError || !trilhaAtiva) {
      return NextResponse.json(
        { erro: 'Você não tem uma trilha ativa' },
        { status: 400 }
      )
    }

    let semanaAtual = trilhaAtiva.semana_atual
    const anoLetivo = new Date().getFullYear()

    // Buscar progresso da semana atual
    let progressoSemana = await supabase
      .from('progresso_semanal')
      .select('questoes_respondidas, questoes_total, questoes_corretas, status')
      .eq('usuario_id', sessao.userId)
      .eq('trilha_id', trilhaAtiva.trilha_id)
      .eq('serie', serie)
      .eq('semana', semanaAtual)
      .eq('ano_letivo', anoLetivo)
      .single()
      .then(r => r.data)

    // Verificar quantas questões existem para esta semana
    let questoesDisponiveis = await supabase
      .from('questoes_trilha')
      .select('*', { count: 'exact', head: true })
      .eq('serie', serie)
      .eq('semana', semanaAtual)
      .eq('ano_letivo', anoLetivo)
      .eq('ativa', true)
      .then(r => r.count)

    let totalQuestoes = questoesDisponiveis || 5
    let respondidas = progressoSemana?.questoes_respondidas || 0

    // Se a semana atual não tem progresso, pode ser que o SQL já avançou automaticamente
    // Nesse caso, verificar se a semana ANTERIOR foi concluída recentemente
    if (respondidas === 0 && semanaAtual > 1) {
      const semanaAnterior = semanaAtual - 1

      const progressoAnterior = await supabase
        .from('progresso_semanal')
        .select('questoes_respondidas, questoes_total, questoes_corretas, status, concluida_em')
        .eq('usuario_id', sessao.userId)
        .eq('trilha_id', trilhaAtiva.trilha_id)
        .eq('serie', serie)
        .eq('semana', semanaAnterior)
        .eq('ano_letivo', anoLetivo)
        .single()
        .then(r => r.data)

      // Se a semana anterior foi concluída, usar ela como referência
      if (progressoAnterior && progressoAnterior.status === 'concluida') {
        const taxaAnterior = Math.round(
          ((progressoAnterior.questoes_corretas || 0) / (progressoAnterior.questoes_respondidas || 1)) * 100
        )

        // Já foi avançado pelo SQL, retornar sucesso
        return NextResponse.json({
          sucesso: true,
          mensagem: `Parabéns! Você avançou para a semana ${semanaAtual}!`,
          progresso: {
            semana_anterior: semanaAnterior,
            semana_atual: semanaAtual,
            completou: true,
            avancou: true,
            taxa_acerto: taxaAnterior
          }
        })
      }
    }

    // Verificar se completou a semana (respondeu todas as questões)
    if (respondidas < totalQuestoes) {
      return NextResponse.json({
        sucesso: false,
        erro: `Você ainda não completou a semana. Respondidas: ${respondidas}/${totalQuestoes}`,
        progresso: {
          semana_atual: semanaAtual,
          questoes_respondidas: respondidas,
          questoes_total: totalQuestoes,
          completou: false
        }
      })
    }

    // Calcular taxa de acerto
    const corretas = progressoSemana?.questoes_corretas || 0
    const taxaAcerto = Math.round((corretas / totalQuestoes) * 100)
    const minimoParaAvancar = 60 // 60% de acerto mínimo

    // Atualizar status da semana atual como completa
    await supabase
      .from('progresso_semanal')
      .update({
        status: taxaAcerto >= minimoParaAvancar ? 'completa' : 'reprovada',
        updated_at: new Date().toISOString()
      })
      .eq('usuario_id', sessao.userId)
      .eq('trilha_id', trilhaAtiva.trilha_id)
      .eq('serie', serie)
      .eq('semana', semanaAtual)
      .eq('ano_letivo', anoLetivo)

    // Se atingiu o mínimo, avançar para próxima semana
    if (taxaAcerto >= minimoParaAvancar) {
      const novaSemana = semanaAtual + 1

      // Verificar se não ultrapassou o limite (40 semanas)
      if (novaSemana > 40) {
        return NextResponse.json({
          sucesso: true,
          mensagem: 'Parabéns! Você completou toda a trilha!',
          progresso: {
            semana_atual: semanaAtual,
            completou: true,
            trilha_completa: true,
            taxa_acerto: taxaAcerto
          }
        })
      }

      // Avançar semana na trilha do usuário
      await supabase
        .from('usuario_trilha')
        .update({
          semana_atual: novaSemana,
          ultimo_acesso: new Date().toISOString()
        })
        .eq('id', trilhaAtiva.id)

      // Criar registro de progresso para nova semana
      await supabase
        .from('progresso_semanal')
        .upsert({
          usuario_id: sessao.userId,
          trilha_id: trilhaAtiva.trilha_id,
          serie: serie,
          semana: novaSemana,
          ano_letivo: anoLetivo,
          status: 'disponivel',
          desbloqueada_em: new Date().toISOString()
        }, {
          onConflict: 'usuario_id,trilha_id,serie,semana,ano_letivo'
        })

      return NextResponse.json({
        sucesso: true,
        mensagem: `Parabéns! Você avançou para a semana ${novaSemana}!`,
        progresso: {
          semana_anterior: semanaAtual,
          semana_atual: novaSemana,
          completou: true,
          avancou: true,
          taxa_acerto: taxaAcerto
        }
      })
    } else {
      // Não atingiu mínimo, precisa refazer
      // Limpar respostas da semana para permitir nova tentativa
      const { data: questoesSemana } = await supabase
        .from('questoes_trilha')
        .select('id')
        .eq('serie', serie)
        .eq('semana', semanaAtual)
        .eq('ano_letivo', anoLetivo)
        .eq('ativa', true)

      if (questoesSemana && questoesSemana.length > 0) {
        const questaoIds = questoesSemana.map(q => q.id)

        // Deletar respostas anteriores para permitir refazer
        await supabase
          .from('respostas_trilha')
          .delete()
          .eq('usuario_id', sessao.userId)
          .in('questao_id', questaoIds)

        // Resetar progresso da semana
        await supabase
          .from('progresso_semanal')
          .update({
            questoes_respondidas: 0,
            questoes_corretas: 0,
            pontos_semana: 0,
            status: 'disponivel',
            updated_at: new Date().toISOString()
          })
          .eq('usuario_id', sessao.userId)
          .eq('trilha_id', trilhaAtiva.trilha_id)
          .eq('serie', serie)
          .eq('semana', semanaAtual)
          .eq('ano_letivo', anoLetivo)
      }

      return NextResponse.json({
        sucesso: true,
        mensagem: `Você acertou ${taxaAcerto}%. Precisa de ${minimoParaAvancar}% para avançar. A semana foi resetada para você tentar novamente!`,
        progresso: {
          semana_atual: semanaAtual,
          completou: true,
          avancou: false,
          taxa_acerto: taxaAcerto,
          minimo_necessario: minimoParaAvancar,
          semana_resetada: true
        }
      })
    }

  } catch (error) {
    console.error('Erro na API de avançar semana:', error)
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
