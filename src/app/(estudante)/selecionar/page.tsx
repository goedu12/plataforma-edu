'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Atom, Calculator, ChevronRight, LogOut, Flame, Star, Lightbulb } from 'lucide-react'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import type { Usuario } from '@/types'

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

          // Se só tem 1 componente, redirecionar direto
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading fullScreen />
      </div>
    )
  }

  const primeiroNome = usuario.nome.split(' ')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-800">📚 Plataforma EDU</h1>
            <p className="text-xs text-gray-500">Turma {usuario.turma}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto p-4">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-800">
            👋 Olá, {primeiroNome}!
          </h2>
          <p className="text-gray-500 mt-1">O que vamos estudar hoje?</p>
        </div>

        <div className="space-y-4">
          {/* Card de Física */}
          {usuario.componentes.includes('fisica') && (
            <Card
              interactive
              onClick={() => router.push('/fisica/menu')}
              className="animate-slide-up"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-fisica-100 flex items-center justify-center">
                  <Atom className="w-8 h-8 text-fisica-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">Física</h3>
                  <p className="text-sm text-gray-500">Tutor: Newton</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-fisica-600">
                  <Star className="w-4 h-4" />
                  <span>{usuario.fis_pontos} pts</span>
                </div>
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span>{usuario.fis_sequencia_dias} dias</span>
                </div>
              </div>
            </Card>
          )}

          {/* Card de Matemática */}
          {usuario.componentes.includes('matematica') && (
            <Card
              interactive
              onClick={() => router.push('/matematica/menu')}
              className="animate-slide-up"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-matematica-100 flex items-center justify-center">
                  <Calculator className="w-8 h-8 text-matematica-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">Matemática</h3>
                  <p className="text-sm text-gray-500">Tutor: Pitágoras</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-matematica-600">
                  <Star className="w-4 h-4" />
                  <span>{usuario.mat_pontos} pts</span>
                </div>
                <div className="flex items-center gap-1 text-orange-500">
                  <Flame className="w-4 h-4" />
                  <span>{usuario.mat_sequencia_dias} dias</span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Dica */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <Lightbulb className="w-4 h-4" />
            <span>Estude todos os dias para manter sua sequência!</span>
          </div>
        </div>
      </main>
    </div>
  )
}
