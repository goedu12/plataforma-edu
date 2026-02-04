'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  RefreshCw,
  WifiOff,
  Target,
  Clock,
  ChevronRight,
  TrendingUp,
  ChevronDown,
  Zap,
  BookOpen,
  Calendar,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import useTempoUso from '@/hooks/useTempoUso'
import type { Componente } from '@/types'

interface NotaBimestre {
  bimestre: number
  ano: number
  tipo_periodo: 'regular' | 'recuperacao'
  data_inicio: string
  data_fim: string
  dias_restantes: number
  acertos_estudo: number
  acertos_revisao: number
  acertos_desafio: number
  tempo_uso_horas: number
  nota_acertos: number
  nota_tempo: number
  questoes_respondidas: number
  meta_questoes: number
  percentual_questoes: number
  dias_ativos: number
  nota_base: number
  bonus_frequencia: number
  nota_regular: number
  em_recuperacao: boolean
  questoes_pendentes: number
  questoes_recuperacao: number
  nota_recuperacao: number | null
  nota_final: number
  status: 'em_andamento' | 'recuperacao' | 'aprovado' | 'reprovado'
  questoes_semana: number
  limite_semanal: number | null
  pode_responder: boolean
  semana_atual: number
}

export default function NotasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  // Rastrear tempo de uso efetivo
  useTempoUso(componente, 'notas')

  const [notaAtual, setNotaAtual] = useState<NotaBimestre | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const ultimaAtualizacaoRef = useRef<number>(Date.now())
  const backoffRef = useRef<number>(30000) // Intervalo inicial de 30s
  const maxBackoff = 120000 // Máximo de 2 minutos
  const abortControllerRef = useRef<AbortController | null>(null)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const buscarNotas = useCallback(async (silencioso = false) => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    if (!silencioso) setLoading(true)
    else setAtualizando(true)
    setErro(null)

    try {
      const response = await fetch(`/api/notas?componente=${componente}&_t=${Date.now()}`, {
        signal: abortControllerRef.current.signal
      })
      const data = await response.json()

      if (data.sucesso) {
        setNotaAtual(data.bimestre_atual)
        ultimaAtualizacaoRef.current = Date.now()
      } else if (!silencioso) {
        setErro(data.erro || 'Erro ao carregar notas')
      }
    } catch (error) {
      // Ignorar erros de requisição cancelada
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      console.error('Erro ao buscar notas:', error)
      if (!silencioso) setErro('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
      setAtualizando(false)
    }
  }, [componente])

  // Flag para controlar se o componente está montado
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    buscarNotas()

    // Polling com exponential backoff - reduz carga no servidor
    const iniciarPolling = () => {
      if (pollingRef.current) clearTimeout(pollingRef.current)

      const executarPolling = () => {
        // Verificar se componente ainda está montado
        if (!isMountedRef.current) return

        if (document.visibilityState === 'visible') {
          buscarNotas(true).then(() => {
            // Reset do backoff se a requisição foi bem sucedida
            backoffRef.current = 30000
          }).catch(() => {
            // Aumenta o backoff em caso de erro (exponential backoff)
            backoffRef.current = Math.min(backoffRef.current * 1.5, maxBackoff)
          })
        }

        // Agendar próximo polling com o intervalo atual
        if (isMountedRef.current) {
          pollingRef.current = setTimeout(executarPolling, backoffRef.current)
        }
      }

      // Iniciar o primeiro polling após o intervalo inicial
      pollingRef.current = setTimeout(executarPolling, backoffRef.current)
    }

    iniciarPolling()

    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return

      if (document.visibilityState === 'visible') {
        // Só busca se passou mais de 10 segundos
        if (Date.now() - ultimaAtualizacaoRef.current > 10000) {
          buscarNotas(true)
        }
        // Reset do backoff quando o usuário volta à aba
        backoffRef.current = 30000
        iniciarPolling()
      } else {
        // Pausa o polling quando a aba está oculta
        if (pollingRef.current) {
          clearTimeout(pollingRef.current)
          pollingRef.current = null
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (pollingRef.current) clearTimeout(pollingRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [componente, buscarNotas, router])

  const getStatusConfig = (status: string, nota: number) => {
    if (nota >= 6) return { label: 'Aprovado', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.15)' }
    const config: Record<string, { label: string; color: string; bg: string }> = {
      aprovado: { label: 'Aprovado', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.15)' },
      reprovado: { label: 'Recuperação', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.15)' },
      recuperacao: { label: 'Recuperação', color: 'var(--warning)', bg: 'rgba(245, 158, 11, 0.15)' },
      em_andamento: { label: 'Em Andamento', color: 'var(--color-accent)', bg: 'rgba(59, 130, 246, 0.15)' },
    }
    return config[status] || config.em_andamento
  }

  if (loading) return <Loading fullScreen componente={componente} />

  const totalAcertos = notaAtual ? notaAtual.acertos_estudo + notaAtual.acertos_revisao + notaAtual.acertos_desafio : 0
  const statusConfig = notaAtual ? getStatusConfig(notaAtual.status, notaAtual.nota_final) : null

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      <div className="h-full flex flex-col max-w-lg mx-auto px-4 py-4">
        {/* Header Padronizado */}
        <header className="flex items-center justify-between mb-3">
          <BackButton href={`/${componente}/menu`} mobileOnly />

          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: corPrimaria }} />
            <span className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
              Notas
            </span>
            {notaAtual && (
              <span
                className="badge-standard ml-1"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                {notaAtual.bimestre}º Bimestre
              </span>
            )}
          </div>

          <button
            onClick={() => buscarNotas(false)}
            disabled={atualizando}
            className="w-10 h-10 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            <RefreshCw className={`w-5 h-5 ${atualizando ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {erro ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="card-standard text-center py-8">
              <WifiOff className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--error)' }} />
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={() => buscarNotas(false)}>
                Tentar Novamente
              </Button>
            </div>
          </div>
        ) : notaAtual ? (
          <div className="flex-1 flex flex-col gap-3 overflow-auto lg:overflow-hidden">

            {/* Card Principal - Nota */}
            <div className="card-standard">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {notaAtual.nota_final.toFixed(1)}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/10</span>
                </div>
                {statusConfig && (
                  <span
                    className="badge-standard"
                    style={{ background: statusConfig.bg, color: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </span>
                )}
              </div>

              {/* Barra de Progresso Dupla */}
              <div className="mb-3">
                <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-elevated)' }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${(notaAtual.nota_acertos / 10) * 100}%`, background: corPrimaria }}
                  />
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${(notaAtual.nota_tempo / 10) * 100}%`, background: 'var(--color-accent)' }}
                  />
                </div>
              </div>

              {/* Breakdown */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5" style={{ color: corPrimaria }}>
                    <Target className="w-4 h-4" />
                    <span className="font-semibold">{notaAtual.nota_acertos.toFixed(1)}</span>/6
                  </span>
                  <span className="flex items-center gap-1.5" style={{ color: 'var(--color-accent)' }}>
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{notaAtual.nota_tempo.toFixed(1)}</span>/4
                  </span>
                </div>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Calendar className="w-4 h-4" />
                  {notaAtual.dias_restantes}d restantes
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Target, value: totalAcertos, label: 'Acertos', color: corPrimaria },
                { icon: Clock, value: `${notaAtual.tempo_uso_horas.toFixed(1)}h`, label: 'Tempo', color: 'var(--color-accent)' },
                { icon: BookOpen, value: notaAtual.questoes_respondidas, label: 'Questões', color: 'var(--text-primary)' },
                { icon: Calendar, value: notaAtual.dias_ativos, label: 'Dias', color: 'var(--text-primary)' },
              ].map((stat, i) => (
                <div key={i} className="stat-box">
                  <stat.icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
                  <p className="text-lg font-bold tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Como Ganhar Pontos - Colapsável */}
            <div className="card-standard p-0 overflow-hidden">
              <button
                onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5" style={{ color: corPrimaria }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Como ganhar pontos
                  </span>
                </div>
                <ChevronDown
                  className="w-5 h-5 transition-transform duration-200"
                  style={{
                    color: 'var(--text-muted)',
                    transform: mostrarDetalhes ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: mostrarDetalhes ? '280px' : '0px' }}
              >
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                      <p className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: corPrimaria }}>
                        <Target className="w-4 h-4" /> Acertos (máx 6 pts)
                      </p>
                      <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex justify-between items-center">
                          <span>Estudar</span>
                          <span className="font-bold" style={{ color: corPrimaria }}>+0.04 pt</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Revisão</span>
                          <span className="font-bold" style={{ color: corPrimaria }}>+0.02 pt</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Desafio</span>
                          <span className="font-bold" style={{ color: corPrimaria }}>+0.01 pt</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                      <p className="text-xs font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-accent)' }}>
                        <Clock className="w-4 h-4" /> Tempo (máx 4 pts)
                      </p>
                      <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <div className="flex justify-between items-center">
                          <span>2 horas</span>
                          <span className="font-bold" style={{ color: 'var(--color-accent)' }}>1 pt</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>3 horas</span>
                          <span className="font-bold" style={{ color: 'var(--color-accent)' }}>2 pts</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>4 horas</span>
                          <span className="font-bold" style={{ color: 'var(--color-accent)' }}>3 pts</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>5+ horas</span>
                          <span className="font-bold" style={{ color: 'var(--color-accent)' }}>4 pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dica contextual */}
              {notaAtual.nota_final < 6 && (
                <div
                  className="px-4 py-3 text-xs border-t"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  {notaAtual.nota_acertos < 6 ? (
                    <>
                      Faltam <b style={{ color: corPrimaria }}>{Math.ceil((6 - notaAtual.nota_acertos) / 0.04)} acertos</b> no Estudar para nota máxima em acertos
                    </>
                  ) : (
                    <>
                      Use o app por mais <b style={{ color: 'var(--color-accent)' }}>{Math.ceil(2 - notaAtual.tempo_uso_horas)}h</b> para ganhar pontos de tempo
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={() => router.push(`/${componente}/estudar`)}
                disabled={!notaAtual.pode_responder}
                rightIcon={notaAtual.pode_responder ? <ChevronRight className="w-5 h-5" /> : undefined}
              >
                {notaAtual.pode_responder ? 'Estudar' : `Limite: ${notaAtual.questoes_semana}/15`}
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push(`/${componente}/revisao`)}
                leftIcon={<RefreshCw className="w-5 h-5" />}
              >
                Revisão
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <BottomNav componente={componente} />
    </div>
  )
}
