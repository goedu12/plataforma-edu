/**
 * CRON JOB: Pré-geração de Questões
 *
 * Endpoint: POST /api/cron/pre-gerar-questoes
 *
 * Este job roda periodicamente para pré-popular o pool de questões,
 * garantindo entrega instantânea para os estudantes.
 *
 * Configurar no Vercel:
 * vercel.json: { "crons": [{ "path": "/api/cron/pre-gerar-questoes", "schedule": "0 3 * * *" }] }
 *
 * Ou chamar manualmente via API (requer CRON_SECRET)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { gerarQuestoesParaUsuario } from '@/lib/gemini'

// Séries para pré-gerar
const SERIES = ['1EM', '2EM', '3EM', '6EF', '7EF', '8EF', '9EF']

// Quantas questões pré-gerar por série/semana
const QUESTOES_POR_POOL = 15

// Semanas para pré-gerar (atuais + próximas)
const SEMANAS_PARA_GERAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// Máximo de combinações por invocação para caber no timeout de 60s do Vercel
const MAX_POR_BATCH = 5

export async function POST(request: NextRequest) {
  try {
    // Verificar autorização (via header ou query param)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Se CRON_SECRET está configurado, verificar
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Permitir chamadas do Vercel Cron (não tem auth header)
      const isVercelCron = request.headers.get('x-vercel-cron') === '1'
      if (!isVercelCron) {
        return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 })
      }
    }

    const supabase = getSupabaseAdmin()
    const resultados: Array<{
      serie: string
      semana: number
      status: string
      questoes?: number
      erro?: string
    }> = []

    // Batch index via query param (0-based). Each batch processes MAX_POR_BATCH combos.
    const url = new URL(request.url)
    const batchIndex = parseInt(url.searchParams.get('batch') || '0', 10)

    // Build flat list of (serie, semana) combos and slice for this batch
    const todasCombinacoes = SERIES.flatMap(serie =>
      SEMANAS_PARA_GERAR.map(semana => ({ serie, semana }))
    )
    const inicio = batchIndex * MAX_POR_BATCH
    const combinacoesBatch = todasCombinacoes.slice(inicio, inicio + MAX_POR_BATCH)
    const totalBatches = Math.ceil(todasCombinacoes.length / MAX_POR_BATCH)

    console.log(`[Cron] Batch ${batchIndex + 1}/${totalBatches} (${combinacoesBatch.length} combinações)`)

    for (const { serie, semana } of combinacoesBatch) {
        try {
          // Verificar se já tem pool suficiente
          const { data: poolExistente } = await supabase
            .from('questoes_pool')
            .select('total_questoes')
            .eq('serie', serie)
            .eq('semana', semana)
            .single()

          const questoesAtuais = poolExistente?.total_questoes || 0

          // Se já tem questões suficientes, pular
          if (questoesAtuais >= QUESTOES_POR_POOL) {
            resultados.push({
              serie,
              semana,
              status: 'skip',
              questoes: questoesAtuais
            })
            continue
          }

          // Calcular quantas faltam
          const faltam = QUESTOES_POR_POOL - questoesAtuais

          console.log(`[Cron] Gerando ${faltam} questões para ${serie} semana ${semana}...`)

          // Gerar questões (usando um userId fictício para o seed)
          const seedUserId = `cron-${Date.now()}`
          const questoesGeradas = await gerarQuestoesParaUsuario(
            serie,
            semana,
            Math.min(faltam, 10), // Máximo 10 por vez para não sobrecarregar
            seedUserId,
            'cron-job'
          )

          if (questoesGeradas && questoesGeradas.length > 0) {
            // Buscar questões existentes do pool
            const { data: poolAtual } = await supabase
              .from('questoes_pool')
              .select('questoes')
              .eq('serie', serie)
              .eq('semana', semana)
              .single()

            const questoesAnteriores = (poolAtual?.questoes as unknown[]) || []
            const todasQuestoes = [...questoesAnteriores, ...questoesGeradas]

            // Atualizar pool
            const { error: upsertError } = await supabase
              .from('questoes_pool')
              .upsert({
                serie,
                semana,
                questoes: todasQuestoes,
                total_questoes: todasQuestoes.length,
                atualizado_em: new Date().toISOString()
              }, {
                onConflict: 'serie,semana'
              })

            if (upsertError) {
              throw upsertError
            }

            resultados.push({
              serie,
              semana,
              status: 'ok',
              questoes: todasQuestoes.length
            })

            console.log(`[Cron] Pool ${serie} semana ${semana}: ${todasQuestoes.length} questões`)
          } else {
            resultados.push({
              serie,
              semana,
              status: 'erro',
              erro: 'Nenhuma questão gerada'
            })
          }

          // Pequena pausa entre gerações para não sobrecarregar a API
          await new Promise(r => setTimeout(r, 1000))

        } catch (error) {
          console.error(`[Cron] Erro em ${serie} semana ${semana}:`, error)
          resultados.push({
            serie,
            semana,
            status: 'erro',
            erro: error instanceof Error ? error.message : 'Erro desconhecido'
          })
        }
      }


    // Resumo
    const ok = resultados.filter(r => r.status === 'ok').length
    const skip = resultados.filter(r => r.status === 'skip').length
    const erro = resultados.filter(r => r.status === 'erro').length

    console.log(`[Cron] Batch ${batchIndex + 1}/${totalBatches} finalizado: ${ok} gerados, ${skip} pulados, ${erro} erros`)

    return NextResponse.json({
      sucesso: true,
      batch: batchIndex,
      totalBatches,
      resumo: { gerados: ok, pulados: skip, erros: erro },
      detalhes: resultados
    })

  } catch (error) {
    console.error('[Cron] Erro geral:', error)
    return NextResponse.json(
      { erro: 'Erro interno', detalhes: error instanceof Error ? error.message : 'Desconhecido' },
      { status: 500 }
    )
  }
}

// GET para verificar status do pool
export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    const { data: pools, error } = await supabase
      .from('questoes_pool')
      .select('serie, semana, total_questoes, atualizado_em')
      .order('serie')
      .order('semana')

    if (error) {
      return NextResponse.json({ erro: error.message }, { status: 500 })
    }

    // Calcular estatísticas
    const totalQuestoes = pools?.reduce((acc, p) => acc + (p.total_questoes || 0), 0) || 0
    const totalPools = pools?.length || 0

    return NextResponse.json({
      sucesso: true,
      estatisticas: {
        total_pools: totalPools,
        total_questoes: totalQuestoes,
        media_por_pool: totalPools > 0 ? Math.round(totalQuestoes / totalPools) : 0
      },
      pools: pools || []
    })

  } catch (error) {
    return NextResponse.json({ erro: 'Erro interno' }, { status: 500 })
  }
}
