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
  muito_dificil: { label: 'Difícil+', cor: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
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

      {/* Header */}
      <header className="px-4 pt-4 pb-5" style={{ background: corPrimaria }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ background: 'rgba(0,0,0,0.1)', color: isFisica ? '#000' : '#fff' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" style={{ color: isFisica ? '#000' : '#fff' }} />
                <span
                  className="font-display text-lg font-bold"
                  style={{ color: isFisica ? '#000' : '#fff' }}
                >
                  Conquistas
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: isFisica ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }}>
                {stats.desbloqueadas} de {stats.total} desbloqueadas
              </p>
            </div>

            <button
              onClick={buscarConquistas}
              className="w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ background: 'rgba(0,0,0,0.1)', color: isFisica ? '#000' : '#fff' }}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-3 rounded-full overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${porcentagem}%`, background: isFisica ? '#000' : '#fff' }}
              />
            </div>
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              {porcentagem}%
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
          <>
            {/* Grid 2 Colunas */}
            <div className="grid grid-cols-2 gap-3">
              {conquistas.map((conquista, index) => {
                const dificuldadeConfig = config(conquista.dificuldade)
                const isDesbloqueada = conquista.desbloqueada

                return (
                  <div
                    key={conquista.id}
                    className="rounded-xl p-4 text-center animate-fade-in-up"
                    style={{
                      background: 'var(--bg-surface)',
                      border: isDesbloqueada
                        ? `2px solid ${dificuldadeConfig.cor}`
                        : '1px solid var(--border-default)',
                      opacity: isDesbloqueada ? 1 : 0.6,
                      animationDelay: `${index * 40}ms`,
                    }}
                  >
                    {/* Ícone Grande */}
                    <div
                      className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl"
                      style={{
                        background: isDesbloqueada ? dificuldadeConfig.bg : 'var(--bg-elevated)',
                        border: isDesbloqueada ? 'none' : '2px dashed var(--border-default)',
                      }}
                    >
                      {isDesbloqueada ? (
                        conquista.icone
                      ) : (
                        <Lock className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>

                    {/* Badge Nível */}
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold mb-2"
                      style={{ background: dificuldadeConfig.bg, color: dificuldadeConfig.cor }}
                    >
                      {isDesbloqueada && <CheckCircle2 className="w-3 h-3" />}
                      {conquista.ordem}º • {dificuldadeConfig.label}
                    </span>

                    {/* Nome */}
                    <h3
                      className="font-semibold text-sm mb-2 line-clamp-1"
                      style={{ color: isDesbloqueada ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {conquista.nome}
                    </h3>

                    {/* Requisitos */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {conquista.req_pontos && (
                        <span className="text-2xs flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                          <Star className="w-3 h-3" style={{ color: '#eab308' }} />
                          {conquista.req_pontos >= 1000
                            ? `${(conquista.req_pontos / 1000).toFixed(conquista.req_pontos % 1000 === 0 ? 0 : 1)}k`
                            : conquista.req_pontos}
                        </span>
                      )}
                      {conquista.req_questoes_corretas && (
                        <span className="text-2xs flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                          <Target className="w-3 h-3" style={{ color: corPrimaria }} />
                          {conquista.req_questoes_corretas}
                        </span>
                      )}
                      {conquista.req_sequencia_dias && (
                        <span className="text-2xs flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                          <Flame className="w-3 h-3" style={{ color: 'var(--color-streak)' }} />
                          {conquista.req_sequencia_dias}d
                        </span>
                      )}
                      {conquista.requisito_tipo !== 'combinado' && conquista.requisito_valor && (
                        <span className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                          {conquista.requisito_tipo === 'pontos' && `${conquista.requisito_valor} pts`}
                          {conquista.requisito_tipo === 'questoes' && `${conquista.requisito_valor} questões`}
                          {conquista.requisito_tipo === 'sequencia' && `${conquista.requisito_valor} dias`}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legenda */}
            <div className="flex items-center justify-center gap-5 py-4 mt-2">
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
          </>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
