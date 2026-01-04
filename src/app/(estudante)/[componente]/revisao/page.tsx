'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, RotateCcw, CheckCircle2, WifiOff, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import QuestaoCard from '@/components/QuestaoCard'
import Loading from '@/components/ui/Loading'
import type { Componente, Questao } from '@/types'

type StatusRevisao = 'OK' | 'SEM_REVISAO' | 'ERRO'

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

export default function RevisaoPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [questao, setQuestao] = useState<Questao | null>(null)
  const [status, setStatus] = useState<StatusRevisao | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [totalRevisao, setTotalRevisao] = useState(0)
  const [errouEm, setErrouEm] = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const buscarQuestao = async () => {
    setLoading(true)
    setErro(null)
    try {
      const response = await fetch(`/api/questoes/revisao?componente=${componente}`)
      const data = await response.json()

      if (data.sucesso) {
        setStatus(data.status)
        if (data.status === 'OK' && data.questao) {
          setQuestao(data.questao)
          setTotalRevisao(data.total_revisao)
          setErrouEm(data.errou_em)
          setTempoDecorrido(0)
          iniciarTimer()
        } else {
          setQuestao(null)
          setTotalRevisao(0)
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

  const nomeComponente = componente === 'fisica' ? 'Física' : 'Matemática'
  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? KOYEB.fisica : KOYEB.matematica

  // Formatar data de quando errou
  const formatarDataErro = (data: string) => {
    const d = new Date(data)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

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
          background: KOYEB.warning,
          boxShadow: `0 4px 20px ${KOYEB.warning}40`,
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
            <RotateCcw className="w-5 h-5" style={{ color: KOYEB.bg }} />
            <h1
              className="font-mono text-sm font-bold tracking-wider uppercase"
              style={{ color: KOYEB.bg }}
            >
              Revisar Erros
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

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 pt-6">
        {status === 'OK' && questao ? (
          <div className="animate-slide-up">
            {/* Info de Revisão - Terminal */}
            <div className="terminal-box terminal-amber mb-4">
              <div className="terminal-header">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
                <span className="title">revisao.sh</span>
              </div>
              <div className="terminal-body">
                <p className="warning"># Modo Revisao - {totalRevisao} {totalRevisao === 1 ? 'questao pendente' : 'questoes pendentes'}</p>
                {errouEm && (
                  <p className="muted">$ Voce errou esta questao em {formatarDataErro(errouEm)}</p>
                )}
              </div>
            </div>

            <QuestaoCard
              questao={questao}
              componente={componente}
              tempoDecorrido={tempoDecorrido}
              onResponder={handleResponder}
              onProxima={handleProxima}
              onVoltar={handleVoltar}
              modo="revisao"
            />
          </div>
        ) : status === 'SEM_REVISAO' ? (
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
              Tudo Revisado!
            </h2>
            <p className="mb-2" style={{ color: KOYEB.textSecondary }}>
              Você não tem questões de {nomeComponente} para revisar!
            </p>
            <p className="text-sm mb-8" style={{ color: KOYEB.textMuted }}>
              Continue estudando para aprender novos conteúdos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push(`/${componente}/estudar`)}
                className="px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
                style={{
                  background: 'transparent',
                  border: `2px solid ${accentColor}`,
                  color: accentColor,
                }}
              >
                Estudar Novas Questões
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
        ) : null}

        {/* Dicas - Terminal */}
        {status === 'OK' && questao && (
          <div className={`mt-6 terminal-box ${isFisica ? '' : 'terminal-lilas'} animate-fade-in`} style={{ animationDelay: '300ms' }}>
            <div className="terminal-header">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="title">dica.sh</span>
            </div>
            <div className="terminal-body space-y-1">
              <p className="comment"># Modo Revisao</p>
              <p className="text-white">$ Revisar questoes erradas e essencial para fixar o aprendizado!</p>
              <p className="warning">$ Acertos na revisao contribuem para sua nota bimestral!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
