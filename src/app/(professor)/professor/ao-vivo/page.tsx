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
  Target,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Radio,
  Award,
  UserX,
  Timer,
  AlertTriangle,
  Layers,
  Brain,
  PlayCircle,
  PauseCircle,
  HelpCircle,
  Eye,
  Sparkles,
} from 'lucide-react'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

interface AtividadeTempoReal {
  id: string
  tipo: 'resposta' | 'desafio_iniciado' | 'desafio_completo' | 'tutor' | 'revisao' | 'mapa_curtido' | 'mapa_baixado' | 'flashcard'
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
    mapa_titulo?: string
  }
}

interface AlunoAtivo {
  id: string
  nome: string
  turma: string
  componente: Componente
  ultima_atividade: string
  tipo_atividade: 'estudo' | 'desafio' | 'tutor' | 'revisao' | 'flashcard' | 'mapa'
  questoes_sessao: number
  acertos_sessao: number
  taxa_acerto: number
  nota_atual?: number
  posicao_ranking?: number
}

interface AlunoInativo {
  id: string
  nome: string
  turma: string
  componentes: Componente[]
  ultimo_acesso: string | null
}

interface EstatisticasTempoReal {
  alunos_ativos_agora: number
  alunos_inativos: number
  total_alunos_turma: number
  questoes_ultimos_5min: number
  questoes_ultimos_30min: number
  questoes_periodo_total: number
  taxa_acerto_tempo_real: number
  taxa_participacao: number
  usando_tutor: number
  fazendo_desafio: number
  fazendo_revisao: number
  mapas_curtidos: number
  mapas_baixados: number
  media_nota_ativos: number
  tempo_medio_segundos: number
  temas_com_dificuldade: { tema: string; taxa_erro: number; quantidade: number }[]
  tendencia_acerto: 'subindo' | 'estavel' | 'descendo'
  alunos_precisando_ajuda: number
  por_turma: {
    turma: string
    ativos: number
    inativos: number
    total: number
    questoes: number
    taxa_acerto: number
    taxa_participacao: number
  }[]
}

interface DadosTempoReal {
  sucesso: boolean
  atividades: AtividadeTempoReal[]
  alunos_ativos: AlunoAtivo[]
  alunos_inativos: AlunoInativo[]
  estatisticas: EstatisticasTempoReal
  turmas_disponiveis: string[]
  periodo_minutos: number
  ultima_atualizacao: string
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL - DASHBOARD 1280x720
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardAoVivoPage() {
  const router = useRouter()
  const [dados, setDados] = useState<DadosTempoReal | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Filtros
  const [turmaFiltro, setTurmaFiltro] = useState<string>('')
  const [componenteFiltro, setComponenteFiltro] = useState<Componente | ''>('')
  const [periodoMinutos, setPeriodoMinutos] = useState(60)

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [intervalo] = useState(5)
  const [contadorRefresh, setContadorRefresh] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Hora atual
  const [horaAtual, setHoraAtual] = useState(new Date())

  // Atualizar hora
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Buscar dados
  const buscarDados = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (turmaFiltro) params.set('turma', turmaFiltro)
      if (componenteFiltro) params.set('componente', componenteFiltro)
      params.set('periodo', String(periodoMinutos))

      const url = `/api/professor/atividades-tempo-real${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.sucesso) {
        setDados(data)
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
  }, [turmaFiltro, componenteFiltro, periodoMinutos, router])

  useEffect(() => {
    buscarDados()
  }, [buscarDados])

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
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, intervalo, buscarDados])

  // Formatar tempo relativo
  const formatarTempoRelativo = (timestamp: string) => {
    const agora = new Date()
    const data = new Date(timestamp)
    const diffMs = agora.getTime() - data.getTime()
    const diffSeg = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSeg / 60)
    if (diffSeg < 60) return `${diffSeg}s`
    if (diffMin < 60) return `${diffMin}min`
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  // Configuração de cores por tipo de atividade
  const atividadeConfig: Record<string, { cor: string; label: string; icon: React.ReactNode }> = {
    estudo: { cor: '#22c55e', label: 'Estudando', icon: <BookOpen className="w-3 h-3" /> },
    desafio: { cor: '#f59e0b', label: 'Desafio', icon: <Zap className="w-3 h-3" /> },
    tutor: { cor: '#3b82f6', label: 'Tutor IA', icon: <Brain className="w-3 h-3" /> },
    revisao: { cor: '#a855f7', label: 'Revisao', icon: <Layers className="w-3 h-3" /> },
    flashcard: { cor: '#a855f7', label: 'Flashcard', icon: <Layers className="w-3 h-3" /> },
    mapa: { cor: '#06b6d4', label: 'Mapa', icon: <Eye className="w-3 h-3" /> },
  }

  // Cor de fundo do avatar baseada no componente
  const getAvatarBg = (componente: Componente) => {
    return componente === 'fisica' ? '#22c55e' : '#8b5cf6'
  }

  // Iniciais do nome
  const getIniciais = (nome: string) => {
    return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  }

  if (loading) {
    return (
      <div className="w-[1280px] h-[720px] mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #2d4a6f 100%)' }}>
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="w-[1280px] h-[720px] mx-auto flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #2d4a6f 100%)' }}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-xl mb-4">{erro}</p>
          <button
            onClick={buscarDados}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const stats = dados?.estatisticas
  const alunosAtivos = dados?.alunos_ativos || []
  const alunosInativos = dados?.alunos_inativos || []
  const atividades = dados?.atividades || []
  const temasComDificuldade = stats?.temas_com_dificuldade || []

  // Alunos precisando de ajuda (taxa < 40% com 5+ questoes)
  const alunosPrecisandoAjuda = alunosAtivos.filter(a => a.questoes_sessao >= 5 && a.taxa_acerto < 40)

  // Alertas recentes (erros)
  const alertas = atividades
    .filter(a => a.tipo === 'resposta' && !a.detalhes.correta)
    .slice(0, 6)

  return (
    <div
      className="w-[1280px] h-[720px] mx-auto overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #1e3a5f 0%, #2d4a6f 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <header className="h-[56px] px-4 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="w-6 h-6 text-green-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />
            </div>
            <h1 className="text-lg font-bold text-white">
              Monitoramento em Tempo Real
            </h1>
          </div>
          {turmaFiltro && (
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm font-medium">
              Turma: {turmaFiltro}
            </span>
          )}
          <span className="text-white/50 text-sm">
            {horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de Turma */}
          <div className="relative">
            <select
              value={turmaFiltro}
              onChange={(e) => setTurmaFiltro(e.target.value)}
              className="appearance-none px-3 py-1.5 pr-8 rounded text-sm bg-white/10 text-white border border-white/20 cursor-pointer hover:bg-white/20 transition"
              style={{ WebkitAppearance: 'none' }}
            >
              <option value="" className="bg-gray-800 text-white">Todas as Turmas</option>
              {dados?.turmas_disponiveis.map(t => (
                <option key={t} value={t} className="bg-gray-800 text-white">{t}</option>
              ))}
            </select>
            <Users className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
          </div>

          {/* Filtro de Componente */}
          <div className="relative">
            <select
              value={componenteFiltro}
              onChange={(e) => setComponenteFiltro(e.target.value as Componente | '')}
              className="appearance-none px-3 py-1.5 pr-8 rounded text-sm bg-white/10 text-white border border-white/20 cursor-pointer hover:bg-white/20 transition"
              style={{ WebkitAppearance: 'none' }}
            >
              <option value="" className="bg-gray-800 text-white">Todos</option>
              <option value="fisica" className="bg-gray-800 text-white">Fisica</option>
              <option value="matematica" className="bg-gray-800 text-white">Matematica</option>
            </select>
            <BookOpen className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition ${autoRefresh ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 text-white/60 border border-white/20'}`}
            title={autoRefresh ? 'Pausar atualizacao' : 'Retomar atualizacao'}
          >
            {autoRefresh ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
            <span className="text-sm">{autoRefresh ? 'AO VIVO' : 'PAUSADO'}</span>
          </button>

          {/* Contador de refresh */}
          {autoRefresh && (
            <div
              className="w-10 h-10 rounded-full border-2 border-green-400 flex items-center justify-center relative"
              style={{
                background: `conic-gradient(#22c55e ${((intervalo - contadorRefresh) / intervalo) * 360}deg, transparent 0deg)`
              }}
            >
              <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center">
                <span className="text-xs text-green-400 font-bold">{intervalo - contadorRefresh}</span>
              </div>
            </div>
          )}

          {/* Refresh Manual */}
          <button
            onClick={buscarDados}
            className="p-2 rounded bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition"
            title="Atualizar agora"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR - 6 Metricas Principais
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="h-[72px] px-4 py-2 grid grid-cols-6 gap-2">
        <StatBox
          label="Participacao"
          value={`${stats?.alunos_ativos_agora || 0}/${stats?.total_alunos_turma || 0}`}
          sublabel={`${stats?.taxa_participacao || 0}%`}
          color="#22c55e"
          icon={<Users className="w-5 h-5" />}
        />
        <StatBox
          label="Questoes Respondidas"
          value={stats?.questoes_periodo_total || 0}
          sublabel={`${stats?.questoes_ultimos_5min || 0} nos ultimos 5min`}
          color="#8b5cf6"
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatBox
          label="Taxa de Acerto"
          value={`${stats?.taxa_acerto_tempo_real || 0}%`}
          color={stats?.taxa_acerto_tempo_real && stats.taxa_acerto_tempo_real >= 60 ? '#22c55e' : '#f59e0b'}
          trend={stats?.tendencia_acerto}
          icon={<Target className="w-5 h-5" />}
        />
        <StatBox
          label="Tempo Medio"
          value={stats?.tempo_medio_segundos ? `${stats.tempo_medio_segundos}s` : '-'}
          color="#06b6d4"
          icon={<Timer className="w-5 h-5" />}
        />
        <StatBox
          label="Usando Tutor IA"
          value={stats?.usando_tutor || 0}
          color="#3b82f6"
          icon={<Brain className="w-5 h-5" />}
        />
        <StatBox
          label="Precisam Ajuda"
          value={stats?.alunos_precisando_ajuda || 0}
          color={stats?.alunos_precisando_ajuda && stats.alunos_precisando_ajuda > 0 ? '#ef4444' : '#22c55e'}
          icon={<HelpCircle className="w-5 h-5" />}
          alert={stats?.alunos_precisando_ajuda ? stats.alunos_precisando_ajuda > 0 : false}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 px-4 pb-3 grid grid-cols-4 gap-3 overflow-hidden">

        {/* COLUNA 1-3: Conteudo Principal */}
        <div className="col-span-3 flex flex-col gap-3 overflow-hidden">

          {/* Status dos Alunos - Grid de Avatares */}
          <div className="bg-white/5 rounded-xl p-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Alunos Ativos
                <span className="text-white/50 font-normal text-sm">({alunosAtivos.length})</span>
              </h2>
              {/* Legenda */}
              <div className="flex items-center gap-3 text-[10px]">
                {Object.entries(atividadeConfig).slice(0, 4).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: cfg.cor }} />
                    <span className="text-white/50">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {alunosAtivos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/50">
                  <UserX className="w-12 h-12 mb-2 opacity-50" />
                  <p>Nenhum aluno ativo no momento</p>
                  <p className="text-sm">Selecione uma turma ou aguarde atividade</p>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-2">
                  {alunosAtivos.map((aluno) => {
                    const config = atividadeConfig[aluno.tipo_atividade] || atividadeConfig.estudo
                    const precisaAjuda = aluno.questoes_sessao >= 5 && aluno.taxa_acerto < 40

                    return (
                      <div
                        key={aluno.id}
                        className={`flex flex-col items-center group cursor-pointer transition-transform hover:scale-105 ${precisaAjuda ? 'animate-pulse' : ''}`}
                        title={`${aluno.nome}\nTurma: ${aluno.turma}\nQuestoes: ${aluno.questoes_sessao}\nAcertos: ${aluno.taxa_acerto}%\nAtividade: ${config.label}`}
                      >
                        <div className="relative">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg"
                            style={{
                              background: getAvatarBg(aluno.componente),
                              boxShadow: precisaAjuda ? '0 0 0 2px #ef4444' : 'none'
                            }}
                          >
                            {getIniciais(aluno.nome)}
                          </div>
                          {/* Status indicator */}
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#1e3a5f] flex items-center justify-center"
                            style={{ background: config.cor }}
                          >
                            {config.icon}
                          </div>
                          {/* Taxa de acerto badge */}
                          <div
                            className="absolute -top-1 -left-1 px-1 rounded text-[8px] font-bold"
                            style={{
                              background: aluno.taxa_acerto >= 70 ? '#22c55e' : aluno.taxa_acerto >= 50 ? '#f59e0b' : '#ef4444',
                              color: 'white'
                            }}
                          >
                            {aluno.taxa_acerto}%
                          </div>
                        </div>
                        <span className="text-white/70 text-[9px] mt-1 truncate w-full text-center leading-tight">
                          {aluno.nome.split(' ')[0]}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Linha inferior: Desempenho + Temas com Dificuldade */}
          <div className="grid grid-cols-2 gap-3 h-[200px]">
            {/* Tabela de Desempenho */}
            <div className="bg-white/5 rounded-xl p-3 overflow-hidden flex flex-col">
              <h2 className="text-white font-semibold flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-yellow-400" />
                Desempenho na Sessao
              </h2>
              <div className="flex-1 overflow-y-auto">
                {alunosAtivos.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-white/30 text-sm">
                    Sem dados de desempenho
                  </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-[#2d4a6f]">
                      <tr className="text-white/50">
                        <th className="text-left pb-2 pl-1">Aluno</th>
                        <th className="text-center pb-2">Atividade</th>
                        <th className="text-center pb-2">Q</th>
                        <th className="text-center pb-2">Acerto</th>
                        <th className="text-right pb-2 pr-1">Tempo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunosAtivos.slice(0, 10).map((aluno) => {
                        const config = atividadeConfig[aluno.tipo_atividade] || atividadeConfig.estudo
                        return (
                          <tr key={aluno.id} className="border-t border-white/5 hover:bg-white/5">
                            <td className="py-1 pl-1">
                              <div className="flex items-center gap-1">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                                  style={{ background: getAvatarBg(aluno.componente) }}
                                >
                                  {getIniciais(aluno.nome)}
                                </div>
                                <span className="text-white truncate max-w-[80px]">
                                  {aluno.nome.split(' ').slice(0, 2).join(' ')}
                                </span>
                              </div>
                            </td>
                            <td className="py-1 text-center">
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium"
                                style={{
                                  background: `${config.cor}20`,
                                  color: config.cor
                                }}
                              >
                                {config.icon}
                                {config.label}
                              </span>
                            </td>
                            <td className="py-1 text-center text-white/70">{aluno.questoes_sessao}</td>
                            <td className="py-1 text-center">
                              <span
                                className="font-medium"
                                style={{
                                  color: aluno.taxa_acerto >= 70 ? '#22c55e' : aluno.taxa_acerto >= 50 ? '#f59e0b' : '#ef4444'
                                }}
                              >
                                {aluno.acertos_sessao}/{aluno.questoes_sessao}
                              </span>
                            </td>
                            <td className="py-1 text-right text-white/50 pr-1">
                              {formatarTempoRelativo(aluno.ultima_atividade)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Temas com Dificuldade */}
            <div className="bg-white/5 rounded-xl p-3 overflow-hidden flex flex-col">
              <h2 className="text-white font-semibold flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Temas com Dificuldade
              </h2>
              <div className="flex-1 overflow-y-auto">
                {temasComDificuldade.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <CheckCircle className="w-10 h-10 text-green-400 mb-2" />
                    <p className="text-green-400 text-sm font-medium">Nenhum tema com dificuldade!</p>
                    <p className="text-white/40 text-xs">Alunos estao indo bem</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {temasComDificuldade.map((tema) => (
                      <div key={tema.tema} className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-sm font-medium truncate flex-1 mr-2">{tema.tema}</span>
                          <span className="text-red-400 text-sm font-bold whitespace-nowrap">{tema.taxa_erro}% erro</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-red-900/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all"
                              style={{ width: `${tema.taxa_erro}%` }}
                            />
                          </div>
                          <span className="text-white/40 text-xs">{tema.quantidade} questoes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA 4: Alertas e Feed */}
        <div className="col-span-1 flex flex-col gap-3 overflow-hidden">

          {/* Alunos Precisando de Ajuda */}
          {alunosPrecisandoAjuda.length > 0 && (
            <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/30">
              <h2 className="text-red-400 font-semibold flex items-center gap-2 mb-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Precisam de Ajuda ({alunosPrecisandoAjuda.length})
              </h2>
              <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
                {alunosPrecisandoAjuda.slice(0, 4).map((aluno) => (
                  <div key={aluno.id} className="flex items-center gap-2 p-1.5 bg-red-500/10 rounded">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ background: getAvatarBg(aluno.componente) }}
                    >
                      {getIniciais(aluno.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{aluno.nome.split(' ')[0]}</p>
                      <p className="text-red-400 text-[10px]">{aluno.taxa_acerto}% em {aluno.questoes_sessao} questoes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown de Atividades */}
          <div className="bg-white/5 rounded-xl p-3">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-2 text-sm">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Atividades Agora
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Estudando" value={alunosAtivos.filter(a => a.tipo_atividade === 'estudo').length} color="#22c55e" />
              <MiniStat label="Desafio" value={stats?.fazendo_desafio || 0} color="#f59e0b" />
              <MiniStat label="Tutor IA" value={stats?.usando_tutor || 0} color="#3b82f6" />
              <MiniStat label="Revisao" value={stats?.fazendo_revisao || 0} color="#a855f7" />
            </div>
          </div>

          {/* Feed de Atividades Recentes */}
          <div className="bg-white/5 rounded-xl p-3 flex-1 overflow-hidden flex flex-col">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-2 text-sm">
              <Activity className="w-4 h-4 text-blue-400" />
              Feed em Tempo Real
            </h2>
            <div className="flex-1 overflow-y-auto space-y-1">
              {atividades.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/30">
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">Aguardando atividades...</p>
                </div>
              ) : (
                atividades.slice(0, 15).map((ativ) => (
                  <div
                    key={ativ.id}
                    className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-white/5 transition"
                  >
                    {ativ.tipo === 'resposta' || ativ.tipo === 'revisao' ? (
                      ativ.detalhes.correta ? (
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                      )
                    ) : ativ.tipo === 'desafio_completo' ? (
                      <Award className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                    ) : ativ.tipo === 'desafio_iniciado' ? (
                      <Zap className="w-3 h-3 text-orange-400 flex-shrink-0" />
                    ) : ativ.tipo === 'tutor' ? (
                      <Brain className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    ) : (
                      <Activity className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-white text-[10px] font-medium">{ativ.usuario_nome.split(' ')[0]}</span>
                      <span className="text-white/50 text-[10px]">
                        {' - '}
                        {ativ.tipo === 'resposta' || ativ.tipo === 'revisao'
                          ? (ativ.detalhes.correta ? 'acertou' : 'errou')
                          : ativ.tipo === 'desafio_completo'
                          ? `completou desafio (${ativ.detalhes.acertos}/${ativ.detalhes.total})`
                          : ativ.tipo === 'desafio_iniciado'
                          ? 'iniciou desafio'
                          : ativ.tipo === 'tutor'
                          ? 'perguntou ao tutor'
                          : 'atividade'
                        }
                      </span>
                    </div>
                    <span className="text-white/30 text-[9px] flex-shrink-0">{formatarTempoRelativo(ativ.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alunos Inativos (colapsado) */}
          {alunosInativos.length > 0 && (
            <div className="bg-white/5 rounded-xl p-2">
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-xs flex items-center gap-1">
                  <UserX className="w-3 h-3" />
                  Inativos: {alunosInativos.length}
                </span>
                <div className="flex -space-x-1">
                  {alunosInativos.slice(0, 5).map((aluno) => (
                    <div
                      key={aluno.id}
                      className="w-5 h-5 rounded-full bg-gray-600 flex items-center justify-center text-white text-[7px] font-bold border border-[#2d4a6f]"
                      title={aluno.nome}
                    >
                      {getIniciais(aluno.nome)}
                    </div>
                  ))}
                  {alunosInativos.length > 5 && (
                    <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-white text-[8px] border border-[#2d4a6f]">
                      +{alunosInativos.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

interface StatBoxProps {
  label: string
  value: string | number
  sublabel?: string
  color: string
  icon: React.ReactNode
  trend?: 'subindo' | 'estavel' | 'descendo'
  alert?: boolean
}

function StatBox({ label, value, sublabel, color, icon, trend, alert }: StatBoxProps) {
  return (
    <div
      className={`rounded-lg p-2 flex flex-col justify-center relative overflow-hidden ${alert ? 'animate-pulse' : ''}`}
      style={{
        background: alert ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
        borderLeft: `3px solid ${color}`
      }}
    >
      <div className="flex items-center gap-2">
        <div style={{ color }} className="flex-shrink-0">{icon}</div>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-xl font-bold text-white truncate">{value}</span>
          {trend === 'subindo' && <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />}
          {trend === 'descendo' && <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />}
        </div>
      </div>
      <span className="text-white/50 text-[10px] truncate">{label}</span>
      {sublabel && <span className="text-white/30 text-[9px] truncate">{sublabel}</span>}
    </div>
  )
}

interface MiniStatProps {
  label: string
  value: number
  color: string
}

function MiniStat({ label, value, color }: MiniStatProps) {
  return (
    <div className="bg-white/5 rounded p-1.5 text-center">
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      <div className="text-white/50 text-[9px]">{label}</div>
    </div>
  )
}
