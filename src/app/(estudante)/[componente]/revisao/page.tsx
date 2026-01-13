'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { RotateCcw, CheckCircle2, XCircle, WifiOff, RefreshCw, BookOpen, Clock, Lightbulb, Trophy, AlertCircle } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Questao } from '@/types'
import { formatarFormula } from '@/lib/formatacao'

type StatusRevisao = 'OK' | 'SEM_REVISAO' | 'ERRO'
type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E'

interface FeedbackData {
  correta: boolean
  respostaCorreta: Alternativa
  explicacao: string
  pontosGanhos: number
  conquistasDesbloqueadas: { nome: string; icone: string }[]
}

export default function RevisaoPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [questao, setQuestao] = useState<Questao | null>(null)
  const [status, setStatus] = useState<StatusRevisao | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [totalRevisao, setTotalRevisao] = useState(0)
  const [errouEm, setErrouEm] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [selecionada, setSelecionada] = useState<Alternativa | null>(null)
  const [mostrarDica, setMostrarDica] = useState(false)
  const [usouDica, setUsouDica] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [respondendo, setRespondendo] = useState(false)

  const isFisica = componente === 'fisica'
  const nomeComponente = isFisica ? 'Física' : 'Matemática'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const buscarQuestao = async () => {
    setLoading(true)
    setErro(null)
    setSelecionada(null)
    setMostrarDica(false)
    setUsouDica(false)
    setFeedback(null)

    try {
      const response = await fetch(`/api/questoes/revisao?componente=${componente}`)
      const data = await response.json()

      if (data.sucesso) {
        setStatus(data.status)
        if (data.status === 'OK' && data.questao) {
          setQuestao(data.questao)
          setTotalRevisao(data.total_revisao)
          setErrouEm(data.errou_em)
          setTempoDecorrido(0)
          iniciarTimer()
        } else {
          setQuestao(null)
          setTotalRevisao(0)
        }
      } else {
        setStatus('ERRO')
        setErro(data.erro || 'Erro ao carregar questão')
      }
    } catch (error) {
      console.error('Erro ao buscar questão:', error)
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
    return () => pararTimer()
  }, [componente])

  const handleVoltar = () => router.push(`/${componente}/menu`)

  const handleConfirmar = async () => {
    if (!selecionada || !questao) return

    setRespondendo(true)
    pararTimer()

    try {
      const response = await fetch('/api/questoes/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questao_id: questao.id,
          componente,
          resposta: selecionada,
          tempo_segundos: tempoDecorrido,
          usou_dica: usouDica,
          modo: 'revisao',
        }),
      })

      const data = await response.json()

      if (data.sucesso) {
        setFeedback({
          correta: data.correta,
          respostaCorreta: data.resposta_correta as Alternativa,
          explicacao: data.explicacao || '',
          pontosGanhos: data.pontos_ganhos,
          conquistasDesbloqueadas: data.conquistas_desbloqueadas || [],
        })

        if (data.correta && totalRevisao > 0) {
          setTotalRevisao(prev => prev - 1)
        }
      } else {
        setErro(data.erro || 'Não foi possível registrar sua resposta.')
      }
    } catch (error) {
      console.error('Erro ao responder:', error)
      setErro('Erro de conexão. Verifique sua internet.')
    } finally {
      setRespondendo(false)
    }
  }

  const getAlternativaStyle = (letra: Alternativa) => {
    if (feedback) {
      if (feedback.correta && letra === selecionada) {
        return { background: 'rgba(34, 197, 94, 0.2)', border: '2px solid var(--success)' }
      }
      if (!feedback.correta && letra === selecionada) {
        return { background: 'rgba(239, 68, 68, 0.2)', border: '2px solid var(--error)' }
      }
      return { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', opacity: 0.5 }
    }
    if (selecionada === letra) {
      return { background: 'rgba(245, 158, 11, 0.15)', border: '2px solid var(--warning)' }
    }
    return { background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }
  }

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}:${seg.toString().padStart(2, '0')}`
  }

  const formatarDataErro = (data: string) => {
    const d = new Date(data)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  if (loading && !questao) {
    return <Loading fullScreen componente={componente} />
  }

  const alternativas = questao ? [
    { letra: 'A' as Alternativa, texto: questao.alternativa_a },
    { letra: 'B' as Alternativa, texto: questao.alternativa_b },
    { letra: 'C' as Alternativa, texto: questao.alternativa_c },
    { letra: 'D' as Alternativa, texto: questao.alternativa_d },
    ...(questao.alternativa_e ? [{ letra: 'E' as Alternativa, texto: questao.alternativa_e }] : []),
  ] : []

  const dificuldadeLabel = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' } as const
  const dificuldadeColor = { facil: '#10b981', medio: '#f59e0b', dificil: '#ef4444' } as const

  return (
    <div className="min-h-screen lg:h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {status === 'OK' && questao ? (
        <>
          {/* ══════════════════════════════════════════════════════════════════
              HEADER ULTRA COMPACTO
              ══════════════════════════════════════════════════════════════════ */}
          <header className="header-chromebook flex-shrink-0">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-2 lg:gap-3">
                <BackButton href={`/${componente}/menu`} mobileOnly />

                {/* Tags inline - desktop */}
                <div className="hidden lg:flex items-center gap-1.5">
                  <span className="badge-chromebook" style={{ background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)', color: corPrimaria }}>
                    {questao.tema}
                  </span>
                  <span className="badge-chromebook" style={{ background: 'var(--bg-elevated)', color: dificuldadeColor[questao.dificuldade] }}>
                    {dificuldadeLabel[questao.dificuldade]}
                  </span>
                  <span className="badge-chromebook" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                    Revisão
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-1 lg:flex-none lg:ml-auto">
                  <RotateCcw className="w-4 h-4 lg:w-3.5 lg:h-3.5" style={{ color: 'var(--warning)' }} />
                  <span className="font-semibold text-sm lg:text-xs" style={{ color: 'var(--text-primary)' }}>
                    Revisar
                  </span>
                </div>

                {/* Timer */}
                <div className="timer-chromebook" style={{ color: 'var(--warning)' }}>
                  <Clock className="w-3.5 h-3.5 lg:w-3 lg:h-3" />
                  <span>{formatarTempo(tempoDecorrido)}</span>
                </div>

                {/* Progress inline - desktop */}
                {totalRevisao > 0 && (
                  <div className="hidden lg:flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: Math.min(totalRevisao, 10) }).map((_, index) => (
                        <div key={index} className="w-1.5 h-3 rounded-sm" style={{ background: 'var(--warning)' }} />
                      ))}
                    </div>
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {totalRevisao} pend.
                    </span>
                  </div>
                )}
              </div>

              {/* Progress mobile */}
              {totalRevisao > 0 && (
                <div className="flex lg:hidden items-center gap-2 mt-1.5">
                  <div className="flex gap-0.5 flex-1">
                    {Array.from({ length: Math.min(totalRevisao, 10) }).map((_, index) => (
                      <div key={index} className="flex-1 h-1 rounded-full" style={{ background: 'var(--warning)' }} />
                    ))}
                  </div>
                  <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {totalRevisao} pendentes
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* ══════════════════════════════════════════════════════════════════
              CONTEÚDO - Tudo junto sem espaço extra
              ══════════════════════════════════════════════════════════════════ */}
          <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col min-h-0 overflow-hidden">
            {/* Container único scrollável */}
            <div className="flex-1 overflow-y-auto px-3 py-2 lg:px-4 lg:py-1.5">
              <div className="space-chromebook">
                {/* Info de quando errou - só mobile */}
                {errouEm && (
                  <div className="lg:hidden px-2 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <AlertCircle className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--warning)' }} />
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      Você errou em {formatarDataErro(errouEm)}
                    </span>
                  </div>
                )}

                {/* Tags mobile */}
                <div className="flex lg:hidden items-center gap-1.5">
                  <span className="badge-chromebook" style={{ background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)', color: corPrimaria }}>
                    {questao.tema}
                  </span>
                  <span className="badge-chromebook" style={{ background: 'var(--bg-elevated)', color: dificuldadeColor[questao.dificuldade] }}>
                    {dificuldadeLabel[questao.dificuldade]}
                  </span>
                  <span className="badge-chromebook" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                    Revisão
                  </span>
                </div>

                {/* Enunciado */}
                <div className="card-chromebook">
                  <p className="enunciado-chromebook" style={{ color: 'var(--text-primary)' }}>
                    {formatarFormula(questao.enunciado)}
                  </p>
                </div>

                {/* Alternativas - Ultra compactas */}
                <div className="space-chromebook">
                  {alternativas.map(({ letra, texto }) => {
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
                            background: feedback && feedback.correta && letra === selecionada
                              ? 'var(--success)'
                              : feedback && !feedback.correta && letra === selecionada
                                ? 'var(--error)'
                                : selecionada === letra
                                  ? 'var(--warning)'
                                  : 'var(--bg-elevated)',
                            color: (feedback && letra === selecionada) || selecionada === letra
                              ? '#000'
                              : 'var(--text-muted)',
                          }}
                        >
                          {feedback && feedback.correta && letra === selecionada ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : feedback && !feedback.correta && letra === selecionada ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            letra
                          )}
                        </span>
                        <span className="texto-alternativa-chromebook flex-1" style={{ color: 'var(--text-primary)' }}>
                          {formatarFormula(texto)}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Dica - compacta */}
                {!feedback && questao.dica && (
                  <div>
                    {mostrarDica ? (
                      <div className="feedback-chromebook" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed var(--border-default)' }}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <Lightbulb className="icon-chromebook" style={{ color: 'var(--warning)' }} />
                          <span className="text-[10px] font-medium" style={{ color: 'var(--warning)' }}>Dica</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)' }}>{formatarFormula(questao.dica)}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setMostrarDica(true); setUsouDica(true) }}
                        className="w-full py-1.5 lg:py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs lg:text-[11px]"
                        style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-default)', color: 'var(--text-muted)' }}
                      >
                        <Lightbulb className="icon-chromebook" />
                        <span>Ver dica</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Feedback compacto */}
                {feedback && (
                  <div
                    className="feedback-chromebook flex items-center gap-2"
                    style={{
                      background: feedback.correta ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      border: `1px solid ${feedback.correta ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 lg:w-4 lg:h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: feedback.correta ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}
                    >
                      {feedback.correta ? <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--success)' }} /> : <XCircle className="w-3 h-3" style={{ color: 'var(--error)' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: feedback.correta ? 'var(--success)' : 'var(--error)' }}>
                          {feedback.correta ? 'Correto!' : 'Incorreto'}
                        </span>
                        {feedback.correta && feedback.pontosGanhos > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)' }}>
                            +{feedback.pontosGanhos} pts
                          </span>
                        )}
                        <span className="text-[10px] ml-auto" style={{ color: feedback.correta ? 'var(--success)' : 'var(--text-muted)' }}>
                          {feedback.correta ? 'Removida da revisão' : 'Tente novamente'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conquistas - inline */}
                {feedback && feedback.conquistasDesbloqueadas.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
                    {feedback.conquistasDesbloqueadas.map((c, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}>
                        {c.icone} {c.nome}
                      </span>
                    ))}
                  </div>
                )}

                {/* Erro */}
                {erro && (
                  <div className="feedback-chromebook" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>{erro}</p>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    BOTÕES - Logo abaixo do conteúdo (sem espaço extra)
                    ══════════════════════════════════════════════════════════════════ */}
                <div className="mt-2 lg:mt-1.5">
                  {feedback ? (
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={handleVoltar} className="flex-1 btn-chromebook">
                        Menu
                      </Button>
                      <button
                        onClick={buscarQuestao}
                        className="flex-1 btn-chromebook rounded-lg font-semibold transition-all active:scale-[0.98]"
                        style={{ background: 'var(--warning)', color: '#000' }}
                      >
                        Próxima
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleConfirmar}
                      disabled={!selecionada || respondendo}
                      className="w-full btn-chromebook rounded-lg font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                      style={{
                        background: selecionada ? 'var(--warning)' : 'var(--bg-elevated)',
                        color: selecionada ? '#000' : 'var(--text-muted)'
                      }}
                    >
                      {respondendo ? 'Enviando...' : selecionada ? 'Confirmar' : 'Selecione'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </>
      ) : status === 'SEM_REVISAO' ? (
        /* ══════════════════════════════════════════════════════════════════
           TUDO REVISADO
           ══════════════════════════════════════════════════════════════════ */
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="card-chromebook p-6 text-center max-w-md w-full">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)', border: `1px solid ${corPrimaria}` }}
            >
              <CheckCircle2 className="w-6 h-6" style={{ color: corPrimaria }} />
            </div>

            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Tudo Revisado!
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              Você não tem questões de {nomeComponente} para revisar. Continue estudando!
            </p>

            <div className="flex gap-2 justify-center">
              <Button variant="secondary" onClick={() => router.push(`/${componente}/estudar`)} leftIcon={<BookOpen className="w-3.5 h-3.5" />} className="btn-chromebook">
                Estudar
              </Button>
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={handleVoltar} className="btn-chromebook">
                Menu
              </Button>
            </div>
          </div>
        </main>
      ) : status === 'ERRO' ? (
        /* ══════════════════════════════════════════════════════════════════
           ERRO
           ══════════════════════════════════════════════════════════════════ */
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="card-chromebook p-6 text-center max-w-md w-full">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <WifiOff className="w-6 h-6" style={{ color: 'var(--error)' }} />
            </div>

            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Erro</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{erro}</p>

            <div className="flex gap-2 justify-center">
              <Button variant="secondary" onClick={buscarQuestao} leftIcon={<RefreshCw className="w-3.5 h-3.5" />} className="btn-chromebook">
                Tentar
              </Button>
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={handleVoltar} className="btn-chromebook">
                Menu
              </Button>
            </div>
          </div>
        </main>
      ) : null}

      <BottomNav componente={componente} />
    </div>
  )
}
