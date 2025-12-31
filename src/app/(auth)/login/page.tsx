'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, User, Lock, LogIn, Info, GraduationCap } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-fisica-500 to-matematica-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <BookOpen className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Plataforma EDU</h1>
        <p className="text-gray-500">Colégio Cora Coralina</p>
      </div>

      {/* Formulário */}
      <Card className="w-full max-w-md animate-slide-up">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Seu login"
            placeholder="seunome@turma"
            value={email}
            onChange={e => setEmail(e.target.value)}
            leftIcon={<User className="w-5 h-5" />}
            autoComplete="username"
            disabled={loading}
          />

          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            leftIcon={<Lock className="w-5 h-5" />}
            autoComplete="current-password"
            disabled={loading}
          />

          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            leftIcon={<LogIn className="w-5 h-5" />}
          >
            Entrar
          </Button>
        </form>

        {/* Dica de primeiro acesso */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Primeiro acesso?</p>
              <p>
                <strong>Login:</strong> seunomecompleto@turma
              </p>
              <p>
                <strong>Senha:</strong> @estudante
              </p>
              <p className="mt-2 text-xs text-blue-600">
                Exemplo: mariasilva@1a
              </p>
            </div>
          </div>
        </div>

        {/* Link para professor */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setEmail('professor@admin')
              setSenha('')
            }}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-2 mx-auto"
          >
            <GraduationCap className="w-4 h-4" />
            Sou Professor
          </button>
        </div>
      </Card>

      {/* Footer */}
      <p className="mt-6 text-xs text-gray-400">
        Plataforma EDU v1.0 - Prof. Leonardo
      </p>
    </div>
  )
}
