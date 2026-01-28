'use client'

import { useState } from 'react'
import { Lightbulb, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'

interface ExemploResolvidoProps {
  numero: number
  enunciado: string
  resolucao: string[]
  resposta: string
  accentColor: string
  isFisica: boolean
}

export default function ExemploResolvido({
  numero,
  enunciado,
  resolucao,
  resposta,
  accentColor,
  isFisica,
}: ExemploResolvidoProps) {
  const [mostrarResolucao, setMostrarResolucao] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      {/* Enunciado */}
      <div className="p-3 lg:p-2.5">
        <div className="flex items-start gap-2 mb-2">
          <span
            className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              background: `${accentColor}20`,
              color: accentColor,
            }}
          >
            {numero}
          </span>
          <p
            className="text-sm lg:text-xs font-medium leading-relaxed flex-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {enunciado}
          </p>
        </div>

        {/* Botão para mostrar resolução */}
        <button
          onClick={() => setMostrarResolucao(!mostrarResolucao)}
          className="w-full mt-2 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-xs lg:text-2xs font-medium transition-all active:scale-[0.98]"
          style={{
            background: mostrarResolucao ? `${accentColor}15` : 'var(--bg-elevated)',
            color: mostrarResolucao ? accentColor : 'var(--text-secondary)',
            border: mostrarResolucao ? `1px solid ${accentColor}30` : '1px solid transparent',
          }}
        >
          <Lightbulb className="w-4 h-4" />
          {mostrarResolucao ? 'Esconder resolução' : 'Ver resolução passo a passo'}
          {mostrarResolucao ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Resolução expandida */}
      {mostrarResolucao && (
        <div
          className="px-3 pb-3"
          style={{ borderTop: '1px solid var(--border-default)' }}
        >
          {/* Passos da resolução */}
          <div className="mt-3 space-y-2">
            <p
              className="text-xs lg:text-2xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Resolução:
            </p>
            <div
              className="p-3 rounded-lg space-y-2"
              style={{ background: 'var(--bg-elevated)' }}
            >
              {resolucao.map((passo, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2"
                >
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold mt-0.5"
                    style={{
                      background: 'var(--bg-surface)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    {index + 1}
                  </span>
                  <p
                    className="text-xs lg:text-2xs leading-relaxed font-mono"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {passo}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Resposta final */}
          <div
            className="mt-3 p-3 rounded-lg flex items-center gap-2"
            style={{
              background: `linear-gradient(135deg, var(--success)15, var(--success)08)`,
              border: '1px solid var(--success)',
            }}
          >
            <CheckCircle
              className="w-5 h-5 flex-shrink-0"
              style={{ color: 'var(--success)' }}
            />
            <div>
              <p
                className="text-2xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--success)' }}
              >
                Resposta
              </p>
              <p
                className="text-sm lg:text-xs font-bold font-mono"
                style={{ color: 'var(--text-primary)' }}
              >
                {resposta}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
