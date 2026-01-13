/**
 * API de Progresso dos FlashCards
 * POST /api/flashcards/progresso - Salvar progresso da sessão
 * GET /api/flashcards/progresso - Buscar progresso do usuário
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'
import type { AnoEscolar, RespostaFlashCard } from '@/types/flashcards'

// ═══════════════════════════════════════════════════════════════════════════
// POST - Salvar progresso da sessão
// ═══════════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    // Obter usuário da sessão
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json(
        { sucesso: false, erro: 'Sessão inválida' },
        { status: 401 }
      )
    }

    const usuario_id = session.id
    if (!usuario_id) {
      return NextResponse.json(
        { sucesso: false, erro: 'Usuário não encontrado na sessão' },
        { status: 401 }
      )
    }

    // Parsear body
    const body = await request.json()
    const {
      componente,
      ano,
      tema,
      respostas,
      pontos_totais,
      maior_sequencia,
      tempo_total,
    } = body as {
      componente: Componente
      ano?: AnoEscolar
      tema?: string
      respostas: RespostaFlashCard[]
      pontos_totais: number
      maior_sequencia: number
      tempo_total: number
    }

    // Validações
    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente inválido' },
        { status: 400 }
      )
    }

    if (!respostas || !Array.isArray(respostas)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Respostas inválidas' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Calcular estatísticas
    const questoes_corretas = respostas.filter((r) => r.correta).length
    const questoes_total = respostas.length

    // Prefixo do componente para campos
    const prefix = componente === 'fisica' ? 'fis' : 'mat'

    // Buscar dados atuais do usuário
    const { data: usuarioData, error: userError } = await supabase
      .from('usuarios')
      .select('fis_pontos, fis_questoes_total, fis_questoes_corretas, mat_pontos, mat_questoes_total, mat_questoes_corretas')
      .eq('id', usuario_id)
      .single()

    if (userError || !usuarioData) {
      console.error('Erro ao buscar usuário:', userError)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar dados do usuário' },
        { status: 500 }
      )
    }

    // Extrair dados baseado no componente
    const pontosAtuais = componente === 'fisica' ? usuarioData.fis_pontos : usuarioData.mat_pontos
    const questoesTotalAtuais = componente === 'fisica' ? usuarioData.fis_questoes_total : usuarioData.mat_questoes_total
    const questoesCorretasAtuais = componente === 'fisica' ? usuarioData.fis_questoes_corretas : usuarioData.mat_questoes_corretas

    // Atualizar pontos e estatísticas do usuário
    const updateData: Record<string, number | string> = {
      [`${prefix}_pontos`]: (pontosAtuais || 0) + pontos_totais,
      [`${prefix}_questoes_total`]: (questoesTotalAtuais || 0) + questoes_total,
      [`${prefix}_questoes_corretas`]: (questoesCorretasAtuais || 0) + questoes_corretas,
      ultimo_acesso: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', usuario_id)

    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao salvar progresso' },
        { status: 500 }
      )
    }

    // Salvar registro de atividade de flashcards (opcional - criar tabela se necessário)
    // Por enquanto, apenas retornamos sucesso

    return NextResponse.json({
      sucesso: true,
      dados: {
        pontos_ganhos: pontos_totais,
        questoes_respondidas: questoes_total,
        questoes_corretas,
        maior_sequencia,
        tempo_total,
        novos_totais: {
          pontos: (pontosAtuais || 0) + pontos_totais,
          questoes_total: (questoesTotalAtuais || 0) + questoes_total,
          questoes_corretas: (questoesCorretasAtuais || 0) + questoes_corretas,
        },
      },
    })
  } catch (error) {
    console.error('Erro na API de progresso:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET - Buscar progresso do usuário
// ═══════════════════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    // Obter usuário da sessão
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie?.value) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    let session
    try {
      session = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json(
        { sucesso: false, erro: 'Sessão inválida' },
        { status: 401 }
      )
    }

    const usuario_id = session.id
    if (!usuario_id) {
      return NextResponse.json(
        { sucesso: false, erro: 'Usuário não encontrado na sessão' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const componente = searchParams.get('componente') as Componente

    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente inválido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar dados do usuário
    const { data: usuarioData, error } = await supabase
      .from('usuarios')
      .select('fis_pontos, fis_questoes_total, fis_questoes_corretas, fis_sequencia_dias, fis_nivel, mat_pontos, mat_questoes_total, mat_questoes_corretas, mat_sequencia_dias, mat_nivel')
      .eq('id', usuario_id)
      .single()

    if (error || !usuarioData) {
      console.error('Erro ao buscar progresso:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar progresso' },
        { status: 500 }
      )
    }

    // Extrair dados baseado no componente
    const pontos = componente === 'fisica' ? usuarioData.fis_pontos : usuarioData.mat_pontos
    const questoes_total = componente === 'fisica' ? usuarioData.fis_questoes_total : usuarioData.mat_questoes_total
    const questoes_corretas = componente === 'fisica' ? usuarioData.fis_questoes_corretas : usuarioData.mat_questoes_corretas
    const sequencia_dias = componente === 'fisica' ? usuarioData.fis_sequencia_dias : usuarioData.mat_sequencia_dias
    const nivel = componente === 'fisica' ? usuarioData.fis_nivel : usuarioData.mat_nivel

    // Calcular taxa de acerto
    const taxa_acerto =
      questoes_total > 0
        ? Math.round((questoes_corretas / questoes_total) * 100)
        : 0

    return NextResponse.json({
      sucesso: true,
      progresso: {
        pontos: pontos || 0,
        questoes_total: questoes_total || 0,
        questoes_corretas: questoes_corretas || 0,
        sequencia_dias: sequencia_dias || 0,
        nivel: nivel || 'Iniciante',
        taxa_acerto,
      },
    })
  } catch (error) {
    console.error('Erro na API de progresso:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
