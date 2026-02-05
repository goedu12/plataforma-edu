export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// Gerar senha aleatória de 6 caracteres
function gerarSenhaTemporaria(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'
  let senha = ''
  for (let i = 0; i < 6; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

// Gerar email a partir do nome e turma
function gerarEmail(nome: string, turma: string): string {
  const primeiroNome = nome.split(' ')[0].toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const ultimoNome = nome.split(' ').pop()?.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') || ''
  return `${primeiroNome}.${ultimoNome}@${turma.toLowerCase()}`
}

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

    // Remover senha_hash
    const alunosSemSenha = alunos.map(({ senha_hash, ...aluno }) => aluno)

    // Obter lista de turmas únicas
    const turmas = [...new Set(alunos.map(a => a.turma))].sort()

    return NextResponse.json({
      sucesso: true,
      alunos: alunosSemSenha,
      turmas,
      total: alunos.length,
    })
  } catch (error) {
    console.error('Erro ao buscar alunos:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo estudante
export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nome, turma, colegio, componentes } = body

    // Validações
    if (!nome || nome.trim().length < 3) {
      return NextResponse.json(
        { sucesso: false, erro: 'Nome deve ter pelo menos 3 caracteres' },
        { status: 400 }
      )
    }

    if (!turma || turma.trim().length === 0) {
      return NextResponse.json(
        { sucesso: false, erro: 'Turma é obrigatória' },
        { status: 400 }
      )
    }

    if (!componentes || componentes.length === 0) {
      return NextResponse.json(
        { sucesso: false, erro: 'Selecione pelo menos um componente' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Gerar email e senha
    const email = gerarEmail(nome.trim(), turma.trim())
    const senhaTemporaria = gerarSenhaTemporaria()
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10)

    // Verificar se email já existe
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single()

    if (existente) {
      return NextResponse.json(
        { sucesso: false, erro: `Email ${email} já existe. Tente adicionar um sobrenome diferente.` },
        { status: 400 }
      )
    }

    // Criar usuário
    const { data: novoAluno, error } = await supabase
      .from('usuarios')
      .insert({
        nome: nome.trim(),
        email,
        turma: turma.trim().toUpperCase(),
        colegio: colegio?.trim() || null,
        componentes,
        tipo: 'estudante',
        senha_hash: senhaHash,
        ativo: true,
        fis_pontos: 0,
        mat_pontos: 0,
        criado_em: new Date().toISOString(),
      })
      .select('id, nome, email, turma, colegio, componentes')
      .single()

    if (error) {
      console.error('Erro ao criar aluno:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao criar estudante' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      aluno: novoAluno,
      senha_temporaria: senhaTemporaria,
      mensagem: `Estudante ${nome} criado com sucesso!`,
    })
  } catch (error) {
    console.error('Erro ao criar aluno:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
