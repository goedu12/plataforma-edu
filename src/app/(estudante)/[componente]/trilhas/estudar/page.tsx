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
  HelpCircle,
  Zap,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'

interface Questao {
  id: string
  enunciado: string
  alternativas: {
    A: string
    B: string
    C: string
    D: string
    E: string
  }
  dica: string
  feedback: string
  resposta_correta: string
  tipo_questao: string
  contexto: string
  semana: number
  tema: string
  subtema: string
  respondida?: boolean
  resposta_usuario?: string
}

interface Progresso {
  trilha_id: string
  trilha_nome: string
  semana_atual: number
  total_semanas: number
  questoes_semana: number
  questoes_respondidas: number
  acertos_semana: number
  pontos_semana: number
}

export default function TrilhasEstudarPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [progresso, setProgresso] = useState<Progresso | null>(null)
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [respondendo, setRespondendo] = useState(false)
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [mostrarDica, setMostrarDica] = useState(false)
  const [usouDica, setUsouDica] = useState(false)
  const [tempoInicio, setTempoInicio] = useState<number>(0)
  const [serie, setSerie] = useState<string>('')
  const [mostrarConclusao, setMostrarConclusao] = useState(false)
  const [resultadoSemana, setResultadoSemana] = useState<{
    avancou: boolean
    taxaAcerto: number
    novaSemana?: number
    mensagem: string
  } | null>(null)

  const carregarQuestoes = useCallback(async (userSerie: string, tentativa: number = 1): Promise<boolean> => {
    try {
      const res = await fetch(`/api/trilhas/questoes?serie=${userSerie}`)
      const data = await res.json()

      if (data.questoes && data.questoes.length > 0) {
        setQuestoes(data.questoes)
        setTempoInicio(Date.now())
        setGerando(false)
        return true
      } else if (data.gerando) {
        // Questões estão sendo geradas, aguardar e tentar novamente
        setGerando(true)
        if (tentativa < 5) {
          console.log(`Questões sendo geradas, tentativa ${tentativa}/5...`)
          await new Promise(resolve => setTimeout(resolve, 3000))
          return carregarQuestoes(userSerie, tentativa + 1)
        }
      } else if (data.erro) {
        console.error('Erro:', data.erro)
      }

      if (data.progresso) {
        setProgresso(data.progresso)
      }

      setGerando(false)
      return false
    } catch (error) {
      console.error('Erro ao carregar questões:', error)
      setGerando(false)
      return false
    }
  }, [])

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    const inicializar = async () => {
      try {
        // Buscar usuário
        const userRes = await fetch('/api/usuario')
        const userData = await userRes.json()

        if (!userData.sucesso) {
          router.push('/login')
          return
        }

        const userSerie = `${userData.usuario.ano}EM`
        setSerie(userSerie)

        // Carregar questões
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

  const responderQuestao = async (resposta: string) => {
    if (respondendo || mostrarResultado) return

    setRespostaSelecionada(resposta)
    setRespondendo(true)

    const tempoSegundos = Math.floor((Date.now() - tempoInicio) / 1000)

    try {
      const res = await fetch('/api/trilhas/responder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questao_id: questoes[questaoAtual].id,
          resposta: resposta,
          tempo_segundos: tempoSegundos,
          usou_dica: usouDica,
        }),
      })

      const data = await res.json()

      if (data.sucesso) {
        // Atualizar questão com resultado
        const questoesAtualizadas = [...questoes]
        questoesAtualizadas[questaoAtual] = {
          ...questoesAtualizadas[questaoAtual],
          respondida: true,
          resposta_usuario: resposta,
        }
        setQuestoes(questoesAtualizadas)

        // Atualizar progresso
        if (data.progresso) {
          setProgresso(data.progresso)
        }
      }
    } catch (error) {
      console.error('Erro ao responder:', error)
    } finally {
      setRespondendo(false)
      setMostrarResultado(true)
    }
  }

  const proximaQuestao = async () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1)
      setRespostaSelecionada(null)
      setMostrarResultado(false)
      setMostrarDica(false)
      setUsouDica(false)
      setTempoInicio(Date.now())
    } else {
      // Todas as questões da semana respondidas - tentar avançar
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
            mensagem: data.mensagem
          })
          setMostrarConclusao(true)
        } else {
          router.push(`/${componente}/trilhas`)
        }
      } catch (error) {
        console.error('Erro ao avançar semana:', error)
        router.push(`/${componente}/trilhas`)
      }
    }
  }

  const toggleDica = () => {
    if (!mostrarDica) {
      setUsouDica(true)
    }
    setMostrarDica(!mostrarDica)
  }

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Se não tem questões
  if (questoes.length === 0) {
    // Verifica se está gerando, completou ou não há questões
    const completouSemana = progresso && progresso.questoes_semana > 0 && progresso.questoes_respondidas >= progresso.questoes_semana

    return (
      <div
        className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}
      >
        <NavigationRail componente={componente} />
        <div className="text-center p-6 max-w-sm">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'var(--bg-elevated)' }}
          >
            {gerando ? (
              <div className="animate-spin">
                <Zap className="w-10 h-10" style={{ color: accentColor }} />
              </div>
            ) : completouSemana ? (
              <Trophy className="w-10 h-10" style={{ color: accentColor }} />
            ) : (
              <Clock className="w-10 h-10" style={{ color: 'var(--color-warning)' }} />
            )}
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {gerando ? 'Gerando Questões...' : completouSemana ? 'Parabéns!' : 'Questões em Preparação'}
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {gerando
              ? 'Nossa IA está criando questões personalizadas para você. Aguarde alguns segundos...'
              : completouSemana
                ? 'Você completou todas as questões desta semana! Volte na próxima semana para mais questões.'
                : 'As questões desta trilha ainda estão sendo preparadas. Clique em tentar novamente.'
            }
          </p>
          {gerando ? (
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: accentColor }} />
              <span>Isso pode levar alguns segundos</span>
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              {!completouSemana && (
                <button
                  onClick={() => {
                    setGerando(true)
                    carregarQuestoes(serie)
                  }}
                  className="px-6 py-3 rounded-lg font-medium"
                  style={{ background: accentColor, color: isFisica ? '#000' : '#fff' }}
                >
                  Tentar Novamente
                </button>
              )}
              <button
                onClick={() => router.push(`/${componente}/trilhas`)}
                className="px-6 py-3 rounded-lg font-medium"
                style={{
                  background: completouSemana ? accentColor : 'var(--bg-elevated)',
                  color: completouSemana ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)'
                }}
              >
                {completouSemana ? 'Ver Trilhas' : 'Voltar'}
              </button>
            </div>
          )}
        </div>
        <BottomNav componente={componente} />
      </div>
    )
  }

  const questao = questoes[questaoAtual]
  const acertou = questao.respondida && questao.resposta_usuario === questao.resposta_correta

  return (
    <div
      className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]"
      style={{ background: 'var(--bg-base)' }}
    >
      <NavigationRail componente={componente} />

      {/* Header */}
      <header className="page-header">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push(`/${componente}/trilhas`)}
              className="w-10 h-10 flex items-center justify-center rounded-lg"
              style={{ border: '1px solid var(--border-default)' }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
            </button>

            {progresso && (
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <span>Semana {progresso.semana_atual}</span>
                <span>•</span>
                <span>{progresso.questoes_respondidas}/{progresso.questoes_semana}</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${((questaoAtual + 1) / questoes.length) * 100}%`,
                background: accentColor,
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Questão {questaoAtual + 1} de {questoes.length}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {questao.tema}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Enunciado */}
        <div
          className="p-4 rounded-xl mb-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-start gap-2 mb-3">
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ background: `${accentColor}20`, color: accentColor }}
            >
              {questao.tipo_questao}
            </span>
            {questao.contexto && (
              <span
                className="px-2 py-1 rounded text-xs"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                {questao.contexto}
              </span>
            )}
          </div>

          <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {questao.enunciado}
          </p>
        </div>

        {/* Dica */}
        {!mostrarResultado && (
          <button
            onClick={toggleDica}
            className="flex items-center gap-2 mb-4 text-sm"
            style={{ color: 'var(--color-warning)' }}
          >
            <Lightbulb className="w-4 h-4" />
            {mostrarDica ? 'Esconder dica' : 'Ver dica'}
          </button>
        )}

        {mostrarDica && !mostrarResultado && (
          <div
            className="p-3 rounded-lg mb-4 flex items-start gap-2"
            style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--color-warning)' }}
          >
            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {questao.dica}
            </p>
          </div>
        )}

        {/* Alternativas */}
        <div className="space-y-3">
          {Object.entries(questao.alternativas).map(([letra, texto]) => {
            const isSelected = respostaSelecionada === letra
            const isCorrect = letra === questao.resposta_correta
            const showResult = mostrarResultado

            let bgColor = 'var(--bg-surface)'
            let borderColor = 'var(--border-default)'
            let textColor = 'var(--text-primary)'

            if (showResult) {
              if (isCorrect) {
                bgColor = 'rgba(34, 197, 94, 0.1)'
                borderColor = 'var(--color-success)'
              } else if (isSelected && !isCorrect) {
                bgColor = 'rgba(239, 68, 68, 0.1)'
                borderColor = 'var(--color-error)'
              }
            } else if (isSelected) {
              borderColor = accentColor
              bgColor = `${accentColor}10`
            }

            return (
              <button
                key={letra}
                onClick={() => !mostrarResultado && !respondendo && responderQuestao(letra)}
                disabled={mostrarResultado || respondendo}
                className="w-full p-4 rounded-xl text-left transition-all flex items-start gap-3"
                style={{
                  background: bgColor,
                  border: `2px solid ${borderColor}`,
                  opacity: respondendo ? 0.7 : 1,
                }}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold flex-shrink-0"
                  style={{
                    background: showResult && isCorrect ? 'var(--color-success)' : `${accentColor}20`,
                    color: showResult && isCorrect ? '#fff' : accentColor,
                  }}
                >
                  {showResult && isCorrect ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : showResult && isSelected && !isCorrect ? (
                    <XCircle className="w-5 h-5" style={{ color: 'var(--color-error)' }} />
                  ) : (
                    letra
                  )}
                </span>
                <span className="flex-1" style={{ color: textColor }}>
                  {texto}
                </span>
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {mostrarResultado && (
          <div className="mt-6">
            <div
              className="p-4 rounded-xl mb-4"
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
                <span
                  className="font-bold"
                  style={{ color: acertou ? 'var(--color-success)' : 'var(--color-error)' }}
                >
                  {acertou ? 'Correto!' : 'Incorreto'}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {questao.feedback}
              </p>
            </div>

            <button
              onClick={proximaQuestao}
              className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2"
              style={{ background: accentColor, color: isFisica ? '#000' : '#fff' }}
            >
              {questaoAtual < questoes.length - 1 ? (
                <>
                  Próxima Questão
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                <>
                  Finalizar
                  <Trophy className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </main>

      <BottomNav componente={componente} />

      {/* Modal de Conclusão da Semana */}
      {mostrarConclusao && resultadoSemana && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ background: 'var(--bg-surface)' }}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: resultadoSemana.avancou
                  ? 'rgba(34, 197, 94, 0.2)'
                  : 'rgba(245, 158, 11, 0.2)'
              }}
            >
              {resultadoSemana.avancou ? (
                <Trophy className="w-10 h-10" style={{ color: 'var(--color-success)' }} />
              ) : (
                <Target className="w-10 h-10" style={{ color: 'var(--color-warning)' }} />
              )}
            </div>

            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {resultadoSemana.avancou ? 'Semana Concluída!' : 'Continue Praticando!'}
            </h2>

            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              {resultadoSemana.mensagem}
            </p>

            <div
              className="p-4 rounded-xl mb-4"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <p className="text-3xl font-bold mb-1" style={{ color: accentColor }}>
                {resultadoSemana.taxaAcerto}%
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Taxa de acerto
              </p>
            </div>

            {resultadoSemana.avancou && resultadoSemana.novaSemana && (
              <p className="text-sm mb-4" style={{ color: 'var(--color-success)' }}>
                Você está agora na semana {resultadoSemana.novaSemana}!
              </p>
            )}

            <button
              onClick={() => router.push(`/${componente}/trilhas`)}
              className="w-full py-3 rounded-xl font-medium"
              style={{ background: accentColor, color: isFisica ? '#000' : '#fff' }}
            >
              {resultadoSemana.avancou ? 'Continuar Jornada' : 'Ver Trilhas'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
