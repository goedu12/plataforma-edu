'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Settings,
  Key,
  Shield,
  Info,
  CheckCircle,
  AlertCircle,
  Bot,
  Target,
  Eye,
  EyeOff,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import { PONTUACAO } from '@/types'

export default function ConfigProfessorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const [professor, setProfessor] = useState<{ nome: string; email: string } | null>(null)

  // Alteração de senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)

  useEffect(() => {
    const buscarProfessor = async () => {
      try {
        const response = await fetch('/api/usuario')
        const data = await response.json()

        if (data.sucesso && data.usuario) {
          setProfessor({
            nome: data.usuario.nome,
            email: data.usuario.email,
          })
        } else {
          router.push('/login')
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    buscarProfessor()
  }, [router])

  const alterarSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensagem(null)

    // Validações
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'Preencha todos os campos' })
      return
    }

    if (novaSenha.length < 6) {
      setMensagem({ tipo: 'erro', texto: 'A nova senha deve ter pelo menos 6 caracteres' })
      return
    }

    if (novaSenha !== confirmarSenha) {
      setMensagem({ tipo: 'erro', texto: 'As senhas não coincidem' })
      return
    }

    setSalvando(true)

    try {
      const response = await fetch('/api/auth/alterar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senha_atual: senhaAtual,
          nova_senha: novaSenha,
        }),
      })

      const data = await response.json()

      if (data.sucesso) {
        setMensagem({ tipo: 'sucesso', texto: 'Senha alterada com sucesso!' })
        setSenhaAtual('')
        setNovaSenha('')
        setConfirmarSenha('')
      } else {
        setMensagem({ tipo: 'erro', texto: data.erro || 'Erro ao alterar senha' })
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente.' })
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/professor/dashboard')}
            className="flex items-center gap-2 text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Configurações</h1>
              <p className="text-gray-300 text-sm">Gerencie suas preferências e segurança</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Informações do Professor */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-800">Sua Conta</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Nome</label>
              <p className="font-medium text-gray-800">{professor?.nome}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="font-medium text-gray-800">{professor?.email}</p>
            </div>
          </div>
        </Card>

        {/* Configurações da Plataforma */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-800">Configurações da Plataforma</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Estas configurações são definidas globalmente pelo sistema. Para alterá-las, entre em contato com o administrador.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-gray-700">Limite Tutor IA</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{PONTUACAO.LIMITE_IA_DIARIO}</p>
              <p className="text-xs text-gray-500">interações por dia por aluno</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-700">Meta Semanal</span>
              </div>
              <p className="text-2xl font-bold text-green-600">50</p>
              <p className="text-xs text-gray-500">questões por semana</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium">Sistema de Pontuação:</p>
                <ul className="mt-1 space-y-1 text-blue-600">
                  <li>• Resposta correta: +{PONTUACAO.RESPOSTA_CORRETA} pontos</li>
                  <li>• Com dica: +{PONTUACAO.RESPOSTA_COM_DICA} pontos</li>
                  <li>• Bônus velocidade (&lt;30s): +{PONTUACAO.BONUS_VELOCIDADE} pontos</li>
                  <li>• Bônus 7 dias seguidos: +{PONTUACAO.BONUS_SEQUENCIA_7_DIAS} pontos</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Alterar Senha */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-800">Alterar Senha</h3>
          </div>

          {mensagem && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                mensagem.tipo === 'sucesso'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {mensagem.tipo === 'sucesso' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{mensagem.texto}</span>
            </div>
          )}

          <form onSubmit={alterarSenha} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={mostrarSenhaAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent pr-12"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenhaAtual ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent pr-12"
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarNovaSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                placeholder="Confirme a nova senha"
              />
            </div>

            <Button
              type="submit"
              disabled={salvando}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white"
            >
              {salvando ? 'Salvando...' : 'Alterar Senha'}
            </Button>
          </form>
        </Card>

        {/* Informações de Segurança */}
        <Card className="bg-yellow-50 border border-yellow-200">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">Dicas de Segurança</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Use uma senha forte com letras, números e símbolos</li>
                <li>• Não compartilhe sua senha com outras pessoas</li>
                <li>• Altere sua senha periodicamente</li>
                <li>• Faça logout ao usar computadores compartilhados</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
