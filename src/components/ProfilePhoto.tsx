'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Trash2, Loader2 } from 'lucide-react'

interface ProfilePhotoProps {
  fotoUrl?: string | null
  nome: string
  size?: 'sm' | 'md' | 'lg'
  editable?: boolean
  componente?: 'fisica' | 'matematica'
  onPhotoChange?: (newUrl: string | null) => void
}

export default function ProfilePhoto({
  fotoUrl,
  nome,
  size = 'md',
  editable = false,
  componente = 'fisica',
  onPhotoChange
}: ProfilePhotoProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  }

  const bgColor = componente === 'fisica' ? 'bg-fisica-500' : 'bg-matematica-500'
  const inicial = nome.charAt(0).toUpperCase()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validações client-side
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use JPG, PNG ou WebP')
      return
    }

    if (file.size > 500 * 1024) {
      setError('Máximo 500KB')
      return
    }

    setError(null)
    setLoading(true)

    // Preview local
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    try {
      const formData = new FormData()
      formData.append('foto', file)

      const response = await fetch('/api/usuario/foto', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.sucesso) {
        setPreviewUrl(null)
        onPhotoChange?.(data.foto_url)
      } else {
        setError(data.erro || 'Erro ao enviar')
        setPreviewUrl(null)
      }
    } catch {
      setError('Erro de conexão')
      setPreviewUrl(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Remover foto de perfil?')) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/usuario/foto', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.sucesso) {
        onPhotoChange?.(null)
      } else {
        setError(data.erro || 'Erro ao remover')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const displayUrl = previewUrl || fotoUrl

  return (
    <div className="relative inline-block">
      {/* Avatar */}
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full overflow-hidden relative
          flex items-center justify-center
          ${displayUrl ? 'bg-gray-200' : bgColor}
          text-white font-bold
          transition-all duration-300
          ${editable ? 'cursor-pointer hover:opacity-90' : ''}
        `}
        onClick={() => editable && fileInputRef.current?.click()}
      >
        {loading ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : displayUrl ? (
          <Image
            src={displayUrl}
            alt={nome}
            fill
            sizes="96px"
            className="object-cover"
            unoptimized={displayUrl.startsWith('data:')}
          />
        ) : (
          <span>{inicial}</span>
        )}
      </div>

      {/* Botão de editar */}
      {editable && !loading && (
        <>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`
              absolute -bottom-1 -right-1
              ${size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'}
              rounded-full bg-calm-surface border-2 border-calm-border
              flex items-center justify-center
              hover:bg-calm-elevated transition-colors
              shadow-sm
            `}
            title="Alterar foto"
          >
            <Camera className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
          </button>

          {/* Botão remover (só aparece se tiver foto) */}
          {fotoUrl && (
            <button
              onClick={handleRemove}
              className={`
                absolute -bottom-1 -left-1
                ${size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'}
                rounded-full bg-red-100 border-2 border-red-200
                flex items-center justify-center
                hover:bg-red-200 transition-colors
                shadow-sm text-red-600
              `}
              title="Remover foto"
            >
              <Trash2 className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
            </button>
          )}
        </>
      )}

      {/* Input hidden */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Erro */}
      {error && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
          <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
            {error}
          </span>
        </div>
      )}
    </div>
  )
}
