'use client'

import { useState, useRef, useEffect } from 'react'
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
  RefreshCw,
  MessageCircle
} from 'lucide-react'
import Button from './ui/Button'
import { TypingIndicator } from './ui/Loading'
import type { Componente, MensagemChat } from '@/types'

// Tipos de modo da IA
type ModoIA = 'DIRETO' | 'PASSO_A_PASSO' | 'MAPA_MENTAL' | 'ESTIMULAR' | 'SOCRATICO' | 'CONVERSACIONAL'

// Badges visuais para cada modo da IA
const MODO_BADGES: Record<ModoIA, { icone: string; label: string }> = {
  'DIRETO': { icone: '⚡', label: 'Direto' },
  'PASSO_A_PASSO': { icone: '📝', label: 'Passo a Passo' },
  'MAPA_MENTAL': { icone: '🗺️', label: 'Mapa Mental' },
  'ESTIMULAR': { icone: '💪', label: 'Motivação' },
  'SOCRATICO': { icone: '🎓', label: 'Socrático' },
  'CONVERSACIONAL': { icone: '💬', label: 'Conversa' },
}

// Interface extendida de mensagem com modo
interface MensagemChatComModo extends MensagemChat {
  modo?: ModoIA
  topico?: string
}

interface TutorChatProps {
  componente: Componente
  nomeTutor: string
  nomeEstudante?: string
  usoHoje: number
  limiteDiario: number
  onClose: () => void
}

// Sugestões iniciais
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

// Sugestões de continuidade
const SUGESTOES_CONTINUIDADE = {
  fisica: [
    { texto: 'Me dê mais exemplos', prompt: 'Pode me dar mais exemplos práticos sobre isso?' },
    { texto: 'Explique de outra forma', prompt: 'Não entendi bem, pode explicar de outra forma?' },
    { texto: 'Como isso cai na prova?', prompt: 'Como esse assunto costuma aparecer nas provas?' },
    { texto: 'Exercício para praticar', prompt: 'Me dê um exercício para eu praticar esse conceito' },
  ],
  matematica: [
    { texto: 'Me dê mais exemplos', prompt: 'Pode me dar mais exemplos resolvidos?' },
    { texto: 'Passo a passo detalhado', prompt: 'Pode explicar novamente com mais detalhes?' },
    { texto: 'Exercício para praticar', prompt: 'Me dê um exercício para eu resolver e você corrige' },
    { texto: 'Dicas para não errar', prompt: 'Quais são os erros mais comuns nesse tipo de questão?' },
  ],
}

// Frases motivacionais
const FRASES_MOTIVACIONAIS = [
  (nome: string) => `Muito bem, ${nome}! Essa é uma ótima pergunta.`,
  (nome: string) => `Excelente dúvida, ${nome}! Vamos resolver isso juntos.`,
  (nome: string) => `${nome}, você está no caminho certo!`,
  (nome: string) => `Boa, ${nome}! Vou te explicar isso de um jeito simples.`,
  (nome: string) => `${nome}, que bom que você perguntou!`,
]

export default function TutorChat({
  componente,
  nomeTutor,
  nomeEstudante = 'Estudante',
  usoHoje: usoInicial,
  limiteDiario,
  onClose,
}: TutorChatProps) {
  const [mensagens, setMensagens] = useState<MensagemChatComModo[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usoHoje, setUsoHoje] = useState(usoInicial)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarSugestoesIniciais, setMostrarSugestoesIniciais] = useState(true)
  const [mostrarSugestoesContinuidade, setMostrarSugestoesContinuidade] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  const sugestoesIniciais = SUGESTOES_INICIAIS[componente]
  const sugestoesContinuidade = SUGESTOES_CONTINUIDADE[componente]
  const primeiroNome = nomeEstudante.split(' ')[0]

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  // Mensagem inicial
  useEffect(() => {
    const disciplina = componente === 'fisica' ? 'Física' : 'Matemática'
    const mensagemInicial: MensagemChat = {
      id: '1',
      role: 'assistant',
      content: `Olá, ${primeiroNome}! 👋\n\nSou o ${nomeTutor}, seu tutor de ${disciplina}! Estou aqui para te ajudar a aprender de forma simples e divertida.\n\nEscolha uma das perguntas abaixo ou digite sua própria dúvida!`,
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

  const MAX_CARACTERES = 500

  const enviarMensagem = async (textoPersonalizado?: string) => {
    const texto = (textoPersonalizado || input.trim()).slice(0, MAX_CARACTERES)
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
    setMostrarSugestoesIniciais(false)
    setMostrarSugestoesContinuidade(false)

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componente,
          mensagem: novaMensagem.content,
          historico: mensagens,
          nomeEstudante: primeiroNome,
        }),
      })

      const data = await response.json()

      if (data.sucesso) {
        let resposta = data.resposta
        if (data.modo !== 'DIRETO' && Math.random() > 0.5 && mensagens.length > 1) {
          const fraseAleatoria = FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)]
          resposta = `${fraseAleatoria(primeiroNome)}\n\n${resposta}`
        }

        const respostaTutor: MensagemChatComModo = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: resposta,
          timestamp: new Date().toISOString(),
          modo: data.modo as ModoIA,
          topico: data.topico,
        }
        setMensagens(prev => [...prev, respostaTutor])
        setUsoHoje(data.uso_hoje)
        setMostrarSugestoesContinuidade(true)
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
      setMostrarSugestoesContinuidade(false)
    } catch (error) {
      console.error('Erro ao limpar chat:', error)
    }
  }

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
        {mensagens.map(msg => (
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
                </div>
              )}
              <p
                className="text-sm whitespace-pre-wrap leading-relaxed"
                style={{ color: 'var(--text-primary)' }}
              >
                {msg.content}
              </p>
            </div>
          </div>
        ))}

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

        {/* Sugestões de Continuidade */}
        {mostrarSugestoesContinuidade && !loading && mensagens.length > 2 && (
          <div className="space-y-3">
            <p
              className="text-xs font-medium flex items-center gap-2"
              style={{ color: 'var(--text-muted)' }}
            >
              <RefreshCw className="w-3.5 h-3.5" style={{ color: corPrimaria }} />
              Continue a conversa
            </p>
            <div className="flex flex-wrap gap-2">
              {sugestoesContinuidade.map((sugestao, index) => (
                <button
                  key={index}
                  onClick={() => enviarMensagem(sugestao.prompt)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium transition-all touch-target"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {sugestao.texto}
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

      {/* Input */}
      {usoHoje < limiteDiario && (
        <div
          className="p-4 border-t"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value.slice(0, MAX_CARACTERES))}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
                placeholder={`Digite sua dúvida, ${primeiroNome}...`}
                disabled={loading}
                maxLength={MAX_CARACTERES}
                className="w-full px-4 py-3 rounded-xl text-base transition-all outline-none"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
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
            <button
              onClick={() => enviarMensagem()}
              disabled={!input.trim() || loading}
              className="px-5 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-target"
              style={{
                background: corPrimaria,
                color: isFisica ? '#000' : '#fff',
              }}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
