'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'

interface Variavel {
  simbolo: string
  significado: string
  unidade?: string
}

interface FormulaCardProps {
  expressao: string
  nome?: string
  descricao: string
  variaveis?: Variavel[]
  accentColor: string
  isFisica: boolean
}

export default function FormulaCard({
  expressao,
  nome,
  descricao,
  variaveis,
  accentColor,
  isFisica,
}: FormulaCardProps) {
  const [expandido, setExpandido] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${accentColor}30`,
      }}
    >
      {/* Header da fórmula */}
      <div
        className="p-3 lg:p-2.5"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
        }}
      >
        {nome && (
          <p
            className="text-xs lg:text-2xs font-medium mb-1.5 uppercase tracking-wide"
            style={{ color: accentColor }}
          >
            {nome}
          </p>
        )}

        {/* Fórmula principal - destaque visual */}
        <div
          className="py-3 px-4 rounded-lg text-center"
          style={{
            background: 'var(--bg-elevated)',
            boxShadow: `inset 0 0 20px ${accentColor}10`,
          }}
        >
          <code
            className="text-xl lg:text-lg font-mono font-bold tracking-wide"
            style={{ color: accentColor }}
          >
            {expressao}
          </code>
        </div>

        <p
          className="text-xs lg:text-2xs mt-2 text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          {descricao}
        </p>
      </div>

      {/* Variáveis (expansível) */}
      {variaveis && variaveis.length > 0 && (
        <>
          <button
            onClick={() => setExpandido(!expandido)}
            className="w-full px-3 py-2 flex items-center justify-between text-xs lg:text-2xs transition-colors"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" style={{ color: accentColor }} />
              <span className="font-medium">Onde:</span>
              {!expandido && (
                <span className="text-2xs" style={{ color: 'var(--text-muted)' }}>
                  ({variaveis.map(v => v.simbolo).join(', ')})
                </span>
              )}
            </span>
            {expandido ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {expandido && (
            <div
              className="px-3 pb-3 pt-1 space-y-1.5"
              style={{ background: 'var(--bg-elevated)' }}
            >
              {variaveis.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs lg:text-2xs"
                >
                  <span
                    className="font-mono font-bold min-w-[24px] text-center"
                    style={{ color: accentColor }}
                  >
                    {v.simbolo}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>=</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {v.significado}
                    {v.unidade && (
                      <span
                        className="ml-1 font-mono"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        [{v.unidade}]
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
