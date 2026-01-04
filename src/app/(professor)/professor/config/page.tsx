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
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface border-b border-border px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/professor/dashboard')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-body">Voltar ao Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="icon-box-cyan w-12 h-12">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-title text-text-primary">Configurações</h1>
              <p className="text-caption text-text-tertiary">Gerencie suas preferências e segurança</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Informações do Professor */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-text-tertiary" />
            <h3 className="text-heading text-text-primary">Sua Conta</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-dark-elevated rounded-xl">
              <label className="text-caption text-text-tertiary">Nome</label>
              <p className="font-medium text-text-primary">{professor?.nome}</p>
            </div>
            <div className="p-4 bg-dark-elevated rounded-xl">
              <label className="text-caption text-text-tertiary">Email</label>
              <p className="font-medium text-text-primary">{professor?.email}</p>
            </div>
          </div>
        </Card>

        {/* Configurações da Plataforma */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-accent-500" />
            <h3 className="text-heading text-text-primary">Configurações da Plataforma</h3>
          </div>
          <p className="text-body text-text-secondary mb-4">
            Estas configurações são definidas globalmente pelo sistema. Para alterá-las, entre em contato com o administrador.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-dark-elevated rounded-xl border border-matematica-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-matematica-500" />
                <span className="font-medium text-text-primary">Limite Tutor IA</span>
              </div>
              <p className="text-2xl font-bold text-matematica-500">{PONTUACAO.LIMITE_IA_DIARIO}</p>
              <p className="text-caption text-text-tertiary">interações por dia por aluno</p>
            </div>
            <div className="p-4 bg-dark-elevated rounded-xl border border-primary-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary-500" />
                <span className="font-medium text-text-primary">Meta Semanal</span>
              </div>
              <p className="text-2xl font-bold text-primary-500">50</p>
              <p className="text-caption text-text-tertiary">questões por semana</p>
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
            <h3 className="text-heading text-text-primary">Alterar Senha</h3>
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
              <label className="block text-caption text-text-secondary mb-2">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={mostrarSenhaAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={e => setSenhaAtual(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-elevated border border-border rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-text-primary placeholder-text-muted pr-12 transition-all"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                >
                  {mostrarSenhaAtual ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-caption text-text-secondary mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-elevated border border-border rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-text-primary placeholder-text-muted pr-12 transition-all"
                  placeholder="Digite a nova senha (mínimo 6 caracteres)"
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                >
                  {mostrarNovaSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-caption text-text-secondary mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
                className="w-full px-4 py-3 bg-dark-elevated border border-border rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-text-primary placeholder-text-muted transition-all"
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

        {/* Informações de Segurança */}
        <Card className="border border-warning/30">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning mb-2">Dicas de Segurança</h3>
              <ul className="text-body text-text-secondary space-y-1">
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
