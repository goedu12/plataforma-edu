'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Lightbulb,
  CheckCircle,
  XCircle,
  ChevronRight,
  Clock,
  Target,
  Trophy,
  Zap,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'
import { formatarFormula } from '@/lib/formatacao'

interface Alternativas {
  A: string
  B: string
  C: string
  D: string
  E?: string
}

interface Questao {
  id: string
  enunciado: string
  alternativas: Alternativas
  dica: string
  feedback: string
  resposta_correta: string
  tipo_questao: string
  contexto: string
  tema: string
  subtema: string
}

interface Progresso {
  questoes_semana: number
  questoes_respondidas: number
  corretas?: number
  percentual?: number
  semana_completa?: boolean
  semana_atual?: number
}

export default function TrilhasEstudarPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  // Estados principais
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [serie, setSerie] = useState('')

  // Estados de UI
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [respondendo, setRespondendo] = useState(false)
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [mostrarDica, setMostrarDica] = useState(false)
  const [usouDica, setUsouDica] = useState(false)
  const [tempoInicio, setTempoInicio] = useState(Date.now())
  const [animandoProxima, setAnimandoProxima] = useState(false)

  // Modal de conclusão
  const [mostrarConclusao, setMostrarConclusao] = useState(false)
  const [resultadoSemana, setResultadoSemana] = useState<{
    avancou: boolean
    taxaAcerto: number
    novaSemana?: number
    mensagem: string
    semanaResetada?: boolean
  } | null>(null)

  // Carregar questões da API
  const carregarQuestoes = useCallback(async (userSerie: string): Promise<boolean> => {
    setGerando(true)

    try {
      const res = await fetch(`/api/trilhas/questoes?serie=${userSerie}`)
      const data = await res.json()

      if (data.erro) {
        console.error('Erro:', data.erro)
        setGerando(false)
        return false
      }

      // Atualizar progresso se disponível
      if (data.progresso) {
        setProgresso(data.progresso)
      }

      // Se tem questões, carregar
      if (data.questoes?.length > 0) {
        setQuestoes(data.questoes)
        setTempoInicio(Date.now())
        setGerando(false)
        return true
      }

      // Se semana completa
      if (data.progresso?.semana_completa) {
        setGerando(false)
        return false
      }

      // Se está gerando, tentar novamente após delay
      if (data.gerando) {
        await new Promise(r => setTimeout(r, 2000))
        return carregarQuestoes(userSerie)
      }

      setGerando(false)
      return false
    } catch (error) {
      console.error('Erro ao carregar questões:', error)
      setGerando(false)
      return false
    }
  }, [])

  // Inicialização
  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    const inicializar = async () => {
      try {
        const userRes = await fetch('/api/usuario')
        const userData = await userRes.json()

        if (!userData.sucesso) {
          router.push('/login')
          return
        }

        const anoUsuario = userData.usuario.ano
        let nivelUsuario = userData.usuario.nivel

        if (!nivelUsuario) {
          nivelUsuario = anoUsuario >= 6 && anoUsuario <= 9 ? 'EF' : 'EM'
        }

        const userSerie = nivelUsuario === 'EF' ? `${anoUsuario}EF` : `${anoUsuario}EM`
        setSerie(userSerie)

        await carregarQuestoes(userSerie)
      } catch (error) {
        console.error('Erro:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    inicializar()
  }, [router, componente, carregarQuestoes])

  // Responder questão
  const responderQuestao = async (resposta: string) => {
    if (respondendo || mostrarResultado) return

    setRespostaSelecionada(resposta)
    setRespondendo(true)

    const tempoSegundos = Math.floor((Date.now() - tempoInicio) / 1000)
    const questaoData = questoes[questaoAtual]

    try {
      const res = await fetch('/api/trilhas/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questao_id: questaoData.id,
          resposta: resposta.toUpperCase(),
          resposta_correta: questaoData.resposta_correta,
          tempo_segundos: tempoSegundos,
          usou_dica: usouDica,
          serie,
          feedback: questaoData.feedback,
        }),
      })

      const data = await res.json()

      if (data.sucesso && data.progresso) {
        setProgresso(data.progresso)
      }
    } catch (error) {
      console.error('Erro ao responder:', error)
    } finally {
      setRespondendo(false)
      setMostrarResultado(true)
    }
  }

  // Próxima questão com animação
  const proximaQuestao = async () => {
    if (questaoAtual < questoes.length - 1) {
      setAnimandoProxima(true)

      // Pequeno delay para animação
      await new Promise(r => setTimeout(r, 150))

      setQuestaoAtual(prev => prev + 1)
      setRespostaSelecionada(null)
      setMostrarResultado(false)
      setMostrarDica(false)
      setUsouDica(false)
      setTempoInicio(Date.now())

      setAnimandoProxima(false)
    } else {
      // Finalizar semana
      try {
        const res = await fetch('/api/trilhas/avancar-semana', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serie })
        })
        const data = await res.json()

        if (data.sucesso && data.progresso) {
          setResultadoSemana({
            avancou: data.progresso.avancou || false,
            taxaAcerto: data.progresso.taxa_acerto || 0,
            novaSemana: data.progresso.semana_atual,
            mensagem: data.mensagem || '',
            semanaResetada: data.progresso.semana_resetada || false
          })
          setMostrarConclusao(true)
        } else {
          router.push(`/${componente}/trilhas`)
        }
      } catch (error) {
        console.error('Erro ao finalizar:', error)
        router.push(`/${componente}/trilhas`)
      }
    }
  }

  // Toggle dica
  const toggleDica = () => {
    if (!mostrarDica) setUsouDica(true)
    setMostrarDica(prev => !prev)
  }

  // Reiniciar semana
  const reiniciarSemana = async () => {
    setMostrarConclusao(false)
    setResultadoSemana(null)
    setQuestaoAtual(0)
    setRespostaSelecionada(null)
    setMostrarResultado(false)
    setMostrarDica(false)
    setUsouDica(false)
    setQuestoes([])
    setLoading(true)

    await carregarQuestoes(serie)
    setLoading(false)
  }

  // Loading inicial
  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const textOnAccent = isFisica ? '#000' : '#fff'

  // Tela de sem questões / gerando
  if (questoes.length === 0) {
    const completou = progresso?.semana_completa

    return (
      <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <NavigationRail componente={componente} />

        <div className="text-center p-6 max-w-sm">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
            {gerando ? (
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: accentColor }} />
            ) : completou ? (
              <Trophy className="w-10 h-10" style={{ color: accentColor }} />
            ) : (
              <Zap className="w-10 h-10" style={{ color: accentColor }} />
            )}
          </div>

          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {gerando ? 'Preparando questões...' : completou ? 'Semana Completa!' : 'Pronto para começar'}
          </h2>

          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {gerando
              ? 'Criando questões personalizadas para você...'
              : completou
                ? 'Você já completou as questões desta semana. Volte depois para continuar!'
                : 'Clique para gerar suas questões personalizadas.'
            }
          </p>

          {gerando ? (
            <div className="flex items-center justify-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: accentColor, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              {!completou && (
                <button
                  onClick={() => carregarQuestoes(serie)}
                  className="px-6 py-3 rounded-xl font-semibold transition-transform active:scale-95"
                  style={{ background: accentColor, color: textOnAccent }}
                >
                  Começar
                </button>
              )}
              <button
                onClick={() => router.push(`/${componente}/trilhas`)}
                className="px-6 py-3 rounded-xl font-medium transition-transform active:scale-95"
                style={{
                  background: completou ? accentColor : 'var(--bg-elevated)',
                  color: completou ? textOnAccent : 'var(--text-secondary)'
                }}
              >
                {completou ? 'Ver Trilhas' : 'Voltar'}
              </button>
            </div>
          )}
        </div>

        <BottomNav componente={componente} />
      </div>
    )
  }

  // Questão atual
  const questao = questoes[questaoAtual]
  const acertou = respostaSelecionada?.toUpperCase() === questao.resposta_correta?.toUpperCase()
  const progressoAtual = progresso?.questoes_respondidas ?? questaoAtual
  const progressoTotal = progresso?.questoes_semana ?? questoes.length

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* Header - Compacto como modo estudar */}
      <header className="header-chromebook flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/${componente}/trilhas`)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-95 lg:hidden"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </button>

            <div className="flex items-center gap-1.5 flex-1">
              <Target className="w-4 h-4" style={{ color: accentColor }} />
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Trilha</span>
            </div>

            <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {questaoAtual + 1}/{questoes.length}
            </span>
          </div>

          {/* Barra de progresso compacta */}
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex gap-0.5 flex-1">
              {Array.from({ length: questoes.length }).map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-1 rounded-full"
                  style={{
                    background: index < questaoAtual + (mostrarResultado ? 1 : 0) ? accentColor : 'var(--bg-elevated)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo - Compacto */}
      <main
        className={`flex-1 max-w-2xl mx-auto w-full px-3 py-2 lg:px-4 transition-opacity duration-150 ${animandoProxima ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Enunciado - Estilo compacto como modo estudar */}
        <div className="card-chromebook mb-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          {questao.tema && (
            <span className="badge-chromebook mb-2 inline-block" style={{ background: `${accentColor}15`, color: accentColor }}>
              {questao.tema}
            </span>
          )}
          <p className="enunciado-chromebook" style={{ color: 'var(--text-primary)' }}>
            {formatarFormula(questao.enunciado)}
          </p>
        </div>

        {/* Dica - Compacta */}
        {!mostrarResultado && questao.dica && (
          <div className="mb-2">
            {mostrarDica ? (
              <div className="feedback-chromebook" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed var(--color-warning)' }}>
                <div className="flex items-center gap-1 mb-0.5">
                  <Lightbulb className="w-3.5 h-3.5" style={{ color: 'var(--color-warning)' }} />
                  <span className="text-[10px] font-medium" style={{ color: 'var(--color-warning)' }}>Dica</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatarFormula(questao.dica)}</p>
              </div>
            ) : (
              <button
                onClick={toggleDica}
                className="w-full py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 text-xs"
                style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-default)', color: 'var(--text-muted)' }}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Precisa de uma dica?</span>
              </button>
            )}
          </div>
        )}

        {/* Alternativas - Estilo compacto como modo estudar */}
        <div className="space-y-2">
          {Object.entries(questao.alternativas)
            .filter(([, texto]) => texto)
            .map(([letra, texto]) => {
              const isSelected = respostaSelecionada === letra
              const isCorrect = letra === questao.resposta_correta
              const showResult = mostrarResultado

              let style: React.CSSProperties = { background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }

              if (showResult) {
                if (isCorrect) {
                  style = { background: 'rgba(34, 197, 94, 0.2)', border: '2px solid var(--success)' }
                } else if (isSelected) {
                  style = { background: 'rgba(239, 68, 68, 0.2)', border: '2px solid var(--error)' }
                } else {
                  style = { ...style, opacity: 0.5 }
                }
              } else if (isSelected) {
                style = {
                  background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                  border: `2px solid ${accentColor}`
                }
              }

              return (
                <button
                  key={letra}
                  onClick={() => !mostrarResultado && !respondendo && responderQuestao(letra)}
                  disabled={mostrarResultado || respondendo}
                  className="alternativa-chromebook"
                  style={style}
                >
                  <span
                    className="alternativa-letra-compact"
                    style={{
                      background: showResult && isCorrect
                        ? 'var(--success)'
                        : showResult && isSelected
                          ? 'var(--error)'
                          : isSelected
                            ? accentColor
                            : 'var(--bg-elevated)',
                      color: (showResult && (isCorrect || isSelected)) || isSelected
                        ? isFisica ? '#000' : '#fff'
                        : 'var(--text-muted)',
                    }}
                  >
                    {showResult && isCorrect ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : showResult && isSelected ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      letra
                    )}
                  </span>
                  <span className="texto-alternativa-chromebook flex-1" style={{ color: 'var(--text-primary)' }}>
                    {formatarFormula(texto as string)}
                  </span>
                  {respondendo && isSelected && (
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: accentColor }} />
                  )}
                </button>
              )
            })}
        </div>

        {/* Feedback - Compacto como modo estudar */}
        {mostrarResultado && (
          <div className="mt-3 space-y-2">
            <div
              className="feedback-chromebook flex items-center gap-2"
              style={{
                background: acertou ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${acertou ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              }}
            >
              <div
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ background: acertou ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}
              >
                {acertou ? <CheckCircle className="w-3 h-3" style={{ color: 'var(--success)' }} /> : <XCircle className="w-3 h-3" style={{ color: 'var(--error)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm" style={{ color: acertou ? 'var(--success)' : 'var(--error)' }}>
                  {acertou ? 'Correto!' : 'Incorreto'}
                </span>
                {questao.feedback && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {formatarFormula(questao.feedback)}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={proximaQuestao}
              className="w-full btn-chromebook py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ background: accentColor, color: textOnAccent }}
            >
              {questaoAtual < questoes.length - 1 ? (
                <>Próxima <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Finalizar <Trophy className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}
      </main>

      <BottomNav componente={componente} />

      {/* Modal de Conclusão */}
      {mostrarConclusao && resultadoSemana && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center animate-in zoom-in-95 duration-200" style={{ background: 'var(--bg-surface)' }}>
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: resultadoSemana.avancou ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)' }}
            >
              {resultadoSemana.avancou ? (
                <Trophy className="w-8 h-8" style={{ color: 'var(--color-success)' }} />
              ) : (
                <Target className="w-8 h-8" style={{ color: 'var(--color-warning)' }} />
              )}
            </div>

            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {resultadoSemana.avancou ? 'Parabéns!' : 'Continue praticando!'}
            </h2>

            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {resultadoSemana.mensagem || (resultadoSemana.avancou ? 'Você completou a semana!' : 'Precisa de 60% para avançar')}
            </p>

            <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--bg-elevated)' }}>
              <p className="text-3xl font-bold" style={{ color: accentColor }}>{resultadoSemana.taxaAcerto}%</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Taxa de acerto</p>
            </div>

            {resultadoSemana.avancou && resultadoSemana.novaSemana && (
              <p className="text-sm mb-4" style={{ color: 'var(--color-success)' }}>
                Avançou para a semana {resultadoSemana.novaSemana}!
              </p>
            )}

            <div className="space-y-2">
              {resultadoSemana.semanaResetada && (
                <button
                  onClick={reiniciarSemana}
                  className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ background: accentColor, color: textOnAccent }}
                >
                  <RefreshCw className="w-4 h-4" /> Tentar Novamente
                </button>
              )}
              <button
                onClick={() => router.push(`/${componente}/trilhas`)}
                className="w-full py-3 rounded-xl font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: resultadoSemana.semanaResetada ? 'var(--bg-elevated)' : accentColor,
                  color: resultadoSemana.semanaResetada ? 'var(--text-secondary)' : textOnAccent
                }}
              >
                {resultadoSemana.avancou ? 'Continuar' : 'Ver Trilhas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
