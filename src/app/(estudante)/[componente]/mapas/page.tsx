'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Map,
  Heart,
  Download,
  Share2,
  Filter,
  X,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import BackButton from '@/components/ui/BackButton'
import Loading from '@/components/ui/Loading'
import BottomNav from '@/components/BottomNav'
import NavigationRail from '@/components/NavigationRail'
import useTempoUso from '@/hooks/useTempoUso'
import type { Componente, MapaMentalComStatus, SerieMapa, Bimestre, NivelEnsino } from '@/types'
import { SERIES_MAPA_LABELS, BIMESTRES_LABELS } from '@/types'

export default function MapasMentaisPage() {
  const router = useRouter()
  const params = useParams()
  const componente = params.componente as Componente

  // Rastrear tempo de uso efetivo
  useTempoUso(componente, 'mapas')

  const [mapas, setMapas] = useState<MapaMentalComStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Dados do usuário
  const [nivelUsuario, setNivelUsuario] = useState<NivelEnsino | null>(null)

  // Filtros
  const [serieFiltro, setSerieFiltro] = useState<SerieMapa | null>(null)
  const [bimestreFiltro, setBimestreFiltro] = useState<Bimestre | null>(null)
  const [showFiltros, setShowFiltros] = useState(false)

  // Visualização
  const [modalAberto, setModalAberto] = useState(false) // Desktop: Modal
  const [storiesAberto, setStoriesAberto] = useState(false) // Mobile: Stories
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [zoom, setZoom] = useState(1)

  // Detecção de dispositivo
  const [isMobile, setIsMobile] = useState(false)

  // Touch/Swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const mapaAtual = mapas[indiceAtual]

  // Detectar mobile vs desktop
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Buscar dados do usuário (nível de ensino)
  const buscarUsuario = async () => {
    try {
      const response = await fetch('/api/usuario')
      const data = await response.json()
      if (data.sucesso && data.usuario) {
        setNivelUsuario(data.usuario.nivel as NivelEnsino)
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
    }
  }

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
    buscarUsuario()
    buscarMapas()
  }, [componente, serieFiltro, bimestreFiltro])

  // Navegação
  const irParaAnterior = useCallback(() => {
    setIndiceAtual(prev => (prev > 0 ? prev - 1 : mapas.length - 1))
    setZoom(1)
  }, [mapas.length])

  const irParaProximo = useCallback(() => {
    setIndiceAtual(prev => (prev < mapas.length - 1 ? prev + 1 : 0))
    setZoom(1)
  }, [mapas.length])

  // Abrir visualização baseado no dispositivo
  const abrirVisualizacao = (indice: number) => {
    setIndiceAtual(indice)
    setZoom(1)
    if (isMobile) {
      setStoriesAberto(true)
    } else {
      setModalAberto(true)
    }
  }

  // Fechar visualização
  const fecharVisualizacao = () => {
    setStoriesAberto(false)
    setModalAberto(false)
    setZoom(1)
  }

  // Keyboard navigation
  useEffect(() => {
    if (!storiesAberto && !modalAberto) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') irParaAnterior()
      else if (e.key === 'ArrowRight') irParaProximo()
      else if (e.key === 'Escape') fecharVisualizacao()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [storiesAberto, modalAberto, irParaAnterior, irParaProximo])

  // Touch/Swipe handlers (apenas mobile)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) irParaProximo()
    else if (isRightSwipe) irParaAnterior()
  }

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
      }
    } catch (error) {
      console.error('Erro ao curtir:', error)
    }
  }

  // Registrar download
  const handleDownload = async (mapa: MapaMentalComStatus) => {
    try {
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

      setMapas(prev => prev.map(m =>
        m.id === mapa.id ? { ...m, downloads: m.downloads + 1 } : m
      ))
    } catch (error) {
      console.error('Erro ao baixar:', error)
    }
  }

  // Compartilhar via WhatsApp COM LINK
  const handleCompartilhar = async (mapa: MapaMentalComStatus) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const linkMapa = `${baseUrl}/mapa/${mapa.id}`

    const texto = `📚 *${mapa.titulo}*

${componente === 'fisica' ? '⚛️ Física' : '📐 Matemática'} - ${SERIES_MAPA_LABELS[mapa.serie]} - ${BIMESTRES_LABELS[mapa.bimestre]}

🔗 ${linkMapa}`

    // Abrir WhatsApp diretamente
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
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BackButton href={`/${componente}/menu`} />
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
                  <button onClick={limparFiltros} className="text-xs px-2 py-1 rounded" style={{ color: corPrimaria }}>
                    Limpar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Série</label>
                  <div className="relative">
                    <select
                      value={serieFiltro || ''}
                      onChange={(e) => setSerieFiltro(e.target.value ? parseInt(e.target.value) as SerieMapa : null)}
                      className="w-full p-2 pr-8 rounded-lg text-sm appearance-none"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Todas</option>
                      {/* Matemática mostra EF e EM, Física só mostra EM */}
                      {componente === 'matematica' && (
                        <>
                          <option value="6">6º Ano (EF)</option>
                          <option value="7">7º Ano (EF)</option>
                          <option value="8">8º Ano (EF)</option>
                          <option value="9">9º Ano (EF)</option>
                        </>
                      )}
                      <option value="1">1ª Série (EM)</option>
                      <option value="2">2ª Série (EM)</option>
                      <option value="3">3ª Série (EM)</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Bimestre</label>
                  <div className="relative">
                    <select
                      value={bimestreFiltro || ''}
                      onChange={(e) => setBimestreFiltro(e.target.value ? parseInt(e.target.value) as Bimestre : null)}
                      className="w-full p-2 pr-8 rounded-lg text-sm appearance-none"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Todos</option>
                      <option value="1">1º Bimestre</option>
                      <option value="2">2º Bimestre</option>
                      <option value="3">3º Bimestre</option>
                      <option value="4">4º Bimestre</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Content - Grid Responsivo */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        {erro ? (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-secondary)' }}>{erro}</p>
            <Button variant={isFisica ? 'fisica' : 'matematica'} onClick={buscarMapas} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        ) : mapas.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--bg-surface)' }}>
              <Map className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Nenhum mapa encontrado</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {temFiltros ? 'Tente ajustar os filtros' : 'Em breve novos mapas serão adicionados'}
            </p>
          </div>
        ) : (
          /* GRID RESPONSIVO: 2 cols mobile, 3 cols tablet, 4 cols desktop */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {mapas.map((mapa, index) => (
              <button
                key={mapa.id}
                onClick={() => abrirVisualizacao(index)}
                className="rounded-xl overflow-hidden text-left transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
              >
                {/* Thumbnail com proporção A4 */}
                <div className="relative" style={{ aspectRatio: '210/297' }}>
                  <img
                    src={mapa.thumbnail_url || mapa.imagem_url}
                    alt={mapa.titulo}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Gradiente inferior */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                  {/* Badge série */}
                  <span
                    className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ background: corPrimaria, color: isFisica ? '#000' : '#fff' }}
                  >
                    {mapa.serie}ª
                  </span>
                  {/* Título sobre a imagem */}
                  <div className="absolute inset-x-0 bottom-0 p-2">
                    <h3 className="font-semibold text-xs text-white line-clamp-2 leading-tight">
                      {mapa.titulo}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-white/70">
                      <span className="flex items-center gap-0.5">
                        <Heart className="w-3 h-3" fill={mapa.curtido ? 'currentColor' : 'none'} />
                        {mapa.curtidas}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Download className="w-3 h-3" />
                        {mapa.downloads}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL LIGHTBOX - DESKTOP/CHROMEBOOK (≥768px)
          ═══════════════════════════════════════════════════════════════════════ */}
      {modalAberto && mapaAtual && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) fecharVisualizacao()
          }}
        >
          {/* Botão Fechar */}
          <button
            onClick={fecharVisualizacao}
            className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Seta Esquerda */}
          <button
            onClick={irParaAnterior}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>

          {/* Seta Direita */}
          <button
            onClick={irParaProximo}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>

          {/* Container do Modal */}
          <div className="relative max-w-5xl w-full mx-4 flex flex-col max-h-[90vh]">
            {/* Header do Modal */}
            <div className="flex-shrink-0 bg-black/50 backdrop-blur-sm rounded-t-2xl px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-white text-lg">{mapaAtual.titulo}</h2>
                <p className="text-sm text-white/60">
                  {SERIES_MAPA_LABELS[mapaAtual.serie]} • {BIMESTRES_LABELS[mapaAtual.bimestre]}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/60 text-sm">
                  {indiceAtual + 1} / {mapas.length}
                </span>
                {/* Controles de Zoom */}
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                  <button
                    onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <ZoomOut className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-white text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(z => Math.min(2, z + 0.25))}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <ZoomIn className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Imagem */}
            <div className="flex-1 overflow-auto bg-black/30 flex items-center justify-center p-4">
              <img
                src={mapaAtual.imagem_url}
                alt={mapaAtual.titulo}
                className="max-w-full max-h-full object-contain rounded-lg transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>

            {/* Footer com Ações */}
            <div className="flex-shrink-0 bg-black/50 backdrop-blur-sm rounded-b-2xl px-6 py-4">
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-white/60 mb-4">
                <span className="flex items-center gap-2">
                  <Heart className="w-5 h-5" fill={mapaAtual.curtido ? 'currentColor' : 'none'} style={{ color: mapaAtual.curtido ? '#ef4444' : 'inherit' }} />
                  {mapaAtual.curtidas} curtidas
                </span>
                <span className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  {mapaAtual.downloads} downloads
                </span>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleCurtir(mapaAtual)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
                  style={{
                    background: mapaAtual.curtido ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
                    color: mapaAtual.curtido ? '#ef4444' : 'white',
                    border: `1px solid ${mapaAtual.curtido ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.2)'}`
                  }}
                >
                  <Heart className="w-5 h-5" fill={mapaAtual.curtido ? 'currentColor' : 'none'} />
                  {mapaAtual.curtido ? 'Curtido' : 'Curtir'}
                </button>
                <button
                  onClick={() => handleDownload(mapaAtual)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <Download className="w-5 h-5" />
                  Baixar HD
                </button>
                <button
                  onClick={() => handleCompartilhar(mapaAtual)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105"
                  style={{
                    background: '#25D366',
                    color: 'white'
                  }}
                >
                  <Share2 className="w-5 h-5" />
                  Compartilhar
                </button>
              </div>
            </div>
          </div>

          {/* Miniaturas na parte inferior */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-sm rounded-xl p-2 max-w-[80vw] overflow-x-auto">
            {mapas.map((mapa, idx) => (
              <button
                key={mapa.id}
                onClick={() => { setIndiceAtual(idx); setZoom(1) }}
                className={`flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden transition-all ${idx === indiceAtual ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
              >
                <img
                  src={mapa.thumbnail_url || mapa.imagem_url}
                  alt={mapa.titulo}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODO STORIES - MOBILE (<768px) - OTIMIZADO
          ═══════════════════════════════════════════════════════════════════════ */}
      {storiesAberto && mapaAtual && (
        <div
          className="fixed inset-0 z-50 bg-black flex flex-col"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Indicadores de progresso - topo */}
          <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-3 flex gap-1">
            {mapas.map((_, idx) => (
              <div
                key={idx}
                className="h-1 flex-1 rounded-full transition-colors cursor-pointer"
                style={{ background: idx === indiceAtual ? corPrimaria : 'rgba(255,255,255,0.3)' }}
                onClick={() => setIndiceAtual(idx)}
              />
            ))}
          </div>

          {/* Header Stories - compacto */}
          <div className="flex-shrink-0 px-4 pt-6 pb-2 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={fecharVisualizacao}
                className="w-10 h-10 rounded-full bg-white/10 active:bg-white/20 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="min-w-0">
                <h2 className="font-semibold text-white text-sm truncate">{mapaAtual.titulo}</h2>
                <p className="text-xs text-white/60">
                  {SERIES_MAPA_LABELS[mapaAtual.serie]} • {BIMESTRES_LABELS[mapaAtual.bimestre]}
                </p>
              </div>
            </div>
            <span className="text-white/60 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
              {indiceAtual + 1}/{mapas.length}
            </span>
          </div>

          {/* Imagem Central - área de swipe */}
          <div className="flex-1 flex items-center justify-center px-2 py-2">
            <img
              src={mapaAtual.imagem_url}
              alt={mapaAtual.titulo}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              BARRA DE AÇÕES MOBILE - OTIMIZADA COM BOTÕES GRANDES (48px)
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="flex-shrink-0 px-4 pb-6 pt-2 bg-gradient-to-t from-black via-black/80 to-transparent">
            {/* Stats compactos */}
            <div className="flex items-center justify-center gap-6 text-sm text-white/70 mb-4">
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4" fill={mapaAtual.curtido ? 'currentColor' : 'none'} style={{ color: mapaAtual.curtido ? '#ef4444' : 'inherit' }} />
                {mapaAtual.curtidas}
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="w-4 h-4" />
                {mapaAtual.downloads}
              </span>
            </div>

            {/* Botões de Ação - GRANDES para touch (min 48px) */}
            <div className="grid grid-cols-4 gap-3">
              {/* Curtir */}
              <button
                onClick={() => handleCurtir(mapaAtual)}
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl transition-all active:scale-95"
                style={{
                  background: mapaAtual.curtido ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.1)',
                  color: mapaAtual.curtido ? '#ef4444' : 'white',
                  minHeight: '72px'
                }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: mapaAtual.curtido ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)' }}>
                  <Heart className="w-6 h-6" fill={mapaAtual.curtido ? 'currentColor' : 'none'} />
                </div>
                <span className="text-[10px] font-medium">{mapaAtual.curtido ? 'Curtido' : 'Curtir'}</span>
              </button>

              {/* Baixar */}
              <button
                onClick={() => handleDownload(mapaAtual)}
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  minHeight: '72px'
                }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <Download className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium">Baixar</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => handleCompartilhar(mapaAtual)}
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl transition-all active:scale-95"
                style={{
                  background: 'rgba(37, 211, 102, 0.2)',
                  color: '#25D366',
                  minHeight: '72px'
                }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#25D366' }}>
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-medium">WhatsApp</span>
              </button>

              {/* Fechar */}
              <button
                onClick={fecharVisualizacao}
                className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  minHeight: '72px'
                }}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <X className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-medium">Fechar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav componente={componente} />
    </div>
  )
}
