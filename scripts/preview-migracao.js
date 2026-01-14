/**
 * Script para visualizar estudantes e preview da migração
 * Executar com: node scripts/preview-migracao.js
 */

// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('❌ Variáveis SUPABASE não encontradas')
  console.log('')
  console.log('Crie o arquivo .env.local com:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=sua_url')
  console.log('SUPABASE_SERVICE_ROLE_KEY=sua_key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Função para normalizar texto
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// Função para gerar email no novo formato
function gerarEmailEstudante(nome, turma) {
  const preposicoes = ['da', 'de', 'do', 'das', 'dos', 'e']
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter(p => !preposicoes.includes(p.toLowerCase()))
    .map(p => normalizarTexto(p))
    .filter(p => p.length > 0)

  const primeiroNome = partes[0] || ''
  const ultimoNome = partes.length > 1 ? partes[partes.length - 1] : ''

  const nomeEmail = ultimoNome ? `${primeiroNome}.${ultimoNome}` : primeiroNome
  return `${nomeEmail}@${turma.toLowerCase()}`
}

async function main() {
  console.log('📋 Consultando estudantes no banco...\n')

  const { data: estudantes, error } = await supabase
    .from('usuarios')
    .select('id, email, nome, turma')
    .eq('tipo', 'estudante')
    .eq('ativo', true)
    .order('nome')

  if (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  }

  if (!estudantes || estudantes.length === 0) {
    console.log('ℹ️  Nenhum estudante encontrado no banco')
    return
  }

  console.log(`Total: ${estudantes.length} estudantes\n`)
  console.log('═'.repeat(100))
  console.log('NOME'.padEnd(35) + 'TURMA'.padEnd(8) + 'EMAIL ATUAL'.padEnd(28) + 'EMAIL NOVO'.padEnd(28))
  console.log('═'.repeat(100))

  let precisamAtualizar = 0
  let jaCorretos = 0

  for (const e of estudantes) {
    const novoEmail = gerarEmailEstudante(e.nome, e.turma)
    const precisa = e.email !== novoEmail

    if (precisa) {
      precisamAtualizar++
      console.log(
        `${e.nome.substring(0, 33).padEnd(35)}` +
        `${e.turma.padEnd(8)}` +
        `${e.email.padEnd(28)}` +
        `→ ${novoEmail}`
      )
    } else {
      jaCorretos++
    }
  }

  console.log('═'.repeat(100))
  console.log('')
  console.log('📊 RESUMO:')
  console.log(`   Total de estudantes: ${estudantes.length}`)
  console.log(`   ✅ Já estão corretos: ${jaCorretos}`)
  console.log(`   🔄 Precisam atualizar: ${precisamAtualizar}`)
  console.log('')
  console.log('📧 Novo formato: primeironome.ultimonome@turma')
  console.log('🔑 Senha padrão: @estudante')
  console.log('')

  if (precisamAtualizar > 0) {
    console.log('Para aplicar a migração, acesse como professor:')
    console.log('POST /api/admin/migrar-estudantes')
  }
}

main().catch(console.error)
