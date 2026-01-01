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
} from 'lucide-react'
import Card from '@/components/ui/Card'
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center py-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600">Não foi possível carregar as estatísticas.</p>
        </Card>
      </div>
    )
  }

  const menuItems = [
    { icon: Users, label: 'Alunos', href: '/professor/alunos', disponivel: true },
    { icon: Upload, label: 'Importar', href: '/professor/importar', disponivel: true },
    { icon: BarChart3, label: 'Relatórios', href: '#', disponivel: false },
    { icon: Settings, label: 'Config', href: '#', disponivel: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🎓 Dashboard</h1>
            <p className="text-gray-300 text-sm">Plataforma EDU - Professor</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-white/10"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto p-4 lg:p-6">
        {/* Cards de Estatísticas */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Física */}
          <Card className="animate-slide-up">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-fisica-100 flex items-center justify-center">
                <Atom className="w-6 h-6 text-fisica-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-800">Física</h2>
                <p className="text-sm text-gray-500">
                  {stats.fisica.total_estudantes} estudantes
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Respostas</p>
                <p className="font-bold text-lg">{stats.fisica.total_respostas}</p>
              </div>
              <div>
                <p className="text-gray-500">Taxa de Acerto</p>
                <p className="font-bold text-lg">{stats.fisica.taxa_acerto}%</p>
              </div>
              <div>
                <p className="text-gray-500">Ativos (7d)</p>
                <p className="font-bold text-lg">{stats.fisica.ativos_semana}</p>
              </div>
              <div>
                <p className="text-gray-500">Média Pontos</p>
                <p className="font-bold text-lg">{Math.round(stats.fisica.media_pontos)}</p>
              </div>
            </div>
          </Card>

          {/* Matemática */}
          <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-matematica-100 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-matematica-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-800">Matemática</h2>
                <p className="text-sm text-gray-500">
                  {stats.matematica.total_estudantes} estudantes
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Respostas</p>
                <p className="font-bold text-lg">{stats.matematica.total_respostas}</p>
              </div>
              <div>
                <p className="text-gray-500">Taxa de Acerto</p>
                <p className="font-bold text-lg">{stats.matematica.taxa_acerto}%</p>
              </div>
              <div>
                <p className="text-gray-500">Ativos (7d)</p>
                <p className="font-bold text-lg">{stats.matematica.ativos_semana}</p>
              </div>
              <div>
                <p className="text-gray-500">Média Pontos</p>
                <p className="font-bold text-lg">{Math.round(stats.matematica.media_pontos)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Alertas */}
        {stats.alertas.length > 0 && (
          <Card className="mb-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Atenção Necessária
            </h3>
            <div className="space-y-2">
              {stats.alertas.map((alerta, index) => (
                <div
                  key={`${alerta.usuario_id}-${alerta.componente}-${index}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Badge
                    variant={alerta.tipo === 'inativo' ? 'error' : 'warning'}
                    size="sm"
                  >
                    {alerta.tipo === 'inativo' ? '🔴' : '🟡'}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {alerta.nome} ({alerta.turma})
                    </p>
                    <p className="text-sm text-gray-500">{alerta.descricao}</p>
                  </div>
                  <Badge variant={alerta.componente === 'fisica' ? 'fisica' : 'matematica'}>
                    {alerta.componente === 'fisica' ? 'Física' : 'Matemática'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Desempenho por Turma */}
        <Card className="mb-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Desempenho por Turma
          </h3>
          <div className="space-y-3">
            {stats.desempenho_turmas.map((turma, index) => (
              <div key={`${turma.turma}-${turma.componente}`} className="flex items-center gap-4">
                <span className="font-medium text-gray-700 w-16">{turma.turma}</span>
                <Badge variant={turma.componente === 'fisica' ? 'fisica' : 'matematica'} size="sm">
                  {turma.componente === 'fisica' ? '🔬' : '🔢'}
                </Badge>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      turma.componente === 'fisica' ? 'bg-fisica-500' : 'bg-matematica-500'
                    }`}
                    style={{ width: `${turma.media_acerto}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-12 text-right">
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
              interactive={item.disponivel}
              onClick={() => item.disponivel && router.push(item.href)}
              className={`text-center animate-slide-up ${!item.disponivel ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ animationDelay: `${400 + index * 50}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${item.disponivel ? 'bg-gray-100' : 'bg-gray-50'}`}>
                <item.icon className={`w-6 h-6 ${item.disponivel ? 'text-gray-600' : 'text-gray-400'}`} />
              </div>
              <span className={`font-medium ${item.disponivel ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</span>
              {!item.disponivel && (
                <span className="text-xs text-gray-400 block mt-1">Em breve</span>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
