'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Bot, Sparkles, MessageCircle } from 'lucide-react'
import TutorChat from '@/components/TutorChat'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import type { Componente, Usuario } from '@/types'
import { PONTUACAO } from '@/types'

export default function TutorPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    const buscarUsuario = async () => {
      try {
        const response = await fetch('/api/usuario')
        const data = await response.json()

        if (data.sucesso && data.usuario) {
          if (!data.usuario.componentes.includes(componente)) {
            router.push('/selecionar')
            return
          }
          setUsuario(data.usuario)
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    buscarUsuario()
  }, [router, componente])

  if (loading || !usuario) {
    return <Loading fullScreen componente={componente} />
  }

  const nomeTutor = isFisica ? 'Newton' : 'Pitágoras'
  const usoHoje = isFisica ? usuario.fis_uso_ia_hoje : usuario.mat_uso_ia_hoje
  const usosRestantes = PONTUACAO.LIMITE_IA_DIARIO - usoHoje

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="px-4 py-4" style={{ background: corPrimaria }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-3 -ml-2 rounded-xl hover:bg-black/20 transition-colors touch-target"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2" style={{ color: isFisica ? '#000' : '#fff' }}>
              <Bot className="w-5 h-5" />
              <h1 className="font-display font-semibold">Tutor {nomeTutor}</h1>
            </div>
            <div
              className="flex items-center gap-1 rounded-full px-3 py-1"
              style={{ background: 'rgba(0,0,0,0.2)', color: isFisica ? '#000' : '#fff' }}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{usoHoje}/{PONTUACAO.LIMITE_IA_DIARIO}</span>
            </div>
          </div>

          {/* Info Bar */}
          <div
            className="flex items-center justify-center gap-4 text-sm"
            style={{ color: isFisica ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)' }}
          >
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span>IA Generativa</span>
            </div>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>{usosRestantes} msgs restantes hoje</span>
          </div>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden max-w-2xl mx-auto w-full">
        <TutorChat
          componente={componente}
          nomeTutor={nomeTutor}
          nomeEstudante={usuario.nome}
          usoHoje={usoHoje}
          limiteDiario={PONTUACAO.LIMITE_IA_DIARIO}
          onClose={() => router.push(`/${componente}/menu`)}
        />
      </div>

      <BottomNav componente={componente} />
    </div>
  )
}
