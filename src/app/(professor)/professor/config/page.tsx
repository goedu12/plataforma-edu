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
    const buscarDados = async () => {
      try {
        // Buscar dados do professor
        const userResponse = await fetch('/api/usuario')
        const userData = await userResponse.json()

        if (userData.sucesso && userData.usuario) {
          setProfessor({
            nome: userData.usuario.nome,
            email: userData.usuario.email,
          })
        } else {
          router.push('/login')
          return
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    buscarDados()
  }, [router])

  const alterarSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setMensagem(null)

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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-border px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/professor/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-body">Voltar ao Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="icon-box-cyan w-12 h-12">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-title text-slate-800">Configurações</h1>
              <p className="text-caption text-slate-500">Gerencie o seu10 e suas preferências</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Informações do Professor */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-slate-500" />
            <h3 className="text-heading text-slate-800">Sua Conta</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl">
              <label className="text-caption text-slate-500">Nome</label>
              <p className="font-medium text-slate-800">{professor?.nome}</p>
            </div>
            <div className="p-4 bg-white rounded-xl">
              <label className="text-caption text-slate-500">Email</label>
              <p className="font-medium text-slate-800">{professor?.email}</p>
            </div>
          </div>
        </Card>

        {/* Configurações da Plataforma */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-accent-500" />
            <h3 className="text-heading text-slate-800">Configurações do seu10</h3>
          </div>
          <p className="text-body text-slate-600 mb-4">
            Configurações globais do sistema de aprendizado.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-xl border border-matematica-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-matematica-500" />
                <span className="font-medium text-slate-800">Limite Tutor IA</span>
              </div>
              <p className="text-2xl font-bold text-matematica-500">{PONTUACAO.LIMITE_IA_DIARIO}</p>
              <p className="text-caption text-slate-500">interações por dia por aluno</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-primary-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-slate-800">Meta Semanal</span>
              </div>
              <p className="text-2xl font-bold text-primary-500">50</p>
              <p className="text-caption text-slate-500">questões por semana</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-accent-500/10 border border-accent-500/20 rounded-xl">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-accent-400">Sistema de Pontuação:</p>
                <ul className="mt-1 space-y-1 text-accent-300">
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
            <Key className="w-5 h-5 text-warning" />
            <h3 className="text-heading text-slate-800">Alterar Senha</h3>
          </div>

          {mensagem && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                mensagem.tipo === 'sucesso'
                  ? 'bg-success/10 border border-success/20 text-success'
                  : 'bg-error/10 border border-error/20 text-error'
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
              <label className="block text-caption text-slate-600 mb-2">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={mostrarSenhaAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-slate-800 placeholder-text-muted pr-12 transition-all"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {mostrarSenhaAtual ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-caption text-slate-600 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-slate-800 placeholder-text-muted pr-12 transition-all"
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {mostrarNovaSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-caption text-slate-600 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-slate-800 placeholder-text-muted transition-all"
                placeholder="Confirme a nova senha"
              />
            </div>

            <Button
              type="submit"
              disabled={salvando}
              className="w-full"
            >
              {salvando ? 'Salvando...' : 'Alterar Senha'}
            </Button>
          </form>
        </Card>

        {/* Informações de Segurança - Terminal Style */}
        <div className="terminal-box terminal-amber">
          <div className="terminal-header">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
            <span className="title">seguranca.sh</span>
          </div>
          <div className="terminal-body space-y-2">
            <p className="comment"># Dicas de Segurança</p>
            <p className="text-white">$ Use uma senha forte com letras, numeros e simbolos</p>
            <p className="text-white">$ Nao compartilhe sua senha com outras pessoas</p>
            <p className="text-white">$ Altere sua senha periodicamente</p>
            <p className="text-white">$ Faca logout ao usar computadores compartilhados</p>
          </div>
        </div>
      </main>
    </div>
  )
}
