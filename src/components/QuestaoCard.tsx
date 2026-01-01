'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Lightbulb, Clock, AlertCircle, Trophy } from 'lucide-react'
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
      <Card>
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{questao.enunciado}</p>
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
            <span className="flex-1 text-left">{texto}</span>
          </button>
        ))}
      </div>

      {/* Erro */}
      {erro && (
        <Card className="bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-700">{erro}</p>
              <button
                onClick={handleConfirmar}
                className="text-sm text-red-600 underline mt-1 hover:text-red-800"
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
            <Card className="bg-yellow-50 border border-yellow-200">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-xs text-yellow-600 font-medium mb-1">💡 Dica:</p>
                  <p className="text-sm text-yellow-800">{questao.dica}</p>
                </div>
              </div>
            </Card>
          ) : (
            <button
              onClick={handlePedirDica}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 mx-auto"
            >
              <Lightbulb className="w-4 h-4" />
              Precisa de ajuda? Pedir Dica (−5 pts)
            </button>
          )}
        </div>
      )}

      {/* Conquistas Desbloqueadas */}
      {feedback && feedback.conquistasDesbloqueadas.length > 0 && (
        <Card className="bg-yellow-50 border-2 border-yellow-400 animate-bounce-once">
          <div className="text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <h4 className="font-bold text-yellow-800 mb-2">
              🎉 Nova Conquista Desbloqueada!
            </h4>
            <div className="flex flex-wrap justify-center gap-2">
              {feedback.conquistasDesbloqueadas.map((conquista, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full text-yellow-800 font-medium"
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
          className={`animate-slide-up ${feedback.correta ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}
        >
          <div className="flex items-start gap-3">
            {feedback.correta ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4
                className={`font-semibold ${feedback.correta ? 'text-green-800' : 'text-red-800'}`}
              >
                {feedback.correta ? 'Muito bem! Resposta correta! 🎉' : 'Não foi dessa vez... 😕'}
                {feedback.correta && feedback.pontosGanhos > 0 && (
                  <span className="ml-2 text-sm font-normal bg-green-200 px-2 py-0.5 rounded-full">
                    +{feedback.pontosGanhos} pontos
                  </span>
                )}
              </h4>
              {!feedback.correta && (
                <p className="text-sm text-red-700 mt-1">
                  A resposta correta era a alternativa <strong>{feedback.respostaCorreta}</strong>.
                  Não desanime, continue praticando!
                </p>
              )}
              {feedback.explicacao && (
                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className="text-xs font-medium mb-1 opacity-70">📖 Explicação:</p>
                  <p className={`text-sm ${feedback.correta ? 'text-green-700' : 'text-red-700'}`}>
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
