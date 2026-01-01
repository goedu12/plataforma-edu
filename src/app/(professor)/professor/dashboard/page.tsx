'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  AlertCircle,
  TrendingUp,
  Atom,
  Calculator,
  Upload,
  ChevronRight,
  Activity,
  Target,
} from 'lucide-react'
import Card, { TerminalCard } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import type { EstatisticasProfessor } from '@/types'

export default function DashboardProfessorPage() {
  const router = useRouter()
  const [stats, setStats] = useState<EstatisticasProfessor | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const buscarEstatisticas = async () => {
      try {
        const response = await fetch('/api/professor/estatisticas')
        const data = await response.json()

        if (data.sucesso) {
          setStats(data)
        } else if (response.status === 403) {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    buscarEstatisticas()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return <Loading fullScreen />
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-calm-bg flex items-center justify-center">
        <Card className="text-center py-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Erro ao carregar</h2>
          <p className="text-text-secondary">Não foi possível carregar as estatísticas.</p>
        </Card>
      </div>
    )
  }

  const menuItems = [
    { icon: Users, label: 'Alunos', href: '/professor/alunos', description: 'Gerenciar estudantes', color: 'bg-blue-500' },
    { icon: Upload, label: 'Importar', href: '/professor/importar', description: 'Adicionar questões', color: 'bg-green-500' },
    { icon: BarChart3, label: 'Relatórios', href: '/professor/relatorios', description: 'Ver estatísticas', color: 'bg-purple-500' },
    { icon: Settings, label: 'Config', href: '/professor/config', description: 'Configurações', color: 'bg-gray-500' },
  ]

  return (
    <div className="min-h-screen bg-calm-bg">
      {/* Header */}
      <header className="bg-gray-800 text-white px-4 pt-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-orange flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">Dashboard</h1>
                <p className="text-white/70 text-sm">Plataforma EDU • Professor</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl hover:bg-white/10 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-blue-300" />
              <p className="text-xl font-bold">{stats.fisica.total_estudantes + stats.matematica.total_estudantes}</p>
              <p className="text-xs text-white/70">Total Alunos</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Activity className="w-5 h-5 mx-auto mb-1 text-green-300" />
              <p className="text-xl font-bold">{stats.fisica.ativos_semana + stats.matematica.ativos_semana}</p>
              <p className="text-xs text-white/70">Ativos (7d)</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
              <p className="text-xl font-bold">{Math.round((stats.fisica.taxa_acerto + stats.matematica.taxa_acerto) / 2)}%</p>
              <p className="text-xs text-white/70">Média Acerto</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <FileText className="w-5 h-5 mx-auto mb-1 text-purple-300" />
              <p className="text-xl font-bold">{stats.fisica.total_respostas + stats.matematica.total_respostas}</p>
              <p className="text-xs text-white/70">Respostas</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 -mt-8 pb-8">
        {/* Cards de Componentes */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Física */}
          <Card className="animate-slide-up" variant="fisica">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-fisica-500 flex items-center justify-center">
                <Atom className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg text-text-primary">Física</h2>
                <p className="text-sm text-text-secondary">
                  {stats.fisica.total_estudantes} estudantes matriculados
                </p>
              </div>
              <Badge variant="fisica" size="sm">Ativo</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-calm-elevated rounded-xl p-3 text-center">
                <p className="text-text-muted text-xs mb-1">Respostas</p>
                <p className="font-bold text-lg text-text-primary">{stats.fisica.total_respostas}</p>
              </div>
              <div className="bg-calm-elevated rounded-xl p-3 text-center">
                <p className="text-text-muted text-xs mb-1">Taxa Acerto</p>
                <p className="font-bold text-lg text-fisica-500">{stats.fisica.taxa_acerto}%</p>
              </div>
              <div className="bg-calm-elevated rounded-xl p-3 text-center">
                <p className="text-text-muted text-xs mb-1">Ativos (7d)</p>
                <p className="font-bold text-lg text-text-primary">{stats.fisica.ativos_semana}</p>
              </div>
              <div className="bg-calm-elevated rounded-xl p-3 text-center">
                <p className="text-text-muted text-xs mb-1">Média Pts</p>
                <p className="font-bold text-lg text-text-primary">{Math.round(stats.fisica.media_pontos)}</p>
              </div>
            </div>
          </Card>

          {/* Matemática */}
          <Card className="animate-slide-up" variant="matematica" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-matematica-500 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg text-text-primary">Matemática</h2>
                <p className="text-sm text-text-secondary">
                  {stats.matematica.total_estudantes} estudantes matriculados
                </p>
              </div>
              <Badge variant="matematica" size="sm">Ativo</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-calm-elevated rounded-xl p-3 text-center">
                <p className="text-text-muted text-xs mb-1">Respostas</p>
                <p className="font-bold text-lg text-text-primary">{stats.matematica.total_respostas}</p>
              </div>
              <div className="bg-calm-elevated rounded-xl p-3 text-center">
                <p className="text-text-muted text-xs mb-1">Taxa Acerto</p>
                <p className="font-bold text-lg text-matematica-500">{stats.matematica.taxa_acerto}%</p>
              </div>
              <div className="bg-calm-elevated rounded-xl p-3 text-center">
                <p className="text-text-muted text-xs mb-1">Ativos (7d)</p>
                <p className="font-bold text-lg text-text-primary">{stats.matematica.ativos_semana}</p>
              </div>
              <div className="bg-calm-elevated rounded-xl p-3 text-center">
                <p className="text-text-muted text-xs mb-1">Média Pts</p>
                <p className="font-bold text-lg text-text-primary">{Math.round(stats.matematica.media_pontos)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Alertas */}
        {stats.alertas.length > 0 && (
          <Card className="mb-6 animate-slide-up border-l-4 border-warning" style={{ animationDelay: '200ms' }}>
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Atenção Necessária
            </h3>
            <div className="space-y-2">
              {stats.alertas.slice(0, 5).map((alerta, index) => (
                <div
                  key={`${alerta.usuario_id}-${alerta.componente}-${index}`}
                  className="flex items-center gap-3 p-3 bg-calm-elevated rounded-xl"
                >
                  <div className={`w-2 h-2 rounded-full ${alerta.tipo === 'inativo' ? 'bg-error' : 'bg-warning'}`} />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">
                      {alerta.nome} <span className="text-text-muted">({alerta.turma})</span>
                    </p>
                    <p className="text-sm text-text-secondary">{alerta.descricao}</p>
                  </div>
                  <Badge variant={alerta.componente === 'fisica' ? 'fisica' : 'matematica'} size="sm">
                    {alerta.componente === 'fisica' ? 'Física' : 'Matemática'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Desempenho por Turma */}
        <Card className="mb-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Desempenho por Turma
          </h3>
          <div className="space-y-3">
            {stats.desempenho_turmas.map((turma) => (
              <div key={`${turma.turma}-${turma.componente}`} className="flex items-center gap-4">
                <span className="font-medium text-text-primary w-12 text-sm">{turma.turma}</span>
                <Badge variant={turma.componente === 'fisica' ? 'fisica' : 'matematica'} size="sm">
                  {turma.componente === 'fisica' ? 'Fís' : 'Mat'}
                </Badge>
                <div className="flex-1 h-2 bg-calm-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      turma.componente === 'fisica' ? 'bg-fisica-500' : 'bg-matematica-500'
                    }`}
                    style={{ width: `${turma.media_acerto}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-text-primary w-12 text-right">
                  {turma.media_acerto}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Menu Rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {menuItems.map((item, index) => (
            <Card
              key={item.label}
              interactive
              onClick={() => router.push(item.href)}
              className="animate-slide-up group"
              style={{ animationDelay: `${400 + index * 50}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${item.color}`}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-text-primary text-center">{item.label}</h3>
              <p className="text-xs text-text-muted text-center">{item.description}</p>
            </Card>
          ))}
        </div>

        {/* Terminal Info */}
        <div className="mt-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <TerminalCard title="sistema-status.sh">
            <div className="space-y-1">
              <p><span className="text-green-400">$</span> <span className="text-gray-500">plataforma --status</span></p>
              <p><span className="text-blue-400">INFO:</span> Sistema operacional</p>
              <p><span className="text-yellow-400">ALUNOS:</span> {stats.fisica.total_estudantes + stats.matematica.total_estudantes} cadastrados</p>
              <p><span className="text-green-400">UPTIME:</span> 99.9% disponibilidade</p>
            </div>
          </TerminalCard>
        </div>
      </main>
    </div>
  )
}
