'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Zap,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Trophy,
  Flame,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Target,
  Clock,
  Play,
  BookOpen,
  Star,
  Award,
  TrendingUp,
  Brain,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Usuario } from '@/types'
import type {
  FlashCard,
  FlashCardQuiz,
  FlashCardComplete,
  FlashCardVF,
  AnoEscolar,
  TemaFlashCard,
  SessaoFlashCard,
  RespostaFlashCard,
} from '@/types/flashcards'
import { LABELS_ANO, LABELS_DIFICULDADE } from '@/types/flashcards'

// Pontuação
const PONTUACAO = {
  base: 10,
  bonusSequencia: 5,
  penalididadeDica: 5,
  multiplicadorDificuldade: {
    facil: 1,
    medio: 1.5,
    dificil: 2,
  },
}

type Tela = 'selecao' | 'jogando' | 'resultado'

// Mapear ano do usuário para AnoEscolar
function mapearAnoUsuario(ano: number, nivel: string): AnoEscolar | null {
  if (nivel === 'EM') {
    if (ano === 1) return '1ano'
    if (ano === 2) return '2ano'
    if (ano === 3) return '3ano'
  }
  return null
}

export default function FlashCardsPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  // Estados do usuário
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [anoDoUsuario, setAnoDoUsuario] = useState<AnoEscolar | null>(null)

  // Estados da tela
  const [tela, setTela] = useState<Tela>('selecao')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Estados de seleção
  const [temas, setTemas] = useState<TemaFlashCard[]>([])
  const [temaSelecionado, setTemaSelecionado] = useState<string | null>(null)
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState(10)

  // Estados do jogo
  const [sessao, setSessao] = useState<SessaoFlashCard | null>(null)
  const [questaoAtualIndex, setQuestaoAtualIndex] = useState(0)
  const [respostaUsuario, setRespostaUsuario] = useState<string | number | boolean | null>(null)
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [usouDica, setUsouDica] = useState(false)
  const [mostrarDica, setMostrarDica] = useState(false)
  const [animacaoCorreta, setAnimacaoCorreta] = useState(false)
  const [animacaoErrada, setAnimacaoErrada] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [tempoQuestao, setTempoQuestao] = useState(0)

  // Cores do componente
  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const corPrimariaRgb = isFisica ? '34, 197, 94' : '139, 92, 246'
  const nomeComponente = isFisica ? 'Física' : 'Matemática'

  // ═══════════════════════════════════════════════════════════════════
  // CARREGAR USUÁRIO E TEMAS
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    carregarDados()
  }, [componente])

  const carregarDados = async () => {
    setLoading(true)
    try {
      // Buscar usuário
      const userResponse = await fetch('/api/usuario')
      const userData = await userResponse.json()

      if (userData.sucesso && userData.usuario) {
        setUsuario(userData.usuario)
        const anoMapeado = mapearAnoUsuario(userData.usuario.ano, userData.usuario.nivel)
        setAnoDoUsuario(anoMapeado)

        // Buscar temas filtrados pelo ano do usuário
        const anoParam = anoMapeado ? `&ano=${anoMapeado}` : ''
        const temasResponse = await fetch(`/api/flashcards?componente=${componente}&action=temas${anoParam}`)
        const temasData = await temasResponse.json()

        if (temasData.sucesso) {
          setTemas(temasData.temas || [])
        }
      } else {
        router.push('/login')
      }
    } catch {
      setErro('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // INICIAR SESSÃO
  // ═══════════════════════════════════════════════════════════════════
  const iniciarSessao = async () => {
    setLoading(true)
    setErro(null)

    try {
      const searchParams = new URLSearchParams({
        componente,
        action: 'questoes',
        limite: quantidadeQuestoes.toString(),
      })
      // Sempre filtrar pelo ano do usuário
      if (anoDoUsuario) searchParams.append('ano', anoDoUsuario)
      if (temaSelecionado) searchParams.append('tema', temaSelecionado)

      const response = await fetch(`/api/flashcards?${searchParams}`)
      const data = await response.json()

      if (data.sucesso && data.questoes?.length > 0) {
        setSessao({
          questaoAtual: 0,
          questoes: data.questoes,
          respostas: [],
          pontos: 0,
          sequenciaAtual: 0,
          maiorSequencia: 0,
          tempoInicio: Date.now(),
          usouDica: false,
        })
        setQuestaoAtualIndex(0)
        setTela('jogando')
        iniciarTimer()
      } else {
        setErro(data.erro || 'Nenhuma questão encontrada')
      }
    } catch {
      setErro('Erro ao carregar questões')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // TIMER
  // ═══════════════════════════════════════════════════════════════════
  const iniciarTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTempoQuestao(0)
    timerRef.current = setInterval(() => {
      setTempoQuestao((prev) => prev + 1)
    }, 1000)
  }

  const pararTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    return () => pararTimer()
  }, [])

  // ═══════════════════════════════════════════════════════════════════
  // VERIFICAR RESPOSTA
  // ═══════════════════════════════════════════════════════════════════
  const verificarResposta = useCallback(() => {
    if (!sessao || respostaUsuario === null) return

    pararTimer()
    const questao = sessao.questoes[questaoAtualIndex]
    let correta = false

    if (questao.tipo === 'quiz') {
      correta = respostaUsuario === (questao as FlashCardQuiz).respostaCorreta
    } else if (questao.tipo === 'vf') {
      correta = respostaUsuario === (questao as FlashCardVF).respostaCorreta
    } else if (questao.tipo === 'complete') {
      const q = questao as FlashCardComplete
      const respostaStr = String(respostaUsuario).trim().toLowerCase()
      const respostasValidas = [q.respostaCorreta.toLowerCase(), ...(q.respostasAceitas?.map((r) => r.toLowerCase()) || [])]
      correta = respostasValidas.includes(respostaStr)
    }

    let pontosGanhos = 0
    let novaSequencia = sessao.sequenciaAtual

    if (correta) {
      setAnimacaoCorreta(true)
      setTimeout(() => setAnimacaoCorreta(false), 600)

      pontosGanhos = Math.round(PONTUACAO.base * PONTUACAO.multiplicadorDificuldade[questao.dificuldade])
      if (usouDica) pontosGanhos = Math.max(0, pontosGanhos - PONTUACAO.penalididadeDica)
      novaSequencia++
      if (novaSequencia > 1) pontosGanhos += PONTUACAO.bonusSequencia * (novaSequencia - 1)
    } else {
      setAnimacaoErrada(true)
      setTimeout(() => setAnimacaoErrada(false), 600)
      novaSequencia = 0
    }

    const resposta: RespostaFlashCard = {
      questao_id: questao.id,
      resposta: respostaUsuario,
      correta,
      tempo_segundos: tempoQuestao,
      usou_dica: usouDica,
      pontos_ganhos: pontosGanhos,
    }

    setSessao((prev) => {
      if (!prev) return null
      return {
        ...prev,
        respostas: [...prev.respostas, resposta],
        pontos: prev.pontos + pontosGanhos,
        sequenciaAtual: novaSequencia,
        maiorSequencia: Math.max(prev.maiorSequencia, novaSequencia),
      }
    })

    setMostrarResultado(true)
  }, [sessao, respostaUsuario, questaoAtualIndex, usouDica, tempoQuestao])

  // ═══════════════════════════════════════════════════════════════════
  // PRÓXIMA QUESTÃO
  // ═══════════════════════════════════════════════════════════════════
  const proximaQuestao = () => {
    if (!sessao) return

    if (questaoAtualIndex + 1 >= sessao.questoes.length) {
      pararTimer()
      salvarProgresso()
      setTela('resultado')
    } else {
      setQuestaoAtualIndex((prev) => prev + 1)
      setRespostaUsuario(null)
      setMostrarResultado(false)
      setUsouDica(false)
      setMostrarDica(false)
      iniciarTimer()
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // SALVAR PROGRESSO
  // ═══════════════════════════════════════════════════════════════════
  const salvarProgresso = async () => {
    if (!sessao) return

    try {
      await fetch('/api/flashcards/progresso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componente,
          ano: anoDoUsuario,
          tema: temaSelecionado,
          respostas: sessao.respostas,
          pontos_totais: sessao.pontos,
          maior_sequencia: sessao.maiorSequencia,
          tempo_total: Math.floor((Date.now() - sessao.tempoInicio) / 1000),
        }),
      })
    } catch {
      console.error('Erro ao salvar progresso')
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // REINICIAR
  // ═══════════════════════════════════════════════════════════════════
  const reiniciar = () => {
    setSessao(null)
    setQuestaoAtualIndex(0)
    setRespostaUsuario(null)
    setMostrarResultado(false)
    setUsouDica(false)
    setMostrarDica(false)
    setTela('selecao')
  }

  const jogarNovamente = () => {
    setSessao(null)
    setQuestaoAtualIndex(0)
    setRespostaUsuario(null)
    setMostrarResultado(false)
    setUsouDica(false)
    setMostrarDica(false)
    iniciarSessao()
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDERIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════

  if (loading && tela === 'selecao') {
    return <Loading fullScreen componente={componente} />
  }

  const questaoAtual = sessao?.questoes[questaoAtualIndex]
  const totalQuestoesDisponiveis = temas.reduce((acc, t) => acc + t.totalQuestoes, 0)

  return (
    <div
      className={`min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col ${animacaoCorreta ? 'animate-pulse-success' : ''} ${animacaoErrada ? 'animate-shake' : ''}`}
      style={{ background: 'var(--bg-base)' }}
    >
      <NavigationRail componente={componente} />

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER - Mobile-First
          ═══════════════════════════════════════════════════════════════════ */}
      <header
        className="mobile-header flex-shrink-0"
        style={{
          background: tela === 'selecao'
            ? `linear-gradient(135deg, rgba(${corPrimariaRgb}, 0.15) 0%, var(--bg-surface) 100%)`
            : 'var(--bg-surface)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <BackButton
              onClick={() => (tela === 'selecao' ? router.push(`/${componente}/menu`) : reiniciar())}
              mobileOnly
            />

            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `rgba(${corPrimariaRgb}, 0.15)` }}
              >
                <Sparkles className="w-4 h-4" style={{ color: corPrimaria }} />
              </div>
              <div>
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  FlashCards
                </span>
                {anoDoUsuario && tela === 'selecao' && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {LABELS_ANO[anoDoUsuario]} • {nomeComponente}
                  </p>
                )}
              </div>
            </div>

            {tela === 'jogando' && sessao && (
              <div className="flex items-center gap-2">
                {sessao.sequenciaAtual > 0 && (
                  <div
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm font-bold animate-bounce-subtle"
                    style={{ background: `rgba(${corPrimariaRgb}, 0.15)`, color: corPrimaria }}
                  >
                    <Flame className="w-4 h-4" />
                    <span>{sessao.sequenciaAtual}</span>
                  </div>
                )}
                <div
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}
                >
                  <Star className="w-4 h-4" />
                  <span>{sessao.pontos}</span>
                </div>
              </div>
            )}

            {tela === 'selecao' && <div className="w-10" />}
          </div>

          {/* Progress bar durante o jogo */}
          {tela === 'jogando' && sessao && (
            <div className="mt-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${((questaoAtualIndex + (mostrarResultado ? 1 : 0)) / sessao.questoes.length) * 100}%`,
                      background: `linear-gradient(90deg, ${corPrimaria} 0%, ${isFisica ? '#4ade80' : '#a78bfa'} 100%)`,
                    }}
                  />
                </div>
                <span className="text-sm font-bold tabular-nums min-w-[40px] text-right" style={{ color: corPrimaria }}>
                  {questaoAtualIndex + 1}/{sessao.questoes.length}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTEÚDO
          ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-5 w-full">
        {/* ═══════════════════════════════════════════════════════════════════
            TELA DE SELEÇÃO
            ═══════════════════════════════════════════════════════════════════ */}
        {tela === 'selecao' && (
          <div className="space-y-5 animate-fade-in">
            {/* Hero Card */}
            <div
              className="relative overflow-hidden rounded-3xl p-6 text-center"
              style={{
                background: `linear-gradient(135deg, rgba(${corPrimariaRgb}, 0.2) 0%, rgba(${corPrimariaRgb}, 0.05) 100%)`,
                border: `2px solid rgba(${corPrimariaRgb}, 0.3)`,
              }}
            >
              {/* Decorative elements */}
              <div
                className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20"
                style={{ background: corPrimaria }}
              />
              <div
                className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10"
                style={{ background: corPrimaria }}
              />

              <div className="relative">
                <div
                  className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${corPrimaria} 0%, ${isFisica ? '#4ade80' : '#a78bfa'} 100%)`,
                  }}
                >
                  <Brain className="w-10 h-10" style={{ color: isFisica ? '#000' : '#fff' }} />
                </div>

                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  FlashCards de {nomeComponente}
                </h1>

                {anoDoUsuario && (
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                  >
                    <BookOpen className="w-4 h-4" style={{ color: corPrimaria }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {LABELS_ANO[anoDoUsuario]} do Ensino Médio
                    </span>
                  </div>
                )}

                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {totalQuestoesDisponiveis} questões disponíveis para você
                </p>
              </div>
            </div>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Target, label: 'Tipos', value: '3', sublabel: 'Quiz, V/F, Complete' },
                { icon: Zap, label: 'Temas', value: String(temas.length), sublabel: 'Disponíveis' },
                { icon: Award, label: 'Pontos', value: '+10', sublabel: 'Por acerto' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-2xl text-center"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                >
                  <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: corPrimaria }} />
                  <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.sublabel}</p>
                </div>
              ))}
            </div>

            {/* Seleção de Tema */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `rgba(${corPrimariaRgb}, 0.15)` }}
                >
                  <Target className="w-4 h-4" style={{ color: corPrimaria }} />
                </div>
                <div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Escolha um Tema
                  </span>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Ou pratique todos de uma vez
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTemaSelecionado(null)}
                  className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: !temaSelecionado
                      ? `linear-gradient(135deg, rgba(${corPrimariaRgb}, 0.2) 0%, rgba(${corPrimariaRgb}, 0.1) 100%)`
                      : 'var(--bg-elevated)',
                    border: !temaSelecionado ? `2px solid ${corPrimaria}` : '1px solid var(--border-default)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        Todos os Temas
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {totalQuestoesDisponiveis} questões
                      </p>
                    </div>
                  </div>
                  {!temaSelecionado && (
                    <CheckCircle2 className="w-5 h-5 mt-2" style={{ color: corPrimaria }} />
                  )}
                </button>

                {temas.map((tema) => (
                  <button
                    key={tema.id}
                    onClick={() => setTemaSelecionado(tema.nome)}
                    className="p-4 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: temaSelecionado === tema.nome
                        ? `linear-gradient(135deg, rgba(${corPrimariaRgb}, 0.2) 0%, rgba(${corPrimariaRgb}, 0.1) 100%)`
                        : 'var(--bg-elevated)',
                      border: temaSelecionado === tema.nome ? `2px solid ${corPrimaria}` : '1px solid var(--border-default)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tema.icone}</span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {tema.nome}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {tema.totalQuestoes} questões
                        </p>
                      </div>
                    </div>
                    {temaSelecionado === tema.nome && (
                      <CheckCircle2 className="w-5 h-5 mt-2" style={{ color: corPrimaria }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantidade de Questões */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `rgba(${corPrimariaRgb}, 0.15)` }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: corPrimaria }} />
                </div>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Quantas questões?
                </span>
              </div>

              <div className="flex gap-2">
                {[5, 10, 15, 20].map((qtd) => (
                  <button
                    key={qtd}
                    onClick={() => setQuantidadeQuestoes(qtd)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: quantidadeQuestoes === qtd
                        ? `linear-gradient(135deg, ${corPrimaria} 0%, ${isFisica ? '#4ade80' : '#a78bfa'} 100%)`
                        : 'var(--bg-elevated)',
                      color: quantidadeQuestoes === qtd ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)',
                      border: quantidadeQuestoes === qtd ? 'none' : '1px solid var(--border-default)',
                    }}
                  >
                    {qtd}
                  </button>
                ))}
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div
                className="p-4 rounded-2xl flex items-center gap-3"
                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--error)' }} />
                <p className="text-sm" style={{ color: 'var(--error)' }}>{erro}</p>
              </div>
            )}

            {/* Botão Iniciar */}
            <button
              onClick={iniciarSessao}
              disabled={loading}
              className="w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${corPrimaria} 0%, ${isFisica ? '#4ade80' : '#a78bfa'} 100%)`,
                color: isFisica ? '#000' : '#fff',
                boxShadow: `0 8px 32px rgba(${corPrimariaRgb}, 0.3)`,
              }}
            >
              <Play className="w-6 h-6" />
              <span>Começar Agora!</span>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TELA DE JOGO
            ═══════════════════════════════════════════════════════════════════ */}
        {tela === 'jogando' && sessao && questaoAtual && (
          <div className="space-y-4 animate-fade-in">
            {/* Card da Questão */}
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              }}
            >
              {/* Header do Card */}
              <div
                className="px-5 py-3 flex items-center justify-between"
                style={{
                  background: `linear-gradient(135deg, rgba(${corPrimariaRgb}, 0.1) 0%, transparent 100%)`,
                  borderBottom: '1px solid var(--border-default)',
                }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={componente}>{questaoAtual.tema}</Badge>
                  <Badge
                    variant={
                      questaoAtual.dificuldade === 'facil' ? 'success'
                        : questaoAtual.dificuldade === 'medio' ? 'warning'
                        : 'error'
                    }
                  >
                    {LABELS_DIFICULDADE[questaoAtual.dificuldade]}
                  </Badge>
                </div>
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                >
                  {questaoAtual.tipo === 'quiz' ? '📝 Quiz' : questaoAtual.tipo === 'vf' ? '✓✗ V ou F' : '✏️ Complete'}
                </span>
              </div>

              {/* Pergunta */}
              <div className="p-5">
                <p className="text-lg font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {questaoAtual.pergunta}
                </p>
              </div>

              {/* Opções */}
              <div className="px-5 pb-5">
                {/* Quiz */}
                {questaoAtual.tipo === 'quiz' && (
                  <div className="space-y-2">
                    {(questaoAtual as FlashCardQuiz).opcoes.map((opcao, index) => {
                      const selecionada = respostaUsuario === index
                      const correta = (questaoAtual as FlashCardQuiz).respostaCorreta === index
                      const errada = mostrarResultado && selecionada && !correta

                      return (
                        <button
                          key={index}
                          onClick={() => !mostrarResultado && setRespostaUsuario(index)}
                          disabled={mostrarResultado}
                          className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left hover:scale-[1.01] active:scale-[0.99]"
                          style={{
                            background: mostrarResultado && correta
                              ? 'rgba(34, 197, 94, 0.15)'
                              : errada
                                ? 'rgba(239, 68, 68, 0.15)'
                                : selecionada
                                  ? `rgba(${corPrimariaRgb}, 0.15)`
                                  : 'var(--bg-elevated)',
                            border: mostrarResultado && correta
                              ? '2px solid var(--success)'
                              : errada
                                ? '2px solid var(--error)'
                                : selecionada
                                  ? `2px solid ${corPrimaria}`
                                  : '1px solid var(--border-default)',
                            transform: selecionada && !mostrarResultado ? 'scale(1.01)' : 'scale(1)',
                          }}
                        >
                          <span
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 transition-all"
                            style={{
                              background: mostrarResultado && correta
                                ? 'var(--success)'
                                : errada
                                  ? 'var(--error)'
                                  : selecionada
                                    ? corPrimaria
                                    : 'var(--bg-surface)',
                              color: (mostrarResultado && correta) || errada || selecionada
                                ? (isFisica ? '#000' : '#fff')
                                : 'var(--text-muted)',
                            }}
                          >
                            {mostrarResultado && correta ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : errada ? (
                              <XCircle className="w-5 h-5" />
                            ) : (
                              String.fromCharCode(65 + index)
                            )}
                          </span>
                          <span className="flex-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                            {opcao}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* V ou F */}
                {questaoAtual.tipo === 'vf' && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { valor: true, label: 'Verdadeiro', icone: '✓', cor: 'var(--success)' },
                      { valor: false, label: 'Falso', icone: '✗', cor: 'var(--error)' },
                    ].map(({ valor, label, icone, cor }) => {
                      const selecionada = respostaUsuario === valor
                      const correta = (questaoAtual as FlashCardVF).respostaCorreta === valor
                      const errada = mostrarResultado && selecionada && !correta

                      return (
                        <button
                          key={label}
                          onClick={() => !mostrarResultado && setRespostaUsuario(valor)}
                          disabled={mostrarResultado}
                          className="p-6 rounded-2xl flex flex-col items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            background: mostrarResultado && correta
                              ? 'rgba(34, 197, 94, 0.15)'
                              : errada
                                ? 'rgba(239, 68, 68, 0.15)'
                                : selecionada
                                  ? `rgba(${corPrimariaRgb}, 0.15)`
                                  : 'var(--bg-elevated)',
                            border: mostrarResultado && correta
                              ? '2px solid var(--success)'
                              : errada
                                ? '2px solid var(--error)'
                                : selecionada
                                  ? `2px solid ${corPrimaria}`
                                  : '1px solid var(--border-default)',
                          }}
                        >
                          <span
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                            style={{
                              background: mostrarResultado && correta
                                ? 'var(--success)'
                                : errada
                                  ? 'var(--error)'
                                  : selecionada
                                    ? corPrimaria
                                    : 'var(--bg-surface)',
                              color: (mostrarResultado && correta) || errada || selecionada
                                ? '#fff'
                                : cor,
                            }}
                          >
                            {icone}
                          </span>
                          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Complete */}
                {questaoAtual.tipo === 'complete' && (
                  <div>
                    <input
                      type="text"
                      value={respostaUsuario?.toString() || ''}
                      onChange={(e) => !mostrarResultado && setRespostaUsuario(e.target.value)}
                      disabled={mostrarResultado}
                      placeholder="Digite sua resposta..."
                      autoFocus
                      className="w-full p-5 rounded-2xl text-lg font-medium transition-all"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: mostrarResultado
                          ? sessao.respostas[questaoAtualIndex]?.correta
                            ? '2px solid var(--success)'
                            : '2px solid var(--error)'
                          : `2px solid ${respostaUsuario ? corPrimaria : 'var(--border-default)'}`,
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !mostrarResultado && respostaUsuario) {
                          verificarResposta()
                        }
                      }}
                    />
                    {mostrarResultado && !sessao.respostas[questaoAtualIndex]?.correta && (
                      <div
                        className="mt-3 p-3 rounded-xl flex items-center gap-2"
                        style={{ background: 'rgba(34, 197, 94, 0.1)' }}
                      >
                        <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
                        <span className="text-sm" style={{ color: 'var(--success)' }}>
                          Resposta: <strong>{(questaoAtual as FlashCardComplete).respostaCorreta}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dica */}
            {questaoAtual.dica && !mostrarResultado && (
              <div>
                {mostrarDica ? (
                  <div
                    className="p-4 rounded-2xl"
                    style={{
                      background: `linear-gradient(135deg, rgba(${corPrimariaRgb}, 0.1) 0%, rgba(${corPrimariaRgb}, 0.05) 100%)`,
                      border: `1px dashed ${corPrimaria}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5" style={{ color: corPrimaria }} />
                      <span className="font-semibold" style={{ color: corPrimaria }}>Dica</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>{questaoAtual.dica}</p>
                  </div>
                ) : (
                  <button
                    onClick={() => { setMostrarDica(true); setUsouDica(true) }}
                    className="w-full py-4 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px dashed var(--border-default)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Lightbulb className="w-5 h-5" />
                    <span className="font-medium">Precisa de ajuda? Ver dica (-5 pts)</span>
                  </button>
                )}
              </div>
            )}

            {/* Feedback */}
            {mostrarResultado && questaoAtual.explicacao && (
              <div
                className="p-5 rounded-2xl animate-fade-in"
                style={{
                  background: sessao.respostas[questaoAtualIndex]?.correta
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
                  border: `1px solid ${sessao.respostas[questaoAtualIndex]?.correta ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: sessao.respostas[questaoAtualIndex]?.correta
                        ? 'var(--success)'
                        : 'var(--error)',
                    }}
                  >
                    {sessao.respostas[questaoAtualIndex]?.correta ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <XCircle className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="font-bold text-lg"
                        style={{
                          color: sessao.respostas[questaoAtualIndex]?.correta ? 'var(--success)' : 'var(--error)',
                        }}
                      >
                        {sessao.respostas[questaoAtualIndex]?.correta ? 'Muito bem!' : 'Não foi dessa vez'}
                      </span>
                      {sessao.respostas[questaoAtualIndex]?.correta && sessao.respostas[questaoAtualIndex]?.pontos_ganhos > 0 && (
                        <span
                          className="px-2 py-1 rounded-lg text-sm font-bold"
                          style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)' }}
                        >
                          +{sessao.respostas[questaoAtualIndex]?.pontos_ganhos} pts
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)' }}>{questaoAtual.explicacao}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Ação */}
            <button
              onClick={mostrarResultado ? proximaQuestao : verificarResposta}
              disabled={respostaUsuario === null && !mostrarResultado}
              className="w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              style={{
                background: respostaUsuario === null && !mostrarResultado
                  ? 'var(--bg-elevated)'
                  : `linear-gradient(135deg, ${corPrimaria} 0%, ${isFisica ? '#4ade80' : '#a78bfa'} 100%)`,
                color: respostaUsuario === null && !mostrarResultado
                  ? 'var(--text-muted)'
                  : (isFisica ? '#000' : '#fff'),
                boxShadow: respostaUsuario !== null || mostrarResultado
                  ? `0 8px 32px rgba(${corPrimariaRgb}, 0.3)`
                  : 'none',
              }}
            >
              {mostrarResultado ? (
                <>
                  <span>{questaoAtualIndex + 1 >= sessao.questoes.length ? 'Ver Resultado' : 'Próxima Questão'}</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              ) : (
                <span>{respostaUsuario === null ? 'Selecione uma resposta' : 'Confirmar Resposta'}</span>
              )}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TELA DE RESULTADO
            ═══════════════════════════════════════════════════════════════════ */}
        {tela === 'resultado' && sessao && (
          <div className="space-y-5 animate-fade-in">
            {/* Card Principal */}
            <div
              className="relative overflow-hidden rounded-3xl p-8 text-center"
              style={{
                background: `linear-gradient(135deg, rgba(${corPrimariaRgb}, 0.2) 0%, rgba(${corPrimariaRgb}, 0.05) 100%)`,
                border: `2px solid ${corPrimaria}`,
              }}
            >
              {/* Confetti decorativo */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-float"
                    style={{
                      background: i % 2 === 0 ? corPrimaria : 'var(--warning)',
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      opacity: 0.3,
                    }}
                  />
                ))}
              </div>

              <div className="relative">
                <div
                  className="w-24 h-24 rounded-3xl mx-auto mb-5 flex items-center justify-center shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${corPrimaria} 0%, ${isFisica ? '#4ade80' : '#a78bfa'} 100%)`,
                  }}
                >
                  <Trophy className="w-12 h-12" style={{ color: isFisica ? '#000' : '#fff' }} />
                </div>

                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Parabéns!
                </h2>

                <div
                  className="text-5xl font-bold mb-2"
                  style={{
                    background: `linear-gradient(135deg, ${corPrimaria} 0%, ${isFisica ? '#4ade80' : '#a78bfa'} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {sessao.pontos} pts
                </div>

                <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
                  {sessao.respostas.filter((r) => r.correta).length} de {sessao.questoes.length} corretas
                </p>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: Target,
                  label: 'Taxa de Acerto',
                  value: `${Math.round((sessao.respostas.filter((r) => r.correta).length / sessao.questoes.length) * 100)}%`,
                  color: 'var(--success)',
                  bg: 'rgba(34, 197, 94, 0.1)',
                },
                {
                  icon: Flame,
                  label: 'Maior Sequência',
                  value: sessao.maiorSequencia.toString(),
                  color: 'var(--warning)',
                  bg: 'rgba(245, 158, 11, 0.1)',
                },
                {
                  icon: Clock,
                  label: 'Tempo Total',
                  value: `${Math.floor((Date.now() - sessao.tempoInicio) / 1000 / 60)}:${String(Math.floor((Date.now() - sessao.tempoInicio) / 1000) % 60).padStart(2, '0')}`,
                  color: 'var(--color-accent)',
                  bg: 'rgba(59, 130, 246, 0.1)',
                },
                {
                  icon: TrendingUp,
                  label: 'Média por Questão',
                  value: `${Math.round(sessao.pontos / sessao.questoes.length)} pts`,
                  color: corPrimaria,
                  bg: `rgba(${corPrimariaRgb}, 0.1)`,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-5 rounded-2xl"
                  style={{ background: stat.bg, border: '1px solid var(--border-default)' }}
                >
                  <stat.icon className="w-6 h-6 mb-2" style={{ color: stat.color }} />
                  <p className="text-2xl font-bold mb-1" style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Botões */}
            <div className="space-y-3 pt-2">
              <button
                onClick={jogarNovamente}
                className="w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: `linear-gradient(135deg, ${corPrimaria} 0%, ${isFisica ? '#4ade80' : '#a78bfa'} 100%)`,
                  color: isFisica ? '#000' : '#fff',
                  boxShadow: `0 8px 32px rgba(${corPrimariaRgb}, 0.3)`,
                }}
              >
                <RotateCcw className="w-5 h-5" />
                <span>Jogar Novamente</span>
              </button>

              <button
                onClick={reiniciar}
                className="w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                <Target className="w-5 h-5" />
                <span>Escolher Novo Tema</span>
              </button>

              <button
                onClick={() => router.push(`/${componente}/menu`)}
                className="w-full py-4 rounded-2xl font-semibold transition-all hover:scale-[1.01]"
                style={{ color: 'var(--text-muted)' }}
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav componente={componente} />

      {/* Estilos de animação */}
      <style jsx global>{`
        @keyframes pulse-success {
          0%, 100% { background-color: var(--bg-base); }
          50% { background-color: rgba(34, 197, 94, 0.1); }
        }
        .animate-pulse-success {
          animation: pulse-success 0.6s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
