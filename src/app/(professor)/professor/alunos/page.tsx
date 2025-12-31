'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Search, RotateCcw, Star, CheckCircle2 } from 'lucide-react'
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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/professor/dashboard')}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Alunos
          </h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Filtros */}
      <div className="max-w-6xl mx-auto p-4">
        <Card className="mb-4">
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
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as turmas</option>
              {turmas.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={componenteFiltro}
              onChange={e => setComponenteFiltro(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os componentes</option>
              <option value="fisica">Física</option>
              <option value="matematica">Matemática</option>
            </select>
          </div>
        </Card>

        {/* Lista de Alunos */}
        <div className="space-y-2">
          {alunosFiltrados.map(aluno => (
            <Card key={aluno.id} className="animate-fade-in">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-800 truncate">{aluno.nome}</h3>
                    <Badge variant="default" size="sm">
                      {aluno.turma}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">{aluno.email}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    {aluno.componentes.includes('fisica') && (
                      <span className="flex items-center gap-1 text-fisica-600">
                        <Star className="w-3 h-3" />
                        Física: {aluno.fis_pontos} pts
                      </span>
                    )}
                    {aluno.componentes.includes('matematica') && (
                      <span className="flex items-center gap-1 text-matematica-600">
                        <Star className="w-3 h-3" />
                        Mat: {aluno.mat_pontos} pts
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleResetSenha(aluno.id)}
                  disabled={resetando === aluno.id}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  title="Resetar senha"
                >
                  {resetando === aluno.id ? (
                    <Loading size="sm" />
                  ) : (
                    <RotateCcw className="w-5 h-5" />
                  )}
                </button>
              </div>
            </Card>
          ))}

          {alunosFiltrados.length === 0 && (
            <Card className="text-center py-8">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Nenhum aluno encontrado
              </h2>
              <p className="text-gray-600">
                Ajuste os filtros ou importe novos alunos.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
