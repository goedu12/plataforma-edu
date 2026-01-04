'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
        paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0))',
      }}
    >
      {/* Chat ocupa todo o espaço disponível */}
      <div style={{ flex: 1, overflow: 'hidden', maxWidth: '672px', margin: '0 auto', width: '100%' }}>
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
