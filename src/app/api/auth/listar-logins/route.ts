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
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('nome, turma, login, componente')
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .order('turma', { ascending: true })
      .order('nome', { ascending: true })

    if (error) {
      console.error('[Listar Logins] Erro:', error)
      return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar estudantes' }, { status: 500 })
    }

    // Formatar dados (garantir que não há dados sensíveis)
    const estudantes = (usuarios || []).map(u => ({
      nome: u.nome || 'Sem nome',
      turma: u.turma || 'Sem turma',
      login: u.login || '',
      componente: u.componente || 'fisica',
    }))

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
