import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÃO JWT SEGURA
// ═══════════════════════════════════════════════════════════
const JWT_SECRET_RAW = process.env.JWT_SECRET

// Gerar segredo para desenvolvimento (consistente - deve coincidir com auth.ts)
const DEV_SECRET = 'dev-only-secret-for-local-development-only'

// Em produção, usa JWT_SECRET obrigatoriamente
// Em desenvolvimento/build, usa segredo de desenvolvimento
function getJwtSecret(): Uint8Array {
  if (JWT_SECRET_RAW) {
    return new TextEncoder().encode(JWT_SECRET_RAW)
  }

  // Durante build ou em desenvolvimento, permite sem JWT_SECRET
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PHASE === 'phase-production-build') {
    return new TextEncoder().encode(DEV_SECRET)
  }

  // Em produção runtime, JWT_SECRET é obrigatório
  throw new Error('JWT_SECRET é obrigatório em produção. Configure a variável de ambiente.')
}

const JWT_SECRET = getJwtSecret()

// Configurações de segurança do JWT (devem coincidir com auth.ts)
const JWT_ISSUER = 'plataforma-edu'
const JWT_AUDIENCE = 'plataforma-edu-users'

// ═══════════════════════════════════════════════════════════
// CONFIGURAÇÃO DE ROTAS
// ═══════════════════════════════════════════════════════════

// Rotas públicas que não precisam de autenticação
const rotasPublicas = ['/login', '/api/auth', '/api/verificar', '/api/ping', '/api/teste']

// Rotas que precisam ser professor
const rotasProfessor = ['/professor', '/api/professor']

// Extensões de arquivo estático (mais seguro que verificar por ".")
const extensoesEstaticas = [
  '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot', '.map', '.json', '.xml', '.txt'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ═══════════════════════════════════════════════════════════
  // IGNORAR ARQUIVOS ESTÁTICOS - Verificação segura por extensão
  // ═══════════════════════════════════════════════════════════
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    extensoesEstaticas.some(ext => pathname.endsWith(ext))
  ) {
    return NextResponse.next()
  }

  // ═══════════════════════════════════════════════════════════
  // ROTAS PÚBLICAS
  // ═══════════════════════════════════════════════════════════
  if (rotasPublicas.some(rota => pathname.startsWith(rota))) {
    return NextResponse.next()
  }

  // ═══════════════════════════════════════════════════════════
  // VERIFICAR TOKEN
  // ═══════════════════════════════════════════════════════════
  const token = request.cookies.get('auth_token')?.value

  if (!token) {
    // Redirecionar para login se não autenticado
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verificar token COM issuer e audience
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })

    // ═══════════════════════════════════════════════════════════
    // VERIFICAR ACESSO A ROTAS DE PROFESSOR
    // ═══════════════════════════════════════════════════════════
    if (rotasProfessor.some(rota => pathname.startsWith(rota))) {
      if (payload.tipo !== 'professor') {
        if (pathname.startsWith('/api')) {
          return NextResponse.json(
            { sucesso: false, erro: 'Acesso não autorizado' },
            { status: 403 }
          )
        }
        return NextResponse.redirect(new URL('/selecionar', request.url))
      }
    }

    // ═══════════════════════════════════════════════════════════
    // VERIFICAR ACESSO A COMPONENTES
    // ═══════════════════════════════════════════════════════════
    const componenteMatch = pathname.match(/^\/(fisica|matematica)/)
    if (componenteMatch) {
      const componente = componenteMatch[1]
      const componentes = (payload.componentes as string[]) || []

      if (!componentes.includes(componente)) {
        if (pathname.startsWith('/api')) {
          return NextResponse.json(
            { sucesso: false, erro: 'Acesso não autorizado a este componente' },
            { status: 403 }
          )
        }
        return NextResponse.redirect(new URL('/selecionar', request.url))
      }
    }

    return NextResponse.next()
  } catch {
    // Token inválido - limpar cookie e redirecionar
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth_token')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
