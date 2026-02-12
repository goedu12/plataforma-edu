export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Nomes dos alunos participantes por componente
const ALUNOS_FISICA = ['Hiarley', 'Ana Luiza']
const ALUNOS_MATEMATICA = ['João Alexandre', 'Davi Valente']

// Mapeamento de colégio por aluno (DB não tem campo de escola)
function obterColegio(nome: string): string {
  const n = nome.toLowerCase()
  if (n.includes('hiarley') || n.includes('ana luiza') || n.includes('ana lu')) {
    return 'CE Cora Coralina — Goiânia/GO'
  }
  return 'CE Colemar Natal e Silva — Goiânia/GO'
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Buscar professor(es)
    const { data: professores } = await supabase
      .from('usuarios')
      .select('id, nome, foto_url, email')
      .eq('tipo', 'professor')
      .eq('ativo', true)
      .limit(5)

    // Buscar alunos de Física direto da tabela usuarios
    const { data: fisicaRaw } = await supabase
      .from('usuarios')
      .select('id, nome, turma, foto_url')
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .or(ALUNOS_FISICA.map(n => `nome.ilike.%${n}%`).join(','))
      .limit(2)

    // Buscar alunos de Matemática direto da tabela usuarios
    const { data: matRaw } = await supabase
      .from('usuarios')
      .select('id, nome, turma, foto_url')
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .or(ALUNOS_MATEMATICA.map(n => `nome.ilike.%${n}%`).join(','))
      .limit(2)

    const formatarAluno = (u: { id: string; nome: string; turma: string; foto_url: string | null }) => ({
      id: u.id,
      nome: u.nome,
      turma: u.turma,
      fotoUrl: u.foto_url,
      colegio: obterColegio(u.nome),
    })

    return NextResponse.json({
      sucesso: true,
      professores: professores || [],
      alunosFisica: (fisicaRaw || []).map(formatarAluno),
      alunosMatematica: (matRaw || []).map(formatarAluno),
    })
  } catch (error) {
    console.error('[Sobre] Erro:', error)
    return NextResponse.json({ sucesso: false, professores: [], alunosFisica: [], alunosMatematica: [] })
  }
}
