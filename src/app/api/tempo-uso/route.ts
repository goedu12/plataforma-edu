export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'

/**
 * API para registrar tempo de uso efetivo
 *
 * POST /api/tempo-uso
 * Body: { componente, atividade, segundos }
 *
 * O tempo é agregado por dia na tabela tempo_uso
 */
export async function POST(request: NextRequest) {
  try {
    // Tentar ler como JSON primeiro, senão como FormData (sendBeacon)
    let body: { componente?: string; atividade?: string; segundos?: number }

    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      body = await request.json()
    } else {
      // sendBeacon envia como text/plain
      const text = await request.text()
      try {
        body = JSON.parse(text)
      } catch {
        return new NextResponse(null, { status: 204 })
      }
    }

    const { componente, atividade, segundos } = body

    // Validação silenciosa - não bloquear UX
    if (!componente || !atividade || !segundos || segundos < 1) {
      return new NextResponse(null, { status: 204 })
    }

    if (!['fisica', 'matematica'].includes(componente)) {
      return new NextResponse(null, { status: 204 })
    }

    // Limitar a 1 hora por requisição (proteção contra bugs)
    const segundosValidados = Math.min(Math.floor(segundos), 3600)

    const sessao = await obterSessao()
    if (!sessao) {
      return new NextResponse(null, { status: 204 })
    }

    const supabase = getSupabaseAdmin()
    const hoje = new Date().toISOString().split('T')[0]

    // Upsert - agregar tempo por dia/componente/atividade
    const { data: registroExistente } = await supabase
      .from('tempo_uso')
      .select('id, segundos_total')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('atividade', atividade)
      .eq('data', hoje)
      .single()

    if (registroExistente) {
      // Atualizar registro existente
      await supabase
        .from('tempo_uso')
        .update({
          segundos_total: registroExistente.segundos_total + segundosValidados,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', registroExistente.id)
    } else {
      // Criar novo registro
      await supabase.from('tempo_uso').insert({
        usuario_id: sessao.userId,
        componente: componente as Componente,
        atividade,
        data: hoje,
        segundos_total: segundosValidados,
      })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Erro ao registrar tempo de uso:', error)
    return new NextResponse(null, { status: 204 })
  }
}

/**
 * GET /api/tempo-uso
 * Retorna tempo total de uso no período do bimestre
 */
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

    // Buscar configuração do período atual
    // Usando as mesmas datas do 1º bimestre: 2025-01-01 até 2026-04-15
    const dataInicio = '2025-01-01'
    const dataFim = '2026-04-15'

    // Buscar tempo de uso no período
    const { data: tempoUso } = await supabase
      .from('tempo_uso')
      .select('atividade, segundos_total')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .gte('data', dataInicio)
      .lte('data', dataFim)

    // Buscar tempo das respostas (já computado)
    const { data: respostas } = await supabase
      .from('respostas')
      .select('tempo_segundos')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .gte('criado_em', dataInicio)
      .lte('criado_em', dataFim + 'T23:59:59')

    // Calcular totais
    const tempoAtividades = tempoUso?.reduce((acc, t) => acc + (t.segundos_total || 0), 0) || 0
    const tempoQuestoes = respostas?.reduce((acc, r) => acc + (r.tempo_segundos || 0), 0) || 0
    const tempoTotal = tempoAtividades + tempoQuestoes

    // Agrupar por atividade
    const porAtividade: Record<string, number> = {}
    tempoUso?.forEach(t => {
      porAtividade[t.atividade] = (porAtividade[t.atividade] || 0) + t.segundos_total
    })
    porAtividade['questoes'] = tempoQuestoes

    return NextResponse.json({
      sucesso: true,
      tempo_total_segundos: tempoTotal,
      tempo_total_horas: Math.round((tempoTotal / 3600) * 100) / 100,
      por_atividade: porAtividade,
      // Pontos por tempo (fórmula v2)
      pontos_tempo: tempoTotal >= 5 * 3600 ? 4.0 :
                    tempoTotal >= 4 * 3600 ? 3.0 :
                    tempoTotal >= 3 * 3600 ? 2.0 :
                    tempoTotal >= 2 * 3600 ? 1.0 : 0,
    })
  } catch (error) {
    console.error('Erro ao buscar tempo de uso:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno' },
      { status: 500 }
    )
  }
}
