/**
 * Script para exportar questões do ENEM do Supabase para CSV
 *
 * Uso:
 *   npx ts-node scripts/exportar-enem-csv.ts
 *
 * Ou com npx tsx:
 *   npx tsx scripts/exportar-enem-csv.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Configuração do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  console.log('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Função para escapar valores CSV
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value)
  // Se contém vírgula, aspas ou quebra de linha, envolve em aspas
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Função para converter array de objetos para CSV
function toCsv(data: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(',')
  const rows = data.map(row =>
    columns.map(col => escapeCsv(row[col])).join(',')
  )
  return [header, ...rows].join('\n')
}

async function exportarQuestoes() {
  console.log('📥 Buscando questões do ENEM...\n')

  // Buscar todas as questões
  const { data: questoes, error } = await supabase
    .from('enem_questions')
    .select('*')
    .order('ano', { ascending: false })
    .order('id', { ascending: true })

  if (error) {
    console.error('❌ Erro ao buscar questões:', error.message)
    process.exit(1)
  }

  if (!questoes || questoes.length === 0) {
    console.log('⚠️ Nenhuma questão encontrada na tabela enem_questions')
    process.exit(0)
  }

  console.log(`✅ ${questoes.length} questões encontradas\n`)

  // Análise rápida
  const anos = [...new Set(questoes.map(q => q.ano))].sort()
  const areas = [...new Set(questoes.map(q => q.area).filter(Boolean))]

  console.log('📊 Resumo:')
  console.log(`   Anos: ${anos.join(', ')}`)
  console.log(`   Áreas: ${areas.join(', ') || 'Não definidas'}`)
  console.log('')

  // Identificar problemas
  const problemas = questoes.filter(q => {
    const ctx = q.contexto || ''
    return (
      ctx.length > 3000 ||  // Texto muito longo
      /ENEM 20\d{2}.*ENEM 20\d{2}/i.test(ctx) ||  // Dois anos
      /QUESTÃO \d+.*QUESTÃO \d+/i.test(ctx) ||  // Duas questões
      ctx.includes('##') ||  // Markdown não limpo
      /\[\s*\]/.test(ctx)  // Colchetes vazios
    )
  })

  if (problemas.length > 0) {
    console.log(`⚠️ ${problemas.length} questões com possíveis problemas detectados`)
  }

  // Definir colunas para exportação
  const colunas = [
    'id',
    'ano',
    'num_questao',
    'area',
    'contexto',
    'comando',
    'alternativas',
    'resposta_correta',
    'figuras',
    'created_at'
  ]

  // Filtrar colunas que existem nos dados
  const colunasExistentes = colunas.filter(col =>
    questoes.some(q => q[col] !== undefined)
  )

  // Gerar CSV completo
  const csvCompleto = toCsv(questoes, colunasExistentes)

  // Gerar CSV apenas com problemas (se houver)
  const csvProblemas = problemas.length > 0
    ? toCsv(problemas, colunasExistentes)
    : ''

  // Salvar arquivos
  const dataAtual = new Date().toISOString().split('T')[0]
  const pastaExport = path.join(process.cwd(), 'exports')

  if (!fs.existsSync(pastaExport)) {
    fs.mkdirSync(pastaExport, { recursive: true })
  }

  const arquivoCompleto = path.join(pastaExport, `enem_questoes_${dataAtual}.csv`)
  fs.writeFileSync(arquivoCompleto, csvCompleto, 'utf-8')
  console.log(`💾 Arquivo salvo: ${arquivoCompleto}`)

  if (csvProblemas) {
    const arquivoProblemas = path.join(pastaExport, `enem_problemas_${dataAtual}.csv`)
    fs.writeFileSync(arquivoProblemas, csvProblemas, 'utf-8')
    console.log(`💾 Arquivo de problemas salvo: ${arquivoProblemas}`)
  }

  // Gerar relatório de análise
  const relatorio = `
# Relatório de Exportação ENEM
Data: ${new Date().toLocaleString('pt-BR')}

## Resumo
- Total de questões: ${questoes.length}
- Anos disponíveis: ${anos.join(', ')}
- Áreas: ${areas.join(', ') || 'Não definidas'}

## Questões por Ano
${anos.map(ano => `- ${ano}: ${questoes.filter(q => q.ano === ano).length} questões`).join('\n')}

## Problemas Detectados
- Questões com possíveis problemas: ${problemas.length}
${problemas.length > 0 ? `
### IDs das questões problemáticas:
${problemas.map(p => `- ${p.id} (ano ${p.ano}): ${p.contexto?.substring(0, 50)}...`).join('\n')}
` : ''}

## Arquivos Gerados
- ${arquivoCompleto}
${csvProblemas ? `- ${path.join(pastaExport, `enem_problemas_${dataAtual}.csv`)}` : ''}
`

  const arquivoRelatorio = path.join(pastaExport, `enem_relatorio_${dataAtual}.md`)
  fs.writeFileSync(arquivoRelatorio, relatorio, 'utf-8')
  console.log(`📄 Relatório salvo: ${arquivoRelatorio}`)

  console.log('\n✅ Exportação concluída!')
}

// Executar
exportarQuestoes().catch(console.error)
