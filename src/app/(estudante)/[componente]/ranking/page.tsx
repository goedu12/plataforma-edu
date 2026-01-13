'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Trophy, RefreshCw, WifiOff, Crown, Medal } from 'lucide-react'
import RankingTable from '@/components/RankingTable'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BackButton from '@/components/ui/BackButton'
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
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Usar useCallback para estabilizar a referência da função
  const buscarDados = useCallback(async (silencioso = false) => {
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
    } catch {
      setErro('Não foi possível conectar ao servidor.')
    } finally {
      setLoading(false)
      setAtualizando(false)
    }
  }, [componente, router])

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarDados()
  }, [componente, router, buscarDados])

  if (loading || !usuario) {
    return <Loading fullScreen componente={componente} />
  }

  const posicaoUsuario = ranking.findIndex(r => r.usuario_id === usuario.id) + 1
  const pontosUsuario = ranking.find(r => r.usuario_id === usuario.id)?.pontos || 0

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* Header com cor */}
      <header className="compact-mobile-x pt-3 pb-4" style={{ background: corPrimaria }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <BackButton href={`/${componente}/menu`} mobileOnly />

            <div className="text-center">
              <h1 className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" style={{ color: isFisica ? '#000' : '#fff' }} aria-hidden="true" />
                <span
                  className="font-display text-lg font-bold"
                  style={{ color: isFisica ? '#000' : '#fff' }}
                >
                  Ranking
                </span>
              </h1>
              <p className="text-xs mt-0.5" style={{ color: isFisica ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }}>
                Turma {usuario.turma} • {ranking.length} estudantes
              </p>
            </div>

            <button
              onClick={() => buscarDados(true)}
              disabled={atualizando}
              className="w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ background: 'rgba(0,0,0,0.1)', color: isFisica ? '#000' : '#fff' }}
              aria-label={atualizando ? 'Atualizando ranking...' : 'Atualizar ranking'}
            >
              <RefreshCw className={`w-5 h-5 ${atualizando ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>

          {/* Card Posição do Usuário */}
          {posicaoUsuario > 0 && (
            <div
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: 'rgba(0,0,0,0.15)' }}
            >
              <div className="flex items-center gap-3">
                {posicaoUsuario <= 3 ? (
                  <Crown
                    className="w-8 h-8"
                    style={{
                      color: posicaoUsuario === 1 ? '#FFD700'
                        : posicaoUsuario === 2 ? '#E8E8E8'
                        : '#CD7F32',
                    }}
                  />
                ) : (
                  <Medal className="w-8 h-8" style={{ color: isFisica ? '#000' : '#fff' }} />
                )}
                <div>
                  <p className="text-2xs uppercase tracking-wider" style={{ color: isFisica ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}>
                    Sua Posição
                  </p>
                  <p className="font-display text-3xl font-bold tabular-nums" style={{ color: isFisica ? '#000' : '#fff' }}>
                    {posicaoUsuario}º
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xs uppercase tracking-wider" style={{ color: isFisica ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}>
                  Seus Pontos
                </p>
                <p className="font-display text-2xl font-bold tabular-nums" style={{ color: isFisica ? '#000' : '#fff' }}>
                  {pontosUsuario}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        {erro ? (
          <div className="card-standard text-center py-8">
            <WifiOff className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--error)' }} />
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <Button
              variant={isFisica ? 'fisica' : 'matematica'}
              onClick={() => buscarDados()}
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
