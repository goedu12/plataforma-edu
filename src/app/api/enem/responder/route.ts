import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AlternativaENEM, AreaENEM, SubareaENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Submeter resposta
// POST /api/enem/responder
// ═══════════════════════════════════════════════════════════════════════════

interface RequestBody {
  questao_id: string
  resposta: string
  tempo_segundos?: number
}

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body: RequestBody = await request.json()
    const {
      questao_id,
      resposta,
      tempo_segundos = 0,
    } = body

    if (!questao_id || !resposta) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const respostaUpperCase = resposta.toUpperCase() as AlternativaENEM
    if (!['A', 'B', 'C', 'D', 'E'].includes(respostaUpperCase)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Resposta inválida. Use A, B, C, D ou E.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verificar se usuário pode acessar (3ª série EM ou professor)
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nivel, ano, tipo')
      .eq('id', sessao.userId)
      .single()

    const isProfessor = usuario?.tipo === 'professor'
    const isAlunoEM = usuario?.nivel === 'EM'

    if (!usuario || (!isProfessor && !isAlunoEM)) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Simulado ENEM disponível apenas para alunos do Ensino Médio.',
      }, { status: 403 })
    }

    // SEGURANÇA: Buscar resposta correta APENAS do banco de dados
    // Nunca confiar em dados enviados pelo cliente
    const { data: questao } = await supabase
      .from('questoes_enem')
      .select('id, resposta_correta, ano_prova, area, subarea')
      .eq('id', questao_id)
      .single()

    if (!questao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Questão não encontrada' },
        { status: 404 }
      )
    }

    const respostaCorreta = questao.resposta_correta
    const anoProva = questao.ano_prova
    const area = questao.area as AreaENEM
    const subarea = questao.subarea as SubareaENEM

    // Verificar se já respondeu
    const { data: respostaExistente } = await supabase
      .from('respostas_enem')
      .select('id')
      .eq('usuario_id', sessao.userId)
      .eq('questao_id', questao_id)
      .single()

    if (respostaExistente) {
      return NextResponse.json(
        { sucesso: false, erro: 'Você já respondeu esta questão' },
        { status: 400 }
      )
    }

    const correta = respostaUpperCase === respostaCorreta
    const tempoValidado = typeof tempo_segundos === 'number' && tempo_segundos >= 0 && tempo_segundos <= 7200
      ? Math.floor(tempo_segundos)
      : 0

    // Inserir resposta
    const { error: erroInsert } = await supabase.from('respostas_enem').insert({
      usuario_id: sessao.userId,
      questao_id: questao_id,
      resposta_dada: respostaUpperCase,
      correta,
      tempo_segundos: tempoValidado,
      ano_prova: anoProva,
      area: area,
      subarea: subarea,
      modo: 'livre',
    })

    if (erroInsert) {
      console.error('Erro ao registrar resposta ENEM:', erroInsert)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao registrar resposta', detalhes: erroInsert.message },
        { status: 500 }
      )
    }

    // Estatísticas atualizadas
    const { data: estatisticas } = await supabase
      .from('respostas_enem')
      .select('correta')
      .eq('usuario_id', sessao.userId)

    const totalQuestoes = estatisticas?.length || 0
    const totalCorretas = estatisticas?.filter(r => r.correta).length || 0
    const taxaAcerto = totalQuestoes > 0
      ? Math.round((totalCorretas / totalQuestoes) * 100)
      : 0

    return NextResponse.json({
      sucesso: true,
      correta,
      resposta_correta: respostaCorreta,
      estatisticas: {
        total_questoes: totalQuestoes,
        total_corretas: totalCorretas,
        taxa_acerto: taxaAcerto,
      },
    })
  } catch (error) {
    console.error('Erro ao responder questão ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor', detalhes: String(error) },
      { status: 500 }
    )
  }
}
