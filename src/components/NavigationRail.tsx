'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, BookOpen, Zap, Trophy, User } from 'lucide-react'
import type { Componente } from '@/types'

interface NavigationRailProps {
  componente: Componente
}

export default function NavigationRail({ componente }: NavigationRailProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const navItems = [
    { icon: Home, label: 'Início', href: `/${componente}/menu` },
    { icon: BookOpen, label: 'Estudar', href: `/${componente}/estudar` },
    { icon: Zap, label: 'Desafio', href: `/${componente}/desafio` },
    { icon: Trophy, label: 'Ranking', href: `/${componente}/ranking` },
    { icon: User, label: 'Perfil', href: `/${componente}/perfil` },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav
      className="hidden lg:flex"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '72px',
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border-default)',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '24px',
        paddingBottom: '24px',
        gap: '8px',
        zIndex: 50,
      }}
    >
      {navItems.map((item) => {
        const active = isActive(item.href)
        return (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            aria-label={item.label}
            title={item.label}
            className="flex flex-col items-center justify-center gap-1 transition-all"
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: active ? (isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)') : 'transparent',
              color: active ? accentColor : 'var(--text-secondary)',
            }}
          >
            <item.icon
              style={{
                width: '24px',
                height: '24px',
              }}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: active ? 600 : 400,
              }}
            >
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
