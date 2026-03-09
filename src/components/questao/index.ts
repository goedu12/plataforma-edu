/**
 * Componentes de renderização de questões
 *
 * Este módulo contém os componentes usados para renderizar
 * conteúdo de questões ENEM e educacionais.
 *
 * Uso:
 * import { FormulaLatex, FonteReferencia, TituloTexto } from '@/components/questao'
 */

export { FormulaLatex } from './FormulaLatex'
export { DescricaoImagem } from './DescricaoImagem'
export { FonteReferencia } from './FonteReferencia'
export { TituloTexto } from './TituloTexto'

// Re-exportar o componente principal do arquivo original (compatibilidade)
export { default as ConteudoQuestao } from '../ConteudoQuestao'
