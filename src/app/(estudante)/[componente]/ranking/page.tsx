'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trophy, RefreshCw, WifiOff, Crown, Star, TrendingUp } from 'lucide-react'
import RankingTable from '@/components/RankingTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import type { Componente, Usuario, RankingItem } from '@/types'

export default function RankingPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const buscarDados = async () => {
    setLoading(true)
    setErro(null)

    try {
      // Buscar usuário
      const resUsuario = await fetch('/api/usuario')
      const dataUsuario = await resUsuario.json()

      if (!dataUsuario.sucesso || !dataUsuario.usuario) {
        router.push('/login')
        return
      }

      if (!dataUsuario.usuario.componentes.includes(componente)) {
        router.push('/selecionar')
        return
      }

      setUsuario(dataUsuario.usuario)

      // Buscar ranking
      const resRanking = await fetch(
        `/api/ranking?componente=${componente}&turma=${dataUsuario.usuario.turma}`
      )
      const dataRanking = await resRanking.json()

      if (dataRanking.sucesso) {
        setRanking(dataRanking.ranking)
      } else {
        setErro(dataRanking.erro || 'Erro ao carregar ranking')
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
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

    buscarDados()
  }, [router, componente])

  const nomeComponente = componente === 'fisica' ? 'Física' : 'Matemática'
  const isFisica = componente === 'fisica'
  const bgColor = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'

  if (loading || !usuario) {
    return <Loading fullScreen componente={componente} />
  }

  // Encontrar posição do usuário no ranking
  const posicaoUsuario = ranking.findIndex(r => r.usuario_id === usuario.id) + 1

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
              <h1 className="font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Ranking da Turma
              </h1>
              <p className="text-sm text-white/80">
                {nomeComponente} • Turma {usuario.turma}
              </p>
            </div>
            <button
              onClick={buscarDados}
              className="p-2 rounded-xl hover:bg-white/20 transition-colors"
              title="Atualizar ranking"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* User Position Card */}
          {posicaoUsuario > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-sm text-white/80 mb-1">Sua Posição</p>
              <div className="flex items-center justify-center gap-3">
                {posicaoUsuario <= 3 ? (
                  <Crown className={`w-8 h-8 ${
                    posicaoUsuario === 1 ? 'text-yellow-300' :
                    posicaoUsuario === 2 ? 'text-gray-300' : 'text-amber-400'
                  }`} />
                ) : (
                  <Star className="w-8 h-8 text-white/50" />
                )}
                <span className="text-4xl font-bold">{posicaoUsuario}º</span>
              </div>
              <p className="text-sm text-white/80 mt-1">de {ranking.length} estudantes</p>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 -mt-8">
        {erro ? (
          <Card className="text-center py-10">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-red-500/20 border border-red-500/30">
              <WifiOff className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              Erro ao carregar ranking
            </h2>
            <p className="text-text-secondary mb-6">{erro}</p>
            <Button variant="primary" onClick={buscarDados}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </Card>
        ) : (
          <>
            {/* Dica */}
            <Card className="mb-4 animate-slide-up bg-orange-900/80 border border-orange-500/40 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/20 border border-orange-500/30">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <p className="text-sm text-orange-100/90 flex-1">
                  💡 Responda questões corretamente para subir no ranking!
                </p>
              </div>
            </Card>

            <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
              <RankingTable
                ranking={ranking}
                componente={componente}
                usuarioAtualId={usuario.id}
              />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
