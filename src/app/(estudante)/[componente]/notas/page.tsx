'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  GraduationCap,
  RefreshCw,
  WifiOff,
  TrendingUp,
  Calendar,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Trophy,
  BarChart3,
  Activity,
  Flame,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA DE NOTAS 2025
// Baseado em PARTICIPAÇÃO + BÔNUS DE FREQUÊNCIA
// ═══════════════════════════════════════════════════════════════════════════

interface NotaBimestre {
  bimestre: number
  ano: number
  tipo_periodo: 'regular' | 'recuperacao'
  data_inicio: string
  data_fim: string
  dias_restantes: number
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

interface TabelaBonus {
  dias: string
  bonus: number
}

export default function NotasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [notaAtual, setNotaAtual] = useState<NotaBimestre | null>(null)
  const [evolucaoDiaria, setEvolucaoDiaria] = useState<EvolucaoDiaria[]>([])
  const [progressoSemanal, setProgressoSemanal] = useState<ProgressoSemanal[]>([])
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)
  const [tabelaBonus, setTabelaBonus] = useState<TabelaBonus[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Estado para animação de atualização em tempo real
  const [notaAnterior, setNotaAnterior] = useState<number | null>(null)
  const [animandoNota, setAnimandoNota] = useState(false)
  const [atualizando, setAtualizando] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const ultimaAtualizacaoRef = useRef<number>(Date.now())

  // Função para buscar notas (silenciosa para polling)
  const buscarNotas = useCallback(async (silencioso = false) => {
    if (!silencioso) {
      setLoading(true)
    } else {
      setAtualizando(true)
    }
    setErro(null)

    try {
      const response = await fetch(`/api/notas?componente=${componente}&_t=${Date.now()}`)
      const data = await response.json()

      if (data.sucesso) {
        const novaNota = data.bimestre_atual?.nota_final || 0
        const notaAtualValor = notaAtual?.nota_final || 0

        // Detectar mudança na nota para animação
        if (silencioso && notaAtualValor > 0 && novaNota !== notaAtualValor) {
          setNotaAnterior(notaAtualValor)
          setAnimandoNota(true)
          setTimeout(() => setAnimandoNota(false), 2000)
        }

        setNotaAtual(data.bimestre_atual)
        setEvolucaoDiaria(data.evolucao_diaria || [])
        setProgressoSemanal(data.progresso_semanal || [])
        setEstatisticas(data.estatisticas || null)
        setTabelaBonus(data.tabela_bonus || [])
        ultimaAtualizacaoRef.current = Date.now()
      } else if (!silencioso) {
        setErro(data.erro || 'Erro ao carregar notas')
      }
    } catch (error) {
      console.error('Erro ao buscar notas:', error)
      if (!silencioso) {
        setErro('Não foi possível conectar ao servidor.')
      }
    } finally {
      setLoading(false)
      setAtualizando(false)
    }
  }, [componente, notaAtual?.nota_final])

  // Polling automático a cada 5 segundos quando a página está visível
  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    buscarNotas()

    // Iniciar polling
    const iniciarPolling = () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          buscarNotas(true)
        }
      }, 5000) // Atualiza a cada 5 segundos
    }

    iniciarPolling()

    // Atualizar quando a página voltar a ficar visível
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Se passou mais de 3 segundos desde a última atualização
        if (Date.now() - ultimaAtualizacaoRef.current > 3000) {
          buscarNotas(true)
        }
        iniciarPolling()
      }
    }

    // Atualizar quando a janela ganhar foco
    const handleFocus = () => {
      if (Date.now() - ultimaAtualizacaoRef.current > 3000) {
        buscarNotas(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [componente, buscarNotas])

  const handleVoltar = () => {
    router.push(`/${componente}/menu`)
  }

  const nomeComponente = componente === 'fisica' ? 'Física' : 'Matemática'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      case 'reprovado':
        return <AlertTriangle className="w-5 h-5 text-red-400" />
      case 'recuperacao':
        return <RefreshCw className="w-5 h-5 text-amber-400" />
      default:
        return <Clock className="w-5 h-5 text-blue-400" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovado':
        return 'Aprovado'
      case 'reprovado':
        return 'Reprovado'
      case 'recuperacao':
        return 'Em Recuperação'
      default:
        return 'Em Andamento'
    }
  }

  // Preparar dados para gráfico de evolução (amostragem para performance)
  const dadosGrafico = evolucaoDiaria.length > 20
    ? evolucaoDiaria.filter((_, i) => i % Math.ceil(evolucaoDiaria.length / 20) === 0 || i === evolucaoDiaria.length - 1)
    : evolucaoDiaria

  // Tooltip customizado para gráfico de nota
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-surface border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-text-muted mb-1">{label}</p>
          <p className="text-lg font-bold text-text-primary">
            Nota: <span className={getNotaColor(payload[0].value)}>{payload[0].value.toFixed(2)}</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-8">
      {/* Header */}
      <header className={`${bgColor} text-white px-4 pt-4 pb-16`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleVoltar}
              className="p-2 -ml-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1 className="font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Boletim 2025
              </h1>
              <p className="text-sm text-white/80">{nomeComponente}</p>
            </div>
            <button
              onClick={() => buscarNotas(false)}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors relative"
              disabled={atualizando}
            >
              <RefreshCw className={`w-5 h-5 ${atualizando ? 'animate-spin' : ''}`} />
              {atualizando && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              )}
            </button>
          </div>

          {notaAtual && (
            <div className={`bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center relative overflow-hidden transition-all duration-500 ${animandoNota ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-transparent' : ''}`}>
              {/* Indicador de tempo real */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-white/60 font-mono">LIVE</span>
              </div>

              <p className="text-sm text-white/80 mb-1">
                {notaAtual.bimestre}º Bimestre {notaAtual.em_recuperacao ? '(Recuperação)' : ''}
              </p>

              {/* Nota com animação */}
              <div className="relative">
                {animandoNota && notaAnterior !== null && (
                  <p className="absolute inset-0 text-5xl font-bold text-white/30 animate-ping">
                    {notaAnterior.toFixed(1)}
                  </p>
                )}
                <p className={`text-5xl font-bold transition-all duration-500 ${
                  notaAtual.em_recuperacao ? 'text-amber-300' : ''
                } ${animandoNota ? 'scale-110 text-emerald-300' : ''}`}>
                  {notaAtual.nota_final.toFixed(1)}
                </p>
                {animandoNota && notaAnterior !== null && (
                  <p className="text-xs text-emerald-300 mt-1 animate-bounce">
                    +{(notaAtual.nota_final - notaAnterior).toFixed(2)} pontos!
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mt-2">
                {getStatusIcon(notaAtual.status)}
                <span className="text-sm text-white/90">{getStatusLabel(notaAtual.status)}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 -mt-8 space-y-4">
        {erro ? (
          <Card className="text-center py-10">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-500/20 border border-red-500/30">
              <WifiOff className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Erro</h2>
            <p className="text-text-secondary mb-6">{erro}</p>
            <Button variant="primary" onClick={() => buscarNotas(false)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </Card>
        ) : notaAtual ? (
          <>
            {/* Timeline de Progresso */}
            <Card className={`animate-slide-up transition-all duration-300 ${animandoNota ? 'ring-2 ring-emerald-500/50' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-text-primary">Progresso do Bimestre</h3>
                  <p className="text-xs text-text-muted">
                    {new Date(notaAtual.data_inicio).toLocaleDateString('pt-BR')} até{' '}
                    {new Date(notaAtual.data_fim).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {notaAtual.dias_restantes > 0 && (
                  <span className="text-sm text-amber-400 font-medium bg-amber-400/10 px-3 py-1 rounded-full">
                    {notaAtual.dias_restantes} dias
                  </span>
                )}
              </div>

              {/* Timeline Visual */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-secondary flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Questões respondidas
                  </span>
                  <span className={`font-bold text-xl transition-all duration-300 ${animandoNota ? 'text-emerald-400 scale-110' : 'text-text-primary'}`}>
                    {notaAtual.questoes_respondidas}
                    <span className="text-text-muted font-normal text-base"> / {notaAtual.meta_questoes}</span>
                  </span>
                </div>

                {/* Barra de Progresso Principal */}
                <div className="relative h-6 bg-dark-elevated rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${bgColor}`}
                    style={{ width: `${Math.min(notaAtual.percentual_questoes, 100)}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white drop-shadow-md">
                      {notaAtual.percentual_questoes}%
                    </span>
                  </div>
                </div>

                {/* Indicadores de meta */}
                <div className="flex justify-between text-xs text-text-muted">
                  <span>0</span>
                  <span className="text-amber-400">Meta: {notaAtual.meta_questoes}</span>
                </div>
              </div>

              {/* Estatísticas Rápidas */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-dark-elevated rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-400">{notaAtual.dias_ativos}</p>
                  <p className="text-xs text-text-muted">Dias Ativos</p>
                </div>
                <div className="bg-dark-elevated rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {estatisticas?.media_questoes_por_dia || 0}
                  </p>
                  <p className="text-xs text-text-muted">Média/Dia</p>
                </div>
                <div className="bg-dark-elevated rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-purple-400">+{notaAtual.bonus_frequencia.toFixed(1)}</p>
                  <p className="text-xs text-text-muted">Bônus</p>
                </div>
              </div>
            </Card>

            {/* Gráfico de Evolução da Nota */}
            {dadosGrafico.length > 0 && (
              <Card className="animate-slide-up" style={{ animationDelay: '50ms' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-primary">Evolução da Nota</h3>
                    <p className="text-xs text-text-muted">Acompanhe seu progresso ao longo do tempo</p>
                  </div>
                </div>

                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosGrafico} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="dataFormatada"
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 10]}
                        tick={{ fill: '#9ca3af', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        ticks={[0, 2, 4, 6, 8, 10]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={6} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.5} />
                      <Area
                        type="monotone"
                        dataKey="nota"
                        stroke={chartColor}
                        strokeWidth={2}
                        fill="url(#colorNota)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-4 mt-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-0.5 rounded" style={{ backgroundColor: chartColor }} />
                    Sua nota
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-0.5 rounded bg-amber-500" style={{ opacity: 0.5 }} />
                    Mínimo (6.0)
                  </span>
                </div>
              </Card>
            )}

            {/* Progresso Semanal */}
            <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary">Questões por Semana</h3>
                  <p className="text-xs text-text-muted">Limite: 15 questões/semana</p>
                </div>
              </div>

              {progressoSemanal.length > 0 ? (
                <>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressoSemanal} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis
                          dataKey="semana"
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `S${v}`}
                        />
                        <YAxis
                          domain={[0, 15]}
                          tick={{ fill: '#9ca3af', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload as ProgressoSemanal
                              return (
                                <div className="bg-dark-surface border border-border rounded-lg p-3 shadow-lg">
                                  <p className="text-xs text-text-muted mb-1">Semana {data.semana}</p>
                                  <p className="text-lg font-bold text-text-primary">{data.questoes}/15</p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <ReferenceLine y={15} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                        <Bar dataKey="questoes" radius={[4, 4, 0, 0]}>
                          {progressoSemanal.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.semana === notaAtual.semana_atual ? chartColorLight : chartColor}
                              opacity={entry.semana === notaAtual.semana_atual ? 1 : 0.7}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Semana Atual */}
                  <div className="mt-4 rounded-xl p-3 bg-dark-elevated border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text-secondary">
                          Semana {notaAtual.semana_atual}
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${notaAtual.pode_responder ? 'text-emerald-400' : 'text-red-400'}`}>
                        {notaAtual.questoes_semana}/{notaAtual.limite_semanal || '∞'}
                      </span>
                    </div>

                    {/* Barra de progresso semanal */}
                    <div className="h-2 bg-dark-surface rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          notaAtual.questoes_semana >= 15 ? 'bg-red-500' :
                          notaAtual.questoes_semana >= 10 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min((notaAtual.questoes_semana / 15) * 100, 100)}%` }}
                      />
                    </div>

                    {!notaAtual.pode_responder && notaAtual.limite_semanal && (
                      <p className="text-xs text-amber-400 mt-2">
                        Limite semanal atingido. Volte na segunda-feira!
                      </p>
                    )}
                    {notaAtual.em_recuperacao && (
                      <p className="text-xs text-emerald-400 mt-2">
                        Recuperação: sem limite de questões!
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-text-muted">
                  <p className="text-sm">Nenhuma questão respondida ainda</p>
                  <p className="text-xs mt-1">Comece a estudar para ver seu progresso aqui!</p>
                </div>
              )}
            </Card>

            {/* Composição da Nota */}
            <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColor}`}>
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-text-primary">Composição da Nota</h3>
              </div>

              <div className="space-y-4">
                {/* Nota Base */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-dark-elevated">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Nota Base</p>
                    <p className="text-xs text-text-muted">
                      ({notaAtual.questoes_respondidas}/{notaAtual.meta_questoes}) × 10
                    </p>
                  </div>
                  <span className={`text-2xl font-bold ${getNotaColor(notaAtual.nota_base)}`}>
                    {notaAtual.nota_base.toFixed(2)}
                  </span>
                </div>

                {/* Bônus de Frequência */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-dark-elevated">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">Bônus Frequência</p>
                      <p className="text-xs text-text-muted">
                        {notaAtual.dias_ativos} dias ativos
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-400">
                    +{notaAtual.bonus_frequencia.toFixed(1)}
                  </span>
                </div>

                {/* Separador */}
                <div className="border-t border-border" />

                {/* Nota Final */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-dark-surface border-2 border-border">
                  <div>
                    <p className="text-base font-semibold text-text-primary">
                      {notaAtual.em_recuperacao ? 'Nota Recuperação' : 'Nota Final'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {notaAtual.em_recuperacao
                        ? `${notaAtual.questoes_recuperacao}/${notaAtual.questoes_pendentes} pendentes`
                        : 'base + bônus (máx 10.0)'}
                    </p>
                  </div>
                  <span className={`text-4xl font-bold ${getNotaColor(notaAtual.nota_final)}`}>
                    {notaAtual.nota_final.toFixed(1)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Projeção (se tiver estatísticas) */}
            {estatisticas && estatisticas.projecao_nota > 0 && !notaAtual.em_recuperacao && (
              <div className="animate-slide-up rounded-2xl overflow-hidden border border-blue-500/30" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-blue-500/20">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 text-xs text-gray-400 font-mono">projecao.sh</span>
                </div>
                <div className="p-4 bg-[#0d0d0d] font-mono text-sm">
                  <p className="text-blue-400 mb-2"># Projeção (se mantiver o ritmo atual)</p>
                  <p className="text-gray-300">
                    $ Questões projetadas: <span className="text-white">{estatisticas.projecao_questoes}</span>
                  </p>
                  <p className="text-gray-300">
                    $ Nota projetada: <span className={estatisticas.projecao_nota >= 6 ? 'text-emerald-400' : 'text-amber-400'}>
                      {estatisticas.projecao_nota.toFixed(1)}
                    </span>
                  </p>
                  <p className="text-gray-500 mt-2 text-xs">
                    # Baseado em {estatisticas.dias_decorridos} de {estatisticas.dias_totais} dias
                  </p>
                </div>
              </div>
            )}

            {/* Tabela de Bônus - Estilo Terminal */}
            <div className="animate-slide-up rounded-2xl overflow-hidden border border-emerald-500/30" style={{ animationDelay: '250ms' }}>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-emerald-500/20">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                <span className="ml-2 text-xs text-gray-400 font-mono">bonus_frequencia.sh</span>
              </div>
              <div className="p-4 bg-[#0d0d0d] font-mono text-sm">
                <p className="text-emerald-400 mb-3"># Tabela de Bônus por Dias Ativos</p>
                <div className="space-y-1">
                  {tabelaBonus.map((item, i) => {
                    const [min, max] = item.dias.replace('+', '').split('-').map(s => parseInt(s))
                    const isAtual = item.dias.includes('+')
                      ? notaAtual.dias_ativos >= min
                      : notaAtual.dias_ativos >= min && notaAtual.dias_ativos <= (max || min)

                    return (
                      <p
                        key={i}
                        className={isAtual ? 'text-emerald-300' : 'text-gray-500'}
                      >
                        $ {item.dias.padEnd(6)} dias → +{item.bonus.toFixed(1)} pontos
                        {isAtual && ' ← você está aqui'}
                      </p>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Recuperação Info */}
            {notaAtual.em_recuperacao && (
              <div className="animate-slide-up rounded-2xl overflow-hidden border border-amber-500/30" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-amber-500/20">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 text-xs text-gray-400 font-mono">recuperacao.sh</span>
                </div>
                <div className="p-4 bg-[#0d0d0d] font-mono text-sm">
                  <p className="text-amber-400 mb-2"># Período de Recuperação</p>
                  <p className="text-gray-300">$ Questões pendentes: {notaAtual.questoes_pendentes}</p>
                  <p className="text-gray-300">$ Respondidas na recuperação: {notaAtual.questoes_recuperacao}</p>
                  <p className="text-gray-300">$ Nota máxima possível: 6.0</p>
                  <p className="text-emerald-300 mt-2">$ SEM LIMITE - Faça todas as questões!</p>
                </div>
              </div>
            )}

            {/* Dicas */}
            {!notaAtual.em_recuperacao && notaAtual.nota_final < 10 && (
              <div className="animate-slide-up rounded-2xl overflow-hidden border border-emerald-500/30" style={{ animationDelay: '350ms' }}>
                <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-emerald-500/20">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-2 text-xs text-gray-400 font-mono">dicas.sh</span>
                </div>
                <div className="p-4 bg-[#0d0d0d] font-mono text-sm">
                  <p className="text-emerald-400 mb-2"># Como melhorar sua nota?</p>
                  {notaAtual.questoes_respondidas < notaAtual.meta_questoes && (
                    <p className="text-gray-300">
                      $ Responda mais {notaAtual.meta_questoes - notaAtual.questoes_respondidas} questões para atingir a meta
                    </p>
                  )}
                  {notaAtual.bonus_frequencia < 2.0 && (
                    <p className="text-gray-300">
                      $ Estude em mais dias para aumentar o bônus (atual: +{notaAtual.bonus_frequencia.toFixed(1)}, máx: +2.0)
                    </p>
                  )}
                  <p className="text-gray-300">$ Máximo de 15 questões por semana no período regular</p>
                </div>
              </div>
            )}

            {/* Nota 10 */}
            {notaAtual.nota_final >= 10 && (
              <Card className="animate-slide-up text-center py-6" style={{ animationDelay: '300ms' }}>
                <Trophy className="w-16 h-16 mx-auto mb-4 text-amber-400" />
                <h3 className="text-xl font-bold text-emerald-400 mb-2">Parabéns! Nota Máxima!</h3>
                <p className="text-text-secondary">
                  Você atingiu a nota máxima neste bimestre. Continue assim!
                </p>
              </Card>
            )}

            {/* Botão de Ação */}
            <div className="pt-4">
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                className="w-full"
                onClick={() => router.push(`/${componente}/estudar`)}
                disabled={!notaAtual.pode_responder}
              >
                {notaAtual.pode_responder ? (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Continuar Estudando
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 mr-2" />
                    Limite Semanal Atingido
                  </>
                )}
              </Button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
