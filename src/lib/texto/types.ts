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
export const TAGS_PERMITIDAS = new Set([
  'p', 'br', 'em', 'strong', 'span', 'div', 'img',
  'b', 'i', 'u', 'sub', 'sup', 'ul', 'ol', 'li',
  'small'
])

// Atributos permitidos por tag
export const ATRIBUTOS_PERMITIDOS: Record<string, Set<string>> = {
  'img': new Set(['src', 'alt', 'class', 'loading', 'width', 'height']),
  'span': new Set(['class', 'style']),
  'div': new Set(['class', 'style']),
  'p': new Set(['class', 'style']),
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
