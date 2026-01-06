/**
 * ================================================================
 * DIAGNÓSTICO E CORREÇÃO DE IMAGENS - SUPABASE ENEM
 * ================================================================
 *
 * Este script analisa e corrige problemas com imagens no banco de
 * dados Supabase, especificamente para questões do ENEM.
 *
 * Uso:
 *   npx tsx scripts/diagnostico-imagens-supabase.ts
 *   npx tsx scripts/diagnostico-imagens-supabase.ts --fix
 *   npx tsx scripts/diagnostico-imagens-supabase.ts --test-urls
 *
 * Variáveis de ambiente necessárias:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Padrões válidos de URLs de imagem
const PADROES_URL_VALIDOS = [
  /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i,        // URLs diretas com extensão
  /^https?:\/\/.*\/storage\/v1\/object\/.*$/i,                        // Supabase Storage
  /^https?:\/\/.*supabase.*\/storage\/.*$/i,                         // Supabase Storage alternativo
  /^https?:\/\/api\.enem\.dev\/.*$/i,                                // API ENEM
  /^https?:\/\/.*cloudinary.*$/i,                                     // Cloudinary
  /^https?:\/\/.*imgur.*$/i,                                          // Imgur
  /^https?:\/\/.*s3\.amazonaws\.com.*$/i,                            // AWS S3
  /^https?:\/\/.*googleusercontent.*$/i,                             // Google
  /^https?:\/\/.*blob:.*$/i,                                          // Blob URLs (não ideais mas válidos)
  /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i,          // Base64 Data URIs
]

// Padrões INVÁLIDOS que devem ser removidos/corrigidos
const PADROES_INVALIDOS = [
  /^nan$/i,
  /^none$/i,
  /^null$/i,
  /^undefined$/i,
  /^NaN$/,
  /^\s*$/,                          // Vazio ou espaços
  /^http:\/\/localhost/i,          // URLs locais
  /^file:\/\//i,                    // URLs de arquivo local
  /^\[object/i,                     // Objetos serializados incorretamente
  /^<img/i,                         // Tags HTML
]

// ═══════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════

interface QuestaoImagem {
  id: string
  id_api: string | null
  ano_prova: number
  numero_questao: number
  area: string
  imagem_principal: string | null
  imagens_extras: string[] | null
  imagem_a: string | null
  imagem_b: string | null
  imagem_c: string | null
  imagem_d: string | null
  imagem_e: string | null
}

interface ProblemaImagem {
  questao_id: string
  id_api: string | null
  campo: string
  url: string
  problema: string
  sugestao: string
}

interface ResultadoTeste {
  url: string
  status: 'ok' | 'erro' | 'timeout' | 'invalido'
  statusCode?: number
  contentType?: string
  erro?: string
  tempoMs?: number
}

interface RelatorioDiagnostico {
  timestamp: string
  total_questoes: number
  questoes_com_imagens: number
  questoes_sem_imagens: number
  total_urls_imagem: number
  urls_validas: number
  urls_invalidas: number
  urls_testadas: number
  urls_funcionando: number
  urls_quebradas: number
  problemas: ProblemaImagem[]
  resultados_testes: ResultadoTeste[]
}

// ═══════════════════════════════════════════════════════════════════
// FUNÇÕES UTILITÁRIAS
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

function log(msg: string, emoji: string = '📋') {
  console.log(`${emoji} ${msg}`)
}

function logSection(title: string) {
  console.log('\n' + '═'.repeat(70))
  console.log(`  ${title}`)
  console.log('═'.repeat(70))
}

function validarUrlFormato(url: string | null): { valido: boolean; problema?: string } {
  if (!url || typeof url !== 'string') {
    return { valido: false, problema: 'URL nula ou não é string' }
  }

  const urlTrimmed = url.trim()

  // Verificar padrões inválidos
  for (const padrao of PADROES_INVALIDOS) {
    if (padrao.test(urlTrimmed)) {
      return { valido: false, problema: `Valor inválido: ${urlTrimmed.substring(0, 50)}` }
    }
  }

  // Verificar padrões válidos
  for (const padrao of PADROES_URL_VALIDOS) {
    if (padrao.test(urlTrimmed)) {
      return { valido: true }
    }
  }

  // URL não corresponde a nenhum padrão conhecido
  // Verificar se pelo menos é uma URL HTTP válida
  try {
    const parsed = new URL(urlTrimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { valido: true } // URL válida mesmo sem extensão de imagem
    }
  } catch {
    return { valido: false, problema: 'URL malformada' }
  }

  return { valido: false, problema: 'Protocolo não suportado' }
}

async function testarUrl(url: string, timeoutMs: number = 10000): Promise<ResultadoTeste> {
  const inicio = Date.now()

  // Verificar formato primeiro
  const validacao = validarUrlFormato(url)
  if (!validacao.valido) {
    return {
      url,
      status: 'invalido',
      erro: validacao.problema
    }
  }

  // Data URIs são sempre válidos (não precisam de HTTP request)
  if (url.startsWith('data:image/')) {
    return {
      url: url.substring(0, 50) + '...',
      status: 'ok',
      contentType: 'data-uri',
      tempoMs: 0
    }
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(url, {
      method: 'HEAD', // Apenas verificar headers, não baixar conteúdo
      signal: controller.signal,
      headers: {
        'User-Agent': 'Studao-Platform/1.0 ImageChecker'
      }
    })

    clearTimeout(timeoutId)
    const tempoMs = Date.now() - inicio

    const contentType = response.headers.get('content-type') || ''
    const isImage = contentType.startsWith('image/') ||
                   contentType.includes('octet-stream') ||
                   response.ok

    if (response.ok && isImage) {
      return {
        url,
        status: 'ok',
        statusCode: response.status,
        contentType,
        tempoMs
      }
    } else {
      return {
        url,
        status: 'erro',
        statusCode: response.status,
        contentType,
        erro: `Status ${response.status}`,
        tempoMs
      }
    }
  } catch (error: any) {
    const tempoMs = Date.now() - inicio

    if (error.name === 'AbortError') {
      return {
        url,
        status: 'timeout',
        erro: `Timeout após ${timeoutMs}ms`,
        tempoMs
      }
    }

    return {
      url,
      status: 'erro',
      erro: error.message,
      tempoMs
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// FUNÇÕES DE DIAGNÓSTICO
// ═══════════════════════════════════════════════════════════════════

async function buscarQuestoes(supabase: SupabaseClient): Promise<QuestaoImagem[]> {
  log('Buscando questões do banco...', '🔍')

  const { data, error } = await supabase
    .from('questoes_enem')
    .select(`
      id,
      id_api,
      ano_prova,
      numero_questao,
      area,
      imagem_principal,
      imagens_extras,
      imagem_a,
      imagem_b,
      imagem_c,
      imagem_d,
      imagem_e
    `)
    .order('ano_prova', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar questões: ${error.message}`)
  }

  log(`Encontradas ${data?.length || 0} questões`, '✅')
  return data || []
}

function analisarImagens(questoes: QuestaoImagem[]): ProblemaImagem[] {
  const problemas: ProblemaImagem[] = []

  log('Analisando imagens de cada questão...', '🔍')

  for (const q of questoes) {
    // Verificar imagem_principal
    if (q.imagem_principal) {
      const validacao = validarUrlFormato(q.imagem_principal)
      if (!validacao.valido) {
        problemas.push({
          questao_id: q.id,
          id_api: q.id_api,
          campo: 'imagem_principal',
          url: q.imagem_principal,
          problema: validacao.problema!,
          sugestao: 'Definir como NULL'
        })
      }
    }

    // Verificar imagens_extras
    if (q.imagens_extras && Array.isArray(q.imagens_extras)) {
      q.imagens_extras.forEach((url, idx) => {
        const validacao = validarUrlFormato(url)
        if (!validacao.valido) {
          problemas.push({
            questao_id: q.id,
            id_api: q.id_api,
            campo: `imagens_extras[${idx}]`,
            url: url,
            problema: validacao.problema!,
            sugestao: 'Remover do array'
          })
        }
      })
    }

    // Verificar imagens das alternativas
    const camposAlt = ['imagem_a', 'imagem_b', 'imagem_c', 'imagem_d', 'imagem_e'] as const
    for (const campo of camposAlt) {
      const valor = q[campo]
      if (valor) {
        const validacao = validarUrlFormato(valor)
        if (!validacao.valido) {
          problemas.push({
            questao_id: q.id,
            id_api: q.id_api,
            campo,
            url: valor,
            problema: validacao.problema!,
            sugestao: 'Definir como NULL'
          })
        }
      }
    }
  }

  return problemas
}

function coletarTodasUrls(questoes: QuestaoImagem[]): string[] {
  const urls = new Set<string>()

  for (const q of questoes) {
    if (q.imagem_principal) urls.add(q.imagem_principal)
    if (q.imagens_extras) {
      q.imagens_extras.forEach(url => url && urls.add(url))
    }
    if (q.imagem_a) urls.add(q.imagem_a)
    if (q.imagem_b) urls.add(q.imagem_b)
    if (q.imagem_c) urls.add(q.imagem_c)
    if (q.imagem_d) urls.add(q.imagem_d)
    if (q.imagem_e) urls.add(q.imagem_e)
  }

  return Array.from(urls).filter(url =>
    url && typeof url === 'string' && url.trim() !== ''
  )
}

async function testarUrls(
  urls: string[],
  maxConcurrent: number = 10,
  maxTestes: number = 100
): Promise<ResultadoTeste[]> {
  // Limitar quantidade para não sobrecarregar
  const urlsParaTestar = urls.slice(0, maxTestes)

  log(`Testando ${urlsParaTestar.length} URLs (max ${maxTestes})...`, '🔗')

  const resultados: ResultadoTeste[] = []

  // Processar em lotes
  for (let i = 0; i < urlsParaTestar.length; i += maxConcurrent) {
    const lote = urlsParaTestar.slice(i, i + maxConcurrent)
    const promessas = lote.map(url => testarUrl(url))
    const resultadosLote = await Promise.all(promessas)
    resultados.push(...resultadosLote)

    // Mostrar progresso
    const progresso = Math.round(((i + lote.length) / urlsParaTestar.length) * 100)
    process.stdout.write(`\r  Progresso: ${progresso}% (${i + lote.length}/${urlsParaTestar.length})`)
  }

  console.log() // Nova linha após progresso
  return resultados
}

// ═══════════════════════════════════════════════════════════════════
// FUNÇÕES DE CORREÇÃO
// ═══════════════════════════════════════════════════════════════════

async function corrigirProblemas(
  supabase: SupabaseClient,
  problemas: ProblemaImagem[]
): Promise<{ corrigidos: number; erros: number }> {
  let corrigidos = 0
  let erros = 0

  log(`Corrigindo ${problemas.length} problemas...`, '🔧')

  // Agrupar por questão
  const porQuestao = new Map<string, ProblemaImagem[]>()
  for (const p of problemas) {
    const lista = porQuestao.get(p.questao_id) || []
    lista.push(p)
    porQuestao.set(p.questao_id, lista)
  }

  for (const [questaoId, problemasQuestao] of porQuestao) {
    try {
      const updates: Record<string, any> = {}

      for (const problema of problemasQuestao) {
        if (problema.campo.startsWith('imagens_extras')) {
          // Para array, precisamos buscar e modificar
          updates.imagens_extras = null // Simplificado: limpar todo array
        } else {
          updates[problema.campo] = null
        }
      }

      const { error } = await supabase
        .from('questoes_enem')
        .update(updates)
        .eq('id', questaoId)

      if (error) {
        console.error(`  ❌ Erro ao corrigir ${questaoId}: ${error.message}`)
        erros++
      } else {
        corrigidos++
      }
    } catch (err: any) {
      console.error(`  ❌ Erro ao corrigir ${questaoId}: ${err.message}`)
      erros++
    }
  }

  return { corrigidos, erros }
}

async function limparUrlsQuebradas(
  supabase: SupabaseClient,
  resultados: ResultadoTeste[]
): Promise<{ atualizados: number }> {
  const urlsQuebradas = new Set(
    resultados
      .filter(r => r.status === 'erro' || r.status === 'timeout')
      .map(r => r.url)
  )

  if (urlsQuebradas.size === 0) {
    log('Nenhuma URL quebrada para limpar', '✅')
    return { atualizados: 0 }
  }

  log(`Limpando ${urlsQuebradas.size} URLs quebradas...`, '🧹')

  // Buscar questões com essas URLs
  const { data: questoes } = await supabase
    .from('questoes_enem')
    .select('id, imagem_principal, imagem_a, imagem_b, imagem_c, imagem_d, imagem_e')

  let atualizados = 0

  for (const q of questoes || []) {
    const updates: Record<string, null> = {}

    if (q.imagem_principal && urlsQuebradas.has(q.imagem_principal)) {
      updates.imagem_principal = null
    }
    if (q.imagem_a && urlsQuebradas.has(q.imagem_a)) {
      updates.imagem_a = null
    }
    if (q.imagem_b && urlsQuebradas.has(q.imagem_b)) {
      updates.imagem_b = null
    }
    if (q.imagem_c && urlsQuebradas.has(q.imagem_c)) {
      updates.imagem_c = null
    }
    if (q.imagem_d && urlsQuebradas.has(q.imagem_d)) {
      updates.imagem_d = null
    }
    if (q.imagem_e && urlsQuebradas.has(q.imagem_e)) {
      updates.imagem_e = null
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('questoes_enem')
        .update(updates)
        .eq('id', q.id)
      atualizados++
    }
  }

  return { atualizados }
}

// ═══════════════════════════════════════════════════════════════════
// RELATÓRIO
// ═══════════════════════════════════════════════════════════════════

function gerarRelatorio(
  questoes: QuestaoImagem[],
  problemas: ProblemaImagem[],
  resultadosTestes: ResultadoTeste[]
): RelatorioDiagnostico {
  const questoesComImagens = questoes.filter(q =>
    q.imagem_principal ||
    (q.imagens_extras && q.imagens_extras.length > 0) ||
    q.imagem_a || q.imagem_b || q.imagem_c || q.imagem_d || q.imagem_e
  )

  const todasUrls = coletarTodasUrls(questoes)
  const urlsValidas = todasUrls.filter(url => validarUrlFormato(url).valido)

  const urlsFuncionando = resultadosTestes.filter(r => r.status === 'ok').length
  const urlsQuebradas = resultadosTestes.filter(r => r.status !== 'ok').length

  return {
    timestamp: new Date().toISOString(),
    total_questoes: questoes.length,
    questoes_com_imagens: questoesComImagens.length,
    questoes_sem_imagens: questoes.length - questoesComImagens.length,
    total_urls_imagem: todasUrls.length,
    urls_validas: urlsValidas.length,
    urls_invalidas: todasUrls.length - urlsValidas.length,
    urls_testadas: resultadosTestes.length,
    urls_funcionando: urlsFuncionando,
    urls_quebradas: urlsQuebradas,
    problemas,
    resultados_testes: resultadosTestes
  }
}

function imprimirRelatorio(relatorio: RelatorioDiagnostico) {
  logSection('RELATÓRIO DE DIAGNÓSTICO - IMAGENS ENEM')

  console.log(`
📅 Data: ${relatorio.timestamp}

📊 ESTATÍSTICAS GERAIS:
   Total de questões:        ${relatorio.total_questoes}
   Com imagens:              ${relatorio.questoes_com_imagens}
   Sem imagens:              ${relatorio.questoes_sem_imagens}

🔗 URLS DE IMAGENS:
   Total de URLs:            ${relatorio.total_urls_imagem}
   URLs válidas (formato):   ${relatorio.urls_validas}
   URLs inválidas (formato): ${relatorio.urls_invalidas}

🌐 TESTES HTTP:
   URLs testadas:            ${relatorio.urls_testadas}
   Funcionando:              ${relatorio.urls_funcionando}
   Quebradas/Timeout:        ${relatorio.urls_quebradas}
`)

  if (relatorio.problemas.length > 0) {
    logSection('PROBLEMAS ENCONTRADOS')

    // Agrupar por tipo de problema
    const porTipo = new Map<string, ProblemaImagem[]>()
    for (const p of relatorio.problemas) {
      const lista = porTipo.get(p.problema) || []
      lista.push(p)
      porTipo.set(p.problema, lista)
    }

    for (const [tipo, lista] of porTipo) {
      console.log(`\n❌ ${tipo}: ${lista.length} ocorrências`)
      lista.slice(0, 5).forEach(p => {
        console.log(`   - Questão ${p.id_api || p.questao_id}: ${p.campo}`)
      })
      if (lista.length > 5) {
        console.log(`   ... e mais ${lista.length - 5}`)
      }
    }
  }

  if (relatorio.resultados_testes.length > 0) {
    const quebradas = relatorio.resultados_testes.filter(r => r.status !== 'ok')

    if (quebradas.length > 0) {
      logSection('URLS QUEBRADAS (amostra)')

      quebradas.slice(0, 10).forEach(r => {
        const urlShort = r.url.length > 60 ? r.url.substring(0, 60) + '...' : r.url
        console.log(`   ❌ ${r.status.toUpperCase()}: ${urlShort}`)
        if (r.erro) console.log(`      Erro: ${r.erro}`)
      })

      if (quebradas.length > 10) {
        console.log(`\n   ... e mais ${quebradas.length - 10} URLs quebradas`)
      }
    }
  }

  logSection('AÇÕES RECOMENDADAS')

  if (relatorio.urls_invalidas > 0) {
    console.log(`
🔧 CORREÇÃO DE FORMATO:
   Execute com --fix para limpar ${relatorio.urls_invalidas} URLs com formato inválido
   Comando: npx tsx scripts/diagnostico-imagens-supabase.ts --fix
`)
  }

  if (relatorio.urls_quebradas > 0) {
    console.log(`
🔧 LIMPEZA DE URLs QUEBRADAS:
   Execute com --clean-broken para remover ${relatorio.urls_quebradas} URLs inacessíveis
   Comando: npx tsx scripts/diagnostico-imagens-supabase.ts --clean-broken
`)
  }

  if (relatorio.problemas.length === 0 && relatorio.urls_quebradas === 0) {
    console.log('\n✅ Nenhum problema encontrado! O banco está limpo.')
  }
}

// ═══════════════════════════════════════════════════════════════════
// ANÁLISE ESPECÍFICA API ENEM
// ═══════════════════════════════════════════════════════════════════

async function diagnosticarApiEnem() {
  logSection('DIAGNÓSTICO ESPECÍFICO - API ENEM.DEV')

  log('Testando conexão com API enem.dev...', '🔗')

  try {
    // Testar endpoint principal
    const response = await fetch('https://api.enem.dev/v1/exams/2023/questions?limit=5', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Studao-Platform/1.0'
      }
    })

    if (!response.ok) {
      log(`API retornou status ${response.status}`, '❌')
      return
    }

    const data = await response.json()
    const questoes = data.questions || []

    log(`API funcionando! ${questoes.length} questões retornadas`, '✅')

    // Verificar estrutura das imagens
    console.log('\n📋 Estrutura de imagens na API:')

    let questoesComFiles = 0
    let questoesComAltFiles = 0

    for (const q of questoes) {
      if (q.files && q.files.length > 0) {
        questoesComFiles++
        console.log(`   Questão ${q.index}/${q.year}: ${q.files.length} imagem(ns) no contexto`)

        // Testar primeira imagem
        if (q.files[0]) {
          const teste = await testarUrl(q.files[0], 5000)
          console.log(`      URL: ${q.files[0].substring(0, 60)}...`)
          console.log(`      Status: ${teste.status} ${teste.statusCode ? `(${teste.statusCode})` : ''}`)
        }
      }

      // Verificar imagens nas alternativas
      const alternatives = q.alternatives || []
      const altComFile = alternatives.filter((a: any) => a.file)
      if (altComFile.length > 0) {
        questoesComAltFiles++
        console.log(`   Questão ${q.index}/${q.year}: ${altComFile.length} alternativa(s) com imagem`)
      }
    }

    console.log(`\n📊 Resumo da amostra:`)
    console.log(`   Questões com imagem no contexto:   ${questoesComFiles}/${questoes.length}`)
    console.log(`   Questões com imagem em alternativa: ${questoesComAltFiles}/${questoes.length}`)

    // Verificar campos retornados
    if (questoes.length > 0) {
      const primeiraQuestao = questoes[0]
      console.log('\n📋 Campos de imagem na resposta da API:')
      console.log(`   files: ${JSON.stringify(primeiraQuestao.files || 'não existe')}`)
      console.log(`   alternatives[0].file: ${primeiraQuestao.alternatives?.[0]?.file || 'não existe'}`)
    }

  } catch (error: any) {
    log(`Erro ao conectar com API: ${error.message}`, '❌')
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2)
  const modoFix = args.includes('--fix')
  const modoTestUrls = args.includes('--test-urls')
  const modoCleanBroken = args.includes('--clean-broken')
  const modoApiDiag = args.includes('--api-diag')
  const modoAjuda = args.includes('--help') || args.includes('-h')

  if (modoAjuda) {
    console.log(`
Diagnóstico e Correção de Imagens - Supabase ENEM
═══════════════════════════════════════════════════

Uso:
  npx tsx scripts/diagnostico-imagens-supabase.ts [opções]

Opções:
  --help, -h       Mostra esta ajuda
  --test-urls      Testa URLs HTTP (mais lento, verifica se imagens existem)
  --fix            Corrige problemas de formato encontrados (define como NULL)
  --clean-broken   Remove URLs quebradas do banco (requer --test-urls primeiro)
  --api-diag       Diagnóstico específico da API enem.dev

Exemplos:
  npx tsx scripts/diagnostico-imagens-supabase.ts              # Apenas diagnóstico
  npx tsx scripts/diagnostico-imagens-supabase.ts --test-urls  # Com testes HTTP
  npx tsx scripts/diagnostico-imagens-supabase.ts --fix        # Corrigir formato
  npx tsx scripts/diagnostico-imagens-supabase.ts --api-diag   # Testar API ENEM

Variáveis de ambiente:
  NEXT_PUBLIC_SUPABASE_URL    URL do projeto Supabase
  SUPABASE_SERVICE_KEY        Chave de serviço (admin)
`)
    return
  }

  logSection('DIAGNÓSTICO DE IMAGENS - SUPABASE ENEM')
  log(`Modo: ${modoFix ? 'CORREÇÃO' : modoTestUrls ? 'TESTE URLs' : 'DIAGNÓSTICO'}`, '🔧')

  // Diagnóstico da API ENEM
  if (modoApiDiag) {
    await diagnosticarApiEnem()
    return
  }

  // Criar cliente
  const supabase = criarCliente()
  log('Conectado ao Supabase', '✅')

  // Buscar questões
  const questoes = await buscarQuestoes(supabase)

  if (questoes.length === 0) {
    log('Nenhuma questão encontrada no banco', '⚠️')
    return
  }

  // Analisar formato das imagens
  const problemas = analisarImagens(questoes)
  log(`${problemas.length} problemas de formato encontrados`, problemas.length > 0 ? '⚠️' : '✅')

  // Testar URLs se solicitado
  let resultadosTestes: ResultadoTeste[] = []
  if (modoTestUrls || modoCleanBroken) {
    const todasUrls = coletarTodasUrls(questoes)
    const urlsValidas = todasUrls.filter(url => validarUrlFormato(url).valido)
    resultadosTestes = await testarUrls(urlsValidas)
  }

  // Gerar e imprimir relatório
  const relatorio = gerarRelatorio(questoes, problemas, resultadosTestes)
  imprimirRelatorio(relatorio)

  // Correções
  if (modoFix && problemas.length > 0) {
    logSection('EXECUTANDO CORREÇÕES')
    const resultado = await corrigirProblemas(supabase, problemas)
    log(`Correções: ${resultado.corrigidos} sucesso, ${resultado.erros} erros`, '✅')
  }

  if (modoCleanBroken && resultadosTestes.length > 0) {
    logSection('LIMPANDO URLs QUEBRADAS')
    const resultado = await limparUrlsQuebradas(supabase, resultadosTestes)
    log(`${resultado.atualizados} questões atualizadas`, '✅')
  }

  // Salvar relatório JSON
  const caminhoRelatorio = `./diagnostico-imagens-${Date.now()}.json`
  const fs = await import('fs')
  fs.writeFileSync(caminhoRelatorio, JSON.stringify(relatorio, null, 2))
  log(`Relatório salvo em: ${caminhoRelatorio}`, '📄')
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error.message)
  process.exit(1)
})
