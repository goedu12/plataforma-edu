import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════
// API PÚBLICA PARA LISTAR LOGINS DOS ESTUDANTES
// Permite que estudantes encontrem seu login antes de entrar
// ═══════════════════════════════════════════════════════════

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

      return {
        nome: u.nome || 'Sem nome',
        turma: u.turma || 'Sem turma',
        login: u.email || '', // O email é o login
        componente: componente,
        colegio: u.colegio || '',
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
