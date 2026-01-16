/**
 * API de Questões da Trilha
 *
 * GET /api/trilhas/questoes?serie=1EM&semana=5
 * GET /api/trilhas/questoes?serie=6EF&semana=5  (Matemática EF com 4 alternativas)
 *
 * Gera questões únicas para cada usuário/trilha/semana
 * SEM CACHE - cada usuário recebe questões diferentes
 *
 * Suporta:
 * - Ensino Médio (1EM, 2EM, 3EM): Física com 5 alternativas
 * - Ensino Fundamental (6EF, 7EF, 8EF, 9EF): Matemática com 4 alternativas
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'
import {
  gerarQuestoesParaUsuario,
  isSerieEF,
  getNumAlternativasPorSerie
} from '@/lib/gemini'

// Séries válidas (EF + EM)
const SERIES_VALIDAS = ['6EF', '7EF', '8EF', '9EF', '1EM', '2EM', '3EM']

// Controle para evitar múltiplas gerações simultâneas por usuário
const geracaoEmAndamento: Set<string> = new Set()

// Interface para questão gerada
interface QuestaoGerada {
  id: string
  ordem: number
  tipo_questao: string
  enunciado: string
  alternativas: Record<string, string>
  dica: string
  resposta_correta: string
  feedback: string
  tema: string
  subtema: string
  contexto: string
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { erro: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const serie = searchParams.get('serie')
    const semana = searchParams.get('semana')

    if (!serie || !SERIES_VALIDAS.includes(serie)) {
      return NextResponse.json(
        { erro: 'serie deve ser 6EF, 7EF, 8EF, 9EF, 1EM, 2EM ou 3EM' },
        { status: 400 }
      )
    }

    // Detectar se é Ensino Fundamental
    const ehEF = isSerieEF(serie)
    const numAlternativas = getNumAlternativasPorSerie(serie)

    const supabase = getSupabaseAdmin()

    // Verificar se tem trilha ativa
    const { data: trilhaAtiva } = await supabase
      .from('usuario_trilha')
      .select('trilha_id, semana_atual')
      .eq('usuario_id', sessao.userId)
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

    const semanaAtual = semana ? parseInt(semana) : trilhaAtiva.semana_atual
    const trilhaId = trilhaAtiva.trilha_id

    // Buscar questões já respondidas pelo usuário nesta trilha/série/semana
    const { data: respostasExistentes } = await supabase
      .from('respostas_trilha')
      .select('questao_id')
      .eq('usuario_id', sessao.userId)
      .eq('trilha_id', trilhaId)

    const questoesRespondidas = respostasExistentes?.map(r => r.questao_id) || []

    // Buscar progresso semanal
    const { data: progressoSemanal } = await supabase
      .from('progresso_semanal')
      .select('*')
      .eq('usuario_id', sessao.userId)
      .eq('trilha_id', trilhaId)
      .eq('serie', serie)
      .eq('semana', semanaAtual)
      .single()

    // Se já completou todas as questões da semana
    if (progressoSemanal && progressoSemanal.questoes_respondidas >= 5) {
      return NextResponse.json({
        sucesso: true,
        questoes: [],
        progresso: {
          respondidas: progressoSemanal.questoes_respondidas,
          corretas: progressoSemanal.questoes_corretas,
          total: 5,
          questoes_semana: 5,
          questoes_respondidas: progressoSemanal.questoes_respondidas,
          percentual: Math.round((progressoSemanal.questoes_corretas / 5) * 100),
          pode_fazer_desafio: progressoSemanal.questoes_corretas >= 4,
          semana_completa: true
        },
        serie_info: {
          serie,
          nivel_ensino: ehEF ? 'EF' : 'EM',
          componente: ehEF ? 'matematica' : 'fisica',
          num_alternativas: numAlternativas
        }
      })
    }

    // Chave única para evitar gerações simultâneas
    const chaveGeracao = `${sessao.userId}-${trilhaId}-${serie}-${semanaAtual}`

    // Se já está gerando para este usuário, aguardar
    if (geracaoEmAndamento.has(chaveGeracao)) {
      return NextResponse.json({
        sucesso: true,
        questoes: [],
        mensagem: 'Questões sendo geradas, aguarde...',
        gerando: true
      })
    }

    // Gerar questões únicas para este usuário
    geracaoEmAndamento.add(chaveGeracao)

    try {
      const tipoQuestao = ehEF ? 'Matemática EF' : 'Física EM'
      console.log(`[Questões] Gerando ${tipoQuestao} para usuário ${sessao.userId}, trilha ${trilhaId}, semana ${semanaAtual}...`)

      // Calcular quantas questões ainda faltam
      const questoesRespondidas_count = progressoSemanal?.questoes_respondidas || 0
      const questoesFaltando = 5 - questoesRespondidas_count

      if (questoesFaltando <= 0) {
        return NextResponse.json({
          sucesso: true,
          questoes: [],
          progresso: {
            respondidas: 5,
            corretas: progressoSemanal?.questoes_corretas || 0,
            total: 5,
            questoes_semana: 5,
            questoes_respondidas: 5,
            percentual: Math.round(((progressoSemanal?.questoes_corretas || 0) / 5) * 100),
            semana_completa: true
          },
          serie_info: {
            serie,
            nivel_ensino: ehEF ? 'EF' : 'EM',
            componente: ehEF ? 'matematica' : 'fisica',
            num_alternativas: numAlternativas
          }
        })
      }

      // Gerar questões únicas para o usuário
      const questoesGeradas = await gerarQuestoesParaUsuario(
        serie,
        semanaAtual,
        questoesFaltando,
        sessao.userId,
        trilhaId
      )

      if (!questoesGeradas || questoesGeradas.length === 0) {
        return NextResponse.json({
          sucesso: false,
          questoes: [],
          erro: 'Não foi possível gerar questões. Tente novamente.'
        })
      }

      // Formatar questões para resposta
      const questoesFormatadas = questoesGeradas.map((q, index) => ({
        id: `${sessao.userId}-${trilhaId}-${semanaAtual}-${Date.now()}-${index}`,
        ordem: questoesRespondidas_count + index + 1,
        tipo_questao: q.tipo_questao,
        enunciado: q.enunciado,
        alternativas: q.alternativas,
        dica: q.dica,
        resposta_correta: q.resposta_correta,
        feedback: q.feedback,
        tema: q.tema || '',
        subtema: q.subtema || '',
        contexto: q.contexto || ''
      }))

      return NextResponse.json({
        sucesso: true,
        questoes: questoesFormatadas,
        progresso: {
          respondidas: questoesRespondidas_count,
          corretas: progressoSemanal?.questoes_corretas || 0,
          total: 5,
          questoes_semana: 5,
          questoes_respondidas: questoesRespondidas_count,
          percentual: Math.round(((progressoSemanal?.questoes_corretas || 0) / 5) * 100)
        },
        serie_info: {
          serie,
          nivel_ensino: ehEF ? 'EF' : 'EM',
          componente: ehEF ? 'matematica' : 'fisica',
          num_alternativas: numAlternativas
        }
      })

    } catch (error) {
      console.error('[Questões] Erro ao gerar questões:', error)
      return NextResponse.json({
        sucesso: false,
        questoes: [],
        erro: 'Erro ao gerar questões. Tente novamente.'
      })
    } finally {
      geracaoEmAndamento.delete(chaveGeracao)
    }

  } catch (error) {
    console.error('Erro na API de questões:', error)
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
