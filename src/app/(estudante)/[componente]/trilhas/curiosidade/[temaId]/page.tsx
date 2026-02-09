'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ChevronRight,
  Lightbulb,
  Check,
  X,
  Trophy,
  Star,
  ArrowRight,
  Home,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'

interface Questao {
  id: number
  enunciado: string
  alternativas: Record<string, string>
  dica: string
  tema: string
  subtema: string
  dificuldade: string
  tipo: string
  contexto: string
}

interface Tema {
  id: string
  nome: string
  icone: string
}

interface Progresso {
  respondidas: number
  corretas: number
  total: number
}

interface Feedback {
  explicacao: string
  curiosidade?: string
  erroComum?: string
}

export default function EstudarCuriosidadePage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente
  const temaId = params.temaId as string

  const [loading, setLoading] = useState(true)
  const [questao, setQuestao] = useState<Questao | null>(null)
  const [tema, setTema] = useState<Tema | null>(null)
  const [progresso, setProgresso] = useState<Progresso>({ respondidas: 0, corretas: 0, total: 15 })

  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null)
  const [respondendo, setRespondendo] = useState(false)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [acertou, setAcertou] = useState(false)
  const [respostaCorreta, setRespostaCorreta] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [pontos, setPontos] = useState(0)

  const [mostrarDica, setMostrarDica] = useState(false)
  const [usouDica, setUsouDica] = useState(false)
  const [serie, setSerie] = useState('1EM')

  const [temaConcluido, setTemaConcluido] = useState(false)

  const isFisica = componente === 'fisica'
  const corPrimaria = 'var(--color-curiosidade)' // Cor da trilha curiosidade

  const carregarQuestao = useCallback(async () => {
    setLoading(true)
    setRespostaSelecionada(null)
    setMostrarResultado(false)
    setMostrarDica(false)
    setUsouDica(false)

    try {
      const res = await fetch(`/api/trilhas/curiosidade/questao?tema=${temaId}&serie=${serie}`)
      const data = await res.json()

      if (data.sucesso) {
        if (data.temaConcluido) {
          setTemaConcluido(true)
          setQuestao(null)
        } else {
          setQuestao(data.questao)
          setTema(data.tema)
          setProgresso(data.progresso || { respondidas: 0, corretas: 0, total: 15 })
        }
      } else {
        console.error('Erro:', data.erro)
      }
    } catch (error) {
      console.error('Erro ao carregar questão:', error)
    } finally {
      setLoading(false)
    }
  }, [temaId, serie])

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    // Buscar série
    fetch('/api/usuario')
      .then(res => res.json())
      .then(data => {
        if (data.sucesso) {
          const anoUsuario = data.usuario.ano
          const nivelUsuario = data.usuario.nivel || (anoUsuario >= 6 && anoUsuario <= 9 ? 'EF' : 'EM')
          setSerie(nivelUsuario === 'EF' ? `${anoUsuario}EF` : `${anoUsuario}EM`)
        }
      })
      .catch(console.error)

    carregarQuestao()
  }, [router, componente, carregarQuestao])

  const responderQuestao = async () => {
    if (!respostaSelecionada || !questao) return

    setRespondendo(true)

    try {
      const res = await fetch('/api/trilhas/curiosidade/questao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questaoId: questao.id,
          resposta: respostaSelecionada,
          tempo: 0, // Sem cronômetro na curiosidade
          usouDica,
        }),
      })

      const data = await res.json()

      if (data.sucesso) {
        setAcertou(data.correta)
        setRespostaCorreta(data.respostaCorreta)
        setFeedback(data.feedback)
        setPontos(data.pontos)
        setMostrarResultado(true)

        // Atualizar progresso
        setProgresso(prev => ({
          ...prev,
          respondidas: prev.respondidas + 1,
          corretas: prev.corretas + (data.correta ? 1 : 0),
        }))
      }
    } catch (error) {
      console.error('Erro ao responder:', error)
    } finally {
      setRespondendo(false)
    }
  }

  const proximaQuestao = () => {
    carregarQuestao()
  }

  const verDica = () => {
    setMostrarDica(true)
    setUsouDica(true)
  }

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  // Tela de tema concluído
  if (temaConcluido) {
    return (
      <div
        className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}
      >
        <NavigationRail componente={componente} />

        <div className="max-w-sm mx-auto px-4 text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${corPrimaria}20` }}
          >
            <Trophy className="w-10 h-10" style={{ color: 'var(--warning)' }} />
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Tema Completo!
          </h1>

          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Voce explorou todas as questoes deste tema. Continue descobrindo a fisica em outros temas!
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                {progresso.corretas}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Acertos</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
              <p className="text-2xl font-bold" style={{ color: corPrimaria }}>
                {progresso.respondidas}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Questoes</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => router.push(`/${componente}/trilhas/curiosidade`)}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              style={{ background: corPrimaria, color: 'var(--text-primary)' }}
            >
              <Sparkles className="w-5 h-5" />
              Explorar Outros Temas
            </button>
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            >
              <Home className="w-5 h-5" />
              Voltar ao Menu
            </button>
          </div>
        </div>

        <BottomNav componente={componente} />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]"
      style={{ background: 'var(--bg-base)' }}
    >
      <NavigationRail componente={componente} />

      {/* Header compacto */}
      <header className="header-chromebook lg:py-2">
        <div className="max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <BackButton href={`/${componente}/trilhas/curiosidade`} compactOnDesktop />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{tema?.icone || '🔬'}</span>
                <h1 className="text-base lg:text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                  {tema?.nome || 'Curiosidade'}
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(progresso.respondidas / progresso.total) * 100}%`,
                      background: corPrimaria,
                    }}
                  />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {progresso.respondidas}/{progresso.total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-3 lg:px-4 py-3">
        {questao ? (
          <div className="space-y-4">
            {/* Info da questão */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="badge-chromebook"
                style={{ background: `${corPrimaria}20`, color: corPrimaria }}
              >
                {questao.tema}
              </span>
              {questao.subtema && (
                <span
                  className="badge-chromebook"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  {questao.subtema}
                </span>
              )}
            </div>

            {/* Enunciado */}
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {questao.enunciado}
              </p>
            </div>

            {/* Alternativas */}
            <div className="space-y-2">
              {Object.entries(questao.alternativas).map(([letra, texto]) => {
                const selecionada = respostaSelecionada === letra
                const eCorreta = mostrarResultado && letra === respostaCorreta
                const eErrada = mostrarResultado && selecionada && !acertou

                let bgColor = 'var(--bg-surface)'
                let borderColor = 'var(--border-default)'

                if (mostrarResultado) {
                  if (eCorreta) {
                    bgColor = 'var(--success)15'
                    borderColor = 'var(--success)'
                  } else if (eErrada) {
                    bgColor = 'var(--error)15'
                    borderColor = 'var(--error)'
                  }
                } else if (selecionada) {
                  bgColor = `${corPrimaria}15`
                  borderColor = corPrimaria
                }

                return (
                  <button
                    key={letra}
                    onClick={() => !mostrarResultado && setRespostaSelecionada(letra)}
                    disabled={mostrarResultado}
                    className="w-full p-3 rounded-lg text-left transition-all flex items-start gap-3"
                    style={{
                      background: bgColor,
                      border: `1.5px solid ${borderColor}`,
                    }}
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm"
                      style={{
                        background: mostrarResultado
                          ? eCorreta
                            ? 'var(--success)'
                            : eErrada
                            ? 'var(--error)'
                            : 'var(--bg-elevated)'
                          : selecionada
                          ? corPrimaria
                          : 'var(--bg-elevated)',
                        color: (mostrarResultado && (eCorreta || eErrada)) || selecionada
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                      }}
                    >
                      {mostrarResultado && eCorreta ? (
                        <Check className="w-4 h-4" />
                      ) : mostrarResultado && eErrada ? (
                        <X className="w-4 h-4" />
                      ) : (
                        letra
                      )}
                    </span>
                    <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
                      {texto}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Dica */}
            {!mostrarResultado && (
              <div>
                {mostrarDica ? (
                  <div
                    className="p-3 rounded-lg flex items-start gap-2"
                    style={{ background: 'var(--warning)15', border: '1px solid var(--warning)40' }}
                  >
                    <Lightbulb className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--warning)' }} />
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--warning)' }}>Dica</p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{questao.dica}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={verDica}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                  >
                    <Lightbulb className="w-4 h-4" />
                    Ver dica {usouDica ? '' : '(-5 pts)'}
                  </button>
                )}
              </div>
            )}

            {/* Feedback após resposta */}
            {mostrarResultado && feedback && (
              <div
                className="p-4 rounded-xl space-y-3"
                style={{
                  background: acertou ? 'var(--success)10' : 'var(--bg-surface)',
                  border: `1px solid ${acertou ? 'var(--success)' : 'var(--border-default)'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  {acertou ? (
                    <Check className="w-5 h-5" style={{ color: 'var(--success)' }} />
                  ) : (
                    <X className="w-5 h-5" style={{ color: 'var(--error)' }} />
                  )}
                  <span className="font-semibold" style={{ color: acertou ? 'var(--success)' : 'var(--error)' }}>
                    {acertou ? `Correto! +${pontos} pts` : 'Não foi dessa vez'}
                  </span>
                </div>

                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {feedback.explicacao}
                </p>

                {feedback.curiosidade && (
                  <div
                    className="p-3 rounded-lg flex items-start gap-2"
                    style={{ background: `${corPrimaria}15` }}
                  >
                    <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: corPrimaria }} />
                    <div>
                      <p className="text-xs font-medium mb-0.5" style={{ color: corPrimaria }}>Curiosidade</p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{feedback.curiosidade}</p>
                    </div>
                  </div>
                )}

                {feedback.erroComum && (
                  <div
                    className="p-3 rounded-lg"
                    style={{ background: 'var(--bg-elevated)' }}
                  >
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Erro comum
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{feedback.erroComum}</p>
                  </div>
                )}
              </div>
            )}

            {/* Botões de ação */}
            <div className="pt-2">
              {!mostrarResultado ? (
                <button
                  onClick={responderQuestao}
                  disabled={!respostaSelecionada || respondendo}
                  className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    background: respostaSelecionada ? corPrimaria : 'var(--bg-elevated)',
                    color: respostaSelecionada ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {respondendo ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirmar Resposta
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={proximaQuestao}
                  className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                  style={{ background: corPrimaria, color: 'var(--text-primary)' }}
                >
                  Proxima Questao
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p style={{ color: 'var(--text-muted)' }}>Nenhuma questao disponivel</p>
          </div>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
