export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

// ═══════════════════════════════════════════════════════════════════════════
// API PROXY DE IMAGENS ENEM
//
// Proxy para imagens externas (api.enem.dev, etc.) com cache.
// Resolve problemas de:
// - Domínios fora do ar ou com rate limiting
// - CORS bloqueando imagens
// - Next.js Image optimization falhando para URLs externas
//
// Uso: /api/enem/imagem?url=https://api.enem.dev/...
// ═══════════════════════════════════════════════════════════════════════════

// Domínios permitidos para proxy (segurança)
const DOMINIOS_PERMITIDOS = [
  'api.enem.dev',
  'enem.dev',
  'qjrjkjknesacrurvcthu.supabase.co',
  'i.imgur.com',
  'upload.wikimedia.org',
  'commons.wikimedia.org',
]

// Cache em memória simples (em produção, usar Redis ou similar)
const imageCache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutos
const MAX_CACHE_SIZE = 100 // Max entries in cache

function limparCacheAntigo() {
  const agora = Date.now()
  for (const [key, value] of imageCache.entries()) {
    if (agora - value.timestamp > CACHE_TTL) {
      imageCache.delete(key)
    }
  }
  // Se ainda está muito grande, remover mais antigos
  if (imageCache.size > MAX_CACHE_SIZE) {
    const entries = [...imageCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE)
    for (const [key] of toRemove) {
      imageCache.delete(key)
    }
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ erro: 'Parâmetro url é obrigatório' }, { status: 400 })
  }

  // Validar URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ erro: 'URL inválida' }, { status: 400 })
  }

  // Verificar domínio permitido
  const dominioPermitido = DOMINIOS_PERMITIDOS.some(d =>
    parsedUrl.hostname === d || parsedUrl.hostname.endsWith(`.${d}`)
  )

  if (!dominioPermitido) {
    return NextResponse.json(
      { erro: 'Domínio não permitido', dominio: parsedUrl.hostname },
      { status: 403 }
    )
  }

  // Verificar cache
  const cached = imageCache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new NextResponse(new Uint8Array(cached.data), {
      status: 200,
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
        'X-Cache': 'HIT',
      },
    })
  }

  // Buscar imagem com retry
  let lastError: string = ''
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PlataformaEdu/1.0)',
          'Accept': 'image/*',
        },
      })

      clearTimeout(timeout)

      if (!response.ok) {
        lastError = `HTTP ${response.status}`
        if (tentativa < 2) {
          await new Promise(r => setTimeout(r, 1000 * (tentativa + 1)))
          continue
        }
        break
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg'

      // Verificar se é realmente uma imagem
      if (!contentType.startsWith('image/')) {
        return NextResponse.json({ erro: 'URL não retorna uma imagem' }, { status: 400 })
      }

      const buffer = Buffer.from(await response.arrayBuffer())

      // Limitar tamanho (5MB max)
      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ erro: 'Imagem muito grande' }, { status: 413 })
      }

      // Salvar no cache
      limparCacheAntigo()
      imageCache.set(url, { data: buffer, contentType, timestamp: Date.now() })

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
          'X-Cache': 'MISS',
          'Content-Length': String(buffer.length),
        },
      })
    } catch (error: any) {
      lastError = error?.message || 'Erro desconhecido'
      if (tentativa < 2) {
        await new Promise(r => setTimeout(r, 1000 * (tentativa + 1)))
      }
    }
  }

  // Todas as tentativas falharam
  return NextResponse.json(
    { erro: 'Não foi possível buscar a imagem', detalhes: lastError },
    { status: 502 }
  )
}
