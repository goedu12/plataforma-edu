'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  Check,
  AlertCircle,
  Camera,
  Info,
  Palette
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import ProfilePhoto from '@/components/ProfilePhoto'
import BackButton from '@/components/ui/BackButton'
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
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const nomeComponente = isFisica ? 'Física' : 'Matemática'

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
        className="compact-mobile-x pt-3 pb-16"
        style={{ background: corPrimaria }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <BackButton href={`/${componente}/menu`} mobileOnly />
            <div className="text-center">
              <h1
                className="font-display font-semibold flex items-center gap-2"
                style={{ color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }}
              >
                <User className="w-5 h-5" />
                Meu Perfil
              </h1>
              <p className="text-sm" style={{ color: isFisica ? 'var(--text-on-fisica-70)' : 'var(--text-on-matematica-80)' }}>
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
              background: mensagem.tipo === 'sucesso' ? 'var(--success-bg-15)' : 'var(--error-bg-15)',
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
      </main>

      <BottomNav componente={componente} />
    </div>
  )
}
