'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Zap, Clock, CheckCircle2, XCircle, WifiOff, RefreshCw, Trophy, AlertTriangle } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import Badge from '@/components/ui/Badge'
import type { Componente, Questao } from '@/types'
import { DESAFIO } from '@/types'

type StatusDesafio = 'NOVO' | 'EM_ANDAMENTO' | 'JA_FEZ' | 'SEM_QUESTOES' | 'ERRO' | 'RESULTADO'

interface QuestaoDesafio extends Omit<Questao, 'resposta_correta' | 'explicacao' | 'status' | 'criado_em' | 'ano' | 'subtema'> {
  id: string
}

interface ResultadoQuestao {
  questao_id: string
  resposta_dada: string | null
  resposta_correta: string
  correta: boolean
  explicacao: string
}

export default function DesafioPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [status, setStatus] = useState<StatusDesafio | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Estado do desafio
  const [desafioId, setDesafioId] = useState<string | null>(null)
  const [questoes, setQuestoes] = useState<QuestaoDesafio[]>([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostas, setRespostas] = useState<(string | null)[]>([])
  const [tempoRestante, setTempoRestante] = useState<number>(DESAFIO.TEMPO_SEGUNDOS)

  // Estado do resultado
  const [resultado, setResultado] = useState<{
    acertos: number
    total: number
    pontos_ganhos: number
    bonus_perfeito: boolean
    resultados: ResultadoQuestao[]
  } | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const tempoInicioRef = useRef<number>(Date.now())

  const finalizarDesafio = useCallback(async (timeout = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (!desafioId) return

    setLoading(true)
    try {
      const tempoTotal = Math.floor((Date.now() - tempoInicioRef.current) / 1000)
      const response = await fetch('/api/desafio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desafio_id: desafioId,
          finalizar: true,
          tempo_total: timeout ? DESAFIO.TEMPO_SEGUNDOS : tempoTotal,
        }),
      })

      const data = await response.json()

      if (data.sucesso && data.finalizado) {
        setResultado({
          acertos: data.acertos,
          total: data.total,
          pontos_ganhos: data.pontos_ganhos,
          bonus_perfeito: data.bonus_perfeito,
          resultados: data.resultados,
        })
        setStatus('RESULTADO')
      } else {
        setErro(data.erro || 'Erro ao finalizar desafio')
      }
    } catch (error) {
      console.error('Erro ao finalizar desafio:', error)
      setErro('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [desafioId])

  const iniciarDesafio = async () => {
    setLoading(true)
    setErro(null)

    try {
      const response = await fetch(`/api/desafio?componente=${componente}`)
      const data = await response.json()

      if (data.sucesso) {
        if (data.status === 'NOVO' || data.status === 'EM_ANDAMENTO') {
          setDesafioId(data.desafio.id)
          setQuestoes(data.desafio.questoes)
          setRespostas(data.desafio.respostas_dadas || new Array(DESAFIO.QUESTOES).fill(null))
          setTempoRestante(data.desafio.tempo_restante)
          tempoInicioRef.current = Date.now() - ((DESAFIO.TEMPO_SEGUNDOS - data.desafio.tempo_restante) * 1000)

          // Iniciar timer
          timerRef.current = setInterval(() => {
            setTempoRestante(prev => {
              if (prev <= 1) {
                finalizarDesafio(true)
                return 0
              }
              return prev - 1
            })
          }, 1000)

          setStatus('EM_ANDAMENTO')
        } else {
          setStatus(data.status)
        }
      } else {
        setStatus('ERRO')
        setErro(data.erro || 'Erro ao iniciar desafio')
      }
    } catch (error) {
      console.error('Erro ao iniciar desafio:', error)
      setStatus('ERRO')
      setErro('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    iniciarDesafio()

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [componente])

  const handleSelecionarResposta = async (letra: string) => {
    if (!desafioId || !questoes[questaoAtual]) return

    const novasRespostas = [...respostas]
    novasRespostas[questaoAtual] = letra
    setRespostas(novasRespostas)

    // Salvar resposta no servidor
    try {
      await fetch('/api/desafio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desafio_id: desafioId,
          questao_id: questoes[questaoAtual].id,
          resposta: letra,
        }),
      })
    } catch (error) {
      console.error('Erro ao salvar resposta:', error)
    }
  }

  const handleProxima = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1)
    }
  }

  const handleAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(prev => prev - 1)
    }
  }

  const handleVoltar = () => {
    router.push(`/${componente}/menu`)
  }

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}:${seg.toString().padStart(2, '0')}`
  }

  const nomeComponente = componente === 'fisica' ? 'Física' : 'Matemática'
  const isFisica = componente === 'fisica'
  const bgColor = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'

  if (loading && !questoes.length) {
    return <Loading fullScreen componente={componente} />
  }

  // Tela de Resultado
  if (status === 'RESULTADO' && resultado) {
    const porcentagem = Math.round((resultado.acertos / resultado.total) * 100)
    const isPerfeito = resultado.acertos === resultado.total

    return (
      <div className="min-h-screen bg-calm-bg pb-8">
        <header className={`${bgColor} text-white px-4 py-4`}>
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5" />
            <h1 className="font-semibold">Resultado do Desafio</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-6">
          <Card className="text-center py-8 animate-slide-up">
            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
              isPerfeito ? 'bg-yellow-100' : porcentagem >= 60 ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {isPerfeito ? (
                <Trophy className="w-10 h-10 text-yellow-500" />
              ) : porcentagem >= 60 ? (
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-orange-500" />
              )}
            </div>

            <h2 className="text-3xl font-bold text-text-primary mb-2">
              {resultado.acertos}/{resultado.total}
            </h2>
            <p className="text-text-secondary mb-4">
              {isPerfeito ? 'Perfeito! Você acertou todas!' :
               porcentagem >= 60 ? 'Bom trabalho!' : 'Continue praticando!'}
            </p>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${bgColor} text-white`}>
              +{resultado.pontos_ganhos} pontos
            </div>

            {resultado.bonus_perfeito && (
              <p className="text-sm text-yellow-600 mt-2">
                Incluindo bônus de acerto perfeito!
              </p>
            )}
          </Card>

          {/* Detalhes das respostas */}
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-text-primary">Suas Respostas:</h3>
            {resultado.resultados.map((r, index) => (
              <Card
                key={r.questao_id}
                className={`flex items-start gap-3 ${
                  r.correta ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                } border`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  r.correta ? 'bg-green-500' : 'bg-red-500'
                } text-white`}>
                  {r.correta ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    Questão {index + 1}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Sua resposta: {r.resposta_dada || 'Não respondida'} •
                    Correta: {r.resposta_correta}
                  </p>
                  {r.explicacao && !r.correta && (
                    <p className="text-xs text-text-muted mt-1">{r.explicacao}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={handleVoltar} className="flex-1">
              Voltar ao Menu
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Tela de Já Fez Hoje
  if (status === 'JA_FEZ') {
    return (
      <div className="min-h-screen bg-calm-bg pb-8">
        <header className={`${bgColor} text-white px-4 py-4`}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={handleVoltar} className="p-2 -ml-2 rounded-xl hover:bg-white/20">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <h1 className="font-semibold">Modo Desafio</h1>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-6">
          <Card className="text-center py-10 animate-slide-up">
            <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${bgColor}`}>
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Desafio Concluído!
            </h2>
            <p className="text-text-secondary mb-6">
              Você já completou o desafio de {nomeComponente} de hoje.
              Volte amanhã para um novo desafio!
            </p>
            <Button variant="primary" onClick={handleVoltar}>
              Voltar ao Menu
            </Button>
          </Card>
        </main>
      </div>
    )
  }

  // Tela de Erro
  if (status === 'ERRO' || status === 'SEM_QUESTOES') {
    return (
      <div className="min-h-screen bg-calm-bg pb-8">
        <header className={`${bgColor} text-white px-4 py-4`}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={handleVoltar} className="p-2 -ml-2 rounded-xl hover:bg-white/20">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <h1 className="font-semibold">Modo Desafio</h1>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-6">
          <Card className="text-center py-10 animate-slide-up">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-500/20 border border-red-500/30">
              <WifiOff className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              {status === 'SEM_QUESTOES' ? 'Questões Insuficientes' : 'Erro'}
            </h2>
            <p className="text-text-secondary mb-6">{erro}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="secondary" onClick={iniciarDesafio}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button variant="primary" onClick={handleVoltar}>
                Voltar ao Menu
              </Button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  // Tela do Desafio em Andamento
  const questaoAtualData = questoes[questaoAtual]
  const respostaAtual = respostas[questaoAtual]
  const todasRespondidas = respostas.every(r => r !== null)
  const tempoPerigo = tempoRestante <= 60

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

  const alternativas = questaoAtualData ? [
    { letra: 'A', texto: questaoAtualData.alternativa_a },
    { letra: 'B', texto: questaoAtualData.alternativa_b },
    { letra: 'C', texto: questaoAtualData.alternativa_c },
    { letra: 'D', texto: questaoAtualData.alternativa_d },
  ] : []

  return (
    <div className="min-h-screen bg-calm-bg pb-8">
      {/* Header */}
      <header className={`${bgColor} text-white px-4 py-4 sticky top-0 z-10`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <h1 className="font-semibold">Modo Desafio</h1>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-mono text-lg ${
              tempoPerigo ? 'bg-red-500 animate-pulse' : 'bg-white/20'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{formatarTempo(tempoRestante)}</span>
            </div>
          </div>

          {/* Indicadores de questão */}
          <div className="flex justify-center gap-2">
            {questoes.map((_, index) => (
              <button
                key={index}
                onClick={() => setQuestaoAtual(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  index === questaoAtual
                    ? 'bg-white text-gray-800 scale-110'
                    : respostas[index]
                      ? 'bg-white/50 text-white'
                      : 'bg-white/20 text-white/70'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 pt-6">
        {questaoAtualData && (
          <div className="animate-fade-in">
            {/* Header da questão */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant={componente}>{questaoAtualData.tema}</Badge>
                <Badge variant={dificuldadeColor[questaoAtualData.dificuldade as keyof typeof dificuldadeColor]}>
                  {dificuldadeLabel[questaoAtualData.dificuldade as keyof typeof dificuldadeLabel]}
                </Badge>
              </div>
              <span className="text-sm text-text-muted">
                {questaoAtual + 1} de {questoes.length}
              </span>
            </div>

            {/* Enunciado */}
            <Card className="mb-4">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {questaoAtualData.enunciado}
              </p>
            </Card>

            {/* Alternativas */}
            <div className="space-y-3 mb-6">
              {alternativas.map(({ letra, texto }) => (
                <button
                  key={letra}
                  onClick={() => handleSelecionarResposta(letra)}
                  className={`
                    flex items-center gap-3 p-4 border-2 rounded-xl w-full text-left transition-all
                    ${respostaAtual === letra
                      ? isFisica
                        ? 'border-fisica-500 bg-fisica-50'
                        : 'border-matematica-500 bg-matematica-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <span className={`
                    flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm flex-shrink-0
                    ${respostaAtual === letra
                      ? isFisica
                        ? 'bg-fisica-500 text-white'
                        : 'bg-matematica-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {letra}
                  </span>
                  <span className="flex-1">{texto}</span>
                </button>
              ))}
            </div>

            {/* Navegação */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleAnterior}
                disabled={questaoAtual === 0}
                className="flex-1"
              >
                ← Anterior
              </Button>
              {questaoAtual < questoes.length - 1 ? (
                <Button
                  variant={componente === 'fisica' ? 'fisica' : 'matematica'}
                  onClick={handleProxima}
                  className="flex-1"
                >
                  Próxima →
                </Button>
              ) : (
                <Button
                  variant={componente === 'fisica' ? 'fisica' : 'matematica'}
                  onClick={() => finalizarDesafio(false)}
                  disabled={!todasRespondidas}
                  className="flex-1"
                >
                  Finalizar
                </Button>
              )}
            </div>

            {!todasRespondidas && questaoAtual === questoes.length - 1 && (
              <p className="text-center text-sm text-text-muted mt-3">
                Responda todas as questões para finalizar
              </p>
            )}
          </div>
        )}

        {/* Dica */}
        <Card className="mt-6 animate-fade-in bg-orange-900/80 border border-orange-500/40 backdrop-blur-sm" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-orange-500/20 border border-orange-500/30">
              <Zap className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-orange-300 text-sm mb-1">💡 Modo Desafio</p>
              <p className="text-sm text-orange-100/90 leading-relaxed">
                {DESAFIO.QUESTOES} questões em {DESAFIO.TEMPO_SEGUNDOS / 60} minutos.
                Acerte todas para bônus de {DESAFIO.BONUS_PERFEITO} pontos!
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
