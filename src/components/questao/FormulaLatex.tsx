'use client'

import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

interface FormulaLatexProps {
  formula: string
  display?: boolean // true = bloco centralizado, false = inline
  className?: string
}

/**
 * Renderiza fórmulas LaTeX usando KaTeX
 * @param formula - A fórmula LaTeX sem delimitadores
 * @param display - Se true, renderiza em bloco centralizado
 * @param className - Classes CSS adicionais
 */
export function FormulaLatex({ formula, display = false, className = '' }: FormulaLatexProps) {
  const formulaFormatada = display ? `$$${formula}$$` : `$${formula}$`

  return (
    <span className={`formula-latex ${display ? 'block text-center my-2' : 'inline'} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {formulaFormatada}
      </ReactMarkdown>
    </span>
  )
}
