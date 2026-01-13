'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BackButtonProps {
  href?: string
  onClick?: () => void
  label?: string
  showLabel?: boolean
  showLabelOnDesktop?: boolean
  className?: string
  /** Se true, esconde no desktop (lg+). Default: false - sempre visível */
  mobileOnly?: boolean
  /** Usa versão compacta no desktop */
  compactOnDesktop?: boolean
}

/**
 * Botão Voltar Padronizado
 * - Sempre em verde (#22c55e) para alta visibilidade
 * - Touch target de 44px mínimo
 * - Usado em todas as páginas para navegação consistente
 * - Opção de esconder em desktop quando NavigationRail está presente
 */
export default function BackButton({
  href,
  onClick,
  label = 'Voltar',
  showLabel = false,
  showLabelOnDesktop = false,
  className = '',
  mobileOnly = false,
  compactOnDesktop = false,
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

  // Monta as classes dinamicamente
  const classes = [
    'back-button',
    showLabel ? 'back-button-label' : '',
    mobileOnly ? 'mobile-only' : '',
    compactOnDesktop ? 'lg:back-button-desktop' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      onClick={handleClick}
      className={classes}
      aria-label={label}
    >
      <ArrowLeft className="w-5 h-5" />
      {showLabel && <span className="sm:inline">{label}</span>}
      {showLabelOnDesktop && !showLabel && <span className="hidden lg:inline ml-1">{label}</span>}
    </button>
  )
}
