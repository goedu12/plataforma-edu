'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  FileText,
  Clock,
  Filter,
  X,
  Calendar,
  BookOpen,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Target,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import QuestaoENEM from '@/components/QuestaoENEM'
import type {
  Componente,
  QuestaoENEM as TipoQuestaoENEM,
  AreaENEM,
  SubareaENEM,
  ConteudoENEM,
  EstatisticasENEM,
  AlternativaENEM,
} from '@/types'
import { ENEM_CONFIG } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// PAGINA: Simulado ENEM
// Questoes do ENEM sem pontuacao/gamificacao
// ═══════════════════════════════════════════════════════════════════════════

type StatusQuestao = 'OK' | 'SEM_QUESTOES' | 'COMPLETOU' | 'ERRO' | 'ACESSO_NEGADO'

export default function SimuladoENEMPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  // Estados principais
  const [questao, setQuestao] = useState<Omit<TipoQuestaoENEM, 'resposta_correta'> | null>(null)
  const [questaoExtra, setQuestaoExtra] = useState<{
    resposta_correta?: string
    fonte?: string
  } | null>(null)
  const [status, setStatus] = useState<StatusQuestao | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Estados de filtros
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null)
  const [subareaSelecionada, setSubareaSelecionada] = useState<SubareaENEM | null>(null)
  const [conteudoSelecionado, setConteudoSelecionado] = useState<string | null>(null)
  const [conteudosDisponiveis, setConteudosDisponiveis] = useState<ConteudoENEM[]>([])

  // Estados de estatisticas
  const [estatisticas, setEstatisticas] = useState<EstatisticasENEM | null>(null)
  const [estatisticasQuestao, setEstatisticasQuestao] = useState<{
    total_filtro: number
    respondidas: number
    restantes: number
  } | null>(null)

  // Determinar area ENEM baseado no componente
  const areaENEM: AreaENEM = ENEM_CONFIG.COMPONENTE_TO_AREA[componente] || 'ciencias-natureza'
  const isFisica = componente === 'fisica'
  const nomeComponente = isFisica ? 'Física' : 'Matemática'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Subareas disponiveis para o componente
  const subareasDisponiveis = ENEM_CONFIG.AREAS[areaENEM]?.subareas || []

  // Buscar conteudos quando mudar subarea
  useEffect(() => {
    if (subareaSelecionada) {
      buscarConteudos()
    } else {
      setConteudosDisponiveis([])
      setConteudoSelecionado(null)
    }
  }, [subareaSelecionada])

  const buscarConteudos = async () => {
    try {
      const params = new URLSearchParams()
      params.set('area', areaENEM)
      if (subareaSelecionada) params.set('subarea', subareaSelecionada)

      const response = await fetch(`/api/enem/conteudos?${params}`)
      const data = await response.json()

      if (data.sucesso) {
        setConteudosDisponiveis(data.conteudos || [])
      }
    } catch (error) {
      console.error('Erro ao buscar conteudos:', error)
    }
  }

  // Buscar estatisticas
  const buscarEstatisticas = async () => {
    try {
      const response = await fetch('/api/enem/estatisticas')
      const data = await response.json()

      if (data.sucesso) {
        setEstatisticas(data.estatisticas)
      }
    } catch (error) {
      console.error('Erro ao buscar estatisticas:', error)
    }
  }

  // Buscar questao
  const buscarQuestao = async () => {
    setLoading(true)
    setErro(null)
    setTempoDecorrido(0)

    try {
      const params = new URLSearchParams()
      params.set('area', areaENEM)
      if (anoSelecionado) params.set('ano', String(anoSelecionado))
      if (subareaSelecionada) params.set('subarea', subareaSelecionada)
      if (conteudoSelecionado) params.set('conteudo', conteudoSelecionado)
      params.set('modo', 'aleatorio')

      const response = await fetch(`/api/enem?${params}`)
      const data = await response.json()

      if (data.sucesso) {
        setStatus(data.status)
        setEstatisticasQuestao(data.estatisticas || null)

        if (data.status === 'OK' && data.questao) {
          setQuestao(data.questao)
          // Guardar dados extras (resposta_correta para questões externas)
          setQuestaoExtra({
            resposta_correta: data._rc,
            fonte: data.fonte,
          })
          iniciarTimer()
        } else {
          setQuestao(null)
          setQuestaoExtra(null)
        }
      } else {
        if (data.status === 'ACESSO_NEGADO') {
          setStatus('ACESSO_NEGADO')
          setErro(data.erro)
        } else {
          setStatus('ERRO')
          setErro(data.erro || 'Erro ao carregar questao')
        }
      }
    } catch (error) {
      console.error('Erro ao buscar questao ENEM:', error)
      setStatus('ERRO')
      setErro('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  const iniciarTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTempoDecorrido(prev => prev + 1)
    }, 1000)
  }

  const pararTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarQuestao()
    buscarEstatisticas()
    return () => pararTimer()
  }, [componente])

  const handleVoltar = () => router.push(`/${componente}/menu`)

  const handleResponder = (resposta: AlternativaENEM) => {
    pararTimer()
    buscarEstatisticas() // Atualizar estatisticas apos responder
  }

  const handleProxima = () => {
    buscarQuestao()
  }

  const aplicarFiltros = () => {
    setMostrarFiltros(false)
    buscarQuestao()
  }

  const limparFiltros = () => {
    setAnoSelecionado(null)
    setSubareaSelecionada(null)
    setConteudoSelecionado(null)
  }

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}:${seg.toString().padStart(2, '0')}`
  }

  if (loading && !questao) {
    return <Loading fullScreen componente={componente} text="Carregando questão ENEM..." />
  }

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <header
        className="px-4 py-3 sticky top-0 z-10 flex-shrink-0"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            {/* Voltar */}
            <button
              onClick={handleVoltar}
              className="p-2 -ml-2 rounded-lg lg:hidden"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Titulo */}
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" style={{ color: corPrimaria }} />
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Simulado ENEM
              </span>
              <Badge variant="info" className="text-xs">NOVO</Badge>
            </div>

            {/* Acoes */}
            <div className="flex items-center gap-2">
              {/* Filtros */}
              <button
                onClick={() => setMostrarFiltros(true)}
                className="p-2 rounded-lg relative"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <Filter className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                {(anoSelecionado || subareaSelecionada || conteudoSelecionado) && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                    style={{ background: corPrimaria }}
                  />
                )}
              </button>

              {/* Timer */}
              {status === 'OK' && questao && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm"
                  style={{ background: 'var(--bg-elevated)', color: corPrimaria }}
                >
                  <Clock className="w-4 h-4" />
                  <span>{formatarTempo(tempoDecorrido)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Estatisticas rapidas */}
          {estatisticas && estatisticas.total_questoes > 0 && (
            <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>
                <strong style={{ color: 'var(--text-primary)' }}>{estatisticas.total_questoes}</strong> respondidas
              </span>
              <span>
                <strong style={{ color: 'var(--success)' }}>{estatisticas.taxa_acerto}%</strong> acerto
              </span>
              {estatisticasQuestao && (
                <span>
                  <strong style={{ color: corPrimaria }}>{estatisticasQuestao.restantes}</strong> restantes
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTEUDO
          ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-4 w-full flex flex-col">
        {status === 'OK' && questao ? (
          <QuestaoENEM
            key={questao.id} // Reset component state on new question
            questao={questao}
            componente={componente}
            tempoDecorrido={tempoDecorrido}
            onResponder={handleResponder}
            onProxima={handleProxima}
            onVoltar={handleVoltar}
            estatisticas={estatisticas ? {
              total_questoes: estatisticas.total_questoes,
              total_corretas: estatisticas.total_corretas,
              taxa_acerto: estatisticas.taxa_acerto,
            } : undefined}
            questaoExtra={questaoExtra || undefined}
          />
        ) : (
          /* ═══════════════════════════════════════════════════════════════
             TELA DE STATUS
             ═══════════════════════════════════════════════════════════════ */
          <div
            className="rounded-2xl p-6 text-center animate-fade-in-up"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background:
                  status === 'ACESSO_NEGADO' ? 'rgba(239, 68, 68, 0.15)'
                  : status === 'ERRO' ? 'rgba(239, 68, 68, 0.15)'
                  : status === 'COMPLETOU' ? isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)'
                  : 'var(--bg-elevated)',
                border:
                  status === 'ACESSO_NEGADO' ? '1px solid rgba(239, 68, 68, 0.3)'
                  : status === 'ERRO' ? '1px solid rgba(239, 68, 68, 0.3)'
                  : status === 'COMPLETOU' ? `1px solid ${corPrimaria}`
                  : '1px solid var(--border-default)',
              }}
            >
              {status === 'ACESSO_NEGADO' && <AlertTriangle className="w-7 h-7" style={{ color: 'var(--error)' }} />}
              {status === 'COMPLETOU' && <CheckCircle2 className="w-7 h-7" style={{ color: corPrimaria }} />}
              {status === 'ERRO' && <AlertTriangle className="w-7 h-7" style={{ color: 'var(--error)' }} />}
              {status === 'SEM_QUESTOES' && <BookOpen className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />}
            </div>

            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {status === 'ACESSO_NEGADO' && 'Acesso Restrito'}
              {status === 'COMPLETOU' && 'Parabéns!'}
              {status === 'ERRO' && 'Ops! Erro'}
              {status === 'SEM_QUESTOES' && 'Sem Questões'}
            </h2>

            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {status === 'ACESSO_NEGADO' && erro}
              {status === 'COMPLETOU' && 'Você respondeu todas as questões com os filtros selecionados!'}
              {status === 'ERRO' && erro}
              {status === 'SEM_QUESTOES' && 'Não há questões disponíveis com os filtros selecionados.'}
            </p>

            {/* Estatisticas na tela de conclusao */}
            {status === 'COMPLETOU' && estatisticas && (
              <div
                className="flex justify-around py-4 mb-4 rounded-xl"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: corPrimaria }}>
                    {estatisticas.total_questoes}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Respondidas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                    {estatisticas.total_corretas}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Acertos</p>
                </div>
                <div className="text-center">
                  <p
                    className="text-2xl font-bold"
                    style={{
                      color: estatisticas.taxa_acerto >= 60 ? 'var(--success)'
                        : estatisticas.taxa_acerto >= 40 ? 'var(--warning)'
                        : 'var(--error)',
                    }}
                  >
                    {estatisticas.taxa_acerto}%
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Taxa</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {(status === 'SEM_QUESTOES' || status === 'COMPLETOU') && (
                <Button
                  variant="secondary"
                  onClick={() => setMostrarFiltros(true)}
                  leftIcon={<Filter className="w-4 h-4" />}
                  className="min-h-[48px]"
                >
                  Alterar Filtros
                </Button>
              )}
              {status === 'ERRO' && (
                <Button
                  variant="secondary"
                  onClick={buscarQuestao}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  className="min-h-[48px]"
                >
                  Tentar Novamente
                </Button>
              )}
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={handleVoltar}
                className="min-h-[48px]"
              >
                Voltar ao Menu
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL DE FILTROS
          ═══════════════════════════════════════════════════════════════════ */}
      {mostrarFiltros && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          onClick={() => setMostrarFiltros(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden animate-fade-in-up"
            style={{ background: 'var(--bg-surface)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" style={{ color: corPrimaria }} />
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Filtrar Questões
                </h3>
              </div>
              <button
                onClick={() => setMostrarFiltros(false)}
                className="p-2 rounded-lg"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Filtros */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Ano da Prova */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Ano da Prova
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAnoSelecionado(null)}
                    className="px-3 py-1.5 rounded-lg text-sm transition-all"
                    style={{
                      background: !anoSelecionado ? corPrimaria : 'var(--bg-elevated)',
                      color: !anoSelecionado ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)',
                    }}
                  >
                    Todos
                  </button>
                  {ENEM_CONFIG.ANOS_DISPONIVEIS.map(ano => (
                    <button
                      key={ano}
                      onClick={() => setAnoSelecionado(ano)}
                      className="px-3 py-1.5 rounded-lg text-sm transition-all"
                      style={{
                        background: anoSelecionado === ano ? corPrimaria : 'var(--bg-elevated)',
                        color: anoSelecionado === ano ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)',
                      }}
                    >
                      {ano}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subarea */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Disciplina
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSubareaSelecionada(null)}
                    className="px-3 py-1.5 rounded-lg text-sm transition-all"
                    style={{
                      background: !subareaSelecionada ? corPrimaria : 'var(--bg-elevated)',
                      color: !subareaSelecionada ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)',
                    }}
                  >
                    Todas
                  </button>
                  {subareasDisponiveis.map(sub => (
                    <button
                      key={sub}
                      onClick={() => setSubareaSelecionada(sub)}
                      className="px-3 py-1.5 rounded-lg text-sm transition-all"
                      style={{
                        background: subareaSelecionada === sub ? corPrimaria : 'var(--bg-elevated)',
                        color: subareaSelecionada === sub ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)',
                      }}
                    >
                      {ENEM_CONFIG.SUBAREAS_LABELS[sub]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conteudo (apenas se tiver subarea selecionada) */}
              {subareaSelecionada && conteudosDisponiveis.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--text-primary)' }}>
                    <Target className="w-4 h-4 inline mr-2" />
                    Conteúdo Específico
                  </label>
                  <div className="relative">
                    <select
                      value={conteudoSelecionado || ''}
                      onChange={e => setConteudoSelecionado(e.target.value || null)}
                      className="w-full px-4 py-3 rounded-xl appearance-none cursor-pointer"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="">Todos os conteúdos</option>
                      {conteudosDisponiveis.map(c => (
                        <option key={c.codigo} value={c.codigo}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="p-4 flex gap-2"
              style={{ borderTop: '1px solid var(--border-default)' }}
            >
              <Button
                variant="secondary"
                onClick={limparFiltros}
                className="flex-1"
              >
                Limpar
              </Button>
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={aplicarFiltros}
                className="flex-1"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav componente={componente} />
    </div>
  )
}
