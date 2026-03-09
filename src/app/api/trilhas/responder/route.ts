export const dynamic = 'force-dynamic'

/**
 * API para Responder Questão da Trilha
 *
 * POST /api/trilhas/responder
 *
 * Body: { questao_id, resposta, resposta_correta, tempo_segundos, usou_dica, serie }
 *
 * Funciona com questões geradas on-the-fly (sem cache)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'
import { isSerieEF } from '@/lib/gemini'
import {
  checkRespostaRateLimit,
  getRateLimitHeaders,
  verificarTempoMinimo,
  analisarPadrao,
} from '@/lib/rate-limit'

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

    // ═══════════════════════════════════════════════════════════════════════
    // RATE LIMITING - Proteção contra automação
    // ═══════════════════════════════════════════════════════════════════════
    const rateLimit = checkRespostaRateLimit(sessao.userId)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          erro: `Muitas requisições. Aguarde ${rateLimit.resetIn} segundos.`,
          codigo: 'RATE_LIMIT',
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimit),
        }
      )
    }

    const body = await request.json()
    const {
      questao_id,
      resposta,
      resposta_correta,
      tempo_segundos = 0,
      usou_dica = false,
      serie,
      feedback
    } = body

    // Validações
    if (!questao_id) {
      return NextResponse.json(
        { erro: 'questao_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!resposta || typeof resposta !== 'string') {
      return NextResponse.json(
        { erro: 'resposta é obrigatória' },
        { status: 400 }
      )
    }

    if (!resposta_correta || typeof resposta_correta !== 'string') {
      return NextResponse.json(
        { erro: 'resposta_correta é obrigatória' },
        { status: 400 }
      )
    }

    // Determinar alternativas válidas baseado na série
    const ehEF = serie ? isSerieEF(serie) : false
    const alternativasValidas = ehEF ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E']

    if (!alternativasValidas.includes(resposta.toUpperCase())) {
      return NextResponse.json(
        { erro: `resposta deve ser ${alternativasValidas.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar tempo (máximo 1 hora = 3600 segundos por questão)
    const tempoValidado = Math.max(0, Math.min(3600, Number(tempo_segundos) || 0))

    // ═══════════════════════════════════════════════════════════════════════
    // TEMPO MÍNIMO - Proteção contra respostas instantâneas
    // ═══════════════════════════════════════════════════════════════════════
    const tempoCheck = verificarTempoMinimo(tempoValidado)
    if (!tempoCheck.valido) {
      return NextResponse.json(
        {
          erro: `Tempo de resposta muito curto. Mínimo: ${tempoCheck.tempoMinimo} segundos.`,
          codigo: 'TEMPO_MINIMO',
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verificar se tem trilha ativa
    const { data: trilhaAtiva } = await supabase
      .from('usuario_trilha')
      .select('trilha_id, semana_atual, serie')
      .eq('usuario_id', sessao.userId)
      .eq('ativa', true)
      .single()

    if (!trilhaAtiva) {
      return NextResponse.json(
        { erro: 'Nenhuma trilha ativa encontrada' },
        { status: 400 }
      )
    }

    const serieAtual = serie || trilhaAtiva.serie
    const trilhaId = trilhaAtiva.trilha_id
    const semanaAtual = trilhaAtiva.semana_atual

    // Calcular se acertou e pontos
    const correta = resposta.toUpperCase() === resposta_correta.toUpperCase()
    let pontos = 0

    if (correta) {
      pontos = usou_dica ? 5 : 10
      // Bônus por velocidade (menos de 30 segundos)
      if (tempoValidado > 0 && tempoValidado < 30) {
        pontos += 2
      }
    }

    // Buscar ou criar progresso semanal
    let { data: progressoSemanal } = await supabase
      .from('progresso_semanal')
      .select('*')
      .eq('usuario_id', sessao.userId)
      .eq('trilha_id', trilhaId)
      .eq('serie', serieAtual)
      .eq('semana', semanaAtual)
      .single()

    if (!progressoSemanal) {
      // Criar progresso semanal se não existir
      const { data: novoProgresso, error: erroProgresso } = await supabase
        .from('progresso_semanal')
        .insert({
          usuario_id: sessao.userId,
          trilha_id: trilhaId,
          serie: serieAtual,
          semana: semanaAtual,
          questoes_total: 5,
          questoes_respondidas: 0,
          questoes_corretas: 0,
          tempo_total_segundos: 0,
          pontos_semana: 0,
          status: 'em_progresso',
          iniciada_em: new Date().toISOString()
        })
        .select()
        .single()

      if (erroProgresso) {
        console.error('Erro ao criar progresso:', erroProgresso)
        return NextResponse.json(
          { erro: 'Erro ao criar progresso' },
          { status: 500 }
        )
      }

      progressoSemanal = novoProgresso
    }

    // Atualizar progresso semanal
    const novasQuestoesRespondidas = (progressoSemanal.questoes_respondidas || 0) + 1
    const novasQuestoesCorretas = (progressoSemanal.questoes_corretas || 0) + (correta ? 1 : 0)
    const novoTempoTotal = (progressoSemanal.tempo_total_segundos || 0) + tempoValidado
    const novosPontos = (progressoSemanal.pontos_semana || 0) + pontos

    const { error: erroUpdate } = await supabase
      .from('progresso_semanal')
      .update({
        questoes_respondidas: novasQuestoesRespondidas,
        questoes_corretas: novasQuestoesCorretas,
        tempo_total_segundos: novoTempoTotal,
        pontos_semana: novosPontos,
        status: novasQuestoesRespondidas >= 5 ? 'concluida' : 'em_progresso',
        concluida_em: novasQuestoesRespondidas >= 5 ? new Date().toISOString() : null
      })
      .eq('id', progressoSemanal.id)

    if (erroUpdate) {
      console.error('Erro ao atualizar progresso:', erroUpdate)
    }

    // Atualizar trilha do usuário
    const { data: trilhaUsuario } = await supabase
      .from('usuario_trilha')
      .select('questoes_total, questoes_corretas, pontos_trilha')
      .eq('usuario_id', sessao.userId)
      .eq('trilha_id', trilhaId)
      .eq('serie', serieAtual)
      .single()

    if (trilhaUsuario) {
      await supabase
        .from('usuario_trilha')
        .update({
          questoes_total: (trilhaUsuario.questoes_total || 0) + 1,
          questoes_corretas: (trilhaUsuario.questoes_corretas || 0) + (correta ? 1 : 0),
          pontos_trilha: (trilhaUsuario.pontos_trilha || 0) + pontos,
          ultimo_acesso: new Date().toISOString()
        })
        .eq('usuario_id', sessao.userId)
        .eq('trilha_id', trilhaId)
        .eq('serie', serieAtual)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DETECÇÃO DE PADRÕES SUSPEITOS
    // ═══════════════════════════════════════════════════════════════════════
    const padrao = analisarPadrao(sessao.userId, tempoValidado, correta)
    if (padrao.nivel === 'bloqueado') {
      console.warn(`[Anti-Bot] Usuário ${sessao.userId} bloqueado: ${padrao.motivo}`)
      return NextResponse.json(
        {
          erro: 'Atividade suspeita detectada. Tente novamente mais tarde.',
          codigo: 'PADRAO_SUSPEITO',
        },
        { status: 403 }
      )
    }

    // Log de atenção (não bloqueia, mas registra)
    if (padrao.nivel === 'suspeito' || padrao.nivel === 'atencao') {
      console.warn(`[Anti-Bot] Padrão ${padrao.nivel} para usuário ${sessao.userId}: ${padrao.motivo}`)
    }

    // SEGURANCA: Só revelar resposta correta se o aluno acertou
    // Evita que alunos descubram respostas errando propositalmente
    const resultado: {
      sucesso: boolean
      correta: boolean
      resposta_certa?: string
      resposta_dada: string
      pontos: number
      feedback: string
      progresso: {
        questoes_respondidas: number
        questoes_corretas: number
        total: number
        percentual: number
        semana_completa: boolean
      }
    } = {
      sucesso: true,
      correta,
      resposta_dada: resposta.toUpperCase(),
      pontos,
      feedback: feedback || (correta ? 'Parabéns! Resposta correta!' : 'Resposta incorreta. Tente revisar o conteúdo.'),
      progresso: {
        questoes_respondidas: novasQuestoesRespondidas,
        questoes_corretas: novasQuestoesCorretas,
        total: 5,
        percentual: Math.round((novasQuestoesCorretas / 5) * 100),
        semana_completa: novasQuestoesRespondidas >= 5
      }
    }

    // Só inclui resposta correta se acertou
    if (correta) {
      resultado.resposta_certa = resposta_correta.toUpperCase()
    }

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('Erro na API de responder:', error)
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
