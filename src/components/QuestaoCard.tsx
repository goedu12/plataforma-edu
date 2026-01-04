'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Lightbulb, Clock, AlertCircle, Trophy, TrendingUp, Target } from 'lucide-react'
import Button from './ui/Button'
import Badge from './ui/Badge'
import type { Questao, Componente, ModoResposta } from '@/types'

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

interface QuestaoCardProps {
  questao: Questao
  componente: Componente
  tempoDecorrido: number
  onResponder: (resposta: 'A' | 'B' | 'C' | 'D', usouDica: boolean) => void
  onProxima: () => void
  onVoltar: () => void
  modo?: ModoResposta
  limiteAtual?: LimiteInfo | null
  onNotaAtualizada?: (limite: LimiteInfo) => void
}

type Alternativa = 'A' | 'B' | 'C' | 'D'

interface ConquistaDesbloqueada {
  nome: string
  icone: string
}

interface FeedbackData {
  correta: boolean
  respostaCorreta: Alternativa
  explicacao: string
  pontosGanhos: number
  conquistasDesbloqueadas: ConquistaDesbloqueada[]
  notaTempoReal: NotaTempoReal | null
}

export default function QuestaoCard({
  questao,
  componente,
  tempoDecorrido,
  onResponder,
  onProxima,
  onVoltar,
  modo = 'estudo',
  onNotaAtualizada,
}: QuestaoCardProps) {
  const [selecionada, setSelecionada] = useState<Alternativa | null>(null)
  const [mostrarDica, setMostrarDica] = useState(false)
  const [usouDica, setUsouDica] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const alternativas: { letra: Alternativa; texto: string }[] = [
    { letra: 'A', texto: questao.alternativa_a },
    { letra: 'B', texto: questao.alternativa_b },
    { letra: 'C', texto: questao.alternativa_c },
    { letra: 'D', texto: questao.alternativa_d },
  ]

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}:${seg.toString().padStart(2, '0')}`
  }

  const handlePedirDica = () => {
    setMostrarDica(true)
    setUsouDica(true)
  }

  const handleConfirmar = async () => {
    if (!selecionada) return

    setLoading(true)
    setErro(null)

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
          modo,
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

        if (data.nota_tempo_real && onNotaAtualizada) {
          onNotaAtualizada({
            questoes_semana: data.nota_tempo_real.questoes_semana,
            limite_semanal: data.nota_tempo_real.limite_semanal,
            restantes: data.nota_tempo_real.limite_semanal
              ? data.nota_tempo_real.limite_semanal - data.nota_tempo_real.questoes_semana
              : null,
            pode_responder: data.nota_tempo_real.pode_continuar,
          })
        }

        onResponder(selecionada, usouDica)
      } else {
        setErro(data.erro || 'Não foi possível registrar sua resposta. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro ao responder:', error)
      setErro('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const getAlternativaStyle = (letra: Alternativa) => {
    if (feedback) {
      if (letra === feedback.respostaCorreta) {
        return {
          background: 'rgba(34, 197, 94, 0.15)',
          border: '2px solid var(--success)',
          color: 'var(--success)',
        }
      }
      if (letra === selecionada && !feedback.correta) {
        return {
          background: 'rgba(239, 68, 68, 0.15)',
          border: '2px solid var(--error)',
          color: 'var(--error)',
        }
      }
      return {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        opacity: 0.5,
      }
    }

    if (selecionada === letra) {
      return {
        background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
        border: `2px solid ${corPrimaria}`,
      }
    }

    return {
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
    }
  }

  const dificuldadeLabel = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' } as const
  const dificuldadeColor = { facil: 'success', medio: 'warning', dificil: 'error' } as const

  const getNotaColor = (nota: number) => {
    if (nota >= 7) return 'var(--success)'
    if (nota >= 6) return '#4ade80'
    if (nota >= 5) return 'var(--warning)'
    return 'var(--error)'
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={componente}>{questao.tema}</Badge>
          <Badge variant={dificuldadeColor[questao.dificuldade]}>
            {dificuldadeLabel[questao.dificuldade]}
          </Badge>
        </div>
        <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono tabular-nums">{formatarTempo(tempoDecorrido)}</span>
        </div>
      </div>

      {/* Enunciado */}
      <div
        className="card p-5 rounded-xl"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {questao.enunciado}
        </p>
      </div>

      {/* Alternativas */}
      <div className="space-y-3">
        {alternativas.map(({ letra, texto }) => {
          const style = getAlternativaStyle(letra)
          return (
            <button
              key={letra}
              onClick={() => !feedback && !loading && setSelecionada(letra)}
              disabled={!!feedback || loading}
              className="w-full p-4 rounded-xl flex items-center gap-4 transition-all touch-target text-left"
              style={style}
            >
              <span
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0"
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
              <span style={{ color: 'var(--text-primary)' }}>{texto}</span>
            </button>
          )
        })}
      </div>

      {/* Erro */}
      {erro && (
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(239, 68, 68, 0.2)' }}
            >
              <AlertCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--error)' }}>Erro</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
              <button
                onClick={handleConfirmar}
                className="text-sm underline mt-2"
                style={{ color: 'var(--error)' }}
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dica */}
      {!feedback && questao.dica && (
        <div className="text-center">
          {mostrarDica ? (
            <div
              className="p-4 rounded-xl text-left"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                border: isFisica ? '1px solid var(--border-fisica)' : '1px solid var(--border-matematica)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4" style={{ color: corPrimaria }} />
                <span className="text-sm font-medium" style={{ color: corPrimaria }}>Dica</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{questao.dica}</p>
            </div>
          ) : (
            <button
              onClick={handlePedirDica}
              className="text-sm flex items-center gap-2 mx-auto transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Lightbulb className="w-4 h-4" />
              Precisa de ajuda? Pedir Dica (-5 pts)
            </button>
          )}
        </div>
      )}

      {/* Conquistas Desbloqueadas */}
      {feedback && feedback.conquistasDesbloqueadas.length > 0 && (
        <div
          className="rounded-xl p-5 text-center animate-fade-in"
          style={{ background: 'rgba(245, 158, 11, 0.15)', border: '2px solid rgba(245, 158, 11, 0.4)' }}
        >
          <div
            className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center"
            style={{ background: 'rgba(245, 158, 11, 0.2)' }}
          >
            <Trophy className="w-7 h-7" style={{ color: 'var(--warning)' }} />
          </div>
          <h4 className="font-bold mb-3 text-lg" style={{ color: 'var(--warning)' }}>
            Nova Conquista Desbloqueada!
          </h4>
          <div className="flex flex-wrap justify-center gap-2">
            {feedback.conquistasDesbloqueadas.map((conquista, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
                style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}
              >
                {conquista.icone} {conquista.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nota em Tempo Real */}
      {feedback && feedback.notaTempoReal && modo === 'estudo' && (
        <div
          className="rounded-xl p-5 animate-fade-in-up"
          style={{
            background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            border: isFisica ? '1px solid var(--border-fisica)' : '1px solid var(--border-matematica)',
          }}
        >
          <p className="text-sm font-medium mb-3" style={{ color: corPrimaria }}>
            Sua Nota em Tempo Real
          </p>

          <div className="flex items-center justify-between mb-3">
            <span style={{ color: 'var(--text-secondary)' }}>Nota atual:</span>
            <div className="flex items-center gap-2">
              {feedback.notaTempoReal.mudou && (
                <span className="text-sm line-through" style={{ color: 'var(--text-muted)' }}>
                  {feedback.notaTempoReal.nota_anterior.toFixed(1)}
                </span>
              )}
              <span className="text-2xl font-bold" style={{ color: getNotaColor(feedback.notaTempoReal.nota_atual) }}>
                {feedback.notaTempoReal.nota_atual.toFixed(2)}
              </span>
              {feedback.notaTempoReal.mudou && (
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--success)' }} />
              )}
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: 'var(--text-muted)' }}>Progresso</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {feedback.notaTempoReal.questoes_respondidas}/{feedback.notaTempoReal.meta_questoes}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(feedback.notaTempoReal.percentual, 100)}%`,
                  background: corPrimaria,
                }}
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <p style={{ color: 'var(--text-muted)' }}>
              Dias ativos: <span style={{ color: 'var(--success)' }}>{feedback.notaTempoReal.dias_ativos}</span>
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Bônus frequência: <span style={{ color: 'var(--success)' }}>+{feedback.notaTempoReal.bonus_frequencia.toFixed(1)}</span>
            </p>
            {feedback.notaTempoReal.limite_semanal && (
              <p style={{ color: 'var(--text-muted)' }}>
                Semana:{' '}
                <span style={{
                  color: feedback.notaTempoReal.questoes_semana >= feedback.notaTempoReal.limite_semanal
                    ? 'var(--error)'
                    : 'var(--success)',
                }}>
                  {feedback.notaTempoReal.questoes_semana}/{feedback.notaTempoReal.limite_semanal}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className="rounded-xl p-5 animate-fade-in-up"
          style={{
            background: feedback.correta ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.correta ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: feedback.correta ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}
            >
              {feedback.correta ? (
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
              ) : (
                <XCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold" style={{ color: feedback.correta ? 'var(--success)' : 'var(--error)' }}>
                {feedback.correta ? 'Muito bem! Resposta correta!' : 'Não foi dessa vez...'}
                {feedback.correta && feedback.pontosGanhos > 0 && (
                  <span
                    className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)' }}
                  >
                    +{feedback.pontosGanhos} pontos
                  </span>
                )}
              </h4>
              {!feedback.correta && (
                <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                  A resposta correta era a alternativa{' '}
                  <strong style={{ color: 'var(--error)' }}>{feedback.respostaCorreta}</strong>.
                  Não desanime, continue praticando!
                </p>
              )}
              {feedback.explicacao && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Explicação:</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {feedback.explicacao}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aviso de limite atingido */}
      {feedback && feedback.notaTempoReal && !feedback.notaTempoReal.pode_continuar && (
        <div
          className="rounded-xl p-4"
          style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
        >
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5" style={{ color: 'var(--warning)' }} />
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--warning)' }}>Limite semanal atingido!</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Volte na segunda-feira ou use o modo Desafio.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-3">
        {feedback ? (
          <>
            <Button variant="secondary" onClick={onVoltar} className="flex-1">
              Menu
            </Button>
            {feedback.notaTempoReal?.pode_continuar !== false ? (
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={onProxima} className="flex-1">
                Próxima Questão
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => {}} disabled className="flex-1">
                Limite Atingido
              </Button>
            )}
          </>
        ) : (
          <Button
            variant={isFisica ? 'fisica' : 'matematica'}
            onClick={handleConfirmar}
            disabled={!selecionada || loading}
            loading={loading}
            className="w-full"
          >
            {selecionada ? 'Confirmar Resposta' : 'Selecione uma alternativa'}
          </Button>
        )}
      </div>
    </div>
  )
}
