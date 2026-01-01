'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Atom, Calculator, ChevronRight, LogOut, Flame, Star, Zap, TrendingUp, Target, Sparkles } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import { AnimatedGrid } from '@/components/ui/AnimatedBackground'
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
    <div className="min-h-screen bg-dark-bg relative">
      {/* Animated Background */}
      <AnimatedGrid />

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 floating opacity-30">
          <Atom className="w-24 h-24 text-fisica-400" />
        </div>
        <div className="absolute top-40 right-10 floating-delayed opacity-30">
          <Calculator className="w-20 h-20 text-matematica-300" />
        </div>
        <div className="absolute bottom-40 left-1/4 floating opacity-20">
          <Target className="w-16 h-16 text-accent-orange" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 glass-strong border-b border-white/5 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fisica-400 to-matematica-300 flex items-center justify-center shadow-dark">
              <Zap className="w-5 h-5 text-dark-bg" />
            </div>
            <div>
              <h1 className="font-bold text-white uppercase tracking-tight">Plataforma EDU</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-light-muted">Online • Turma {usuario.turma}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-light-muted hover:text-white rounded-full hover:bg-dark-elevated transition-all duration-300"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="relative z-10 max-w-2xl mx-auto p-4 pt-8">
        {/* Welcome Section */}
        <div className="text-center mb-10 animate-slide-down">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-surface/80 backdrop-blur-sm rounded-full border border-dark-border mb-4">
            <Sparkles className="w-4 h-4 text-accent-orange" />
            <span className="text-sm font-semibold text-light-secondary">Bem-vindo de volta!</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
            Olá, {primeiroNome}!
          </h2>
          <p className="text-light-secondary font-medium">O que vamos estudar hoje?</p>
        </div>

        {/* Cards de Componentes */}
        <div className="space-y-4">
          {/* Card de Física */}
          {usuario.componentes.includes('fisica') && (
            <Card
              interactive
              onClick={() => router.push('/fisica/menu')}
              variant="glow-fisica"
              className="animate-slide-up group overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fisica-400 to-fisica-600 flex items-center justify-center shadow-glow-fisica group-hover:scale-110 transition-transform duration-300">
                  <Atom className="w-8 h-8 text-dark-bg" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-xl text-white uppercase tracking-tight">Física</h3>
                    <Badge variant="fisica">{nivelFisica.nome}</Badge>
                  </div>
                  <p className="text-sm text-light-secondary">Tutor: <span className="font-semibold text-fisica-400">Newton</span></p>
                </div>
                <div className="w-10 h-10 rounded-full bg-dark-elevated border border-dark-border flex items-center justify-center group-hover:bg-fisica-400 group-hover:text-dark-bg group-hover:border-fisica-400 transition-all duration-300 text-light-muted">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-dark-border grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-fisica-400 mb-1">
                    <Star className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-white tabular-nums">{usuario.fis_pontos}</p>
                  <p className="text-xs text-light-muted uppercase tracking-wider">Pontos</p>
                </div>
                <div className="text-center border-x border-dark-border">
                  <div className="flex items-center justify-center gap-1 text-accent-orange mb-1">
                    <Flame className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-white tabular-nums">{usuario.fis_sequencia_dias}</p>
                  <p className="text-xs text-light-muted uppercase tracking-wider">Dias</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-success mb-1">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-white tabular-nums">{usuario.fis_questoes_total}</p>
                  <p className="text-xs text-light-muted uppercase tracking-wider">Questões</p>
                </div>
              </div>
            </Card>
          )}

          {/* Card de Matemática */}
          {usuario.componentes.includes('matematica') && (
            <Card
              interactive
              onClick={() => router.push('/matematica/menu')}
              variant="glow-matematica"
              className="animate-slide-up group overflow-hidden"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-matematica-300 to-matematica-600 flex items-center justify-center shadow-glow-matematica group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-xl text-white uppercase tracking-tight">Matemática</h3>
                    <Badge variant="matematica">{nivelMatematica.nome}</Badge>
                  </div>
                  <p className="text-sm text-light-secondary">Tutor: <span className="font-semibold text-matematica-300">Pitágoras</span></p>
                </div>
                <div className="w-10 h-10 rounded-full bg-dark-elevated border border-dark-border flex items-center justify-center group-hover:bg-matematica-300 group-hover:text-dark-bg group-hover:border-matematica-300 transition-all duration-300 text-light-muted">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-dark-border grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-matematica-300 mb-1">
                    <Star className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-white tabular-nums">{usuario.mat_pontos}</p>
                  <p className="text-xs text-light-muted uppercase tracking-wider">Pontos</p>
                </div>
                <div className="text-center border-x border-dark-border">
                  <div className="flex items-center justify-center gap-1 text-accent-orange mb-1">
                    <Flame className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-white tabular-nums">{usuario.mat_sequencia_dias}</p>
                  <p className="text-xs text-light-muted uppercase tracking-wider">Dias</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-success mb-1">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-white tabular-nums">{usuario.mat_questoes_total}</p>
                  <p className="text-xs text-light-muted uppercase tracking-wider">Questões</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Dica */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Card variant="glass" padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-orange/20 border border-accent-orange/30 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-accent-orange" />
              </div>
              <p className="text-sm text-light-secondary">
                Estude todos os dias para manter sua <strong className="text-accent-orange">sequência</strong> ativa!
              </p>
            </div>
          </Card>
        </div>
      </main>

      {/* Bottom decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-fisica-400 via-accent-orange to-matematica-300" />
    </div>
  )
}
