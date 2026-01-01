'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Medal, Lock, CheckCircle2, RefreshCw, WifiOff, Trophy, Target } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push(`/${componente}/menu`)}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="font-semibold text-gray-800 flex items-center gap-2">
              <Medal className="w-5 h-5" />
              Conquistas
            </h1>
            <p className="text-xs text-gray-500">
              {nomeComponente} • {stats.desbloqueadas}/{stats.total}
            </p>
          </div>
          <button
            onClick={buscarConquistas}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            title="Atualizar conquistas"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto p-4">
        {erro ? (
          <Card className="text-center py-8">
            <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Erro ao carregar conquistas 😕
            </h2>
            <p className="text-gray-600 mb-6">{erro}</p>
            <Button componente={componente} onClick={buscarConquistas}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </Card>
        ) : conquistas.length === 0 ? (
          <Card className="text-center py-8">
            <Medal className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Nenhuma conquista cadastrada 📭
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
            {/* Progresso Geral */}
            <Card className="mb-6">
              <div className="flex items-center gap-4 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  componente === 'fisica' ? 'bg-fisica-100' : 'bg-matematica-100'
                }`}>
                  <Trophy className={`w-6 h-6 ${
                    componente === 'fisica' ? 'text-fisica-600' : 'text-matematica-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">Seu Progresso em {nomeComponente}</h3>
                  <p className="text-sm text-gray-500">
                    {stats.desbloqueadas} de {stats.total} conquistas desbloqueadas
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-bold ${
                    componente === 'fisica' ? 'text-fisica-600' : 'text-matematica-600'
                  }`}>
                    {porcentagem}%
                  </span>
                </div>
              </div>
              <ProgressBar value={stats.desbloqueadas} max={stats.total} componente={componente} />
            </Card>

            {/* Conquistas Desbloqueadas */}
            {conquistasDesbloqueadas.length > 0 && (
              <div className="mb-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Desbloqueadas ({conquistasDesbloqueadas.length})
                </h2>
                <div className="grid gap-3">
                  {conquistasDesbloqueadas.map((conquista, index) => (
                    <Card
                      key={conquista.id}
                      className="flex items-center gap-4 animate-slide-up border-l-4 border-green-500"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        componente === 'fisica' ? 'bg-fisica-100' : 'bg-matematica-100'
                      }`}>
                        {conquista.icone}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{conquista.nome}</h3>
                        <p className="text-sm text-gray-500">{conquista.descricao}</p>
                        {conquista.desbloqueada_em && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Desbloqueada em {new Date(conquista.desbloqueada_em).toLocaleDateString('pt-BR')}
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
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-3">
                  <Target className="w-5 h-5 text-gray-400" />
                  A Desbloquear ({conquistasBloqueadas.length})
                </h2>
                <div className="grid gap-3">
                  {conquistasBloqueadas.map((conquista, index) => (
                    <Card
                      key={conquista.id}
                      className="flex items-center gap-4 animate-slide-up opacity-75"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-700">{conquista.nome}</h3>
                        <p className="text-sm text-gray-500">{conquista.descricao}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          🎯 Meta: {formatarRequisito(conquista)}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Dica */}
            <Card className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100">
              <p className="text-sm text-gray-600 text-center">
                💡 <strong>Dica:</strong> Responda questões corretamente, estude todos os dias
                e acumule pontos para desbloquear novas conquistas!
              </p>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
