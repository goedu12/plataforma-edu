'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle2, WifiOff, RefreshCw, Clock, AlertTriangle, Calendar } from 'lucide-react'
import QuestaoCard from '@/components/QuestaoCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
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
  const bgColor = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'

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

      {/* Indicador de Limite Semanal */}
      {limite && limite.limite_semanal !== null && status === 'OK' && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-between bg-dark-elevated rounded-xl p-3 border border-border">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-muted" />
              <span className="text-sm text-text-secondary">Esta semana</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${
                limite.restantes !== null && limite.restantes <= 3 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {limite.questoes_semana}/{limite.limite_semanal}
              </span>
              {limite.restantes !== null && limite.restantes <= 5 && (
                <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
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
          <Card className="text-center py-10 animate-slide-up">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-amber-500/20 border border-amber-500/30">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Limite Semanal Atingido
            </h2>
            <p className="text-text-secondary mb-2">
              Você já respondeu {limite?.questoes_semana || 15} questões esta semana!
            </p>
            <p className="text-sm text-text-muted mb-8">
              O limite semanal é de 15 questões no modo estudo. Volte na segunda-feira para continuar ou use o modo Desafio para praticar sem limites!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="secondary" onClick={() => router.push(`/${componente}/desafio`)}>
                Modo Desafio (Ilimitado)
              </Button>
              <Button variant="primary" onClick={handleVoltar}>
                Voltar ao Menu
              </Button>
            </div>
          </Card>
        ) : status === 'FORA_PERIODO' ? (
          <Card className="text-center py-10 animate-slide-up">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-blue-500/20 border border-blue-500/30">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Fora do Período Letivo
            </h2>
            <p className="text-text-secondary mb-2">
              O período letivo ainda não começou ou está em férias.
            </p>
            <p className="text-sm text-text-muted mb-8">
              Você pode usar o modo Desafio para praticar sem limites!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="secondary" onClick={() => router.push(`/${componente}/desafio`)}>
                Modo Desafio
              </Button>
              <Button variant="primary" onClick={handleVoltar}>
                Voltar ao Menu
              </Button>
            </div>
          </Card>
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

        {/* Dicas - Estilo Terminal Koyeb */}
        {status === 'OK' && questao && (
          <div className="mt-6 animate-fade-in terminal-box" style={{ animationDelay: '300ms' }}>
            <div className="terminal-header">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="title">dica.sh</span>
            </div>
            <div className="terminal-body">
              <p className="comment"># Dica de Velocidade</p>
              <p className="text-white mt-1">$ Responda em menos de 30 segundos para ganhar bônus de velocidade!</p>
              {limite && limite.limite_semanal !== null && (
                <>
                  <p className="comment mt-3"># Limite Semanal</p>
                  <p className="text-white mt-1">$ Máximo de {limite.limite_semanal} questões por semana no modo estudo</p>
                  <p className="text-white">$ Questões desta semana: {limite.questoes_semana}/{limite.limite_semanal}</p>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
