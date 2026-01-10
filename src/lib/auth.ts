import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { getSupabaseAdmin } from './supabase'
import type { Usuario, Componente, NivelEnsino } from '@/types'

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÃO JWT SEGURA
// ═══════════════════════════════════════════════════════════
const JWT_SECRET_RAW = process.env.JWT_SECRET

// Comprimento mínimo recomendado para o secret (32 caracteres = 256 bits)
const MIN_SECRET_LENGTH = 32

// Gerar segredo para desenvolvimento (consistente durante a sessão)
// ATENÇÃO: Este segredo NUNCA deve ser usado em produção
const DEV_SECRET = 'dev-only-secret-32chars-minimum!!'

// Flag para rastrear se estamos usando secret de desenvolvimento
let usingDevSecret = false

// Em produção, usa JWT_SECRET obrigatoriamente
// Em desenvolvimento/build, usa segredo de desenvolvimento
function getJwtSecret(): Uint8Array {
  if (JWT_SECRET_RAW) {
    // Validar comprimento mínimo do secret
    if (JWT_SECRET_RAW.length < MIN_SECRET_LENGTH) {
      console.warn(
        `[SECURITY WARNING] JWT_SECRET tem apenas ${JWT_SECRET_RAW.length} caracteres. ` +
        `Recomendado: mínimo ${MIN_SECRET_LENGTH} caracteres para segurança adequada.`
      )
    }
    return new TextEncoder().encode(JWT_SECRET_RAW)
  }

  // Durante build ou em desenvolvimento, permite sem JWT_SECRET
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
    usingDevSecret = true
    // Log apenas uma vez em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[SECURITY WARNING] Usando JWT_SECRET de desenvolvimento. ' +
        'Configure JWT_SECRET nas variáveis de ambiente para produção.'
      )
    }
    return new TextEncoder().encode(DEV_SECRET)
  }

  // Em produção runtime, JWT_SECRET é obrigatório
  throw new Error('JWT_SECRET é obrigatório em produção. Configure a variável de ambiente.')
}

const JWT_SECRET = getJwtSecret()

/**
 * Verifica se o sistema está usando secret de desenvolvimento
 * Útil para auditorias de segurança
 */
export function isUsingDevSecret(): boolean {
  return usingDevSecret
}

// Configurações de segurança do JWT
const JWT_ISSUER = 'plataforma-edu'
const JWT_AUDIENCE = 'plataforma-edu-users'

const COOKIE_NAME = 'auth_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

// ═══════════════════════════════════════════════════════════
// PAYLOAD DO TOKEN
// ═══════════════════════════════════════════════════════════
interface TokenPayload extends JWTPayload {
  userId: string
  email: string
  tipo: 'estudante' | 'professor'
  componentes: Componente[]
}

// ═══════════════════════════════════════════════════════════
// FUNÇÕES DE HASH
// ═══════════════════════════════════════════════════════════
export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 12)
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash)
}

// ═══════════════════════════════════════════════════════════
// FUNÇÕES DE TOKEN JWT - COM ISSUER E AUDIENCE
// ═══════════════════════════════════════════════════════════
export async function criarToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setSubject(payload.userId)
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verificarToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
    return payload as TokenPayload
  } catch {
    return null
  }
}

// ═══════════════════════════════════════════════════════════
// FUNÇÕES DE SESSÃO
// ═══════════════════════════════════════════════════════════
export async function criarSessao(usuario: {
  id: string
  email: string
  tipo: 'estudante' | 'professor'
  componentes: Componente[]
}): Promise<void> {
  const token = await criarToken({
    userId: usuario.id,
    email: usuario.email,
    tipo: usuario.tipo,
    componentes: usuario.componentes,
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function obterSessao(): Promise<TokenPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (!token) return null

  return verificarToken(token)
}

export async function encerrarSessao(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// ═══════════════════════════════════════════════════════════
// FUNÇÕES DE AUTENTICAÇÃO
// ═══════════════════════════════════════════════════════════
export interface LoginResult {
  sucesso: boolean
  erro?: string
  tipo?: 'estudante' | 'professor'
  componentes?: Componente[]
  redirecionarPara?: string
}

export async function login(email: string, senha: string): Promise<LoginResult> {
  const supabase = getSupabaseAdmin()

  // Buscar usuário
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('ativo', true)
    .single()

  if (error || !usuario) {
    return { sucesso: false, erro: 'Usuário não encontrado' }
  }

  // Verificar senha
  const senhaValida = await verificarSenha(senha, usuario.senha_hash)
  if (!senhaValida) {
    return { sucesso: false, erro: 'Senha incorreta' }
  }

  // Validar componentes
  const componentes = usuario.componentes as Componente[]
  if (componentes.length === 0 && usuario.tipo === 'estudante') {
    return { sucesso: false, erro: 'Nenhum componente atribuído. Contate seu professor.' }
  }

  // Validar Física para Ensino Fundamental
  if (componentes.includes('fisica') && usuario.nivel === 'EF') {
    return { sucesso: false, erro: 'Física disponível apenas para Ensino Médio' }
  }

  // Criar sessão
  await criarSessao({
    id: usuario.id,
    email: usuario.email,
    tipo: usuario.tipo,
    componentes,
  })

  // Atualizar último acesso
  await supabase
    .from('usuarios')
    .update({ ultimo_acesso: new Date().toISOString() })
    .eq('id', usuario.id)

  // Determinar redirecionamento
  let redirecionarPara: string
  if (usuario.tipo === 'professor') {
    redirecionarPara = '/professor/dashboard'
  } else if (componentes.length === 1) {
    redirecionarPara = `/${componentes[0]}/menu`
  } else {
    redirecionarPara = '/selecionar'
  }

  return {
    sucesso: true,
    tipo: usuario.tipo,
    componentes,
    redirecionarPara,
  }
}

export async function logout(): Promise<void> {
  await encerrarSessao()
}

// ═══════════════════════════════════════════════════════════
// FUNÇÕES DE USUÁRIO
// ═══════════════════════════════════════════════════════════
export async function obterUsuarioAtual(): Promise<Usuario | null> {
  const sessao = await obterSessao()
  if (!sessao) return null

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', sessao.userId)
    .single()

  if (error || !data) return null

  // Remover senha_hash do retorno
  const { senha_hash, ...usuario } = data
  return usuario as Usuario
}

// ═══════════════════════════════════════════════════════════
// VALIDAÇÕES
// ═══════════════════════════════════════════════════════════
export function validarTurma(turma: string): { valida: boolean; ano?: number; nivel?: NivelEnsino; erro?: string } {
  const turmaLower = turma.toLowerCase()
  const match = turmaLower.match(/^(\d+)([a-z])$/)

  if (!match) {
    return { valida: false, erro: 'Formato de turma inválido' }
  }

  const ano = parseInt(match[1])

  // Ensino Médio: 1º ao 3º
  if (ano >= 1 && ano <= 3) {
    return { valida: true, ano, nivel: 'EM' }
  }

  // Ensino Fundamental: 6º ao 9º
  if (ano >= 6 && ano <= 9) {
    return { valida: true, ano, nivel: 'EF' }
  }

  return { valida: false, erro: 'Turma inválida. Anos permitidos: 6-9 (Fundamental) ou 1-3 (Médio)' }
}

export function validarComponenteNivel(componente: Componente, nivel: NivelEnsino): boolean {
  // Física só para Ensino Médio
  if (componente === 'fisica' && nivel === 'EF') {
    return false
  }
  return true
}
