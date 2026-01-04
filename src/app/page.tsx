'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Atom, Calculator, Loader2 } from 'lucide-react'

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
        background: 'linear-gradient(180deg, var(--bg-base) 0%, var(--bg-surface) 100%)',
      }}
    >
      <div className="text-center animate-fade-in px-6">
        {/* Logo animado */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
            style={{
              background: 'linear-gradient(135deg, var(--color-fisica) 0%, var(--color-fisica-light) 100%)',
              boxShadow: '0 0 40px var(--color-fisica-glow)',
            }}
          >
            <Atom className="w-12 h-12 text-black" />
          </div>

          <div
            className="w-3 h-3 rounded-full animate-bounce"
            style={{
              background: 'var(--color-accent)',
              boxShadow: '0 0 20px var(--color-accent)',
              animationDelay: '0.2s',
            }}
          />

          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg animate-pulse"
            style={{
              background: 'linear-gradient(135deg, var(--color-matematica) 0%, var(--color-matematica-light) 100%)',
              boxShadow: '0 0 40px var(--color-matematica-glow)',
              animationDelay: '0.3s',
            }}
          >
            <Calculator className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Título */}
        <h1
          className="font-display text-3xl font-bold tracking-wide mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Plataforma <span style={{ color: 'var(--color-fisica)' }}>EDU</span>
        </h1>
        <p
          className="text-sm tracking-widest mb-8"
          style={{ color: 'var(--text-muted)' }}
        >
          Colégio Cora Coralina
        </p>

        {/* Loading */}
        <div className="flex items-center justify-center gap-3">
          <Loader2
            className="w-5 h-5 animate-spin"
            style={{ color: 'var(--color-fisica)' }}
          />
          <span
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Carregando...
          </span>
        </div>
      </div>
    </div>
  )
}
