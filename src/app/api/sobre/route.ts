export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()
    const ano = new Date().getFullYear()

    // Buscar professor(es) do projeto
    const { data: professores } = await supabase
      .from('usuarios')
      .select('id, nome, foto_url, email')
      .eq('tipo', 'professor')
      .eq('ativo', true)
      .limit(5)

    // Buscar top 2 alunos da turma 2A em matemática (por nota do bimestre 1)
    const { data: alunosDestaque } = await supabase
      .from(`notas_${ano}`)
      .select(`
        nota_final,
        questoes_respondidas,
        dias_ativos,
        usuario_id,
        usuarios!inner (
          id,
          nome,
          turma,
          foto_url,
          mat_pontos,
          mat_questoes_corretas,
          mat_questoes_total
        )
      `)
      .eq('componente', 'matematica')
      .eq('ano_letivo', ano)
      .eq('bimestre', 1)
      .eq('usuarios.turma', '2A')
      .eq('usuarios.tipo', 'estudante')
      .eq('usuarios.ativo', true)
      .order('nota_final', { ascending: false })
      .limit(2)

    return NextResponse.json({
      sucesso: true,
      professores: professores || [],
      alunosDestaque: (alunosDestaque || []).map((a) => {
        const u = a.usuarios as unknown as {
          id: string; nome: string; turma: string; foto_url: string | null
          mat_pontos: number; mat_questoes_corretas: number; mat_questoes_total: number
        }
        const taxa = u.mat_questoes_total > 0
          ? Math.round((u.mat_questoes_corretas / u.mat_questoes_total) * 100)
          : 0
        return {
          id: u.id,
          nome: u.nome,
          turma: u.turma,
          fotoUrl: u.foto_url,
          notaFinal: a.nota_final,
          questoesRespondidas: a.questoes_respondidas,
          diasAtivos: a.dias_ativos,
          pontos: u.mat_pontos,
          taxaAcerto: taxa,
        }
      }),
    })
  } catch (error) {
    console.error('[Sobre] Erro:', error)
    return NextResponse.json({ sucesso: false, professores: [], alunosDestaque: [] })
  }
}
