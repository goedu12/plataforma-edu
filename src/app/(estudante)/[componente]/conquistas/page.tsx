'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Medal,
  Lock,
  CheckCircle2,
  RefreshCw,
  WifiOff,
  Target,
  Trophy,
  Flame,
  Star
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Conquista, DificuldadeConquista } from '@/types'

interface ConquistaComStatus extends Conquista {
  desbloqueada: boolean
  desbloqueada_em?: string
}

// Cores e labels por dificuldade
const DIFICULDADE_CONFIG: Record<DificuldadeConquista, { label: string; cor: string; bg: string }> = {
  facil: { label: 'Fácil', cor: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  medio: { label: 'Médio', cor: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  dificil: { label: 'Difícil', cor: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  muito_dificil: { label: 'Muito Difícil', cor: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  lendario: { label: 'Lendário', cor: '#eab308', bg: 'rgba(234, 179, 8, 0.2)' },
}

export default function ConquistasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [conquistas, setConquistas] = useState<ConquistaComStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, desbloqueadas: 0 })

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const nomeComponente = isFisica ? 'Física' : 'Matemática'

  const buscarConquistas = async () => {
    setLoading(true)
    setErro(null)

    try {
      const response = await fetch(`/api/conquistas?componente=${componente}`)
      const data = await response.json()

      if (data.sucesso) {
        setConquistas(data.conquistas)
        setStats({ total: data.total, desbloqueadas: data.desbloqueadas })
      } else {
        setErro(data.erro || 'Erro ao carregar conquistas')
      }
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error)
      setErro('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarConquistas()
  }, [componente, router])

  if (loading) return <Loading fullScreen componente={componente} />

  const porcentagem = stats.total > 0 ? Math.round((stats.desbloqueadas / stats.total) * 100) : 0

  // Formatar requisitos para exibição
  const formatarRequisitos = (conquista: ConquistaComStatus) => {
    if (conquista.requisito_tipo === 'combinado') {
      const partes: string[] = []
      if (conquista.req_pontos) partes.push(`${conquista.req_pontos} pts`)
      if (conquista.req_questoes_corretas) partes.push(`${conquista.req_questoes_corretas} acertos`)
      if (conquista.req_sequencia_dias) partes.push(`${conquista.req_sequencia_dias} dias`)
      return partes.join(' + ')
    }

    switch (conquista.requisito_tipo) {
      case 'pontos': return `${conquista.requisito_valor} pontos`
      case 'questoes': return `${conquista.requisito_valor} questões`
      case 'sequencia': return `${conquista.requisito_valor} dias consecutivos`
      case 'acertos': return `${conquista.requisito_valor}% de acerto`
      default: return ''
    }
  }

  const config = (dif: DificuldadeConquista) => DIFICULDADE_CONFIG[dif] || DIFICULDADE_CONFIG.facil

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* Header */}
      <header
        className="px-4 pt-3 pb-12"
        style={{ background: corPrimaria }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-3 -ml-1 rounded-lg transition-colors touch-target"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1
                className="font-display font-semibold flex items-center gap-2"
                style={{ color: isFisica ? '#000' : '#fff' }}
              >
                <Trophy className="w-5 h-5" />
                10 Níveis
              </h1>
            </div>
            <button
              onClick={buscarConquistas}
              className="p-3 rounded-lg transition-colors touch-target"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-sm font-medium"
                style={{ color: isFisica ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }}
              >
                {stats.desbloqueadas}/{stats.total} conquistas
              </span>
              <span
                className="text-lg font-bold"
                style={{ color: isFisica ? '#000' : '#fff' }}
              >
                {porcentagem}%
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.3)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${porcentagem}%`,
                  background: isFisica ? '#000' : '#fff',
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 -mt-6 pb-6">
        {erro ? (
          <div
            className="card p-8 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'rgba(239, 68, 68, 0.15)' }}
            >
              <WifiOff className="w-8 h-8" style={{ color: 'var(--error)' }} />
            </div>
            <h2 className="font-display text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              Erro ao carregar conquistas
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={buscarConquistas} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Tentar Novamente
            </Button>
          </div>
        ) : conquistas.length === 0 ? (
          <div
            className="card p-8 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <Medal className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h2 className="font-display text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              Nenhuma conquista cadastrada
            </h2>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Ainda não há conquistas disponíveis para {nomeComponente}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conquistas.map((conquista, index) => {
              const dificuldadeConfig = config(conquista.dificuldade)
              const isDesbloqueada = conquista.desbloqueada

              return (
                <div
                  key={conquista.id}
                  className="card p-4 animate-fade-in-up"
                  style={{
                    background: 'var(--bg-surface)',
                    border: isDesbloqueada
                      ? `2px solid ${dificuldadeConfig.cor}`
                      : '1px solid var(--border-default)',
                    opacity: isDesbloqueada ? 1 : 0.7,
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Ícone/Nível */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{
                        background: isDesbloqueada ? dificuldadeConfig.bg : 'var(--bg-elevated)',
                        border: isDesbloqueada ? 'none' : '2px dashed var(--border-default)',
                      }}
                    >
                      {isDesbloqueada ? (
                        conquista.icone
                      ) : (
                        <Lock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: dificuldadeConfig.bg,
                            color: dificuldadeConfig.cor,
                          }}
                        >
                          {conquista.ordem}º • {dificuldadeConfig.label}
                        </span>
                        {isDesbloqueada && (
                          <CheckCircle2
                            className="w-4 h-4"
                            style={{ color: 'var(--success)' }}
                          />
                        )}
                      </div>

                      <h3
                        className="font-semibold mb-1"
                        style={{ color: isDesbloqueada ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      >
                        {conquista.nome}
                      </h3>

                      {/* Requisitos */}
                      <div
                        className="text-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {conquista.requisito_tipo === 'combinado' ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {conquista.req_pontos && (
                              <span
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--bg-elevated)' }}
                              >
                                <Star className="w-3 h-3" />
                                {conquista.req_pontos} pts
                              </span>
                            )}
                            {conquista.req_questoes_corretas && (
                              <span
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--bg-elevated)' }}
                              >
                                <Target className="w-3 h-3" />
                                {conquista.req_questoes_corretas} acertos
                              </span>
                            )}
                            {conquista.req_sequencia_dias && (
                              <span
                                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                style={{ background: 'var(--bg-elevated)' }}
                              >
                                <Flame className="w-3 h-3" />
                                {conquista.req_sequencia_dias} dias
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>{formatarRequisitos(conquista)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Dica */}
            <div
              className="p-4 rounded-xl mt-4"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                border: isFisica ? '1px solid var(--border-fisica)' : '1px solid var(--border-matematica)',
              }}
            >
              <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                Como conquistar?
              </p>
              <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                <li>• <strong>Fáceis:</strong> Requisito único (questões, pontos ou dias)</li>
                <li>• <strong>Médias+:</strong> Requisitos combinados (todos devem ser atingidos)</li>
                <li>• <strong>Lendário:</strong> O maior desafio do ano letivo!</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
