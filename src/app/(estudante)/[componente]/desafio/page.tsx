'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Zap, Clock, CheckCircle2, XCircle, WifiOff, RefreshCw, Trophy, AlertTriangle, ArrowRight } from 'lucide-react'
import Loading from '@/components/ui/Loading'
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

  const tempoPerigo = tempoRestante <= 60

  if (loading && !questoes.length) {
    return <Loading fullScreen componente={componente} />
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TELA DE RESULTADO - ESTILO KOYEB
  // ═══════════════════════════════════════════════════════════════════════════
  if (status === 'RESULTADO' && resultado) {
    const porcentagem = Math.round((resultado.acertos / resultado.total) * 100)
    const isPerfeito = resultado.acertos === resultado.total

    return (
      <div className="min-h-screen" style={{ background: '#1A1A2E' }}>
        {/* Header Terminal */}
        <header className="px-4 py-4 border-b" style={{ borderColor: '#3D3D4A' }}>
          <div className="max-w-2xl mx-auto flex items-center justify-center gap-3">
            <Trophy className="w-5 h-5" style={{ color: '#00FF88' }} />
            <h1 className="font-mono text-sm font-bold tracking-wider uppercase" style={{ color: '#FFFFFF' }}>
              RESULTADO DO DESAFIO
            </h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-8 pb-8">
          {/* Terminal Card - Resultado */}
          <div className="terminal-box">
            <div className="terminal-header">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="title">resultado.sh</span>
            </div>
            <div className="terminal-body text-center">
              <p className="comment text-left"># Desafio finalizado</p>
              <div className="mt-4">
                <p className={`text-6xl font-bold ${isPerfeito || porcentagem >= 60 ? 'success' : 'warning'}`}>
                  {resultado.acertos}/{resultado.total}
                </p>
                <p className="mt-2 text-lg muted">
                  {isPerfeito ? '$ PERFEITO!' : porcentagem >= 60 ? '$ Bom trabalho!' : '$ Continue praticando!'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-center gap-2">
                  <span className="success">→</span>
                  <span className="text-xl font-bold success">+{resultado.pontos_ganhos} PONTOS</span>
                </div>
                {resultado.bonus_perfeito && (
                  <p className="mt-2 text-xs warning">Incluindo bonus de acerto perfeito!</p>
                )}
              </div>
            </div>
          </div>

          {/* Lista de Respostas */}
          <div className="mt-6 space-y-3">
            <p className="font-mono text-xs uppercase tracking-wider" style={{ color: '#A0A0A0' }}>
              SUAS RESPOSTAS
            </p>
            {resultado.resultados.map((r, index) => (
              <div
                key={r.questao_id}
                className="rounded-lg p-4 flex items-start gap-3"
                style={{
                  background: '#2D2D3A',
                  border: `1px solid ${r.correta ? '#00FF88' : '#FF5F56'}33`,
                }}
              >
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: r.correta ? '#00FF8820' : '#FF5F5620' }}
                >
                  {r.correta ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#00FF88' }} />
                  ) : (
                    <XCircle className="w-4 h-4" style={{ color: '#FF5F56' }} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-mono text-sm font-medium" style={{ color: '#FFFFFF' }}>
                    Questão {index + 1}
                  </p>
                  <p className="font-mono text-xs mt-1" style={{ color: '#A0A0A0' }}>
                    Sua: {r.resposta_dada || '—'} • Correta: {r.resposta_correta}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Botão Voltar */}
          <button
            onClick={handleVoltar}
            className="mt-8 w-full py-3 px-6 font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'transparent',
              border: '2px solid #00FF88',
              color: '#00FF88',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#00FF88'
              e.currentTarget.style.color = '#1A1A2E'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#00FF88'
            }}
          >
            <span>▸</span> VOLTAR AO MENU
          </button>
        </main>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TELA DE ERRO - ESTILO KOYEB
  // ═══════════════════════════════════════════════════════════════════════════
  if (status === 'ERRO' || status === 'SEM_QUESTOES') {
    return (
      <div className="min-h-screen" style={{ background: '#1A1A2E' }}>
        <header className="px-4 py-4 border-b" style={{ borderColor: '#3D3D4A' }}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={handleVoltar}
              className="p-2 -ml-2 rounded transition-colors"
              style={{ color: '#A0A0A0' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: '#00FF88' }} />
              <h1 className="font-mono text-sm font-bold tracking-wider uppercase" style={{ color: '#FFFFFF' }}>
                MODO DESAFIO
              </h1>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-8">
          <div className="terminal-box terminal-red">
            <div className="terminal-header">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="title">erro.sh</span>
            </div>
            <div className="terminal-body text-center py-4">
              <WifiOff className="w-12 h-12 mx-auto mb-4 text-error" />
              <p className="font-mono text-lg font-bold text-white">
                {status === 'SEM_QUESTOES' ? 'QUESTOES INSUFICIENTES' : 'ERRO'}
              </p>
              <p className="font-mono text-sm mt-2 muted">{erro}</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
                <button
                  onClick={iniciarDesafio}
                  className="py-3 px-6 font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  style={{
                    background: 'transparent',
                    border: '2px solid #A0A0A0',
                    color: '#A0A0A0',
                  }}
                >
                  <RefreshCw className="w-4 h-4" /> TENTAR NOVAMENTE
                </button>
                <button
                  onClick={handleVoltar}
                  className="py-3 px-6 font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                  style={{
                    background: 'transparent',
                    border: '2px solid #00FF88',
                    color: '#00FF88',
                  }}
                >
                  <span>▸</span> VOLTAR
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TELA DO DESAFIO EM ANDAMENTO - ESTILO KOYEB
  // ═══════════════════════════════════════════════════════════════════════════
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
    <div className="min-h-screen pb-8" style={{ background: '#1A1A2E' }}>
      {/* Header com Timer */}
      <header className="px-4 py-4 sticky top-0 z-10" style={{ background: '#1A1A2E', borderBottom: '1px solid #3D3D4A' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            {/* Botão Voltar */}
            <button
              onClick={handleVoltar}
              className="p-2 -ml-2 rounded-lg transition-colors flex items-center gap-1"
              style={{ color: '#A0A0A0' }}
              title="Sair do desafio"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" style={{ color: '#00FF88' }} />
              <h1 className="font-mono text-sm font-bold tracking-wider uppercase" style={{ color: '#FFFFFF' }}>
                MODO DESAFIO
              </h1>
            </div>
            {/* Timer */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded font-mono text-lg font-bold ${tempoPerigo ? 'animate-pulse' : ''}`}
              style={{
                background: tempoPerigo ? '#FF5F5620' : '#2D2D3A',
                color: tempoPerigo ? '#FF5F56' : '#00FF88',
                border: `1px solid ${tempoPerigo ? '#FF5F56' : '#00FF88'}33`,
              }}
            >
              <Clock className="w-4 h-4" />
              <span>{formatarTempo(tempoRestante)}</span>
            </div>
          </div>

          {/* Indicadores de questão - estilo barra de progresso */}
          <div className="flex gap-1">
            {questoes.map((_, index) => (
              <button
                key={index}
                onClick={() => setQuestaoAtual(index)}
                className="flex-1 h-2 rounded-sm transition-all"
                style={{
                  background: index === questaoAtual
                    ? '#00FF88'
                    : respostas[index]
                      ? '#00FF8866'
                      : '#3D3D4A',
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="font-mono text-xs" style={{ color: '#A0A0A0' }}>
              QUESTÃO {questaoAtual + 1}/{questoes.length}
            </span>
            <span className="font-mono text-xs" style={{ color: '#00FF88' }}>
              {respostas.filter(r => r !== null).length} RESPONDIDAS
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 pt-6">
        {questaoAtualData && (
          <div className="animate-fade-in">
            {/* Terminal com Enunciado */}
            <div className="question-card mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F56' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: '#27CA40' }} />
                <span className="ml-2 font-mono text-xs" style={{ color: '#8B8B9A' }}>
                  questao_{questaoAtual + 1}.txt
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="badge-green text-xs">
                    {questaoAtualData.tema}
                  </span>
                </div>
              </div>
              <p className="question-text">
                {questaoAtualData.enunciado}
              </p>
            </div>

            {/* Alternativas */}
            <div className="space-y-3 mb-6">
              {alternativas.map(({ letra, texto }) => (
                <button
                  key={letra}
                  onClick={() => handleSelecionarResposta(letra)}
                  className={`question-option ${respostaAtual === letra ? 'selected' : ''}`}
                >
                  <span className="option-letter">
                    {letra}
                  </span>
                  <span className="option-text">
                    {texto}
                  </span>
                  {respostaAtual === letra && (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#00FF88' }} />
                  )}
                </button>
              ))}
            </div>

            {/* Navegação */}
            <div className="flex gap-3">
              <button
                onClick={handleAnterior}
                disabled={questaoAtual === 0}
                className="flex-1 py-3 px-4 font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                style={{
                  background: 'transparent',
                  border: '2px solid #3D3D4A',
                  color: '#A0A0A0',
                }}
              >
                <ArrowLeft className="w-4 h-4" /> ANTERIOR
              </button>
              {questaoAtual < questoes.length - 1 ? (
                <button
                  onClick={handleProxima}
                  className="flex-1 py-3 px-4 font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: 'transparent',
                    border: '2px solid #00FF88',
                    color: '#00FF88',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#00FF88'
                    e.currentTarget.style.color = '#1A1A2E'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#00FF88'
                  }}
                >
                  PRÓXIMA <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => finalizarDesafio(false)}
                  disabled={!todasRespondidas}
                  className="flex-1 py-3 px-4 font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                  style={{
                    background: todasRespondidas ? '#00FF88' : 'transparent',
                    border: '2px solid #00FF88',
                    color: todasRespondidas ? '#1A1A2E' : '#00FF88',
                  }}
                >
                  <span>▸</span> FINALIZAR
                </button>
              )}
            </div>

            {!todasRespondidas && questaoAtual === questoes.length - 1 && (
              <p className="text-center font-mono text-xs mt-4" style={{ color: '#A0A0A0' }}>
                $ Responda todas as questões para finalizar
              </p>
            )}
          </div>
        )}

        {/* Terminal Info */}
        <div className="mt-8 terminal-box">
          <div className="terminal-header">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
            <span className="title">info.sh</span>
          </div>
          <div className="terminal-body space-y-1">
            <p className="comment"># Modo Desafio</p>
            <p className="success">→ {DESAFIO.QUESTOES} questoes em {DESAFIO.TEMPO_SEGUNDOS / 60} minutos</p>
            <p className="success">→ Acerte todas = +{DESAFIO.BONUS_PERFEITO} pontos bonus!</p>
            <p className="warning">→ SEM LIMITE - Faca quantos desafios quiser!</p>
          </div>
        </div>
      </main>
    </div>
  )
}
