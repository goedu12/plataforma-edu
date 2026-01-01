'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  BookOpen,
  Bot,
  Trophy,
  Medal,
  Home,
  LogOut,
  Star,
  Flame,
  ArrowLeftRight,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import ProgressBar from '@/components/ui/ProgressBar'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import type { Usuario, Componente } from '@/types'
import { obterNivelPorPontos, calcularTaxaAcerto } from '@/types'

export default function MenuComponentePage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    const buscarUsuario = async () => {
      try {
        const response = await fetch('/api/usuario')
        const data = await response.json()

        if (data.sucesso && data.usuario) {
          if (!data.usuario.componentes.includes(componente)) {
            router.push('/selecionar')
            return
          }
          setUsuario(data.usuario)
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
  }, [router, componente])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading || !usuario) {
    return <Loading fullScreen componente={componente} />
  }

  const pontos = componente === 'fisica' ? usuario.fis_pontos : usuario.mat_pontos
  const questoesTotal = componente === 'fisica' ? usuario.fis_questoes_total : usuario.mat_questoes_total
  const questoesCorretas = componente === 'fisica' ? usuario.fis_questoes_corretas : usuario.mat_questoes_corretas
  const sequenciaDias = componente === 'fisica' ? usuario.fis_sequencia_dias : usuario.mat_sequencia_dias
  const nivel = obterNivelPorPontos(pontos)
  const taxaAcerto = calcularTaxaAcerto(questoesCorretas, questoesTotal)

  const primeiroNome = usuario.nome.split(' ')[0]
  const nomeTutor = componente === 'fisica' ? 'Newton' : 'Pitágoras'

  const bgGradient =
    componente === 'fisica'
      ? 'from-fisica-500 to-fisica-600'
      : 'from-matematica-500 to-matematica-600'

  const menuItems = [
    { icon: BookOpen, label: 'Estudar', href: `/${componente}/estudar`, description: 'Responda questões e ganhe pontos' },
    { icon: Bot, label: nomeTutor, href: `/${componente}/tutor`, description: 'Tire dúvidas com inteligência artificial' },
    { icon: Trophy, label: 'Ranking', href: `/${componente}/ranking`, description: 'Veja sua posição na turma' },
    { icon: Medal, label: 'Conquistas', href: `/${componente}/conquistas`, description: 'Desbloqueie medalhas especiais' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className={`bg-gradient-to-r ${bgGradient} text-white px-4 py-6`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{componente === 'fisica' ? '🔬' : '🔢'}</span>
              <h1 className="text-xl font-bold capitalize">{componente}</h1>
            </div>
            <div className="flex items-center gap-2">
              {usuario.componentes.length > 1 && (
                <button
                  onClick={() => router.push('/selecionar')}
                  className="p-2 rounded-lg hover:bg-white/20"
                  title="Trocar componente"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/20"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-white/80 text-sm">👋 Olá, {primeiroNome}!</p>
              <p className="text-white/60 text-xs">Turma {usuario.turma}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span>{nivel.emoji}</span>
              <span>{nivel.nome}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>{pontos} pts</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4" />
              <span>{sequenciaDias} dias</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto p-4 -mt-4">
        {/* Card de Progresso */}
        <Card className="mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso semanal</span>
            <span className="text-xs text-gray-500">
              {questoesTotal} questões • {taxaAcerto}% acerto
            </span>
          </div>
          <ProgressBar value={Math.min(questoesTotal, 50)} max={50} componente={componente} />
        </Card>

        {/* Grid de Menu */}
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <Card
              key={item.label}
              interactive
              onClick={() => router.push(item.href)}
              className="text-center animate-slide-up hover:scale-105 transition-transform duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-sm ${
                  componente === 'fisica' ? 'bg-fisica-100' : 'bg-matematica-100'
                }`}
              >
                <item.icon
                  className={`w-7 h-7 ${
                    componente === 'fisica' ? 'text-fisica-600' : 'text-matematica-600'
                  }`}
                />
              </div>
              <span className="font-semibold text-gray-800 block">{item.label}</span>
              <span className="text-xs text-gray-500 mt-1 block">{item.description}</span>
            </Card>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t safe-bottom">
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2">
          {[
            { icon: Home, label: 'Início', active: true },
            { icon: BookOpen, label: 'Estudar' },
            { icon: Trophy, label: 'Ranking' },
            { icon: Bot, label: 'Tutor' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => {
                if (item.label === 'Estudar') router.push(`/${componente}/estudar`)
                if (item.label === 'Ranking') router.push(`/${componente}/ranking`)
                if (item.label === 'Tutor') router.push(`/${componente}/tutor`)
              }}
              className={`flex flex-col items-center gap-1 px-4 py-2 ${
                item.active
                  ? componente === 'fisica'
                    ? 'text-fisica-600'
                    : 'text-matematica-600'
                  : 'text-gray-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
