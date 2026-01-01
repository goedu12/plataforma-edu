'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowRight, Info, GraduationCap } from 'lucide-react'
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
    <div className="min-h-screen bg-calm-bg">
      {/* Content */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-2">
            Plataforma EDU
          </h1>
          <p className="text-lg text-text-secondary">
            Colégio Cora Coralina
          </p>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-md animate-slide-up" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Seu Login</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
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
              <label className="label">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
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
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-error text-sm flex items-start gap-3 animate-shake">
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

          {/* Terminal Hint */}
          <div className="mt-6">
            <TerminalCard title="primeiro-acesso.sh">
              <div className="space-y-1">
                <p><span className="text-green-400">$</span> <span className="text-gray-500"># Primeiro acesso?</span></p>
                <p><span className="text-yellow-400">login:</span> seunomecompleto@turma</p>
                <p><span className="text-yellow-400">senha:</span> @estudante</p>
                <p className="text-gray-500 mt-2"># Exemplo: mariasilva@1a</p>
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
              className="inline-flex items-center gap-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              Acesso Professor
            </button>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-sm text-text-muted">
            Plataforma EDU v2.0
          </p>
        </div>
      </div>
    </div>
  )
}
