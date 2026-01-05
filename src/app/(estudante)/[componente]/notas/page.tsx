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
  acertos_questoes: number
  acertos_revisao: number
  nota_questoes: number
  nota_revisao: number
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
  const taxaAcerto = notaAtual ? Math.round((notaAtual.acertos_questoes / Math.max(notaAtual.questoes_respondidas, 1)) * 100) : 0

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
                { icon: Target, label: 'Questões', value: notaAtual.nota_questoes.toFixed(1), sub: `${notaAtual.acertos_questoes} acertos`, color: corPrimaria },
                { icon: RefreshCw, label: 'Revisão', value: notaAtual.nota_revisao.toFixed(1), sub: `${notaAtual.acertos_revisao} acertos`, color: 'var(--color-accent)' },
                { icon: CheckCircle2, label: 'Taxa', value: `${taxaAcerto}%`, sub: 'de acerto', color: 'var(--success)' },
                { icon: Clock, label: 'Restam', value: notaAtual.dias_restantes.toString(), sub: 'dias', color: 'var(--warning)' },
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

            {/* Metas Compactas */}
            <div
              className="card p-3"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.05)' : 'rgba(139, 92, 246, 0.05)',
                border: `1px solid ${isFisica ? 'var(--border-fisica)' : 'var(--border-matematica)'}`,
              }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: corPrimaria }}>Metas</p>
              <div className="flex gap-4">
                {[
                  { nota: 6, label: '6.0' },
                  { nota: 8, label: '8.0' },
                  { nota: 10, label: '10.0' },
                ].map((meta, i) => {
                  const atingida = notaAtual.nota_final >= meta.nota
                  const faltam = Math.max(0, Math.ceil((meta.nota - notaAtual.nota_final) / 0.05))
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: atingida ? corPrimaria : 'transparent',
                          border: `2px solid ${atingida ? corPrimaria : 'var(--text-muted)'}`,
                          color: atingida ? '#fff' : 'var(--text-muted)',
                        }}
                      >
                        {atingida ? '✓' : ''}
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: atingida ? corPrimaria : 'var(--text-secondary)', textDecoration: atingida ? 'line-through' : 'none' }}>
                          {meta.label}
                        </p>
                        {!atingida && (
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            -{faltam} acertos
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
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
