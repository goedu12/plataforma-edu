'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Info,
  Palette
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Loading from '@/components/ui/Loading'
import ProfilePhoto from '@/components/ProfilePhoto'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import ThemeToggle from '@/components/ThemeToggle'
import type { Usuario, Componente } from '@/types'

export default function PerfilPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false)
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const nomeComponente = isFisica ? 'Física' : 'Matemática'

  const buscarUsuario = useCallback(async () => {
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
  }, [router])

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarUsuario()
  }, [componente, router, buscarUsuario])

  const handleAlterarSenha = async (e: React.FormEvent) => {
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
        body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha })
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

  const handlePhotoChange = (newUrl: string | null) => {
    if (usuario) {
      setUsuario({ ...usuario, foto_url: newUrl })
      setMensagem({ tipo: 'sucesso', texto: newUrl ? 'Foto atualizada!' : 'Foto removida!' })
      setTimeout(() => setMensagem(null), 3000)
    }
  }

  if (loading) return <Loading fullScreen componente={componente} />
  if (!usuario) return null

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />
      {/* Header */}
      <header
        className="px-4 pt-4 pb-20"
        style={{ background: corPrimaria }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push(`/${componente}/menu`)}
              className="p-3 -ml-2 rounded-xl hover:bg-black/20 transition-colors touch-target"
              style={{ color: isFisica ? '#000' : '#fff' }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1
                className="font-display font-semibold flex items-center gap-2"
                style={{ color: isFisica ? '#000' : '#fff' }}
              >
                <User className="w-5 h-5" />
                Meu Perfil
              </h1>
              <p className="text-sm" style={{ color: isFisica ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)' }}>
                {nomeComponente}
              </p>
            </div>
            <div className="w-12" />
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-2xl mx-auto px-4 -mt-14">
        {/* Mensagem de feedback */}
        {mensagem && (
          <div
            className="mb-4 p-4 rounded-xl flex items-center gap-3 animate-fade-in"
            style={{
              background: mensagem.tipo === 'sucesso' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: mensagem.tipo === 'sucesso' ? 'var(--success)' : 'var(--error)',
            }}
          >
            {mensagem.tipo === 'sucesso' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p className="text-sm">{mensagem.texto}</p>
          </div>
        )}

        {/* Card de Foto e Info Básica */}
        <div
          className="card p-6 mb-4 animate-fade-in-up"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
        >
          <div className="flex flex-col items-center text-center">
            <ProfilePhoto
              fotoUrl={usuario.foto_url}
              nome={usuario.nome}
              size="lg"
              editable
              componente={componente}
              onPhotoChange={handlePhotoChange}
            />
            <h2 className="text-xl font-bold mt-4" style={{ color: 'var(--text-primary)' }}>{usuario.nome}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{usuario.email}</p>

            <div
              className="mt-4 p-3 rounded-xl w-full"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <div className="flex items-center justify-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Camera className="w-4 h-4" />
                <span>Clique na foto para alterar (máx. 500KB)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Informações */}
        <div
          className="card p-6 mb-4 animate-fade-in-up"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', animationDelay: '50ms' }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Info className="w-5 h-5" />
            Informações da Conta
          </h3>

          <div className="space-y-4">
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <Mail className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>E-mail</p>
                <p style={{ color: 'var(--text-primary)' }}>{usuario.email}</p>
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <GraduationCap className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Turma</p>
                <p style={{ color: 'var(--text-primary)' }}>{usuario.turma}</p>
              </div>
            </div>

            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <Calendar className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Membro desde</p>
                <p style={{ color: 'var(--text-primary)' }}>
                  {new Date(usuario.criado_em).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Tema */}
        <div
          className="card p-6 mb-4 animate-fade-in-up"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', animationDelay: '75ms' }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Palette className="w-5 h-5" />
            Aparência
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Escolha como a plataforma deve aparecer. Auto segue a configuração do seu dispositivo.
          </p>
          <ThemeToggle componente={componente} />
        </div>

        {/* Card de Alterar Senha */}
        <div
          className="card p-6 animate-fade-in-up"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', animationDelay: '100ms' }}
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Lock className="w-5 h-5" />
            Alterar Senha
          </h3>

          <form onSubmit={handleAlterarSenha} className="space-y-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Senha Atual</label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 touch-target"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {mostrarSenhaAtual ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Nova Senha</label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 touch-target"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {mostrarNovaSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Confirmar Nova Senha</label>
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
              leftIcon={salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            >
              {salvando ? 'Salvando...' : 'Alterar Senha'}
            </Button>
          </form>
        </div>
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
