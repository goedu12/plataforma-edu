'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Lightbulb, Clock, AlertCircle, Trophy, TrendingUp, Target, ChevronDown, ChevronUp } from 'lucide-react'
import Button from './ui/Button'
import Badge from './ui/Badge'
import { formatarFormula } from '@/lib/formatacao'
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
  onResponder: (resposta: 'A' | 'B' | 'C' | 'D' | 'E', usouDica: boolean) => void
  onProxima: () => void
  onVoltar: () => void
  modo?: ModoResposta
  limiteAtual?: LimiteInfo | null
  onNotaAtualizada?: (limite: LimiteInfo) => void
}

type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E'

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
  const [mostrarDetalhesNota, setMostrarDetalhesNota] = useState(false)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const alternativas: { letra: Alternativa; texto: string }[] = [
    { letra: 'A', texto: questao.alternativa_a },
    { letra: 'B', texto: questao.alternativa_b },
    { letra: 'C', texto: questao.alternativa_c },
    { letra: 'D', texto: questao.alternativa_d },
    ...(questao.alternativa_e ? [{ letra: 'E' as Alternativa, texto: questao.alternativa_e }] : []),
  ]

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
          background: 'var(--success-bg-15)',
          border: '2px solid var(--success)',
          color: 'var(--success)',
        }
      }
      if (letra === selecionada && !feedback.correta) {
        return {
          background: 'var(--error-bg-15)',
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
        background: isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)',
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
    <div className="flex flex-col h-full">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER COMPACTO - Badges inline
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={componente}>{questao.tema}</Badge>
          <Badge variant={dificuldadeColor[questao.dificuldade]}>
            {dificuldadeLabel[questao.dificuldade]}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
          <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            {tempoDecorrido}s
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ENUNCIADO - Área expansível
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 p-4 rounded-xl mb-3"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <p
          className="text-sm sm:text-base leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatarFormula(questao.enunciado)}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ALTERNATIVAS - Touch targets maiores no mobile
          ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-2 sm:space-y-3 flex-shrink-0">
        {alternativas.map(({ letra, texto }) => {
          const style = getAlternativaStyle(letra)
          return (
            <button
              key={letra}
              onClick={() => !feedback && !loading && setSelecionada(letra)}
              disabled={!!feedback || loading}
              className="w-full min-h-[52px] sm:min-h-[56px] px-3 sm:px-4 py-3 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98] text-left"
              style={style}
            >
              <span
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0 text-sm sm:text-base"
                style={{
                  background: feedback && letra === feedback.respostaCorreta
                    ? 'var(--success)'
                    : feedback && letra === selecionada && !feedback.correta
                      ? 'var(--error)'
                      : selecionada === letra
                        ? corPrimaria
                        : 'var(--bg-elevated)',
                  color: (feedback && (letra === feedback.respostaCorreta || (letra === selecionada && !feedback.correta))) || selecionada === letra
                    ? isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)'
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
              <span className="text-sm sm:text-base flex-1" style={{ color: 'var(--text-primary)' }}>
                {formatarFormula(texto)}
              </span>
            </button>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ERRO
          ═══════════════════════════════════════════════════════════════ */}
      {erro && (
        <div
          className="rounded-xl p-3 mt-3"
          style={{ background: 'var(--error-bg-15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--error)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
              <button
                onClick={handleConfirmar}
                className="text-xs underline mt-1"
                style={{ color: 'var(--error)' }}
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          DICA COLAPSÁVEL - Compacta no mobile
          ═══════════════════════════════════════════════════════════════ */}
      {!feedback && questao.dica && (
        <div className="mt-3">
          {mostrarDica ? (
            <div
              className="p-3 rounded-xl"
              style={{
                background: isFisica ? 'var(--color-fisica-bg-10)' : 'var(--color-matematica-bg-10)',
                border: isFisica ? '1px solid var(--border-fisica)' : '1px solid var(--border-matematica)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4" style={{ color: corPrimaria }} />
                <span className="text-xs font-medium" style={{ color: corPrimaria }}>Dica</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{formatarFormula(questao.dica || '')}</p>
            </div>
          ) : (
            <button
              onClick={handlePedirDica}
              className="w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-default)',
                color: 'var(--text-muted)'
              }}
            >
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm">Precisa de ajuda? Ver dica (-5 pts)</span>
            </button>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CONQUISTAS DESBLOQUEADAS
          ═══════════════════════════════════════════════════════════════ */}
      {feedback && feedback.conquistasDesbloqueadas.length > 0 && (
        <div
          className="rounded-xl p-4 text-center mt-3 animate-fade-in"
          style={{ background: 'var(--warning-bg-15)', border: '2px solid rgba(245, 158, 11, 0.4)' }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-5 h-5" style={{ color: 'var(--warning)' }} />
            <span className="font-bold" style={{ color: 'var(--warning)' }}>Nova Conquista!</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {feedback.conquistasDesbloqueadas.map((conquista, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)' }}
              >
                {conquista.icone} {conquista.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          NOTA EM TEMPO REAL - Compacta com expansão
          ═══════════════════════════════════════════════════════════════ */}
      {feedback && feedback.notaTempoReal && modo === 'estudo' && (
        <div
          className="rounded-xl p-3 mt-3 animate-fade-in"
          style={{
            background: isFisica ? 'var(--color-fisica-bg-10)' : 'var(--color-matematica-bg-10)',
            border: isFisica ? '1px solid var(--border-fisica)' : '1px solid var(--border-matematica)',
          }}
        >
          {/* Header da nota - sempre visível */}
          <button
            onClick={() => setMostrarDetalhesNota(!mostrarDetalhesNota)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: corPrimaria }}>Sua Nota</span>
              {feedback.notaTempoReal.mudou && (
                <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold" style={{ color: getNotaColor(feedback.notaTempoReal.nota_atual) }}>
                {feedback.notaTempoReal.nota_atual.toFixed(2)}
              </span>
              {mostrarDetalhesNota ? (
                <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              )}
            </div>
          </button>

          {/* Detalhes - colapsável */}
          {mostrarDetalhesNota && (
            <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border-default)' }}>
              {/* Barra de progresso */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-muted)' }}>Progresso</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {feedback.notaTempoReal.questoes_respondidas}/{feedback.notaTempoReal.meta_questoes}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(feedback.notaTempoReal.percentual, 100)}%`,
                      background: corPrimaria,
                    }}
                  />
                </div>
              </div>

              {/* Stats compactos */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>Dias ativos: <strong style={{ color: 'var(--success)' }}>{feedback.notaTempoReal.dias_ativos}</strong></span>
                <span>Bônus: <strong style={{ color: 'var(--success)' }}>+{feedback.notaTempoReal.bonus_frequencia.toFixed(1)}</strong></span>
                {feedback.notaTempoReal.limite_semanal && (
                  <span>
                    Semana:{' '}
                    <strong style={{
                      color: feedback.notaTempoReal.questoes_semana >= feedback.notaTempoReal.limite_semanal
                        ? 'var(--error)'
                        : 'var(--success)',
                    }}>
                      {feedback.notaTempoReal.questoes_semana}/{feedback.notaTempoReal.limite_semanal}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          FEEDBACK - Resposta correta/errada
          ═══════════════════════════════════════════════════════════════ */}
      {feedback && (
        <div
          className="rounded-xl p-4 mt-3 animate-fade-in"
          style={{
            background: feedback.correta ? 'var(--success-bg-15)' : 'var(--error-bg-15)',
            border: `1px solid ${feedback.correta ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: feedback.correta ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}
            >
              {feedback.correta ? (
                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
              ) : (
                <XCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm" style={{ color: feedback.correta ? 'var(--success)' : 'var(--error)' }}>
                  {feedback.correta ? 'Correto!' : 'Incorreto'}
                </span>
                {feedback.correta && feedback.pontosGanhos > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)' }}
                  >
                    +{feedback.pontosGanhos} pts
                  </span>
                )}
              </div>
              {!feedback.correta && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Resposta correta: <strong style={{ color: 'var(--error)' }}>{feedback.respostaCorreta}</strong>
                </p>
              )}
              {feedback.explicacao && (
                <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {formatarFormula(feedback.explicacao)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          AVISO DE LIMITE ATINGIDO
          ═══════════════════════════════════════════════════════════════ */}
      {feedback && feedback.notaTempoReal && !feedback.notaTempoReal.pode_continuar && (
        <div
          className="rounded-xl p-3 mt-3"
          style={{ background: 'var(--warning-bg-15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" style={{ color: 'var(--warning)' }} />
            <div>
              <span className="font-medium text-sm" style={{ color: 'var(--warning)' }}>Limite semanal atingido!</span>
              <span className="text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>Use o modo Desafio</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          BOTÕES DE AÇÃO - Touch targets maiores
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex gap-2 mt-4 pt-2">
        {feedback ? (
          <>
            <Button variant="secondary" onClick={onVoltar} className="flex-1 min-h-[48px]">
              Menu
            </Button>
            {feedback.notaTempoReal?.pode_continuar !== false ? (
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={onProxima} className="flex-1 min-h-[48px]">
                Próxima
              </Button>
            ) : (
              <Button variant="secondary" disabled className="flex-1 min-h-[48px]">
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
            className="w-full min-h-[52px] text-base"
          >
            {selecionada ? 'Confirmar' : 'Selecione uma alternativa'}
          </Button>
        )}
      </div>
    </div>
  )
}
