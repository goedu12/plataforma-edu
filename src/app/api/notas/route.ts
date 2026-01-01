import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import type { Componente } from '@/types'
import { NOTAS, BIMESTRES } from '@/types'

// Função para calcular o bimestre atual
function calcularBimestreAtual(): { bimestre: 1 | 2 | 3 | 4; ano: number } {
  const agora = new Date()
  const mes = agora.getMonth() + 1 // 1-12
  const ano = agora.getFullYear()

  let bimestre: 1 | 2 | 3 | 4 = 1
  if (mes >= 2 && mes <= 4) bimestre = 1
  else if (mes >= 5 && mes <= 7) bimestre = 2
  else if (mes >= 8 && mes <= 10) bimestre = 3
  else bimestre = 4

  return { bimestre, ano }
}

// Função para calcular as notas
function calcularNotas(
  questoesTotal: number,
  questoesCorretas: number,
  diasAtivos: number
): {
  nota_desempenho: number
  nota_participacao: number
  nota_frequencia: number
  nota_calculada: number
  nota_final: number
  bloqueio: 'desempenho_baixo' | 'participacao_baixa' | null
} {
  // Nota de Desempenho (taxa de acerto * 10)
  const taxaAcerto = questoesTotal > 0 ? questoesCorretas / questoesTotal : 0
  const nota_desempenho = Math.min(10, Math.round(taxaAcerto * 100) / 10)

  // Nota de Participação (questões feitas / meta * 10)
  const participacao = Math.min(1, questoesTotal / NOTAS.META_QUESTOES_BIMESTRE)
  const nota_participacao = Math.round(participacao * 100) / 10

  // Nota de Frequência (dias ativos / meta * 10)
  const frequencia = Math.min(1, diasAtivos / NOTAS.META_DIAS_BIMESTRE)
  const nota_frequencia = Math.round(frequencia * 100) / 10

  // Calcular nota final ponderada
  let nota_calculada =
    nota_desempenho * NOTAS.PESO_DESEMPENHO +
    nota_participacao * NOTAS.PESO_PARTICIPACAO +
    nota_frequencia * NOTAS.PESO_FREQUENCIA

  nota_calculada = Math.round(nota_calculada * 10) / 10

  // Verificar bloqueios
  let bloqueio: 'desempenho_baixo' | 'participacao_baixa' | null = null
  let nota_final = nota_calculada

  if (nota_desempenho < NOTAS.NOTA_MINIMA_DESEMPENHO) {
    bloqueio = 'desempenho_baixo'
    nota_final = Math.min(nota_final, NOTAS.NOTA_MAXIMA_BLOQUEIO)
  } else if (nota_participacao < NOTAS.NOTA_MINIMA_PARTICIPACAO) {
    bloqueio = 'participacao_baixa'
    nota_final = Math.min(nota_final, NOTAS.NOTA_MAXIMA_BLOQUEIO)
  }

  return {
    nota_desempenho,
    nota_participacao,
    nota_frequencia,
    nota_calculada,
    nota_final,
    bloqueio,
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const componente = searchParams.get('componente') as Componente
    const bimestreParam = searchParams.get('bimestre')
    const anoParam = searchParams.get('ano')

    if (!componente || !['fisica', 'matematica'].includes(componente)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componente inválido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { bimestre: bimestreAtual, ano: anoAtual } = calcularBimestreAtual()

    const bimestre = bimestreParam ? parseInt(bimestreParam) : bimestreAtual
    const ano = anoParam ? parseInt(anoParam) : anoAtual

    // Verificar se o bimestre é válido
    if (bimestre < 1 || bimestre > 4) {
      return NextResponse.json(
        { sucesso: false, erro: 'Bimestre inválido' },
        { status: 400 }
      )
    }

    // Buscar datas do bimestre
    const bimestreConfig = BIMESTRES[bimestre as keyof typeof BIMESTRES]
    const dataInicio = `${ano}-${String(bimestreConfig.inicio.mes).padStart(2, '0')}-${String(bimestreConfig.inicio.dia).padStart(2, '0')}`
    const dataFim = `${ano}-${String(bimestreConfig.fim.mes).padStart(2, '0')}-${String(bimestreConfig.fim.dia).padStart(2, '0')}`

    // Buscar respostas do usuário no bimestre
    // Primeiro tenta com modo 'estudo', se falhar tenta sem filtro de modo
    let respostas: { correta: boolean }[] | null = null
    let erroRespostas = null

    // Tentar buscar com filtro de modo (novo schema)
    const { data: respostasComModo, error: erro1 } = await supabase
      .from('respostas')
      .select('correta')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('modo', 'estudo')
      .gte('criado_em', dataInicio)
      .lte('criado_em', dataFim + 'T23:59:59')

    if (!erro1) {
      respostas = respostasComModo
    } else {
      // Fallback: buscar sem filtro de modo (schema antigo)
      const { data: respostasSemModo, error: erro2 } = await supabase
        .from('respostas')
        .select('correta')
        .eq('usuario_id', sessao.userId)
        .eq('componente', componente)
        .gte('criado_em', dataInicio)
        .lte('criado_em', dataFim + 'T23:59:59')

      if (erro2) {
        erroRespostas = erro2
      } else {
        respostas = respostasSemModo
      }
    }

    if (erroRespostas) {
      console.error('Erro ao buscar respostas:', erroRespostas)
    }

    const questoesTotal = respostas?.length || 0
    const questoesCorretas = respostas?.filter(r => r.correta).length || 0

    // Buscar dias ativos no bimestre
    // Tenta buscar da tabela dias_ativos, com fallback para estimativa
    let diasAtivos = 0

    const { data: diasAtivosData, error: erroDias } = await supabase
      .from('dias_ativos')
      .select('id')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .gte('data', dataInicio)
      .lte('data', dataFim)

    if (!erroDias && diasAtivosData) {
      diasAtivos = diasAtivosData.length
    } else {
      // Fallback: estimar dias ativos baseado em datas distintas de respostas
      const { data: datasDistintas } = await supabase
        .from('respostas')
        .select('criado_em')
        .eq('usuario_id', sessao.userId)
        .eq('componente', componente)
        .gte('criado_em', dataInicio)
        .lte('criado_em', dataFim + 'T23:59:59')

      if (datasDistintas) {
        const datasUnicas = new Set(
          datasDistintas.map(r => r.criado_em.split('T')[0])
        )
        diasAtivos = datasUnicas.size
      }
    }

    // Calcular notas
    const notas = calcularNotas(questoesTotal, questoesCorretas, diasAtivos)

    // Verificar se já existe registro de nota para este bimestre
    const { data: notaExistente } = await supabase
      .from('notas_bimestrais')
      .select('id')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .eq('ano', ano)
      .eq('bimestre', bimestre)
      .single()

    // Atualizar ou inserir nota
    const dadosNota = {
      usuario_id: sessao.userId,
      componente,
      ano,
      bimestre,
      questoes_total: questoesTotal,
      questoes_corretas: questoesCorretas,
      dias_ativos: diasAtivos,
      ...notas,
      status: 'em_andamento' as const,
      atualizado_em: new Date().toISOString(),
    }

    if (notaExistente) {
      await supabase
        .from('notas_bimestrais')
        .update(dadosNota)
        .eq('id', notaExistente.id)
    } else {
      await supabase.from('notas_bimestrais').insert(dadosNota)
    }

    // Buscar todas as notas do usuário para este componente
    const { data: historicoNotas } = await supabase
      .from('notas_bimestrais')
      .select('*')
      .eq('usuario_id', sessao.userId)
      .eq('componente', componente)
      .order('ano', { ascending: false })
      .order('bimestre', { ascending: false })

    return NextResponse.json({
      sucesso: true,
      bimestre_atual: {
        bimestre,
        ano,
        data_inicio: dataInicio,
        data_fim: dataFim,
        questoes_total: questoesTotal,
        questoes_corretas: questoesCorretas,
        dias_ativos: diasAtivos,
        ...notas,
        meta_questoes: NOTAS.META_QUESTOES_BIMESTRE,
        meta_dias: NOTAS.META_DIAS_BIMESTRE,
      },
      historico: historicoNotas || [],
    })
  } catch (error) {
    console.error('Erro ao calcular notas:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
