'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trophy, RefreshCw, WifiOff, Crown, Star, Users } from 'lucide-react'
import RankingTable from '@/components/RankingTable'
import Loading from '@/components/ui/Loading'
import type { Componente, Usuario, RankingItem } from '@/types'

// Cores Koyeb
const KOYEB = {
  bg: '#0D0D14',
  bgCard: '#1A1A2E',
  bgElevated: '#222238',
  bgDark: '#12121C',
  primary: '#00FF88',
  accent: '#00D4FF',
  fisica: '#00FF88',
  matematica: '#A855F7',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B8B9A',
  textMuted: '#5A5A6E',
  border: 'rgba(255,255,255,0.05)',
  danger: '#FF4757',
  gold: '#FFD700',
}

export default function RankingPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [ranking, setRanking] = useState<RankingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)

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

  const nomeComponente = componente === 'fisica' ? 'Física' : 'Matemática'
  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? KOYEB.fisica : KOYEB.matematica

  if (loading || !usuario) {
    return <Loading fullScreen componente={componente} />
  }

  const posicaoUsuario = ranking.findIndex(r => r.usuario_id === usuario.id) + 1

  return (
    <div
      className="min-h-screen pb-8"
      style={{
        background: `linear-gradient(180deg, ${KOYEB.bg} 0%, ${KOYEB.bgCard} 100%)`,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="max-w-lg mx-auto">
          {/* Nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-2 rounded-lg transition-all hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: KOYEB.textSecondary }} />
            </button>

            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: accentColor }} />
              <span
                className="font-mono text-sm font-bold tracking-wider uppercase"
                style={{ color: KOYEB.textPrimary }}
              >
                Ranking
              </span>
            </div>

            <button
              onClick={() => buscarDados(true)}
              disabled={atualizando}
              className="p-2 rounded-lg transition-all hover:bg-white/10"
            >
              <RefreshCw
                className={`w-5 h-5 ${atualizando ? 'animate-spin' : ''}`}
                style={{ color: KOYEB.textSecondary }}
              />
            </button>
          </div>

          {/* Badge Turma */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
              style={{ background: KOYEB.bgElevated }}
            >
              <Users className="w-4 h-4" style={{ color: KOYEB.textMuted }} />
              <span
                className="font-mono text-xs tracking-wider uppercase"
                style={{ color: KOYEB.textSecondary }}
              >
                Turma {usuario.turma} • {nomeComponente}
              </span>
            </div>
          </div>

          {/* Posição do usuário */}
          {posicaoUsuario > 0 && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{
                background: `linear-gradient(135deg, ${KOYEB.bgCard} 0%, ${isFisica ? 'rgba(0, 255, 136, 0.1)' : 'rgba(168, 85, 247, 0.1)'} 100%)`,
                border: `1px solid ${accentColor}30`,
              }}
            >
              <p
                className="font-mono text-xs tracking-widest uppercase mb-3"
                style={{ color: KOYEB.textMuted }}
              >
                Sua Posição
              </p>
              <div className="flex items-center justify-center gap-4">
                {posicaoUsuario <= 3 ? (
                  <Crown
                    className="w-10 h-10"
                    style={{
                      color: posicaoUsuario === 1
                        ? KOYEB.gold
                        : posicaoUsuario === 2
                        ? '#C0C0C0'
                        : '#CD7F32',
                    }}
                  />
                ) : (
                  <Star className="w-10 h-10" style={{ color: accentColor }} />
                )}
                <span
                  className="font-mono text-5xl font-bold tabular-nums"
                  style={{
                    color: KOYEB.textPrimary,
                    textShadow: `0 0 30px ${accentColor}50`,
                  }}
                >
                  {posicaoUsuario}º
                </span>
              </div>
              <p
                className="font-mono text-sm mt-3"
                style={{ color: KOYEB.textSecondary }}
              >
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
            className="rounded-2xl p-8 text-center"
            style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
          >
            <WifiOff className="w-12 h-12 mx-auto mb-4" style={{ color: KOYEB.danger }} />
            <p className="font-mono text-sm mb-6" style={{ color: KOYEB.textSecondary }}>
              {erro}
            </p>
            <button
              onClick={() => buscarDados()}
              className="flex items-center gap-2 mx-auto px-6 py-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase transition-all hover:translate-y-[-2px]"
              style={{
                background: accentColor,
                color: KOYEB.bg,
                boxShadow: `0 4px 20px ${accentColor}40`,
              }}
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
          </div>
        ) : (
          <>
            {/* Terminal Tip */}
            <div
              className="rounded-xl overflow-hidden mb-6"
              style={{ background: KOYEB.bgElevated }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2"
                style={{ background: KOYEB.bgCard }}
              >
                <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F56' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: '#FFBD2E' }} />
                <span className="w-3 h-3 rounded-full" style={{ background: '#27CA40' }} />
                <span
                  className="ml-2 font-mono text-xs"
                  style={{ color: KOYEB.textMuted }}
                >
                  ranking.sh
                </span>
              </div>
              <div className="px-4 py-3 space-y-1">
                <p className="font-mono text-xs" style={{ color: KOYEB.textMuted }}>
                  # Dica
                </p>
                <p className="font-mono text-xs" style={{ color: KOYEB.textPrimary }}>
                  $ Responda questões corretamente para subir no ranking!
                </p>
              </div>
            </div>

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
