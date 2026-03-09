/**
 * Script de Diagnóstico e Otimização do Supabase
 *
 * Identifica:
 * - Tamanho de cada tabela
 * - Tabelas não utilizadas
 * - Dados antigos que podem ser limpos
 * - Índices faltantes ou duplicados
 *
 * Uso: npx ts-node scripts/otimizar-supabase.ts
 */

import { createClient } from '@supabase/supabase-js'

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Variáveis de ambiente não configuradas:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_KEY ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Cores para output
const cores = {
  reset: '\x1b[0m',
  verde: '\x1b[32m',
  amarelo: '\x1b[33m',
  vermelho: '\x1b[31m',
  azul: '\x1b[34m',
  cinza: '\x1b[90m',
  negrito: '\x1b[1m',
}

function formatarBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatarNumero(n: number): string {
  return n.toLocaleString('pt-BR')
}

// ═══════════════════════════════════════════════════════════════════════════
// DIAGNÓSTICO
// ═══════════════════════════════════════════════════════════════════════════

interface TabelaInfo {
  nome: string
  registros: number
  tamanhoEstimado: number
  ultimaAtualizacao?: Date
}

interface Diagnostico {
  tabelas: TabelaInfo[]
  tabelasVazias: string[]
  tabelasGrandes: TabelaInfo[]
  dadosAntigos: { tabela: string; registros: number; periodo: string }[]
  sugestoes: string[]
  totalEstimado: number
}

async function listarTabelas(): Promise<string[]> {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
  })

  if (error) {
    // Fallback: tentar listar tabelas conhecidas
    console.log(`${cores.amarelo}⚠ Não foi possível listar tabelas via SQL, usando lista conhecida${cores.reset}`)
    return [
      'usuarios', 'questoes', 'respostas', 'conquistas', 'conquistas_usuarios',
      'ia_sessoes', 'ia_mensagens', 'ia_feedback',
      'estudante_preferencias', 'estudante_estado', 'estudante_dificuldades',
      'trilha_ranking', 'trilha_temas_curiosidade', 'respostas_trilha',
      'mapas_mentais', 'flashcards_progresso', 'tempo_uso',
      'notas_2025', 'config_sistema', 'questoes_enem'
    ]
  }

  return data?.map((r: { table_name: string }) => r.table_name) || []
}

async function contarRegistros(tabela: string): Promise<number> {
  const { count, error } = await supabase
    .from(tabela)
    .select('*', { count: 'exact', head: true })

  if (error) {
    return -1 // Erro ao acessar tabela
  }

  return count || 0
}

async function verificarDadosAntigos(tabela: string, campoData: string, diasLimite: number): Promise<number> {
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - diasLimite)

  const { count, error } = await supabase
    .from(tabela)
    .select('*', { count: 'exact', head: true })
    .lt(campoData, dataLimite.toISOString())

  if (error) return 0
  return count || 0
}

async function executarDiagnostico(): Promise<Diagnostico> {
  console.log(`\n${cores.negrito}${cores.azul}═══════════════════════════════════════════════════════════${cores.reset}`)
  console.log(`${cores.negrito}${cores.azul}   DIAGNÓSTICO DO SUPABASE${cores.reset}`)
  console.log(`${cores.negrito}${cores.azul}═══════════════════════════════════════════════════════════${cores.reset}\n`)

  const tabelas = await listarTabelas()
  const tabelasInfo: TabelaInfo[] = []
  const tabelasVazias: string[] = []
  const dadosAntigos: { tabela: string; registros: number; periodo: string }[] = []
  const sugestoes: string[] = []

  console.log(`${cores.cinza}Analisando ${tabelas.length} tabelas...${cores.reset}\n`)

  for (const tabela of tabelas) {
    process.stdout.write(`  Verificando ${tabela}... `)

    const registros = await contarRegistros(tabela)

    if (registros === -1) {
      console.log(`${cores.amarelo}(sem acesso)${cores.reset}`)
      continue
    }

    // Estimativa de tamanho (aproximado: 500 bytes por registro)
    const tamanhoEstimado = registros * 500

    tabelasInfo.push({
      nome: tabela,
      registros,
      tamanhoEstimado
    })

    if (registros === 0) {
      tabelasVazias.push(tabela)
      console.log(`${cores.cinza}vazia${cores.reset}`)
    } else {
      console.log(`${cores.verde}${formatarNumero(registros)} registros${cores.reset}`)
    }

    // Verificar dados antigos em tabelas específicas
    if (tabela === 'ia_mensagens' || tabela === 'ia_sessoes') {
      const antigos = await verificarDadosAntigos(tabela, 'created_at', 90)
      if (antigos > 100) {
        dadosAntigos.push({ tabela, registros: antigos, periodo: '> 90 dias' })
      }
    }

    if (tabela === 'respostas') {
      const antigos = await verificarDadosAntigos(tabela, 'criado_em', 180)
      if (antigos > 1000) {
        dadosAntigos.push({ tabela, registros: antigos, periodo: '> 180 dias' })
      }
    }

    if (tabela === 'tempo_uso') {
      const antigos = await verificarDadosAntigos(tabela, 'data', 90)
      if (antigos > 500) {
        dadosAntigos.push({ tabela, registros: antigos, periodo: '> 90 dias' })
      }
    }
  }

  // Ordenar por tamanho
  tabelasInfo.sort((a, b) => b.registros - a.registros)

  const tabelasGrandes = tabelasInfo.filter(t => t.registros > 1000)
  const totalEstimado = tabelasInfo.reduce((acc, t) => acc + t.tamanhoEstimado, 0)

  // Gerar sugestões
  if (tabelasVazias.length > 0) {
    sugestoes.push(`Remover ${tabelasVazias.length} tabelas vazias: ${tabelasVazias.slice(0, 5).join(', ')}${tabelasVazias.length > 5 ? '...' : ''}`)
  }

  if (dadosAntigos.length > 0) {
    const totalAntigos = dadosAntigos.reduce((acc, d) => acc + d.registros, 0)
    sugestoes.push(`Limpar ${formatarNumero(totalAntigos)} registros antigos em ${dadosAntigos.length} tabelas`)
  }

  if (tabelasGrandes.some(t => t.nome === 'respostas')) {
    sugestoes.push('Considerar arquivar respostas antigas (manter apenas últimos 6 meses)')
  }

  if (tabelasGrandes.some(t => t.nome === 'ia_mensagens')) {
    sugestoes.push('Limpar histórico de conversas do IA Tutor (manter apenas últimos 30 dias)')
  }

  return {
    tabelas: tabelasInfo,
    tabelasVazias,
    tabelasGrandes,
    dadosAntigos,
    sugestoes,
    totalEstimado
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// OTIMIZAÇÃO
// ═══════════════════════════════════════════════════════════════════════════

async function limparMensagensIA(diasManter: number = 30): Promise<number> {
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - diasManter)

  const { data, error } = await supabase
    .from('ia_mensagens')
    .delete()
    .lt('created_at', dataLimite.toISOString())
    .select('id')

  if (error) {
    console.error(`Erro ao limpar ia_mensagens: ${error.message}`)
    return 0
  }

  return data?.length || 0
}

async function limparSessoesIA(diasManter: number = 30): Promise<number> {
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - diasManter)

  // Primeiro deletar mensagens das sessões antigas
  await limparMensagensIA(diasManter)

  // Depois deletar as sessões
  const { data, error } = await supabase
    .from('ia_sessoes')
    .delete()
    .lt('inicio', dataLimite.toISOString())
    .select('id')

  if (error) {
    console.error(`Erro ao limpar ia_sessoes: ${error.message}`)
    return 0
  }

  return data?.length || 0
}

async function limparTempoUso(diasManter: number = 90): Promise<number> {
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - diasManter)

  const { data, error } = await supabase
    .from('tempo_uso')
    .delete()
    .lt('data', dataLimite.toISOString().split('T')[0])
    .select('id')

  if (error) {
    console.error(`Erro ao limpar tempo_uso: ${error.message}`)
    return 0
  }

  return data?.length || 0
}

async function limparFeedbackIA(diasManter: number = 90): Promise<number> {
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - diasManter)

  const { data, error } = await supabase
    .from('ia_feedback')
    .delete()
    .lt('created_at', dataLimite.toISOString())
    .select('id')

  if (error) {
    console.error(`Erro ao limpar ia_feedback: ${error.message}`)
    return 0
  }

  return data?.length || 0
}

async function executarOtimizacao(): Promise<void> {
  console.log(`\n${cores.negrito}${cores.azul}═══════════════════════════════════════════════════════════${cores.reset}`)
  console.log(`${cores.negrito}${cores.azul}   EXECUTANDO OTIMIZAÇÃO${cores.reset}`)
  console.log(`${cores.negrito}${cores.azul}═══════════════════════════════════════════════════════════${cores.reset}\n`)

  let totalLimpo = 0

  // 1. Limpar mensagens do IA Tutor (> 30 dias)
  console.log(`${cores.amarelo}→ Limpando mensagens do IA Tutor (> 30 dias)...${cores.reset}`)
  const msgLimpas = await limparMensagensIA(30)
  if (msgLimpas > 0) {
    console.log(`  ${cores.verde}✓ ${formatarNumero(msgLimpas)} mensagens removidas${cores.reset}`)
    totalLimpo += msgLimpas
  } else {
    console.log(`  ${cores.cinza}Nenhuma mensagem antiga encontrada${cores.reset}`)
  }

  // 2. Limpar sessões do IA Tutor (> 30 dias)
  console.log(`${cores.amarelo}→ Limpando sessões do IA Tutor (> 30 dias)...${cores.reset}`)
  const sessoesLimpas = await limparSessoesIA(30)
  if (sessoesLimpas > 0) {
    console.log(`  ${cores.verde}✓ ${formatarNumero(sessoesLimpas)} sessões removidas${cores.reset}`)
    totalLimpo += sessoesLimpas
  } else {
    console.log(`  ${cores.cinza}Nenhuma sessão antiga encontrada${cores.reset}`)
  }

  // 3. Limpar tempo de uso (> 90 dias)
  console.log(`${cores.amarelo}→ Limpando registros de tempo de uso (> 90 dias)...${cores.reset}`)
  const tempoLimpo = await limparTempoUso(90)
  if (tempoLimpo > 0) {
    console.log(`  ${cores.verde}✓ ${formatarNumero(tempoLimpo)} registros removidos${cores.reset}`)
    totalLimpo += tempoLimpo
  } else {
    console.log(`  ${cores.cinza}Nenhum registro antigo encontrado${cores.reset}`)
  }

  // 4. Limpar feedback do IA (> 90 dias)
  console.log(`${cores.amarelo}→ Limpando feedback do IA Tutor (> 90 dias)...${cores.reset}`)
  const feedbackLimpo = await limparFeedbackIA(90)
  if (feedbackLimpo > 0) {
    console.log(`  ${cores.verde}✓ ${formatarNumero(feedbackLimpo)} feedbacks removidos${cores.reset}`)
    totalLimpo += feedbackLimpo
  } else {
    console.log(`  ${cores.cinza}Nenhum feedback antigo encontrado${cores.reset}`)
  }

  console.log(`\n${cores.negrito}${cores.verde}═══════════════════════════════════════════════════════════${cores.reset}`)
  console.log(`${cores.negrito}${cores.verde}   TOTAL: ${formatarNumero(totalLimpo)} registros removidos${cores.reset}`)
  console.log(`${cores.negrito}${cores.verde}═══════════════════════════════════════════════════════════${cores.reset}\n`)
}

// ═══════════════════════════════════════════════════════════════════════════
// RELATÓRIO
// ═══════════════════════════════════════════════════════════════════════════

function imprimirRelatorio(diag: Diagnostico): void {
  console.log(`\n${cores.negrito}${cores.azul}═══════════════════════════════════════════════════════════${cores.reset}`)
  console.log(`${cores.negrito}${cores.azul}   RELATÓRIO${cores.reset}`)
  console.log(`${cores.negrito}${cores.azul}═══════════════════════════════════════════════════════════${cores.reset}\n`)

  // Resumo
  console.log(`${cores.negrito}RESUMO:${cores.reset}`)
  console.log(`  Total de tabelas: ${diag.tabelas.length}`)
  console.log(`  Tabelas vazias: ${diag.tabelasVazias.length}`)
  console.log(`  Tabelas com > 1000 registros: ${diag.tabelasGrandes.length}`)
  console.log(`  Tamanho estimado: ${formatarBytes(diag.totalEstimado)}`)

  // Maiores tabelas
  if (diag.tabelasGrandes.length > 0) {
    console.log(`\n${cores.negrito}MAIORES TABELAS:${cores.reset}`)
    for (const t of diag.tabelasGrandes.slice(0, 10)) {
      const barra = '█'.repeat(Math.min(30, Math.floor(t.registros / 100)))
      console.log(`  ${t.nome.padEnd(25)} ${formatarNumero(t.registros).padStart(10)} ${cores.verde}${barra}${cores.reset}`)
    }
  }

  // Dados antigos
  if (diag.dadosAntigos.length > 0) {
    console.log(`\n${cores.negrito}${cores.amarelo}DADOS ANTIGOS (podem ser limpos):${cores.reset}`)
    for (const d of diag.dadosAntigos) {
      console.log(`  ${cores.amarelo}⚠${cores.reset} ${d.tabela}: ${formatarNumero(d.registros)} registros ${d.periodo}`)
    }
  }

  // Tabelas vazias
  if (diag.tabelasVazias.length > 0) {
    console.log(`\n${cores.negrito}${cores.cinza}TABELAS VAZIAS:${cores.reset}`)
    console.log(`  ${cores.cinza}${diag.tabelasVazias.join(', ')}${cores.reset}`)
  }

  // Sugestões
  if (diag.sugestoes.length > 0) {
    console.log(`\n${cores.negrito}${cores.verde}SUGESTÕES DE OTIMIZAÇÃO:${cores.reset}`)
    for (const s of diag.sugestoes) {
      console.log(`  ${cores.verde}→${cores.reset} ${s}`)
    }
  }

  console.log('')
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const modoOtimizar = args.includes('--otimizar') || args.includes('-o')
  const modoAjuda = args.includes('--help') || args.includes('-h')

  if (modoAjuda) {
    console.log(`
${cores.negrito}Uso:${cores.reset} npx ts-node scripts/otimizar-supabase.ts [opções]

${cores.negrito}Opções:${cores.reset}
  --otimizar, -o    Executar limpeza automática de dados antigos
  --help, -h        Mostrar esta ajuda

${cores.negrito}Exemplos:${cores.reset}
  npx ts-node scripts/otimizar-supabase.ts           # Apenas diagnóstico
  npx ts-node scripts/otimizar-supabase.ts -o        # Diagnóstico + otimização
`)
    return
  }

  console.log(`\n${cores.negrito}🔍 Iniciando análise do Supabase...${cores.reset}`)
  console.log(`${cores.cinza}URL: ${supabaseUrl}${cores.reset}`)

  try {
    // Sempre executar diagnóstico
    const diagnostico = await executarDiagnostico()
    imprimirRelatorio(diagnostico)

    // Executar otimização se solicitado
    if (modoOtimizar) {
      console.log(`${cores.amarelo}⚠ Modo de otimização ativado!${cores.reset}`)
      console.log(`${cores.amarelo}  Isso irá DELETAR dados antigos permanentemente.${cores.reset}`)
      console.log(`${cores.amarelo}  Pressione Ctrl+C em 5 segundos para cancelar...${cores.reset}\n`)

      await new Promise(resolve => setTimeout(resolve, 5000))

      await executarOtimizacao()

      // Refazer diagnóstico após otimização
      console.log(`${cores.cinza}Verificando resultado da otimização...${cores.reset}`)
      const diagnosticoFinal = await executarDiagnostico()
      imprimirRelatorio(diagnosticoFinal)
    } else {
      console.log(`${cores.cinza}Dica: Execute com --otimizar para limpar dados antigos automaticamente${cores.reset}\n`)
    }

  } catch (error) {
    console.error(`\n${cores.vermelho}❌ Erro: ${error}${cores.reset}`)
    process.exit(1)
  }
}

main()
