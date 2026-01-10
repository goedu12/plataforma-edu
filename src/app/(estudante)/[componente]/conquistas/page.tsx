'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Medal,
  Lock,
  CheckCircle2,
  RefreshCw,
  WifiOff,
  Target,
  Trophy,
  Flame,
  Star
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Conquista, DificuldadeConquista } from '@/types'

interface ConquistaComStatus extends Conquista {
  desbloqueada: boolean
  desbloqueada_em?: string
}

const DIFICULDADE_CONFIG: Record<DificuldadeConquista, { label: string; cor: string; bg: string }> = {
  facil: { label: 'Fácil', cor: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  medio: { label: 'Médio', cor: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  dificil: { label: 'Difícil', cor: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  muito_dificil: { label: 'Muito Difícil', cor: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  lendario: { label: 'Lendário', cor: '#eab308', bg: 'rgba(234, 179, 8, 0.2)' },
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
  const config = (dif: DificuldadeConquista) => DIFICULDADE_CONFIG[dif] || DIFICULDADE_CONFIG.facil

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* Header Padronizado */}
      <header className="page-header" style={{ background: corPrimaria, borderBottom: 'none' }}>
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="w-10 h-10 flex items-center justify-center rounded-lg"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: isFisica ? '#000' : '#fff' }} />
              <span
                className="font-display font-semibold"
                style={{ color: isFisica ? '#000' : '#fff' }}
              >
                Conquistas
              </span>
            </div>

            <button
              onClick={buscarConquistas}
              className="w-10 h-10 flex items-center justify-center rounded-lg"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 mt-3">
            <div
              className="flex-1 h-2.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${porcentagem}%`, background: isFisica ? '#000' : '#fff' }}
              />
            </div>
            <span
              className="text-sm font-bold tabular-nums min-w-[80px] text-right"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              {stats.desbloqueadas}/{stats.total} ({porcentagem}%)
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {erro ? (
          <div className="card-standard text-center py-8">
            <WifiOff className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--error)' }} />
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={buscarConquistas}>
              Tentar Novamente
            </Button>
          </div>
        ) : conquistas.length === 0 ? (
          <div className="card-standard text-center py-8">
            <Medal className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nenhuma conquista disponível para {nomeComponente}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conquistas.map((conquista, index) => {
              const dificuldadeConfig = config(conquista.dificuldade)
              const isDesbloqueada = conquista.desbloqueada

              return (
                <div
                  key={conquista.id}
                  className="list-item animate-fade-in-up"
                  style={{
                    border: isDesbloqueada
                      ? `2px solid ${dificuldadeConfig.cor}`
                      : '1px solid var(--border-default)',
                    opacity: isDesbloqueada ? 1 : 0.65,
                    animationDelay: `${index * 40}ms`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Ícone */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        background: isDesbloqueada ? dificuldadeConfig.bg : 'var(--bg-elevated)',
                        border: isDesbloqueada ? 'none' : '2px dashed var(--border-default)',
                      }}
                    >
                      {isDesbloqueada ? (
                        conquista.icone
                      ) : (
                        <Lock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="badge-standard"
                          style={{ background: dificuldadeConfig.bg, color: dificuldadeConfig.cor }}
                        >
                          Nível {conquista.ordem} • {dificuldadeConfig.label}
                        </span>
                        {isDesbloqueada && (
                          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                        )}
                      </div>
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: isDesbloqueada ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      >
                        {conquista.nome}
                      </h3>
                    </div>

                    {/* Requisitos */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {conquista.req_pontos && (
                        <span className="text-2xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Star className="w-3 h-3" style={{ color: '#eab308' }} />
                          {conquista.req_pontos.toLocaleString()}
                        </span>
                      )}
                      {conquista.req_questoes_corretas && (
                        <span className="text-2xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Target className="w-3 h-3" style={{ color: corPrimaria }} />
                          {conquista.req_questoes_corretas}
                        </span>
                      )}
                      {conquista.req_sequencia_dias && (
                        <span className="text-2xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Flame className="w-3 h-3" style={{ color: 'var(--color-streak)' }} />
                          {conquista.req_sequencia_dias}d
                        </span>
                      )}
                      {conquista.requisito_tipo !== 'combinado' && conquista.requisito_valor && (
                        <span className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                          {conquista.requisito_tipo === 'pontos' && `${conquista.requisito_valor} pts`}
                          {conquista.requisito_tipo === 'questoes' && `${conquista.requisito_valor} questões`}
                          {conquista.requisito_tipo === 'sequencia' && `${conquista.requisito_valor} dias`}
                          {conquista.requisito_tipo === 'acertos' && `${conquista.requisito_valor}%`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Legenda */}
            <div className="flex items-center justify-center gap-6 py-3">
              <span className="text-2xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Star className="w-3.5 h-3.5" style={{ color: '#eab308' }} /> Pontos
              </span>
              <span className="text-2xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Target className="w-3.5 h-3.5" style={{ color: corPrimaria }} /> Acertos
              </span>
              <span className="text-2xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Flame className="w-3.5 h-3.5" style={{ color: 'var(--color-streak)' }} /> Sequência
              </span>
            </div>
          </div>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
