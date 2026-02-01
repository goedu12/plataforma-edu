export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao, hashSenha, validarTurma, validarComponenteNivel } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { gerarEmailEstudante } from '@/lib/utils'

// Senha padrão para novos estudantes
const SENHA_PADRAO = '@estudante'

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

    // Filtrar apenas turmas do ensino médio (1x, 2x, 3x)
    const isTurmaEM = (t: string) => /^[123]/.test(t)
    const alunosFiltrados = alunosSemSenha.filter(a => isTurmaEM(a.turma))

    // Obter lista de turmas únicas (apenas EM)
    const turmas = [...new Set(alunosFiltrados.map(a => a.turma))].sort()

    return NextResponse.json({
      sucesso: true,
      alunos: alunosFiltrados,
      turmas,
      total: alunosFiltrados.length,
    })
  } catch (error) {
    console.error('Erro ao buscar alunos:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════
// POST: Cadastrar aluno individualmente
// ═══════════════════════════════════════════════════════════
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
    const { nome, turma, componentes, colegio } = body as {
      nome?: string
      turma?: string
      componentes?: string[]
      colegio?: string
    }

    // Validações
    if (!nome?.trim()) {
      return NextResponse.json(
        { sucesso: false, erro: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!turma?.trim()) {
      return NextResponse.json(
        { sucesso: false, erro: 'Turma é obrigatória' },
        { status: 400 }
      )
    }

    if (!componentes || componentes.length === 0) {
      return NextResponse.json(
        { sucesso: false, erro: 'Selecione ao menos um componente' },
        { status: 400 }
      )
    }

    const turmaUpper = turma.trim().toUpperCase()
    const validacao = validarTurma(turmaUpper)
    if (!validacao.valida) {
      return NextResponse.json(
        { sucesso: false, erro: validacao.erro || 'Turma inválida' },
        { status: 400 }
      )
    }

    // Validar componentes para o nível
    for (const comp of componentes as string[]) {
      if (!['fisica', 'matematica'].includes(comp)) {
        return NextResponse.json(
          { sucesso: false, erro: `Componente inválido: ${comp}` },
          { status: 400 }
        )
      }
      if (!validarComponenteNivel(comp as 'fisica' | 'matematica', validacao.nivel!)) {
        return NextResponse.json(
          { sucesso: false, erro: 'Física disponível apenas para Ensino Médio' },
          { status: 400 }
        )
      }
    }

    const email = gerarEmailEstudante(nome.trim(), turmaUpper)
    const supabase = getSupabaseAdmin()

    // Verificar se já existe
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id, componentes')
      .eq('email', email)
      .single()

    if (existente) {
      // Atualizar componentes se necessário
      const componentesAtuais = existente.componentes || []
      const novos = componentes.filter((c: string) => !componentesAtuais.includes(c))

      if (novos.length === 0) {
        return NextResponse.json(
          { sucesso: false, erro: 'Aluno já cadastrado com esses componentes' },
          { status: 409 }
        )
      }

      const componentesUnicos = [...new Set([...componentesAtuais, ...componentes])]
      await supabase
        .from('usuarios')
        .update({ componentes: componentesUnicos })
        .eq('id', existente.id)

      return NextResponse.json({
        sucesso: true,
        mensagem: `Componentes atualizados para ${nome.trim()}`,
        email,
        atualizado: true,
      })
    }

    // Criar novo aluno
    const senhaHash = await hashSenha(SENHA_PADRAO)

    const { error } = await supabase.from('usuarios').insert({
      email,
      senha_hash: senhaHash,
      nome: nome.trim(),
      turma: turmaUpper,
      colegio: colegio?.trim() || null,
      ano: validacao.ano!,
      nivel: validacao.nivel!,
      componentes,
      tipo: 'estudante',
      senha_alterada: false,
    })

    if (error) {
      console.error('Erro ao criar aluno:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao salvar no banco de dados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: `Aluno ${nome.trim()} cadastrado com sucesso`,
      email,
      senha: SENHA_PADRAO,
      atualizado: false,
    })
  } catch (error) {
    console.error('Erro ao cadastrar aluno:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
