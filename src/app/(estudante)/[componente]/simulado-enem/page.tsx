'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { GraduationCap, CheckCircle2, XCircle, RefreshCw, Clock, ChevronDown, Filter, BookOpen, AlertTriangle, ImageIcon } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import SafeImage, { isValidImageUrl } from '@/components/ui/SafeImage'
import ImagemModal from '@/components/ui/ImagemModal'
import ConteudoQuestao from '@/components/ConteudoQuestao'
import { formatarFormula } from '@/lib/formatacao'
import { extrairTituloDoTexto } from '@/lib/limpezaTexto'
import type { Componente, QuestaoEnem, ElementoEnem } from '@/types'

// URL base para imagens do ENEM no Supabase Storage
const ENEM_IMAGES_BASE_URL = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/enem-imagens'

// Construir URL completa para imagem ENEM
function getEnemImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  // Se já é URL completa, retornar como está
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  // Montar URL completa
  return `${ENEM_IMAGES_BASE_URL}/${path}`
}

type StatusSimulado = 'OK' | 'SEM_QUESTOES' | 'COMPLETOU' | 'ERRO' | 'FILTRO'
type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E'

interface Progresso {
  total: number
  respondidas: number
  restantes: number
}

interface Estatisticas {
  total_respondidas: number
  total_corretas: number
  percentual_acerto: number
}

interface FeedbackData {
  correta: boolean
  gabarito: string | null
  anulada: boolean
  estatisticas: Estatisticas
}

const AREAS_ENEM: Record<string, string> = {
  'Linguagens, Códigos e suas Tecnologias': 'Linguagens',
  'Ciências Humanas e suas Tecnologias': 'Humanas',
  'Ciências da Natureza e suas Tecnologias': 'Natureza',
  'Matemática e suas Tecnologias': 'Matemática',
}

export default function SimuladoEnemPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [questao, setQuestao] = useState<QuestaoEnem | null>(null)
  const [status, setStatus] = useState<StatusSimulado | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Filtros
  const [filtroAno, setFiltroAno] = useState<string>('')
  const [filtroDia, setFiltroDia] = useState<string>('')
  const [filtroArea, setFiltroArea] = useState<string>('')
  const [mostrarFiltros, setMostrarFiltros] = useState(true)

  // Estados da questão
  const [selecionada, setSelecionada] = useState<Alternativa | null>(null)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [respondendo, setRespondendo] = useState(false)
  const [imagemExpandida, setImagemExpandida] = useState<string | null>(null)

  const isFisica = componente === 'fisica'
  const corPrimaria = 'var(--color-accent)'

  const buscarQuestao = async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setErro(null)
    setSelecionada(null)
    setFeedback(null)
    setMostrarFiltros(false)

    try {
      const params = new URLSearchParams()
      if (filtroAno) params.set('ano', filtroAno)
      if (filtroDia) params.set('dia', filtroDia)
      if (filtroArea) params.set('area', filtroArea)

      const response = await fetch(`/api/enem/questoes?${params}`, {
        signal: abortControllerRef.current.signal,
      })
      const data = await response.json()

      if (data.sucesso) {
        setStatus(data.status)
        setProgresso(data.progresso || null)

        if (data.status === 'OK' && data.questao) {
          setQuestao(data.questao)
          setTempoDecorrido(0)
          iniciarTimer()
        } else {
          setQuestao(null)
        }
      } else {
        setStatus('ERRO')
        setErro(data.erro || 'Erro ao carregar questão')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
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
    // Mostrar filtros na primeira vez
    setStatus('FILTRO')
    setLoading(false)
    return () => {
      pararTimer()
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [componente])

  const handleVoltar = () => router.push(`/${componente}/menu`)

  const handleConfirmar = async () => {
    if (!selecionada || !questao) return

    setRespondendo(true)
    pararTimer()

    try {
      const response = await fetch('/api/enem/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questao_id: questao.id,
          resposta: selecionada,
          tempo_segundos: tempoDecorrido,
        }),
      })

      const data = await response.json()

      if (data.sucesso) {
        setFeedback({
          correta: data.correta,
          gabarito: data.gabarito,
          anulada: data.anulada,
          estatisticas: data.estatisticas,
        })
      } else {
        setErro(data.erro || 'Erro ao registrar resposta.')
      }
    } catch {
      setErro('Erro de conexão. Verifique sua internet.')
    } finally {
      setRespondendo(false)
    }
  }

  const getAlternativaStyle = (letra: Alternativa) => {
    if (feedback) {
      if (feedback.anulada) {
        return { background: 'var(--warning-bg-15)', border: '1px solid var(--warning-bg-40)', opacity: 0.7 }
      }
      if (letra === feedback.gabarito) {
        return { background: 'var(--success-bg-15)', border: '2px solid var(--success)' }
      }
      if (letra === selecionada && !feedback.correta) {
        return { background: 'var(--error-bg-15)', border: '2px solid var(--error)' }
      }
      return { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', opacity: 0.5 }
    }
    if (selecionada === letra) {
      return { background: 'var(--color-accent-bg-15, rgba(99,102,241,0.15))', border: '2px solid var(--color-accent)' }
    }
    return { background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }
  }

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}:${seg.toString().padStart(2, '0')}`
  }

  // Montar alternativas do ENEM
  const alternativas = questao ? (['A', 'B', 'C', 'D', 'E'] as Alternativa[]).map(letra => {
    const letraLower = letra.toLowerCase()
    const texto = questao[`alt_${letraLower}_texto` as keyof QuestaoEnem] as string | null
    const imagemRaw = questao[`alt_${letraLower}_imagem` as keyof QuestaoEnem] as string | null
    const imagem = getEnemImageUrl(imagemRaw)
    return { letra, texto, imagem }
  }).filter(a => a.texto || a.imagem) : []

  // Renderizar elementos do enunciado ENEM
  const renderElementos = (elementos: ElementoEnem[] | null | undefined) => {
    if (!elementos || !Array.isArray(elementos)) return null
    return elementos.map((elem, idx) => {
      // Pular elementos null dentro do array
      if (!elem) return null
      if (elem.tipo === 'titulo' && elem.conteudo) {
        return (
          <h3 key={idx} className="font-bold text-sm sm:text-base mb-2" style={{ color: 'var(--text-primary)' }}>
            {elem.conteudo}
          </h3>
        )
      }
      if (elem.tipo === 'texto' && elem.conteudo) {
        // Extrair título e fonte do próprio elemento (campos do JSONB)
        const fonteDoElemento = elem.fonte

        // Título: usar campo do JSONB ou extrair automaticamente do texto
        let tituloExtraido: string | null = elem.titulo || null
        let corpoTexto = elem.conteudo

        // Se não tem título no campo, tentar extrair do início do texto
        if (!tituloExtraido) {
          const { titulo, corpo } = extrairTituloDoTexto(elem.conteudo)
          if (titulo) {
            tituloExtraido = titulo
            corpoTexto = corpo
          }
        }

        return (
          <div key={idx} className="mb-3">
            {/* Título do texto (do campo JSONB ou extraído automaticamente) */}
            {tituloExtraido && (
              <h4 className="font-bold text-sm sm:text-base mb-2 text-center" style={{ color: 'var(--text-primary)' }}>
                {tituloExtraido}
              </h4>
            )}

            {/* Conteúdo do texto (sem o título se foi extraído) */}
            <ConteudoQuestao conteudo={corpoTexto} tipo="contexto" separarFonte={!fonteDoElemento} />

            {/* Fonte/referência (se existir no campo fonte do elemento) */}
            {fonteDoElemento && (
              <p className="text-xs italic mt-2 text-right" style={{ color: 'var(--text-muted)' }}>
                {fonteDoElemento}
              </p>
            )}
          </div>
        )
      }
      if (elem.tipo === 'comando' && elem.conteudo) {
        return (
          <div key={idx} className="mb-2 font-medium">
            <ConteudoQuestao conteudo={elem.conteudo} tipo="comando" />
          </div>
        )
      }
      if (elem.tipo === 'imagem' && elem.arquivo) {
        const imagemUrl = getEnemImageUrl(elem.arquivo)
        if (!imagemUrl) return null
        return (
          <div key={idx} className="my-3 flex flex-col items-center">
            <button onClick={() => setImagemExpandida(imagemUrl)}>
              <SafeImage
                src={imagemUrl}
                alt={elem.conteudo || elem.legenda || elem.descricao || 'Imagem da questão'}
                width={500}
                height={300}
                className="rounded-lg max-w-full h-auto cursor-zoom-in"
                style={{ maxHeight: '300px', objectFit: 'contain' }}
              />
            </button>
            {/* Legenda ou descrição da imagem */}
            {(elem.legenda || elem.descricao) && (
              <p className="text-xs italic mt-1 text-center" style={{ color: 'var(--text-muted)' }}>
                {elem.legenda || elem.descricao}
              </p>
            )}
          </div>
        )
      }
      if (elem.tipo === 'fonte' && elem.conteudo) {
        return (
          <p key={idx} className="text-xs italic mt-2 text-right" style={{ color: 'var(--text-muted)' }}>
            {elem.conteudo}
          </p>
        )
      }
      return null
    })
  }

  if (loading && !questao && status !== 'FILTRO') {
    return <Loading fullScreen componente={componente} />
  }

  // Tela de filtros
  if (status === 'FILTRO' || mostrarFiltros) {
    return (
      <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
        <NavigationRail componente={componente} />

        <header className="header-chromebook flex-shrink-0">
          <div className="max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto flex items-center gap-2">
            <BackButton href={`/${componente}/menu`} mobileOnly />
            <GraduationCap className="w-5 h-5" style={{ color: corPrimaria }} />
            <span className="font-semibold text-sm lg:text-base" style={{ color: 'var(--text-primary)' }}>
              Simulado ENEM
            </span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 max-w-md w-full animate-fade-in-up"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.15)' }}
              >
                <GraduationCap className="w-7 h-7" style={{ color: corPrimaria }} />
              </div>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Simulado ENEM
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Pratique com questões reais do ENEM
              </p>
            </div>

            {/* Filtros */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Ano</label>
                <select
                  value={filtroAno}
                  onChange={e => setFiltroAno(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                >
                  <option value="">Todos os anos</option>
                  <option value="2025">ENEM 2025</option>
                  <option value="2024">ENEM 2024</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Dia da Prova</label>
                <select
                  value={filtroDia}
                  onChange={e => setFiltroDia(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                >
                  <option value="">Todos os dias</option>
                  <option value="1">Dia 1 - Linguagens e Humanas</option>
                  <option value="2">Dia 2 - Natureza e Matemática</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Área</label>
                <select
                  value={filtroArea}
                  onChange={e => setFiltroArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                >
                  <option value="">Todas as áreas</option>
                  {Object.entries(AREAS_ENEM).map(([full, short]) => (
                    <option key={full} value={full}>{short}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estatísticas rápidas */}
            {progresso && (
              <div className="flex justify-around mb-4 py-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: corPrimaria }}>{progresso.respondidas}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Respondidas</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{progresso.restantes}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Restantes</div>
                </div>
              </div>
            )}

            <Button
              variant="secondary"
              onClick={buscarQuestao}
              className="w-full min-h-[48px] text-base"
              style={{ background: corPrimaria, color: 'white', border: 'none' }}
            >
              Começar
            </Button>
          </div>
        </main>

        <BottomNav componente={componente} />
      </div>
    )
  }

  return (
    <div className="min-h-screen lg:h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {status === 'OK' && questao ? (
        <>
          {/* HEADER */}
          <header className="header-chromebook flex-shrink-0">
            <div className="max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
              <div className="flex items-center gap-2 lg:gap-3">
                <BackButton href={`/${componente}/menu`} mobileOnly />

                <div className="hidden lg:flex items-center gap-1.5">
                  <span className="badge-chromebook" style={{ background: 'rgba(99,102,241,0.15)', color: corPrimaria }}>
                    ENEM {questao.ano}
                  </span>
                  <span className="badge-chromebook" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    D{questao.dia} Q{questao.numero}
                  </span>
                  <span className="badge-chromebook" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    {AREAS_ENEM[questao.area] || questao.area}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-1 lg:flex-none lg:ml-auto">
                  <GraduationCap className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: corPrimaria }} />
                  <span className="font-semibold text-sm lg:text-base" style={{ color: 'var(--text-primary)' }}>
                    ENEM
                  </span>
                </div>

                <div className="timer-chromebook" style={{ color: corPrimaria }}>
                  <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  <span>{formatarTempo(tempoDecorrido)}</span>
                </div>

                {/* Botão filtros */}
                <button
                  onClick={() => { pararTimer(); setMostrarFiltros(true); setStatus('FILTRO') }}
                  className="p-1.5 rounded-lg"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  <Filter className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              {/* Tags mobile */}
              <div className="flex lg:hidden items-center gap-1.5 mt-1.5">
                <span className="badge-chromebook" style={{ background: 'rgba(99,102,241,0.15)', color: corPrimaria }}>
                  ENEM {questao.ano} D{questao.dia}
                </span>
                <span className="badge-chromebook" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  Q{questao.numero}
                </span>
                <span className="badge-chromebook" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {AREAS_ENEM[questao.area] || questao.area}
                </span>
              </div>
            </div>
          </header>

          {/* CONTEÚDO */}
          <main className="flex-1 max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto w-full flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-3 py-2 lg:px-8 lg:py-4 xl:px-10">
              <div className="space-chromebook">

                {/* Elementos do enunciado */}
                <div className="card-chromebook">
                  {renderElementos(questao.elementos)}
                  {/* Fallback: mostrar comando se não houver elementos */}
                  {(!questao.elementos || questao.elementos.length === 0) && questao.comando && (
                    <div className="font-medium">
                      <ConteudoQuestao conteudo={questao.comando} tipo="comando" />
                    </div>
                  )}
                </div>

                {/* Alternativas */}
                <div className="space-chromebook">
                  {alternativas.map(({ letra, texto, imagem }) => {
                    const style = getAlternativaStyle(letra)
                    return (
                      <button
                        key={letra}
                        onClick={() => !feedback && !respondendo && setSelecionada(letra)}
                        disabled={!!feedback || respondendo}
                        className="alternativa-chromebook"
                        style={style}
                      >
                        <span
                          className="alternativa-letra-compact"
                          style={{
                            background: feedback && feedback.gabarito === letra
                              ? 'var(--success)'
                              : feedback && !feedback.correta && letra === selecionada
                                ? 'var(--error)'
                                : selecionada === letra
                                  ? corPrimaria
                                  : 'var(--bg-elevated)',
                            color: (feedback && (feedback.gabarito === letra || (letra === selecionada && !feedback.correta))) || selecionada === letra
                              ? 'white'
                              : 'var(--text-muted)',
                          }}
                        >
                          {feedback && feedback.gabarito === letra ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : feedback && !feedback.correta && letra === selecionada ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            letra
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          {imagem && (
                            <div className="mb-1">
                              <button onClick={(e) => { e.stopPropagation(); setImagemExpandida(imagem) }}>
                                <SafeImage
                                  src={imagem}
                                  alt={`Alternativa ${letra}`}
                                  width={300}
                                  height={150}
                                  className="rounded max-w-full h-auto cursor-zoom-in"
                                  style={{ maxHeight: '120px', objectFit: 'contain' }}
                                />
                              </button>
                            </div>
                          )}
                          {texto && (
                            <span className="texto-alternativa-chromebook" style={{ color: 'var(--text-primary)' }}>
                              {formatarFormula(texto)}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Feedback */}
                {feedback && (
                  <div
                    className="feedback-chromebook flex items-center gap-2"
                    style={{
                      background: feedback.anulada
                        ? 'var(--warning-bg-15)'
                        : feedback.correta
                          ? 'var(--success-bg-15)'
                          : 'var(--error-bg-15)',
                      border: `1px solid ${feedback.anulada ? 'var(--warning-bg-40)' : feedback.correta ? 'var(--success-bg-40)' : 'var(--error-bg-40)'}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 lg:w-4 lg:h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        background: feedback.anulada
                          ? 'var(--warning-bg-20)'
                          : feedback.correta
                            ? 'var(--success-bg-20)'
                            : 'var(--error-bg-20)',
                      }}
                    >
                      {feedback.anulada ? (
                        <AlertTriangle className="w-3 h-3" style={{ color: 'var(--warning)' }} />
                      ) : feedback.correta ? (
                        <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--success)' }} />
                      ) : (
                        <XCircle className="w-3 h-3" style={{ color: 'var(--error)' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{
                          color: feedback.anulada ? 'var(--warning)' : feedback.correta ? 'var(--success)' : 'var(--error)'
                        }}>
                          {feedback.anulada ? 'Questão Anulada' : feedback.correta ? 'Correto!' : 'Incorreto'}
                        </span>
                        {!feedback.anulada && !feedback.correta && feedback.gabarito && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Gabarito: <strong>{feedback.gabarito}</strong>
                          </span>
                        )}
                        {feedback.estatisticas && (
                          <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>
                            {feedback.estatisticas.percentual_acerto}% acerto ({feedback.estatisticas.total_corretas}/{feedback.estatisticas.total_respondidas})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Erro */}
                {erro && (
                  <div className="feedback-chromebook" style={{ background: 'var(--error-bg-15)', border: '1px solid var(--error-bg-30)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>{erro}</p>
                  </div>
                )}

                {/* Botões */}
                <div className="flex gap-2 mt-2 lg:mt-1.5">
                  {feedback ? (
                    <>
                      <Button variant="secondary" onClick={handleVoltar} className="flex-1 btn-chromebook">
                        Menu
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={buscarQuestao}
                        className="flex-1 btn-chromebook"
                        style={{ background: corPrimaria, color: 'white', border: 'none' }}
                      >
                        Próxima
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={handleConfirmar}
                      disabled={!selecionada || respondendo}
                      loading={respondendo}
                      className="w-full btn-chromebook"
                      style={selecionada ? { background: corPrimaria, color: 'white', border: 'none' } : {}}
                    >
                      {selecionada ? 'Confirmar' : 'Selecione'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </>
      ) : (
        /* Telas de status */
        <main className="flex-1 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 text-center animate-fade-in-up max-w-md w-full"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: status === 'ERRO' ? 'var(--error-bg-15)'
                  : status === 'COMPLETOU' ? 'rgba(99,102,241,0.15)'
                  : 'var(--bg-elevated)',
              }}
            >
              {status === 'COMPLETOU' && <CheckCircle2 className="w-7 h-7" style={{ color: corPrimaria }} />}
              {status === 'ERRO' && <XCircle className="w-7 h-7" style={{ color: 'var(--error)' }} />}
              {status === 'SEM_QUESTOES' && <BookOpen className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />}
            </div>

            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {status === 'COMPLETOU' && 'Parabéns!'}
              {status === 'ERRO' && 'Ops! Erro'}
              {status === 'SEM_QUESTOES' && 'Sem Questões'}
            </h2>

            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {status === 'COMPLETOU' && 'Você completou todas as questões ENEM com esses filtros!'}
              {status === 'ERRO' && erro}
              {status === 'SEM_QUESTOES' && 'Nenhuma questão disponível com esses filtros.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {status === 'ERRO' && (
                <Button variant="secondary" onClick={buscarQuestao} leftIcon={<RefreshCw className="w-4 h-4" />}>
                  Tentar Novamente
                </Button>
              )}
              {(status === 'COMPLETOU' || status === 'SEM_QUESTOES') && (
                <Button variant="secondary" onClick={() => { setMostrarFiltros(true); setStatus('FILTRO') }}>
                  Mudar Filtros
                </Button>
              )}
              <Button variant="secondary" onClick={handleVoltar} style={{ background: corPrimaria, color: 'white', border: 'none' }}>
                Voltar ao Menu
              </Button>
            </div>
          </div>
        </main>
      )}

      <BottomNav componente={componente} />

      {/* Modal de imagem */}
      {imagemExpandida && (
        <ImagemModal
          src={imagemExpandida}
          alt="Imagem ampliada"
          onClose={() => setImagemExpandida(null)}
        />
      )}
    </div>
  )
}
