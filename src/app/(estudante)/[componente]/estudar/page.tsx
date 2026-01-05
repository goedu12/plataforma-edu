'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, BookOpen, CheckCircle2, WifiOff, RefreshCw, AlertTriangle, Calendar, Zap } from 'lucide-react'
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
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px] flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER COMPACTO
          ═══════════════════════════════════════════════════════════════════ */}
      <header
        className="px-4 py-2 sticky top-0 z-10 flex-shrink-0"
        style={{ background: corPrimaria }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={handleVoltar}
            className="p-2 -ml-2 rounded-lg"
            style={{ color: isFisica ? '#000' : '#fff' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" style={{ color: isFisica ? '#000' : '#fff' }} />
            <span className="font-semibold text-sm" style={{ color: isFisica ? '#000' : '#fff' }}>
              Estudar
            </span>
          </div>

          {/* Indicador de limite semanal compacto */}
          {status === 'OK' && limite && limite.limite_semanal !== null && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(0,0,0,0.2)', color: isFisica ? '#000' : '#fff' }}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="tabular-nums">{limite.questoes_semana}/{limite.limite_semanal}</span>
              {limite.restantes !== null && limite.restantes <= 3 && (
                <span className="text-[10px] opacity-80">
                  ({limite.restantes})
                </span>
              )}
            </div>
          )}

          {/* Espaçador quando não há limite */}
          {!(status === 'OK' && limite && limite.limite_semanal !== null) && (
            <div className="w-9" />
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTEÚDO
          ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-2xl mx-auto px-4 py-4 w-full flex flex-col">
        {status === 'OK' && questao ? (
          <div className="flex-1 flex flex-col animate-fade-in-up">
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
          /* ═══════════════════════════════════════════════════════════════
             TELA DE STATUS (Erro, Limite, Completou, etc)
             ═══════════════════════════════════════════════════════════════ */
          <div
            className="rounded-2xl p-6 text-center animate-fade-in-up"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            {/* Ícone */}
            <div
              className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: status === 'LIMITE_SEMANAL' ? 'rgba(245, 158, 11, 0.15)'
                  : status === 'ERRO' ? 'rgba(239, 68, 68, 0.15)'
                  : status === 'COMPLETOU' ? isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)'
                  : 'var(--bg-elevated)',
                border: status === 'LIMITE_SEMANAL' ? '1px solid rgba(245, 158, 11, 0.3)'
                  : status === 'ERRO' ? '1px solid rgba(239, 68, 68, 0.3)'
                  : status === 'COMPLETOU' ? `1px solid ${corPrimaria}`
                  : '1px solid var(--border-default)',
              }}
            >
              {status === 'LIMITE_SEMANAL' && <AlertTriangle className="w-7 h-7" style={{ color: 'var(--warning)' }} />}
              {status === 'FORA_PERIODO' && <Calendar className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />}
              {status === 'COMPLETOU' && <CheckCircle2 className="w-7 h-7" style={{ color: corPrimaria }} />}
              {status === 'ERRO' && <WifiOff className="w-7 h-7" style={{ color: 'var(--error)' }} />}
              {status === 'SEM_QUESTOES' && <BookOpen className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />}
            </div>

            {/* Título */}
            <h2
              className="text-lg font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {status === 'LIMITE_SEMANAL' && 'Limite Semanal Atingido'}
              {status === 'FORA_PERIODO' && 'Fora do Período Letivo'}
              {status === 'COMPLETOU' && 'Parabéns!'}
              {status === 'ERRO' && 'Ops! Erro'}
              {status === 'SEM_QUESTOES' && 'Sem Questões'}
            </h2>

            {/* Descrição */}
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              {status === 'LIMITE_SEMANAL' && `Você respondeu ${limite?.questoes_semana || 15} questões esta semana!`}
              {status === 'FORA_PERIODO' && 'Período letivo não iniciado ou em férias.'}
              {status === 'COMPLETOU' && `Você completou todas as questões de ${nomeComponente}!`}
              {status === 'ERRO' && erro}
              {status === 'SEM_QUESTOES' && `Ainda não há questões de ${nomeComponente} para seu ano.`}
            </p>

            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              {status === 'LIMITE_SEMANAL' && 'Volte na segunda ou use o modo Desafio!'}
              {status === 'FORA_PERIODO' && 'Use o modo Desafio para praticar!'}
              {status === 'COMPLETOU' && 'Continue com o tutor IA!'}
              {status === 'ERRO' && 'Tente novamente ou volte mais tarde.'}
              {status === 'SEM_QUESTOES' && 'Tire dúvidas com o tutor IA!'}
            </p>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {(status === 'LIMITE_SEMANAL' || status === 'FORA_PERIODO') && (
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/${componente}/desafio`)}
                  leftIcon={<Zap className="w-4 h-4" />}
                  className="min-h-[48px]"
                >
                  Modo Desafio
                </Button>
              )}
              {(status === 'COMPLETOU' || status === 'SEM_QUESTOES') && (
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/${componente}/tutor`)}
                  className="min-h-[48px]"
                >
                  Tutor IA
                </Button>
              )}
              {status === 'ERRO' && (
                <Button
                  variant="secondary"
                  onClick={buscarQuestao}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  className="min-h-[48px]"
                >
                  Tentar Novamente
                </Button>
              )}
              <Button
                variant={isFisica ? 'fisica' : 'matematica'}
                onClick={handleVoltar}
                className="min-h-[48px]"
              >
                Voltar ao Menu
              </Button>
            </div>
          </div>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
