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
  Map,
  FileText,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Badge from '@/components/ui/Badge'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import ProfilePhoto from '@/components/ProfilePhoto'
import ThemeIconToggle from '@/components/ThemeIconToggle'
import type { Usuario, Componente } from '@/types'
import { obterNivelPorPontos, calcularTaxaAcerto, NIVEIS_JOGADOR } from '@/types'
import type { LucideIcon } from 'lucide-react'

interface MenuItem {
  icon: LucideIcon
  label: string
  href: string
  description: string
  isNew?: boolean
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
  const nomeTutor = componente === 'fisica' ? 'Newton' : 'Pitágoras'

  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const accentGlow = isFisica ? 'var(--color-fisica-glow)' : 'var(--color-matematica-glow)'

  // Menu base
  const menuItemsBase: MenuItem[] = [
    { icon: BookOpen, label: 'Estudar', href: `/${componente}/estudar`, description: 'Questões' },
    { icon: Zap, label: 'Desafio', href: `/${componente}/desafio`, description: '5 em 5min' },
    { icon: RotateCcw, label: 'Revisar', href: `/${componente}/revisao`, description: 'Erros' },
    { icon: Map, label: 'Mapas', href: `/${componente}/mapas`, description: 'Resumos' },
  ]

  // Simulado ENEM apenas para Ensino Médio
  const menuENEM: MenuItem[] = usuario.nivel === 'EM'
    ? [{ icon: FileText, label: 'ENEM', href: `/${componente}/simulado-enem`, description: 'Simulado', isNew: true }]
    : []

  const menuItemsFim: MenuItem[] = [
    { icon: Bot, label: 'Tutor', href: `/${componente}/tutor`, description: nomeTutor },
    { icon: Trophy, label: 'Ranking', href: `/${componente}/ranking`, description: 'Posição' },
    { icon: Medal, label: 'Conquistas', href: `/${componente}/conquistas`, description: '10 níveis' },
    { icon: GraduationCap, label: 'Notas', href: `/${componente}/notas`, description: 'Bimestre' },
  ]

  const menuItems: MenuItem[] = [...menuItemsBase, ...menuENEM, ...menuItemsFim]

  return (
    <div
      className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]"
      style={{ background: 'var(--bg-base)' }}
    >
      <NavigationRail componente={componente} />

      {/* Header Compacto */}
      <header className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <div className="max-w-2xl mx-auto">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-sm font-semibold" style={{ color: accentColor }}>
                {componente === 'fisica' ? 'Física' : 'Matemática'}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Turma {usuario.turma}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeIconToggle componente={componente} />
              {usuario.componentes.length > 1 && (
                <button
                  onClick={() => router.push('/selecionar')}
                  className="p-2 rounded-lg transition-all"
                  style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg transition-all"
                style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User + Stats em linha */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/${componente}/perfil`)}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <ProfilePhoto
                fotoUrl={usuario.foto_url}
                nome={usuario.nome}
                size="md"
                editable={false}
                componente={componente}
              />
              <div className="min-w-0">
                <p className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Olá, {primeiroNome}!
                </p>
                <Badge variant={isFisica ? 'fisica' : 'matematica'} size="sm">
                  {nivel.emoji} {nivel.nome}
                </Badge>
              </div>
            </button>

            {/* Stats inline */}
            <div className="flex gap-2">
              {[
                { icon: Star, value: pontos, label: 'Pontos', color: accentColor },
                { icon: Flame, value: sequenciaDias, label: 'Dias', color: 'var(--color-streak)' },
                { icon: Target, value: `${taxaAcerto}%`, label: 'Acerto', color: accentColor },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg px-3 py-2 text-center min-w-[60px]"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                >
                  <stat.icon className="w-4 h-4 mx-auto mb-0.5" style={{ color: stat.color }} />
                  <p className="text-base font-bold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {stat.value}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-3">
        {/* Progress Card Compacto */}
        <div
          className="rounded-xl p-3 mb-3"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Progresso
            </span>
            <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {questoesTotal}/50 questões
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((questoesTotal / 50) * 100, 100)}%`,
                  background: accentColor,
                }}
              />
            </div>
            {proximoNivel && (
              <span className="text-xs whitespace-nowrap" style={{ color: accentColor }}>
                +{pontosParaProximo} pts para {proximoNivel.nome}
              </span>
            )}
          </div>
        </div>

        {/* Menu Grid Compacto */}
        <div className="grid grid-cols-2 gap-2">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="rounded-xl p-3 text-left transition-all hover:translate-y-[-1px] group relative"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                animationDelay: `${index * 30}ms`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = accentColor
                e.currentTarget.style.boxShadow = `0 0 15px ${accentGlow}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Badge NOVO */}
              {item.isNew && (
                <span
                  className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}
                >
                  NOVO
                </span>
              )}
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)' }}
                >
                  <item.icon className="w-4 h-4" style={{ color: accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {item.label}
                  </h3>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
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

      <BottomNav componente={componente} />
    </div>
  )
}
