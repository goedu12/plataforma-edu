'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Medal, Lock, CheckCircle2, RefreshCw, WifiOff, Trophy, Target } from 'lucide-react'
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
    <div className="min-h-screen bg-dark-bg pb-8">
      {/* Header */}
      <header className={`${bgColor} text-white px-4 pt-4 pb-16`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-2 -ml-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1 className="text-heading flex items-center gap-2">
                <Medal className="w-5 h-5" />
                Conquistas
              </h1>
              <p className="text-caption text-white/80">
                {nomeComponente} • {stats.desbloqueadas}/{stats.total}
              </p>
            </div>
            <button
              onClick={buscarConquistas}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="text-heading">Progresso</span>
              </div>
              <span className="text-stat-sm">{porcentagem}%</span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${porcentagem}%` }}
              />
            </div>
            <p className="text-caption text-white/80 text-center mt-2">
              {stats.desbloqueadas} de {stats.total} conquistas desbloqueadas
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 -mt-8">
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
              <div className="mb-6">
                <h2 className="flex items-center gap-2 text-label text-text-primary mb-3">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Desbloqueadas ({conquistasDesbloqueadas.length})
                </h2>
                <div className="space-y-3">
                  {conquistasDesbloqueadas.map((conquista, index) => (
                    <Card
                      key={conquista.id}
                      className="flex items-center gap-4 animate-slide-up border-l-4 border-success"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${bgColor}`}>
                        {conquista.icone}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-heading text-text-primary">{conquista.nome}</h3>
                        <p className="text-body-sm text-text-secondary">{conquista.descricao}</p>
                        {conquista.desbloqueada_em && (
                          <p className="text-caption text-success mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Desbloqueada em {new Date(conquista.desbloqueada_em).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Locked */}
            {conquistasBloqueadas.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-label text-text-primary mb-3">
                  <Target className="w-4 h-4 text-text-muted" />
                  A Desbloquear ({conquistasBloqueadas.length})
                </h2>
                <div className="space-y-3">
                  {conquistasBloqueadas.map((conquista, index) => (
                    <Card
                      key={conquista.id}
                      className="flex items-center gap-4 animate-slide-up opacity-75"
                      style={{ animationDelay: `${(conquistasDesbloqueadas.length + index) * 50}ms` }}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-calm-elevated border-2 border-dashed border-calm-border">
                        <Lock className="w-5 h-5 text-text-muted" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-heading text-text-secondary">{conquista.nome}</h3>
                        <p className="text-body-sm text-text-muted">{conquista.descricao}</p>
                        <p className="text-caption text-text-muted mt-1 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Meta: {formatarRequisito(conquista)}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal Tip */}
            <div className="mt-6 animate-fade-in terminal-box">
              <div className="terminal-header">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
                <span className="title">conquistas.sh</span>
              </div>
              <div className="terminal-body">
                <p className="comment"># Dica</p>
                <p className="cmd">$ Responda questões, estude todos os dias e acumule pontos!</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
