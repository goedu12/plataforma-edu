'use client'

import { useState, useCallback } from 'react'
import Image, { ImageProps } from 'next/image'
import { ImageOff } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: SafeImage
// Renderiza imagens com validação de URL e tratamento de erros
// ═══════════════════════════════════════════════════════════════════════════

interface SafeImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string | null | undefined
  fallback?: React.ReactNode
  showPlaceholder?: boolean
}

// Padrões de URLs inválidas que devem ser ignoradas
const PADROES_INVALIDOS = [
  /^nan$/i,
  /^none$/i,
  /^null$/i,
  /^undefined$/i,
  /^\s*$/,
  /^http:\/\/localhost/i,
  /^file:\/\//i,
  /^\[object/i,
  /^<(img|div|span)/i,
  /broken-image/i,
  /placeholder/i,
  /no-image/i,
  /image-not-found/i,
  /not-available/i,
]

// Verificar se a URL é válida
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false

  const trimmed = url.trim()
  if (!trimmed) return false

  // Verificar padrões inválidos
  for (const padrao of PADROES_INVALIDOS) {
    if (padrao.test(trimmed)) return false
  }

  // Data URIs são sempre válidas
  if (trimmed.startsWith('data:image/')) return true

  // Verificar se é uma URL HTTP(S) válida
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Normalizar URL (remover espaços, etc)
function normalizeUrl(url: string): string {
  return url.trim()
}

export default function SafeImage({
  src,
  alt,
  fallback,
  showPlaceholder = false,
  className = '',
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = useCallback(() => {
    console.warn('[SafeImage] Erro ao carregar imagem:', src?.substring(0, 100))
    setHasError(true)
    setIsLoading(false)
  }, [src])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  // Se URL não é válida, mostrar fallback ou nada
  if (!isValidImageUrl(src)) {
    if (fallback) return <>{fallback}</>
    if (showPlaceholder) {
      return (
        <div
          className={`flex items-center justify-center bg-[var(--bg-elevated)] rounded-lg ${className}`}
          style={{ width: props.width, height: props.height }}
        >
          <ImageOff className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
      )
    }
    return null
  }

  // Se houve erro ao carregar, mostrar fallback
  if (hasError) {
    if (fallback) return <>{fallback}</>
    if (showPlaceholder) {
      return (
        <div
          className={`flex items-center justify-center bg-[var(--bg-elevated)] rounded-lg ${className}`}
          style={{ width: props.width, height: props.height }}
        >
          <div className="text-center p-2">
            <ImageOff className="w-6 h-6 mx-auto mb-1 text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">Imagem indisponível</span>
          </div>
        </div>
      )
    }
    return null
  }

  const normalizedSrc = normalizeUrl(src!)

  // Data URIs não precisam de otimização do Next.js
  const isDataUri = normalizedSrc.startsWith('data:image/')

  return (
    <div className={`relative ${className}`}>
      {isLoading && showPlaceholder && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)] rounded-lg animate-pulse"
        >
          <div className="w-8 h-8 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <Image
        {...props}
        src={normalizedSrc}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={isDataUri}
      />
    </div>
  )
}

// Função utilitária para validar URL de imagem (exportada para uso em outros lugares)
export { isValidImageUrl }
