export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const turma = searchParams.get('turma')
    const componente = searchParams.get('componente')

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('usuarios')
      .select('*')
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .order('nome', { ascending: true })

    if (turma) {
      query = query.eq('turma', turma)
    }

    if (componente) {
      query = query.contains('componentes', [componente])
    }

    const { data: alunos, error } = await query

    if (error) {
      console.error('Erro ao buscar alunos:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar alunos' },
        { status: 500 }
      )
    }

    // Remover senha_hash
    const alunosSemSenha = alunos.map(({ senha_hash, ...aluno }) => aluno)

    // Obter lista de turmas únicas
    const turmas = [...new Set(alunos.map(a => a.turma))].sort()

    return NextResponse.json({
      sucesso: true,
      alunos: alunosSemSenha,
      turmas,
      total: alunos.length,
    })
  } catch (error) {
    console.error('Erro ao buscar alunos:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
