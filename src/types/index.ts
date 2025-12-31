// ═══════════════════════════════════════════════════════════
// TIPOS DA PLATAFORMA EDUCACIONAL
// ═══════════════════════════════════════════════════════════

// Níveis de Ensino
export type NivelEnsino = 'EF' | 'EM'

// Componentes Curriculares
export type Componente = 'fisica' | 'matematica'

// Tipo de Usuário
export type TipoUsuario = 'estudante' | 'professor'

// Status de Questão
export type StatusQuestao = 'ativa' | 'inativa'

// Dificuldade de Questão
export type Dificuldade = 'facil' | 'medio' | 'dificil'

// ═══════════════════════════════════════════════════════════
// INTERFACE: Usuario
// ═══════════════════════════════════════════════════════════
export interface Usuario {
  id: string
  email: string
  nome: string
  turma: string
  ano: number
  nivel: NivelEnsino
  componentes: Componente[]
  tipo: TipoUsuario
  ativo: boolean
  senha_alterada: boolean
  ultimo_acesso?: string
  criado_em: string

  // Progresso Física
  fis_pontos: number
  fis_questoes_total: number
  fis_questoes_corretas: number
  fis_sequencia_dias: number
  fis_nivel: string
  fis_uso_ia_hoje: number
  fis_data_uso_ia?: string
  fis_ultimo_estudo?: string

  // Progresso Matemática
  mat_pontos: number
  mat_questoes_total: number
  mat_questoes_corretas: number
  mat_sequencia_dias: number
  mat_nivel: string
  mat_uso_ia_hoje: number
  mat_data_uso_ia?: string
  mat_ultimo_estudo?: string
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Questao
// ═══════════════════════════════════════════════════════════
export interface Questao {
  id: string
  componente: Componente
  ano: number
  tema: string
  subtema?: string
  dificuldade: Dificuldade
  enunciado: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  resposta_correta: 'A' | 'B' | 'C' | 'D'
  explicacao: string
  dica?: string
  status: StatusQuestao
  criado_em: string
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Resposta
// ═══════════════════════════════════════════════════════════
export interface Resposta {
  id: string
  usuario_id: string
  questao_id: string
  componente: Componente
  resposta_dada: 'A' | 'B' | 'C' | 'D'
  correta: boolean
  tempo_segundos: number
  usou_dica: boolean
  pontos_ganhos: number
  criado_em: string
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Conquista
// ═══════════════════════════════════════════════════════════
export interface Conquista {
  id: string
  codigo: string
  nome: string
  descricao: string
  icone: string
  componente?: Componente
  requisito_tipo: 'pontos' | 'questoes' | 'sequencia' | 'acertos'
  requisito_valor: number
}

export interface ConquistaUsuario {
  id: string
  usuario_id: string
  conquista_id: string
  componente: Componente
  desbloqueada_em: string
  conquista?: Conquista
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: ChatTutor
// ═══════════════════════════════════════════════════════════
export interface MensagemChat {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatTutor {
  componente: Componente
  mensagens: MensagemChat[]
  uso_hoje: number
  limite_diario: number
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Ranking
// ═══════════════════════════════════════════════════════════
export interface RankingItem {
  posicao: number
  usuario_id: string
  nome: string
  turma: string
  pontos: number
  nivel: string
  questoes_total: number
  taxa_acerto: number
  eh_usuario_atual: boolean
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Estatísticas Professor
// ═══════════════════════════════════════════════════════════
export interface EstatisticasComponente {
  total_estudantes: number
  total_respostas: number
  taxa_acerto: number
  ativos_semana: number
  media_pontos: number
}

export interface EstatisticasProfessor {
  fisica: EstatisticasComponente
  matematica: EstatisticasComponente
  alertas: AlertaEstudante[]
  desempenho_turmas: DesempenhoTurma[]
}

export interface AlertaEstudante {
  usuario_id: string
  nome: string
  turma: string
  componente: Componente
  tipo: 'inativo' | 'baixo_desempenho' | 'poucas_questoes'
  descricao: string
}

export interface DesempenhoTurma {
  turma: string
  componente: Componente
  media_acerto: number
  total_estudantes: number
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Importação
// ═══════════════════════════════════════════════════════════
export interface EstudanteImportacao {
  nome: string
  turma: string
  componente: string
  status: 'novo' | 'atualizar' | 'erro'
  erro?: string
}

export interface ResultadoImportacao {
  sucesso: boolean
  total: number
  novos: number
  atualizados: number
  erros: number
  detalhes: EstudanteImportacao[]
}

// ═══════════════════════════════════════════════════════════
// NÍVEIS DO JOGADOR
// ═══════════════════════════════════════════════════════════
export const NIVEIS_JOGADOR = [
  { nome: 'Iniciante', pontos_min: 0, pontos_max: 99, emoji: '🌱' },
  { nome: 'Curioso', pontos_min: 100, pontos_max: 299, emoji: '🔍' },
  { nome: 'Aprendiz', pontos_min: 300, pontos_max: 599, emoji: '📚' },
  { nome: 'Estudioso', pontos_min: 600, pontos_max: 999, emoji: '✏️' },
  { nome: 'Dedicado', pontos_min: 1000, pontos_max: 1499, emoji: '💪' },
  { nome: 'Avançado', pontos_min: 1500, pontos_max: 2499, emoji: '🚀' },
  { nome: 'Expert', pontos_min: 2500, pontos_max: 3999, emoji: '⭐' },
  { nome: 'Mestre', pontos_min: 4000, pontos_max: 5999, emoji: '👑' },
  { nome: 'Gênio', pontos_min: 6000, pontos_max: Infinity, emoji: '🧠' },
] as const

// ═══════════════════════════════════════════════════════════
// SISTEMA DE PONTUAÇÃO
// ═══════════════════════════════════════════════════════════
export const PONTUACAO = {
  RESPOSTA_CORRETA: 10,
  RESPOSTA_COM_DICA: 5,
  RESPOSTA_INCORRETA: 0,
  BONUS_VELOCIDADE: 2, // < 30 segundos
  BONUS_SEQUENCIA_7_DIAS: 50,
  LIMITE_IA_DIARIO: 5,
} as const

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
export function obterNivelPorPontos(pontos: number): typeof NIVEIS_JOGADOR[number] {
  return NIVEIS_JOGADOR.find(
    nivel => pontos >= nivel.pontos_min && pontos <= nivel.pontos_max
  ) || NIVEIS_JOGADOR[0]
}

export function calcularTaxaAcerto(corretas: number, total: number): number {
  if (total === 0) return 0
  return Math.round((corretas / total) * 100)
}

export function formatarEmail(nome: string, turma: string): string {
  return `${normalizarTexto(nome)}@${turma.toLowerCase()}`
}

export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
}

export function extrairAnoTurma(turma: string): { ano: number; nivel: NivelEnsino } {
  const anoStr = turma.replace(/[^0-9]/g, '')
  const ano = parseInt(anoStr)

  if (ano >= 1 && ano <= 3) {
    return { ano, nivel: 'EM' }
  } else if (ano >= 6 && ano <= 9) {
    return { ano, nivel: 'EF' }
  }

  throw new Error('Turma inválida')
}
