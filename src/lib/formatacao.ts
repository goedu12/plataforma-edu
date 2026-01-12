/**
 * Utilitário de Formatação - Fórmulas e Notação Científica
 *
 * Converte notação de texto simples para caracteres Unicode formatados.
 * Essencial para exibição correta de:
 * - Notação científica (10^12 → 10¹²)
 * - Expoentes negativos (10^-7 → 10⁻⁷)
 * - Frações simples
 * - Símbolos matemáticos
 */

// Mapeamento de dígitos para superscript Unicode
const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  'n': 'ⁿ',
  'i': 'ⁱ',
}

// Mapeamento de dígitos para subscript Unicode
const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  'a': 'ₐ',
  'e': 'ₑ',
  'o': 'ₒ',
  'x': 'ₓ',
  'n': 'ₙ',
}

// Símbolos especiais de física/matemática
// Separados em categorias para aplicar word boundaries corretamente

// Símbolos que NÃO precisam de word boundary (operadores, LaTeX com \)
const SIMBOLOS_OPERADORES: Record<string, string> = {
  // Operadores e comparadores
  '>=': '≥',
  '<=': '≤',
  '!=': '≠',
  '~=': '≈',
  '~~': '≈',
  '===': '≡',
  '+-': '±',
  '-+': '∓',
  '->': '→',
  '=>': '⇒',
  '<-': '←',
  '<->': '↔',
  '<=>': '⇔',
  '...': '…',

  // LaTeX com backslash (sempre seguro)
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\delta': 'δ',
  '\\epsilon': 'ε',
  '\\zeta': 'ζ',
  '\\eta': 'η',
  '\\theta': 'θ',
  '\\kappa': 'κ',
  '\\lambda': 'λ',
  '\\mu': 'μ',
  '\\nu': 'ν',
  '\\xi': 'ξ',
  '\\pi': 'π',
  '\\rho': 'ρ',
  '\\sigma': 'σ',
  '\\tau': 'τ',
  '\\phi': 'φ',
  '\\chi': 'χ',
  '\\psi': 'ψ',
  '\\omega': 'ω',
  '\\Delta': 'Δ',
  '\\Gamma': 'Γ',
  '\\Theta': 'Θ',
  '\\Lambda': 'Λ',
  '\\Sigma': 'Σ',
  '\\Phi': 'Φ',
  '\\Psi': 'Ψ',
  '\\Omega': 'Ω',
  '\\infty': '∞',
  '\\sqrt': '√',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\int': '∫',
  '\\sum': 'Σ',
  '\\prod': 'Π',
  '\\propto': '∝',
  '\\degree': '°',
  '\\AA': 'Å',
  '\\hbar': 'ℏ',
  '\\ell': 'ℓ',
  '\\times': '×',
  '\\cdot': '·',
  '\\approx': '≈',
  '\\neq': '≠',
  '\\leq': '≤',
  '\\geq': '≥',
  '\\pm': '±',
  '\\mp': '∓',
  '\\perp': '⊥',
  '\\parallel': '∥',
  '\\angle': '∠',

  // Frações (seguro pois tem /)
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '3/4': '¾',
  '1/5': '⅕',
  '2/5': '⅖',
  '3/5': '⅗',
  '4/5': '⅘',
  '1/6': '⅙',
  '5/6': '⅚',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
}

// Símbolos que PRECISAM de word boundary (podem aparecer dentro de palavras)
// Estes só serão substituídos se forem palavras isoladas
const SIMBOLOS_PALAVRAS: Record<string, string> = {
  // Letras gregas por extenso (precisam de word boundary)
  'alfa': 'α',
  'alpha': 'α',
  'beta': 'β',
  'gama': 'γ',
  'gamma': 'γ',
  'delta': 'δ',
  'epsilon': 'ε',
  'zeta': 'ζ',
  'eta': 'η',
  'theta': 'θ',
  'iota': 'ι',
  'kappa': 'κ',
  'lambda': 'λ',
  'upsilon': 'υ',
  'phi': 'φ',
  'chi': 'χ',
  'psi': 'ψ',
  'omega': 'ω',
  'Delta': 'Δ',
  'Gamma': 'Γ',
  'Theta': 'Θ',
  'Lambda': 'Λ',
  'Sigma': 'Σ',
  'Phi': 'Φ',
  'Psi': 'Ψ',
  'Omega': 'Ω',
  'ohm': 'Ω',

  // Símbolos matemáticos por extenso
  'inf': '∞',
  'sqrt': '√',
  'raiz': '√',
  'partial': '∂',
  'nabla': '∇',
  'integral': '∫',
  'propto': '∝',
  'proporcional': '∝',

  // Unidades e constantes
  'graus': '°',
  'deg': '°',
  'celsius': '°C',
  'angstrom': 'Å',
  'hbar': 'ℏ',
  'ell': 'ℓ',

  // Outros símbolos por extenso
  'vezes': '×',
  'times': '×',
  'cdot': '·',
  'approx': '≈',
  'neq': '≠',
  'leq': '≤',
  'geq': '≥',
  'perp': '⊥',
  'parallel': '∥',
  'angle': '∠',
}

/**
 * Converte uma string para superscript Unicode
 */
function paraSuperscript(texto: string): string {
  return texto
    .split('')
    .map(char => SUPERSCRIPT_MAP[char] || char)
    .join('')
}

/**
 * Converte uma string para subscript Unicode
 */
function paraSubscript(texto: string): string {
  return texto
    .split('')
    .map(char => SUBSCRIPT_MAP[char] || char)
    .join('')
}

/**
 * Formata notação científica e expoentes
 * Exemplos:
 *   5x10^12 → 5×10¹²
 *   10^-7 → 10⁻⁷
 *   3,2x10^-18 → 3,2×10⁻¹⁸
 *   m^2 → m²
 *   x^2 + y^2 → x² + y²
 *   v_0 → v₀
 *   F_12 → F₁₂
 */
export function formatarFormula(texto: string): string {
  if (!texto) return texto

  let resultado = texto

  // 0. Pré-processamento: Limpar caracteres problemáticos de encoding
  // Substituir sequências de escape HTML comuns
  resultado = resultado.replace(/&lt;/g, '<')
  resultado = resultado.replace(/&gt;/g, '>')
  resultado = resultado.replace(/&amp;/g, '&')
  resultado = resultado.replace(/&nbsp;/g, ' ')
  resultado = resultado.replace(/&deg;/g, '°')
  resultado = resultado.replace(/&times;/g, '×')
  resultado = resultado.replace(/&divide;/g, '÷')
  resultado = resultado.replace(/&plusmn;/g, '±')
  resultado = resultado.replace(/&sup2;/g, '²')
  resultado = resultado.replace(/&sup3;/g, '³')

  // 1. Substituir x minúsculo por símbolo de multiplicação quando entre números
  // Ex: 5x10 → 5×10, mas não "exemplo" ou "x^2"
  resultado = resultado.replace(/(\d)\s*x\s*(\d)/gi, '$1×$2')
  resultado = resultado.replace(/(\d)\s*\*\s*(\d)/g, '$1×$2')
  // Também para vírgula decimal (formato brasileiro): 3,2x10 → 3,2×10
  resultado = resultado.replace(/(\d[,.]?\d*)\s*x\s*(10)/gi, '$1×$2')

  // 2. Formatar expoentes com ^ (padrão mais comum)
  // Match: número ou letra seguido de ^seguido de expoente (pode ter - ou + e dígitos)
  resultado = resultado.replace(/\^([+-]?\d+)/g, (_, exp) => paraSuperscript(exp))

  // 3. Formatar expoentes entre chaves: ^{-12}
  resultado = resultado.replace(/\^\{([^}]+)\}/g, (_, exp) => paraSuperscript(exp))

  // 4. Formatar subscripts com _ (ex: H_2O → H₂O, v_0 → v₀, F_12 → F₁₂)
  resultado = resultado.replace(/_(\d+)/g, (_, sub) => paraSubscript(sub))
  resultado = resultado.replace(/_\{([^}]+)\}/g, (_, sub) => paraSubscript(sub))
  // Subscript com letra única: v_i → vᵢ (apenas para letras comuns em subscript)
  resultado = resultado.replace(/_([aeonx])\b/gi, (_, sub) => paraSubscript(sub.toLowerCase()))

  // 5. Símbolos operadores (sem word boundary - são seguros)
  const operadoresOrdenados = Object.entries(SIMBOLOS_OPERADORES)
    .sort((a, b) => b[0].length - a[0].length)

  for (const [texto_original, simbolo] of operadoresOrdenados) {
    const escaped = texto_original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'g')
    resultado = resultado.replace(regex, simbolo)
  }

  // 6. Símbolos palavras (COM word boundary - evita substituir dentro de palavras)
  // Ex: "campo" não deve virar "ca∓o" por causa de "mp"
  const palavrasOrdenadas = Object.entries(SIMBOLOS_PALAVRAS)
    .sort((a, b) => b[0].length - a[0].length)

  for (const [texto_original, simbolo] of palavrasOrdenadas) {
    const escaped = texto_original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Case sensitive para maiúsculas (Delta, Sigma, etc.)
    const isCaseSensitive = texto_original[0] === texto_original[0].toUpperCase() &&
                            texto_original[0] !== texto_original[0].toLowerCase()
    const flags = isCaseSensitive ? 'g' : 'gi'
    // Word boundary \b garante que só match palavras completas
    const regex = new RegExp(`\\b${escaped}\\b`, flags)
    resultado = resultado.replace(regex, simbolo)
  }

  // 7. Limpar espaços múltiplos
  resultado = resultado.replace(/\s+/g, ' ').trim()

  return resultado
}

/**
 * Detecta se um texto contém notação científica ou fórmulas
 */
export function contemFormula(texto: string): boolean {
  if (!texto) return false

  const padroes = [
    /\d\s*[x×*]\s*10\s*\^/i,  // notação científica
    /\^[+-]?\d+/,              // expoentes
    /\^\{[^}]+\}/,             // expoentes com chaves
    /_\d+/,                    // subscripts
    /_\{[^}]+\}/,              // subscripts com chaves
  ]

  return padroes.some(p => p.test(texto))
}

/**
 * Formata unidades físicas comuns
 * Ex: m/s^2 → m/s², kg.m/s^2 → kg·m/s²
 */
export function formatarUnidade(unidade: string): string {
  if (!unidade) return unidade

  let resultado = unidade

  // Substituir . por · (ponto médio) para multiplicação de unidades
  resultado = resultado.replace(/([a-zA-Z])\.([a-zA-Z])/g, '$1·$2')

  // Aplicar formatação de expoentes
  resultado = formatarFormula(resultado)

  return resultado
}

/**
 * Formata especificamente valores de carga elétrica
 * Ex: +8x10^-7 C → +8×10⁻⁷ C
 */
export function formatarCarga(texto: string): string {
  return formatarFormula(texto)
}

// Exporta funções auxiliares para uso em casos específicos
export { paraSuperscript, paraSubscript, SUPERSCRIPT_MAP, SUBSCRIPT_MAP }
