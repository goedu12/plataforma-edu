'use client'

import { Loader2 } from 'lucide-react'

// Logo estático da plataforma seu10
const LOGO_URL = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/logos/Design%20sem%20nome%20(1).png'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
  componente?: 'fisica' | 'matematica'
}

export default function Loading({
  size = 'md',
  text,
  fullScreen = false,
  componente = 'fisica',
}: LoadingProps) {

  const sizeStyles = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  const color = componente === 'fisica'
    ? 'var(--color-fisica)'
    : 'var(--color-matematica)'

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2
        className={`animate-spin ${sizeStyles[size]}`}
        style={{ color }}
      />
      {text && (
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center backdrop-blur-sm"
        style={{ background: 'var(--bg-base)', zIndex: 100 }}
      >
        {/* Logo seu10 */}
        <div className="mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt="seu10"
            className="max-h-[100px] w-auto opacity-95"
          />
        </div>
        {content}
      </div>
    )
  }

  return content
}

// Skeleton para loading de conteudo
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`skeleton ${className}`}
    />
  )
}

// Skeleton para lista
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Typing indicator para chat
export function TypingIndicator({ componente = 'fisica' }: { componente?: 'fisica' | 'matematica' }) {
  const color = componente === 'fisica'
    ? 'var(--color-fisica)'
    : 'var(--color-matematica)'

  return (
    <div className="flex items-center gap-1.5 p-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full animate-bounce"
          style={{
            background: color,
            animationDelay: `${i * 150}ms`
          }}
        />
      ))}
    </div>
  )
}
