/**
 * Tipos e constantes para processamento de texto
 */

// Valores que devem ser tratados como vazio
export const VALORES_INVALIDOS = ['nan', 'none', 'null', 'undefined', 'NaN', 'None', 'NULL', '']

// URLs de imagem que são placeholders/quebrados conhecidos
export const URLS_PLACEHOLDER = [
  'broken-image',
  'placeholder',
  'no-image',
  'image-not-found',
  'not-available',
]

// Tags HTML permitidas (sanitização XSS)
// Inclui elementos estruturais usados pela renderização de conteúdo de questão.
export const TAGS_PERMITIDAS = new Set([
  'p', 'br', 'em', 'strong', 'span', 'div', 'img',
  'b', 'i', 'u', 'sub', 'sup', 'ul', 'ol', 'li',
  'small', 'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'article', 'section', 'a'
])

// Atributos permitidos por tag
export const ATRIBUTOS_PERMITIDOS: Record<string, Set<string>> = {
  img: new Set(['src', 'alt', 'class', 'loading', 'width', 'height']),
  a: new Set(['href', 'title', 'target', 'rel', 'class']),
  span: new Set(['class', 'style']),
  div: new Set(['class', 'style']),
  p: new Set(['class', 'style']),
  blockquote: new Set(['class', 'style']),
  article: new Set(['class', 'style']),
  section: new Set(['class', 'style']),
  h1: new Set(['class', 'style']),
  h2: new Set(['class', 'style']),
  h3: new Set(['class', 'style']),
  h4: new Set(['class', 'style']),
  h5: new Set(['class', 'style']),
  h6: new Set(['class', 'style']),
  table: new Set(['class', 'style']),
  thead: new Set(['class', 'style']),
  tbody: new Set(['class', 'style']),
  tr: new Set(['class', 'style']),
  th: new Set(['class', 'style', 'colspan', 'rowspan', 'scope']),
  td: new Set(['class', 'style', 'colspan', 'rowspan']),
}

/**
 * Gêneros textuais suportados pelo sistema
 */
export type GeneroTextual =
  | 'prosa'
  | 'poema'
  | 'citacao'
  | 'cientifico'
  | 'dialogo'
  | 'lista'
  | 'noticia'
  | 'carta'
  | 'anuncio'
  | 'documento'
  | 'tirinha'
  | 'artigo_lei'
  | 'entrevista'
  | 'letra_musica'
  | 'infografico'
