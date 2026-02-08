'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, Send, X, Minimize2, Zap } from 'lucide-react'
import MensagemFormatada from './MensagemFormatada'
import { TypingIndicator } from './ui/Loading'
import type { Componente, MensagemChat } from '@/types'
import { PONTUACAO } from '@/types'

// ═══════════════════════════════════════════════════════════
// TutorMiniChat — Widget flutuante do Tutor IA
// Pode ser usado em qualquer página do estudante
// ═══════════════════════════════════════════════════════════

interface MensagemMini extends MensagemChat {
  modo?: string
}

export default function TutorMiniChat({ componente }: { componente: Componente }) {
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState<MensagemMini[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usoHoje, setUsoHoje] = useState(0)
  const [nomeEstudante, setNomeEstudante] = useState('Estudante')
  const [inicializado, setInicializado] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const enviarMensagem = useCallback(async () => {
    const texto = input.trim()
    if (!texto || loading || restantes <= 0) return

    const novaMensagem: MensagemMini = {
      id: Date.now().toString(),
      role: 'user',
      content: texto,
      timestamp: new Date().toISOString(),
    }

    setMensagens(prev => [...prev, novaMensagem])
    setInput('')
    setLoading(true)

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
          mensagem: texto,
          historico,
          nomeEstudante,
        }),
      })

      const data = await res.json()

      if (data.sucesso && data.resposta) {
        // Remove [SUGESTOES]...[/SUGESTOES] block
        const textoLimpo = data.resposta.replace(/\[SUGESTOES\][\s\S]*?\[\/SUGESTOES\]/, '').trim()

        setMensagens(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: textoLimpo,
          timestamp: new Date().toISOString(),
          modo: data.modo,
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
  }, [input, loading, restantes, mensagens, componente, nomeEstudante])

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
        width: 'min(360px, calc(100vw - 32px))',
        height: 'min(440px, calc(100dvh - 96px))',
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
              className="max-w-[85%] px-3 py-2 rounded-xl text-sm"
              style={{
                background: msg.role === 'user' ? corPrimaria : 'var(--bg-surface)',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                border: msg.role === 'assistant' ? '1px solid var(--border-default)' : 'none',
              }}
            >
              {msg.role === 'assistant' ? (
                <MensagemFormatada conteudo={msg.content} />
              ) : (
                <span>{msg.content}</span>
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

      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
        style={{
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 500))}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
          placeholder={restantes > 0 ? 'Pergunte algo...' : 'Limite diário atingido'}
          disabled={restantes <= 0}
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        <button
          onClick={enviarMensagem}
          disabled={!input.trim() || loading || restantes <= 0}
          className="p-2 rounded-lg transition-colors disabled:opacity-30 flex items-center justify-center"
          style={{ background: corPrimaria, minWidth: '36px', minHeight: '36px' }}
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  )
}
