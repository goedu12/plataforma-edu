'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Atom, Calculator, ChevronRight, LogOut, Flame, Star, TrendingUp } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
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
    <div className="min-h-screen bg-calm-bg">
      {/* Header */}
      <header className="bg-calm-surface border-b border-calm-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-orange flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="font-bold text-text-primary">Plataforma EDU</h1>
              <span className="text-sm text-text-muted">Turma {usuario.turma}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-calm-elevated transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto p-4 pt-8">
        {/* Welcome Section */}
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            Olá, {primeiroNome}!
          </h2>
          <p className="text-text-secondary">O que vamos estudar hoje?</p>
        </div>

        {/* Cards de Componentes */}
        <div className="space-y-4">
          {/* Card de Física */}
          {usuario.componentes.includes('fisica') && (
            <Card
              interactive
              onClick={() => router.push('/fisica/menu')}
              variant="fisica"
              className="animate-slide-up group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-fisica-500 flex items-center justify-center">
                  <Atom className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-text-primary">Física</h3>
                    <Badge variant="fisica">{nivelFisica.nome}</Badge>
                  </div>
                  <p className="text-sm text-text-secondary">Tutor: Newton</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-calm-elevated flex items-center justify-center group-hover:bg-fisica-500 group-hover:text-white transition-colors text-text-muted">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-calm-border grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-fisica-500 mb-1">
                    <Star className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-text-primary tabular-nums">{usuario.fis_pontos}</p>
                  <p className="text-xs text-text-muted">Pontos</p>
                </div>
                <div className="text-center border-x border-calm-border">
                  <div className="flex items-center justify-center gap-1 text-accent-orange mb-1">
                    <Flame className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-text-primary tabular-nums">{usuario.fis_sequencia_dias}</p>
                  <p className="text-xs text-text-muted">Dias</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-success mb-1">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-text-primary tabular-nums">{usuario.fis_questoes_total}</p>
                  <p className="text-xs text-text-muted">Questões</p>
                </div>
              </div>
            </Card>
          )}

          {/* Card de Matemática */}
          {usuario.componentes.includes('matematica') && (
            <Card
              interactive
              onClick={() => router.push('/matematica/menu')}
              variant="matematica"
              className="animate-slide-up group"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-matematica-500 flex items-center justify-center">
                  <Calculator className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-text-primary">Matemática</h3>
                    <Badge variant="matematica">{nivelMatematica.nome}</Badge>
                  </div>
                  <p className="text-sm text-text-secondary">Tutor: Pitágoras</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-calm-elevated flex items-center justify-center group-hover:bg-matematica-500 group-hover:text-white transition-colors text-text-muted">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-calm-border grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-matematica-500 mb-1">
                    <Star className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-text-primary tabular-nums">{usuario.mat_pontos}</p>
                  <p className="text-xs text-text-muted">Pontos</p>
                </div>
                <div className="text-center border-x border-calm-border">
                  <div className="flex items-center justify-center gap-1 text-accent-orange mb-1">
                    <Flame className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-text-primary tabular-nums">{usuario.mat_sequencia_dias}</p>
                  <p className="text-xs text-text-muted">Dias</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-success mb-1">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-lg font-bold text-text-primary tabular-nums">{usuario.mat_questoes_total}</p>
                  <p className="text-xs text-text-muted">Questões</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Dica */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <Card padding="sm" className="bg-orange-50 border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-sm text-orange-900">
                Estude todos os dias para manter sua <strong className="text-orange-700">sequência</strong> ativa!
              </p>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
