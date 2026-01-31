export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════
// API DE ESTADO EMOCIONAL E DIFICULDADES DO ESTUDANTE
// Rastreia engajamento, frustração e áreas de dificuldade
// ═══════════════════════════════════════════════════════════

// GET - Obter estado atual e dificuldades
export async function GET(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const componente = searchParams.get('componente') as Componente

    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json({ sucesso: false, erro: 'Componente inválido' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Buscar estado emocional
    const { data: estado } = await supabase
      .from('estudante_estado')
      .select('*')
      .eq('usuario_id', sessaoAuth.userId)
      .eq('componente', componente)
      .single()

    // Buscar dificuldades (top 5 por nível)
    const { data: dificuldades } = await supabase
      .from('estudante_dificuldades')
      .select('topico, subtopico, nivel_dificuldade, taxa_acerto, erros_consecutivos')
      .eq('usuario_id', sessaoAuth.userId)
      .eq('componente', componente)
      .order('nivel_dificuldade', { ascending: false })
      .order('erros_consecutivos', { ascending: false })
      .limit(5)

    // Buscar tópicos dominados (taxa >= 80%)
    const { data: dominados } = await supabase
      .from('estudante_dificuldades')
      .select('topico, taxa_acerto')
      .eq('usuario_id', sessaoAuth.userId)
      .eq('componente', componente)
      .gte('taxa_acerto', 80)
      .order('taxa_acerto', { ascending: false })
      .limit(5)

    return NextResponse.json({
      sucesso: true,
      estado: estado || {
        nivel_engajamento: 5,
        nivel_frustacao: 1,
        nivel_confianca: 5,
        precisa_motivacao: false,
        sequencia_acertos: 0,
        sequencia_erros: 0,
      },
      dificuldades: dificuldades || [],
      dominados: dominados || [],
    })
  } catch (error) {
    console.error('[Estado IA] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}

// POST - Atualizar estado após interação
export async function POST(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { componente, acertou, topico, subtopico, sessaoId } = await request.json()

    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json({ sucesso: false, erro: 'Componente inválido' }, { status: 400 })
    }

    if (typeof acertou !== 'boolean') {
      return NextResponse.json({ sucesso: false, erro: 'Campo "acertou" é obrigatório' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // ═══════════════════════════════════════════════════════════
    // 1. ATUALIZAR ESTADO EMOCIONAL
    // ═══════════════════════════════════════════════════════════
    const { data: estadoAtual } = await supabase
      .from('estudante_estado')
      .select('*')
      .eq('usuario_id', sessaoAuth.userId)
      .eq('componente', componente)
      .single()

    const novoEstado = {
      usuario_id: sessaoAuth.userId,
      componente,
      sessao_id: sessaoId || null,
      nivel_engajamento: estadoAtual?.nivel_engajamento || 5,
      nivel_frustacao: estadoAtual?.nivel_frustacao || 1,
      nivel_confianca: estadoAtual?.nivel_confianca || 5,
      sequencia_acertos: estadoAtual?.sequencia_acertos || 0,
      sequencia_erros: estadoAtual?.sequencia_erros || 0,
      precisa_motivacao: false,
      ultimo_acerto: estadoAtual?.ultimo_acerto,
      ultimo_erro: estadoAtual?.ultimo_erro,
      updated_at: new Date().toISOString(),
    }

    if (acertou) {
      novoEstado.nivel_engajamento = Math.min(10, novoEstado.nivel_engajamento + 1)
      novoEstado.nivel_frustacao = Math.max(1, novoEstado.nivel_frustacao - 1)
      novoEstado.nivel_confianca = Math.min(10, novoEstado.nivel_confianca + 1)
      novoEstado.sequencia_acertos = novoEstado.sequencia_acertos + 1
      novoEstado.sequencia_erros = 0
      novoEstado.ultimo_acerto = new Date().toISOString()
    } else {
      novoEstado.nivel_engajamento = Math.max(1, novoEstado.nivel_engajamento - 1)
      novoEstado.nivel_frustacao = Math.min(10, novoEstado.nivel_frustacao + 1)
      novoEstado.nivel_confianca = Math.max(1, novoEstado.nivel_confianca - 1)
      novoEstado.sequencia_acertos = 0
      novoEstado.sequencia_erros = novoEstado.sequencia_erros + 1
      novoEstado.ultimo_erro = new Date().toISOString()

      // Se 3+ erros consecutivos, precisa motivação
      if (novoEstado.sequencia_erros >= 3) {
        novoEstado.precisa_motivacao = true
      }
    }

    // Upsert estado
    await supabase
      .from('estudante_estado')
      .upsert(novoEstado, { onConflict: 'usuario_id,componente' })

    // ═══════════════════════════════════════════════════════════
    // 2. ATUALIZAR DIFICULDADES POR TÓPICO
    // ═══════════════════════════════════════════════════════════
    if (topico) {
      const { data: dificuldadeAtual } = await supabase
        .from('estudante_dificuldades')
        .select('*')
        .eq('usuario_id', sessaoAuth.userId)
        .eq('componente', componente)
        .eq('topico', topico)
        .eq('subtopico', subtopico || '')
        .single()

      const acertosTotal = (dificuldadeAtual?.acertos_total || 0) + (acertou ? 1 : 0)
      const errosTotal = (dificuldadeAtual?.erros_total || 0) + (acertou ? 0 : 1)
      const errosConsecutivos = acertou ? 0 : (dificuldadeAtual?.erros_consecutivos || 0) + 1

      // Calcular nível de dificuldade baseado na taxa de acerto
      const totalRespostas = acertosTotal + errosTotal
      const taxaAcerto = totalRespostas > 0 ? (acertosTotal / totalRespostas) * 100 : 50

      let nivelDificuldade = 3 // Médio por padrão
      if (taxaAcerto >= 80) nivelDificuldade = 1 // Fácil
      else if (taxaAcerto >= 60) nivelDificuldade = 2 // Normal
      else if (taxaAcerto >= 40) nivelDificuldade = 3 // Médio
      else if (taxaAcerto >= 20) nivelDificuldade = 4 // Difícil
      else nivelDificuldade = 5 // Muito Difícil

      await supabase
        .from('estudante_dificuldades')
        .upsert({
          usuario_id: sessaoAuth.userId,
          componente,
          topico,
          subtopico: subtopico || '',
          acertos_total: acertosTotal,
          erros_total: errosTotal,
          erros_consecutivos: errosConsecutivos,
          nivel_dificuldade: nivelDificuldade,
          ultima_interacao: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'usuario_id,componente,topico,subtopico',
        })
    }

    return NextResponse.json({
      sucesso: true,
      estado: novoEstado,
      mensagem: acertou ? 'Acerto registrado!' : 'Erro registrado',
      precisaMotivacao: novoEstado.precisa_motivacao,
    })
  } catch (error) {
    console.error('[Estado IA] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}
