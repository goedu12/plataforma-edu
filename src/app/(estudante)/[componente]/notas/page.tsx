'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  RefreshCw,
  WifiOff,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trophy,
  ChevronRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
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

interface EvolucaoDiaria {
  data: string
  dataFormatada: string
  questoes_dia: number
  questoes_acumuladas: number
  dias_ativos: number
  nota: number
}

interface ProgressoSemanal {
  semana: number
  questoes: number
  inicio: string
  fim: string
  limite: number
  percentual: number
}

export default function NotasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [notaAtual, setNotaAtual] = useState<NotaBimestre | null>(null)
  const [evolucaoDiaria, setEvolucaoDiaria] = useState<EvolucaoDiaria[]>([])
  const [progressoSemanal, setProgressoSemanal] = useState<ProgressoSemanal[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [notaAnterior, setNotaAnterior] = useState<number | null>(null)
  const [animandoNota, setAnimandoNota] = useState(false)
  const [atualizando, setAtualizando] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const ultimaAtualizacaoRef = useRef<number>(Date.now())

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const corHex = isFisica ? '#22c55e' : '#8b5cf6'

  const buscarNotas = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true)
    else setAtualizando(true)
    setErro(null)

    try {
      const response = await fetch(`/api/notas?componente=${componente}&_t=${Date.now()}`)
      const data = await response.json()

      if (data.sucesso) {
        const novaNota = data.bimestre_atual?.nota_final || 0
        const notaAtualValor = notaAtual?.nota_final || 0

        if (silencioso && notaAtualValor > 0 && novaNota !== notaAtualValor) {
          setNotaAnterior(notaAtualValor)
          setAnimandoNota(true)
          setTimeout(() => setAnimandoNota(false), 2000)
        }

        setNotaAtual(data.bimestre_atual)
        setEvolucaoDiaria(data.evolucao_diaria || [])
        setProgressoSemanal(data.progresso_semanal || [])
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
  }, [componente, notaAtual?.nota_final])

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
      }, 5000)
    }

    iniciarPolling()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (Date.now() - ultimaAtualizacaoRef.current > 3000) buscarNotas(true)
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
    if (nota >= 6) {
      return { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Aprovado', color: 'var(--success)' }
    }
    const config: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      aprovado: { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Aprovado', color: 'var(--success)' },
      reprovado: { icon: <AlertTriangle className="w-4 h-4" />, label: 'Em Recuperação', color: 'var(--error)' },
      recuperacao: { icon: <RefreshCw className="w-4 h-4" />, label: 'Recuperação', color: 'var(--warning)' },
      em_andamento: { icon: <Clock className="w-4 h-4" />, label: 'Em Andamento', color: 'var(--color-accent)' },
    }
    return config[status] || config.em_andamento
  }

  const dadosGrafico = evolucaoDiaria.length > 15
    ? evolucaoDiaria.filter((_, i) => i % Math.ceil(evolucaoDiaria.length / 15) === 0 || i === evolucaoDiaria.length - 1)
    : evolucaoDiaria

  const getMetas = (nota: number) => [
    { done: nota >= 6, text: 'Atingir 6.0 (aprovação)', faltam: nota >= 6 ? 0 : Math.ceil((6 - nota) / 0.05) },
    { done: nota >= 8, text: nota >= 8 ? 'Atingir 8.0' : `Atingir 8.0 — faltam ${Math.ceil((8 - nota) / 0.05)} acertos`, faltam: 0 },
    { done: nota >= 10, text: nota >= 10 ? 'Nota máxima!' : `Atingir 10.0 — faltam ${Math.ceil((10 - nota) / 0.05)} acertos`, faltam: 0 },
  ]

  if (loading) return <Loading fullScreen componente={componente} />

  const progresso = notaAtual ? (notaAtual.nota_final / 10) * 100 : 0
  const statusConfig = notaAtual ? getStatusConfig(notaAtual.status, notaAtual.nota_final) : null

  return (
    <div className="min-h-screen pb-nav" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="text-center pt-6 pb-4 px-6">
        <div className="flex items-center justify-between mb-6 max-w-lg mx-auto">
          <button
            onClick={() => router.push(`/${componente}/menu`)}
            className="p-3 rounded-xl transition-all touch-target"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: corPrimaria }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ao Vivo</span>
          </div>

          <button
            onClick={() => buscarNotas(false)}
            disabled={atualizando}
            className="p-3 rounded-xl transition-all touch-target"
            style={{ color: 'var(--text-secondary)' }}
          >
            <RefreshCw className={`w-5 h-5 ${atualizando ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {notaAtual && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: corPrimaria }} />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {notaAtual.bimestre}º Bimestre • 2025
            </span>
          </div>
        )}

        <p className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Minhas Notas
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {isFisica ? 'Física' : 'Matemática'}
        </p>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-8 space-y-4">
        {erro ? (
          <div className="card p-8 text-center" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
              <WifiOff className="w-8 h-8" style={{ color: 'var(--error)' }} />
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={() => buscarNotas(false)}>
              Tentar Novamente
            </Button>
          </div>
        ) : notaAtual ? (
          <>
            {/* Card Nota Principal */}
            <div
              className={`card p-6 relative overflow-hidden transition-all duration-300 ${animandoNota ? 'scale-[1.02]' : ''}`}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderTop: `3px solid ${corPrimaria}`,
              }}
            >
              <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>Nota Atual</p>

              <div className="text-center">
                <div className="relative inline-block">
                  <span
                    className={`font-display text-7xl font-bold transition-all duration-300 ${animandoNota ? 'scale-110' : ''}`}
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {notaAtual.nota_final.toFixed(2)}
                  </span>
                  <span className="text-2xl" style={{ color: 'var(--text-muted)' }}>/10</span>

                  {animandoNota && notaAnterior !== null && (
                    <span className="absolute -right-16 top-4 text-sm font-bold animate-bounce" style={{ color: 'var(--success)' }}>
                      +{(notaAtual.nota_final - notaAnterior).toFixed(2)}
                    </span>
                  )}
                </div>

                {statusConfig && (
                  <div className="mt-4">
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
                      style={{
                        background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                        color: statusConfig.color,
                      }}
                    >
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Progresso para nota 10</span>
                  <span className="text-xs font-bold" style={{ color: corPrimaria }}>{progresso.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progresso}%`,
                      background: `linear-gradient(90deg, ${corPrimaria}, var(--color-accent))`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Grid Composição */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)' }}
                >
                  <Target className="w-5 h-5" style={{ color: corPrimaria }} />
                </div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Questões</p>
                <p className="text-3xl font-bold" style={{ color: corPrimaria }}>
                  {(notaAtual.nota_questoes || 0).toFixed(2)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{notaAtual.acertos_questoes || 0}</strong> acertos
                </p>
              </div>

              <div className="card p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(14, 165, 233, 0.15)' }}>
                  <RefreshCw className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                </div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Revisão</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {(notaAtual.nota_revisao || 0).toFixed(2)}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{notaAtual.acertos_revisao || 0}</strong> acertos
                </p>
              </div>
            </div>

            {/* Detalhes */}
            <div className="card p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <p className="text-xs font-medium mb-4" style={{ color: 'var(--text-muted)' }}>Detalhes</p>

              {[
                { icon: <Target className="w-4 h-4" />, label: 'Questões respondidas', value: notaAtual.questoes_respondidas.toString() },
                { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Taxa de acerto', value: `${Math.round((notaAtual.acertos_questoes / Math.max(notaAtual.questoes_respondidas, 1)) * 100)}%`, color: 'var(--success)' },
                { icon: <RefreshCw className="w-4 h-4" />, label: 'Revisões feitas', value: (notaAtual.acertos_revisao || 0).toString() },
                { icon: <TrendingUp className="w-4 h-4" />, label: 'Esta semana', value: `${notaAtual.questoes_semana}/15`, color: notaAtual.questoes_semana >= 15 ? 'var(--error)' : corPrimaria },
                { icon: <Clock className="w-4 h-4" />, label: 'Dias restantes', value: notaAtual.dias_restantes.toString(), color: 'var(--warning)' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: i < 4 ? '1px solid var(--border-default)' : 'none' }}
                >
                  <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: item.color || 'var(--text-primary)' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Metas */}
            <div
              className="card p-5"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.05)' : 'rgba(139, 92, 246, 0.05)',
                border: `1px solid ${isFisica ? 'var(--border-fisica)' : 'var(--border-matematica)'}`,
              }}
            >
              <p className="text-xs font-medium mb-4" style={{ color: corPrimaria }}>Próximas Metas</p>

              {getMetas(notaAtual.nota_final).map((meta, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{
                      background: meta.done ? corPrimaria : 'transparent',
                      border: `2px solid ${meta.done ? corPrimaria : 'var(--text-muted)'}`,
                      color: meta.done ? 'var(--bg-base)' : 'var(--text-muted)',
                    }}
                  >
                    {meta.done && '✓'}
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      color: 'var(--text-secondary)',
                      textDecoration: meta.done ? 'line-through' : 'none',
                      opacity: meta.done ? 0.6 : 1,
                    }}
                  >
                    {meta.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Gráfico Evolução */}
            {dadosGrafico.length > 2 && (
              <div className="card p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Evolução</p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 rounded" style={{ background: corPrimaria }} /> Nota
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 rounded" style={{ background: 'var(--warning)', opacity: 0.5 }} /> Min 6.0
                    </span>
                  </div>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosGrafico} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={corHex} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={corHex} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="dataFormatada" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} ticks={[0, 5, 10]} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 11 }}
                        formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : value, 'Nota']}
                      />
                      <ReferenceLine y={6} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.4} />
                      <Area type="monotone" dataKey="nota" stroke={corHex} strokeWidth={2} fill="url(#colorNota)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Gráfico Semanal */}
            {progressoSemanal.length > 0 && (
              <div className="card p-5" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Questões/Semana</p>
                  <span className="text-xs font-medium" style={{ color: notaAtual.pode_responder ? corPrimaria : 'var(--error)' }}>
                    S{notaAtual.semana_atual}: {notaAtual.questoes_semana}/15
                  </span>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressoSemanal} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="semana" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `S${v}`} />
                      <YAxis domain={[0, 15]} tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} ticks={[0, 15]} />
                      <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.3} />
                      <Bar dataKey="questoes" radius={[4, 4, 0, 0]}>
                        {progressoSemanal.map((entry, index) => (
                          <Cell key={index} fill={entry.semana === notaAtual.semana_atual ? corHex : '#0ea5e9'} opacity={entry.semana === notaAtual.semana_atual ? 1 : 0.5} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Nota 10 - Celebração */}
            {notaAtual.nota_final >= 10 && (
              <div
                className="card p-6 text-center"
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--warning)' }} />
                <p className="font-display text-lg font-bold" style={{ color: 'var(--success)' }}>
                  Nota Máxima Atingida!
                </p>
              </div>
            )}

            {/* Botões */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={() => router.push(`/${componente}/estudar`)}
                disabled={!notaAtual.pode_responder}
                rightIcon={notaAtual.pode_responder ? <ChevronRight className="w-4 h-4" /> : undefined}
              >
                {notaAtual.pode_responder ? 'Estudar' : 'Limite Atingido'}
              </Button>
              <Button variant="secondary" onClick={() => router.push(`/${componente}/revisao`)} leftIcon={<RefreshCw className="w-4 h-4" />}>
                Revisão
              </Button>
            </div>
          </>
        ) : null}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
