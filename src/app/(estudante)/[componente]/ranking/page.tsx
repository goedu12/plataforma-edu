'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Trophy, RefreshCw, WifiOff, Crown, Medal, TrendingUp, Target } from 'lucide-react'
import RankingTable from '@/components/RankingTable'
import Loading from '@/components/ui/Loading'
import Button from '@/components/ui/Button'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, Usuario, RankingItem } from '@/types'
import { obterNivelPorPontos } from '@/types'

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
  const nivelUsuario = obterNivelPorPontos(pontosUsuario)

  // Meta pessoal: quem está logo acima no ranking
  const pessoaAcima = posicaoUsuario > 1 ? ranking[posicaoUsuario - 2] : null
  const pontosParaSubir = pessoaAcima ? pessoaAcima.pontos - pontosUsuario + 1 : 0
  // Meta de médio prazo: top 3 ou top 5
  const metaPosicao = posicaoUsuario > 5 ? 5 : posicaoUsuario > 3 ? 3 : 1
  const pessoaMeta = ranking[metaPosicao - 1]
  const pontosParaMeta = pessoaMeta && pessoaMeta.usuario_id !== usuario.id ? pessoaMeta.pontos - pontosUsuario + 1 : 0

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* Header */}
      <header className="header-chromebook lg:py-3" style={{ background: corPrimaria, borderColor: 'transparent' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <BackButton href={`/${componente}/menu`} mobileOnly />

            <div className="text-center">
              <h1 className="flex items-center justify-center gap-1.5">
                <Trophy className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }} aria-hidden="true" />
                <span
                  className="font-display text-base lg:text-lg font-bold"
                  style={{ color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }}
                >
                  Ranking
                </span>
              </h1>
              <p className="text-2xs lg:text-xs mt-0.5" style={{ color: isFisica ? 'var(--text-on-fisica-70)' : 'var(--text-on-matematica-70)' }}>
                Turma {usuario.turma} • {ranking.length} estudantes
              </p>
            </div>

            <button
              onClick={() => buscarDados(true)}
              disabled={atualizando}
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:bg-black/20"
              style={{ background: 'rgba(0,0,0,0.1)', color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }}
              aria-label={atualizando ? 'Atualizando ranking...' : 'Atualizar ranking'}
            >
              <RefreshCw className={`w-4 h-4 ${atualizando ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>

          {/* Card Posição do Usuário */}
          {posicaoUsuario > 0 && (
            <div
              className="rounded-lg p-3 lg:p-4 flex items-center justify-between"
              style={{ background: 'rgba(0,0,0,0.15)' }}
            >
              <div className="flex items-center gap-2">
                {posicaoUsuario <= 3 ? (
                  <Crown
                    className="w-6 h-6 lg:w-7 lg:h-7"
                    style={{
                      color: posicaoUsuario === 1 ? 'var(--medal-gold)'
                        : posicaoUsuario === 2 ? 'var(--medal-silver)'
                        : 'var(--medal-bronze)',
                    }}
                  />
                ) : (
                  <Medal className="w-6 h-6 lg:w-7 lg:h-7" style={{ color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }} />
                )}
                <div>
                  <p className="text-2xs lg:text-xs uppercase tracking-wider" style={{ color: isFisica ? 'var(--text-on-fisica-60)' : 'var(--text-on-matematica-60)' }}>
                    Posição
                  </p>
                  <p className="font-display text-xl lg:text-2xl font-bold tabular-nums" style={{ color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }}>
                    {posicaoUsuario}º
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xs lg:text-xs uppercase tracking-wider" style={{ color: isFisica ? 'var(--text-on-fisica-60)' : 'var(--text-on-matematica-60)' }}>
                  Nível
                </p>
                <p className="text-sm lg:text-base font-bold" style={{ color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }}>
                  {nivelUsuario.emoji} {nivelUsuario.nome}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xs lg:text-xs uppercase tracking-wider" style={{ color: isFisica ? 'var(--text-on-fisica-60)' : 'var(--text-on-matematica-60)' }}>
                  Pontos
                </p>
                <p className="font-display text-lg lg:text-xl font-bold tabular-nums" style={{ color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }}>
                  {pontosUsuario}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Meta pessoal — motivação */}
      {posicaoUsuario > 1 && pessoaAcima && (
        <div className="max-w-2xl mx-auto px-3 lg:px-4 pt-3">
          <div
            className="p-3 lg:p-4 rounded-xl space-y-2"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: corPrimaria }} />
              <span className="text-xs lg:text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                Sua meta
              </span>
            </div>

            {/* Próxima posição */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                <span className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Alcançar {posicaoUsuario - 1}º ({pessoaAcima.nome.split(' ')[0]})
                </span>
              </div>
              <span className="text-xs lg:text-sm font-bold tabular-nums" style={{ color: corPrimaria }}>
                +{pontosParaSubir} pts
              </span>
            </div>

            {/* Meta de médio prazo */}
            {pontosParaMeta > 0 && metaPosicao < posicaoUsuario - 1 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
                  <span className="text-xs lg:text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Top {metaPosicao}
                  </span>
                </div>
                <span className="text-xs lg:text-sm font-bold tabular-nums" style={{ color: 'var(--warning)' }}>
                  +{pontosParaMeta} pts
                </span>
              </div>
            )}

            {/* Barra de progresso para próxima posição */}
            <div className="pt-1">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(5, Math.min(((pontosUsuario / (pessoaAcima.pontos || 1)) * 100), 100))}%`,
                    background: corPrimaria,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-2xl mx-auto px-3 lg:px-4 py-3 lg:py-4">
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
