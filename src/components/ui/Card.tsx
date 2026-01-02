'use client'

import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'glass' | 'fisica' | 'matematica' | 'terminal' | 'glow-green' | 'glow-lilas' | 'glow-orange'
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
  // ═══════════════════════════════════════════════════════════
  // VARIANTES - Premium 2026 Design System
  // ═══════════════════════════════════════════════════════════
  const variantStyles = {
    // Padrão - Superfície escura
    default: `
      bg-dark-surface/90 backdrop-blur-sm
      rounded-2xl border border-border
      shadow-soft-xs
    `,

    // Elevado - Com mais destaque
    elevated: `
      bg-dark-elevated/95 backdrop-blur-md
      rounded-2xl border border-border
      shadow-soft-md
    `,

    // Glassmorphism - Efeito vidro fosco
    glass: `
      bg-dark-glass backdrop-blur-xl
      rounded-2xl border border-border-glass
      shadow-glass
    `,

    // Física - Verde accent
    fisica: `
      bg-gradient-to-br from-dark-surface/95 to-fisica-500/5
      backdrop-blur-sm
      rounded-2xl border border-border
      border-l-4 border-l-fisica-500
      shadow-soft-sm
    `,

    // Matemática - Lilás accent
    matematica: `
      bg-gradient-to-br from-dark-surface/95 to-matematica-500/5
      backdrop-blur-sm
      rounded-2xl border border-border
      border-l-4 border-l-matematica-500
      shadow-soft-sm
    `,

    // Terminal - Estilo código
    terminal: `
      bg-[#0d0d0d] rounded-2xl overflow-hidden
      border border-border
      shadow-soft-md
    `,

    // Glow Verde
    'glow-green': `
      bg-gradient-to-br from-dark-surface/95 to-fisica-500/10
      backdrop-blur-sm
      rounded-2xl border border-fisica-500/30
      shadow-glow-green
    `,

    // Glow Lilás
    'glow-lilas': `
      bg-gradient-to-br from-dark-surface/95 to-matematica-500/10
      backdrop-blur-sm
      rounded-2xl border border-matematica-500/30
      shadow-glow-lilas
    `,

    // Glow Laranja
    'glow-orange': `
      bg-gradient-to-br from-dark-surface/95 to-secondary-500/10
      backdrop-blur-sm
      rounded-2xl border border-secondary-500/30
      shadow-glow-orange
    `,
  }

  // Estilos interativos
  const interactiveStyles = interactive
    ? `
      cursor-pointer
      transition-all duration-300 ease-out
      hover:scale-[1.02] hover:shadow-soft-lg
      hover:border-border-hover
      active:scale-[0.99]
    `
    : 'transition-all duration-200'

  // Paddings
  const paddingStyles = {
    none: '',
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

// ═══════════════════════════════════════════════════════════
// SUBCOMPONENTES
// ═══════════════════════════════════════════════════════════

// Header do card
export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

// Título do card - Premium 2026
export function CardTitle({
  children,
  className = '',
  size = 'md',
}: {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizeStyles = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-semibold',
    lg: 'text-lg font-bold',
  }

  return (
    <h3 className={`${sizeStyles[size]} text-text-primary tracking-wide ${className}`}>
      {children}
    </h3>
  )
}

// Descrição do card
export function CardDescription({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={`text-sm text-text-secondary mt-1 ${className}`}>{children}</p>
}

// Conteúdo do card
export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

// Footer do card
export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`mt-4 pt-4 border-t border-border ${className}`}>{children}</div>
}

// ═══════════════════════════════════════════════════════════
// TERMINAL CARD - Premium 2026
// ═══════════════════════════════════════════════════════════
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
    <div className={`bg-[#0d0d0d] rounded-2xl overflow-hidden border border-border shadow-soft-md ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 bg-dark-surface/50 border-b border-border">
        <span className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_8px_rgba(255,95,86,0.4)]" />
        <span className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_rgba(255,189,46,0.4)]" />
        <span className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_8px_rgba(39,201,63,0.4)]" />
        {title && <span className="ml-2 text-sm text-text-tertiary font-mono">{title}</span>}
      </div>
      <div className="p-5 font-mono text-sm text-text-secondary">
        {children}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// STAT CARD - Premium 2026 com Glow
// ═══════════════════════════════════════════════════════════
export function StatCard({
  value,
  label,
  icon,
  color = 'default',
  trend,
  className = '',
}: {
  value: string | number
  label: string
  icon?: ReactNode
  color?: 'default' | 'fisica' | 'matematica' | 'green' | 'orange' | 'lilas'
  trend?: { value: number; label?: string }
  className?: string
}) {
  const colorStyles = {
    default: 'text-text-primary',
    fisica: 'text-fisica-500',
    matematica: 'text-matematica-500',
    green: 'text-primary-500',
    orange: 'text-secondary-500',
    lilas: 'text-lilas-500',
  }

  const bgStyles = {
    default: 'bg-dark-elevated/80',
    fisica: 'bg-gradient-to-br from-fisica-500/20 to-fisica-600/10',
    matematica: 'bg-gradient-to-br from-matematica-500/20 to-matematica-600/10',
    green: 'bg-gradient-to-br from-primary-500/20 to-primary-600/10',
    orange: 'bg-gradient-to-br from-secondary-500/20 to-secondary-600/10',
    lilas: 'bg-gradient-to-br from-lilas-500/20 to-lilas-600/10',
  }

  const glowStyles = {
    default: '',
    fisica: 'shadow-glow-green',
    matematica: 'shadow-glow-lilas',
    green: 'shadow-glow-green',
    orange: 'shadow-glow-orange',
    lilas: 'shadow-glow-lilas',
  }

  return (
    <div className={`
      bg-dark-surface/90 backdrop-blur-sm
      rounded-2xl p-5 border border-border
      transition-all duration-300
      hover:shadow-soft-md hover:scale-[1.02]
      ${className}
    `}>
      {icon && (
        <div className={`
          w-12 h-12 rounded-xl mb-4
          flex items-center justify-center
          ${bgStyles[color]} ${colorStyles[color]}
          border border-border-glass
          ${glowStyles[color]}
        `}>
          {icon}
        </div>
      )}
      <p className={`text-3xl font-bold tabular-nums ${colorStyles[color]}`}>{value}</p>
      <p className="text-xs text-text-tertiary mt-1 uppercase tracking-wider">{label}</p>
      {trend && (
        <div className={`mt-2 text-xs ${trend.value >= 0 ? 'text-primary-500' : 'text-error'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%{trend.label && ` ${trend.label}`}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// FEATURE CARD - Premium 2026 com Glow e Gradiente
// ═══════════════════════════════════════════════════════════
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
  const isFisica = componente === 'fisica'

  return (
    <button
      onClick={onClick}
      className={`
        w-full p-5 rounded-2xl text-left
        bg-dark-surface/90 backdrop-blur-sm
        border border-border
        transition-all duration-300 ease-out
        hover:scale-[1.02]
        ${isFisica
          ? 'hover:bg-gradient-to-br hover:from-dark-surface/95 hover:to-fisica-500/10 hover:border-fisica-500/30 hover:shadow-glow-green'
          : 'hover:bg-gradient-to-br hover:from-dark-surface/95 hover:to-matematica-500/10 hover:border-matematica-500/30 hover:shadow-glow-lilas'
        }
        ${className}
      `}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${isFisica
              ? 'bg-gradient-to-br from-fisica-500/20 to-fisica-600/10 text-fisica-500'
              : 'bg-gradient-to-br from-matematica-500/20 to-matematica-600/10 text-matematica-500'
            }
            border border-border-glass
            transition-transform duration-300 group-hover:scale-110
          `}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
          {description && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{description}</p>
          )}
        </div>
        <span className={`
          text-lg transition-transform duration-300
          ${isFisica ? 'text-fisica-500' : 'text-matematica-500'}
        `}>
          →
        </span>
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════
// GLASS CARD - Glassmorphism Premium 2026
// ═══════════════════════════════════════════════════════════
export function GlassCard({
  children,
  className = '',
  glow,
}: {
  children: ReactNode
  className?: string
  glow?: 'green' | 'lilas' | 'orange'
}) {
  const glowStyles = {
    green: 'shadow-glow-green border-fisica-500/20',
    lilas: 'shadow-glow-lilas border-matematica-500/20',
    orange: 'shadow-glow-orange border-secondary-500/20',
  }

  return (
    <div className={`
      bg-dark-glass backdrop-blur-xl
      rounded-2xl p-6
      border border-border-glass
      shadow-glass
      ${glow ? glowStyles[glow] : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}
