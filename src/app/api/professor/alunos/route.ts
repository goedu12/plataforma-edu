export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getPeriodoAtual } from '@/lib/sistema-notas'

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

    // Buscar notas atuais do bimestre
    const ano = new Date().getFullYear()
    const periodo = getPeriodoAtual(ano)
    const bimestreAtual = periodo?.bimestre || 1

    const alunoIds = alunos.map(a => a.id)

    // Buscar notas do bimestre atual
    const { data: notasAtuais } = await supabase
      .from('notas_2025')
      .select('usuario_id, componente, nota_final, status, questoes_respondidas, meta_questoes')
      .in('usuario_id', alunoIds)
      .eq('bimestre', bimestreAtual)
      .eq('ano_letivo', ano)

    // Criar mapa de notas por usuário e componente
    const notasPorAluno = new Map<string, Map<string, { nota_final: number; status: string; questoes_respondidas: number; meta_questoes: number }>>()
    notasAtuais?.forEach(n => {
      if (!notasPorAluno.has(n.usuario_id)) {
        notasPorAluno.set(n.usuario_id, new Map())
      }
      notasPorAluno.get(n.usuario_id)!.set(n.componente, {
        nota_final: n.nota_final,
        status: n.status,
        questoes_respondidas: n.questoes_respondidas,
        meta_questoes: n.meta_questoes,
      })
    })

    // Remover senha_hash e adicionar informações de nota e atividade
    const alunosSemSenha = alunos.map(({ senha_hash, ...aluno }) => {
      const notasAluno = notasPorAluno.get(aluno.id)

      // Calcular dias sem atividade
      let diasSemAtividade: number | null = null
      let nuncaLogou = false

      // Verificar último acesso ou último estudo
      const ultimoAcesso = aluno.ultimo_acesso
      const fisUltimoEstudo = aluno.fis_ultimo_estudo
      const matUltimoEstudo = aluno.mat_ultimo_estudo

      // Pegar a data mais recente entre todas
      const datas = [ultimoAcesso, fisUltimoEstudo, matUltimoEstudo].filter(d => d != null)

      if (datas.length === 0) {
        nuncaLogou = true
      } else {
        const ultimaAtividade = new Date(Math.max(...datas.map(d => new Date(d).getTime())))
        const agora = new Date()
        diasSemAtividade = Math.floor((agora.getTime() - ultimaAtividade.getTime()) / (1000 * 60 * 60 * 24))
      }

      return {
        ...aluno,
        // Notas do bimestre atual
        fis_nota_atual: notasAluno?.get('fisica')?.nota_final ?? null,
        fis_status_nota: notasAluno?.get('fisica')?.status ?? null,
        mat_nota_atual: notasAluno?.get('matematica')?.nota_final ?? null,
        mat_status_nota: notasAluno?.get('matematica')?.status ?? null,
        // Informações de atividade
        nunca_logou: nuncaLogou,
        dias_sem_atividade: diasSemAtividade,
      }
    })

    // Obter lista de turmas únicas
    const turmas = [...new Set(alunos.map(a => a.turma))].sort()

    return NextResponse.json({
      sucesso: true,
      alunos: alunosSemSenha,
      turmas,
      total: alunos.length,
      bimestre_atual: bimestreAtual,
      ano_letivo: ano,
    })
  } catch (error) {
    console.error('Erro ao buscar alunos:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
