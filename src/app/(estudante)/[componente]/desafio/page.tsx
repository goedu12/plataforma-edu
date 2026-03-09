'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Zap, Clock, CheckCircle2, XCircle, WifiOff, RefreshCw, Trophy, ArrowRight, Lightbulb, ArrowLeft } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import EnunciadoUnificado from '@/components/EnunciadoUnificado'
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

        <header className="header-chromebook" style={{ background: corPrimaria, borderColor: 'transparent' }}>
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <BackButton href={`/${componente}/menu`} mobileOnly />
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }} />
              <h1 className="font-semibold text-sm lg:text-base" style={{ color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }}>
                Resultado
              </h1>
            </div>
            <div className="w-11 mobile-only" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-3 py-4 lg:px-6 lg:py-5">
          {/* Card de Resultado - Compacto */}
          <div className="card-chromebook text-center p-4 lg:p-6">
            <div
              className="w-12 h-12 lg:w-14 lg:h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{
                background: isPerfeito || porcentagem >= 60 ? 'var(--success-bg-15)' : 'var(--warning-bg-15)',
                border: `2px solid ${isPerfeito || porcentagem >= 60 ? 'var(--success)' : 'var(--warning)'}`,
              }}
            >
              <Trophy
                className="w-6 h-6 lg:w-7 lg:h-7"
                style={{ color: isPerfeito || porcentagem >= 60 ? 'var(--success)' : 'var(--warning)' }}
              />
            </div>

            <p
              className="text-2xl lg:text-3xl font-bold"
              style={{ color: isPerfeito || porcentagem >= 60 ? 'var(--success)' : 'var(--warning)' }}
            >
              {resultado.acertos}/{resultado.total}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {isPerfeito ? 'Perfeito!' : porcentagem >= 60 ? 'Bom trabalho!' : 'Continue praticando!'}
            </p>

            <div className="mt-2 rounded-lg p-2" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-lg lg:text-xl font-bold" style={{ color: 'var(--success)' }}>
                +{resultado.pontos_ganhos} pts
              </p>
              {resultado.bonus_perfeito && (
                <p className="text-[10px]" style={{ color: 'var(--warning)' }}>Bônus perfeito!</p>
              )}
            </div>
          </div>

          {/* Lista de Respostas - Compacta */}
          <div className="mt-3 space-y-1">
            <p className="text-[10px] font-medium px-1" style={{ color: 'var(--text-muted)' }}>
              Suas Respostas
            </p>
            {resultado.resultados.map((r, index) => (
              <div
                key={r.questao_id}
                className="rounded-lg p-2 flex items-center gap-2"
                style={{
                  background: 'var(--bg-surface)',
                  border: `1px solid ${r.correta ? 'var(--success-bg-30)' : 'var(--error-bg-30)'}`,
                }}
              >
                <div
                  className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: r.correta ? 'var(--success-bg-15)' : 'var(--error-bg-15)' }}
                >
                  {r.correta ? (
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" style={{ color: 'var(--error)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>
                    Q{index + 1}: {r.resposta_dada || '—'} {r.correta ? '✓' : '✗'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant={isFisica ? 'fisica' : 'matematica'}
            onClick={handleVoltar}
            className="w-full mt-4 btn-chromebook"
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

        <header className="header-chromebook">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <BackButton href={`/${componente}/menu`} mobileOnly />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: corPrimaria }} />
              <h1 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Desafio</h1>
            </div>
            <div className="w-11 mobile-only" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="card-chromebook p-6 text-center">
            <div
              className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'var(--error-bg-15)', border: '1px solid var(--error-bg-30)' }}
            >
              <WifiOff className="w-6 h-6" style={{ color: 'var(--error)' }} />
            </div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              {status === 'SEM_QUESTOES' ? 'Questões Insuficientes' : 'Erro'}
            </h2>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>{erro}</p>
            <div className="flex gap-2 mt-4 justify-center">
              <Button variant="secondary" onClick={iniciarDesafio} leftIcon={<RefreshCw className="w-3.5 h-3.5" />} className="btn-chromebook">
                Tentar
              </Button>
              <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={handleVoltar} className="btn-chromebook">
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
  // TELA DO DESAFIO EM ANDAMENTO - ULTRA COMPACTA
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
    <div className="min-h-screen lg:h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* ══════════════════════════════════════════════════════════════════
          HEADER ULTRA COMPACTO
          ══════════════════════════════════════════════════════════════════ */}
      <header className="header-chromebook flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* Linha 1: Back + Título + Timer + Progress (desktop) */}
          <div className="flex items-center gap-2 lg:gap-3">
            <BackButton href={`/${componente}/menu`} mobileOnly />

            {/* Tag tema - só desktop */}
            <span className="hidden lg:inline badge-chromebook" style={{ background: isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)', color: corPrimaria }}>
              {questaoAtualData?.tema}
            </span>

            <div className="flex items-center gap-1.5 flex-1 lg:flex-none lg:ml-auto">
              <Zap className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: corPrimaria }} />
              <span className="font-semibold text-sm lg:text-base" style={{ color: 'var(--text-primary)' }}>
                Desafio
              </span>
            </div>

            {/* Timer */}
            <div
              className={`timer-chromebook font-bold ${tempoPerigo ? 'animate-pulse' : ''}`}
              style={{
                background: tempoPerigo ? 'var(--error-bg-15)' : 'var(--bg-elevated)',
                color: tempoPerigo ? 'var(--error)' : corPrimaria,
                border: `1px solid ${tempoPerigo ? 'var(--error-bg-30)' : 'transparent'}`,
              }}
            >
              <Clock className="w-3 h-3" />
              <span>{formatarTempo(tempoRestante)}</span>
            </div>

            {/* Progress inline - desktop */}
            <div className="hidden lg:flex items-center gap-1">
              {questoes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setQuestaoAtual(index)}
                  className="w-4 h-2 rounded-sm transition-all"
                  style={{
                    background: index === questaoAtual
                      ? corPrimaria
                      : respostas[index]
                        ? isFisica ? 'var(--color-fisica-bg-50)' : 'var(--color-matematica-bg-50)'
                        : 'var(--bg-elevated)',
                  }}
                />
              ))}
              <span className="text-[10px] ml-1 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {questaoAtual + 1}/{questoes.length}
              </span>
            </div>
          </div>

          {/* Progress mobile */}
          <div className="flex lg:hidden items-center gap-2 mt-1.5">
            <div className="flex gap-0.5 flex-1">
              {questoes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setQuestaoAtual(index)}
                  className="flex-1 h-1 rounded-full"
                  style={{
                    background: index === questaoAtual
                      ? corPrimaria
                      : respostas[index]
                        ? isFisica ? 'var(--color-fisica-bg-50)' : 'var(--color-matematica-bg-50)'
                        : 'var(--bg-elevated)',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {questaoAtual + 1}/{questoes.length}
            </span>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          CONTEÚDO - Tudo junto sem espaço extra
          ══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-3xl mx-auto w-full flex flex-col min-h-0 overflow-hidden">
        {questaoAtualData && (
          <div className="flex-1 overflow-y-auto px-3 py-2 lg:px-6 lg:py-4">
            <div className="space-chromebook">
              {/* Tag mobile */}
              <div className="flex lg:hidden items-center gap-2">
                <span className="badge-chromebook" style={{ background: isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)', color: corPrimaria }}>
                  {questaoAtualData.tema}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {respostas.filter(r => r !== null).length} respondidas
                </span>
              </div>

              {/* Enunciado - Modo Compacto para Desafio */}
              <div className="card-chromebook">
                <EnunciadoUnificado
                  enunciado={questaoAtualData.enunciado}
                  modo="compacto"
                  extrairTitulo={false}
                  extrairFonte={false}
                  className="enunciado-chromebook"
                />
              </div>

              {/* Alternativas - Ultra compactas */}
              <div className="space-chromebook">
                {alternativas.map(({ letra, texto }) => (
                  <button
                    key={letra}
                    onClick={() => handleSelecionarResposta(letra)}
                    className="alternativa-chromebook"
                    style={{
                      background: respostaAtual === letra
                        ? isFisica ? 'var(--color-fisica-bg-15)' : 'var(--color-matematica-bg-15)'
                        : 'var(--bg-surface)',
                      border: `2px solid ${respostaAtual === letra ? corPrimaria : 'var(--border-default)'}`,
                    }}
                  >
                    <span
                      className="alternativa-letra-compact"
                      style={{
                        background: respostaAtual === letra ? corPrimaria : 'var(--bg-elevated)',
                        color: respostaAtual === letra ? (isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)') : 'var(--text-muted)',
                      }}
                    >
                      {letra}
                    </span>
                    <span className="texto-alternativa-chromebook flex-1" style={{ color: 'var(--text-primary)' }}>
                      {formatarFormula(texto)}
                    </span>
                  </button>
                ))}
              </div>

              {/* ══════════════════════════════════════════════════════════════════
                  BOTÕES - Logo abaixo do conteúdo (sem espaço extra)
                  ══════════════════════════════════════════════════════════════════ */}
              <div className="flex gap-2 mt-2 lg:mt-1.5">
                <Button
                  variant="secondary"
                  onClick={handleAnterior}
                  disabled={questaoAtual === 0}
                  className="flex-1 btn-chromebook"
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">Ant</span>
                </Button>
                {questaoAtual < questoes.length - 1 ? (
                  <Button
                    variant={isFisica ? 'fisica' : 'matematica'}
                    onClick={handleProxima}
                    className="flex-1 btn-chromebook"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <span className="sm:hidden">Próx</span>
                  </Button>
                ) : (
                  <Button
                    variant={isFisica ? 'fisica' : 'matematica'}
                    onClick={() => finalizarDesafio(false)}
                    disabled={!todasRespondidas}
                    className="flex-1 btn-chromebook"
                  >
                    Finalizar
                  </Button>
                )}
              </div>

              {!todasRespondidas && questaoAtual === questoes.length - 1 && (
                <p className="text-center text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  Responda todas para finalizar
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
