import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AlternativaENEM, AreaENEM, SubareaENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Submeter resposta (Suporta questões locais e da API externa)
// POST /api/enem/responder
// ═══════════════════════════════════════════════════════════════════════════

interface RequestBody {
  questao_id: string
  resposta: AlternativaENEM
  resposta_correta?: AlternativaENEM  // Enviada quando questão vem da API externa
  tempo_segundos?: number
  modo?: 'livre' | 'simulado' | 'revisao'
  sessao_id?: string
  // Dados da questão (quando vem da API externa)
  ano_prova?: number
  area?: AreaENEM
  subarea?: SubareaENEM
  id_api?: string
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
      resposta_correta: respostaCorretaEnviada,
      tempo_segundos = 0,
      modo = 'livre',
      sessao_id,
      ano_prova: anoProvaEnviado,
      area: areaEnviada,
      subarea: subareaEnviada,
      id_api: idApiEnviado,
    } = body

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

    // Verificar se usuário é da 3ª série do Ensino Médio (ou professor)
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

    const respostaUpperCase = resposta.toUpperCase() as AlternativaENEM

    // Detectar se é questão da API externa (ID começa com 'api-')
    const isQuestaoExterna = questao_id.startsWith('api-')
    const idApiQuestao = isQuestaoExterna
      ? (idApiEnviado || questao_id.replace('api-', 'enem-'))
      : null

    let respostaCorreta: AlternativaENEM
    let anoProva: number
    let area: AreaENEM
    let subarea: SubareaENEM | null = null
    let conteudoPrincipal: string | null = null

    if (isQuestaoExterna) {
      // Questão da API externa - usar dados enviados
      if (!respostaCorretaEnviada || !anoProvaEnviado || !areaEnviada) {
        return NextResponse.json(
          { sucesso: false, erro: 'Dados da questão externa incompletos' },
          { status: 400 }
        )
      }
      respostaCorreta = respostaCorretaEnviada.toUpperCase() as AlternativaENEM
      anoProva = anoProvaEnviado
      area = areaEnviada
      subarea = subareaEnviada || null
    } else {
      // Questão local - buscar do banco
      const { data: questao } = await supabase
        .from('questoes_enem')
        .select('resposta_correta, area, subarea, ano_prova, conteudo_principal, id_api')
        .eq('id', questao_id)
        .single()

      if (!questao) {
        return NextResponse.json(
          { sucesso: false, erro: 'Questão não encontrada' },
          { status: 404 }
        )
      }

      respostaCorreta = questao.resposta_correta as AlternativaENEM
      anoProva = questao.ano_prova
      area = questao.area as AreaENEM
      subarea = questao.subarea as SubareaENEM | null
      conteudoPrincipal = questao.conteudo_principal
    }

    // Verificar se já respondeu esta questão (por questao_id ou id_api)
    let respostaExistente = null

    if (isQuestaoExterna && idApiQuestao) {
      const { data } = await supabase
        .from('respostas_enem')
        .select('id')
        .eq('usuario_id', sessao.userId)
        .eq('id_api_questao', idApiQuestao)
        .single()
      respostaExistente = data
    } else {
      const { data } = await supabase
        .from('respostas_enem')
        .select('id')
        .eq('usuario_id', sessao.userId)
        .eq('questao_id', questao_id)
        .single()
      respostaExistente = data
    }

    if (respostaExistente && modo !== 'revisao') {
      return NextResponse.json(
        { sucesso: false, erro: 'Você já respondeu esta questão' },
        { status: 400 }
      )
    }

    // Verificar se acertou
    const correta = respostaUpperCase === respostaCorreta

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
      const dadosResposta: Record<string, any> = {
        usuario_id: sessao.userId,
        resposta_dada: respostaUpperCase,
        correta,
        tempo_segundos: tempoValidado,
        ano_prova: anoProva,
        area,
        subarea,
        conteudo_principal: conteudoPrincipal,
        modo,
        sessao_id,
      }

      // Adicionar referência à questão
      if (isQuestaoExterna) {
        dadosResposta.id_api_questao = idApiQuestao
        // questao_id pode ser null para questões externas
      } else {
        dadosResposta.questao_id = questao_id
      }

      const { error } = await supabase.from('respostas_enem').insert(dadosResposta)

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
      .eq('area', area)

    const totalArea = estatisticasArea?.length || 0
    const corretasArea = estatisticasArea?.filter(r => r.correta).length || 0
    const taxaArea = totalArea > 0
      ? Math.round((corretasArea / totalArea) * 100)
      : 0

    return NextResponse.json({
      sucesso: true,
      correta,
      resposta_correta: respostaCorreta,
      estatisticas_atualizadas: {
        total_questoes: totalQuestoes,
        total_corretas: totalCorretas,
        taxa_acerto: taxaAcerto,
        area: {
          nome: area,
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
