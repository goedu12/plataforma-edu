'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, RotateCcw, CheckCircle2, WifiOff, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import QuestaoCard from '@/components/QuestaoCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
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
  const bgColor = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'

  // Formatar data de quando errou
  const formatarDataErro = (data: string) => {
    const d = new Date(data)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

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
            <RotateCcw className="w-5 h-5" />
            <h1 className="font-semibold">Revisar Erros</h1>
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
            {/* Info de Revisão - Estilo Terminal */}
            <div className="mb-4 rounded-2xl overflow-hidden border border-amber-500/30">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border-b border-amber-500/20">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                <span className="ml-2 text-xs text-gray-400 font-mono">revisao.sh</span>
              </div>
              <div className="p-4 bg-[#0d0d0d] font-mono text-sm">
                <p className="text-amber-400">
                  # Modo Revisão • {totalRevisao} {totalRevisao === 1 ? 'questão pendente' : 'questões pendentes'}
                </p>
                {errouEm && (
                  <p className="text-gray-400 text-xs mt-1">
                    $ Você errou esta questão em {formatarDataErro(errouEm)}
                  </p>
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
          <Card className="text-center py-10 animate-slide-up">
            <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${bgColor}`}>
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Tudo Revisado!
            </h2>
            <p className="text-text-secondary mb-2">
              Você não tem questões de {nomeComponente} para revisar!
            </p>
            <p className="text-sm text-text-muted mb-8">
              Continue estudando para aprender novos conteúdos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="secondary" onClick={() => router.push(`/${componente}/estudar`)}>
                Estudar Novas Questões
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
        ) : null}

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
              <p className="text-emerald-400 mb-1"># Modo Revisão</p>
              <p className="text-gray-300">$ Revisar questões erradas é essencial para fixar o aprendizado!</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
