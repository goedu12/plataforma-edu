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
  Zap,
  Trophy,
  Flame,
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
// SISTEMA DE NOTAS 2025 - UI OTIMIZADA
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
  const bgColor = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'
  const chartColor = isFisica ? '#06b6d4' : '#a855f7'
  const chartColorLight = isFisica ? '#22d3ee' : '#c084fc'

  const getNotaColor = (nota: number) => {
    if (nota >= 7) return 'text-emerald-400'
    if (nota >= 6) return 'text-green-400'
    if (nota >= 5) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
      aprovado: { icon: <CheckCircle2 className="w-3 h-3" />, label: 'Aprovado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      reprovado: { icon: <AlertTriangle className="w-3 h-3" />, label: 'Reprovado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      recuperacao: { icon: <RefreshCw className="w-3 h-3" />, label: 'Recuperação', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
      em_andamento: { icon: <Clock className="w-3 h-3" />, label: 'Em Andamento', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    }
    const { icon, label, color } = config[status] || config.em_andamento
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${color}`}>
        {icon} {label}
      </span>
    )
  }

  const dadosGrafico = evolucaoDiaria.length > 15
    ? evolucaoDiaria.filter((_, i) => i % Math.ceil(evolucaoDiaria.length / 15) === 0 || i === evolucaoDiaria.length - 1)
    : evolucaoDiaria

  if (loading) return <Loading fullScreen componente={componente} />

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header Compacto */}
      <header className={`${bgColor} text-white px-3 pt-3 pb-12`}>
        <div className="max-w-lg mx-auto">
          {/* Nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => router.push(`/${componente}/menu`)} className="p-1.5 -ml-1 rounded-lg hover:bg-white/20">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-white/70 font-mono">LIVE</span>
            </div>
            <button onClick={() => buscarNotas(false)} disabled={atualizando} className="p-1.5 rounded-lg hover:bg-white/20">
              <RefreshCw className={`w-5 h-5 ${atualizando ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Nota Principal */}
          {notaAtual && (
            <div className={`text-center transition-all duration-300 ${animandoNota ? 'scale-105' : ''}`}>
              <p className="text-[11px] text-white/70 mb-0.5">
                {notaAtual.bimestre}º Bimestre • {isFisica ? 'Física' : 'Matemática'}
              </p>
              <div className="relative inline-block">
                <span className={`text-5xl font-bold tabular-nums ${animandoNota ? 'text-emerald-300' : ''}`}>
                  {notaAtual.nota_final.toFixed(1)}
                </span>
                {animandoNota && notaAnterior !== null && (
                  <span className="absolute -right-12 top-1 text-xs text-emerald-300 font-bold animate-bounce">
                    +{(notaAtual.nota_final - notaAnterior).toFixed(2)}
                  </span>
                )}
              </div>
              <div className="mt-1">{getStatusBadge(notaAtual.status)}</div>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-lg mx-auto px-3 -mt-6 pb-6 space-y-3">
        {erro ? (
          <div className="bg-dark-surface rounded-xl p-6 text-center border border-border">
            <WifiOff className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-text-secondary mb-4">{erro}</p>
            <Button variant="primary" size="sm" onClick={() => buscarNotas(false)}>
              Tentar Novamente
            </Button>
          </div>
        ) : notaAtual ? (
          <>
            {/* Grid: Progresso + Composição */}
            <div className="grid grid-cols-2 gap-2">
              {/* Progresso */}
              <div className="bg-dark-surface rounded-xl p-3 border border-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-[11px] text-text-muted">Progresso</span>
                </div>
                <p className="text-2xl font-bold text-text-primary">
                  {notaAtual.questoes_respondidas}
                  <span className="text-sm text-text-muted font-normal">/{notaAtual.meta_questoes}</span>
                </p>
                <div className="h-1.5 bg-dark-elevated rounded-full mt-2 overflow-hidden">
                  <div className={`h-full rounded-full ${bgColor}`} style={{ width: `${Math.min(notaAtual.percentual_questoes, 100)}%` }} />
                </div>
                <p className="text-[10px] text-text-muted mt-1">{notaAtual.percentual_questoes}% concluído</p>
              </div>

              {/* Composição - Nova Fórmula */}
              <div className="bg-dark-surface rounded-xl p-3 border border-border">
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-[11px] text-text-muted">Composição</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted flex items-center gap-1">
                      <Target className="w-3 h-3 text-cyan-400" /> Questões
                    </span>
                    <span className={getNotaColor(notaAtual.nota_questoes || 0)}>
                      {(notaAtual.nota_questoes || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" /> Revisão
                    </span>
                    <span className="text-emerald-400">+{(notaAtual.nota_revisao || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-1 flex justify-between text-xs font-medium">
                    <span className="text-text-primary">Total</span>
                    <span className={getNotaColor(notaAtual.nota_final)}>{notaAtual.nota_final.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid: Stats compactas - Nova Fórmula */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Acertos', value: notaAtual.acertos_questoes || 0, color: 'text-cyan-400' },
                { label: 'Revisão', value: notaAtual.acertos_revisao || 0, color: 'text-orange-400' },
                { label: 'Semana', value: `${notaAtual.questoes_semana}/15`, color: notaAtual.questoes_semana >= 15 ? 'text-red-400' : 'text-emerald-400' },
                { label: 'Restam', value: `${notaAtual.dias_restantes}d`, color: 'text-amber-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-dark-surface rounded-lg p-2 text-center border border-border">
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-[9px] text-text-muted">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Gráfico Evolução - Compacto */}
            {dadosGrafico.length > 0 && (
              <div className="bg-dark-surface rounded-xl p-3 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-[11px] text-text-muted">Evolução</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-0.5 rounded" style={{ backgroundColor: chartColor }} /> Nota
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-0.5 rounded bg-amber-500 opacity-50" /> Min 6.0
                    </span>
                  </div>
                </div>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosGrafico} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="dataFormatada" tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} ticks={[0, 5, 10]} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, fontSize: 11 }}
                        labelStyle={{ color: '#9ca3af' }}
                        formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : value, 'Nota']}
                      />
                      <ReferenceLine y={6} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.4} />
                      <Area type="monotone" dataKey="nota" stroke={chartColor} strokeWidth={1.5} fill="url(#colorNota)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Gráfico Semanal - Compacto */}
            {progressoSemanal.length > 0 && (
              <div className="bg-dark-surface rounded-xl p-3 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-text-muted">Questões/Semana</span>
                  <span className={`text-xs font-medium ${notaAtual.pode_responder ? 'text-emerald-400' : 'text-red-400'}`}>
                    S{notaAtual.semana_atual}: {notaAtual.questoes_semana}/15
                  </span>
                </div>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressoSemanal} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <XAxis dataKey="semana" tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} tickFormatter={(v) => `S${v}`} />
                      <YAxis domain={[0, 15]} tick={{ fill: '#6b7280', fontSize: 8 }} axisLine={false} tickLine={false} ticks={[0, 15]} />
                      <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.3} />
                      <Bar dataKey="questoes" radius={[3, 3, 0, 0]}>
                        {progressoSemanal.map((entry, index) => (
                          <Cell key={index} fill={entry.semana === notaAtual.semana_atual ? chartColorLight : chartColor} opacity={entry.semana === notaAtual.semana_atual ? 1 : 0.6} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Terminal: Nova Fórmula */}
            <div className="terminal-box">
              <div className="terminal-header">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
                <span className="title">formula.sh</span>
              </div>
              <div className="terminal-body space-y-1">
                <p className="comment"># Nova Fórmula de Notas</p>
                <p className="cmd">$ NOTA = (Acertos÷12) + (Revisão×0.05)</p>
                <p className="muted mt-2"># Seus números</p>
                <p className="success">$ Acertos Questões: {notaAtual.acertos_questoes || 0} → +{(notaAtual.nota_questoes || 0).toFixed(2)}</p>
                <p className="success">$ Acertos Revisão: {notaAtual.acertos_revisao || 0} → +{(notaAtual.nota_revisao || 0).toFixed(2)}</p>
                <p className="warning mt-2"># Dica</p>
                <p className="cmd">$ Revisão não tem limite! Cada acerto = +0.05</p>
                {notaAtual.nota_final < 10 && (
                  <p className="muted">$ Para nota 10: mais {Math.ceil((10 - notaAtual.nota_final) / 0.05)} acertos em revisão</p>
                )}
              </div>
            </div>

            {/* Recuperação ou Dicas */}
            {notaAtual.em_recuperacao ? (
              <div className="terminal-box terminal-amber">
                <div className="terminal-header">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                  <span className="title">recuperacao.sh</span>
                </div>
                <div className="terminal-body">
                  <p className="comment-amber"># Período de Recuperação</p>
                  <p className="cmd">$ Pendentes: {notaAtual.questoes_pendentes} | Feitas: {notaAtual.questoes_recuperacao}</p>
                  <p className="success">$ SEM LIMITE - Faça todas!</p>
                </div>
              </div>
            ) : notaAtual.nota_final < 10 && (
              <div className="bg-dark-surface rounded-xl p-3 border border-border">
                <p className="text-[11px] text-text-muted mb-2">💡 Como aumentar sua nota</p>
                <div className="space-y-1 text-xs text-text-secondary">
                  <p>• <span className="text-cyan-400">Questões:</span> Responda mais questões no modo Estudar (15/semana)</p>
                  <p>• <span className="text-orange-400">Revisão:</span> Refaça questões erradas (sem limite!)</p>
                  <p>• <span className="text-amber-400">Desafio:</span> Faça quantos desafios quiser para pontos</p>
                </div>
              </div>
            )}

            {/* Nota 10 */}
            {notaAtual.nota_final >= 10 && (
              <div className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 rounded-xl p-4 text-center border border-amber-500/20">
                <Trophy className="w-10 h-10 mx-auto mb-2 text-amber-400" />
                <p className="text-sm font-bold text-emerald-400">Nota Máxima!</p>
              </div>
            )}

            {/* Botão Estudar */}
            <Button
              variant={isFisica ? 'fisica' : 'matematica'}
              className="w-full"
              onClick={() => router.push(`/${componente}/estudar`)}
              disabled={!notaAtual.pode_responder}
            >
              {notaAtual.pode_responder ? (
                <>Estudar <ChevronRight className="w-4 h-4 ml-1" /></>
              ) : (
                <>Limite Semanal Atingido</>
              )}
            </Button>
          </>
        ) : null}
      </main>
    </div>
  )
}
