'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Medal, Lock, CheckCircle2, RefreshCw, WifiOff, Target } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import type { Componente, Conquista } from '@/types'

interface ConquistaComStatus extends Conquista {
  desbloqueada: boolean
  desbloqueada_em?: string
}

export default function ConquistasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [conquistas, setConquistas] = useState<ConquistaComStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, desbloqueadas: 0 })

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

  const nomeComponente = componente === 'fisica' ? 'Física' : 'Matemática'
  const isFisica = componente === 'fisica'
  const bgColor = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  const porcentagem = stats.total > 0 ? Math.round((stats.desbloqueadas / stats.total) * 100) : 0
  const conquistasDesbloqueadas = conquistas.filter(c => c.desbloqueada)
  const conquistasBloqueadas = conquistas.filter(c => !c.desbloqueada)

  const formatarRequisito = (conquista: ConquistaComStatus) => {
    switch (conquista.requisito_tipo) {
      case 'pontos': return `${conquista.requisito_valor} pontos`
      case 'questoes': return `${conquista.requisito_valor} questões respondidas`
      case 'sequencia': return `${conquista.requisito_valor} dias consecutivos`
      case 'acertos': return `${conquista.requisito_valor}% de acerto`
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-6">
      {/* Header Compacto */}
      <header className={`${bgColor} text-white px-4 pt-3 pb-12`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-1.5 -ml-1 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <h1 className="text-body font-semibold flex items-center gap-1.5">
                <Medal className="w-4 h-4" />
                Conquistas
              </h1>
            </div>
            <button
              onClick={buscarConquistas}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Compacto */}
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-caption font-medium">{stats.desbloqueadas}/{stats.total}</span>
              <span className="text-body font-bold">{porcentagem}%</span>
            </div>
            <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${porcentagem}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 -mt-6">
        {erro ? (
          <Card className="text-center py-10">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-500/20 border border-red-500/30">
              <WifiOff className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-subtitle text-text-primary mb-2">
              Erro ao carregar conquistas
            </h2>
            <p className="text-body text-text-secondary mb-6">{erro}</p>
            <Button variant="primary" onClick={buscarConquistas}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </Card>
        ) : conquistas.length === 0 ? (
          <Card className="text-center py-10">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-calm-elevated">
              <Medal className="w-8 h-8 text-text-muted" />
            </div>
            <h2 className="text-subtitle text-text-primary mb-2">
              Nenhuma conquista cadastrada
            </h2>
            <p className="text-body text-text-secondary mb-2">
              Ainda não há conquistas disponíveis para {nomeComponente}.
            </p>
            <p className="text-caption text-text-muted">
              Continue estudando! Em breve novas conquistas serão adicionadas.
            </p>
          </Card>
        ) : (
          <>
            {/* Unlocked */}
            {conquistasDesbloqueadas.length > 0 && (
              <div className="mb-4">
                <h2 className="flex items-center gap-2 text-label text-text-primary mb-2">
                  <CheckCircle2 className="w-3 h-3 text-success" />
                  Desbloqueadas ({conquistasDesbloqueadas.length})
                </h2>
                <div className="space-y-2">
                  {conquistasDesbloqueadas.map((conquista, index) => (
                    <Card
                      key={conquista.id}
                      className="flex items-center gap-3 p-3 animate-slide-up border-l-2 border-success"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm ${bgColor}`}>
                        {conquista.icone}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-body font-semibold text-text-primary truncate">{conquista.nome}</h3>
                        <p className="text-caption text-text-secondary truncate">{conquista.descricao}</p>
                      </div>
                      {conquista.desbloqueada_em && (
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Locked */}
            {conquistasBloqueadas.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-label text-text-primary mb-2">
                  <Target className="w-3 h-3 text-text-muted" />
                  A Desbloquear ({conquistasBloqueadas.length})
                </h2>
                <div className="space-y-2">
                  {conquistasBloqueadas.map((conquista, index) => (
                    <Card
                      key={conquista.id}
                      className="flex items-center gap-3 p-3 animate-slide-up opacity-60"
                      style={{ animationDelay: `${(conquistasDesbloqueadas.length + index) * 50}ms` }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-calm-elevated border border-dashed border-calm-border">
                        <Lock className="w-4 h-4 text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-body font-medium text-text-secondary truncate">{conquista.nome}</h3>
                        <p className="text-caption text-text-muted truncate">
                          {formatarRequisito(conquista)}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Dica compacta */}
            <div className="mt-4 p-3 rounded-lg bg-koyeb-card border border-primary/10 animate-fade-in">
              <p className="text-caption text-text-secondary">
                💡 Responda questões e estude diariamente para desbloquear!
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
