const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function inspecionar() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           INSPEÇÃO COMPLETA DO BANCO DE DADOS                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // 1. Listar tabelas e contagem
  console.log('📊 CONTAGEM DE REGISTROS POR TABELA:\n');
  const tabelas = ['usuarios', 'questoes', 'respostas', 'conquistas', 'conquistas_usuarios', 'historico_chat'];

  for (const tabela of tabelas) {
    try {
      const { count, error } = await supabase.from(tabela).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`   ❌ ${tabela}: ERRO - ${error.message}`);
      } else {
        console.log(`   ✅ ${tabela}: ${count} registros`);
      }
    } catch (e) {
      console.log(`   ❌ ${tabela}: TABELA NÃO EXISTE`);
    }
  }

  // 2. Usuários
  console.log('\n\n👥 USUÁRIOS CADASTRADOS:\n');
  const { data: usuarios, error: errUsuarios } = await supabase
    .from('usuarios')
    .select('id, email, nome, tipo, turma, ano, nivel, componentes, ativo, fis_pontos, mat_pontos, fis_questoes_total, mat_questoes_total')
    .order('tipo', { ascending: false })
    .order('nome');

  if (errUsuarios) {
    console.log('   Erro:', errUsuarios.message);
  } else if (usuarios && usuarios.length > 0) {
    console.log('   ID | Email | Nome | Tipo | Turma | Componentes | Pontos Fis | Pontos Mat');
    console.log('   ' + '-'.repeat(90));
    usuarios.forEach(u => {
      console.log(`   ${u.id.slice(0,8)}... | ${u.email} | ${u.nome} | ${u.tipo} | ${u.turma} | ${u.componentes?.join(',')} | ${u.fis_pontos || 0} | ${u.mat_pontos || 0}`);
    });
  } else {
    console.log('   Nenhum usuário cadastrado');
  }

  // 3. Questões por componente e ano
  console.log('\n\n📝 QUESTÕES POR COMPONENTE E ANO:\n');
  const { data: questoes, error: errQuestoes } = await supabase
    .from('questoes')
    .select('componente, ano, dificuldade, status');

  if (errQuestoes) {
    console.log('   Erro:', errQuestoes.message);
  } else if (questoes && questoes.length > 0) {
    const stats = {};
    questoes.forEach(q => {
      const key = `${q.componente} - Ano ${q.ano}`;
      if (!stats[key]) {
        stats[key] = { total: 0, facil: 0, medio: 0, dificil: 0, ativas: 0 };
      }
      stats[key].total++;
      stats[key][q.dificuldade]++;
      if (q.status === 'ativa') stats[key].ativas++;
    });

    console.log('   Componente/Ano | Total | Fácil | Médio | Difícil | Ativas');
    console.log('   ' + '-'.repeat(65));
    Object.entries(stats).forEach(([key, val]) => {
      console.log(`   ${key.padEnd(20)} | ${String(val.total).padStart(5)} | ${String(val.facil).padStart(5)} | ${String(val.medio).padStart(5)} | ${String(val.dificil).padStart(7)} | ${String(val.ativas).padStart(6)}`);
    });
  } else {
    console.log('   Nenhuma questão cadastrada');
  }

  // 4. Conquistas
  console.log('\n\n🏆 CONQUISTAS CADASTRADAS:\n');
  const { data: conquistas, error: errConquistas } = await supabase
    .from('conquistas')
    .select('*')
    .order('requisito_tipo')
    .order('requisito_valor');

  if (errConquistas) {
    console.log('   Erro:', errConquistas.message);
  } else if (conquistas && conquistas.length > 0) {
    console.log(`   Total: ${conquistas.length} conquistas\n`);
    conquistas.forEach(c => {
      console.log(`   ${c.icone} ${c.nome} (${c.requisito_tipo}: ${c.requisito_valor}) - ${c.componente || 'Geral'}`);
    });
  } else {
    console.log('   Nenhuma conquista cadastrada');
  }

  // 5. Respostas
  console.log('\n\n📈 RESPOSTAS REGISTRADAS:\n');
  const { data: respostas, error: errRespostas } = await supabase
    .from('respostas')
    .select('usuario_id, componente, correta')
    .order('criado_em', { ascending: false });

  if (errRespostas) {
    console.log('   Erro:', errRespostas.message);
  } else if (respostas && respostas.length > 0) {
    const statsResp = { fisica: { total: 0, corretas: 0 }, matematica: { total: 0, corretas: 0 } };
    respostas.forEach(r => {
      if (statsResp[r.componente]) {
        statsResp[r.componente].total++;
        if (r.correta) statsResp[r.componente].corretas++;
      }
    });

    console.log(`   Física: ${statsResp.fisica.total} respostas (${statsResp.fisica.corretas} corretas - ${statsResp.fisica.total > 0 ? Math.round(statsResp.fisica.corretas/statsResp.fisica.total*100) : 0}%)`);
    console.log(`   Matemática: ${statsResp.matematica.total} respostas (${statsResp.matematica.corretas} corretas - ${statsResp.matematica.total > 0 ? Math.round(statsResp.matematica.corretas/statsResp.matematica.total*100) : 0}%)`);
  } else {
    console.log('   Nenhuma resposta registrada');
  }

  // 6. Conquistas desbloqueadas
  console.log('\n\n🎖️ CONQUISTAS DESBLOQUEADAS:\n');
  const { data: conquistasUsuarios, error: errCU } = await supabase
    .from('conquistas_usuarios')
    .select('*, conquistas(nome, icone), usuarios(nome)')
    .order('desbloqueada_em', { ascending: false })
    .limit(20);

  if (errCU) {
    console.log('   Erro:', errCU.message);
  } else if (conquistasUsuarios && conquistasUsuarios.length > 0) {
    conquistasUsuarios.forEach(cu => {
      console.log(`   ${cu.conquistas?.icone} ${cu.usuarios?.nome} desbloqueou "${cu.conquistas?.nome}" em ${cu.componente}`);
    });
  } else {
    console.log('   Nenhuma conquista desbloqueada');
  }

  // 7. Histórico de Chat
  console.log('\n\n💬 HISTÓRICO DE CHAT (últimos 10):\n');
  const { data: chats, error: errChats } = await supabase
    .from('historico_chat')
    .select('*, usuarios(nome)')
    .order('criado_em', { ascending: false })
    .limit(10);

  if (errChats) {
    console.log('   Erro:', errChats.message);
  } else if (chats && chats.length > 0) {
    chats.forEach(c => {
      const msg = c.content.length > 50 ? c.content.slice(0, 50) + '...' : c.content;
      console.log(`   [${c.componente}] ${c.usuarios?.nome} (${c.role}): ${msg}`);
    });
  } else {
    console.log('   Nenhum histórico de chat');
  }

  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    FIM DA INSPEÇÃO                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

inspecionar().catch(err => {
  console.error('Erro fatal:', err.message);
  process.exit(1);
});
