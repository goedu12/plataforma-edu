/**
 * Tipos para o sistema de FlashCards
 * Estrutura escalável para múltiplos componentes e tipos de questões
 */

import type { Componente } from './index'

// Tipos de questões suportados
export type TipoFlashCard = 'quiz' | 'complete' | 'vf'

// Anos do Ensino Fundamental (Anos Finais)
export type AnoEscolarEF = '6ano' | '7ano' | '8ano' | '9ano'

// Anos do Ensino Médio
export type AnoEscolarEM = '1ano' | '2ano' | '3ano'

// Todos os anos suportados
export type AnoEscolar = AnoEscolarEF | AnoEscolarEM

// Dificuldade da questão
export type DificuldadeFlashCard = 'facil' | 'medio' | 'dificil'

// Estrutura base de uma questão FlashCard
export interface FlashCardBase {
  id: string
  tipo: TipoFlashCard
  componente: Componente
  ano: AnoEscolar
  tema: string
  subtema?: string
  dificuldade: DificuldadeFlashCard
  pergunta: string
  dica?: string
  explicacao?: string
  tags?: string[]
}

// Questão tipo Quiz (múltipla escolha)
export interface FlashCardQuiz extends FlashCardBase {
  tipo: 'quiz'
  opcoes: string[]
  respostaCorreta: number // índice da resposta correta
}

// Questão tipo Complete (preencher lacuna)
export interface FlashCardComplete extends FlashCardBase {
  tipo: 'complete'
  respostaCorreta: string
  respostasAceitas?: string[] // respostas alternativas aceitas
  caseSensitive?: boolean
}

// Questão tipo Verdadeiro/Falso
export interface FlashCardVF extends FlashCardBase {
  tipo: 'vf'
  respostaCorreta: boolean
}

// União de todos os tipos de FlashCard
export type FlashCard = FlashCardQuiz | FlashCardComplete | FlashCardVF

// Configuração de pontuação
export interface PontuacaoFlashCard {
  base: number
  bonusSequencia: number // pontos extras por sequência de acertos
  penalidade: number // pontos perdidos por erro
  penalididadeDica: number // pontos perdidos ao usar dica
  multiplicadorDificuldade: {
    facil: number
    medio: number
    dificil: number
  }
}

// Progresso do usuário em FlashCards
export interface ProgressoFlashCard {
  usuario_id: string
  componente: Componente
  ano: AnoEscolar
  tema: string
  questoes_respondidas: number
  questoes_corretas: number
  pontos_totais: number
  maior_sequencia: number
  tempo_total_segundos: number
  ultima_sessao: string // ISO date
  questoes_ids_respondidas: string[]
}

// Estado da sessão de FlashCards
export interface SessaoFlashCard {
  questaoAtual: number
  questoes: FlashCard[]
  respostas: RespostaFlashCard[]
  pontos: number
  sequenciaAtual: number
  maiorSequencia: number
  tempoInicio: number
  usouDica: boolean
}

// Resposta individual
export interface RespostaFlashCard {
  questao_id: string
  resposta: string | number | boolean
  correta: boolean
  tempo_segundos: number
  usou_dica: boolean
  pontos_ganhos: number
}

// Filtros para buscar questões
export interface FiltrosFlashCard {
  componente: Componente
  ano?: AnoEscolar
  tema?: string
  tipo?: TipoFlashCard
  dificuldade?: DificuldadeFlashCard
  limite?: number
  excluirIds?: string[]
}

// Resposta da API de FlashCards
export interface RespostaAPIFlashCards {
  sucesso: boolean
  questoes?: FlashCard[]
  total?: number
  erro?: string
}

// Resposta da API de progresso
export interface RespostaAPIProgresso {
  sucesso: boolean
  progresso?: ProgressoFlashCard
  pontos_ganhos?: number
  nova_sequencia?: number
  erro?: string
}

// Estatísticas gerais do usuário em FlashCards
export interface EstatisticasFlashCard {
  total_sessoes: number
  total_questoes: number
  total_corretas: number
  taxa_acerto: number
  pontos_totais: number
  maior_sequencia_geral: number
  tempo_total_minutos: number
  temas_dominados: string[]
  temas_para_melhorar: string[]
}

// Configuração de um tema de FlashCards
export interface TemaFlashCard {
  id: string
  nome: string
  descricao: string
  icone: string
  cor: string
  totalQuestoes: number
  componente: Componente
  anos: AnoEscolar[]
}

// Constantes de pontuação padrão
export const PONTUACAO_PADRAO: PontuacaoFlashCard = {
  base: 10,
  bonusSequencia: 5,
  penalidade: 0, // não perde pontos por erro
  penalididadeDica: 5,
  multiplicadorDificuldade: {
    facil: 1,
    medio: 1.5,
    dificil: 2,
  },
}

// Labels para exibição
export const LABELS_ANO: Record<AnoEscolar, string> = {
  // Ensino Fundamental
  '6ano': '6º Ano',
  '7ano': '7º Ano',
  '8ano': '8º Ano',
  '9ano': '9º Ano',
  // Ensino Médio
  '1ano': '1ª Série',
  '2ano': '2ª Série',
  '3ano': '3ª Série',
}

export const LABELS_TIPO: Record<TipoFlashCard, string> = {
  quiz: 'Quiz',
  complete: 'Complete',
  vf: 'Verdadeiro ou Falso',
}

export const LABELS_DIFICULDADE: Record<DificuldadeFlashCard, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
}

export const CORES_DIFICULDADE: Record<DificuldadeFlashCard, string> = {
  facil: 'var(--success)',
  medio: 'var(--warning)',
  dificil: 'var(--error)',
}
