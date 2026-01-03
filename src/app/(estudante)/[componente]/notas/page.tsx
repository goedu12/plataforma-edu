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
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA DE NOTAS 2025 - DESIGN KOYEB
// ═══════════════════════════════════════════════════════════════════════════

interface NotaBimestre {
  bimestre: number
  ano: number
  tipo_periodo: 'regular' | 'recuperacao'
  data_inicio: string
  data_fim: string
  dias_restantes: number
  // Nova fórmula
  acertos_questoes: number
  acertos_revisao: number
  nota_questoes: number
  nota_revisao: number
  // Legado
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

interface Estatisticas {
  media_questoes_por_dia: number
  dias_decorridos: number
  dias_totais: number
  projecao_questoes: number
  projecao_nota: number
}

// Cores Koyeb
const KOYEB = {
  bg: '#0D0D14',
  bgCard: '#1A1A2E',
  bgElevated: '#222238',
  bgDark: '#12121C',
  primary: '#00FF88',
  accent: '#00D4FF',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B8B9A',
  textMuted: '#5A5A6E',
  border: 'rgba(255,255,255,0.05)',
  borderHover: 'rgba(0, 255, 136, 0.2)',
  success: '#00FF88',
  warning: '#FFB800',
  danger: '#FF4757',
}

export default function NotasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [notaAtual, setNotaAtual] = useState<NotaBimestre | null>(null)
  const [evolucaoDiaria, setEvolucaoDiaria] = useState<EvolucaoDiaria[]>([])
  const [progressoSemanal, setProgressoSemanal] = useState<ProgressoSemanal[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [notaAnterior, setNotaAnterior] = useState<number | null>(null)
  const [animandoNota, setAnimandoNota] = useState(false)
  const [atualizando, setAtualizando] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const ultimaAtualizacaoRef = useRef<number>(Date.now())

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
        setEstatisticas(data.estatisticas || null)
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

    const handleFocus = () => {
      if (Date.now() - ultimaAtualizacaoRef.current > 3000) buscarNotas(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [componente, buscarNotas])

  const isFisica = componente === 'fisica'

  const getStatusConfig = (status: string, nota: number) => {
    if (nota >= 6) {
      return {
        icon: <CheckCircle2 className="w-4 h-4" />,
        label: 'Aprovado',
        bg: 'rgba(0, 255, 136, 0.1)',
        border: 'rgba(0, 255, 136, 0.3)',
        color: KOYEB.success,
      }
    }

    const config: Record<string, { icon: React.ReactNode; label: string; bg: string; border: string; color: string }> = {
      aprovado: { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Aprovado', bg: 'rgba(0, 255, 136, 0.1)', border: 'rgba(0, 255, 136, 0.3)', color: KOYEB.success },
      reprovado: { icon: <AlertTriangle className="w-4 h-4" />, label: 'Em recuperação', bg: 'rgba(255, 71, 87, 0.1)', border: 'rgba(255, 71, 87, 0.3)', color: KOYEB.danger },
      recuperacao: { icon: <RefreshCw className="w-4 h-4" />, label: 'Recuperação', bg: 'rgba(255, 184, 0, 0.1)', border: 'rgba(255, 184, 0, 0.3)', color: KOYEB.warning },
      em_andamento: { icon: <Clock className="w-4 h-4" />, label: 'Em Andamento', bg: 'rgba(0, 212, 255, 0.1)', border: 'rgba(0, 212, 255, 0.3)', color: KOYEB.accent },
    }
    return config[status] || config.em_andamento
  }

  const dadosGrafico = evolucaoDiaria.length > 15
    ? evolucaoDiaria.filter((_, i) => i % Math.ceil(evolucaoDiaria.length / 15) === 0 || i === evolucaoDiaria.length - 1)
    : evolucaoDiaria

  // Calcular metas
  const getMetas = (nota: number) => {
    const metas = []

    // Meta 6.0 - Aprovação
    metas.push({
      done: nota >= 6,
      text: 'Atingir 6.0 (aprovação)',
      faltam: nota >= 6 ? 0 : Math.ceil((6 - nota) / 0.05),
    })

    // Meta 8.0
    metas.push({
      done: nota >= 8,
      text: nota >= 8 ? 'Atingir 8.0' : `Atingir 8.0 — faltam ${Math.ceil((8 - nota) / 0.05)} acertos`,
      faltam: nota >= 8 ? 0 : Math.ceil((8 - nota) / 0.05),
    })

    // Meta 10.0
    metas.push({
      done: nota >= 10,
      text: nota >= 10 ? 'Nota máxima!' : `Atingir 10.0 — faltam ${Math.ceil((10 - nota) / 0.05)} acertos`,
      faltam: nota >= 10 ? 0 : Math.ceil((10 - nota) / 0.05),
    })

    return metas
  }

  if (loading) return <Loading fullScreen componente={componente} />

  const progresso = notaAtual ? (notaAtual.nota_final / 10) * 100 : 0
  const statusConfig = notaAtual ? getStatusConfig(notaAtual.status, notaAtual.nota_final) : null

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${KOYEB.bg} 0%, ${KOYEB.bgCard} 100%)`,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header className="text-center pt-6 pb-4 px-6">
        {/* Nav */}
        <div className="flex items-center justify-between mb-6 max-w-lg mx-auto">
          <button
            onClick={() => router.push(`/${componente}/menu`)}
            className="p-2 rounded-lg transition-all hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: KOYEB.textSecondary }} />
          </button>

          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: KOYEB.primary }}
            />
            <span
              className="font-mono text-xs tracking-wider uppercase"
              style={{ color: KOYEB.textSecondary }}
            >
              Live
            </span>
          </div>

          <button
            onClick={() => buscarNotas(false)}
            disabled={atualizando}
            className="p-2 rounded-lg transition-all hover:bg-white/10"
          >
            <RefreshCw
              className={`w-5 h-5 ${atualizando ? 'animate-spin' : ''}`}
              style={{ color: KOYEB.textSecondary }}
            />
          </button>
        </div>

        {/* Badge Bimestre */}
        {notaAtual && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ background: KOYEB.bgElevated }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: KOYEB.primary }}
            />
            <span
              className="font-mono text-xs tracking-wider uppercase"
              style={{ color: KOYEB.textSecondary }}
            >
              {notaAtual.bimestre}º Bimestre • 2025
            </span>
          </div>
        )}

        {/* Título */}
        <p
          className="font-mono text-sm font-bold tracking-widest uppercase mb-1"
          style={{ color: KOYEB.textSecondary }}
        >
          Minhas Notas
        </p>
        <p className="font-mono text-2xl font-bold tracking-wide">
          <span style={{ color: KOYEB.textPrimary }}>{isFisica ? 'Física' : 'Matemática'}</span>
        </p>
      </header>

      {/* Conteúdo */}
      <main className="max-w-lg mx-auto px-4 pb-8 space-y-4">
        {erro ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
          >
            <WifiOff className="w-12 h-12 mx-auto mb-4" style={{ color: KOYEB.danger }} />
            <p className="text-sm mb-6" style={{ color: KOYEB.textSecondary }}>{erro}</p>
            <Button variant="primary" size="sm" onClick={() => buscarNotas(false)}>
              Tentar Novamente
            </Button>
          </div>
        ) : notaAtual ? (
          <>
            {/* Card Nota Principal */}
            <div
              className={`rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${animandoNota ? 'scale-[1.02]' : ''}`}
              style={{
                background: KOYEB.bgCard,
                border: `1px solid ${KOYEB.border}`,
                borderTop: `3px solid ${KOYEB.primary}`,
              }}
            >
              <p
                className="font-mono text-xs font-bold tracking-widest uppercase mb-4"
                style={{ color: KOYEB.textMuted }}
              >
                Nota Atual
              </p>

              <div className="text-center">
                <div className="relative inline-block">
                  <span
                    className={`font-mono text-7xl font-bold transition-all duration-300 ${animandoNota ? 'scale-110' : ''}`}
                    style={{
                      color: KOYEB.textPrimary,
                      textShadow: `0 0 40px rgba(0, 255, 136, 0.3)`,
                    }}
                  >
                    {notaAtual.nota_final.toFixed(2)}
                  </span>
                  <span
                    className="font-mono text-2xl"
                    style={{ color: KOYEB.textMuted }}
                  >
                    /10
                  </span>

                  {animandoNota && notaAnterior !== null && (
                    <span
                      className="absolute -right-16 top-4 font-mono text-sm font-bold animate-bounce"
                      style={{ color: KOYEB.primary }}
                    >
                      +{(notaAtual.nota_final - notaAnterior).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Status Badge */}
                {statusConfig && (
                  <div className="mt-4">
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs font-bold tracking-wider uppercase"
                      style={{
                        background: statusConfig.bg,
                        border: `1px solid ${statusConfig.border}`,
                        color: statusConfig.color,
                      }}
                    >
                      {statusConfig.icon} {statusConfig.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-xs" style={{ color: KOYEB.textMuted }}>
                    Progresso para nota 10
                  </span>
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: KOYEB.primary }}
                  >
                    {progresso.toFixed(0)}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: KOYEB.bgDark }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progresso}%`,
                      background: `linear-gradient(90deg, ${KOYEB.primary}, ${KOYEB.accent})`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Grid Composição */}
            <div className="grid grid-cols-2 gap-4">
              {/* Questões */}
              <div
                className="rounded-xl p-5 transition-all duration-300 hover:translate-y-[-2px] cursor-pointer"
                style={{
                  background: KOYEB.bgCard,
                  border: `1px solid ${KOYEB.border}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                  style={{ background: 'rgba(0, 255, 136, 0.1)' }}
                >
                  <Target className="w-5 h-5" style={{ color: KOYEB.primary }} />
                </div>
                <p
                  className="font-mono text-[10px] font-bold tracking-widest uppercase mb-1"
                  style={{ color: KOYEB.textMuted }}
                >
                  Questões
                </p>
                <p
                  className="font-mono text-3xl font-bold mb-1"
                  style={{ color: KOYEB.primary }}
                >
                  {(notaAtual.nota_questoes || 0).toFixed(2)}
                </p>
                <p className="text-xs" style={{ color: KOYEB.textSecondary }}>
                  <strong style={{ color: KOYEB.textPrimary }}>{notaAtual.acertos_questoes || 0}</strong> acertos
                </p>
              </div>

              {/* Revisão */}
              <div
                className="rounded-xl p-5 transition-all duration-300 hover:translate-y-[-2px] cursor-pointer"
                style={{
                  background: KOYEB.bgCard,
                  border: `1px solid ${KOYEB.border}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                  style={{ background: 'rgba(0, 212, 255, 0.1)' }}
                >
                  <RefreshCw className="w-5 h-5" style={{ color: KOYEB.accent }} />
                </div>
                <p
                  className="font-mono text-[10px] font-bold tracking-widest uppercase mb-1"
                  style={{ color: KOYEB.textMuted }}
                >
                  Revisão
                </p>
                <p
                  className="font-mono text-3xl font-bold mb-1"
                  style={{ color: KOYEB.accent }}
                >
                  {(notaAtual.nota_revisao || 0).toFixed(2)}
                </p>
                <p className="text-xs" style={{ color: KOYEB.textSecondary }}>
                  <strong style={{ color: KOYEB.textPrimary }}>{notaAtual.acertos_revisao || 0}</strong> acertos
                </p>
              </div>
            </div>

            {/* Detalhes */}
            <div
              className="rounded-2xl p-5"
              style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
            >
              <p
                className="font-mono text-[10px] font-bold tracking-widest uppercase mb-4"
                style={{ color: KOYEB.textMuted }}
              >
                Detalhes
              </p>

              {[
                { icon: <Target className="w-4 h-4" />, label: 'Questões respondidas', value: notaAtual.questoes_respondidas.toString() },
                { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Taxa de acerto', value: `${Math.round((notaAtual.acertos_questoes / Math.max(notaAtual.questoes_respondidas, 1)) * 100)}%`, color: KOYEB.primary },
                { icon: <RefreshCw className="w-4 h-4" />, label: 'Revisões feitas', value: (notaAtual.acertos_revisao || 0).toString() },
                { icon: <TrendingUp className="w-4 h-4" />, label: 'Esta semana', value: `${notaAtual.questoes_semana}/15`, color: notaAtual.questoes_semana >= 15 ? KOYEB.danger : KOYEB.primary },
                { icon: <Clock className="w-4 h-4" />, label: 'Dias restantes', value: notaAtual.dias_restantes.toString(), color: KOYEB.warning },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: i < 4 ? `1px solid ${KOYEB.border}` : 'none' }}
                >
                  <span
                    className="flex items-center gap-2 text-sm"
                    style={{ color: KOYEB.textSecondary }}
                  >
                    <span style={{ color: KOYEB.textMuted }}>{item.icon}</span>
                    {item.label}
                  </span>
                  <span
                    className="font-mono text-sm font-semibold"
                    style={{ color: item.color || KOYEB.textPrimary }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Metas */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: `linear-gradient(135deg, ${KOYEB.bgCard} 0%, rgba(0, 255, 136, 0.05) 100%)`,
                border: `1px solid rgba(0, 255, 136, 0.1)`,
              }}
            >
              <p
                className="font-mono text-[10px] font-bold tracking-widest uppercase mb-4"
                style={{ color: KOYEB.primary }}
              >
                Próximas Metas
              </p>

              {getMetas(notaAtual.nota_final).map((meta, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                    style={{
                      background: meta.done ? KOYEB.primary : 'transparent',
                      border: `2px solid ${meta.done ? KOYEB.primary : KOYEB.textMuted}`,
                      color: meta.done ? KOYEB.bg : KOYEB.textMuted,
                    }}
                  >
                    {meta.done && '✓'}
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      color: KOYEB.textSecondary,
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
              <div
                className="rounded-2xl p-5"
                style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p
                    className="font-mono text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: KOYEB.textMuted }}
                  >
                    Evolução
                  </p>
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: KOYEB.textMuted }}>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 rounded" style={{ background: KOYEB.primary }} /> Nota
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-0.5 rounded" style={{ background: KOYEB.warning, opacity: 0.5 }} /> Min 6.0
                    </span>
                  </div>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosGrafico} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNotaKoyeb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={KOYEB.primary} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={KOYEB.primary} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="dataFormatada"
                        tick={{ fill: KOYEB.textMuted, fontSize: 9, fontFamily: 'Space Mono, monospace' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 10]}
                        tick={{ fill: KOYEB.textMuted, fontSize: 9, fontFamily: 'Space Mono, monospace' }}
                        axisLine={false}
                        tickLine={false}
                        ticks={[0, 5, 10]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: KOYEB.bgDark,
                          border: `1px solid ${KOYEB.border}`,
                          borderRadius: 8,
                          fontSize: 11,
                          fontFamily: 'Space Mono, monospace',
                        }}
                        labelStyle={{ color: KOYEB.textSecondary }}
                        formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : value, 'Nota']}
                      />
                      <ReferenceLine y={6} stroke={KOYEB.warning} strokeDasharray="3 3" strokeOpacity={0.4} />
                      <Area
                        type="monotone"
                        dataKey="nota"
                        stroke={KOYEB.primary}
                        strokeWidth={2}
                        fill="url(#colorNotaKoyeb)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Gráfico Semanal */}
            {progressoSemanal.length > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p
                    className="font-mono text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: KOYEB.textMuted }}
                  >
                    Questões/Semana
                  </p>
                  <span
                    className="font-mono text-xs font-medium"
                    style={{ color: notaAtual.pode_responder ? KOYEB.primary : KOYEB.danger }}
                  >
                    S{notaAtual.semana_atual}: {notaAtual.questoes_semana}/15
                  </span>
                </div>
                <div className="h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressoSemanal} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <XAxis
                        dataKey="semana"
                        tick={{ fill: KOYEB.textMuted, fontSize: 9, fontFamily: 'Space Mono, monospace' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `S${v}`}
                      />
                      <YAxis
                        domain={[0, 15]}
                        tick={{ fill: KOYEB.textMuted, fontSize: 9, fontFamily: 'Space Mono, monospace' }}
                        axisLine={false}
                        tickLine={false}
                        ticks={[0, 15]}
                      />
                      <ReferenceLine y={15} stroke={KOYEB.danger} strokeDasharray="2 2" strokeOpacity={0.3} />
                      <Bar dataKey="questoes" radius={[4, 4, 0, 0]}>
                        {progressoSemanal.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={entry.semana === notaAtual.semana_atual ? KOYEB.primary : KOYEB.accent}
                            opacity={entry.semana === notaAtual.semana_atual ? 1 : 0.5}
                          />
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
                className="rounded-2xl p-6 text-center"
                style={{
                  background: `linear-gradient(135deg, rgba(255, 184, 0, 0.1) 0%, rgba(0, 255, 136, 0.1) 100%)`,
                  border: `1px solid rgba(255, 184, 0, 0.2)`,
                }}
              >
                <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: KOYEB.warning }} />
                <p
                  className="font-mono text-lg font-bold tracking-wide"
                  style={{ color: KOYEB.primary }}
                >
                  Nota Máxima Atingida!
                </p>
              </div>
            )}

            {/* Botões */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => router.push(`/${componente}/estudar`)}
                disabled={!notaAtual.pode_responder}
                className="flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300 hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: notaAtual.pode_responder ? KOYEB.primary : KOYEB.textMuted,
                  color: KOYEB.bg,
                  boxShadow: notaAtual.pode_responder ? `0 4px 20px rgba(0, 255, 136, 0.3)` : 'none',
                }}
              >
                {notaAtual.pode_responder ? (
                  <>Estudar <ChevronRight className="w-4 h-4" /></>
                ) : (
                  'Limite Atingido'
                )}
              </button>

              <button
                onClick={() => router.push(`/${componente}/revisar`)}
                className="flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all duration-300 hover:translate-y-[-2px]"
                style={{
                  background: 'transparent',
                  border: `2px solid rgba(255, 255, 255, 0.2)`,
                  color: KOYEB.textPrimary,
                }}
              >
                <RefreshCw className="w-4 h-4" /> Revisão
              </button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
