import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════
// API TRILHA CURIOSIDADE
// Gerencia temas temáticos da trilha de curiosidade
// ═══════════════════════════════════════════════════════════

export interface TemaCuriosidade {
  id: string
  nome: string
  icone: string
  descricao: string
  conteudos_fisica: string[]
  total_questoes: number
  ordem: number
  // Progresso do usuário
  questoes_respondidas?: number
  questoes_corretas?: number
  concluido?: boolean
}

// GET - Listar temas de curiosidade com progresso do usuário
export async function GET(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Buscar temas ativos
    const { data: temas, error } = await supabase
      .from('trilha_temas_curiosidade')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (error) {
      console.error('[Curiosidade] Erro ao buscar temas:', error)
      return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar temas' }, { status: 500 })
    }

    // Buscar progresso do usuário em cada tema
    // (baseado nas respostas de questões_trilha com os conteúdos correspondentes)
    const temasComProgresso: TemaCuriosidade[] = await Promise.all(
      (temas || []).map(async (tema) => {
        // Buscar questões respondidas pelo usuário neste tema
        // Como questões_trilha tem o campo 'tema', podemos buscar por conteudos_fisica
        const { count: questoesRespondidas } = await supabase
          .from('respostas_trilha')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', sessaoAuth.userId)
          .eq('trilha_id', 'curiosidade')

        const { count: questoesCorretas } = await supabase
          .from('respostas_trilha')
          .select('*', { count: 'exact', head: true })
          .eq('usuario_id', sessaoAuth.userId)
          .eq('trilha_id', 'curiosidade')
          .eq('correta', true)

        return {
          id: tema.id,
          nome: tema.nome,
          icone: tema.icone,
          descricao: tema.descricao,
          conteudos_fisica: tema.conteudos_fisica || [],
          total_questoes: tema.total_questoes || 15,
          ordem: tema.ordem,
          questoes_respondidas: questoesRespondidas || 0,
          questoes_corretas: questoesCorretas || 0,
          concluido: (questoesRespondidas || 0) >= (tema.total_questoes || 15),
        }
      })
    )

    // Estatísticas gerais
    const totalTemas = temasComProgresso.length
    const temasIniciados = temasComProgresso.filter(t => (t.questoes_respondidas || 0) > 0).length
    const temasConcluidos = temasComProgresso.filter(t => t.concluido).length

    return NextResponse.json({
      sucesso: true,
      temas: temasComProgresso,
      estatisticas: {
        totalTemas,
        temasIniciados,
        temasConcluidos,
      },
    })
  } catch (error) {
    console.error('[Curiosidade] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}

// POST - Iniciar ou continuar um tema específico
export async function POST(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const { temaId, serie } = await request.json()

    if (!temaId) {
      return NextResponse.json({ sucesso: false, erro: 'Tema não especificado' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verificar se tema existe
    const { data: tema, error: erroTema } = await supabase
      .from('trilha_temas_curiosidade')
      .select('*')
      .eq('id', temaId)
      .single()

    if (erroTema || !tema) {
      return NextResponse.json({ sucesso: false, erro: 'Tema não encontrado' }, { status: 404 })
    }

    // Verificar/criar vinculo do usuário com a trilha curiosidade
    const { data: usuarioTrilha } = await supabase
      .from('usuario_trilha')
      .select('*')
      .eq('usuario_id', sessaoAuth.userId)
      .eq('trilha_id', 'curiosidade')
      .eq('serie', serie || '1EM')
      .single()

    if (!usuarioTrilha) {
      // Criar vínculo
      await supabase
        .from('usuario_trilha')
        .insert({
          usuario_id: sessaoAuth.userId,
          trilha_id: 'curiosidade',
          serie: serie || '1EM',
          ativa: true,
          // Salvar tema atual na config personalizada
          config_personalizada: { tema_atual: temaId },
        })
    } else {
      // Atualizar tema atual
      await supabase
        .from('usuario_trilha')
        .update({
          ativa: true,
          config_personalizada: {
            ...usuarioTrilha.config_personalizada,
            tema_atual: temaId,
          },
          ultimo_acesso: new Date().toISOString(),
        })
        .eq('id', usuarioTrilha.id)
    }

    return NextResponse.json({
      sucesso: true,
      tema: {
        id: tema.id,
        nome: tema.nome,
        icone: tema.icone,
        descricao: tema.descricao,
        conteudos_fisica: tema.conteudos_fisica,
        total_questoes: tema.total_questoes,
      },
      mensagem: 'Tema selecionado com sucesso',
    })
  } catch (error) {
    console.error('[Curiosidade] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}
