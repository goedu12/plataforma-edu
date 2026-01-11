import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { AreaENEM, SubareaENEM } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Importar questões da API enem.dev
// POST /api/enem/importar - Importa questões de um ano específico
// GET /api/enem/importar - Retorna estatísticas da importação
// Apenas professores podem importar
// ═══════════════════════════════════════════════════════════════════════════

const API_ENEM_BASE = 'https://api.enem.dev/v1'

// Anos disponíveis na API (2009-2023)
const ANOS_DISPONIVEIS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]

// Mapeamento de disciplinas da API para nossa estrutura
// A API enem.dev usa: linguagens, matematica, ciencias-humanas, ciencias-natureza
const DISCIPLINA_MAP: Record<string, { area: AreaENEM; subarea: SubareaENEM }> = {
  // Ciências da Natureza
  'fisica': { area: 'ciencias-natureza', subarea: 'fisica' },
  'física': { area: 'ciencias-natureza', subarea: 'fisica' },
  'quimica': { area: 'ciencias-natureza', subarea: 'quimica' },
  'química': { area: 'ciencias-natureza', subarea: 'quimica' },
  'biologia': { area: 'ciencias-natureza', subarea: 'biologia' },
  'ciencias-natureza': { area: 'ciencias-natureza', subarea: 'fisica' }, // default
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
  'ciencias-humanas': { area: 'ciencias-humanas', subarea: 'historia' }, // default
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

interface RequestBody {
  ano?: number
  anos?: number[]
  areas?: string[]  // 'todas', 'ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas'
  limite?: number
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

  // Verifica mapeamento direto
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
      limite = 500
    } = body

    let questoesImportadas = 0
    let questoesAtualizadas = 0
    let questoesIgnoradas = 0
    const erros: string[] = []
    const detalhes: { ano: number; importadas: number; area: string }[] = []

    // Filtra áreas se não for "todas"
    const areasParaImportar = areas.includes('todas')
      ? ['ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas']
      : areas

    for (const anoAtual of anos) {
      if (!ANOS_DISPONIVEIS.includes(anoAtual)) {
        erros.push(`Ano ${anoAtual} não disponível na API`)
        continue
      }

      if (questoesImportadas >= limite) break

      try {
        // Buscar questões do ano - A API retorna no máximo 180 questões por ano
        const response = await fetch(
          `${API_ENEM_BASE}/exams/${anoAtual}/questions?limit=200`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Plataforma-Edu/1.0'
            },
            next: { revalidate: 3600 } // Cache 1 hora
          }
        )

        if (!response.ok) {
          erros.push(`Erro ao buscar ano ${anoAtual}: HTTP ${response.status}`)
          continue
        }

        const data = await response.json()
        const questoes: QuestaoAPI[] = data.questions || []

        console.log(`[ENEM] Ano ${anoAtual}: ${questoes.length} questões encontradas`)

        let importadasAno = 0
        const areaContagem: Record<string, number> = {}

        for (const q of questoes) {
          if (questoesImportadas >= limite) break

          // Mapear disciplina
          const mapeamento = mapearDisciplina(q.discipline, q.language)

          if (!mapeamento) {
            console.log(`[ENEM] Disciplina não mapeada: ${q.discipline}`)
            questoesIgnoradas++
            continue
          }

          // Verificar se a área está na lista de áreas para importar
          if (!areasParaImportar.includes(mapeamento.area)) {
            continue
          }

          // Verificar se tem 5 alternativas
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

          // Verificar se todas as alternativas existem
          if (!alternativas.a || !alternativas.b || !alternativas.c ||
              !alternativas.d || !alternativas.e) {
            questoesIgnoradas++
            continue
          }

          // ID único para evitar duplicatas
          const idApi = `enem-api-${q.year}-${q.index}`

          // Preparar dados da questão
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

          // Inserir ou atualizar questão
          const { error, data: resultado } = await supabase
            .from('questoes_enem')
            .upsert(dadosQuestao, {
              onConflict: 'id_api',
            })
            .select('id')
            .single()

          if (error) {
            if (error.code === '23505') { // Duplicate - já existe
              questoesAtualizadas++
            } else {
              erros.push(`Erro questão ${q.year}-${q.index}: ${error.message}`)
            }
          } else {
            questoesImportadas++
            importadasAno++
            areaContagem[mapeamento.area] = (areaContagem[mapeamento.area] || 0) + 1
          }
        }

        // Registrar detalhes do ano
        for (const [area, count] of Object.entries(areaContagem)) {
          detalhes.push({ ano: anoAtual, importadas: count, area })
        }

        console.log(`[ENEM] Ano ${anoAtual}: ${importadasAno} questões importadas`)

      } catch (err) {
        erros.push(`Erro ao processar ano ${anoAtual}: ${err}`)
        console.error(`[ENEM] Erro ao processar ano ${anoAtual}:`, err)
      }
    }

    // Buscar total de questões no banco
    const { count } = await supabase
      .from('questoes_enem')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      sucesso: true,
      importadas: questoesImportadas,
      atualizadas: questoesAtualizadas,
      ignoradas: questoesIgnoradas,
      total_banco: count,
      detalhes,
      erros: erros.length > 0 ? erros : undefined,
    })
  } catch (error) {
    console.error('Erro ao importar questões ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor', detalhes: String(error) },
      { status: 500 }
    )
  }
}

// GET - Verificar status da importação e estatísticas
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
    })
  } catch (error) {
    console.error('Erro ao buscar status:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
