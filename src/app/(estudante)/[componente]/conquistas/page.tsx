'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Medal, Lock, CheckCircle2 } from 'lucide-react'
import Card from '@/components/ui/Card'
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
  const [stats, setStats] = useState({ total: 0, desbloqueadas: 0 })

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    const buscarConquistas = async () => {
      try {
        const response = await fetch(`/api/conquistas?componente=${componente}`)
        const data = await response.json()

        if (data.sucesso) {
          setConquistas(data.conquistas)
          setStats({ total: data.total, desbloqueadas: data.desbloqueadas })
        }
      } catch (error) {
        console.error('Erro ao buscar conquistas:', error)
      } finally {
        setLoading(false)
      }
    }

    buscarConquistas()
  }, [componente, router])

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  const porcentagem = stats.total > 0 ? Math.round((stats.desbloqueadas / stats.total) * 100) : 0

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
              {stats.desbloqueadas}/{stats.total} ({porcentagem}%)
            </p>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto p-4">
        <div className="grid gap-4">
          {conquistas.map((conquista, index) => (
            <Card
              key={conquista.id}
              className={`flex items-center gap-4 animate-slide-up ${
                !conquista.desbloqueada ? 'opacity-60' : ''
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                  conquista.desbloqueada
                    ? componente === 'fisica'
                      ? 'bg-fisica-100'
                      : 'bg-matematica-100'
                    : 'bg-gray-100'
                }`}
              >
                {conquista.desbloqueada ? conquista.icone : <Lock className="w-6 h-6 text-gray-400" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800">{conquista.nome}</h3>
                  {conquista.desbloqueada && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-gray-500">{conquista.descricao}</p>
                {conquista.desbloqueada && conquista.desbloqueada_em && (
                  <p className="text-xs text-gray-400 mt-1">
                    Desbloqueada em{' '}
                    {new Date(conquista.desbloqueada_em).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>

        {conquistas.length === 0 && (
          <Card className="text-center py-8">
            <Medal className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Nenhuma conquista disponível
            </h2>
            <p className="text-gray-600">
              Continue estudando para desbloquear conquistas!
            </p>
          </Card>
        )}
      </main>
    </div>
  )
}
