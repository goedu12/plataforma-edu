'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle2, XCircle, WifiOff, RefreshCw, AlertTriangle, Calendar, Zap, Clock, Lightbulb, Trophy, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Questao } from '@/types'

type StatusQuestao = 'OK' | 'SEM_QUESTOES' | 'COMPLETOU' | 'ERRO' | 'LIMITE_SEMANAL' | 'FORA_PERIODO'
type Alternativa = 'A' | 'B' | 'C' | 'D'

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

  // Estados da questão
  const [selecionada, setSelecionada] = useState<Alternativa | null>(null)
  const [mostrarDica, setMostrarDica] = useState(false)
  const [usouDica, setUsouDica] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [respondendo, setRespondendo] = useState(false)
  const [mostrarDetalhesNota, setMostrarDetalhesNota] = useState(false)

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
    setMostrarDetalhesNota(false)

    try {
      const response = await fetch(`/api/questoes?componente=${componente}&modo=estudo`)
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
          modo: 'estudo',
        }),
      })

      const data = await response.json()

      if (data.sucesso) {
        setFeedback({
          correta: data.correta,
          respostaCorreta: data.correta ? selecionada : (questao.resposta_correta as Alternativa) || selecionada,
          explicacao: data.explicacao || 'Continue estudando para melhorar seu desempenho!',
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
      if (letra === feedback.respostaCorreta) {
        return { background: 'rgba(34, 197, 94, 0.15)', border: '2px solid var(--success)' }
      }
      if (letra === selecionada && !feedback.correta) {
        return { background: 'rgba(239, 68, 68, 0.15)', border: '2px solid var(--error)' }
      }
      return { background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', opacity: 0.5 }
    }
    if (selecionada === letra) {
      return {
        background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
        border: `2px solid ${corPrimaria}`,
      }
    }
    return { background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }
  }

  const getNotaColor = (nota: number) => {
    if (nota >= 7) return 'var(--success)'
    if (nota >= 6) return '#4ade80'
    if (nota >= 5) return 'var(--warning)'
    return 'var(--error)'
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
  ] : []

  const dificuldadeLabel = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' } as const
  const dificuldadeColor = { facil: 'success', medio: 'warning', dificil: 'error' } as const

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER COMPACTO - Estilo Desafio
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
              <BookOpen className="w-4 h-4" style={{ color: corPrimaria }} />
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Estudar
              </span>
            </div>

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

            {!(status === 'OK' && questao) && <div className="w-16 lg:hidden" />}
          </div>

          {/* Linha 2: Progress da semana */}
          {status === 'OK' && limite && limite.limite_semanal !== null && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-1 flex-1">
                {Array.from({ length: limite.limite_semanal }).map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 h-1.5 rounded-full transition-all"
                    style={{
                      background: index < limite.questoes_semana
                        ? corPrimaria
                        : 'var(--bg-elevated)',
                    }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {limite.questoes_semana}/{limite.limite_semanal}
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
            {/* Tags */}
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={componente}>{questao.tema}</Badge>
              <Badge variant={dificuldadeColor[questao.dificuldade]}>
                {dificuldadeLabel[questao.dificuldade]}
              </Badge>
            </div>

            {/* Enunciado */}
            <div
              className="p-4 rounded-xl mb-3 flex-shrink-0"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {questao.enunciado}
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
                        background: feedback && letra === feedback.respostaCorreta
                          ? 'var(--success)'
                          : feedback && letra === selecionada && !feedback.correta
                            ? 'var(--error)'
                            : selecionada === letra
                              ? corPrimaria
                              : 'var(--bg-elevated)',
                        color: (feedback && (letra === feedback.respostaCorreta || (letra === selecionada && !feedback.correta))) || selecionada === letra
                          ? isFisica ? '#000' : '#fff'
                          : 'var(--text-muted)',
                      }}
                    >
                      {feedback && letra === feedback.respostaCorreta ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : feedback && letra === selecionada && !feedback.correta ? (
                        <XCircle className="w-5 h-5" />
                      ) : (
                        letra
                      )}
                    </span>
                    <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
                      {texto}
                    </span>
                    {!feedback && selecionada === letra && (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: corPrimaria }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Espaçador flexível */}
            <div className="flex-1 min-h-4" />

            {/* Dica */}
            {!feedback && questao.dica && (
              <div className="mb-3">
                {mostrarDica ? (
                  <div
                    className="p-3 rounded-xl"
                    style={{
                      background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                      border: '1px dashed var(--border-default)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="w-4 h-4" style={{ color: corPrimaria }} />
                      <span className="text-xs font-medium" style={{ color: corPrimaria }}>Dica</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{questao.dica}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => { setMostrarDica(true); setUsouDica(true) }}
                    className="w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-default)', color: 'var(--text-muted)' }}
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm">Precisa de ajuda? Ver dica (-5 pts)</span>
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

            {/* Nota em tempo real */}
            {feedback && feedback.notaTempoReal && (
              <div
                className="rounded-xl p-3 mb-3 animate-fade-in"
                style={{
                  background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <button onClick={() => setMostrarDetalhesNota(!mostrarDetalhesNota)} className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: corPrimaria }}>Sua Nota</span>
                    {feedback.notaTempoReal.mudou && <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold" style={{ color: getNotaColor(feedback.notaTempoReal.nota_atual) }}>
                      {feedback.notaTempoReal.nota_atual.toFixed(2)}
                    </span>
                    {mostrarDetalhesNota ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </button>
                {mostrarDetalhesNota && (
                  <div className="mt-2 pt-2 text-xs flex flex-wrap gap-x-4" style={{ borderTop: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                    <span>Progresso: <strong>{feedback.notaTempoReal.questoes_respondidas}/{feedback.notaTempoReal.meta_questoes}</strong></span>
                    <span>Dias ativos: <strong style={{ color: 'var(--success)' }}>{feedback.notaTempoReal.dias_ativos}</strong></span>
                  </div>
                )}
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
                    {!feedback.correta && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Correta: <strong style={{ color: 'var(--error)' }}>{feedback.respostaCorreta}</strong>
                      </p>
                    )}
                    {feedback.explicacao && (
                      <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feedback.explicacao}</p>
                    )}
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
                  {feedback.notaTempoReal?.pode_continuar !== false ? (
                    <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={buscarQuestao} className="flex-1 min-h-[48px]">
                      Próxima
                    </Button>
                  ) : (
                    <Button variant="secondary" onClick={() => router.push(`/${componente}/desafio`)} className="flex-1 min-h-[48px]" leftIcon={<Zap className="w-4 h-4" />}>
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
                  className="w-full min-h-[52px] text-base"
                >
                  {selecionada ? 'Confirmar' : 'Selecione uma alternativa'}
                </Button>
              )}
            </div>
          </div>
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
                background: status === 'LIMITE_SEMANAL' ? 'rgba(245, 158, 11, 0.15)'
                  : status === 'ERRO' ? 'rgba(239, 68, 68, 0.15)'
                  : status === 'COMPLETOU' ? isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)'
                  : 'var(--bg-elevated)',
                border: status === 'LIMITE_SEMANAL' ? '1px solid rgba(245, 158, 11, 0.3)'
                  : status === 'ERRO' ? '1px solid rgba(239, 68, 68, 0.3)'
                  : status === 'COMPLETOU' ? `1px solid ${corPrimaria}`
                  : '1px solid var(--border-default)',
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

            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {status === 'LIMITE_SEMANAL' && `Você respondeu ${limite?.questoes_semana || 15} questões esta semana!`}
              {status === 'FORA_PERIODO' && 'Período letivo não iniciado ou em férias.'}
              {status === 'COMPLETOU' && `Você completou todas as questões de ${nomeComponente}!`}
              {status === 'ERRO' && erro}
              {status === 'SEM_QUESTOES' && `Ainda não há questões de ${nomeComponente} para seu ano.`}
            </p>

            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              {status === 'LIMITE_SEMANAL' && 'Volte na segunda ou use o modo Desafio!'}
              {status === 'FORA_PERIODO' && 'Use o modo Desafio para praticar!'}
              {status === 'COMPLETOU' && 'Continue com o tutor IA!'}
              {status === 'ERRO' && 'Tente novamente ou volte mais tarde.'}
              {status === 'SEM_QUESTOES' && 'Tire dúvidas com o tutor IA!'}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {(status === 'LIMITE_SEMANAL' || status === 'FORA_PERIODO') && (
                <Button variant="secondary" onClick={() => router.push(`/${componente}/desafio`)} leftIcon={<Zap className="w-4 h-4" />} className="min-h-[48px]">
                  Modo Desafio
                </Button>
              )}
              {status === 'ERRO' && (
                <Button variant="secondary" onClick={buscarQuestao} leftIcon={<RefreshCw className="w-4 h-4" />} className="min-h-[48px]">
                  Tentar Novamente
                </Button>
              )}
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={handleVoltar} className="min-h-[48px]">
                Voltar ao Menu
              </Button>
            </div>
          </div>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
