'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Heart,
  Download,
  Share2,
  ExternalLink,
  Map,
} from 'lucide-react'
import Loading from '@/components/ui/Loading'
import BackButton from '@/components/ui/BackButton'
import type { MapaMental, Componente } from '@/types'
import { SERIES_MAPA_LABELS, BIMESTRES_LABELS } from '@/types'

// Página pública para visualização de mapa mental via link compartilhado
export default function MapaPublicoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [mapa, setMapa] = useState<MapaMental | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const isFisica = mapa?.componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica-light)'

  useEffect(() => {
    const buscarMapa = async () => {
      try {
        const response = await fetch(`/api/mapas/publico/${id}`)
        const data = await response.json()

        if (data.sucesso) {
          setMapa(data.mapa)
        } else {
          setErro(data.erro || 'Mapa não encontrado')
        }
      } catch {
        setErro('Erro ao carregar mapa')
      } finally {
        setLoading(false)
      }
    }

    if (id) buscarMapa()
  }, [id])

  // Download da imagem
  const handleDownload = async () => {
    if (!mapa) return

    try {
      // Registrar download
      await fetch(`/api/mapas/${mapa.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'download' })
      })

      const link = document.createElement('a')
      link.href = mapa.imagem_url
      link.download = `${mapa.titulo.replace(/\s+/g, '_')}.webp`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Erro ao baixar:', error)
    }
  }

  // Compartilhar
  const handleCompartilhar = () => {
    if (!mapa) return

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const linkMapa = `${baseUrl}/mapa/${mapa.id}`

    const texto = `📚 *${mapa.titulo}*

${mapa.componente === 'fisica' ? '⚛️ Física' : '📐 Matemática'} - ${SERIES_MAPA_LABELS[mapa.serie]} - ${BIMESTRES_LABELS[mapa.bimestre]}

🔗 ${linkMapa}`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(whatsappUrl, '_blank')
  }

  // Ir para o app
  const irParaApp = () => {
    if (mapa) {
      router.push(`/${mapa.componente}/mapas`)
    } else {
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (erro || !mapa) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <Map className="w-10 h-10 text-gray-600" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Mapa não encontrado</h1>
        <p className="text-gray-400 mb-6">{erro || 'Este mapa pode ter sido removido ou o link está incorreto.'}</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 rounded-xl bg-white text-gray-900 font-medium"
        >
          Ir para o App
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-3 min-w-0">
          <BackButton onClick={irParaApp} />
          <div className="min-w-0">
            <h1 className="font-semibold text-white truncate">{mapa.titulo}</h1>
            <p className="text-sm text-gray-400">
              {mapa.componente === 'fisica' ? '⚛️ Física' : '📐 Matemática'} • {SERIES_MAPA_LABELS[mapa.serie]} • {BIMESTRES_LABELS[mapa.bimestre]}
            </p>
          </div>
        </div>
        <span
          className="text-xs px-3 py-1 rounded-full font-medium"
          style={{ background: corPrimaria, color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }}
        >
          {mapa.serie}ª Série
        </span>
      </header>

      {/* Imagem */}
      <main className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <img
          src={mapa.imagem_url}
          alt={mapa.titulo}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </main>

      {/* Footer com ações */}
      <footer className="flex-shrink-0 p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {mapa.curtidas} curtidas
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {mapa.downloads} downloads
          </span>
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all active:scale-95 bg-gray-800 text-white border border-gray-700"
          >
            <Download className="w-5 h-5" />
            Baixar
          </button>
          <button
            onClick={handleCompartilhar}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all active:scale-95"
            style={{ background: 'var(--color-whatsapp)', color: 'var(--text-primary)' }}
          >
            <Share2 className="w-5 h-5" />
            WhatsApp
          </button>
          <button
            onClick={irParaApp}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all active:scale-95"
            style={{ background: corPrimaria, color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)' }}
          >
            <ExternalLink className="w-5 h-5" />
            Ver mais
          </button>
        </div>

        {/* Branding */}
        <p className="text-center text-xs text-gray-500 mt-4">
          📚 seu10.com
        </p>
      </footer>
    </div>
  )
}
