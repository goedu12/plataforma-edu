'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Lightbulb, Clock } from 'lucide-react'
import Button from './ui/Button'
import Card from './ui/Card'
import Badge from './ui/Badge'
import type { Questao, Componente } from '@/types'

interface QuestaoCardProps {
  questao: Questao
  componente: Componente
  tempoDecorrido: number
  onResponder: (resposta: 'A' | 'B' | 'C' | 'D', usouDica: boolean) => void
  onProxima: () => void
  onVoltar: () => void
}

type Alternativa = 'A' | 'B' | 'C' | 'D'

interface FeedbackData {
  correta: boolean
  respostaCorreta: Alternativa
  explicacao: string
  pontosGanhos: number
}

export default function QuestaoCard({
  questao,
  componente,
  tempoDecorrido,
  onResponder,
  onProxima,
  onVoltar,
}: QuestaoCardProps) {
  const [selecionada, setSelecionada] = useState<Alternativa | null>(null)
  const [mostrarDica, setMostrarDica] = useState(false)
  const [usouDica, setUsouDica] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(false)

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
        }),
      })

      const data = await response.json()

      if (data.sucesso) {
        setFeedback({
          correta: data.correta,
          respostaCorreta: questao.resposta_correta as Alternativa,
          explicacao: data.explicacao,
          pontosGanhos: data.pontos_ganhos,
        })
        onResponder(selecionada, usouDica)
      }
    } catch (error) {
      console.error('Erro ao responder:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAlternativaStyle = (letra: Alternativa) => {
    const base =
      'flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200'

    if (feedback) {
      if (letra === feedback.respostaCorreta) {
        return `${base} border-green-500 bg-green-50`
      }
      if (letra === selecionada && !feedback.correta) {
        return `${base} border-red-500 bg-red-50`
      }
      return `${base} border-gray-200 opacity-50`
    }

    if (selecionada === letra) {
      return componente === 'fisica'
        ? `${base} border-fisica-500 bg-fisica-50`
        : `${base} border-matematica-500 bg-matematica-50`
    }

    return `${base} border-gray-200 hover:border-gray-300`
  }

  const dificuldadeColor = {
    facil: 'success',
    medio: 'warning',
    dificil: 'error',
  } as const

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={componente}>{questao.tema}</Badge>
          <Badge variant={dificuldadeColor[questao.dificuldade]}>{questao.dificuldade}</Badge>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-mono">{formatarTempo(tempoDecorrido)}</span>
        </div>
      </div>

      {/* Enunciado */}
      <Card>
        <p className="text-gray-800 leading-relaxed">{questao.enunciado}</p>
      </Card>

      {/* Alternativas */}
      <div className="space-y-3">
        {alternativas.map(({ letra, texto }) => (
          <button
            key={letra}
            onClick={() => !feedback && setSelecionada(letra)}
            disabled={!!feedback}
            className={getAlternativaStyle(letra)}
          >
            <span
              className={`
                flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm
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
            <span className="flex-1 text-left">{texto}</span>
          </button>
        ))}
      </div>

      {/* Dica */}
      {!feedback && questao.dica && (
        <div className="text-center">
          {mostrarDica ? (
            <Card className="bg-yellow-50 border border-yellow-200">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">{questao.dica}</p>
              </div>
            </Card>
          ) : (
            <button
              onClick={handlePedirDica}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 mx-auto"
            >
              <Lightbulb className="w-4 h-4" />
              Pedir Dica (−5 pts)
            </button>
          )}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <Card
          className={`animate-slide-up ${feedback.correta ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}
        >
          <div className="flex items-start gap-3">
            {feedback.correta ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
            <div>
              <h4
                className={`font-semibold ${feedback.correta ? 'text-green-800' : 'text-red-800'}`}
              >
                {feedback.correta ? 'Correto! 🎉' : 'Ops! 😕'}
                {feedback.correta && (
                  <span className="ml-2 text-sm font-normal">+{feedback.pontosGanhos} pontos</span>
                )}
              </h4>
              {!feedback.correta && (
                <p className="text-sm text-red-700 mt-1">
                  A resposta correta era <strong>{feedback.respostaCorreta}</strong>
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-current/10">
                <p className={`text-sm ${feedback.correta ? 'text-green-700' : 'text-red-700'}`}>
                  📖 {feedback.explicacao}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Botões de ação */}
      <div className="flex gap-3">
        {feedback ? (
          <>
            <Button variant="secondary" onClick={onVoltar} className="flex-1">
              🏠 Voltar ao Menu
            </Button>
            <Button componente={componente} onClick={onProxima} className="flex-1">
              Próxima Questão →
            </Button>
          </>
        ) : (
          <Button
            componente={componente}
            onClick={handleConfirmar}
            disabled={!selecionada}
            loading={loading}
            className="w-full"
          >
            Confirmar Resposta
          </Button>
        )}
      </div>
    </div>
  )
}
