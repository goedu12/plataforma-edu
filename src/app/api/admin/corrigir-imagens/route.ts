export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { SupabaseClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════════
// API DE CORREÇÃO DE IMAGENS - ENEM 2022/2023
// ═══════════════════════════════════════════════════════════════════
// GET  /api/admin/corrigir-imagens         - Diagnóstico (fases 1+2)
// POST /api/admin/corrigir-imagens         - Corrigir (fases 3+4)
//
// Busca imagens da API api.enem.dev, faz upload para Supabase Storage,
// e insere elementos tipo='imagem' no array elementos do banco.

const STORAGE_BUCKET = 'enem-imagens'
const STORAGE_BASE_URL = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/enem-imagens'
const API_BASE = 'https://api.enem.dev/v1'
const BATCH_SIZE = 5
const DOWNLOAD_TIMEOUT = 12000

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
  letra?: string
  urlOrigem: string
  caminhoStorage: string
  urlStorage: string
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

function extensaoPorContentType(contentType: string): string {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg'
  if (contentType.includes('gif')) return 'gif'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('svg')) return 'svg'
  return 'png'
}

function extensaoPorUrl(url: string): string {
  const match = url.match(/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i)
  if (match) return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase()
  return 'png'
}

// ═══════════════════════════════════════════════════════════════════
// FASE 1: DIAGNÓSTICO - buscar API + banco e comparar
// ═══════════════════════════════════════════════════════════════════

async function buscarQuestoesAPI(ano: number): Promise<QuestaoAPI[]> {
  const todas: QuestaoAPI[] = []
  let offset = 0
  const limit = 50

  while (true) {
    const url = `${API_BASE}/exams/${ano}/questions?offset=${offset}&limit=${limit}`
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Studao-Platform/1.0' }
    })

    if (!response.ok) {
      if (response.status === 404) break
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
    await new Promise(r => setTimeout(r, 300))
  }

  return todas
}

async function diagnosticar(
  supabase: SupabaseClient,
  anos: number[],
  limite?: number
): Promise<{
  porAno: Record<number, { totalAPI: number; totalDB: number; pendentes: number; detalhes: ImagemPendente[] }>
  totalPendentes: number
}> {
  const porAno: Record<number, { totalAPI: number; totalDB: number; pendentes: number; detalhes: ImagemPendente[] }> = {}
  let totalPendentes = 0

  for (const ano of anos) {
    const questoesAPI = await buscarQuestoesAPI(ano)

    let query = supabase
      .from('questoes_enem')
      .select('id, ano, dia, numero, area, elementos, tem_imagem, tem_imagem_alternativa, alt_a_imagem, alt_b_imagem, alt_c_imagem, alt_d_imagem, alt_e_imagem')
      .eq('ano', ano)
      .order('numero', { ascending: true })

    if (limite) query = query.limit(limite)

    const { data: questoesDB, error } = await query
    if (error) throw new Error(`Erro ao buscar banco: ${error.message}`)

    const pendentes: ImagemPendente[] = []

    if (questoesDB && questoesDB.length > 0 && questoesAPI.length > 0) {
      const dbPorNumero = new Map<number, QuestaoDB>()
      for (const q of questoesDB) {
        dbPorNumero.set(q.numero, q as QuestaoDB)
      }

      for (const apiQ of questoesAPI) {
        const dbQ = dbPorNumero.get(apiQ.index)
        if (!dbQ) continue

        // Imagens do enunciado
        if (apiQ.files && apiQ.files.length > 0) {
          const temImagemElemento = dbQ.elementos?.some(
            (e: ElementoEnem) => e.tipo === 'imagem' && e.arquivo && !/^(nan|none|null|undefined|\s*)$/i.test(e.arquivo)
          )
          if (!temImagemElemento) {
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

        // Imagens das alternativas
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
    }

    porAno[ano] = {
      totalAPI: questoesAPI.length,
      totalDB: questoesDB?.length || 0,
      pendentes: pendentes.length,
      detalhes: pendentes
    }
    totalPendentes += pendentes.length
  }

  return { porAno, totalPendentes }
}

// ═══════════════════════════════════════════════════════════════════
// FASE 2: INVENTÁRIO DO STORAGE
// ═══════════════════════════════════════════════════════════════════

async function listarArquivosStorage(supabase: SupabaseClient, pasta: string): Promise<Set<string>> {
  const caminhos = new Set<string>()

  async function listarRecursivo(prefix: string) {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).list(prefix, { limit: 1000 })
    if (error || !data) return
    for (const item of data) {
      const caminhoCompleto = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id) {
        caminhos.add(caminhoCompleto)
      } else {
        await listarRecursivo(caminhoCompleto)
      }
    }
  }

  await listarRecursivo(pasta)
  return caminhos
}

// ═══════════════════════════════════════════════════════════════════
// FASE 3: DOWNLOAD E UPLOAD
// ═══════════════════════════════════════════════════════════════════

async function downloadEUpload(
  supabase: SupabaseClient,
  imagem: ImagemPendente
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT)

    const response = await fetch(imagem.urlOrigem, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Studao-Platform/1.0' }
    })
    clearTimeout(timeout)

    if (!response.ok) return { sucesso: false, erro: `HTTP ${response.status}` }

    const contentType = response.headers.get('content-type') || 'image/png'
    if (!contentType.includes('image')) return { sucesso: false, erro: `Content-Type inválido: ${contentType}` }

    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length < 100) return { sucesso: false, erro: `Imagem muito pequena: ${buffer.length} bytes` }

    const ext = extensaoPorContentType(contentType)
    let caminhoFinal = imagem.caminhoStorage
    const extAtual = caminhoFinal.split('.').pop()
    if (extAtual && extAtual !== ext) {
      caminhoFinal = caminhoFinal.replace(`.${extAtual}`, `.${ext}`)
    }

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(caminhoFinal, buffer, { contentType, upsert: true })

    if (uploadError) return { sucesso: false, erro: `Upload: ${uploadError.message}` }

    imagem.caminhoStorage = caminhoFinal
    imagem.urlStorage = `${STORAGE_BASE_URL}/${caminhoFinal}`
    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err.message || String(err) }
  }
}

// ═══════════════════════════════════════════════════════════════════
// FASE 4: ATUALIZAR BANCO
// ═══════════════════════════════════════════════════════════════════

async function atualizarDB(
  supabase: SupabaseClient,
  imagens: ImagemPendente[]
): Promise<{ atualizadas: number; erros: number; detalhesErros: string[] }> {
  const porQuestao = new Map<string, ImagemPendente[]>()
  for (const img of imagens) {
    const lista = porQuestao.get(img.questaoId) || []
    lista.push(img)
    porQuestao.set(img.questaoId, lista)
  }

  let atualizadas = 0
  let erros = 0
  const detalhesErros: string[] = []

  for (const [questaoId, imgs] of porQuestao) {
    try {
      const { data: questao, error: fetchErr } = await supabase
        .from('questoes_enem')
        .select('elementos, tem_imagem, tem_imagem_alternativa')
        .eq('id', questaoId)
        .single()

      if (fetchErr || !questao) {
        detalhesErros.push(`Q${imgs[0].questaoNumero}: ${fetchErr?.message || 'não encontrada'}`)
        erros++
        continue
      }

      const elementos: ElementoEnem[] = questao.elementos || []
      const updates: Record<string, any> = {}

      // Imagens do enunciado
      const enunciados = imgs.filter(i => i.tipoImagem === 'enunciado')
      if (enunciados.length > 0) {
        let posInsercao = elementos.length
        for (let i = 0; i < elementos.length; i++) {
          if (elementos[i].tipo === 'comando') { posInsercao = i; break }
        }

        const novos: ElementoEnem[] = enunciados.map((img, idx) => ({
          tipo: 'imagem' as const,
          arquivo: img.urlStorage,
          ordem: posInsercao + idx + 1,
          legenda: null,
          descricao: null
        }))

        elementos.splice(posInsercao, 0, ...novos)
        for (let i = 0; i < elementos.length; i++) elementos[i].ordem = i + 1

        updates.elementos = elementos
        updates.tem_imagem = true
      }

      // Imagens das alternativas
      const alternativas = imgs.filter(i => i.tipoImagem === 'alternativa')
      if (alternativas.length > 0) {
        for (const alt of alternativas) {
          if (alt.letra) updates[`alt_${alt.letra.toLowerCase()}_imagem`] = alt.urlStorage
        }
        updates.tem_imagem_alternativa = true
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateErr } = await supabase
          .from('questoes_enem')
          .update(updates)
          .eq('id', questaoId)

        if (updateErr) {
          detalhesErros.push(`Q${imgs[0].questaoNumero}: ${updateErr.message}`)
          erros++
        } else {
          atualizadas++
        }
      }
    } catch (err: any) {
      detalhesErros.push(`Q${imgs[0].questaoNumero}: ${err.message}`)
      erros++
    }
  }

  return { atualizadas, erros, detalhesErros }
}

// ═══════════════════════════════════════════════════════════════════
// AUTH HELPER
// ═══════════════════════════════════════════════════════════════════

async function verificarAdmin(supabase: SupabaseClient): Promise<{ ok: boolean; erro?: string; status?: number }> {
  const sessao = await obterSessao()
  if (!sessao) return { ok: false, erro: 'Não autenticado', status: 401 }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('tipo')
    .eq('id', sessao.userId)
    .single()

  if (!usuario || usuario.tipo !== 'professor') return { ok: false, erro: 'Acesso negado', status: 403 }
  return { ok: true }
}

// ═══════════════════════════════════════════════════════════════════
// GET - DIAGNÓSTICO
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const auth = await verificarAdmin(supabase)
    if (!auth.ok) return NextResponse.json({ erro: auth.erro }, { status: auth.status })

    const searchParams = request.nextUrl.searchParams
    const anoParam = searchParams.get('ano')
    const limiteParam = searchParams.get('limite')

    const anos = anoParam ? [parseInt(anoParam, 10)] : [2022, 2023]
    const limite = limiteParam ? parseInt(limiteParam, 10) : undefined

    const resultado = await diagnosticar(supabase, anos, limite)

    // Resumo sem detalhes completos (para não sobrecarregar resposta)
    const resumo: Record<number, { totalAPI: number; totalDB: number; pendentes: number; exemplos: string[] }> = {}
    for (const [ano, info] of Object.entries(resultado.porAno)) {
      resumo[Number(ano)] = {
        totalAPI: info.totalAPI,
        totalDB: info.totalDB,
        pendentes: info.pendentes,
        exemplos: info.detalhes.slice(0, 5).map(d =>
          `Q${d.questaoNumero} ${d.tipoImagem}${d.letra ? ` ${d.letra}` : ''}`
        )
      }
    }

    return NextResponse.json({
      sucesso: true,
      totalPendentes: resultado.totalPendentes,
      porAno: resumo,
      instrucao: resultado.totalPendentes > 0
        ? 'Use POST para corrigir. Params: { ano?: 2022|2023, limite?: number, dryRun?: boolean }'
        : 'Nenhuma imagem pendente. Todas as questões já têm imagens.'
    })
  } catch (error: any) {
    console.error('Erro no diagnóstico:', error)
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════
// POST - CORRIGIR (download + upload + update DB)
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const auth = await verificarAdmin(supabase)
    if (!auth.ok) return NextResponse.json({ erro: auth.erro }, { status: auth.status })

    const body = await request.json().catch(() => ({}))
    const { ano: anoParam, limite: limiteParam, dryRun } = body as {
      ano?: number
      limite?: number
      dryRun?: boolean
    }

    const anos = anoParam ? [anoParam] : [2022, 2023]
    const limite = limiteParam || 20 // default 20 por chamada para respeitar timeout

    const logs: string[] = []
    logs.push(`Modo: ${dryRun ? 'DRY-RUN' : 'PRODUÇÃO'}`)
    logs.push(`Anos: ${anos.join(', ')}`)
    logs.push(`Limite: ${limite} questões por ano`)

    // Fase 1: Diagnóstico
    logs.push('--- Fase 1: Diagnóstico ---')
    const diagnostico = await diagnosticar(supabase, anos, limite)
    logs.push(`Total pendentes: ${diagnostico.totalPendentes}`)

    if (diagnostico.totalPendentes === 0) {
      return NextResponse.json({
        sucesso: true,
        mensagem: 'Nenhuma imagem pendente',
        logs
      })
    }

    // Coletar todas as pendentes
    const todasPendentes: ImagemPendente[] = []
    for (const info of Object.values(diagnostico.porAno)) {
      todasPendentes.push(...info.detalhes)
    }

    // Fase 2: Inventário do storage
    logs.push('--- Fase 2: Inventário do Storage ---')
    const paraDownload: ImagemPendente[] = []
    const jaNoStorage: ImagemPendente[] = []

    for (const ano of anos) {
      const pendentesAno = todasPendentes.filter(p => p.ano === ano)
      if (pendentesAno.length === 0) continue

      const arquivos = await listarArquivosStorage(supabase, String(ano))
      logs.push(`${ano}: ${arquivos.size} arquivos no storage`)

      for (const p of pendentesAno) {
        if (arquivos.has(p.caminhoStorage)) {
          jaNoStorage.push(p)
        } else {
          paraDownload.push(p)
        }
      }
    }

    logs.push(`Já no storage: ${jaNoStorage.length}`)
    logs.push(`Para download: ${paraDownload.length}`)

    if (dryRun) {
      return NextResponse.json({
        sucesso: true,
        dryRun: true,
        totalPendentes: diagnostico.totalPendentes,
        jaNoStorage: jaNoStorage.length,
        paraDownload: paraDownload.length,
        exemplos: todasPendentes.slice(0, 10).map(p => ({
          questao: `Q${p.questaoNumero}`,
          tipo: p.tipoImagem,
          letra: p.letra || null,
          origem: p.urlOrigem.substring(0, 80),
          destino: p.caminhoStorage
        })),
        logs
      })
    }

    // Fase 3: Download e Upload
    logs.push('--- Fase 3: Download e Upload ---')
    const baixadas: ImagemPendente[] = []
    const errosDownload: string[] = []

    for (let i = 0; i < paraDownload.length; i += BATCH_SIZE) {
      const lote = paraDownload.slice(i, i + BATCH_SIZE)
      const resultados = await Promise.all(lote.map(img => downloadEUpload(supabase, img)))

      for (let j = 0; j < lote.length; j++) {
        if (resultados[j].sucesso) {
          baixadas.push(lote[j])
        } else {
          errosDownload.push(`Q${lote[j].questaoNumero}: ${resultados[j].erro}`)
        }
      }

      if (i + BATCH_SIZE < paraDownload.length) {
        await new Promise(r => setTimeout(r, 500))
      }
    }

    logs.push(`Baixadas: ${baixadas.length}`)
    logs.push(`Erros download: ${errosDownload.length}`)

    // Fase 4: Atualizar DB
    logs.push('--- Fase 4: Atualizar Banco ---')
    const imagensDisponiveis = [...jaNoStorage, ...baixadas]
    const resultadoDB = await atualizarDB(supabase, imagensDisponiveis)

    logs.push(`DB atualizadas: ${resultadoDB.atualizadas}`)
    logs.push(`DB erros: ${resultadoDB.erros}`)

    return NextResponse.json({
      sucesso: true,
      resultado: {
        totalPendentes: diagnostico.totalPendentes,
        jaNoStorage: jaNoStorage.length,
        baixadas: baixadas.length,
        errosDownload: errosDownload.length,
        dbAtualizadas: resultadoDB.atualizadas,
        dbErros: resultadoDB.erros
      },
      errosDownload: errosDownload.slice(0, 20),
      errosDB: resultadoDB.detalhesErros.slice(0, 20),
      logs
    })
  } catch (error: any) {
    console.error('Erro na correção:', error)
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }
}
