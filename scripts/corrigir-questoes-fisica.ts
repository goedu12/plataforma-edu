/**
 * Script para exportar, detectar e corrigir caracteres em questões de Física
 *
 * Uso:
 *   npx tsx scripts/corrigir-questoes-fisica.ts exportar    # Exporta para JSON
 *   npx tsx scripts/corrigir-questoes-fisica.ts analisar    # Analisa problemas
 *   npx tsx scripts/corrigir-questoes-fisica.ts corrigir    # Corrige no banco
 *   npx tsx scripts/corrigir-questoes-fisica.ts --dry-run   # Simula correções
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// ═══════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.log('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ═══════════════════════════════════════════════════════════════════
// MAPA DE CORREÇÕES DE CARACTERES
// Adicione aqui os padrões que precisam ser corrigidos
// ═══════════════════════════════════════════════════════════════════

const CORRECOES: Record<string, string> = {
  // Encoding UTF-8 quebrado (Latin-1 interpretado como UTF-8)
  'Ã¡': 'á',
  'Ã ': 'à',
  'Ã¢': 'â',
  'Ã£': 'ã',
  'Ã¤': 'ä',
  'Ã§': 'ç',
  'Ã©': 'é',
  'Ã¨': 'è',
  'Ãª': 'ê',
  'Ã­': 'í',
  'Ã¬': 'ì',
  'Ã®': 'î',
  'Ã³': 'ó',
  'Ã²': 'ò',
  'Ã´': 'ô',
  'Ãµ': 'õ',
  'Ãº': 'ú',
  'Ã¹': 'ù',
  'Ã»': 'û',
  'Ã±': 'ñ',
  'Ã': 'Á',  // Cuidado com este - pode ser início de sequência
  'Ã‰': 'É',
  'Ã"': 'Ó',
  'Ãš': 'Ú',
  'Ã‡': 'Ç',

  // Símbolos matemáticos/científicos
  'Â²': '²',
  'Â³': '³',
  'Â°': '°',
  'Âº': 'º',
  'Âª': 'ª',
  'Â½': '½',
  'Â¼': '¼',
  'Â¾': '¾',
  'Â±': '±',
  'Âµ': 'µ',  // micro
  'â€"': '–',  // en dash
  'â€"': '—',  // em dash
  'â€œ': '"',  // aspas esquerda
  'â€': '"',   // aspas direita
  'â€˜': ''',  // apóstrofo esquerdo
  'â€™': ''',  // apóstrofo direito
  'â†'': '→',  // seta direita
  'â†'': '←',  // seta esquerda
  'â‰¤': '≤',  // menor ou igual
  'â‰¥': '≥',  // maior ou igual
  'â‰ ': '≠',  // diferente
  'Ï€': 'π',   // pi
  'Î©': 'Ω',   // omega (ohm)
  'Î¼': 'μ',   // mu
  'Î"': 'Δ',   // delta
  'Î£': 'Σ',   // sigma
  'âˆš': '√',  // raiz quadrada
  'âˆž': '∞',  // infinito

  // Espaços e caracteres invisíveis
  '\u00A0': ' ',  // non-breaking space → espaço normal
  '\u200B': '',   // zero-width space → remover
  '\u200C': '',   // zero-width non-joiner → remover
  '\u200D': '',   // zero-width joiner → remover
  '\uFEFF': '',   // BOM → remover

  // Quebras de linha inconsistentes
  '\r\n': '\n',
  '\r': '\n',
}

// Padrões regex para detecção (não correção automática)
const PADROES_SUSPEITOS = [
  /Ã[^\s]{1,2}/g,           // Possível encoding quebrado
  /Â[²³°ºª½¼¾±µ]/g,         // Símbolos com Â na frente
  /â€[^\s]{1,2}/g,          // Possíveis símbolos tipográficos quebrados
  /[\x00-\x08\x0B\x0C\x0E-\x1F]/g,  // Caracteres de controle
]

// ═══════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════

interface Questao {
  id: string
  componente: string
  ano: number
  tema: string
  subtema: string | null
  dificuldade: string
  enunciado: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  resposta_correta: string
  explicacao: string
  dica: string | null
  status: string
  criado_em: string
}

interface ProblemaDetectado {
  questaoId: string
  campo: string
  trecho: string
  posicao: number
  sugestao?: string
}

// ═══════════════════════════════════════════════════════════════════
// FUNÇÕES DE ANÁLISE
// ═══════════════════════════════════════════════════════════════════

function detectarProblemas(texto: string): { problemas: string[], corrigido: string } {
  const problemas: string[] = []
  let corrigido = texto

  // Verificar padrões suspeitos
  for (const padrao of PADROES_SUSPEITOS) {
    const matches = texto.match(padrao)
    if (matches) {
      for (const match of matches) {
        if (!problemas.includes(match)) {
          problemas.push(match)
        }
      }
    }
  }

  // Aplicar correções conhecidas
  for (const [errado, certo] of Object.entries(CORRECOES)) {
    if (corrigido.includes(errado)) {
      corrigido = corrigido.split(errado).join(certo)
    }
  }

  return { problemas, corrigido }
}

function analisarQuestao(questao: Questao): ProblemaDetectado[] {
  const problemas: ProblemaDetectado[] = []
  const camposTexto = [
    'enunciado',
    'alternativa_a',
    'alternativa_b',
    'alternativa_c',
    'alternativa_d',
    'explicacao',
    'dica',
    'tema',
    'subtema'
  ] as const

  for (const campo of camposTexto) {
    const valor = questao[campo]
    if (!valor) continue

    const { problemas: problemasEncontrados } = detectarProblemas(valor)

    for (const prob of problemasEncontrados) {
      const posicao = valor.indexOf(prob)
      problemas.push({
        questaoId: questao.id,
        campo,
        trecho: prob,
        posicao,
        sugestao: CORRECOES[prob] || undefined
      })
    }
  }

  return problemas
}

function corrigirQuestao(questao: Questao): { corrigida: Questao, alteracoes: string[] } {
  const alteracoes: string[] = []
  const corrigida = { ...questao }

  const camposTexto = [
    'enunciado',
    'alternativa_a',
    'alternativa_b',
    'alternativa_c',
    'alternativa_d',
    'explicacao',
    'dica',
    'tema',
    'subtema'
  ] as const

  for (const campo of camposTexto) {
    const valor = corrigida[campo]
    if (!valor) continue

    const { corrigido } = detectarProblemas(valor)

    if (corrigido !== valor) {
      alteracoes.push(`${campo}: "${valor.substring(0, 50)}..." → "${corrigido.substring(0, 50)}..."`)
      ;(corrigida as Record<string, unknown>)[campo] = corrigido
    }
  }

  return { corrigida, alteracoes }
}

// ═══════════════════════════════════════════════════════════════════
// COMANDOS
// ═══════════════════════════════════════════════════════════════════

async function exportarQuestoes() {
  console.log('📥 Buscando questões de Física (não ENEM)...\n')

  const { data: questoes, error } = await supabase
    .from('questoes')
    .select('*')
    .eq('componente', 'fisica')
    .order('ano', { ascending: true })
    .order('tema', { ascending: true })

  if (error) {
    console.error('❌ Erro ao buscar questões:', error.message)
    process.exit(1)
  }

  if (!questoes || questoes.length === 0) {
    console.log('⚠️ Nenhuma questão de física encontrada')
    process.exit(0)
  }

  console.log(`✅ ${questoes.length} questões encontradas\n`)

  // Estatísticas
  const temas = [...new Set(questoes.map(q => q.tema))].sort()
  const anos = [...new Set(questoes.map(q => q.ano))].sort()

  console.log('📊 Resumo:')
  console.log(`   Anos: ${anos.join(', ')}`)
  console.log(`   Temas: ${temas.length}`)
  temas.forEach(t => {
    const count = questoes.filter(q => q.tema === t).length
    console.log(`     - ${t}: ${count} questões`)
  })
  console.log('')

  // Criar pasta de exportação
  const pastaExport = path.join(process.cwd(), 'exports')
  if (!fs.existsSync(pastaExport)) {
    fs.mkdirSync(pastaExport, { recursive: true })
  }

  // Salvar JSON
  const dataAtual = new Date().toISOString().split('T')[0]
  const arquivo = path.join(pastaExport, `questoes_fisica_${dataAtual}.json`)

  fs.writeFileSync(arquivo, JSON.stringify(questoes, null, 2), 'utf-8')
  console.log(`💾 Arquivo salvo: ${arquivo}`)

  return questoes
}

async function analisarQuestoes() {
  console.log('🔍 Analisando questões de Física...\n')

  const { data: questoes, error } = await supabase
    .from('questoes')
    .select('*')
    .eq('componente', 'fisica')

  if (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }

  if (!questoes?.length) {
    console.log('⚠️ Nenhuma questão encontrada')
    return
  }

  console.log(`📊 Analisando ${questoes.length} questões...\n`)

  const todosProblemas: ProblemaDetectado[] = []
  const questoesComProblema: Set<string> = new Set()

  for (const questao of questoes) {
    const problemas = analisarQuestao(questao as Questao)
    if (problemas.length > 0) {
      questoesComProblema.add(questao.id)
      todosProblemas.push(...problemas)
    }
  }

  if (todosProblemas.length === 0) {
    console.log('✅ Nenhum problema de caracteres detectado!')
    return
  }

  console.log(`⚠️ Encontrados ${todosProblemas.length} problemas em ${questoesComProblema.size} questões:\n`)

  // Agrupar por tipo de problema
  const porTrecho: Record<string, number> = {}
  for (const p of todosProblemas) {
    porTrecho[p.trecho] = (porTrecho[p.trecho] || 0) + 1
  }

  console.log('📋 Caracteres problemáticos encontrados:')
  Object.entries(porTrecho)
    .sort((a, b) => b[1] - a[1])
    .forEach(([trecho, count]) => {
      const sugestao = CORRECOES[trecho]
      console.log(`   "${trecho}" → ${sugestao ? `"${sugestao}"` : '???'} (${count}x)`)
    })

  console.log('\n📝 Detalhes por questão:')
  for (const questao of questoes.filter(q => questoesComProblema.has(q.id))) {
    const problemas = todosProblemas.filter(p => p.questaoId === questao.id)
    console.log(`\n   ID: ${questao.id}`)
    console.log(`   Tema: ${questao.tema}`)
    for (const p of problemas) {
      console.log(`     - ${p.campo}: "${p.trecho}" na posição ${p.posicao}`)
    }
  }

  // Salvar relatório
  const pastaExport = path.join(process.cwd(), 'exports')
  if (!fs.existsSync(pastaExport)) {
    fs.mkdirSync(pastaExport, { recursive: true })
  }

  const dataAtual = new Date().toISOString().split('T')[0]
  const relatorio = {
    data: dataAtual,
    totalQuestoes: questoes.length,
    questoesComProblema: questoesComProblema.size,
    totalProblemas: todosProblemas.length,
    caracteresPorFrequencia: porTrecho,
    detalhes: todosProblemas
  }

  const arquivoRelatorio = path.join(pastaExport, `analise_caracteres_${dataAtual}.json`)
  fs.writeFileSync(arquivoRelatorio, JSON.stringify(relatorio, null, 2), 'utf-8')
  console.log(`\n💾 Relatório salvo: ${arquivoRelatorio}`)
}

async function corrigirQuestoes(dryRun: boolean = false) {
  console.log(dryRun ? '🧪 MODO SIMULAÇÃO (dry-run)\n' : '🔧 Corrigindo questões...\n')

  const { data: questoes, error } = await supabase
    .from('questoes')
    .select('*')
    .eq('componente', 'fisica')

  if (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }

  if (!questoes?.length) {
    console.log('⚠️ Nenhuma questão encontrada')
    return
  }

  let corrigidas = 0
  let totalAlteracoes = 0
  const log: string[] = []

  for (const questao of questoes) {
    const { corrigida, alteracoes } = corrigirQuestao(questao as Questao)

    if (alteracoes.length > 0) {
      corrigidas++
      totalAlteracoes += alteracoes.length

      console.log(`\n📝 Questão ${questao.id}:`)
      alteracoes.forEach(a => console.log(`   ${a}`))
      log.push(`Questão ${questao.id}: ${alteracoes.length} alterações`)

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('questoes')
          .update({
            enunciado: corrigida.enunciado,
            alternativa_a: corrigida.alternativa_a,
            alternativa_b: corrigida.alternativa_b,
            alternativa_c: corrigida.alternativa_c,
            alternativa_d: corrigida.alternativa_d,
            explicacao: corrigida.explicacao,
            dica: corrigida.dica,
            tema: corrigida.tema,
            subtema: corrigida.subtema
          })
          .eq('id', questao.id)

        if (updateError) {
          console.error(`   ❌ Erro ao atualizar: ${updateError.message}`)
        } else {
          console.log(`   ✅ Atualizada no banco`)
        }
      }
    }
  }

  console.log('\n' + '═'.repeat(50))
  console.log(`📊 Resumo:`)
  console.log(`   Total de questões: ${questoes.length}`)
  console.log(`   Questões corrigidas: ${corrigidas}`)
  console.log(`   Total de alterações: ${totalAlteracoes}`)

  if (dryRun) {
    console.log('\n⚠️ MODO SIMULAÇÃO - nenhuma alteração foi feita no banco')
    console.log('   Execute sem --dry-run para aplicar as correções')
  }

  // Salvar log
  const pastaExport = path.join(process.cwd(), 'exports')
  if (!fs.existsSync(pastaExport)) {
    fs.mkdirSync(pastaExport, { recursive: true })
  }

  const dataAtual = new Date().toISOString().split('T')[0]
  const arquivoLog = path.join(pastaExport, `correcoes_${dryRun ? 'simulacao_' : ''}${dataAtual}.log`)
  fs.writeFileSync(arquivoLog, log.join('\n'), 'utf-8')
  console.log(`\n💾 Log salvo: ${arquivoLog}`)
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2)
  const comando = args[0]?.toLowerCase()
  const dryRun = args.includes('--dry-run')

  console.log('═'.repeat(50))
  console.log('🔧 CORRETOR DE QUESTÕES DE FÍSICA')
  console.log('═'.repeat(50) + '\n')

  switch (comando) {
    case 'exportar':
      await exportarQuestoes()
      break

    case 'analisar':
      await analisarQuestoes()
      break

    case 'corrigir':
      await corrigirQuestoes(dryRun)
      break

    default:
      console.log('Uso:')
      console.log('  npx tsx scripts/corrigir-questoes-fisica.ts exportar')
      console.log('    → Exporta todas as questões de física para JSON')
      console.log('')
      console.log('  npx tsx scripts/corrigir-questoes-fisica.ts analisar')
      console.log('    → Analisa e lista problemas de caracteres')
      console.log('')
      console.log('  npx tsx scripts/corrigir-questoes-fisica.ts corrigir --dry-run')
      console.log('    → Simula correções sem alterar o banco')
      console.log('')
      console.log('  npx tsx scripts/corrigir-questoes-fisica.ts corrigir')
      console.log('    → Aplica correções no banco de dados')
      break
  }
}

main().catch(console.error)
