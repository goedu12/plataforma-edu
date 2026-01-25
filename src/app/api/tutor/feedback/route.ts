import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════
// API DE FEEDBACK DO TUTOR IA
// Coleta avaliações das respostas para melhoria contínua
// ═══════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { mensagemId, util, clareza, precisao, comentario, tipoProblema } = await request.json()

    // Validar campos
    if (typeof util !== 'boolean' && clareza === undefined && precisao === undefined) {
      return NextResponse.json({ sucesso: false, erro: 'Forneça ao menos um campo de avaliação' }, { status: 400 })
    }

    // Validar notas (1-5)
    if (clareza !== undefined && (clareza < 1 || clareza > 5)) {
      return NextResponse.json({ sucesso: false, erro: 'Clareza deve ser de 1 a 5' }, { status: 400 })
    }
    if (precisao !== undefined && (precisao < 1 || precisao > 5)) {
      return NextResponse.json({ sucesso: false, erro: 'Precisão deve ser de 1 a 5' }, { status: 400 })
    }

    // Validar tipo de problema
    const tiposValidos = ['incorreto', 'confuso', 'incompleto', 'muito_longo', 'muito_curto', 'outro']
    if (tipoProblema && !tiposValidos.includes(tipoProblema)) {
      return NextResponse.json({ sucesso: false, erro: 'Tipo de problema inválido' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    const { data: feedback, error } = await supabase
      .from('ia_feedback')
      .insert({
        usuario_id: sessaoAuth.userId,
        mensagem_id: mensagemId || null,
        util,
        clareza: clareza || null,
        precisao: precisao || null,
        comentario: comentario?.slice(0, 500) || null,
        tipo_problema: tipoProblema || null,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Feedback IA] Erro ao salvar:', error)
      return NextResponse.json({ sucesso: false, erro: 'Erro ao salvar feedback' }, { status: 500 })
    }

    return NextResponse.json({
      sucesso: true,
      feedbackId: feedback.id,
      mensagem: 'Obrigado pelo feedback!',
    })
  } catch (error) {
    console.error('[Feedback IA] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}

// GET - Estatísticas de feedback (para professor/admin)
export async function GET(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const periodo = searchParams.get('periodo') || '7d' // 7d, 30d, all

    const supabase = getSupabaseAdmin()

    // Calcular data de corte
    let dataCorte: string | null = null
    if (periodo === '7d') {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      dataCorte = d.toISOString()
    } else if (periodo === '30d') {
      const d = new Date()
      d.setDate(d.getDate() - 30)
      dataCorte = d.toISOString()
    }

    let query = supabase
      .from('ia_feedback')
      .select('util, clareza, precisao, tipo_problema')

    if (dataCorte) {
      query = query.gte('created_at', dataCorte)
    }

    const { data: feedbacks, error } = await query

    if (error) {
      console.error('[Feedback IA] Erro ao buscar:', error)
      return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar estatísticas' }, { status: 500 })
    }

    // Calcular estatísticas
    const total = feedbacks?.length || 0
    const uteis = feedbacks?.filter(f => f.util === true).length || 0
    const naoUteis = feedbacks?.filter(f => f.util === false).length || 0

    const clarezaMedia = feedbacks?.filter(f => f.clareza)
      .reduce((acc, f, _, arr) => acc + (f.clareza || 0) / arr.length, 0) || 0

    const precisaoMedia = feedbacks?.filter(f => f.precisao)
      .reduce((acc, f, _, arr) => acc + (f.precisao || 0) / arr.length, 0) || 0

    // Contar tipos de problemas
    const problemas: Record<string, number> = {}
    feedbacks?.forEach(f => {
      if (f.tipo_problema) {
        problemas[f.tipo_problema] = (problemas[f.tipo_problema] || 0) + 1
      }
    })

    return NextResponse.json({
      sucesso: true,
      estatisticas: {
        total,
        uteis,
        naoUteis,
        taxaUtilidade: total > 0 ? Math.round((uteis / total) * 100) : 0,
        clarezaMedia: Math.round(clarezaMedia * 10) / 10,
        precisaoMedia: Math.round(precisaoMedia * 10) / 10,
        problemas,
      },
    })
  } catch (error) {
    console.error('[Feedback IA] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}
