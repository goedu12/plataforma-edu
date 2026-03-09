/**
 * Módulo de processamento de texto
 *
 * Este módulo centraliza todas as funções de limpeza, formatação e processamento
 * de texto para questões ENEM e conteúdo educacional.
 *
 * Estrutura:
 * - types.ts: Tipos e constantes
 * - (funções re-exportadas de limpezaTexto.ts para compatibilidade)
 *
 * Uso:
 * import { processarContexto, detectarGeneroTextual } from '@/lib/texto'
 */

// Re-exportar tipos
export * from './types'

// Re-exportar funções do arquivo original (compatibilidade)
// Isso permite migração gradual sem quebrar imports existentes
export {
  sanitizarHTML,
  isValidImageUrl,
  limparTexto,
  isTextoValido,
  formatarMatematica,
  processarTexto,
  processarContexto,
  extrairFontesDoContexto,
  detectarGeneroTextual,
  formatarPorGenero,
  separarTextoEFonte,
  extrairTituloDoTexto,
  destacarTituloContexto,
  separarMultiplosTextos,
  extrairImagensInline,
} from '../limpezaTexto'
