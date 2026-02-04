'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { Componente } from '@/types'

/**
 * Hook para rastrear tempo de uso efetivo em páginas da aplicação.
 *
 * O tempo é computado apenas quando:
 * - A página está visível (não em aba oculta)
 * - O usuário está ativo (não idle por mais de 2 minutos)
 *
 * O tempo é enviado ao servidor:
 * - Quando o usuário sai da página
 * - A cada 60 segundos de uso contínuo
 * - Quando a visibilidade da página muda
 *
 * @param componente - 'fisica' ou 'matematica'
 * @param atividade - tipo de atividade ('teoria', 'flashcards', 'mapas', 'tutor', 'menu', 'notas', etc.)
 */
export function useTempoUso(componente: Componente, atividade: string) {
  const tempoInicioRef = useRef<number>(Date.now())
  const tempoAcumuladoRef = useRef<number>(0)
  const ultimaAtividadeRef = useRef<number>(Date.now())
  const isActiveRef = useRef<boolean>(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const IDLE_TIMEOUT = 2 * 60 * 1000 // 2 minutos de inatividade
  const SYNC_INTERVAL = 60 * 1000 // Sincronizar a cada 60 segundos
  const MIN_TEMPO_REGISTRO = 5 // Mínimo 5 segundos para registrar

  // Função para enviar tempo ao servidor
  const enviarTempo = useCallback(async (segundos: number) => {
    if (segundos < MIN_TEMPO_REGISTRO) return

    try {
      await fetch('/api/tempo-uso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componente,
          atividade,
          segundos: Math.floor(segundos),
        }),
      })
    } catch (error) {
      // Silenciosamente falha - não bloquear UX
      console.warn('Erro ao registrar tempo de uso:', error)
    }
  }, [componente, atividade])

  // Calcular e resetar tempo acumulado
  const calcularEReset = useCallback(() => {
    if (!isActiveRef.current) return 0

    const agora = Date.now()
    const tempoSessao = (agora - tempoInicioRef.current) / 1000
    const tempoTotal = tempoAcumuladoRef.current + tempoSessao

    // Reset
    tempoInicioRef.current = agora
    tempoAcumuladoRef.current = 0

    return tempoTotal
  }, [])

  // Pausar contagem (quando idle ou aba oculta)
  const pausar = useCallback(() => {
    if (!isActiveRef.current) return

    const agora = Date.now()
    const tempoSessao = (agora - tempoInicioRef.current) / 1000
    tempoAcumuladoRef.current += tempoSessao
    isActiveRef.current = false
  }, [])

  // Retomar contagem
  const retomar = useCallback(() => {
    if (isActiveRef.current) return

    tempoInicioRef.current = Date.now()
    ultimaAtividadeRef.current = Date.now()
    isActiveRef.current = true
  }, [])

  // Registrar atividade do usuário
  const registrarAtividade = useCallback(() => {
    ultimaAtividadeRef.current = Date.now()
    if (!isActiveRef.current) {
      retomar()
    }
  }, [retomar])

  useEffect(() => {
    // Inicializar
    tempoInicioRef.current = Date.now()
    ultimaAtividadeRef.current = Date.now()
    isActiveRef.current = true

    // Detectar inatividade
    const checkIdle = () => {
      const tempoIdle = Date.now() - ultimaAtividadeRef.current
      if (tempoIdle > IDLE_TIMEOUT && isActiveRef.current) {
        pausar()
      }
    }

    // Sincronização periódica
    const sincronizar = async () => {
      checkIdle()
      if (isActiveRef.current) {
        const tempo = calcularEReset()
        if (tempo >= MIN_TEMPO_REGISTRO) {
          await enviarTempo(tempo)
        }
      }
    }

    // Event listeners para detectar atividade
    const eventos = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove']
    eventos.forEach(evento => {
      document.addEventListener(evento, registrarAtividade, { passive: true })
    })

    // Visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const tempo = calcularEReset()
        if (tempo >= MIN_TEMPO_REGISTRO) {
          // Usar sendBeacon para garantir envio mesmo ao fechar aba
          const data = JSON.stringify({
            componente,
            atividade,
            segundos: Math.floor(tempo),
          })
          navigator.sendBeacon('/api/tempo-uso', data)
        }
        pausar()
      } else {
        retomar()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Intervalo de sincronização
    intervalRef.current = setInterval(sincronizar, SYNC_INTERVAL)

    // Cleanup
    return () => {
      eventos.forEach(evento => {
        document.removeEventListener(evento, registrarAtividade)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      // Enviar tempo restante ao desmontar
      const tempoFinal = calcularEReset()
      if (tempoFinal >= MIN_TEMPO_REGISTRO) {
        const data = JSON.stringify({
          componente,
          atividade,
          segundos: Math.floor(tempoFinal),
        })
        navigator.sendBeacon('/api/tempo-uso', data)
      }
    }
  }, [componente, atividade, enviarTempo, calcularEReset, pausar, retomar, registrarAtividade])

  return { registrarAtividade }
}

export default useTempoUso
