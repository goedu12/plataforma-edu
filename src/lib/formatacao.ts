/**
 * Utilitário de Formatação - Fórmulas, Notação Científica e Reações Químicas
 *
 * Converte notação de texto simples para caracteres Unicode formatados.
 * Essencial para exibição correta de:
 * - Notação científica (10^12 → 10¹²)
 * - Expoentes negativos (10^-7 → 10⁻⁷)
 * - Frações simples
 * - Símbolos matemáticos
 * - Reações químicas (H2 + O2 -> H2O)
 * - Fórmulas químicas com índices (H2SO4 → H₂SO₄)
 * - Íons com carga (Na+ → Na⁺, SO4^2- → SO₄²⁻)
 * - Equilíbrio químico (<=> → ⇌)
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
  '<=>': '⇌',
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
  'sigma': 'σ',
  'epsilon': 'ε',
  'rho': 'ρ',
  'tau': 'τ',
  'phi': 'φ',
  'omega': 'ω',
  'ohm': 'Ω',
  'graus': '°',
  'deg': '°',
}

// Fórmulas químicas comuns: mapeamento direto texto → formatado
const FORMULAS_QUIMICAS: [RegExp, string][] = [
  // Ácidos
  [/\bH2SO4\b/g, 'H₂SO₄'],
  [/\bH2SO3\b/g, 'H₂SO₃'],
  [/\bH3PO4\b/g, 'H₃PO₄'],
  [/\bH2CO3\b/g, 'H₂CO₃'],
  [/\bHNO3\b/g, 'HNO₃'],
  [/\bHNO2\b/g, 'HNO₂'],
  [/\bHCl\b/g, 'HCl'],
  [/\bHBr\b/g, 'HBr'],
  [/\bHF\b/g, 'HF'],
  [/\bHCN\b/g, 'HCN'],
  [/\bH2S\b/g, 'H₂S'],
  // Bases
  [/\bNaOH\b/g, 'NaOH'],
  [/\bKOH\b/g, 'KOH'],
  [/\bCa\(OH\)2\b/g, 'Ca(OH)₂'],
  [/\bMg\(OH\)2\b/g, 'Mg(OH)₂'],
  [/\bAl\(OH\)3\b/g, 'Al(OH)₃'],
  [/\bFe\(OH\)2\b/g, 'Fe(OH)₂'],
  [/\bFe\(OH\)3\b/g, 'Fe(OH)₃'],
  [/\bNH4OH\b/g, 'NH₄OH'],
  // Sais
  [/\bNaCl\b/g, 'NaCl'],
  [/\bKCl\b/g, 'KCl'],
  [/\bCaCO3\b/g, 'CaCO₃'],
  [/\bNa2CO3\b/g, 'Na₂CO₃'],
  [/\bNaHCO3\b/g, 'NaHCO₃'],
  [/\bCaSO4\b/g, 'CaSO₄'],
  [/\bBaSO4\b/g, 'BaSO₄'],
  [/\bAgNO3\b/g, 'AgNO₃'],
  [/\bFeCl3\b/g, 'FeCl₃'],
  [/\bFeCl2\b/g, 'FeCl₂'],
  [/\bAlCl3\b/g, 'AlCl₃'],
  [/\bKMnO4\b/g, 'KMnO₄'],
  [/\bK2Cr2O7\b/g, 'K₂Cr₂O₇'],
  [/\bNa2SO4\b/g, 'Na₂SO₄'],
  // Óxidos
  [/\bCO2\b/g, 'CO₂'],
  [/\bCO\b(?![a-z])/g, 'CO'],
  [/\bH2O\b/g, 'H₂O'],
  [/\bH2O2\b/g, 'H₂O₂'],
  [/\bSO2\b/g, 'SO₂'],
  [/\bSO3\b/g, 'SO₃'],
  [/\bNO2\b/g, 'NO₂'],
  [/\bNO\b(?![a-z])/g, 'NO'],
  [/\bN2O\b/g, 'N₂O'],
  [/\bN2O4\b/g, 'N₂O₄'],
  [/\bN2O5\b/g, 'N₂O₅'],
  [/\bFe2O3\b/g, 'Fe₂O₃'],
  [/\bFeO\b/g, 'FeO'],
  [/\bFe3O4\b/g, 'Fe₃O₄'],
  [/\bAl2O3\b/g, 'Al₂O₃'],
  [/\bCaO\b/g, 'CaO'],
  [/\bMgO\b/g, 'MgO'],
  [/\bSiO2\b/g, 'SiO₂'],
  [/\bP2O5\b/g, 'P₂O₅'],
  // Gases e moléculas comuns
  [/\bO2\b/g, 'O₂'],
  [/\bO3\b/g, 'O₃'],
  [/\bN2\b/g, 'N₂'],
  [/\bH2\b/g, 'H₂'],
  [/\bCl2\b/g, 'Cl₂'],
  [/\bF2\b/g, 'F₂'],
  [/\bBr2\b/g, 'Br₂'],
  [/\bI2\b/g, 'I₂'],
  // Compostos orgânicos comuns
  [/\bCH4\b/g, 'CH₄'],
  [/\bC2H6\b/g, 'C₂H₆'],
  [/\bC2H4\b/g, 'C₂H₄'],
  [/\bC2H2\b/g, 'C₂H₂'],
  [/\bC3H8\b/g, 'C₃H₈'],
  [/\bC4H10\b/g, 'C₄H₁₀'],
  [/\bC6H12O6\b/g, 'C₆H₁₂O₆'],
  [/\bC2H5OH\b/g, 'C₂H₅OH'],
  [/\bCH3OH\b/g, 'CH₃OH'],
  [/\bCH3COOH\b/g, 'CH₃COOH'],
  [/\bCH3COO\b/g, 'CH₃COO'],
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
  [/\bCr2O7\^?2-/g, 'Cr₂O₇²⁻'],
  [/\bCrO4\^?2-/g, 'CrO₄²⁻'],
  // Íons metálicos com carga
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
  [/\bBr-/g, 'Br⁻'],
  [/\bI-/g, 'I⁻'],
  [/\bF-/g, 'F⁻'],
  [/\bS\^?2-/g, 'S²⁻'],
  [/\bAg\+/g, 'Ag⁺'],
  [/\bPb\^?2\+/g, 'Pb²⁺'],
]

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

  // 0. Fórmulas químicas conhecidas (antes dos expoentes genéricos para evitar conflitos)
  for (const [padrao, substituicao] of FORMULAS_QUIMICAS) {
    resultado = resultado.replace(padrao, substituicao)
  }

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

  // 5. Formatar índices químicos genéricos restantes
  // Padrão: Letra maiúscula seguida de letra(s) minúscula(s) + número (ex: Mn2 → Mn₂)
  // Só aplica se não for parte de fórmula já formatada (sem ₂ já presente)
  resultado = resultado.replace(/([A-Z][a-z]?)(\d)(?=[A-Z\s\+\-\(\)→⇌,\.;:]|$)/g,
    (match, elem, num) => {
      // Verificar se já está formatado
      if (/[₀₁₂₃₄₅₆₇₈₉]/.test(match)) return match
      return elem + paraSubscript(num)
    }
  )

  // 6. Símbolos especiais (ordenados por tamanho para evitar conflitos)
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
    /\b[A-Z][a-z]?\d[A-Z]/,   // fórmula química (ex: H2O, CO2)
    /\b(H2SO4|NaOH|HCl|H2O|CO2|O2|N2|CH4|C2H5OH|NH3|H2O2)\b/, // compostos
    /<=>|<->/,                 // equilíbrio químico
    /[A-Z][a-z]?\^?\d*[+-]/,  // íons (Na+, Fe2+, Cl-)
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
