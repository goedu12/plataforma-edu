import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'chave-secreta-desenvolvimento-32ch'
)

// Rotas públicas que não precisam de autenticação
const rotasPublicas = ['/login', '/api/auth/login']

// Rotas que precisam ser professor
const rotasProfessor = ['/professor', '/api/professor']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Ignorar arquivos estáticos
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Rotas públicas
  if (rotasPublicas.some(rota => pathname.startsWith(rota))) {
    return NextResponse.next()
  }

  // Verificar token
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
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Verificar acesso a rotas de professor
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

    // Verificar acesso a componentes
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
    // Token inválido
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
