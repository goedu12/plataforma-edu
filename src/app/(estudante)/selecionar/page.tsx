'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Atom, Calculator, ChevronRight, LogOut, Flame, Star, TrendingUp } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import type { Usuario } from '@/types'
import { obterNivelPorPontos } from '@/types'

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
  warning: '#FFB800',
  orange: '#FF6B35',
}

export default function SelecionarComponentePage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const buscarUsuario = async () => {
      try {
        const response = await fetch('/api/usuario')
        const data = await response.json()

        if (data.sucesso && data.usuario) {
          setUsuario(data.usuario)

          if (data.usuario.componentes.length === 1) {
            router.push(`/${data.usuario.componentes[0]}/menu`)
          }
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    buscarUsuario()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading || !usuario) {
    return <Loading fullScreen />
  }

  const primeiroNome = usuario.nome.split(' ')[0]
  const nivelFisica = obterNivelPorPontos(usuario.fis_pontos)
  const nivelMatematica = obterNivelPorPontos(usuario.mat_pontos)

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${KOYEB.bg} 0%, ${KOYEB.bgCard} 100%)`,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        className="px-4 py-4"
        style={{ borderBottom: `1px solid ${KOYEB.border}` }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: KOYEB.orange }}
            >
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h1
                className="font-display font-bold"
                style={{ color: KOYEB.textPrimary }}
              >
                Plataforma EDU
              </h1>
              <span
                className="text-sm"
                style={{ color: KOYEB.textMuted }}
              >
                Turma {usuario.turma}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl transition-all hover:bg-white/10"
            title="Sair"
          >
            <LogOut className="w-5 h-5" style={{ color: KOYEB.textMuted }} />
          </button>
        </div>
      </header>

      {/* Conteudo */}
      <main className="max-w-2xl mx-auto p-4 pt-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2
            className="font-display text-3xl font-bold mb-2"
            style={{ color: KOYEB.textPrimary }}
          >
            Ola, {primeiroNome}!
          </h2>
          <p style={{ color: KOYEB.textSecondary }}>
            O que vamos estudar hoje?
          </p>
        </div>

        {/* Cards de Componentes */}
        <div className="space-y-4">
          {/* Card de Fisica */}
          {usuario.componentes.includes('fisica') && (
            <button
              onClick={() => router.push('/fisica/menu')}
              className="w-full text-left rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px] group"
              style={{
                background: KOYEB.bgCard,
                border: `1px solid ${KOYEB.border}`,
                borderLeft: `3px solid ${KOYEB.fisica}`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: KOYEB.fisica }}
                >
                  <Atom className="w-7 h-7 text-black" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="font-semibold text-lg"
                      style={{ color: KOYEB.textPrimary }}
                    >
                      Fisica
                    </h3>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wide"
                      style={{
                        background: 'rgba(0, 255, 136, 0.15)',
                        color: KOYEB.fisica,
                        border: `1px solid rgba(0, 255, 136, 0.3)`,
                      }}
                    >
                      {nivelFisica.nome}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: KOYEB.textSecondary }}>
                    Tutor: Newton
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ background: KOYEB.bgElevated }}
                >
                  <ChevronRight className="w-5 h-5" style={{ color: KOYEB.textMuted }} />
                </div>
              </div>

              {/* Stats */}
              <div
                className="mt-4 pt-4 grid grid-cols-3 gap-4"
                style={{ borderTop: `1px solid ${KOYEB.border}` }}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4" style={{ color: KOYEB.fisica }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: KOYEB.textPrimary }}
                  >
                    {usuario.fis_pontos}
                  </p>
                  <p
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: KOYEB.textMuted }}
                  >
                    Pontos
                  </p>
                </div>
                <div
                  className="text-center"
                  style={{ borderLeft: `1px solid ${KOYEB.border}`, borderRight: `1px solid ${KOYEB.border}` }}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="w-4 h-4" style={{ color: KOYEB.orange }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: KOYEB.textPrimary }}
                  >
                    {usuario.fis_sequencia_dias}
                  </p>
                  <p
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: KOYEB.textMuted }}
                  >
                    Dias
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4" style={{ color: KOYEB.primary }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: KOYEB.textPrimary }}
                  >
                    {usuario.fis_questoes_total}
                  </p>
                  <p
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: KOYEB.textMuted }}
                  >
                    Questoes
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Card de Matematica */}
          {usuario.componentes.includes('matematica') && (
            <button
              onClick={() => router.push('/matematica/menu')}
              className="w-full text-left rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px] group"
              style={{
                background: KOYEB.bgCard,
                border: `1px solid ${KOYEB.border}`,
                borderLeft: `3px solid ${KOYEB.matematica}`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: KOYEB.matematica }}
                >
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="font-semibold text-lg"
                      style={{ color: KOYEB.textPrimary }}
                    >
                      Matematica
                    </h3>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wide"
                      style={{
                        background: 'rgba(168, 85, 247, 0.15)',
                        color: KOYEB.matematica,
                        border: `1px solid rgba(168, 85, 247, 0.3)`,
                      }}
                    >
                      {nivelMatematica.nome}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: KOYEB.textSecondary }}>
                    Tutor: Pitagoras
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ background: KOYEB.bgElevated }}
                >
                  <ChevronRight className="w-5 h-5" style={{ color: KOYEB.textMuted }} />
                </div>
              </div>

              {/* Stats */}
              <div
                className="mt-4 pt-4 grid grid-cols-3 gap-4"
                style={{ borderTop: `1px solid ${KOYEB.border}` }}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4" style={{ color: KOYEB.matematica }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: KOYEB.textPrimary }}
                  >
                    {usuario.mat_pontos}
                  </p>
                  <p
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: KOYEB.textMuted }}
                  >
                    Pontos
                  </p>
                </div>
                <div
                  className="text-center"
                  style={{ borderLeft: `1px solid ${KOYEB.border}`, borderRight: `1px solid ${KOYEB.border}` }}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="w-4 h-4" style={{ color: KOYEB.orange }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: KOYEB.textPrimary }}
                  >
                    {usuario.mat_sequencia_dias}
                  </p>
                  <p
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: KOYEB.textMuted }}
                  >
                    Dias
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4" style={{ color: KOYEB.primary }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: KOYEB.textPrimary }}
                  >
                    {usuario.mat_questoes_total}
                  </p>
                  <p
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: KOYEB.textMuted }}
                  >
                    Questoes
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Dica */}
        <div className="mt-8">
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{
              background: 'rgba(255, 107, 53, 0.15)',
              border: `1px solid rgba(255, 107, 53, 0.3)`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255, 107, 53, 0.2)' }}
            >
              <Flame className="w-5 h-5" style={{ color: KOYEB.orange }} />
            </div>
            <p className="text-sm" style={{ color: 'rgba(255, 200, 180, 0.9)' }}>
              Estude todos os dias para manter sua{' '}
              <strong style={{ color: KOYEB.orange }}>sequencia</strong> ativa!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
