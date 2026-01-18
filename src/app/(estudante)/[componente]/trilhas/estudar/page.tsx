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

      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 lg:py-2" style={{ background: 'var(--bg-base)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push(`/${componente}/trilhas`)}
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-95"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>

            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="font-medium">{questaoAtual + 1}/{questoes.length}</span>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((questaoAtual + (mostrarResultado ? 1 : 0)) / questoes.length) * 100}%`,
                background: accentColor,
              }}
            />
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main
        className={`max-w-2xl mx-auto px-4 py-4 transition-opacity duration-150 ${animandoProxima ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Enunciado */}
        <div className="p-4 rounded-xl mb-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
          {questao.tema && (
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 rounded-md text-xs font-medium" style={{ background: `${accentColor}20`, color: accentColor }}>
                {questao.tema}
              </span>
            </div>
          )}
          <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {questao.enunciado}
          </p>
        </div>

        {/* Dica */}
        {!mostrarResultado && questao.dica && (
          <>
            <button onClick={toggleDica} className="flex items-center gap-2 mb-3 text-sm font-medium" style={{ color: 'var(--color-warning)' }}>
              <Lightbulb className="w-4 h-4" />
              {mostrarDica ? 'Esconder dica' : 'Precisa de uma dica?'}
            </button>

            {mostrarDica && (
              <div className="p-3 rounded-xl mb-4 flex items-start gap-2" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--color-warning)' }}>
                <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{questao.dica}</p>
              </div>
            )}
          </>
        )}

        {/* Alternativas */}
        <div className="space-y-3">
          {Object.entries(questao.alternativas)
            .filter(([, texto]) => texto)
            .map(([letra, texto]) => {
              const isSelected = respostaSelecionada === letra
              const isCorrect = letra === questao.resposta_correta
              const showResult = mostrarResultado

              let bgColor = 'var(--bg-surface)'
              let borderColor = 'var(--border-default)'

              if (showResult) {
                if (isCorrect) {
                  bgColor = 'rgba(34, 197, 94, 0.15)'
                  borderColor = 'var(--color-success)'
                } else if (isSelected) {
                  bgColor = 'rgba(239, 68, 68, 0.15)'
                  borderColor = 'var(--color-error)'
                }
              } else if (isSelected) {
                bgColor = `${accentColor}15`
                borderColor = accentColor
              }

              return (
                <button
                  key={letra}
                  onClick={() => !mostrarResultado && !respondendo && responderQuestao(letra)}
                  disabled={mostrarResultado || respondendo}
                  className="w-full p-4 rounded-xl text-left transition-all duration-200 flex items-start gap-3 active:scale-[0.98]"
                  style={{ background: bgColor, border: `2px solid ${borderColor}` }}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: showResult && isCorrect ? 'var(--color-success)' : showResult && isSelected ? 'var(--color-error)' : `${accentColor}20`,
                      color: showResult && (isCorrect || isSelected) ? '#fff' : accentColor,
                    }}
                  >
                    {showResult && isCorrect ? <CheckCircle className="w-5 h-5" /> :
                     showResult && isSelected ? <XCircle className="w-5 h-5" /> : letra}
                  </span>
                  <span className="flex-1 text-sm pt-1" style={{ color: 'var(--text-primary)' }}>{texto}</span>
                  {respondendo && isSelected && (
                    <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: accentColor }} />
                  )}
                </button>
              )
            })}
        </div>

        {/* Feedback */}
        {mostrarResultado && (
          <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div
              className="p-4 rounded-xl"
              style={{
                background: acertou ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${acertou ? 'var(--color-success)' : 'var(--color-error)'}`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                {acertou ? (
                  <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
                ) : (
                  <XCircle className="w-5 h-5" style={{ color: 'var(--color-error)' }} />
                )}
                <span className="font-bold" style={{ color: acertou ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {acertou ? 'Muito bem!' : 'Não foi dessa vez'}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {questao.feedback}
              </p>
            </div>

            <button
              onClick={proximaQuestao}
              className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ background: accentColor, color: textOnAccent }}
            >
              {questaoAtual < questoes.length - 1 ? (
                <>Próxima <ChevronRight className="w-5 h-5" /></>
              ) : (
                <>Finalizar <Trophy className="w-5 h-5" /></>
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
