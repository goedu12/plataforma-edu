'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Map,
  Heart,
  Download,
  Share2,
  Filter,
  X,
  RefreshCw,
  ChevronDown,
  Eye,
  ZoomIn,
  ExternalLink,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import type { Componente, MapaMentalComStatus, SerieEM, Bimestre } from '@/types'
import { SERIES_LABELS, BIMESTRES_LABELS } from '@/types'

export default function MapasMentaisPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  const [mapas, setMapas] = useState<MapaMentalComStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Filtros
  const [serieFiltro, setSerieFiltro] = useState<SerieEM | null>(null)
  const [bimestreFiltro, setBimestreFiltro] = useState<Bimestre | null>(null)
  const [showFiltros, setShowFiltros] = useState(false)

  // Modal de visualização
  const [mapaAberto, setMapaAberto] = useState<MapaMentalComStatus | null>(null)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Buscar mapas
  const buscarMapas = async () => {
    setLoading(true)
    setErro(null)

    try {
      let url = `/api/mapas?componente=${componente}`
      if (serieFiltro) url += `&serie=${serieFiltro}`
      if (bimestreFiltro) url += `&bimestre=${bimestreFiltro}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.sucesso) {
        setMapas(data.mapas)
      } else {
        setErro(data.erro || 'Erro ao carregar mapas')
      }
    } catch (error) {
      console.error('Erro:', error)
      setErro('Não foi possível conectar ao servidor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!['fisica', 'matematica'].includes(componente)) {
      router.push('/selecionar')
      return
    }
    buscarMapas()
  }, [componente, serieFiltro, bimestreFiltro])

  // Toggle curtida
  const handleCurtir = async (mapa: MapaMentalComStatus) => {
    try {
      const response = await fetch(`/api/mapas/${mapa.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'curtir' })
      })

      const data = await response.json()
      if (data.sucesso) {
        setMapas(prev => prev.map(m =>
          m.id === mapa.id
            ? { ...m, curtido: data.curtido, curtidas: data.curtidas }
            : m
        ))

        // Atualizar mapa aberto se for o mesmo
        if (mapaAberto?.id === mapa.id) {
          setMapaAberto(prev => prev ? { ...prev, curtido: data.curtido, curtidas: data.curtidas } : null)
        }
      }
    } catch (error) {
      console.error('Erro ao curtir:', error)
    }
  }

  // Registrar download
  const handleDownload = async (mapa: MapaMentalComStatus) => {
    try {
      // Registrar no servidor
      await fetch(`/api/mapas/${mapa.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'download' })
      })

      // Fazer download da imagem
      const link = document.createElement('a')
      link.href = mapa.imagem_url
      link.download = `${mapa.titulo.replace(/\s+/g, '_')}.webp`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Atualizar contador local
      setMapas(prev => prev.map(m =>
        m.id === mapa.id ? { ...m, downloads: m.downloads + 1 } : m
      ))
    } catch (error) {
      console.error('Erro ao baixar:', error)
    }
  }

  // Compartilhar via WhatsApp
  const handleCompartilhar = async (mapa: MapaMentalComStatus) => {
    const texto = `📚 *${mapa.titulo}*\n${mapa.descricao || ''}\n\n${componente === 'fisica' ? '⚛️ Física' : '📐 Matemática'} - ${SERIES_LABELS[mapa.serie]} - ${BIMESTRES_LABELS[mapa.bimestre]}`

    // Tentar Web Share API primeiro
    if (navigator.share) {
      try {
        await navigator.share({
          title: mapa.titulo,
          text: texto,
        })
        return
      } catch {
        // Fallback para WhatsApp
      }
    }

    // Fallback: abrir WhatsApp diretamente
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(whatsappUrl, '_blank')
  }

  // Limpar filtros
  const limparFiltros = () => {
    setSerieFiltro(null)
    setBimestreFiltro(null)
  }

  const temFiltros = serieFiltro || bimestreFiltro

  if (loading) return <Loading fullScreen componente={componente} />

  return (
    <div className="min-h-screen pb-nav lg:pb-0 lg:pl-[72px]" style={{ background: 'var(--bg-base)' }}>
      <NavigationRail componente={componente} />

      {/* Header */}
      <header className="px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/${componente}/menu`)}
                className="p-2 rounded-lg"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-display font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Map className="w-5 h-5" style={{ color: corPrimaria }} />
                  Mapas Mentais
                </h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {mapas.length} resumo{mapas.length !== 1 ? 's' : ''} disponíve{mapas.length !== 1 ? 'is' : 'l'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowFiltros(!showFiltros)}
                className="p-2 rounded-lg relative"
                style={{
                  background: temFiltros ? corPrimaria : 'var(--bg-surface)',
                  color: temFiltros ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-default)'
                }}
              >
                <Filter className="w-5 h-5" />
                {temFiltros && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {(serieFiltro ? 1 : 0) + (bimestreFiltro ? 1 : 0)}
                  </span>
                )}
              </button>
              <button
                onClick={buscarMapas}
                className="p-2 rounded-lg"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filtros */}
          {showFiltros && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Filtros</span>
                {temFiltros && (
                  <button
                    onClick={limparFiltros}
                    className="text-xs px-2 py-1 rounded"
                    style={{ color: corPrimaria }}
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Série */}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Série</label>
                  <div className="relative">
                    <select
                      value={serieFiltro || ''}
                      onChange={(e) => setSerieFiltro(e.target.value ? parseInt(e.target.value) as SerieEM : null)}
                      className="w-full p-2 pr-8 rounded-lg text-sm appearance-none"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="">Todas</option>
                      <option value="1">1ª Série</option>
                      <option value="2">2ª Série</option>
                      <option value="3">3ª Série</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>

                {/* Bimestre */}
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Bimestre</label>
                  <div className="relative">
                    <select
                      value={bimestreFiltro || ''}
                      onChange={(e) => setBimestreFiltro(e.target.value ? parseInt(e.target.value) as Bimestre : null)}
                      className="w-full p-2 pr-8 rounded-lg text-sm appearance-none"
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="">Todos</option>
                      <option value="1">1º Bimestre</option>
                      <option value="2">2º Bimestre</option>
                      <option value="3">3º Bimestre</option>
                      <option value="4">4º Bimestre</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-4">
        {erro ? (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={buscarMapas} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        ) : mapas.length === 0 ? (
          <div className="text-center py-12">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'var(--bg-surface)' }}
            >
              <Map className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Nenhum mapa encontrado
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {temFiltros ? 'Tente ajustar os filtros' : 'Em breve novos mapas serão adicionados'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {mapas.map((mapa) => (
              <div
                key={mapa.id}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                {/* Thumbnail */}
                <button
                  onClick={() => setMapaAberto(mapa)}
                  className="w-full aspect-[4/3] relative group"
                >
                  <img
                    src={mapa.thumbnail_url || mapa.imagem_url}
                    alt={mapa.titulo}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white" />
                  </div>
                  {/* Badge série/bimestre */}
                  <span
                    className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: corPrimaria, color: isFisica ? '#000' : '#fff' }}
                  >
                    {mapa.serie}ª • {mapa.bimestre}º Bim
                  </span>
                </button>

                {/* Info */}
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                    {mapa.titulo}
                  </h3>
                  {mapa.tema && (
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {mapa.tema}
                    </p>
                  )}

                  {/* Stats e Ações */}
                  <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" fill={mapa.curtido ? 'currentColor' : 'none'} style={{ color: mapa.curtido ? '#ef4444' : 'inherit' }} />
                        {mapa.curtidas}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {mapa.downloads}
                      </span>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCurtir(mapa)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{
                          background: mapa.curtido ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-elevated)',
                          color: mapa.curtido ? '#ef4444' : 'var(--text-muted)'
                        }}
                      >
                        <Heart className="w-4 h-4" fill={mapa.curtido ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => handleDownload(mapa)}
                        className="p-1.5 rounded-lg"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCompartilhar(mapa)}
                        className="p-1.5 rounded-lg"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Visualização */}
      {mapaAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setMapaAberto(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] overflow-auto rounded-2xl"
            style={{ background: 'var(--bg-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="sticky top-0 z-10 p-4 flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{mapaAberto.titulo}</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {SERIES_LABELS[mapaAberto.serie]} • {BIMESTRES_LABELS[mapaAberto.bimestre]}
                </p>
              </div>
              <button
                onClick={() => setMapaAberto(null)}
                className="p-2 rounded-lg"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Imagem */}
            <div className="p-4">
              <img
                src={mapaAberto.imagem_url}
                alt={mapaAberto.titulo}
                className="w-full rounded-lg"
              />
            </div>

            {/* Ações do Modal */}
            <div className="sticky bottom-0 p-4 flex items-center justify-between gap-3" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)' }}>
              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {mapaAberto.visualizacoes}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" fill={mapaAberto.curtido ? 'currentColor' : 'none'} style={{ color: mapaAberto.curtido ? '#ef4444' : 'inherit' }} />
                  {mapaAberto.curtidas}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {mapaAberto.downloads}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => handleCurtir(mapaAberto)}
                  leftIcon={<Heart className="w-4 h-4" fill={mapaAberto.curtido ? 'currentColor' : 'none'} />}
                  style={{ color: mapaAberto.curtido ? '#ef4444' : undefined }}
                >
                  {mapaAberto.curtido ? 'Curtido' : 'Curtir'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDownload(mapaAberto)}
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Baixar
                </Button>
                <Button
                  variant={isFisica ? 'fisica' : 'matematica'}
                  onClick={() => handleCompartilhar(mapaAberto)}
                  leftIcon={<Share2 className="w-4 h-4" />}
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav componente={componente} />
    </div>
  )
}
