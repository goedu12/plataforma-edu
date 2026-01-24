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
  Filter,
  Atom,
  Calculator,
  Radio,
  Eye,
  Award,
  UserX,
  Percent,
  Timer,
  AlertTriangle,
  ChevronDown,
  Layers,
  Brain,
  PlayCircle,
  PauseCircle,
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
  const [showFiltros, setShowFiltros] = useState(false)
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

  // Cor do status do aluno
  const getStatusColor = (tipo: string) => {
    switch (tipo) {
      case 'estudo': return '#22c55e'
      case 'desafio': return '#f59e0b'
      case 'tutor': return '#3b82f6'
      case 'revisao':
      case 'flashcard': return '#a855f7'
      default: return '#6b7280'
    }
  }

  // Cor de fundo do avatar baseada no componente
  const getAvatarBg = (componente: Componente) => {
    return componente === 'fisica' ? '#22c55e' : '#8b5cf6'
  }

  if (loading) {
    return (
      <div className="w-[1280px] h-[720px] mx-auto flex items-center justify-center" style={{ background: '#1e3a5f' }}>
        <div className="text-white text-xl">Carregando dashboard...</div>
      </div>
    )
  }

  const stats = dados?.estatisticas
  const alunosAtivos = dados?.alunos_ativos || []
  const alunosInativos = dados?.alunos_inativos || []
  const atividades = dados?.atividades || []
  const temasComDificuldade = stats?.temas_com_dificuldade || []

  // Alunos com problemas (erros seguidos)
  const alertas = atividades
    .filter(a => a.tipo === 'resposta' && !a.detalhes.correta)
    .slice(0, 5)

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
      <header className="h-[60px] px-4 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-400 animate-pulse" />
            Painel da Turma
            {turmaFiltro && <span className="text-green-400">- {turmaFiltro}</span>}
          </h1>
          <span className="text-white/60 text-sm">
            {componenteFiltro === 'fisica' ? 'Física' : componenteFiltro === 'matematica' ? 'Matemática' : 'Todos os Componentes'}
            {' | '}
            {horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de Turma */}
          <select
            value={turmaFiltro}
            onChange={(e) => setTurmaFiltro(e.target.value)}
            className="px-3 py-1.5 rounded text-sm bg-white/10 text-white border border-white/20"
          >
            <option value="">Todas as Turmas</option>
            {dados?.turmas_disponiveis.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Filtro de Componente */}
          <select
            value={componenteFiltro}
            onChange={(e) => setComponenteFiltro(e.target.value as Componente | '')}
            className="px-3 py-1.5 rounded text-sm bg-white/10 text-white border border-white/20"
          >
            <option value="">Todos</option>
            <option value="fisica">Física</option>
            <option value="matematica">Matemática</option>
          </select>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded ${autoRefresh ? 'bg-green-500/30 text-green-400' : 'bg-white/10 text-white/60'}`}
          >
            {autoRefresh ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
          </button>

          {/* Contador de refresh */}
          {autoRefresh && (
            <div className="w-8 h-8 rounded-full border-2 border-green-400 flex items-center justify-center">
              <span className="text-xs text-green-400 font-bold">{intervalo - contadorRefresh}</span>
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="h-[80px] px-4 py-2 grid grid-cols-7 gap-2">
        <StatBox
          label="Online Agora"
          value={`${stats?.alunos_ativos_agora || 0}/${stats?.total_alunos_turma || 0}`}
          color="#22c55e"
          icon={<Users className="w-5 h-5" />}
        />
        <StatBox
          label="Ativos Agora"
          value={stats?.alunos_ativos_agora || 0}
          color="#22c55e"
          trend="up"
          icon={<Activity className="w-5 h-5" />}
        />
        <StatBox
          label="Ociosos"
          value={stats?.alunos_inativos || 0}
          color={stats?.alunos_inativos && stats.alunos_inativos > 0 ? '#ef4444' : '#22c55e'}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatBox
          label="Progresso Médio"
          value={`${stats?.taxa_participacao || 0}%`}
          color="#3b82f6"
          icon={<Target className="w-5 h-5" />}
        />
        <StatBox
          label="Questões Respondidas"
          value={stats?.questoes_periodo_total || 0}
          color="#8b5cf6"
          trend="up"
          icon={<BookOpen className="w-5 h-5" />}
        />
        <StatBox
          label="Acurácia da Turma"
          value={`${stats?.taxa_acerto_tempo_real || 0}%`}
          color={stats?.taxa_acerto_tempo_real && stats.taxa_acerto_tempo_real >= 60 ? '#22c55e' : '#f59e0b'}
          trend={stats?.tendencia_acerto === 'subindo' ? 'up' : stats?.tendencia_acerto === 'descendo' ? 'down' : undefined}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatBox
          label="Tempo Médio"
          value={stats?.tempo_medio_segundos ? `${stats.tempo_medio_segundos}s` : '-'}
          color="#06b6d4"
          icon={<Timer className="w-5 h-5" />}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 px-4 pb-4 grid grid-cols-4 gap-3 overflow-hidden">

        {/* COLUNA 1-3: Conteúdo Principal */}
        <div className="col-span-3 flex flex-col gap-3 overflow-hidden">

          {/* Status dos Alunos - Grid de Avatares */}
          <div className="bg-white/5 rounded-xl p-3 flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                Status dos Alunos
              </h2>
              <span className="text-white/50 text-xs">
                {alunosAtivos.length} ativos | {alunosInativos.length} inativos
              </span>
            </div>

            <div className="grid grid-cols-10 gap-2 overflow-y-auto max-h-[180px]">
              {alunosAtivos.map((aluno) => (
                <div
                  key={aluno.id}
                  className="flex flex-col items-center group cursor-pointer"
                  title={`${aluno.nome}\n${aluno.turma} | ${aluno.questoes_sessao}q | ${aluno.taxa_acerto}%`}
                >
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: getAvatarBg(aluno.componente) }}
                    >
                      {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    {/* Status indicator */}
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#1e3a5f] flex items-center justify-center"
                      style={{ background: getStatusColor(aluno.tipo_atividade) }}
                    >
                      {aluno.tipo_atividade === 'estudo' && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                      {aluno.tipo_atividade === 'desafio' && <Zap className="w-2.5 h-2.5 text-white" />}
                      {aluno.tipo_atividade === 'tutor' && <MessageCircle className="w-2.5 h-2.5 text-white" />}
                      {(aluno.tipo_atividade === 'revisao' || aluno.tipo_atividade === 'flashcard') && <Layers className="w-2.5 h-2.5 text-white" />}
                    </div>
                    {/* Taxa de acerto badge */}
                    <div
                      className="absolute -top-1 -right-1 px-1 rounded text-[9px] font-bold"
                      style={{
                        background: aluno.taxa_acerto >= 70 ? '#22c55e' : aluno.taxa_acerto >= 50 ? '#f59e0b' : '#ef4444',
                        color: 'white'
                      }}
                    >
                      {aluno.taxa_acerto}%
                    </div>
                  </div>
                  <span className="text-white/70 text-[10px] mt-1 truncate w-full text-center">
                    {aluno.nome.split(' ')[0]}
                  </span>
                </div>
              ))}

              {/* Alunos inativos */}
              {alunosInativos.slice(0, 10).map((aluno) => (
                <div
                  key={aluno.id}
                  className="flex flex-col items-center opacity-40"
                  title={`${aluno.nome} - INATIVO`}
                >
                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gray-600"
                    >
                      {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#1e3a5f] bg-gray-500 flex items-center justify-center">
                      <UserX className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <span className="text-white/40 text-[10px] mt-1 truncate w-full text-center">
                    {aluno.nome.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Linha inferior: Questões com Dificuldade + Feed de Atividades */}
          <div className="grid grid-cols-2 gap-3 h-[220px]">
            {/* Questões com Dificuldade */}
            <div className="bg-white/5 rounded-xl p-3 overflow-hidden">
              <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Temas com Dificuldade
              </h2>
              <div className="space-y-2 overflow-y-auto max-h-[160px]">
                {temasComDificuldade.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 text-sm">Nenhum tema com dificuldade!</p>
                  </div>
                ) : (
                  temasComDificuldade.map((tema, i) => (
                    <div key={tema.tema} className="bg-red-500/10 rounded-lg p-2 border border-red-500/30">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium">{tema.tema}</span>
                        <span className="text-red-400 text-sm font-bold">{tema.taxa_erro}% erro</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-red-900/50 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${tema.taxa_erro}%` }}
                          />
                        </div>
                        <span className="text-white/50 text-xs">{tema.quantidade}q</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Desempenho por Turma */}
            <div className="bg-white/5 rounded-xl p-3 overflow-hidden">
              <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Desempenho dos Alunos
              </h2>
              <div className="overflow-y-auto max-h-[160px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-white/50">
                      <th className="text-left pb-2">Aluno</th>
                      <th className="text-center pb-2">Status</th>
                      <th className="text-center pb-2">Questões</th>
                      <th className="text-center pb-2">Acertos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunosAtivos.slice(0, 8).map((aluno) => (
                      <tr key={aluno.id} className="border-t border-white/10">
                        <td className="py-1.5 text-white">{aluno.nome.split(' ').slice(0, 2).join(' ')}</td>
                        <td className="py-1.5 text-center">
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              background: `${getStatusColor(aluno.tipo_atividade)}20`,
                              color: getStatusColor(aluno.tipo_atividade)
                            }}
                          >
                            {aluno.tipo_atividade === 'estudo' ? 'Estudando' :
                             aluno.tipo_atividade === 'desafio' ? 'Desafio' :
                             aluno.tipo_atividade === 'tutor' ? 'Tutor IA' : 'Revisão'}
                          </span>
                        </td>
                        <td className="py-1.5 text-center text-white/70">{aluno.questoes_sessao}</td>
                        <td className="py-1.5 text-center">
                          <span style={{
                            color: aluno.taxa_acerto >= 70 ? '#22c55e' : aluno.taxa_acerto >= 50 ? '#f59e0b' : '#ef4444'
                          }}>
                            {aluno.acertos_sessao}/{aluno.questoes_sessao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA 4: Alertas e Feed */}
        <div className="col-span-1 flex flex-col gap-3 overflow-hidden">

          {/* Alertas em Tempo Real */}
          <div className="bg-white/5 rounded-xl p-3 flex-1 overflow-hidden">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Alertas em Tempo Real
            </h2>
            <div className="space-y-2 overflow-y-auto max-h-[180px]">
              {alertas.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400/70 text-xs">Sem alertas</p>
                </div>
              ) : (
                alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/30"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: getAvatarBg(alerta.componente) }}
                      >
                        {alerta.usuario_nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{alerta.usuario_nome.split(' ')[0]}</p>
                        <p className="text-white/50 text-[10px]">Errou: {alerta.detalhes.tema}</p>
                      </div>
                      <span className="text-yellow-400 text-[10px]">{formatarTempoRelativo(alerta.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Feed de Atividades Recentes */}
          <div className="bg-white/5 rounded-xl p-3 h-[220px] overflow-hidden">
            <h2 className="text-white font-semibold flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              Atividades Recentes
            </h2>
            <div className="space-y-1.5 overflow-y-auto max-h-[170px]">
              {atividades.slice(0, 10).map((ativ) => (
                <div
                  key={ativ.id}
                  className="flex items-center gap-2 py-1 border-b border-white/5"
                >
                  {ativ.tipo === 'resposta' ? (
                    ativ.detalhes.correta ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    )
                  ) : ativ.tipo === 'desafio_completo' ? (
                    <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                  ) : ativ.tipo === 'tutor' ? (
                    <Brain className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  ) : (
                    <Activity className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  )}
                  <span className="text-white/70 text-[10px] truncate flex-1">
                    <span className="text-white font-medium">{ativ.usuario_nome.split(' ')[0]}</span>
                    {' - '}
                    {ativ.tipo === 'resposta'
                      ? (ativ.detalhes.correta ? 'acertou' : 'errou')
                      : ativ.tipo === 'desafio_completo'
                      ? 'completou desafio'
                      : ativ.tipo === 'tutor'
                      ? 'usando tutor'
                      : 'atividade'
                    }
                  </span>
                  <span className="text-white/30 text-[9px]">{formatarTempoRelativo(ativ.timestamp)}</span>
                </div>
              ))}
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

interface StatBoxProps {
  label: string
  value: string | number
  color: string
  icon: React.ReactNode
  trend?: 'up' | 'down'
}

function StatBox({ label, value, color, icon, trend }: StatBoxProps) {
  return (
    <div
      className="rounded-lg p-2 flex flex-col justify-center"
      style={{
        background: 'rgba(255,255,255,0.05)',
        borderLeft: `3px solid ${color}`
      }}
    >
      <div className="flex items-center gap-2">
        <div style={{ color }}>{icon}</div>
        <div className="flex items-center gap-1">
          <span className="text-2xl font-bold text-white">{value}</span>
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
          {trend === 'down' && <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />}
        </div>
      </div>
      <span className="text-white/50 text-xs mt-0.5">{label}</span>
    </div>
  )
}
