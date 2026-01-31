'use client'

import { BookOpen } from 'lucide-react'

interface ConteudoCardProps {
  paragrafos: string[]
  titulo?: string
  accentColor: string
}

export default function ConteudoCard({
  paragrafos,
  titulo = 'Conceito',
  accentColor,
}: ConteudoCardProps) {
  return (
    <div
      className="rounded-xl p-4 lg:p-5"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <BookOpen
          className="w-5 h-5 lg:w-6 lg:h-6"
          style={{ color: accentColor }}
        />
        <h2
          className="text-sm lg:text-base font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {titulo}
        </h2>
      </div>

      <div className="space-y-3">
        {paragrafos.map((paragrafo, index) => (
          <p
            key={index}
            className="text-sm lg:text-base leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {/* Destacar palavras em negrito entre ** */}
            {paragrafo.split(/(\*\*[^*]+\*\*)/g).map((parte, i) => {
              if (parte.startsWith('**') && parte.endsWith('**')) {
                return (
                  <strong
                    key={i}
                    style={{ color: accentColor, fontWeight: 600 }}
                  >
                    {parte.slice(2, -2)}
                  </strong>
                )
              }
              return parte
            })}
          </p>
        ))}
      </div>
    </div>
  )
}
