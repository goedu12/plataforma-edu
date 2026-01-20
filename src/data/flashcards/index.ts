/**
 * Índice central de FlashCards
 * Estrutura escalável para adicionar novos componentes e anos
 */

import type { FlashCard, AnoEscolar, TemaFlashCard, FiltrosFlashCard } from '@/types/flashcards'
import type { Componente } from '@/types'

// Importação das questões por componente e ano
// Física (Ensino Médio)
import { flashcardsFisica1Ano } from './fisica-1ano'
import { flashcardsFisica2Ano } from './fisica-2ano'
import { flashcardsFisica3Ano } from './fisica-3ano'

// Matemática (Ensino Fundamental - Anos Finais)
import { flashcardsMatematica6Ano } from './matematica-6ano-ef'
import { flashcardsMatematica7Ano } from './matematica-7ano-ef'
import { flashcardsMatematica8Ano } from './matematica-8ano-ef'
import { flashcardsMatematica9Ano } from './matematica-9ano-ef'

// Matemática (Ensino Médio)
import { flashcardsMatematica1Ano } from './matematica-1ano-em'
import { flashcardsMatematica2anoEM } from './matematica-2ano-em'
import { flashcardsMatematica3anoEM } from './matematica-3ano-em'

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRO DE FLASHCARDS POR COMPONENTE
// Para adicionar um novo componente, basta adicionar aqui
// ═══════════════════════════════════════════════════════════════════════════

export const flashcardsPorComponente: Record<Componente, FlashCard[]> = {
  fisica: [...flashcardsFisica1Ano, ...flashcardsFisica2Ano, ...flashcardsFisica3Ano],
  matematica: [
    // Ensino Fundamental
    ...flashcardsMatematica6Ano,
    ...flashcardsMatematica7Ano,
    ...flashcardsMatematica8Ano,
    ...flashcardsMatematica9Ano,
    // Ensino Médio
    ...flashcardsMatematica1Ano,
    ...flashcardsMatematica2anoEM,
    ...flashcardsMatematica3anoEM,
  ],
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL DE BUSCA
// ═══════════════════════════════════════════════════════════════════════════

export function buscarFlashCards(filtros: FiltrosFlashCard): FlashCard[] {
  const { componente, ano, tema, tipo, dificuldade, limite, excluirIds } = filtros

  let questoes = flashcardsPorComponente[componente] || []

  // Filtrar por ano
  if (ano) {
    questoes = questoes.filter((q) => q.ano === ano)
  }

  // Filtrar por tema
  if (tema) {
    questoes = questoes.filter((q) => q.tema.toLowerCase() === tema.toLowerCase())
  }

  // Filtrar por tipo
  if (tipo) {
    questoes = questoes.filter((q) => q.tipo === tipo)
  }

  // Filtrar por dificuldade
  if (dificuldade) {
    questoes = questoes.filter((q) => q.dificuldade === dificuldade)
  }

  // Excluir questões já respondidas
  if (excluirIds && excluirIds.length > 0) {
    questoes = questoes.filter((q) => !excluirIds.includes(q.id))
  }

  // Embaralhar questões
  questoes = embaralharArray([...questoes])

  // Aplicar limite
  if (limite && limite > 0) {
    questoes = questoes.slice(0, limite)
  }

  return questoes
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Embaralha um array usando Fisher-Yates
 */
function embaralharArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/**
 * Obtém os temas disponíveis para um componente
 */
export function obterTemasDisponiveis(componente: Componente, ano?: AnoEscolar): TemaFlashCard[] {
  let questoes = flashcardsPorComponente[componente] || []

  if (ano) {
    questoes = questoes.filter((q) => q.ano === ano)
  }

  // Agrupar por tema
  const temasMap = new Map<string, { count: number; anos: Set<AnoEscolar> }>()

  questoes.forEach((q) => {
    const existing = temasMap.get(q.tema)
    if (existing) {
      existing.count++
      existing.anos.add(q.ano)
    } else {
      temasMap.set(q.tema, { count: 1, anos: new Set([q.ano]) })
    }
  })

  // Converter para array de TemaFlashCard
  const temas: TemaFlashCard[] = []
  temasMap.forEach((data, tema) => {
    temas.push({
      id: tema.toLowerCase().replace(/\s+/g, '-'),
      nome: tema,
      descricao: `Questões de ${tema}`,
      icone: obterIconeTema(tema),
      cor: obterCorTema(componente),
      totalQuestoes: data.count,
      componente,
      anos: Array.from(data.anos),
    })
  })

  return temas.sort((a, b) => a.nome.localeCompare(b.nome))
}

/**
 * Obtém estatísticas de um componente
 */
export function obterEstatisticasComponente(componente: Componente) {
  const questoes = flashcardsPorComponente[componente] || []

  const porAno = {
    // Ensino Fundamental
    '6ano': questoes.filter((q) => q.ano === '6ano').length,
    '7ano': questoes.filter((q) => q.ano === '7ano').length,
    '8ano': questoes.filter((q) => q.ano === '8ano').length,
    '9ano': questoes.filter((q) => q.ano === '9ano').length,
    // Ensino Médio
    '1ano': questoes.filter((q) => q.ano === '1ano').length,
    '2ano': questoes.filter((q) => q.ano === '2ano').length,
    '3ano': questoes.filter((q) => q.ano === '3ano').length,
  }

  const porTipo = {
    quiz: questoes.filter((q) => q.tipo === 'quiz').length,
    complete: questoes.filter((q) => q.tipo === 'complete').length,
    vf: questoes.filter((q) => q.tipo === 'vf').length,
  }

  const porDificuldade = {
    facil: questoes.filter((q) => q.dificuldade === 'facil').length,
    medio: questoes.filter((q) => q.dificuldade === 'medio').length,
    dificil: questoes.filter((q) => q.dificuldade === 'dificil').length,
  }

  return {
    total: questoes.length,
    porAno,
    porTipo,
    porDificuldade,
    temas: obterTemasDisponiveis(componente),
  }
}

/**
 * Obtém ícone baseado no tema
 */
function obterIconeTema(tema: string): string {
  const icones: Record<string, string> = {
    // Física
    Cinemática: '🚀',
    Dinâmica: '⚡',
    Energia: '🔋',
    Termologia: '🌡️',
    Óptica: '💡',
    Ondulatória: '🌊',
    Eletricidade: '⚡',
    Magnetismo: '🧲',
    'Física Moderna': '⚛️',
    // Matemática - Ensino Fundamental
    'Números Naturais': '🔢',
    'Frações': '🍕',
    'Números Decimais': '📊',
    'Geometria Básica': '📐',
    'Medidas': '📏',
    'Estatística Básica': '📉',
    'Proporcionalidade': '⚖️',
    'Números Inteiros': '➕',
    'Números Racionais': '🔢',
    'Equações 1º Grau': '🎯',
    'Expressões Algébricas': '📝',
    'Porcentagem': '💯',
    'Potenciação e Radiciação': '💪',
    'Notação Científica': '🔬',
    'Fatoração': '🧩',
    'Sistemas de Equações': '🔗',
    'Triângulos': '📐',
    'Teorema de Pitágoras': '📐',
    'Volume': '📦',
    'Números Reais': '∞',
    'Equações 2º Grau': '📈',
    // Matemática - Ensino Médio
    'Conjuntos': '⭕',
    'Funções': '📈',
    'Função Afim': '📊',
    'Função Quadrática': '📉',
    'Função Exponencial': '🚀',
    'Logaritmos': '🔢',
    'Progressões': '🔄',
    'Matemática Financeira': '💰',
    'Trigonometria': '📐',
    'Matrizes': '🔲',
    'Determinantes': '🔳',
    'Sistemas Lineares': '🔗',
    'Geometria Analítica': '📍',
    'Geometria Espacial': '🎲',
    'Números Complexos': '💫',
    'Análise Combinatória': '🎰',
    'Probabilidade': '🎲',
    'Estatística': '📊',
    'Polinômios': '📈',
  }
  return icones[tema] || '📚'
}

/**
 * Obtém cor baseada no componente
 */
function obterCorTema(componente: Componente): string {
  const cores: Record<Componente, string> = {
    fisica: 'var(--color-fisica)',
    matematica: 'var(--color-matematica)',
  }
  return cores[componente] || 'var(--color-accent)'
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAÇÕES
// ═══════════════════════════════════════════════════════════════════════════

// Física
export { flashcardsFisica1Ano, flashcardsFisica2Ano, flashcardsFisica3Ano }

// Matemática - Ensino Fundamental
export {
  flashcardsMatematica6Ano,
  flashcardsMatematica7Ano,
  flashcardsMatematica8Ano,
  flashcardsMatematica9Ano,
}

// Matemática - Ensino Médio
export {
  flashcardsMatematica1Ano,
  flashcardsMatematica2anoEM,
  flashcardsMatematica3anoEM,
}

// Contagem total para verificação
export const TOTAL_FLASHCARDS = {
  fisica: flashcardsPorComponente.fisica.length,
  matematica: flashcardsPorComponente.matematica.length,
  total:
    flashcardsPorComponente.fisica.length + flashcardsPorComponente.matematica.length,
}
