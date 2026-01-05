'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeToggleProps {
  componente?: 'fisica' | 'matematica'
}

export default function ThemeToggle({ componente = 'fisica' }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('auto')
  const [mounted, setMounted] = useState(false)

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)

    if (newTheme === 'light') {
      document.documentElement.classList.add('light')
    } else if (newTheme === 'dark') {
      document.documentElement.classList.remove('light')
    } else {
      // Auto: seguir preferência do sistema
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.classList.add('light')
      } else {
        document.documentElement.classList.remove('light')
      }
    }
  }

  if (!mounted) {
    return (
      <div className="h-12 rounded-xl animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
    )
  }

  const options: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: 'Claro' },
    { value: 'auto', icon: Monitor, label: 'Auto' },
    { value: 'dark', icon: Moon, label: 'Escuro' },
  ]

  return (
    <div
      className="flex rounded-xl p-1"
      style={{ background: 'var(--bg-elevated)' }}
    >
      {options.map((option) => {
        const Icon = option.icon
        const isActive = theme === option.value

        return (
          <button
            key={option.value}
            onClick={() => handleThemeChange(option.value)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all touch-target"
            style={{
              background: isActive ? accentColor : 'transparent',
              color: isActive
                ? (isFisica ? '#000' : '#fff')
                : 'var(--text-secondary)',
            }}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
