'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Zap, Clock, CheckCircle2, XCircle, WifiOff, RefreshCw, Trophy, ArrowRight } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Questao } from '@/types'
import { DESAFIO } from '@/types'

type StatusDesafio = 'NOVO' | 'EM_ANDAMENTO' | 'SEM_QUESTOES' | 'ERRO' | 'RESULTADO'

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

  const [desafioId, setDesafioId] = useState<string | null>(null)
  const [questoes, setQuestoes] = useState<QuestaoDesafio[]>([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostas, setRespostas] = useState<(string | null)[]>([])
  const [tempoRestante, setTempoRestante] = useState<number>(DESAFIO.TEMPO_SEGUNDOS)

  const [resultado, setResultado] = useState<{
    acertos: number
    total: number
    pontos_ganhos: number
    bonus_perfeito: boolean
    resultados: ResultadoQuestao[]
  } | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const tempoInicioRef = useRef<number>(Date.now())

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

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
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [componente])

  const handleSelecionarResposta = async (letra: string) => {
    if (!desafioId || !questoes[questaoAtual]) return

    const novasRespostas = [...respostas]
    novasRespostas[questaoAtual] = letra
    setRespostas(novasRespostas)

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

  const handleProxima = () => questaoAtual < questoes.length - 1 && setQuestaoAtual(prev => prev + 1)
  const handleAnterior = () => questaoAtual > 0 && setQuestaoAtual(prev => prev - 1)
  const handleVoltar = () => router.push(`/${componente}/menu`)

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}:${seg.toString().padStart(2, '0')}`
  }

  const tempoPerigo = tempoRestante <= 60

  if (loading && !questoes.length) {
    return <Loading fullScreen componente={componente} />
  }

  // Tela de Resultado
  if (status === 'RESULTADO' && resultado) {
    const porcentagem = Math.round((resultado.acertos / resultado.total) * 100)
    const isPerfeito = resultado.acertos === resultado.total

    return (
      <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
        <NavigationRail componente={componente} />
        <header
          className="px-4 py-4"
          style={{
            background: corPrimaria,
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={handleVoltar}
              className="p-3 -ml-2 rounded-xl transition-colors touch-target lg:hidden"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: isFisica ? '#000' : '#fff' }} />
              <h1
                className="font-display font-semibold"
                style={{ color: isFisica ? '#000' : '#fff' }}
              >
                Resultado do Desafio
              </h1>
            </div>
            <div className="w-12 lg:hidden" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-8 pb-8">
          {/* Card de Resultado */}
          <div
            className="card p-8 text-center animate-fade-in-up"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: isPerfeito || porcentagem >= 60 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `2px solid ${isPerfeito || porcentagem >= 60 ? 'var(--success)' : 'var(--warning)'}`,
              }}
            >
              <Trophy
                className="w-10 h-10"
                style={{ color: isPerfeito || porcentagem >= 60 ? 'var(--success)' : 'var(--warning)' }}
              />
            </div>

            <p
              className="font-display text-5xl font-bold"
              style={{ color: isPerfeito || porcentagem >= 60 ? 'var(--success)' : 'var(--warning)' }}
            >
              {resultado.acertos}/{resultado.total}
            </p>
            <p className="mt-2 text-lg" style={{ color: 'var(--text-secondary)' }}>
              {isPerfeito ? 'Perfeito!' : porcentagem >= 60 ? 'Bom trabalho!' : 'Continue praticando!'}
            </p>

            <div
              className="mt-6 pt-4 rounded-xl p-4"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                +{resultado.pontos_ganhos} pontos
              </p>
              {resultado.bonus_perfeito && (
                <p className="text-sm mt-1" style={{ color: 'var(--warning)' }}>
                  Incluindo bônus de acerto perfeito!
                </p>
              )}
            </div>
          </div>

          {/* Lista de Respostas */}
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Suas Respostas
            </p>
            {resultado.resultados.map((r, index) => (
              <div
                key={r.questao_id}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${r.correta ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: r.correta ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}
                >
                  {r.correta ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
                  ) : (
                    <XCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    Questão {index + 1}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Sua: {r.resposta_dada || '—'} • Correta: {r.resposta_correta}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Botão Voltar */}
          <Button
            variant={isFisica ? 'fisica' : 'matematica'}
            onClick={handleVoltar}
            className="w-full mt-8"
          >
            Voltar ao Menu
          </Button>
        </main>

        <BottomNav componente={componente} />
      </div>
    )
  }

  // Tela de Erro
  if (status === 'ERRO' || status === 'SEM_QUESTOES') {
    return (
      <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
        <NavigationRail componente={componente} />
        <header
          className="px-4 py-4"
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={handleVoltar}
              className="p-3 -ml-2 rounded-xl transition-colors touch-target lg:hidden"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: corPrimaria }} />
              <h1 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
                Modo Desafio
              </h1>
            </div>
            <div className="w-12 lg:hidden" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-8">
          <div
            className="card p-8 text-center animate-fade-in-up"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <WifiOff className="w-8 h-8" style={{ color: 'var(--error)' }} />
            </div>
            <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {status === 'SEM_QUESTOES' ? 'Questões Insuficientes' : 'Erro'}
            </h2>
            <p className="mt-2" style={{ color: 'var(--text-muted)' }}>{erro}</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
              <Button variant="secondary" onClick={iniciarDesafio} leftIcon={<RefreshCw className="w-4 h-4" />}>
                Tentar Novamente
              </Button>
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={handleVoltar}>
                Voltar
              </Button>
            </div>
          </div>
        </main>

        <BottomNav componente={componente} />
      </div>
    )
  }

  // Tela do Desafio em Andamento
  const questaoAtualData = questoes[questaoAtual]
  const respostaAtual = respostas[questaoAtual]
  const todasRespondidas = respostas.every(r => r !== null)

  const alternativas = questaoAtualData ? [
    { letra: 'A', texto: questaoAtualData.alternativa_a },
    { letra: 'B', texto: questaoAtualData.alternativa_b },
    { letra: 'C', texto: questaoAtualData.alternativa_c },
    { letra: 'D', texto: questaoAtualData.alternativa_d },
  ] : []

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />
      {/* Header com Timer */}
      <header
        className="px-4 py-4 sticky top-0 z-10"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleVoltar}
              className="p-3 -ml-2 rounded-xl transition-colors touch-target lg:hidden"
              style={{ color: 'var(--text-muted)' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: corPrimaria }} />
              <h1 className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
                Modo Desafio
              </h1>
            </div>

            {/* Timer */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-lg font-bold ${tempoPerigo ? 'animate-pulse' : ''}`}
              style={{
                background: tempoPerigo ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-elevated)',
                color: tempoPerigo ? 'var(--error)' : corPrimaria,
                border: `1px solid ${tempoPerigo ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-default)'}`,
              }}
            >
              <Clock className="w-4 h-4" />
              <span>{formatarTempo(tempoRestante)}</span>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex gap-1">
            {questoes.map((_, index) => (
              <button
                key={index}
                onClick={() => setQuestaoAtual(index)}
                className="flex-1 h-2 rounded-sm transition-all touch-target"
                style={{
                  background: index === questaoAtual
                    ? corPrimaria
                    : respostas[index]
                      ? isFisica ? 'rgba(34, 197, 94, 0.4)' : 'rgba(139, 92, 246, 0.4)'
                      : 'var(--bg-elevated)',
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Questão {questaoAtual + 1}/{questoes.length}
            </span>
            <span className="text-xs" style={{ color: corPrimaria }}>
              {respostas.filter(r => r !== null).length} respondidas
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 pt-6">
        {questaoAtualData && (
          <div className="animate-fade-in">
            {/* Card da Questão */}
            <div
              className="card p-5 mb-6"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-2 py-1 rounded-md text-xs font-medium"
                  style={{
                    background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                    color: corPrimaria,
                  }}
                >
                  {questaoAtualData.tema}
                </span>
              </div>
              <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {questaoAtualData.enunciado}
              </p>
            </div>

            {/* Alternativas */}
            <div className="space-y-3 mb-6">
              {alternativas.map(({ letra, texto }) => (
                <button
                  key={letra}
                  onClick={() => handleSelecionarResposta(letra)}
                  className="w-full p-4 rounded-xl flex items-center gap-4 transition-all touch-target"
                  style={{
                    background: respostaAtual === letra
                      ? isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)'
                      : 'var(--bg-surface)',
                    border: `2px solid ${respostaAtual === letra ? corPrimaria : 'var(--border-default)'}`,
                  }}
                >
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0"
                    style={{
                      background: respostaAtual === letra ? corPrimaria : 'var(--bg-elevated)',
                      color: respostaAtual === letra ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)',
                    }}
                  >
                    {letra}
                  </span>
                  <span className="text-left flex-1" style={{ color: 'var(--text-primary)' }}>
                    {texto}
                  </span>
                  {respostaAtual === letra && (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: corPrimaria }} />
                  )}
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
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Anterior
              </Button>
              {questaoAtual < questoes.length - 1 ? (
                <Button
                  variant={isFisica ? 'fisica' : 'matematica'}
                  onClick={handleProxima}
                  className="flex-1"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Próxima
                </Button>
              ) : (
                <Button
                  variant={isFisica ? 'fisica' : 'matematica'}
                  onClick={() => finalizarDesafio(false)}
                  disabled={!todasRespondidas}
                  className="flex-1"
                >
                  Finalizar
                </Button>
              )}
            </div>

            {!todasRespondidas && questaoAtual === questoes.length - 1 && (
              <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
                Responda todas as questões para finalizar
              </p>
            )}
          </div>
        )}

        {/* Dica */}
        <div
          className="mt-8 p-4 rounded-xl"
          style={{
            background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
            border: isFisica ? '1px solid var(--border-fisica)' : '1px solid var(--border-matematica)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: corPrimaria }}>Dica:</strong> {DESAFIO.QUESTOES} questões em {DESAFIO.TEMPO_SEGUNDOS / 60} minutos.
            Acerte todas para ganhar +{DESAFIO.BONUS_PERFEITO} pontos bônus!
          </p>
        </div>
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
