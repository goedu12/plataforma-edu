'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Home, BookOpen, Trophy, User } from 'lucide-react'
import type { Componente } from '@/types'

interface BottomNavProps {
  componente: Componente
}

export default function BottomNav({ componente }: BottomNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  const isFisica = componente === 'fisica'
  const activeColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const activeBg = isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)'

  const items = [
    { icon: Home, label: 'Início', href: `/${componente}/menu` },
    { icon: BookOpen, label: 'Estudar', href: `/${componente}/estudar` },
    { icon: Trophy, label: 'Ranking', href: `/${componente}/ranking` },
    { icon: User, label: 'Perfil', href: `/${componente}/perfil` },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
        zIndex: 50,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)',
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href ||
          (item.href.includes('/menu') && pathname === `/${componente}/menu`)

        return (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              minWidth: '64px',
              minHeight: '48px',
              padding: '8px 12px',
              borderRadius: '12px',
              background: isActive ? activeBg : 'transparent',
              color: isActive ? activeColor : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <item.icon style={{ width: '20px', height: '20px' }} />
            <span style={{ fontSize: '10px', fontWeight: 500 }}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
