'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Trash2,
  Bot,
  AlertCircle,
  X,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Calculator,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  XCircle
} from 'lucide-react'
import Button from './ui/Button'
import { TypingIndicator } from './ui/Loading'
import { useWebSpeech } from '@/hooks/useWebSpeech'
import type { Componente, MensagemChat } from '@/types'

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════

type ModoIA = 'DIRETO' | 'PASSO_A_PASSO' | 'ESTIMULAR' | 'SOCRATICO' | 'CONVERSACIONAL'

const MODO_BADGES: Record<ModoIA, { icone: string; label: string }> = {
  'DIRETO': { icone: '⚡', label: 'Direto' },
  'PASSO_A_PASSO': { icone: '📝', label: 'Passo a Passo' },
  'ESTIMULAR': { icone: '💪', label: 'Motivação' },
  'SOCRATICO': { icone: '🎓', label: 'Socrático' },
  'CONVERSACIONAL': { icone: '💬', label: 'Conversa' },
}

interface MensagemChatComModo extends MensagemChat {
  modo?: ModoIA
  topico?: string
  imagemBase64?: string
}

interface TutorChatProps {
  componente: Componente
  nomeTutor: string
  nomeEstudante?: string
  usoHoje: number
  limiteDiario: number
  onClose: () => void
}

// ═══════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════

const MAX_CARACTERES = 500
const MAX_IMAGE_SIZE = 1024 * 1024 // 1MB após compressão
const IMAGE_QUALITY = 0.7

const SUGESTOES_INICIAIS = {
  fisica: [
    { icon: Lightbulb, texto: 'Explique as Leis de Newton', prompt: 'Me explique as três Leis de Newton de forma simples e com exemplos do dia a dia' },
    { icon: Calculator, texto: 'Como calcular velocidade?', prompt: 'Como calculo a velocidade média de um objeto? Me dê exemplos práticos' },
    { icon: HelpCircle, texto: 'O que é energia cinética?', prompt: 'O que é energia cinética e como calcular? Explique com exemplos' },
    { icon: BookOpen, texto: 'Movimento circular', prompt: 'Me ensine sobre movimento circular uniforme de forma simples' },
  ],
  matematica: [
    { icon: Lightbulb, texto: 'Equação do 2º grau', prompt: 'Me ensine a resolver equações do segundo grau passo a passo' },
    { icon: Calculator, texto: 'Regra de três', prompt: 'Me explique como fazer regra de três simples e composta com exemplos' },
    { icon: HelpCircle, texto: 'Função quadrática', prompt: 'O que é uma função quadrática e como funciona? Me dê exemplos' },
    { icon: BookOpen, texto: 'Teorema de Pitágoras', prompt: 'Me explique o Teorema de Pitágoras com exemplos práticos' },
  ],
}

// Removido: sugestões de continuidade e mapas mentais

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default function TutorChat({
  componente,
  nomeTutor,
  nomeEstudante = 'Estudante',
  usoHoje: usoInicial,
  limiteDiario,
  onClose,
}: TutorChatProps) {
  // Estados principais
  const [mensagens, setMensagens] = useState<MensagemChatComModo[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usoHoje, setUsoHoje] = useState(usoInicial)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarSugestoesIniciais, setMostrarSugestoesIniciais] = useState(true)

  // Estados de imagem
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [imagemBase64, setImagemBase64] = useState<string | null>(null)

  // Refs
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Hook de voz
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    sttSupported,
    isSpeaking,
    speak,
    stopSpeaking,
    ttsSupported,
  } = useWebSpeech()

  // Constantes derivadas
  const sugestoesIniciais = SUGESTOES_INICIAIS[componente]
  const primeiroNome = nomeEstudante.split(' ')[0]
  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // ═══════════════════════════════════════════════════════════
  // EFEITOS
  // ═══════════════════════════════════════════════════════════

  // Mensagem inicial
  useEffect(() => {
    const disciplina = componente === 'fisica' ? 'Física' : 'Matemática'
    const mensagemInicial: MensagemChat = {
      id: '1',
      role: 'assistant',
      content: `Olá, ${primeiroNome}! 👋\n\nSou o ${nomeTutor}, seu tutor de ${disciplina}! Estou aqui para te ajudar a aprender de forma simples e divertida.\n\n💡 Você pode:\n• Digitar sua dúvida\n• Enviar uma foto da questão 📷\n• Falar sua pergunta 🎤\n• Ouvir minhas explicações 🔊\n\nEscolha uma das perguntas abaixo ou comece do seu jeito!`,
      timestamp: new Date().toISOString(),
    }
    setMensagens([mensagemInicial])
  }, [nomeTutor, componente, primeiroNome])

  // Scroll automático
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensagens, loading])

  // Atualizar input com transcrição de voz
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
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

          // Redimensionar se muito grande
          const MAX_DIM = 800
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = (height / width) * MAX_DIM
              width = MAX_DIM
            } else {
              width = (width / height) * MAX_DIM
              height = MAX_DIM
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Erro ao processar imagem'))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)

          // Converter para JPEG com qualidade reduzida
          const base64 = canvas.toDataURL('image/jpeg', IMAGE_QUALITY)

          // Verificar tamanho
          const tamanho = base64.length * 0.75 // Aproximação do tamanho em bytes
          if (tamanho > MAX_IMAGE_SIZE) {
            // Comprimir mais se necessário
            const qualidadeMenor = canvas.toDataURL('image/jpeg', 0.5)
            resolve(qualidadeMenor.split(',')[1])
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

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setErro('Por favor, selecione uma imagem válida')
      return
    }

    // Validar tamanho original (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErro('Imagem muito grande. Máximo 5MB.')
      return
    }

    try {
      const base64 = await comprimirImagem(file)
      setImagemBase64(base64)
      setImagemPreview(`data:image/jpeg;base64,${base64}`)
      setErro(null)
    } catch (err) {
      console.error('Erro ao processar imagem:', err)
      setErro('Erro ao processar imagem')
    }

    // Limpar input para permitir selecionar a mesma imagem novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [comprimirImagem])

  const removerImagem = useCallback(() => {
    setImagemPreview(null)
    setImagemBase64(null)
  }, [])

  // ═══════════════════════════════════════════════════════════
  // ENVIAR MENSAGEM
  // ═══════════════════════════════════════════════════════════

  const enviarMensagem = async (textoPersonalizado?: string) => {
    const texto = (textoPersonalizado || input.trim()).slice(0, MAX_CARACTERES)

    // Permitir envio se tem texto OU imagem
    if ((!texto && !imagemBase64) || loading || usoHoje >= limiteDiario) return

    const novaMensagem: MensagemChatComModo = {
      id: Date.now().toString(),
      role: 'user',
      content: texto || '📷 [Imagem enviada]',
      timestamp: new Date().toISOString(),
      imagemBase64: imagemBase64 || undefined,
    }

    setMensagens(prev => [...prev, novaMensagem])
    setInput('')
    setLoading(true)
    setErro(null)
    setMostrarSugestoesIniciais(false)

    // Limpar imagem após enviar
    const imagemParaEnviar = imagemBase64
    removerImagem()

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componente,
          mensagem: texto || 'Analise esta imagem e me ajude a entender ou resolver o que está nela.',
          historico: mensagens,
          nomeEstudante: primeiroNome,
          imagem: imagemParaEnviar, // Enviar base64 da imagem
        }),
      })

      const data = await response.json()

      if (data.sucesso) {
        const respostaTutor: MensagemChatComModo = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.resposta,
          timestamp: new Date().toISOString(),
          modo: data.modo as ModoIA,
          topico: data.topico,
        }
        setMensagens(prev => [...prev, respostaTutor])
        setUsoHoje(data.uso_hoje)
      } else {
        setErro(data.erro || 'Erro ao comunicar com o tutor')
      }
    } catch (error) {
      console.error('Erro no chat:', error)
      setErro('Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LIMPAR CHAT
  // ═══════════════════════════════════════════════════════════

  const limparChat = async () => {
    if (mensagens.length > 1 && !window.confirm('Tem certeza que deseja limpar a conversa?')) {
      return
    }

    try {
      await fetch('/api/tutor/limpar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ componente }),
      })

      setMensagens([
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Chat reiniciado, ${primeiroNome}! 🔄\n\nVamos começar de novo? Escolha uma pergunta ou digite sua dúvida!`,
          timestamp: new Date().toISOString(),
        },
      ])
      setMostrarSugestoesIniciais(true)
    } catch (error) {
      console.error('Erro ao limpar chat:', error)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // HANDLER DE VOZ
  // ═══════════════════════════════════════════════════════════

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const toggleSpeaking = (texto: string) => {
    if (isSpeaking) {
      stopSpeaking()
    } else {
      speak(texto)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Header do Chat */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)'
            }}
          >
            <Bot className="w-6 h-6" style={{ color: corPrimaria }} />
          </div>
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{nomeTutor}</h2>
            <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <Sparkles className="w-3 h-3" style={{ color: corPrimaria }} />
              IA • {usoHoje}/{limiteDiario} msgs hoje
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={limparChat}
            className="p-2.5 rounded-xl transition-all touch-target"
            style={{ color: 'var(--text-muted)' }}
            title="Limpar conversa"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl transition-all touch-target"
            style={{ color: 'var(--text-muted)' }}
            title="Sair do chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ background: 'var(--bg-base)' }}
      >
        {mensagens.map(msg => {
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[85%] p-4 rounded-2xl"
                style={{
                  background: msg.role === 'user'
                    ? 'var(--bg-elevated)'
                    : isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                  border: msg.role === 'user'
                    ? '1px solid var(--border-default)'
                    : `1px solid ${isFisica ? 'var(--border-fisica)' : 'var(--border-matematica)'}`,
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                }}
              >
                {/* Header da mensagem do assistente */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4" style={{ color: corPrimaria }} />
                    <span className="text-xs font-medium" style={{ color: corPrimaria }}>{nomeTutor}</span>
                    {msg.modo && MODO_BADGES[msg.modo] && (
                      <span
                        className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-medium"
                        style={{
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {MODO_BADGES[msg.modo].icone} {MODO_BADGES[msg.modo].label}
                      </span>
                    )}
                    {/* Botão de ouvir resposta */}
                    {ttsSupported && (
                      <button
                        onClick={() => toggleSpeaking(msg.content)}
                        className="p-1 rounded-lg transition-colors hover:bg-black/10"
                        title={isSpeaking ? 'Parar de falar' : 'Ouvir resposta'}
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-4 h-4" style={{ color: 'var(--error)' }} />
                        ) : (
                          <Volume2 className="w-4 h-4" style={{ color: corPrimaria }} />
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Imagem enviada pelo usuário */}
                {msg.imagemBase64 && (
                  <div className="mb-3">
                    <img
                      src={`data:image/jpeg;base64,${msg.imagemBase64}`}
                      alt="Imagem enviada"
                      className="max-w-full rounded-xl"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}

                {/* Conteúdo da mensagem */}
                <p
                  className="text-sm whitespace-pre-wrap leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {msg.content}
                </p>
              </div>
            </div>
          )
        })}

        {/* Sugestões Iniciais */}
        {mostrarSugestoesIniciais && mensagens.length <= 1 && !loading && (
          <div className="space-y-4">
            <p
              className="text-xs font-medium flex items-center gap-2"
              style={{ color: 'var(--text-muted)' }}
            >
              <Lightbulb className="w-3.5 h-3.5" style={{ color: corPrimaria }} />
              Sugestões para você, {primeiroNome}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sugestoesIniciais.map((sugestao, index) => (
                <button
                  key={index}
                  onClick={() => enviarMensagem(sugestao.prompt)}
                  className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all group touch-target"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isFisica ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)'
                    }}
                  >
                    <sugestao.icon className="w-5 h-5" style={{ color: corPrimaria }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-sm font-medium block"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {sugestao.texto}
                    </span>
                  </div>
                  <ArrowRight
                    className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-1"
                    style={{ color: corPrimaria }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Loading */}
        {loading && (
          <div className="flex justify-start">
            <div
              className="p-4 rounded-2xl"
              style={{
                background: isFisica ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                border: `1px solid ${isFisica ? 'var(--border-fisica)' : 'var(--border-matematica)'}`,
                borderRadius: '16px 16px 16px 4px',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4" style={{ color: corPrimaria }} />
                <span className="text-xs font-medium" style={{ color: corPrimaria }}>{nomeTutor}</span>
              </div>
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div
            className="p-4 rounded-2xl"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <div className="flex items-center gap-3" style={{ color: 'var(--error)' }}>
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{erro}</p>
            </div>
          </div>
        )}
      </div>

      {/* Aviso de Limite Diário */}
      {usoHoje >= limiteDiario && (
        <div
          className="px-4 py-4 border-t"
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <MessageCircle className="w-5 h-5" style={{ color: 'var(--warning)' }} />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Limite diário atingido, {primeiroNome}!
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Você usou suas {limiteDiario} mensagens de hoje. Volte amanhã!
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={onClose} className="w-full">
            Voltar ao Menu
          </Button>
        </div>
      )}

      {/* Preview da Imagem */}
      {imagemPreview && (
        <div
          className="px-4 py-2 border-t flex items-center gap-3"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="relative">
            <img
              src={imagemPreview}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-xl"
            />
            <button
              onClick={removerImagem}
              className="absolute -top-2 -right-2 p-1 rounded-full"
              style={{ background: 'var(--error)', color: 'white' }}
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Imagem pronta para enviar
          </span>
        </div>
      )}

      {/* Input */}
      {usoHoje < limiteDiario && (
        <div
          className="p-4 border-t"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-default)'
          }}
        >
          {/* Input file oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImagemSelect}
            className="hidden"
          />

          <div className="flex gap-2">
            {/* Botão de Imagem */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="p-3 rounded-xl transition-all disabled:opacity-50 touch-target"
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-muted)',
              }}
              title="Enviar foto da questão"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* Botão de Voz (STT) */}
            {sttSupported && (
              <button
                onClick={toggleListening}
                disabled={loading}
                className={`p-3 rounded-xl transition-all disabled:opacity-50 touch-target ${isListening ? 'animate-pulse' : ''}`}
                style={{
                  background: isListening ? corPrimaria : 'var(--bg-elevated)',
                  border: `1px solid ${isListening ? corPrimaria : 'var(--border-default)'}`,
                  color: isListening ? (isFisica ? '#000' : '#fff') : 'var(--text-muted)',
                }}
                title={isListening ? 'Parar de ouvir' : 'Falar pergunta'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            {/* Input de Texto */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value.slice(0, MAX_CARACTERES))}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
                placeholder={isListening ? 'Ouvindo...' : `Digite sua dúvida, ${primeiroNome}...`}
                disabled={loading || isListening}
                maxLength={MAX_CARACTERES}
                className="w-full px-4 py-3 rounded-xl text-base transition-all outline-none"
                style={{
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${isListening ? corPrimaria : 'var(--border-default)'}`,
                  color: 'var(--text-primary)',
                }}
              />
              {input.length > 400 && (
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: input.length >= MAX_CARACTERES ? 'var(--error)' : 'var(--text-muted)' }}
                >
                  {input.length}/{MAX_CARACTERES}
                </span>
              )}
            </div>

            {/* Botão Enviar */}
            <button
              onClick={() => enviarMensagem()}
              disabled={(!input.trim() && !imagemBase64) || loading}
              className="px-5 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target"
              style={{
                background: corPrimaria,
                color: isFisica ? '#000' : '#fff',
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Dica de interação */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Camera className="w-3 h-3" /> Foto
            </span>
            {sttSupported && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Mic className="w-3 h-3" /> Voz
              </span>
            )}
            <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              ⌨️ Texto
            </span>
            {ttsSupported && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Volume2 className="w-3 h-3" /> Ouvir
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
