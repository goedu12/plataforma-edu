'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, BookOpen, Zap, Trophy, User, RotateCcw, TrendingUp, Sparkles } from 'lucide-react'
import type { Componente } from '@/types'

interface NavigationRailProps {
  componente: Componente
}

export default function NavigationRail({ componente }: NavigationRailProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const activeBg = isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)'

  const navItems = [
    { icon: Home, label: 'Início', href: `/${componente}/menu` },
    { icon: BookOpen, label: 'Estudar', href: `/${componente}/estudar` },
    { icon: Zap, label: 'Desafio', href: `/${componente}/desafio` },
    { icon: RotateCcw, label: 'Revisão', href: `/${componente}/revisao` },
    { icon: Sparkles, label: 'FlashCards', href: `/${componente}/flashcards` },
    { icon: TrendingUp, label: 'Notas', href: `/${componente}/notas` },
    { icon: Trophy, label: 'Ranking', href: `/${componente}/ranking` },
    { icon: User, label: 'Perfil', href: `/${componente}/perfil` },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav
      role="navigation"
      aria-label="Menu principal"
      className="hidden lg:flex"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: expanded ? '200px' : '72px',
        background: 'var(--bg-elevated)',
        borderRight: '1px solid var(--border-default)',
        flexDirection: 'column',
        alignItems: expanded ? 'stretch' : 'center',
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingLeft: expanded ? '12px' : '8px',
        paddingRight: expanded ? '12px' : '8px',
        gap: '4px',
        zIndex: 50,
        transition: 'width 0.2s ease, padding 0.2s ease',
        overflowX: 'hidden',
      }}
    >
      {/* Logo/Título no topo */}
      <div
        className="flex items-center gap-3 mb-4 px-2"
        style={{
          minHeight: '40px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: accentColor }}
        >
          <span className="font-bold text-lg" style={{ color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }}>
            {isFisica ? 'F' : 'M'}
          </span>
        </div>
        {expanded && (
          <span
            className="font-semibold text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            {isFisica ? 'Física' : 'Matemática'}
          </span>
        )}
      </div>

      {/* Items de navegação */}
      {navItems.map((item) => {
        const active = isActive(item.href)
        return (
          <button
            key={item.label}
            onClick={() => router.push(item.href)}
            aria-label={item.label}
            title={!expanded ? item.label : undefined}
            className="flex items-center gap-3 transition-all"
            style={{
              minHeight: '48px',
              padding: expanded ? '0 12px' : '0',
              justifyContent: expanded ? 'flex-start' : 'center',
              borderRadius: '0.75rem',
              background: active ? activeBg : 'transparent',
              color: active ? accentColor : 'var(--text-secondary)',
            }}
          >
            <item.icon
              className="flex-shrink-0"
              style={{
                width: '22px',
                height: '22px',
              }}
            />
            {expanded && (
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: active ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
