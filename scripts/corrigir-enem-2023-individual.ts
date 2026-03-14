/**
 * ================================================================
 * CORRECAO INDIVIDUAL - QUESTOES ENEM 2023
 * ================================================================
 *
 * Script para corrigir questoes ENEM 2023 individualmente,
 * comparando com o padrao 2024/2025.
 *
 * Correcoes aplicadas:
 * - Extrair TEXTO I/II do conteudo para campo rotulo
 * - Validar e corrigir URLs de imagens
 * - Converter formulas quimicas para Unicode
 * - Formatar fontes com <small> tags
 *
 * Uso:
 *   npx tsx scripts/corrigir-enem-2023-individual.ts
 *   npx tsx scripts/corrigir-enem-2023-individual.ts --dry-run
 *   npx tsx scripts/corrigir-enem-2023-individual.ts --limit 10
 *
 * Variaveis de ambiente necessarias:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACAO
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_STORAGE_BASE = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/enem-imagens/'

// ═══════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════

interface ElementoEnem {
  tipo: 'texto' | 'imagem' | 'comando' | 'titulo' | 'fonte'
  conteudo?: string
  arquivo?: string
  fonte?: string | null
  titulo?: string | null
  ordem?: number
  rotulo?: string | null
  legenda?: string | null
  descricao?: string | null
}

interface QuestaoEnem {
  id: string
  ano: number
  dia: number
  numero: number
  area: string
  elementos: ElementoEnem[]
  comando: string | null
  tem_imagem: boolean
  tem_formula: boolean
}

interface Correcao {
  questaoId: string
  numero: number
  tipo: string
  antes: string
  depois: string
}

// ═══════════════════════════════════════════════════════════════════
// FUNCOES DE CORRECAO
// ═══════════════════════════════════════════════════════════════════

/**
 * Extrai rotulo (TEXTO I, TEXTO II, etc.) do conteudo de um elemento
 */
function extrairRotulo(conteudo: string): { rotulo: string | null; conteudoLimpo: string } {
  if (!conteudo) return { rotulo: null, conteudoLimpo: conteudo }

  // Padroes de rotulo no inicio do texto
  const padroes = [
    /^(TEXTO\s+[IVX]+)\s*\n+/i,
    /^(TEXTO\s+\d+)\s*\n+/i,
    /^(Texto\s+[IVX]+)\s*\n+/,
    /^(Texto\s+\d+)\s*\n+/,
    /^\*\*(TEXTO\s+[IVX]+)\*\*\s*\n+/i,
    /^##?\s*(TEXTO\s+[IVX]+)\s*\n+/i,
  ]

  for (const padrao of padroes) {
    const match = conteudo.match(padrao)
    if (match) {
      const rotulo = match[1].toUpperCase().replace(/\s+/g, ' ').trim()
      const conteudoLimpo = conteudo.replace(padrao, '').trim()
      return { rotulo, conteudoLimpo }
    }
  }

  return { rotulo: null, conteudoLimpo: conteudo }
}

/**
 * Converte formulas quimicas para Unicode
 */
function converterFormulasQuimicas(texto: string): string {
  if (!texto) return texto

  const substituicoes: [RegExp, string][] = [
    // Gases
    [/\bH2O\b/g, 'H₂O'],
    [/\bCO2\b/g, 'CO₂'],
    [/\bO2\b/g, 'O₂'],
    [/\bN2\b/g, 'N₂'],
    [/\bH2\b/g, 'H₂'],
    [/\bCl2\b/g, 'Cl₂'],
    [/\bO3\b/g, 'O₃'],
    [/\bNH3\b/g, 'NH₃'],
    [/\bCH4\b/g, 'CH₄'],
    [/\bSO2\b/g, 'SO₂'],
    [/\bSO3\b/g, 'SO₃'],
    [/\bNO2\b/g, 'NO₂'],
    [/\bN2O\b/g, 'N₂O'],
    // Acidos
    [/\bH2SO4\b/g, 'H₂SO₄'],
    [/\bHNO3\b/g, 'HNO₃'],
    [/\bH3PO4\b/g, 'H₃PO₄'],
    [/\bH2CO3\b/g, 'H₂CO₃'],
    [/\bHCl\b/g, 'HCl'],
    // Oxidos
    [/\bFe2O3\b/g, 'Fe₂O₃'],
    [/\bAl2O3\b/g, 'Al₂O₃'],
    [/\bSiO2\b/g, 'SiO₂'],
    [/\bCaO\b/g, 'CaO'],
    [/\bMgO\b/g, 'MgO'],
    // Sais
    [/\bNaCl\b/g, 'NaCl'],
    [/\bCaCO3\b/g, 'CaCO₃'],
    [/\bNa2CO3\b/g, 'Na₂CO₃'],
    [/\bNaHCO3\b/g, 'NaHCO₃'],
    // Organicos
    [/\bC2H5OH\b/g, 'C₂H₅OH'],
    [/\bC2H6\b/g, 'C₂H₆'],
    [/\bC6H12O6\b/g, 'C₆H₁₂O₆'],
    [/\bC6H6\b/g, 'C₆H₆'],
    // Ions
    [/\bH\+/g, 'H⁺'],
    [/\bOH-/g, 'OH⁻'],
    [/\bNa\+/g, 'Na⁺'],
    [/\bCl-/g, 'Cl⁻'],
  ]

  let resultado = texto
  for (const [padrao, substituicao] of substituicoes) {
    resultado = resultado.replace(padrao, substituicao)
  }

  // Notacao cientifica - tratar separadamente com funcao
  resultado = resultado.replace(/10\^(-?\d+)/g, (_, exp) => `10${converterParaSuperscrito(exp)}`)
  resultado = resultado.replace(/(\d+)\s*[xX]\s*10(\d+)/g, '$1 × 10$2')

  return resultado
}

function converterParaSuperscrito(num: string): string {
  const mapa: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '-': '⁻', '+': '⁺'
  }
  return num.split('').map(c => mapa[c] || c).join('')
}

/**
 * Formata fonte com tags <small>
 */
function formatarFonte(fonte: string): string {
  if (!fonte) return fonte
  const trimmed = fonte.trim()
  if (trimmed.startsWith('<small>')) return trimmed
  return `<small>${trimmed}</small>`
}

/**
 * Valida e corrige URL de imagem
 */
function corrigirUrlImagem(url: string): string | null {
  if (!url) return null

  const trimmed = url.trim()

  // URLs invalidas
  if (['nan', 'none', 'null', 'undefined', 'NaN', ''].includes(trimmed.toLowerCase())) {
    return null
  }

  // Ja e URL completa
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // Caminho relativo - adicionar base do Supabase
  if (trimmed.startsWith('enem/') || trimmed.startsWith('/enem/')) {
    const caminho = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
    return SUPABASE_STORAGE_BASE + caminho
  }

  // Outros caminhos - tentar adicionar prefixo
  if (trimmed.includes('.png') || trimmed.includes('.jpg') || trimmed.includes('.jpeg') || trimmed.includes('.gif')) {
    return SUPABASE_STORAGE_BASE + 'enem/2023/' + trimmed
  }

  return null
}

// ═══════════════════════════════════════════════════════════════════
// FUNCAO PRINCIPAL DE CORRECAO
// ═══════════════════════════════════════════════════════════════════

function corrigirQuestao(questao: QuestaoEnem): { elementos: ElementoEnem[]; correcoes: Correcao[] } {
  const correcoes: Correcao[] = []
  const elementos = JSON.parse(JSON.stringify(questao.elementos)) as ElementoEnem[]

  for (let i = 0; i < elementos.length; i++) {
    const elem = elementos[i]

    // 1. Extrair rotulo de elementos texto
    if (elem.tipo === 'texto' && elem.conteudo) {
      const { rotulo, conteudoLimpo } = extrairRotulo(elem.conteudo)
      if (rotulo && conteudoLimpo !== elem.conteudo) {
        correcoes.push({
          questaoId: questao.id,
          numero: questao.numero,
          tipo: 'rotulo_extraido',
          antes: elem.conteudo.substring(0, 50),
          depois: `rotulo: "${rotulo}", conteudo: "${conteudoLimpo.substring(0, 30)}..."`
        })
        elem.rotulo = rotulo
        elem.conteudo = conteudoLimpo
      }

      // 2. Converter formulas quimicas
      const conteudoComFormulas = converterFormulasQuimicas(elem.conteudo)
      if (conteudoComFormulas !== elem.conteudo) {
        correcoes.push({
          questaoId: questao.id,
          numero: questao.numero,
          tipo: 'formula_convertida',
          antes: elem.conteudo.substring(0, 50),
          depois: conteudoComFormulas.substring(0, 50)
        })
        elem.conteudo = conteudoComFormulas
      }
    }

    // 3. Corrigir URLs de imagem
    if (elem.tipo === 'imagem' && elem.arquivo) {
      const urlCorrigida = corrigirUrlImagem(elem.arquivo)
      if (urlCorrigida !== elem.arquivo) {
        correcoes.push({
          questaoId: questao.id,
          numero: questao.numero,
          tipo: 'url_corrigida',
          antes: elem.arquivo,
          depois: urlCorrigida || 'null'
        })
        elem.arquivo = urlCorrigida || undefined
      }
    }

    // 4. Formatar fonte com <small>
    if (elem.tipo === 'fonte' && elem.conteudo) {
      const fonteFormatada = formatarFonte(elem.conteudo)
      if (fonteFormatada !== elem.conteudo) {
        correcoes.push({
          questaoId: questao.id,
          numero: questao.numero,
          tipo: 'fonte_formatada',
          antes: elem.conteudo.substring(0, 50),
          depois: fonteFormatada.substring(0, 50)
        })
        elem.conteudo = fonteFormatada
      }
    }

    // 5. Converter formulas em titulos
    if (elem.tipo === 'titulo' && elem.conteudo) {
      const conteudoComFormulas = converterFormulasQuimicas(elem.conteudo)
      if (conteudoComFormulas !== elem.conteudo) {
        elem.conteudo = conteudoComFormulas
      }
    }
  }

  return { elementos, correcoes }
}

// ═══════════════════════════════════════════════════════════════════
// CLIENTE SUPABASE
// ═══════════════════════════════════════════════════════════════════

function criarCliente(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL nao configurada')
  }
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_KEY nao configurada')
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limitIndex = args.indexOf('--limit')
  const limite = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined

  console.log('\n' + '='.repeat(70))
  console.log('  CORRECAO INDIVIDUAL - QUESTOES ENEM 2023')
  console.log('='.repeat(70))
  console.log(`  Modo: ${dryRun ? 'DRY-RUN (sem salvar)' : 'PRODUCAO (salvando)'}`)
  if (limite) console.log(`  Limite: ${limite} questoes`)
  console.log('')

  try {
    const supabase = criarCliente()
    console.log('Conectado ao Supabase')

    // Buscar questoes 2023
    let query = supabase
      .from('questoes_enem')
      .select('id, ano, dia, numero, area, elementos, comando, tem_imagem, tem_formula')
      .eq('ano', 2023)
      .order('numero', { ascending: true })

    if (limite) {
      query = query.limit(limite)
    }

    const { data: questoes, error } = await query

    if (error) {
      throw new Error(`Erro ao buscar questoes: ${error.message}`)
    }

    console.log(`${questoes?.length || 0} questoes carregadas`)

    if (!questoes || questoes.length === 0) {
      console.log('Nenhuma questao encontrada para 2023')
      return
    }

    // Processar cada questao
    const todasCorrecoes: Correcao[] = []
    const questoesParaAtualizar: { id: string; elementos: ElementoEnem[] }[] = []

    for (const questao of questoes) {
      const { elementos, correcoes } = corrigirQuestao(questao as QuestaoEnem)

      if (correcoes.length > 0) {
        todasCorrecoes.push(...correcoes)
        questoesParaAtualizar.push({ id: questao.id, elementos })
      }
    }

    // Relatorio
    console.log('\n' + '-'.repeat(70))
    console.log('  RELATORIO DE CORRECOES')
    console.log('-'.repeat(70))
    console.log(`  Total de questoes: ${questoes.length}`)
    console.log(`  Questoes com correcoes: ${questoesParaAtualizar.length}`)
    console.log(`  Total de correcoes: ${todasCorrecoes.length}`)

    // Agrupar por tipo
    const porTipo: Record<string, number> = {}
    for (const c of todasCorrecoes) {
      porTipo[c.tipo] = (porTipo[c.tipo] || 0) + 1
    }

    console.log('\n  Por tipo de correcao:')
    for (const [tipo, count] of Object.entries(porTipo)) {
      console.log(`    ${tipo}: ${count}`)
    }

    // Mostrar algumas correcoes
    if (todasCorrecoes.length > 0) {
      console.log('\n  Exemplos de correcoes:')
      for (const c of todasCorrecoes.slice(0, 10)) {
        console.log(`    Q${c.numero} [${c.tipo}]`)
        console.log(`      Antes: ${c.antes}`)
        console.log(`      Depois: ${c.depois}`)
      }
      if (todasCorrecoes.length > 10) {
        console.log(`    ... e mais ${todasCorrecoes.length - 10} correcoes`)
      }
    }

    // Aplicar correcoes
    if (!dryRun && questoesParaAtualizar.length > 0) {
      console.log('\n' + '-'.repeat(70))
      console.log('  APLICANDO CORRECOES...')
      console.log('-'.repeat(70))

      let sucesso = 0
      let falha = 0

      for (const { id, elementos } of questoesParaAtualizar) {
        const { error: updateError } = await supabase
          .from('questoes_enem')
          .update({ elementos })
          .eq('id', id)

        if (updateError) {
          console.error(`  Erro ao atualizar ${id}: ${updateError.message}`)
          falha++
        } else {
          sucesso++
        }
      }

      console.log(`\n  Atualizacoes com sucesso: ${sucesso}`)
      console.log(`  Atualizacoes com falha: ${falha}`)
    } else if (dryRun) {
      console.log('\n  [DRY-RUN] Nenhuma alteracao foi salva no banco.')
    }

    console.log('\n' + '='.repeat(70))
    console.log('  CORRECAO CONCLUIDA')
    console.log('='.repeat(70) + '\n')

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('\nErro:', msg)
    process.exit(1)
  }
}

main()
