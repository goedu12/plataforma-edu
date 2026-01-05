'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeIconToggleProps {
  componente?: 'fisica' | 'matematica'
}

export default function ThemeIconToggle({ componente = 'fisica' }: ThemeIconToggleProps) {
  const [theme, setTheme] = useState<Theme>('auto')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const cycleTheme = () => {
    const themes: Theme[] = ['auto', 'light', 'dark']
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]

    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)

    if (nextTheme === 'light') {
      document.documentElement.classList.add('light')
    } else if (nextTheme === 'dark') {
      document.documentElement.classList.remove('light')
    } else {
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.classList.add('light')
      } else {
        document.documentElement.classList.remove('light')
      }
    }
  }

  if (!mounted) return null

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <button
      onClick={cycleTheme}
      className="p-3 rounded-xl transition-all touch-target"
      style={{
        border: '1px solid var(--border-default)',
        color: 'var(--text-secondary)',
      }}
      title={`Tema: ${theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Automático'}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  )
}
