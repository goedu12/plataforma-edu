export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Termos de busca por grupo
const ALUNOS_FISICA = ['Hiarley', 'Ana Luiza', 'Ana Lu']
const ALUNOS_MATEMATICA = ['Alexandre', 'Valente', 'Davi Val']
const ALUNOS_CORA_EXTRA = ['Georgi', 'Scaglio', 'Roberto Sc']

// Mapeamento de colégio por aluno
function obterColegio(nome: string): string {
  const n = nome.toLowerCase()
  if (n.includes('hiarley') || n.includes('ana luiza') || n.includes('ana lu') ||
      n.includes('georgi') || n.includes('scaglio') || n.includes('roberto sc')) {
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

    // Buscar alunos de Física (CE Cora Coralina — 2A)
    const { data: fisicaRaw } = await supabase
      .from('usuarios')
      .select('id, nome, turma, foto_url')
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .or(ALUNOS_FISICA.map(n => `nome.ilike.%${n}%`).join(','))
      .limit(2)

    // Buscar alunos de Matemática (CE Colemar — 2A)
    const { data: matRaw } = await supabase
      .from('usuarios')
      .select('id, nome, turma, foto_url')
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .or(ALUNOS_MATEMATICA.map(n => `nome.ilike.%${n}%`).join(','))
      .limit(2)

    // Buscar alunos extras do CE Cora Coralina (Georgi + Roberto)
    const { data: coraExtraRaw } = await supabase
      .from('usuarios')
      .select('id, nome, turma, foto_url')
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .or(ALUNOS_CORA_EXTRA.map(n => `nome.ilike.%${n}%`).join(','))
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
      alunosCoraExtra: (coraExtraRaw || []).map(formatarAluno),
    })
  } catch (error) {
    console.error('[Sobre] Erro:', error)
    return NextResponse.json({ sucesso: false, professores: [], alunosFisica: [], alunosMatematica: [], alunosCoraExtra: [] })
  }
}
