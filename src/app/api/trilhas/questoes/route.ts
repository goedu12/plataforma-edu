/**
 * API de Questões da Trilha
 *
 * GET /api/trilhas/questoes?serie=1EM&semana=5
 *
 * Retorna as questões da semana atual da trilha do usuário
 * Sistema de geração sob demanda: gera automaticamente se não houver questões em cache
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'
import {
  gerarQuestoesComGemini,
  verificarCacheQuestoes,
  salvarQuestoesNoCache
} from '@/lib/gemini'

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

    if (!serie || !['1EM', '2EM', '3EM'].includes(serie)) {
      return NextResponse.json(
        { erro: 'serie deve ser 1EM, 2EM ou 3EM' },
        { status: 400 }
      )
    }

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
          console.log(`[Questões] Gerando questões sob demanda para ${serie} semana ${semanaAtual}...`)

          const questoesGeradas = await gerarQuestoesComGemini(serie, semanaAtual, 5)

          if (questoesGeradas.length > 0) {
            const salvas = await salvarQuestoesNoCache(
              supabase,
              questoesGeradas,
              serie,
              semanaAtual,
              trilhaId
            )
            console.log(`[Questões] ${salvas} questões salvas no cache`)
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
