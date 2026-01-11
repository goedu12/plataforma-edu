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
const SIMBOLOS_ESPECIAIS: Record<string, string> = {
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

  // Letras gregas minúsculas
  'alfa': 'α',
  'alpha': 'α',
  '\\alpha': 'α',
  'beta': 'β',
  '\\beta': 'β',
  'gama': 'γ',
  'gamma': 'γ',
  '\\gamma': 'γ',
  'delta': 'δ',
  '\\delta': 'δ',
  'epsilon': 'ε',
  '\\epsilon': 'ε',
  'zeta': 'ζ',
  '\\zeta': 'ζ',
  'eta': 'η',
  '\\eta': 'η',
  'theta': 'θ',
  '\\theta': 'θ',
  'iota': 'ι',
  'kappa': 'κ',
  '\\kappa': 'κ',
  'lambda': 'λ',
  '\\lambda': 'λ',
  'mu': 'μ',
  '\\mu': 'μ',
  'nu': 'ν',
  '\\nu': 'ν',
  'xi': 'ξ',
  '\\xi': 'ξ',
  'pi': 'π',
  '\\pi': 'π',
  'rho': 'ρ',
  '\\rho': 'ρ',
  'sigma': 'σ',
  '\\sigma': 'σ',
  'tau': 'τ',
  '\\tau': 'τ',
  'upsilon': 'υ',
  'phi': 'φ',
  '\\phi': 'φ',
  'chi': 'χ',
  '\\chi': 'χ',
  'psi': 'ψ',
  '\\psi': 'ψ',
  'omega': 'ω',
  '\\omega': 'ω',

  // Letras gregas maiúsculas
  'Delta': 'Δ',
  '\\Delta': 'Δ',
  'Gamma': 'Γ',
  '\\Gamma': 'Γ',
  'Theta': 'Θ',
  '\\Theta': 'Θ',
  'Lambda': 'Λ',
  '\\Lambda': 'Λ',
  'Sigma': 'Σ',
  '\\Sigma': 'Σ',
  'Phi': 'Φ',
  '\\Phi': 'Φ',
  'Psi': 'Ψ',
  '\\Psi': 'Ψ',
  'Omega': 'Ω',
  '\\Omega': 'Ω',
  'ohm': 'Ω',

  // Símbolos matemáticos
  'inf': '∞',
  '\\infty': '∞',
  'sqrt': '√',
  '\\sqrt': '√',
  'raiz': '√',
  'partial': '∂',
  '\\partial': '∂',
  'nabla': '∇',
  '\\nabla': '∇',
  'integral': '∫',
  '\\int': '∫',
  'sum': 'Σ',
  '\\sum': 'Σ',
  'prod': 'Π',
  '\\prod': 'Π',
  'propto': '∝',
  '\\propto': '∝',
  'proporcional': '∝',

  // Unidades e constantes
  'graus': '°',
  'deg': '°',
  '\\degree': '°',
  'celsius': '°C',
  'angstrom': 'Å',
  '\\AA': 'Å',
  'hbar': 'ℏ',
  '\\hbar': 'ℏ',
  'ell': 'ℓ',
  '\\ell': 'ℓ',

  // Frações comuns
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

  // Outros símbolos úteis
  'vezes': '×',
  'times': '×',
  '\\times': '×',
  'cdot': '·',
  '\\cdot': '·',
  'div': '÷',
  'approx': '≈',
  '\\approx': '≈',
  'neq': '≠',
  '\\neq': '≠',
  'leq': '≤',
  '\\leq': '≤',
  'geq': '≥',
  '\\geq': '≥',
  'pm': '±',
  '\\pm': '±',
  'mp': '∓',
  '\\mp': '∓',
  'perp': '⊥',
  '\\perp': '⊥',
  'parallel': '∥',
  '\\parallel': '∥',
  'angle': '∠',
  '\\angle': '∠',
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

  // 5. Símbolos especiais (ordenados por tamanho para evitar conflitos)
  const simbolosOrdenados = Object.entries(SIMBOLOS_ESPECIAIS)
    .sort((a, b) => b[0].length - a[0].length)

  for (const [texto_original, simbolo] of simbolosOrdenados) {
    // Case insensitive para palavras gregas, mas case sensitive para maiúsculas
    const isCaseSensitive = texto_original[0] === texto_original[0].toUpperCase() &&
                            texto_original[0] !== texto_original[0].toLowerCase()
    const flags = isCaseSensitive ? 'g' : 'gi'
    const regex = new RegExp(texto_original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    resultado = resultado.replace(regex, simbolo)
  }

  // 6. Limpar espaços múltiplos
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
