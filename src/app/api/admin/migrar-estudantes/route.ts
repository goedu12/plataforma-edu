export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { obterSessao, hashSenha } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { gerarEmailEstudante } from '@/lib/utils'
import { logger } from '@/lib/logger'

// Senha padrão para todos os estudantes
const SENHA_PADRAO = '@estudante'

export async function POST() {
  try {
    // 1. Verificar se é professor (admin)
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()

    // 2. Buscar todos os estudantes ativos
    const { data: estudantes, error } = await supabase
      .from('usuarios')
      .select('id, email, nome, turma')
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .order('nome')

    if (error) {
      logger.error('Erro ao buscar estudantes:', error)
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar estudantes' },
        { status: 500 }
      )
    }

    if (!estudantes || estudantes.length === 0) {
      return NextResponse.json({
        sucesso: true,
        mensagem: 'Nenhum estudante encontrado para migrar',
        total: 0,
        atualizados: 0,
        semMudanca: 0,
        erros: 0,
        detalhes: [],
      })
    }

    // 3. Gerar hash da senha padrão
    const senhaHash = await hashSenha(SENHA_PADRAO)

    // 4. Processar cada estudante
    const resultados = {
      total: estudantes.length,
      atualizados: 0,
      semMudanca: 0,
      erros: 0,
      detalhes: [] as Array<{
        nome: string
        emailAntigo: string
        emailNovo: string
        status: 'atualizado' | 'sem_mudanca' | 'erro' | 'conflito'
        erro?: string
      }>,
    }

    for (const estudante of estudantes) {
      const novoEmail = gerarEmailEstudante(estudante.nome, estudante.turma)

      // Verificar se precisa atualizar
      if (estudante.email === novoEmail) {
        resultados.semMudanca++
        resultados.detalhes.push({
          nome: estudante.nome,
          emailAntigo: estudante.email,
          emailNovo: novoEmail,
          status: 'sem_mudanca',
        })
        continue
      }

      // Verificar conflito de email
      const { data: existente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', novoEmail)
        .neq('id', estudante.id)
        .single()

      if (existente) {
        resultados.erros++
        resultados.detalhes.push({
          nome: estudante.nome,
          emailAntigo: estudante.email,
          emailNovo: novoEmail,
          status: 'conflito',
          erro: `Email ${novoEmail} já existe`,
        })
        continue
      }

      // Atualizar estudante
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          email: novoEmail,
          senha_hash: senhaHash,
          senha_alterada: false,
        })
        .eq('id', estudante.id)

      if (updateError) {
        resultados.erros++
        resultados.detalhes.push({
          nome: estudante.nome,
          emailAntigo: estudante.email,
          emailNovo: novoEmail,
          status: 'erro',
          erro: updateError.message,
        })
      } else {
        resultados.atualizados++
        resultados.detalhes.push({
          nome: estudante.nome,
          emailAntigo: estudante.email,
          emailNovo: novoEmail,
          status: 'atualizado',
        })
      }
    }

    logger.info(`Migração concluída: ${resultados.atualizados} atualizados, ${resultados.semMudanca} sem mudança, ${resultados.erros} erros`)

    return NextResponse.json({
      sucesso: resultados.erros === 0,
      mensagem: `Migração concluída: ${resultados.atualizados} atualizados, ${resultados.semMudanca} já estavam corretos, ${resultados.erros} erros`,
      senhaPadrao: SENHA_PADRAO,
      ...resultados,
    })
  } catch (error) {
    logger.error('Erro na migração:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET para visualizar sem alterar
export async function GET() {
  try {
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const supabase = getSupabaseAdmin()

    const { data: estudantes, error } = await supabase
      .from('usuarios')
      .select('id, email, nome, turma')
      .eq('tipo', 'estudante')
      .eq('ativo', true)
      .order('nome')

    if (error) {
      return NextResponse.json(
        { sucesso: false, erro: 'Erro ao buscar estudantes' },
        { status: 500 }
      )
    }

    // Simular a migração (sem aplicar)
    const preview = (estudantes || []).map(e => {
      const novoEmail = gerarEmailEstudante(e.nome, e.turma)
      return {
        nome: e.nome,
        turma: e.turma,
        emailAtual: e.email,
        emailNovo: novoEmail,
        precisaAtualizar: e.email !== novoEmail,
      }
    })

    const precisamAtualizar = preview.filter(p => p.precisaAtualizar).length

    return NextResponse.json({
      sucesso: true,
      total: preview.length,
      precisamAtualizar,
      jaCorretos: preview.length - precisamAtualizar,
      senhaPadrao: SENHA_PADRAO,
      preview: preview.slice(0, 50), // Limitar preview
    })
  } catch (error) {
    logger.error('Erro no preview:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
