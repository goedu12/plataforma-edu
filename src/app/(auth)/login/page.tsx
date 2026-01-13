'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowRight, Info } from 'lucide-react'
import Button from '@/components/ui/Button'

// Logo estático da plataforma seu10
const LOGO_URL = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/logos/Design%20sem%20nome%20(1).png'

interface Configuracoes {
  nome_plataforma: string
  versao: string
  nome_instituicao: string
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [config, setConfig] = useState<Configuracoes>({
    nome_plataforma: 'seu10',
    versao: '1.0',
    nome_instituicao: 'Colégio Cora Coralina'
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
            nome_instituicao: data.configuracoes.nome_instituicao || 'Colégio Cora Coralina'
          })
        }
      } catch {
        // Usa valores padrão em caso de erro
      }
    }
    buscarConfig()
  }, [])

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
      {/* Header com Logo Dinâmico */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="mx-auto mb-4 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt={config.nome_plataforma}
            className="h-auto max-h-[120px] w-auto"
          />
        </div>
        <p
          className="text-body"
          style={{ color: 'var(--text-secondary)' }}
        >
          {config.nome_instituicao}
        </p>
      </div>

      {/* Login Card */}
      <div
        className="w-full max-w-md p-6 rounded-2xl animate-slide-up"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
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
                placeholder="seunome@turma"
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
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="input pl-12"
                autoComplete="current-password"
                disabled={loading}
              />
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
          className="mt-6 p-4 rounded-xl text-center"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
          }}
        >
          <p
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Primeiro acesso?
          </p>
          <p
            className="text-sm mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span style={{ color: 'var(--color-fisica)' }}>Login:</span> seunomecompleto@turma
          </p>
          <p
            className="text-sm mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span style={{ color: 'var(--color-fisica)' }}>Senha:</span> fornecida pelo professor
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Exemplo: mariasilva@1a
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center animate-fade-in">
        <p
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          {config.nome_plataforma} v{config.versao}
        </p>
      </div>
    </div>
  )
}
