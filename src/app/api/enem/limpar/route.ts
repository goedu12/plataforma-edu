export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Limpar questões antigas (pré-2024)
//
// DELETE /api/enem/limpar
//
// Remove questões anteriores a 2024 e suas respostas associadas.
// Questões da API enem.dev (2009-2023) possuem imagens quebradas
// (broken-image.svg) e qualidade inconsistente.
//
// Apenas professores podem executar esta operação.
// ═══════════════════════════════════════════════════════════════════════════

const ANO_MINIMO = 2024

export async function DELETE() {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Verificar se é professor
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', sessao.userId)
      .single()

    if (!usuario || usuario.tipo !== 'professor') {
      return NextResponse.json({
        sucesso: false,
        erro: 'Apenas professores podem executar esta operação.',
      }, { status: 403 })
    }

    // 1. Contar questões que serão removidas
    const { data: questoesAntigas, error: erroContagem } = await supabase
      .from('questoes_enem')
      .select('id, ano_prova')
      .lt('ano_prova', ANO_MINIMO)

    if (erroContagem) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Erro ao contar questões antigas',
        detalhes: erroContagem.message,
      }, { status: 500 })
    }

    const totalAntigas = questoesAntigas?.length || 0

    if (totalAntigas === 0) {
      return NextResponse.json({
        sucesso: true,
        mensagem: `Nenhuma questão anterior a ${ANO_MINIMO} encontrada. Banco já está limpo.`,
        removidas: 0,
      })
    }

    // Agrupar por ano para relatório
    const porAno: Record<number, number> = {}
    questoesAntigas?.forEach(q => {
      porAno[q.ano_prova] = (porAno[q.ano_prova] || 0) + 1
    })

    const idsAntigas = questoesAntigas!.map(q => q.id)

    // 2. Remover respostas associadas às questões antigas
    const { error: erroRespostas, count: respostasRemovidas } = await supabase
      .from('respostas_enem')
      .delete({ count: 'exact' })
      .in('questao_id', idsAntigas)

    if (erroRespostas) {
      console.error('Erro ao remover respostas antigas:', erroRespostas)
      // Continuar mesmo com erro nas respostas
    }

    // 3. Remover questões antigas
    const { error: erroDelete, count: questoesRemovidas } = await supabase
      .from('questoes_enem')
      .delete({ count: 'exact' })
      .lt('ano_prova', ANO_MINIMO)

    if (erroDelete) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Erro ao remover questões antigas',
        detalhes: erroDelete.message,
      }, { status: 500 })
    }

    console.log(`[ENEM LIMPAR] Removidas ${questoesRemovidas} questões e ${respostasRemovidas || 0} respostas anteriores a ${ANO_MINIMO}`)

    return NextResponse.json({
      sucesso: true,
      mensagem: `Limpeza concluída. Removidas ${questoesRemovidas} questões anteriores a ${ANO_MINIMO}.`,
      removidas: questoesRemovidas || 0,
      respostas_removidas: respostasRemovidas || 0,
      por_ano: porAno,
    })
  } catch (error) {
    console.error('Erro na limpeza ENEM:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno', detalhes: String(error) },
      { status: 500 }
    )
  }
}
