'use client'

import { useHeartbeat } from '@/hooks/useHeartbeat'
import { Eye } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// Componente: MonitorIndicator
// Exibe um pequeno indicador quando o professor está monitorando a aula
// Também ativa o heartbeat do estudante automaticamente
// ═══════════════════════════════════════════════════════════════════════════

export default function MonitorIndicator() {
  const { monitorando } = useHeartbeat()

  if (!monitorando) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg animate-fade-in"
      style={{
        background: 'rgba(34, 197, 94, 0.15)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        backdropFilter: 'blur(8px)',
      }}
      title="Seu professor está acompanhando a aula ao vivo"
    >
      <Eye className="w-3.5 h-3.5 text-green-400 animate-pulse" />
      <span className="text-green-400 text-xs font-medium">Aula monitorada</span>
    </div>
  )
}
