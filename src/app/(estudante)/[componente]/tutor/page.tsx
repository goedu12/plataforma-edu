'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Bot, Zap } from 'lucide-react'
import TutorChat from '@/components/TutorChat'
import Loading from '@/components/ui/Loading'
import BackButton from '@/components/ui/BackButton'
import NavigationRail from '@/components/NavigationRail'
import useTempoUso from '@/hooks/useTempoUso'
import type { Componente, Usuario } from '@/types'
import { PONTUACAO } from '@/types'

export default function TutorPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  // Rastrear tempo de uso efetivo
  useTempoUso(componente, 'tutor')

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
  const limiteDiario = PONTUACAO.LIMITE_IA_DIARIO
  const percentualUso = Math.min((usoHoje / limiteDiario) * 100, 100)
  const restantes = Math.max(limiteDiario - usoHoje, 0)

  const handleVoltar = () => router.push(`/${componente}/menu`)

  // Cor do indicador baseada no uso
  const getCorIndicador = () => {
    if (percentualUso >= 90) return 'var(--error)'
    if (percentualUso >= 70) return 'var(--warning)'
    return corPrimaria
  }

  return (
    <div
      className="lg:pl-[72px]"
      style={{
        height: '100dvh', // dvh para mobile (dynamic viewport height)
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-base)',
      }}
    >
      <NavigationRail componente={componente} />

      {/* Header Compacto com indicador de uso */}
      <header
        className="px-4 py-2 flex-shrink-0"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Linha 1: Navegação + Título + Indicador */}
          <div className="flex items-center justify-between gap-2">
            <BackButton href={`/${componente}/menu`} mobileOnly />

            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" style={{ color: corPrimaria }} />
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Tutor {nomeTutor}
              </span>
            </div>

            {/* Indicador de uso */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
              style={{
                background: 'var(--bg-elevated)',
                color: getCorIndicador(),
              }}
              title={`${restantes} mensagens restantes hoje`}
            >
              <Zap className="w-4 h-4" />
              <span className="tabular-nums">{restantes}</span>
            </div>
          </div>

          {/* Linha 2: Barra de progresso do limite diário */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentualUso}%`,
                  background: getCorIndicador(),
                }}
              />
            </div>
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {usoHoje}/{limiteDiario}
            </span>
          </div>
        </div>
      </header>

      {/* Chat ocupa todo o espaço disponível - SEM BottomNav */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          maxWidth: '768px', // Mais largo para melhor leitura
          margin: '0 auto',
          width: '100%',
        }}
      >
        <TutorChat
          componente={componente}
          nomeTutor={nomeTutor}
          nomeEstudante={usuario.nome}
          usoHoje={usoHoje}
          limiteDiario={limiteDiario}
          onClose={handleVoltar}
        />
      </div>
    </div>
  )
}
