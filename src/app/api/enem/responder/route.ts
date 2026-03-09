export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  checkRespostaRateLimit,
  getRateLimitHeaders,
  verificarTempoMinimo,
  analisarPadrao,
} from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
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
          sucesso: false,
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
    const { questao_id, resposta, tempo_segundos } = body

    if (!questao_id || !resposta) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Validar resposta
    if (!['A', 'B', 'C', 'D', 'E'].includes(resposta)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Alternativa inválida' },
        { status: 400 }
      )
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TEMPO MÍNIMO - Proteção contra respostas instantâneas
    // ═══════════════════════════════════════════════════════════════════════
    const tempoValidado = Math.max(0, Math.min(3600, Number(tempo_segundos) || 0))
    const tempoCheck = verificarTempoMinimo(tempoValidado)
    if (!tempoCheck.valido) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: `Tempo de resposta muito curto. Mínimo: ${tempoCheck.tempoMinimo} segundos.`,
          codigo: 'TEMPO_MINIMO',
        },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar questão para verificar gabarito
    const { data: questao, error: errQuestao } = await supabase
      .from('questoes_enem')
      .select('id, gabarito, anulada, ano, dia, numero, area')
      .eq('id', questao_id)
      .single()

    if (errQuestao || !questao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Questão não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já respondeu esta questão
    const { data: jaRespondeu } = await supabase
      .from('respostas_enem')
      .select('id')
      .eq('usuario_id', sessao.userId)
      .eq('questao_enem_id', questao_id)
      .limit(1)

    if (jaRespondeu && jaRespondeu.length > 0) {
      return NextResponse.json(
        { sucesso: false, erro: 'Você já respondeu esta questão' },
        { status: 409 }
      )
    }

    // Questão anulada = sempre correta
    const correta = questao.anulada ? true : (resposta === questao.gabarito)

    // ═══════════════════════════════════════════════════════════════════════
    // DETECÇÃO DE PADRÕES SUSPEITOS
    // ═══════════════════════════════════════════════════════════════════════
    const padrao = analisarPadrao(sessao.userId, tempoValidado, correta)
    if (padrao.nivel === 'bloqueado') {
      console.warn(`[Anti-Bot ENEM] Usuário ${sessao.userId} bloqueado: ${padrao.motivo}`)
      return NextResponse.json(
        {
          sucesso: false,
          erro: 'Atividade suspeita detectada. Tente novamente mais tarde.',
          codigo: 'PADRAO_SUSPEITO',
        },
        { status: 403 }
      )
    }

    if (padrao.nivel === 'suspeito' || padrao.nivel === 'atencao') {
      console.warn(`[Anti-Bot ENEM] Padrão ${padrao.nivel} para usuário ${sessao.userId}: ${padrao.motivo}`)
    }

    // Registrar resposta
    const { error: errInsert } = await supabase
      .from('respostas_enem')
      .insert({
        usuario_id: sessao.userId,
        questao_enem_id: questao_id,
        resposta_dada: resposta,
        correta,
        tempo_segundos: tempoValidado,
      })

    if (errInsert) {
      console.error('Erro ao inserir resposta ENEM:', errInsert)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao registrar resposta' },
        { status: 500 }
      )
    }

    // Buscar estatísticas do simulado
    const { data: stats } = await supabase
      .from('respostas_enem')
      .select('correta')
      .eq('usuario_id', sessao.userId)

    const totalRespondidas = stats?.length || 0
    const totalCorretas = stats?.filter(s => s.correta).length || 0
    const percentualAcerto = totalRespondidas > 0
      ? Math.round((totalCorretas / totalRespondidas) * 100)
      : 0

    // SEGURANCA: Só revelar gabarito se acertou ou questão anulada
    // Evita que alunos descubram respostas errando propositalmente
    return NextResponse.json({
      sucesso: true,
      correta,
      // Só mostra gabarito se acertou ou se questão foi anulada
      gabarito: (correta || questao.anulada) ? questao.gabarito : undefined,
      anulada: questao.anulada,
      estatisticas: {
        total_respondidas: totalRespondidas,
        total_corretas: totalCorretas,
        percentual_acerto: percentualAcerto,
      },
    })
  } catch (error) {
    console.error('Erro na API ENEM responder:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
