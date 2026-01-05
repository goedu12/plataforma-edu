'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  BookOpen,
  Bot,
  Trophy,
  Medal,
  LogOut,
  Star,
  Flame,
  ArrowLeftRight,
  Target,
  RotateCcw,
  Zap,
  GraduationCap,
  ChevronRight,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Badge from '@/components/ui/Badge'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import ProfilePhoto from '@/components/ProfilePhoto'
import ThemeIconToggle from '@/components/ThemeIconToggle'
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

  const nivelAtualIndex = NIVEIS_JOGADOR.findIndex(n => n.nome === nivel.nome)
  const proximoNivel = NIVEIS_JOGADOR[nivelAtualIndex + 1]
  const pontosParaProximo = proximoNivel ? proximoNivel.pontos_min - pontos : 0

  const primeiroNome = usuario.nome.split(' ')[0]
  const nomeTutor = componente === 'fisica' ? 'Newton' : 'Pitágoras'

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const accentGlow = isFisica ? 'var(--color-fisica-glow)' : 'var(--color-matematica-glow)'

  const menuItems = [
    { icon: BookOpen, label: 'Estudar', href: `/${componente}/estudar`, description: 'Questões e pontos' },
    { icon: Zap, label: 'Desafio', href: `/${componente}/desafio`, description: '5 questões em 5 min' },
    { icon: RotateCcw, label: 'Revisar', href: `/${componente}/revisao`, description: 'Refazer erros' },
    { icon: Bot, label: `Tutor`, href: `/${componente}/tutor`, description: `Dúvidas com ${nomeTutor}` },
    { icon: Trophy, label: 'Ranking', href: `/${componente}/ranking`, description: 'Sua posição' },
    { icon: Medal, label: 'Conquistas', href: `/${componente}/conquistas`, description: 'Medalhas' },
    { icon: GraduationCap, label: 'Notas', href: `/${componente}/notas`, description: 'Nota bimestre' },
  ]

  return (
    <div
      className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Navigation Rail for Desktop */}
      <NavigationRail componente={componente} />
      {/* Header */}
      <header
        className="px-4 pt-6 pb-6"
        style={{ borderBottom: '1px solid var(--border-default)' }}
      >
        <div className="max-w-2xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1
                className="text-sm font-semibold"
                style={{ color: accentColor }}
              >
                {componente === 'fisica' ? 'Física' : 'Matemática'}
              </h1>
              <p
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                Turma {usuario.turma}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeIconToggle componente={componente} />
              {usuario.componentes.length > 1 && (
                <button
                  onClick={() => router.push('/selecionar')}
                  className="p-3 rounded-xl transition-all touch-target"
                  style={{
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-surface-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-3 rounded-xl transition-all touch-target"
                style={{
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
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
                className="font-display text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Olá, {primeiroNome}!
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isFisica ? 'fisica' : 'matematica'} size="sm">
                  {nivel.emoji} {nivel.nome}
                </Badge>
              </div>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Toque para ver perfil
              </p>
            </div>
          </button>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div
              className="rounded-xl p-4 text-center"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
              }}
            >
              <Star className="w-5 h-5 mx-auto mb-2" style={{ color: accentColor }} />
              <p
                className="text-2xl font-bold font-mono tabular-nums"
                style={{ color: 'var(--text-primary)' }}
              >
                {pontos}
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                Pontos
              </p>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
              }}
            >
              <Flame className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--color-streak)' }} />
              <p
                className="text-2xl font-bold font-mono tabular-nums"
                style={{ color: 'var(--text-primary)' }}
              >
                {sequenciaDias}
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                Dias
              </p>
            </div>
            <div
              className="rounded-xl p-4 text-center"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
              }}
            >
              <Target className="w-5 h-5 mx-auto mb-2" style={{ color: accentColor }} />
              <p
                className="text-2xl font-bold font-mono tabular-nums"
                style={{ color: 'var(--text-primary)' }}
              >
                {taxaAcerto}%
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
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
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--text-muted)' }}
            >
              Progresso
            </span>
            <span
              className="text-sm font-mono tabular-nums"
              style={{ color: 'var(--text-secondary)' }}
            >
              {questoesTotal}/50 questões
            </span>
          </div>

          <div
            className="h-2 rounded-full overflow-hidden mb-3"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.min((questoesTotal / 50) * 100, 100)}%`,
                background: `linear-gradient(90deg, ${accentColor}, var(--color-accent))`,
              }}
            />
          </div>

          {proximoNivel && (
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>
                {nivel.emoji} {nivel.nome}
              </span>
              <span style={{ color: accentColor }}>
                +{pontosParaProximo} pts para {proximoNivel.nome}
              </span>
            </div>
          )}
        </div>

        {/* Menu Grid - Compact Cards */}
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="rounded-xl p-3 text-left transition-all duration-300 hover:translate-y-[-2px] group touch-target"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                animationDelay: `${index * 50}ms`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor
                e.currentTarget.style.boxShadow = `0 0 20px ${accentGlow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                  }}
                >
                  <item.icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-display font-semibold text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.label}
                  </h3>
                  <p
                    className="text-xs truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: accentColor }}
                />
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav componente={componente} />
    </div>
  )
}
