'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Logo estático da plataforma (mesmo do login)
const LOGO_URL = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/logos/Design%20sem%20nome.webp'

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
        {/* Logo da plataforma */}
        <div className="flex items-center justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt="Seu10"
            className="h-auto max-h-[140px] w-auto animate-pulse"
          />
        </div>

        {/* Subtítulo */}
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
            Conectando...
          </span>
        </div>
      </div>
    </div>
  )
}
