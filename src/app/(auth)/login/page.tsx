'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowRight, Info, GraduationCap } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

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
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(34, 197, 94, 0.15)' }}
        >
          <span
            className="text-2xl font-bold"
            style={{ color: 'var(--color-fisica)' }}
          >
            E
          </span>
        </div>
        <h1
          className="font-display text-3xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Plataforma EDU
        </h1>
        <p
          className="text-body"
          style={{ color: 'var(--text-secondary)' }}
        >
          Colegio Cora Coralina
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
          className="mt-6 p-4 rounded-xl"
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
            Exemplo de login: mariasilva@1a
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center animate-fade-in">
        <p
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          Plataforma EDU v4.0
        </p>
      </div>
    </div>
  )
}
