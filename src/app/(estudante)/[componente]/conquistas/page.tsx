'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Medal, Lock, CheckCircle2, RefreshCw, WifiOff, Trophy, Target, Sparkles, Star } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
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
      setErro('Não foi possível conectar ao servidor. Verifique sua conexão.')
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
  const bgGradient = componente === 'fisica'
    ? 'from-fisica-500 to-fisica-600'
    : 'from-matematica-500 to-matematica-600'

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  const porcentagem = stats.total > 0 ? Math.round((stats.desbloqueadas / stats.total) * 100) : 0

  // Agrupar conquistas por tipo
  const conquistasDesbloqueadas = conquistas.filter(c => c.desbloqueada)
  const conquistasBloqueadas = conquistas.filter(c => !c.desbloqueada)

  const formatarRequisito = (conquista: ConquistaComStatus) => {
    switch (conquista.requisito_tipo) {
      case 'pontos':
        return `${conquista.requisito_valor} pontos`
      case 'questoes':
        return `${conquista.requisito_valor} questões respondidas`
      case 'sequencia':
        return `${conquista.requisito_valor} dias consecutivos`
      case 'acertos':
        return `${conquista.requisito_valor}% de acerto`
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-koyeb-bg pb-8">
      {/* Header */}
      <header className={`bg-gradient-to-br ${bgGradient} text-white px-4 pt-4 pb-16 relative overflow-hidden`}>
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20">
          <Medal className="absolute top-8 right-8 w-20 h-20 floating" />
          <Star className="absolute bottom-8 left-12 w-12 h-12 floating-delayed" />
          <Sparkles className="absolute top-16 left-1/4 w-8 h-8 floating" />
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1 className="font-bold uppercase tracking-tight flex items-center gap-2">
                <Medal className="w-5 h-5" />
                Conquistas
              </h1>
              <p className="text-xs text-white/70">
                {nomeComponente} • {stats.desbloqueadas}/{stats.total}
              </p>
            </div>
            <button
              onClick={buscarConquistas}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title="Atualizar conquistas"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Card */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                <span className="font-bold">Progresso</span>
              </div>
              <span className="text-2xl font-black">{porcentagem}%</span>
            </div>
            <div className="h-3 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${porcentagem}%` }}
              />
            </div>
            <p className="text-xs text-white/70 text-center mt-2">
              {stats.desbloqueadas} de {stats.total} conquistas desbloqueadas
            </p>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 -mt-8 relative z-10">
        {erro ? (
          <Card className="text-center py-10">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-100">
              <WifiOff className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-koyeb-dark mb-2 uppercase tracking-tight">
              Erro ao carregar conquistas
            </h2>
            <p className="text-gray-600 mb-6">{erro}</p>
            <Button variant="orange" onClick={buscarConquistas}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </Card>
        ) : conquistas.length === 0 ? (
          <Card className="text-center py-10">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-gray-100">
              <Medal className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-black text-koyeb-dark mb-2 uppercase tracking-tight">
              Nenhuma conquista cadastrada
            </h2>
            <p className="text-gray-600 mb-2">
              Ainda não há conquistas disponíveis para {nomeComponente}.
            </p>
            <p className="text-sm text-gray-500">
              Continue estudando! Em breve novas conquistas serão adicionadas.
            </p>
          </Card>
        ) : (
          <>
            {/* Conquistas Desbloqueadas */}
            {conquistasDesbloqueadas.length > 0 && (
              <div className="mb-6">
                <h2 className="flex items-center gap-2 text-sm font-bold text-koyeb-dark mb-3 uppercase tracking-tight">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Desbloqueadas ({conquistasDesbloqueadas.length})
                </h2>
                <div className="space-y-3">
                  {conquistasDesbloqueadas.map((conquista, index) => (
                    <Card
                      key={conquista.id}
                      className="flex items-center gap-4 animate-slide-up border-l-4 border-green-500"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-gradient-to-br ${bgGradient} shadow-koyeb`}>
                        {conquista.icone}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-koyeb-dark">{conquista.nome}</h3>
                        <p className="text-sm text-gray-500">{conquista.descricao}</p>
                        {conquista.desbloqueada_em && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
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

            {/* Conquistas Bloqueadas */}
            {conquistasBloqueadas.length > 0 && (
              <div>
                <h2 className="flex items-center gap-2 text-sm font-bold text-koyeb-dark mb-3 uppercase tracking-tight">
                  <Target className="w-4 h-4 text-gray-400" />
                  A Desbloquear ({conquistasBloqueadas.length})
                </h2>
                <div className="space-y-3">
                  {conquistasBloqueadas.map((conquista, index) => (
                    <Card
                      key={conquista.id}
                      className="flex items-center gap-4 animate-slide-up opacity-75"
                      style={{ animationDelay: `${(conquistasDesbloqueadas.length + index) * 50}ms` }}
                    >
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300">
                        <Lock className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-700">{conquista.nome}</h3>
                        <p className="text-sm text-gray-500">{conquista.descricao}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Meta: {formatarRequisito(conquista)}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Dica */}
            <Card variant="glass" className="mt-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${bgGradient}`}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm text-gray-600 flex-1">
                  <strong>Dica:</strong> Responda questões corretamente, estude todos os dias e acumule pontos para desbloquear novas conquistas!
                </p>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
