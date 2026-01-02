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
  RotateCcw,
  Zap,
  GraduationCap,
  User,
  ChevronRight,
} from 'lucide-react'
import Card, { StatCard, TerminalCard } from '@/components/ui/Card'
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
  const accentColor = isFisica ? 'fisica' : 'matematica'
  const bgGradient = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'
  const textColor = isFisica ? 'text-fisica-500' : 'text-matematica-500'
  const glowClass = isFisica ? 'shadow-glow-cyan' : 'shadow-glow-purple'
  const borderAccent = isFisica ? 'border-fisica-500' : 'border-matematica-500'

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
    <div className="min-h-screen bg-dark-bg pb-24">
      {/* Header - Koyeb Dark Style */}
      <header className="bg-dark-surface border-b border-border px-4 pt-6 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-xl font-bold uppercase tracking-wider ${textColor}`}>
                {componente}
              </h1>
              <p className="text-text-tertiary text-sm">Turma {usuario.turma}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push(`/${componente}/perfil`)}
                className="p-2.5 rounded-xl bg-dark-elevated border border-border hover:border-border-hover transition-all"
                title="Meu Perfil"
              >
                <User className="w-5 h-5 text-text-secondary" />
              </button>
              {usuario.componentes.length > 1 && (
                <button
                  onClick={() => router.push('/selecionar')}
                  className="p-2.5 rounded-xl bg-dark-elevated border border-border hover:border-border-hover transition-all"
                  title="Trocar componente"
                >
                  <ArrowLeftRight className="w-5 h-5 text-text-secondary" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-dark-elevated border border-border hover:border-border-hover transition-all"
                title="Sair"
              >
                <LogOut className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
          </div>

          {/* User Welcome with Photo - clickable to go to profile */}
          <button
            onClick={() => router.push(`/${componente}/perfil`)}
            className="mb-6 flex items-center gap-4 w-full text-left group"
          >
            <ProfilePhoto
              fotoUrl={usuario.foto_url}
              nome={usuario.nome}
              size="lg"
              editable={false}
              componente={componente}
            />
            <div>
              <p className="text-2xl font-bold text-text-primary group-hover:text-white transition-colors">
                Olá, {primeiroNome}!
              </p>
              <p className={`${textColor} text-sm font-medium`}>
                {nivel.emoji} {nivel.nome}
              </p>
              <p className="text-text-tertiary text-xs mt-1">Toque para ver perfil</p>
            </div>
          </button>

          {/* Quick Stats - Terminal Style */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`bg-dark-elevated rounded-xl p-4 border border-border text-center`}>
              <Star className={`w-5 h-5 mx-auto mb-2 ${textColor}`} />
              <p className="text-2xl font-bold text-text-primary tabular-nums">{pontos}</p>
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Pontos</p>
            </div>
            <div className={`bg-dark-elevated rounded-xl p-4 border border-border text-center`}>
              <Flame className="w-5 h-5 mx-auto mb-2 text-warning" />
              <p className="text-2xl font-bold text-text-primary tabular-nums">{sequenciaDias}</p>
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Dias</p>
            </div>
            <div className={`bg-dark-elevated rounded-xl p-4 border border-border text-center`}>
              <Target className="w-5 h-5 mx-auto mb-2 text-accent-green" />
              <p className="text-2xl font-bold text-text-primary tabular-nums">{taxaAcerto}%</p>
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Acerto</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Card de Progresso */}
        <Card className="mb-6 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-text-primary uppercase tracking-wide text-sm">
              Progresso
            </span>
            <span className="text-sm text-text-secondary tabular-nums">
              {questoesTotal}/50 questões
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-dark-elevated rounded-full overflow-hidden mb-3">
            <div
              className={`h-full ${bgGradient} rounded-full transition-all duration-1000 ease-out`}
              style={{ width: `${Math.min((questoesTotal / 50) * 100, 100)}%` }}
            />
          </div>

          {/* Level Progress */}
          {proximoNivel && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-tertiary">{nivel.emoji} {nivel.nome}</span>
              <span className={textColor}>
                +{pontosParaProximo} pts para {proximoNivel.nome}
              </span>
            </div>
          )}
        </Card>

        {/* Grid de Menu - Koyeb Style */}
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`
                bg-dark-surface rounded-xl p-5 border border-border
                hover:bg-dark-elevated hover:border-border-hover
                hover:${glowClass}
                transition-all duration-200 text-left
                animate-slide-up group
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`
                w-12 h-12 rounded-xl mb-3 flex items-center justify-center
                ${isFisica ? 'bg-fisica-500/10' : 'bg-matematica-500/10'}
              `}>
                <item.icon className={`w-6 h-6 ${textColor}`} />
              </div>

              <h3 className="font-semibold text-text-primary text-sm mb-1 uppercase tracking-wide">
                {item.label}
              </h3>
              <p className="text-xs text-text-tertiary">{item.description}</p>

              <ChevronRight className={`
                w-4 h-4 mt-2 ${textColor} opacity-0 group-hover:opacity-100
                transform translate-x-0 group-hover:translate-x-1 transition-all
              `} />
            </button>
          ))}
        </div>

        {/* Terminal Tip */}
        <div className="mt-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <TerminalCard title="dica.sh">
            <div className="space-y-1">
              <p>
                <span className="text-accent-green">$</span>
                <span className="text-text-comment"> # Dica do dia</span>
              </p>
              <p className="text-text-secondary">
                <span className="text-warning">echo</span> &quot;Responda rapidamente para bônus de velocidade!&quot;
              </p>
            </div>
          </TerminalCard>
        </div>
      </main>

      {/* Bottom Navigation - Koyeb Dark Style */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-border safe-bottom">
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
              className={`
                flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all
                ${item.active
                  ? `${textColor} ${isFisica ? 'bg-fisica-500/10' : 'bg-matematica-500/10'}`
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium uppercase tracking-wide">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
