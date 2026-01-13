'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
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
  Filter,
  Play,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'
import type {
  FlashCard,
  FlashCardQuiz,
  FlashCardComplete,
  FlashCardVF,
  AnoEscolar,
  TemaFlashCard,
  SessaoFlashCard,
  RespostaFlashCard,
  PONTUACAO_PADRAO,
} from '@/types/flashcards'
import { LABELS_ANO, LABELS_DIFICULDADE, CORES_DIFICULDADE } from '@/types/flashcards'

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

export default function FlashCardsPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  // Estados da tela
  const [tela, setTela] = useState<Tela>('selecao')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Estados de seleção
  const [temas, setTemas] = useState<TemaFlashCard[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState<AnoEscolar | null>(null)
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
  // CARREGAR TEMAS DISPONÍVEIS
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    carregarTemas()
  }, [componente])

  const carregarTemas = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/flashcards?componente=${componente}&action=temas`)
      const data = await response.json()
      if (data.sucesso) {
        setTemas(data.temas || [])
      } else {
        setErro(data.erro || 'Erro ao carregar temas')
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
      const params = new URLSearchParams({
        componente,
        action: 'questoes',
        limite: quantidadeQuestoes.toString(),
      })
      if (anoSelecionado) params.append('ano', anoSelecionado)
      if (temaSelecionado) params.append('tema', temaSelecionado)

      const response = await fetch(`/api/flashcards?${params}`)
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
        setErro(data.erro || 'Nenhuma questão encontrada para os filtros selecionados')
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

    // Verificar resposta baseado no tipo
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

    // Calcular pontos
    let pontosGanhos = 0
    let novaSequencia = sessao.sequenciaAtual

    if (correta) {
      setAnimacaoCorreta(true)
      setTimeout(() => setAnimacaoCorreta(false), 600)

      pontosGanhos = Math.round(
        PONTUACAO.base * PONTUACAO.multiplicadorDificuldade[questao.dificuldade]
      )
      if (usouDica) {
        pontosGanhos = Math.max(0, pontosGanhos - PONTUACAO.penalididadeDica)
      }
      novaSequencia++
      if (novaSequencia > 1) {
        pontosGanhos += PONTUACAO.bonusSequencia * (novaSequencia - 1)
      }
    } else {
      setAnimacaoErrada(true)
      setTimeout(() => setAnimacaoErrada(false), 600)
      novaSequencia = 0
    }

    // Registrar resposta
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
      // Fim do jogo
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
          ano: anoSelecionado,
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
    iniciarSessao()
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDERIZAÇÃO
  // ═══════════════════════════════════════════════════════════════════

  if (loading && tela === 'selecao') {
    return <Loading fullScreen componente={componente} />
  }

  const questaoAtual = sessao?.questoes[questaoAtualIndex]

  return (
    <div
      className={`min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col ${animacaoCorreta ? 'animate-pulse-success' : ''} ${animacaoErrada ? 'animate-shake' : ''}`}
      style={{ background: 'var(--bg-base)' }}
    >
      <NavigationRail componente={componente} />

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════════════ */}
      <header
        className="px-4 py-3 sticky top-0 z-10 flex-shrink-0"
        style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => (tela === 'selecao' ? router.push(`/${componente}/menu`) : reiniciar())}
            className="p-2 -ml-2 rounded-lg lg:hidden"
            style={{ color: 'var(--text-muted)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" style={{ color: corPrimaria }} />
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
              FlashCards
            </span>
          </div>

          {tela === 'jogando' && sessao && (
            <div className="flex items-center gap-3">
              {/* Sequência */}
              {sessao.sequenciaAtual > 0 && (
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold"
                  style={{ background: `rgba(${corPrimariaRgb}, 0.15)`, color: corPrimaria }}
                >
                  <Flame className="w-4 h-4" />
                  <span>{sessao.sequenciaAtual}</span>
                </div>
              )}
              {/* Pontos */}
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold"
                style={{ background: 'var(--bg-elevated)', color: 'var(--warning)' }}
              >
                <Trophy className="w-4 h-4" />
                <span>{sessao.pontos}</span>
              </div>
            </div>
          )}

          {tela === 'selecao' && <div className="w-10 lg:hidden" />}
        </div>

        {/* Progress bar */}
        {tela === 'jogando' && sessao && (
          <div className="max-w-2xl mx-auto mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((questaoAtualIndex + (mostrarResultado ? 1 : 0)) / sessao.questoes.length) * 100}%`,
                    background: corPrimaria,
                  }}
                />
              </div>
              <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {questaoAtualIndex + 1}/{sessao.questoes.length}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTEÚDO
          ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-4 w-full">
        {/* TELA DE SELEÇÃO */}
        {tela === 'selecao' && (
          <div className="space-y-6 animate-fade-in">
            {/* Título */}
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                FlashCards de {nomeComponente}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Teste seus conhecimentos de forma rápida e divertida!
              </p>
            </div>

            {/* Seleção de Ano */}
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4" style={{ color: corPrimaria }} />
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Selecione o Ano
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setAnoSelecionado(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: !anoSelecionado ? corPrimaria : 'var(--bg-elevated)',
                    color: !anoSelecionado ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)',
                  }}
                >
                  Todos
                </button>
                {(['1ano', '2ano', '3ano'] as AnoEscolar[]).map((ano) => (
                  <button
                    key={ano}
                    onClick={() => setAnoSelecionado(ano)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: anoSelecionado === ano ? corPrimaria : 'var(--bg-elevated)',
                      color: anoSelecionado === ano ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)',
                    }}
                  >
                    {LABELS_ANO[ano]}
                  </button>
                ))}
              </div>
            </div>

            {/* Seleção de Tema */}
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4" style={{ color: corPrimaria }} />
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Selecione o Tema
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setTemaSelecionado(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: !temaSelecionado ? corPrimaria : 'var(--bg-elevated)',
                    color: !temaSelecionado ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)',
                  }}
                >
                  Todos
                </button>
                {temas.map((tema) => (
                  <button
                    key={tema.id}
                    onClick={() => setTemaSelecionado(tema.nome)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                    style={{
                      background: temaSelecionado === tema.nome ? corPrimaria : 'var(--bg-elevated)',
                      color: temaSelecionado === tema.nome ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)',
                    }}
                  >
                    <span>{tema.icone}</span>
                    <span>{tema.nome}</span>
                    <span className="opacity-60">({tema.totalQuestoes})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantidade de Questões */}
            <div
              className="p-4 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" style={{ color: corPrimaria }} />
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Quantidade de Questões
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 15, 20, 30].map((qtd) => (
                  <button
                    key={qtd}
                    onClick={() => setQuantidadeQuestoes(qtd)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: quantidadeQuestoes === qtd ? corPrimaria : 'var(--bg-elevated)',
                      color: quantidadeQuestoes === qtd ? (isFisica ? '#000' : '#fff') : 'var(--text-secondary)',
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
                className="p-4 rounded-xl"
                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                <p className="text-sm" style={{ color: 'var(--error)' }}>
                  {erro}
                </p>
              </div>
            )}

            {/* Botão Iniciar */}
            <Button
              variant={isFisica ? 'fisica' : 'matematica'}
              onClick={iniciarSessao}
              loading={loading}
              className="w-full min-h-[56px] text-lg"
              leftIcon={<Play className="w-5 h-5" />}
            >
              Iniciar FlashCards
            </Button>
          </div>
        )}

        {/* TELA DE JOGO */}
        {tela === 'jogando' && sessao && questaoAtual && (
          <div className="space-y-4 animate-fade-in">
            {/* Card da Questão */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              {/* Tags */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant={componente}>{questaoAtual.tema}</Badge>
                <Badge
                  variant={
                    questaoAtual.dificuldade === 'facil'
                      ? 'success'
                      : questaoAtual.dificuldade === 'medio'
                        ? 'warning'
                        : 'error'
                  }
                >
                  {LABELS_DIFICULDADE[questaoAtual.dificuldade]}
                </Badge>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  {questaoAtual.tipo === 'quiz' ? 'Quiz' : questaoAtual.tipo === 'vf' ? 'V ou F' : 'Complete'}
                </span>
              </div>

              {/* Pergunta */}
              <p className="text-lg font-medium leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>
                {questaoAtual.pergunta}
              </p>

              {/* Opções baseadas no tipo */}
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
                        className="w-full p-4 rounded-xl flex items-center gap-3 transition-all text-left"
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
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
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
                        <span className="flex-1" style={{ color: 'var(--text-primary)' }}>
                          {opcao}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {questaoAtual.tipo === 'vf' && (
                <div className="flex gap-3">
                  {[
                    { valor: true, label: 'Verdadeiro', icone: '✓' },
                    { valor: false, label: 'Falso', icone: '✗' },
                  ].map(({ valor, label, icone }) => {
                    const selecionada = respostaUsuario === valor
                    const correta = (questaoAtual as FlashCardVF).respostaCorreta === valor
                    const errada = mostrarResultado && selecionada && !correta

                    return (
                      <button
                        key={label}
                        onClick={() => !mostrarResultado && setRespostaUsuario(valor)}
                        disabled={mostrarResultado}
                        className="flex-1 p-4 rounded-xl flex flex-col items-center gap-2 transition-all"
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
                        <span className="text-2xl">{icone}</span>
                        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {questaoAtual.tipo === 'complete' && (
                <div>
                  <input
                    type="text"
                    value={respostaUsuario?.toString() || ''}
                    onChange={(e) => !mostrarResultado && setRespostaUsuario(e.target.value)}
                    disabled={mostrarResultado}
                    placeholder="Digite sua resposta..."
                    className="w-full p-4 rounded-xl text-lg transition-all"
                    style={{
                      background: 'var(--bg-elevated)',
                      border: mostrarResultado
                        ? sessao.respostas[questaoAtualIndex]?.correta
                          ? '2px solid var(--success)'
                          : '2px solid var(--error)'
                        : '1px solid var(--border-default)',
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
                    <p className="mt-2 text-sm" style={{ color: 'var(--success)' }}>
                      Resposta correta: <strong>{(questaoAtual as FlashCardComplete).respostaCorreta}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Dica */}
            {questaoAtual.dica && !mostrarResultado && (
              <div>
                {mostrarDica ? (
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: `rgba(${corPrimariaRgb}, 0.1)`,
                      border: '1px dashed var(--border-default)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4" style={{ color: corPrimaria }} />
                      <span className="text-sm font-medium" style={{ color: corPrimaria }}>
                        Dica
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {questaoAtual.dica}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMostrarDica(true)
                      setUsouDica(true)
                    }}
                    className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px dashed var(--border-default)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm">Ver dica (-5 pts)</span>
                  </button>
                )}
              </div>
            )}

            {/* Feedback */}
            {mostrarResultado && questaoAtual.explicacao && (
              <div
                className="p-4 rounded-xl animate-fade-in"
                style={{
                  background: sessao.respostas[questaoAtualIndex]?.correta
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${sessao.respostas[questaoAtualIndex]?.correta ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: sessao.respostas[questaoAtualIndex]?.correta
                        ? 'rgba(34, 197, 94, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    {sessao.respostas[questaoAtualIndex]?.correta ? (
                      <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--success)' }} />
                    ) : (
                      <XCircle className="w-5 h-5" style={{ color: 'var(--error)' }} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="font-semibold"
                        style={{
                          color: sessao.respostas[questaoAtualIndex]?.correta ? 'var(--success)' : 'var(--error)',
                        }}
                      >
                        {sessao.respostas[questaoAtualIndex]?.correta ? 'Correto!' : 'Incorreto'}
                      </span>
                      {sessao.respostas[questaoAtualIndex]?.correta && sessao.respostas[questaoAtualIndex]?.pontos_ganhos > 0 && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)' }}
                        >
                          +{sessao.respostas[questaoAtualIndex]?.pontos_ganhos} pts
                        </span>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {questaoAtual.explicacao}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex gap-3">
              {!mostrarResultado ? (
                <Button
                  variant={isFisica ? 'fisica' : 'matematica'}
                  onClick={verificarResposta}
                  disabled={respostaUsuario === null}
                  className="flex-1 min-h-[52px]"
                >
                  Confirmar
                </Button>
              ) : (
                <Button
                  variant={isFisica ? 'fisica' : 'matematica'}
                  onClick={proximaQuestao}
                  className="flex-1 min-h-[52px]"
                  rightIcon={<ChevronRight className="w-5 h-5" />}
                >
                  {questaoAtualIndex + 1 >= sessao.questoes.length ? 'Ver Resultado' : 'Próxima'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* TELA DE RESULTADO */}
        {tela === 'resultado' && sessao && (
          <div className="space-y-6 animate-fade-in">
            {/* Card Principal */}
            <div
              className="p-6 rounded-2xl text-center"
              style={{
                background: `linear-gradient(135deg, rgba(${corPrimariaRgb}, 0.15) 0%, rgba(${corPrimariaRgb}, 0.05) 100%)`,
                border: `1px solid ${corPrimaria}`,
              }}
            >
              <div
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: corPrimaria }}
              >
                <Trophy className="w-10 h-10" style={{ color: isFisica ? '#000' : '#fff' }} />
              </div>

              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Sessão Concluída!
              </h2>

              <div className="text-4xl font-bold mb-1" style={{ color: corPrimaria }}>
                {sessao.pontos} pts
              </div>

              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {sessao.respostas.filter((r) => r.correta).length} de {sessao.questoes.length} corretas
              </p>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-4 rounded-xl text-center"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Target className="w-4 h-4" style={{ color: 'var(--success)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Taxa de Acerto
                  </span>
                </div>
                <span className="text-2xl font-bold" style={{ color: 'var(--success)' }}>
                  {Math.round((sessao.respostas.filter((r) => r.correta).length / sessao.questoes.length) * 100)}%
                </span>
              </div>

              <div
                className="p-4 rounded-xl text-center"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Flame className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Maior Sequência
                  </span>
                </div>
                <span className="text-2xl font-bold" style={{ color: 'var(--warning)' }}>
                  {sessao.maiorSequencia}
                </span>
              </div>

              <div
                className="p-4 rounded-xl text-center"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Tempo Total
                  </span>
                </div>
                <span className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                  {Math.floor((Date.now() - sessao.tempoInicio) / 1000 / 60)}:{String(Math.floor((Date.now() - sessao.tempoInicio) / 1000) % 60).padStart(2, '0')}
                </span>
              </div>

              <div
                className="p-4 rounded-xl text-center"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Lightbulb className="w-4 h-4" style={{ color: corPrimaria }} />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Dicas Usadas
                  </span>
                </div>
                <span className="text-2xl font-bold" style={{ color: corPrimaria }}>
                  {sessao.respostas.filter((r) => r.usou_dica).length}
                </span>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-3">
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={jogarNovamente}
                className="w-full min-h-[52px]"
                leftIcon={<RotateCcw className="w-5 h-5" />}
              >
                Jogar Novamente
              </Button>

              <Button
                variant="secondary"
                onClick={reiniciar}
                className="w-full min-h-[48px]"
              >
                Escolher Novo Tema
              </Button>

              <Button
                variant="secondary"
                onClick={() => router.push(`/${componente}/menu`)}
                className="w-full min-h-[48px]"
              >
                Voltar ao Menu
              </Button>
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
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  )
}
