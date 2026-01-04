'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Medal, Lock, CheckCircle2, RefreshCw, WifiOff, Target } from 'lucide-react'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import type { Componente, Conquista } from '@/types'

interface ConquistaComStatus extends Conquista {
  desbloqueada: boolean
  desbloqueada_em?: string
}

export default function ConquistasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [conquistas, setConquistas] = useState<ConquistaComStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, desbloqueadas: 0 })

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const nomeComponente = isFisica ? 'Física' : 'Matemática'

  const buscarConquistas = async () => {
    setLoading(true)
    setErro(null)

    try {
      const response = await fetch(`/api/conquistas?componente=${componente}`)
      const data = await response.json()

      if (data.sucesso) {
        setConquistas(data.conquistas)
        setStats({ total: data.total, desbloqueadas: data.desbloqueadas })
      } else {
        setErro(data.erro || 'Erro ao carregar conquistas')
      }
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error)
      setErro('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarConquistas()
  }, [componente, router])

  if (loading) return <Loading fullScreen componente={componente} />

  const porcentagem = stats.total > 0 ? Math.round((stats.desbloqueadas / stats.total) * 100) : 0
  const conquistasDesbloqueadas = conquistas.filter(c => c.desbloqueada)
  const conquistasBloqueadas = conquistas.filter(c => !c.desbloqueada)

  const formatarRequisito = (conquista: ConquistaComStatus) => {
    switch (conquista.requisito_tipo) {
      case 'pontos': return `${conquista.requisito_valor} pontos`
      case 'questoes': return `${conquista.requisito_valor} questões respondidas`
      case 'sequencia': return `${conquista.requisito_valor} dias consecutivos`
      case 'acertos': return `${conquista.requisito_valor}% de acerto`
      default: return ''
    }
  }

  return (
    <div className="min-h-screen pb-nav" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        className="px-4 pt-3 pb-12"
        style={{ background: corPrimaria }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-3 -ml-1 rounded-lg transition-colors touch-target"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1
                className="font-display font-semibold flex items-center gap-2"
                style={{ color: isFisica ? '#000' : '#fff' }}
              >
                <Medal className="w-5 h-5" />
                Conquistas
              </h1>
            </div>
            <button
              onClick={buscarConquistas}
              className="p-3 rounded-lg transition-colors touch-target"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-medium"
                style={{ color: isFisica ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }}
              >
                {stats.desbloqueadas}/{stats.total}
              </span>
              <span
                className="text-lg font-bold"
                style={{ color: isFisica ? '#000' : '#fff' }}
              >
                {porcentagem}%
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.3)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${porcentagem}%`,
                  background: isFisica ? '#000' : '#fff',
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 -mt-6">
        {erro ? (
          <div
            className="card p-8 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'rgba(239, 68, 68, 0.15)' }}
            >
              <WifiOff className="w-8 h-8" style={{ color: 'var(--error)' }} />
            </div>
            <h2 className="font-display text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              Erro ao carregar conquistas
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={buscarConquistas} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Tentar Novamente
            </Button>
          </div>
        ) : conquistas.length === 0 ? (
          <div
            className="card p-8 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <Medal className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h2 className="font-display text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              Nenhuma conquista cadastrada
            </h2>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Ainda não há conquistas disponíveis para {nomeComponente}.
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Continue estudando! Em breve novas conquistas serão adicionadas.
            </p>
          </div>
        ) : (
          <>
            {/* Desbloqueadas */}
            {conquistasDesbloqueadas.length > 0 && (
              <div className="mb-4">
                <h2
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  Desbloqueadas ({conquistasDesbloqueadas.length})
                </h2>
                <div className="space-y-2">
                  {conquistasDesbloqueadas.map((conquista, index) => (
                    <div
                      key={conquista.id}
                      className="card flex items-center gap-3 p-4 animate-fade-in-up"
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderLeft: '3px solid var(--success)',
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{
                          background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                          color: corPrimaria,
                        }}
                      >
                        {conquista.icone}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {conquista.nome}
                        </h3>
                        <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                          {conquista.descricao}
                        </p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--success)' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bloqueadas */}
            {conquistasBloqueadas.length > 0 && (
              <div>
                <h2
                  className="flex items-center gap-2 text-sm font-medium mb-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Target className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  A Desbloquear ({conquistasBloqueadas.length})
                </h2>
                <div className="space-y-2">
                  {conquistasBloqueadas.map((conquista, index) => (
                    <div
                      key={conquista.id}
                      className="card flex items-center gap-3 p-4 animate-fade-in-up opacity-60"
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        animationDelay: `${(conquistasDesbloqueadas.length + index) * 50}ms`,
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center border border-dashed"
                        style={{
                          background: 'var(--bg-elevated)',
                          borderColor: 'var(--border-default)',
                        }}
                      >
                        <Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                          {conquista.nome}
                        </h3>
                        <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                          {formatarRequisito(conquista)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dica */}
            <div
              className="mt-4 p-4 rounded-xl animate-fade-in"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                border: isFisica ? '1px solid var(--border-fisica)' : '1px solid var(--border-matematica)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Responda questões e estude diariamente para desbloquear conquistas!
              </p>
            </div>
          </>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
