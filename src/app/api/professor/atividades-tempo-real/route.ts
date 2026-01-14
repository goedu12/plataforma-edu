import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API: Atividades em Tempo Real para Dashboard do Professor
// Versão: 3.0 - Com suporte a aulas longas e lista de inativos
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
    modo?: string
  }
}

export interface AlunoAtivo {
  id: string
  nome: string
  turma: string
  componente: Componente
  ultima_atividade: string
  tipo_atividade: 'estudo' | 'desafio' | 'tutor' | 'revisao'
  questoes_sessao: number
  acertos_sessao: number
  taxa_acerto: number
}

// NOVO: Aluno inativo (não participou no período)
export interface AlunoInativo {
  id: string
  nome: string
  turma: string
  componentes: Componente[]
  ultimo_acesso: string | null
}

export interface EstatisticasTempoReal {
  alunos_ativos_agora: number
  alunos_inativos: number
  total_alunos_turma: number
  questoes_ultimos_5min: number
  questoes_ultimos_30min: number
  questoes_periodo_total: number
  taxa_acerto_tempo_real: number
  taxa_participacao: number
  usando_tutor: number
  fazendo_desafio: number
  fazendo_revisao: number
  por_turma: {
    turma: string
    ativos: number
    inativos: number
    total: number
    questoes: number
    taxa_acerto: number
    taxa_participacao: number
  }[]
}

export interface RespostaAtividadesTempoReal {
  sucesso: boolean
  atividades: AtividadeTempoReal[]
  alunos_ativos: AlunoAtivo[]
  alunos_inativos: AlunoInativo[]
  estatisticas: EstatisticasTempoReal
  turmas_disponiveis: string[]
  periodo_minutos: number
  ultima_atualizacao: string
}

// Configurações
const PERIODO_PADRAO = 60 // 60 minutos padrão (suficiente para 1 aula)
const PERIODO_MAXIMO = 120 // máximo 2 horas
const MAX_ATIVIDADES = 500 // aumentado para turmas grandes

// Cache simples para turmas (atualiza a cada 5 minutos)
let turmasCache: { data: string[]; timestamp: number } | null = null
const TURMAS_CACHE_TTL = 5 * 60 * 1000

export async function GET(request: NextRequest) {
  try {
    // 1. Autenticação
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    // 2. Parâmetros
    const searchParams = request.nextUrl.searchParams
    const turmaFiltro = searchParams.get('turma') || null
    const componenteFiltro = searchParams.get('componente') as Componente | null

    // NOVO: Período configurável (em minutos)
    let periodoMinutos = parseInt(searchParams.get('periodo') || String(PERIODO_PADRAO))
    if (isNaN(periodoMinutos) || periodoMinutos < 5) periodoMinutos = PERIODO_PADRAO
    if (periodoMinutos > PERIODO_MAXIMO) periodoMinutos = PERIODO_MAXIMO

    const supabase = getSupabaseAdmin()
    const agora = new Date()

    // Timestamps para consultas
    const periodoAtras = new Date(agora.getTime() - periodoMinutos * 60 * 1000).toISOString()
    const cincoMinAtras = new Date(agora.getTime() - 5 * 60 * 1000).toISOString()
    const trintaMinAtras = new Date(agora.getTime() - 30 * 60 * 1000).toISOString()

    // 3. Executar todas as queries em paralelo
    // NOTA: Removemos filtros em tabelas relacionadas (usuarios.tipo) pois podem falhar silenciosamente
    // A filtragem por tipo estudante é feita no código após buscar os dados
    const [
      respostasResult,
      desafiosResult,
      chatResult,
      turmasResult,
      todosAlunosResult, // NOVO: buscar todos os alunos para identificar inativos
    ] = await Promise.all([
      // Query 1: Respostas no período
      // NOTA: Usando FK explícita para evitar ambiguidade quando há múltiplas FKs
      supabase
        .from('respostas')
        .select(`
          id,
          usuario_id,
          componente,
          correta,
          tempo_segundos,
          pontos_ganhos,
          criado_em,
          modo,
          usuarios!fk_respostas_usuario (id, nome, turma, ativo, tipo),
          questoes!fk_respostas_questao (tema)
        `)
        .gte('criado_em', periodoAtras)
        .order('criado_em', { ascending: false })
        .limit(MAX_ATIVIDADES),

      // Query 2: Desafios no período
      supabase
        .from('desafios')
        .select(`
          id,
          usuario_id,
          componente,
          acertos,
          questoes_total,
          status,
          criado_em,
          usuarios (id, nome, turma, ativo, tipo)
        `)
        .gte('criado_em', periodoAtras)
        .order('criado_em', { ascending: false }),

      // Query 3: Uso do tutor no período
      supabase
        .from('historico_chat')
        .select(`
          id,
          usuario_id,
          componente,
          criado_em,
          usuarios (id, nome, turma, ativo, tipo)
        `)
        .gte('criado_em', periodoAtras)
        .eq('role', 'user')
        .order('criado_em', { ascending: false })
        .limit(200),

      // Query 4: Turmas disponíveis (com cache)
      getTurmasDisponiveis(supabase),

      // Query 5: NOVO - Todos os alunos ativos (para identificar inativos)
      supabase
        .from('usuarios')
        .select('id, nome, turma, componentes, ultimo_acesso')
        .eq('tipo', 'estudante')
        .eq('ativo', true)
        .order('nome'),
    ])

    // Verificar erros
    if (respostasResult.error) {
      logger.error('Erro ao buscar respostas:', respostasResult.error)
    }

    // DEBUG: Log para diagnóstico
    console.log('[DEBUG] Respostas brutas:', respostasResult.data?.length || 0)
    if (respostasResult.data && respostasResult.data.length > 0) {
      console.log('[DEBUG] Primeira resposta:', JSON.stringify(respostasResult.data[0], null, 2))
    }

    // 4. Processar resultados
    const respostasRecentes = respostasResult.data || []
    const desafiosRecentes = desafiosResult.data || []
    const chatRecente = chatResult.data || []
    const turmasDisponiveis = turmasResult
    const todosAlunos = todosAlunosResult.data || []

    // 5. Processar e normalizar dados do Supabase
    interface UsuarioInfo { id: string; nome: string; turma: string; ativo: boolean; tipo: string }
    interface QuestaoInfo { tema: string }

    const extrairRelacao = <T>(dados: T | T[] | null): T | null => {
      if (!dados) return null
      if (Array.isArray(dados)) return dados[0] || null
      return dados
    }

    // Função auxiliar para verificar se é estudante ativo
    const isEstudanteAtivo = (usuario: UsuarioInfo | null): boolean => {
      if (!usuario) return false
      return usuario.tipo === 'estudante' && usuario.ativo === true
    }

    // Processar respostas (filtrando apenas estudantes ativos)
    const respostasMapeadas = (respostasRecentes || [])
      .map(r => ({
        ...r,
        usuarios: extrairRelacao(r.usuarios as UsuarioInfo | UsuarioInfo[]),
        questoes: extrairRelacao(r.questoes as QuestaoInfo | QuestaoInfo[] | null),
      }))

    // DEBUG: Ver quantas têm usuario válido
    const comUsuario = respostasMapeadas.filter(r => r.usuarios !== null)
    const comUsuarioAtivo = comUsuario.filter(r => isEstudanteAtivo(r.usuarios))
    console.log('[DEBUG] Respostas mapeadas:', respostasMapeadas.length)
    console.log('[DEBUG] Com usuario:', comUsuario.length)
    console.log('[DEBUG] Com usuario ativo (estudante):', comUsuarioAtivo.length)
    if (respostasMapeadas.length > 0 && !respostasMapeadas[0].usuarios) {
      console.log('[DEBUG] Problema: usuarios é null na primeira resposta')
    }

    const respostasFiltradas = respostasMapeadas
      .filter(r => {
        if (!isEstudanteAtivo(r.usuarios)) return false
        if (turmaFiltro && r.usuarios!.turma !== turmaFiltro) return false
        if (componenteFiltro && r.componente !== componenteFiltro) return false
        return true
      })

    // Processar desafios (filtrando apenas estudantes ativos)
    const desafiosFiltrados = (desafiosRecentes || [])
      .map(d => ({
        ...d,
        usuarios: extrairRelacao(d.usuarios as UsuarioInfo | UsuarioInfo[]),
      }))
      .filter(d => {
        if (!isEstudanteAtivo(d.usuarios)) return false
        if (turmaFiltro && d.usuarios!.turma !== turmaFiltro) return false
        if (componenteFiltro && d.componente !== componenteFiltro) return false
        return true
      })

    // Processar chat (filtrando apenas estudantes ativos)
    const chatFiltrado = (chatRecente || [])
      .map(c => ({
        ...c,
        usuarios: extrairRelacao(c.usuarios as UsuarioInfo | UsuarioInfo[]),
      }))
      .filter(c => {
        if (!isEstudanteAtivo(c.usuarios)) return false
        if (turmaFiltro && c.usuarios!.turma !== turmaFiltro) return false
        if (componenteFiltro && c.componente !== componenteFiltro) return false
        return true
      })

    // Filtrar todos os alunos pela turma
    const alunosFiltrados = todosAlunos.filter(a => {
      if (turmaFiltro && a.turma !== turmaFiltro) return false
      if (componenteFiltro && !a.componentes?.includes(componenteFiltro)) return false
      return true
    })

    // 6. Montar lista de atividades
    const atividades: AtividadeTempoReal[] = []

    // Respostas
    for (const resposta of respostasFiltradas) {
      if (!resposta.usuarios) continue
      const isRevisao = resposta.modo === 'revisao'

      atividades.push({
        id: resposta.id,
        tipo: isRevisao ? 'revisao' : 'resposta',
        usuario_id: resposta.usuario_id,
        usuario_nome: resposta.usuarios.nome,
        turma: resposta.usuarios.turma,
        componente: resposta.componente as Componente,
        timestamp: resposta.criado_em,
        detalhes: {
          correta: resposta.correta,
          tema: resposta.questoes?.tema || 'Tema não identificado',
          pontos: resposta.pontos_ganhos,
          tempo_segundos: resposta.tempo_segundos,
          modo: resposta.modo,
        },
      })
    }

    // Desafios
    for (const desafio of desafiosFiltrados) {
      if (!desafio.usuarios) continue
      atividades.push({
        id: desafio.id,
        tipo: desafio.status === 'em_andamento' ? 'desafio_iniciado' : 'desafio_completo',
        usuario_id: desafio.usuario_id,
        usuario_nome: desafio.usuarios.nome,
        turma: desafio.usuarios.turma,
        componente: desafio.componente as Componente,
        timestamp: desafio.criado_em,
        detalhes: {
          acertos: desafio.acertos,
          total: desafio.questoes_total,
        },
      })
    }

    // Tutor (agrupar por usuário)
    type ChatProcessado = typeof chatFiltrado[number]
    const tutorPorUsuario = new Map<string, ChatProcessado>()
    for (const chat of chatFiltrado) {
      const key = `${chat.usuario_id}-${chat.componente}`
      if (!tutorPorUsuario.has(key)) {
        tutorPorUsuario.set(key, chat)
      }
    }

    for (const chat of tutorPorUsuario.values()) {
      if (!chat.usuarios) continue
      atividades.push({
        id: chat.id,
        tipo: 'tutor',
        usuario_id: chat.usuario_id,
        usuario_nome: chat.usuarios.nome,
        turma: chat.usuarios.turma,
        componente: chat.componente as Componente,
        timestamp: chat.criado_em,
        detalhes: {},
      })
    }

    // Ordenar por timestamp
    atividades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // 7. Calcular alunos ativos com estatísticas
    const alunosAtivosMap = new Map<string, AlunoAtivo>()
    const idsAtivos = new Set<string>()

    for (const resposta of respostasFiltradas) {
      if (!resposta.usuarios) continue
      idsAtivos.add(resposta.usuario_id)

      const key = `${resposta.usuario_id}-${resposta.componente}`
      const existente = alunosAtivosMap.get(key)

      if (!existente) {
        alunosAtivosMap.set(key, {
          id: resposta.usuario_id,
          nome: resposta.usuarios.nome,
          turma: resposta.usuarios.turma,
          componente: resposta.componente as Componente,
          ultima_atividade: resposta.criado_em,
          tipo_atividade: resposta.modo === 'revisao' ? 'revisao' : 'estudo',
          questoes_sessao: 1,
          acertos_sessao: resposta.correta ? 1 : 0,
          taxa_acerto: resposta.correta ? 100 : 0,
        })
      } else {
        existente.questoes_sessao++
        if (resposta.correta) existente.acertos_sessao++
        existente.taxa_acerto = Math.round((existente.acertos_sessao / existente.questoes_sessao) * 100)
        if (new Date(resposta.criado_em) > new Date(existente.ultima_atividade)) {
          existente.ultima_atividade = resposta.criado_em
          if (resposta.modo === 'revisao') existente.tipo_atividade = 'revisao'
        }
      }
    }

    // Marcar quem está em desafio
    for (const desafio of desafiosFiltrados) {
      if (!desafio.usuarios) continue
      idsAtivos.add(desafio.usuario_id)

      if (desafio.status !== 'em_andamento') continue

      const key = `${desafio.usuario_id}-${desafio.componente}`
      const existente = alunosAtivosMap.get(key)
      if (existente) {
        existente.tipo_atividade = 'desafio'
      } else {
        alunosAtivosMap.set(key, {
          id: desafio.usuario_id,
          nome: desafio.usuarios.nome,
          turma: desafio.usuarios.turma,
          componente: desafio.componente as Componente,
          ultima_atividade: desafio.criado_em,
          tipo_atividade: 'desafio',
          questoes_sessao: 0,
          acertos_sessao: 0,
          taxa_acerto: 0,
        })
      }
    }

    // Marcar quem está usando tutor
    for (const chat of tutorPorUsuario.values()) {
      if (!chat.usuarios) continue
      idsAtivos.add(chat.usuario_id)

      const key = `${chat.usuario_id}-${chat.componente}`
      const existente = alunosAtivosMap.get(key)
      if (existente) {
        existente.tipo_atividade = 'tutor'
      } else {
        alunosAtivosMap.set(key, {
          id: chat.usuario_id,
          nome: chat.usuarios.nome,
          turma: chat.usuarios.turma,
          componente: chat.componente as Componente,
          ultima_atividade: chat.criado_em,
          tipo_atividade: 'tutor',
          questoes_sessao: 0,
          acertos_sessao: 0,
          taxa_acerto: 0,
        })
      }
    }

    const alunosAtivos = Array.from(alunosAtivosMap.values())
      .sort((a, b) => new Date(b.ultima_atividade).getTime() - new Date(a.ultima_atividade).getTime())

    // 8. NOVO: Identificar alunos inativos
    const alunosInativos: AlunoInativo[] = alunosFiltrados
      .filter(a => !idsAtivos.has(a.id))
      .map(a => ({
        id: a.id,
        nome: a.nome,
        turma: a.turma,
        componentes: (a.componentes || []) as Componente[],
        ultimo_acesso: a.ultimo_acesso,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome))

    // 9. Calcular estatísticas
    const respostas5min = respostasFiltradas.filter(r => new Date(r.criado_em) >= new Date(cincoMinAtras))
    const respostas30min = respostasFiltradas.filter(r => new Date(r.criado_em) >= new Date(trintaMinAtras))

    const taxaAcertoTempoReal = respostas5min.length > 0
      ? Math.round((respostas5min.filter(r => r.correta).length / respostas5min.length) * 100)
      : 0

    const totalAlunosTurma = alunosFiltrados.length
    const taxaParticipacao = totalAlunosTurma > 0
      ? Math.round((idsAtivos.size / totalAlunosTurma) * 100)
      : 0

    // Estatísticas por turma
    const estatsPorTurma = new Map<string, {
      ativos: Set<string>
      questoes: number
      acertos: number
      totalAlunos: number
    }>()

    // Inicializar com todos os alunos
    for (const aluno of alunosFiltrados) {
      const stats = estatsPorTurma.get(aluno.turma) || {
        ativos: new Set(),
        questoes: 0,
        acertos: 0,
        totalAlunos: 0
      }
      stats.totalAlunos++
      estatsPorTurma.set(aluno.turma, stats)
    }

    // Adicionar estatísticas de respostas
    for (const resposta of respostasFiltradas) {
      if (!resposta.usuarios) continue
      const turma = resposta.usuarios.turma
      const stats = estatsPorTurma.get(turma) || {
        ativos: new Set(),
        questoes: 0,
        acertos: 0,
        totalAlunos: 0
      }
      stats.ativos.add(resposta.usuario_id)
      stats.questoes++
      if (resposta.correta) stats.acertos++
      estatsPorTurma.set(turma, stats)
    }

    const porTurma = Array.from(estatsPorTurma.entries())
      .map(([turma, stats]) => ({
        turma,
        ativos: stats.ativos.size,
        inativos: stats.totalAlunos - stats.ativos.size,
        total: stats.totalAlunos,
        questoes: stats.questoes,
        taxa_acerto: stats.questoes > 0 ? Math.round((stats.acertos / stats.questoes) * 100) : 0,
        taxa_participacao: stats.totalAlunos > 0 ? Math.round((stats.ativos.size / stats.totalAlunos) * 100) : 0,
      }))
      .sort((a, b) => b.ativos - a.ativos)

    // Contagens específicas
    const desafiosEmAndamento = desafiosFiltrados.filter(d => d.status === 'em_andamento').length
    const usandoTutor = tutorPorUsuario.size
    const fazendoRevisao = respostasFiltradas.filter(r => r.modo === 'revisao').length > 0
      ? new Set(respostasFiltradas.filter(r => r.modo === 'revisao').map(r => `${r.usuario_id}-${r.componente}`)).size
      : 0

    const estatisticas: EstatisticasTempoReal = {
      alunos_ativos_agora: idsAtivos.size,
      alunos_inativos: alunosInativos.length,
      total_alunos_turma: totalAlunosTurma,
      questoes_ultimos_5min: respostas5min.length,
      questoes_ultimos_30min: respostas30min.length,
      questoes_periodo_total: respostasFiltradas.length,
      taxa_acerto_tempo_real: taxaAcertoTempoReal,
      taxa_participacao: taxaParticipacao,
      usando_tutor: usandoTutor,
      fazendo_desafio: desafiosEmAndamento,
      fazendo_revisao: fazendoRevisao,
      por_turma: porTurma,
    }

    // 10. Resposta final
    const resposta: RespostaAtividadesTempoReal = {
      sucesso: true,
      atividades: atividades.slice(0, MAX_ATIVIDADES),
      alunos_ativos: alunosAtivos,
      alunos_inativos: alunosInativos,
      estatisticas,
      turmas_disponiveis: turmasDisponiveis,
      periodo_minutos: periodoMinutos,
      ultima_atualizacao: agora.toISOString(),
    }

    return NextResponse.json(resposta, {
      headers: {
        'Cache-Control': 'private, max-age=2',
        'X-Response-Time': `${Date.now() - agora.getTime()}ms`,
      },
    })
  } catch (error) {
    logger.error('Erro ao buscar atividades em tempo real:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função auxiliar para buscar turmas com cache
async function getTurmasDisponiveis(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<string[]> {
  const agora = Date.now()

  if (turmasCache && (agora - turmasCache.timestamp) < TURMAS_CACHE_TTL) {
    return turmasCache.data
  }

  const { data: turmasData } = await supabase
    .from('usuarios')
    .select('turma')
    .eq('tipo', 'estudante')
    .eq('ativo', true)

  const turmas = [...new Set((turmasData || []).map(u => u.turma))].sort()
  turmasCache = { data: turmas, timestamp: agora }

  return turmas
}
