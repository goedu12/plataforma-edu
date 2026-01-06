'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
  ImageIcon,
  Upload,
  Trash2,
  Loader2,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import { PONTUACAO } from '@/types'

export default function ConfigProfessorPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)
  const [professor, setProfessor] = useState<{ nome: string; email: string } | null>(null)

  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoMensagem, setLogoMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

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

        // Buscar logo atual
        const logoResponse = await fetch('/api/config/logo')
        const logoData = await logoResponse.json()
        if (logoData.sucesso && logoData.logo_url) {
          setLogoUrl(logoData.logo_url)
        }
      } catch {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    buscarDados()
  }, [router])

  // Handler para seleção de arquivo de logo
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    if (!tiposPermitidos.includes(file.type)) {
      setLogoMensagem({ tipo: 'erro', texto: 'Tipo de arquivo não permitido. Use PNG, JPG, WebP ou SVG.' })
      return
    }

    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoMensagem({ tipo: 'erro', texto: 'Arquivo muito grande. Máximo 2MB.' })
      return
    }

    // Preview local
    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Upload do logo
  const handleLogoUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setLogoMensagem({ tipo: 'erro', texto: 'Selecione uma imagem primeiro.' })
      return
    }

    setUploadingLogo(true)
    setLogoMensagem(null)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/config/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.sucesso) {
        setLogoUrl(data.logo_url)
        setLogoPreview(null)
        setLogoMensagem({ tipo: 'sucesso', texto: 'Logo atualizado com sucesso!' })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setLogoMensagem({ tipo: 'erro', texto: data.erro || 'Erro ao fazer upload do logo.' })
      }
    } catch {
      setLogoMensagem({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente.' })
    } finally {
      setUploadingLogo(false)
    }
  }

  // Remover logo
  const handleLogoRemove = async () => {
    if (!confirm('Tem certeza que deseja remover o logo? O logo padrão será exibido.')) {
      return
    }

    setUploadingLogo(true)
    setLogoMensagem(null)

    try {
      const response = await fetch('/api/config/logo', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.sucesso) {
        setLogoUrl(null)
        setLogoPreview(null)
        setLogoMensagem({ tipo: 'sucesso', texto: 'Logo removido. O logo padrão será exibido.' })
      } else {
        setLogoMensagem({ tipo: 'erro', texto: data.erro || 'Erro ao remover logo.' })
      }
    } catch {
      setLogoMensagem({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente.' })
    } finally {
      setUploadingLogo(false)
    }
  }

  // Cancelar preview
  const handleCancelPreview = () => {
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
              <p className="text-caption text-text-tertiary">Gerencie o Studão e suas preferências</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Gerenciamento de Logo */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-primary-500" />
            <h3 className="text-heading text-text-primary">Logo da Plataforma</h3>
          </div>

          <p className="text-body text-text-secondary mb-4">
            Personalize o logo exibido na tela de login do Studão. Recomendamos imagens com fundo transparente (PNG ou WebP).
          </p>

          {logoMensagem && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                logoMensagem.tipo === 'sucesso'
                  ? 'bg-success/10 border border-success/20 text-success'
                  : 'bg-error/10 border border-error/20 text-error'
              }`}
            >
              {logoMensagem.tipo === 'sucesso' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{logoMensagem.texto}</span>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Preview do Logo Atual */}
            <div className="p-6 bg-dark-elevated rounded-xl border border-border">
              <p className="text-caption text-text-tertiary mb-3">Logo Atual</p>
              <div className="flex items-center justify-center min-h-[120px] bg-dark-bg rounded-lg p-4">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="Logo atual"
                    width={200}
                    height={80}
                    className="max-h-[80px] w-auto object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="text-center">
                    <Image
                      src="/logo-studao.svg"
                      alt="Logo padrão"
                      width={200}
                      height={80}
                      className="max-h-[80px] w-auto object-contain"
                    />
                    <p className="text-xs text-text-muted mt-2">Logo padrão</p>
                  </div>
                )}
              </div>
              {logoUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogoRemove}
                  disabled={uploadingLogo}
                  className="w-full mt-3"
                  leftIcon={uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                >
                  Remover Logo
                </Button>
              )}
            </div>

            {/* Upload de Novo Logo */}
            <div className="p-6 bg-dark-elevated rounded-xl border border-border">
              <p className="text-caption text-text-tertiary mb-3">
                {logoPreview ? 'Preview do Novo Logo' : 'Enviar Novo Logo'}
              </p>

              {logoPreview ? (
                <>
                  <div className="flex items-center justify-center min-h-[120px] bg-dark-bg rounded-lg p-4 mb-3">
                    <Image
                      src={logoPreview}
                      alt="Preview"
                      width={200}
                      height={80}
                      className="max-h-[80px] w-auto object-contain"
                      unoptimized
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelPreview}
                      disabled={uploadingLogo}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="flex-1"
                      leftIcon={uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    >
                      {uploadingLogo ? 'Enviando...' : 'Confirmar'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="flex flex-col items-center justify-center min-h-[120px] bg-dark-bg rounded-lg p-4 border-2 border-dashed border-border hover:border-primary-500 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-8 h-8 text-text-muted mb-2" />
                    <p className="text-sm text-text-secondary">Clique para selecionar</p>
                    <p className="text-xs text-text-muted mt-1">PNG, JPG, WebP ou SVG (max 2MB)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />
                </>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-accent-500/10 border border-accent-500/20 rounded-lg">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-accent-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-accent-300">
                <p className="font-medium text-accent-400 mb-1">Dicas para um bom logo:</p>
                <ul className="space-y-0.5">
                  <li>• Use fundo transparente (PNG ou WebP)</li>
                  <li>• Resolução recomendada: 560x200 pixels</li>
                  <li>• Formatos aceitos: PNG, JPG, WebP, SVG</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

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
            <h3 className="text-heading text-text-primary">Configurações do Studão</h3>
          </div>
          <p className="text-body text-text-secondary mb-4">
            Configurações globais do sistema de aprendizado.
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
