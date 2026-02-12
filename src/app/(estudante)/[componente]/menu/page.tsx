'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  BookOpen,
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
  Map,
  FileText,
  Sparkles,
  Route,
  TrendingUp,
  Bot,
  Info,
  X,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import Badge from '@/components/ui/Badge'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import ProfilePhoto from '@/components/ProfilePhoto'
import ThemeIconToggle from '@/components/ThemeIconToggle'
import useTempoUso from '@/hooks/useTempoUso'
import type { Usuario, Componente } from '@/types'
import { obterNivelPorPontos, calcularTaxaAcerto, NIVEIS_JOGADOR } from '@/types'
import type { LucideIcon } from 'lucide-react'

interface MenuItem {
  icon: LucideIcon
  label: string
  href: string
  description: string
  badgeText?: string
  badgeColor?: string
}

interface NotaBimestre {
  nota_final: number
  nota_acertos: number
  nota_tempo: number
  bimestre: number
  dias_restantes: number
}

export default function MenuComponentePage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  // Rastrear tempo de uso efetivo
  useTempoUso(componente, 'menu')

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [nota, setNota] = useState<NotaBimestre | null>(null)
  const [mostrarSobre, setMostrarSobre] = useState(false)
  const [dadosSobre, setDadosSobre] = useState<{
    professores: { id: string; nome: string; foto_url: string | null; email: string }[]
    alunosFisica: { id: string; nome: string; turma: string; fotoUrl: string | null; notaFinal: number; pontos: number; taxaAcerto: number; colegio: string }[]
    alunosMatematica: { id: string; nome: string; turma: string; fotoUrl: string | null; notaFinal: number; pontos: number; taxaAcerto: number; colegio: string }[]
  } | null>(null)

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    const buscarDados = async () => {
      try {
        const [resUsuario, resNotas] = await Promise.all([
          fetch('/api/usuario'),
          fetch(`/api/notas?componente=${componente}`),
        ])
        const dataUsuario = await resUsuario.json()
        const dataNotas = await resNotas.json()

        if (dataUsuario.sucesso && dataUsuario.usuario) {
          if (!dataUsuario.usuario.componentes.includes(componente)) {
            router.push('/selecionar')
            return
          }
          setUsuario(dataUsuario.usuario)
        } else {
          router.push('/login')
          return
        }

        if (dataNotas.sucesso && dataNotas.bimestre_atual) {
          const b = dataNotas.bimestre_atual
          setNota({
            nota_final: b.nota_final ?? 0,
            nota_acertos: b.nota_acertos ?? 0,
            nota_tempo: b.nota_tempo ?? 0,
            bimestre: b.bimestre ?? 1,
            dias_restantes: b.dias_restantes ?? 0,
          })
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    buscarDados()
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
  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Cor da nota baseada no valor
  const getCorNota = (n: number) => {
    if (n >= 7) return 'var(--success)'
    if (n >= 5) return 'var(--warning)'
    return 'var(--error)'
  }

  // ═══════════════════════════════════════════════════════════
  // GRUPOS DE MENU
  // ═══════════════════════════════════════════════════════════

  // Grupo 1: Aprender & Praticar
  const grupoAprender: MenuItem[] = [
    { icon: FileText, label: 'Teoria', href: `/${componente}/teoria`, description: 'Conteúdos' },
    { icon: BookOpen, label: 'Estudar', href: `/${componente}/estudar`, description: 'Questões', badgeText: 'NOTA', badgeColor: 'var(--success)' },
    { icon: RotateCcw, label: 'Revisar', href: `/${componente}/revisao`, description: 'Erros', badgeText: 'NOTA', badgeColor: 'var(--success)' },
    { icon: Zap, label: 'Desafio', href: `/${componente}/desafio`, description: '5 em 5min', badgeText: 'NOTA', badgeColor: 'var(--success)' },
  ]

  // Grupo 2: Explorar
  const grupoExplorar: MenuItem[] = [
    ...(usuario.nivel === 'EM'
      ? [{ icon: GraduationCap, label: 'Enem', href: `/${componente}/simulado-enem`, description: 'Simulado', badgeText: 'TESTE', badgeColor: 'var(--color-accent)' } as MenuItem]
      : []),
    { icon: Route, label: 'Trilhas', href: `/${componente}/trilhas`, description: 'Sua jornada', badgeText: 'TESTE', badgeColor: 'var(--color-accent)' },
    { icon: Map, label: 'Mapas', href: `/${componente}/mapas`, description: 'Resumos' },
    { icon: Sparkles, label: 'FlashCards', href: `/${componente}/flashcards`, description: 'Quiz rápido', badgeText: 'TESTE', badgeColor: 'var(--color-accent)' },
  ]

  // Grupo 3: Progresso
  const grupoProgresso: MenuItem[] = [
    { icon: Bot, label: 'Tutor IA', href: `/${componente}/tutor`, description: `${isFisica ? 'Newton' : 'Pitágoras'}` },
    { icon: Trophy, label: 'Ranking', href: `/${componente}/ranking`, description: 'Posição' },
    { icon: Medal, label: 'Conquistas', href: `/${componente}/conquistas`, description: '10 níveis' },
  ]

  return (
    <div
      className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]"
      style={{ background: 'var(--bg-base)' }}
    >
      <NavigationRail componente={componente} />

      {/* Header */}
      <header className="page-header">
        <div className="max-w-2xl mx-auto w-full">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-semibold" style={{ color: corPrimaria }}>
                {componente === 'fisica' ? 'Física' : 'Matemática'}
              </h1>
              <span
                className="badge-standard"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                {usuario.turma}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeIconToggle componente={componente} />
              {usuario.componentes.length > 1 && (
                <button
                  onClick={() => router.push('/selecionar')}
                  className="w-9 h-9 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-surface-hover)]"
                  style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                  aria-label="Trocar componente"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-9 h-9 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-surface-hover)]"
                style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                aria-label="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User + Stats */}
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

            <div className="flex gap-2">
              {[
                { icon: Star, value: pontos, label: 'Pontos', color: corPrimaria },
                { icon: Flame, value: sequenciaDias, label: 'Dias', color: 'var(--color-streak)' },
                { icon: Target, value: `${taxaAcerto}%`, label: 'Acerto', color: corPrimaria },
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

          {/* Nota do Bimestre — sempre visível */}
          {nota && (
            <div
              className="mt-3 p-3 rounded-xl flex items-center gap-3"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex items-center gap-2 flex-shrink-0">
                <TrendingUp className="w-4 h-4" style={{ color: getCorNota(nota.nota_final) }} />
                <span
                  className="text-2xl font-bold tabular-nums"
                  style={{ color: getCorNota(nota.nota_final) }}
                >
                  {nota.nota_final.toFixed(1)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Nota {nota.bimestre}º bimestre
                  </span>
                  <span className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                    {nota.dias_restantes}d restantes
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((nota.nota_final / 10) * 100, 100)}%`,
                      background: getCorNota(nota.nota_final),
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-2xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    Acertos: {nota.nota_acertos.toFixed(1)}
                  </span>
                  <span className="text-2xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    Tempo: {nota.nota_tempo.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Progresso do nível — visível e motivador */}
          <div
            className="mt-3 p-3 rounded-xl"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                {nivel.emoji} {nivel.nome}
              </span>
              {proximoNivel ? (
                <span className="text-2xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {pontos} / {proximoNivel.pontos_min} pts
                </span>
              ) : (
                <span className="text-2xs font-medium" style={{ color: corPrimaria }}>
                  Nível máximo!
                </span>
              )}
            </div>
            <div
              className="w-full h-2.5 rounded-full overflow-hidden"
              style={{ background: 'var(--bg-base)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: proximoNivel
                    ? `${Math.min(((pontos - nivel.pontos_min) / (proximoNivel.pontos_min - nivel.pontos_min)) * 100, 100)}%`
                    : '100%',
                  background: corPrimaria,
                }}
              />
            </div>
            {proximoNivel && (
              <p className="text-2xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                Faltam <strong style={{ color: corPrimaria }}>{pontosParaProximo} pts</strong> para {proximoNivel.emoji} {proximoNivel.nome}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-4 space-y-5">

        {/* Grupo 1: Aprender & Praticar */}
        <MenuSection title="Aprender & Praticar" items={grupoAprender} accentColor={corPrimaria} isFisica={isFisica} onNavigate={(href) => router.push(href)} />

        {/* Grupo 2: Explorar */}
        <MenuSection title="Explorar" items={grupoExplorar} accentColor={corPrimaria} isFisica={isFisica} onNavigate={(href) => router.push(href)} />

        {/* Grupo 3: Progresso */}
        <MenuSection title="Progresso" items={grupoProgresso} accentColor={corPrimaria} isFisica={isFisica} onNavigate={(href) => router.push(href)} />

        {/* Sobre o Projeto */}
        <button
          onClick={() => {
            setMostrarSobre(true)
            if (!dadosSobre) {
              fetch('/api/sobre')
                .then(r => r.json())
                .then(data => {
                  if (data.sucesso) {
                    setDadosSobre({ professores: data.professores, alunosDestaque: data.alunosDestaque })
                  }
                })
                .catch(() => {})
            }
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
          }}
        >
          <Info className="w-4 h-4" />
          Sobre o Projeto
        </button>

      </main>

      {/* Modal Sobre o Projeto */}
      {mostrarSobre && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 100 }}
          onClick={() => setMostrarSobre(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Sobre o Projeto
              </h2>
              <button
                onClick={() => setMostrarSobre(false)}
                className="p-1.5 rounded-lg"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>

              {/* Necessidade do Projeto */}
              <div>
                <p className="text-sm leading-relaxed">
                  <strong style={{ color: corPrimaria }}>seu10.com</strong> nasceu da necessidade
                  de tornar o ensino de <strong>Física</strong> e <strong>Matemática</strong> mais acessível,
                  engajante e personalizado. Muitos estudantes enfrentam dificuldades nessas disciplinas
                  e não têm acesso a acompanhamento individualizado. A plataforma usa <strong>gamificação</strong> e{' '}
                  <strong>inteligência artificial</strong> para adaptar o aprendizado ao ritmo de cada aluno,
                  identificando pontos fracos e oferecendo suporte em tempo real.
                </p>
              </div>

              {/* Professor Responsável */}
              {dadosSobre && dadosSobre.professores.length > 0 && (
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                >
                  <p className="font-semibold text-xs mb-3" style={{ color: corPrimaria }}>
                    Professor Responsável
                  </p>
                  {dadosSobre.professores.map((prof) => (
                    <div key={prof.id} className="flex items-center gap-3">
                      <ProfilePhoto
                        fotoUrl={prof.foto_url}
                        nome={prof.nome}
                        size="lg"
                        editable={false}
                        componente={componente}
                      />
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {prof.nome}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Professor de Física e Matemática
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Alunos Destaque */}
              {dadosSobre && dadosSobre.alunosDestaque.length > 0 && (
                <div
                  className="p-3 rounded-xl"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
                >
                  <p className="font-semibold text-xs mb-3" style={{ color: corPrimaria }}>
                    Alunos Destaque — Matemática 2A
                  </p>
                  <div className="space-y-3">
                    {dadosSobre.alunosDestaque.map((aluno, idx) => (
                      <div key={aluno.id} className="flex items-center gap-3">
                        <div className="relative">
                          <ProfilePhoto
                            fotoUrl={aluno.fotoUrl}
                            nome={aluno.nome}
                            size="md"
                            editable={false}
                            componente="matematica"
                          />
                          {idx === 0 && (
                            <span className="absolute -top-1 -right-1 text-sm">🥇</span>
                          )}
                          {idx === 1 && (
                            <span className="absolute -top-1 -right-1 text-sm">🥈</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {aluno.nome.split(' ').slice(0, 2).join(' ')}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Turma {aluno.turma}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold tabular-nums" style={{ color: aluno.notaFinal >= 7 ? 'var(--success)' : aluno.notaFinal >= 5 ? 'var(--warning)' : 'var(--error)' }}>
                            {aluno.notaFinal.toFixed(1)}
                          </p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {aluno.pontos} pts • {aluno.taxaAcerto}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colégios Envolvidos */}
              <div
                className="p-3 rounded-xl"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              >
                <p className="font-semibold text-xs mb-2" style={{ color: corPrimaria }}>
                  Colégios Envolvidos
                </p>
                <ul className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex items-start gap-2">
                    <GraduationCap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: corPrimaria }} />
                    <span><strong>Colégio Estadual Governador Luiz Viana Filho</strong> — Jequié/BA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <GraduationCap className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: corPrimaria }} />
                    <span><strong>Colégio Estadual Luiz Navarro de Brito</strong> — Jequié/BA</span>
                  </li>
                </ul>
              </div>

              {/* Funcionalidades */}
              <div
                className="p-3 rounded-xl"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
              >
                <p className="font-semibold text-xs mb-2" style={{ color: corPrimaria }}>Funcionalidades</p>
                <ul className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <li>• <strong>Tutor IA</strong> — Assistente com câmera, voz e mapas mentais</li>
                  <li>• <strong>Questões</strong> — Centenas de questões por tema e nível</li>
                  <li>• <strong>Simulado ENEM</strong> — Prática no formato da prova</li>
                  <li>• <strong>Trilhas</strong> — Jornadas personalizadas de estudo</li>
                  <li>• <strong>FlashCards & Mapas</strong> — Revisão rápida e visual</li>
                  <li>• <strong>Gamificação</strong> — Pontos, níveis, ranking e conquistas</li>
                  <li>• <strong>Notas</strong> — Acompanhamento bimestral automático</li>
                </ul>
              </div>

              <p className="text-[11px] text-center pt-1" style={{ color: 'var(--text-muted)' }}>
                Desenvolvido para transformar a experiência de aprendizado
                no Ensino Médio público da Bahia.
              </p>
            </div>
          </div>
        </div>
      )}

      <BottomNav componente={componente} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Componente: Seção horizontal de menu
// ═══════════════════════════════════════════════════════════
function MenuSection({
  title,
  items,
  accentColor,
  isFisica,
  onNavigate,
}: {
  title: string
  items: MenuItem[]
  accentColor: string
  isFisica: boolean
  onNavigate: (href: string) => void
}) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
        {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => onNavigate(item.href)}
            className="p-3 rounded-xl text-center transition-all hover:translate-y-[-2px] relative group"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = accentColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)'
            }}
          >
            {item.badgeText && (
              <span
                className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full text-white"
                style={{ background: item.badgeColor || 'var(--color-accent)' }}
              >
                {item.badgeText}
              </span>
            )}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: isFisica ? 'var(--color-fisica-bg-10)' : 'var(--color-matematica-bg-10)' }}
            >
              <item.icon className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {item.label}
            </p>
            <p className="text-2xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {item.description}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}
