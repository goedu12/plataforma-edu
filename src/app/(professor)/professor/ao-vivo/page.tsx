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
  Brain,
  PlayCircle,
  PauseCircle,
  Eye,
  Building2,
  ArrowLeft,
  Coffee,
  Wifi,
  WifiOff,
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

interface AlunoOcioso {
  id: string
  nome: string
  turma: string
  componentes: Componente[]
  tempo_ocioso_segundos: number
  ultimo_acesso: string | null
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
  alunos_ociosos: AlunoOcioso[]
  alunos_inativos: AlunoInativo[]
  estatisticas: EstatisticasTempoReal
  turmas_disponiveis: string[]
  colegios_disponiveis: string[]
  periodo_minutos: number
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
  const [colegioFiltro, setColegioFiltro] = useState<string>('')
  const [periodoMinutos] = useState(60)

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [contadorRefresh, setContadorRefresh] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const intervalo = 5

  // Hora atual
  const [horaAtual, setHoraAtual] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Sinalizar ao heartbeat que professor está monitorando
  const sinalizarMonitoramento = useCallback(async () => {
    try {
      await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    } catch { /* silencioso */ }
  }, [])

  const buscarDados = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (turmaFiltro) params.set('turma', turmaFiltro)
      if (componenteFiltro) params.set('componente', componenteFiltro)
      if (colegioFiltro) params.set('colegio', colegioFiltro)
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
      setErro('Erro de conexao')
    } finally {
      setLoading(false)
    }
  }, [turmaFiltro, componenteFiltro, colegioFiltro, periodoMinutos, router])

  useEffect(() => {
    buscarDados()
    sinalizarMonitoramento()
  }, [buscarDados, sinalizarMonitoramento])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        setContadorRefresh(prev => {
          if (prev >= intervalo) {
            buscarDados()
            sinalizarMonitoramento()
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, buscarDados, sinalizarMonitoramento])

  const formatarTempoOcioso = (segundos: number) => {
    if (segundos < 60) return `${segundos}s`
    const min = Math.floor(segundos / 60)
    if (min < 60) return `${min}min`
    return `${Math.floor(min / 60)}h${min % 60}m`
  }

  const formatarTempoRelativo = (timestamp: string) => {
    const diffMs = new Date().getTime() - new Date(timestamp).getTime()
    const diffSeg = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSeg / 60)
    if (diffSeg < 60) return `${diffSeg}s`
    if (diffMin < 60) return `${diffMin}min`
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const atividadeConfig: Record<string, { cor: string; label: string; icon: React.ReactNode }> = {
    estudo: { cor: '#22c55e', label: 'Estudando', icon: <BookOpen className="w-3 h-3" /> },
    desafio: { cor: '#f59e0b', label: 'Desafio', icon: <Zap className="w-3 h-3" /> },
    tutor: { cor: '#3b82f6', label: 'Tutor IA', icon: <Brain className="w-3 h-3" /> },
    revisao: { cor: '#a855f7', label: 'Revisao', icon: <RefreshCw className="w-3 h-3" /> },
    flashcard: { cor: '#a855f7', label: 'Flashcard', icon: <RefreshCw className="w-3 h-3" /> },
    mapa: { cor: '#06b6d4', label: 'Mapa', icon: <Eye className="w-3 h-3" /> },
  }

  const getAvatarBg = (componente: Componente) => componente === 'fisica' ? '#22c55e' : '#8b5cf6'

  const getIniciais = (nome: string) => nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white mb-3">{erro}</p>
          <button onClick={buscarDados} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const stats = dados?.estatisticas
  const alunosAtivos = dados?.alunos_ativos || []
  const alunosOciosos = dados?.alunos_ociosos || []
  const alunosInativos = dados?.alunos_inativos || []
  const atividades = dados?.atividades || []
  const temasComDificuldade = stats?.temas_com_dificuldade || []
  const alunosPrecisandoAjuda = alunosAtivos.filter(a => a.questoes_sessao >= 5 && a.taxa_acerto < 40)

  const totalOnline = alunosAtivos.length + alunosOciosos.length

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>

      {/* HEADER COMPACTO */}
      <header className="px-2 py-1.5 flex items-center justify-between gap-2 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-green-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
          </div>
          <h1 className="text-sm font-bold text-white">Painel Ao Vivo</h1>
          {colegioFiltro && <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-xs">{colegioFiltro}</span>}
          {turmaFiltro && <span className="px-2 py-0.5 bg-green-600 text-white rounded text-xs">{turmaFiltro}</span>}
          {componenteFiltro && <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs capitalize">{componenteFiltro}</span>}
          <span className="text-white/70 text-xs">{horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="flex items-center gap-2">
          {dados?.colegios_disponiveis && dados.colegios_disponiveis.length > 0 && (
            <select
              value={colegioFiltro}
              onChange={(e) => { setColegioFiltro(e.target.value); setTurmaFiltro('') }}
              className="px-2 py-1 rounded text-xs bg-slate-700 text-white border border-slate-600 min-w-[130px]"
            >
              <option value="">Todos Colegios</option>
              {dados.colegios_disponiveis.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select
            value={turmaFiltro}
            onChange={(e) => setTurmaFiltro(e.target.value)}
            className="px-2 py-1 rounded text-xs bg-slate-700 text-white border border-slate-600 min-w-[110px]"
          >
            <option value="">Todas Turmas</option>
            {(dados?.turmas_disponiveis || []).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={componenteFiltro}
            onChange={(e) => setComponenteFiltro(e.target.value as Componente | '')}
            className="px-2 py-1 rounded text-xs bg-slate-700 text-white border border-slate-600"
          >
            <option value="">Todos</option>
            <option value="fisica">Fisica</option>
            <option value="matematica">Matematica</option>
          </select>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1.5 rounded transition ${autoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/60'}`}
          >
            {autoRefresh ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
          </button>

          {autoRefresh && (
            <div className="w-6 h-6 rounded-full border-2 border-green-400 flex items-center justify-center relative"
              style={{ background: `conic-gradient(#22c55e ${((intervalo - contadorRefresh) / intervalo) * 360}deg, transparent 0deg)` }}>
              <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-[8px] text-green-400 font-bold">{intervalo - contadorRefresh}</span>
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/professor/dashboard')}
            className="p-1.5 rounded bg-slate-700 text-white hover:bg-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* STATS BAR COMPACTA */}
      <div className="px-2 py-1 grid grid-cols-3 sm:grid-cols-6 gap-1 flex-shrink-0">
        <MiniStat icon={<Wifi className="w-3.5 h-3.5" />} label="Online" value={totalOnline} color="#22c55e" />
        <MiniStat icon={<Coffee className="w-3.5 h-3.5" />} label="Ociosos" value={alunosOciosos.length} color="#f59e0b" />
        <MiniStat icon={<WifiOff className="w-3.5 h-3.5" />} label="Offline" value={alunosInativos.length} color="#64748b" />
        <MiniStat icon={<BookOpen className="w-3.5 h-3.5" />} label="Questoes" value={stats?.questoes_periodo_total || 0} color="#3b82f6" />
        <MiniStat icon={<CheckCircle className="w-3.5 h-3.5" />} label="Acuracia" value={`${stats?.taxa_acerto_tempo_real || 0}%`} color={stats?.taxa_acerto_tempo_real && stats.taxa_acerto_tempo_real >= 60 ? '#22c55e' : '#f59e0b'} trend={stats?.tendencia_acerto} />
        <MiniStat icon={<Target className="w-3.5 h-3.5" />} label="Participacao" value={`${stats?.taxa_participacao || 0}%`} color="#8b5cf6" />
      </div>

      {/* MAIN CONTENT - Tudo em uma tela */}
      <div className="flex-1 px-2 pb-1.5 grid grid-cols-1 lg:grid-cols-12 gap-1.5 overflow-hidden min-h-0">

        {/* COLUNA ESQUERDA: Alunos (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-1.5 overflow-hidden min-h-0">

          {/* Grid de Alunos - 3 estados - ocupa ~65% */}
          <div className="bg-slate-800/80 rounded-lg p-2 overflow-hidden flex flex-col border border-slate-700 min-h-0" style={{ flex: '1 1 65%' }}>
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Alunos
                <span className="text-slate-400 font-normal text-xs">
                  {alunosAtivos.length} ativos | {alunosOciosos.length} ociosos | {alunosInativos.length} offline
                </span>
              </h2>
              <div className="flex items-center gap-3 text-[9px]">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-slate-400">Ativo</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-slate-400">Ocioso</span></div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-500" /><span className="text-slate-400">Offline</span></div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {alunosAtivos.length === 0 && alunosOciosos.length === 0 && alunosInativos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <UserX className="w-10 h-10 mb-2 opacity-70" />
                  <p className="text-sm">Nenhum aluno encontrado</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 content-start">
                  {/* ATIVOS - verde */}
                  {alunosAtivos.map((aluno) => {
                    const config = atividadeConfig[aluno.tipo_atividade] || atividadeConfig.estudo
                    const precisaAjuda = aluno.questoes_sessao >= 5 && aluno.taxa_acerto < 40
                    return (
                      <div
                        key={`a-${aluno.id}`}
                        className={`flex flex-col items-center transition-transform hover:scale-105 ${precisaAjuda ? 'animate-pulse' : ''}`}
                        title={`${aluno.nome}\nTurma: ${aluno.turma}\nQuestoes: ${aluno.questoes_sessao}\nAcertos: ${aluno.taxa_acerto}%\n${config.label}`}
                      >
                        <div className="relative">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow-md"
                            style={{
                              background: getAvatarBg(aluno.componente),
                              boxShadow: precisaAjuda ? '0 0 0 2px #ef4444' : `0 0 0 2px #22c55e`
                            }}
                          >
                            {getIniciais(aluno.nome)}
                          </div>
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800 flex items-center justify-center"
                            style={{ background: config.cor }}
                          >
                            {config.icon}
                          </div>
                          {aluno.questoes_sessao > 0 && (
                            <div
                              className="absolute -top-1 -left-1 px-0.5 rounded text-[7px] font-bold text-white"
                              style={{ background: aluno.taxa_acerto >= 70 ? '#22c55e' : aluno.taxa_acerto >= 50 ? '#f59e0b' : '#ef4444' }}
                            >
                              {aluno.taxa_acerto}%
                            </div>
                          )}
                        </div>
                        <span className="text-slate-200 text-[8px] mt-0.5 truncate max-w-[46px] text-center">{aluno.nome.split(' ')[0]}</span>
                      </div>
                    )
                  })}

                  {/* OCIOSOS - amarelo */}
                  {alunosOciosos.map((aluno) => (
                    <div
                      key={`o-${aluno.id}`}
                      className="flex flex-col items-center"
                      title={`${aluno.nome}\nTurma: ${aluno.turma}\nOcioso ha ${formatarTempoOcioso(aluno.tempo_ocioso_segundos)}\nTela aberta sem atividade`}
                    >
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-yellow-200 font-bold text-[10px]"
                          style={{ background: '#78350f', boxShadow: '0 0 0 2px #f59e0b' }}>
                          {getIniciais(aluno.nome)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800 bg-yellow-500 flex items-center justify-center">
                          <Coffee className="w-2 h-2 text-yellow-900" />
                        </div>
                        <div className="absolute -top-1 -left-1 px-0.5 rounded text-[7px] font-bold text-yellow-900 bg-yellow-400">
                          {formatarTempoOcioso(aluno.tempo_ocioso_segundos)}
                        </div>
                      </div>
                      <span className="text-yellow-400 text-[8px] mt-0.5 truncate max-w-[46px] text-center">{aluno.nome.split(' ')[0]}</span>
                    </div>
                  ))}

                  {/* INATIVOS/OFFLINE - cinza */}
                  {alunosInativos.slice(0, 30).map((aluno) => (
                    <div
                      key={`i-${aluno.id}`}
                      className="flex flex-col items-center opacity-40"
                      title={`${aluno.nome}\nTurma: ${aluno.turma}\nOffline`}
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                        {getIniciais(aluno.nome)}
                      </div>
                      <span className="text-slate-500 text-[8px] mt-0.5 truncate max-w-[46px] text-center">{aluno.nome.split(' ')[0]}</span>
                    </div>
                  ))}
                  {alunosInativos.length > 30 && (
                    <div className="flex flex-col items-center opacity-40">
                      <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 font-bold text-[10px]">
                        +{alunosInativos.length - 30}
                      </div>
                      <span className="text-slate-500 text-[8px] mt-0.5">mais</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Linha inferior: Dificuldades + Desempenho - ocupa ~35% */}
          <div className="grid grid-cols-2 gap-1.5 overflow-hidden min-h-0" style={{ flex: '0 1 35%' }}>
            {/* Temas com Dificuldade */}
            <div className="bg-slate-800/80 rounded-lg p-2.5 overflow-hidden flex flex-col border border-slate-700">
              <h2 className="text-white font-semibold text-xs flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                Dificuldades
              </h2>
              <div className="flex-1 overflow-y-auto">
                {temasComDificuldade.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                    <span className="text-green-400 text-xs">Sem dificuldades</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {temasComDificuldade.map((tema) => (
                      <div key={tema.tema} className="bg-red-900/30 rounded p-1.5 border border-red-500/30">
                        <div className="flex items-center justify-between">
                          <span className="text-white text-[10px] truncate flex-1 mr-1">{tema.tema}</span>
                          <span className="text-red-300 text-[10px] font-bold">{tema.taxa_erro}%</span>
                        </div>
                        <div className="h-1 bg-red-900/50 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${tema.taxa_erro}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tabela de Desempenho */}
            <div className="bg-slate-800/80 rounded-lg p-2.5 overflow-hidden flex flex-col border border-slate-700">
              <h2 className="text-white font-semibold text-xs flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                Desempenho
              </h2>
              <div className="flex-1 overflow-y-auto">
                {alunosAtivos.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs">Sem dados</div>
                ) : (
                  <table className="w-full text-[10px]">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr className="text-slate-400">
                        <th className="text-left pb-1 pl-1">Aluno</th>
                        <th className="text-center pb-1">Ativ.</th>
                        <th className="text-center pb-1">Q</th>
                        <th className="text-center pb-1">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunosAtivos.slice(0, 8).map((aluno) => {
                        const config = atividadeConfig[aluno.tipo_atividade] || atividadeConfig.estudo
                        return (
                          <tr key={aluno.id} className="border-t border-slate-700/50">
                            <td className="py-1 pl-1">
                              <span className="text-slate-200 truncate max-w-[80px] inline-block">{aluno.nome.split(' ').slice(0, 2).join(' ')}</span>
                            </td>
                            <td className="py-1 text-center">
                              <span className="px-1 py-0.5 rounded text-[8px] font-semibold" style={{ background: `${config.cor}30`, color: config.cor }}>
                                {config.label}
                              </span>
                            </td>
                            <td className="py-1 text-center text-slate-300">{aluno.questoes_sessao}</td>
                            <td className="py-1 text-center font-medium" style={{ color: aluno.taxa_acerto >= 70 ? '#22c55e' : aluno.taxa_acerto >= 50 ? '#f59e0b' : '#ef4444' }}>
                              {aluno.taxa_acerto}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Alertas + Feed (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-1.5 overflow-hidden min-h-0">

          {/* Alertas: Ociosos + Dificuldade */}
          <div className="bg-slate-800/80 rounded-lg p-2 overflow-hidden flex flex-col border border-slate-700 min-h-0" style={{ flex: '0 1 40%' }}>
            <h2 className="text-white font-semibold text-xs flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
              Alertas
              {(alunosOciosos.length + alunosPrecisandoAjuda.length) > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-[9px] font-bold">
                  {alunosOciosos.length + alunosPrecisandoAjuda.length}
                </span>
              )}
            </h2>

            <div className="overflow-y-auto space-y-1" style={{ maxHeight: 'calc(100% - 28px)' }}>
              {/* Ociosos */}
              {alunosOciosos.slice(0, 5).map((aluno) => (
                <div key={`ao-${aluno.id}`} className="flex items-center gap-2 p-1.5 bg-yellow-900/30 rounded border border-yellow-500/30">
                  <Coffee className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[10px] font-medium truncate">{aluno.nome.split(' ')[0]}</p>
                    <p className="text-yellow-400 text-[9px]">Parado ha {formatarTempoOcioso(aluno.tempo_ocioso_segundos)}</p>
                  </div>
                  <span className="text-yellow-500 text-[9px] font-bold flex-shrink-0">{aluno.turma}</span>
                </div>
              ))}

              {/* Precisando ajuda */}
              {alunosPrecisandoAjuda.slice(0, 5).map((aluno) => (
                <div key={`ah-${aluno.id}`} className="flex items-center gap-2 p-1.5 bg-red-900/30 rounded border border-red-500/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[10px] font-medium truncate">{aluno.nome.split(' ')[0]}</p>
                    <p className="text-red-400 text-[9px]">{aluno.taxa_acerto}% em {aluno.questoes_sessao} questoes</p>
                  </div>
                </div>
              ))}

              {alunosOciosos.length === 0 && alunosPrecisandoAjuda.length === 0 && (
                <div className="flex items-center justify-center py-3 text-green-400">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="text-xs">Sem alertas</span>
                </div>
              )}
            </div>
          </div>

          {/* Feed de Atividades */}
          <div className="bg-slate-800/80 rounded-lg p-2 flex-1 overflow-hidden flex flex-col border border-slate-700 min-h-0">
            <h2 className="text-white font-semibold text-xs flex items-center gap-1.5 mb-2 flex-shrink-0">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              Atividades Recentes
            </h2>
            <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
              {atividades.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Clock className="w-6 h-6 mb-1 opacity-70" />
                  <p className="text-[10px]">Aguardando...</p>
                </div>
              ) : (
                atividades.slice(0, 25).map((ativ) => (
                  <div key={ativ.id} className="flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-slate-700/50">
                    {ativ.tipo === 'resposta' || ativ.tipo === 'revisao' ? (
                      ativ.detalhes.correta
                        ? <CheckCircle className="w-2.5 h-2.5 text-green-400 flex-shrink-0" />
                        : <XCircle className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />
                    ) : ativ.tipo === 'desafio_completo' ? (
                      <Award className="w-2.5 h-2.5 text-yellow-400 flex-shrink-0" />
                    ) : ativ.tipo === 'desafio_iniciado' ? (
                      <Zap className="w-2.5 h-2.5 text-orange-400 flex-shrink-0" />
                    ) : ativ.tipo === 'tutor' ? (
                      <Brain className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                    ) : (
                      <Activity className="w-2.5 h-2.5 text-purple-400 flex-shrink-0" />
                    )}
                    <span className="text-slate-200 text-[9px] font-medium">{ativ.usuario_nome.split(' ')[0]}</span>
                    <span className="text-slate-400 text-[9px] truncate flex-1">
                      {ativ.tipo === 'resposta' || ativ.tipo === 'revisao'
                        ? (ativ.detalhes.correta ? 'acertou' : 'errou')
                        : ativ.tipo === 'desafio_completo' ? 'completou desafio'
                        : ativ.tipo === 'desafio_iniciado' ? 'iniciou desafio'
                        : ativ.tipo === 'tutor' ? 'tutor IA'
                        : 'atividade'
                      }
                    </span>
                    <span className="text-slate-500 text-[8px] flex-shrink-0">{formatarTempoRelativo(ativ.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE: Mini Stat
// ═══════════════════════════════════════════════════════════════════════════

function MiniStat({ icon, label, value, color, trend }: {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
  trend?: 'subindo' | 'estavel' | 'descendo'
}) {
  return (
    <div className="rounded-md p-1 flex items-center gap-1.5 border border-slate-700" style={{ background: 'rgba(30,41,59,0.9)', borderLeft: `3px solid ${color}` }}>
      <div style={{ color }} className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-0.5">
          <span className="text-sm font-bold text-white">{value}</span>
          {trend === 'subindo' && <TrendingUp className="w-3 h-3 text-green-400" />}
          {trend === 'descendo' && <TrendingDown className="w-3 h-3 text-red-400" />}
        </div>
        <span className="text-slate-400 text-[9px] leading-none">{label}</span>
      </div>
    </div>
  )
}
