export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════
// API DE DIAGNÓSTICO DE IMAGENS - ADMIN
// ═══════════════════════════════════════════════════════════════════
// GET /api/admin/diagnostico-imagens - Diagnóstico completo
// POST /api/admin/diagnostico-imagens - Testar URL específica
// DELETE /api/admin/diagnostico-imagens - Limpar URLs inválidas

// Padrões válidos de URLs
const PADROES_VALIDOS = [
  /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i,
  /^https?:\/\/.*\/storage\/v1\/object\/.*$/i,
  /^https?:\/\/api\.enem\.dev\/.*$/i,
  /^https?:\/\/.*cloudinary.*$/i,
  /^https?:\/\/.*s3\.amazonaws\.com.*$/i,
  /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/i,
]

const PADROES_INVALIDOS = [
  /^nan$/i,
  /^none$/i,
  /^null$/i,
  /^undefined$/i,
  /^\s*$/,
  /^http:\/\/localhost/i,
  /^file:\/\//i,
]

interface ProblemaImagem {
  questao_id: string
  id_api: string | null
  campo: string
  url: string
  problema: string
}

// Verificar formato de URL
function verificarFormatoUrl(url: string | null): { valido: boolean; problema?: string } {
  if (!url || typeof url !== 'string') {
    return { valido: false, problema: 'URL nula ou inválida' }
  }

  const urlTrimmed = url.trim()

  for (const padrao of PADROES_INVALIDOS) {
    if (padrao.test(urlTrimmed)) {
      return { valido: false, problema: `Valor inválido: ${urlTrimmed.substring(0, 30)}` }
    }
  }

  for (const padrao of PADROES_VALIDOS) {
    if (padrao.test(urlTrimmed)) {
      return { valido: true }
    }
  }

  try {
    const parsed = new URL(urlTrimmed)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { valido: true }
    }
  } catch {
    return { valido: false, problema: 'URL malformada' }
  }

  return { valido: false, problema: 'Protocolo não suportado' }
}

// Testar se URL está acessível
async function testarUrlHttp(url: string, timeoutMs = 8000): Promise<{
  ok: boolean
  status?: number
  contentType?: string
  erro?: string
  tempoMs?: number
}> {
  if (url.startsWith('data:image/')) {
    return { ok: true, contentType: 'data-uri', tempoMs: 0 }
  }

  const inicio = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Studao-Platform/1.0 ImageChecker'
      }
    })

    clearTimeout(timeoutId)
    const tempoMs = Date.now() - inicio
    const contentType = response.headers.get('content-type') || ''

    if (response.ok) {
      return { ok: true, status: response.status, contentType, tempoMs }
    }

    return { ok: false, status: response.status, erro: `HTTP ${response.status}`, tempoMs }
  } catch (error: any) {
    const tempoMs = Date.now() - inicio

    if (error.name === 'AbortError') {
      return { ok: false, erro: 'Timeout', tempoMs }
    }

    return { ok: false, erro: error.message, tempoMs }
  }
}

// GET - Diagnóstico completo
export async function GET(request: NextRequest) {
  try {
    const sessao = await obterSessao()

    if (!sessao) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Verificar se é professor
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', sessao.userId)
      .single()

    if (!usuario || usuario.tipo !== 'professor') {
      return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const testarHttp = searchParams.get('testar_http') === 'true'
    const limite = parseInt(searchParams.get('limite') || '100')

    // Buscar questões
    const { data: questoes, error } = await supabase
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
      .limit(limite)

    if (error) {
      return NextResponse.json({ erro: error.message }, { status: 500 })
    }

    const problemas: ProblemaImagem[] = []
    const estatisticas = {
      total_questoes: questoes?.length || 0,
      com_imagem_principal: 0,
      com_imagens_extras: 0,
      com_imagem_alternativas: 0,
      urls_validas: 0,
      urls_invalidas: 0,
      urls_testadas: 0,
      urls_funcionando: 0,
      urls_quebradas: 0
    }

    const urlsParaTestar: string[] = []

    // Analisar cada questão
    for (const q of questoes || []) {
      // Imagem principal
      if (q.imagem_principal) {
        estatisticas.com_imagem_principal++
        const check = verificarFormatoUrl(q.imagem_principal)
        if (check.valido) {
          estatisticas.urls_validas++
          urlsParaTestar.push(q.imagem_principal)
        } else {
          estatisticas.urls_invalidas++
          problemas.push({
            questao_id: q.id,
            id_api: q.id_api,
            campo: 'imagem_principal',
            url: q.imagem_principal,
            problema: check.problema!
          })
        }
      }

      // Imagens extras
      if (q.imagens_extras && Array.isArray(q.imagens_extras)) {
        if (q.imagens_extras.length > 0) estatisticas.com_imagens_extras++
        q.imagens_extras.forEach((url: string, idx: number) => {
          const check = verificarFormatoUrl(url)
          if (check.valido) {
            estatisticas.urls_validas++
            urlsParaTestar.push(url)
          } else {
            estatisticas.urls_invalidas++
            problemas.push({
              questao_id: q.id,
              id_api: q.id_api,
              campo: `imagens_extras[${idx}]`,
              url,
              problema: check.problema!
            })
          }
        })
      }

      // Imagens das alternativas
      const camposAlt = ['imagem_a', 'imagem_b', 'imagem_c', 'imagem_d', 'imagem_e'] as const
      let temAltComImagem = false
      for (const campo of camposAlt) {
        const url = q[campo]
        if (url) {
          temAltComImagem = true
          const check = verificarFormatoUrl(url)
          if (check.valido) {
            estatisticas.urls_validas++
            urlsParaTestar.push(url)
          } else {
            estatisticas.urls_invalidas++
            problemas.push({
              questao_id: q.id,
              id_api: q.id_api,
              campo,
              url,
              problema: check.problema!
            })
          }
        }
      }
      if (temAltComImagem) estatisticas.com_imagem_alternativas++
    }

    // Testar URLs HTTP se solicitado
    const resultadosTestes: Array<{ url: string; ok: boolean; erro?: string }> = []

    if (testarHttp) {
      const urlsUnicas = [...new Set(urlsParaTestar)].slice(0, 50) // Limitar a 50 para não demorar

      for (const url of urlsUnicas) {
        const resultado = await testarUrlHttp(url)
        estatisticas.urls_testadas++

        if (resultado.ok) {
          estatisticas.urls_funcionando++
        } else {
          estatisticas.urls_quebradas++
          resultadosTestes.push({
            url: url.length > 100 ? url.substring(0, 100) + '...' : url,
            ok: false,
            erro: resultado.erro
          })
        }
      }
    }

    return NextResponse.json({
      sucesso: true,
      estatisticas,
      problemas_formato: problemas.slice(0, 50), // Limitar resposta
      total_problemas: problemas.length,
      urls_quebradas: resultadosTestes,
      mensagem: problemas.length > 0
        ? `Encontrados ${problemas.length} problemas de formato`
        : 'Nenhum problema de formato encontrado'
    })
  } catch (error: any) {
    console.error('Erro no diagnóstico:', error)
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }
}

// POST - Testar URL específica
export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ erro: 'URL não fornecida' }, { status: 400 })
    }

    // Verificar formato
    const checkFormato = verificarFormatoUrl(url)
    if (!checkFormato.valido) {
      return NextResponse.json({
        sucesso: true,
        url,
        formato_valido: false,
        problema: checkFormato.problema
      })
    }

    // Testar acesso HTTP
    const resultado = await testarUrlHttp(url)

    return NextResponse.json({
      sucesso: true,
      url,
      formato_valido: true,
      acessivel: resultado.ok,
      status_http: resultado.status,
      content_type: resultado.contentType,
      erro: resultado.erro,
      tempo_ms: resultado.tempoMs
    })
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }
}

// DELETE - Limpar URLs inválidas
export async function DELETE(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Verificar se é professor
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', sessao.userId)
      .single()

    if (!usuario || usuario.tipo !== 'professor') {
      return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { modo } = body // 'formato_invalido' ou 'urls_especificas'

    let atualizados = 0

    if (modo === 'formato_invalido') {
      // Buscar e limpar todas URLs com formato inválido
      const { data: questoes } = await supabase
        .from('questoes_enem')
        .select('id, imagem_principal, imagem_a, imagem_b, imagem_c, imagem_d, imagem_e')

      for (const q of questoes || []) {
        const updates: Record<string, null> = {}

        if (q.imagem_principal && !verificarFormatoUrl(q.imagem_principal).valido) {
          updates.imagem_principal = null
        }

        const camposAlt = ['imagem_a', 'imagem_b', 'imagem_c', 'imagem_d', 'imagem_e'] as const
        for (const campo of camposAlt) {
          if (q[campo] && !verificarFormatoUrl(q[campo]).valido) {
            updates[campo] = null
          }
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('questoes_enem')
            .update(updates)
            .eq('id', q.id)
          atualizados++
        }
      }
    }

    return NextResponse.json({
      sucesso: true,
      questoes_atualizadas: atualizados,
      mensagem: `${atualizados} questões limpas`
    })
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }
}
