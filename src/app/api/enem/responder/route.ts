import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM v2 - Submeter resposta
// POST /api/enem/responder
// ═══════════════════════════════════════════════════════════════════════════

interface RequestBody {
  questao_id: string       // ex: "enem-2023-45"
  resposta: string         // A, B, C, D ou E
  resposta_correta: string // base64 encoded
  tempo_segundos?: number
  ano_prova: number
  disciplina: string
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
      resposta_correta: respostaCorretaBase64,
      tempo_segundos = 0,
      ano_prova,
      disciplina,
    } = body

    // Validação básica
    if (!questao_id || !resposta || !respostaCorretaBase64 || !ano_prova) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const respostaUpperCase = resposta.toUpperCase()
    if (!['A', 'B', 'C', 'D', 'E'].includes(respostaUpperCase)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Resposta inválida. Use A, B, C, D ou E.' },
        { status: 400 }
      )
    }

    // Decodificar resposta correta
    let respostaCorreta: string
    try {
      respostaCorreta = Buffer.from(respostaCorretaBase64, 'base64').toString('utf-8').toUpperCase()
    } catch {
      return NextResponse.json(
        { sucesso: false, erro: 'Resposta correta inválida' },
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
    const isAluno3SerieEM = usuario?.nivel === 'EM' && usuario?.ano === 3

    if (!usuario || (!isProfessor && !isAluno3SerieEM)) {
      return NextResponse.json({
        sucesso: false,
        erro: 'O Simulado ENEM está disponível apenas para alunos da 3ª série do Ensino Médio.',
      }, { status: 403 })
    }

    // Verificar se já respondeu esta questão
    const { data: respostaExistente } = await supabase
      .from('respostas_enem')
      .select('id')
      .eq('usuario_id', sessao.userId)
      .eq('id_api_questao', questao_id)
      .single()

    if (respostaExistente) {
      return NextResponse.json(
        { sucesso: false, erro: 'Você já respondeu esta questão' },
        { status: 400 }
      )
    }

    // Verificar se acertou
    const correta = respostaUpperCase === respostaCorreta

    // Validar tempo (máximo 2 horas)
    const tempoValidado = typeof tempo_segundos === 'number' && tempo_segundos >= 0 && tempo_segundos <= 7200
      ? Math.floor(tempo_segundos)
      : 0

    // Determinar área baseado na disciplina
    let area = 'outros'
    const discLower = (disciplina || '').toLowerCase()
    if (discLower.includes('natureza') || discLower.includes('física') || discLower.includes('química') || discLower.includes('biologia')) {
      area = 'ciencias-natureza'
    } else if (discLower.includes('matemática') || discLower.includes('matematica')) {
      area = 'matematica'
    } else if (discLower.includes('linguagens') || discLower.includes('português') || discLower.includes('inglês') || discLower.includes('espanhol')) {
      area = 'linguagens'
    } else if (discLower.includes('humanas') || discLower.includes('história') || discLower.includes('geografia') || discLower.includes('filosofia') || discLower.includes('sociologia')) {
      area = 'ciencias-humanas'
    }

    // Inserir resposta
    const { error } = await supabase.from('respostas_enem').insert({
      usuario_id: sessao.userId,
      id_api_questao: questao_id,
      resposta_dada: respostaUpperCase,
      correta,
      tempo_segundos: tempoValidado,
      ano_prova,
      area,
      modo: 'livre',
    })

    if (error) {
      console.error('Erro ao registrar resposta ENEM:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao registrar resposta' },
        { status: 500 }
      )
    }

    // Buscar estatísticas atualizadas
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
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
