'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Search, GraduationCap, Filter, Atom, Calculator, Key } from 'lucide-react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import type { Usuario } from '@/types'

export default function AlunosProfessorPage() {
  const router = useRouter()
  const [alunos, setAlunos] = useState<Usuario[]>([])
  const [turmas, setTurmas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [turmaFiltro, setTurmaFiltro] = useState('')
  const [componenteFiltro, setComponenteFiltro] = useState('')
  const [busca, setBusca] = useState('')
  const [resetando, setResetando] = useState<string | null>(null)

  const buscarAlunos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (turmaFiltro) params.set('turma', turmaFiltro)
      if (componenteFiltro) params.set('componente', componenteFiltro)

      const response = await fetch(`/api/professor/alunos?${params.toString()}`)
      const data = await response.json()

      if (data.sucesso) {
        setAlunos(data.alunos)
        setTurmas(data.turmas)
      } else if (response.status === 403) {
        router.push('/login')
      }
    } catch {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    buscarAlunos()
  }, [turmaFiltro, componenteFiltro])

  const handleResetSenha = async (usuarioId: string) => {
    if (!confirm('Tem certeza que deseja resetar a senha deste aluno para @estudante?')) {
      return
    }

    setResetando(usuarioId)
    try {
      const response = await fetch('/api/professor/reset-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId }),
      })

      const data = await response.json()
      if (data.sucesso) {
        alert('Senha resetada com sucesso!')
      } else {
        alert(data.erro || 'Erro ao resetar senha')
      }
    } catch {
      alert('Erro ao resetar senha')
    } finally {
      setResetando(null)
    }
  }

  const alunosFiltrados = alunos.filter(aluno =>
    aluno.nome.toLowerCase().includes(busca.toLowerCase())
  )

  if (loading && alunos.length === 0) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen bg-calm-bg pb-8">
      {/* Header */}
      <header className="bg-gray-800 text-white px-4 pt-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/professor/dashboard')}
              className="p-2 -ml-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gerenciar Alunos
              </h1>
              <p className="text-sm text-white/70">{alunos.length} estudantes cadastrados</p>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 -mt-8">
        {/* Filtros */}
        <Card className="mb-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-text-muted" />
            <span className="font-semibold text-text-primary">Filtros</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por nome..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <select
              value={turmaFiltro}
              onChange={e => setTurmaFiltro(e.target.value)}
              className="px-4 py-3 border border-calm-border rounded-xl focus:ring-2 focus:ring-accent-orange focus:border-transparent bg-calm-surface text-text-primary"
            >
              <option value="">Todas as turmas</option>
              {turmas.map(t => (
                <option key={t} value={t}>
                  Turma {t}
                </option>
              ))}
            </select>
            <select
              value={componenteFiltro}
              onChange={e => setComponenteFiltro(e.target.value)}
              className="px-4 py-3 border border-calm-border rounded-xl focus:ring-2 focus:ring-accent-orange focus:border-transparent bg-calm-surface text-text-primary"
            >
              <option value="">Todos os componentes</option>
              <option value="fisica">Física</option>
              <option value="matematica">Matemática</option>
            </select>
          </div>
        </Card>

        {/* Lista de Alunos */}
        <div className="space-y-3">
          {alunosFiltrados.map((aluno, index) => (
            <Card
              key={aluno.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center text-white font-bold text-lg">
                  {aluno.nome.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-text-primary truncate">{aluno.nome}</h3>
                    <Badge variant="default" size="sm">
                      {aluno.turma}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-muted truncate">{aluno.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {aluno.componentes.includes('fisica') && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-6 h-6 rounded-lg bg-fisica-50 flex items-center justify-center">
                          <Atom className="w-3.5 h-3.5 text-fisica-500" />
                        </div>
                        <span className="font-medium text-fisica-500">{aluno.fis_pontos} pts</span>
                      </div>
                    )}
                    {aluno.componentes.includes('matematica') && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-6 h-6 rounded-lg bg-matematica-50 flex items-center justify-center">
                          <Calculator className="w-3.5 h-3.5 text-matematica-500" />
                        </div>
                        <span className="font-medium text-matematica-500">{aluno.mat_pontos} pts</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => handleResetSenha(aluno.id)}
                  disabled={resetando === aluno.id}
                  className="p-3 text-text-muted hover:text-accent-orange hover:bg-orange-50 rounded-xl transition-all disabled:opacity-50"
                  title="Resetar senha"
                >
                  {resetando === aluno.id ? (
                    <Loading size="sm" />
                  ) : (
                    <Key className="w-5 h-5" />
                  )}
                </button>
              </div>
            </Card>
          ))}

          {alunosFiltrados.length === 0 && (
            <Card className="text-center py-10 animate-slide-up">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-calm-elevated">
                <Users className="w-8 h-8 text-text-muted" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Nenhum aluno encontrado
              </h2>
              <p className="text-text-secondary">
                Ajuste os filtros ou importe novos alunos.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
