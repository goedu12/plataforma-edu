'use client'

import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
  padding?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'terminal' | 'glass'
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
  // Estilos base - Koyeb Style
  const variantStyles = {
    default: 'bg-white rounded-2xl shadow-koyeb border border-gray-100',
    terminal: 'bg-koyeb-dark rounded-2xl shadow-koyeb-lg',
    glass: 'bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-koyeb',
  }

  const interactiveStyles = interactive
    ? 'hover:shadow-koyeb-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer'
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

// Subcomponente para título do card - Koyeb Style
export function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <h3 className={`text-lg font-bold text-koyeb-dark uppercase tracking-tight ${className}`}>{children}</h3>
}

// Subcomponente para descrição do card
export function CardDescription({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={`text-sm text-gray-500 mt-1 ${className}`}>{children}</p>
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
  return <div className={`mt-4 pt-4 border-t border-gray-100 ${className}`}>{children}</div>
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
    <div className={`bg-koyeb-dark rounded-2xl overflow-hidden shadow-koyeb-lg ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/50">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-500" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        {title && <span className="ml-2 text-sm text-gray-400">{title}</span>}
      </div>
      <div className="p-4 font-mono text-sm text-gray-300">
        {children}
      </div>
    </div>
  )
}
