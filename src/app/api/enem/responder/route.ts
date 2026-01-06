import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AlternativaENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Submeter resposta
// POST /api/enem/responder
// Não afeta pontos/níveis/conquistas do sistema principal
// ═══════════════════════════════════════════════════════════════════════════

interface RequestBody {
  questao_id: string
  resposta: AlternativaENEM
  tempo_segundos?: number
  modo?: 'livre' | 'simulado' | 'revisao'
  sessao_id?: string
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
    const { questao_id, resposta, tempo_segundos = 0, modo = 'livre', sessao_id } = body

    // Validação básica
    if (!questao_id || !resposta) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados incompletos' },
        { status: 400 }
      )
    }

    if (!['A', 'B', 'C', 'D', 'E'].includes(resposta.toUpperCase())) {
      return NextResponse.json(
        { sucesso: false, erro: 'Resposta inválida. Use A, B, C, D ou E.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verificar se usuário é do Ensino Médio
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('nivel')
      .eq('id', sessao.userId)
      .single()

    if (!usuario || usuario.nivel !== 'EM') {
      return NextResponse.json({
        sucesso: false,
        erro: 'O Simulado ENEM está disponível apenas para alunos do Ensino Médio.',
      }, { status: 403 })
    }

    // Buscar questão para verificar resposta
    const { data: questao } = await supabase
      .from('questoes_enem')
      .select('resposta_correta, area, subarea, ano_prova, conteudo_principal')
      .eq('id', questao_id)
      .single()

    if (!questao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Questão não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já respondeu esta questão
    const { data: respostaExistente } = await supabase
      .from('respostas_enem')
      .select('id')
      .eq('usuario_id', sessao.userId)
      .eq('questao_id', questao_id)
      .single()

    if (respostaExistente && modo !== 'revisao') {
      return NextResponse.json(
        { sucesso: false, erro: 'Você já respondeu esta questão' },
        { status: 400 }
      )
    }

    // Verificar se acertou
    const respostaUpperCase = resposta.toUpperCase() as AlternativaENEM
    const correta = respostaUpperCase === questao.resposta_correta

    // Validar tempo
    const tempoValidado = typeof tempo_segundos === 'number' && tempo_segundos >= 0 && tempo_segundos <= 7200
      ? Math.floor(tempo_segundos)
      : 0

    // Registrar ou atualizar resposta
    if (respostaExistente && modo === 'revisao') {
      // Atualizar resposta existente no modo revisão
      const { error } = await supabase
        .from('respostas_enem')
        .update({
          resposta_dada: respostaUpperCase,
          correta,
          tempo_segundos: tempoValidado,
          modo,
        })
        .eq('id', respostaExistente.id)

      if (error) {
        console.error('Erro ao atualizar resposta ENEM:', error)
        return NextResponse.json(
          { sucesso: false, erro: 'Erro ao atualizar resposta' },
          { status: 500 }
        )
      }
    } else {
      // Inserir nova resposta
      const { error } = await supabase.from('respostas_enem').insert({
        usuario_id: sessao.userId,
        questao_id,
        resposta_dada: respostaUpperCase,
        correta,
        tempo_segundos: tempoValidado,
        ano_prova: questao.ano_prova,
        area: questao.area,
        subarea: questao.subarea,
        conteudo_principal: questao.conteudo_principal,
        modo,
        sessao_id,
      })

      if (error) {
        console.error('Erro ao registrar resposta ENEM:', error)
        return NextResponse.json(
          { sucesso: false, erro: 'Erro ao registrar resposta' },
          { status: 500 }
        )
      }
    }

    // Buscar estatísticas atualizadas do usuário
    const { data: estatisticas } = await supabase
      .from('respostas_enem')
      .select('correta')
      .eq('usuario_id', sessao.userId)

    const totalQuestoes = estatisticas?.length || 0
    const totalCorretas = estatisticas?.filter(r => r.correta).length || 0
    const taxaAcerto = totalQuestoes > 0
      ? Math.round((totalCorretas / totalQuestoes) * 100)
      : 0

    // Estatísticas por área
    const { data: estatisticasArea } = await supabase
      .from('respostas_enem')
      .select('correta')
      .eq('usuario_id', sessao.userId)
      .eq('area', questao.area)

    const totalArea = estatisticasArea?.length || 0
    const corretasArea = estatisticasArea?.filter(r => r.correta).length || 0
    const taxaArea = totalArea > 0
      ? Math.round((corretasArea / totalArea) * 100)
      : 0

    return NextResponse.json({
      sucesso: true,
      correta,
      resposta_correta: questao.resposta_correta,
      estatisticas_atualizadas: {
        total_questoes: totalQuestoes,
        total_corretas: totalCorretas,
        taxa_acerto: taxaAcerto,
        area: {
          nome: questao.area,
          total: totalArea,
          corretas: corretasArea,
          taxa: taxaArea,
        },
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
