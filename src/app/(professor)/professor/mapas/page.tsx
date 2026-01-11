'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Trash2,
  Eye,
  X,
} from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import type { Componente, SerieEM, Bimestre, MapaMental } from '@/types'

export default function MapasMentaisUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mapas, setMapas] = useState<MapaMental[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state
  const [componente, setComponente] = useState<Componente>('fisica')
  const [serie, setSerie] = useState<SerieEM>(1)
  const [bimestre, setBimestre] = useState<Bimestre>(1)
  const [titulo, setTitulo] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Modal de visualização
  const [viewingMapa, setViewingMapa] = useState<MapaMental | null>(null)

  // Carregar mapas existentes
  const carregarMapas = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/mapas?componente=${componente}&serie=${serie}&bimestre=${bimestre}`)
      const data = await response.json()
      if (data.sucesso) {
        setMapas(data.mapas)
      }
    } catch {
      console.error('Erro ao carregar mapas')
    } finally {
      setLoading(false)
    }
  }, [componente, serie, bimestre])

  useEffect(() => {
    carregarMapas()
  }, [carregarMapas])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Selecione apenas arquivos de imagem' })
      return
    }

    // Validar tamanho (max 25MB para A4 300dpi)
    if (file.size > 25 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Imagem muito grande. Máximo 25MB.' })
      return
    }

    setSelectedFile(file)

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setMessage(null)
  }

  const handleUpload = async () => {
    if (!selectedFile || !titulo.trim()) {
      setMessage({ type: 'error', text: 'Preencha o título e selecione uma imagem' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      // Criar FormData para envio
      const formData = new FormData()
      formData.append('imagem', selectedFile)
      formData.append('componente', componente)
      formData.append('serie', serie.toString())
      formData.append('bimestre', bimestre.toString())
      formData.append('titulo', titulo.trim())

      const response = await fetch('/api/mapas/upload', {
        method: 'POST',
        body: formData, // FormData não precisa de Content-Type header
      })

      const data = await response.json()

      if (data.sucesso) {
        setMessage({ type: 'success', text: data.mensagem || 'Mapa mental enviado com sucesso!' })
        setTitulo('')
        setPreview(null)
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        carregarMapas()
      } else {
        setMessage({ type: 'error', text: data.erro || 'Erro ao enviar mapa' })
      }
    } catch (err) {
      console.error('Erro upload:', err)
      setMessage({ type: 'error', text: 'Erro ao enviar mapa mental' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este mapa mental?')) return

    try {
      const response = await fetch(`/api/mapas/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.sucesso) {
        setMessage({ type: 'success', text: 'Mapa excluído com sucesso!' })
        carregarMapas()
      } else {
        setMessage({ type: 'error', text: data.erro || 'Erro ao excluir' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao excluir mapa mental' })
    }
  }

  return (
    <div className="min-h-screen bg-calm-bg">
      {/* Header */}
      <header className="bg-gray-800 text-white px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.push('/professor/dashboard')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-lg font-bold">Mapas Mentais</h1>
            <p className="text-white/70 text-sm">Upload e gerenciamento</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Mensagem */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-success/20 text-success'
              : 'bg-error/20 text-error'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Filtros */}
        <Card>
          <h2 className="font-semibold text-text-primary mb-4">Filtros</h2>
          <div className="grid grid-cols-3 gap-4">
            {/* Componente */}
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Componente</label>
              <select
                value={componente}
                onChange={(e) => setComponente(e.target.value as Componente)}
                className="w-full p-3 rounded-xl bg-calm-elevated text-text-primary border-0 focus:ring-2 focus:ring-fisica-500"
              >
                <option value="fisica">Física</option>
                <option value="matematica">Matemática</option>
              </select>
            </div>

            {/* Série */}
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Série</label>
              <select
                value={serie}
                onChange={(e) => setSerie(Number(e.target.value) as SerieEM)}
                className="w-full p-3 rounded-xl bg-calm-elevated text-text-primary border-0 focus:ring-2 focus:ring-fisica-500"
              >
                <option value={1}>1ª Série</option>
                <option value={2}>2ª Série</option>
                <option value={3}>3ª Série</option>
              </select>
            </div>

            {/* Bimestre */}
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Bimestre</label>
              <select
                value={bimestre}
                onChange={(e) => setBimestre(Number(e.target.value) as Bimestre)}
                className="w-full p-3 rounded-xl bg-calm-elevated text-text-primary border-0 focus:ring-2 focus:ring-fisica-500"
              >
                <option value={1}>1º Bimestre</option>
                <option value={2}>2º Bimestre</option>
                <option value={3}>3º Bimestre</option>
                <option value={4}>4º Bimestre</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Upload Form */}
        <Card>
          <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Novo Mapa Mental
          </h2>

          <div className="space-y-4">
            {/* Título */}
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Título do Mapa</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Introdução à Física - Grandezas e Unidades"
                className="w-full p-3 rounded-xl bg-calm-elevated text-text-primary border-0 focus:ring-2 focus:ring-fisica-500 placeholder:text-text-muted"
              />
            </div>

            {/* File Input */}
            <div>
              <label className="text-sm text-text-secondary mb-1 block">Imagem</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-96 object-contain rounded-xl bg-calm-elevated"
                  />
                  <button
                    onClick={() => {
                      setPreview(null)
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute top-2 right-2 p-2 bg-error rounded-full text-white hover:bg-error/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 rounded-xl border-2 border-dashed border-text-muted/30 hover:border-fisica-500 transition-colors flex flex-col items-center gap-2 text-text-muted hover:text-fisica-500"
                >
                  <ImageIcon className="w-12 h-12" />
                  <span>Clique para selecionar imagem</span>
                  <span className="text-sm">PNG, JPG, WebP - A4 300dpi (máx 25MB)</span>
                </button>
              )}
            </div>

            {/* Upload Button */}
            <Button
              variant={componente}
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !titulo.trim()}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loading size="sm" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Enviar Mapa Mental
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Lista de Mapas Existentes */}
        <Card>
          <h2 className="font-semibold text-text-primary mb-4">
            Mapas Existentes ({mapas.length})
          </h2>

          {loading ? (
            <div className="py-8 flex justify-center">
              <Loading />
            </div>
          ) : mapas.length === 0 ? (
            <div className="py-8 text-center text-text-muted">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum mapa mental cadastrado</p>
              <p className="text-sm">para {componente} - {serie}ª série - {bimestre}º bimestre</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mapas.map((mapa) => (
                <div
                  key={mapa.id}
                  className="bg-calm-elevated rounded-xl overflow-hidden group"
                >
                  <div className="relative aspect-video">
                    <img
                      src={mapa.thumbnail_url || mapa.imagem_url}
                      alt={mapa.titulo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setViewingMapa(mapa)}
                        className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                      >
                        <Eye className="w-5 h-5 text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(mapa.id)}
                        className="p-2 bg-error/50 rounded-lg hover:bg-error"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-text-primary text-sm truncate">
                      {mapa.titulo}
                    </p>
                    <p className="text-xs text-text-muted">
                      {mapa.curtidas} curtidas · {mapa.downloads} downloads
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>

      {/* Modal de Visualização */}
      {viewingMapa && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingMapa(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full"
            onClick={() => setViewingMapa(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={viewingMapa.imagem_url}
            alt={viewingMapa.titulo}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
