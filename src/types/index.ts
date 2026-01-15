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
  LIMITE_IA_DIARIO: 15, // 15 interações por dia
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
// TIPOS ENEM - Simulado ENEM
// Sistema separado sem pontuação/gamificação
// ═══════════════════════════════════════════════════════════

// Alternativas ENEM (5 opções vs 4 do sistema normal)
export type AlternativaENEM = 'A' | 'B' | 'C' | 'D' | 'E'

// Áreas do ENEM
export type AreaENEM =
  | 'ciencias-natureza'
  | 'matematica'
  | 'linguagens'
  | 'ciencias-humanas'

// Subáreas (disciplinas específicas)
export type SubareaENEM =
  // Ciências da Natureza
  | 'fisica'
  | 'quimica'
  | 'biologia'
  // Matemática
  | 'matematica'
  // Linguagens
  | 'portugues'
  | 'literatura'
  | 'ingles'
  | 'espanhol'
  | 'artes'
  // Ciências Humanas
  | 'historia'
  | 'geografia'
  | 'filosofia'
  | 'sociologia'

// Questão ENEM
export interface QuestaoENEM {
  id: string
  id_api?: string
  ano_prova: number
  numero_questao: number
  caderno?: string
  area: AreaENEM
  area_nome?: string
  subarea?: SubareaENEM
  idioma?: string
  titulo?: string
  contexto: string
  comando?: string
  imagem_principal?: string
  imagens_extras?: string[]
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  imagem_a?: string
  imagem_b?: string
  imagem_c?: string
  imagem_d?: string
  imagem_e?: string
  resposta_correta: AlternativaENEM
  conteudos?: string[]
  conteudo_principal?: string
  dificuldade?: Dificuldade
  tags?: string[]
  status: StatusQuestao
  fonte?: string  // 'ENEM', 'ENEM-API', etc.
  importado_em?: string
}

// Questão ENEM para exibição (sem resposta correta)
export type QuestaoENEMPublica = Omit<QuestaoENEM, 'resposta_correta'>

// Resposta ENEM
export interface RespostaENEM {
  id: string
  usuario_id: string
  questao_id: string
  resposta_dada: AlternativaENEM
  correta: boolean
  tempo_segundos: number
  ano_prova: number
  area: AreaENEM
  subarea?: SubareaENEM
  conteudo_principal?: string
  modo: 'livre' | 'simulado' | 'revisao'
  sessao_id?: string
  criado_em: string
}

// Conteúdo (para filtragem)
export interface ConteudoENEM {
  id: string
  area: AreaENEM
  subarea: SubareaENEM
  codigo: string
  nome: string
  descricao?: string
  palavras_chave?: string[]
  ordem: number
  ativo: boolean
}

// Filtros para busca de questões ENEM
export interface FiltrosENEM {
  ano_prova?: number
  area?: AreaENEM
  subarea?: SubareaENEM
  conteudo?: string
  conteudos?: string[]
  dificuldade?: Dificuldade
  apenas_nao_respondidas?: boolean
}

// Estatísticas do aluno no ENEM
export interface EstatisticasENEM {
  total_questoes: number
  total_corretas: number
  taxa_acerto: number
  tempo_medio?: number

  por_area?: {
    [key in AreaENEM]?: {
      total: number
      corretas: number
      taxa: number
    }
  }

  por_subarea?: {
    [key in SubareaENEM]?: {
      total: number
      corretas: number
      taxa: number
    }
  }

  por_ano?: {
    [ano: number]: {
      total: number
      corretas: number
      taxa: number
    }
  }
}

// Configurações do ENEM
export const ENEM_CONFIG = {
  ANOS_DISPONIVEIS: [2019, 2020, 2021, 2022, 2023] as const,

  AREAS: {
    'ciencias-natureza': {
      nome: 'Ciências da Natureza',
      cor: '#22c55e', // Verde
      icone: '🔬',
      subareas: ['fisica', 'quimica', 'biologia'] as SubareaENEM[]
    },
    'matematica': {
      nome: 'Matemática',
      cor: '#3b82f6', // Azul
      icone: '📐',
      subareas: ['matematica'] as SubareaENEM[]
    },
    'linguagens': {
      nome: 'Linguagens',
      cor: '#8b5cf6', // Roxo
      icone: '📚',
      subareas: ['portugues', 'literatura', 'ingles', 'espanhol', 'artes'] as SubareaENEM[]
    },
    'ciencias-humanas': {
      nome: 'Ciências Humanas',
      cor: '#f59e0b', // Amarelo
      icone: '🌍',
      subareas: ['historia', 'geografia', 'filosofia', 'sociologia'] as SubareaENEM[]
    }
  } as const,

  SUBAREAS_LABELS: {
    fisica: 'Física',
    quimica: 'Química',
    biologia: 'Biologia',
    matematica: 'Matemática',
    portugues: 'Português',
    literatura: 'Literatura',
    ingles: 'Inglês',
    espanhol: 'Espanhol',
    artes: 'Artes',
    historia: 'História',
    geografia: 'Geografia',
    filosofia: 'Filosofia',
    sociologia: 'Sociologia'
  } as const,

  QUESTOES_POR_AREA: 45,
  TEMPO_PROVA_MINUTOS: 180,

  // Mapeamento Studão -> ENEM
  COMPONENTE_TO_AREA: {
    fisica: 'ciencias-natureza',
    matematica: 'matematica'
  } as Record<Componente, AreaENEM>,

  // Mapeamento ENEM -> Studão (subáreas relevantes)
  SUBAREA_TO_COMPONENTE: {
    fisica: 'fisica',
    matematica: 'matematica'
  } as Record<string, Componente>,

  NIVEL_MINIMO: 'EM' as NivelEnsino
} as const

// ═══════════════════════════════════════════════════════════
// INTERFACE: Mapa Mental
// Sistema de resumos visuais por série e bimestre
// ═══════════════════════════════════════════════════════════

export type SerieEM = 1 | 2 | 3

export interface MapaMental {
  id: string
  componente: Componente
  serie: SerieEM
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

// Labels para exibição
export const SERIES_LABELS: Record<SerieEM, string> = {
  1: '1ª Série',
  2: '2ª Série',
  3: '3ª Série',
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
export interface QuestaoTrilha {
  id: number
  serie: SerieEM_String
  semana: number
  ano_letivo: number
  ordem: number
  tema: string
  subtema: string
  competencias_bncc: string[]
  tipo_questao: TipoQuestaoTrilha
  contexto_cotidiano: ContextoCotidiano
  enunciado: string
  alternativas: {
    A: string
    B: string
    C: string
    D: string
    E: string
  }
  resposta_correta: 'A' | 'B' | 'C' | 'D' | 'E'
  dica: string
  feedback: QuestaoFeedback
  dificuldade: DificuldadeTrilha
  tags: string[]
  is_desafio: boolean
  ativa: boolean
}

export interface QuestaoFeedback {
  explicacao_correta: string
  erros_comuns: {
    A?: string
    B?: string
    C?: string
    D?: string
    E?: string
  }
  conexao_cotidiano: string
  curiosidade: string
}

// Questão retornada pela API (com status de resposta)
export interface QuestaoTrilhaComStatus extends Omit<QuestaoTrilha, 'resposta_correta'> {
  questao_id: number
  ja_respondida: boolean
  resposta_usuario?: 'A' | 'B' | 'C' | 'D' | 'E'
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
  serie: SerieEM_String
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
  serie: SerieEM_String
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
  resposta_dada: 'A' | 'B' | 'C' | 'D' | 'E'
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
  serie: SerieEM_String
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
  resposta_certa: 'A' | 'B' | 'C' | 'D' | 'E'
  resposta_dada: 'A' | 'B' | 'C' | 'D' | 'E'
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
