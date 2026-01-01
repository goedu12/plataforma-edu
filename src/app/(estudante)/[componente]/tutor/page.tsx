'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Bot, Sparkles, MessageCircle, Zap } from 'lucide-react'
import TutorChat from '@/components/TutorChat'
import Loading from '@/components/ui/Loading'
import type { Componente, Usuario } from '@/types'
import { PONTUACAO } from '@/types'

export default function TutorPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

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

  const nomeTutor = componente === 'fisica' ? 'Newton' : 'Pitágoras'
  const iconeTutor = componente === 'fisica' ? '🍎' : '📐'
  const usoHoje = componente === 'fisica' ? usuario.fis_uso_ia_hoje : usuario.mat_uso_ia_hoje
  const usosRestantes = PONTUACAO.LIMITE_IA_DIARIO - usoHoje

  const bgGradient = componente === 'fisica'
    ? 'from-fisica-500 to-fisica-600'
    : 'from-matematica-500 to-matematica-600'

  return (
    <div className="h-screen flex flex-col bg-koyeb-bg">
      {/* Header */}
      <header className={`bg-gradient-to-br ${bgGradient} text-white px-4 py-4`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h1 className="font-bold uppercase tracking-tight">Tutor {nomeTutor}</h1>
              <span className="text-xl">{iconeTutor}</span>
            </div>
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-bold">{usoHoje}/{PONTUACAO.LIMITE_IA_DIARIO}</span>
            </div>
          </div>

          {/* Info Bar */}
          <div className="flex items-center justify-center gap-4 text-sm text-white/80">
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span>IA Generativa</span>
            </div>
            <span className="text-white/40">•</span>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>{usosRestantes} msgs restantes hoje</span>
            </div>
          </div>
        </div>
      </header>

      {/* Chat */}
      <div className="flex-1 overflow-hidden max-w-2xl mx-auto w-full">
        <TutorChat
          componente={componente}
          nomeTutor={nomeTutor}
          usoHoje={usoHoje}
          limiteDiario={PONTUACAO.LIMITE_IA_DIARIO}
          onClose={() => router.push(`/${componente}/menu`)}
        />
      </div>
    </div>
  )
}
