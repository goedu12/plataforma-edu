'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowRight, Info, Eye, EyeOff, HelpCircle, Search, X, School, Users, BookOpen } from 'lucide-react'
import Button from '@/components/ui/Button'

// Logo estático da plataforma seu10
const LOGO_URL = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/logos/Design%20sem%20nome%20(1).png'

interface Configuracoes {
  nome_plataforma: string
  versao: string
  nome_instituicao: string
}

interface Estudante {
  nome: string
  turma: string
  login: string
  componente: string
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mostrarAjuda, setMostrarAjuda] = useState(false)
  const [buscaNome, setBuscaNome] = useState('')
  const [turmaSelecionada, setTurmaSelecionada] = useState('')
  const [estudantes, setEstudantes] = useState<Estudante[]>([])
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<string[]>([])
  const [carregandoEstudantes, setCarregandoEstudantes] = useState(false)
  const [config, setConfig] = useState<Configuracoes>({
    nome_plataforma: 'seu10',
    versao: '1.0',
    nome_instituicao: ''
  })

  // Buscar configurações da plataforma
  useEffect(() => {
    const buscarConfig = async () => {
      try {
        const response = await fetch('/api/config')
        const data = await response.json()
        if (data.sucesso && data.configuracoes) {
          setConfig({
            nome_plataforma: data.configuracoes.nome_plataforma || 'seu10',
            versao: data.configuracoes.versao || '1.0',
            nome_instituicao: data.configuracoes.nome_instituicao || ''
          })
        }
      } catch {
        // Usa valores padrão em caso de erro
      }
    }
    buscarConfig()
  }, [])

  // Buscar lista de estudantes quando abrir modal de ajuda
  const buscarEstudantes = async () => {
    if (estudantes.length > 0) return // Já carregou

    setCarregandoEstudantes(true)
    try {
      const response = await fetch('/api/auth/listar-logins')
      const data = await response.json()
      if (data.sucesso) {
        setEstudantes(data.estudantes || [])
        // Extrair turmas únicas
        const turmas = [...new Set(data.estudantes.map((e: Estudante) => e.turma))].sort()
        setTurmasDisponiveis(turmas as string[])
      }
    } catch {
      // Silenciar erro
    } finally {
      setCarregandoEstudantes(false)
    }
  }

  const abrirAjuda = () => {
    setMostrarAjuda(true)
    buscarEstudantes()
  }

  // Filtrar estudantes pela busca e turma
  const estudantesFiltrados = estudantes.filter(e => {
    const matchNome = buscaNome === '' || e.nome.toLowerCase().includes(buscaNome.toLowerCase())
    const matchTurma = turmaSelecionada === '' || e.turma === turmaSelecionada
    return matchNome && matchTurma
  }).slice(0, 20) // Limitar a 20 resultados

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')

    // Validação de campos
    if (!email.trim()) {
      setErro('Digite seu login')
      return
    }
    if (!senha) {
      setErro('Digite sua senha')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })

      const data = await response.json()

      if (data.sucesso) {
        router.push(data.redirecionarPara)
      } else {
        setErro(data.erro || 'Erro ao fazer login')
      }
    } catch {
      setErro('Erro de conexao. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Header com Logo */}
      <div className="text-center mb-4 animate-fade-in">
        <div className="mx-auto flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt={config.nome_plataforma}
            className="h-auto max-h-[80px] w-auto"
          />
        </div>
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-md p-6 rounded-2xl animate-slide-up"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="text-label block mb-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Seu Login
            </label>
            <div className="relative">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--text-tertiary)' }}
              />
              <input
                type="text"
                placeholder="primeironome.ultimonome@turma"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input pl-12"
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label
              className="text-label block mb-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Senha
            </label>
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--text-tertiary)' }}
              />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="input pl-12 pr-12"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-black/10"
                style={{ color: 'var(--text-tertiary)' }}
                tabIndex={-1}
              >
                {mostrarSenha ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {erro && (
            <div
              className="p-4 rounded-xl flex items-start gap-3 animate-fade-in"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <Info
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: 'var(--error)' }}
              />
              <span
                className="text-sm"
                style={{ color: 'var(--error)' }}
              >
                {erro}
              </span>
            </div>
          )}

          <Button
            type="submit"
            variant="fisica"
            loading={loading}
            className="w-full"
            size="lg"
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Entrar
          </Button>
        </form>

        {/* Help Box */}
        <div
          className="mt-5 p-4 rounded-xl text-center"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
          }}
        >
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Primeiro acesso?
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span style={{ color: 'var(--color-fisica)' }}>Login:</span> primeironome.ultimonome@turma
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span style={{ color: 'var(--color-fisica)' }}>Senha:</span> fornecida pelo professor
          </p>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Ex: maria.silva@1a
          </p>

          {/* Link sutil para verificar login */}
          <button
            type="button"
            onClick={abrirAjuda}
            className="mt-3 text-xs flex items-center justify-center gap-1 mx-auto transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            <HelpCircle className="w-3 h-3" />
            <span>Nao sabe seu login? Clique aqui</span>
          </button>
        </div>
      </div>

      {/* Modal de Ajuda - Lista de Logins */}
      {mostrarAjuda && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setMostrarAjuda(false)}
        >
          <div
            className="w-full max-w-lg max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
            style={{ background: 'var(--bg-surface)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div
              className="p-4 flex items-center justify-between border-b"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="flex items-center gap-2">
                <School className="w-5 h-5" style={{ color: 'var(--color-fisica)' }} />
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Encontre seu Login
                </h2>
              </div>
              <button
                onClick={() => setMostrarAjuda(false)}
                className="p-2 rounded-lg transition-colors hover:bg-black/10"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filtros */}
            <div className="p-4 space-y-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
              {/* Seletor de Turma */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <select
                  value={turmaSelecionada}
                  onChange={e => setTurmaSelecionada(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Todas as turmas</option>
                  {turmasDisponiveis.map(turma => (
                    <option key={turma} value={turma}>{turma}</option>
                  ))}
                </select>
              </div>

              {/* Busca por nome */}
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={buscaNome}
                  onChange={e => setBuscaNome(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Selecione sua turma e busque pelo seu nome para encontrar seu login.
              </p>
            </div>

            {/* Lista de Estudantes */}
            <div className="flex-1 overflow-y-auto p-4">
              {carregandoEstudantes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-fisica)' }} />
                </div>
              ) : estudantesFiltrados.length > 0 ? (
                <div className="space-y-2">
                  {estudantesFiltrados.map((estudante, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-xl"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {estudante.nome}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{ background: 'var(--color-fisica)20', color: 'var(--color-fisica)' }}
                            >
                              {estudante.turma}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {estudante.componente === 'fisica' ? 'Fisica' : 'Matematica'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Login:</p>
                          <p
                            className="text-sm font-mono font-medium"
                            style={{ color: 'var(--color-fisica)' }}
                          >
                            {estudante.login}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {buscaNome || turmaSelecionada
                      ? 'Nenhum estudante encontrado'
                      : 'Selecione uma turma ou busque pelo nome'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div
              className="p-4 border-t text-center"
              style={{ borderColor: 'var(--border-default)', background: 'var(--bg-elevated)' }}
            >
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                A senha e fornecida pelo professor. Caso nao lembre, solicite uma nova.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-center animate-fade-in">
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--text-tertiary)' }}
        >
          seu10.com
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: 'var(--text-muted)' }}
        >
          versão {config.versao}
        </p>
      </div>
    </div>
  )
}
