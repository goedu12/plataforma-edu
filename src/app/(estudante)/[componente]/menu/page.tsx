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
  Sparkles,
  Route,
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
  isComingSoon?: boolean
}

export default function MenuComponentePage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [mostrarEmBreve, setMostrarEmBreve] = useState(false)

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
    { icon: Sparkles, label: 'FlashCards', href: `/${componente}/flashcards`, description: 'Quiz rápido', isNew: true },
    { icon: Route, label: 'Trilhas', href: `/${componente}/trilhas`, description: 'Sua jornada', isNew: true },
  ]

  // Simulado ENEM apenas para 3ª série do Ensino Médio
  const menuENEM: MenuItem[] = (usuario.nivel === 'EM' && usuario.ano === 3)
    ? [{ icon: FileText, label: 'ENEM', href: `/${componente}/simulado-enem`, description: 'Simulado' }]
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

      {/* Header Padronizado */}
      <header className="page-header">
        <div className="max-w-2xl mx-auto w-full">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-semibold" style={{ color: accentColor }}>
                {componente === 'fisica' ? 'Física' : 'Matemática'}
              </h1>
              <span
                className="badge-standard"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                {usuario.turma}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeIconToggle componente={componente} />
              {usuario.componentes.length > 1 && (
                <button
                  onClick={() => router.push('/selecionar')}
                  className="w-10 h-10 flex items-center justify-center rounded-lg"
                  style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-10 h-10 flex items-center justify-center rounded-lg"
                style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <LogOut className="w-5 h-5" />
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
                <div key={stat.label} className="stat-box min-w-[64px]">
                  <stat.icon className="w-4 h-4 mx-auto mb-1" style={{ color: stat.color }} />
                  <p className="text-base font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {stat.value}
                  </p>
                  <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Progress Card */}
        <div className="card-standard mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Progresso do Nível
            </span>
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {questoesTotal} questões
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div
              className="flex-1 h-2.5 rounded-full overflow-hidden"
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
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: accentColor }}>
                +{pontosParaProximo} → {proximoNivel.nome}
              </span>
            )}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={() => item.isComingSoon ? setMostrarEmBreve(true) : router.push(item.href)}
              className="list-item text-left transition-all hover:translate-y-[-1px] group relative"
              style={{
                animationDelay: `${index * 30}ms`,
                opacity: item.isComingSoon ? 0.7 : 1,
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
                  className="absolute -top-1.5 -right-1.5 px-2 py-0.5 text-2xs font-bold rounded-full"
                  style={{ background: 'var(--color-accent)', color: '#fff' }}
                >
                  NOVO
                </span>
              )}
              {/* Badge EM BREVE */}
              {item.isComingSoon && (
                <span
                  className="absolute -top-1.5 -right-1.5 px-2 py-0.5 text-2xs font-bold rounded-full"
                  style={{ background: 'var(--warning)', color: '#000' }}
                >
                  EM BREVE
                </span>
              )}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)' }}
                >
                  <item.icon className="w-5 h-5" style={{ color: accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {item.label}
                  </h3>
                  <p className="text-2xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {item.description}
                  </p>
                </div>
                <ChevronRight
                  className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: accentColor }}
                />
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Modal Em Breve */}
      {mostrarEmBreve && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setMostrarEmBreve(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ background: 'var(--bg-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(245, 158, 11, 0.1)' }}
            >
              <FileText className="w-8 h-8" style={{ color: 'var(--warning)' }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Simulado ENEM
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Estamos preparando questões do ENEM especialmente para você!
              Este recurso estará disponível em breve.
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              🎯 Fique atento às novidades!
            </p>
            <button
              onClick={() => setMostrarEmBreve(false)}
              className="w-full py-2.5 rounded-lg font-medium text-sm"
              style={{ background: accentColor, color: isFisica ? '#000' : '#fff' }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      <BottomNav componente={componente} />
    </div>
  )
}
