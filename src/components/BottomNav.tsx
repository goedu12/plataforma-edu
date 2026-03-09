'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Home, BookOpen, Trophy, User, Zap } from 'lucide-react'
import type { Componente } from '@/types'

interface BottomNavProps {
  componente: Componente
}

export default function BottomNav({ componente }: BottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isFisica = componente === 'fisica'
  const activeColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const activeBg = isFisica ? 'var(--color-fisica-bg-10)' : 'var(--color-matematica-bg-10)'

  const items = [
    { icon: Home, label: 'Início', href: `/${componente}/menu` },
    { icon: BookOpen, label: 'Estudar', href: `/${componente}/estudar` },
    { icon: Zap, label: 'Desafio', href: `/${componente}/desafio` },
    { icon: Trophy, label: 'Ranking', href: `/${componente}/ranking` },
    { icon: User, label: 'Perfil', href: `/${componente}/perfil` },
  ]

  return (
    <nav
      role="navigation"
      aria-label="Menu principal"
      className="flex lg:hidden fixed bottom-0 left-0 right-0 items-center justify-around"
      style={{
        height: '64px',
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-default)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        zIndex: 50,
        boxShadow: 'var(--shadow-nav)',
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href ||
          (item.href.includes('/menu') && pathname === `/${componente}/menu`)

        return (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            aria-label={item.label}
            className="flex flex-col items-center justify-center rounded-xl"
            style={{
              gap: '2px',
              minWidth: '56px',
              minHeight: '48px',
              padding: '6px 8px',
              background: isActive ? activeBg : 'transparent',
              color: isActive ? activeColor : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <item.icon style={{ width: '20px', height: '20px' }} />
            <span className="text-[10px] font-medium leading-tight">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
