/**
 * Script para verificar e corrigir senhas de estudantes
 *
 * Verifica quais estudantes NÃO possuem a senha padrão @estudante
 * e oferece a opção de corrigir automaticamente.
 *
 * Executar com:
 *   npx tsx scripts/verificar-senhas-estudantes.ts          # Apenas verificar
 *   npx tsx scripts/verificar-senhas-estudantes.ts --fix     # Verificar e corrigir
 */

import { createClient } from '@supabase/supabase-js'
import * as bcrypt from 'bcryptjs'

// Configuração do Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE não configuradas')
  console.log('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const SENHA_PADRAO = '@estudante'
const FIX_MODE = process.argv.includes('--fix')

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  Verificação de Senhas - Estudantes')
  console.log('  Senha padrão esperada: @estudante')
  console.log(`  Modo: ${FIX_MODE ? 'VERIFICAR + CORRIGIR' : 'APENAS VERIFICAR'}`)
  console.log('═══════════════════════════════════════════════════════\n')

  // Buscar todos os estudantes (exceto contas de teste)
  const { data: estudantes, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, turma, senha_hash, senha_alterada')
    .eq('tipo', 'estudante')
    .eq('ativo', true)
    .order('turma')
    .order('nome')

  if (error) {
    console.error('❌ Erro ao buscar estudantes:', error.message)
    process.exit(1)
  }

  if (!estudantes || estudantes.length === 0) {
    console.log('Nenhum estudante encontrado.')
    return
  }

  console.log(`📋 Total de estudantes ativos: ${estudantes.length}\n`)
  console.log('Verificando senhas (bcrypt.compare)...\n')

  // Filtrar contas de teste (emails com "teste", "test", "admin")
  const estudantesReais = estudantes.filter(e => {
    const emailLower = (e.email || '').toLowerCase()
    return !emailLower.includes('teste') &&
           !emailLower.includes('test') &&
           !emailLower.includes('admin') &&
           !emailLower.includes('professor')
  })

  const estudantesTeste = estudantes.length - estudantesReais.length
  if (estudantesTeste > 0) {
    console.log(`⏭️  Ignorando ${estudantesTeste} conta(s) de teste/admin\n`)
  }

  const comSenhaPadrao: typeof estudantesReais = []
  const comSenhaDiferente: typeof estudantesReais = []
  const semHash: typeof estudantesReais = []

  // Verificar cada estudante
  for (let i = 0; i < estudantesReais.length; i++) {
    const e = estudantesReais[i]

    // Progresso a cada 50 alunos
    if ((i + 1) % 50 === 0 || i === 0) {
      process.stdout.write(`  Verificando ${i + 1}/${estudantesReais.length}...\r`)
    }

    if (!e.senha_hash) {
      semHash.push(e)
      continue
    }

    try {
      const match = await bcrypt.compare(SENHA_PADRAO, e.senha_hash)
      if (match) {
        comSenhaPadrao.push(e)
      } else {
        comSenhaDiferente.push(e)
      }
    } catch {
      // Hash inválido ou corrompido
      comSenhaDiferente.push(e)
    }
  }

  // Limpar linha de progresso
  process.stdout.write('                                          \r')

  // Relatório
  console.log('═══════════════════════════════════════════════════════')
  console.log('  RESULTADO')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`  ✅ Com senha @estudante:     ${comSenhaPadrao.length}`)
  console.log(`  ⚠️  Com senha DIFERENTE:     ${comSenhaDiferente.length}`)
  if (semHash.length > 0) {
    console.log(`  ❌ Sem hash de senha:        ${semHash.length}`)
  }
  console.log(`  ─────────────────────────────────────`)
  console.log(`  📊 Total verificado:         ${estudantesReais.length}`)
  console.log('═══════════════════════════════════════════════════════\n')

  // Listar estudantes com senha diferente
  if (comSenhaDiferente.length > 0) {
    console.log('⚠️  Estudantes com senha diferente de @estudante:\n')
    console.log('  Turma  | Nome                              | Email')
    console.log('  ───────┼───────────────────────────────────┼──────────────────────────')

    for (const e of comSenhaDiferente) {
      const turma = (e.turma || '??').padEnd(5)
      const nome = (e.nome || '???').substring(0, 33).padEnd(33)
      console.log(`  ${turma} | ${nome} | ${e.email || 'sem email'}`)
    }
    console.log()
  }

  if (semHash.length > 0) {
    console.log('❌ Estudantes sem hash de senha:\n')
    for (const e of semHash) {
      console.log(`  - ${e.nome} (${e.email}) - Turma ${e.turma}`)
    }
    console.log()
  }

  // Corrigir se --fix
  const precisaCorrigir = [...comSenhaDiferente, ...semHash]
  if (precisaCorrigir.length === 0) {
    console.log('🎉 Todos os estudantes já possuem a senha padrão @estudante!')
    return
  }

  if (!FIX_MODE) {
    console.log(`💡 Para corrigir ${precisaCorrigir.length} estudante(s), execute:`)
    console.log('   npx tsx scripts/verificar-senhas-estudantes.ts --fix\n')
    return
  }

  // Modo correção
  console.log(`🔧 Corrigindo ${precisaCorrigir.length} estudante(s)...\n`)

  const novaHash = await bcrypt.hash(SENHA_PADRAO, 12)
  let corrigidos = 0
  let erros = 0

  for (const e of precisaCorrigir) {
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        senha_hash: novaHash,
        senha_alterada: true,
      })
      .eq('id', e.id)

    if (updateError) {
      console.error(`  ❌ Erro ao corrigir ${e.nome}: ${updateError.message}`)
      erros++
    } else {
      console.log(`  ✅ ${e.nome} (${e.turma}) - senha atualizada`)
      corrigidos++
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════`)
  console.log(`  CORREÇÃO CONCLUÍDA`)
  console.log(`  ✅ Corrigidos: ${corrigidos}`)
  if (erros > 0) {
    console.log(`  ❌ Erros: ${erros}`)
  }
  console.log(`═══════════════════════════════════════════════════════\n`)
}

main().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
