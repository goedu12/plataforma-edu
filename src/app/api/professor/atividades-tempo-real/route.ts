import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API: Atividades em Tempo Real para Dashboard do Professor
// ═══════════════════════════════════════════════════════════════════════════

// Tipos para as atividades
export interface AtividadeTempoReal {
  id: string
  tipo: 'resposta' | 'desafio_iniciado' | 'desafio_completo' | 'tutor' | 'revisao'
  usuario_id: string
  usuario_nome: string
  turma: string
  componente: Componente
  timestamp: string
  detalhes: {
    correta?: boolean
    tema?: string
    pontos?: number
    tempo_segundos?: number
    acertos?: number
    total?: number
  }
}

export interface AlunoAtivo {
  id: string
  nome: string
  turma: string
  componente: Componente
  ultima_atividade: string
  tipo_atividade: string
  questoes_sessao: number
  acertos_sessao: number
  tempo_ativo_minutos: number
}

export interface EstatisticasTempoReal {
  alunos_ativos_agora: number
  questoes_ultimos_5min: number
  questoes_ultimos_30min: number
  taxa_acerto_tempo_real: number
  usando_tutor: number
  fazendo_desafio: number
  fazendo_revisao: number
  por_turma: {
    turma: string
    ativos: number
    questoes: number
  }[]
}

export interface RespostaAtividadesTempoReal {
  sucesso: boolean
  atividades: AtividadeTempoReal[]
  alunos_ativos: AlunoAtivo[]
  estatisticas: EstatisticasTempoReal
  turmas_disponiveis: string[]
  ultima_atualizacao: string
}

const MINUTOS_ATIVO = 15 // Considera ativo se teve atividade nos últimos 15 minutos
const MAX_ATIVIDADES = 50 // Máximo de atividades recentes para retornar

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
    const turmaFiltro = searchParams.get('turma') || null
    const componenteFiltro = searchParams.get('componente') as Componente | null

    const supabase = getSupabaseAdmin()
    const agora = new Date()

    // Timestamps para consultas
    const quinzeMinAtras = new Date(agora.getTime() - MINUTOS_ATIVO * 60 * 1000).toISOString()
    const cincoMinAtras = new Date(agora.getTime() - 5 * 60 * 1000).toISOString()
    const trintaMinAtras = new Date(agora.getTime() - 30 * 60 * 1000).toISOString()

    // 1. Buscar respostas recentes (últimos 15 minutos)
    let queryRespostas = supabase
      .from('respostas')
      .select(`
        id,
        usuario_id,
        componente,
        correta,
        tempo_segundos,
        pontos_ganhos,
        criado_em,
        questoes!inner (tema)
      `)
      .gte('criado_em', quinzeMinAtras)
      .order('criado_em', { ascending: false })
      .limit(MAX_ATIVIDADES)

    if (componenteFiltro) {
      queryRespostas = queryRespostas.eq('componente', componenteFiltro)
    }

    const { data: respostasRecentes, error: erroRespostas } = await queryRespostas

    if (erroRespostas) {
      logger.error('Erro ao buscar respostas recentes:', erroRespostas)
    }

    // 2. Buscar usuários que responderam recentemente
    const usuariosIds = [...new Set((respostasRecentes || []).map(r => r.usuario_id))]

    let usuarios: Record<string, { nome: string; turma: string }> = {}

    if (usuariosIds.length > 0) {
      let queryUsuarios = supabase
        .from('usuarios')
        .select('id, nome, turma')
        .in('id', usuariosIds)
        .eq('tipo', 'estudante')
        .eq('ativo', true)

      if (turmaFiltro) {
        queryUsuarios = queryUsuarios.eq('turma', turmaFiltro)
      }

      const { data: usuariosData } = await queryUsuarios

      if (usuariosData) {
        usuarios = usuariosData.reduce((acc, u) => {
          acc[u.id] = { nome: u.nome, turma: u.turma }
          return acc
        }, {} as Record<string, { nome: string; turma: string }>)
      }
    }

    // 3. Buscar desafios em andamento
    let queryDesafios = supabase
      .from('desafios')
      .select('id, usuario_id, componente, acertos, questoes_total, status, criado_em')
      .gte('criado_em', quinzeMinAtras)
      .order('criado_em', { ascending: false })

    if (componenteFiltro) {
      queryDesafios = queryDesafios.eq('componente', componenteFiltro)
    }

    const { data: desafiosRecentes } = await queryDesafios

    // 4. Buscar uso do tutor (histórico de chat recente)
    let queryTutor = supabase
      .from('historico_chat')
      .select('usuario_id, componente, criado_em')
      .gte('criado_em', quinzeMinAtras)
      .eq('role', 'user')
      .order('criado_em', { ascending: false })

    if (componenteFiltro) {
      queryTutor = queryTutor.eq('componente', componenteFiltro)
    }

    const { data: chatRecente } = await queryTutor

    // 5. Buscar todas as turmas disponíveis
    const { data: turmasData } = await supabase
      .from('usuarios')
      .select('turma')
      .eq('tipo', 'estudante')
      .eq('ativo', true)

    const turmasDisponiveis = [...new Set((turmasData || []).map(u => u.turma))].sort()

    // 6. Montar lista de atividades
    const atividades: AtividadeTempoReal[] = []

    // Adicionar respostas como atividades
    for (const resposta of respostasRecentes || []) {
      const usuario = usuarios[resposta.usuario_id]
      if (!usuario) continue
      if (turmaFiltro && usuario.turma !== turmaFiltro) continue

      atividades.push({
        id: resposta.id,
        tipo: 'resposta',
        usuario_id: resposta.usuario_id,
        usuario_nome: usuario.nome,
        turma: usuario.turma,
        componente: resposta.componente as Componente,
        timestamp: resposta.criado_em,
        detalhes: {
          correta: resposta.correta,
          tema: (resposta.questoes as unknown as { tema: string } | null)?.tema || 'N/A',
          pontos: resposta.pontos_ganhos,
          tempo_segundos: resposta.tempo_segundos,
        },
      })
    }

    // Adicionar desafios como atividades
    for (const desafio of desafiosRecentes || []) {
      const usuario = usuarios[desafio.usuario_id]
      if (!usuario) continue
      if (turmaFiltro && usuario.turma !== turmaFiltro) continue

      atividades.push({
        id: desafio.id,
        tipo: desafio.status === 'em_andamento' ? 'desafio_iniciado' : 'desafio_completo',
        usuario_id: desafio.usuario_id,
        usuario_nome: usuario.nome,
        turma: usuario.turma,
        componente: desafio.componente as Componente,
        timestamp: desafio.criado_em,
        detalhes: {
          acertos: desafio.acertos,
          total: desafio.questoes_total,
        },
      })
    }

    // Ordenar atividades por timestamp (mais recentes primeiro)
    atividades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // 7. Calcular alunos ativos
    const alunosAtivosMap = new Map<string, AlunoAtivo>()

    for (const resposta of respostasRecentes || []) {
      const usuario = usuarios[resposta.usuario_id]
      if (!usuario) continue
      if (turmaFiltro && usuario.turma !== turmaFiltro) continue

      const key = `${resposta.usuario_id}-${resposta.componente}`
      const existente = alunosAtivosMap.get(key)

      if (!existente) {
        alunosAtivosMap.set(key, {
          id: resposta.usuario_id,
          nome: usuario.nome,
          turma: usuario.turma,
          componente: resposta.componente as Componente,
          ultima_atividade: resposta.criado_em,
          tipo_atividade: 'estudo',
          questoes_sessao: 1,
          acertos_sessao: resposta.correta ? 1 : 0,
          tempo_ativo_minutos: Math.round((agora.getTime() - new Date(resposta.criado_em).getTime()) / 60000),
        })
      } else {
        existente.questoes_sessao++
        if (resposta.correta) existente.acertos_sessao++
        if (new Date(resposta.criado_em) > new Date(existente.ultima_atividade)) {
          existente.ultima_atividade = resposta.criado_em
        }
      }
    }

    // Marcar quem está fazendo desafio
    for (const desafio of desafiosRecentes || []) {
      if (desafio.status !== 'em_andamento') continue
      const usuario = usuarios[desafio.usuario_id]
      if (!usuario) continue

      const key = `${desafio.usuario_id}-${desafio.componente}`
      const existente = alunosAtivosMap.get(key)
      if (existente) {
        existente.tipo_atividade = 'desafio'
      }
    }

    // Marcar quem está usando tutor
    const usuariosUsandoTutor = new Set<string>()
    for (const chat of chatRecente || []) {
      const usuario = usuarios[chat.usuario_id]
      if (!usuario) continue
      usuariosUsandoTutor.add(`${chat.usuario_id}-${chat.componente}`)

      const key = `${chat.usuario_id}-${chat.componente}`
      const existente = alunosAtivosMap.get(key)
      if (existente) {
        existente.tipo_atividade = 'tutor'
      }
    }

    const alunosAtivos = Array.from(alunosAtivosMap.values())
      .sort((a, b) => new Date(b.ultima_atividade).getTime() - new Date(a.ultima_atividade).getTime())

    // 8. Calcular estatísticas
    const respostas5min = (respostasRecentes || []).filter(
      r => new Date(r.criado_em) >= new Date(cincoMinAtras) &&
           (!turmaFiltro || usuarios[r.usuario_id]?.turma === turmaFiltro)
    )
    const respostas30min = (respostasRecentes || []).filter(
      r => new Date(r.criado_em) >= new Date(trintaMinAtras) &&
           (!turmaFiltro || usuarios[r.usuario_id]?.turma === turmaFiltro)
    )

    const taxaAcertoTempoReal = respostas5min.length > 0
      ? Math.round((respostas5min.filter(r => r.correta).length / respostas5min.length) * 100)
      : 0

    // Estatísticas por turma
    const estatsPorTurma = new Map<string, { ativos: Set<string>; questoes: number }>()

    for (const resposta of respostasRecentes || []) {
      const usuario = usuarios[resposta.usuario_id]
      if (!usuario) continue

      const stats = estatsPorTurma.get(usuario.turma) || { ativos: new Set(), questoes: 0 }
      stats.ativos.add(resposta.usuario_id)
      stats.questoes++
      estatsPorTurma.set(usuario.turma, stats)
    }

    const porTurma = Array.from(estatsPorTurma.entries())
      .map(([turma, stats]) => ({
        turma,
        ativos: stats.ativos.size,
        questoes: stats.questoes,
      }))
      .sort((a, b) => b.ativos - a.ativos)

    const desafiosEmAndamento = (desafiosRecentes || []).filter(d => d.status === 'em_andamento').length

    const estatisticas: EstatisticasTempoReal = {
      alunos_ativos_agora: alunosAtivos.length,
      questoes_ultimos_5min: respostas5min.length,
      questoes_ultimos_30min: respostas30min.length,
      taxa_acerto_tempo_real: taxaAcertoTempoReal,
      usando_tutor: usuariosUsandoTutor.size,
      fazendo_desafio: desafiosEmAndamento,
      fazendo_revisao: 0, // TODO: implementar tracking de revisão
      por_turma: porTurma,
    }

    const resposta: RespostaAtividadesTempoReal = {
      sucesso: true,
      atividades: atividades.slice(0, MAX_ATIVIDADES),
      alunos_ativos: alunosAtivos,
      estatisticas,
      turmas_disponiveis: turmasDisponiveis,
      ultima_atualizacao: agora.toISOString(),
    }

    return NextResponse.json(resposta)
  } catch (error) {
    logger.error('Erro ao buscar atividades em tempo real:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
