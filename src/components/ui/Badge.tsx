'use client'

import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'fisica' | 'matematica' | 'streak' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
  size?: 'sm' | 'md'
  className?: string
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
  }

  const getVariantStyle = () => {
    switch (variant) {
      case 'fisica':
        return {
          background: 'var(--color-fisica-bg-15)',
          color: 'var(--color-fisica)',
        }
      case 'matematica':
        return {
          background: 'var(--color-matematica-bg-15)',
          color: 'var(--color-matematica)',
        }
      case 'streak':
        return {
          background: 'var(--orange-bg-15)',
          color: 'var(--color-streak)',
        }
      case 'success':
        return {
          background: 'var(--success-bg-15)',
          color: 'var(--success)',
        }
      case 'warning':
        return {
          background: 'var(--warning-bg-15)',
          color: 'var(--warning)',
        }
      case 'error':
        return {
          background: 'var(--error-bg-15)',
          color: 'var(--error)',
        }
      case 'info':
        return {
          background: 'var(--info-bg-15)',
          color: 'var(--info)',
        }
      case 'secondary':
        return {
          background: 'var(--bg-elevated)',
          color: 'var(--text-muted)',
        }
      default:
        return {
          background: 'var(--bg-surface-hover)',
          color: 'var(--text-secondary)',
        }
    }
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${sizeStyles[size]} ${className}`}
      style={getVariantStyle()}
    >
      {children}
    </span>
  )
}
