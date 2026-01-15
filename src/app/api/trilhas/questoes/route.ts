/**
 * API de Questões da Trilha
 *
 * GET /api/trilhas/questoes?serie=1EM&semana=5
 * GET /api/trilhas/questoes?serie=6EF&semana=5  (Matemática EF com 4 alternativas)
 *
 * Retorna as questões da semana atual da trilha do usuário
 * Sistema de geração sob demanda: gera automaticamente se não houver questões em cache
 *
 * Suporta:
 * - Ensino Médio (1EM, 2EM, 3EM): Física com 5 alternativas
 * - Ensino Fundamental (6EF, 7EF, 8EF, 9EF): Matemática com 4 alternativas
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'
import {
  gerarQuestoes,
  verificarCacheQuestoes,
  salvarQuestoes,
  isSerieEF,
  getNumAlternativasPorSerie
} from '@/lib/gemini'

// Séries válidas (EF + EM)
const SERIES_VALIDAS = ['6EF', '7EF', '8EF', '9EF', '1EM', '2EM', '3EM']

// Controle para evitar múltiplas gerações simultâneas
// NOTA: Em ambiente serverless, este Set é por instância.
// Para produção em escala, considerar usar Redis ou database lock.
const geracaoEmAndamento: Set<string> = new Set()

// Interface para questões retornadas pelo SQL
interface QuestaoSQL {
  questao_id: number
  ordem: number
  tipo_questao: string
  enunciado: string
  alternativas: Record<string, string>
  dica: string | null
  dificuldade: string
  tema: string
  subtema: string
  contexto: string
  is_desafio: boolean
  ja_respondida: boolean
  resposta_usuario: string | null
  acertou: boolean | null
  tempo_resposta: number | null
  usou_dica: boolean
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

    // Primeiro, verificar se tem trilha ativa para pegar a semana
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

    // Verificar cache de questões
    const questoesEmCache = await verificarCacheQuestoes(supabase, serie, semanaAtual, trilhaId)
    console.log(`[Questões] Cache para ${serie} semana ${semanaAtual}: ${questoesEmCache} questões`)

    // Se não tem questões suficientes em cache, gerar sob demanda
    if (questoesEmCache < 5) {
      const chaveGeracao = `${serie}-${semanaAtual}`

      // Evitar gerações simultâneas para mesma série/semana
      if (!geracaoEmAndamento.has(chaveGeracao)) {
        geracaoEmAndamento.add(chaveGeracao)

        try {
          const tipoQuestao = ehEF ? 'Matemática EF (4 alternativas)' : 'Física EM (5 alternativas)'
          console.log(`[Questões] Gerando questões de ${tipoQuestao} sob demanda para ${serie} semana ${semanaAtual}...`)

          // Usa função unificada que detecta EF vs EM automaticamente
          const questoesGeradas = await gerarQuestoes(serie, semanaAtual, 5)

          if (questoesGeradas.length > 0) {
            // Usa função unificada para salvar
            const salvas = await salvarQuestoes(
              supabase,
              questoesGeradas,
              serie,
              semanaAtual
            )
            console.log(`[Questões] ${salvas} questões de ${tipoQuestao} salvas no cache`)
          }
        } catch (error) {
          console.error('[Questões] Erro ao gerar questões:', error)
          // Não falha a requisição, apenas loga o erro
        } finally {
          geracaoEmAndamento.delete(chaveGeracao)
        }
      } else {
        console.log(`[Questões] Geração já em andamento para ${chaveGeracao}, aguardando...`)
      }
    }

    // Buscar questões usando função SQL
    const { data, error } = await supabase.rpc('buscar_questoes_semana_trilha', {
      p_usuario_id: sessao.userId,
      p_serie: serie,
      p_semana: semanaAtual
    })

    if (error) {
      console.error('Erro ao buscar questões:', error)
      return NextResponse.json(
        { erro: 'Erro ao buscar questões' },
        { status: 500 }
      )
    }

    // Se ainda não tem questões após tentativa de geração
    if (!data || data.length === 0) {
      return NextResponse.json({
        sucesso: true,
        questoes: [],
        semana: semanaAtual,
        mensagem: 'As questões estão sendo preparadas. Tente novamente em alguns instantes.',
        gerando: geracaoEmAndamento.has(`${serie}-${semanaAtual}`)
      })
    }

    // Separar questões normais e desafio
    const questoes = data as QuestaoSQL[]
    const questoesNormais = questoes.filter((q) => !q.is_desafio)
    const desafio = questoes.find((q) => q.is_desafio)

    // Calcular progresso
    const respondidas = questoesNormais.filter((q) => q.ja_respondida).length
    const corretas = questoesNormais.filter((q) => q.acertou === true).length
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
      },
      // Informações sobre o tipo de série
      serie_info: {
        serie,
        nivel_ensino: ehEF ? 'EF' : 'EM',
        componente: ehEF ? 'matematica' : 'fisica',
        num_alternativas: numAlternativas
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
