'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle2, WifiOff, RefreshCw, Zap, Clock } from 'lucide-react'
import QuestaoCard from '@/components/QuestaoCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import type { Componente, Questao } from '@/types'

type StatusQuestao = 'OK' | 'SEM_QUESTOES' | 'COMPLETOU' | 'ERRO'

export default function EstudarPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [questao, setQuestao] = useState<Questao | null>(null)
  const [status, setStatus] = useState<StatusQuestao | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const buscarQuestao = async () => {
    setLoading(true)
    setErro(null)
    try {
      const response = await fetch(`/api/questoes?componente=${componente}`)
      const data = await response.json()

      if (data.sucesso) {
        setStatus(data.status)
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

  const nomeComponente = componente === 'fisica' ? 'Física' : 'Matemática'
  const isFisica = componente === 'fisica'
  const bgColor = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'
  const textColor = isFisica ? 'text-fisica-500' : 'text-matematica-500'

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-8">
      {/* Header */}
      <header className={`${bgColor} text-white px-4 py-4 sticky top-0 z-10`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleVoltar}
            className="p-2 -ml-2 rounded-xl hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <h1 className="font-semibold">Estudar {nomeComponente}</h1>
          </div>
          {status === 'OK' && questao && (
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">{tempoDecorrido}s</span>
            </div>
          )}
          {status !== 'OK' && <div className="w-16" />}
        </div>
      </header>

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
            />
          </div>
        ) : status === 'COMPLETOU' ? (
          <Card className="text-center py-10 animate-slide-up">
            <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${bgColor}`}>
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Parabéns!
            </h2>
            <p className="text-text-secondary mb-2">
              Você completou todas as questões de {nomeComponente} disponíveis para sua turma!
            </p>
            <p className="text-sm text-text-muted mb-8">
              Continue praticando no tutor IA ou aguarde novas questões.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="secondary" onClick={() => router.push(`/${componente}/tutor`)}>
                Praticar com Tutor IA
              </Button>
              <Button variant="primary" onClick={handleVoltar}>
                Voltar ao Menu
              </Button>
            </div>
          </Card>
        ) : status === 'ERRO' ? (
          <Card className="text-center py-10 animate-slide-up">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-500/20 border border-red-500/30">
              <WifiOff className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Ops! Erro
            </h2>
            <p className="text-text-secondary mb-2">
              {erro}
            </p>
            <p className="text-sm text-text-muted mb-8">
              Tente novamente ou volte mais tarde.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="secondary" onClick={buscarQuestao}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button variant="primary" onClick={handleVoltar}>
                Voltar ao Menu
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="text-center py-10 animate-slide-up">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-calm-elevated">
              <BookOpen className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Sem Questões
            </h2>
            <p className="text-text-secondary mb-2">
              Ainda não há questões de {nomeComponente} cadastradas para o seu ano escolar.
            </p>
            <p className="text-sm text-text-muted mb-8">
              Enquanto isso, você pode tirar dúvidas com o tutor IA!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="secondary" onClick={() => router.push(`/${componente}/tutor`)}>
                Conversar com Tutor IA
              </Button>
              <Button variant="primary" onClick={handleVoltar}>
                Voltar ao Menu
              </Button>
            </div>
          </Card>
        )}

        {/* Dicas - Estilo Terminal */}
        {status === 'OK' && questao && (
          <div className="mt-6 animate-fade-in rounded-2xl overflow-hidden border border-emerald-500/30" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-emerald-500/20">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
              <span className="ml-2 text-xs text-gray-400 font-mono">dica.sh</span>
            </div>
            <div className="p-4 bg-[#0d0d0d] font-mono text-sm">
              <p className="text-emerald-400 mb-1"># Dica de Velocidade</p>
              <p className="text-gray-300">$ Responda em menos de 30 segundos para ganhar bônus de velocidade!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
