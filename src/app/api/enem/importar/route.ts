import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AreaENEM, SubareaENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Importar questões da API enem.dev
// POST /api/enem/importar
// Apenas professores podem importar
// ═══════════════════════════════════════════════════════════════════════════

const API_ENEM_BASE = 'https://api.enem.dev/v1'

// Mapeamento de disciplinas da API para nossa estrutura
const DISCIPLINA_MAP: Record<string, { area: AreaENEM; subarea: SubareaENEM }> = {
  'fisica': { area: 'ciencias-natureza', subarea: 'fisica' },
  'física': { area: 'ciencias-natureza', subarea: 'fisica' },
  'quimica': { area: 'ciencias-natureza', subarea: 'quimica' },
  'química': { area: 'ciencias-natureza', subarea: 'quimica' },
  'biologia': { area: 'ciencias-natureza', subarea: 'biologia' },
  'matematica': { area: 'matematica', subarea: 'matematica' },
  'matemática': { area: 'matematica', subarea: 'matematica' },
}

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

interface RequestBody {
  ano?: number
  disciplinas?: string[]
  limite?: number
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
    const { ano, disciplinas = ['fisica', 'matematica'], limite = 50 } = body

    // Anos disponíveis na API (2009-2023)
    const anosDisponiveis = ano ? [ano] : [2023, 2022, 2021, 2020, 2019, 2018]

    let questoesImportadas = 0
    let questoesIgnoradas = 0
    const erros: string[] = []

    for (const anoAtual of anosDisponiveis) {
      if (questoesImportadas >= limite) break

      try {
        // Buscar questões do ano
        const response = await fetch(
          `${API_ENEM_BASE}/exams/${anoAtual}/questions?limit=100`,
          {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 } // Cache 1 hora
          }
        )

        if (!response.ok) {
          erros.push(`Erro ao buscar ano ${anoAtual}: ${response.status}`)
          continue
        }

        const data = await response.json()
        const questoes: QuestaoAPI[] = data.questions || []

        for (const q of questoes) {
          if (questoesImportadas >= limite) break

          // Filtrar por disciplina
          const disciplinaNormalizada = q.discipline?.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')

          if (!disciplinas.some(d =>
            disciplinaNormalizada?.includes(d.toLowerCase())
          )) {
            continue
          }

          // Mapear para nossa estrutura
          const mapeamento = Object.entries(DISCIPLINA_MAP).find(([key]) =>
            disciplinaNormalizada?.includes(key)
          )?.[1]

          if (!mapeamento) continue

          // Verificar se tem 5 alternativas
          if (q.alternatives?.length !== 5) continue

          // Extrair alternativas
          const alternativas = q.alternatives.reduce((acc, alt) => {
            acc[alt.letter.toLowerCase()] = {
              texto: alt.text,
              imagem: alt.file
            }
            return acc
          }, {} as Record<string, { texto: string; imagem: string | null }>)

          // Verificar se todas as alternativas existem
          if (!alternativas.a || !alternativas.b || !alternativas.c ||
              !alternativas.d || !alternativas.e) {
            continue
          }

          // Inserir questão
          const { error } = await supabase.from('questoes_enem').upsert({
            id_api: `enem-${q.year}-${q.index}`,
            ano_prova: q.year,
            numero_questao: q.index,
            area: mapeamento.area,
            subarea: mapeamento.subarea,
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
            fonte: 'ENEM',
            status: 'ativa',
          }, {
            onConflict: 'id_api',
            ignoreDuplicates: true
          })

          if (error) {
            if (error.code === '23505') { // Duplicate
              questoesIgnoradas++
            } else {
              erros.push(`Erro questão ${q.year}-${q.index}: ${error.message}`)
            }
          } else {
            questoesImportadas++
          }
        }
      } catch (err) {
        erros.push(`Erro ao processar ano ${anoAtual}: ${err}`)
      }
    }

    // Buscar total de questões no banco
    const { count } = await supabase
      .from('questoes_enem')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      sucesso: true,
      importadas: questoesImportadas,
      ignoradas: questoesIgnoradas,
      total_banco: count,
      erros: erros.length > 0 ? erros : undefined,
    })
  } catch (error) {
    console.error('Erro ao importar questões ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Verificar status da importação
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

    // Estatísticas do banco
    const { data: stats } = await supabase
      .from('questoes_enem')
      .select('area, subarea, ano_prova')

    const porArea: Record<string, number> = {}
    const porSubarea: Record<string, number> = {}
    const porAno: Record<number, number> = {}

    stats?.forEach(q => {
      porArea[q.area] = (porArea[q.area] || 0) + 1
      porSubarea[q.subarea] = (porSubarea[q.subarea] || 0) + 1
      porAno[q.ano_prova] = (porAno[q.ano_prova] || 0) + 1
    })

    return NextResponse.json({
      sucesso: true,
      total: stats?.length || 0,
      por_area: porArea,
      por_subarea: porSubarea,
      por_ano: porAno,
      anos_disponiveis: [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009],
    })
  } catch (error) {
    console.error('Erro ao buscar status:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
