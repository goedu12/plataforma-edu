'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, RotateCcw, CheckCircle2, XCircle, WifiOff, RefreshCw, BookOpen, Clock, Lightbulb, Trophy, AlertCircle } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
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

  // Estados da questão
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

  const pararTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarQuestao()
    return () => pararTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componente, router, pararTimer])

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
          respostaCorreta: data.resposta_correta as Alternativa, // Usar resposta da API
          explicacao: data.explicacao || 'Continue revisando para fixar o conteúdo!',
          pontosGanhos: data.pontos_ganhos,
          conquistasDesbloqueadas: data.conquistas_desbloqueadas || [],
        })

        // Atualizar contador de revisões
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
      // Só mostra verde se o estudante ACERTOU
      if (feedback.correta && letra === selecionada) {
        return { background: 'rgba(34, 197, 94, 0.15)', border: '2px solid var(--success)' }
      }
      // Mostra vermelho na alternativa errada que o estudante selecionou
      if (!feedback.correta && letra === selecionada) {
        return { background: 'rgba(239, 68, 68, 0.15)', border: '2px solid var(--error)' }
      }
      // Outras alternativas ficam neutras
      return { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', opacity: 0.5 }
    }
    if (selecionada === letra) {
      return {
        background: 'rgba(245, 158, 11, 0.15)',
        border: '2px solid var(--warning)',
      }
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
  const dificuldadeColor = { facil: 'success', medio: 'warning', dificil: 'error' } as const

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER COMPACTO - Estilo Desafio (cor warning)
          ═══════════════════════════════════════════════════════════════════ */}
      <header
        className="px-4 py-2 sticky top-0 z-10 flex-shrink-0"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Linha 1: Navegação + Título + Timer */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleVoltar}
              className="p-2 -ml-2 rounded-lg lg:hidden"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" style={{ color: 'var(--warning)' }} />
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Revisar
              </span>
            </div>

            {/* Timer */}
            {status === 'OK' && questao && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm"
                style={{ background: 'var(--bg-elevated)', color: 'var(--warning)' }}
              >
                <Clock className="w-4 h-4" />
                <span>{formatarTempo(tempoDecorrido)}</span>
              </div>
            )}

            {!(status === 'OK' && questao) && <div className="w-16 lg:hidden" />}
          </div>

          {/* Linha 2: Progress de pendentes */}
          {status === 'OK' && totalRevisao > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-1 flex-1">
                {Array.from({ length: Math.min(totalRevisao, 10) }).map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 h-1.5 rounded-full transition-all"
                    style={{ background: 'var(--warning)' }}
                  />
                ))}
                {totalRevisao > 10 && (
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg-elevated)' }} />
                )}
              </div>
              <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {totalRevisao} {totalRevisao === 1 ? 'pendente' : 'pendentes'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTEÚDO
          ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-4 w-full flex flex-col">
        {status === 'OK' && questao ? (
          <div className="flex-1 flex flex-col animate-fade-in">
            {/* Info de quando errou */}
            {errouEm && (
              <div
                className="px-3 py-2 rounded-lg mb-3 flex items-center gap-2"
                style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--warning)' }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Você errou esta questão em {formatarDataErro(errouEm)}
                </span>
              </div>
            )}

            {/* Tags */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={componente}>{questao.tema}</Badge>
              <Badge variant={dificuldadeColor[questao.dificuldade]}>
                {dificuldadeLabel[questao.dificuldade]}
              </Badge>
              <Badge variant="warning">Revisão</Badge>
            </div>

            {/* Enunciado */}
            <div
              className="p-4 rounded-xl mb-3 flex-shrink-0"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {formatarFormula(questao.enunciado)}
              </p>
            </div>

            {/* Alternativas */}
            <div className="space-y-2 flex-shrink-0">
              {alternativas.map(({ letra, texto }) => {
                const style = getAlternativaStyle(letra)
                return (
                  <button
                    key={letra}
                    onClick={() => !feedback && !respondendo && setSelecionada(letra)}
                    disabled={!!feedback || respondendo}
                    className="w-full min-h-[52px] px-3 py-3 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98] text-left"
                    style={style}
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-bold flex-shrink-0 text-sm"
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
                        <CheckCircle2 className="w-5 h-5" />
                      ) : feedback && !feedback.correta && letra === selecionada ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        letra
                      )}
                    </span>
                    <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
                      {formatarFormula(texto)}
                    </span>
                    {!feedback && selecionada === letra && (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--warning)' }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Dica */}
            {!feedback && questao.dica && (
              <div className="mb-3">
                {mostrarDica ? (
                  <div
                    className="p-3 rounded-xl"
                    style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed var(--border-default)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--warning)' }}>Dica</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatarFormula(questao.dica)}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => { setMostrarDica(true); setUsouDica(true) }}
                    className="w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-default)', color: 'var(--text-muted)' }}
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm">Precisa de ajuda? Ver dica</span>
                  </button>
                )}
              </div>
            )}

            {/* Conquistas */}
            {feedback && feedback.conquistasDesbloqueadas.length > 0 && (
              <div
                className="rounded-xl p-3 mb-3 text-center animate-fade-in"
                style={{ background: 'rgba(245, 158, 11, 0.15)', border: '2px solid rgba(245, 158, 11, 0.4)' }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                  <span className="font-bold text-sm" style={{ color: 'var(--warning)' }}>Nova Conquista!</span>
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {feedback.conquistasDesbloqueadas.map((c, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}>
                      {c.icone} {c.nome}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
            {feedback && (
              <div
                className="rounded-xl p-3 mb-3 animate-fade-in"
                style={{
                  background: feedback.correta ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${feedback.correta ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: feedback.correta ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}
                  >
                    {feedback.correta ? <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} /> : <XCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: feedback.correta ? 'var(--success)' : 'var(--error)' }}>
                        {feedback.correta ? 'Correto!' : 'Incorreto'}
                      </span>
                      {feedback.correta && feedback.pontosGanhos > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)' }}>
                          +{feedback.pontosGanhos} pts
                        </span>
                      )}
                    </div>
                    {feedback.explicacao && (
                      <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{formatarFormula(feedback.explicacao)}</p>
                    )}
                    <p className="text-xs mt-2" style={{ color: feedback.correta ? 'var(--success)' : 'var(--text-muted)' }}>
                      {feedback.correta ? 'Questão removida da revisão' : 'Tente novamente na próxima'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Erro */}
            {erro && (
              <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2">
              {feedback ? (
                <>
                  <Button variant="secondary" onClick={handleVoltar} className="flex-1 min-h-[48px]">
                    Menu
                  </Button>
                  <button
                    onClick={buscarQuestao}
                    className="flex-1 min-h-[48px] rounded-xl font-semibold transition-all active:scale-[0.98]"
                    style={{ background: 'var(--warning)', color: '#000' }}
                  >
                    Próxima
                  </button>
                </>
              ) : (
                <button
                  onClick={handleConfirmar}
                  disabled={!selecionada || respondendo}
                  className="w-full min-h-[52px] text-base rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: selecionada ? 'var(--warning)' : 'var(--bg-elevated)',
                    color: selecionada ? '#000' : 'var(--text-muted)'
                  }}
                >
                  {respondendo ? 'Enviando...' : selecionada ? 'Confirmar' : 'Selecione uma alternativa'}
                </button>
              )}
            </div>
          </div>
        ) : status === 'SEM_REVISAO' ? (
          /* ═══════════════════════════════════════════════════════════════
             TUDO REVISADO
             ═══════════════════════════════════════════════════════════════ */
          <div
            className="rounded-2xl p-6 text-center animate-fade-in-up"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                border: `1px solid ${corPrimaria}`,
              }}
            >
              <CheckCircle2 className="w-7 h-7" style={{ color: corPrimaria }} />
            </div>

            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Tudo Revisado!
            </h2>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              Você não tem questões de {nomeComponente} para revisar!
            </p>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              Continue estudando para aprender novos conteúdos.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="secondary"
                onClick={() => router.push(`/${componente}/estudar`)}
                leftIcon={<BookOpen className="w-4 h-4" />}
                className="min-h-[48px]"
              >
                Estudar Novas
              </Button>
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={handleVoltar}
                className="min-h-[48px]"
              >
                Voltar ao Menu
              </Button>
            </div>
          </div>
        ) : status === 'ERRO' ? (
          /* ═══════════════════════════════════════════════════════════════
             ERRO
             ═══════════════════════════════════════════════════════════════ */
          <div
            className="rounded-2xl p-6 text-center animate-fade-in-up"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <WifiOff className="w-7 h-7" style={{ color: 'var(--error)' }} />
            </div>

            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Ops! Erro
            </h2>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              Tente novamente ou volte mais tarde.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="secondary"
                onClick={buscarQuestao}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="min-h-[48px]"
              >
                Tentar Novamente
              </Button>
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={handleVoltar}
                className="min-h-[48px]"
              >
                Voltar ao Menu
              </Button>
            </div>
          </div>
        ) : null}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
