/**
 * ================================================================
 * IMPORTACAO DE IMAGENS - QUESTOES ENEM 2022/2023
 * ================================================================
 *
 * Busca imagens da API api.enem.dev, faz upload para o Supabase
 * Storage e adiciona elementos de imagem no banco de dados.
 *
 * Fases:
 *   1. Diagnostico - identifica questoes que precisam de imagens
 *   2. Inventario - verifica o que ja existe no storage
 *   3. Download/Upload - baixa imagens e envia ao storage
 *   4. Atualizar DB - insere elementos de imagem no banco
 *
 * Uso:
 *   npx tsx scripts/corrigir-imagens-enem-2022-2023.ts --dry-run
 *   npx tsx scripts/corrigir-imagens-enem-2022-2023.ts --year 2023 --limit 5
 *   npx tsx scripts/corrigir-imagens-enem-2022-2023.ts --phase 1
 *   npx tsx scripts/corrigir-imagens-enem-2022-2023.ts
 *
 * Variaveis de ambiente necessarias:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import 'dotenv/config'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACAO
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const STORAGE_BUCKET = 'enem-imagens'
const STORAGE_BASE_URL = `https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/${STORAGE_BUCKET}`
const API_BASE = 'https://api.enem.dev/v1'
const BATCH_SIZE = 10
const DOWNLOAD_TIMEOUT = 15000

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

interface QuestaoDB {
  id: string
  ano: number
  dia: number
  numero: number
  area: string
  elementos: ElementoEnem[] | null
  tem_imagem: boolean
  tem_imagem_alternativa: boolean
  alt_a_imagem: string | null
  alt_b_imagem: string | null
  alt_c_imagem: string | null
  alt_d_imagem: string | null
  alt_e_imagem: string | null
}

interface QuestaoAPI {
  index: number
  year: number
  files: string[]
  alternatives: { letter: string; file: string | null }[]
}

interface ImagemPendente {
  questaoId: string
  questaoNumero: number
  ano: number
  dia: number
  tipoImagem: 'enunciado' | 'alternativa'
  letra?: string // A-E para alternativas
  urlOrigem: string
  caminhoStorage: string
  urlStorage: string
}

interface Relatorio {
  ano: number
  totalQuestoesAPI: number
  totalQuestoesDB: number
  questoesComImagemAPI: number
  questoesSemImagemDB: number
  imagensJaNoStorage: number
  imagensParaBaixar: number
  imagensBaixadas: number
  imagensComErro: number
  dbAtualizadas: number
  dbErros: number
}

// ═══════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════

function log(msg: string, emoji = '') {
  const prefix = emoji ? `${emoji} ` : ''
  console.log(`  ${prefix}${msg}`)
}

function logSection(title: string) {
  console.log('\n' + '═'.repeat(70))
  console.log(`  ${title}`)
  console.log('═'.repeat(70))
}

function logSubsection(title: string) {
  console.log('\n  ' + '─'.repeat(60))
  console.log(`  ${title}`)
  console.log('  ' + '─'.repeat(60))
}

function criarCliente(): SupabaseClient {
  if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL nao configurada')
  if (!SUPABASE_SERVICE_KEY) throw new Error('SUPABASE_SERVICE_KEY nao configurada')
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

function extensaoPorContentType(contentType: string): string {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  if (contentType.includes('gif')) return 'gif'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('svg')) return 'svg'
  return 'png' // fallback
}

function extensaoPorUrl(url: string): string {
  const match = url.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i)
  if (match) return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase()
  return 'png'
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ═══════════════════════════════════════════════════════════════════
// FASE 1: DIAGNOSTICO
// ═══════════════════════════════════════════════════════════════════

async function buscarQuestoesAPI(ano: number): Promise<QuestaoAPI[]> {
  const todas: QuestaoAPI[] = []
  let offset = 0
  const limit = 50

  while (true) {
    const url = `${API_BASE}/exams/${ano}/questions?offset=${offset}&limit=${limit}`
    log(`Buscando ${url}...`)

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Studao-Platform/1.0' }
    })

    if (!response.ok) {
      if (response.status === 404) {
        log(`Ano ${ano} nao encontrado na API (404)`, '⚠️')
        break
      }
      throw new Error(`API retornou ${response.status} para ${url}`)
    }

    const data = await response.json()
    const questoes = data.questions || []
    if (questoes.length === 0) break

    for (const q of questoes) {
      todas.push({
        index: q.index,
        year: q.year,
        files: q.files || [],
        alternatives: (q.alternatives || []).map((a: any) => ({
          letter: a.letter,
          file: a.file || null
        }))
      })
    }

    offset += limit
    if (questoes.length < limit) break
    await sleep(500) // respeitar rate limit
  }

  return todas
}

async function fase1Diagnostico(supabase: SupabaseClient, anos: number[], limite?: number): Promise<Map<number, { api: QuestaoAPI[]; db: QuestaoDB[]; pendentes: ImagemPendente[] }>> {
  logSection('FASE 1: DIAGNOSTICO')

  const resultado = new Map<number, { api: QuestaoAPI[]; db: QuestaoDB[]; pendentes: ImagemPendente[] }>()

  for (const ano of anos) {
    logSubsection(`ENEM ${ano}`)

    // 1. Buscar da API
    log('Buscando questoes na API enem.dev...')
    let questoesAPI: QuestaoAPI[]
    try {
      questoesAPI = await buscarQuestoesAPI(ano)
    } catch (err: any) {
      log(`Erro ao buscar API: ${err.message}`, '❌')
      questoesAPI = []
    }
    log(`${questoesAPI.length} questoes encontradas na API`, '📋')

    // 2. Buscar do banco
    log('Buscando questoes no banco...')
    let query = supabase
      .from('questoes_enem')
      .select('id, ano, dia, numero, area, elementos, tem_imagem, tem_imagem_alternativa, alt_a_imagem, alt_b_imagem, alt_c_imagem, alt_d_imagem, alt_e_imagem')
      .eq('ano', ano)
      .order('numero', { ascending: true })

    if (limite) query = query.limit(limite)

    const { data: questoesDB, error } = await query
    if (error) throw new Error(`Erro ao buscar banco: ${error.message}`)
    log(`${questoesDB?.length || 0} questoes no banco`, '📋')

    if (!questoesDB || questoesDB.length === 0 || questoesAPI.length === 0) {
      resultado.set(ano, { api: questoesAPI, db: questoesDB || [], pendentes: [] })
      continue
    }

    // 3. Mapear API -> DB por numero
    const dbPorNumero = new Map<number, QuestaoDB>()
    for (const q of questoesDB) {
      dbPorNumero.set(q.numero, q as QuestaoDB)
    }

    // 4. Identificar imagens faltantes
    const pendentes: ImagemPendente[] = []
    let questoesComImagemAPI = 0
    let questoesSemImagemDB = 0

    for (const apiQ of questoesAPI) {
      const dbQ = dbPorNumero.get(apiQ.index)
      if (!dbQ) continue

      // Verificar imagens do enunciado
      if (apiQ.files && apiQ.files.length > 0) {
        questoesComImagemAPI++

        // Verificar se ja tem imagem no DB
        const temImagemElemento = dbQ.elementos?.some(
          (e: ElementoEnem) => e.tipo === 'imagem' && e.arquivo && !/^(nan|none|null|undefined|\s*)$/i.test(e.arquivo)
        )

        if (!temImagemElemento) {
          questoesSemImagemDB++
          for (let i = 0; i < apiQ.files.length; i++) {
            const ext = extensaoPorUrl(apiQ.files[i])
            const sufixo = apiQ.files.length > 1 ? `_img${i + 1}` : '_figura'
            const caminho = `${ano}/d${dbQ.dia}/enunciados/q${dbQ.numero}${sufixo}.${ext}`
            pendentes.push({
              questaoId: dbQ.id,
              questaoNumero: dbQ.numero,
              ano: dbQ.ano,
              dia: dbQ.dia,
              tipoImagem: 'enunciado',
              urlOrigem: apiQ.files[i],
              caminhoStorage: caminho,
              urlStorage: `${STORAGE_BASE_URL}/${caminho}`
            })
          }
        }
      }

      // Verificar imagens das alternativas
      for (const alt of apiQ.alternatives) {
        if (!alt.file) continue
        const letraLower = alt.letter.toLowerCase()
        const campoDb = `alt_${letraLower}_imagem` as keyof QuestaoDB
        const valorAtual = dbQ[campoDb] as string | null

        if (!valorAtual || /^(nan|none|null|undefined|\s*)$/i.test(valorAtual.trim())) {
          const ext = extensaoPorUrl(alt.file)
          const caminho = `${ano}/d${dbQ.dia}/alternativas/q${dbQ.numero}_alt_${letraLower}.${ext}`
          pendentes.push({
            questaoId: dbQ.id,
            questaoNumero: dbQ.numero,
            ano: dbQ.ano,
            dia: dbQ.dia,
            tipoImagem: 'alternativa',
            letra: alt.letter,
            urlOrigem: alt.file,
            caminhoStorage: caminho,
            urlStorage: `${STORAGE_BASE_URL}/${caminho}`
          })
        }
      }
    }

    log(`Questoes com imagem na API: ${questoesComImagemAPI}`, '📊')
    log(`Questoes SEM imagem no DB: ${questoesSemImagemDB}`, '📊')
    log(`Imagens pendentes (enunciado + alternativas): ${pendentes.length}`, '📊')

    resultado.set(ano, { api: questoesAPI, db: questoesDB as QuestaoDB[], pendentes })
  }

  return resultado
}

// ═══════════════════════════════════════════════════════════════════
// FASE 2: INVENTARIO DO STORAGE
// ═══════════════════════════════════════════════════════════════════

async function listarArquivosStorage(supabase: SupabaseClient, pasta: string): Promise<Set<string>> {
  const caminhos = new Set<string>()

  async function listarRecursivo(prefix: string) {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list(prefix, { limit: 1000 })
    if (error || !data) return

    for (const item of data) {
      const caminhoCompleto = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id) {
        // E um arquivo
        caminhos.add(caminhoCompleto)
      } else {
        // E uma pasta
        await listarRecursivo(caminhoCompleto)
      }
    }
  }

  await listarRecursivo(pasta)
  return caminhos
}

async function fase2Inventario(
  supabase: SupabaseClient,
  dados: Map<number, { api: QuestaoAPI[]; db: QuestaoDB[]; pendentes: ImagemPendente[] }>
): Promise<{ paraDownload: ImagemPendente[]; jaNoStorage: ImagemPendente[] }> {
  logSection('FASE 2: INVENTARIO DO STORAGE')

  const paraDownload: ImagemPendente[] = []
  const jaNoStorage: ImagemPendente[] = []

  for (const [ano, { pendentes }] of dados) {
    if (pendentes.length === 0) {
      log(`${ano}: Nenhuma imagem pendente`, '✅')
      continue
    }

    log(`Listando arquivos no storage para ${ano}...`)
    const arquivos = await listarArquivosStorage(supabase, String(ano))
    log(`${arquivos.size} arquivos encontrados no storage para ${ano}`, '📁')

    for (const p of pendentes) {
      if (arquivos.has(p.caminhoStorage)) {
        jaNoStorage.push(p)
      } else {
        paraDownload.push(p)
      }
    }
  }

  log(`\nResumo:`, '📊')
  log(`  Ja no storage: ${jaNoStorage.length}`)
  log(`  Para download: ${paraDownload.length}`)

  return { paraDownload, jaNoStorage }
}

// ═══════════════════════════════════════════════════════════════════
// FASE 3: DOWNLOAD E UPLOAD
// ═══════════════════════════════════════════════════════════════════

async function downloadEUpload(
  supabase: SupabaseClient,
  imagem: ImagemPendente
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    // Download
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT)

    const response = await fetch(imagem.urlOrigem, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Studao-Platform/1.0' }
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return { sucesso: false, erro: `HTTP ${response.status}` }
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    if (!contentType.includes('image')) {
      return { sucesso: false, erro: `Content-Type invalido: ${contentType}` }
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length < 100) {
      return { sucesso: false, erro: `Imagem muito pequena: ${buffer.length} bytes` }
    }

    // Upload para Supabase Storage
    const ext = extensaoPorContentType(contentType)
    // Ajustar extensao no caminho se diferente
    let caminhoFinal = imagem.caminhoStorage
    const extAtual = caminhoFinal.split('.').pop()
    if (extAtual && extAtual !== ext) {
      caminhoFinal = caminhoFinal.replace(`.${extAtual}`, `.${ext}`)
    }

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(caminhoFinal, buffer, {
        contentType,
        upsert: true
      })

    if (uploadError) {
      return { sucesso: false, erro: `Upload falhou: ${uploadError.message}` }
    }

    // Atualizar URL final
    imagem.caminhoStorage = caminhoFinal
    imagem.urlStorage = `${STORAGE_BASE_URL}/${caminhoFinal}`

    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err.message || String(err) }
  }
}

async function fase3DownloadUpload(
  supabase: SupabaseClient,
  paraDownload: ImagemPendente[],
  dryRun: boolean
): Promise<{ baixadas: ImagemPendente[]; erros: { imagem: ImagemPendente; erro: string }[] }> {
  logSection('FASE 3: DOWNLOAD E UPLOAD')

  if (paraDownload.length === 0) {
    log('Nenhuma imagem para baixar', '✅')
    return { baixadas: [], erros: [] }
  }

  if (dryRun) {
    log(`[DRY-RUN] ${paraDownload.length} imagens seriam baixadas e enviadas ao storage`, '📋')
    for (const p of paraDownload.slice(0, 10)) {
      log(`  Q${p.questaoNumero} ${p.tipoImagem}${p.letra ? ` ${p.letra}` : ''}: ${p.urlOrigem.substring(0, 60)}...`)
    }
    if (paraDownload.length > 10) log(`  ... e mais ${paraDownload.length - 10}`)
    return { baixadas: [], erros: [] }
  }

  log(`Baixando e enviando ${paraDownload.length} imagens em lotes de ${BATCH_SIZE}...`)

  const baixadas: ImagemPendente[] = []
  const erros: { imagem: ImagemPendente; erro: string }[] = []

  for (let i = 0; i < paraDownload.length; i += BATCH_SIZE) {
    const lote = paraDownload.slice(i, i + BATCH_SIZE)
    const loteNum = Math.floor(i / BATCH_SIZE) + 1
    const totalLotes = Math.ceil(paraDownload.length / BATCH_SIZE)

    log(`Lote ${loteNum}/${totalLotes} (${lote.length} imagens)...`)

    const resultados = await Promise.all(
      lote.map(img => downloadEUpload(supabase, img))
    )

    for (let j = 0; j < lote.length; j++) {
      if (resultados[j].sucesso) {
        baixadas.push(lote[j])
      } else {
        erros.push({ imagem: lote[j], erro: resultados[j].erro || 'desconhecido' })
        log(`  ERRO Q${lote[j].questaoNumero}: ${resultados[j].erro}`, '❌')
      }
    }

    // Pausa entre lotes
    if (i + BATCH_SIZE < paraDownload.length) {
      await sleep(1000)
    }
  }

  log(`\nDownload concluido:`, '📊')
  log(`  Sucesso: ${baixadas.length}`)
  log(`  Erros: ${erros.length}`)

  return { baixadas, erros }
}

// ═══════════════════════════════════════════════════════════════════
// FASE 4: ATUALIZAR BANCO DE DADOS
// ═══════════════════════════════════════════════════════════════════

async function fase4AtualizarDB(
  supabase: SupabaseClient,
  imagensDisponiveis: ImagemPendente[],
  dryRun: boolean
): Promise<{ atualizadas: number; erros: number }> {
  logSection('FASE 4: ATUALIZAR BANCO DE DADOS')

  if (imagensDisponiveis.length === 0) {
    log('Nenhuma imagem para inserir no banco', '✅')
    return { atualizadas: 0, erros: 0 }
  }

  // Agrupar por questao
  const porQuestao = new Map<string, ImagemPendente[]>()
  for (const img of imagensDisponiveis) {
    const lista = porQuestao.get(img.questaoId) || []
    lista.push(img)
    porQuestao.set(img.questaoId, lista)
  }

  log(`${porQuestao.size} questoes a atualizar com ${imagensDisponiveis.length} imagens`)

  if (dryRun) {
    log('\n[DRY-RUN] Atualizacoes que seriam feitas:', '📋')
    for (const [id, imgs] of porQuestao) {
      const enunciados = imgs.filter(i => i.tipoImagem === 'enunciado')
      const alternativas = imgs.filter(i => i.tipoImagem === 'alternativa')
      log(`  Q${imgs[0].questaoNumero}: ${enunciados.length} enunciado(s), ${alternativas.length} alternativa(s)`)
    }
    return { atualizadas: 0, erros: 0 }
  }

  let atualizadas = 0
  let erros = 0

  for (const [questaoId, imagens] of porQuestao) {
    try {
      // Buscar questao atualizada
      const { data: questao, error: fetchErr } = await supabase
        .from('questoes_enem')
        .select('elementos, tem_imagem, tem_imagem_alternativa')
        .eq('id', questaoId)
        .single()

      if (fetchErr || !questao) {
        log(`Erro ao buscar Q${imagens[0].questaoNumero}: ${fetchErr?.message}`, '❌')
        erros++
        continue
      }

      const elementos: ElementoEnem[] = questao.elementos || []
      const updates: Record<string, any> = {}

      // Inserir imagens do enunciado
      const enunciados = imagens.filter(i => i.tipoImagem === 'enunciado')
      if (enunciados.length > 0) {
        // Encontrar posicao: antes do primeiro 'comando'
        let posInsercao = elementos.length
        for (let i = 0; i < elementos.length; i++) {
          if (elementos[i].tipo === 'comando') {
            posInsercao = i
            break
          }
        }

        // Inserir elementos de imagem
        const novosElementos: ElementoEnem[] = enunciados.map((img, idx) => ({
          tipo: 'imagem' as const,
          arquivo: img.urlStorage,
          ordem: posInsercao + idx + 1,
          legenda: null,
          descricao: null
        }))

        elementos.splice(posInsercao, 0, ...novosElementos)

        // Recalcular ordem
        for (let i = 0; i < elementos.length; i++) {
          elementos[i].ordem = i + 1
        }

        updates.elementos = elementos
        updates.tem_imagem = true
      }

      // Atualizar imagens das alternativas
      const alternativas = imagens.filter(i => i.tipoImagem === 'alternativa')
      if (alternativas.length > 0) {
        for (const alt of alternativas) {
          if (alt.letra) {
            updates[`alt_${alt.letra.toLowerCase()}_imagem`] = alt.urlStorage
          }
        }
        updates.tem_imagem_alternativa = true
      }

      // Aplicar updates
      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from('questoes_enem')
          .update(updates)
          .eq('id', questaoId)

        if (updateErr) {
          log(`Erro ao atualizar Q${imagens[0].questaoNumero}: ${updateErr.message}`, '❌')
          erros++
        } else {
          atualizadas++
        }
      }
    } catch (err: any) {
      log(`Erro inesperado Q${imagens[0].questaoNumero}: ${err.message}`, '❌')
      erros++
    }
  }

  log(`\nAtualizacoes:`, '📊')
  log(`  Sucesso: ${atualizadas}`)
  log(`  Erros: ${erros}`)

  return { atualizadas, erros }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const yearIndex = args.indexOf('--year')
  const yearFilter = yearIndex !== -1 ? parseInt(args[yearIndex + 1], 10) : undefined
  const limitIndex = args.indexOf('--limit')
  const limite = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : undefined
  const phaseIndex = args.indexOf('--phase')
  const phaseFilter = phaseIndex !== -1 ? parseInt(args[phaseIndex + 1], 10) : undefined
  const skipDownload = args.includes('--skip-download')
  const ajuda = args.includes('--help') || args.includes('-h')

  if (ajuda) {
    console.log(`
Importacao de Imagens - ENEM 2022/2023
══════════════════════════════════════

Uso:
  npx tsx scripts/corrigir-imagens-enem-2022-2023.ts [opcoes]

Opcoes:
  --help, -h         Mostra esta ajuda
  --dry-run          Apenas diagnosticar, sem modificar
  --year <2022|2023> Focar em um ano especifico
  --limit <N>        Processar no maximo N questoes
  --phase <1|2|3|4>  Rodar apenas uma fase
  --skip-download    Pular fase 3 (usar imagens ja no storage)

Fases:
  1  Diagnostico - identifica questoes com imagens faltantes
  2  Inventario - verifica o que existe no Supabase Storage
  3  Download/Upload - baixa imagens da API e envia ao storage
  4  Atualizar DB - insere elementos de imagem no banco

Exemplos:
  npx tsx scripts/corrigir-imagens-enem-2022-2023.ts --dry-run
  npx tsx scripts/corrigir-imagens-enem-2022-2023.ts --year 2023 --limit 5
  npx tsx scripts/corrigir-imagens-enem-2022-2023.ts --phase 1
  npx tsx scripts/corrigir-imagens-enem-2022-2023.ts
`)
    return
  }

  const anos = yearFilter ? [yearFilter] : [2022, 2023]

  console.log('\n' + '═'.repeat(70))
  console.log('  IMPORTACAO DE IMAGENS - ENEM 2022/2023')
  console.log('═'.repeat(70))
  console.log(`  Modo: ${dryRun ? 'DRY-RUN (sem salvar)' : 'PRODUCAO (salvando)'}`)
  console.log(`  Anos: ${anos.join(', ')}`)
  if (limite) console.log(`  Limite: ${limite} questoes por ano`)
  if (phaseFilter) console.log(`  Fase: ${phaseFilter}`)
  if (skipDownload) console.log(`  Pular download: sim`)
  console.log('')

  try {
    const supabase = criarCliente()
    log('Conectado ao Supabase', '✅')

    // FASE 1: Diagnostico
    const dados = await fase1Diagnostico(supabase, anos, limite)

    if (phaseFilter === 1) {
      log('\n[Fase 1 concluida]')
      return
    }

    // FASE 2: Inventario
    const { paraDownload, jaNoStorage } = await fase2Inventario(supabase, dados)

    if (phaseFilter === 2) {
      log('\n[Fase 2 concluida]')
      return
    }

    // FASE 3: Download e Upload
    let baixadas: ImagemPendente[] = []
    if (!skipDownload) {
      const resultado3 = await fase3DownloadUpload(supabase, paraDownload, dryRun)
      baixadas = resultado3.baixadas
    } else {
      log('\n[Fase 3 pulada - usando imagens ja no storage]')
    }

    if (phaseFilter === 3) {
      log('\n[Fase 3 concluida]')
      return
    }

    // Combinar: imagens ja no storage + recem baixadas
    const imagensDisponiveis = [...jaNoStorage, ...baixadas]

    // FASE 4: Atualizar DB
    const resultado4 = await fase4AtualizarDB(supabase, imagensDisponiveis, dryRun)

    // Relatorio final
    logSection('RELATORIO FINAL')
    for (const [ano, { api, db, pendentes }] of dados) {
      log(`\nENEM ${ano}:`, '📊')
      log(`  Questoes na API: ${api.length}`)
      log(`  Questoes no DB: ${db.length}`)
      log(`  Imagens pendentes: ${pendentes.length}`)
    }
    log(`\nImagens ja no storage: ${jaNoStorage.length}`)
    log(`Imagens baixadas: ${baixadas.length}`)
    log(`Questoes atualizadas no DB: ${resultado4.atualizadas}`)
    log(`Erros no DB: ${resultado4.erros}`)

    if (dryRun) {
      log('\n[DRY-RUN] Nenhuma alteracao foi salva.', '⚠️')
      log('Execute sem --dry-run para aplicar as correcoes.')
    }

    console.log('\n' + '═'.repeat(70))
    console.log('  CONCLUIDO')
    console.log('═'.repeat(70) + '\n')

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('\n❌ Erro:', msg)
    process.exit(1)
  }
}

main()
