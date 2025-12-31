'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trophy } from 'lucide-react'
import RankingTable from '@/components/RankingTable'
import Loading from '@/components/ui/Loading'
import type { Componente, Usuario, RankingItem } from '@/types'

export default function RankingPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    const buscarDados = async () => {
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
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    buscarDados()
  }, [router, componente])

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
              Ranking
            </h1>
            <p className="text-xs text-gray-500">
              {componente === 'fisica' ? 'Física' : 'Matemática'} • Turma {usuario.turma}
            </p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto p-4">
        <RankingTable
          ranking={ranking}
          componente={componente}
          usuarioAtualId={usuario.id}
        />
      </main>
    </div>
  )
}
