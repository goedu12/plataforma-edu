export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Mapeamento dos alunos destaque por componente
const ALUNOS_DESTAQUE_CONFIG = {
  fisica: {
    nomes: ['Hiarley', 'Ana Luiza'],
    turma: '2A',
  },
  matematica: {
    nomes: ['João Alexandre', 'Davi Valente'],
    turma: '2A',
  },
}

// Mapeamento de colégio por aluno (DB não tem campo de escola)
function obterColegio(nome: string): string {
  const nomeNorm = nome.toLowerCase()
  if (nomeNorm.includes('hiarley') || nomeNorm.includes('ana luiza') || nomeNorm.includes('ana lu')) {
    return 'CE Gov. Luiz Viana Filho — Jequié/BA'
  }
  return 'CE Luiz Navarro de Brito — Jequié/BA'
}

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

    // Buscar alunos destaque de Física (2A)
    const { data: alunosFisicaRaw } = await supabase
      .from(`notas_${ano}`)
      .select(`
        nota_final,
        questoes_respondidas,
        dias_ativos,
        usuario_id,
        usuarios!inner (
          id, nome, turma, foto_url,
          fis_pontos, fis_questoes_corretas, fis_questoes_total
        )
      `)
      .eq('componente', 'fisica')
      .eq('ano_letivo', ano)
      .eq('bimestre', 1)
      .eq('usuarios.turma', ALUNOS_DESTAQUE_CONFIG.fisica.turma)
      .eq('usuarios.tipo', 'estudante')
      .eq('usuarios.ativo', true)
      .or(
        ALUNOS_DESTAQUE_CONFIG.fisica.nomes.map(n => `nome.ilike.%${n}%`).join(','),
        { referencedTable: 'usuarios' }
      )
      .order('nota_final', { ascending: false })
      .limit(2)

    // Buscar alunos destaque de Matemática (3A)
    const { data: alunosMatRaw } = await supabase
      .from(`notas_${ano}`)
      .select(`
        nota_final,
        questoes_respondidas,
        dias_ativos,
        usuario_id,
        usuarios!inner (
          id, nome, turma, foto_url,
          mat_pontos, mat_questoes_corretas, mat_questoes_total
        )
      `)
      .eq('componente', 'matematica')
      .eq('ano_letivo', ano)
      .eq('bimestre', 1)
      .eq('usuarios.turma', ALUNOS_DESTAQUE_CONFIG.matematica.turma)
      .eq('usuarios.tipo', 'estudante')
      .eq('usuarios.ativo', true)
      .or(
        ALUNOS_DESTAQUE_CONFIG.matematica.nomes.map(n => `nome.ilike.%${n}%`).join(','),
        { referencedTable: 'usuarios' }
      )
      .order('nota_final', { ascending: false })
      .limit(2)

    // Formatar alunos de Física
    const alunosFisica = (alunosFisicaRaw || []).map((a) => {
      const u = a.usuarios as unknown as {
        id: string; nome: string; turma: string; foto_url: string | null
        fis_pontos: number; fis_questoes_corretas: number; fis_questoes_total: number
      }
      return {
        id: u.id,
        nome: u.nome,
        turma: u.turma,
        fotoUrl: u.foto_url,
        notaFinal: a.nota_final,
        questoesRespondidas: a.questoes_respondidas,
        diasAtivos: a.dias_ativos,
        pontos: u.fis_pontos,
        taxaAcerto: u.fis_questoes_total > 0
          ? Math.round((u.fis_questoes_corretas / u.fis_questoes_total) * 100)
          : 0,
        colegio: obterColegio(u.nome),
      }
    })

    // Formatar alunos de Matemática
    const alunosMatematica = (alunosMatRaw || []).map((a) => {
      const u = a.usuarios as unknown as {
        id: string; nome: string; turma: string; foto_url: string | null
        mat_pontos: number; mat_questoes_corretas: number; mat_questoes_total: number
      }
      return {
        id: u.id,
        nome: u.nome,
        turma: u.turma,
        fotoUrl: u.foto_url,
        notaFinal: a.nota_final,
        questoesRespondidas: a.questoes_respondidas,
        diasAtivos: a.dias_ativos,
        pontos: u.mat_pontos,
        taxaAcerto: u.mat_questoes_total > 0
          ? Math.round((u.mat_questoes_corretas / u.mat_questoes_total) * 100)
          : 0,
        colegio: obterColegio(u.nome),
      }
    })

    return NextResponse.json({
      sucesso: true,
      professores: professores || [],
      alunosFisica,
      alunosMatematica,
    })
  } catch (error) {
    console.error('[Sobre] Erro:', error)
    return NextResponse.json({ sucesso: false, professores: [], alunosFisica: [], alunosMatematica: [] })
  }
}
