/**
 * Script para migrar estudantes existentes para o novo formato:
 * - Email: primeironome.ultimonome@turma
 * - Senha: @estudante
 *
 * Executar com: npx tsx scripts/migrar-estudantes.ts
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

// Senha padrão para todos os estudantes
const SENHA_PADRAO = '@estudante'

// Função para normalizar texto (remover acentos e caracteres especiais)
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
}

// Função para gerar email no novo formato
function gerarEmailEstudante(nome: string, turma: string): string {
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
  const turmaNormalizada = turma.toLowerCase()

  return `${nomeEmail}@${turmaNormalizada}`
}

async function migrarEstudantes() {
  console.log('🔄 Iniciando migração de estudantes...\n')

  // 1. Buscar todos os estudantes
  const { data: estudantes, error } = await supabase
    .from('usuarios')
    .select('id, email, nome, turma')
    .eq('tipo', 'estudante')
    .eq('ativo', true)
    .order('nome')

  if (error) {
    console.error('❌ Erro ao buscar estudantes:', error.message)
    process.exit(1)
  }

  if (!estudantes || estudantes.length === 0) {
    console.log('ℹ️  Nenhum estudante encontrado para migrar')
    return
  }

  console.log(`📋 Encontrados ${estudantes.length} estudantes\n`)

  // 2. Gerar hash da senha padrão (uma vez só)
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10)

  // 3. Processar cada estudante
  let atualizados = 0
  let semMudanca = 0
  let erros = 0

  console.log('Nome'.padEnd(35) + 'Email Antigo'.padEnd(30) + 'Email Novo')
  console.log('─'.repeat(95))

  for (const estudante of estudantes) {
    const novoEmail = gerarEmailEstudante(estudante.nome, estudante.turma)

    // Verificar se precisa atualizar
    if (estudante.email === novoEmail) {
      semMudanca++
      continue
    }

    // Verificar se o novo email já existe (conflito)
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', novoEmail)
      .neq('id', estudante.id)
      .single()

    if (existente) {
      console.log(`⚠️  ${estudante.nome.padEnd(35)} CONFLITO: ${novoEmail} já existe`)
      erros++
      continue
    }

    // Atualizar estudante
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        email: novoEmail,
        senha_hash: senhaHash,
        senha_alterada: false, // Marcar para trocar senha no próximo login
      })
      .eq('id', estudante.id)

    if (updateError) {
      console.log(`❌  ${estudante.nome.padEnd(35)} ERRO: ${updateError.message}`)
      erros++
    } else {
      console.log(`✅  ${estudante.nome.substring(0, 33).padEnd(35)} ${estudante.email.padEnd(30)} → ${novoEmail}`)
      atualizados++
    }
  }

  // 4. Resumo
  console.log('\n' + '═'.repeat(95))
  console.log('📊 RESUMO DA MIGRAÇÃO')
  console.log('═'.repeat(95))
  console.log(`   Total de estudantes: ${estudantes.length}`)
  console.log(`   ✅ Atualizados: ${atualizados}`)
  console.log(`   ⏭️  Sem mudança: ${semMudanca}`)
  console.log(`   ❌ Erros/Conflitos: ${erros}`)
  console.log('')
  console.log(`   📧 Novo formato de email: primeironome.ultimonome@turma`)
  console.log(`   🔑 Senha padrão: ${SENHA_PADRAO}`)
  console.log('═'.repeat(95))
}

// Executar
migrarEstudantes()
  .then(() => {
    console.log('\n✅ Migração concluída!')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Erro fatal:', err)
    process.exit(1)
  })
