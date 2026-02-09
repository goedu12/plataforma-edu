'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ═══════════════════════════════════════════════════════════
// TIPOS PARA WEB SPEECH API
// ═══════════════════════════════════════════════════════════

// Interface para SpeechRecognition (não disponível globalmente em todos os browsers)
interface ISpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: ISpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null
}

interface ISpeechRecognitionEvent {
  results: {
    length: number
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface ISpeechRecognitionErrorEvent {
  error: string
}

interface UseWebSpeechReturn {
  // Speech-to-Text (STT)
  isListening: boolean
  transcript: string
  startListening: () => void
  stopListening: () => void
  sttSupported: boolean

  // Text-to-Speech (TTS)
  isSpeaking: boolean
  speak: (text: string) => void
  stopSpeaking: () => void
  ttsSupported: boolean

  // Estado geral
  error: string | null
}

// ═══════════════════════════════════════════════════════════
// HOOK PRINCIPAL
// ═══════════════════════════════════════════════════════════

export function useWebSpeech(): UseWebSpeechReturn {
  // Estados STT
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [sttSupported, setSttSupported] = useState(false)

  // Estados TTS
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)

  // Estado geral
  const [error, setError] = useState<string | null>(null)

  // Refs
  const recognitionRef = useRef<ISpeechRecognition | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // ═══════════════════════════════════════════════════════════
  // DETECTAR SUPORTE DO NAVEGADOR
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    // Verificar suporte STT
    const windowWithSpeech = window as Window & {
      SpeechRecognition?: new () => ISpeechRecognition
      webkitSpeechRecognition?: new () => ISpeechRecognition
    }
    const SpeechRecognitionConstructor = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition

    if (SpeechRecognitionConstructor) {
      setSttSupported(true)
      const recognition = new SpeechRecognitionConstructor()
      recognitionRef.current = recognition
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'pt-BR'

      recognition.onresult = (event: ISpeechRecognitionEvent) => {
        const result = event.results[event.results.length - 1]
        const transcriptText = result[0].transcript
        setTranscript(transcriptText)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
        console.error('STT Error:', event.error)
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setError('Permissão de microfone negada')
        }
      }
    }

    // Verificar suporte TTS
    if ('speechSynthesis' in window) {
      setTtsSupported(true)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // ═══════════════════════════════════════════════════════════
  // FUNÇÕES STT (Voz para Texto)
  // ═══════════════════════════════════════════════════════════

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return

    setError(null)
    setTranscript('')
    setIsListening(true)

    try {
      recognitionRef.current.start()
    } catch (err) {
      console.error('Erro ao iniciar reconhecimento:', err)
      setIsListening(false)
      setError('Erro ao iniciar microfone')
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.stop()
    } catch (err) {
      console.error('Erro ao parar reconhecimento:', err)
    }
    setIsListening(false)
  }, [])

  // ═══════════════════════════════════════════════════════════
  // FUNÇÕES TTS (Texto para Voz)
  // ═══════════════════════════════════════════════════════════

  const speak = useCallback((text: string) => {
    if (!ttsSupported || !text.trim()) return

    // Cancelar qualquer fala em andamento
    window.speechSynthesis.cancel()

    // Limpar texto (remover emojis, markdown e LaTeX)
    const cleanText = text
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remover emojis
      .replace(/\$\$([\s\S]*?)\$\$/g, ' fórmula ') // LaTeX em bloco -> "fórmula"
      .replace(/\$(.*?)\$/g, (_match, formula: string) => {
        // Tentar ler fórmulas simples naturalmente
        return formula
          .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '$1 sobre $2')
          .replace(/\\sqrt\{(.*?)\}/g, 'raiz de $1')
          .replace(/\\vec\{(.*?)\}/g, 'vetor $1')
          .replace(/\\cdot/g, ' vezes ')
          .replace(/\\times/g, ' vezes ')
          .replace(/\\div/g, ' dividido por ')
          .replace(/\\pm/g, ' mais ou menos ')
          .replace(/\\neq/g, ' diferente de ')
          .replace(/\\leq/g, ' menor ou igual a ')
          .replace(/\\geq/g, ' maior ou igual a ')
          .replace(/\\approx/g, ' aproximadamente ')
          .replace(/\\infty/g, ' infinito ')
          .replace(/\\Delta/g, 'delta ')
          .replace(/\\alpha/g, 'alfa ')
          .replace(/\\beta/g, 'beta ')
          .replace(/\\theta/g, 'teta ')
          .replace(/\\pi/g, 'pi ')
          .replace(/\\[a-zA-Z]+/g, ' ') // Remover outros comandos LaTeX
          .replace(/[{}^_]/g, ' ') // Remover sintaxe LaTeX restante
          .replace(/\s+/g, ' ')
          .trim()
      })
      .replace(/```mermaid[\s\S]*?```/g, ' diagrama ') // Remover blocos mermaid
      .replace(/```[\s\S]*?```/g, ' código ') // Remover blocos de código
      .replace(/[*_`#]/g, '') // Remover markdown
      .replace(/\n{2,}/g, '. ') // Converter múltiplas quebras em pausa
      .replace(/\n/g, ' ') // Quebras simples viram espaço
      .replace(/\s+/g, ' ') // Normalizar espaços
      .trim()

    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.95 // Velocidade ligeiramente mais lenta para clareza
    utterance.pitch = 1

    // Tentar encontrar voz brasileira
    const voices = window.speechSynthesis.getVoices()
    const ptBRVoice = voices.find(v => v.lang === 'pt-BR') ||
                      voices.find(v => v.lang.startsWith('pt'))

    if (ptBRVoice) {
      utterance.voice = ptBRVoice
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [ttsSupported])

  const stopSpeaking = useCallback(() => {
    if (!ttsSupported) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [ttsSupported])

  return {
    // STT
    isListening,
    transcript,
    startListening,
    stopListening,
    sttSupported,

    // TTS
    isSpeaking,
    speak,
    stopSpeaking,
    ttsSupported,

    // Geral
    error,
  }
}

