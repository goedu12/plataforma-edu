/**
 * Script para Listar Notas - Turma 2A Física
 * Colégio Estadual Cora Coralina
 *
 * Executar com: npx ts-node scripts/listar-notas-2a-fisica.ts
 */

import { createClient } from '@supabase/supabase-js'

// Configuração Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE não configuradas')
  console.log('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface NotaEstudante {
  nome: string
  email: string
  bimestre: number
  questoes_respondidas: number
  meta_questoes: number
  nota_acertos: number
  nota_tempo: number
  nota_final: number
  status: string
}

async function listarNotas(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════════════════════')
  console.log('  NOTAS - TURMA 2A - FÍSICA')
  console.log('  Colégio Estadual Cora Coralina')
  console.log('═══════════════════════════════════════════════════════════════════════════════')
  console.log('')

  // Buscar estudantes da turma 2A do Cora Coralina com física
  const { data: estudantes, error: estudantesError } = await supabase
    .from('usuarios')
    .select('id, nome, email')
    .eq('turma', '2A')
    .eq('colegio', 'Cora Coralina')
    .contains('componentes', ['fisica'])
    .order('nome')

  if (estudantesError) {
    console.error('❌ Erro ao buscar estudantes:', estudantesError.message)
    process.exit(1)
  }

  if (!estudantes || estudantes.length === 0) {
    console.log('⚠️ Nenhum estudante encontrado na turma 2A de física do Cora Coralina')
    process.exit(0)
  }

  console.log(`📊 Total de estudantes: ${estudantes.length}`)
  console.log('')

  // Buscar notas de todos os bimestres
  const { data: notas, error: notasError } = await supabase
    .from('notas_2025')
    .select('*')
    .eq('componente', 'fisica')
    .in('usuario_id', estudantes.map(e => e.id))
    .order('bimestre')

  if (notasError) {
    console.error('❌ Erro ao buscar notas:', notasError.message)
    process.exit(1)
  }

  // Organizar notas por estudante
  const notasPorEstudante = new Map<string, Map<number, any>>()

  for (const nota of notas || []) {
    if (!notasPorEstudante.has(nota.usuario_id)) {
      notasPorEstudante.set(nota.usuario_id, new Map())
    }
    notasPorEstudante.get(nota.usuario_id)!.set(nota.bimestre, nota)
  }

  // Exibir tabela de notas
  console.log('┌────────────────────────────────────────────────────────┬────────┬────────┬────────┬────────┐')
  console.log('│ Nome do Estudante                                      │  B1    │  B2    │  B3    │  B4    │')
  console.log('├────────────────────────────────────────────────────────┼────────┼────────┼────────┼────────┤')

  for (const estudante of estudantes) {
    const notasEstudante = notasPorEstudante.get(estudante.id)

    const b1 = notasEstudante?.get(1)?.nota_final ?? '-'
    const b2 = notasEstudante?.get(2)?.nota_final ?? '-'
    const b3 = notasEstudante?.get(3)?.nota_final ?? '-'
    const b4 = notasEstudante?.get(4)?.nota_final ?? '-'

    const formatNota = (nota: number | string) => {
      if (nota === '-') return '   -   '
      return ` ${Number(nota).toFixed(1).padStart(5)} `
    }

    const nomeFormatado = estudante.nome.substring(0, 54).padEnd(54)

    console.log(`│ ${nomeFormatado} │${formatNota(b1)}│${formatNota(b2)}│${formatNota(b3)}│${formatNota(b4)}│`)
  }

  console.log('└────────────────────────────────────────────────────────┴────────┴────────┴────────┴────────┘')
  console.log('')

  // Exibir detalhes por bimestre
  for (let bimestre = 1; bimestre <= 4; bimestre++) {
    const notasBimestre = (notas || []).filter(n => n.bimestre === bimestre)

    if (notasBimestre.length === 0) continue

    console.log(`═══════════════════════════════════════════════════════════════════════════════`)
    console.log(`  ${bimestre}º BIMESTRE - DETALHES`)
    console.log(`═══════════════════════════════════════════════════════════════════════════════`)
    console.log('')
    console.log('┌────────────────────────────────────────┬────────┬────────┬────────┬────────┬────────────────┐')
    console.log('│ Nome                                   │ Acertos│ Tempo  │ Final  │ Quest. │ Status         │')
    console.log('├────────────────────────────────────────┼────────┼────────┼────────┼────────┼────────────────┤')

    for (const estudante of estudantes) {
      const nota = notasPorEstudante.get(estudante.id)?.get(bimestre)

      if (!nota) continue

      const nomeFormatado = estudante.nome.substring(0, 38).padEnd(38)
      const acertos = nota.nota_acertos?.toFixed(1).padStart(6) || '   -  '
      const tempo = nota.nota_tempo?.toFixed(1).padStart(6) || '   -  '
      const final = nota.nota_final?.toFixed(1).padStart(6) || '   -  '
      const questoes = `${nota.questoes_respondidas || 0}/${nota.meta_questoes || 0}`.padStart(6)
      const status = (nota.status || '-').padEnd(14)

      console.log(`│ ${nomeFormatado} │ ${acertos} │ ${tempo} │ ${final} │ ${questoes} │ ${status} │`)
    }

    console.log('└────────────────────────────────────────┴────────┴────────┴────────┴────────┴────────────────┘')
    console.log('')

    // Estatísticas do bimestre
    const notasFinais = notasBimestre.map(n => n.nota_final).filter(n => n !== null && n !== undefined)
    if (notasFinais.length > 0) {
      const media = notasFinais.reduce((a, b) => a + b, 0) / notasFinais.length
      const max = Math.max(...notasFinais)
      const min = Math.min(...notasFinais)
      const aprovados = notasBimestre.filter(n => n.status === 'aprovado').length
      const recuperacao = notasBimestre.filter(n => n.status === 'recuperacao').length
      const emAndamento = notasBimestre.filter(n => n.status === 'em_andamento').length

      console.log(`📊 Estatísticas ${bimestre}º Bimestre:`)
      console.log(`   Média da turma: ${media.toFixed(2)}`)
      console.log(`   Nota máxima: ${max.toFixed(1)}`)
      console.log(`   Nota mínima: ${min.toFixed(1)}`)
      console.log(`   Aprovados: ${aprovados} | Recuperação: ${recuperacao} | Em andamento: ${emAndamento}`)
      console.log('')
    }
  }

  // Estudantes sem notas
  const estudantesSemNota = estudantes.filter(e => !notasPorEstudante.has(e.id) || notasPorEstudante.get(e.id)!.size === 0)

  if (estudantesSemNota.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════════════════════')
    console.log('  ESTUDANTES SEM NOTAS REGISTRADAS')
    console.log('═══════════════════════════════════════════════════════════════════════════════')
    console.log('')

    for (const estudante of estudantesSemNota) {
      console.log(`   - ${estudante.nome}`)
    }
    console.log('')
  }

  console.log('═══════════════════════════════════════════════════════════════════════════════')
  console.log('  CONSULTA CONCLUÍDA')
  console.log('═══════════════════════════════════════════════════════════════════════════════')
}

// Executar
listarNotas()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })
