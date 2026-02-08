'use client'

import { useHeartbeat } from '@/hooks/useHeartbeat'
import { Eye } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// Componente: MonitorIndicator
// Exibe um pequeno indicador quando o professor está monitorando a aula
// Também ativa o heartbeat do estudante automaticamente
// Posicionado no canto esquerdo para não colidir com Toast (canto direito)
// ═══════════════════════════════════════════════════════════════════════════

export default function MonitorIndicator() {
  const { monitorando } = useHeartbeat()

  if (!monitorando) return null

  return (
    <div
      className="fixed bottom-20 lg:bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg animate-fade-in"
      style={{
        background: 'rgba(34, 197, 94, 0.15)',
        border: '1px solid var(--border-fisica)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
      }}
      title="Seu professor está acompanhando a aula ao vivo"
    >
      <Eye className="w-3.5 h-3.5 animate-pulse" style={{ color: 'var(--color-fisica)' }} />
      <span className="text-xs font-medium" style={{ color: 'var(--color-fisica)' }}>Aula monitorada</span>
    </div>
  )
}
