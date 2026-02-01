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
import { formatarFormula } from '@/lib/formatacao'

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
  tipoAtividade?: 'multipla_escolha' | 'verdadeiro_falso' | 'complete_formula'
  // V/F
  afirmacao?: string
  respostaVF?: string
  justificativa?: string
  // Complete
  formulaComLacuna?: string
  respostaLacuna?: string
  opcoes?: string[]
  textoCompleto?: string
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

  // V/F state
  const [respostaVF, setRespostaVF] = useState<'V' | 'F' | null>(null)

  // Complete a fórmula state
  const [respostaLacuna, setRespostaLacuna] = useState<string | null>(null)

  const [temaConcluido, setTemaConcluido] = useState(false)

  const isFisica = componente === 'fisica'
  const corPrimaria = '#00BCD4' // Cor da trilha curiosidade

  const carregarQuestao = useCallback(async () => {
    setLoading(true)
    setRespostaSelecionada(null)
    setRespostaVF(null)
    setRespostaLacuna(null)
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
    if (!questao) return

    const tipo = questao.tipoAtividade || 'multipla_escolha'

    // Verificar se tem resposta baseado no tipo
    if (tipo === 'multipla_escolha' && !respostaSelecionada) return
    if (tipo === 'verdadeiro_falso' && !respostaVF) return
    if (tipo === 'complete_formula' && !respostaLacuna) return

    setRespondendo(true)

    try {
      const res = await fetch('/api/trilhas/curiosidade/questao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questaoId: questao.id,
          resposta: respostaSelecionada,
          tempo: 0,
          usouDica,
          tipoAtividade: tipo,
          respostaVF: tipo === 'verdadeiro_falso' ? respostaVF : undefined,
          respostaVFEsperada: tipo === 'verdadeiro_falso' ? questao.respostaVF : undefined,
          respostaLacuna: tipo === 'complete_formula' ? respostaLacuna : undefined,
          respostaLacunaEsperada: tipo === 'complete_formula' ? questao.respostaLacuna : undefined,
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
              style={{ background: corPrimaria, color: '#fff' }}
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
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <BackButton href={`/${componente}/trilhas/curiosidade`} compactOnDesktop />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{tema?.icone || '🔬'}</span>
                <h1 className="text-base lg:text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>
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
      <main className="max-w-3xl mx-auto px-3 lg:px-4 py-3">
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

            {/* Badge tipo de atividade */}
            {questao.tipoAtividade && questao.tipoAtividade !== 'multipla_escolha' && (
              <span
                className="badge-chromebook inline-block"
                style={{
                  background: questao.tipoAtividade === 'verdadeiro_falso' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: questao.tipoAtividade === 'verdadeiro_falso' ? 'var(--warning)' : '#3B82F6',
                }}
              >
                {questao.tipoAtividade === 'verdadeiro_falso' ? '✓✗ Verdadeiro ou Falso' : '✏️ Complete'}
              </span>
            )}

            {/* Enunciado */}
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <p className="text-sm lg:text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                {formatarFormula(questao.enunciado)}
              </p>
            </div>

            {/* ═══ VERDADEIRO OU FALSO ═══ */}
            {questao.tipoAtividade === 'verdadeiro_falso' && questao.afirmacao && (
              <div className="space-y-3">
                {/* Afirmação */}
                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                >
                  <p className="text-xs lg:text-sm font-medium mb-1" style={{ color: 'var(--warning)' }}>Analise a afirmação:</p>
                  <p className="text-sm lg:text-base font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    &ldquo;{formatarFormula(questao.afirmacao)}&rdquo;
                  </p>
                </div>

                {/* Botões V/F */}
                <div className="grid grid-cols-2 gap-3">
                  {(['V', 'F'] as const).map(opcao => {
                    const selecionado = respostaVF === opcao
                    const ehCorreto = mostrarResultado && opcao === questao.respostaVF
                    const ehErrado = mostrarResultado && selecionado && !acertou

                    return (
                      <button
                        key={opcao}
                        onClick={() => !mostrarResultado && setRespostaVF(opcao)}
                        disabled={mostrarResultado}
                        className="p-4 lg:p-5 rounded-xl text-center transition-all"
                        style={{
                          background: mostrarResultado
                            ? ehCorreto ? 'rgba(34, 197, 94, 0.15)' : ehErrado ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-surface)'
                            : selecionado ? `${corPrimaria}15` : 'var(--bg-surface)',
                          border: `2px solid ${
                            mostrarResultado
                              ? ehCorreto ? 'var(--success)' : ehErrado ? 'var(--error)' : 'var(--border-default)'
                              : selecionado ? corPrimaria : 'var(--border-default)'
                          }`,
                        }}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center"
                            style={{
                              background: mostrarResultado
                                ? ehCorreto ? 'var(--success)' : ehErrado ? 'var(--error)' : 'var(--bg-elevated)'
                                : selecionado ? corPrimaria : 'var(--bg-elevated)',
                              color: (mostrarResultado && (ehCorreto || ehErrado)) || selecionado ? '#fff' : 'var(--text-secondary)',
                            }}
                          >
                            {mostrarResultado && ehCorreto ? (
                              <Check className="w-5 h-5" />
                            ) : mostrarResultado && ehErrado ? (
                              <X className="w-5 h-5" />
                            ) : opcao === 'V' ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <X className="w-5 h-5" />
                            )}
                          </span>
                          <span className="text-sm lg:text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {opcao === 'V' ? 'Verdadeiro' : 'Falso'}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Justificativa após resposta */}
                {mostrarResultado && questao.justificativa && (
                  <div
                    className="p-3 lg:p-4 rounded-xl"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                  >
                    <p className="text-xs lg:text-sm font-medium mb-1" style={{ color: corPrimaria }}>Justificativa:</p>
                    <p className="text-sm lg:text-base" style={{ color: 'var(--text-primary)' }}>
                      {formatarFormula(questao.justificativa)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ COMPLETE A FÓRMULA ═══ */}
            {questao.tipoAtividade === 'complete_formula' && questao.formulaComLacuna && (
              <div className="space-y-3">
                {/* Fórmula com lacuna */}
                <div
                  className="p-4 rounded-xl text-center"
                  style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                >
                  <p className="text-xs lg:text-sm font-medium mb-2" style={{ color: '#3B82F6' }}>Complete a lacuna:</p>
                  <p className="text-lg lg:text-xl font-mono font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {formatarFormula(questao.formulaComLacuna)}
                  </p>
                </div>

                {/* Opções para preencher */}
                {questao.opcoes && questao.opcoes.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {questao.opcoes.map((opcao, idx) => {
                      const selecionado = respostaLacuna === opcao
                      const ehCorreto = mostrarResultado && opcao === questao.respostaLacuna
                      const ehErrado = mostrarResultado && selecionado && !acertou

                      return (
                        <button
                          key={idx}
                          onClick={() => !mostrarResultado && setRespostaLacuna(opcao)}
                          disabled={mostrarResultado}
                          className="p-3 lg:p-4 rounded-xl text-center transition-all font-mono font-semibold text-sm lg:text-base"
                          style={{
                            background: mostrarResultado
                              ? ehCorreto ? 'rgba(34, 197, 94, 0.15)' : ehErrado ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-surface)'
                              : selecionado ? `${corPrimaria}15` : 'var(--bg-surface)',
                            border: `2px solid ${
                              mostrarResultado
                                ? ehCorreto ? 'var(--success)' : ehErrado ? 'var(--error)' : 'var(--border-default)'
                                : selecionado ? corPrimaria : 'var(--border-default)'
                            }`,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {formatarFormula(opcao)}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Texto completo após resposta */}
                {mostrarResultado && questao.textoCompleto && (
                  <div
                    className="p-3 lg:p-4 rounded-xl"
                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                  >
                    <p className="text-xs lg:text-sm font-medium mb-1" style={{ color: '#3B82F6' }}>Resposta completa:</p>
                    <p className="text-sm lg:text-base font-mono" style={{ color: 'var(--text-primary)' }}>
                      {formatarFormula(questao.textoCompleto)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ MÚLTIPLA ESCOLHA (padrão) ═══ */}
            {(!questao.tipoAtividade || questao.tipoAtividade === 'multipla_escolha') && (
              <div className="space-y-2">
                {Object.entries(questao.alternativas).map(([letra, texto]) => {
                  const selecionada = respostaSelecionada === letra
                  const eCorreta = mostrarResultado && letra === respostaCorreta
                  const eErrada = mostrarResultado && selecionada && !acertou

                  let bgColor = 'var(--bg-surface)'
                  let borderColor = 'var(--border-default)'

                  if (mostrarResultado) {
                    if (eCorreta) {
                      bgColor = 'rgba(34, 197, 94, 0.15)'
                      borderColor = 'var(--success)'
                    } else if (eErrada) {
                      bgColor = 'rgba(239, 68, 68, 0.15)'
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
                      className="w-full p-3 lg:p-4 rounded-lg text-left transition-all flex items-start gap-3"
                      style={{
                        background: bgColor,
                        border: `1.5px solid ${borderColor}`,
                      }}
                    >
                      <span
                        className="w-7 h-7 lg:w-9 lg:h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm lg:text-base"
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
                            ? '#fff'
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
                      <span className="text-sm lg:text-base flex-1" style={{ color: 'var(--text-primary)' }}>
                        {formatarFormula(texto)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

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
              {!mostrarResultado ? (() => {
                const tipo = questao.tipoAtividade || 'multipla_escolha'
                const temResposta = tipo === 'verdadeiro_falso' ? !!respostaVF
                  : tipo === 'complete_formula' ? !!respostaLacuna
                  : !!respostaSelecionada

                return (
                <button
                  onClick={responderQuestao}
                  disabled={!temResposta || respondendo}
                  className="w-full py-3 lg:py-4 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 text-base"
                  style={{
                    background: temResposta ? corPrimaria : 'var(--bg-elevated)',
                    color: temResposta ? '#fff' : 'var(--text-muted)',
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
                )
              })() : (
                <button
                  onClick={proximaQuestao}
                  className="w-full py-3 lg:py-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-base"
                  style={{ background: corPrimaria, color: '#fff' }}
                >
                  Próxima Questão
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
