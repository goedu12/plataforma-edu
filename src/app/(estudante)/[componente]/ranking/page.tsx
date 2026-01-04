'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trophy, RefreshCw, WifiOff, Crown, Star, Users } from 'lucide-react'
import RankingTable from '@/components/RankingTable'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BottomNav from '@/components/BottomNav'
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
    <div className="min-h-screen pb-nav" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          {/* Nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-3 rounded-xl transition-all touch-target"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: corPrimaria }} />
              <span className="font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
                Ranking
              </span>
            </div>

            <button
              onClick={() => buscarDados(true)}
              disabled={atualizando}
              className="p-3 rounded-xl transition-all touch-target"
              style={{ color: 'var(--text-secondary)' }}
            >
              <RefreshCw className={`w-5 h-5 ${atualizando ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Badge Turma */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <Users className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Turma {usuario.turma} • {nomeComponente}
              </span>
            </div>
          </div>

          {/* Posição do usuário */}
          {posicaoUsuario > 0 && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${isFisica ? 'var(--border-fisica)' : 'var(--border-matematica)'}`,
              }}
            >
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Sua Posição
              </p>
              <div className="flex items-center justify-center gap-4">
                {posicaoUsuario <= 3 ? (
                  <Crown
                    className="w-10 h-10"
                    style={{
                      color: posicaoUsuario === 1 ? '#FFD700'
                        : posicaoUsuario === 2 ? '#C0C0C0'
                        : '#CD7F32',
                    }}
                  />
                ) : (
                  <Star className="w-10 h-10" style={{ color: corPrimaria }} />
                )}
                <span
                  className="font-display text-5xl font-bold tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {posicaoUsuario}º
                </span>
              </div>
              <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
                de {ranking.length} estudantes
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4">
        {erro ? (
          <div
            className="card p-8 text-center"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'rgba(239, 68, 68, 0.15)' }}
            >
              <WifiOff className="w-8 h-8" style={{ color: 'var(--error)' }} />
            </div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {erro}
            </p>
            <Button
              variant={isFisica ? 'fisica' : 'matematica'}
              onClick={() => buscarDados()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <>
            {/* Dica */}
            <div
              className="p-4 rounded-xl mb-6"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                border: isFisica ? '1px solid var(--border-fisica)' : '1px solid var(--border-matematica)',
              }}
            >
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: corPrimaria }}>Dica:</strong> Responda questões corretamente para subir no ranking!
              </p>
            </div>

            <RankingTable
              ranking={ranking}
              componente={componente}
              usuarioAtualId={usuario.id}
            />
          </>
        )}
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
