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
  Eye,
  Building2,
  ArrowLeft,
  Wifi,
  WifiOff,
  Moon,
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

interface PresencaAluno {
  usuario_id: string
  estado: 'ativo' | 'ocioso' | 'offline'
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
  presenca: PresencaAluno[]
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
  const [intervalo] = useState(5)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Hora
  const [horaAtual, setHoraAtual] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Heartbeat do professor (registrar que está monitorando)
  useEffect(() => {
    const ping = () => fetch('/api/heartbeat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {})
    ping()
    const hbInterval = setInterval(ping, 10000)
    return () => clearInterval(hbInterval)
  }, [])

  // Buscar dados
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
      setErro('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [turmaFiltro, componenteFiltro, colegioFiltro, periodoMinutos, router])

  useEffect(() => { buscarDados() }, [buscarDados])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        setContadorRefresh(prev => {
          if (prev >= intervalo) { buscarDados(); return 0 }
          return prev + 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, intervalo, buscarDados])

  // Helpers
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
    revisao: { cor: '#a855f7', label: 'Revisão', icon: <Layers className="w-3 h-3" /> },
    flashcard: { cor: '#a855f7', label: 'Flashcard', icon: <Layers className="w-3 h-3" /> },
    mapa: { cor: '#06b6d4', label: 'Mapa', icon: <Eye className="w-3 h-3" /> },
  }

  const getAvatarBg = (componente: Componente) => componente === 'fisica' ? '#22c55e' : '#8b5cf6'
  const getIniciais = (nome: string) => nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-white text-lg font-medium">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white text-lg mb-3 font-medium">{erro}</p>
          <button onClick={buscarDados} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
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
  const presencaMap = new Map((dados?.presenca || []).map(p => [p.usuario_id, p.estado]))

  // Classificar alunos online por estado de presença
  const alunosOnline = alunosAtivos.filter(a => presencaMap.get(a.id) === 'ativo')
  const alunosOciosos = alunosAtivos.filter(a => presencaMap.get(a.id) === 'ocioso')
  // Alunos com heartbeat ativo mas sem atividade no período
  const conectadosSemAtividade = alunosInativos.filter(a => {
    const estado = presencaMap.get(a.id)
    return estado === 'ativo' || estado === 'ocioso'
  })

  const totalOnline = alunosAtivos.filter(a => presencaMap.get(a.id) !== 'offline').length + conectadosSemAtividade.length
  const totalOciosos = alunosOciosos.length + conectadosSemAtividade.filter(a => presencaMap.get(a.id) === 'ocioso').length

  const alunosPrecisandoAjuda = alunosAtivos.filter(a => a.questoes_sessao >= 5 && a.taxa_acerto < 40)
  const turmasVisiveis = dados?.turmas_disponiveis || []

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* HEADER COMPACTO */}
      <header className="px-3 py-2 flex items-center justify-between gap-2 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Radio className="w-5 h-5 text-green-400" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
            </div>
            <h1 className="text-sm font-bold text-white">Ao Vivo</h1>
          </div>

          {colegioFiltro && <span className="px-1.5 py-0.5 bg-purple-600/80 text-white rounded text-[10px] font-medium">{colegioFiltro}</span>}
          {turmaFiltro && <span className="px-1.5 py-0.5 bg-green-600/80 text-white rounded text-[10px] font-medium">{turmaFiltro}</span>}
          {componenteFiltro && <span className="px-1.5 py-0.5 bg-blue-600/80 text-white rounded text-[10px] font-medium capitalize">{componenteFiltro}</span>}

          <span className="text-white/70 text-xs">{horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {dados?.colegios_disponiveis && dados.colegios_disponiveis.length > 0 && (
            <select
              value={colegioFiltro}
              onChange={(e) => { setColegioFiltro(e.target.value); setTurmaFiltro('') }}
              className="px-2 py-1 rounded text-[11px] bg-slate-700 text-white border border-slate-600 min-w-[120px]"
            >
              <option value="">Todos Colégios</option>
              {dados.colegios_disponiveis.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select
            value={turmaFiltro}
            onChange={(e) => setTurmaFiltro(e.target.value)}
            className="px-2 py-1 rounded text-[11px] bg-slate-700 text-white border border-slate-600 min-w-[100px]"
          >
            <option value="">Todas Turmas</option>
            {turmasVisiveis.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={componenteFiltro}
            onChange={(e) => setComponenteFiltro(e.target.value as Componente | '')}
            className="px-2 py-1 rounded text-[11px] bg-slate-700 text-white border border-slate-600"
          >
            <option value="">Todos</option>
            <option value="fisica">Física</option>
            <option value="matematica">Matemática</option>
          </select>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-1 rounded transition ${autoRefresh ? 'text-green-400' : 'text-white/40'}`}
            title={autoRefresh ? 'Pausar' : 'Retomar'}
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
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-700 text-white border border-slate-600 hover:bg-slate-600 transition text-[11px]"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="hidden sm:inline">Voltar</span>
          </button>
        </div>
      </header>

      {/* STATS BAR - 5 métricas compactas */}
      <div className="px-3 py-1.5 grid grid-cols-5 gap-2 flex-shrink-0">
        <MiniStat label="Online" value={`${totalOnline}/${stats?.total_alunos_turma || 0}`} color="#22c55e" icon={<Wifi className="w-4 h-4" />} />
        <MiniStat label="Ociosos" value={totalOciosos} color="#f59e0b" icon={<Moon className="w-4 h-4" />} />
        <MiniStat label="Questões" value={stats?.questoes_periodo_total || 0} color="#3b82f6" icon={<BookOpen className="w-4 h-4" />} />
        <MiniStat label="Acurácia" value={`${stats?.taxa_acerto_tempo_real || 0}%`} color={stats?.taxa_acerto_tempo_real && stats.taxa_acerto_tempo_real >= 60 ? '#22c55e' : '#f59e0b'} icon={<Target className="w-4 h-4" />} trend={stats?.tendencia_acerto} />
        <MiniStat label="Alertas" value={alunosPrecisandoAjuda.length} color={alunosPrecisandoAjuda.length > 0 ? '#ef4444' : '#22c55e'} icon={<AlertTriangle className="w-4 h-4" />} />
      </div>

      {/* MAIN: 3 colunas */}
      <div className="flex-1 px-3 pb-2 grid grid-cols-12 gap-2 overflow-hidden min-h-0">

        {/* COL 1: Alunos (presença visual) - 5 colunas */}
        <div className="col-span-5 bg-slate-800/80 rounded-lg p-2 flex flex-col overflow-hidden border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-white font-semibold text-xs flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              Alunos
            </h2>
            <div className="flex items-center gap-2 text-[9px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Ativo</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Ocioso</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> Offline</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {alunosAtivos.length === 0 && alunosInativos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <UserX className="w-8 h-8 mb-1 opacity-70" />
                <p className="text-xs">Nenhum aluno encontrado</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {/* Ativos com heartbeat */}
                {alunosOnline.map(aluno => {
                  const config = atividadeConfig[aluno.tipo_atividade] || atividadeConfig.estudo
                  const precisaAjuda = aluno.questoes_sessao >= 5 && aluno.taxa_acerto < 40
                  return (
                    <AlunoAvatar
                      key={aluno.id}
                      nome={aluno.nome}
                      iniciais={getIniciais(aluno.nome)}
                      bgColor={getAvatarBg(aluno.componente)}
                      statusColor="#22c55e"
                      statusIcon={config.icon}
                      statusBgColor={config.cor}
                      taxa={aluno.questoes_sessao > 0 ? aluno.taxa_acerto : undefined}
                      precisaAjuda={precisaAjuda}
                      tooltip={`${aluno.nome} - ${config.label}\nQuestões: ${aluno.questoes_sessao} | Acertos: ${aluno.taxa_acerto}%`}
                    />
                  )
                })}

                {/* Ociosos (com heartbeat, sem interação recente) */}
                {alunosOciosos.map(aluno => {
                  const config = atividadeConfig[aluno.tipo_atividade] || atividadeConfig.estudo
                  return (
                    <AlunoAvatar
                      key={aluno.id}
                      nome={aluno.nome}
                      iniciais={getIniciais(aluno.nome)}
                      bgColor={getAvatarBg(aluno.componente)}
                      statusColor="#f59e0b"
                      statusIcon={<Moon className="w-3 h-3" />}
                      statusBgColor="#f59e0b"
                      taxa={aluno.questoes_sessao > 0 ? aluno.taxa_acerto : undefined}
                      tooltip={`${aluno.nome} - OCIOSO\nÚltima atividade: ${config.label}`}
                      dimmed
                    />
                  )
                })}

                {/* Conectados sem atividade no período */}
                {conectadosSemAtividade.map(aluno => {
                  const estado = presencaMap.get(aluno.id)
                  return (
                    <AlunoAvatar
                      key={aluno.id}
                      nome={aluno.nome}
                      iniciais={getIniciais(aluno.nome)}
                      bgColor="#475569"
                      statusColor={estado === 'ocioso' ? '#f59e0b' : '#22c55e'}
                      statusIcon={estado === 'ocioso' ? <Moon className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                      statusBgColor={estado === 'ocioso' ? '#f59e0b' : '#22c55e'}
                      tooltip={`${aluno.nome} - Conectado, sem atividade`}
                      dimmed
                    />
                  )
                })}

                {/* Offline (sem heartbeat) */}
                {alunosInativos.filter(a => !presencaMap.get(a.id) || presencaMap.get(a.id) === 'offline').slice(0, 30).map(aluno => (
                  <AlunoAvatar
                    key={aluno.id}
                    nome={aluno.nome}
                    iniciais={getIniciais(aluno.nome)}
                    bgColor="#334155"
                    statusColor="#64748b"
                    statusIcon={<WifiOff className="w-3 h-3" />}
                    statusBgColor="#475569"
                    tooltip={`${aluno.nome} - Offline`}
                    dimmed
                    grayscale
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COL 2: Desempenho + Temas (4 colunas) */}
        <div className="col-span-4 flex flex-col gap-2 overflow-hidden">
          {/* Tabela de Desempenho */}
          <div className="bg-slate-800/80 rounded-lg p-2 flex-1 flex flex-col overflow-hidden border border-slate-700">
            <h2 className="text-white font-semibold text-xs flex items-center gap-1.5 mb-1.5">
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
                      <th className="text-center pb-1">Status</th>
                      <th className="text-center pb-1">Q</th>
                      <th className="text-center pb-1">Acertos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunosAtivos.slice(0, 15).map(aluno => {
                      const config = atividadeConfig[aluno.tipo_atividade] || atividadeConfig.estudo
                      const estado = presencaMap.get(aluno.id)
                      return (
                        <tr key={aluno.id} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                          <td className="py-1 pl-1">
                            <div className="flex items-center gap-1.5">
                              <div className="relative">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[7px] font-bold" style={{ background: getAvatarBg(aluno.componente) }}>
                                  {getIniciais(aluno.nome)}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-800"
                                  style={{ background: estado === 'ativo' ? '#22c55e' : estado === 'ocioso' ? '#f59e0b' : '#64748b' }} />
                              </div>
                              <span className="text-slate-100 truncate max-w-[80px]">{aluno.nome.split(' ').slice(0, 2).join(' ')}</span>
                            </div>
                          </td>
                          <td className="py-1 text-center">
                            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-semibold"
                              style={{ background: `${config.cor}25`, color: config.cor }}>
                              {config.label}
                            </span>
                          </td>
                          <td className="py-1 text-center text-slate-300">{aluno.questoes_sessao}</td>
                          <td className="py-1 text-center">
                            <span className="font-medium" style={{ color: aluno.taxa_acerto >= 70 ? '#22c55e' : aluno.taxa_acerto >= 50 ? '#f59e0b' : '#ef4444' }}>
                              {aluno.acertos_sessao}/{aluno.questoes_sessao}
                            </span>
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
          <div className="bg-slate-800/80 rounded-lg p-2 flex-shrink-0 max-h-[30%] overflow-hidden flex flex-col border border-slate-700">
            <h2 className="text-white font-semibold text-xs flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              Temas Difíceis
            </h2>
            <div className="flex-1 overflow-y-auto">
              {temasComDificuldade.length === 0 ? (
                <div className="flex items-center gap-2 text-green-400 text-xs py-1">
                  <CheckCircle className="w-4 h-4" /> Sem dificuldades
                </div>
              ) : (
                <div className="space-y-1">
                  {temasComDificuldade.slice(0, 4).map(tema => (
                    <div key={tema.tema} className="bg-red-900/30 rounded p-1.5 border border-red-500/30">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white truncate flex-1 mr-2">{tema.tema}</span>
                        <span className="text-red-300 font-bold">{tema.taxa_erro}%</span>
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
        </div>

        {/* COL 3: Alertas + Feed (3 colunas) */}
        <div className="col-span-3 flex flex-col gap-2 overflow-hidden">
          {/* Alertas */}
          <div className="bg-slate-800/80 rounded-lg p-2 flex-shrink-0 border border-slate-700">
            <h2 className="text-white font-semibold text-xs flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
              Alertas
            </h2>
            {alunosPrecisandoAjuda.length === 0 ? (
              <div className="flex items-center gap-2 text-green-400 text-xs py-2">
                <CheckCircle className="w-4 h-4" /> Sem alertas
              </div>
            ) : (
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                {alunosPrecisandoAjuda.slice(0, 4).map(aluno => (
                  <div key={aluno.id} className="flex items-center gap-1.5 p-1.5 bg-red-900/30 rounded border border-red-500/30">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[7px] font-bold"
                      style={{ background: getAvatarBg(aluno.componente) }}>
                      {getIniciais(aluno.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[10px] font-medium truncate">{aluno.nome.split(' ')[0]}</p>
                      <p className="text-red-300 text-[9px]">{aluno.taxa_acerto}% em {aluno.questoes_sessao}q</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feed de Atividades */}
          <div className="bg-slate-800/80 rounded-lg p-2 flex-1 flex flex-col overflow-hidden border border-slate-700">
            <h2 className="text-white font-semibold text-xs flex items-center gap-1.5 mb-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              Atividades
            </h2>
            <div className="flex-1 overflow-y-auto space-y-0.5">
              {atividades.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Clock className="w-6 h-6 mb-1 opacity-70" />
                  <p className="text-[10px]">Aguardando...</p>
                </div>
              ) : (
                atividades.slice(0, 25).map(ativ => (
                  <div key={ativ.id} className="flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-slate-700/30 transition">
                    {ativ.tipo === 'resposta' || ativ.tipo === 'revisao' ? (
                      ativ.detalhes.correta ? <CheckCircle className="w-2.5 h-2.5 text-green-400 flex-shrink-0" /> : <XCircle className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />
                    ) : ativ.tipo === 'desafio_completo' ? (
                      <Award className="w-2.5 h-2.5 text-yellow-400 flex-shrink-0" />
                    ) : ativ.tipo === 'desafio_iniciado' ? (
                      <Zap className="w-2.5 h-2.5 text-orange-400 flex-shrink-0" />
                    ) : ativ.tipo === 'tutor' ? (
                      <Brain className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                    ) : (
                      <Activity className="w-2.5 h-2.5 text-purple-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-100 text-[9px] font-medium">{ativ.usuario_nome.split(' ')[0]}</span>
                      <span className="text-slate-400 text-[9px]">
                        {' - '}
                        {ativ.tipo === 'resposta' || ativ.tipo === 'revisao'
                          ? (ativ.detalhes.correta ? 'acertou' : 'errou')
                          : ativ.tipo === 'desafio_completo' ? 'desafio'
                          : ativ.tipo === 'desafio_iniciado' ? 'iniciou'
                          : ativ.tipo === 'tutor' ? 'tutor'
                          : 'atividade'}
                      </span>
                    </div>
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
// COMPONENTES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

function MiniStat({ label, value, color, icon, trend }: {
  label: string
  value: string | number
  color: string
  icon: React.ReactNode
  trend?: 'subindo' | 'estavel' | 'descendo'
}) {
  return (
    <div className="rounded-lg px-2 py-1.5 flex items-center gap-2 border border-slate-700"
      style={{ background: 'rgba(30,41,59,0.9)', borderLeft: `3px solid ${color}` }}>
      <div style={{ color }} className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-base font-bold text-white">{value}</span>
          {trend === 'subindo' && <TrendingUp className="w-3 h-3 text-green-400" />}
          {trend === 'descendo' && <TrendingDown className="w-3 h-3 text-red-400" />}
        </div>
        <span className="text-slate-400 text-[9px]">{label}</span>
      </div>
    </div>
  )
}

function AlunoAvatar({ nome, iniciais, bgColor, statusColor, statusIcon, statusBgColor, taxa, precisaAjuda, tooltip, dimmed, grayscale }: {
  nome: string
  iniciais: string
  bgColor: string
  statusColor: string
  statusIcon: React.ReactNode
  statusBgColor: string
  taxa?: number
  precisaAjuda?: boolean
  tooltip?: string
  dimmed?: boolean
  grayscale?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center cursor-pointer transition-transform hover:scale-105 ${precisaAjuda ? 'animate-pulse' : ''} ${dimmed ? 'opacity-50' : ''}`}
      title={tooltip}
    >
      <div className="relative">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[10px] shadow ${grayscale ? 'grayscale' : ''}`}
          style={{
            background: bgColor,
            boxShadow: precisaAjuda ? '0 0 0 2px #ef4444' : `0 0 0 2px ${statusColor}`,
          }}
        >
          {iniciais}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[1.5px] border-slate-800 flex items-center justify-center"
          style={{ background: statusBgColor }}>
          {statusIcon}
        </div>
        {taxa !== undefined && (
          <div className="absolute -top-1 -left-1 px-0.5 rounded text-[7px] font-bold"
            style={{ background: taxa >= 70 ? '#22c55e' : taxa >= 50 ? '#f59e0b' : '#ef4444', color: 'white' }}>
            {taxa}%
          </div>
        )}
      </div>
      <span className="text-slate-300 text-[8px] mt-0.5 truncate max-w-[45px] text-center">{nome.split(' ')[0]}</span>
    </div>
  )
}
