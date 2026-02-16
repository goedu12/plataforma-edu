'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  BookOpen,
  Filter,
  ChevronRight,
  Loader2,
  Shuffle,
  Play,
  Beaker,
  Calculator,
  Languages,
  Globe,
  AlertTriangle,
  ArrowLeft,
  X,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// PÁGINA ENEM — Tela principal do módulo ENEM
// Filtros: ano, dia, área, idioma
// Cards resumo com contagens por área
// Botões: Iniciar Simulado (modo sequencial) e Questão Aleatória
// ═══════════════════════════════════════════════════════════════════════════

interface QuestaoResumo {
  id: string
  id_api: string
  ano_prova: number
  dia: number
  numero_questao: number
  area: string
  area_nome: string
  lingua_estrangeira: string | null
  titulo: string | null
  anulada: boolean
}

interface ContagemArea {
  nome: string
  total: number
  cor: string
  icone: string
}

const AREA_CORES: Record<string, { cor: string; icone: typeof Beaker }> = {
  'Linguagens, Códigos e suas Tecnologias': { cor: '#8b5cf6', icone: Languages },
  'Ciências Humanas e suas Tecnologias': { cor: '#f59e0b', icone: Globe },
  'Ciências da Natureza e suas Tecnologias': { cor: '#22c55e', icone: Beaker },
  'Matemática e suas Tecnologias': { cor: '#3b82f6', icone: Calculator },
  // Fallbacks para formato curto
  'linguagens': { cor: '#8b5cf6', icone: Languages },
  'ciencias-humanas': { cor: '#f59e0b', icone: Globe },
  'ciencias-natureza': { cor: '#22c55e', icone: Beaker },
  'matematica': { cor: '#3b82f6', icone: Calculator },
}

function getAreaConfig(area: string) {
  // Tentar match exato primeiro
  if (AREA_CORES[area]) return AREA_CORES[area]
  // Tentar match parcial
  const key = Object.keys(AREA_CORES).find(k =>
    area.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(area.toLowerCase())
  )
  return key ? AREA_CORES[key] : { cor: '#6b7280', icone: BookOpen }
}

export default function ENEMPage() {
  const router = useRouter()

  // Filtros
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null)
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null)
  const [areaSelecionada, setAreaSelecionada] = useState<string | null>(null)
  const [linguaSelecionada, setLinguaSelecionada] = useState<string | null>(null)

  // Dados
  const [questoes, setQuestoes] = useState<QuestaoResumo[]>([])
  const [contagemPorArea, setContagemPorArea] = useState<Record<string, number>>({})
  const [contagemPorDia, setContagemPorDia] = useState<Record<number, number>>({})
  const [total, setTotal] = useState(0)

  // Estado
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const params = new URLSearchParams({ modo: 'listar', limit: '50' })
      if (anoSelecionado) params.set('ano', String(anoSelecionado))
      if (diaSelecionado) params.set('dia', String(diaSelecionado))
      if (areaSelecionada) params.set('area', areaSelecionada)
      if (linguaSelecionada) params.set('lingua', linguaSelecionada)

      const res = await fetch(`/api/enem?${params}`)
      const data = await res.json()

      if (!data.sucesso) {
        setErro(data.erro || 'Erro ao carregar questões')
        return
      }

      setQuestoes(data.questoes || [])
      setContagemPorArea(data.contagem_por_area || {})
      setContagemPorDia(data.contagem_por_dia || {})
      setTotal(data.total || 0)
    } catch {
      setErro('Erro de conexão. Verifique sua internet.')
    } finally {
      setCarregando(false)
    }
  }, [anoSelecionado, diaSelecionado, areaSelecionada, linguaSelecionada])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Limpar filtros dependentes quando área muda
  useEffect(() => {
    if (areaSelecionada) {
      // Lingua estrangeira só disponível em Linguagens
      const isLinguagens = areaSelecionada.toLowerCase().includes('linguagen')
      if (!isLinguagens) setLinguaSelecionada(null)
    }
  }, [areaSelecionada])

  const handleQuestaoAleatoria = () => {
    const params = new URLSearchParams()
    if (anoSelecionado) params.set('ano', String(anoSelecionado))
    if (diaSelecionado) params.set('dia', String(diaSelecionado))
    if (areaSelecionada) params.set('area', areaSelecionada)
    if (linguaSelecionada) params.set('lingua', linguaSelecionada)
    router.push(`/enem/questao/aleatorio?${params}`)
  }

  const handleIniciarSimulado = () => {
    if (questoes.length === 0) return
    const primeiraQuestao = questoes[0]
    const params = new URLSearchParams({ modo: 'simulado' })
    if (anoSelecionado) params.set('ano', String(anoSelecionado))
    if (diaSelecionado) params.set('dia', String(diaSelecionado))
    if (areaSelecionada) params.set('area', areaSelecionada)
    if (linguaSelecionada) params.set('lingua', linguaSelecionada)
    router.push(`/enem/questao/${primeiraQuestao.id}?${params}`)
  }

  const handleVerQuestao = (questao: QuestaoResumo) => {
    router.push(`/enem/questao/${questao.id}`)
  }

  const temFiltros = anoSelecionado || diaSelecionado || areaSelecionada || linguaSelecionada
  const isLinguagensSelected = areaSelecionada?.toLowerCase().includes('linguagen') ||
    areaSelecionada === 'linguagens'

  // Anos disponíveis
  const anos = [2025, 2024]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              Simulado ENEM
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {total} questões disponíveis
            </p>
          </div>
        </div>

        {temFiltros && (
          <button
            onClick={() => { setAnoSelecionado(null); setDiaSelecionado(null); setAreaSelecionada(null); setLinguaSelecionada(null) }}
            className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
          >
            <X className="w-3 h-3" /> Limpar filtros
          </button>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 space-y-5">
        {/* ─── FILTROS ─── */}
        <section>
          {/* Filtro por Ano */}
          <div className="mb-4">
            <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Calendar className="w-3.5 h-3.5" /> Ano da Prova
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setAnoSelecionado(null)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: !anoSelecionado ? '#3b82f6' : 'var(--bg-elevated)',
                  color: !anoSelecionado ? '#fff' : 'var(--text-muted)',
                }}
              >
                Todos
              </button>
              {anos.map(ano => (
                <button
                  key={ano}
                  onClick={() => setAnoSelecionado(ano)}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: anoSelecionado === ano ? '#3b82f6' : 'var(--bg-elevated)',
                    color: anoSelecionado === ano ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {ano}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Dia */}
          <div className="mb-4">
            <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <BookOpen className="w-3.5 h-3.5" /> Dia da Prova
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setDiaSelecionado(null)}
                className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: !diaSelecionado ? '#3b82f6' : 'var(--bg-elevated)',
                  color: !diaSelecionado ? '#fff' : 'var(--text-muted)',
                }}
              >
                Ambos
              </button>
              {[1, 2].map(dia => (
                <button
                  key={dia}
                  onClick={() => setDiaSelecionado(dia)}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: diaSelecionado === dia ? '#3b82f6' : 'var(--bg-elevated)',
                    color: diaSelecionado === dia ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  Dia {dia} {dia === 1 ? '(Linguagens + Humanas)' : '(Natureza + Matemática)'}
                  {contagemPorDia[dia] ? ` · ${contagemPorDia[dia]}` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por Idioma (só aparece em contexto de Linguagens) */}
          {isLinguagensSelected && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Languages className="w-3.5 h-3.5" /> Idioma (Língua Estrangeira)
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setLinguaSelecionada(null)}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: !linguaSelecionada ? '#3b82f6' : 'var(--bg-elevated)',
                    color: !linguaSelecionada ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  Todos
                </button>
                {['inglês', 'espanhol'].map(lingua => (
                  <button
                    key={lingua}
                    onClick={() => setLinguaSelecionada(lingua)}
                    className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                    style={{
                      background: linguaSelecionada === lingua ? '#3b82f6' : 'var(--bg-elevated)',
                      color: linguaSelecionada === lingua ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {lingua}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ─── CARDS DE CONTAGEM POR ÁREA ─── */}
        {Object.keys(contagemPorArea).length > 0 && (
          <section>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Questões por Área
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(contagemPorArea).map(([area, count]) => {
                const config = getAreaConfig(area)
                const Icon = config.icone
                const isActive = areaSelecionada === area
                return (
                  <button
                    key={area}
                    onClick={() => setAreaSelecionada(isActive ? null : area)}
                    className="flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                    style={{
                      background: isActive ? `${config.cor}15` : 'var(--bg-surface)',
                      border: `1.5px solid ${isActive ? config.cor : 'var(--border-default)'}`,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${config.cor}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: config.cor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {area}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {count} {count === 1 ? 'questão' : 'questões'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ─── BOTÕES DE AÇÃO ─── */}
        <section className="flex gap-3">
          <button
            onClick={handleIniciarSimulado}
            disabled={carregando || questoes.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: '#3b82f6', color: '#fff' }}
          >
            <Play className="w-4 h-4" />
            Iniciar Simulado
          </button>
          <button
            onClick={handleQuestaoAleatoria}
            disabled={carregando}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
          >
            <Shuffle className="w-4 h-4" />
            Questão Aleatória
          </button>
        </section>

        {/* ─── LISTA DE QUESTÕES ─── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Questões {temFiltros ? '(filtradas)' : ''} — {total} total
            </p>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#3b82f6' }} />
            </div>
          ) : erro ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--error)' }} />
              <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{erro}</p>
              <button
                onClick={carregarDados}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                Tentar novamente
              </button>
            </div>
          ) : questoes.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Nenhuma questão encontrada com estes filtros.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {questoes.map(q => {
                const config = getAreaConfig(q.area_nome || q.area)
                return (
                  <button
                    key={q.id}
                    onClick={() => handleVerQuestao(q)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left hover:opacity-80"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: `${config.cor}15`, color: config.cor }}
                    >
                      {q.numero_questao}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {q.titulo || `Questão ${q.numero_questao}`}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        ENEM {q.ano_prova} · Dia {q.dia} · {q.area_nome || q.area}
                        {q.lingua_estrangeira ? ` · ${q.lingua_estrangeira}` : ''}
                      </p>
                    </div>
                    {q.anulada && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        style={{ background: 'var(--warning-bg-15)', color: 'var(--warning)' }}
                      >
                        Anulada
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
