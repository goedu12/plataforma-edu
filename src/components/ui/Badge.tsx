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
          background: 'rgba(34, 197, 94, 0.15)',
          color: 'var(--color-fisica)',
        }
      case 'matematica':
        return {
          background: 'rgba(139, 92, 246, 0.15)',
          color: 'var(--color-matematica)',
        }
      case 'streak':
        return {
          background: 'rgba(249, 115, 22, 0.15)',
          color: 'var(--color-streak)',
        }
      case 'success':
        return {
          background: 'rgba(16, 185, 129, 0.15)',
          color: 'var(--success)',
        }
      case 'warning':
        return {
          background: 'rgba(245, 158, 11, 0.15)',
          color: 'var(--warning)',
        }
      case 'error':
        return {
          background: 'rgba(239, 68, 68, 0.15)',
          color: 'var(--error)',
        }
      case 'info':
        return {
          background: 'rgba(59, 130, 246, 0.15)',
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
