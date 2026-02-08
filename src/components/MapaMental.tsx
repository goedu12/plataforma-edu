'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

interface MapaMentalProps {
  codigo: string
  corPrimaria?: string
}

export default function MapaMental({ codigo, corPrimaria = '#22c55e' }: MapaMentalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [zoom, setZoom] = useState(1)
  const [erro, setErro] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const renderMermaid = async () => {
      if (!codigo || !containerRef.current) return

      try {
        // Import dinâmico para evitar SSR issues
        const mermaid = (await import('mermaid')).default

        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: corPrimaria,
            primaryTextColor: '#ffffff',
            primaryBorderColor: corPrimaria,
            lineColor: corPrimaria,
            secondaryColor: '#f0f0f0',
            tertiaryColor: '#ffffff',
            background: 'transparent',
          },
          mindmap: {
            useMaxWidth: true,
            padding: 10,
          },
        })

        // Gerar ID único para evitar conflitos
        const id = `mermaid-${Date.now()}`

        // Renderizar o diagrama
        const { svg: renderedSvg } = await mermaid.render(id, codigo)
        setSvg(renderedSvg)
        setErro(null)
      } catch (err) {
        console.error('Erro ao renderizar mapa mental:', err)
        setErro('Não foi possível renderizar o mapa mental')
      }
    }

    renderMermaid()
  }, [codigo, corPrimaria])

  const handleDownload = () => {
    if (!svg) return

    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mapa-mental.svg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5))
  const toggleFullscreen = () => setFullscreen(prev => !prev)

  if (erro) {
    return (
      <div
        className="p-4 rounded-xl text-sm"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--error)'
        }}
      >
        {erro}
      </div>
    )
  }

  if (!svg) {
    return (
      <div
        className="p-4 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--bg-elevated)' }}
      >
        <div className="animate-pulse text-sm" style={{ color: 'var(--text-muted)' }}>
          Gerando mapa mental...
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${fullscreen ? 'fixed inset-4' : ''}`}
      style={{
        ...(fullscreen ? { zIndex: 100 } : {}),
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)'
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          🗺️ Mapa Mental
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          <span className="text-xs px-2" style={{ color: 'var(--text-muted)' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            title="Tela cheia"
          >
            <Maximize2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
            title="Baixar SVG"
          >
            <Download className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {/* SVG Container */}
      <div
        ref={containerRef}
        className="p-4 overflow-auto"
        style={{
          maxHeight: fullscreen ? 'calc(100vh - 120px)' : '400px',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        <div
          dangerouslySetInnerHTML={{ __html: svg }}
          className="[&_svg]:max-w-full [&_svg]:h-auto"
        />
      </div>

      {/* Overlay para fechar fullscreen */}
      {fullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed inset-0 bg-black/50 -z-10"
          aria-label="Fechar tela cheia"
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// FUNÇÃO PARA EXTRAIR CÓDIGO MERMAID DO TEXTO
// ═══════════════════════════════════════════════════════════

export function extrairCodigoMermaid(texto: string): string | null {
  if (!texto) return null

  // Método 1: Bloco ```mermaid ... ```
  const regexMermaid = /```mermaid\s*([\s\S]*?)```/i
  const matchMermaid = texto.match(regexMermaid)
  if (matchMermaid && matchMermaid[1].includes('mindmap')) {
    return matchMermaid[1].trim()
  }

  // Método 2: Bloco ``` ... ``` com mindmap dentro
  const regexBloco = /```\s*(mindmap[\s\S]*?)```/i
  const matchBloco = texto.match(regexBloco)
  if (matchBloco) {
    return matchBloco[1].trim()
  }

  // Método 3: mindmap direto no texto (sem bloco de código)
  const regexDireto = /^(mindmap\s*\n\s*root[\s\S]*?)(?:\n\n[^a-z\s]|\n📝|\n\*\*|$)/mi
  const matchDireto = texto.match(regexDireto)
  if (matchDireto) {
    return matchDireto[1].trim()
  }

  // Método 4: Procurar linha por linha
  const linhas = texto.split('\n')
  let dentroDoMapa = false
  const linhasMapa: string[] = []

  for (const linha of linhas) {
    if (linha.trim().startsWith('mindmap')) {
      dentroDoMapa = true
      linhasMapa.push(linha)
    } else if (dentroDoMapa) {
      // Continuar se linha está indentada ou vazia
      if (linha.match(/^[\s\t]/) || linha.trim() === '' || linha.includes('root(')) {
        linhasMapa.push(linha)
      } else if (linha.trim().startsWith('```')) {
        // Fim do bloco
        break
      } else if (linhasMapa.length > 2 && !linha.match(/^[\s\t]/)) {
        // Linha não indentada após já ter conteúdo = fim do mapa
        break
      }
    }
  }

  if (linhasMapa.length > 2) {
    return linhasMapa.join('\n').trim()
  }

  return null
}
