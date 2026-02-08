'use client'

import { AlertTriangle, Lightbulb, Info, Brain, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type TipoDica = 'lembre' | 'atencao' | 'dica' | 'conceito' | 'macete'

interface DicaCardProps {
  tipo: TipoDica
  titulo?: string
  conteudo: string | string[]
  accentColor?: string
}

const CONFIG_TIPOS: Record<TipoDica, {
  icon: LucideIcon
  bgColor: string
  borderColor: string
  iconColor: string
  tituloDefault: string
  emoji: string
}> = {
  lembre: {
    icon: Brain,
    bgColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    iconColor: 'var(--info)',
    tituloDefault: 'Lembre-se!',
    emoji: '🧠',
  },
  atencao: {
    icon: AlertTriangle,
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    iconColor: 'var(--warning)',
    tituloDefault: 'Atenção!',
    emoji: '⚠️',
  },
  dica: {
    icon: Lightbulb,
    bgColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    iconColor: 'var(--success)',
    tituloDefault: 'Dica Importante',
    emoji: '💡',
  },
  conceito: {
    icon: Info,
    bgColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    iconColor: 'var(--color-matematica)',
    tituloDefault: 'Conceito-chave',
    emoji: '📌',
  },
  macete: {
    icon: Zap,
    bgColor: 'rgba(236, 72, 153, 0.08)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
    iconColor: '#ec4899',
    tituloDefault: 'Macete',
    emoji: '⚡',
  },
}

export default function DicaCard({
  tipo,
  titulo,
  conteudo,
  accentColor,
}: DicaCardProps) {
  const config = CONFIG_TIPOS[tipo]
  const Icon = config.icon
  const conteudoArray = Array.isArray(conteudo) ? conteudo : [conteudo]

  return (
    <div
      className="rounded-xl p-3 lg:p-4"
      style={{
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">{config.emoji}</span>
        <div className="flex-1">
          <p
            className="text-xs lg:text-sm font-bold mb-1"
            style={{ color: config.iconColor }}
          >
            {titulo || config.tituloDefault}
          </p>
          {conteudoArray.length === 1 ? (
            <p
              className="text-xs lg:text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {conteudoArray[0]}
            </p>
          ) : (
            <ul className="space-y-1">
              {conteudoArray.map((item, index) => (
                <li
                  key={index}
                  className="text-xs lg:text-sm leading-relaxed flex items-start gap-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span style={{ color: config.iconColor }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
