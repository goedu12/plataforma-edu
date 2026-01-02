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

interface TutorChatProps {
  componente: Componente
  nomeTutor: string
  nomeEstudante?: string
  usoHoje: number
  limiteDiario: number
  onClose: () => void
}

// ═══════════════════════════════════════════════════════════
// SUGESTÕES ESTILO PERPLEXITY - Organizadas por categoria
// ═══════════════════════════════════════════════════════════
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

// Sugestões de continuidade baseadas no contexto
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

// ═══════════════════════════════════════════════════════════
// FRASES MOTIVACIONAIS PERSONALIZADAS
// ═══════════════════════════════════════════════════════════
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
  const [mensagens, setMensagens] = useState<MensagemChat[]>([])
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

  // Cores e estilos baseados no componente
  const isFisica = componente === 'fisica'
  const accentColor = isFisica ? 'fisica-500' : 'matematica-500'
  const accentBg = isFisica ? 'bg-fisica-500' : 'bg-matematica-500'
  const accentGlow = isFisica ? 'bg-fisica-500/10' : 'bg-matematica-500/10'
  const accentBorder = isFisica ? 'border-fisica-500/30' : 'border-matematica-500/30'
  const accentText = isFisica ? 'text-fisica-500' : 'text-matematica-500'
  const focusRing = isFisica ? 'focus:ring-fisica-500/50 focus:border-fisica-500' : 'focus:ring-matematica-500/50 focus:border-matematica-500'

  // Mensagem inicial personalizada do tutor
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

  // Scroll automático para última mensagem
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
        // Adicionar frase motivacional personalizada ocasionalmente
        let resposta = data.resposta
        if (Math.random() > 0.5 && mensagens.length > 1) {
          const fraseAleatoria = FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)]
          resposta = `${fraseAleatoria(primeiroNome)}\n\n${resposta}`
        }

        const respostaTutor: MensagemChat = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: resposta,
          timestamp: new Date().toISOString(),
        }
        setMensagens(prev => [...prev, respostaTutor])
        setUsoHoje(data.uso_hoje)
        // Mostrar sugestões de continuidade após resposta
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
    <div className="flex flex-col h-full bg-dark-bg">
      {/* ═══════════════════════════════════════════════════════════
          HEADER - Dark Theme
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-dark-surface">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentGlow}`}>
            <Bot className={`w-6 h-6 ${accentText}`} />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary">{nomeTutor}</h2>
            <p className="text-xs text-text-tertiary flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              IA Generativa • {usoHoje}/{limiteDiario} msgs hoje
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={limparChat}
            className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-dark-elevated transition-colors"
            title="Limpar conversa"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-text-tertiary hover:text-error rounded-lg hover:bg-error/10 transition-colors"
            title="Sair do chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ÁREA DE MENSAGENS
          ═══════════════════════════════════════════════════════════ */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {mensagens.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-dark-elevated text-text-primary rounded-br-sm border border-border'
                  : `${accentGlow} border ${accentBorder} text-text-primary rounded-bl-sm`
              }`}
            >
              {msg.role === 'assistant' && (
                <div className={`flex items-center gap-2 mb-2 ${accentText}`}>
                  <Bot className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">{nomeTutor}</span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {/* ═══════════════════════════════════════════════════════════
            SUGESTÕES INICIAIS - Estilo Perplexity
            ═══════════════════════════════════════════════════════════ */}
        {mostrarSugestoesIniciais && mensagens.length <= 1 && !loading && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-xs text-text-tertiary uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-3 h-3" />
              Sugestões para você, {primeiroNome}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sugestoesIniciais.map((sugestao, index) => (
                <button
                  key={index}
                  onClick={() => enviarMensagem(sugestao.prompt)}
                  className={`
                    flex items-start gap-3 p-3 rounded-xl
                    bg-dark-surface border border-border
                    hover:bg-dark-elevated hover:border-border-hover
                    transition-all duration-200 text-left group
                  `}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accentGlow}`}>
                    <sugestao.icon className={`w-4 h-4 ${accentText}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-text-primary block">{sugestao.texto}</span>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${accentText} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SUGESTÕES DE CONTINUIDADE - Após resposta do tutor
            ═══════════════════════════════════════════════════════════ */}
        {mostrarSugestoesContinuidade && !loading && mensagens.length > 2 && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs text-text-tertiary uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-3 h-3" />
              Continue a conversa
            </p>
            <div className="flex flex-wrap gap-2">
              {sugestoesContinuidade.map((sugestao, index) => (
                <button
                  key={index}
                  onClick={() => enviarMensagem(sugestao.prompt)}
                  className={`
                    px-3 py-2 rounded-lg text-xs font-medium
                    bg-dark-surface border border-border
                    hover:bg-dark-elevated hover:border-border-hover
                    text-text-secondary hover:text-text-primary
                    transition-all duration-200
                  `}
                >
                  {sugestao.texto}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start animate-slide-up">
            <div className={`p-4 rounded-2xl rounded-bl-sm ${accentGlow} border ${accentBorder}`}>
              <div className={`flex items-center gap-2 mb-2 ${accentText}`}>
                <Bot className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">{nomeTutor}</span>
              </div>
              <TypingIndicator />
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="p-4 bg-error/10 border border-error/30 rounded-xl animate-shake">
            <div className="flex items-center gap-3 text-error">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{erro}</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          AVISO DE LIMITE DIÁRIO
          ═══════════════════════════════════════════════════════════ */}
      {usoHoje >= limiteDiario && (
        <div className="px-4 py-4 bg-warning/10 border-t border-warning/30">
          <div className="flex items-center gap-3 mb-3">
            <MessageCircle className="w-5 h-5 text-warning" />
            <div>
              <p className="text-sm text-text-primary font-medium">
                Limite diário atingido, {primeiroNome}!
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                Você usou suas {limiteDiario} mensagens de hoje. Volte amanhã!
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full"
          >
            Voltar ao Menu
          </Button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          INPUT - Dark Theme com texto visível
          ═══════════════════════════════════════════════════════════ */}
      {usoHoje < limiteDiario && (
        <div className="p-4 border-t border-border bg-dark-surface">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviarMensagem()}
              placeholder={`Digite sua dúvida, ${primeiroNome}...`}
              disabled={loading}
              className={`
                flex-1 px-4 py-3
                bg-dark-elevated border border-border rounded-xl
                text-text-primary text-base placeholder:text-text-tertiary
                transition-all duration-200 outline-none
                hover:border-border-hover
                focus:ring-2 ${focusRing}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            />
            <Button
              variant={componente === 'fisica' ? 'fisica' : 'matematica'}
              onClick={() => enviarMensagem()}
              disabled={!input.trim() || loading}
              className="px-4"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>

          {/* Botão de voltar discreto */}
          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-sm text-text-tertiary hover:text-text-secondary hover:bg-dark-elevated rounded-lg transition-colors"
          >
            ← Voltar ao Menu
          </button>
        </div>
      )}
    </div>
  )
}
