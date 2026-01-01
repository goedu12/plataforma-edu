'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowRight, Info, GraduationCap, Atom, Calculator, Sparkles, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card, { TerminalCard } from '@/components/ui/Card'
import { AnimatedGrid } from '@/components/ui/AnimatedBackground'

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
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedGrid />

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 floating">
          <div className="w-16 h-16 rounded-2xl bg-fisica-400/20 border border-fisica-400/30 flex items-center justify-center backdrop-blur-sm">
            <Atom className="w-8 h-8 text-fisica-400" />
          </div>
        </div>
        <div className="absolute top-40 right-20 floating-delayed">
          <div className="w-14 h-14 rounded-2xl bg-matematica-300/20 border border-matematica-300/30 flex items-center justify-center backdrop-blur-sm">
            <Calculator className="w-7 h-7 text-matematica-300" />
          </div>
        </div>
        <div className="absolute bottom-32 left-20 floating">
          <div className="w-12 h-12 rounded-full bg-accent-orange/20 border border-accent-orange/30 flex items-center justify-center backdrop-blur-sm">
            <Zap className="w-6 h-6 text-accent-orange" />
          </div>
        </div>
        <div className="absolute bottom-40 right-32 floating-delayed">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-white/50" />
          </div>
        </div>
        <div className="absolute top-1/2 left-1/4 twinkle">
          <div className="w-2 h-2 rounded-full bg-fisica-400" />
        </div>
        <div className="absolute top-1/3 right-1/3 twinkle" style={{ animationDelay: '1s' }}>
          <div className="w-2 h-2 rounded-full bg-matematica-300" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-down">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-surface/80 backdrop-blur-sm rounded-full border border-dark-border mb-6">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-light-secondary">Plataforma Online</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-white mb-4">
            Plataforma<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fisica-400 via-accent-orange to-matematica-300">EDU</span>
          </h1>

          <p className="text-lg text-light-secondary font-medium">
            Colégio Cora Coralina
          </p>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-md animate-slide-up" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Seu Login</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light-muted" />
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
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light-muted" />
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
              <div className="p-4 bg-error/10 border border-error/30 rounded-xl text-error text-sm flex items-start gap-3 animate-shake">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{erro}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="orange"
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
                <p><span className="text-success">$</span> <span className="text-light-muted"># Primeiro acesso?</span></p>
                <p><span className="text-warning">login:</span> seunomecompleto@turma</p>
                <p><span className="text-warning">senha:</span> @estudante</p>
                <p className="text-light-muted mt-2"># Exemplo: mariasilva@1a</p>
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
              className="inline-flex items-center gap-2 text-sm font-medium text-light-muted hover:text-white transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              Acesso Professor
            </button>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-sm text-light-muted font-medium">
            Plataforma EDU v2.0
          </p>
          <p className="text-xs text-light-muted/60 mt-1">
            Next.js + Supabase + Gemini AI
          </p>
        </div>
      </div>

      {/* Bottom decoration - Gradient bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-fisica-400 via-accent-orange to-matematica-300" />
    </div>
  )
}
