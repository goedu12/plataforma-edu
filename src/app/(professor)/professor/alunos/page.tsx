'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  Filter,
  Atom,
  Calculator,
  Key,
  Copy,
  Check,
  UserPlus,
  X,
  Loader2,
} from 'lucide-react'
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

// Estado do modal de novo aluno
interface NovoAlunoModal {
  show: boolean
  nome: string
  turma: string
  colegio: string
  componentes: string[]
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
  const [criandoAluno, setCriandoAluno] = useState(false)

  // Estado do toast para feedback
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' })

  // Estado do modal para exibir nova senha
  const [novaSenhaModal, setNovaSenhaModal] = useState<NovaSenhaModal>({
    show: false,
    nomeAluno: '',
    senha: '',
  })

  // Estado do modal para criar novo aluno
  const [novoAlunoModal, setNovoAlunoModal] = useState<NovoAlunoModal>({
    show: false,
    nome: '',
    turma: '',
    colegio: '',
    componentes: ['fisica', 'matematica'],
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

  const handleCriarAluno = async () => {
    if (!novoAlunoModal.nome.trim()) {
      showToast('Digite o nome do estudante', 'warning')
      return
    }
    if (!novoAlunoModal.turma.trim()) {
      showToast('Digite a turma', 'warning')
      return
    }
    if (novoAlunoModal.componentes.length === 0) {
      showToast('Selecione pelo menos um componente', 'warning')
      return
    }

    setCriandoAluno(true)
    try {
      const response = await fetch('/api/professor/alunos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: novoAlunoModal.nome,
          turma: novoAlunoModal.turma,
          colegio: novoAlunoModal.colegio || null,
          componentes: novoAlunoModal.componentes,
        }),
      })

      const data = await response.json()
      if (data.sucesso) {
        // Fechar modal de criação e abrir modal com senha
        setNovoAlunoModal({
          show: false,
          nome: '',
          turma: '',
          colegio: '',
          componentes: ['fisica', 'matematica'],
        })
        setNovaSenhaModal({
          show: true,
          nomeAluno: data.aluno.nome,
          senha: data.senha_temporaria,
        })
        showToast(data.mensagem, 'success')
        buscarAlunos() // Recarregar lista
      } else {
        showToast(data.erro || 'Erro ao criar estudante', 'error')
      }
    } catch {
      showToast('Erro de conexão', 'error')
    } finally {
      setCriandoAluno(false)
    }
  }

  const toggleComponente = (comp: string) => {
    setNovoAlunoModal(prev => ({
      ...prev,
      componentes: prev.componentes.includes(comp)
        ? prev.componentes.filter(c => c !== comp)
        : [...prev.componentes, comp],
    }))
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
            {/* Botão Novo Aluno */}
            <button
              onClick={() => setNovoAlunoModal(prev => ({ ...prev, show: true }))}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Novo Aluno</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-6xl mx-auto px-4 -mt-8">
        {/* Filtros */}
        <Card className="mb-4 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Filtros</span>
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
              className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)' }}
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
              className="px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)' }}
            >
              <option value="">Todos os componentes</option>
              <option value="fisica">Física</option>
              <option value="matematica">Matemática</option>
            </select>
          </div>
        </Card>

        {/* Lista de Alunos */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {alunosFiltrados.map((aluno, index) => (
            <Card
              key={aluno.id}
              className="animate-slide-up hover:shadow-lg transition-shadow"
              style={{ animationDelay: `${index * 20}ms` }}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                  style={{
                    background: aluno.componentes.includes('fisica')
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  }}
                >
                  {aluno.nome.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate text-sm" style={{ color: 'var(--text-primary)' }}>{aluno.nome}</h3>
                    <Badge variant="default" size="sm">
                      {aluno.turma}
                    </Badge>
                  </div>
                  <p className="text-xs truncate mb-2" style={{ color: 'var(--text-tertiary)' }}>{aluno.email}</p>
                  <div className="flex items-center gap-3">
                    {aluno.componentes.includes('fisica') && (
                      <div className="flex items-center gap-1 text-xs">
                        <Atom className="w-4 h-4 text-green-500" />
                        <span className="font-semibold text-green-600">{aluno.fis_pontos}</span>
                      </div>
                    )}
                    {aluno.componentes.includes('matematica') && (
                      <div className="flex items-center gap-1 text-xs">
                        <Calculator className="w-4 h-4 text-purple-500" />
                        <span className="font-semibold text-purple-600">{aluno.mat_pontos}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reset button */}
                <button
                  onClick={() => handleResetSenha(aluno.id, aluno.nome)}
                  disabled={resetando === aluno.id}
                  className="p-2 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all disabled:opacity-50"
                  style={{ color: 'var(--text-muted)' }}
                  title="Gerar nova senha"
                  aria-label={`Gerar nova senha para ${aluno.nome}`}
                >
                  {resetando === aluno.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Key className="w-5 h-5" />
                  )}
                </button>
              </div>
            </Card>
          ))}

          {alunosFiltrados.length === 0 && (
            <Card className="text-center py-10 animate-slide-up col-span-full">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                <Users className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                Nenhum aluno encontrado
              </h2>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                Ajuste os filtros ou adicione novos alunos.
              </p>
              <button
                onClick={() => setNovoAlunoModal(prev => ({ ...prev, show: true }))}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Adicionar Aluno
              </button>
            </Card>
          )}
        </div>
      </main>

      {/* Modal de Novo Aluno */}
      {novoAlunoModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ background: 'var(--bg-surface)' }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Novo Estudante
              </h2>
              <button
                onClick={() => setNovoAlunoModal(prev => ({ ...prev, show: false }))}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={novoAlunoModal.nome}
                  onChange={e => setNovoAlunoModal(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: João Silva Santos"
                  className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Turma */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Turma *
                </label>
                <input
                  type="text"
                  value={novoAlunoModal.turma}
                  onChange={e => setNovoAlunoModal(prev => ({ ...prev, turma: e.target.value.toUpperCase() }))}
                  placeholder="Ex: 2A, 3B"
                  className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Colégio (opcional) */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Colégio (opcional)
                </label>
                <input
                  type="text"
                  value={novoAlunoModal.colegio}
                  onChange={e => setNovoAlunoModal(prev => ({ ...prev, colegio: e.target.value }))}
                  placeholder="Nome do colégio"
                  className="w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Componentes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Componentes *
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => toggleComponente('fisica')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      novoAlunoModal.componentes.includes('fisica')
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : ''
                    }`}
                    style={novoAlunoModal.componentes.includes('fisica') ? {} : { borderColor: 'var(--border-default)', color: 'var(--text-tertiary)' }}
                  >
                    <Atom className="w-5 h-5" />
                    Física
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleComponente('matematica')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                      novoAlunoModal.componentes.includes('matematica')
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : ''
                    }`}
                    style={novoAlunoModal.componentes.includes('matematica') ? {} : { borderColor: 'var(--border-default)', color: 'var(--text-tertiary)' }}
                  >
                    <Calculator className="w-5 h-5" />
                    Matemática
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setNovoAlunoModal(prev => ({ ...prev, show: false }))}
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-colors"
                style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCriarAluno}
                disabled={criandoAluno}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {criandoAluno ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Criar Estudante
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
              Senha Gerada
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Senha temporária para <strong>{novaSenhaModal.nomeAluno}</strong>:
            </p>

            <div
              className="flex items-center gap-2 p-4 rounded-xl mb-4"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <code
                className="flex-1 text-2xl font-mono font-bold tracking-widest text-center"
                style={{ color: 'var(--text-primary)' }}
              >
                {novaSenhaModal.senha}
              </code>
              <button
                onClick={copiarSenha}
                className="p-3 rounded-lg transition-colors hover:bg-black/10"
                aria-label="Copiar senha"
              >
                {copiado ? (
                  <Check className="w-6 h-6 text-green-500" />
                ) : (
                  <Copy className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                )}
              </button>
            </div>

            <p className="text-xs mb-4 text-center" style={{ color: 'var(--text-muted)' }}>
              O estudante deverá alterar esta senha no primeiro acesso.
            </p>

            <button
              onClick={() => setNovaSenhaModal({ show: false, nomeAluno: '', senha: '' })}
              className="w-full py-3 px-4 rounded-xl font-semibold transition-colors bg-green-500 hover:bg-green-600 text-white"
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
