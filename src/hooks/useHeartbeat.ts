'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Hook que envia heartbeat ao servidor a cada 10s
 * Detecta se o estudante está ativo (interagindo) ou ocioso (tela aberta sem ação)
 * Retorna se o professor está monitorando a turma
 */
export function useHeartbeat(componente: string) {
  const [monitorado, setMonitorado] = useState(false)
  const ativoRef = useRef(true)
  const ultimaInteracaoRef = useRef(Date.now())

  // Detectar interação do usuário
  const marcarAtivo = useCallback(() => {
    ativoRef.current = true
    ultimaInteracaoRef.current = Date.now()
  }, [])

  useEffect(() => {
    // Eventos que indicam atividade real
    const eventos = ['mousedown', 'keydown', 'touchstart', 'scroll']
    eventos.forEach(e => window.addEventListener(e, marcarAtivo, { passive: true }))

    const intervalo = setInterval(async () => {
      try {
        // Se passou mais de 30s sem interação, marcar como ocioso
        const agora = Date.now()
        if (agora - ultimaInteracaoRef.current > 30000) {
          ativoRef.current = false
        }

        const res = await fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            componente,
            ativo: ativoRef.current,
          }),
        })
        const data = await res.json()
        setMonitorado(data.monitorado || false)
      } catch {
        // silencioso
      }
    }, 10000) // a cada 10s

    // Primeiro ping imediato
    fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ componente, ativo: true }),
    }).then(r => r.json()).then(d => setMonitorado(d.monitorado || false)).catch(() => {})

    return () => {
      clearInterval(intervalo)
      eventos.forEach(e => window.removeEventListener(e, marcarAtivo))
    }
  }, [componente, marcarAtivo])

  return { monitorado }
}
