'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BookOpen, CheckCircle2, XCircle, WifiOff, RefreshCw, AlertTriangle, Calendar, Zap, Clock, Lightbulb, Trophy, TrendingUp } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Questao } from '@/types'
import { formatarFormula } from '@/lib/formatacao'

type StatusQuestao = 'OK' | 'SEM_QUESTOES' | 'COMPLETOU' | 'ERRO' | 'LIMITE_SEMANAL' | 'FORA_PERIODO'
type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E'

interface LimiteInfo {
  questoes_semana: number
  limite_semanal: number | null
  restantes: number | null
  pode_responder: boolean
}

interface NotaTempoReal {
  nota_anterior: number
  nota_atual: number
  mudou: boolean
  questoes_respondidas: number
  meta_questoes: number
  percentual: number
  dias_ativos: number
  bonus_frequencia: number
  questoes_semana: number
  limite_semanal: number | null
  pode_continuar: boolean
}

interface FeedbackData {
  correta: boolean
  respostaCorreta: Alternativa
  explicacao: string
  pontosGanhos: number
  conquistasDesbloqueadas: { nome: string; icone: string }[]
  notaTempoReal: NotaTempoReal | null
}

export default function EstudarPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [questao, setQuestao] = useState<Questao | null>(null)
  const [status, setStatus] = useState<StatusQuestao | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [limite, setLimite] = useState<LimiteInfo | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Estados da questão
  const [selecionada, setSelecionada] = useState<Alternativa | null>(null)
  const [mostrarDica, setMostrarDica] = useState(false)
  const [usouDica, setUsouDica] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [respondendo, setRespondendo] = useState(false)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const buscarQuestao = async () => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setErro(null)
    setSelecionada(null)
    setMostrarDica(false)
    setUsouDica(false)
    setFeedback(null)

    try {
      const response = await fetch(`/api/questoes?componente=${componente}&modo=estudo`, {
        signal: abortControllerRef.current.signal
      })
      const data = await response.json()

      if (data.sucesso) {
        setStatus(data.status)
        setLimite(data.limite || null)

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
      // Ignorar erros de requisição cancelada (componente desmontado)
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
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
    return () => {
      pararTimer()
      // Cancelar requisições pendentes ao desmontar
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
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
          modo: 'estudo',
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
          notaTempoReal: data.nota_tempo_real || null,
        })

        if (data.nota_tempo_real) {
          setLimite({
            questoes_semana: data.nota_tempo_real.questoes_semana,
            limite_semanal: data.nota_tempo_real.limite_semanal,
            restantes: data.nota_tempo_real.limite_semanal
              ? data.nota_tempo_real.limite_semanal - data.nota_tempo_real.questoes_semana
              : null,
            pode_responder: data.nota_tempo_real.pode_continuar,
          })
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
        return { background: 'var(--success-bg-20)', border: '2px solid var(--success)' }
      }
      if (!feedback.correta && letra === selecionada) {
        return { background: 'var(--error-bg-20)', border: '2px solid var(--error)' }
      }
      return { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', opacity: 0.5 }
    }
    if (selecionada === letra) {
      return {
        background: isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)',
        border: `2px solid ${corPrimaria}`,
      }
    }
    return { background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }
  }

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}:${seg.toString().padStart(2, '0')}`
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
  const dificuldadeColor = { facil: 'var(--difficulty-easy)', medio: 'var(--difficulty-medium)', dificil: 'var(--difficulty-hard)' } as const

  return (
    <div className="min-h-screen lg:h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {status === 'OK' && questao ? (
        <>
          {/* ══════════════════════════════════════════════════════════════
              HEADER ULTRA COMPACTO
              ══════════════════════════════════════════════════════════════ */}
          <header className="header-chromebook flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              {/* Linha única: Back + Tags + Título + Timer + Progress */}
              <div className="flex items-center gap-2 lg:gap-3">
                <BackButton href={`/${componente}/menu`} mobileOnly />

                {/* Tags inline - só no desktop */}
                <div className="hidden lg:flex items-center gap-1.5">
                  <span className="badge-chromebook" style={{ background: isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)', color: corPrimaria }}>
                    {questao.tema}
                  </span>
                  <span className="badge-chromebook" style={{ background: 'var(--bg-elevated)', color: dificuldadeColor[questao.dificuldade] }}>
                    {dificuldadeLabel[questao.dificuldade]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-1 lg:flex-none lg:ml-auto">
                  <BookOpen className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: corPrimaria }} />
                  <span className="font-semibold text-sm lg:text-base" style={{ color: 'var(--text-primary)' }}>
                    Estudar
                  </span>
                </div>

                {/* Timer */}
                <div className="timer-chromebook" style={{ color: corPrimaria }}>
                  <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  <span>{formatarTempo(tempoDecorrido)}</span>
                </div>

                {/* Progress inline - só desktop */}
                {limite && limite.limite_semanal !== null && (
                  <div className="hidden lg:flex items-center gap-1.5">
                    <div className="w-24 h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((limite.questoes_semana / limite.limite_semanal) * 100, 100)}%`,
                          background: corPrimaria,
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                      {limite.questoes_semana}/{limite.limite_semanal}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress mobile - linha separada */}
              {limite && limite.limite_semanal !== null && (
                <div className="flex lg:hidden items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((limite.questoes_semana / limite.limite_semanal) * 100, 100)}%`,
                        background: corPrimaria,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {limite.questoes_semana}/{limite.limite_semanal}
                  </span>
                </div>
              )}
            </div>
          </header>

          {/* ══════════════════════════════════════════════════════════════
              CONTEÚDO - Tudo junto sem espaço extra
              ══════════════════════════════════════════════════════════════ */}
          <main className="flex-1 max-w-3xl mx-auto w-full flex flex-col min-h-0 overflow-hidden">
            {/* Container único scrollável - conteúdo + botão juntos */}
            <div className="flex-1 overflow-y-auto px-3 py-2 lg:px-6 lg:py-4">
              <div className="space-chromebook">
                {/* Tags mobile */}
                <div className="flex lg:hidden items-center gap-1.5 mb-1">
                  <span className="badge-chromebook" style={{ background: isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)', color: corPrimaria }}>
                    {questao.tema}
                  </span>
                  <span className="badge-chromebook" style={{ background: 'var(--bg-elevated)', color: dificuldadeColor[questao.dificuldade] }}>
                    {dificuldadeLabel[questao.dificuldade]}
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
                                  ? corPrimaria
                                  : 'var(--bg-elevated)',
                            color: (feedback && letra === selecionada) || selecionada === letra
                              ? isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)'
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
                      <div className="feedback-chromebook" style={{ background: isFisica ? 'var(--color-fisica-bg-10)' : 'var(--color-matematica-bg-10)', border: '1px dashed var(--border-default)' }}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <Lightbulb className="icon-chromebook" style={{ color: corPrimaria }} />
                          <span className="text-[10px] font-medium" style={{ color: corPrimaria }}>Dica</span>
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
                        <span>Ver dica (-5 pts)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Feedback compacto */}
                {feedback && (
                  <div
                    className="feedback-chromebook flex items-center gap-2"
                    style={{
                      background: feedback.correta ? 'var(--success-bg-15)' : 'var(--error-bg-15)',
                      border: `1px solid ${feedback.correta ? 'var(--success-bg-40)' : 'var(--error-bg-40)'}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 lg:w-4 lg:h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: feedback.correta ? 'var(--success-bg-20)' : 'var(--error-bg-20)' }}
                    >
                      {feedback.correta ? <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--success)' }} /> : <XCircle className="w-3 h-3" style={{ color: 'var(--error)' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: feedback.correta ? 'var(--success)' : 'var(--error)' }}>
                          {feedback.correta ? 'Correto!' : 'Incorreto'}
                        </span>
                        {feedback.correta && feedback.pontosGanhos > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--success-bg-20)', color: 'var(--success)' }}>
                            +{feedback.pontosGanhos} pts
                          </span>
                        )}
                        {feedback.notaTempoReal && (
                          <span className="text-[10px] ml-auto" style={{ color: 'var(--text-muted)' }}>
                            Nota: <strong style={{ color: feedback.notaTempoReal.nota_atual >= 7 ? 'var(--success)' : feedback.notaTempoReal.nota_atual >= 5 ? 'var(--warning)' : 'var(--error)' }}>
                              {feedback.notaTempoReal.nota_atual.toFixed(1)}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conquistas - inline e compacto */}
                {feedback && feedback.conquistasDesbloqueadas.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
                    {feedback.conquistasDesbloqueadas.map((c, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--warning-bg-15)', color: 'var(--warning)' }}>
                        {c.icone} {c.nome}
                      </span>
                    ))}
                  </div>
                )}

                {/* Erro */}
                {erro && (
                  <div className="feedback-chromebook" style={{ background: 'var(--error-bg-15)', border: '1px solid var(--error-bg-30)' }}>
                    <p style={{ color: 'var(--text-secondary)' }}>{erro}</p>
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    BOTÕES - Logo abaixo do conteúdo (sem espaço extra)
                    ══════════════════════════════════════════════════════════════ */}
                <div className="flex gap-2 mt-2 lg:mt-1.5">
                  {feedback ? (
                    <>
                      <Button variant="secondary" onClick={handleVoltar} className="flex-1 btn-chromebook">
                        Menu
                      </Button>
                      {feedback.notaTempoReal?.pode_continuar !== false ? (
                        <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={buscarQuestao} className="flex-1 btn-chromebook">
                          Próxima
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => router.push(`/${componente}/desafio`)} className="flex-1 btn-chromebook" leftIcon={<Zap className="w-4 h-4 lg:w-5 lg:h-5" />}>
                          Desafio
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant={isFisica ? 'fisica' : 'matematica'}
                      onClick={handleConfirmar}
                      disabled={!selecionada || respondendo}
                      loading={respondendo}
                      className="w-full btn-chromebook"
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
        /* ══════════════════════════════════════════════════════════════════
           TELA DE STATUS (limite, erro, etc)
           ══════════════════════════════════════════════════════════════════ */
        <main className="flex-1 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 text-center animate-fade-in-up max-w-md w-full"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: status === 'LIMITE_SEMANAL' ? 'var(--warning-bg-15)'
                  : status === 'ERRO' ? 'var(--error-bg-15)'
                  : status === 'COMPLETOU' ? isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)'
                  : 'var(--bg-elevated)',
              }}
            >
              {status === 'LIMITE_SEMANAL' && <AlertTriangle className="w-7 h-7" style={{ color: 'var(--warning)' }} />}
              {status === 'FORA_PERIODO' && <Calendar className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />}
              {status === 'COMPLETOU' && <CheckCircle2 className="w-7 h-7" style={{ color: corPrimaria }} />}
              {status === 'ERRO' && <WifiOff className="w-7 h-7" style={{ color: 'var(--error)' }} />}
              {status === 'SEM_QUESTOES' && <BookOpen className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />}
            </div>

            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {status === 'LIMITE_SEMANAL' && 'Limite Semanal Atingido'}
              {status === 'FORA_PERIODO' && 'Fora do Período Letivo'}
              {status === 'COMPLETOU' && 'Parabéns!'}
              {status === 'ERRO' && 'Ops! Erro'}
              {status === 'SEM_QUESTOES' && 'Sem Questões'}
            </h2>

            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {status === 'LIMITE_SEMANAL' && `Você respondeu ${limite?.questoes_semana || limite?.limite_semanal || 70} questões esta semana. Volte na segunda ou use o modo Desafio!`}
              {status === 'FORA_PERIODO' && 'Use o modo Desafio para praticar!'}
              {status === 'COMPLETOU' && 'Você completou todas as questões!'}
              {status === 'ERRO' && erro}
              {status === 'SEM_QUESTOES' && 'Ainda não há questões para seu ano.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {(status === 'LIMITE_SEMANAL' || status === 'FORA_PERIODO') && (
                <Button variant="secondary" onClick={() => router.push(`/${componente}/desafio`)} leftIcon={<Zap className="w-4 h-4" />}>
                  Modo Desafio
                </Button>
              )}
              {status === 'ERRO' && (
                <Button variant="secondary" onClick={buscarQuestao} leftIcon={<RefreshCw className="w-4 h-4" />}>
                  Tentar Novamente
                </Button>
              )}
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={handleVoltar}>
                Voltar ao Menu
              </Button>
            </div>
          </div>
        </main>
      )}

      <BottomNav componente={componente} />
    </div>
  )
}
