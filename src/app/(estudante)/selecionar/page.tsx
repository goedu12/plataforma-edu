'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Atom, Calculator, ChevronRight, LogOut, Flame, Star, TrendingUp } from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Badge from '@/components/ui/Badge'
import type { Usuario } from '@/types'
import { obterNivelPorPontos } from '@/types'

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
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Header */}
      <header
        className="px-4 py-4"
        style={{ borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--color-streak)' }}
            >
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h1
                className="font-display font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Plataforma EDU
              </h1>
              <span
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                Turma {usuario.turma}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 rounded-xl transition-all touch-target"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Conteudo */}
      <main className="max-w-2xl mx-auto p-4 pt-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2
            className="font-display text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Olá, {primeiroNome}!
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            O que vamos estudar hoje?
          </p>
        </div>

        {/* Cards de Componentes */}
        <div className="space-y-4">
          {/* Card de Fisica */}
          {usuario.componentes.includes('fisica') && (
            <button
              onClick={() => router.push('/fisica/menu')}
              className="w-full text-left rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px] group touch-target"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-fisica)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px var(--color-fisica-glow)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--color-fisica)' }}
                >
                  <Atom className="w-7 h-7 text-black" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="font-display font-semibold text-lg"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Física
                    </h3>
                    <Badge variant="fisica" size="sm">
                      {nivelFisica.nome}
                    </Badge>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Tutor: Newton
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Stats */}
              <div
                className="mt-4 pt-4 grid grid-cols-3 gap-4"
                style={{ borderTop: '1px solid var(--border-default)' }}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4" style={{ color: 'var(--color-fisica)' }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {usuario.fis_pontos}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Pontos
                  </p>
                </div>
                <div
                  className="text-center"
                  style={{
                    borderLeft: '1px solid var(--border-default)',
                    borderRight: '1px solid var(--border-default)',
                  }}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="w-4 h-4" style={{ color: 'var(--color-streak)' }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {usuario.fis_sequencia_dias}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Dias
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-fisica)' }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {usuario.fis_questoes_total}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Questões
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Card de Matemática */}
          {usuario.componentes.includes('matematica') && (
            <button
              onClick={() => router.push('/matematica/menu')}
              className="w-full text-left rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px] group touch-target"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-matematica)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px var(--color-matematica-glow)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--color-matematica)' }}
                >
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3
                      className="font-display font-semibold text-lg"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Matemática
                    </h3>
                    <Badge variant="matematica" size="sm">
                      {nivelMatematica.nome}
                    </Badge>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Tutor: Pitágoras
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Stats */}
              <div
                className="mt-4 pt-4 grid grid-cols-3 gap-4"
                style={{ borderTop: '1px solid var(--border-default)' }}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4" style={{ color: 'var(--color-matematica)' }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {usuario.mat_pontos}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Pontos
                  </p>
                </div>
                <div
                  className="text-center"
                  style={{
                    borderLeft: '1px solid var(--border-default)',
                    borderRight: '1px solid var(--border-default)',
                  }}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="w-4 h-4" style={{ color: 'var(--color-streak)' }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {usuario.mat_sequencia_dias}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Dias
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-matematica)' }} />
                  </div>
                  <p
                    className="text-lg font-bold font-mono tabular-nums"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {usuario.mat_questoes_total}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Questões
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
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(249, 115, 22, 0.2)' }}
            >
              <Flame className="w-5 h-5" style={{ color: 'var(--color-streak)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Estude todos os dias para manter sua{' '}
              <strong style={{ color: 'var(--color-streak)' }}>sequência</strong> ativa!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
