'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Lightbulb, Clock, AlertCircle, Trophy } from 'lucide-react'
import Button from './ui/Button'
import Card from './ui/Card'
import Badge from './ui/Badge'
import type { Questao, Componente, ModoResposta } from '@/types'

interface QuestaoCardProps {
  questao: Questao
  componente: Componente
  tempoDecorrido: number
  onResponder: (resposta: 'A' | 'B' | 'C' | 'D', usouDica: boolean) => void
  onProxima: () => void
  onVoltar: () => void
  modo?: ModoResposta
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
}

export default function QuestaoCard({
  questao,
  componente,
  tempoDecorrido,
  onResponder,
  onProxima,
  onVoltar,
  modo = 'estudo',
}: QuestaoCardProps) {
  const [selecionada, setSelecionada] = useState<Alternativa | null>(null)
  const [mostrarDica, setMostrarDica] = useState(false)
  const [usouDica, setUsouDica] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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
        })
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
    const base =
      'flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 bg-dark-surface'

    if (feedback) {
      if (letra === feedback.respostaCorreta) {
        return `${base} border-green-500 bg-green-900/30`
      }
      if (letra === selecionada && !feedback.correta) {
        return `${base} border-red-500 bg-red-900/30`
      }
      return `${base} border-border opacity-50`
    }

    if (selecionada === letra) {
      return componente === 'fisica'
        ? `${base} border-fisica-500 bg-fisica-500/20`
        : `${base} border-matematica-500 bg-matematica-500/20`
    }

    return `${base} border-border hover:border-border-hover`
  }

  const dificuldadeLabel = {
    facil: 'Fácil',
    medio: 'Médio',
    dificil: 'Difícil',
  } as const

  const dificuldadeColor = {
    facil: 'success',
    medio: 'warning',
    dificil: 'error',
  } as const

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
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{formatarTempo(tempoDecorrido)}</span>
        </div>
      </div>

      {/* Enunciado */}
      <Card className="bg-dark-surface border-border">
        <p className="text-white leading-relaxed whitespace-pre-wrap">{questao.enunciado}</p>
      </Card>

      {/* Alternativas */}
      <div className="space-y-3">
        {alternativas.map(({ letra, texto }) => (
          <button
            key={letra}
            onClick={() => !feedback && !loading && setSelecionada(letra)}
            disabled={!!feedback || loading}
            className={getAlternativaStyle(letra)}
          >
            <span
              className={`
                flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm flex-shrink-0
                ${
                  feedback
                    ? letra === feedback.respostaCorreta
                      ? 'bg-green-500 text-white'
                      : letra === selecionada && !feedback.correta
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    : selecionada === letra
                      ? componente === 'fisica'
                        ? 'bg-fisica-500 text-white'
                        : 'bg-matematica-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }
              `}
            >
              {feedback && letra === feedback.respostaCorreta ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : feedback && letra === selecionada && !feedback.correta ? (
                <XCircle className="w-5 h-5" />
              ) : (
                letra
              )}
            </span>
            <span className="flex-1 text-left text-white">{texto}</span>
          </button>
        ))}
      </div>

      {/* Erro */}
      {erro && (
        <Card className="bg-red-900/80 border border-red-500/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-500/20 border border-red-500/30">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-red-300 text-sm mb-1">❌ Erro</p>
              <p className="text-sm text-red-100/90">{erro}</p>
              <button
                onClick={handleConfirmar}
                className="text-sm text-red-300 underline mt-2 hover:text-red-200 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Dica */}
      {!feedback && questao.dica && (
        <div className="text-center">
          {mostrarDica ? (
            <Card className="bg-orange-900/80 border border-orange-500/40 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-500/20 border border-orange-500/30">
                  <Lightbulb className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-orange-300 text-sm mb-1">💡 Dica</p>
                  <p className="text-sm text-orange-100/90 leading-relaxed">{questao.dica}</p>
                </div>
              </div>
            </Card>
          ) : (
            <button
              onClick={handlePedirDica}
              className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-2 mx-auto transition-colors"
            >
              <Lightbulb className="w-4 h-4" />
              Precisa de ajuda? Pedir Dica (−5 pts)
            </button>
          )}
        </div>
      )}

      {/* Conquistas Desbloqueadas */}
      {feedback && feedback.conquistasDesbloqueadas.length > 0 && (
        <Card className="bg-amber-900/80 border-2 border-amber-500/50 backdrop-blur-sm animate-bounce-once">
          <div className="text-center">
            <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center bg-amber-500/20 border border-amber-500/30">
              <Trophy className="w-7 h-7 text-amber-400" />
            </div>
            <h4 className="font-bold text-amber-300 mb-3 text-lg">
              🎉 Nova Conquista Desbloqueada!
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {feedback.conquistasDesbloqueadas.map((conquista, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-full text-amber-200 font-medium text-sm"
                >
                  {conquista.icone} {conquista.nome}
                </span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Feedback */}
      {feedback && (
        <Card
          className={`animate-slide-up backdrop-blur-sm ${
            feedback.correta
              ? 'bg-emerald-900/80 border border-emerald-500/40'
              : 'bg-red-900/80 border border-red-500/40'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              feedback.correta
                ? 'bg-emerald-500/20 border-emerald-500/30'
                : 'bg-red-500/20 border-red-500/30'
            }`}>
              {feedback.correta ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <h4
                className={`font-semibold ${feedback.correta ? 'text-emerald-300' : 'text-red-300'}`}
              >
                {feedback.correta ? '✅ Muito bem! Resposta correta!' : '❌ Não foi dessa vez...'}
                {feedback.correta && feedback.pontosGanhos > 0 && (
                  <span className="ml-2 text-sm font-normal bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full text-emerald-200">
                    +{feedback.pontosGanhos} pontos
                  </span>
                )}
              </h4>
              {!feedback.correta && (
                <p className="text-sm text-red-100/90 mt-2">
                  A resposta correta era a alternativa <strong className="text-red-300">{feedback.respostaCorreta}</strong>.
                  Não desanime, continue praticando!
                </p>
              )}
              {feedback.explicacao && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs font-medium mb-1 text-white/60">📖 Explicação:</p>
                  <p className={`text-sm leading-relaxed ${feedback.correta ? 'text-emerald-100/90' : 'text-red-100/90'}`}>
                    {feedback.explicacao}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Botões de ação */}
      <div className="flex gap-3">
        {feedback ? (
          <>
            <Button variant="secondary" onClick={onVoltar} className="flex-1">
              🏠 Menu
            </Button>
            <Button variant={componente === 'fisica' ? 'fisica' : 'matematica'} onClick={onProxima} className="flex-1">
              Próxima Questão →
            </Button>
          </>
        ) : (
          <Button
            variant={componente === 'fisica' ? 'fisica' : 'matematica'}
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
