'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  User,
  Lock,
  Mail,
  GraduationCap,
  Calendar,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
  Camera,
  Info
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Loading from '@/components/ui/Loading'
import ProfilePhoto from '@/components/ProfilePhoto'
import type { Usuario, Componente } from '@/types'

export default function PerfilPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  // Estado para alteração de senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }

    buscarUsuario()
  }, [componente, router])

  const buscarUsuario = async () => {
    try {
      const response = await fetch('/api/usuario')
      const data = await response.json()

      if (data.sucesso) {
        setUsuario(data.usuario)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleAlterarSenha = async (e: React.FormEvent) => {
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
          nova_senha: novaSenha
        })
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
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente.' })
    } finally {
      setSalvando(false)
    }
  }

  const handleVoltar = () => {
    router.push(`/${componente}/menu`)
  }

  const handlePhotoChange = (newUrl: string | null) => {
    if (usuario) {
      setUsuario({ ...usuario, foto_url: newUrl })
      setMensagem({ tipo: 'sucesso', texto: newUrl ? 'Foto atualizada!' : 'Foto removida!' })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  if (loading) {
    return <Loading fullScreen componente={componente} />
  }

  if (!usuario) {
    return null
  }

  const nomeComponente = componente === 'fisica' ? 'Física' : 'Matemática'
  const isFisica = componente === 'fisica'
  const bgColor = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'

  return (
    <div className="min-h-screen bg-calm-bg pb-8">
      {/* Header */}
      <header className={`${bgColor} text-white px-4 pt-4 pb-20`}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleVoltar}
              className="p-2 -ml-2 rounded-xl hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1 className="font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Meu Perfil
              </h1>
              <p className="text-sm text-white/80">{nomeComponente}</p>
            </div>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 -mt-14">
        {/* Mensagem de feedback */}
        {mensagem && (
          <div
            className={`mb-4 p-4 rounded-xl flex items-center gap-3 animate-slide-up ${
              mensagem.tipo === 'sucesso'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {mensagem.tipo === 'sucesso' ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm">{mensagem.texto}</p>
          </div>
        )}

        {/* Card de Foto e Info Básica */}
        <Card className="animate-slide-up mb-4">
          <div className="flex flex-col items-center text-center">
            <ProfilePhoto
              fotoUrl={usuario.foto_url}
              nome={usuario.nome}
              size="lg"
              editable
              componente={componente}
              onPhotoChange={handlePhotoChange}
            />
            <h2 className="text-xl font-bold text-text-primary mt-4">{usuario.nome}</h2>
            <p className="text-text-secondary">{usuario.email}</p>

            <div className="mt-4 p-3 bg-calm-elevated rounded-xl w-full">
              <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
                <Camera className="w-4 h-4" />
                <span>Clique na foto para alterar (máx. 500KB)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card de Informações */}
        <Card className="animate-slide-up mb-4" style={{ animationDelay: '50ms' }}>
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Informações da Conta
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-calm-elevated rounded-xl">
              <Mail className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">E-mail</p>
                <p className="text-text-primary">{usuario.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-calm-elevated rounded-xl">
              <GraduationCap className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Turma</p>
                <p className="text-text-primary">{usuario.turma}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-calm-elevated rounded-xl">
              <Calendar className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-xs text-text-muted">Membro desde</p>
                <p className="text-text-primary">
                  {new Date(usuario.criado_em).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Card de Alterar Senha */}
        <Card className="animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Alterar Senha
          </h3>

          <form onSubmit={handleAlterarSenha} className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Senha Atual</label>
              <div className="relative">
                <Input
                  type={mostrarSenhaAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {mostrarSenhaAtual ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Nova Senha</label>
              <div className="relative">
                <Input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Digite a nova senha (mín. 6 caracteres)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {mostrarNovaSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1">Confirmar Nova Senha</label>
              <Input
                type={mostrarNovaSenha ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Confirme a nova senha"
              />
            </div>

            <Button
              type="submit"
              variant={isFisica ? 'fisica' : 'matematica'}
              className="w-full"
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Alterar Senha
                </>
              )}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}
