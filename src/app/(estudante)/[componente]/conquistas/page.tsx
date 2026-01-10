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

      {/* Header Compacto */}
      <header className="px-4 pt-2 pb-3" style={{ background: corPrimaria }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-2 -ml-1 rounded-lg transition-colors"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: isFisica ? '#000' : '#fff' }} />
              <span
                className="font-display text-sm font-semibold"
                style={{ color: isFisica ? '#000' : '#fff' }}
              >
                10 Níveis
              </span>
            </div>
            <button
              onClick={buscarConquistas}
              className="p-2 rounded-lg transition-colors"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Compacto */}
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.3)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${porcentagem}%`, background: isFisica ? '#000' : '#fff' }}
              />
            </div>
            <span
              className="text-xs font-bold whitespace-nowrap"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              {stats.desbloqueadas}/{stats.total} ({porcentagem}%)
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-3 py-3">
        {erro ? (
          <div
            className="card p-6 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <WifiOff className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--error)' }} />
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={buscarConquistas} size="sm" leftIcon={<RefreshCw className="w-4 h-4" />}>
              Tentar Novamente
            </Button>
          </div>
        ) : conquistas.length === 0 ? (
          <div
            className="card p-6 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <Medal className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nenhuma conquista disponível para {nomeComponente}.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conquistas.map((conquista, index) => {
              const dificuldadeConfig = config(conquista.dificuldade)
              const isDesbloqueada = conquista.desbloqueada

              return (
                <div
                  key={conquista.id}
                  className="rounded-xl p-3 animate-fade-in-up"
                  style={{
                    background: 'var(--bg-surface)',
                    border: isDesbloqueada
                      ? `2px solid ${dificuldadeConfig.cor}`
                      : '1px solid var(--border-default)',
                    opacity: isDesbloqueada ? 1 : 0.7,
                    animationDelay: `${index * 30}ms`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Ícone/Nível Compacto */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{
                        background: isDesbloqueada ? dificuldadeConfig.bg : 'var(--bg-elevated)',
                        border: isDesbloqueada ? 'none' : '2px dashed var(--border-default)',
                      }}
                    >
                      {isDesbloqueada ? conquista.icone : <Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: dificuldadeConfig.bg, color: dificuldadeConfig.cor }}
                        >
                          {conquista.ordem}º {dificuldadeConfig.label}
                        </span>
                        {isDesbloqueada && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />}
                      </div>
                      <h3
                        className="text-sm font-semibold truncate"
                        style={{ color: isDesbloqueada ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                      >
                        {conquista.nome}
                      </h3>
                    </div>

                    {/* Requisitos à direita */}
                    <div className="text-right flex-shrink-0">
                      {conquista.requisito_tipo === 'combinado' ? (
                        <div className="flex flex-col gap-0.5">
                          {conquista.req_pontos && (
                            <span className="text-[10px] flex items-center justify-end gap-1" style={{ color: 'var(--text-muted)' }}>
                              <Star className="w-3 h-3" />{conquista.req_pontos}
                            </span>
                          )}
                          {conquista.req_questoes_corretas && (
                            <span className="text-[10px] flex items-center justify-end gap-1" style={{ color: 'var(--text-muted)' }}>
                              <Target className="w-3 h-3" />{conquista.req_questoes_corretas}
                            </span>
                          )}
                          {conquista.req_sequencia_dias && (
                            <span className="text-[10px] flex items-center justify-end gap-1" style={{ color: 'var(--text-muted)' }}>
                              <Flame className="w-3 h-3" />{conquista.req_sequencia_dias}d
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {formatarRequisitos(conquista)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Legenda compacta */}
            <div
              className="flex items-center justify-center gap-4 py-2 text-[10px]"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="flex items-center gap-1"><Star className="w-3 h-3" />Pontos</span>
              <span className="flex items-center gap-1"><Target className="w-3 h-3" />Acertos</span>
              <span className="flex items-center gap-1"><Flame className="w-3 h-3" />Dias</span>
            </div>
          </div>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
