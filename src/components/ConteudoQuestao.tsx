'use client'

import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import 'katex/dist/katex.min.css'
import { detectarGeneroTextual, separarTextoEFonte, formatarPorGenero, type GeneroTextual } from '@/lib/limpezaTexto'

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: ConteudoQuestao
// Renderiza conteúdo de questões ENEM com suporte a:
// - HTML permitido (strong, em, small, sup, sub, br)
// - LaTeX/KaTeX para fórmulas matemáticas ($...$, $$...$$)
// - Markdown para formatação rica
// - Descrições de imagens em itálico [...]
// - Fontes e referências em tamanho menor (UMA LINHA ABAIXO)
// - Detecção automática de gênero textual (prosa, poema, citação, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

interface ConteudoQuestaoProps {
  conteudo: string
  tipo?: 'contexto' | 'comando' | 'alternativa' | 'fonte'
  className?: string
  /** Se true, renderiza fonte em linha separada abaixo do texto */
  separarFonte?: boolean
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

  // Converter <small> para classe especial - fonte alinhada à direita
  texto = texto.replace(/<small>([\s\S]*?)<\/small>/gi, '<span class="questao-fonte">$1</span>')

  // Preservar spans com classes importantes (fontes, referências) - NÃO converter para markdown
  // O rehype-raw vai processar esses spans como HTML inline

  // Remover tags estruturais mantendo conteúdo
  texto = texto.replace(/<\/?p>/gi, '\n')
  texto = texto.replace(/<\/?div>/gi, '\n')

  // Remover apenas spans SEM classes importantes
  texto = texto.replace(/<span(?![^>]*class=["'](?:questao-fonte|ref-figura|ref-tabela|questao-titulo)["'])[^>]*>([\s\S]*?)<\/span>/gi, '$1')

  // Limpar múltiplas quebras de linha
  texto = texto.replace(/\n{3,}/g, '\n\n')
  texto = texto.trim()

  return texto
}

// Detecta se o texto contém fórmulas LaTeX ou notação científica
function contemLatex(texto: string): boolean {
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
    /\\times/,             // multiplicação LaTeX
    /\\div/,               // divisão LaTeX
    /\\pm/,                // mais ou menos LaTeX
    /\\vec\{/,             // vetor LaTeX
    /\\overline\{/,        // barra sobre
    /\\Delta/,             // delta LaTeX
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
    [/(\d+)\s*J\/mol/g, '$1 J/mol'],
    [/(\d+)\s*kJ\/mol/g, '$1 kJ/mol'],
    [/(\d+)\s*g\/mol/g, '$1 g/mol'],
    [/(\d+)\s*mol\/L/g, '$1 mol/L'],
    [/(\d+)\s*atm/g, '$1 atm'],
    [/(\d+)\s*kPa/g, '$1 kPa'],

    // Notação científica (converte para LaTeX)
    [/(\d+)\s*[xX×]\s*10\^(\d+)/g, '$1 \\times 10^{$2}'],
    [/(\d+)\s*[xX×]\s*10\^(-?\d+)/g, '$1 \\times 10^{$2}'],

    // Fórmulas químicas comuns - Ácidos
    [/\bH2SO4\b/g, 'H₂SO₄'],
    [/\bH3PO4\b/g, 'H₃PO₄'],
    [/\bHNO3\b/g, 'HNO₃'],
    [/\bHCl\b/g, 'HCl'],
    [/\bH2CO3\b/g, 'H₂CO₃'],
    [/\bH2S\b/g, 'H₂S'],
    [/\bH2O2\b/g, 'H₂O₂'],
    // Bases
    [/\bCa\(OH\)2\b/g, 'Ca(OH)₂'],
    [/\bMg\(OH\)2\b/g, 'Mg(OH)₂'],
    [/\bAl\(OH\)3\b/g, 'Al(OH)₃'],
    [/\bFe\(OH\)2\b/g, 'Fe(OH)₂'],
    [/\bFe\(OH\)3\b/g, 'Fe(OH)₃'],
    [/\bNH4OH\b/g, 'NH₄OH'],
    // Sais
    [/\bCaCO3\b/g, 'CaCO₃'],
    [/\bNa2CO3\b/g, 'Na₂CO₃'],
    [/\bNaHCO3\b/g, 'NaHCO₃'],
    [/\bCaSO4\b/g, 'CaSO₄'],
    [/\bBaSO4\b/g, 'BaSO₄'],
    [/\bAgNO3\b/g, 'AgNO₃'],
    [/\bFeCl3\b/g, 'FeCl₃'],
    [/\bFeCl2\b/g, 'FeCl₂'],
    [/\bKMnO4\b/g, 'KMnO₄'],
    [/\bK2Cr2O7\b/g, 'K₂Cr₂O₇'],
    [/\bNa2SO4\b/g, 'Na₂SO₄'],
    // Óxidos
    [/\bCO2\b/g, 'CO₂'],
    [/\bH2O\b/g, 'H₂O'],
    [/\bSO2\b/g, 'SO₂'],
    [/\bSO3\b/g, 'SO₃'],
    [/\bNO2\b/g, 'NO₂'],
    [/\bN2O\b/g, 'N₂O'],
    [/\bN2O4\b/g, 'N₂O₄'],
    [/\bN2O5\b/g, 'N₂O₅'],
    [/\bFe2O3\b/g, 'Fe₂O₃'],
    [/\bFe3O4\b/g, 'Fe₃O₄'],
    [/\bAl2O3\b/g, 'Al₂O₃'],
    [/\bSiO2\b/g, 'SiO₂'],
    [/\bP2O5\b/g, 'P₂O₅'],
    // Gases
    [/\bO2\b/g, 'O₂'],
    [/\bO3\b/g, 'O₃'],
    [/\bN2\b/g, 'N₂'],
    [/\bH2\b/g, 'H₂'],
    [/\bCl2\b/g, 'Cl₂'],
    [/\bF2\b/g, 'F₂'],
    [/\bNH3\b/g, 'NH₃'],
    // Compostos orgânicos
    [/\bCH4\b/g, 'CH₄'],
    [/\bC2H6\b/g, 'C₂H₆'],
    [/\bC2H4\b/g, 'C₂H₄'],
    [/\bC2H2\b/g, 'C₂H₂'],
    [/\bC3H8\b/g, 'C₃H₈'],
    [/\bC6H12O6\b/g, 'C₆H₁₂O₆'],
    [/\bC2H5OH\b/g, 'C₂H₅OH'],
    [/\bCH3OH\b/g, 'CH₃OH'],
    [/\bCH3COOH\b/g, 'CH₃COOH'],
    [/\bC6H6\b/g, 'C₆H₆'],
    // Íons comuns
    [/\bNH4\+/g, 'NH₄⁺'],
    [/\bSO4\^?2-/g, 'SO₄²⁻'],
    [/\bNO3-/g, 'NO₃⁻'],
    [/\bCO3\^?2-/g, 'CO₃²⁻'],
    [/\bHCO3-/g, 'HCO₃⁻'],
    [/\bPO4\^?3-/g, 'PO₄³⁻'],
    [/\bOH-/g, 'OH⁻'],
    [/\bMnO4-/g, 'MnO₄⁻'],
    [/\bFe\^?2\+/g, 'Fe²⁺'],
    [/\bFe\^?3\+/g, 'Fe³⁺'],
    [/\bCu\^?2\+/g, 'Cu²⁺'],
    [/\bZn\^?2\+/g, 'Zn²⁺'],
    [/\bAl\^?3\+/g, 'Al³⁺'],
    [/\bCa\^?2\+/g, 'Ca²⁺'],
    [/\bMg\^?2\+/g, 'Mg²⁺'],
    [/\bNa\+/g, 'Na⁺'],
    [/\bK\+/g, 'K⁺'],
    [/\bH\+/g, 'H⁺'],
    [/\bCl-/g, 'Cl⁻'],

    // Setas de reação
    [/<=>/g, '⇌'],
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

    // Letras gregas comuns em contexto científico
    [/\bdelta\b/gi, 'Δ'],
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
  className = '',
  separarFonte = true
}: ConteudoQuestaoProps) {

  // Separar corpo e fonte/referência
  const { corpo, fonte } = useMemo(() => {
    if (!conteudo || tipo !== 'contexto' || !separarFonte) {
      return { corpo: conteudo, fonte: null }
    }
    return separarTextoEFonte(conteudo)
  }, [conteudo, tipo, separarFonte])

  // Detectar gênero textual para aplicar estilos apropriados
  const generoTextual = useMemo(() => {
    if (tipo !== 'contexto') return 'prosa' as GeneroTextual
    return detectarGeneroTextual(corpo)
  }, [corpo, tipo])

  const conteudoProcessado = useMemo(() => {
    if (!corpo) return ''

    let texto = corpo

    // Aplicar formatação específica por gênero textual (poema, diálogo, citação)
    if (tipo === 'contexto' && generoTextual !== 'prosa') {
      texto = formatarPorGenero(texto, generoTextual)
    }

    // Formatar símbolos especiais
    texto = formatarSimbolos(texto)

    // Converter HTML para Markdown
    texto = htmlParaMarkdown(texto)

    return texto
  }, [corpo, tipo, generoTextual])

  const usarMarkdown = useMemo(() => {
    // Usar Markdown se contiver LaTeX ou formatação Markdown
    return contemLatex(conteudoProcessado) ||
           conteudoProcessado.includes('**') ||
           conteudoProcessado.includes('*') ||
           conteudoProcessado.includes('$')
  }, [conteudoProcessado])

  // Estilos baseados no tipo de conteúdo
  const estilosBase = {
    contexto: 'text-sm sm:text-base leading-relaxed questao-texto',
    comando: 'text-sm sm:text-base font-medium leading-relaxed',
    alternativa: 'text-sm leading-snug',
    fonte: 'text-xs leading-relaxed opacity-70',
  }

  // Classes adicionais baseadas no gênero textual
  const classesGenero: Record<GeneroTextual, string> = {
    prosa: '',
    poema: 'questao-poema',
    citacao: 'questao-citacao-container',
    cientifico: 'questao-cientifico',
    dialogo: 'questao-dialogo',
    lista: 'questao-lista',
  }

  const estiloTipo = estilosBase[tipo] || estilosBase.contexto
  const classeGenero = classesGenero[generoTextual] || ''

  // Componente de fonte/referência (renderizado abaixo do texto)
  const FonteComponent = fonte ? (
    <div className="questao-fonte-container">
      <p className="questao-fonte-linha">{fonte}</p>
    </div>
  ) : null

  // Se não precisa de Markdown/LaTeX, usar renderização HTML direta
  if (!usarMarkdown) {
    return (
      <div className={`conteudo-questao-wrapper ${classeGenero}`}>
        <div
          className={`conteudo-questao ${estiloTipo} ${className}`}
          style={{ color: 'var(--text-primary)' }}
          dangerouslySetInnerHTML={{ __html: corpo }}
        />
        {FonteComponent}
      </div>
    )
  }

  // Renderizar com ReactMarkdown + KaTeX + rehype-raw (para HTML inline)
  return (
    <div className={`conteudo-questao-wrapper ${classeGenero}`}>
      <div
        className={`conteudo-questao ${estiloTipo} ${className}`}
        style={{ color: 'var(--text-primary)' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
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
            // Spans com classes especiais (fontes, referências, títulos)
            span: ({ className: spanClass, children }) => {
              if (spanClass === 'questao-fonte') {
                return (
                  <span className="questao-fonte block text-right mt-2 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                    {children}
                  </span>
                )
              }
              if (spanClass === 'questao-titulo') {
                return (
                  <span className="questao-titulo block font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
                    {children}
                  </span>
                )
              }
              if (spanClass === 'ref-figura') {
                return (
                  <span className="ref-figura text-xs italic" style={{ color: 'var(--text-muted)' }}>
                    {children}
                  </span>
                )
              }
              if (spanClass === 'ref-tabela') {
                return (
                  <span className="ref-tabela text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                    {children}
                  </span>
                )
              }
              return <span className={spanClass}>{children}</span>
            },
            // Títulos h3 e h4 para títulos de textos
            h3: ({ children }) => (
              <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text-primary)' }}>
                {children}
              </h4>
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
            // Blockquote (usado para citações longas - recuo 4cm)
            blockquote: ({ children }) => (
              <blockquote
                className="questao-citacao pl-4 my-3 text-sm"
                style={{
                  marginLeft: '2.5rem',
                  paddingLeft: '1rem',
                  borderLeft: '3px solid var(--color-accent)',
                  color: 'var(--text-secondary)',
                  fontStyle: 'normal',
                  lineHeight: '1.5',
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
      {FonteComponent}
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
