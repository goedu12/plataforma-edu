/**
 * ================================================================
 * VALIDAÇÃO DE FORMATAÇÃO - QUESTÕES ENEM
 * ================================================================
 *
 * Script para validar a formatação das questões ENEM no banco de dados.
 * Verifica:
 * - Separação de fontes/referências
 * - Detecção de gênero textual
 * - Imagens válidas
 * - Formatação de fórmulas
 *
 * Uso:
 *   npx tsx scripts/validar-formatacao-enem.ts
 *   npx tsx scripts/validar-formatacao-enem.ts --area "Matemática"
 *   npx tsx scripts/validar-formatacao-enem.ts --sample 10
 *
 * Variáveis de ambiente necessárias:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Importar funções de limpeza (ajustar caminho conforme necessário)
// Para rodar, copie as funções ou use ts-node com paths configurados

// ═══════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// ═══════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════

interface ElementoEnem {
  tipo: 'texto' | 'imagem' | 'comando' | 'titulo' | 'fonte'
  conteudo?: string
  arquivo?: string
}

interface QuestaoEnem {
  id: string
  ano: number
  dia: number
  numero: number
  area: string
  elementos: ElementoEnem[]
  comando: string | null
  alt_a_texto: string | null
  alt_b_texto: string | null
  alt_c_texto: string | null
  alt_d_texto: string | null
  alt_e_texto: string | null
  alt_a_imagem: string | null
  alt_b_imagem: string | null
  alt_c_imagem: string | null
  alt_d_imagem: string | null
  alt_e_imagem: string | null
}

interface RelatorioValidacao {
  total: number
  porArea: Record<string, number>
  problemas: ProblemaFormatacao[]
  estatisticas: {
    comFonte: number
    semFonte: number
    comImagem: number
    comFormula: number
    porGenero: Record<string, number>
  }
}

interface ProblemaFormatacao {
  questaoId: string
  ano: number
  numero: number
  area: string
  tipo: 'fonte_misturada' | 'imagem_invalida' | 'formula_quebrada' | 'genero_incorreto'
  descricao: string
  trecho?: string
}

// ═══════════════════════════════════════════════════════════════════
// FUNÇÕES DE DETECÇÃO (copiadas de limpezaTexto.ts)
// ═══════════════════════════════════════════════════════════════════

type GeneroTextual = 'prosa' | 'poema' | 'citacao' | 'cientifico' | 'dialogo' | 'lista'

function detectarGeneroTextual(texto: string): GeneroTextual {
  if (!texto || typeof texto !== 'string') return 'prosa'

  const textoLimpo = texto.replace(/<[^>]+>/g, '').trim()
  const linhas = textoLimpo.split(/\n/).filter(l => l.trim())

  const linhasCurtas = linhas.filter(l => l.trim().length > 0 && l.trim().length < 60)
  const proporcaoLinhasCurtas = linhasCurtas.length / Math.max(linhas.length, 1)

  const linhasVerso = linhas.filter(l => {
    const t = l.trim()
    return t.length > 0 && t.length < 80 && !/[.!?:;]$/.test(t)
  })
  const proporcaoVersos = linhasVerso.length / Math.max(linhas.length, 1)

  if (linhas.length >= 3 && proporcaoLinhasCurtas > 0.6 && proporcaoVersos > 0.5) {
    return 'poema'
  }

  const linhasDialogo = linhas.filter(l => /^[\u2014\u2013\-–—]["'"']?\s*[A-Z]/.test(l.trim()))
  if (linhasDialogo.length >= 2 && linhasDialogo.length / linhas.length > 0.3) {
    return 'dialogo'
  }

  if (/^[""\[\(«]/.test(textoLimpo.trim()) || /apud|op\.\s*cit\.|ibidem|ibid\./i.test(textoLimpo)) {
    return 'citacao'
  }

  const linhasLista = linhas.filter(l => /^[\d]+[\.\)]\s|^[a-e][\.\)]\s|^[\-\*•]\s/i.test(l.trim()))
  if (linhasLista.length >= 3 && linhasLista.length / linhas.length > 0.5) {
    return 'lista'
  }

  if (/\$.*\$|\\frac|\\sqrt|[°±≤≥→⇌∆Δ]|mol\/L|m\/s|km\/h|\d+\s*×\s*10|[A-Z][a-z]?[₂₃₄₅₆]/.test(textoLimpo)) {
    return 'cientifico'
  }

  return 'prosa'
}

function detectarFonteMisturada(texto: string): { temFonte: boolean; fonteMisturada: boolean; fonte?: string } {
  if (!texto) return { temFonte: false, fonteMisturada: false }

  const padroesFonte = [
    /\n([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s,]+\.\s+[^.]+\.[^.]+,\s*\d{4})/,
    /\n(\(?[Aa]daptado de?\)?[^)]*\.?\s*)$/,
    /\n(Dispon[ií]vel\s+em:[^\n]+)$/i,
    /\n((Revista|Jornal|Folha)[^,\n]*,\s*\d+[^\n]*)$/i,
    /\(([^)]+,\s*\d{4}[^)]*)\)\s*$/,
  ]

  for (const padrao of padroesFonte) {
    const match = texto.match(padrao)
    if (match) {
      // Verificar se a fonte está no final ou misturada no meio
      const posicao = texto.indexOf(match[0])
      const restante = texto.slice(posicao + match[0].length).trim()
      const fonteMisturada = restante.length > 50 // Se tem muito texto depois da fonte, está misturada
      return { temFonte: true, fonteMisturada, fonte: match[1] }
    }
  }

  return { temFonte: false, fonteMisturada: false }
}

function validarImagem(url: string | null): boolean {
  if (!url || typeof url !== 'string') return true // null é válido (sem imagem)
  const trimmed = url.trim()
  if (!trimmed) return true

  const invalidos = ['nan', 'none', 'null', 'undefined', 'NaN']
  if (invalidos.includes(trimmed.toLowerCase())) return false

  if (/^(javascript|vbscript|file):/i.test(trimmed)) return false
  if (trimmed.startsWith('localhost') || trimmed.includes('127.0.0.1')) return false

  return true
}

function detectarFormulaQuebrada(texto: string): boolean {
  if (!texto) return false

  // Padrões que indicam fórmula mal formatada
  const problemasFormula = [
    /\\\w+\{[^}]*$/,           // LaTeX incompleto: \frac{...
    /\$[^$]*$/,                // $ sem fechar
    /\^\{[^}]*$/,              // Expoente incompleto
    /_\{[^}]*$/,               // Subscrito incompleto
    /\\frac\s*\{[^}]*\}\s*$/,  // \frac com só um argumento
  ]

  return problemasFormula.some(p => p.test(texto))
}

// ═══════════════════════════════════════════════════════════════════
// FUNÇÕES DE VALIDAÇÃO
// ═══════════════════════════════════════════════════════════════════

function criarCliente(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error('❌ NEXT_PUBLIC_SUPABASE_URL não configurada')
  }
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('❌ SUPABASE_SERVICE_KEY não configurada')
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

async function buscarQuestoes(
  supabase: SupabaseClient,
  filtros: { area?: string; limite?: number }
): Promise<QuestaoEnem[]> {
  let query = supabase
    .from('questoes_enem')
    .select('*')
    .order('ano', { ascending: false })

  if (filtros.area) {
    query = query.ilike('area', `%${filtros.area}%`)
  }

  if (filtros.limite) {
    query = query.limit(filtros.limite)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Erro ao buscar questões: ${error.message}`)
  }

  return data || []
}

function validarQuestao(questao: QuestaoEnem): ProblemaFormatacao[] {
  const problemas: ProblemaFormatacao[] = []

  // Extrair todo o texto da questão
  const textoCompleto = questao.elementos
    ?.filter(e => e.tipo === 'texto' || e.tipo === 'comando')
    .map(e => e.conteudo || '')
    .join('\n') || ''

  // 1. Verificar fonte misturada
  const { fonteMisturada, fonte } = detectarFonteMisturada(textoCompleto)
  if (fonteMisturada) {
    problemas.push({
      questaoId: questao.id,
      ano: questao.ano,
      numero: questao.numero,
      area: questao.area,
      tipo: 'fonte_misturada',
      descricao: 'Fonte/referência está misturada no texto em vez de separada',
      trecho: fonte?.substring(0, 100)
    })
  }

  // 2. Verificar imagens inválidas
  const camposImagem = [
    questao.alt_a_imagem, questao.alt_b_imagem, questao.alt_c_imagem,
    questao.alt_d_imagem, questao.alt_e_imagem
  ]
  const imagensElementos = questao.elementos
    ?.filter(e => e.tipo === 'imagem')
    .map(e => e.arquivo) || []

  const todasImagens = [...camposImagem, ...imagensElementos]

  for (const img of todasImagens) {
    if (!validarImagem(img)) {
      problemas.push({
        questaoId: questao.id,
        ano: questao.ano,
        numero: questao.numero,
        area: questao.area,
        tipo: 'imagem_invalida',
        descricao: `URL de imagem inválida: ${img?.substring(0, 50)}`,
        trecho: img || undefined
      })
    }
  }

  // 3. Verificar fórmulas quebradas
  if (detectarFormulaQuebrada(textoCompleto)) {
    problemas.push({
      questaoId: questao.id,
      ano: questao.ano,
      numero: questao.numero,
      area: questao.area,
      tipo: 'formula_quebrada',
      descricao: 'Fórmula LaTeX/matemática incompleta ou mal formatada'
    })
  }

  // Verificar alternativas também
  const alternativas = [
    questao.alt_a_texto, questao.alt_b_texto, questao.alt_c_texto,
    questao.alt_d_texto, questao.alt_e_texto
  ]
  for (const alt of alternativas) {
    if (alt && detectarFormulaQuebrada(alt)) {
      problemas.push({
        questaoId: questao.id,
        ano: questao.ano,
        numero: questao.numero,
        area: questao.area,
        tipo: 'formula_quebrada',
        descricao: 'Fórmula quebrada em alternativa',
        trecho: alt.substring(0, 100)
      })
      break // Só reportar uma vez por questão
    }
  }

  return problemas
}

function gerarRelatorio(questoes: QuestaoEnem[]): RelatorioValidacao {
  const problemas: ProblemaFormatacao[] = []
  const porArea: Record<string, number> = {}
  const porGenero: Record<string, number> = {
    prosa: 0, poema: 0, citacao: 0, cientifico: 0, dialogo: 0, lista: 0
  }
  let comFonte = 0, semFonte = 0, comImagem = 0, comFormula = 0

  for (const questao of questoes) {
    // Contar por área
    porArea[questao.area] = (porArea[questao.area] || 0) + 1

    // Validar questão
    const problemasQuestao = validarQuestao(questao)
    problemas.push(...problemasQuestao)

    // Extrair texto completo
    const textoCompleto = questao.elementos
      ?.filter(e => e.tipo === 'texto')
      .map(e => e.conteudo || '')
      .join('\n') || ''

    // Detectar gênero
    const genero = detectarGeneroTextual(textoCompleto)
    porGenero[genero]++

    // Estatísticas
    const { temFonte } = detectarFonteMisturada(textoCompleto)
    if (temFonte) comFonte++
    else semFonte++

    const temImagem = questao.elementos?.some(e => e.tipo === 'imagem') ||
      [questao.alt_a_imagem, questao.alt_b_imagem, questao.alt_c_imagem,
        questao.alt_d_imagem, questao.alt_e_imagem].some(i => i)
    if (temImagem) comImagem++

    if (/\$|\\\w+|[₂₃₄₅₆⁺⁻]/.test(textoCompleto)) comFormula++
  }

  return {
    total: questoes.length,
    porArea,
    problemas,
    estatisticas: {
      comFonte,
      semFonte,
      comImagem,
      comFormula,
      porGenero
    }
  }
}

function imprimirRelatorio(relatorio: RelatorioValidacao) {
  console.log('\n' + '═'.repeat(70))
  console.log('  RELATÓRIO DE VALIDAÇÃO - FORMATAÇÃO ENEM')
  console.log('═'.repeat(70))

  console.log(`
📊 ESTATÍSTICAS GERAIS:
   Total de questões:     ${relatorio.total}
   Com fonte detectada:   ${relatorio.estatisticas.comFonte}
   Sem fonte detectada:   ${relatorio.estatisticas.semFonte}
   Com imagens:           ${relatorio.estatisticas.comImagem}
   Com fórmulas:          ${relatorio.estatisticas.comFormula}
`)

  console.log('📚 POR ÁREA:')
  for (const [area, count] of Object.entries(relatorio.porArea)) {
    console.log(`   ${area}: ${count}`)
  }

  console.log('\n📝 POR GÊNERO TEXTUAL:')
  for (const [genero, count] of Object.entries(relatorio.estatisticas.porGenero)) {
    if (count > 0) {
      console.log(`   ${genero}: ${count}`)
    }
  }

  if (relatorio.problemas.length > 0) {
    console.log('\n' + '═'.repeat(70))
    console.log('  PROBLEMAS ENCONTRADOS')
    console.log('═'.repeat(70))

    // Agrupar por tipo
    const porTipo: Record<string, ProblemaFormatacao[]> = {}
    for (const p of relatorio.problemas) {
      porTipo[p.tipo] = porTipo[p.tipo] || []
      porTipo[p.tipo].push(p)
    }

    for (const [tipo, lista] of Object.entries(porTipo)) {
      console.log(`\n❌ ${tipo.toUpperCase()}: ${lista.length} ocorrências`)
      lista.slice(0, 5).forEach(p => {
        console.log(`   - ENEM ${p.ano} Q${p.numero} (${p.area})`)
        if (p.trecho) console.log(`     "${p.trecho.substring(0, 80)}..."`)
      })
      if (lista.length > 5) {
        console.log(`   ... e mais ${lista.length - 5}`)
      }
    }
  } else {
    console.log('\n✅ Nenhum problema encontrado!')
  }

  console.log('\n' + '═'.repeat(70))
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2)
  const areaIndex = args.indexOf('--area')
  const sampleIndex = args.indexOf('--sample')

  const filtros: { area?: string; limite?: number } = {}

  if (areaIndex !== -1 && args[areaIndex + 1]) {
    filtros.area = args[areaIndex + 1]
  }

  if (sampleIndex !== -1 && args[sampleIndex + 1]) {
    filtros.limite = parseInt(args[sampleIndex + 1], 10)
  }

  console.log('🔍 Iniciando validação de formatação ENEM...')
  if (filtros.area) console.log(`   Filtrando por área: ${filtros.area}`)
  if (filtros.limite) console.log(`   Limite de questões: ${filtros.limite}`)

  try {
    const supabase = criarCliente()
    console.log('✅ Conectado ao Supabase')

    const questoes = await buscarQuestoes(supabase, filtros)
    console.log(`📋 ${questoes.length} questões carregadas`)

    const relatorio = gerarRelatorio(questoes)
    imprimirRelatorio(relatorio)

    // Salvar relatório JSON
    const fs = await import('fs')
    const nomeArquivo = `./validacao-formatacao-${Date.now()}.json`
    fs.writeFileSync(nomeArquivo, JSON.stringify(relatorio, null, 2))
    console.log(`📄 Relatório salvo em: ${nomeArquivo}`)

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('❌ Erro:', msg)
    process.exit(1)
  }
}

main()
