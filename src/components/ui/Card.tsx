'use client'

import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
  padding?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Card({
  children,
  interactive = false,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'bg-white rounded-2xl shadow-md'

  const interactiveStyles = interactive
    ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer'
    : ''

  const paddingStyles = {
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  }

  return (
    <div
      className={`${baseStyles} ${interactiveStyles} ${paddingStyles[padding]} ${className}`}
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

// Subcomponente para título do card
export function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>{children}</h3>
}

// Subcomponente para descrição do card
export function CardDescription({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <p className={`text-sm text-gray-500 ${className}`}>{children}</p>
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
