'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, ArrowRight, Info, GraduationCap, Atom, Calculator } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
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
    <div className="min-h-screen bg-koyeb-bg bg-grid relative overflow-hidden">
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 floating">
          <div className="w-16 h-16 rounded-2xl bg-fisica-500/10 flex items-center justify-center">
            <Atom className="w-8 h-8 text-fisica-500" />
          </div>
        </div>
        <div className="absolute top-40 right-20 floating-delayed">
          <div className="w-14 h-14 rounded-2xl bg-matematica-500/10 flex items-center justify-center">
            <Calculator className="w-7 h-7 text-matematica-500" />
          </div>
        </div>
        <div className="absolute bottom-32 left-20 floating">
          <div className="w-12 h-12 rounded-full bg-koyeb-orange/10 flex items-center justify-center">
            <span className="text-2xl">+</span>
          </div>
        </div>
        <div className="absolute bottom-40 right-32 floating-delayed">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-xl font-bold text-gray-400">=</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="text-center mb-10 animate-slide-down">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-koyeb mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-600">Plataforma Online</span>
          </div>

          <h1 className="heading-display text-koyeb-dark mb-4">
            Plataforma<br />
            <span className="text-gradient bg-gradient-to-r from-fisica-500 to-matematica-500">EDU</span>
          </h1>

          <p className="text-lg text-gray-600 font-medium">
            Colégio Cora Coralina
          </p>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-md animate-slide-up" padding="lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Seu Login</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3 animate-shake">
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
                <p><span className="text-green-400">$</span> <span className="text-gray-400"># Primeiro acesso?</span></p>
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
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-koyeb-dark transition-colors animated-underline"
            >
              <GraduationCap className="w-4 h-4" />
              Acesso Professor
            </button>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-sm text-gray-400 font-medium">
            Plataforma EDU v1.0
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Desenvolvido com Next.js + Supabase + Gemini AI
          </p>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-fisica-500 via-koyeb-orange to-matematica-500" />
    </div>
  )
}
