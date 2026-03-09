'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
// Hook: useHeartbeat
// Envia heartbeat silencioso ao servidor a cada 30s
// Rastreia a última interação real do usuário (click, tecla, scroll, touch)
// Retorna se o professor está monitorando
// ═══════════════════════════════════════════════════════════════════════════

const HEARTBEAT_INTERVAL = 30_000 // 30 segundos
const INTERACTION_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const

export function useHeartbeat() {
  const [monitorando, setMonitorando] = useState(false)
  const ultimaInteracaoRef = useRef(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Usar ref para manter referencia estavel do handler (evita memory leak)
  const registrarInteracaoRef = useRef(() => {
    ultimaInteracaoRef.current = Date.now()
  })

  // Enviar heartbeat
  const enviarHeartbeat = useCallback(async () => {
    try {
      const res = await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ultimaInteracao: ultimaInteracaoRef.current,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setMonitorando(!!data.monitorando)
      }
    } catch {
      // Silencioso - não interromper o estudante
    }
  }, [])

  useEffect(() => {
    // Enviar primeiro heartbeat imediatamente
    enviarHeartbeat()

    // Configurar intervalo
    intervalRef.current = setInterval(enviarHeartbeat, HEARTBEAT_INTERVAL)

    // Registrar eventos de interacao usando ref estavel
    const handler = registrarInteracaoRef.current
    for (const event of INTERACTION_EVENTS) {
      window.addEventListener(event, handler, { passive: true })
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      for (const event of INTERACTION_EVENTS) {
        window.removeEventListener(event, handler)
      }
    }
  }, [enviarHeartbeat])

  return { monitorando }
}
