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
  Target,
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import type { Usuario, Componente } from '@/types'
import { obterNivelPorPontos, calcularTaxaAcerto, NIVEIS_JOGADOR } from '@/types'

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

  // Calcular progresso para próximo nível
  const nivelAtualIndex = NIVEIS_JOGADOR.findIndex(n => n.nome === nivel.nome)
  const proximoNivel = NIVEIS_JOGADOR[nivelAtualIndex + 1]
  const pontosParaProximo = proximoNivel ? proximoNivel.pontos_min - pontos : 0
  const progressoNivel = proximoNivel
    ? ((pontos - nivel.pontos_min) / (proximoNivel.pontos_min - nivel.pontos_min)) * 100
    : 100

  const primeiroNome = usuario.nome.split(' ')[0]
  const nomeTutor = componente === 'fisica' ? 'Newton' : 'Pitágoras'
  const iconeTutor = componente === 'fisica' ? '🍎' : '📐'

  const corPrimaria = componente === 'fisica' ? 'fisica' : 'matematica'
  const bgGradient = componente === 'fisica'
    ? 'from-fisica-500 to-fisica-600'
    : 'from-matematica-500 to-matematica-600'

  const menuItems = [
    {
      icon: BookOpen,
      label: 'Estudar',
      href: `/${componente}/estudar`,
      description: 'Questões e pontos',
      badge: 'Principal'
    },
    {
      icon: Bot,
      label: `Tutor ${nomeTutor}`,
      href: `/${componente}/tutor`,
      description: 'Tire dúvidas com IA',
      badge: iconeTutor
    },
    {
      icon: Trophy,
      label: 'Ranking',
      href: `/${componente}/ranking`,
      description: 'Sua posição na turma',
      badge: null
    },
    {
      icon: Medal,
      label: 'Conquistas',
      href: `/${componente}/conquistas`,
      description: 'Medalhas e troféus',
      badge: null
    },
  ]

  return (
    <div className="min-h-screen bg-koyeb-bg pb-24">
      {/* Header */}
      <header className={`bg-gradient-to-br ${bgGradient} text-white px-4 pt-6 pb-20 relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 floating">
            {componente === 'fisica' ? '⚛️' : '🔢'}
          </div>
          <div className="absolute bottom-10 left-10 floating-delayed text-4xl">
            {componente === 'fisica' ? '🔬' : '📊'}
          </div>
        </div>

        <div className="max-w-2xl mx-auto relative z-10">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{componente === 'fisica' ? '⚛️' : '🔢'}</span>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">{componente}</h1>
                <div className="flex items-center gap-1 text-white/70 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span>Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {usuario.componentes.length > 1 && (
                <button
                  onClick={() => router.push('/selecionar')}
                  className="p-2.5 rounded-full hover:bg-white/20 transition-colors"
                  title="Trocar componente"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-full hover:bg-white/20 transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Welcome */}
          <div className="mb-6">
            <p className="text-white/80 text-sm mb-1">👋 Olá, <span className="font-semibold">{primeiroNome}</span>!</p>
            <p className="text-white/60 text-xs">Turma {usuario.turma} • {nivel.emoji} {nivel.nome}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1" />
              <p className="text-2xl font-black">{pontos}</p>
              <p className="text-xs text-white/70 uppercase">Pontos</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <Flame className="w-5 h-5 mx-auto mb-1 text-orange-300" />
              <p className="text-2xl font-black">{sequenciaDias}</p>
              <p className="text-xs text-white/70 uppercase">Dias</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-green-300" />
              <p className="text-2xl font-black">{taxaAcerto}%</p>
              <p className="text-xs text-white/70 uppercase">Acerto</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 -mt-12 relative z-10">
        {/* Card de Progresso */}
        <Card className="mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-5 h-5 text-${corPrimaria}-500`} />
              <span className="font-bold text-koyeb-dark uppercase text-sm">Progresso Semanal</span>
            </div>
            <span className="text-xs font-medium text-gray-500">
              {questoesTotal}/50 questões
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full bg-gradient-to-r ${bgGradient} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${Math.min((questoesTotal / 50) * 100, 100)}%` }}
            />
          </div>

          {/* Level Progress */}
          {proximoNivel && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{nivel.emoji} {nivel.nome}</span>
              <span className={`text-${corPrimaria}-600 font-semibold`}>
                +{pontosParaProximo} pts para {proximoNivel.emoji} {proximoNivel.nome}
              </span>
            </div>
          )}
        </Card>

        {/* Grid de Menu */}
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <Card
              key={item.label}
              interactive
              onClick={() => router.push(item.href)}
              className="animate-slide-up group relative overflow-hidden"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {item.badge && (
                <span className={`absolute top-2 right-2 px-2 py-0.5 bg-${corPrimaria}-100 text-${corPrimaria}-700 text-xs font-bold rounded-full`}>
                  {item.badge}
                </span>
              )}

              <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br ${bgGradient} shadow-koyeb group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="font-bold text-koyeb-dark text-center mb-1">{item.label}</h3>
              <p className="text-xs text-gray-500 text-center">{item.description}</p>

              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-${corPrimaria}-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
            </Card>
          ))}
        </div>

        {/* Dica do Dia */}
        <Card variant="glass" className="mt-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-koyeb-orange/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-koyeb-orange" />
            </div>
            <div>
              <p className="font-bold text-koyeb-dark text-sm mb-1">Dica do Dia</p>
              <p className="text-xs text-gray-600">
                Responda questões rapidamente (menos de 30s) para ganhar bônus de velocidade! ⚡
              </p>
            </div>
          </div>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom">
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2">
          {[
            { icon: Home, label: 'Início', href: `/${componente}/menu`, active: true },
            { icon: BookOpen, label: 'Estudar', href: `/${componente}/estudar`, active: false },
            { icon: Trophy, label: 'Ranking', href: `/${componente}/ranking`, active: false },
            { icon: Bot, label: 'Tutor', href: `/${componente}/tutor`, active: false },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
                item.active
                  ? `text-${corPrimaria}-600 bg-${corPrimaria}-50`
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
