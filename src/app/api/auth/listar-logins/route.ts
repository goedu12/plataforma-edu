import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════
// API PÚBLICA PARA LISTAR LOGINS DOS ESTUDANTES
// Permite que estudantes encontrem seu login antes de entrar
// ═══════════════════════════════════════════════════════════

// Função para determinar turno baseado na turma ou colégio
function determinarTurno(turma: string, colegio: string): string {
  const turmaUpper = turma.toUpperCase()
  const colegioUpper = colegio.toUpperCase()

  // Primeiro tenta extrair da turma
  if (turmaUpper.includes('-M') || turmaUpper.endsWith('M')) return 'Matutino'
  if (turmaUpper.includes('-T') || turmaUpper.endsWith('T')) return 'Vespertino'
  if (turmaUpper.includes('-V') || turmaUpper.endsWith('V')) return 'Vespertino'
  if (turmaUpper.includes('-N') || turmaUpper.endsWith('N')) return 'Noturno'
  if (turmaUpper.includes('-I') || turmaUpper.endsWith('I')) return 'Integral'

  // Se não conseguiu extrair da turma, determina pelo colégio
  if (colegioUpper.includes('CORA CORALINA')) return 'Matutino'
  if (colegioUpper.includes('COLEMAR') || colegioUpper.includes('NATAL E SILVA')) return 'Vespertino'

  return '' // Turno não identificado
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Buscar apenas estudantes ativos com informações básicas
    // NÃO retorna senha ou dados sensíveis
    // Nota: O campo 'email' é usado como login no sistema
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('nome, turma, email, componentes, colegio')
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .order('colegio', { ascending: true })
      .order('turma', { ascending: true })
      .order('nome', { ascending: true })

    if (error) {
      console.error('[Listar Logins] Erro Supabase:', error.message, error.details, error.hint)
      return NextResponse.json({
        sucesso: false,
        erro: 'Erro ao buscar estudantes',
        detalhes: error.message
      }, { status: 500 })
    }

    console.log('[Listar Logins] Encontrados:', usuarios?.length || 0, 'estudantes')

    // Formatar dados (garantir que não há dados sensíveis)
    // O email é o login do sistema (formato: nome@turma)
    const estudantes = (usuarios || []).map(u => {
      // Pegar o primeiro componente do array ou default para 'fisica'
      const componentes = u.componentes as string[] | null
      const componente = componentes && componentes.length > 0 ? componentes[0] : 'fisica'
      const turno = determinarTurno(u.turma || '', u.colegio || '')

      return {
        nome: u.nome || 'Sem nome',
        turma: u.turma || 'Sem turma',
        login: u.email || '', // O email é o login
        componente: componente,
        colegio: u.colegio || '',
        turno: turno,
      }
    })

    return NextResponse.json({
      sucesso: true,
      estudantes,
      total: estudantes.length,
    })
  } catch (error) {
    console.error('[Listar Logins] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}
