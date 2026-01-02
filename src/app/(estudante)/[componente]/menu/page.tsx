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
  ChevronRight,
  RotateCcw,
  Zap,
  GraduationCap,
  User,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Loading from '@/components/ui/Loading'
import ProfilePhoto from '@/components/ProfilePhoto'
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

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'fisica-500' : 'matematica-500'
  const bgGradient = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'
  const textColor = isFisica ? 'text-fisica-500' : 'text-matematica-500'
  const bgLight = isFisica ? 'bg-fisica-50' : 'bg-matematica-50'

  const menuItems = [
    {
      icon: BookOpen,
      label: 'Estudar',
      href: `/${componente}/estudar`,
      description: 'Questões e pontos',
      highlight: true
    },
    {
      icon: Zap,
      label: 'Modo Desafio',
      href: `/${componente}/desafio`,
      description: '5 questões em 5 minutos',
      highlight: false
    },
    {
      icon: RotateCcw,
      label: 'Revisar Erros',
      href: `/${componente}/revisao`,
      description: 'Refazer questões erradas',
      highlight: false
    },
    {
      icon: Bot,
      label: `Tutor ${nomeTutor}`,
      href: `/${componente}/tutor`,
      description: 'Tire dúvidas com IA',
      highlight: false
    },
    {
      icon: Trophy,
      label: 'Ranking',
      href: `/${componente}/ranking`,
      description: 'Sua posição na turma',
      highlight: false
    },
    {
      icon: Medal,
      label: 'Conquistas',
      href: `/${componente}/conquistas`,
      description: 'Medalhas e troféus',
      highlight: false
    },
    {
      icon: GraduationCap,
      label: 'Notas',
      href: `/${componente}/notas`,
      description: 'Nota do bimestre',
      highlight: false
    },
  ]

  return (
    <div className="min-h-screen bg-calm-bg pb-24">
      {/* Header */}
      <header className={`${bgGradient} text-white px-4 pt-6 pb-16`}>
        <div className="max-w-2xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold capitalize">{componente}</h1>
              <p className="text-white/80 text-sm">Turma {usuario.turma}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push(`/${componente}/perfil`)}
                className="p-2.5 rounded-xl hover:bg-white/20 transition-colors"
                title="Meu Perfil"
              >
                <User className="w-5 h-5" />
              </button>
              {usuario.componentes.length > 1 && (
                <button
                  onClick={() => router.push('/selecionar')}
                  className="p-2.5 rounded-xl hover:bg-white/20 transition-colors"
                  title="Trocar componente"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl hover:bg-white/20 transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* User Welcome with Photo - clickable to go to profile */}
          <button
            onClick={() => router.push(`/${componente}/perfil`)}
            className="mb-4 flex items-center gap-4 w-full text-left hover:opacity-90 transition-opacity"
          >
            <ProfilePhoto
              fotoUrl={usuario.foto_url}
              nome={usuario.nome}
              size="lg"
              editable={false}
              componente={componente}
            />
            <div>
              <p className="text-2xl font-bold">Olá, {primeiroNome}!</p>
              <p className="text-white/80 text-sm">{nivel.emoji} {nivel.nome}</p>
              <p className="text-white/60 text-xs mt-1">Toque para ver perfil</p>
            </div>
          </button>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{pontos}</p>
              <p className="text-xs text-white/80">Pontos</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <Flame className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{sequenciaDias}</p>
              <p className="text-xs text-white/80">Dias</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
              <Target className="w-5 h-5 mx-auto mb-1" />
              <p className="text-xl font-bold">{taxaAcerto}%</p>
              <p className="text-xs text-white/80">Acerto</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 -mt-8">
        {/* Card de Progresso */}
        <Card className="mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-text-primary">Progresso</span>
            <span className="text-sm text-text-muted">
              {questoesTotal}/50 questões
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-calm-elevated rounded-full overflow-hidden mb-3">
            <div
              className={`h-full ${bgGradient} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${Math.min((questoesTotal / 50) * 100, 100)}%` }}
            />
          </div>

          {/* Level Progress */}
          {proximoNivel && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">{nivel.emoji} {nivel.nome}</span>
              <span className={textColor}>
                +{pontosParaProximo} pts para {proximoNivel.nome}
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
              className="animate-slide-up group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${bgGradient}`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="font-semibold text-text-primary text-center mb-1">{item.label}</h3>
              <p className="text-xs text-text-muted text-center">{item.description}</p>
            </Card>
          ))}
        </div>

        {/* Dica do Dia */}
        <Card className="mt-6 animate-fade-in bg-orange-50 border-orange-200" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-orange/20 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-accent-orange" />
            </div>
            <div>
              <p className="font-semibold text-text-primary text-sm mb-1">Dica</p>
              <p className="text-sm text-text-secondary">
                Responda questões rapidamente para ganhar bônus de velocidade!
              </p>
            </div>
          </div>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-calm-surface border-t border-calm-border safe-bottom">
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
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                item.active
                  ? `${textColor} ${bgLight}`
                  : 'text-text-muted hover:text-text-primary'
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
