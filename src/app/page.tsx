'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Atom, Calculator, Loader2 } from 'lucide-react'

// Cores Koyeb
const KOYEB = {
  bg: '#0D0D14',
  bgCard: '#1A1A2E',
  bgElevated: '#222238',
  primary: '#00FF88',
  accent: '#00D4FF',
  fisica: '#00FF88',
  matematica: '#A855F7',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B8B9A',
  textMuted: '#5A5A6E',
}

export default function HomePage() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Verificar se está autenticado
    const verificarAuth = async () => {
      try {
        const response = await fetch('/api/usuario')
        const data = await response.json()

        if (data.sucesso && data.usuario) {
          // Redirecionar baseado no tipo
          if (data.usuario.tipo === 'professor') {
            router.push('/professor/dashboard')
          } else if (Array.isArray(data.usuario.componentes) && data.usuario.componentes.length === 1) {
            router.push(`/${data.usuario.componentes[0]}/menu`)
          } else if (Array.isArray(data.usuario.componentes) && data.usuario.componentes.length > 1) {
            router.push('/selecionar')
          } else {
            // Sem componentes ou componentes inválido - vai para seleção
            router.push('/selecionar')
          }
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      }
    }

    // Pequeno delay para animação
    const timer = setTimeout(() => {
      verificarAuth()
    }, 800)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: `linear-gradient(180deg, ${KOYEB.bg} 0%, ${KOYEB.bgCard} 100%)`,
      }}
    >
      <div className="text-center animate-fade-in px-6">
        {/* Logo animado */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${KOYEB.fisica} 0%, rgba(0, 255, 136, 0.7) 100%)`,
              boxShadow: `0 0 40px rgba(0, 255, 136, 0.3)`,
            }}
          >
            <Atom className="w-12 h-12" style={{ color: KOYEB.bg }} />
          </div>

          <div
            className="w-3 h-3 rounded-full animate-bounce"
            style={{
              background: KOYEB.accent,
              boxShadow: `0 0 20px ${KOYEB.accent}`,
              animationDelay: '0.2s',
            }}
          />

          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${KOYEB.matematica} 0%, rgba(168, 85, 247, 0.7) 100%)`,
              boxShadow: `0 0 40px rgba(168, 85, 247, 0.3)`,
              animationDelay: '0.3s',
            }}
          >
            <Calculator className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Título */}
        <h1
          className="font-mono text-3xl font-bold tracking-wide mb-2"
          style={{ color: KOYEB.textPrimary }}
        >
          Plataforma <span style={{ color: KOYEB.primary }}>EDU</span>
        </h1>
        <p
          className="font-mono text-sm tracking-widest uppercase mb-8"
          style={{ color: KOYEB.textMuted }}
        >
          Colégio Cora Coralina
        </p>

        {/* Loading */}
        <div className="flex items-center justify-center gap-3">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: KOYEB.primary }}
          />
          <span
            className="font-mono text-sm"
            style={{ color: KOYEB.textSecondary }}
          >
            Carregando...
          </span>
        </div>

        {/* Terminal style footer */}
        <div
          className="mt-12 rounded-xl overflow-hidden max-w-xs mx-auto"
          style={{ background: KOYEB.bgElevated }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{ background: KOYEB.bgCard }}
          >
            <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F56' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
            <span className="w-3 h-3 rounded-full" style={{ background: '#27CA40' }} />
            <span
              className="ml-2 font-mono text-xs"
              style={{ color: KOYEB.textMuted }}
            >
              init.sh
            </span>
          </div>
          <div className="px-4 py-3">
            <p className="font-mono text-xs" style={{ color: KOYEB.textMuted }}>
              $ Inicializando sistema...
            </p>
            <p className="font-mono text-xs mt-1" style={{ color: KOYEB.primary }}>
              ✓ Conectado
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
