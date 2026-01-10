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
  ChevronDown,
  Zap,
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

  const [notaAtual, setNotaAtual] = useState<NotaBimestre | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)
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

      <div className="h-full flex flex-col max-w-lg mx-auto px-4 py-3">
        {/* Header */}
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
              {isFisica ? 'Física' : 'Matemática'}
            </span>
            {notaAtual && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                {notaAtual.bimestre}º Bi • {notaAtual.dias_restantes}d
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
          <div className="flex-1 flex flex-col gap-2.5 overflow-auto lg:overflow-hidden">

            {/* Card Principal - Nota + Progresso Unificado */}
            <div
              className="card p-3"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
              }}
            >
              {/* Linha 1: Nota + Status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {notaAtual.nota_final.toFixed(1)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/10</span>
                </div>
                {statusConfig && (
                  <span
                    className="px-2 py-1 rounded text-[10px] font-medium"
                    style={{ background: statusConfig.bg, color: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </span>
                )}
              </div>

              {/* Linha 2: Barra de progresso dupla */}
              <div className="mb-2">
                <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-elevated)' }}>
                  <div
                    className="h-full"
                    style={{ width: `${(notaAtual.nota_acertos / 10) * 100}%`, background: corPrimaria }}
                  />
                  <div
                    className="h-full"
                    style={{ width: `${(notaAtual.nota_tempo / 10) * 100}%`, background: 'var(--color-accent)' }}
                  />
                </div>
              </div>

              {/* Linha 3: Breakdown compacto */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-3">
                  <span style={{ color: corPrimaria }}>
                    <Target className="w-3 h-3 inline mr-0.5" />
                    {notaAtual.nota_acertos.toFixed(1)}/6
                  </span>
                  <span style={{ color: 'var(--color-accent)' }}>
                    <Clock className="w-3 h-3 inline mr-0.5" />
                    {notaAtual.nota_tempo.toFixed(1)}/4
                  </span>
                </div>
                <span style={{ color: 'var(--text-muted)' }}>
                  {notaAtual.questoes_semana}/15 semana
                </span>
              </div>
            </div>

            {/* Stats Compactos - 2x2 */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: totalAcertos, label: 'Acertos', color: corPrimaria },
                { value: `${notaAtual.tempo_uso_horas.toFixed(1)}h`, label: 'Tempo', color: 'var(--color-accent)' },
                { value: notaAtual.questoes_respondidas, label: 'Questões', color: 'var(--text-primary)' },
                { value: notaAtual.dias_ativos, label: 'Dias', color: 'var(--text-primary)' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg text-center"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                >
                  <p className="text-base font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Como Ganhar Pontos - Colapsável */}
            <div
              className="card overflow-hidden"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
              }}
            >
              <button
                onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                className="w-full p-2.5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" style={{ color: corPrimaria }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    Como ganhar pontos
                  </span>
                </div>
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{
                    color: 'var(--text-muted)',
                    transform: mostrarDetalhes ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              </button>

              {/* Conteúdo expandido */}
              <div
                className="overflow-hidden transition-all duration-200"
                style={{ maxHeight: mostrarDetalhes ? '200px' : '0px' }}
              >
                <div className="px-2.5 pb-2.5">
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div className="p-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                      <p className="font-semibold mb-1" style={{ color: corPrimaria }}>Acertos (máx 6pts)</p>
                      <div className="space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                        <p>Estudar: <b>+0.04</b></p>
                        <p>Revisão: <b>+0.02</b></p>
                        <p>Desafio: <b>+0.01</b></p>
                      </div>
                    </div>
                    <div className="p-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                      <p className="font-semibold mb-1" style={{ color: 'var(--color-accent)' }}>Tempo (máx 4pts)</p>
                      <div className="space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                        <p>2h → <b>1pt</b></p>
                        <p>3h → <b>2pts</b></p>
                        <p>4h → <b>3pts</b> • 5h+ → <b>4pts</b></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dica inline - sempre visível */}
              {notaAtual.nota_final < 6 && (
                <div
                  className="px-2.5 py-2 text-[10px] border-t"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  {notaAtual.nota_acertos < 6 ? (
                    <>Faltam <b style={{ color: corPrimaria }}>{Math.ceil((6 - notaAtual.nota_acertos) / 0.04)} acertos</b> no Estudar para máx de acertos</>
                  ) : (
                    <>Use o app por mais <b style={{ color: 'var(--color-accent)' }}>{Math.ceil(2 - notaAtual.tempo_uso_horas)}h</b> para ganhar pontos de tempo</>
                  )}
                </div>
              )}
            </div>

            {/* Botões de Ação - Fixos no final */}
            <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={() => router.push(`/${componente}/estudar`)}
                disabled={!notaAtual.pode_responder}
                rightIcon={notaAtual.pode_responder ? <ChevronRight className="w-4 h-4" /> : undefined}
                className="text-sm py-2.5"
              >
                {notaAtual.pode_responder ? 'Estudar' : `${notaAtual.questoes_semana}/15`}
              </Button>
              <Button
                variant="secondary"
                onClick={() => router.push(`/${componente}/revisao`)}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="text-sm py-2.5"
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
