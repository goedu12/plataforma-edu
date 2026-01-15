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

      {/* Header com cor - Compacto */}
      <header className="header-chromebook lg:py-2" style={{ background: corPrimaria, borderColor: 'transparent' }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2 lg:mb-1.5">
            <BackButton href={`/${componente}/menu`} mobileOnly />

            <div className="text-center">
              <h1 className="flex items-center justify-center gap-1.5">
                <Trophy className="w-4 h-4 lg:w-3.5 lg:h-3.5" style={{ color: isFisica ? '#000' : '#fff' }} aria-hidden="true" />
                <span
                  className="font-display text-base lg:text-sm font-bold"
                  style={{ color: isFisica ? '#000' : '#fff' }}
                >
                  Ranking
                </span>
              </h1>
              <p className="text-2xs mt-0.5" style={{ color: isFisica ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }}>
                Turma {usuario.turma} • {ranking.length} estudantes
              </p>
            </div>

            <button
              onClick={() => buscarDados(true)}
              disabled={atualizando}
              className="w-9 h-9 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-black/20"
              style={{ background: 'rgba(0,0,0,0.1)', color: isFisica ? '#000' : '#fff' }}
              aria-label={atualizando ? 'Atualizando ranking...' : 'Atualizar ranking'}
            >
              <RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>

          {/* Card Posição do Usuário - Compacto */}
          {posicaoUsuario > 0 && (
            <div
              className="rounded-lg p-3 lg:p-2.5 flex items-center justify-between"
              style={{ background: 'rgba(0,0,0,0.15)' }}
            >
              <div className="flex items-center gap-2">
                {posicaoUsuario <= 3 ? (
                  <Crown
                    className="w-6 h-6 lg:w-5 lg:h-5"
                    style={{
                      color: posicaoUsuario === 1 ? '#FFD700'
                        : posicaoUsuario === 2 ? '#E8E8E8'
                        : '#CD7F32',
                    }}
                  />
                ) : (
                  <Medal className="w-6 h-6 lg:w-5 lg:h-5" style={{ color: isFisica ? '#000' : '#fff' }} />
                )}
                <div>
                  <p className="text-2xs uppercase tracking-wider" style={{ color: isFisica ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}>
                    Posição
                  </p>
                  <p className="font-display text-xl lg:text-lg font-bold tabular-nums" style={{ color: isFisica ? '#000' : '#fff' }}>
                    {posicaoUsuario}º
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xs uppercase tracking-wider" style={{ color: isFisica ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}>
                  Pontos
                </p>
                <p className="font-display text-lg lg:text-base font-bold tabular-nums" style={{ color: isFisica ? '#000' : '#fff' }}>
                  {pontosUsuario}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content - Compacto */}
      <main className="max-w-lg mx-auto px-3 lg:px-4 py-3 lg:py-2">
        {erro ? (
          <div className="card-chromebook text-center py-6">
            <WifiOff className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--error)' }} />
            <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <Button
              variant={isFisica ? 'fisica' : 'matematica'}
              onClick={() => buscarDados()}
              className="btn-chromebook"
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
