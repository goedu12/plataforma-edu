'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Search, RotateCcw, Star, GraduationCap, Filter, Atom, Calculator, Key } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
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
    <div className="min-h-screen bg-koyeb-bg pb-8">
      {/* Header */}
      <header className="bg-gradient-to-br from-gray-800 to-gray-900 text-white px-4 pt-4 pb-16 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <GraduationCap className="absolute top-8 right-8 w-20 h-20 floating" />
          <Users className="absolute bottom-8 left-12 w-16 h-16 floating-delayed" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/professor/dashboard')}
              className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1 className="font-bold uppercase tracking-tight flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gerenciar Alunos
              </h1>
              <p className="text-xs text-white/70">{alunos.length} estudantes cadastrados</p>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 -mt-8 relative z-10">
        {/* Filtros */}
        <Card className="mb-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="font-bold text-koyeb-dark uppercase text-sm tracking-tight">Filtros</span>
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
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-koyeb-orange focus:border-transparent bg-white text-koyeb-dark font-medium"
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
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-koyeb-orange focus:border-transparent bg-white text-koyeb-dark font-medium"
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
              className="animate-slide-up group hover:shadow-koyeb-hover transition-all duration-300"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-lg shadow-koyeb">
                  {aluno.nome.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-koyeb-dark truncate">{aluno.nome}</h3>
                    <Badge variant="default" size="sm">
                      {aluno.turma}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{aluno.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {aluno.componentes.includes('fisica') && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-6 h-6 rounded-lg bg-fisica-100 flex items-center justify-center">
                          <Atom className="w-3.5 h-3.5 text-fisica-600" />
                        </div>
                        <span className="font-bold text-fisica-600">{aluno.fis_pontos} pts</span>
                      </div>
                    )}
                    {aluno.componentes.includes('matematica') && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-6 h-6 rounded-lg bg-matematica-100 flex items-center justify-center">
                          <Calculator className="w-3.5 h-3.5 text-matematica-600" />
                        </div>
                        <span className="font-bold text-matematica-600">{aluno.mat_pontos} pts</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => handleResetSenha(aluno.id)}
                  disabled={resetando === aluno.id}
                  className="p-3 text-gray-400 hover:text-koyeb-orange hover:bg-koyeb-orange/10 rounded-xl transition-all disabled:opacity-50"
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
              <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-gray-100">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-black text-koyeb-dark mb-2 uppercase tracking-tight">
                Nenhum aluno encontrado
              </h2>
              <p className="text-gray-600">
                Ajuste os filtros ou importe novos alunos.
              </p>
            </Card>
          )}
        </div>
      </main>

      {/* Bottom decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-fisica-500 via-koyeb-orange to-matematica-500" />
    </div>
  )
}
