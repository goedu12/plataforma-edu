'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ═══════════════════════════════════════════════════════════
// useActiveTimer — Timer que pausa quando o aluno está ocioso
//
// Monitora interações reais (mouse, teclado, toque, scroll)
// e pausa a contagem após IDLE_THRESHOLD sem interação.
// Retoma automaticamente quando o aluno interage novamente.
// ═══════════════════════════════════════════════════════════

const IDLE_THRESHOLD = 60_000 // 60s sem interação = pausar
const CHECK_INTERVAL = 1_000 // Verificar a cada 1s
const INTERACTION_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

interface UseActiveTimerReturn {
  /** Tempo ativo em segundos (exclui tempo ocioso) */
  tempoAtivo: number
  /** Se o timer está pausado por ociosidade */
  pausado: boolean
  /** Resetar o timer para 0 */
  resetar: () => void
}

export function useActiveTimer(): UseActiveTimerReturn {
  const [tempoAtivo, setTempoAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)
  const ultimaInteracaoRef = useRef(Date.now())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Atualizar timestamp de última interação
  const registrarInteracao = useCallback(() => {
    ultimaInteracaoRef.current = Date.now()
    setPausado(false)
  }, [])

  // Registrar listeners de interação
  useEffect(() => {
    for (const event of INTERACTION_EVENTS) {
      window.addEventListener(event, registrarInteracao, { passive: true })
    }
    return () => {
      for (const event of INTERACTION_EVENTS) {
        window.removeEventListener(event, registrarInteracao)
      }
    }
  }, [registrarInteracao])

  // Timer que só incrementa se não está ocioso
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const agora = Date.now()
      const tempoSemInteracao = agora - ultimaInteracaoRef.current

      if (tempoSemInteracao >= IDLE_THRESHOLD) {
        // Ocioso — não incrementar
        setPausado(true)
      } else {
        // Ativo — incrementar
        setPausado(false)
        setTempoAtivo(prev => prev + 1)
      }
    }, CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const resetar = useCallback(() => {
    setTempoAtivo(0)
    setPausado(false)
    ultimaInteracaoRef.current = Date.now()
  }, [])

  return { tempoAtivo, pausado, resetar }
}
