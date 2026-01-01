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
  Zap,
  ChevronRight,
  Activity,
  Clock,
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
      <div className="min-h-screen bg-koyeb-bg flex items-center justify-center">
        <Card className="text-center py-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-koyeb-dark mb-2">Erro ao carregar</h2>
          <p className="text-gray-600">Não foi possível carregar as estatísticas.</p>
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
    <div className="min-h-screen bg-koyeb-bg">
      {/* Header */}
      <header className="bg-gradient-to-br from-gray-800 to-gray-900 text-white px-4 pt-6 pb-16 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 floating">
            <Atom className="w-20 h-20" />
          </div>
          <div className="absolute bottom-10 left-20 floating-delayed">
            <Calculator className="w-16 h-16" />
          </div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-koyeb-orange to-koyeb-coral flex items-center justify-center shadow-koyeb">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight">Dashboard</h1>
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span>Plataforma EDU • Professor</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-full hover:bg-white/10 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Users className="w-5 h-5 mx-auto mb-1 text-blue-300" />
              <p className="text-2xl font-black">{stats.fisica.total_estudantes + stats.matematica.total_estudantes}</p>
              <p className="text-xs text-white/70 uppercase">Total Alunos</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Activity className="w-5 h-5 mx-auto mb-1 text-green-300" />
              <p className="text-2xl font-black">{stats.fisica.ativos_semana + stats.matematica.ativos_semana}</p>
              <p className="text-xs text-white/70 uppercase">Ativos (7d)</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
              <p className="text-2xl font-black">{Math.round((stats.fisica.taxa_acerto + stats.matematica.taxa_acerto) / 2)}%</p>
              <p className="text-xs text-white/70 uppercase">Média Acerto</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <FileText className="w-5 h-5 mx-auto mb-1 text-purple-300" />
              <p className="text-2xl font-black">{stats.fisica.total_respostas + stats.matematica.total_respostas}</p>
              <p className="text-xs text-white/70 uppercase">Respostas</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 -mt-8 relative z-10 pb-8">
        {/* Cards de Componentes */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Física */}
          <Card className="animate-slide-up group hover:shadow-koyeb-hover transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fisica-400 to-fisica-600 flex items-center justify-center shadow-koyeb group-hover:scale-110 transition-transform duration-300">
                <Atom className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-koyeb-dark uppercase tracking-tight">Física</h2>
                <p className="text-sm text-gray-500">
                  {stats.fisica.total_estudantes} estudantes matriculados
                </p>
              </div>
              <Badge variant="fisica" size="sm">Ativo</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase mb-1">Respostas</p>
                <p className="font-black text-xl text-koyeb-dark">{stats.fisica.total_respostas}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase mb-1">Taxa Acerto</p>
                <p className="font-black text-xl text-fisica-600">{stats.fisica.taxa_acerto}%</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase mb-1">Ativos (7d)</p>
                <p className="font-black text-xl text-koyeb-dark">{stats.fisica.ativos_semana}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase mb-1">Média Pts</p>
                <p className="font-black text-xl text-koyeb-dark">{Math.round(stats.fisica.media_pontos)}</p>
              </div>
            </div>
          </Card>

          {/* Matemática */}
          <Card className="animate-slide-up group hover:shadow-koyeb-hover transition-all duration-300" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-matematica-400 to-matematica-600 flex items-center justify-center shadow-koyeb group-hover:scale-110 transition-transform duration-300">
                <Calculator className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-koyeb-dark uppercase tracking-tight">Matemática</h2>
                <p className="text-sm text-gray-500">
                  {stats.matematica.total_estudantes} estudantes matriculados
                </p>
              </div>
              <Badge variant="matematica" size="sm">Ativo</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase mb-1">Respostas</p>
                <p className="font-black text-xl text-koyeb-dark">{stats.matematica.total_respostas}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase mb-1">Taxa Acerto</p>
                <p className="font-black text-xl text-matematica-600">{stats.matematica.taxa_acerto}%</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase mb-1">Ativos (7d)</p>
                <p className="font-black text-xl text-koyeb-dark">{stats.matematica.ativos_semana}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-gray-500 text-xs uppercase mb-1">Média Pts</p>
                <p className="font-black text-xl text-koyeb-dark">{Math.round(stats.matematica.media_pontos)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Alertas */}
        {stats.alertas.length > 0 && (
          <Card className="mb-6 animate-slide-up border-l-4 border-yellow-500" style={{ animationDelay: '200ms' }}>
            <h3 className="font-bold text-koyeb-dark mb-4 flex items-center gap-2 uppercase tracking-tight">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Atenção Necessária
            </h3>
            <div className="space-y-2">
              {stats.alertas.slice(0, 5).map((alerta, index) => (
                <div
                  key={`${alerta.usuario_id}-${alerta.componente}-${index}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full ${alerta.tipo === 'inativo' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div className="flex-1">
                    <p className="font-medium text-koyeb-dark">
                      {alerta.nome} <span className="text-gray-400">({alerta.turma})</span>
                    </p>
                    <p className="text-sm text-gray-500">{alerta.descricao}</p>
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
          <h3 className="font-bold text-koyeb-dark mb-4 flex items-center gap-2 uppercase tracking-tight">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Desempenho por Turma
          </h3>
          <div className="space-y-3">
            {stats.desempenho_turmas.map((turma) => (
              <div key={`${turma.turma}-${turma.componente}`} className="flex items-center gap-4">
                <span className="font-bold text-koyeb-dark w-12 text-sm">{turma.turma}</span>
                <Badge variant={turma.componente === 'fisica' ? 'fisica' : 'matematica'} size="sm">
                  {turma.componente === 'fisica' ? '⚛️' : '🔢'}
                </Badge>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      turma.componente === 'fisica'
                        ? 'bg-gradient-to-r from-fisica-400 to-fisica-600'
                        : 'bg-gradient-to-r from-matematica-400 to-matematica-600'
                    }`}
                    style={{ width: `${turma.media_acerto}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-koyeb-dark w-12 text-right">
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
              className="animate-slide-up group relative overflow-hidden"
              style={{ animationDelay: `${400 + index * 50}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center ${item.color} shadow-koyeb group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-koyeb-dark text-center uppercase tracking-tight">{item.label}</h3>
              <p className="text-xs text-gray-500 text-center">{item.description}</p>
              <ChevronRight className="w-4 h-4 text-gray-300 absolute right-3 top-1/2 -translate-y-1/2 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
            </Card>
          ))}
        </div>

        {/* Terminal Info */}
        <div className="mt-6 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <TerminalCard title="sistema-status.sh">
            <div className="space-y-1">
              <p><span className="text-green-400">$</span> <span className="text-gray-400">plataforma --status</span></p>
              <p><span className="text-blue-400">INFO:</span> Sistema operacional</p>
              <p><span className="text-yellow-400">ALUNOS:</span> {stats.fisica.total_estudantes + stats.matematica.total_estudantes} cadastrados</p>
              <p><span className="text-green-400">UPTIME:</span> 99.9% disponibilidade</p>
            </div>
          </TerminalCard>
        </div>
      </main>

      {/* Bottom decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-fisica-500 via-koyeb-orange to-matematica-500" />
    </div>
  )
}
