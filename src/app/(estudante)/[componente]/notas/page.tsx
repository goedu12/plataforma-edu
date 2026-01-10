'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  RefreshCw,
  WifiOff,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'

interface NotaBimestre {
  bimestre: number
  ano: number
  tipo_periodo: 'regular' | 'recuperacao'
  data_inicio: string
  data_fim: string
  dias_restantes: number
  // Nova fórmula v2
  acertos_estudo: number
  acertos_revisao: number
  acertos_desafio: number
  tempo_uso_horas: number
  nota_acertos: number
  nota_tempo: number
  // Compatibilidade
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

  const [notaAtual, setNotaAtual] = useState<NotaBimestre | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const ultimaAtualizacaoRef = useRef<number>(Date.now())

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const buscarNotas = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true)
    else setAtualizando(true)
    setErro(null)

    try {
      const response = await fetch(`/api/notas?componente=${componente}&_t=${Date.now()}`)
      const data = await response.json()

      if (data.sucesso) {
        setNotaAtual(data.bimestre_atual)
        ultimaAtualizacaoRef.current = Date.now()
      } else if (!silencioso) {
        setErro(data.erro || 'Erro ao carregar notas')
      }
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
      if (!silencioso) setErro('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
      setAtualizando(false)
    }
  }, [componente])

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    buscarNotas()

    const iniciarPolling = () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') buscarNotas(true)
      }, 30000)
    }

    iniciarPolling()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (Date.now() - ultimaAtualizacaoRef.current > 10000) buscarNotas(true)
        iniciarPolling()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [componente, buscarNotas])

  const getStatusConfig = (status: string, nota: number) => {
    if (nota >= 6) return { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Aprovado', color: 'var(--success)' }
    const config: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      aprovado: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Aprovado', color: 'var(--success)' },
      reprovado: { icon: <AlertTriangle className="w-3 h-3" />, label: 'Recuperação', color: 'var(--error)' },
      recuperacao: { icon: <RefreshCw className="w-3 h-3" />, label: 'Recuperação', color: 'var(--warning)' },
      em_andamento: { icon: <Clock className="w-3 h-3" />, label: 'Em Andamento', color: 'var(--color-accent)' },
    }
    return config[status] || config.em_andamento
  }

  if (loading) return <Loading fullScreen componente={componente} />

  const progresso = notaAtual ? (notaAtual.nota_final / 10) * 100 : 0
  const statusConfig = notaAtual ? getStatusConfig(notaAtual.status, notaAtual.nota_final) : null
  const taxaAcerto = notaAtual ? Math.round((notaAtual.acertos_estudo / Math.max(notaAtual.questoes_respondidas, 1)) * 100) : 0

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      <div className="h-full flex flex-col max-w-lg mx-auto px-4 py-3">
        {/* Header Compacto */}
        <header className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.push(`/${componente}/menu`)}
            className="p-2 rounded-xl touch-target lg:hidden"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: corPrimaria }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Notas - {isFisica ? 'Física' : 'Matemática'}
            </span>
            {notaAtual && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                {notaAtual.bimestre}º Bi
              </span>
            )}
          </div>

          <button
            onClick={() => buscarNotas(false)}
            disabled={atualizando}
            className="p-2 rounded-xl touch-target"
            style={{ color: 'var(--text-secondary)' }}
          >
            <RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {erro ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="card p-6 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <WifiOff className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--error)' }} />
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={() => buscarNotas(false)}>
                Tentar Novamente
              </Button>
            </div>
          </div>
        ) : notaAtual ? (
          <div className="flex-1 flex flex-col gap-3 overflow-auto lg:overflow-hidden">
            {/* Card Nota Principal - Compacto */}
            <div
              className="card p-4 text-center"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderLeft: `4px solid ${corPrimaria}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Nota Atual</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {notaAtual.nota_final.toFixed(2)}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/10</span>
                  </div>
                </div>

                {statusConfig && (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{
                      background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                      color: statusConfig.color,
                    }}
                  >
                    {statusConfig.icon} {statusConfig.label}
                  </span>
                )}
              </div>

              {/* Barra de Progresso */}
              <div className="mt-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Progresso</span>
                  <span className="text-xs font-bold" style={{ color: corPrimaria }}>{progresso.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progresso}%`, background: corPrimaria }}
                  />
                </div>
              </div>
            </div>

            {/* Stats Grid - 4 colunas */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Target, label: 'Acertos', value: notaAtual.nota_acertos.toFixed(1), sub: `${notaAtual.acertos_estudo + notaAtual.acertos_revisao + notaAtual.acertos_desafio} total`, color: corPrimaria },
                { icon: Clock, label: 'Tempo', value: notaAtual.nota_tempo.toFixed(1), sub: `${notaAtual.tempo_uso_horas.toFixed(1)}h uso`, color: 'var(--color-accent)' },
                { icon: CheckCircle2, label: 'Taxa', value: `${taxaAcerto}%`, sub: 'de acerto', color: 'var(--success)' },
                { icon: RefreshCw, label: 'Restam', value: notaAtual.dias_restantes.toString(), sub: 'dias', color: 'var(--warning)' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="card p-2.5 text-center"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                >
                  <stat.icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
                  <p className="text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Detalhes Inline */}
            <div
              className="card p-3 grid grid-cols-3 gap-3 text-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <div>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{notaAtual.questoes_respondidas}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Respondidas</p>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-default)', borderRight: '1px solid var(--border-default)' }}>
                <p className="text-lg font-bold" style={{ color: notaAtual.questoes_semana >= 15 ? 'var(--error)' : corPrimaria }}>
                  {notaAtual.questoes_semana}/15
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Esta Semana</p>
              </div>
              <div>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{notaAtual.dias_ativos}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Dias Ativos</p>
              </div>
            </div>

            {/* Como Ganhar Pontos - Explicação da Fórmula */}
            <div
              className="card p-3"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.05)' : 'rgba(139, 92, 246, 0.05)',
                border: `1px solid ${isFisica ? 'var(--border-fisica)' : 'var(--border-matematica)'}`,
              }}
            >
              <p className="text-xs font-medium mb-3" style={{ color: corPrimaria }}>Como Ganhar Pontos</p>

              {/* Barra de progresso da nota */}
              <div className="mb-3">
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
                  <span>0</span>
                  <span style={{ color: notaAtual.nota_final >= 6 ? 'var(--success)' : 'var(--warning)' }}>6.0 (mín)</span>
                  <span>10</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden relative" style={{ background: 'var(--bg-elevated)' }}>
                  {/* Marcador de 6.0 */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5"
                    style={{ left: '60%', background: 'var(--text-muted)', opacity: 0.5 }}
                  />
                  {/* Progresso de acertos (máx 6.0 = 60%) */}
                  <div
                    className="h-full rounded-full absolute"
                    style={{
                      width: `${Math.min(notaAtual.nota_acertos / 10 * 100, 60)}%`,
                      background: corPrimaria,
                      opacity: 0.7
                    }}
                  />
                  {/* Progresso de tempo (máx 4.0 = 40%) */}
                  <div
                    className="h-full rounded-full absolute"
                    style={{
                      left: `${Math.min(notaAtual.nota_acertos / 10 * 100, 60)}%`,
                      width: `${Math.min(notaAtual.nota_tempo / 10 * 100, 40)}%`,
                      background: 'var(--color-accent)'
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px]" style={{ color: corPrimaria }}>
                    Acertos: {notaAtual.nota_acertos.toFixed(1)}/6.0
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-accent)' }}>
                    Tempo: {notaAtual.nota_tempo.toFixed(1)}/4.0
                  </span>
                </div>
              </div>

              {/* Tabela de pontos */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="font-medium mb-1" style={{ color: corPrimaria }}>Por Acertos (máx 6 pts)</p>
                  <p style={{ color: 'var(--text-secondary)' }}>Estudar: <b>0.04</b>/acerto</p>
                  <p style={{ color: 'var(--text-secondary)' }}>Revisão: <b>0.02</b>/acerto</p>
                  <p style={{ color: 'var(--text-secondary)' }}>Desafio: <b>0.01</b>/acerto</p>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="font-medium mb-1" style={{ color: 'var(--color-accent)' }}>Por Tempo (máx 4 pts)</p>
                  <p style={{ color: 'var(--text-secondary)' }}>2 horas: <b>1.0</b> pt</p>
                  <p style={{ color: 'var(--text-secondary)' }}>3 horas: <b>2.0</b> pts</p>
                  <p style={{ color: 'var(--text-secondary)' }}>4 horas: <b>3.0</b> pts</p>
                  <p style={{ color: 'var(--text-secondary)' }}>5+ horas: <b>4.0</b> pts</p>
                </div>
              </div>

              {/* Dica contextual */}
              {notaAtual.nota_final < 10 && (
                <div className="mt-3 p-2 rounded text-[10px]" style={{ background: 'var(--bg-base)', border: '1px dashed var(--border-default)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {notaAtual.nota_acertos < 6 && notaAtual.nota_tempo < 4 ? (
                      <>💡 <b>Dica:</b> Acerte mais questões no modo Estudar (+0.04/acerto) e aumente seu tempo de uso para subir a nota!</>
                    ) : notaAtual.nota_acertos >= 6 && notaAtual.nota_tempo < 4 ? (
                      <>💡 <b>Dica:</b> Você atingiu o máximo de acertos! Agora foque em usar o app por mais tempo ({notaAtual.tempo_uso_horas < 2 ? '2h' : notaAtual.tempo_uso_horas < 3 ? '3h' : notaAtual.tempo_uso_horas < 4 ? '4h' : '5h'} para +{notaAtual.tempo_uso_horas < 2 ? '1' : notaAtual.tempo_uso_horas < 3 ? '1' : notaAtual.tempo_uso_horas < 4 ? '1' : '1'} pt).</>
                    ) : notaAtual.nota_acertos < 6 && notaAtual.nota_tempo >= 4 ? (
                      <>💡 <b>Dica:</b> Você atingiu o máximo de tempo! Foque em acertar mais questões no modo Estudar (+0.04/acerto).</>
                    ) : (
                      <>🎉 <b>Parabéns!</b> Você atingiu a nota máxima!</>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={() => router.push(`/${componente}/estudar`)}
                disabled={!notaAtual.pode_responder}
                rightIcon={notaAtual.pode_responder ? <ChevronRight className="w-4 h-4" /> : undefined}
                className="text-sm"
              >
                {notaAtual.pode_responder ? 'Estudar' : 'Limite'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push(`/${componente}/revisao`)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="text-sm"
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
