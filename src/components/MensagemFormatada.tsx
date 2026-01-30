'use client'

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface MensagemFormatadaProps {
  conteudo: string
}

/**
 * Componente para renderizar mensagens do tutor com suporte a:
 * - Markdown (negrito, itálico, listas, etc.)
 * - LaTeX inline: $E = mc^2$
 * - LaTeX em bloco: $$\int_0^1 x^2 dx$$
 * - Fórmulas, equações, símbolos matemáticos e científicos
 */
export default function MensagemFormatada({ conteudo }: MensagemFormatadaProps) {
  return (
    <div className="mensagem-formatada text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Parágrafos sem margem extra
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          // Listas
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm">{children}</li>
          ),
          // Negrito
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          // Código inline
          code: ({ children, className }) => {
            // Se tiver className, é bloco de código (com linguagem)
            if (className) {
              return (
                <code
                  className="block p-3 rounded-lg my-2 text-xs overflow-x-auto"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {children}
                </code>
              )
            }
            // Inline code
            return (
              <code
                className="px-1.5 py-0.5 rounded text-xs font-mono"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                }}
              >
                {children}
              </code>
            )
          },
          // Blocos de código
          pre: ({ children }) => (
            <pre className="my-2">{children}</pre>
          ),
          // Headers dentro de mensagens
          h1: ({ children }) => (
            <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 className="font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{children}</h4>
          ),
          h3: ({ children }) => (
            <h5 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{children}</h5>
          ),
          // Separador
          hr: () => (
            <hr className="my-3" style={{ borderColor: 'var(--border-default)' }} />
          ),
          // Tabelas
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="text-xs w-full" style={{ borderCollapse: 'collapse' }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              className="px-2 py-1 text-left font-semibold"
              style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="px-2 py-1"
              style={{ borderBottom: '1px solid var(--border-default)' }}
            >
              {children}
            </td>
          ),
        }}
      >
        {conteudo}
      </ReactMarkdown>
    </div>
  )
}
