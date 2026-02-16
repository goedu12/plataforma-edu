'use client'

import { useState, useCallback, useRef } from 'react'
import { AlertTriangle, ZoomIn, Loader2 } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ImagemENEM
// Imagem com retry automático via proxy para questões ENEM
//
// Estratégia de fallback:
// 1. Tenta carregar URL direta
// 2. Se falhar, tenta via proxy (/api/enem/imagem?url=...)
// 3. Se o proxy também falhar, mostra placeholder
// ═══════════════════════════════════════════════════════════════════════════

interface ImagemENEMProps {
  src: string
  alt?: string
  /** Label mostrado no placeholder quando falha (ex: "Figura 1") */
  label?: string
  /** Classe CSS para a <img> */
  className?: string
  /** Callback ao clicar (para zoom/expandir) */
  onClick?: () => void
  /** Callback quando a imagem falha definitivamente */
  onFinalError?: () => void
}

// Domínios que devem passar pelo proxy quando falham
const DOMINIOS_PROXY = ['api.enem.dev', 'enem.dev']

function deveUsarProxy(url: string): boolean {
  try {
    const parsed = new URL(url)
    return DOMINIOS_PROXY.some(d => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`))
  } catch {
    return false
  }
}

export default function ImagemENEM({
  src,
  alt = 'Imagem da questão',
  label,
  className = '',
  onClick,
  onFinalError,
}: ImagemENEMProps) {
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'tentando-proxy' | 'erro'>('carregando')
  const tentouProxy = useRef(false)

  const handleLoad = useCallback(() => {
    setEstado('ok')
  }, [])

  const handleError = useCallback(() => {
    // Se ainda não tentou o proxy e o domínio é elegível, tentar via proxy
    if (!tentouProxy.current && deveUsarProxy(src)) {
      tentouProxy.current = true
      setEstado('tentando-proxy')
    } else {
      setEstado('erro')
      onFinalError?.()
    }
  }, [src, onFinalError])

  const handleProxyError = useCallback(() => {
    setEstado('erro')
    onFinalError?.()
  }, [onFinalError])

  // URL via proxy
  const proxyUrl = `/api/enem/imagem?url=${encodeURIComponent(src)}`

  // Estado de erro final
  if (estado === 'erro') {
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
        style={{
          background: 'var(--bg-elevated)',
          color: 'var(--text-muted)',
          border: '1px dashed var(--border-default)',
        }}
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{label ? `${label} — indisponível` : 'Imagem indisponível'}</span>
      </div>
    )
  }

  // Tentando via proxy
  if (estado === 'tentando-proxy') {
    return (
      <div className="relative">
        {/* Loading indicator while proxy fetches */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl z-10"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
        <img
          src={proxyUrl}
          alt={alt}
          className={className}
          onLoad={handleLoad}
          onError={handleProxyError}
          style={{ opacity: 0, minHeight: '48px' }}
        />
      </div>
    )
  }

  // Carregando ou OK
  return (
    <div className="relative">
      {estado === 'carregando' && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      )}
      {onClick ? (
        <button
          onClick={onClick}
          className="relative rounded-xl overflow-hidden group"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <img
            src={src}
            alt={alt}
            className={className}
            onLoad={handleLoad}
            onError={handleError}
            style={{ opacity: estado === 'ok' ? 1 : 0, transition: 'opacity 0.2s' }}
          />
          {estado === 'ok' && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          )}
        </button>
      ) : (
        <img
          src={src}
          alt={alt}
          className={className}
          onLoad={handleLoad}
          onError={handleError}
          style={{ opacity: estado === 'ok' ? 1 : 0, transition: 'opacity 0.2s' }}
        />
      )}
    </div>
  )
}
