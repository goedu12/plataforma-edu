'use client'

import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
  padding?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'terminal' | 'glass' | 'glow-fisica' | 'glow-matematica'
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
  // Estilos base - Dark Theme Premium
  const variantStyles = {
    default: 'bg-dark-surface rounded-2xl shadow-dark border border-dark-border',
    elevated: 'bg-dark-elevated rounded-2xl shadow-dark-lg border border-dark-border',
    terminal: 'bg-dark-bg rounded-2xl shadow-dark-lg border border-dark-border',
    glass: 'bg-dark-surface/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-dark',
    'glow-fisica': 'bg-dark-surface rounded-2xl border border-fisica-400/30 shadow-glow-fisica',
    'glow-matematica': 'bg-dark-surface rounded-2xl border border-matematica-300/30 shadow-glow-matematica',
  }

  const interactiveStyles = interactive
    ? 'hover:shadow-dark-hover hover:-translate-y-1 hover:border-dark-muted transition-all duration-300 cursor-pointer'
    : 'transition-all duration-300'

  const paddingStyles = {
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  }

  return (
    <div
      className={`${variantStyles[variant]} ${interactiveStyles} ${paddingStyles[padding]} ${className}`}
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

// Subcomponente para título do card - Dark Theme
export function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <h3 className={`text-lg font-bold text-white uppercase tracking-tight ${className}`}>{children}</h3>
}

// Subcomponente para descrição do card
export function CardDescription({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={`text-sm text-light-secondary mt-1 ${className}`}>{children}</p>
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
  return <div className={`mt-4 pt-4 border-t border-dark-border ${className}`}>{children}</div>
}

// Terminal Window Card - Dark Theme
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
    <div className={`bg-dark-bg rounded-2xl overflow-hidden shadow-dark-lg border border-dark-border ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 bg-dark-surface border-b border-dark-border">
        <span className="w-3 h-3 rounded-full bg-error" />
        <span className="w-3 h-3 rounded-full bg-warning" />
        <span className="w-3 h-3 rounded-full bg-success" />
        {title && <span className="ml-2 text-sm text-light-muted font-mono">{title}</span>}
      </div>
      <div className="p-4 font-mono text-sm text-light-secondary">
        {children}
      </div>
    </div>
  )
}

// Stat Card - Dark Theme
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
  color?: 'default' | 'fisica' | 'matematica' | 'orange'
  className?: string
}) {
  const colorStyles = {
    default: 'text-white',
    fisica: 'text-fisica-400',
    matematica: 'text-matematica-300',
    orange: 'text-accent-orange',
  }

  return (
    <div className={`bg-dark-surface rounded-2xl p-5 border border-dark-border ${className}`}>
      {icon && (
        <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-dark-elevated ${colorStyles[color]}`}>
          {icon}
        </div>
      )}
      <p className={`text-3xl font-black tabular-nums ${colorStyles[color]}`}>{value}</p>
      <p className="text-xs font-bold text-light-muted uppercase tracking-widest mt-1">{label}</p>
    </div>
  )
}
