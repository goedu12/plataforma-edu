'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Trophy,
  Medal,
  Crown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Star,
  TrendingUp,
  Users
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BackButton from '@/components/ui/BackButton'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente } from '@/types'

interface RankingEntry {
  posicao: number
  usuario_id: string
  nome: string
  turma: string
  pontos_semana: number
  questoes_corretas: number
  tempo_total_segundos: number
  avatar?: string
  isCurrentUser?: boolean
}

export default function RankingTrilhasPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [posicaoUsuario, setPosicaoUsuario] = useState<RankingEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [semana, setSemana] = useState<number>(0)
  const [semanaAtual, setSemanaAtual] = useState<number>(0)
  const [totalParticipantes, setTotalParticipantes] = useState(0)
  const [serie, setSerie] = useState<string>('1EM')

  const isFisica = componente === 'fisica'
  const corPrimaria = '#9C27B0' // Cor da trilha desafio (roxo)
  const corAccent = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    carregarDados()
  }, [router, componente])

  const carregarDados = async (semanaEspecifica?: number) => {
    setLoading(true)
    try {
      // Buscar série do usuário
      const userRes = await fetch('/api/usuario')
      const userData = await userRes.json()

      if (!userData.sucesso) {
        router.push('/login')
        return
      }

      const anoUsuario = userData.usuario.ano
      const nivelUsuario = userData.usuario.nivel || (anoUsuario >= 6 && anoUsuario <= 9 ? 'EF' : 'EM')
      const userSerie = nivelUsuario === 'EF' ? `${anoUsuario}EF` : `${anoUsuario}EM`
      setSerie(userSerie)

      // Buscar ranking
      let url = `/api/trilhas/ranking?serie=${userSerie}&limite=50`
      if (semanaEspecifica) {
        url += `&semana=${semanaEspecifica}`
      }

      const res = await fetch(url)
      const data = await res.json()

      if (data.sucesso) {
        setRanking(data.ranking || [])
        setPosicaoUsuario(data.posicaoUsuario || null)
        setSemana(data.semana)
        setSemanaAtual(data.semanaAtual)
        setTotalParticipantes(data.totalParticipantes || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  const mudarSemana = (delta: number) => {
    const novaSemana = semana + delta
    if (novaSemana >= 1 && novaSemana <= semanaAtual) {
      carregarDados(novaSemana)
    }
  }

  const formatarTempo = (segundos: number): string => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    if (horas > 0) {
      return `${horas}h ${minutos}m`
    }
    return `${minutos}m`
  }

  const getPodiumStyle = (posicao: number) => {
    switch (posicao) {
      case 1:
        return { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', color: '#000', icon: <Crown className="w-5 h-5" /> }
      case 2:
        return { bg: 'linear-gradient(135deg, #C0C0C0 0%, #A0A0A0 100%)', color: '#000', icon: <Medal className="w-5 h-5" /> }
      case 3:
        return { bg: 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)', color: '#fff', icon: <Medal className="w-5 h-5" /> }
      default:
        return { bg: 'var(--bg-elevated)', color: 'var(--text-primary)', icon: null }
    }
  }

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  return (
    <div
      className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]"
      style={{ background: 'var(--bg-base)' }}
    >
      <NavigationRail componente={componente} />

      {/* Header */}
      <header className="header-chromebook lg:py-2">
        <div className="max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <BackButton href={`/${componente}/trilhas`} compactOnDesktop />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5" style={{ color: 'var(--warning)' }} />
                <h1 className="text-lg lg:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Ranking Semanal
                </h1>
              </div>
              <p className="text-xs lg:text-sm" style={{ color: 'var(--text-muted)' }}>
                Trilha Desafio Total
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-3 lg:px-4 py-2 lg:py-3">
        {/* Navegação de Semana */}
        <div
          className="flex items-center justify-between p-3 rounded-xl mb-4"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <button
            onClick={() => mudarSemana(-1)}
            disabled={semana <= 1}
            className="p-2 rounded-lg disabled:opacity-30"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <ChevronLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>

          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Semana {semana}
              {semana === semanaAtual && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--success)20', color: 'var(--success)' }}>
                  Atual
                </span>
              )}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {totalParticipantes} participantes
            </p>
          </div>

          <button
            onClick={() => mudarSemana(1)}
            disabled={semana >= semanaAtual}
            className="p-2 rounded-lg disabled:opacity-30"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        {/* Pódio - Top 3 */}
        {ranking.length >= 3 && (
          <div className="flex items-end justify-center gap-2 mb-6">
            {/* 2º Lugar */}
            <div className="flex flex-col items-center w-24">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-2 text-xl font-bold"
                style={{ background: getPodiumStyle(2).bg, color: getPodiumStyle(2).color }}
              >
                {ranking[1]?.avatar ? (
                  <img src={ranking[1].avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  ranking[1]?.nome.charAt(0)
                )}
              </div>
              <div
                className="w-full py-2 rounded-t-lg text-center"
                style={{ background: getPodiumStyle(2).bg }}
              >
                <p className="text-2xl font-bold" style={{ color: getPodiumStyle(2).color }}>2</p>
              </div>
              <div className="w-full h-16 rounded-b-lg" style={{ background: '#A0A0A0' }} />
              <p className="text-xs font-medium mt-1 truncate w-full text-center" style={{ color: 'var(--text-primary)' }}>
                {ranking[1]?.nome.split(' ')[0]}
              </p>
              <p className="text-xs" style={{ color: corPrimaria }}>{ranking[1]?.pontos_semana}pts</p>
            </div>

            {/* 1º Lugar */}
            <div className="flex flex-col items-center w-28">
              <Crown className="w-8 h-8 mb-1" style={{ color: '#FFD700' }} />
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-2 text-2xl font-bold"
                style={{ background: getPodiumStyle(1).bg, color: getPodiumStyle(1).color }}
              >
                {ranking[0]?.avatar ? (
                  <img src={ranking[0].avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  ranking[0]?.nome.charAt(0)
                )}
              </div>
              <div
                className="w-full py-2 rounded-t-lg text-center"
                style={{ background: getPodiumStyle(1).bg }}
              >
                <p className="text-3xl font-bold" style={{ color: getPodiumStyle(1).color }}>1</p>
              </div>
              <div className="w-full h-24 rounded-b-lg" style={{ background: '#FFA500' }} />
              <p className="text-sm font-semibold mt-1 truncate w-full text-center" style={{ color: 'var(--text-primary)' }}>
                {ranking[0]?.nome.split(' ')[0]}
              </p>
              <p className="text-sm font-bold" style={{ color: corPrimaria }}>{ranking[0]?.pontos_semana}pts</p>
            </div>

            {/* 3º Lugar */}
            <div className="flex flex-col items-center w-24">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-2 text-xl font-bold"
                style={{ background: getPodiumStyle(3).bg, color: getPodiumStyle(3).color }}
              >
                {ranking[2]?.avatar ? (
                  <img src={ranking[2].avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  ranking[2]?.nome.charAt(0)
                )}
              </div>
              <div
                className="w-full py-2 rounded-t-lg text-center"
                style={{ background: getPodiumStyle(3).bg }}
              >
                <p className="text-2xl font-bold" style={{ color: getPodiumStyle(3).color }}>3</p>
              </div>
              <div className="w-full h-12 rounded-b-lg" style={{ background: '#8B4513' }} />
              <p className="text-xs font-medium mt-1 truncate w-full text-center" style={{ color: 'var(--text-primary)' }}>
                {ranking[2]?.nome.split(' ')[0]}
              </p>
              <p className="text-xs" style={{ color: corPrimaria }}>{ranking[2]?.pontos_semana}pts</p>
            </div>
          </div>
        )}

        {/* Posição do Usuário (se não estiver no top) */}
        {posicaoUsuario && !ranking.find(r => r.isCurrentUser) && (
          <div
            className="p-3 rounded-xl mb-4"
            style={{
              background: `linear-gradient(135deg, ${corAccent}20, ${corAccent}10)`,
              border: `2px solid ${corAccent}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{ background: corAccent, color: isFisica ? '#000' : '#fff' }}
              >
                {posicaoUsuario.posicao}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  Sua Posicao
                </p>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" style={{ color: corPrimaria }} />
                    {posicaoUsuario.pontos_semana}pts
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {posicaoUsuario.questoes_corretas} acertos
                  </span>
                </div>
              </div>
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--success)' }} />
            </div>
          </div>
        )}

        {/* Lista completa */}
        <h2 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
          Classificacao Geral
        </h2>

        <div className="space-y-1.5">
          {ranking.slice(3).map((entry) => {
            const style = getPodiumStyle(entry.posicao)
            const isUser = entry.isCurrentUser

            return (
              <div
                key={entry.usuario_id}
                className="flex items-center gap-3 p-3 rounded-lg transition-all"
                style={{
                  background: isUser
                    ? `linear-gradient(135deg, ${corAccent}15, ${corAccent}05)`
                    : 'var(--bg-surface)',
                  border: isUser
                    ? `1.5px solid ${corAccent}`
                    : '1px solid var(--border-default)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: style.bg, color: style.color }}
                >
                  {entry.posicao}
                </div>

                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                >
                  {entry.avatar ? (
                    <img src={entry.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    entry.nome.charAt(0)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {entry.nome}
                    {isUser && <span className="ml-1 text-xs" style={{ color: corAccent }}>(voce)</span>}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {entry.turma}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-sm" style={{ color: corPrimaria }}>
                    {entry.pontos_semana}pts
                  </p>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-0.5">
                      <Target className="w-3 h-3" />
                      {entry.questoes_corretas}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {formatarTempo(entry.tempo_total_segundos)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {ranking.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nenhum participante esta semana
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Seja o primeiro a entrar no ranking!
            </p>
          </div>
        )}

        {/* Legenda */}
        <div
          className="mt-6 p-3 rounded-lg"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Como funciona
          </p>
          <div className="grid grid-cols-2 gap-2 text-2xs" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1.5">
              <Star className="w-3 h-3" style={{ color: corPrimaria }} />
              <span>Pontos por questao</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3" />
              <span>Acertos contam</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Tempo desempata</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3 h-3" style={{ color: 'var(--warning)' }} />
              <span>Reseta toda semana</span>
            </div>
          </div>
        </div>
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
