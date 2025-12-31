'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle2, AlertCircle } from 'lucide-react'
import QuestaoCard from '@/components/QuestaoCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import type { Componente, Questao } from '@/types'

type StatusQuestao = 'OK' | 'SEM_QUESTOES' | 'COMPLETOU'

export default function EstudarPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [questao, setQuestao] = useState<Questao | null>(null)
  const [status, setStatus] = useState<StatusQuestao | null>(null)
  const [loading, setLoading] = useState(true)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const buscarQuestao = async () => {
    setLoading(true)
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
      }
    } catch (error) {
      console.error('Erro ao buscar questão:', error)
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

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleVoltar}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-800">Estudar</h1>
          <div className="w-10" /> {/* Placeholder para centralizar */}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto p-4">
        {status === 'OK' && questao ? (
          <QuestaoCard
            questao={questao}
            componente={componente}
            tempoDecorrido={tempoDecorrido}
            onResponder={handleResponder}
            onProxima={handleProxima}
            onVoltar={handleVoltar}
          />
        ) : status === 'COMPLETOU' ? (
          <Card className="text-center py-8 animate-slide-up">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Parabéns! 🎉
            </h2>
            <p className="text-gray-600 mb-6">
              Você completou todas as questões disponíveis!
            </p>
            <Button componente={componente} onClick={handleVoltar}>
              Voltar ao Menu
            </Button>
          </Card>
        ) : (
          <Card className="text-center py-8 animate-slide-up">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Nenhuma questão disponível
            </h2>
            <p className="text-gray-600 mb-6">
              Não há questões disponíveis no momento.
              Volte mais tarde ou fale com seu professor.
            </p>
            <Button componente={componente} onClick={handleVoltar}>
              Voltar ao Menu
            </Button>
          </Card>
        )}
      </main>
    </div>
  )
}
