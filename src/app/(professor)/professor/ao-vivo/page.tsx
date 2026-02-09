'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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
  AlertTriangle,
  Brain,
  PlayCircle,
  PauseCircle,
  Eye,
  ArrowLeft,
  Coffee,
  Wifi,
  WifiOff,
  Star,
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
// CONSTANTES (fora do render)
// ═══════════════════════════════════════════════════════════════════════════

const ATIVIDADE_CONFIG: Record<string, { cor: string; label: string }> = {
  estudo: { cor: 'var(--success)', label: 'Estudando' },
  desafio: { cor: 'var(--warning)', label: 'Desafio' },
  tutor: { cor: 'var(--info)', label: 'Tutor IA' },
  revisao: { cor: 'var(--color-matematica-light)', label: 'Revisao' },
  flashcard: { cor: 'var(--color-matematica-light)', label: 'Flashcard' },
  mapa: { cor: 'var(--color-accent)', label: 'Mapa' },
}

const getAvatarBg = (comp: Componente) => comp === 'fisica' ? 'var(--color-fisica)' : 'var(--color-matematica)'
const getIniciais = (nome: string) => nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

const formatarTempoOcioso = (seg: number) => {
  if (seg < 60) return `${seg}s`
  const min = Math.floor(seg / 60)
  if (min < 60) return `${min}min`
  return `${Math.floor(min / 60)}h${min % 60}m`
}

const formatarTempoRelativo = (ts: string) => {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  const min = Math.floor(diff / 60)
  if (min < 60) return `${min}min`
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardAoVivoPage() {
  const router = useRouter()
  const [dados, setDados] = useState<DadosTempoReal | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [turmaFiltro, setTurmaFiltro] = useState<string>('')
  const [componenteFiltro, setComponenteFiltro] = useState<Componente | ''>('')
  const [colegioFiltro, setColegioFiltro] = useState<string>('')
  const [periodoMinutos] = useState(60)

  const [autoRefresh, setAutoRefresh] = useState(true)
  const [contadorRefresh, setContadorRefresh] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const intervalo = 5

  // Histórico para sparklines (últimos 12 pontos = 1 min de dados com refresh 5s)
  const [historicoAcerto, setHistoricoAcerto] = useState<number[]>([])
  const [historicoQuestoes, setHistoricoQuestoes] = useState<number[]>([])

  // Relógio atualiza a cada 60s (só mostra HH:MM)
  const [horaAtual, setHoraAtual] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

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
        // Acumular histórico para sparklines
        setHistoricoAcerto(prev => [...prev.slice(-11), data.estatisticas.taxa_acerto_tempo_real || 0])
        setHistoricoQuestoes(prev => [...prev.slice(-11), data.estatisticas.questoes_ultimos_5min || 0])
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

  // Dados derivados (memoizados)
  const stats = dados?.estatisticas
  const alunosAtivos = dados?.alunos_ativos || []
  const alunosOciosos = dados?.alunos_ociosos || []
  const alunosInativos = dados?.alunos_inativos || []
  const atividades = dados?.atividades || []
  const temasComDificuldade = stats?.temas_com_dificuldade || []

  const alunosPrecisandoAjuda = useMemo(
    () => alunosAtivos.filter(a => a.questoes_sessao >= 5 && a.taxa_acerto < 40),
    [alunosAtivos]
  )

  const totalOnline = alunosAtivos.length + alunosOciosos.length

  // Distribuição de atividades para donut chart
  const distribuicaoAtividades = useMemo(() => {
    const cont: Record<string, number> = {}
    for (const a of alunosAtivos) {
      cont[a.tipo_atividade] = (cont[a.tipo_atividade] || 0) + 1
    }
    return Object.entries(cont).map(([tipo, qtd]) => ({
      tipo,
      qtd,
      cor: ATIVIDADE_CONFIG[tipo]?.cor || 'var(--text-tertiary)',
      label: ATIVIDADE_CONFIG[tipo]?.label || tipo,
    }))
  }, [alunosAtivos])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: 'var(--info)' }} />
          <p className="text-lg" style={{ color: 'var(--text-primary)' }}>Carregando...</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--error)' }} />
          <p className="mb-3" style={{ color: 'var(--text-primary)' }}>{erro}</p>
          <button onClick={buscarDados} className="px-4 py-2 rounded-lg" style={{ background: 'var(--info)', color: 'var(--text-primary)' }}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-base)', fontFamily: 'system-ui, sans-serif' }}>

      {/* HEADER */}
      <header className="px-3 py-1.5 flex items-center justify-between gap-3 flex-shrink-0" style={{ background: 'var(--bg-overlay)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-5 h-5 text-green-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-ping" />
          </div>
          <h1 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Ao Vivo</h1>
          {colegioFiltro && <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-xs">{colegioFiltro}</span>}
          {turmaFiltro && <span className="px-2 py-0.5 bg-green-600 text-white rounded text-xs">{turmaFiltro}</span>}
          {componenteFiltro && <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs capitalize">{componenteFiltro}</span>}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="flex items-center gap-2">
          {dados?.colegios_disponiveis && dados.colegios_disponiveis.length > 0 && (
            <select value={colegioFiltro} onChange={(e) => { setColegioFiltro(e.target.value); setTurmaFiltro('') }}
              className="px-2 py-1 rounded text-xs border"
              style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)', borderColor: 'var(--border-hover)', minHeight: '36px' }}>
              <option value="">Colegios</option>
              {dados.colegios_disponiveis.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select value={turmaFiltro} onChange={(e) => setTurmaFiltro(e.target.value)}
            className="px-2 py-1 rounded text-xs border"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)', borderColor: 'var(--border-hover)', minHeight: '36px' }}>
            <option value="">Turmas</option>
            {(dados?.turmas_disponiveis || []).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={componenteFiltro} onChange={(e) => setComponenteFiltro(e.target.value as Componente | '')}
            className="px-2 py-1 rounded text-xs border"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)', borderColor: 'var(--border-hover)', minHeight: '36px' }}>
            <option value="">Todos</option>
            <option value="fisica">Fis</option>
            <option value="matematica">Mat</option>
          </select>

          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded transition ${autoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-white/10'}`}
            style={{ minWidth: '36px', minHeight: '36px', ...(!autoRefresh ? { color: 'var(--text-tertiary)' } : {}) }}>
            {autoRefresh ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
          </button>

          {autoRefresh && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ borderColor: 'var(--success)', borderWidth: 2, borderStyle: 'solid', background: `conic-gradient(var(--success) ${((intervalo - contadorRefresh) / intervalo) * 360}deg, transparent 0deg)` }}>
              <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
                <span className="text-[10px] font-bold" style={{ color: 'var(--success)' }}>{intervalo - contadorRefresh}</span>
              </div>
            </div>
          )}

          <button onClick={() => router.push('/professor/dashboard')}
            className="p-2 rounded hover:opacity-80 transition"
            style={{ background: 'var(--bg-overlay)', color: 'var(--text-primary)', minWidth: '36px', minHeight: '36px' }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* STATS BAR */}
      <div className="px-2 py-1 grid grid-cols-3 lg:grid-cols-6 gap-2 flex-shrink-0">
        <MiniStat icon={<Wifi className="w-5 h-5" />} label="Online" value={totalOnline} color="var(--success)" />
        <MiniStat icon={<Coffee className="w-5 h-5" />} label="Ociosos" value={alunosOciosos.length} color="var(--warning)" />
        <MiniStat icon={<WifiOff className="w-5 h-5" />} label="Offline" value={alunosInativos.length} color="var(--text-tertiary)" />
        <MiniStat icon={<BookOpen className="w-5 h-5" />} label="Questoes" value={stats?.questoes_periodo_total || 0} color="var(--info)" />
        <MiniStat icon={<CheckCircle className="w-5 h-5" />} label="Acuracia" value={`${stats?.taxa_acerto_tempo_real || 0}%`}
          color={stats?.taxa_acerto_tempo_real && stats.taxa_acerto_tempo_real >= 60 ? 'var(--success)' : 'var(--warning)'} trend={stats?.tendencia_acerto} />
        <MiniStat icon={<Star className="w-5 h-5" />} label="Nota Media" value={stats?.media_nota_ativos ? stats.media_nota_ativos.toFixed(1) : '-'} color="var(--warning)" />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 px-2 pb-1 grid grid-cols-1 lg:grid-cols-12 gap-1.5 overflow-hidden min-h-0">

        {/* COLUNA ESQUERDA (8 cols) */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-1 overflow-hidden min-h-0">

          {/* Grid de Alunos */}
          <div className="rounded-lg p-2 overflow-hidden flex flex-col min-h-0" style={{ flex: '1 1 55%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Users className="w-5 h-5 text-blue-400" />
                Alunos
                <span className="font-normal text-xs" style={{ color: 'var(--text-muted)' }}>
                  {alunosAtivos.length} ativos | {alunosOciosos.length} ociosos | {alunosInativos.length} offline
                </span>
              </h2>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Ativo</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" /> Ocioso</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" /> Off</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {alunosAtivos.length === 0 && alunosOciosos.length === 0 && alunosInativos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
                  <UserX className="w-8 h-8 mb-1 opacity-70" />
                  <p className="text-xs">Nenhum aluno</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5 content-start">
                  {/* ATIVOS */}
                  {alunosAtivos.map((aluno) => {
                    const cfg = ATIVIDADE_CONFIG[aluno.tipo_atividade] || ATIVIDADE_CONFIG.estudo
                    const ajuda = aluno.questoes_sessao >= 5 && aluno.taxa_acerto < 40
                    return (
                      <div key={`a-${aluno.id}`}
                        className={`flex flex-col items-center hover:scale-105 transition-transform ${ajuda ? 'animate-pulse' : ''}`}
                        title={`${aluno.nome}\nTurma: ${aluno.turma}\n${cfg.label}\nQuestoes: ${aluno.questoes_sessao} | Acerto: ${aluno.taxa_acerto}%${aluno.nota_atual !== undefined ? `\nNota: ${aluno.nota_atual.toFixed(1)}` : ''}`}>
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ background: getAvatarBg(aluno.componente), boxShadow: ajuda ? '0 0 0 3px var(--error)' : '0 0 0 3px var(--success)' }}>
                            {getIniciais(aluno.nome)}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-slate-800 flex items-center justify-center" style={{ background: cfg.cor }}>
                            <span className="text-white text-[9px] font-bold">{cfg.label[0]}</span>
                          </div>
                          {aluno.questoes_sessao > 0 && (
                            <div className="absolute -top-1 -left-1 px-1 rounded text-[10px] font-bold text-white"
                              style={{ background: aluno.taxa_acerto >= 70 ? 'var(--success)' : aluno.taxa_acerto >= 50 ? 'var(--warning)' : 'var(--error)' }}>
                              {aluno.taxa_acerto}%
                            </div>
                          )}
                          {aluno.nota_atual !== undefined && (
                            <div className="absolute -top-1 right-[-8px] px-1 rounded text-[10px] font-bold text-yellow-300" style={{ background: 'var(--bg-base)' }}>
                              {aluno.nota_atual.toFixed(0)}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] mt-1 truncate max-w-[56px] text-center font-medium" style={{ color: 'var(--text-primary)' }}>{aluno.nome.split(' ')[0]}</span>
                      </div>
                    )
                  })}

                  {/* OCIOSOS */}
                  {alunosOciosos.map((aluno) => (
                    <div key={`o-${aluno.id}`} className="flex flex-col items-center"
                      title={`${aluno.nome}\nTurma: ${aluno.turma}\nOcioso ha ${formatarTempoOcioso(aluno.tempo_ocioso_segundos)}`}>
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-yellow-200 font-bold text-sm"
                          style={{ background: 'var(--warning-bg-30)', boxShadow: '0 0 0 3px var(--warning)' }}>
                          {getIniciais(aluno.nome)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-slate-800 bg-yellow-500 flex items-center justify-center">
                          <Coffee className="w-2.5 h-2.5 text-yellow-900" />
                        </div>
                        <div className="absolute -top-1 -left-1 px-1 rounded text-[10px] font-bold text-yellow-900 bg-yellow-400">
                          {formatarTempoOcioso(aluno.tempo_ocioso_segundos)}
                        </div>
                      </div>
                      <span className="text-yellow-400 text-[10px] mt-1 truncate max-w-[56px] text-center font-medium">{aluno.nome.split(' ')[0]}</span>
                    </div>
                  ))}

                  {/* OFFLINE */}
                  {alunosInativos.slice(0, 20).map((aluno) => (
                    <div key={`i-${aluno.id}`} className="flex flex-col items-center opacity-40"
                      title={`${aluno.nome}\nTurma: ${aluno.turma}\nOffline`}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
                        {getIniciais(aluno.nome)}
                      </div>
                      <span className="text-[10px] mt-1 truncate max-w-[56px] font-medium" style={{ color: 'var(--text-tertiary)' }}>{aluno.nome.split(' ')[0]}</span>
                    </div>
                  ))}
                  {alunosInativos.length > 20 && (
                    <div className="flex flex-col items-center opacity-40">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>
                        +{alunosInativos.length - 20}
                      </div>
                      <span className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-tertiary)' }}>mais</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Linha inferior: Gráficos + Desempenho + Dificuldades */}
          <div className="grid grid-cols-3 gap-1 overflow-hidden min-h-0" style={{ flex: '0 1 45%' }}>

            {/* GRÁFICO: Sparkline Acurácia + Donut Atividades */}
            <div className="rounded-lg p-2 overflow-hidden flex flex-col" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <h2 className="font-semibold text-sm flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp className="w-4 h-4 text-green-400" />
                Acuracia
              </h2>
              <div className="flex-1 flex flex-col justify-center gap-2">
                {/* Sparkline */}
                <Sparkline data={historicoAcerto} color="var(--success)" max={100} label="%" />
                {/* Mini donut de distribuição */}
                <div className="flex items-center gap-2">
                  <DonutChart data={distribuicaoAtividades} size={44} />
                  <div className="flex flex-col gap-1">
                    {distribuicaoAtividades.slice(0, 4).map(d => (
                      <div key={d.tipo} className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.cor }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
                        <span className="font-medium" style={{ color: 'var(--text-tertiary)' }}>{d.qtd}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de Desempenho com Nota */}
            <div className="rounded-lg p-2 overflow-hidden flex flex-col" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <h2 className="font-semibold text-sm flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-primary)' }}>
                <Award className="w-4 h-4 text-yellow-400" />
                Top Alunos
              </h2>
              <div className="flex-1 overflow-y-auto">
                {alunosAtivos.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--text-tertiary)' }}>Sem dados</div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0" style={{ background: 'var(--bg-elevated)' }}>
                      <tr style={{ color: 'var(--text-tertiary)' }}>
                        <th className="text-left pb-1 pl-1">Aluno</th>
                        <th className="text-center pb-1">Q</th>
                        <th className="text-center pb-1">%</th>
                        <th className="text-center pb-1">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunosAtivos.slice(0, 8).map((aluno) => (
                        <tr key={aluno.id} className="border-t border-slate-700/30">
                          <td className="py-1 pl-1">
                            <span className="truncate max-w-[70px] inline-block font-medium" style={{ color: 'var(--text-primary)' }}>{aluno.nome.split(' ')[0]}</span>
                          </td>
                          <td className="py-1 text-center" style={{ color: 'var(--text-secondary)' }}>{aluno.questoes_sessao}</td>
                          <td className="py-1 text-center font-bold" style={{ color: aluno.taxa_acerto >= 70 ? 'var(--success)' : aluno.taxa_acerto >= 50 ? 'var(--warning)' : 'var(--error)' }}>
                            {aluno.taxa_acerto}%
                          </td>
                          <td className="py-1 text-center">
                            {aluno.nota_atual !== undefined ? (
                              <span className="text-yellow-400 font-bold">{aluno.nota_atual.toFixed(1)}</span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Temas com Dificuldade */}
            <div className="rounded-lg p-2 overflow-hidden flex flex-col" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <h2 className="font-semibold text-sm flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-primary)' }}>
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Dificuldades
              </h2>
              <div className="flex-1 overflow-y-auto">
                {temasComDificuldade.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-green-400">
                    <CheckCircle className="w-5 h-5 mr-1.5" />
                    <span className="text-xs">Sem dificuldades</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {temasComDificuldade.map((tema) => (
                      <div key={tema.tema} className="bg-red-900/20 rounded p-1.5 border border-red-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] truncate flex-1 mr-1" style={{ color: 'var(--text-primary)' }}>{tema.tema}</span>
                          <span className="text-red-300 text-xs font-bold">{tema.taxa_erro}%</span>
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
        </div>

        {/* COLUNA DIREITA (4 cols): Gráfico Q/min + Alertas + Feed */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-1 overflow-hidden min-h-0">

          {/* Gráfico: Questões nos últimos minutos */}
          <div className="rounded-lg p-2 flex-shrink-0" style={{ height: '70px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <Activity className="w-4 h-4 text-blue-400" />
                Ritmo
              </h2>
              <span className="text-blue-400 text-xs font-bold">{stats?.questoes_ultimos_5min || 0} q/5min</span>
            </div>
            <Sparkline data={historicoQuestoes} color="var(--info)" />
          </div>

          {/* Alertas */}
          <div className="rounded-lg p-2 overflow-hidden flex flex-col min-h-0" style={{ flex: '0 1 40%', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <h2 className="font-semibold text-sm flex items-center gap-1.5 mb-1.5 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Alertas
              {(alunosOciosos.length + alunosPrecisandoAjuda.length) > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">
                  {alunosOciosos.length + alunosPrecisandoAjuda.length}
                </span>
              )}
            </h2>
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {alunosOciosos.slice(0, 5).map((aluno) => (
                <div key={`ao-${aluno.id}`} className="flex items-center gap-2 p-1.5 bg-yellow-900/30 rounded border border-yellow-500/20">
                  <Coffee className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{aluno.nome.split(' ')[0]}</p>
                    <p className="text-yellow-400 text-[11px]">Parado ha {formatarTempoOcioso(aluno.tempo_ocioso_segundos)}</p>
                  </div>
                  <span className="text-yellow-500 text-[11px] font-bold">{aluno.turma}</span>
                </div>
              ))}
              {alunosPrecisandoAjuda.slice(0, 5).map((aluno) => (
                <div key={`ah-${aluno.id}`} className="flex items-center gap-2 p-1.5 bg-red-900/30 rounded border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{aluno.nome.split(' ')[0]}</p>
                    <p className="text-red-400 text-[11px]">{aluno.taxa_acerto}% em {aluno.questoes_sessao}q</p>
                  </div>
                </div>
              ))}
              {alunosOciosos.length === 0 && alunosPrecisandoAjuda.length === 0 && (
                <div className="flex items-center justify-center py-3 text-green-400">
                  <CheckCircle className="w-5 h-5 mr-1.5" />
                  <span className="text-xs">Sem alertas</span>
                </div>
              )}
            </div>
          </div>

          {/* Feed de Atividades */}
          <div className="rounded-lg p-2 flex-1 overflow-hidden flex flex-col min-h-0" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
            <h2 className="font-semibold text-sm flex items-center gap-1.5 mb-1.5 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
              <Activity className="w-4 h-4 text-blue-400" />
              Feed
            </h2>
            <div className="flex-1 overflow-y-auto space-y-0.5 min-h-0">
              {atividades.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
                  <Clock className="w-6 h-6 mb-1.5 opacity-70" />
                  <p className="text-xs">Aguardando...</p>
                </div>
              ) : (
                atividades.slice(0, 30).map((ativ) => (
                  <div key={ativ.id} className="flex items-center gap-1.5 py-1 px-1 rounded hover:bg-slate-700/50">
                    {ativ.tipo === 'resposta' || ativ.tipo === 'revisao' ? (
                      ativ.detalhes.correta
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    ) : ativ.tipo === 'desafio_completo' ? (
                      <Award className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                    ) : ativ.tipo === 'desafio_iniciado' ? (
                      <Zap className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                    ) : ativ.tipo === 'tutor' ? (
                      <Brain className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                    )}
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{ativ.usuario_nome.split(' ')[0]}</span>
                    <span className="text-[11px] truncate flex-1" style={{ color: 'var(--text-muted)' }}>
                      {ativ.tipo === 'resposta' || ativ.tipo === 'revisao'
                        ? (ativ.detalhes.correta ? 'acertou' : 'errou')
                        : ativ.tipo === 'desafio_completo' ? 'desafio OK'
                        : ativ.tipo === 'desafio_iniciado' ? 'desafio'
                        : ativ.tipo === 'tutor' ? 'tutor'
                        : 'atividade'
                      }
                    </span>
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>{formatarTempoRelativo(ativ.timestamp)}</span>
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
// COMPONENTES: Gráficos CSS puro (sem dependências)
// ═══════════════════════════════════════════════════════════════════════════

function MiniStat({ icon, label, value, color, trend }: {
  icon: React.ReactNode; label: string; value: string | number; color: string
  trend?: 'subindo' | 'estavel' | 'descendo'
}) {
  return (
    <div className="rounded-lg p-2 flex items-center gap-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderLeft: `3px solid ${color}` }}>
      <div style={{ color }} className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{value}</span>
          {trend === 'subindo' && <TrendingUp className="w-4 h-4 text-green-400" />}
          {trend === 'descendo' && <TrendingDown className="w-4 h-4 text-red-400" />}
        </div>
        <span className="text-[11px] leading-none" style={{ color: 'var(--text-muted)' }}>{label}</span>
      </div>
    </div>
  )
}

function Sparkline({ data, color, max, label }: {
  data: number[]; color: string; max?: number; label?: string
}) {
  if (data.length < 2) {
    return <div className="h-6 flex items-center justify-center text-xs" style={{ color: 'var(--text-tertiary)' }}>Coletando dados...</div>
  }

  const maxVal = max || Math.max(...data, 1)
  const w = 100
  const h = 24

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / maxVal) * h
    return `${x},${y}`
  }).join(' ')

  const ultimo = data[data.length - 1]

  return (
    <div className="flex items-center gap-2">
      <svg viewBox={`0 0 ${w} ${h}`} className="flex-1" style={{ height: '24px' }} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Ponto atual */}
        {data.length > 0 && (
          <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - (ultimo / maxVal) * h} r="3" fill={color} />
        )}
      </svg>
      <span className="text-xs font-bold flex-shrink-0" style={{ color }}>{ultimo}{label || ''}</span>
    </div>
  )
}

function DonutChart({ data, size }: {
  data: { tipo: string; qtd: number; cor: string }[]; size: number
}) {
  const total = data.reduce((acc, d) => acc + d.qtd, 0)
  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="14" fill="none" stroke="var(--text-muted)" strokeWidth="5" />
      </svg>
    )
  }

  let acumulado = 0
  const circunferencia = 2 * Math.PI * 14 // r=14

  return (
    <svg width={size} height={size} viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
      {data.map((d) => {
        const pct = d.qtd / total
        const offset = acumulado * circunferencia
        const dash = pct * circunferencia
        acumulado += pct
        return (
          <circle key={d.tipo} cx="18" cy="18" r="14" fill="none" stroke={d.cor} strokeWidth="5"
            strokeDasharray={`${dash} ${circunferencia - dash}`} strokeDashoffset={-offset} />
        )
      })}
      <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="bold"
        style={{ transform: 'rotate(90deg)', transformOrigin: '18px 18px' }}>
        {total}
      </text>
    </svg>
  )
}
