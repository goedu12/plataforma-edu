'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Atom, Calculator, ChevronRight, LogOut, Flame, Star, Zap, TrendingUp, Target } from 'lucide-react'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
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
    <div className="min-h-screen bg-koyeb-bg bg-grid relative">
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 floating opacity-20">
          <Atom className="w-24 h-24 text-fisica-500" />
        </div>
        <div className="absolute top-40 right-10 floating-delayed opacity-20">
          <Calculator className="w-20 h-20 text-matematica-500" />
        </div>
        <div className="absolute bottom-40 left-1/4 floating opacity-10">
          <Target className="w-16 h-16 text-koyeb-orange" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fisica-500 to-matematica-500 flex items-center justify-center shadow-koyeb">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-koyeb-dark uppercase tracking-tight">Plataforma EDU</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-500">Online • Turma {usuario.turma}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-koyeb-dark rounded-full hover:bg-gray-100 transition-all duration-300"
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-koyeb mb-4">
            <span className="text-lg">👋</span>
            <span className="text-sm font-semibold text-koyeb-dark">Bem-vindo de volta!</span>
          </div>
          <h2 className="heading-display text-koyeb-dark text-3xl md:text-4xl mb-2">
            Olá, {primeiroNome}!
          </h2>
          <p className="text-gray-500 font-medium">O que vamos estudar hoje?</p>
        </div>

        {/* Cards de Componentes */}
        <div className="space-y-4">
          {/* Card de Física */}
          {usuario.componentes.includes('fisica') && (
            <Card
              interactive
              onClick={() => router.push('/fisica/menu')}
              className="animate-slide-up group overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fisica-400 to-fisica-600 flex items-center justify-center shadow-koyeb group-hover:scale-110 transition-transform duration-300">
                  <Atom className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-xl text-koyeb-dark uppercase tracking-tight">Física</h3>
                    <span className="px-2 py-0.5 bg-fisica-100 text-fisica-700 text-xs font-bold rounded-full uppercase">
                      {nivelFisica.nome}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Tutor: <span className="font-semibold">Newton</span></p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-fisica-500 group-hover:text-white transition-all duration-300">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-fisica-600 mb-1">
                    <Star className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-koyeb-dark">{usuario.fis_pontos}</p>
                  <p className="text-xs text-gray-400 uppercase">Pontos</p>
                </div>
                <div className="text-center border-x border-gray-100">
                  <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                    <Flame className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-koyeb-dark">{usuario.fis_sequencia_dias}</p>
                  <p className="text-xs text-gray-400 uppercase">Dias</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-koyeb-dark">{usuario.fis_questoes_total}</p>
                  <p className="text-xs text-gray-400 uppercase">Questões</p>
                </div>
              </div>
            </Card>
          )}

          {/* Card de Matemática */}
          {usuario.componentes.includes('matematica') && (
            <Card
              interactive
              onClick={() => router.push('/matematica/menu')}
              className="animate-slide-up group overflow-hidden"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-matematica-400 to-matematica-600 flex items-center justify-center shadow-koyeb group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-xl text-koyeb-dark uppercase tracking-tight">Matemática</h3>
                    <span className="px-2 py-0.5 bg-matematica-100 text-matematica-700 text-xs font-bold rounded-full uppercase">
                      {nivelMatematica.nome}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Tutor: <span className="font-semibold">Pitágoras</span></p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-matematica-500 group-hover:text-white transition-all duration-300">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-matematica-600 mb-1">
                    <Star className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-koyeb-dark">{usuario.mat_pontos}</p>
                  <p className="text-xs text-gray-400 uppercase">Pontos</p>
                </div>
                <div className="text-center border-x border-gray-100">
                  <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                    <Flame className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-koyeb-dark">{usuario.mat_sequencia_dias}</p>
                  <p className="text-xs text-gray-400 uppercase">Dias</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-black text-koyeb-dark">{usuario.mat_questoes_total}</p>
                  <p className="text-xs text-gray-400 uppercase">Questões</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Dica */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <Card variant="glass" padding="sm" className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <span className="text-lg">💡</span>
              <span>Estude todos os dias para manter sua <strong className="text-koyeb-orange">sequência</strong>!</span>
            </div>
          </Card>
        </div>
      </main>

      {/* Bottom decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-fisica-500 via-koyeb-orange to-matematica-500" />
    </div>
  )
}
