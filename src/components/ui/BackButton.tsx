'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  href?: string
  onClick?: () => void
  label?: string
  showLabel?: boolean
  className?: string
}

/**
 * Botão Voltar Padronizado
 * - Sempre em verde (#22c55e) para alta visibilidade
 * - Touch target de 44px mínimo
 * - Usado em todas as páginas para navegação consistente
 */
export default function BackButton({
  href,
  onClick,
  label = 'Voltar',
  showLabel = false,
  className = '',
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`back-button ${showLabel ? 'back-button-label' : ''} ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="w-5 h-5" />
      {showLabel && <span>{label}</span>}
    </button>
  )
}
