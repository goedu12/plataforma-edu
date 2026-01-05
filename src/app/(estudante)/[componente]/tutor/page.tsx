'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Bot } from 'lucide-react'
import TutorChat from '@/components/TutorChat'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
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

  const handleVoltar = () => router.push(`/${componente}/menu`)

  return (
    <div
      className="lg:pl-[72px]"
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
      }}
    >
      <NavigationRail componente={componente} />

      {/* Header com botão voltar - visível apenas em mobile */}
      <header
        className="lg:hidden px-4 py-3 flex items-center gap-3"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <button
          onClick={handleVoltar}
          className="p-2 rounded-xl transition-colors touch-target"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" style={{ color: isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)' }} />
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Tutor {nomeTutor}
          </span>
        </div>
      </header>

      {/* Chat ocupa todo o espaço disponível */}
      <div
        className="pb-16 lg:pb-0"
        style={{ flex: 1, overflow: 'hidden', maxWidth: '672px', margin: '0 auto', width: '100%' }}
      >
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
