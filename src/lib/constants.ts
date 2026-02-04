// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES CENTRALIZADAS
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// TABELAS DO BANCO DE DADOS
// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANTE: Atualizar TABELA_NOTAS_ANO no início de cada ano letivo
// TODO: Migrar para tabela única 'notas' sem ano no nome para evitar manutenção manual

/**
 * Nome da tabela de notas para o ano letivo atual.
 * ATENÇÃO: Atualizar esta constante em dezembro/janeiro de cada ano!
 *
 * Histórico:
 * - 2025: notas_2025
 * - 2026: notas_2025 (usando mesma tabela com coluna ano_letivo)
 */
export const TABELA_NOTAS = 'notas_2025' as const

/**
 * Obtém o ano letivo atual baseado no mês.
 * Janeiro é considerado do ano anterior (férias).
 */
export function obterAnoLetivoAtual(): number {
  const agora = new Date()
  const mes = agora.getMonth() + 1
  // Se for janeiro, pode ser do ano anterior (férias)
  if (mes === 1) return agora.getFullYear() - 1
  return agora.getFullYear()
}

/**
 * Obtém o bimestre atual baseado no mês.
 */
export function obterBimestreAtual(): number {
  const mes = new Date().getMonth() + 1
  if (mes <= 4) return 1
  if (mes <= 7) return 2
  if (mes <= 9) return 3
  return 4
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÕES DO SISTEMA
// ─────────────────────────────────────────────────────────────────────────────

export const SENHA_PADRAO_ESTUDANTE = '@estudante'

export const LIMITES = {
  ARQUIVO_UPLOAD_MB: 5,
  ARQUIVO_MAPA_MENTAL_MB: 25,
  TAMANHO_MAXIMO_NOME: 100,
  TAMANHO_MAXIMO_EMAIL: 100,
} as const
