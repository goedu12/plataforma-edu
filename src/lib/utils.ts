import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ═══════════════════════════════════════════════════════════
// UTILITÁRIO PARA CLASSES CSS
// ═══════════════════════════════════════════════════════════
export function cn(...inputs: ClassValue[]) {
  // Fallback simples se clsx/twMerge não estiverem disponíveis
  return inputs.filter(Boolean).join(' ')
}

// ═══════════════════════════════════════════════════════════
// FORMATADORES
// ═══════════════════════════════════════════════════════════
export function formatarData(data: string | Date): string {
  const d = new Date(data)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatarDataHora(data: string | Date): string {
  const d = new Date(data)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatarTempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60)
  const segs = segundos % 60
  return `${minutos}:${segs.toString().padStart(2, '0')}`
}

export function formatarPontos(pontos: number): string {
  return pontos.toLocaleString('pt-BR')
}

export function formatarPorcentagem(valor: number): string {
  return `${Math.round(valor)}%`
}

// ═══════════════════════════════════════════════════════════
// NORMALIZAÇÃO DE TEXTO
// ═══════════════════════════════════════════════════════════
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
}

export function capitalizarNome(nome: string): string {
  const preposicoes = ['da', 'de', 'do', 'das', 'dos', 'e']
  return nome
    .toLowerCase()
    .split(' ')
    .map((palavra, index) => {
      if (index > 0 && preposicoes.includes(palavra)) {
        return palavra
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1)
    })
    .join(' ')
}

// ═══════════════════════════════════════════════════════════
// GERAÇÃO DE EMAIL
// ═══════════════════════════════════════════════════════════
export function gerarEmailEstudante(nome: string, turma: string): string {
  const nomeNormalizado = normalizarTexto(nome)
  const turmaNormalizada = turma.toLowerCase()
  return `${nomeNormalizado}@${turmaNormalizada}`
}

// ═══════════════════════════════════════════════════════════
// VALIDAÇÕES
// ═══════════════════════════════════════════════════════════
export function validarEmail(email: string): boolean {
  // Formato: nome@turma (ex: joaosilva@1a)
  const regex = /^[a-z0-9]+@[0-9]+[a-z]$/
  return regex.test(email.toLowerCase())
}

export function validarSenha(senha: string): { valida: boolean; erro?: string } {
  if (senha.length < 6) {
    return { valida: false, erro: 'Senha deve ter no mínimo 6 caracteres' }
  }
  return { valida: true }
}

// ═══════════════════════════════════════════════════════════
// CORES POR COMPONENTE
// ═══════════════════════════════════════════════════════════
export function obterCoresComponente(componente: 'fisica' | 'matematica') {
  if (componente === 'fisica') {
    return {
      primary: 'bg-fisica-500',
      primaryHover: 'hover:bg-fisica-600',
      primaryLight: 'bg-fisica-50',
      primaryBorder: 'border-fisica-500',
      text: 'text-fisica-700',
      textLight: 'text-fisica-500',
      ring: 'ring-fisica-500',
      gradient: 'from-fisica-500 to-fisica-600',
    }
  }
  return {
    primary: 'bg-matematica-500',
    primaryHover: 'hover:bg-matematica-600',
    primaryLight: 'bg-matematica-50',
    primaryBorder: 'border-matematica-500',
    text: 'text-matematica-700',
    textLight: 'text-matematica-500',
    ring: 'ring-matematica-500',
    gradient: 'from-matematica-500 to-matematica-600',
  }
}

// ═══════════════════════════════════════════════════════════
// DELAY HELPER
// ═══════════════════════════════════════════════════════════
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ═══════════════════════════════════════════════════════════
// DEBOUNCE
// ═══════════════════════════════════════════════════════════
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// ═══════════════════════════════════════════════════════════
// TRUNCAR TEXTO
// ═══════════════════════════════════════════════════════════
export function truncar(texto: string, tamanho: number): string {
  if (texto.length <= tamanho) return texto
  return texto.slice(0, tamanho) + '...'
}

// ═══════════════════════════════════════════════════════════
// VERIFICAR DATA HOJE
// ═══════════════════════════════════════════════════════════
export function ehHoje(data: string | Date | null | undefined): boolean {
  if (!data) return false
  const d = new Date(data)
  const hoje = new Date()
  return (
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear()
  )
}

export function ehOntem(data: string | Date | null | undefined): boolean {
  if (!data) return false
  const d = new Date(data)
  const ontem = new Date()
  ontem.setDate(ontem.getDate() - 1)
  return (
    d.getDate() === ontem.getDate() &&
    d.getMonth() === ontem.getMonth() &&
    d.getFullYear() === ontem.getFullYear()
  )
}
