'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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
  const usoHoje = componente === 'fisica' ? usuario.fis_uso_ia_hoje : usuario.mat_uso_ia_hoje

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push(`/${componente}/menu`)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-800">🤖 {nomeTutor}</h1>
          <div className="text-sm text-gray-500">
            {usoHoje}/{PONTUACAO.LIMITE_IA_DIARIO}
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
