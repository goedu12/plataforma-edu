'use client'

import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
  padding?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'fisica' | 'matematica' | 'terminal'
  className?: string
}

export default function Card({
  children,
  interactive = false,
  padding = 'md',
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  // Estilos base - Koyeb Dark Theme
  const variantStyles = {
    default: 'bg-dark-surface rounded-xl border border-border',
    elevated: 'bg-dark-elevated rounded-xl border border-border shadow-card',
    fisica: 'bg-dark-surface rounded-xl border border-border border-l-2 border-l-fisica-500',
    matematica: 'bg-dark-surface rounded-xl border border-border border-l-2 border-l-matematica-500',
    terminal: 'bg-dark-terminal rounded-xl overflow-hidden',
  }

  const interactiveStyles = interactive
    ? 'hover:border-border-hover hover:shadow-glow-green cursor-pointer transition-all duration-200'
    : 'transition-all duration-200'

  const paddingStyles = {
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }

  // Terminal não tem padding (é aplicado no body)
  const paddingClass = variant === 'terminal' ? '' : paddingStyles[padding]

  return (
    <div
      className={`${variantStyles[variant]} ${interactiveStyles} ${paddingClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

// Subcomponente para header do card
export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

// Subcomponente para título do card - Koyeb Style (uppercase)
export function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <h3 className={`text-base font-semibold text-text-primary uppercase tracking-wide ${className}`}>{children}</h3>
}

// Subcomponente para descrição do card
export function CardDescription({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={`text-sm text-text-secondary mt-1 ${className}`}>{children}</p>
}

// Subcomponente para conteúdo do card
export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

// Subcomponente para footer do card
export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`mt-4 pt-4 border-t border-border ${className}`}>{children}</div>
}

// Terminal Window Card - Koyeb Style
export function TerminalCard({
  children,
  title,
  className = '',
}: {
  children: ReactNode
  title?: string
  className?: string
}) {
  return (
    <div className={`bg-dark-terminal rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 bg-dark-header">
        <span className="w-3 h-3 rounded-full bg-terminal-red" />
        <span className="w-3 h-3 rounded-full bg-terminal-yellow" />
        <span className="w-3 h-3 rounded-full bg-terminal-green" />
        {title && <span className="ml-2 text-sm text-text-tertiary font-mono">{title}</span>}
      </div>
      <div className="p-5 font-mono text-sm text-text-secondary">
        {children}
      </div>
    </div>
  )
}

// Stat Card - Koyeb Style
export function StatCard({
  value,
  label,
  icon,
  color = 'default',
  className = '',
}: {
  value: string | number
  label: string
  icon?: ReactNode
  color?: 'default' | 'fisica' | 'matematica' | 'green'
  className?: string
}) {
  const colorStyles = {
    default: 'text-text-primary',
    fisica: 'text-fisica-500',
    matematica: 'text-matematica-500',
    green: 'text-accent-green',
  }

  const bgStyles = {
    default: 'bg-dark-elevated',
    fisica: 'bg-fisica-500/10',
    matematica: 'bg-matematica-500/10',
    green: 'bg-accent-green/10',
  }

  return (
    <div className={`bg-dark-surface rounded-xl p-5 border border-border ${className}`}>
      {icon && (
        <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center ${bgStyles[color]} ${colorStyles[color]}`}>
          {icon}
        </div>
      )}
      <p className={`text-3xl font-bold tabular-nums ${colorStyles[color]}`}>{value}</p>
      <p className="text-xs text-text-tertiary mt-1 uppercase tracking-wider">{label}</p>
    </div>
  )
}

// Feature Card - Koyeb Style com seta
export function FeatureCard({
  title,
  description,
  icon,
  onClick,
  componente = 'fisica',
  className = '',
}: {
  title: string
  description?: string
  icon?: ReactNode
  onClick?: () => void
  componente?: 'fisica' | 'matematica'
  className?: string
}) {
  const arrowColor = componente === 'fisica' ? 'text-fisica-500' : 'text-matematica-500'
  const hoverGlow = componente === 'fisica' ? 'hover:shadow-glow-cyan hover:border-fisica-500/30' : 'hover:shadow-glow-purple hover:border-matematica-500/30'

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-5 rounded-xl text-left
        bg-dark-surface border border-border
        hover:bg-dark-elevated hover:border-border-hover
        ${hoverGlow}
        transition-all duration-200
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <span className={`text-lg ${arrowColor}`}>→</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon && <span className={arrowColor}>{icon}</span>}
            <h3 className="font-semibold text-text-primary uppercase tracking-wide text-sm">{title}</h3>
          </div>
          {description && (
            <p className="text-sm text-text-secondary mt-1">{description}</p>
          )}
        </div>
      </div>
    </button>
  )
}
