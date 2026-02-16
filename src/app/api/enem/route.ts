export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { questaoTemQualidade, extrairImagensQuestao, isValidImageUrl } from '@/lib/limpezaTexto'
import type { AreaENEM, SubareaENEM, AlternativaENEM } from '@/types'
import { ENEM_CONFIG } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Buscar questões para estudantes do Ensino Médio
//
// Modos de operação:
// GET /api/enem?id_api=enem-2024-d1-azul-001-inglês  → questão específica
// GET /api/enem?modo=listar&ano=2024&dia=1            → listar questões com filtros
// GET /api/enem?ano=2024&area=matematica              → questão aleatória (modo legado)
// GET /api/enem?modo=aleatorio                        → questão aleatória com filtros
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_BASE_URL = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/'

// Construir URL completa de imagem do storage
function buildImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  const trimmed = path.trim()
  // Filtrar valores inválidos importados do CSV/API
  if (!trimmed || ['nan', 'none', 'null', 'undefined', 'NaN', 'None'].includes(trimmed)) return null
  // Se já é URL absoluta, retornar como está
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) return trimmed
  // Construir URL do storage
  return `${STORAGE_BASE_URL}${trimmed}`
}

// Processar enunciado_html: converter caminhos relativos de imagens para URLs absolutas
function processarEnunciadoHtml(html: string | null | undefined): string | null {
  if (!html) return null
  // Substituir src de <img> que não são URLs absolutas
  return html.replace(
    /(<img\s[^>]*?src\s*=\s*["'])(?!https?:\/\/|data:)([^"']+)(["'])/gi,
    (_, prefix, path, suffix) => `${prefix}${STORAGE_BASE_URL}${path}${suffix}`
  )
}

// Formatar questão para o frontend (formato público sem resposta_correta)
function formatarQuestaoPublica(q: any): any {
  // Determinar area_nome: usar campo do banco ou mapear
  const areaNome = q.area_nome ||
    ENEM_CONFIG.AREAS[q.area as AreaENEM]?.nome ||
    q.area

  // Construir imagens de alternativas com URLs completas
  const imgA = buildImageUrl(q.imagem_a)
  const imgB = buildImageUrl(q.imagem_b)
  const imgC = buildImageUrl(q.imagem_c)
  const imgD = buildImageUrl(q.imagem_d)
  const imgE = buildImageUrl(q.imagem_e)

  return {
    id: q.id,
    id_api: q.id_api,
    ano_prova: q.ano_prova,
    dia: q.dia,
    numero_questao: q.numero_questao,
    caderno: q.caderno,
    area: q.area,
    area_nome: areaNome,
    componente: q.componente,
    subarea: q.subarea,
    lingua_estrangeira: q.lingua_estrangeira,
    titulo: q.titulo,
    contexto: q.contexto,
    comando: q.comando,
    enunciado_html: processarEnunciadoHtml(q.enunciado_html),
    imagem_principal: buildImageUrl(q.imagem_principal),
    imagens_extras: (q.imagens_extras || []).map(buildImageUrl).filter(Boolean),
    alternativa_a: q.alternativa_a,
    alternativa_b: q.alternativa_b,
    alternativa_c: q.alternativa_c,
    alternativa_d: q.alternativa_d,
    alternativa_e: q.alternativa_e,
    imagem_a: imgA,
    imagem_b: imgB,
    imagem_c: imgC,
    imagem_d: imgD,
    imagem_e: imgE,
    alt_a_tipo: q.alt_a_tipo || 'texto',
    alt_b_tipo: q.alt_b_tipo || 'texto',
    alt_c_tipo: q.alt_c_tipo || 'texto',
    alt_d_tipo: q.alt_d_tipo || 'texto',
    alt_e_tipo: q.alt_e_tipo || 'texto',
    fonte: q.fonte,
    tags: q.tags,
    dificuldade: q.dificuldade,
    status: q.status,
    tem_imagem: q.tem_imagem,
    tem_formula: q.tem_formula,
    tem_tabela: q.tem_tabela,
    anulada: q.anulada,
    // Imagens consolidadas para compatibilidade com simulado antigo
    todas_imagens: [
      buildImageUrl(q.imagem_principal),
      ...(q.imagens_extras || []).map(buildImageUrl).filter(Boolean),
    ].filter(Boolean),
    // Campos extras (opcionais, da view questao_completa se disponível)
    textos_motivadores_json: q.textos_motivadores_json || null,
    imagens_json: q.imagens_json || null,
    // Alternativas formatadas para compatibilidade com componente existente
    alternativas: [
      { letra: 'A', texto: q.alternativa_a, imagem: imgA, tipo: q.alt_a_tipo || 'texto' },
      { letra: 'B', texto: q.alternativa_b, imagem: imgB, tipo: q.alt_b_tipo || 'texto' },
      { letra: 'C', texto: q.alternativa_c, imagem: imgC, tipo: q.alt_c_tipo || 'texto' },
      { letra: 'D', texto: q.alternativa_d, imagem: imgD, tipo: q.alt_d_tipo || 'texto' },
      { letra: 'E', texto: q.alternativa_e, imagem: imgE, tipo: q.alt_e_tipo || 'texto' },
    ],
  }
}

// Verificar se uma questão passa no filtro de qualidade (para questões antigas)
function verificarQualidade(q: any): boolean {
  // Questões 2024/2025 importadas do banco local sempre passam no filtro
  if (q.ano_prova >= 2024 && q.enunciado_html) return true

  const resultado = questaoTemQualidade({
    contexto: q.contexto,
    comando: q.comando,
    alternativa_a: q.alternativa_a,
    alternativa_b: q.alternativa_b,
    alternativa_c: q.alternativa_c,
    alternativa_d: q.alternativa_d,
    alternativa_e: q.alternativa_e,
    imagem_principal: q.imagem_principal,
    imagens_extras: q.imagens_extras,
  })
  return resultado.valida
}

export async function GET(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const modo = searchParams.get('modo') // 'listar' | 'aleatorio' | null
    const idApiParam = searchParams.get('id_api')
    const anoParam = searchParams.get('ano')
    const diaParam = searchParams.get('dia')
    const areaParam = searchParams.get('area')
    const subareaParam = searchParams.get('subarea') as SubareaENEM | null
    const linguaParam = searchParams.get('lingua') // 'inglês' | 'espanhol'
    const paginaParam = searchParams.get('pagina')
    const limitParam = searchParams.get('limit')

    const ano = anoParam ? parseInt(anoParam) : null
    const dia = diaParam ? parseInt(diaParam) : null
    const pagina = paginaParam ? parseInt(paginaParam) : 1
    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 20

    const supabase = getSupabaseAdmin()

    // Verificar acesso (Ensino Médio ou professor)
    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('nivel, ano, tipo')
      .eq('id', sessao.userId)
      .single()

    if (erroUsuario || !usuario) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Usuário não encontrado',
      }, { status: 404 })
    }

    const isProfessor = usuario.tipo === 'professor'
    const isAlunoEM = usuario.nivel === 'EM'

    if (!isProfessor && !isAlunoEM) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Simulado ENEM disponível apenas para alunos do Ensino Médio.',
      }, { status: 403 })
    }

    // ─── MODO 1: Buscar questão específica por id_api ───
    if (idApiParam) {
      // Buscar direto da tabela questoes_enem (fonte primária)
      const { data: questao } = await supabase
        .from('questoes_enem')
        .select('*')
        .eq('id_api', idApiParam)
        .single()

      if (!questao) {
        return NextResponse.json({
          sucesso: false,
          erro: 'Questão não encontrada',
        }, { status: 404 })
      }

      return NextResponse.json({
        sucesso: true,
        status: 'OK',
        questao: formatarQuestaoPublica(questao),
      })
    }

    // ─── MODO 2: Listar questões com filtros e paginação ───
    if (modo === 'listar') {
      let query = supabase
        .from('questoes_enem')
        .select('id, id_api, ano_prova, dia, numero_questao, caderno, area, area_nome, componente, lingua_estrangeira, titulo, anulada, dificuldade, tem_imagem, tem_formula, status', { count: 'exact' })

      // Filtrar questões que não estão com status 'inativa' (permitir 'ativa' e sem status)
      query = query.or('status.eq.ativa,status.is.null')

      if (ano) query = query.eq('ano_prova', ano)
      if (dia) query = query.eq('dia', dia)
      if (areaParam) {
        // Suportar tanto o formato 'matematica' quanto o formato descritivo
        query = query.or(`area.eq.${areaParam},area.ilike.%${areaParam}%`)
      }
      if (subareaParam) query = query.eq('subarea', subareaParam)
      if (linguaParam) query = query.eq('lingua_estrangeira', linguaParam)

      // Ordenar por numero_questao
      query = query.order('ano_prova', { ascending: false })
        .order('dia', { ascending: true })
        .order('numero_questao', { ascending: true })

      // Paginação
      const offset = (pagina - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: questoes, error: erroQuery, count } = await query

      if (erroQuery) {
        console.error('Erro ao listar questões ENEM:', erroQuery)
        return NextResponse.json({
          sucesso: false,
          erro: 'Erro ao buscar questões',
          detalhes: erroQuery.message,
        }, { status: 500 })
      }

      // Buscar contagens por área para os filtros ativos
      let contagemQuery = supabase
        .from('questoes_enem')
        .select('area, area_nome, dia')
        .or('status.eq.ativa,status.is.null')

      if (ano) contagemQuery = contagemQuery.eq('ano_prova', ano)

      const { data: contagemData } = await contagemQuery

      // Agrupar contagens
      const contagemPorArea: Record<string, number> = {}
      const contagemPorDia: Record<number, number> = {}
      contagemData?.forEach(q => {
        const areaKey = q.area_nome || q.area
        contagemPorArea[areaKey] = (contagemPorArea[areaKey] || 0) + 1
        if (q.dia) {
          contagemPorDia[q.dia] = (contagemPorDia[q.dia] || 0) + 1
        }
      })

      return NextResponse.json({
        sucesso: true,
        status: 'OK',
        questoes: questoes || [],
        total: count || 0,
        pagina,
        limite: limit,
        total_paginas: Math.ceil((count || 0) / limit),
        contagem_por_area: contagemPorArea,
        contagem_por_dia: contagemPorDia,
      })
    }

    // ─── MODO 3: Questão aleatória (comportamento original) ───

    // Buscar anos disponíveis
    const { data: anosData } = await supabase
      .from('questoes_enem')
      .select('ano_prova')
      .or('status.eq.ativa,status.is.null')

    const anosDisponiveis = [...new Set(anosData?.map(a => a.ano_prova).filter(Boolean) || [])]
      .sort((a, b) => b - a)

    // Buscar áreas disponíveis
    const { data: areasData } = await supabase
      .from('questoes_enem')
      .select('area, area_nome')
      .or('status.eq.ativa,status.is.null')

    const areasDisponiveis = [...new Set(areasData?.map(a => a.area_nome || a.area).filter(Boolean) || [])]

    // Buscar dias disponíveis
    const { data: diasData } = await supabase
      .from('questoes_enem')
      .select('dia')
      .or('status.eq.ativa,status.is.null')

    const diasDisponiveis = [...new Set(diasData?.map(a => a.dia).filter(Boolean) || [])].sort()

    // Buscar subáreas disponíveis (filtradas por área se selecionada)
    let subareasQuery = supabase
      .from('questoes_enem')
      .select('subarea')
      .or('status.eq.ativa,status.is.null')

    if (areaParam) {
      subareasQuery = subareasQuery.or(`area.eq.${areaParam},area.ilike.%${areaParam}%`)
    }

    const { data: subareasData } = await subareasQuery

    const subareasDisponiveis = [...new Set(subareasData?.map(a => a.subarea).filter(Boolean) || [])]

    // Buscar IDs já respondidos pelo usuário
    const { data: respostasUsuario } = await supabase
      .from('respostas_enem')
      .select('questao_id')
      .eq('usuario_id', sessao.userId)

    const idsRespondidos = new Set<string>(
      respostasUsuario?.map(r => r.questao_id).filter(Boolean) || []
    )

    // Construir query principal
    let query = supabase
      .from('questoes_enem')
      .select('*')
      .or('status.eq.ativa,status.is.null')

    if (ano) query = query.eq('ano_prova', ano)
    if (dia) query = query.eq('dia', dia)

    if (areaParam) {
      query = query.or(`area.eq.${areaParam},area.ilike.%${areaParam}%`)
    }

    if (subareaParam) query = query.eq('subarea', subareaParam)
    if (linguaParam) query = query.eq('lingua_estrangeira', linguaParam)

    const { data: questoes, error: erroQuery } = await query.limit(1000)

    if (erroQuery) {
      console.error('Erro ao buscar questões ENEM:', erroQuery)
      return NextResponse.json({
        sucesso: false,
        erro: 'Erro ao buscar questões',
        detalhes: erroQuery.message,
      }, { status: 500 })
    }

    if (!questoes || questoes.length === 0) {
      return NextResponse.json({
        sucesso: true,
        status: 'SEM_QUESTOES',
        mensagem: 'Nenhuma questão disponível. O professor precisa importar questões.',
        anos_disponiveis: anosDisponiveis,
        areas_disponiveis: areasDisponiveis,
        dias_disponiveis: diasDisponiveis,
        subareas_disponiveis: subareasDisponiveis,
        respondidas: idsRespondidos.size,
      })
    }

    // Filtrar por qualidade E não respondidas
    const questoesComQualidade = questoes.filter(q => verificarQualidade(q))
    const disponiveis = questoesComQualidade.filter(q => !idsRespondidos.has(q.id))

    console.log(`[ENEM] Total: ${questoes.length}, Com qualidade: ${questoesComQualidade.length}, Disponíveis: ${disponiveis.length}`)

    if (disponiveis.length === 0) {
      const filtroTexto = []
      if (ano) filtroTexto.push(`de ${ano}`)
      if (dia) filtroTexto.push(`do dia ${dia}`)
      if (areaParam) filtroTexto.push(`de ${areaParam}`)

      return NextResponse.json({
        sucesso: true,
        status: 'TODAS_RESPONDIDAS',
        mensagem: filtroTexto.length > 0
          ? `Você respondeu todas as questões ${filtroTexto.join(' ')}!`
          : 'Você respondeu todas as questões disponíveis!',
        anos_disponiveis: anosDisponiveis,
        areas_disponiveis: areasDisponiveis,
        dias_disponiveis: diasDisponiveis,
        subareas_disponiveis: subareasDisponiveis,
        respondidas: idsRespondidos.size,
        total_questoes: questoesComQualidade.length,
      })
    }

    // Selecionar questão aleatória
    const questaoRaw = disponiveis[Math.floor(Math.random() * disponiveis.length)]
    const questaoFormatada = formatarQuestaoPublica(questaoRaw)

    return NextResponse.json({
      sucesso: true,
      status: 'OK',
      questao: questaoFormatada,
      anos_disponiveis: anosDisponiveis,
      areas_disponiveis: areasDisponiveis,
      dias_disponiveis: diasDisponiveis,
      subareas_disponiveis: subareasDisponiveis,
      respondidas: idsRespondidos.size,
      total_questoes: questoesComQualidade.length,
      disponiveis: disponiveis.length,
    })
  } catch (error) {
    console.error('Erro na API ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno', detalhes: String(error) },
      { status: 500 }
    )
  }
}
