'use client'

import { useEffect, useRef } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
// HOOK: useImagemProxyFallback
//
// Monitora imagens dentro de um container HTML (ex: enunciado_html)
// e tenta recarregar via proxy quando falham.
//
// Uso:
//   const containerRef = useImagemProxyFallback()
//   <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />
// ═══════════════════════════════════════════════════════════════════════════

const DOMINIOS_PROXY = ['api.enem.dev', 'enem.dev']

function deveUsarProxy(url: string): boolean {
  try {
    const parsed = new URL(url)
    return DOMINIOS_PROXY.some(d => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`))
  } catch {
    return false
  }
}

export function useImagemProxyFallback() {
  const containerRef = useRef<HTMLDivElement>(null)
  const processedUrls = useRef(new Set<string>())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleImageError = (event: Event) => {
      const img = event.target as HTMLImageElement
      if (!img || img.tagName !== 'IMG') return

      const originalSrc = img.getAttribute('data-original-src') || img.src

      // Evitar loop infinito
      if (processedUrls.current.has(originalSrc)) return
      processedUrls.current.add(originalSrc)

      // Se o domínio é elegível para proxy, tentar via proxy
      if (deveUsarProxy(originalSrc)) {
        img.setAttribute('data-original-src', originalSrc)
        img.src = `/api/enem/imagem?url=${encodeURIComponent(originalSrc)}`
      }
    }

    // Observar erros de imagem via event delegation
    container.addEventListener('error', handleImageError, true)

    // Também verificar imagens que já estão no DOM
    const images = container.querySelectorAll('img')
    images.forEach(img => {
      if (img.complete && img.naturalWidth === 0 && img.src) {
        handleImageError({ target: img } as unknown as Event)
      }
    })

    return () => {
      container.removeEventListener('error', handleImageError, true)
      processedUrls.current.clear()
    }
  }, [])

  return containerRef
}
