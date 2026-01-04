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
import Loading from '@/components/ui/Loading'
import ProfilePhoto from '@/components/ProfilePhoto'
import type { Usuario, Componente } from '@/types'
import { obterNivelPorPontos, calcularTaxaAcerto, NIVEIS_JOGADOR } from '@/types'

// Cores Koyeb
const KOYEB = {
  bg: '#0D0D14',
  bgCard: '#1A1A2E',
  bgElevated: '#222238',
  bgDark: '#12121C',
  bgTerminal: '#2D2D3A',
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

  const nivelAtualIndex = NIVEIS_JOGADOR.findIndex(n => n.nome === nivel.nome)
  const proximoNivel = NIVEIS_JOGADOR[nivelAtualIndex + 1]
  const pontosParaProximo = proximoNivel ? proximoNivel.pontos_min - pontos : 0

  const primeiroNome = usuario.nome.split(' ')[0]
  const nomeTutor = componente === 'fisica' ? 'Newton' : 'Pitagoras'

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? KOYEB.fisica : KOYEB.matematica

  const menuItems = [
    { icon: BookOpen, label: 'Estudar', href: `/${componente}/estudar`, description: 'Questoes e pontos' },
    { icon: Zap, label: 'Modo Desafio', href: `/${componente}/desafio`, description: '5 questoes em 5 minutos' },
    { icon: RotateCcw, label: 'Revisar Erros', href: `/${componente}/revisao`, description: 'Refazer questoes erradas' },
    { icon: Bot, label: `Tutor ${nomeTutor}`, href: `/${componente}/tutor`, description: 'Tire duvidas com IA' },
    { icon: Trophy, label: 'Ranking', href: `/${componente}/ranking`, description: 'Sua posicao na turma' },
    { icon: Medal, label: 'Conquistas', href: `/${componente}/conquistas`, description: 'Medalhas e trofeus' },
    { icon: GraduationCap, label: 'Notas', href: `/${componente}/notas`, description: 'Nota do bimestre' },
  ]

  return (
    <div
      className="min-h-screen pb-24"
      style={{
        background: `linear-gradient(180deg, ${KOYEB.bg} 0%, ${KOYEB.bgCard} 100%)`,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <header
        className="px-4 pt-6 pb-8"
        style={{ borderBottom: `1px solid ${KOYEB.border}` }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1
                className="font-mono text-sm font-bold uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                {componente}
              </h1>
              <p
                className="text-xs font-mono"
                style={{ color: KOYEB.textMuted }}
              >
                Turma {usuario.turma}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => router.push(`/${componente}/perfil`)}
                className="p-2.5 rounded-xl transition-all hover:bg-white/10"
                style={{ border: `1px solid ${KOYEB.border}` }}
              >
                <User className="w-5 h-5" style={{ color: KOYEB.textSecondary }} />
              </button>
              {usuario.componentes.length > 1 && (
                <button
                  onClick={() => router.push('/selecionar')}
                  className="p-2.5 rounded-xl transition-all hover:bg-white/10"
                  style={{ border: `1px solid ${KOYEB.border}` }}
                >
                  <ArrowLeftRight className="w-5 h-5" style={{ color: KOYEB.textSecondary }} />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl transition-all hover:bg-white/10"
                style={{ border: `1px solid ${KOYEB.border}` }}
              >
                <LogOut className="w-5 h-5" style={{ color: KOYEB.textSecondary }} />
              </button>
            </div>
          </div>

          {/* User Welcome */}
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
              <p
                className="font-display text-2xl font-bold transition-colors text-white"
              >
                Ola, {primeiroNome}!
              </p>
              <p
                className="font-mono text-sm font-medium"
                style={{ color: accentColor }}
              >
                {nivel.emoji} {nivel.nome}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: KOYEB.textMuted }}
              >
                Toque para ver perfil
              </p>
            </div>
          </button>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: KOYEB.bgElevated, border: `1px solid ${KOYEB.border}` }}
            >
              <Star className="w-5 h-5 mx-auto mb-2" style={{ color: accentColor }} />
              <p
                className="text-2xl font-bold font-mono tabular-nums"
                style={{ color: KOYEB.textPrimary }}
              >
                {pontos}
              </p>
              <p
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: KOYEB.textMuted }}
              >
                Pontos
              </p>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: KOYEB.bgElevated, border: `1px solid ${KOYEB.border}` }}
            >
              <Flame className="w-5 h-5 mx-auto mb-2" style={{ color: KOYEB.orange }} />
              <p
                className="text-2xl font-bold font-mono tabular-nums"
                style={{ color: KOYEB.textPrimary }}
              >
                {sequenciaDias}
              </p>
              <p
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: KOYEB.textMuted }}
              >
                Dias
              </p>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{ background: KOYEB.bgElevated, border: `1px solid ${KOYEB.border}` }}
            >
              <Target className="w-5 h-5 mx-auto mb-2" style={{ color: KOYEB.primary }} />
              <p
                className="text-2xl font-bold font-mono tabular-nums"
                style={{ color: KOYEB.textPrimary }}
              >
                {taxaAcerto}%
              </p>
              <p
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: KOYEB.textMuted }}
              >
                Acerto
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress Card */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: KOYEB.bgCard, border: `1px solid ${KOYEB.border}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="font-mono text-xs font-bold uppercase tracking-widest"
              style={{ color: KOYEB.textMuted }}
            >
              Progresso
            </span>
            <span
              className="font-mono text-sm tabular-nums"
              style={{ color: KOYEB.textSecondary }}
            >
              {questoesTotal}/50 questoes
            </span>
          </div>

          <div
            className="h-2 rounded-full overflow-hidden mb-3"
            style={{ background: KOYEB.bgDark }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min((questoesTotal / 50) * 100, 100)}%`,
                background: `linear-gradient(90deg, ${accentColor}, ${KOYEB.accent})`,
              }}
            />
          </div>

          {proximoNivel && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: KOYEB.textMuted }}>
                {nivel.emoji} {nivel.nome}
              </span>
              <span style={{ color: accentColor }}>
                +{pontosParaProximo} pts para {proximoNivel.nome}
              </span>
            </div>
          )}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="rounded-xl p-5 text-left transition-all duration-300 hover:translate-y-[-2px] group"
              style={{
                background: KOYEB.bgCard,
                border: `1px solid ${KOYEB.border}`,
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div
                className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center"
                style={{ background: isFisica ? 'rgba(0, 255, 136, 0.1)' : 'rgba(168, 85, 247, 0.1)' }}
              >
                <item.icon className="w-6 h-6" style={{ color: accentColor }} />
              </div>

              <h3
                className="font-mono text-sm font-bold uppercase tracking-wide mb-1"
                style={{ color: KOYEB.textPrimary }}
              >
                {item.label}
              </h3>
              <p
                className="text-xs"
                style={{ color: KOYEB.textMuted }}
              >
                {item.description}
              </p>

              <ChevronRight
                className="w-4 h-4 mt-2 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all"
                style={{ color: accentColor }}
              />
            </button>
          ))}
        </div>

        {/* Terminal Tip */}
        <div className="mt-6">
          <div className={`terminal-box ${isFisica ? '' : 'terminal-lilas'}`}>
            <div className="terminal-header">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="title">dica.sh</span>
            </div>
            <div className="terminal-body">
              <p className="comment"># Dica do dia</p>
              <p className="text-white">$ Responda rapidamente para bonus de velocidade!</p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 safe-bottom"
        style={{ background: KOYEB.bgCard, borderTop: `1px solid ${KOYEB.border}` }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2">
          {[
            { icon: Home, label: 'Inicio', href: `/${componente}/menu`, active: true },
            { icon: BookOpen, label: 'Estudar', href: `/${componente}/estudar`, active: false },
            { icon: Trophy, label: 'Ranking', href: `/${componente}/ranking`, active: false },
            { icon: Bot, label: 'Tutor', href: `/${componente}/tutor`, active: false },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all"
              style={{
                color: item.active ? accentColor : KOYEB.textMuted,
                background: item.active ? (isFisica ? 'rgba(0, 255, 136, 0.1)' : 'rgba(168, 85, 247, 0.1)') : 'transparent',
              }}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-mono uppercase tracking-wider">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
