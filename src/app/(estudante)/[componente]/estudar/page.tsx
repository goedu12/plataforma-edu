'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle2, WifiOff, RefreshCw, Clock, AlertTriangle, Calendar, Zap } from 'lucide-react'
import QuestaoCard from '@/components/QuestaoCard'
import Loading from '@/components/ui/Loading'
import type { Componente, Questao } from '@/types'

type StatusQuestao = 'OK' | 'SEM_QUESTOES' | 'COMPLETOU' | 'ERRO' | 'LIMITE_SEMANAL' | 'FORA_PERIODO'

interface LimiteInfo {
  questoes_semana: number
  limite_semanal: number | null
  restantes: number | null
  pode_responder: boolean
}

interface PeriodoInfo {
  bimestre: number
  tipo: 'regular' | 'recuperacao'
  dias_restantes: number
}

// Cores Koyeb
const KOYEB = {
  bg: '#0D0D14',
  bgCard: '#1A1A2E',
  bgElevated: '#222238',
  bgDark: '#12121C',
  primary: '#00FF88',
  accent: '#00D4FF',
  fisica: '#00FF88',
  matematica: '#A855F7',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B8B9A',
  textMuted: '#5A5A6E',
  border: 'rgba(255,255,255,0.05)',
  danger: '#FF4757',
  warning: '#FFB800',
}

export default function EstudarPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [questao, setQuestao] = useState<Questao | null>(null)
  const [status, setStatus] = useState<StatusQuestao | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [limite, setLimite] = useState<LimiteInfo | null>(null)
  const [periodo, setPeriodo] = useState<PeriodoInfo | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const buscarQuestao = async () => {
    setLoading(true)
    setErro(null)
    try {
      const response = await fetch(`/api/questoes?componente=${componente}&modo=estudo`)
      const data = await response.json()

      if (data.sucesso) {
        setStatus(data.status)
        setLimite(data.limite || null)
        setPeriodo(data.periodo || null)

        if (data.status === 'OK' && data.questao) {
          setQuestao(data.questao)
          setTempoDecorrido(0)
          iniciarTimer()
        } else {
          setQuestao(null)
        }
      } else {
        setStatus('ERRO')
        setErro(data.erro || 'Erro ao carregar questão')
      }
    } catch (error) {
      console.error('Erro ao buscar questão:', error)
      setStatus('ERRO')
      setErro('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.')
    } finally {
      setLoading(false)
    }
  }

  const iniciarTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    timerRef.current = setInterval(() => {
      setTempoDecorrido(prev => prev + 1)
    }, 1000)
  }

  const pararTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarQuestao()

    return () => pararTimer()
  }, [componente])

  const handleResponder = () => {
    pararTimer()
  }

  const handleProxima = () => {
    buscarQuestao()
  }

  const handleVoltar = () => {
    router.push(`/${componente}/menu`)
  }

  const handleNotaAtualizada = (novoLimite: LimiteInfo) => {
    setLimite(novoLimite)
  }

  const nomeComponente = componente === 'fisica' ? 'Física' : 'Matemática'
  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? KOYEB.fisica : KOYEB.matematica

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  return (
    <div
      className="min-h-screen pb-8"
      style={{
        background: `linear-gradient(180deg, ${KOYEB.bg} 0%, ${KOYEB.bgCard} 100%)`,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        className="px-4 py-4 sticky top-0 z-10"
        style={{
          background: accentColor,
          boxShadow: `0 4px 20px ${accentColor}40`,
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleVoltar}
            className="p-2 -ml-2 rounded-xl hover:bg-black/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: KOYEB.bg }} />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: KOYEB.bg }} />
            <h1
              className="font-mono text-sm font-bold tracking-wider uppercase"
              style={{ color: KOYEB.bg }}
            >
              Estudar
            </h1>
          </div>
          {status === 'OK' && questao && (
            <div
              className="flex items-center gap-1 rounded-full px-3 py-1"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <Clock className="w-4 h-4" style={{ color: KOYEB.bg }} />
              <span
                className="text-sm font-mono tabular-nums"
                style={{ color: KOYEB.bg }}
              >
                {tempoDecorrido}s
              </span>
            </div>
          )}
          {status !== 'OK' && <div className="w-16" />}
        </div>
      </header>

      {/* Indicador de Limite Semanal */}
      {limite && limite.limite_semanal !== null && status === 'OK' && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div
            className="flex items-center justify-between rounded-xl p-3"
            style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: KOYEB.textMuted }} />
              <span className="text-sm" style={{ color: KOYEB.textSecondary }}>
                Esta semana
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-mono font-bold tabular-nums"
                style={{
                  color: limite.restantes !== null && limite.restantes <= 3 ? KOYEB.warning : KOYEB.primary,
                }}
              >
                {limite.questoes_semana}/{limite.limite_semanal}
              </span>
              {limite.restantes !== null && limite.restantes <= 5 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: `${KOYEB.warning}20`,
                    color: KOYEB.warning,
                  }}
                >
                  {limite.restantes} restantes
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 pt-6">
        {status === 'OK' && questao ? (
          <div className="animate-slide-up">
            <QuestaoCard
              questao={questao}
              componente={componente}
              tempoDecorrido={tempoDecorrido}
              onResponder={handleResponder}
              onProxima={handleProxima}
              onVoltar={handleVoltar}
              onNotaAtualizada={handleNotaAtualizada}
              limiteAtual={limite}
            />
          </div>
        ) : status === 'LIMITE_SEMANAL' ? (
          <div
            className="rounded-2xl p-8 text-center animate-slide-up"
            style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: `${KOYEB.warning}20`, border: `1px solid ${KOYEB.warning}40` }}
            >
              <AlertTriangle className="w-8 h-8" style={{ color: KOYEB.warning }} />
            </div>
            <h2
              className="font-mono text-xl font-bold mb-3"
              style={{ color: KOYEB.textPrimary }}
            >
              Limite Semanal Atingido
            </h2>
            <p className="mb-2" style={{ color: KOYEB.textSecondary }}>
              Você já respondeu {limite?.questoes_semana || 15} questões esta semana!
            </p>
            <p className="text-sm mb-8" style={{ color: KOYEB.textMuted }}>
              O limite semanal é de 15 questões no modo estudo. Volte na segunda-feira para continuar ou use o modo Desafio para praticar sem limites!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push(`/${componente}/desafio`)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
                style={{
                  background: 'transparent',
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                }}
              >
                <Zap className="w-4 h-4" />
                Modo Desafio
              </button>
              <button
                onClick={handleVoltar}
                className="px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
                style={{
                  background: accentColor,
                  color: KOYEB.bg,
                  boxShadow: `0 4px 20px ${accentColor}40`,
                }}
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        ) : status === 'FORA_PERIODO' ? (
          <div
            className="rounded-2xl p-8 text-center animate-slide-up"
            style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: `${KOYEB.accent}20`, border: `1px solid ${KOYEB.accent}40` }}
            >
              <Calendar className="w-8 h-8" style={{ color: KOYEB.accent }} />
            </div>
            <h2
              className="font-mono text-xl font-bold mb-3"
              style={{ color: KOYEB.textPrimary }}
            >
              Fora do Período Letivo
            </h2>
            <p className="mb-2" style={{ color: KOYEB.textSecondary }}>
              O período letivo ainda não começou ou está em férias.
            </p>
            <p className="text-sm mb-8" style={{ color: KOYEB.textMuted }}>
              Você pode usar o modo Desafio para praticar sem limites!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push(`/${componente}/desafio`)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
                style={{
                  background: 'transparent',
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                }}
              >
                <Zap className="w-4 h-4" />
                Modo Desafio
              </button>
              <button
                onClick={handleVoltar}
                className="px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
                style={{
                  background: accentColor,
                  color: KOYEB.bg,
                  boxShadow: `0 4px 20px ${accentColor}40`,
                }}
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        ) : status === 'COMPLETOU' ? (
          <div
            className="rounded-2xl p-8 text-center animate-slide-up"
            style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: accentColor }}
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: KOYEB.bg }} />
            </div>
            <h2
              className="font-mono text-xl font-bold mb-3"
              style={{ color: KOYEB.textPrimary }}
            >
              Parabéns!
            </h2>
            <p className="mb-2" style={{ color: KOYEB.textSecondary }}>
              Você completou todas as questões de {nomeComponente} disponíveis para sua turma!
            </p>
            <p className="text-sm mb-8" style={{ color: KOYEB.textMuted }}>
              Continue praticando no tutor IA ou aguarde novas questões.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push(`/${componente}/tutor`)}
                className="px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
                style={{
                  background: 'transparent',
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                }}
              >
                Praticar com Tutor IA
              </button>
              <button
                onClick={handleVoltar}
                className="px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
                style={{
                  background: accentColor,
                  color: KOYEB.bg,
                  boxShadow: `0 4px 20px ${accentColor}40`,
                }}
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        ) : status === 'ERRO' ? (
          <div
            className="rounded-2xl p-8 text-center animate-slide-up"
            style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: `${KOYEB.danger}20`, border: `1px solid ${KOYEB.danger}40` }}
            >
              <WifiOff className="w-8 h-8" style={{ color: KOYEB.danger }} />
            </div>
            <h2
              className="font-mono text-xl font-bold mb-3"
              style={{ color: KOYEB.textPrimary }}
            >
              Ops! Erro
            </h2>
            <p className="mb-2" style={{ color: KOYEB.textSecondary }}>
              {erro}
            </p>
            <p className="text-sm mb-8" style={{ color: KOYEB.textMuted }}>
              Tente novamente ou volte mais tarde.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={buscarQuestao}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
                style={{
                  background: 'transparent',
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
              <button
                onClick={handleVoltar}
                className="px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
                style={{
                  background: accentColor,
                  color: KOYEB.bg,
                  boxShadow: `0 4px 20px ${accentColor}40`,
                }}
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-8 text-center animate-slide-up"
            style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: KOYEB.bgElevated }}
            >
              <BookOpen className="w-8 h-8" style={{ color: KOYEB.textMuted }} />
            </div>
            <h2
              className="font-mono text-xl font-bold mb-3"
              style={{ color: KOYEB.textPrimary }}
            >
              Sem Questões
            </h2>
            <p className="mb-2" style={{ color: KOYEB.textSecondary }}>
              Ainda não há questões de {nomeComponente} cadastradas para o seu ano escolar.
            </p>
            <p className="text-sm mb-8" style={{ color: KOYEB.textMuted }}>
              Enquanto isso, você pode tirar dúvidas com o tutor IA!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push(`/${componente}/tutor`)}
                className="px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
                style={{
                  background: 'transparent',
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                }}
              >
                Conversar com Tutor IA
              </button>
              <button
                onClick={handleVoltar}
                className="px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
                style={{
                  background: accentColor,
                  color: KOYEB.bg,
                  boxShadow: `0 4px 20px ${accentColor}40`,
                }}
              >
                Voltar ao Menu
              </button>
            </div>
          </div>
        )}

        {/* Dicas - Estilo Terminal Koyeb */}
        {status === 'OK' && questao && (
          <div className={`mt-6 terminal-box ${isFisica ? '' : 'terminal-lilas'} animate-fade-in`} style={{ animationDelay: '300ms' }}>
            <div className="terminal-header">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="title">dica.sh</span>
            </div>
            <div className="terminal-body space-y-2">
              <p className="comment"># Dica de Velocidade</p>
              <p className="text-white">$ Responda em menos de 30 segundos para ganhar bonus de velocidade!</p>
              {limite && limite.limite_semanal !== null && (
                <>
                  <p className="comment mt-3"># Limite Semanal</p>
                  <p className="text-white">$ Maximo de {limite.limite_semanal} questoes por semana no modo estudo</p>
                  <p className="success">$ Questoes desta semana: {limite.questoes_semana}/{limite.limite_semanal}</p>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
