export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AreaENEM, SubareaENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Importar questões da API enem.dev
// POST /api/enem/importar - Importa questões de um ano específico
// GET /api/enem/importar - Retorna estatísticas da importação
//
// LIMITAÇÕES DA API enem.dev:
// - Rate Limit: 1 requisição por segundo
// - Paginação: limit (default 10, max ~100) + offset
// - Total: ~2700 questões (180 por ano, 2009-2023)
// - Resposta inclui metadata.hasMore para paginação
// ═══════════════════════════════════════════════════════════════════════════

const API_ENEM_BASE = 'https://api.enem.dev/v1'

// Anos disponíveis na API (2009-2023)
const ANOS_DISPONIVEIS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]

// Configurações de paginação e rate limit
const CONFIG = {
  LIMIT_POR_PAGINA: 50,      // Questões por requisição
  DELAY_MS: 1100,            // 1.1 segundo entre requisições (respeita rate limit)
  MAX_TENTATIVAS: 3,         // Tentativas em caso de erro 429
  DELAY_RETRY_MS: 2000,      // Delay extra após erro 429
}

// Mapeamento de disciplinas da API para nossa estrutura
const DISCIPLINA_MAP: Record<string, { area: AreaENEM; subarea: SubareaENEM }> = {
  // Ciências da Natureza
  'fisica': { area: 'ciencias-natureza', subarea: 'fisica' },
  'física': { area: 'ciencias-natureza', subarea: 'fisica' },
  'quimica': { area: 'ciencias-natureza', subarea: 'quimica' },
  'química': { area: 'ciencias-natureza', subarea: 'quimica' },
  'biologia': { area: 'ciencias-natureza', subarea: 'biologia' },
  'ciencias-natureza': { area: 'ciencias-natureza', subarea: 'fisica' },
  'ciências da natureza': { area: 'ciencias-natureza', subarea: 'fisica' },

  // Matemática
  'matematica': { area: 'matematica', subarea: 'matematica' },
  'matemática': { area: 'matematica', subarea: 'matematica' },

  // Linguagens
  'linguagens': { area: 'linguagens', subarea: 'portugues' },
  'portugues': { area: 'linguagens', subarea: 'portugues' },
  'português': { area: 'linguagens', subarea: 'portugues' },
  'literatura': { area: 'linguagens', subarea: 'literatura' },
  'ingles': { area: 'linguagens', subarea: 'ingles' },
  'inglês': { area: 'linguagens', subarea: 'ingles' },
  'espanhol': { area: 'linguagens', subarea: 'espanhol' },
  'artes': { area: 'linguagens', subarea: 'artes' },

  // Ciências Humanas
  'ciencias-humanas': { area: 'ciencias-humanas', subarea: 'historia' },
  'ciências humanas': { area: 'ciencias-humanas', subarea: 'historia' },
  'historia': { area: 'ciencias-humanas', subarea: 'historia' },
  'história': { area: 'ciencias-humanas', subarea: 'historia' },
  'geografia': { area: 'ciencias-humanas', subarea: 'geografia' },
  'filosofia': { area: 'ciencias-humanas', subarea: 'filosofia' },
  'sociologia': { area: 'ciencias-humanas', subarea: 'sociologia' },
}

// Interface da questão retornada pela API enem.dev
interface QuestaoAPI {
  title: string
  index: number
  discipline: string
  language: string | null
  year: number
  context: string
  files: string[]
  correctAlternative: string
  alternativesIntroduction: string | null
  alternatives: {
    letter: string
    text: string
    file: string | null
    isCorrect: boolean
  }[]
}

// Resposta da API com metadata de paginação
interface RespostaAPI {
  metadata: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
  questions: QuestaoAPI[]
}

interface RequestBody {
  ano?: number
  anos?: number[]
  areas?: string[]
  limite?: number
}

// Função para aguardar (respeitar rate limit)
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Normaliza texto para comparação
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/-/g, ' ')
    .trim()
}

// Mapeia a disciplina da API para nossos tipos
function mapearDisciplina(discipline: string, language: string | null): { area: AreaENEM; subarea: SubareaENEM } | null {
  const disciplinaNormalizada = normalizar(discipline)

  for (const [chave, valor] of Object.entries(DISCIPLINA_MAP)) {
    if (disciplinaNormalizada.includes(normalizar(chave))) {
      // Se for linguagens e tiver idioma específico, ajusta a subárea
      if (valor.area === 'linguagens' && language) {
        const idioma = normalizar(language)
        if (idioma.includes('ingles') || idioma.includes('english')) {
          return { area: 'linguagens', subarea: 'ingles' }
        }
        if (idioma.includes('espanhol') || idioma.includes('spanish')) {
          return { area: 'linguagens', subarea: 'espanhol' }
        }
      }
      return valor
    }
  }

  return null
}

// Busca questões com retry em caso de rate limit
async function buscarQuestoesComRetry(
  ano: number,
  offset: number,
  limit: number
): Promise<RespostaAPI | null> {
  for (let tentativa = 1; tentativa <= CONFIG.MAX_TENTATIVAS; tentativa++) {
    try {
      const response = await fetch(
        `${API_ENEM_BASE}/exams/${ano}/questions?limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Plataforma-Edu/1.0'
          },
        }
      )

      if (response.status === 429) {
        // Rate limit atingido - aguardar e tentar novamente
        console.log(`[ENEM] Rate limit atingido (tentativa ${tentativa}/${CONFIG.MAX_TENTATIVAS}). Aguardando...`)
        await sleep(CONFIG.DELAY_RETRY_MS * tentativa)
        continue
      }

      if (!response.ok) {
        console.error(`[ENEM] Erro HTTP ${response.status} ao buscar ano ${ano}, offset ${offset}`)
        return null
      }

      return await response.json()
    } catch (error) {
      console.error(`[ENEM] Erro na tentativa ${tentativa}:`, error)
      if (tentativa < CONFIG.MAX_TENTATIVAS) {
        await sleep(CONFIG.DELAY_RETRY_MS)
      }
    }
  }

  return null
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

    const supabase = getSupabaseAdmin()

    // Verificar se é professor
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', sessao.userId)
      .single()

    if (!usuario || usuario.tipo !== 'professor') {
      return NextResponse.json({
        sucesso: false,
        erro: 'Apenas professores podem importar questões.',
      }, { status: 403 })
    }

    const body: RequestBody = await request.json()
    const {
      ano,
      anos = ano ? [ano] : [2023, 2022, 2021, 2020, 2019],
      areas = ['todas'],
      limite = 1000  // Limite total de questões a importar
    } = body

    let questoesImportadas = 0
    let questoesAtualizadas = 0
    let questoesIgnoradas = 0
    let requisicoesFeitas = 0
    const erros: string[] = []
    const detalhes: { ano: number; importadas: number; total_ano: number }[] = []

    // Filtra áreas se não for "todas"
    const areasParaImportar = areas.includes('todas')
      ? ['ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas']
      : areas

    console.log(`[ENEM] Iniciando importação: anos=${anos.join(',')}, áreas=${areasParaImportar.join(',')}, limite=${limite}`)

    for (const anoAtual of anos) {
      if (!ANOS_DISPONIVEIS.includes(anoAtual)) {
        erros.push(`Ano ${anoAtual} não disponível na API`)
        continue
      }

      if (questoesImportadas >= limite) {
        console.log(`[ENEM] Limite de ${limite} questões atingido`)
        break
      }

      let offset = 0
      let hasMore = true
      let importadasAno = 0
      let totalAno = 0

      console.log(`[ENEM] Processando ano ${anoAtual}...`)

      // Loop de paginação para buscar TODAS as questões do ano
      while (hasMore && questoesImportadas < limite) {
        // Respeitar rate limit
        if (requisicoesFeitas > 0) {
          await sleep(CONFIG.DELAY_MS)
        }

        const data = await buscarQuestoesComRetry(anoAtual, offset, CONFIG.LIMIT_POR_PAGINA)
        requisicoesFeitas++

        if (!data) {
          erros.push(`Erro ao buscar ano ${anoAtual}, offset ${offset}`)
          break
        }

        const questoes = data.questions || []
        hasMore = data.metadata?.hasMore ?? false
        totalAno = data.metadata?.total || totalAno

        console.log(`[ENEM] Ano ${anoAtual}: offset=${offset}, questões=${questoes.length}, hasMore=${hasMore}, total=${totalAno}`)

        for (const q of questoes) {
          if (questoesImportadas >= limite) break

          // Mapear disciplina
          const mapeamento = mapearDisciplina(q.discipline, q.language)

          if (!mapeamento) {
            questoesIgnoradas++
            continue
          }

          // Verificar se a área está na lista
          if (!areasParaImportar.includes(mapeamento.area)) {
            continue
          }

          // Verificar alternativas
          if (!q.alternatives || q.alternatives.length !== 5) {
            questoesIgnoradas++
            continue
          }

          // Extrair alternativas
          const alternativas: Record<string, { texto: string; imagem: string | null }> = {}
          for (const alt of q.alternatives) {
            const letra = alt.letter.toLowerCase()
            alternativas[letra] = {
              texto: alt.text || '',
              imagem: alt.file
            }
          }

          if (!alternativas.a || !alternativas.b || !alternativas.c ||
              !alternativas.d || !alternativas.e) {
            questoesIgnoradas++
            continue
          }

          // ID único
          const idApi = `enem-api-${q.year}-${q.index}`

          // Dados da questão
          const dadosQuestao = {
            id_api: idApi,
            ano_prova: q.year,
            numero_questao: q.index,
            area: mapeamento.area,
            subarea: mapeamento.subarea,
            idioma: q.language,
            titulo: q.title,
            contexto: q.context,
            comando: q.alternativesIntroduction,
            imagem_principal: q.files?.[0] || null,
            imagens_extras: q.files?.slice(1) || [],
            alternativa_a: alternativas.a.texto,
            alternativa_b: alternativas.b.texto,
            alternativa_c: alternativas.c.texto,
            alternativa_d: alternativas.d.texto,
            alternativa_e: alternativas.e.texto,
            imagem_a: alternativas.a.imagem,
            imagem_b: alternativas.b.imagem,
            imagem_c: alternativas.c.imagem,
            imagem_d: alternativas.d.imagem,
            imagem_e: alternativas.e.imagem,
            resposta_correta: q.correctAlternative.toUpperCase(),
            fonte: 'ENEM-API',
            status: 'ativa',
            importado_em: new Date().toISOString(),
          }

          // Inserir ou atualizar
          const { error } = await supabase
            .from('questoes_enem')
            .upsert(dadosQuestao, {
              onConflict: 'id_api',
            })

          if (error) {
            if (error.code === '23505') {
              questoesAtualizadas++
            } else {
              erros.push(`Erro questão ${q.year}-${q.index}: ${error.message}`)
            }
          } else {
            questoesImportadas++
            importadasAno++
          }
        }

        // Avançar para próxima página
        offset += CONFIG.LIMIT_POR_PAGINA
      }

      detalhes.push({ ano: anoAtual, importadas: importadasAno, total_ano: totalAno })
      console.log(`[ENEM] Ano ${anoAtual} concluído: ${importadasAno} importadas de ${totalAno} total`)
    }

    // Total no banco
    const { count } = await supabase
      .from('questoes_enem')
      .select('*', { count: 'exact', head: true })

    console.log(`[ENEM] Importação concluída: ${questoesImportadas} novas, ${questoesAtualizadas} atualizadas, ${questoesIgnoradas} ignoradas`)

    return NextResponse.json({
      sucesso: true,
      importadas: questoesImportadas,
      atualizadas: questoesAtualizadas,
      ignoradas: questoesIgnoradas,
      requisicoes: requisicoesFeitas,
      total_banco: count,
      detalhes,
      erros: erros.length > 0 ? erros : undefined,
      config: {
        rate_limit: '1 req/segundo',
        delay_usado: `${CONFIG.DELAY_MS}ms`,
        limit_por_pagina: CONFIG.LIMIT_POR_PAGINA,
      }
    })
  } catch (error) {
    console.error('Erro ao importar questões ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor', detalhes: String(error) },
      { status: 500 }
    )
  }
}

// GET - Estatísticas da importação
export async function GET() {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: stats, error } = await supabase
      .from('questoes_enem')
      .select('area, subarea, ano_prova, fonte')

    if (error) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Erro ao buscar estatísticas',
        detalhes: error.message
      }, { status: 500 })
    }

    const porArea: Record<string, number> = {}
    const porSubarea: Record<string, number> = {}
    const porAno: Record<number, number> = {}
    const porFonte: Record<string, number> = {}

    stats?.forEach(q => {
      if (q.area) porArea[q.area] = (porArea[q.area] || 0) + 1
      if (q.subarea) porSubarea[q.subarea] = (porSubarea[q.subarea] || 0) + 1
      if (q.ano_prova) porAno[q.ano_prova] = (porAno[q.ano_prova] || 0) + 1
      if (q.fonte) porFonte[q.fonte] = (porFonte[q.fonte] || 0) + 1
    })

    return NextResponse.json({
      sucesso: true,
      total: stats?.length || 0,
      por_area: porArea,
      por_subarea: porSubarea,
      por_ano: porAno,
      por_fonte: porFonte,
      anos_disponiveis: ANOS_DISPONIVEIS,
      areas_disponiveis: ['ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas'],
      api_info: {
        total_questoes_api: '~2700',
        rate_limit: '1 requisição/segundo',
        anos: '2009-2023',
        docs: 'https://docs.enem.dev'
      }
    })
  } catch (error) {
    console.error('Erro ao buscar status:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
