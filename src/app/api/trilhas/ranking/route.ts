import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════
// API DE RANKING DE TRILHAS
// Ranking semanal para competição entre estudantes
// ═══════════════════════════════════════════════════════════

interface RankingEntry {
  posicao: number
  usuario_id: string
  nome: string
  turma: string
  pontos_semana: number
  questoes_corretas: number
  tempo_total_segundos: number
  avatar?: string
  isCurrentUser?: boolean
}

// GET - Obter ranking semanal
export async function GET(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const serie = searchParams.get('serie') || '1EM'
    const semanaParam = searchParams.get('semana')
    const limite = parseInt(searchParams.get('limite') || '20')
    const trilhaId = searchParams.get('trilha') || 'desafio' // Padrão: trilha desafio

    // Calcular semana atual do ano
    const agora = new Date()
    const inicioAno = new Date(agora.getFullYear(), 0, 1)
    const diasPassados = Math.floor((agora.getTime() - inicioAno.getTime()) / (24 * 60 * 60 * 1000))
    const semanaAtual = Math.ceil((diasPassados + inicioAno.getDay() + 1) / 7)
    const semana = semanaParam ? parseInt(semanaParam) : semanaAtual
    const anoLetivo = agora.getFullYear()

    const supabase = getSupabaseAdmin()

    // Buscar ranking da semana
    const { data: ranking, error } = await supabase
      .from('trilha_ranking')
      .select(`
        usuario_id,
        pontos_semana,
        questoes_corretas,
        tempo_total_segundos,
        posicao,
        usuarios(nome, turma, foto_url)
      `)
      .eq('serie', serie)
      .eq('semana', semana)
      .eq('ano_letivo', anoLetivo)
      .order('pontos_semana', { ascending: false })
      .order('questoes_corretas', { ascending: false })
      .order('tempo_total_segundos', { ascending: true })
      .limit(limite)

    if (error) {
      console.error('[Ranking] Erro ao buscar:', error)
      return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar ranking' }, { status: 500 })
    }

    // Formatar ranking
    const rankingFormatado: RankingEntry[] = (ranking || []).map((entry, index) => {
      const usuario = entry.usuarios as unknown as { nome: string; turma: string; foto_url?: string } | null
      return {
        posicao: entry.posicao || index + 1,
        usuario_id: entry.usuario_id,
        nome: usuario?.nome || 'Anônimo',
        turma: usuario?.turma || '',
        pontos_semana: entry.pontos_semana || 0,
        questoes_corretas: entry.questoes_corretas || 0,
        tempo_total_segundos: entry.tempo_total_segundos || 0,
        avatar: usuario?.foto_url || undefined,
        isCurrentUser: entry.usuario_id === sessaoAuth.userId,
      }
    })

    // Buscar posição do usuário atual se não estiver no top
    let posicaoUsuario: RankingEntry | null = null
    const usuarioNoRanking = rankingFormatado.find(e => e.isCurrentUser)

    if (!usuarioNoRanking) {
      // Buscar posição do usuário
      const { data: userRanking } = await supabase
        .from('trilha_ranking')
        .select(`
          usuario_id,
          pontos_semana,
          questoes_corretas,
          tempo_total_segundos,
          posicao,
          usuarios(nome, turma, foto_url)
        `)
        .eq('usuario_id', sessaoAuth.userId)
        .eq('serie', serie)
        .eq('semana', semana)
        .eq('ano_letivo', anoLetivo)
        .single()

      if (userRanking) {
        const usuario = userRanking.usuarios as unknown as { nome: string; turma: string; foto_url?: string } | null
        posicaoUsuario = {
          posicao: userRanking.posicao || rankingFormatado.length + 1,
          usuario_id: userRanking.usuario_id,
          nome: usuario?.nome || 'Você',
          turma: usuario?.turma || '',
          pontos_semana: userRanking.pontos_semana || 0,
          questoes_corretas: userRanking.questoes_corretas || 0,
          tempo_total_segundos: userRanking.tempo_total_segundos || 0,
          avatar: usuario?.foto_url || undefined,
          isCurrentUser: true,
        }
      }
    }

    // Estatísticas gerais
    const { count: totalParticipantes } = await supabase
      .from('trilha_ranking')
      .select('*', { count: 'exact', head: true })
      .eq('serie', serie)
      .eq('semana', semana)
      .eq('ano_letivo', anoLetivo)

    return NextResponse.json({
      sucesso: true,
      ranking: rankingFormatado,
      posicaoUsuario,
      semana,
      semanaAtual,
      anoLetivo,
      serie,
      trilhaId,
      totalParticipantes: totalParticipantes || 0,
    })
  } catch (error) {
    console.error('[Ranking] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}

// POST - Atualizar pontos do usuário no ranking
export async function POST(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { serie, pontos, questoesCorretas, tempoSegundos } = await request.json()

    if (!serie) {
      return NextResponse.json({ sucesso: false, erro: 'Série não especificada' }, { status: 400 })
    }

    // Calcular semana atual
    const agora = new Date()
    const inicioAno = new Date(agora.getFullYear(), 0, 1)
    const diasPassados = Math.floor((agora.getTime() - inicioAno.getTime()) / (24 * 60 * 60 * 1000))
    const semana = Math.ceil((diasPassados + inicioAno.getDay() + 1) / 7)
    const anoLetivo = agora.getFullYear()

    const supabase = getSupabaseAdmin()

    // Buscar entrada atual
    const { data: entradaAtual } = await supabase
      .from('trilha_ranking')
      .select('*')
      .eq('usuario_id', sessaoAuth.userId)
      .eq('serie', serie)
      .eq('semana', semana)
      .eq('ano_letivo', anoLetivo)
      .single()

    if (entradaAtual) {
      // Atualizar existente
      const { error } = await supabase
        .from('trilha_ranking')
        .update({
          pontos_semana: (entradaAtual.pontos_semana || 0) + (pontos || 0),
          questoes_corretas: (entradaAtual.questoes_corretas || 0) + (questoesCorretas || 0),
          tempo_total_segundos: (entradaAtual.tempo_total_segundos || 0) + (tempoSegundos || 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', entradaAtual.id)

      if (error) {
        console.error('[Ranking] Erro ao atualizar:', error)
        return NextResponse.json({ sucesso: false, erro: 'Erro ao atualizar ranking' }, { status: 500 })
      }
    } else {
      // Criar nova entrada
      const { error } = await supabase
        .from('trilha_ranking')
        .insert({
          usuario_id: sessaoAuth.userId,
          serie,
          semana,
          ano_letivo: anoLetivo,
          pontos_semana: pontos || 0,
          questoes_corretas: questoesCorretas || 0,
          tempo_total_segundos: tempoSegundos || 0,
        })

      if (error) {
        console.error('[Ranking] Erro ao criar:', error)
        return NextResponse.json({ sucesso: false, erro: 'Erro ao criar entrada no ranking' }, { status: 500 })
      }
    }

    // Recalcular posições
    await recalcularPosicoes(supabase, serie, semana, anoLetivo)

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Ranking atualizado',
    })
  } catch (error) {
    console.error('[Ranking] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}

// Função auxiliar para recalcular posições
async function recalcularPosicoes(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  serie: string,
  semana: number,
  anoLetivo: number
) {
  try {
    // Buscar todos os participantes ordenados
    const { data: participantes } = await supabase
      .from('trilha_ranking')
      .select('id, pontos_semana, questoes_corretas, tempo_total_segundos')
      .eq('serie', serie)
      .eq('semana', semana)
      .eq('ano_letivo', anoLetivo)
      .order('pontos_semana', { ascending: false })
      .order('questoes_corretas', { ascending: false })
      .order('tempo_total_segundos', { ascending: true })

    if (!participantes) return

    // Atualizar posições
    for (let i = 0; i < participantes.length; i++) {
      await supabase
        .from('trilha_ranking')
        .update({ posicao: i + 1 })
        .eq('id', participantes[i].id)
    }
  } catch (error) {
    console.error('[Ranking] Erro ao recalcular posições:', error)
  }
}
