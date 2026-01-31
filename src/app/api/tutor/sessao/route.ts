export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════
// API DE SESSÕES DO TUTOR IA AVANÇADO
// Gerencia sessões de estudo, rastreamento e análise
// ═══════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { acao, componente, sessaoId, satisfacao } = await request.json()

    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json({ sucesso: false, erro: 'Componente inválido' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    switch (acao) {
      case 'iniciar': {
        // Finalizar sessões abertas anteriores
        await supabase
          .from('ia_sessoes')
          .update({ fim: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('usuario_id', sessaoAuth.userId)
          .eq('componente', componente)
          .is('fim', null)

        // Criar nova sessão
        const { data: novaSessao, error } = await supabase
          .from('ia_sessoes')
          .insert({
            usuario_id: sessaoAuth.userId,
            componente,
            inicio: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (error) {
          console.error('[Sessão IA] Erro ao criar:', error)
          return NextResponse.json({ sucesso: false, erro: 'Erro ao criar sessão' }, { status: 500 })
        }

        return NextResponse.json({
          sucesso: true,
          sessaoId: novaSessao.id,
          mensagem: 'Sessão iniciada',
        })
      }

      case 'finalizar': {
        if (!sessaoId) {
          return NextResponse.json({ sucesso: false, erro: 'ID da sessão não fornecido' }, { status: 400 })
        }

        // Contar mensagens da sessão
        const { count: msgCount } = await supabase
          .from('ia_mensagens')
          .select('*', { count: 'exact', head: true })
          .eq('sessao_id', sessaoId)

        // Atualizar sessão
        const { error } = await supabase
          .from('ia_sessoes')
          .update({
            fim: new Date().toISOString(),
            satisfacao: satisfacao || null,
            msgs_trocadas: msgCount || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sessaoId)
          .eq('usuario_id', sessaoAuth.userId)

        if (error) {
          console.error('[Sessão IA] Erro ao finalizar:', error)
          return NextResponse.json({ sucesso: false, erro: 'Erro ao finalizar sessão' }, { status: 500 })
        }

        return NextResponse.json({
          sucesso: true,
          mensagem: 'Sessão finalizada',
        })
      }

      case 'obter_ativa': {
        // Buscar sessão ativa (aberta)
        const { data: sessaoAtiva } = await supabase
          .from('ia_sessoes')
          .select('id, inicio, modo_predominante, topico_principal, msgs_trocadas')
          .eq('usuario_id', sessaoAuth.userId)
          .eq('componente', componente)
          .is('fim', null)
          .order('inicio', { ascending: false })
          .limit(1)
          .single()

        return NextResponse.json({
          sucesso: true,
          sessao: sessaoAtiva || null,
        })
      }

      default:
        return NextResponse.json({ sucesso: false, erro: 'Ação inválida' }, { status: 400 })
    }
  } catch (error) {
    console.error('[Sessão IA] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}

// GET - Obter histórico de sessões
export async function GET(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const componente = searchParams.get('componente') as Componente
    const limite = parseInt(searchParams.get('limite') || '10')

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('ia_sessoes')
      .select('*')
      .eq('usuario_id', sessaoAuth.userId)
      .order('inicio', { ascending: false })
      .limit(limite)

    if (componente) {
      query = query.eq('componente', componente)
    }

    const { data: sessoes, error } = await query

    if (error) {
      console.error('[Sessão IA] Erro ao buscar:', error)
      return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar sessões' }, { status: 500 })
    }

    // Calcular estatísticas
    const totalSessoes = sessoes?.length || 0
    const totalMensagens = sessoes?.reduce((acc, s) => acc + (s.msgs_trocadas || 0), 0) || 0
    const mediaSatisfacao = sessoes?.filter(s => s.satisfacao)
      .reduce((acc, s, _, arr) => acc + (s.satisfacao || 0) / arr.length, 0) || 0

    return NextResponse.json({
      sucesso: true,
      sessoes,
      estatisticas: {
        totalSessoes,
        totalMensagens,
        mediaSatisfacao: Math.round(mediaSatisfacao * 10) / 10,
      },
    })
  } catch (error) {
    console.error('[Sessão IA] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}
