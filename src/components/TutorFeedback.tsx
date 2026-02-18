'use client'

import { useState } from 'react'
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  MessageSquare,
  Send,
  X,
  AlertTriangle
} from 'lucide-react'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════

interface TutorFeedbackProps {
  componente: Componente
  mensagemId?: string
  onFeedbackEnviado?: () => void
}

type TipoProblema = 'incorreto' | 'confuso' | 'incompleto' | 'muito_longo' | 'muito_curto' | 'outro'

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL - INLINE FEEDBACK (thumbs up/down)
// ═══════════════════════════════════════════════════════════

export function TutorFeedbackInline({ componente, mensagemId, onFeedbackEnviado }: TutorFeedbackProps) {
  const [feedbackDado, setFeedbackDado] = useState<'positivo' | 'negativo' | null>(null)
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const enviarFeedbackRapido = async (util: boolean) => {
    setEnviando(true)
    try {
      await fetch('/api/tutor/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagemId,
          util,
        }),
      })
      setFeedbackDado(util ? 'positivo' : 'negativo')
      if (!util) {
        setMostrarDetalhes(true)
      }
      onFeedbackEnviado?.()
    } catch (error) {
      console.error('Erro ao enviar feedback:', error)
    } finally {
      setEnviando(false)
    }
  }

  if (feedbackDado === 'positivo') {
    return (
      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--success)' }}>
        <ThumbsUp className="w-3 h-3" /> Obrigado!
      </span>
    )
  }

  if (mostrarDetalhes) {
    return (
      <TutorFeedbackDetalhado
        componente={componente}
        mensagemId={mensagemId}
        onClose={() => setMostrarDetalhes(false)}
        onEnviado={() => {
          setMostrarDetalhes(false)
          onFeedbackEnviado?.()
        }}
      />
    )
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => enviarFeedbackRapido(true)}
        disabled={enviando}
        className="p-2 rounded-lg transition-colors hover:bg-black/10 flex items-center justify-center"
        title="Resposta util"
        style={{ color: 'var(--text-muted)', minWidth: '36px', minHeight: '36px' }}
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => enviarFeedbackRapido(false)}
        disabled={enviando}
        className="p-2 rounded-lg transition-colors hover:bg-black/10 flex items-center justify-center"
        title="Resposta pode melhorar"
        style={{ color: 'var(--text-muted)', minWidth: '36px', minHeight: '36px' }}
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE - FEEDBACK DETALHADO (após negativo)
// ═══════════════════════════════════════════════════════════

function TutorFeedbackDetalhado({
  componente,
  mensagemId,
  onClose,
  onEnviado,
}: {
  componente: Componente
  mensagemId?: string
  onClose: () => void
  onEnviado: () => void
}) {
  const [clareza, setClareza] = useState<number>(0)
  const [precisao, setPrecisao] = useState<number>(0)
  const [tipoProblema, setTipoProblema] = useState<TipoProblema | null>(null)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const tiposProblema: { valor: TipoProblema; label: string; icone: React.ReactNode }[] = [
    { valor: 'incorreto', label: 'Incorreto', icone: <AlertTriangle className="w-3 h-3" /> },
    { valor: 'confuso', label: 'Confuso', icone: <MessageSquare className="w-3 h-3" /> },
    { valor: 'incompleto', label: 'Incompleto', icone: <MessageSquare className="w-3 h-3" /> },
    { valor: 'muito_longo', label: 'Muito longo', icone: <MessageSquare className="w-3 h-3" /> },
    { valor: 'muito_curto', label: 'Muito curto', icone: <MessageSquare className="w-3 h-3" /> },
  ]

  const enviarFeedbackDetalhado = async () => {
    setEnviando(true)
    try {
      await fetch('/api/tutor/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagemId,
          util: false,
          clareza: clareza || null,
          precisao: precisao || null,
          tipoProblema: tipoProblema || null,
          comentario: comentario || null,
        }),
      })
      setEnviado(true)
      setTimeout(onEnviado, 1000)
    } catch (error) {
      console.error('Erro ao enviar feedback:', error)
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div
        className="p-3 rounded-xl text-sm"
        style={{
          background: isFisica ? 'var(--color-fisica-bg-10)' : 'var(--color-matematica-bg-10)',
          border: `1px solid ${corPrimaria}`,
          color: corPrimaria,
        }}
      >
        Obrigado pelo feedback detalhado!
      </div>
    )
  }

  return (
    <div
      className="p-3 rounded-xl space-y-3"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          O que pode melhorar?
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tipo de problema */}
      <div className="flex flex-wrap gap-1">
        {tiposProblema.map(tipo => (
          <button
            key={tipo.valor}
            onClick={() => setTipoProblema(tipoProblema === tipo.valor ? null : tipo.valor)}
            className="px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-1"
            style={{
              background: tipoProblema === tipo.valor ? `${corPrimaria}20` : 'var(--bg-surface)',
              border: tipoProblema === tipo.valor ? `1px solid ${corPrimaria}` : '1px solid var(--border-default)',
              color: tipoProblema === tipo.valor ? corPrimaria : 'var(--text-secondary)',
            }}
          >
            {tipo.label}
          </button>
        ))}
      </div>

      {/* Avaliação por estrelas */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Clareza:</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setClareza(clareza === n ? 0 : n)}
                className="p-1"
              >
                <Star
                  className="w-3.5 h-3.5"
                  style={{
                    color: n <= clareza ? corPrimaria : 'var(--text-muted)',
                    fill: n <= clareza ? corPrimaria : 'transparent',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Precisao:</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setPrecisao(precisao === n ? 0 : n)}
                className="p-1"
              >
                <Star
                  className="w-3.5 h-3.5"
                  style={{
                    color: n <= precisao ? corPrimaria : 'var(--text-muted)',
                    fill: n <= precisao ? corPrimaria : 'transparent',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comentário */}
      <div className="flex gap-2">
        <input
          type="text"
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          placeholder="Comentario opcional..."
          maxLength={200}
          className="flex-1 px-3 py-2 rounded-lg text-xs"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
        />
        <button
          onClick={enviarFeedbackDetalhado}
          disabled={enviando}
          className="px-3 py-2 rounded-lg"
          style={{
            background: corPrimaria,
            color: isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)',
          }}
        >
          {enviando ? '...' : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// COMPONENTE - AVALIAÇÃO DE SESSÃO (ao fechar chat)
// ═══════════════════════════════════════════════════════════

export function TutorAvaliacaoSessao({
  componente,
  sessaoId,
  onClose,
}: {
  componente: Componente
  sessaoId?: string
  onClose: () => void
}) {
  const [satisfacao, setSatisfacao] = useState<number>(0)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const isFisica = componente === 'fisica'
  const corPrimaria = isFisica ? 'var(--color-fisica)' : 'var(--color-matematica)'

  const enviarAvaliacao = async () => {
    if (!satisfacao || !sessaoId) {
      onClose()
      return
    }

    setEnviando(true)
    try {
      await fetch('/api/tutor/sessao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'finalizar',
          componente,
          sessaoId,
          satisfacao,
        }),
      })
      setEnviado(true)
      setTimeout(onClose, 1000)
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error)
      onClose()
    } finally {
      setEnviando(false)
    }
  }

  const pularAvaliacao = () => {
    // Finalizar sessão sem satisfação
    if (sessaoId) {
      fetch('/api/tutor/sessao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'finalizar',
          componente,
          sessaoId,
        }),
      }).catch(console.error)
    }
    onClose()
  }

  if (enviado) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ background: 'var(--overlay-modal)', zIndex: 100 }}
      >
        <div
          className="p-6 rounded-2xl text-center"
          style={{ background: 'var(--bg-surface)' }}
        >
          <p className="text-lg font-semibold" style={{ color: corPrimaria }}>
            Obrigado!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ background: 'var(--overlay-modal)', zIndex: 100 }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Como foi a sessao?
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Sua avaliacao ajuda a melhorar o tutor
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setSatisfacao(satisfacao === n ? 0 : n)}
              className="p-2 transition-transform hover:scale-110"
            >
              <Star
                className="w-8 h-8"
                style={{
                  color: n <= satisfacao ? corPrimaria : 'var(--text-muted)',
                  fill: n <= satisfacao ? corPrimaria : 'transparent',
                }}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={pularAvaliacao}
            className="flex-1 py-2 rounded-xl text-sm"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            Pular
          </button>
          <button
            onClick={enviarAvaliacao}
            disabled={enviando || !satisfacao}
            className="flex-1 py-2 rounded-xl text-sm font-medium"
            style={{
              background: satisfacao ? corPrimaria : 'var(--bg-overlay)',
              color: satisfacao ? (isFisica ? 'var(--text-on-fisica)' : 'var(--text-on-matematica)') : 'var(--text-muted)',
            }}
          >
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
