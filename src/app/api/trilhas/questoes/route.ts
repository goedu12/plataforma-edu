/**
 * API de Questões da Trilha
 *
 * GET /api/trilhas/questoes?serie=1EM&semana=5
 *
 * Retorna as questões da semana atual da trilha do usuário
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verificarAutenticacao } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const auth = await verificarAutenticacao(request)
    if (!auth) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const serie = searchParams.get('serie')
    const semana = searchParams.get('semana')

    if (!serie || !['1EM', '2EM', '3EM'].includes(serie)) {
      return NextResponse.json(
        { erro: 'serie deve ser 1EM, 2EM ou 3EM' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar questões usando função SQL
    const { data, error } = await supabase.rpc('buscar_questoes_semana_trilha', {
      p_usuario_id: auth.id,
      p_serie: serie,
      p_semana: semana ? parseInt(semana) : null
    })

    if (error) {
      console.error('Erro ao buscar questões:', error)
      return NextResponse.json(
        { erro: 'Erro ao buscar questões' },
        { status: 500 }
      )
    }

    // Se não retornou questões, pode ser que não tenha trilha ativa
    if (!data || data.length === 0) {
      // Verificar se tem trilha ativa
      const { data: trilhaAtiva } = await supabase
        .from('usuario_trilha')
        .select('trilha_id, semana_atual')
        .eq('usuario_id', auth.id)
        .eq('serie', serie)
        .eq('ativa', true)
        .single()

      if (!trilhaAtiva) {
        return NextResponse.json({
          sucesso: true,
          questoes: [],
          mensagem: 'Você não tem uma trilha ativa para esta série. Escolha uma trilha primeiro!'
        })
      }

      return NextResponse.json({
        sucesso: true,
        questoes: [],
        semana: trilhaAtiva.semana_atual,
        mensagem: 'Não há questões disponíveis para esta semana ainda.'
      })
    }

    // Separar questões normais e desafio
    const questoesNormais = data.filter((q: any) => !q.is_desafio)
    const desafio = data.find((q: any) => q.is_desafio)

    // Calcular progresso
    const respondidas = questoesNormais.filter((q: any) => q.ja_respondida).length
    const corretas = questoesNormais.filter((q: any) => q.acertou).length
    const total = questoesNormais.length

    return NextResponse.json({
      sucesso: true,
      questoes: questoesNormais,
      desafio: desafio || null,
      progresso: {
        respondidas,
        corretas,
        total,
        percentual: total > 0 ? Math.round((corretas / total) * 100) : 0,
        pode_fazer_desafio: corretas >= 4
      }
    })

  } catch (error) {
    console.error('Erro na API de questões:', error)
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
