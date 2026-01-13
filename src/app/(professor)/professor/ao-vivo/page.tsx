'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  BookOpen,
  MessageCircle,
  Target,
  TrendingUp,
  RefreshCw,
  ArrowLeft,
  Filter,
  Atom,
  Calculator,
  ChevronDown,
  Radio,
  Eye,
  Award,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface AtividadeTempoReal {
  id: string
  tipo: 'resposta' | 'desafio_iniciado' | 'desafio_completo' | 'tutor' | 'revisao'
  usuario_id: string
  usuario_nome: string
  turma: string
  componente: Componente
  timestamp: string
  detalhes: {
    correta?: boolean
    tema?: string
    pontos?: number
    tempo_segundos?: number
    acertos?: number
    total?: number
  }
}

interface AlunoAtivo {
  id: string
  nome: string
  turma: string
  componente: Componente
  ultima_atividade: string
  tipo_atividade: string
  questoes_sessao: number
  acertos_sessao: number
  tempo_ativo_minutos: number
}

interface EstatisticasTempoReal {
  alunos_ativos_agora: number
  questoes_ultimos_5min: number
  questoes_ultimos_30min: number
  taxa_acerto_tempo_real: number
  usando_tutor: number
  fazendo_desafio: number
  fazendo_revisao: number
  por_turma: {
    turma: string
    ativos: number
    questoes: number
  }[]
}

interface DadosTempoReal {
  sucesso: boolean
  atividades: AtividadeTempoReal[]
  alunos_ativos: AlunoAtivo[]
  estatisticas: EstatisticasTempoReal
  turmas_disponiveis: string[]
  ultima_atualizacao: string
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardAoVivoPage() {
  const router = useRouter()
  const [dados, setDados] = useState<DadosTempoReal | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Filtros
  const [turmaFiltro, setTurmaFiltro] = useState<string>('')
  const [componenteFiltro, setComponenteFiltro] = useState<Componente | ''>('')
  const [showFiltros, setShowFiltros] = useState(false)

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [intervalo, setIntervalo] = useState(5) // segundos
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)
  const [contadorRefresh, setContadorRefresh] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Buscar dados
  const buscarDados = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (turmaFiltro) params.set('turma', turmaFiltro)
      if (componenteFiltro) params.set('componente', componenteFiltro)

      const url = `/api/professor/atividades-tempo-real${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.sucesso) {
        setDados(data)
        setUltimaAtualizacao(new Date())
        setErro(null)
      } else if (response.status === 403) {
        router.push('/login')
      } else {
        setErro(data.erro || 'Erro ao carregar dados')
      }
    } catch {
      setErro('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [turmaFiltro, componenteFiltro, router])

  // Efeito inicial e quando filtros mudam
  useEffect(() => {
    buscarDados()
  }, [buscarDados])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        setContadorRefresh(prev => {
          if (prev >= intervalo) {
            buscarDados()
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, intervalo, buscarDados])

  // Formatar tempo relativo
  const formatarTempoRelativo = (timestamp: string) => {
    const agora = new Date()
    const data = new Date(timestamp)
    const diffMs = agora.getTime() - data.getTime()
    const diffSeg = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSeg / 60)

    if (diffSeg < 60) return `${diffSeg}s atrás`
    if (diffMin < 60) return `${diffMin}min atrás`
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  // Ícone por tipo de atividade
  const getIconeAtividade = (tipo: AtividadeTempoReal['tipo'], correta?: boolean) => {
    switch (tipo) {
      case 'resposta':
        return correta ? (
          <CheckCircle className="w-4 h-4 text-success" />
        ) : (
          <XCircle className="w-4 h-4 text-error" />
        )
      case 'desafio_iniciado':
        return <Zap className="w-4 h-4 text-warning" />
      case 'desafio_completo':
        return <Award className="w-4 h-4 text-success" />
      case 'tutor':
        return <MessageCircle className="w-4 h-4 text-info" />
      case 'revisao':
        return <BookOpen className="w-4 h-4 text-purple-500" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  // Descrição da atividade
  const getDescricaoAtividade = (atividade: AtividadeTempoReal) => {
    switch (atividade.tipo) {
      case 'resposta':
        return atividade.detalhes.correta
          ? `Acertou uma questão de ${atividade.detalhes.tema || 'N/A'}`
          : `Errou uma questão de ${atividade.detalhes.tema || 'N/A'}`
      case 'desafio_iniciado':
        return 'Iniciou um desafio'
      case 'desafio_completo':
        return `Completou desafio: ${atividade.detalhes.acertos}/${atividade.detalhes.total} acertos`
      case 'tutor':
        return 'Usando o tutor IA'
      case 'revisao':
        return 'Fazendo revisão'
      default:
        return 'Atividade'
    }
  }

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-4"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/professor/dashboard')}
                className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Radio className="w-5 h-5" style={{ color: 'var(--success)' }} />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    Acompanhamento ao Vivo
                  </h1>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Atualização: {autoRefresh ? `a cada ${intervalo}s` : 'pausada'}
                    {ultimaAtualizacao && (
                      <span className="ml-2">
                        (última: {ultimaAtualizacao.toLocaleTimeString('pt-BR')})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Controles de refresh */}
              <div className="flex items-center gap-2 mr-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg transition-all ${
                    autoRefresh ? 'bg-success/20 text-success' : 'bg-[var(--bg-elevated)]'
                  }`}
                  title={autoRefresh ? 'Pausar auto-atualização' : 'Ativar auto-atualização'}
                >
                  <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                </button>
                {autoRefresh && (
                  <div className="w-8 h-8 relative flex items-center justify-center">
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        stroke="var(--border-default)"
                        strokeWidth="2"
                        fill="none"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        stroke="var(--success)"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${(contadorRefresh / intervalo) * 75.4} 75.4`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <span
                      className="absolute text-xs font-bold"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {intervalo - contadorRefresh}
                    </span>
                  </div>
                )}
              </div>

              {/* Botão de filtros */}
              <button
                onClick={() => setShowFiltros(!showFiltros)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showFiltros || turmaFiltro || componenteFiltro
                    ? 'bg-info/20 text-info'
                    : 'bg-[var(--bg-elevated)]'
                }`}
                style={{ color: turmaFiltro || componenteFiltro ? 'var(--info)' : 'var(--text-secondary)' }}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Filtros</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFiltros ? 'rotate-180' : ''}`} />
              </button>

              {/* Refresh manual */}
              <button
                onClick={() => {
                  setContadorRefresh(0)
                  buscarDados()
                }}
                className="p-2 rounded-lg bg-[var(--bg-elevated)] transition-colors hover:bg-[var(--bg-surface)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Painel de filtros */}
          {showFiltros && (
            <div
              className="flex flex-wrap gap-3 p-3 rounded-xl mb-4"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  Turma
                </label>
                <select
                  value={turmaFiltro}
                  onChange={(e) => setTurmaFiltro(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Todas as turmas</option>
                  {dados?.turmas_disponiveis.map((turma) => (
                    <option key={turma} value={turma}>
                      {turma}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  Componente
                </label>
                <select
                  value={componenteFiltro}
                  onChange={(e) => setComponenteFiltro(e.target.value as Componente | '')}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Todos</option>
                  <option value="fisica">Física</option>
                  <option value="matematica">Matemática</option>
                </select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  Intervalo de atualização
                </label>
                <select
                  value={intervalo}
                  onChange={(e) => {
                    setIntervalo(Number(e.target.value))
                    setContadorRefresh(0)
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value={3}>3 segundos</option>
                  <option value={5}>5 segundos</option>
                  <option value={10}>10 segundos</option>
                  <option value={30}>30 segundos</option>
                </select>
              </div>

              {(turmaFiltro || componenteFiltro) && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setTurmaFiltro('')
                      setComponenteFiltro('')
                    }}
                    className="px-3 py-2 text-sm rounded-lg bg-error/20 text-error"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {erro ? (
          <Card className="text-center py-8">
            <XCircle className="w-12 h-12 text-error mx-auto mb-3" />
            <p className="text-error font-medium">{erro}</p>
            <button
              onClick={buscarDados}
              className="mt-4 px-4 py-2 rounded-lg bg-info text-white"
            >
              Tentar novamente
            </button>
          </Card>
        ) : dados ? (
          <>
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              <StatCard
                icon={<Users className="w-5 h-5" />}
                label="Alunos Ativos"
                value={dados.estatisticas.alunos_ativos_agora}
                color="var(--success)"
                pulse
              />
              <StatCard
                icon={<Activity className="w-5 h-5" />}
                label="Questões (5min)"
                value={dados.estatisticas.questoes_ultimos_5min}
                color="var(--info)"
              />
              <StatCard
                icon={<Target className="w-5 h-5" />}
                label="Taxa Acerto"
                value={`${dados.estatisticas.taxa_acerto_tempo_real}%`}
                color="var(--warning)"
              />
              <StatCard
                icon={<Zap className="w-5 h-5" />}
                label="Em Desafio"
                value={dados.estatisticas.fazendo_desafio}
                color="var(--color-matematica)"
              />
              <StatCard
                icon={<MessageCircle className="w-5 h-5" />}
                label="Usando Tutor"
                value={dados.estatisticas.usando_tutor}
                color="var(--color-fisica)"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Questões (30min)"
                value={dados.estatisticas.questoes_ultimos_30min}
                color="var(--text-muted)"
              />
            </div>

            {/* Grid principal: Feed + Alunos ativos */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Feed de atividades */}
              <div className="lg:col-span-2">
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Activity className="w-5 h-5 text-info" />
                      Feed de Atividades
                    </h2>
                    <Badge variant="info" size="sm">
                      {dados.atividades.length} recentes
                    </Badge>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {dados.atividades.length === 0 ? (
                      <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma atividade nos últimos 15 minutos</p>
                        <p className="text-sm">Aguardando alunos...</p>
                      </div>
                    ) : (
                      dados.atividades.map((atividade, index) => (
                        <div
                          key={atividade.id}
                          className="flex items-center gap-3 p-3 rounded-xl transition-all"
                          style={{
                            background: index === 0 ? 'var(--bg-elevated)' : 'transparent',
                            animation: index === 0 ? 'pulse 2s ease-in-out' : undefined,
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{
                              background:
                                atividade.componente === 'fisica'
                                  ? 'var(--color-fisica)'
                                  : 'var(--color-matematica)',
                            }}
                          >
                            {atividade.componente === 'fisica' ? (
                              <Atom className="w-4 h-4 text-white" />
                            ) : (
                              <Calculator className="w-4 h-4 text-white" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                {atividade.usuario_nome}
                              </span>
                              <Badge size="sm">{atividade.turma}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {getIconeAtividade(atividade.tipo, atividade.detalhes.correta)}
                              <span className="truncate">{getDescricaoAtividade(atividade)}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {formatarTempoRelativo(atividade.timestamp)}
                            </p>
                            {atividade.detalhes.pontos !== undefined && atividade.detalhes.pontos > 0 && (
                              <p className="text-xs font-medium text-success">
                                +{atividade.detalhes.pontos} pts
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Sidebar: Alunos ativos + Por turma */}
              <div className="space-y-6">
                {/* Alunos ativos agora */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Eye className="w-5 h-5 text-success" />
                      Alunos Ativos
                    </h2>
                    <span
                      className="flex items-center gap-1 text-sm"
                      style={{ color: 'var(--success)' }}
                    >
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      {dados.alunos_ativos.length} online
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {dados.alunos_ativos.length === 0 ? (
                      <div className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum aluno ativo</p>
                      </div>
                    ) : (
                      dados.alunos_ativos.map((aluno) => (
                        <div
                          key={`${aluno.id}-${aluno.componente}`}
                          className="flex items-center gap-3 p-2 rounded-lg"
                          style={{ background: 'var(--bg-elevated)' }}
                        >
                          <div className="relative">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{
                                background:
                                  aluno.componente === 'fisica'
                                    ? 'var(--color-fisica)'
                                    : 'var(--color-matematica)',
                              }}
                            >
                              {aluno.nome.charAt(0).toUpperCase()}
                            </div>
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                              style={{
                                borderColor: 'var(--bg-elevated)',
                                background:
                                  aluno.tipo_atividade === 'desafio'
                                    ? 'var(--warning)'
                                    : aluno.tipo_atividade === 'tutor'
                                    ? 'var(--info)'
                                    : 'var(--success)',
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                              {aluno.nome}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {aluno.turma} • {aluno.questoes_sessao} questões • {aluno.acertos_sessao} acertos
                            </p>
                          </div>

                          <div className="text-right">
                            <Badge
                              variant={aluno.componente === 'fisica' ? 'fisica' : 'matematica'}
                              size="sm"
                            >
                              {aluno.componente === 'fisica' ? 'Fís' : 'Mat'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Por turma */}
                <Card>
                  <h2 className="font-semibold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
                    <TrendingUp className="w-5 h-5 text-warning" />
                    Atividade por Turma
                  </h2>

                  <div className="space-y-3">
                    {dados.estatisticas.por_turma.length === 0 ? (
                      <p className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                        Nenhuma atividade registrada
                      </p>
                    ) : (
                      dados.estatisticas.por_turma.map((turma) => (
                        <div
                          key={turma.turma}
                          className="flex items-center justify-between p-2 rounded-lg"
                          style={{ background: 'var(--bg-elevated)' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {turma.turma}
                            </span>
                            <span
                              className="flex items-center gap-1 text-xs"
                              style={{ color: 'var(--success)' }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-success" />
                              {turma.ativos} ativos
                            </span>
                          </div>
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {turma.questoes} questões
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Card de Estatística
// ═══════════════════════════════════════════════════════════════════════════

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
  pulse?: boolean
}

function StatCard({ icon, label, value, color, pulse }: StatCardProps) {
  return (
    <div
      className="rounded-xl p-3 text-center relative overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      {pulse && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{ background: `${color}10` }}
        />
      )}
      <div className="relative">
        <div className="mx-auto mb-1" style={{ color }}>
          {icon}
        </div>
        <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}
