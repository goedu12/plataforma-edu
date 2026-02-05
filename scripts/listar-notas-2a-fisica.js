/**
 * Script para Listar Notas - Turma 2A Física
 * Colégio Estadual Cora Coralina
 *
 * Executar com: node scripts/listar-notas-2a-fisica.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE não configuradas');
  console.log('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function listarNotas() {
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('  NOTAS - TURMA 2A - FÍSICA');
  console.log('  Colégio Estadual Cora Coralina');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  // Buscar estudantes da turma 2A do Cora Coralina com física
  const { data: estudantes, error: estudantesError } = await supabase
    .from('usuarios')
    .select('id, nome, email')
    .eq('turma', '2A')
    .eq('colegio', 'Cora Coralina')
    .contains('componentes', ['fisica'])
    .order('nome');

  if (estudantesError) {
    console.error('❌ Erro ao buscar estudantes:', estudantesError.message);
    process.exit(1);
  }

  if (!estudantes || estudantes.length === 0) {
    console.log('⚠️ Nenhum estudante encontrado na turma 2A de física do Cora Coralina');
    process.exit(0);
  }

  console.log('📊 Total de estudantes: ' + estudantes.length);
  console.log('');

  // Buscar notas de todos os bimestres
  const { data: notas, error: notasError } = await supabase
    .from('notas_2025')
    .select('*')
    .eq('componente', 'fisica')
    .in('usuario_id', estudantes.map(e => e.id))
    .order('bimestre');

  if (notasError) {
    console.error('❌ Erro ao buscar notas:', notasError.message);
    process.exit(1);
  }

  // Organizar notas por estudante
  const notasPorEstudante = new Map();
  for (const nota of notas || []) {
    if (!notasPorEstudante.has(nota.usuario_id)) {
      notasPorEstudante.set(nota.usuario_id, new Map());
    }
    notasPorEstudante.get(nota.usuario_id).set(nota.bimestre, nota);
  }

  // Exibir tabela de notas
  console.log('┌────────────────────────────────────────────────────────┬────────┬────────┬────────┬────────┐');
  console.log('│ Nome do Estudante                                      │  B1    │  B2    │  B3    │  B4    │');
  console.log('├────────────────────────────────────────────────────────┼────────┼────────┼────────┼────────┤');

  const formatNota = (nota) => {
    if (nota === '-' || nota === null || nota === undefined) return '   -   ';
    return ' ' + Number(nota).toFixed(1).padStart(5) + ' ';
  };

  for (const estudante of estudantes) {
    const notasEstudante = notasPorEstudante.get(estudante.id);
    const b1 = notasEstudante?.get(1)?.nota_final ?? '-';
    const b2 = notasEstudante?.get(2)?.nota_final ?? '-';
    const b3 = notasEstudante?.get(3)?.nota_final ?? '-';
    const b4 = notasEstudante?.get(4)?.nota_final ?? '-';
    const nomeFormatado = estudante.nome.substring(0, 54).padEnd(54);
    console.log('│ ' + nomeFormatado + ' │' + formatNota(b1) + '│' + formatNota(b2) + '│' + formatNota(b3) + '│' + formatNota(b4) + '│');
  }

  console.log('└────────────────────────────────────────────────────────┴────────┴────────┴────────┴────────┘');
  console.log('');

  // Estatísticas por bimestre
  const bimestres = [1, 2, 3, 4];
  for (const bim of bimestres) {
    const notasBim = (notas || []).filter(n => n.bimestre === bim);
    if (notasBim.length === 0) continue;

    const notasFinais = notasBim.map(n => n.nota_final).filter(n => n !== null && n !== undefined);
    if (notasFinais.length > 0) {
      const media = notasFinais.reduce((a, b) => a + b, 0) / notasFinais.length;
      const max = Math.max(...notasFinais);
      const min = Math.min(...notasFinais);
      const aprovados = notasBim.filter(n => n.status === 'aprovado').length;
      const recuperacao = notasBim.filter(n => n.status === 'recuperacao').length;
      const emAndamento = notasBim.filter(n => n.status === 'em_andamento').length;

      console.log('📊 Estatísticas ' + bim + 'º Bimestre:');
      console.log('   Média: ' + media.toFixed(2) + ' | Máxima: ' + max.toFixed(1) + ' | Mínima: ' + min.toFixed(1));
      console.log('   Aprovados: ' + aprovados + ' | Recuperação: ' + recuperacao + ' | Em andamento: ' + emAndamento);
      console.log('');
    }
  }

  // Estudantes sem notas
  const semNota = estudantes.filter(e => !notasPorEstudante.has(e.id) || notasPorEstudante.get(e.id).size === 0);
  if (semNota.length > 0) {
    console.log('⚠️ Estudantes sem notas registradas:');
    for (const e of semNota) {
      console.log('   - ' + e.nome);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('  CONSULTA CONCLUÍDA');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
}

listarNotas()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Erro fatal:', e);
    process.exit(1);
  });
