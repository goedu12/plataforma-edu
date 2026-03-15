'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, ImageOff } from 'lucide-react'
import { isValidImageUrl } from './SafeImage'

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ImagemModal
// Modal de visualização de imagem com zoom, pan e gestos touch
// Melhores práticas UX para visualização de imagens em questões ENEM
// ═══════════════════════════════════════════════════════════════════════════

interface ImagemModalProps {
  src: string | null
  alt?: string
  onClose: () => void
}

export default function ImagemModal({ src, alt = 'Imagem ampliada', onClose }: ImagemModalProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [initialDistance, setInitialDistance] = useState<number | null>(null)
  const [initialScale, setInitialScale] = useState(1)

  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const positionStartRef = useRef({ x: 0, y: 0 })

  // Níveis de zoom
  const MIN_SCALE = 0.5
  const MAX_SCALE = 4
  const ZOOM_STEP = 0.5

  // Funções de zoom (declaradas antes dos useEffects que as usam)
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + ZOOM_STEP, MAX_SCALE))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - ZOOM_STEP, MIN_SCALE))
  }, [])

  const handleReset = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Reset ao abrir
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsLoading(true)
    setHasError(false)
  }, [src])

  // Fechar com ESC e focus trap para acessibilidade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') handleZoomIn()
      if (e.key === '-') handleZoomOut()
      if (e.key === '0') handleReset()

      // Focus trap - manter foco dentro do modal
      if (e.key === 'Tab' && containerRef.current) {
        const focusableElements = containerRef.current.parentElement?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

          if (e.shiftKey && document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, handleZoomIn, handleZoomOut, handleReset])

  // Prevenir scroll do body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Mouse drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
    positionStartRef.current = { ...position }
  }, [scale, position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setPosition({
      x: positionStartRef.current.x + dx,
      y: positionStartRef.current.y + dy,
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch events para mobile
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom
      const distance = getTouchDistance(e.touches)
      setInitialDistance(distance)
      setInitialScale(scale)
    } else if (e.touches.length === 1 && scale > 1) {
      // Pan
      setIsDragging(true)
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
      positionStartRef.current = { ...position }
    }
  }, [scale, position])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance) {
      // Pinch to zoom
      e.preventDefault()
      const distance = getTouchDistance(e.touches)
      const newScale = initialScale * (distance / initialDistance)
      setScale(Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE))
    } else if (e.touches.length === 1 && isDragging) {
      // Pan
      const dx = e.touches[0].clientX - dragStartRef.current.x
      const dy = e.touches[0].clientY - dragStartRef.current.y
      setPosition({
        x: positionStartRef.current.x + dx,
        y: positionStartRef.current.y + dy,
      })
    }
  }, [isDragging, initialDistance, initialScale])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setInitialDistance(null)
  }, [])

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.2 : 0.2
    setScale(prev => Math.min(Math.max(prev + delta, MIN_SCALE), MAX_SCALE))
  }, [])

  // Double click para zoom toggle
  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      handleReset()
    } else {
      setScale(2)
    }
  }, [scale, handleReset])

  if (!src || !isValidImageUrl(src)) return null

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: 'var(--overlay-image)', zIndex: 100 }}
    >
      {/* Header com controles */}
      <div
        className="flex items-center justify-between p-3 sm:p-4"
        style={{ background: 'var(--overlay-dropdown)' }}
      >
        {/* Controles de zoom */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= MIN_SCALE}
            className="p-2 sm:p-2.5 rounded-lg transition-all hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Diminuir zoom"
          >
            <ZoomOut className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          <span className="text-white text-sm sm:text-base font-mono min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= MAX_SCALE}
            className="p-2 sm:p-2.5 rounded-lg transition-all hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          <div className="w-px h-6 bg-white/20 mx-1 sm:mx-2 hidden sm:block" />

          <button
            onClick={handleReset}
            className="p-2 sm:p-2.5 rounded-lg transition-all hover:bg-white/10"
            aria-label="Resetar zoom"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </div>

        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="p-2 sm:p-2.5 rounded-lg transition-all hover:bg-white/10"
          aria-label="Fechar"
        >
          <X className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </button>
      </div>

      {/* Área da imagem */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onClick={(e) => {
          // Fechar se clicar fora da imagem (no background)
          if (e.target === containerRef.current) onClose()
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {hasError ? (
          <div className="text-center p-8">
            <ImageOff className="w-16 h-16 mx-auto mb-4 text-white/50" />
            <p className="text-white/70 text-lg">Imagem não disponível</p>
          </div>
        ) : (
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
          >
            <Image
              src={src}
              alt={alt}
              width={1400}
              height={1000}
              className="max-w-[95vw] max-h-[85vh] w-auto h-auto object-contain select-none"
              style={{
                pointerEvents: 'none',
                imageRendering: scale > 2 ? 'pixelated' : 'auto'
              }}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true)
                setIsLoading(false)
              }}
              unoptimized
              priority
              draggable={false}
            />
          </div>
        )}
      </div>

      {/* Dica de uso */}
      <div
        className="text-center py-2 sm:py-3 text-white/50 text-xs sm:text-sm"
        style={{ background: 'var(--overlay-dropdown)' }}
      >
        <span className="hidden sm:inline">
          Scroll para zoom • Arraste para mover • Duplo clique para zoom • ESC para fechar
        </span>
        <span className="sm:hidden">
          Pinça para zoom • Arraste para mover • Toque duplo para zoom
        </span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: ImagemQuestao
// Imagem responsiva otimizada para questões ENEM
// ═══════════════════════════════════════════════════════════════════════════

interface ImagemQuestaoProps {
  src: string | null | undefined
  alt?: string
  tipo?: 'principal' | 'extra' | 'alternativa'
  onExpandir?: (src: string) => void
  className?: string
}

export function ImagemQuestao({
  src,
  alt = 'Imagem da questão',
  tipo = 'principal',
  onExpandir,
  className = ''
}: ImagemQuestaoProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (!src || !isValidImageUrl(src)) return null

  // Tamanhos responsivos baseados no tipo
  const sizeConfig = {
    principal: {
      container: 'w-full max-w-2xl mx-auto', // maior para imagem principal
      image: 'max-h-[300px] sm:max-h-[400px] md:max-h-[500px]',
      width: 800,
      height: 600,
    },
    extra: {
      container: 'w-full',
      image: 'max-h-[200px] sm:max-h-[250px] md:max-h-[300px]',
      width: 500,
      height: 400,
    },
    alternativa: {
      container: '',
      image: 'max-h-[80px] sm:max-h-[100px]',
      width: 200,
      height: 150,
    },
  }

  const config = sizeConfig[tipo]

  return (
    <div className={`relative ${config.container} ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-[var(--bg-elevated)] rounded-xl animate-pulse flex items-center justify-center"
        >
          <div className="w-10 h-10 border-2 border-[var(--text-muted)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error fallback */}
      {hasError ? (
        <div className="flex items-center justify-center bg-[var(--bg-elevated)] rounded-xl p-6 min-h-[120px]">
          <div className="text-center">
            <ImageOff className="w-10 h-10 mx-auto mb-2 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-muted)]">Imagem indisponível</span>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <Image
            src={src}
            alt={alt}
            width={config.width}
            height={config.height}
            className={`
              w-full h-auto object-contain rounded-xl
              ${config.image}
              ${onExpandir ? 'cursor-pointer' : ''}
              transition-transform duration-200
              ${onExpandir ? 'group-hover:scale-[1.02]' : ''}
            `}
            style={{
              opacity: isLoading ? 0 : 1,
              transition: 'opacity 0.3s ease-in-out',
            }}
            onClick={() => onExpandir?.(src)}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true)
              setIsLoading(false)
            }}
            unoptimized
          />

          {/* Botão de expandir */}
          {onExpandir && tipo !== 'alternativa' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onExpandir(src)
              }}
              className="
                absolute top-3 right-3
                p-2 sm:p-2.5 rounded-lg
                bg-black/60 hover:bg-black/80
                opacity-0 group-hover:opacity-100
                transition-all duration-200
                backdrop-blur-sm
              "
              aria-label="Ampliar imagem"
            >
              <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          )}

          {/* Indicador de clicável (mobile) */}
          {onExpandir && tipo !== 'alternativa' && (
            <div className="
              absolute bottom-3 left-1/2 -translate-x-1/2
              px-3 py-1.5 rounded-full
              bg-black/60 backdrop-blur-sm
              opacity-0 group-hover:opacity-100 sm:hidden
              transition-all duration-200
              pointer-events-none
            ">
              <span className="text-white text-xs font-medium flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5" />
                Toque para ampliar
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
