'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trophy, RefreshCw, WifiOff } from 'lucide-react'
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

  if (loading || !usuario) {
    return <Loading fullScreen componente={componente} />
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
              <Trophy className="w-5 h-5" />
              Ranking da Turma
            </h1>
            <p className="text-xs text-gray-500">
              {nomeComponente} • Turma {usuario.turma}
            </p>
          </div>
          <button
            onClick={buscarDados}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            title="Atualizar ranking"
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
              Erro ao carregar ranking 😕
            </h2>
            <p className="text-gray-600 mb-6">{erro}</p>
            <Button componente={componente} onClick={buscarDados}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </Card>
        ) : (
          <>
            {/* Explicação */}
            <Card className="mb-4 bg-gradient-to-r from-gray-50 to-gray-100">
              <p className="text-sm text-gray-600 text-center">
                🏆 Veja como você está em relação aos seus colegas de turma em {nomeComponente}!
                <br />
                <span className="text-xs text-gray-500">
                  Responda questões corretamente para subir no ranking.
                </span>
              </p>
            </Card>

            <RankingTable
              ranking={ranking}
              componente={componente}
              usuarioAtualId={usuario.id}
            />
          </>
        )}
      </main>
    </div>
  )
}
