'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, Minimize2, Zap, Camera, Mic, MicOff, Volume2, VolumeX, XCircle } from 'lucide-react'
import MensagemFormatada from './MensagemFormatada'
import { TypingIndicator } from './ui/Loading'
import { useWebSpeech } from '@/hooks/useWebSpeech'
import type { Componente, MensagemChat } from '@/types'
import { PONTUACAO } from '@/types'

// ═══════════════════════════════════════════════════════════
// TutorMiniChat — Widget flutuante do Tutor IA (completo)
// Câmera, Microfone, TTS, Sugestões, Mermaid, LaTeX
// ═══════════════════════════════════════════════════════════

const MAX_CARACTERES = 2000
const IMAGE_QUALITY = 0.7
const MAX_IMAGE_SIZE = 1024 * 1024

interface MensagemMini extends MensagemChat {
  modo?: string
  sugestoes?: string[]
  imagemBase64?: string
}

function extrairSugestoes(texto: string): { textoLimpo: string; sugestoes: string[] } {
  const regex = /\[SUGESTOES\]([\s\S]*?)\[\/SUGESTOES\]/
  const match = texto.match(regex)
  if (!match) return { textoLimpo: texto, sugestoes: [] }
  const textoLimpo = texto.replace(regex, '').trim()
  const sugestoes = match[1]
    .split('\n')
    .map(s => s.replace(/^[\s\-\*•]+/, '').trim())
    .filter(s => s.length > 0)
    .slice(0, 3)
  return { textoLimpo, sugestoes }
}

export default function TutorMiniChat({ componente }: { componente: Componente }) {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState<MensagemMini[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usoHoje, setUsoHoje] = useState(0)
  const [nomeEstudante, setNomeEstudante] = useState('Estudante')
  const [inicializado, setInicializado] = useState(false)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [imagemBase64, setImagemBase64] = useState<string | null>(null)

  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    isListening, transcript, startListening, stopListening, sttSupported,
    isSpeaking, speak, stopSpeaking, ttsSupported,
  } = useWebSpeech()

  const isFisica = componente === 'fisica'
  const nomeTutor = isFisica ? 'Newton' : 'Pitágoras'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'
  const limiteDiario = PONTUACAO.LIMITE_IA_DIARIO
  const restantes = Math.max(limiteDiario - usoHoje, 0)

  // Buscar dados do usuário na primeira abertura
  useEffect(() => {
    if (!aberto || inicializado) return
    setInicializado(true)

    fetch('/api/usuario')
      .then(r => r.json())
      .then(data => {
        if (data.sucesso && data.usuario) {
          setNomeEstudante(data.usuario.nome.split(' ')[0])
          const uso = isFisica ? data.usuario.fis_uso_ia_hoje : data.usuario.mat_uso_ia_hoje
          setUsoHoje(uso || 0)
        }
      })
      .catch(() => {})

    const disciplina = isFisica ? 'Física' : 'Matemática'
    setMensagens([{
      id: '1',
      role: 'assistant',
      content: `Olá! Sou o ${nomeTutor}. Como posso te ajudar com ${disciplina}?`,
      timestamp: new Date().toISOString(),
      sugestoes: [
        `Me ajude com uma questão`,
        `Quero enviar foto de uma questão`,
        `Mapa mental de um tema`,
      ],
    }])
  }, [aberto, inicializado, isFisica, nomeTutor])

  // Scroll automático
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensagens, loading])

  // Focar input ao abrir
  useEffect(() => {
    if (aberto && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [aberto])

  // Atualizar input com transcrição de voz
  useEffect(() => {
    if (transcript) setInput(transcript)
  }, [transcript])

  // ═══════════════════════════════════════════════════════════
  // HANDLERS DE IMAGEM
  // ═══════════════════════════════════════════════════════════

  const comprimirImagem = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = document.createElement('img')
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          const MAX_DIM = 800
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) { height = (height / width) * MAX_DIM; width = MAX_DIM }
            else { width = (width / height) * MAX_DIM; height = MAX_DIM }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) { reject(new Error('Erro ao processar imagem')); return }
          ctx.drawImage(img, 0, 0, width, height)
          const base64 = canvas.toDataURL('image/jpeg', IMAGE_QUALITY)
          const tamanho = base64.length * 0.75
          if (tamanho > MAX_IMAGE_SIZE) {
            resolve(canvas.toDataURL('image/jpeg', 0.5).split(',')[1])
          } else {
            resolve(base64.split(',')[1])
          }
        }
        img.onerror = () => reject(new Error('Erro ao carregar imagem'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsDataURL(file)
    })
  }, [])

  const handleImagemSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    try {
      const base64 = await comprimirImagem(file)
      setImagemBase64(base64)
      setImagemPreview(`data:image/jpeg;base64,${base64}`)
    } catch (err) {
      console.error('Erro ao processar imagem:', err)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [comprimirImagem])

  const removerImagem = useCallback(() => {
    setImagemPreview(null)
    setImagemBase64(null)
  }, [])

  // ═══════════════════════════════════════════════════════════
  // ENVIAR MENSAGEM
  // ═══════════════════════════════════════════════════════════

  const enviarMensagem = useCallback(async (textoPersonalizado?: string) => {
    const texto = (textoPersonalizado || input.trim()).slice(0, MAX_CARACTERES)
    if ((!texto && !imagemBase64) || loading || restantes <= 0) return

    const novaMensagem: MensagemMini = {
      id: Date.now().toString(),
      role: 'user',
      content: texto || '[Imagem enviada]',
      timestamp: new Date().toISOString(),
      imagemBase64: imagemBase64 || undefined,
    }

    setMensagens(prev => [...prev, novaMensagem])
    setInput('')
    setLoading(true)

    const imagemParaEnviar = imagemBase64
    removerImagem()

    try {
      const historico = mensagens
        .filter(m => m.id !== '1')
        .slice(-8)
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componente,
          mensagem: texto || 'Analise esta imagem. Se for uma questão ou exercício, resolva completamente e me dê o gabarito com a resposta correta. Mostre o passo a passo.',
          historico,
          nomeEstudante,
          imagem: imagemParaEnviar,
        }),
      })

      const data = await res.json()

      if (data.sucesso && data.resposta) {
        const { textoLimpo, sugestoes } = extrairSugestoes(data.resposta)
        setMensagens(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: textoLimpo,
          timestamp: new Date().toISOString(),
          modo: data.modo,
          sugestoes,
        }])
        if (data.uso_hoje !== undefined) setUsoHoje(data.uso_hoje)
      } else {
        setMensagens(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.erro || 'Erro ao gerar resposta.',
          timestamp: new Date().toISOString(),
        }])
      }
    } catch {
      setMensagens(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Erro de conexão. Tente novamente.',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setLoading(false)
    }
  }, [input, imagemBase64, loading, restantes, mensagens, componente, nomeEstudante, removerImagem])

  const toggleListening = () => {
    if (isListening) stopListening()
    else startListening()
  }

  const toggleSpeaking = (texto: string) => {
    if (isSpeaking) stopSpeaking()
    else speak(texto)
  }

  // FAB (Floating Action Button)
  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="fixed bottom-20 right-4 lg:bottom-4 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95"
        style={{ background: corPrimaria, zIndex: 60 }}
        title={`Perguntar ao ${nomeTutor}`}
      >
        <Bot className="w-6 h-6 text-white" />
      </button>
    )
  }

  // Chat aberto
  return (
    <div
      className="fixed bottom-20 right-4 lg:bottom-4 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
      style={{
        width: 'min(380px, calc(100vw - 32px))',
        height: 'min(520px, calc(100dvh - 96px))',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        zIndex: 60,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 flex-shrink-0"
        style={{ background: corPrimaria }}
      >
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-semibold">{nomeTutor}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 text-white/80 text-xs">
            <Zap className="w-3 h-3" />
            {restantes}
          </span>
          <button
            onClick={() => setAberto(false)}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
            style={{ minWidth: '36px', minHeight: '36px' }}
          >
            <Minimize2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-3"
        style={{ background: 'var(--bg-base)' }}
      >
        {mensagens.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className="max-w-[88%] px-3 py-2 rounded-xl text-sm"
              style={{
                background: msg.role === 'user' ? corPrimaria : 'var(--bg-surface)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                border: msg.role === 'assistant' ? '1px solid var(--border-default)' : 'none',
              }}
            >
              {/* TTS button for assistant messages */}
              {msg.role === 'assistant' && msg.id !== '1' && ttsSupported && (
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => toggleSpeaking(msg.content)}
                    className="p-0.5 rounded transition-colors hover:bg-black/10"
                    title={isSpeaking ? 'Parar' : 'Ouvir'}
                  >
                    {isSpeaking ? (
                      <VolumeX className="w-3.5 h-3.5" style={{ color: 'var(--error)' }} />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" style={{ color: corPrimaria }} />
                    )}
                  </button>
                </div>
              )}

              {/* User image */}
              {msg.imagemBase64 && (
                <div className="mb-2">
                  <img
                    src={`data:image/jpeg;base64,${msg.imagemBase64}`}
                    alt="Imagem enviada"
                    className="max-w-full rounded-lg"
                    style={{ maxHeight: '120px' }}
                  />
                </div>
              )}

              {msg.role === 'assistant' ? (
                <MensagemFormatada conteudo={msg.content} />
              ) : (
                <span>{msg.content}</span>
              )}

              {/* Sugestões clicáveis */}
              {msg.role === 'assistant' && msg.sugestoes && msg.sugestoes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid var(--border-default)' }}>
                  {msg.sugestoes.map((sugestao, idx) => (
                    <button
                      key={idx}
                      onClick={() => enviarMensagem(sugestao)}
                      disabled={loading || restantes <= 0}
                      className="text-[11px] px-2 py-1 rounded-full transition-all disabled:opacity-50"
                      style={{
                        background: isFisica ? 'var(--color-fisica-bg-10)' : 'var(--color-matematica-bg-10)',
                        border: `1px solid ${isFisica ? 'var(--color-fisica-bg-30)' : 'var(--color-matematica-bg-30)'}`,
                        color: corPrimaria,
                      }}
                    >
                      {sugestao}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded-xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
            >
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      {/* Image preview */}
      {imagemPreview && (
        <div
          className="px-3 py-1.5 flex items-center gap-2 flex-shrink-0"
          style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)' }}
        >
          <div className="relative">
            <img src={imagemPreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
            <button
              onClick={removerImagem}
              className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full"
              style={{ background: 'var(--error)', color: 'white' }}
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Pronta para enviar</span>
        </div>
      )}

      {/* Input area */}
      <div
        className="flex items-center gap-1.5 px-2 py-2 flex-shrink-0"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImagemSelect}
          className="hidden"
        />

        {/* Camera button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="p-2 rounded-lg transition-colors disabled:opacity-30 flex-shrink-0"
          style={{ color: 'var(--text-muted)' }}
          title="Enviar foto"
        >
          <Camera className="w-4.5 h-4.5" />
        </button>

        {/* Mic button */}
        {sttSupported && (
          <button
            onClick={toggleListening}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors disabled:opacity-30 flex-shrink-0 ${isListening ? 'animate-pulse' : ''}`}
            style={{
              background: isListening ? corPrimaria : 'transparent',
              color: isListening ? 'white' : 'var(--text-muted)',
            }}
            title={isListening ? 'Parar' : 'Falar'}
          >
            {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
          </button>
        )}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_CARACTERES))}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
          placeholder={isListening ? 'Ouvindo...' : restantes > 0 ? 'Pergunte algo...' : 'Limite atingido'}
          disabled={restantes <= 0 || isListening}
          maxLength={MAX_CARACTERES}
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: 'var(--text-primary)' }}
        />

        {/* Send button */}
        <button
          onClick={() => enviarMensagem()}
          disabled={(!input.trim() && !imagemBase64) || loading || restantes <= 0}
          className="p-2 rounded-lg transition-colors disabled:opacity-30 flex items-center justify-center flex-shrink-0"
          style={{ background: corPrimaria, minWidth: '36px', minHeight: '36px' }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
