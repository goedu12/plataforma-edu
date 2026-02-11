export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getPeriodoAtual, calcularNotaNova } from '@/lib/sistema-notas'
import { hashSenha } from '@/lib/auth'
import type { Componente } from '@/types'

// Senha padrão para todos os estudantes
const SENHA_PADRAO_ESTUDANTE = '@estudante'

// Constantes para cálculo de nota
const VALOR_ACERTO_ESTUDO = 0.04
const VALOR_ACERTO_REVISAO = 0.02
const VALOR_ACERTO_DESAFIO = 0.01

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

    // Determinar período atual
    const ano = new Date().getFullYear()
    const periodo = getPeriodoAtual(ano)
    const bimestreAtual = periodo?.bimestre || 1

    // Determinar datas do período para buscar respostas
    const dataInicio = periodo?.config?.regular?.inicio || `${ano}-01-01`
    const dataFim = periodo?.config?.regular?.fim || `${ano}-12-31`

    const alunoIds = alunos.map(a => a.id)

    // Buscar notas da tabela notas_2025 (pode ter dados de 2025 ou 2026)
    const { data: notasAtuais } = await supabase
      .from('notas_2025')
      .select('usuario_id, componente, nota_final, nota_acertos, nota_tempo, status, questoes_respondidas, meta_questoes, ano_letivo, bimestre')
      .in('usuario_id', alunoIds)
      .eq('bimestre', bimestreAtual)
      .order('ano_letivo', { ascending: false })

    // Buscar respostas do período atual para calcular nota em tempo real
    const { data: respostas } = await supabase
      .from('respostas')
      .select('usuario_id, componente, modo, correta, criado_em')
      .in('usuario_id', alunoIds)
      .gte('criado_em', dataInicio)
      .lte('criado_em', dataFim + 'T23:59:59')

    // Buscar tempo de uso do período
    const { data: tempoUso } = await supabase
      .from('tempo_uso')
      .select('usuario_id, componente, minutos')
      .in('usuario_id', alunoIds)
      .gte('data', dataInicio)
      .lte('data', dataFim)

    // Criar mapa de notas da tabela notas_2025
    const notasPorAluno = new Map<string, Map<string, {
      nota_final: number;
      nota_acertos: number;
      nota_tempo: number;
      status: string;
      questoes_respondidas: number;
      meta_questoes: number
    }>>()

    notasAtuais?.forEach(n => {
      if (!notasPorAluno.has(n.usuario_id)) {
        notasPorAluno.set(n.usuario_id, new Map())
      }
      // Só sobrescreve se não existir (pega o mais recente por causa do order)
      if (!notasPorAluno.get(n.usuario_id)!.has(n.componente)) {
        notasPorAluno.get(n.usuario_id)!.set(n.componente, {
          nota_final: n.nota_final,
          nota_acertos: n.nota_acertos || 0,
          nota_tempo: n.nota_tempo || 0,
          status: n.status,
          questoes_respondidas: n.questoes_respondidas,
          meta_questoes: n.meta_questoes,
        })
      }
    })

    // Calcular notas em tempo real baseado nas respostas (para quem não tem registro)
    const notasCalculadas = new Map<string, Map<string, {
      nota_final: number;
      nota_acertos: number;
      nota_tempo: number;
      acertos_estudo: number;
      acertos_revisao: number;
      acertos_desafio: number;
      total_questoes: number;
    }>>()

    // Agrupar respostas por usuário e componente
    respostas?.forEach(r => {
      if (!notasCalculadas.has(r.usuario_id)) {
        notasCalculadas.set(r.usuario_id, new Map())
      }
      if (!notasCalculadas.get(r.usuario_id)!.has(r.componente)) {
        notasCalculadas.get(r.usuario_id)!.set(r.componente, {
          nota_final: 0,
          nota_acertos: 0,
          nota_tempo: 0,
          acertos_estudo: 0,
          acertos_revisao: 0,
          acertos_desafio: 0,
          total_questoes: 0,
        })
      }

      const dados = notasCalculadas.get(r.usuario_id)!.get(r.componente)!
      dados.total_questoes++

      if (r.correta) {
        if (r.modo === 'estudo') dados.acertos_estudo++
        else if (r.modo === 'revisao') dados.acertos_revisao++
        else if (r.modo === 'desafio') dados.acertos_desafio++
      }
    })

    // Agrupar tempo de uso por usuário e componente
    const tempoPorAluno = new Map<string, Map<string, number>>()
    tempoUso?.forEach(t => {
      if (!tempoPorAluno.has(t.usuario_id)) {
        tempoPorAluno.set(t.usuario_id, new Map())
      }
      const atual = tempoPorAluno.get(t.usuario_id)!.get(t.componente) || 0
      tempoPorAluno.get(t.usuario_id)!.set(t.componente, atual + (t.minutos || 0))
    })

    // Calcular notas para cada aluno/componente
    notasCalculadas.forEach((componentes, usuarioId) => {
      componentes.forEach((dados, componente) => {
        const tempoMinutos = tempoPorAluno.get(usuarioId)?.get(componente) || 0
        const tempoHoras = tempoMinutos / 60

        const resultado = calcularNotaNova(
          dados.acertos_estudo,
          dados.acertos_revisao,
          dados.acertos_desafio,
          tempoHoras
        )

        dados.nota_acertos = resultado.notaAcertos
        dados.nota_tempo = resultado.notaTempo
        dados.nota_final = resultado.notaFinal
      })
    })

    // Remover senha_hash e adicionar informações de nota e atividade
    const alunosSemSenha = alunos.map(({ senha_hash, ...aluno }) => {
      const notasTabela = notasPorAluno.get(aluno.id)
      const notasCalc = notasCalculadas.get(aluno.id)

      // Calcular dias sem atividade
      let diasSemAtividade: number | null = null
      let nuncaLogou = false

      const ultimoAcesso = aluno.ultimo_acesso
      const fisUltimoEstudo = aluno.fis_ultimo_estudo
      const matUltimoEstudo = aluno.mat_ultimo_estudo

      const datas = [ultimoAcesso, fisUltimoEstudo, matUltimoEstudo].filter(d => d != null)

      if (datas.length === 0) {
        nuncaLogou = true
      } else {
        const ultimaAtividade = new Date(Math.max(...datas.map(d => new Date(d).getTime())))
        const agora = new Date()
        diasSemAtividade = Math.floor((agora.getTime() - ultimaAtividade.getTime()) / (1000 * 60 * 60 * 24))
      }

      // Pegar nota da tabela ou calcular em tempo real
      // Prioridade: tabela notas_2025 > cálculo em tempo real > 0
      const fisNotaTabela = notasTabela?.get('fisica')
      const fisNotaCalc = notasCalc?.get('fisica')
      const matNotaTabela = notasTabela?.get('matematica')
      const matNotaCalc = notasCalc?.get('matematica')

      // Para física
      let fisNotaAtual: number | null = null
      let fisStatusNota: string | null = null
      if (aluno.componentes?.includes('fisica')) {
        if (fisNotaTabela) {
          fisNotaAtual = fisNotaTabela.nota_final
          fisStatusNota = fisNotaTabela.status
        } else if (fisNotaCalc && fisNotaCalc.total_questoes > 0) {
          fisNotaAtual = fisNotaCalc.nota_final
          fisStatusNota = 'em_andamento'
        } else {
          fisNotaAtual = 0
          fisStatusNota = 'em_andamento'
        }
      }

      // Para matemática
      let matNotaAtual: number | null = null
      let matStatusNota: string | null = null
      if (aluno.componentes?.includes('matematica')) {
        if (matNotaTabela) {
          matNotaAtual = matNotaTabela.nota_final
          matStatusNota = matNotaTabela.status
        } else if (matNotaCalc && matNotaCalc.total_questoes > 0) {
          matNotaAtual = matNotaCalc.nota_final
          matStatusNota = 'em_andamento'
        } else {
          matNotaAtual = 0
          matStatusNota = 'em_andamento'
        }
      }

      return {
        ...aluno,
        // Notas do bimestre atual (prioriza tabela, depois cálculo, depois 0)
        fis_nota_atual: fisNotaAtual,
        fis_status_nota: fisStatusNota,
        mat_nota_atual: matNotaAtual,
        mat_status_nota: matStatusNota,
        // Informações de atividade
        nunca_logou: nuncaLogou,
        dias_sem_atividade: diasSemAtividade,
      }
    })

    // Obter lista de turmas únicas
    const turmas = [...new Set(alunos.map(a => a.turma))].sort()

    return NextResponse.json({
      sucesso: true,
      alunos: alunosSemSenha,
      turmas,
      total: alunos.length,
      bimestre_atual: bimestreAtual,
      ano_letivo: ano,
      periodo_inicio: dataInicio,
      periodo_fim: dataFim,
    })
  } catch (error) {
    console.error('Erro ao buscar alunos:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Gerar email a partir do nome e turma (quando não fornecido)
function gerarEmailAutomatico(nome: string, turma: string): string {
  const primeiroNome = nome.split(' ')[0].toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const ultimoNome = nome.split(' ').pop()?.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') || ''
  return `${primeiroNome}.${ultimoNome}@${turma.toLowerCase()}`
}

// POST: Cadastrar novo estudante
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
    const { nome, turma, colegio, ano, componentes } = body
    let { email } = body

    // Validações
    if (!nome || !nome.trim()) {
      return NextResponse.json(
        { sucesso: false, erro: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!turma || !turma.trim()) {
      return NextResponse.json(
        { sucesso: false, erro: 'Turma é obrigatória' },
        { status: 400 }
      )
    }

    // Gerar email automaticamente se não fornecido
    if (!email || !email.trim()) {
      email = gerarEmailAutomatico(nome.trim(), turma.trim())
    } else {
      // Validar formato do email se fornecido
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { sucesso: false, erro: 'Formato de email inválido' },
          { status: 400 }
        )
      }
    }

    if (!componentes || !Array.isArray(componentes) || componentes.length === 0) {
      return NextResponse.json(
        { sucesso: false, erro: 'Selecione pelo menos um componente (Física ou Matemática)' },
        { status: 400 }
      )
    }

    // Validar componentes
    const componentesValidos: Componente[] = ['fisica', 'matematica']
    const componentesFiltrados = componentes.filter((c: string) => componentesValidos.includes(c as Componente))
    if (componentesFiltrados.length === 0) {
      return NextResponse.json(
        { sucesso: false, erro: 'Componentes inválidos' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verificar se email já existe
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id, email')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (existente) {
      return NextResponse.json(
        { sucesso: false, erro: `Email ${email} já cadastrado. Tente com um sobrenome diferente.` },
        { status: 409 }
      )
    }

    // Usar senha padrão @estudante
    const senhaHash = await hashSenha(SENHA_PADRAO_ESTUDANTE)

    // Extrair ano da turma se não fornecido (ex: "2A" -> ano 2)
    const anoExtraido = parseInt(turma.trim().charAt(0))
    const anoEstudante = ano || (anoExtraido >= 1 && anoExtraido <= 9 ? anoExtraido : 1)

    // Determinar nível: 6-9 = EF (Ensino Fundamental), 1-3 = EM (Ensino Médio)
    const nivel = anoEstudante >= 6 ? 'EF' : 'EM'

    // Criar estudante
    const { data: novoAluno, error } = await supabase
      .from('usuarios')
      .insert({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        turma: turma.trim().toUpperCase(),
        colegio: colegio?.trim() || null,
        ano: anoEstudante,
        nivel: nivel,
        componentes: componentesFiltrados,
        tipo: 'estudante',
        ativo: true,
        senha_hash: senhaHash,
        senha_alterada: true, // Senha padrão @estudante, sem obrigar troca
        // Inicializar campos de progresso
        fis_pontos: 0,
        fis_questoes_total: 0,
        fis_questoes_corretas: 0,
        fis_sequencia_dias: 0,
        mat_pontos: 0,
        mat_questoes_total: 0,
        mat_questoes_corretas: 0,
        mat_sequencia_dias: 0,
      })
      .select('id, nome, email, turma, componentes')
      .single()

    if (error) {
      console.error('Erro ao cadastrar aluno:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao cadastrar aluno' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sucesso: true,
      aluno: novoAluno,
      senha_temporaria: SENHA_PADRAO_ESTUDANTE,
      mensagem: `Estudante ${nome.trim()} cadastrado com sucesso! Senha padrão: ${SENHA_PADRAO_ESTUDANTE}`,
    })
  } catch (error) {
    console.error('Erro ao cadastrar aluno:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
