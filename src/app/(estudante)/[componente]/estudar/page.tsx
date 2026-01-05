'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle2, WifiOff, RefreshCw, Clock, AlertTriangle, Calendar, Zap } from 'lucide-react'
import QuestaoCard from '@/components/QuestaoCard'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Questao } from '@/types'

type StatusQuestao = 'OK' | 'SEM_QUESTOES' | 'COMPLETOU' | 'ERRO' | 'LIMITE_SEMANAL' | 'FORA_PERIODO'

interface LimiteInfo {
  questoes_semana: number
  limite_semanal: number | null
  restantes: number | null
  pode_responder: boolean
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
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const isFisica = componente === 'fisica'
  const nomeComponente = isFisica ? 'Física' : 'Matemática'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const corGlow = isFisica ? 'var(--color-fisica-glow)' : 'var(--color-matematica-glow)'

  const buscarQuestao = async () => {
    setLoading(true)
    setErro(null)
    try {
      const response = await fetch(`/api/questoes?componente=${componente}&modo=estudo`)
      const data = await response.json()

      if (data.sucesso) {
        setStatus(data.status)
        setLimite(data.limite || null)

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
  const handleNotaAtualizada = (novoLimite: LimiteInfo) => setLimite(novoLimite)

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />
      {/* Header */}
      <header
        className="px-4 py-4 sticky top-0 z-10"
        style={{
          background: corPrimaria,
          boxShadow: `0 4px 20px ${corGlow}`,
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleVoltar}
            className="p-3 -ml-2 rounded-xl hover:bg-black/20 transition-colors touch-target"
          >
            <ArrowLeft className="w-5 h-5" style={{ color: isFisica ? '#000' : '#fff' }} />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: isFisica ? '#000' : '#fff' }} />
            <h1
              className="font-display font-semibold"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              Estudar
            </h1>
          </div>
          {status === 'OK' && questao ? (
            <div
              className="flex items-center gap-1 rounded-full px-3 py-1"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <Clock className="w-4 h-4" style={{ color: isFisica ? '#000' : '#fff' }} />
              <span
                className="text-sm font-mono tabular-nums"
                style={{ color: isFisica ? '#000' : '#fff' }}
              >
                {tempoDecorrido}s
              </span>
            </div>
          ) : (
            <div className="w-12" />
          )}
        </div>
      </header>

      {/* Indicador de Limite Semanal */}
      {limite && limite.limite_semanal !== null && status === 'OK' && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div
            className="flex items-center justify-between rounded-xl p-3"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Esta semana
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-mono font-bold tabular-nums"
                style={{
                  color: limite.restantes !== null && limite.restantes <= 3
                    ? 'var(--warning)'
                    : corPrimaria,
                }}
              >
                {limite.questoes_semana}/{limite.limite_semanal}
              </span>
              {limite.restantes !== null && limite.restantes <= 5 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--warning)',
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
          <div className="animate-fade-in-up">
            <QuestaoCard
              questao={questao}
              componente={componente}
              tempoDecorrido={tempoDecorrido}
              onResponder={pararTimer}
              onProxima={buscarQuestao}
              onVoltar={handleVoltar}
              onNotaAtualizada={handleNotaAtualizada}
              limiteAtual={limite}
            />
          </div>
        ) : (
          <div
            className="card p-8 text-center animate-fade-in-up"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            {/* Ícone */}
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{
                background: status === 'LIMITE_SEMANAL' ? 'rgba(245, 158, 11, 0.15)'
                  : status === 'ERRO' ? 'rgba(239, 68, 68, 0.15)'
                  : status === 'COMPLETOU' ? `${corGlow}`
                  : 'var(--bg-elevated)',
                border: status === 'LIMITE_SEMANAL' ? '1px solid rgba(245, 158, 11, 0.3)'
                  : status === 'ERRO' ? '1px solid rgba(239, 68, 68, 0.3)'
                  : status === 'COMPLETOU' ? `1px solid ${corPrimaria}`
                  : '1px solid var(--border-default)',
              }}
            >
              {status === 'LIMITE_SEMANAL' && <AlertTriangle className="w-8 h-8" style={{ color: 'var(--warning)' }} />}
              {status === 'FORA_PERIODO' && <Calendar className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />}
              {status === 'COMPLETOU' && <CheckCircle2 className="w-8 h-8" style={{ color: corPrimaria }} />}
              {status === 'ERRO' && <WifiOff className="w-8 h-8" style={{ color: 'var(--error)' }} />}
              {status === 'SEM_QUESTOES' && <BookOpen className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />}
            </div>

            {/* Título */}
            <h2
              className="font-display text-xl font-bold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              {status === 'LIMITE_SEMANAL' && 'Limite Semanal Atingido'}
              {status === 'FORA_PERIODO' && 'Fora do Período Letivo'}
              {status === 'COMPLETOU' && 'Parabéns!'}
              {status === 'ERRO' && 'Ops! Erro'}
              {status === 'SEM_QUESTOES' && 'Sem Questões'}
            </h2>

            {/* Descrição */}
            <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
              {status === 'LIMITE_SEMANAL' && `Você já respondeu ${limite?.questoes_semana || 15} questões esta semana!`}
              {status === 'FORA_PERIODO' && 'O período letivo ainda não começou ou está em férias.'}
              {status === 'COMPLETOU' && `Você completou todas as questões de ${nomeComponente}!`}
              {status === 'ERRO' && erro}
              {status === 'SEM_QUESTOES' && `Ainda não há questões de ${nomeComponente} para seu ano.`}
            </p>

            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              {status === 'LIMITE_SEMANAL' && 'Volte na segunda-feira ou use o modo Desafio!'}
              {status === 'FORA_PERIODO' && 'Use o modo Desafio para praticar sem limites!'}
              {status === 'COMPLETOU' && 'Continue praticando no tutor IA!'}
              {status === 'ERRO' && 'Tente novamente ou volte mais tarde.'}
              {status === 'SEM_QUESTOES' && 'Tire dúvidas com o tutor IA!'}
            </p>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {(status === 'LIMITE_SEMANAL' || status === 'FORA_PERIODO') && (
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/${componente}/desafio`)}
                  leftIcon={<Zap className="w-4 h-4" />}
                >
                  Modo Desafio
                </Button>
              )}
              {(status === 'COMPLETOU' || status === 'SEM_QUESTOES') && (
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/${componente}/tutor`)}
                >
                  Tutor IA
                </Button>
              )}
              {status === 'ERRO' && (
                <Button
                  variant="secondary"
                  onClick={buscarQuestao}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Tentar Novamente
                </Button>
              )}
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={handleVoltar}
              >
                Voltar ao Menu
              </Button>
            </div>
          </div>
        )}

        {/* Dica simples (sem terminal-box) */}
        {status === 'OK' && questao && (
          <div
            className="mt-6 p-4 rounded-xl animate-fade-in"
            style={{
              background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
              border: isFisica ? '1px solid var(--border-fisica)' : '1px solid var(--border-matematica)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: corPrimaria }}>Dica:</strong> Responda em menos de 30 segundos para ganhar bônus de velocidade!
              {limite && limite.limite_semanal !== null && (
                <span className="block mt-1" style={{ color: 'var(--text-muted)' }}>
                  Questões desta semana: {limite.questoes_semana}/{limite.limite_semanal}
                </span>
              )}
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav componente={componente} />
    </div>
  )
}
