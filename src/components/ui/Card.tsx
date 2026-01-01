'use client'

import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
  padding?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'fisica' | 'matematica'
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
  // Estilos base - Calm Design
  const variantStyles = {
    default: 'bg-calm-surface rounded-2xl shadow-card border border-calm-border',
    elevated: 'bg-calm-surface rounded-2xl shadow-elevated',
    fisica: 'bg-calm-surface rounded-2xl shadow-card border-l-4 border-l-fisica-500 border border-calm-border',
    matematica: 'bg-calm-surface rounded-2xl shadow-card border-l-4 border-l-matematica-500 border border-calm-border',
  }

  const interactiveStyles = interactive
    ? 'hover:shadow-elevated hover:-translate-y-0.5 cursor-pointer transition-all duration-200'
    : 'transition-all duration-200'

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

// Subcomponente para título do card - Calm Design
export function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <h3 className={`text-lg font-semibold text-text-primary ${className}`}>{children}</h3>
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
  return <div className={`mt-4 pt-4 border-t border-calm-border ${className}`}>{children}</div>
}

// Terminal Window Card - para instruções
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
    <div className={`bg-gray-900 rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
        {title && <span className="ml-2 text-sm text-gray-400 font-mono">{title}</span>}
      </div>
      <div className="p-4 font-mono text-sm text-gray-300">
        {children}
      </div>
    </div>
  )
}

// Stat Card - Calm Design
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
    default: 'text-text-primary',
    fisica: 'text-fisica-500',
    matematica: 'text-matematica-500',
    orange: 'text-accent-orange',
  }

  const bgStyles = {
    default: 'bg-calm-elevated',
    fisica: 'bg-fisica-50',
    matematica: 'bg-matematica-50',
    orange: 'bg-orange-50',
  }

  return (
    <div className={`bg-calm-surface rounded-2xl p-5 border border-calm-border ${className}`}>
      {icon && (
        <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center ${bgStyles[color]} ${colorStyles[color]}`}>
          {icon}
        </div>
      )}
      <p className={`text-3xl font-bold tabular-nums ${colorStyles[color]}`}>{value}</p>
      <p className="text-sm text-text-muted mt-1">{label}</p>
    </div>
  )
}
