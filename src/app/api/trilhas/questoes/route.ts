/**
 * API de Questões da Trilha - OTIMIZADA COM POOL
 *
 * GET /api/trilhas/questoes?serie=1EM&semana=5
 * GET /api/trilhas/questoes?serie=6EF&semana=5
 *
 * FLUXO OTIMIZADO:
 * 1. Buscar questões do POOL (instantâneo ~50ms)
 * 2. Se pool vazio/insuficiente → gerar on-the-fly
 * 3. Registrar questões usadas para evitar repetição
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { obterSessao } from '@/lib/auth'
import {
  gerarQuestoesParaUsuario,
  isSerieEF,
  getNumAlternativasPorSerie
} from '@/lib/gemini'
import crypto from 'crypto'

// Séries válidas
const SERIES_VALIDAS = ['6EF', '7EF', '8EF', '9EF', '1EM', '2EM', '3EM']

// Controle para evitar gerações simultâneas
const geracaoEmAndamento: Set<string> = new Set()

// Interface para questão
interface QuestaoPool {
  tipo_questao: string
  enunciado: string
  alternativas: Record<string, string>
  dica: string
  resposta_correta: string
  feedback: string
  tema?: string
  subtema?: string
  contexto?: string
}

// Gera hash MD5 do enunciado para identificação única
function hashEnunciado(enunciado: string): string {
  return crypto.createHash('md5').update(enunciado).digest('hex')
}

export async function GET(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
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

    const ehEF = isSerieEF(serie)
    const numAlternativas = getNumAlternativasPorSerie(serie)
    const supabase = getSupabaseAdmin()

    // Verificar trilha ativa - incluindo o campo componente
    const { data: trilhaAtiva } = await supabase
      .from('usuario_trilha')
      .select('trilha_id, semana_atual, componente')
      .eq('usuario_id', sessao.userId)
      .eq('serie', serie)
      .eq('ativa', true)
      .single()

    if (!trilhaAtiva) {
      return NextResponse.json({
        sucesso: true,
        questoes: [],
        mensagem: 'Você não tem uma trilha ativa para esta série.'
      })
    }

    const semanaAtual = semana ? parseInt(semana) : trilhaAtiva.semana_atual
    const trilhaId = trilhaAtiva.trilha_id
    // Usar o componente da trilha do usuário (se definido) ou inferir da série
    const componenteTrilha: 'matematica' | 'fisica' = (trilhaAtiva.componente as 'matematica' | 'fisica') || (ehEF ? 'matematica' : 'fisica')

    // Buscar progresso semanal
    const { data: progressoSemanal } = await supabase
      .from('progresso_semanal')
      .select('*')
      .eq('usuario_id', sessao.userId)
      .eq('trilha_id', trilhaId)
      .eq('serie', serie)
      .eq('semana', semanaAtual)
      .single()

    // Já completou a semana?
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
          semana_completa: true
        },
        serie_info: { serie, nivel_ensino: ehEF ? 'EF' : 'EM', componente: componenteTrilha, num_alternativas: numAlternativas }
      })
    }

    const questoesRespondidas_count = progressoSemanal?.questoes_respondidas || 0
    const questoesFaltando = 5 - questoesRespondidas_count

    if (questoesFaltando <= 0) {
      return NextResponse.json({
        sucesso: true,
        questoes: [],
        progresso: { respondidas: 5, corretas: progressoSemanal?.questoes_corretas || 0, total: 5, questoes_semana: 5, questoes_respondidas: 5, percentual: Math.round(((progressoSemanal?.questoes_corretas || 0) / 5) * 100), semana_completa: true },
        serie_info: { serie, nivel_ensino: ehEF ? 'EF' : 'EM', componente: componenteTrilha, num_alternativas: numAlternativas }
      })
    }

    // ========================================
    // PASSO 1: Tentar buscar do POOL (rápido)
    // ========================================
    let questoesParaUsar: QuestaoPool[] = []

    try {
      // Buscar pool existente
      const { data: pool } = await supabase
        .from('questoes_pool')
        .select('questoes, total_questoes')
        .eq('serie', serie)
        .eq('semana', semanaAtual)
        .single()

      if (pool && pool.questoes && Array.isArray(pool.questoes) && pool.questoes.length > 0) {
        // Buscar questões já usadas pelo usuário
        const { data: usadas } = await supabase
          .from('questoes_usadas')
          .select('questao_hash')
          .eq('usuario_id', sessao.userId)
          .eq('serie', serie)
          .eq('semana', semanaAtual)

        const hashesUsados = new Set(usadas?.map(u => u.questao_hash) || [])

        // Filtrar questões não usadas
        const questoesDisponiveis = (pool.questoes as QuestaoPool[]).filter(
          q => !hashesUsados.has(hashEnunciado(q.enunciado))
        )

        if (questoesDisponiveis.length >= questoesFaltando) {
          // Embaralhar e selecionar
          const embaralhadas = questoesDisponiveis.sort(() => Math.random() - 0.5)
          questoesParaUsar = embaralhadas.slice(0, questoesFaltando)
          console.log(`[Pool] ${questoesParaUsar.length} questões do pool para ${serie} semana ${semanaAtual}`)
        }
      }
    } catch (poolError) {
      // Pool não existe ou erro - continua para geração
      console.log(`[Pool] Pool não disponível para ${serie} semana ${semanaAtual}, gerando...`)
    }

    // ========================================
    // PASSO 2: Se pool insuficiente, gerar
    // ========================================
    if (questoesParaUsar.length < questoesFaltando) {
      const chaveGeracao = `${sessao.userId}-${trilhaId}-${serie}-${semanaAtual}`

      if (geracaoEmAndamento.has(chaveGeracao)) {
        return NextResponse.json({
          sucesso: true,
          questoes: [],
          mensagem: 'Questões sendo geradas, aguarde...',
          gerando: true
        })
      }

      geracaoEmAndamento.add(chaveGeracao)

      try {
        console.log(`[Gemini] Gerando ${questoesFaltando} questões de ${componenteTrilha} para ${serie} semana ${semanaAtual}...`)

        const questoesGeradas = await gerarQuestoesParaUsuario(
          serie,
          semanaAtual,
          questoesFaltando,
          sessao.userId,
          trilhaId,
          componenteTrilha
        )

        if (questoesGeradas && questoesGeradas.length > 0) {
          questoesParaUsar = questoesGeradas as QuestaoPool[]

          // Adicionar ao pool para uso futuro (em background)
          adicionarAoPoolBackground(supabase, serie, semanaAtual, questoesGeradas)
        }
      } finally {
        geracaoEmAndamento.delete(chaveGeracao)
      }
    }

    if (questoesParaUsar.length === 0) {
      return NextResponse.json({
        sucesso: false,
        questoes: [],
        erro: 'Não foi possível obter questões. Tente novamente.'
      })
    }

    // ========================================
    // PASSO 3: Registrar uso e retornar
    // ========================================
    // Registrar questões usadas (em background)
    registrarUsoBackground(supabase, sessao.userId, serie, semanaAtual, questoesParaUsar)

    // Formatar resposta
    const questoesFormatadas = questoesParaUsar.map((q, index) => ({
      id: `${sessao.userId}-${trilhaId}-${semanaAtual}-${Date.now()}-${index}`,
      ordem: questoesRespondidas_count + index + 1,
      tipo_questao: q.tipo_questao || 'calculo_direto',
      enunciado: q.enunciado,
      alternativas: q.alternativas,
      dica: q.dica || '',
      resposta_correta: q.resposta_correta,
      feedback: q.feedback || '',
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
        componente: componenteTrilha,
        num_alternativas: numAlternativas
      },
      fonte: questoesParaUsar.length === questoesFaltando ? 'pool' : 'gerado'
    })

  } catch (error) {
    console.error('Erro na API de questões:', error)
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 })
  }
}

// Adiciona questões ao pool em background (não bloqueia resposta)
function adicionarAoPoolBackground(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  serie: string,
  semana: number,
  questoes: QuestaoPool[]
) {
  // Executa sem await para não bloquear
  supabase
    .from('questoes_pool')
    .upsert({
      serie,
      semana,
      questoes: questoes,
      total_questoes: questoes.length,
      atualizado_em: new Date().toISOString()
    }, {
      onConflict: 'serie,semana'
    })
    .then(({ error }) => {
      if (error) console.error('[Pool] Erro ao adicionar ao pool:', error)
      else console.log(`[Pool] ${questoes.length} questões adicionadas ao pool ${serie} semana ${semana}`)
    })
}

// Registra questões usadas em background
function registrarUsoBackground(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  serie: string,
  semana: number,
  questoes: QuestaoPool[]
) {
  const registros = questoes.map(q => ({
    usuario_id: userId,
    questao_hash: hashEnunciado(q.enunciado),
    serie,
    semana,
    usada_em: new Date().toISOString()
  }))

  supabase
    .from('questoes_usadas')
    .upsert(registros, { onConflict: 'usuario_id,questao_hash', ignoreDuplicates: true })
    .then(({ error }) => {
      if (error && !error.message.includes('duplicate')) {
        console.error('[Uso] Erro ao registrar uso:', error)
      }
    })
}
