'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Zap, Clock, CheckCircle2, XCircle, WifiOff, RefreshCw, Trophy, ArrowRight, Lightbulb, ArrowLeft } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Questao } from '@/types'
import { DESAFIO } from '@/types'
import { formatarFormula } from '@/lib/formatacao'

type StatusDesafio = 'NOVO' | 'EM_ANDAMENTO' | 'SEM_QUESTOES' | 'ERRO' | 'RESULTADO'

interface QuestaoDesafio extends Omit<Questao, 'resposta_correta' | 'explicacao' | 'status' | 'criado_em' | 'ano' | 'subtema'> {
  id: string
  alternativa_e?: string
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

  // ═══════════════════════════════════════════════════════════════════════════
  // TELA DE RESULTADO
  // ═══════════════════════════════════════════════════════════════════════════
  if (status === 'RESULTADO' && resultado) {
    const porcentagem = Math.round((resultado.acertos / resultado.total) * 100)
    const isPerfeito = resultado.acertos === resultado.total

    return (
      <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
        <NavigationRail componente={componente} />

        {/* Header Compacto */}
        <header className="mobile-header" style={{ background: corPrimaria, borderColor: 'transparent' }}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <BackButton href={`/${componente}/menu`} mobileOnly />
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: isFisica ? '#000' : '#fff' }} />
              <h1 className="font-semibold" style={{ color: isFisica ? '#000' : '#fff' }}>
                Resultado
              </h1>
            </div>
            <div className="w-11 mobile-only" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          {/* Card de Resultado */}
          <div
            className="rounded-2xl p-6 text-center animate-fade-in-up"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: isPerfeito || porcentagem >= 60 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `2px solid ${isPerfeito || porcentagem >= 60 ? 'var(--success)' : 'var(--warning)'}`,
              }}
            >
              <Trophy
                className="w-8 h-8"
                style={{ color: isPerfeito || porcentagem >= 60 ? 'var(--success)' : 'var(--warning)' }}
              />
            </div>

            <p
              className="text-4xl font-bold"
              style={{ color: isPerfeito || porcentagem >= 60 ? 'var(--success)' : 'var(--warning)' }}
            >
              {resultado.acertos}/{resultado.total}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isPerfeito ? 'Perfeito!' : porcentagem >= 60 ? 'Bom trabalho!' : 'Continue praticando!'}
            </p>

            <div
              className="mt-4 rounded-xl p-3"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <p className="text-xl font-bold" style={{ color: 'var(--success)' }}>
                +{resultado.pontos_ganhos} pontos
              </p>
              {resultado.bonus_perfeito && (
                <p className="text-xs mt-1" style={{ color: 'var(--warning)' }}>
                  Incluindo bônus perfeito!
                </p>
              )}
            </div>
          </div>

          {/* Lista de Respostas */}
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium px-1" style={{ color: 'var(--text-muted)' }}>
              Suas Respostas
            </p>
            {resultado.resultados.map((r, index) => (
              <div
                key={r.questao_id}
                className="rounded-xl p-3 flex items-center gap-3"
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${r.correta ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: r.correta ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}
                >
                  {r.correta ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
                  ) : (
                    <XCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                    Questão {index + 1}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Sua resposta: {r.resposta_dada || '—'} • {r.correta ? 'Acertou!' : 'Errou'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Botão Voltar */}
          <Button
            variant={isFisica ? 'fisica' : 'matematica'}
            onClick={handleVoltar}
            className="w-full mt-6 min-h-[52px]"
          >
            Voltar ao Menu
          </Button>
        </main>

        <BottomNav componente={componente} />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TELA DE ERRO
  // ═══════════════════════════════════════════════════════════════════════════
  if (status === 'ERRO' || status === 'SEM_QUESTOES') {
    return (
      <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
        <NavigationRail componente={componente} />

        <header className="mobile-header">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <BackButton href={`/${componente}/menu`} mobileOnly />
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: corPrimaria }} />
              <h1 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                Modo Desafio
              </h1>
            </div>
            <div className="w-11 mobile-only" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <WifiOff className="w-7 h-7" style={{ color: 'var(--error)' }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {status === 'SEM_QUESTOES' ? 'Questões Insuficientes' : 'Erro'}
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>{erro}</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
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

  // ═══════════════════════════════════════════════════════════════════════════
  // TELA DO DESAFIO EM ANDAMENTO - OTIMIZADA
  // ═══════════════════════════════════════════════════════════════════════════
  const questaoAtualData = questoes[questaoAtual]
  const respostaAtual = respostas[questaoAtual]
  const todasRespondidas = respostas.every(r => r !== null)

  const alternativas = questaoAtualData ? [
    { letra: 'A', texto: questaoAtualData.alternativa_a },
    { letra: 'B', texto: questaoAtualData.alternativa_b },
    { letra: 'C', texto: questaoAtualData.alternativa_c },
    { letra: 'D', texto: questaoAtualData.alternativa_d },
    ...(questaoAtualData.alternativa_e ? [{ letra: 'E', texto: questaoAtualData.alternativa_e }] : []),
  ] : []

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER COMPACTO - Mobile-First
          ═══════════════════════════════════════════════════════════════════ */}
      <header className="mobile-header flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          {/* Linha 1: Navegação + Título + Timer */}
          <div className="flex items-center justify-between gap-2">
            <BackButton href={`/${componente}/menu`} mobileOnly />

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: corPrimaria }} />
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                Desafio
              </span>
            </div>

            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-sm font-bold ${tempoPerigo ? 'animate-pulse' : ''}`}
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

          {/* Linha 2: Progress + Counter */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-1 flex-1">
              {questoes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setQuestaoAtual(index)}
                  className="flex-1 h-1.5 rounded-full transition-all"
                  style={{
                    background: index === questaoAtual
                      ? corPrimaria
                      : respostas[index]
                        ? isFisica ? 'rgba(34, 197, 94, 0.5)' : 'rgba(139, 92, 246, 0.5)'
                        : 'var(--bg-elevated)',
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {questaoAtual + 1}/{questoes.length}
            </span>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTEÚDO - Área flexível
          ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-4 w-full flex flex-col">
        {questaoAtualData && (
          <div className="flex-1 flex flex-col animate-fade-in">
            {/* Tag do tema */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-1 rounded-lg text-xs font-medium"
                style={{
                  background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                  color: corPrimaria,
                }}
              >
                {questaoAtualData.tema}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {respostas.filter(r => r !== null).length} respondidas
              </span>
            </div>

            {/* Enunciado */}
            <div
              className="p-4 rounded-xl mb-3 flex-shrink-0"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {formatarFormula(questaoAtualData.enunciado)}
              </p>
            </div>

            {/* Alternativas */}
            <div className="space-y-2 flex-shrink-0">
              {alternativas.map(({ letra, texto }) => (
                <button
                  key={letra}
                  onClick={() => handleSelecionarResposta(letra)}
                  className="w-full min-h-[52px] px-3 py-3 rounded-xl flex items-center gap-3 transition-all active:scale-[0.98] text-left"
                  style={{
                    background: respostaAtual === letra
                      ? isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)'
                      : 'var(--bg-surface)',
                    border: `2px solid ${respostaAtual === letra ? corPrimaria : 'var(--border-default)'}`,
                  }}
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-bold flex-shrink-0 text-sm"
                    style={{
                      background: respostaAtual === letra ? corPrimaria : 'var(--bg-elevated)',
                      color: respostaAtual === letra ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)',
                    }}
                  >
                    {letra}
                  </span>
                  <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
                    {formatarFormula(texto)}
                  </span>
                  {respostaAtual === letra && (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: corPrimaria }} />
                  )}
                </button>
              ))}
            </div>

            {/* Dica compacta */}
            <div
              className="py-2 px-3 rounded-xl mb-3 flex items-center gap-2"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.08)' : 'rgba(139, 92, 246, 0.08)',
                border: '1px dashed var(--border-default)',
              }}
            >
              <Lightbulb className="w-4 h-4 flex-shrink-0" style={{ color: corPrimaria }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {DESAFIO.QUESTOES} questões em {DESAFIO.TEMPO_SEGUNDOS / 60}min. Bônus: +{DESAFIO.BONUS_PERFEITO}pts se acertar todas!
              </p>
            </div>

            {/* Navegação */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleAnterior}
                disabled={questaoAtual === 0}
                className="flex-1 min-h-[48px]"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Anterior
              </Button>
              {questaoAtual < questoes.length - 1 ? (
                <Button
                  variant={isFisica ? 'fisica' : 'matematica'}
                  onClick={handleProxima}
                  className="flex-1 min-h-[48px]"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Próxima
                </Button>
              ) : (
                <Button
                  variant={isFisica ? 'fisica' : 'matematica'}
                  onClick={() => finalizarDesafio(false)}
                  disabled={!todasRespondidas}
                  className="flex-1 min-h-[48px]"
                >
                  Finalizar
                </Button>
              )}
            </div>

            {!todasRespondidas && questaoAtual === questoes.length - 1 && (
              <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Responda todas as questões para finalizar
              </p>
            )}
          </div>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
