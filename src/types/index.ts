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

// Bimestre (1-4)
export type Bimestre = 1 | 2 | 3 | 4

// ═══════════════════════════════════════════════════════════
// INTERFACE: Usuario
// ═══════════════════════════════════════════════════════════
export interface Usuario {
  id: string
  email: string
  nome: string
  turma: string
  colegio?: string | null  // Colégio/Escola do estudante
  ano: number
  nivel: NivelEnsino
  componentes: Componente[]
  tipo: TipoUsuario
  ativo: boolean
  senha_alterada: boolean
  ultimo_acesso?: string
  criado_em: string
  foto_url?: string | null

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
  bimestre?: Bimestre | null  // null = disponível em todos os bimestres
  tema: string
  subtema?: string
  dificuldade: Dificuldade
  enunciado: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e?: string
  resposta_correta: 'A' | 'B' | 'C' | 'D' | 'E'
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
  resposta_dada: 'A' | 'B' | 'C' | 'D' | 'E'
  correta: boolean
  tempo_segundos: number
  usou_dica: boolean
  pontos_ganhos: number
  criado_em: string
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Conquista
// Sistema de 10 níveis com requisitos combinados
// ═══════════════════════════════════════════════════════════
export type DificuldadeConquista = 'facil' | 'medio' | 'dificil' | 'muito_dificil' | 'lendario'

export interface Conquista {
  id: string
  codigo: string
  nome: string
  descricao: string
  icone: string
  componente?: Componente
  requisito_tipo: 'pontos' | 'questoes' | 'sequencia' | 'acertos' | 'combinado'
  requisito_valor: number
  // Requisitos combinados (para conquistas médias+)
  req_pontos?: number
  req_questoes_corretas?: number
  req_sequencia_dias?: number
  // Metadados
  dificuldade: DificuldadeConquista
  ordem: number
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
  // Totais únicos (sem duplicar alunos com múltiplos componentes)
  total_alunos_unicos?: number
  ativos_unicos?: number
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
  LIMITE_IA_DIARIO: 30, // 30 interações por dia
} as const

// ═══════════════════════════════════════════════════════════
// MODO DESAFIO
// ═══════════════════════════════════════════════════════════
export const DESAFIO = {
  QUESTOES: 5,
  TEMPO_SEGUNDOS: 300, // 5 minutos
  PONTOS_POR_ACERTO: 15,
  BONUS_PERFEITO: 25, // 5/5 corretas
  BONUS_TEMPO: 10, // se completar antes de 3 min
} as const

// ═══════════════════════════════════════════════════════════
// SISTEMA DE NOTAS BIMESTRAIS
// ═══════════════════════════════════════════════════════════
export const NOTAS = {
  META_QUESTOES_BIMESTRE: 100, // Meta para nota máxima de participação
  META_DIAS_BIMESTRE: 25, // Meta para nota máxima de frequência
  PESO_DESEMPENHO: 0.5, // 50%
  PESO_PARTICIPACAO: 0.3, // 30%
  PESO_FREQUENCIA: 0.2, // 20%
  NOTA_MINIMA_DESEMPENHO: 4.0, // Abaixo disso, nota máxima = 5.9
  NOTA_MINIMA_PARTICIPACAO: 3.0, // Abaixo disso, nota máxima = 5.9
  NOTA_MAXIMA_BLOQUEIO: 5.9,
} as const

// ═══════════════════════════════════════════════════════════
// BIMESTRES
// ═══════════════════════════════════════════════════════════
export const BIMESTRES = {
  1: { inicio: { mes: 2, dia: 1 }, fim: { mes: 4, dia: 30 } },  // Fev-Abr
  2: { inicio: { mes: 5, dia: 1 }, fim: { mes: 7, dia: 31 } },  // Mai-Jul
  3: { inicio: { mes: 8, dia: 1 }, fim: { mes: 10, dia: 31 } }, // Ago-Out
  4: { inicio: { mes: 11, dia: 1 }, fim: { mes: 12, dia: 31 } }, // Nov-Dez
} as const

// Tipo para modo de resposta
export type ModoResposta = 'estudo' | 'revisao' | 'desafio'

// ═══════════════════════════════════════════════════════════
// INTERFACE: Desafio
// ═══════════════════════════════════════════════════════════
export interface Desafio {
  id: string
  usuario_id: string
  componente: Componente
  questoes_total: number
  acertos: number
  tempo_total_segundos: number
  pontos_ganhos: number
  bonus_perfeito: boolean
  questoes_ids: string[]
  respostas_dadas: string[]
  status: 'em_andamento' | 'completo' | 'timeout' | 'abandonado'
  iniciado_em: string
  finalizado_em?: string
  data_desafio: string
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: DiaAtivo
// ═══════════════════════════════════════════════════════════
export interface DiaAtivo {
  id: string
  usuario_id: string
  componente: Componente
  data: string
  questoes: number
  acertos: number
  pontos: number
  tempo_total_segundos: number
  usou_tutor: boolean
  fez_desafio: boolean
  fez_revisao: boolean
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: NotaBimestral
// ═══════════════════════════════════════════════════════════
export interface NotaBimestral {
  id: string
  usuario_id: string
  componente: Componente
  ano: number
  bimestre: 1 | 2 | 3 | 4
  questoes_total: number
  questoes_corretas: number
  dias_ativos: number
  nota_desempenho: number
  nota_participacao: number
  nota_frequencia: number
  nota_calculada: number
  nota_final: number
  bloqueio?: 'desempenho_baixo' | 'participacao_baixa'
  status: 'em_andamento' | 'fechado'
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: QuestaoRevisao
// ═══════════════════════════════════════════════════════════
export interface QuestaoRevisao {
  questao_id: string
  componente: Componente
  tema: string
  dificuldade: Dificuldade
  errou_em: string
  questao?: Questao
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: TemaDificil (para relatório professor)
// ═══════════════════════════════════════════════════════════
export interface TemaDificil {
  componente: Componente
  tema: string
  ano: number
  total_respostas: number
  acertos: number
  taxa_acerto: number
}

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

// ═══════════════════════════════════════════════════════════
// INTERFACE: Mapa Mental
// Sistema de resumos visuais por série e bimestre
// ═══════════════════════════════════════════════════════════

// Séries do Ensino Médio
export type SerieEM = 1 | 2 | 3

// Séries do Ensino Fundamental (Anos Finais)
export type SerieEF = 6 | 7 | 8 | 9

// Todas as séries suportadas para Mapas Mentais
export type SerieMapa = SerieEM | SerieEF

export interface MapaMental {
  id: string
  componente: Componente
  serie: SerieMapa
  bimestre: Bimestre
  titulo: string
  descricao?: string
  tema?: string
  imagem_url: string
  thumbnail_url?: string
  curtidas: number
  downloads: number
  visualizacoes: number
  ativo: boolean
  destaque: boolean
  criado_em: string
  atualizado_em: string
}

export interface MapaMentalComStatus extends MapaMental {
  curtido: boolean  // Se o usuário atual curtiu
}

export interface MapaCurtida {
  id: string
  mapa_id: string
  usuario_id: string
  criado_em: string
}

// Labels para exibição - Ensino Médio
export const SERIES_LABELS: Record<SerieEM, string> = {
  1: '1ª Série',
  2: '2ª Série',
  3: '3ª Série',
}

// Labels para exibição - Ensino Fundamental
export const SERIES_EF_NUMERICO_LABELS: Record<SerieEF, string> = {
  6: '6º Ano',
  7: '7º Ano',
  8: '8º Ano',
  9: '9º Ano',
}

// Labels unificados para todos os mapas
export const SERIES_MAPA_LABELS: Record<SerieMapa, string> = {
  1: '1ª Série',
  2: '2ª Série',
  3: '3ª Série',
  6: '6º Ano',
  7: '7º Ano',
  8: '8º Ano',
  9: '9º Ano',
}

export const BIMESTRES_LABELS: Record<Bimestre, string> = {
  1: '1º Bimestre',
  2: '2º Bimestre',
  3: '3º Bimestre',
  4: '4º Bimestre',
}

// ═══════════════════════════════════════════════════════════
// SISTEMA DE TRILHAS DE APRENDIZADO
// PONTO DE RESTAURAÇÃO: tag v1.0-pre-trilhas
// ═══════════════════════════════════════════════════════════

// Identificadores das trilhas
export type TrilhaId = 'passar_ano' | 'enem' | 'recuperacao' | 'desafio' | 'curiosidade' | 'pressa'

// Série do Ensino Médio (formato string)
export type SerieEM_String = '1EM' | '2EM' | '3EM'

// Série do Ensino Fundamental (formato string)
export type SerieEF_String = '6EF' | '7EF' | '8EF' | '9EF'

// Todas as séries suportadas
export type SerieTrilha = SerieEM_String | SerieEF_String

// Alternativas por nível
export type AlternativaEM = 'A' | 'B' | 'C' | 'D' | 'E'  // 5 alternativas para EM
export type AlternativaEF = 'A' | 'B' | 'C' | 'D'         // 4 alternativas para EF
export type AlternativaTrilha = AlternativaEM | AlternativaEF

// Tipos de questão
export type TipoQuestaoTrilha =
  | 'conceitual'
  | 'calculo_direto'
  | 'interpretacao_grafico'
  | 'situacao_problema'
  | 'analise_fenomeno'
  | 'comparacao'
  | 'olimpiada'

// Contextos do cotidiano
export type ContextoCotidiano =
  | 'transporte'
  | 'casa_familia'
  | 'escola'
  | 'rua_bairro'
  | 'corpo_saude'
  | 'lazer_tecnologia'
  | 'trabalho_profissoes'
  | 'todos'

// Dificuldade extendida (inclui olimpíada)
export type DificuldadeTrilha = 'facil' | 'medio' | 'dificil' | 'olimpiada'

// Status do progresso semanal
export type StatusSemana = 'bloqueada' | 'disponivel' | 'em_progresso' | 'concluida'

// ═══════════════════════════════════════════════════════════
// INTERFACE: Trilha
// ═══════════════════════════════════════════════════════════
export interface Trilha {
  id: TrilhaId
  nome: string
  icone: string
  cor: string
  descricao: string
  descricao_curta?: string
  config: TrilhaConfig
  ordem: number
  ativa: boolean
}

export interface TrilhaConfig {
  questoes_semana: number | null
  dificuldade: Record<DificuldadeTrilha, number>
  tipos: string[]
  acerto_avancar?: number
  segue_calendario?: boolean
  usa_banco_enem?: boolean
  simulados_mensais?: boolean
  diagnostico_obrigatorio?: boolean
  ranking?: boolean
  competicoes?: boolean
  sem_pressao?: boolean
  temporario?: boolean
  [key: string]: any  // Permite configs adicionais
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Questão da Trilha
// ═══════════════════════════════════════════════════════════
// Alternativas para 5 opções (Ensino Médio)
export interface AlternativasEM {
  A: string
  B: string
  C: string
  D: string
  E: string
}

// Alternativas para 4 opções (Ensino Fundamental)
export interface AlternativasEF {
  A: string
  B: string
  C: string
  D: string
}

export interface QuestaoTrilha {
  id: number
  serie: SerieTrilha
  semana: number
  ano_letivo: number
  ordem: number
  tema: string
  subtema: string
  competencias_bncc: string[]
  tipo_questao: TipoQuestaoTrilha
  contexto_cotidiano: ContextoCotidiano
  enunciado: string
  alternativas: AlternativasEM | AlternativasEF
  resposta_correta: AlternativaTrilha
  dica: string
  feedback: QuestaoFeedback
  dificuldade: DificuldadeTrilha
  tags: string[]
  is_desafio: boolean
  ativa: boolean
  // Novos campos para EF
  componente?: Componente
  nivel_ensino?: NivelEnsino
  num_alternativas?: 4 | 5
}

export interface QuestaoFeedback {
  explicacao_correta: string
  erros_comuns: {
    A?: string
    B?: string
    C?: string
    D?: string
    E?: string  // Opcional para EF (apenas A-D)
  }
  conexao_cotidiano: string
  curiosidade: string
}

// Questão retornada pela API (com status de resposta)
export interface QuestaoTrilhaComStatus extends Omit<QuestaoTrilha, 'resposta_correta'> {
  questao_id: number
  ja_respondida: boolean
  resposta_usuario?: AlternativaTrilha
  acertou?: boolean
  tempo_resposta?: number
  usou_dica?: boolean
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Usuário na Trilha
// ═══════════════════════════════════════════════════════════
export interface UsuarioTrilha {
  id: number
  usuario_id: string
  trilha_id: TrilhaId
  serie: SerieTrilha
  componente?: Componente
  ativa: boolean
  iniciada_em: string
  pausada_em?: string
  concluida_em?: string
  semana_atual: number
  questoes_total: number
  questoes_corretas: number
  pontos_trilha: number
  sequencia_dias: number
  melhor_sequencia: number
  ultimo_acesso: string
  diagnostico_feito: boolean
  diagnostico_resultado?: any
  lacunas_identificadas?: string[]
  data_prova?: string
  temas_prova?: string[]
  config_personalizada?: Partial<TrilhaConfig>
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Progresso Semanal
// ═══════════════════════════════════════════════════════════
export interface ProgressoSemanal {
  id: number
  usuario_id: string
  trilha_id: TrilhaId
  serie: SerieTrilha
  componente?: Componente
  semana: number
  ano_letivo: number
  questoes_total: number
  questoes_respondidas: number
  questoes_corretas: number
  desafio_disponivel: boolean
  desafio_respondido: boolean
  desafio_acertou: boolean
  status: StatusSemana
  tempo_total_segundos: number
  pontos_semana: number
  bonus_100_porcento: boolean
  desbloqueada_em?: string
  iniciada_em?: string
  concluida_em?: string
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Resposta na Trilha
// ═══════════════════════════════════════════════════════════
export interface RespostaTrilha {
  id: number
  usuario_id: string
  questao_id: number
  trilha_id: TrilhaId
  resposta_dada: AlternativaTrilha
  correta: boolean
  tempo_segundos: number
  usou_dica: boolean
  tentativa: number
  pontos_ganhos: number
  created_at: string
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Progresso do Usuário (retorno da API)
// ═══════════════════════════════════════════════════════════
export interface ProgressoTrilhaUsuario {
  trilha_id: TrilhaId
  trilha_nome: string
  trilha_icone: string
  trilha_cor: string
  serie: SerieTrilha
  componente?: Componente
  semana_atual: number
  questoes_total: number
  questoes_corretas: number
  percentual_acerto: number
  pontos: number
  sequencia_dias: number
  status_semana: StatusSemana
  iniciada_em: string
  ultimo_acesso: string
}

// ═══════════════════════════════════════════════════════════
// INTERFACE: Resultado de Resposta (retorno da API)
// ═══════════════════════════════════════════════════════════
export interface ResultadoResposta {
  sucesso: boolean
  correta: boolean
  resposta_certa: AlternativaTrilha
  resposta_dada: AlternativaTrilha
  pontos: number
  feedback: QuestaoFeedback
  progresso: {
    corretas_semana: number
    total_semana: number
    percentual: number
  }
  pode_avancar: boolean
  proxima_semana?: number
  mensagem: string
}

// ═══════════════════════════════════════════════════════════
// CONSTANTES: Labels das Trilhas
// ═══════════════════════════════════════════════════════════
export const TRILHAS_INFO: Record<TrilhaId, { nome: string; icone: string; cor: string; descricao_curta: string }> = {
  passar_ano: {
    nome: 'Passar de Ano',
    icone: '🎓',
    cor: '#4CAF50',
    descricao_curta: 'Acompanhe a escola'
  },
  enem: {
    nome: 'ENEM/Vestibular',
    icone: '🏆',
    cor: '#2196F3',
    descricao_curta: 'Conquistar a vaga'
  },
  recuperacao: {
    nome: 'Recuperação',
    icone: '🔧',
    cor: '#FF9800',
    descricao_curta: 'Voltar do básico'
  },
  desafio: {
    nome: 'Desafio Total',
    icone: '🚀',
    cor: '#9C27B0',
    descricao_curta: 'Ir além da escola'
  },
  curiosidade: {
    nome: 'Curiosidade',
    icone: '🔬',
    cor: '#00BCD4',
    descricao_curta: 'Entender o mundo'
  },
  pressa: {
    nome: 'Pressa',
    icone: '⚡',
    cor: '#F44336',
    descricao_curta: 'Prova chegando!'
  }
}

export const SERIES_EM_LABELS: Record<SerieEM_String, string> = {
  '1EM': '1º Ano',
  '2EM': '2º Ano',
  '3EM': '3º Ano'
}

export const TIPOS_QUESTAO_LABELS: Record<TipoQuestaoTrilha, string> = {
  conceitual: 'Conceitual',
  calculo_direto: 'Cálculo Direto',
  interpretacao_grafico: 'Interpretação de Gráfico',
  situacao_problema: 'Situação-Problema',
  analise_fenomeno: 'Análise de Fenômeno',
  comparacao: 'Comparação',
  olimpiada: 'Nível Olimpíada'
}

export const CONTEXTOS_LABELS: Record<ContextoCotidiano, string> = {
  transporte: 'Transporte',
  casa_familia: 'Casa e Família',
  escola: 'Escola',
  rua_bairro: 'Rua e Bairro',
  corpo_saude: 'Corpo e Saúde',
  lazer_tecnologia: 'Lazer e Tecnologia',
  trabalho_profissoes: 'Trabalho e Profissões',
  todos: 'Diversos'
}

// ═══════════════════════════════════════════════════════════
// SÉRIES DO ENSINO FUNDAMENTAL - Labels e Helpers
// ═══════════════════════════════════════════════════════════

export const SERIES_EF_LABELS: Record<SerieEF_String, string> = {
  '6EF': '6º Ano',
  '7EF': '7º Ano',
  '8EF': '8º Ano',
  '9EF': '9º Ano'
}

// Labels unificados para todas as séries
export const SERIES_TRILHA_LABELS: Record<SerieTrilha, string> = {
  ...SERIES_EF_LABELS,
  ...SERIES_EM_LABELS
}

// ═══════════════════════════════════════════════════════════
// HELPERS: Detecção de nível de ensino
// ═══════════════════════════════════════════════════════════

/**
 * Verifica se a série é do Ensino Fundamental
 */
export function isSerieEF(serie: SerieTrilha): serie is SerieEF_String {
  return ['6EF', '7EF', '8EF', '9EF'].includes(serie)
}

/**
 * Verifica se a série é do Ensino Médio
 */
export function isSerieEM(serie: SerieTrilha): serie is SerieEM_String {
  return ['1EM', '2EM', '3EM'].includes(serie)
}

/**
 * Retorna o número de alternativas baseado na série
 * EF: 4 alternativas (A, B, C, D)
 * EM: 5 alternativas (A, B, C, D, E)
 */
export function getNumAlternativas(serie: SerieTrilha): 4 | 5 {
  return isSerieEF(serie) ? 4 : 5
}

/**
 * Retorna o nível de ensino baseado na série
 */
export function getNivelEnsinoPorSerie(serie: SerieTrilha): NivelEnsino {
  return isSerieEF(serie) ? 'EF' : 'EM'
}

/**
 * Retorna as alternativas válidas para uma série
 */
export function getAlternativasValidas(serie: SerieTrilha): AlternativaTrilha[] {
  return isSerieEF(serie) ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E']
}

/**
 * Valida se uma resposta é válida para uma série
 */
export function isRespostaValida(resposta: string, serie: SerieTrilha): resposta is AlternativaTrilha {
  const validas = getAlternativasValidas(serie)
  return validas.includes(resposta as AlternativaTrilha)
}

/**
 * Converte número da turma para série de trilha
 * Ex: '6A' -> '6EF', '1A' -> '1EM'
 */
export function turmaParaSerieTrilha(turma: string): SerieTrilha | null {
  const match = turma.match(/^(\d+)/)
  if (!match) return null

  const ano = parseInt(match[1])

  if (ano >= 6 && ano <= 9) {
    return `${ano}EF` as SerieEF_String
  } else if (ano >= 1 && ano <= 3) {
    return `${ano}EM` as SerieEM_String
  }

  return null
}
