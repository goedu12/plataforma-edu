'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowRight, Info, GraduationCap, Terminal } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { TerminalCard } from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
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
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-pattern bg-grid">
      {/* Content */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center">
              <Terminal className="w-6 h-6 text-accent-green" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-2">
            Plataforma EDU
          </h1>
          <p className="text-lg text-text-secondary">
            Colégio Cora Coralina
          </p>
        </div>

        {/* Login Card - Koyeb Dark Style */}
        <Card className="w-full max-w-md animate-slide-up" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                Seu Login
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="seunome@turma"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="
                    w-full pl-12 pr-4 py-3
                    bg-dark-surface border border-border rounded-xl
                    text-text-primary text-base placeholder:text-text-tertiary
                    transition-all duration-200 outline-none
                    hover:border-border-hover
                    focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green focus:bg-dark-elevated
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="
                    w-full pl-12 pr-4 py-3
                    bg-dark-surface border border-border rounded-xl
                    text-text-primary text-base placeholder:text-text-tertiary
                    transition-all duration-200 outline-none
                    hover:border-border-hover
                    focus:ring-2 focus:ring-accent-green/50 focus:border-accent-green focus:bg-dark-elevated
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            {erro && (
              <div className="p-4 bg-error/10 border border-error/30 rounded-xl text-error text-sm flex items-start gap-3 animate-shake">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
              size="lg"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Entrar
            </Button>
          </form>

          {/* Terminal Hint - Koyeb Style */}
          <div className="mt-6">
            <TerminalCard title="primeiro-acesso.sh">
              <div className="space-y-1">
                <p>
                  <span className="text-accent-green">$</span>
                  <span className="text-text-comment"> # Primeiro acesso?</span>
                </p>
                <p>
                  <span className="text-warning">login:</span>
                  <span className="text-text-secondary"> seunomecompleto@turma</span>
                </p>
                <p>
                  <span className="text-warning">senha:</span>
                  <span className="text-text-secondary"> @estudante</span>
                </p>
                <p className="text-text-comment mt-2"># Exemplo: mariasilva@1a</p>
              </div>
            </TerminalCard>
          </div>

          {/* Professor Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setEmail('professor@admin')
                setSenha('')
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              <span className="uppercase tracking-wider">Acesso Professor</span>
            </button>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-sm text-text-tertiary uppercase tracking-wider">
            Plataforma EDU v2.0
          </p>
        </div>
      </div>
    </div>
  )
}
