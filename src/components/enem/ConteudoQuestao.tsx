'use client'

import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: ConteudoQuestao
// Renderiza conteúdo de questões ENEM com suporte a:
// - HTML permitido (strong, em, small, sup, sub, br)
// - LaTeX/KaTeX para fórmulas matemáticas ($...$, $$...$$)
// - Markdown para formatação rica
// - Descrições de imagens em itálico [...]
// - Fontes e referências em tamanho menor
// ═══════════════════════════════════════════════════════════════════════════════

interface ConteudoQuestaoProps {
  conteudo: string
  tipo?: 'contexto' | 'comando' | 'alternativa' | 'fonte'
  className?: string
}

// Converte HTML específico para Markdown compatível com KaTeX
function htmlParaMarkdown(html: string): string {
  if (!html) return ''

  let texto = html

  // Preservar quebras de linha
  texto = texto.replace(/<br\s*\/?>/gi, '\n')

  // Converter tags HTML para Markdown
  texto = texto.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
  texto = texto.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**')
  texto = texto.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
  texto = texto.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*')
  texto = texto.replace(/<u>([\s\S]*?)<\/u>/gi, '<u>$1</u>') // Manter underline como HTML
  texto = texto.replace(/<sup>([\s\S]*?)<\/sup>/gi, '^{$1}') // Converter para LaTeX superscript
  texto = texto.replace(/<sub>([\s\S]*?)<\/sub>/gi, '_{$1}') // Converter para LaTeX subscript

  // Converter <small> para classe especial (será tratado pelo CSS)
  texto = texto.replace(/<small>([\s\S]*?)<\/small>/gi, '<span class="fonte-pequena">$1</span>')

  // Remover tags não suportadas mantendo conteúdo
  texto = texto.replace(/<\/?p>/gi, '\n')
  texto = texto.replace(/<\/?div>/gi, '\n')
  texto = texto.replace(/<\/?span[^>]*>/gi, '')

  // Limpar múltiplas quebras de linha
  texto = texto.replace(/\n{3,}/g, '\n\n')
  texto = texto.trim()

  return texto
}

// Detecta se o texto contém fórmulas LaTeX
function contemLatex(texto: string): boolean {
  // Padrões comuns de LaTeX
  const padroes = [
    /\$[^$]+\$/,           // $inline$
    /\$\$[^$]+\$\$/,       // $$block$$
    /\\frac\{/,            // \frac{}{}
    /\\sqrt\{/,            // \sqrt{}
    /\\sum/,               // \sum
    /\\int/,               // \int
    /\\lim/,               // \lim
    /\\infty/,             // \infty
    /\^{[^}]+}/,           // ^{expoente}
    /_{[^}]+}/,            // _{subscrito}
    /\\[a-zA-Z]+\{/,       // qualquer comando LaTeX
  ]

  return padroes.some(p => p.test(texto))
}

// Formata símbolos especiais comuns em questões ENEM
function formatarSimbolos(texto: string): string {
  // Símbolos químicos e físicos comuns
  const substituicoes: [RegExp, string][] = [
    // Unidades
    [/(\d+)\s*°C/g, '$1 °C'],
    [/(\d+)\s*°F/g, '$1 °F'],
    [/(\d+)\s*K(?![a-zA-Z])/g, '$1 K'],
    [/(\d+)\s*m\/s/g, '$1 m/s'],
    [/(\d+)\s*km\/h/g, '$1 km/h'],
    [/(\d+)\s*m²/g, '$1 m²'],
    [/(\d+)\s*m³/g, '$1 m³'],
    [/(\d+)\s*cm²/g, '$1 cm²'],
    [/(\d+)\s*cm³/g, '$1 cm³'],

    // Notação científica (converte para LaTeX)
    [/(\d+)\s*[xX×]\s*10\^(\d+)/g, '$1 \\times 10^{$2}'],
    [/(\d+)\s*[xX×]\s*10\^(-?\d+)/g, '$1 \\times 10^{$2}'],

    // Símbolos químicos com índices
    [/CO2/g, 'CO₂'],
    [/H2O/g, 'H₂O'],
    [/O2/g, 'O₂'],
    [/N2/g, 'N₂'],
    [/CO₂/g, 'CO₂'], // Já formatado

    // Setas
    [/->/g, '→'],
    [/<->/g, '↔'],
    [/=>/g, '⇒'],

    // Símbolos matemáticos
    [/(\d+)%/g, '$1%'],
    [/\+-/g, '±'],
    [/>=/g, '≥'],
    [/<=/g, '≤'],
    [/!=/g, '≠'],
    [/~=/g, '≈'],
  ]

  let resultado = texto
  for (const [padrao, substituicao] of substituicoes) {
    resultado = resultado.replace(padrao, substituicao)
  }

  return resultado
}

export default function ConteudoQuestao({
  conteudo,
  tipo = 'contexto',
  className = ''
}: ConteudoQuestaoProps) {

  const conteudoProcessado = useMemo(() => {
    if (!conteudo) return ''

    let texto = conteudo

    // Formatar símbolos especiais
    texto = formatarSimbolos(texto)

    // Converter HTML para Markdown
    texto = htmlParaMarkdown(texto)

    return texto
  }, [conteudo])

  const usarMarkdown = useMemo(() => {
    // Usar Markdown se contiver LaTeX ou formatação Markdown
    return contemLatex(conteudoProcessado) ||
           conteudoProcessado.includes('**') ||
           conteudoProcessado.includes('*') ||
           conteudoProcessado.includes('$')
  }, [conteudoProcessado])

  // Estilos baseados no tipo de conteúdo
  const estilosBase = {
    contexto: 'text-sm sm:text-base leading-relaxed',
    comando: 'text-sm sm:text-base font-medium leading-relaxed',
    alternativa: 'text-sm leading-relaxed',
    fonte: 'text-xs leading-relaxed opacity-70',
  }

  const estiloTipo = estilosBase[tipo] || estilosBase.contexto

  // Se não precisa de Markdown/LaTeX, usar renderização HTML direta
  if (!usarMarkdown) {
    return (
      <div
        className={`conteudo-questao ${estiloTipo} ${className}`}
        style={{ color: 'var(--text-primary)' }}
        dangerouslySetInnerHTML={{ __html: conteudo }}
      />
    )
  }

  // Renderizar com ReactMarkdown + KaTeX
  return (
    <div
      className={`conteudo-questao ${estiloTipo} ${className}`}
      style={{ color: 'var(--text-primary)' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Parágrafos
          p: ({ children }) => (
            <p className="mb-2 last:mb-0">{children}</p>
          ),
          // Negrito
          strong: ({ children }) => (
            <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {children}
            </strong>
          ),
          // Itálico (usado para descrições de imagens)
          em: ({ children }) => (
            <em className="italic" style={{ color: 'var(--text-secondary)' }}>
              {children}
            </em>
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
          // Código (para fórmulas que não são LaTeX)
          code: ({ children, className: codeClass }) => {
            if (codeClass) {
              return (
                <code
                  className="block p-2 rounded my-2 text-xs overflow-x-auto font-mono"
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  {children}
                </code>
              )
            }
            return (
              <code
                className="px-1 py-0.5 rounded text-xs font-mono"
                style={{ background: 'var(--bg-elevated)' }}
              >
                {children}
              </code>
            )
          },
          // Tabelas
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table
                className="w-full text-sm border-collapse"
                style={{ border: '1px solid var(--border-default)' }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ background: 'var(--bg-elevated)' }}>
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th
              className="px-3 py-2 text-left font-semibold text-xs"
              style={{ border: '1px solid var(--border-default)' }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              className="px-3 py-2 text-sm"
              style={{ border: '1px solid var(--border-default)' }}
            >
              {children}
            </td>
          ),
          // Blockquote (usado para citações)
          blockquote: ({ children }) => (
            <blockquote
              className="pl-4 my-2 italic"
              style={{
                borderLeft: '3px solid var(--border-default)',
                color: 'var(--text-secondary)'
              }}
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {conteudoProcessado}
      </ReactMarkdown>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: FormulaLatex
// Renderiza uma fórmula LaTeX isolada
// ═══════════════════════════════════════════════════════════════════════════════

interface FormulaLatexProps {
  formula: string
  display?: boolean // true = bloco centralizado, false = inline
  className?: string
}

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

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: DescricaoImagem
// Renderiza descrição de imagem em formato padronizado
// ═══════════════════════════════════════════════════════════════════════════════

interface DescricaoImagemProps {
  descricao: string
  className?: string
}

export function DescricaoImagem({ descricao, className = '' }: DescricaoImagemProps) {
  return (
    <div
      className={`descricao-imagem p-3 rounded-lg my-2 ${className}`}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)'
      }}
    >
      <p
        className="text-xs sm:text-sm italic leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        {descricao}
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: FonteReferencia
// Renderiza fonte/referência bibliográfica
// ═══════════════════════════════════════════════════════════════════════════════

interface FonteReferenciaProps {
  fonte: string
  className?: string
}

export function FonteReferencia({ fonte, className = '' }: FonteReferenciaProps) {
  return (
    <p
      className={`fonte-referencia text-xs leading-relaxed ${className}`}
      style={{ color: 'var(--text-muted)' }}
    >
      {fonte}
    </p>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: TituloTexto
// Renderiza título de texto/obra em destaque
// ═══════════════════════════════════════════════════════════════════════════════

interface TituloTextoProps {
  titulo: string
  subtitulo?: string
  className?: string
}

export function TituloTexto({ titulo, subtitulo, className = '' }: TituloTextoProps) {
  return (
    <div className={`titulo-texto mb-2 ${className}`}>
      <h3
        className="font-semibold text-sm sm:text-base"
        style={{ color: 'var(--text-primary)' }}
      >
        {titulo}
      </h3>
      {subtitulo && (
        <p
          className="text-xs italic mt-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {subtitulo}
        </p>
      )}
    </div>
  )
}
