'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, RotateCcw, CheckCircle2, WifiOff, RefreshCw, Clock, BookOpen } from 'lucide-react'
import QuestaoCard from '@/components/QuestaoCard'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Questao } from '@/types'

type StatusRevisao = 'OK' | 'SEM_REVISAO' | 'ERRO'

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

  const isFisica = componente === 'fisica'
  const nomeComponente = isFisica ? 'Física' : 'Matemática'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

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
      setErro('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  const iniciarTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
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

  const handleVoltar = () => router.push(`/${componente}/menu`)

  const formatarDataErro = (data: string) => {
    const d = new Date(data)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />
      {/* Header */}
      <header
        className="px-4 py-4 sticky top-0 z-10"
        style={{ background: 'var(--warning)', boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)' }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleVoltar}
            className="p-3 -ml-2 rounded-xl hover:bg-black/20 transition-colors touch-target"
            style={{ color: '#000' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" style={{ color: '#000' }} />
            <h1 className="font-display font-semibold" style={{ color: '#000' }}>
              Revisar Erros
            </h1>
          </div>
          {status === 'OK' && questao ? (
            <div
              className="flex items-center gap-1 rounded-full px-3 py-1"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <Clock className="w-4 h-4" style={{ color: '#000' }} />
              <span className="text-sm font-mono tabular-nums" style={{ color: '#000' }}>
                {tempoDecorrido}s
              </span>
            </div>
          ) : (
            <div className="w-12" />
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 pt-6">
        {status === 'OK' && questao ? (
          <div className="animate-fade-in-up">
            {/* Info de Revisão */}
            <div
              className="p-4 rounded-xl mb-4"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--warning)' }}>
                  Modo Revisão - {totalRevisao} {totalRevisao === 1 ? 'questão pendente' : 'questões pendentes'}
                </span>
              </div>
              {errouEm && (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Você errou esta questão em {formatarDataErro(errouEm)}
                </p>
              )}
            </div>

            <QuestaoCard
              questao={questao}
              componente={componente}
              tempoDecorrido={tempoDecorrido}
              onResponder={pararTimer}
              onProxima={buscarQuestao}
              onVoltar={handleVoltar}
              modo="revisao"
            />
          </div>
        ) : status === 'SEM_REVISAO' ? (
          <div
            className="card p-8 text-center animate-fade-in-up"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                border: `1px solid ${corPrimaria}`,
              }}
            >
              <CheckCircle2 className="w-8 h-8" style={{ color: corPrimaria }} />
            </div>
            <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Tudo Revisado!
            </h2>
            <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
              Você não tem questões de {nomeComponente} para revisar!
            </p>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              Continue estudando para aprender novos conteúdos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={() => router.push(`/${componente}/estudar`)}
                leftIcon={<BookOpen className="w-4 h-4" />}
              >
                Estudar Novas Questões
              </Button>
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={handleVoltar}
              >
                Voltar ao Menu
              </Button>
            </div>
          </div>
        ) : status === 'ERRO' ? (
          <div
            className="card p-8 text-center animate-fade-in-up"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <WifiOff className="w-8 h-8" style={{ color: 'var(--error)' }} />
            </div>
            <h2 className="font-display text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Ops! Erro
            </h2>
            <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              Tente novamente ou volte mais tarde.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={buscarQuestao}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Tentar Novamente
              </Button>
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={handleVoltar}
              >
                Voltar ao Menu
              </Button>
            </div>
          </div>
        ) : null}

        {/* Dica */}
        {status === 'OK' && questao && (
          <div
            className="mt-6 p-4 rounded-xl animate-fade-in"
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--warning)' }}>Dica:</strong> Revisar questões erradas é essencial para fixar o aprendizado!
              Acertos na revisão contribuem para sua nota bimestral.
            </p>
          </div>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
