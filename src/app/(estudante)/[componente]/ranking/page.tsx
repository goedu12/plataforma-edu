'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trophy, RefreshCw, WifiOff, Crown, Star, Users } from 'lucide-react'
import RankingTable from '@/components/RankingTable'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Usuario, RankingItem } from '@/types'

export default function RankingPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)

  const isFisica = componente === 'fisica'
  const nomeComponente = isFisica ? 'Física' : 'Matemática'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const buscarDados = async (silencioso = false) => {
    if (!silencioso) setLoading(true)
    else setAtualizando(true)
    setErro(null)

    try {
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
      setErro('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
      setAtualizando(false)
    }
  }

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarDados()
  }, [router, componente])

  if (loading || !usuario) {
    return <Loading fullScreen componente={componente} />
  }

  const posicaoUsuario = ranking.findIndex(r => r.usuario_id === usuario.id) + 1

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* Header Compacto */}
      <header className="px-4 pt-3 pb-3">
        <div className="max-w-lg mx-auto">
          {/* Nav + Turma em uma linha */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-2 rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: corPrimaria }} />
              <span className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Ranking
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}
              >
                {usuario.turma}
              </span>
            </div>

            <button
              onClick={() => buscarDados(true)}
              disabled={atualizando}
              className="p-2 rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Card de posição compacto */}
          {posicaoUsuario > 0 && (
            <div
              className="rounded-xl p-3 flex items-center justify-between"
              style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${isFisica ? 'var(--border-fisica)' : 'var(--border-matematica)'}`,
              }}
            >
              <div className="flex items-center gap-3">
                {posicaoUsuario <= 3 ? (
                  <Crown
                    className="w-6 h-6"
                    style={{
                      color: posicaoUsuario === 1 ? '#FFD700'
                        : posicaoUsuario === 2 ? '#C0C0C0'
                        : '#CD7F32',
                    }}
                  />
                ) : (
                  <Star className="w-6 h-6" style={{ color: corPrimaria }} />
                )}
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sua posição</span>
                  <p className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {posicaoUsuario}º
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>de</span>
                <p className="text-lg font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {ranking.length}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-3 pb-4">
        {erro ? (
          <div
            className="card p-6 text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <WifiOff className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--error)' }} />
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <Button
              variant={isFisica ? 'fisica' : 'matematica'}
              onClick={() => buscarDados()}
              size="sm"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <RankingTable
            ranking={ranking}
            componente={componente}
            usuarioAtualId={usuario.id}
          />
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
