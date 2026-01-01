'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, Bot, AlertCircle, X, Lightbulb, BookOpen, HelpCircle, Calculator } from 'lucide-react'
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

// Sugestões estilo Perplexity
const SUGESTOES = {
  fisica: [
    { icon: Lightbulb, texto: 'Explique as Leis de Newton', prompt: 'Me explique as três Leis de Newton de forma simples' },
    { icon: Calculator, texto: 'Como calcular velocidade?', prompt: 'Como calculo a velocidade média de um objeto?' },
    { icon: HelpCircle, texto: 'O que é energia cinética?', prompt: 'O que é energia cinética e como calcular?' },
    { icon: BookOpen, texto: 'Movimento circular', prompt: 'Me ensine sobre movimento circular uniforme' },
  ],
  matematica: [
    { icon: Lightbulb, texto: 'Como resolver equação 2º grau?', prompt: 'Me ensine a resolver equações do segundo grau' },
    { icon: Calculator, texto: 'Explicar regra de três', prompt: 'Me explique como fazer regra de três simples e composta' },
    { icon: HelpCircle, texto: 'O que é função quadrática?', prompt: 'O que é uma função quadrática e como funciona?' },
    { icon: BookOpen, texto: 'Teorema de Pitágoras', prompt: 'Me explique o Teorema de Pitágoras com exemplos' },
  ],
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
  const [mostrarSugestoes, setMostrarSugestoes] = useState(true)
  const chatRef = useRef<HTMLDivElement>(null)

  const sugestoes = SUGESTOES[componente]

  // Mensagem inicial do tutor
  useEffect(() => {
    const disciplina = componente === 'fisica' ? 'Física' : 'Matemática'
    const mensagemInicial: MensagemChat = {
      id: '1',
      role: 'assistant',
      content: `Olá! Sou o ${nomeTutor}, seu tutor de ${disciplina}! 👋\n\nEstou aqui para te ajudar. Escolha uma das sugestões abaixo ou digite sua dúvida!`,
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

  const enviarMensagem = async (textoPersonalizado?: string) => {
    const texto = textoPersonalizado || input.trim()
    if (!texto || loading || usoHoje >= limiteDiario) return

    const novaMensagem: MensagemChat = {
      id: Date.now().toString(),
      role: 'user',
      content: texto,
      timestamp: new Date().toISOString(),
    }

    setMensagens(prev => [...prev, novaMensagem])
    setInput('')
    setLoading(true)
    setErro(null)
    setMostrarSugestoes(false)

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
      setErro('Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.')
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
      setMostrarSugestoes(true)
    } catch (error) {
      console.error('Erro ao limpar chat:', error)
    }
  }

  const bubbleClass =
    componente === 'fisica'
      ? 'bg-fisica-500 text-white rounded-bl-sm'
      : 'bg-matematica-500 text-white rounded-bl-sm'

  const iconClass = componente === 'fisica' ? 'text-fisica-500' : 'text-matematica-500'
  const bgLight = componente === 'fisica' ? 'bg-fisica-50' : 'bg-matematica-50'
  const borderColor = componente === 'fisica' ? 'border-fisica-200' : 'border-matematica-200'
  const hoverBg = componente === 'fisica' ? 'hover:bg-fisica-100' : 'hover:bg-matematica-100'

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
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
            title="Sair do chat"
          >
            <X className="w-5 h-5" />
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

        {/* Sugestões estilo Perplexity */}
        {mostrarSugestoes && mensagens.length <= 1 && !loading && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {sugestoes.map((sugestao, index) => (
              <button
                key={index}
                onClick={() => enviarMensagem(sugestao.prompt)}
                className={`flex items-start gap-2 p-3 rounded-xl border ${borderColor} ${bgLight} ${hoverBg} transition-colors text-left`}
              >
                <sugestao.icon className={`w-4 h-4 ${iconClass} mt-0.5 flex-shrink-0`} />
                <span className="text-xs text-gray-700">{sugestao.texto}</span>
              </button>
            ))}
          </div>
        )}

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
        <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-200">
          <p className="text-sm text-yellow-800 text-center font-medium">
            Limite diário atingido
          </p>
          <p className="text-xs text-yellow-700 text-center mt-1">
            Você usou suas {limiteDiario} interações de hoje. O limite é renovado à meia-noite.
          </p>
          <button
            onClick={onClose}
            className="w-full mt-2 py-2 px-4 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm font-medium transition-colors"
          >
            Voltar ao Menu
          </button>
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
                : 'Digite sua dúvida...'
            }
            disabled={loading || usoHoje >= limiteDiario}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-current focus:border-transparent outline-none disabled:bg-gray-100"
          />
          <Button
            variant={componente === 'fisica' ? 'fisica' : 'matematica'}
            onClick={() => enviarMensagem()}
            disabled={!input.trim() || loading || usoHoje >= limiteDiario}
            className="px-4"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Botão de sair */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Voltar ao Menu
        </button>
      </div>
    </div>
  )
}
