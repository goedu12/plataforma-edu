'use client'

import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'fisica' | 'matematica' | 'elevated'
  className?: string
}

export default function Card({
  children,
  interactive = false,
  padding = 'md',
  variant = 'default',
  className = '',
  style,
  ...props
}: CardProps) {
  // Padding styles
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }

  // Get variant styles
  const getVariantStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: '1rem',
      transition: 'all 0.2s ease',
    }

    switch (variant) {
      case 'fisica':
        return {
          ...base,
          borderColor: 'var(--border-fisica)',
        }
      case 'matematica':
        return {
          ...base,
          borderColor: 'var(--border-matematica)',
        }
      case 'elevated':
        return {
          ...base,
          background: 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-card)',
        }
      default:
        return base
    }
  }

  const interactiveClass = interactive
    ? 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0'
    : ''

  return (
    <div
      className={`${paddingStyles[padding]} ${interactiveClass} ${className}`}
      style={{ ...getVariantStyle(), ...style }}
      {...props}
    >
      {children}
    </div>
  )
}

// Card Header
export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`mb-4 ${className}`}>{children}</div>
}

// Card Title - Uses Nunito (font-display), NO UPPERCASE
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
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }

  return (
    <h3
      className={`font-display font-semibold ${sizeStyles[size]} ${className}`}
      style={{ color: 'var(--text-primary)' }}
    >
      {children}
    </h3>
  )
}

// Card Description
export function CardDescription({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={`text-sm mt-1 ${className}`}
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </p>
  )
}

// Card Content
export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

// Card Footer
export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`mt-4 pt-4 ${className}`}
      style={{ borderTop: '1px solid var(--border-default)' }}
    >
      {children}
    </div>
  )
}

// Terminal Card (Professor only)
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
    <div
      className={`terminal-box ${className}`}
    >
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="terminal-dot terminal-dot-red" />
          <span className="terminal-dot terminal-dot-yellow" />
          <span className="terminal-dot terminal-dot-green" />
        </div>
        {title && <span className="terminal-title">{title}</span>}
      </div>
      <div className="terminal-body">
        {children}
      </div>
    </div>
  )
}

// Stat Card
export function StatCard({
  value,
  label,
  icon,
  componente = 'fisica',
  className = '',
}: {
  value: string | number
  label: string
  icon?: ReactNode
  componente?: 'fisica' | 'matematica'
  className?: string
}) {
  const color = componente === 'fisica'
    ? 'var(--color-fisica)'
    : 'var(--color-matematica)'

  return (
    <div
      className={`stat-card ${className}`}
    >
      {icon && (
        <div
          className="stat-icon"
          style={{ color }}
        >
          {icon}
        </div>
      )}
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  )
}
