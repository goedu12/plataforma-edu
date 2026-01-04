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

  const color = componente === 'fisica'
    ? 'var(--color-fisica)'
    : 'var(--color-matematica)'

  const items = [
    {
      icon: Home,
      label: 'Inicio',
      href: `/${componente}/menu`,
    },
    {
      icon: BookOpen,
      label: 'Estudar',
      href: `/${componente}/estudar`,
    },
    {
      icon: Trophy,
      label: 'Ranking',
      href: `/${componente}/ranking`,
    },
    {
      icon: User,
      label: 'Perfil',
      href: `/${componente}/perfil`,
    },
  ]

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const isActive = pathname === item.href ||
          (item.href.includes('/menu') && pathname === `/${componente}/menu`)

        return (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            className="bottom-nav-item touch-target"
            style={{
              color: isActive ? color : 'var(--text-muted)',
              background: isActive
                ? componente === 'fisica'
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(139, 92, 246, 0.1)'
                : 'transparent',
              borderRadius: '12px',
            }}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
