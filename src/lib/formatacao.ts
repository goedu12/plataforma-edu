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
  '>=': '≥',
  '<=': '≤',
  '!=': '≠',
  '+-': '±',
  '-+': '∓',
  '->': '→',
  '<-': '←',
  '<->': '↔',
  '~=': '≈',
  'inf': '∞',
  'pi': 'π',
  'alfa': 'α',
  'beta': 'β',
  'gama': 'γ',
  'gamma': 'γ',
  'delta': 'Δ',
  'theta': 'θ',
  'lambda': 'λ',
  'mu': 'μ',
  'omega': 'ω',
  'ohm': 'Ω',
  'graus': '°',
  'deg': '°',
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
 */
export function formatarFormula(texto: string): string {
  if (!texto) return texto

  let resultado = texto

  // 1. Substituir x minúsculo por símbolo de multiplicação quando entre números
  // Ex: 5x10 → 5×10, mas não "exemplo" ou "x^2"
  resultado = resultado.replace(/(\d)\s*x\s*(\d)/gi, '$1×$2')
  resultado = resultado.replace(/(\d)\s*\*\s*(\d)/g, '$1×$2')

  // 2. Formatar expoentes com ^ (padrão mais comum)
  // Match: número ou letra seguido de ^seguido de expoente (pode ter - ou + e dígitos)
  resultado = resultado.replace(/\^([+-]?\d+)/g, (_, exp) => paraSuperscript(exp))

  // 3. Formatar expoentes entre chaves: ^{-12}
  resultado = resultado.replace(/\^\{([^}]+)\}/g, (_, exp) => paraSuperscript(exp))

  // 4. Formatar subscripts com _ (ex: H_2O → H₂O)
  resultado = resultado.replace(/_(\d+)/g, (_, sub) => paraSubscript(sub))
  resultado = resultado.replace(/_\{([^}]+)\}/g, (_, sub) => paraSubscript(sub))

  // 5. Símbolos especiais (ordenados por tamanho para evitar conflitos)
  const simbolosOrdenados = Object.entries(SIMBOLOS_ESPECIAIS)
    .sort((a, b) => b[0].length - a[0].length)

  for (const [texto_original, simbolo] of simbolosOrdenados) {
    // Case insensitive para palavras gregas
    const regex = new RegExp(texto_original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    resultado = resultado.replace(regex, simbolo)
  }

  return resultado
}

/**
 * Formata texto para exibição segura em HTML
 * Preserva formatação matemática mas escapa HTML perigoso
 */
export function formatarTextoSeguro(texto: string): string {
  if (!texto) return texto

  // Primeiro aplica formatação de fórmulas
  let resultado = formatarFormula(texto)

  // Escapa caracteres HTML perigosos (mas preserva os símbolos matemáticos Unicode)
  resultado = resultado
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

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
