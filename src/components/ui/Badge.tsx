'use client'

import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'error' | 'warning' | 'fisica' | 'matematica'
  size?: 'sm' | 'md'
  className?: string
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-dark-elevated/80 text-text-secondary border border-border',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    error: 'bg-red-500/20 text-red-400 border border-red-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    fisica: 'bg-fisica-500/20 text-fisica-400 border border-fisica-500/30',
    matematica: 'bg-matematica-500/20 text-matematica-400 border border-matematica-500/30',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  }

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}
