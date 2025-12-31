'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, Bot, User, AlertCircle } from 'lucide-react'
import Button from './ui/Button'
import Card from './ui/Card'
import { TypingIndicator } from './ui/Loading'
import type { Componente, MensagemChat } from '@/types'

interface TutorChatProps {
  componente: Componente
  nomeTutor: string
  usoHoje: number
  limiteDiario: number
  onClose: () => void
}

export default function TutorChat({
  componente,
  nomeTutor,
  usoHoje: usoInicial,
  limiteDiario,
  onClose,
}: TutorChatProps) {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usoHoje, setUsoHoje] = useState(usoInicial)
  const [erro, setErro] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // Mensagem inicial do tutor
  useEffect(() => {
    const mensagemInicial: MensagemChat = {
      id: '1',
      role: 'assistant',
      content: `Olá! Sou o ${nomeTutor}, seu tutor de ${componente === 'fisica' ? 'Física' : 'Matemática'}! 👋\n\nComo posso te ajudar hoje? Pode me perguntar sobre qualquer dúvida que você tenha!`,
      timestamp: new Date().toISOString(),
    }
    setMensagens([mensagemInicial])
  }, [nomeTutor, componente])

  // Scroll automático
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [mensagens, loading])

  const enviarMensagem = async () => {
    if (!input.trim() || loading || usoHoje >= limiteDiario) return

    const novaMensagem: MensagemChat = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    setMensagens(prev => [...prev, novaMensagem])
    setInput('')
    setLoading(true)
    setErro(null)

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componente,
          mensagem: novaMensagem.content,
          historico: mensagens,
        }),
      })

      const data = await response.json()

      if (data.sucesso) {
        const respostaTutor: MensagemChat = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.resposta,
          timestamp: new Date().toISOString(),
        }
        setMensagens(prev => [...prev, respostaTutor])
        setUsoHoje(data.uso_hoje)
      } else {
        setErro(data.erro || 'Erro ao comunicar com o tutor')
      }
    } catch (error) {
      console.error('Erro no chat:', error)
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const limparChat = async () => {
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
          content: `Chat reiniciado! Como posso te ajudar?`,
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error('Erro ao limpar chat:', error)
    }
  }

  const bubbleClass =
    componente === 'fisica'
      ? 'bg-fisica-500 text-white rounded-bl-sm'
      : 'bg-matematica-500 text-white rounded-bl-sm'

  const iconClass = componente === 'fisica' ? 'text-fisica-500' : 'text-matematica-500'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${componente === 'fisica' ? 'bg-fisica-100' : 'bg-matematica-100'}`}
          >
            <Bot className={`w-6 h-6 ${iconClass}`} />
          </div>
          <div>
            <h2 className="font-semibold">{nomeTutor}</h2>
            <p className="text-xs text-gray-500">
              {usoHoje}/{limiteDiario} interações hoje
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={limparChat}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title="Limpar conversa"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mensagens */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-gray-200 text-gray-800 rounded-br-sm'
                  : bubbleClass
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className={`p-3 rounded-2xl ${bubbleClass}`}>
              <TypingIndicator />
            </div>
          </div>
        )}

        {erro && (
          <Card className="bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{erro}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Aviso de limite */}
      {usoHoje >= limiteDiario && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
          <p className="text-sm text-yellow-800 text-center">
            ⚠️ Você atingiu o limite de {limiteDiario} interações hoje. Volte amanhã!
          </p>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
            placeholder={
              usoHoje >= limiteDiario
                ? 'Limite diário atingido'
                : 'Digite sua mensagem...'
            }
            disabled={loading || usoHoje >= limiteDiario}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-current focus:border-transparent outline-none disabled:bg-gray-100"
          />
          <Button
            componente={componente}
            onClick={enviarMensagem}
            disabled={!input.trim() || loading || usoHoje >= limiteDiario}
            className="px-4"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
