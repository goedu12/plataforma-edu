'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Search, Filter, Atom, Calculator, Key, Copy, Check } from 'lucide-react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Loading from '@/components/ui/Loading'
import Toast from '@/components/ui/Toast'
import BackButton from '@/components/ui/BackButton'
import type { Usuario } from '@/types'

// Estado do toast
interface ToastState {
  show: boolean
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

// Estado do modal de nova senha
interface NovaSenhaModal {
  show: boolean
  nomeAluno: string
  senha: string
}

export default function AlunosProfessorPage() {
  const router = useRouter()
  const [alunos, setAlunos] = useState<Usuario[]>([])
  const [turmas, setTurmas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [turmaFiltro, setTurmaFiltro] = useState('')
  const [componenteFiltro, setComponenteFiltro] = useState('')
  const [busca, setBusca] = useState('')
  const [resetando, setResetando] = useState<string | null>(null)

  // Estado do toast para feedback
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' })

  // Estado do modal para exibir nova senha
  const [novaSenhaModal, setNovaSenhaModal] = useState<NovaSenhaModal>({
    show: false,
    nomeAluno: '',
    senha: '',
  })

  // Estado para indicar se a senha foi copiada
  const [copiado, setCopiado] = useState(false)

  // Função para mostrar toast
  const showToast = useCallback((message: string, type: ToastState['type']) => {
    setToast({ show: true, message, type })
  }, [])

  // Função para copiar senha para clipboard
  const copiarSenha = async () => {
    try {
      await navigator.clipboard.writeText(novaSenhaModal.senha)
      setCopiado(true)
      showToast('Senha copiada para a área de transferência!', 'success')
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      showToast('Erro ao copiar senha', 'error')
    }
  }

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

  const handleResetSenha = async (usuarioId: string, nomeAluno: string) => {
    // Usar window.confirm para confirmação (mais seguro que o antigo alert)
    const confirmacao = window.confirm(
      `Deseja gerar uma nova senha temporária para ${nomeAluno}?\n\nA senha atual será substituída.`
    )

    if (!confirmacao) return

    setResetando(usuarioId)
    try {
      const response = await fetch('/api/professor/reset-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId }),
      })

      const data = await response.json()
      if (data.sucesso && data.nova_senha) {
        // Mostrar modal com a nova senha
        setNovaSenhaModal({
          show: true,
          nomeAluno,
          senha: data.nova_senha,
        })
        showToast('Senha temporária gerada com sucesso!', 'success')
      } else {
        showToast(data.erro || 'Erro ao resetar senha', 'error')
      }
    } catch {
      showToast('Erro de conexão ao resetar senha', 'error')
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
    <div className="min-h-screen pb-8" style={{ background: 'var(--bg-base)' }}>
      {/* Header */}
      <header className="mobile-header pb-12" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <BackButton href="/professor/dashboard" />
            <div className="text-center">
              <h1 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Users className="w-5 h-5" />
                Gerenciar Alunos
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{alunos.length} estudantes cadastrados</p>
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
            <Filter className="w-5 h-5 text-slate-500" />
            <span className="font-semibold text-slate-800">Filtros</span>
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
              className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-orange focus:border-transparent bg-white text-slate-800"
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
              className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent-orange focus:border-transparent bg-white text-slate-800"
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
                    <h3 className="font-semibold text-slate-800 truncate">{aluno.nome}</h3>
                    <Badge variant="default" size="sm">
                      {aluno.turma}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{aluno.email}</p>
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
                  onClick={() => handleResetSenha(aluno.id, aluno.nome)}
                  disabled={resetando === aluno.id}
                  className="p-3 text-slate-500 hover:text-accent-orange hover:bg-orange-50 rounded-xl transition-all disabled:opacity-50"
                  title="Gerar nova senha"
                  aria-label={`Gerar nova senha para ${aluno.nome}`}
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
                <Users className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Nenhum aluno encontrado
              </h2>
              <p className="text-slate-600">
                Ajuste os filtros ou importe novos alunos.
              </p>
            </Card>
          )}
        </div>
      </main>

      {/* Modal de Nova Senha */}
      {novaSenhaModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ background: 'var(--bg-surface)' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-titulo"
          >
            <h2
              id="modal-titulo"
              className="text-lg font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Nova Senha Gerada
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Senha temporária para <strong>{novaSenhaModal.nomeAluno}</strong>:
            </p>

            <div
              className="flex items-center gap-2 p-4 rounded-xl mb-4"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <code
                className="flex-1 text-lg font-mono font-bold tracking-wider"
                style={{ color: 'var(--text-primary)' }}
              >
                {novaSenhaModal.senha}
              </code>
              <button
                onClick={copiarSenha}
                className="p-2 rounded-lg transition-colors hover:bg-black/10"
                aria-label="Copiar senha"
              >
                {copiado ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                )}
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              O estudante deverá alterar esta senha no primeiro acesso.
            </p>

            <button
              onClick={() => setNovaSenhaModal({ show: false, nomeAluno: '', senha: '' })}
              className="w-full py-3 px-4 rounded-xl font-semibold transition-colors"
              style={{
                background: 'var(--color-accent)',
                color: 'white',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Toast para feedback */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  )
}
