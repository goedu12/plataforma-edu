export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { consultarHeartbeats } from '@/lib/heartbeat-store'
import type { Componente } from '@/types'

// ═══════════════════════════════════════════════════════════════════════════
// API: Atividades em Tempo Real para Dashboard do Professor
// Versão: 3.0 - Com suporte a aulas longas e lista de inativos
// ═══════════════════════════════════════════════════════════════════════════

// Tipos para as atividades
export interface AtividadeTempoReal {
  id: string
  // NOTA: 'revisao' inclui flashcards (são questões em modo revisão)
  tipo: 'resposta' | 'desafio_iniciado' | 'desafio_completo' | 'tutor' | 'revisao' | 'mapa_curtido' | 'mapa_baixado'
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
    mapa_titulo?: string
  }
}

export interface AlunoAtivo {
  id: string
  nome: string
  turma: string
  componente: Componente
  ultima_atividade: string
  // NOTA: 'revisao' inclui flashcards (são questões em modo revisão)
  tipo_atividade: 'estudo' | 'desafio' | 'tutor' | 'revisao' | 'mapa'
  questoes_sessao: number
  acertos_sessao: number
  taxa_acerto: number
  nota_atual?: number
  posicao_ranking?: number
}

// NOVO: Aluno inativo (não participou no período)
export interface AlunoInativo {
  id: string
  nome: string
  turma: string
  componentes: Componente[]
  ultimo_acesso: string | null
}

// Aluno com heartbeat mas sem atividade recente
export interface AlunoOcioso {
  id: string
  nome: string
  turma: string
  componentes: Componente[]
  tempo_ocioso_segundos: number
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
  mapas_curtidos: number
  mapas_baixados: number
  media_nota_ativos: number
  // Novas métricas avançadas
  tempo_medio_segundos: number
  temas_com_dificuldade: { tema: string; taxa_erro: number; quantidade: number }[]
  tendencia_acerto: 'subindo' | 'estavel' | 'descendo'
  alunos_precisando_ajuda: number
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
  alunos_ociosos: AlunoOcioso[]
  alunos_inativos: AlunoInativo[]
  estatisticas: EstatisticasTempoReal
  turmas_disponiveis: string[]
  colegios_disponiveis: string[]
  periodo_minutos: number
  ultima_atualizacao: string
}

// Configurações
const PERIODO_PADRAO = 60 // 60 minutos padrão (suficiente para 1 aula)
const PERIODO_MAXIMO = 120 // máximo 2 horas
const MAX_ATIVIDADES = 500 // aumentado para turmas grandes

// Cache simples para turmas e colégios (atualiza a cada 5 minutos)
let turmasColegiosCache: { turmas: string[]; colegios: string[]; timestamp: number } | null = null
const TURMAS_CACHE_TTL = 5 * 60 * 1000

// Função auxiliar para obter o bimestre atual baseado na data
function obterBimestreAtual(): number {
  const agora = new Date()
  const mes = agora.getMonth() + 1 // 0-indexed

  // Calendário típico escolar brasileiro:
  // 1º bimestre: Fev-Abr (meses 2-4)
  // 2º bimestre: Mai-Jul (meses 5-7)
  // 3º bimestre: Ago-Set (meses 8-9)
  // 4º bimestre: Out-Dez (meses 10-12)
  // Janeiro: considera como 4º bimestre do ano anterior ou 1º do novo ano
  if (mes <= 4) return 1
  if (mes <= 7) return 2
  if (mes <= 9) return 3
  return 4
}

// Função auxiliar para obter o ano letivo atual
function obterAnoLetivoAtual(): number {
  const agora = new Date()
  const mes = agora.getMonth() + 1
  // Se for janeiro, pode ser do ano anterior (férias)
  if (mes === 1) return agora.getFullYear() - 1
  return agora.getFullYear()
}

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
    const colegioFiltro = searchParams.get('colegio') || null
    const componenteParam = searchParams.get('componente')
    // Validar componente para evitar valores inválidos
    const componenteFiltro: Componente | null =
      componenteParam === 'fisica' || componenteParam === 'matematica'
        ? componenteParam
        : null

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
      mapasCurtidasResult, // NOVO: curtidas em mapas mentais
      mapasDownloadsResult, // NOVO: downloads de mapas mentais
      notasResult, // NOVO: notas dos alunos
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

      // Query 4: Turmas e colégios disponíveis (com cache)
      getTurmasEColegiosDisponiveis(supabase),

      // Query 5: NOVO - Todos os alunos ativos (para identificar inativos)
      // Inclui pontos para calcular ranking e colegio para filtro
      supabase
        .from('usuarios')
        .select('id, nome, turma, colegio, componentes, ultimo_acesso, fis_pontos, mat_pontos')
        .eq('tipo', 'estudante')
        .eq('ativo', true)
        .order('nome'),

      // Query 6: NOVO - Curtidas em mapas mentais no período
      supabase
        .from('mapas_curtidas')
        .select(`
          id,
          mapa_id,
          usuario_id,
          criado_em,
          usuarios (id, nome, turma, ativo, tipo),
          mapas_mentais (titulo, componente)
        `)
        .gte('criado_em', periodoAtras)
        .order('criado_em', { ascending: false }),

      // Query 7: NOVO - Downloads de mapas mentais no período
      supabase
        .from('mapas_downloads')
        .select(`
          id,
          mapa_id,
          usuario_id,
          criado_em,
          usuarios (id, nome, turma, ativo, tipo),
          mapas_mentais (titulo, componente)
        `)
        .gte('criado_em', periodoAtras)
        .order('criado_em', { ascending: false }),

      // Query 8: Notas dos alunos no bimestre atual (ano dinâmico)
      supabase
        .from('notas_2025')
        .select('usuario_id, componente, nota_final, status')
        .eq('ano_letivo', obterAnoLetivoAtual())
        .eq('bimestre', obterBimestreAtual()),
    ])

    // Verificar erros de todas as queries
    const erros: string[] = []
    if (respostasResult.error) erros.push(`respostas: ${respostasResult.error.message}`)
    if (desafiosResult.error) erros.push(`desafios: ${desafiosResult.error.message}`)
    if (chatResult.error) erros.push(`chat: ${chatResult.error.message}`)
    if (todosAlunosResult.error) erros.push(`alunos: ${todosAlunosResult.error.message}`)
    if (mapasCurtidasResult.error) erros.push(`curtidas: ${mapasCurtidasResult.error.message}`)
    if (mapasDownloadsResult.error) erros.push(`downloads: ${mapasDownloadsResult.error.message}`)
    if (notasResult.error) erros.push(`notas: ${notasResult.error.message}`)

    if (erros.length > 0) {
      logger.warn('Erros parciais no dashboard:', erros.join('; '))
    }

    // 4. Processar resultados
    const respostasRecentes = respostasResult.data || []
    const desafiosRecentes = desafiosResult.data || []
    const chatRecente = chatResult.data || []
    const { turmas: turmasDisponiveis, colegios: colegiosDisponiveis } = turmasResult
    const todosAlunosRaw = todosAlunosResult.data || []
    const mapasCurtidas = mapasCurtidasResult.data || []
    const mapasDownloads = mapasDownloadsResult.data || []
    const notasAlunos = notasResult.data || []

    // Filtrar alunos por colégio se especificado
    const isTurmaEM = (t: string) => /^[123]/.test(t)
    const todosAlunos = (colegioFiltro
      ? todosAlunosRaw.filter(a => a.colegio === colegioFiltro)
      : todosAlunosRaw
    ).filter(a => !a.turma || isTurmaEM(a.turma))

    // Criar mapa de notas por aluno e componente
    const notasPorAluno = new Map<string, { fisica?: number; matematica?: number }>()
    for (const nota of notasAlunos) {
      const key = nota.usuario_id
      const existente = notasPorAluno.get(key) || {}
      existente[nota.componente as 'fisica' | 'matematica'] = nota.nota_final
      notasPorAluno.set(key, existente)
    }

    // Calcular ranking por componente
    const rankingFisica = [...todosAlunos]
      .filter(a => a.fis_pontos > 0)
      .sort((a, b) => b.fis_pontos - a.fis_pontos)
      .reduce((acc, aluno, idx) => {
        acc.set(aluno.id, idx + 1)
        return acc
      }, new Map<string, number>())

    const rankingMatematica = [...todosAlunos]
      .filter(a => a.mat_pontos > 0)
      .sort((a, b) => b.mat_pontos - a.mat_pontos)
      .reduce((acc, aluno, idx) => {
        acc.set(aluno.id, idx + 1)
        return acc
      }, new Map<string, number>())

    // 5. Processar e normalizar dados do Supabase
    interface UsuarioInfo { id: string; nome: string; turma: string; ativo: boolean; tipo: string }
    interface QuestaoInfo { tema: string }
    interface MapaInfo { titulo: string; componente: string }

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

    // Criar Set de IDs de usuários do colégio filtrado (para filtrar atividades)
    const usuariosDoColegioSet = colegioFiltro
      ? new Set(todosAlunos.map(a => a.id))
      : null

    // Processar respostas (filtrando apenas estudantes ativos)
    const respostasMapeadas = (respostasRecentes || [])
      .map(r => ({
        ...r,
        usuarios: extrairRelacao(r.usuarios as UsuarioInfo | UsuarioInfo[]),
        questoes: extrairRelacao(r.questoes as QuestaoInfo | QuestaoInfo[] | null),
      }))

    const respostasFiltradas = respostasMapeadas
      .filter(r => {
        if (!isEstudanteAtivo(r.usuarios)) return false
        if (turmaFiltro && r.usuarios!.turma !== turmaFiltro) return false
        if (componenteFiltro && r.componente !== componenteFiltro) return false
        if (usuariosDoColegioSet && !usuariosDoColegioSet.has(r.usuario_id)) return false
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
        if (usuariosDoColegioSet && !usuariosDoColegioSet.has(d.usuario_id)) return false
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
        if (usuariosDoColegioSet && !usuariosDoColegioSet.has(c.usuario_id)) return false
        return true
      })

    // Processar curtidas em mapas (filtrando apenas estudantes ativos)
    const curtidasFiltradas = (mapasCurtidas || [])
      .map(c => ({
        ...c,
        usuarios: extrairRelacao(c.usuarios as UsuarioInfo | UsuarioInfo[]),
        mapas_mentais: extrairRelacao(c.mapas_mentais as MapaInfo | MapaInfo[] | null),
      }))
      .filter(c => {
        if (!isEstudanteAtivo(c.usuarios)) return false
        if (turmaFiltro && c.usuarios!.turma !== turmaFiltro) return false
        if (componenteFiltro && c.mapas_mentais?.componente !== componenteFiltro) return false
        if (usuariosDoColegioSet && !usuariosDoColegioSet.has(c.usuario_id)) return false
        return true
      })

    // Processar downloads de mapas (filtrando apenas estudantes ativos)
    const downloadsFiltrados = (mapasDownloads || [])
      .map(d => ({
        ...d,
        usuarios: extrairRelacao(d.usuarios as UsuarioInfo | UsuarioInfo[]),
        mapas_mentais: extrairRelacao(d.mapas_mentais as MapaInfo | MapaInfo[] | null),
      }))
      .filter(d => {
        if (!isEstudanteAtivo(d.usuarios)) return false
        if (turmaFiltro && d.usuarios!.turma !== turmaFiltro) return false
        if (componenteFiltro && d.mapas_mentais?.componente !== componenteFiltro) return false
        if (usuariosDoColegioSet && !usuariosDoColegioSet.has(d.usuario_id)) return false
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

    // Curtidas em mapas
    for (const curtida of curtidasFiltradas) {
      if (!curtida.usuarios || !curtida.mapas_mentais) continue
      atividades.push({
        id: curtida.id,
        tipo: 'mapa_curtido',
        usuario_id: curtida.usuario_id,
        usuario_nome: curtida.usuarios.nome,
        turma: curtida.usuarios.turma,
        componente: (curtida.mapas_mentais.componente || 'fisica') as Componente,
        timestamp: curtida.criado_em,
        detalhes: {
          mapa_titulo: curtida.mapas_mentais.titulo,
        },
      })
    }

    // Downloads de mapas
    for (const download of downloadsFiltrados) {
      if (!download.usuarios || !download.mapas_mentais) continue
      atividades.push({
        id: download.id,
        tipo: 'mapa_baixado',
        usuario_id: download.usuario_id,
        usuario_nome: download.usuarios.nome,
        turma: download.usuarios.turma,
        componente: (download.mapas_mentais.componente || 'fisica') as Componente,
        timestamp: download.criado_em,
        detalhes: {
          mapa_titulo: download.mapas_mentais.titulo,
        },
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

    // Marcar quem está interagindo com mapas
    for (const curtida of curtidasFiltradas) {
      if (!curtida.usuarios || !curtida.mapas_mentais) continue
      idsAtivos.add(curtida.usuario_id)

      const componente = (curtida.mapas_mentais.componente || 'fisica') as Componente
      const key = `${curtida.usuario_id}-${componente}`
      if (!alunosAtivosMap.has(key)) {
        alunosAtivosMap.set(key, {
          id: curtida.usuario_id,
          nome: curtida.usuarios.nome,
          turma: curtida.usuarios.turma,
          componente,
          ultima_atividade: curtida.criado_em,
          tipo_atividade: 'mapa',
          questoes_sessao: 0,
          acertos_sessao: 0,
          taxa_acerto: 0,
        })
      }
    }

    for (const download of downloadsFiltrados) {
      if (!download.usuarios || !download.mapas_mentais) continue
      idsAtivos.add(download.usuario_id)

      const componente = (download.mapas_mentais.componente || 'fisica') as Componente
      const key = `${download.usuario_id}-${componente}`
      if (!alunosAtivosMap.has(key)) {
        alunosAtivosMap.set(key, {
          id: download.usuario_id,
          nome: download.usuarios.nome,
          turma: download.usuarios.turma,
          componente,
          ultima_atividade: download.criado_em,
          tipo_atividade: 'mapa',
          questoes_sessao: 0,
          acertos_sessao: 0,
          taxa_acerto: 0,
        })
      }
    }

    // Adicionar nota e ranking aos alunos ativos
    for (const aluno of alunosAtivosMap.values()) {
      const notas = notasPorAluno.get(aluno.id)
      if (notas) {
        aluno.nota_atual = notas[aluno.componente as 'fisica' | 'matematica']
      }

      if (aluno.componente === 'fisica') {
        aluno.posicao_ranking = rankingFisica.get(aluno.id)
      } else {
        aluno.posicao_ranking = rankingMatematica.get(aluno.id)
      }
    }

    const alunosAtivos = Array.from(alunosAtivosMap.values())
      .sort((a, b) => new Date(b.ultima_atividade).getTime() - new Date(a.ultima_atividade).getTime())

    // 8. Identificar alunos inativos e ociosos via heartbeat (import direto, sem HTTP)
    const heartbeatData = consultarHeartbeats()

    const alunosOciosos: AlunoOcioso[] = []
    const alunosInativos: AlunoInativo[] = []

    for (const a of alunosFiltrados) {
      if (idsAtivos.has(a.id)) continue

      const hb = heartbeatData[a.id]
      if (hb && hb.status === 'ocioso') {
        // Heartbeat ativo mas sem interacao real > 2 min = ocioso
        alunosOciosos.push({
          id: a.id,
          nome: a.nome,
          turma: a.turma,
          componentes: (a.componentes || []) as Componente[],
          tempo_ocioso_segundos: hb.tempoOcioso,
          ultimo_acesso: a.ultimo_acesso,
        })
      } else if (!hb) {
        // Sem heartbeat = offline/inativo
        alunosInativos.push({
          id: a.id,
          nome: a.nome,
          turma: a.turma,
          componentes: (a.componentes || []) as Componente[],
          ultimo_acesso: a.ultimo_acesso,
        })
      }
      // hb.status === 'ativo' sem atividades = navegando, não ocioso (ignorar)
    }

    alunosOciosos.sort((a, b) => b.tempo_ocioso_segundos - a.tempo_ocioso_segundos)
    alunosInativos.sort((a, b) => a.nome.localeCompare(b.nome))

    // ═══════════════════════════════════════════════════════════════════════════
    // 9. CALCULAR TODAS AS ESTATÍSTICAS EM ÚNICO PASS (OTIMIZADO)
    // Antes eram 11+ iterações, agora são apenas 2 (inicialização + cálculo)
    // ═══════════════════════════════════════════════════════════════════════════

    const totalAlunosTurma = alunosFiltrados.length
    const dataLimite5min = new Date(cincoMinAtras)
    const dataLimite30min = new Date(trintaMinAtras)

    // Estatísticas por turma - inicializar com todos os alunos
    const estatsPorTurma = new Map<string, {
      ativos: Set<string>
      questoes: number
      acertos: number
      totalAlunos: number
    }>()

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

    // Contadores consolidados (único pass sobre respostasFiltradas)
    const batch = {
      // Período 5min
      count5min: 0,
      acertos5min: 0,
      // Período 5-30min (anteriores)
      countAnteriores: 0,
      acertosAnteriores: 0,
      // Tempo médio
      tempoTotal: 0,
      countComTempo: 0,
      // Revisão
      revisaoPorUsuario: new Set<string>(),
      // Temas
      porTema: new Map<string, { acertos: number; total: number }>(),
    }

    for (const resposta of respostasFiltradas) {
      if (!resposta.usuarios) continue

      const dataResposta = new Date(resposta.criado_em)
      const isRecente5min = dataResposta >= dataLimite5min
      const isAnteriores = dataResposta >= dataLimite30min && dataResposta < dataLimite5min

      // Contagens por período de tempo
      if (isRecente5min) {
        batch.count5min++
        if (resposta.correta) batch.acertos5min++
      }
      if (isAnteriores) {
        batch.countAnteriores++
        if (resposta.correta) batch.acertosAnteriores++
      }

      // Estatísticas por turma
      const turma = resposta.usuarios.turma
      const turmaStats = estatsPorTurma.get(turma) || {
        ativos: new Set(),
        questoes: 0,
        acertos: 0,
        totalAlunos: 0
      }
      turmaStats.ativos.add(resposta.usuario_id)
      turmaStats.questoes++
      if (resposta.correta) turmaStats.acertos++
      estatsPorTurma.set(turma, turmaStats)

      // Modo revisão (flashcards)
      if (resposta.modo === 'revisao') {
        batch.revisaoPorUsuario.add(`${resposta.usuario_id}-${resposta.componente}`)
      }

      // Tempo médio
      if (resposta.tempo_segundos && resposta.tempo_segundos > 0) {
        batch.tempoTotal += resposta.tempo_segundos
        batch.countComTempo++
      }

      // Estatísticas por tema
      const tema = resposta.questoes?.tema || 'Sem tema'
      const temaStats = batch.porTema.get(tema) || { acertos: 0, total: 0 }
      temaStats.total++
      if (resposta.correta) temaStats.acertos++
      batch.porTema.set(tema, temaStats)
    }

    // Derivar métricas dos contadores
    const taxaAcertoTempoReal = batch.count5min > 0
      ? Math.round((batch.acertos5min / batch.count5min) * 100)
      : 0

    const taxaParticipacao = totalAlunosTurma > 0
      ? Math.round((idsAtivos.size / totalAlunosTurma) * 100)
      : 0

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
    const fazendoRevisao = batch.revisaoPorUsuario.size

    // Contagens de mapas
    const totalCurtidas = curtidasFiltradas.length
    const totalDownloads = downloadsFiltrados.length

    // Média de notas dos alunos ativos
    let somaNotas = 0
    let countNotas = 0
    for (const aluno of alunosAtivos) {
      if (aluno.nota_atual !== undefined && aluno.nota_atual !== null) {
        somaNotas += aluno.nota_atual
        countNotas++
      }
    }
    const mediaNotaAtivos = countNotas > 0 ? Math.round((somaNotas / countNotas) * 10) / 10 : 0

    // ═══════════════════════════════════════════════════════════════════════════
    // MÉTRICAS AVANÇADAS PARA PROFESSOR SENIOR
    // ═══════════════════════════════════════════════════════════════════════════

    // 1. Tempo médio por questão
    const tempoMedioSegundos = batch.countComTempo > 0
      ? Math.round(batch.tempoTotal / batch.countComTempo)
      : 0

    // 2. Temas com dificuldade (taxa de erro > 40% e pelo menos 3 respostas)
    const temasComDificuldade = Array.from(batch.porTema.entries())
      .map(([tema, stats]) => ({
        tema,
        taxa_erro: stats.total > 0 ? Math.round(((stats.total - stats.acertos) / stats.total) * 100) : 0,
        quantidade: stats.total,
      }))
      .filter(t => t.quantidade >= 3 && t.taxa_erro >= 40)
      .sort((a, b) => b.taxa_erro - a.taxa_erro)
      .slice(0, 5) // Top 5 temas problemáticos

    // 3. Tendência de acerto (comparar últimos 5min vs período 5-30min atrás)
    // IMPORTANTE: Comparamos períodos SEM sobreposição para análise válida
    const taxa5min = batch.count5min > 0 ? (batch.acertos5min / batch.count5min) * 100 : 0
    const taxaAnterior = batch.countAnteriores > 0 ? (batch.acertosAnteriores / batch.countAnteriores) * 100 : 0

    let tendenciaAcerto: 'subindo' | 'estavel' | 'descendo' = 'estavel'
    // Precisa de pelo menos 5 respostas em cada período para ser significativo
    if (batch.count5min >= 5 && batch.countAnteriores >= 5) {
      const diferenca = taxa5min - taxaAnterior
      if (diferenca > 10) tendenciaAcerto = 'subindo'
      else if (diferenca < -10) tendenciaAcerto = 'descendo'
    }

    // 4. Alunos precisando de ajuda (taxa de acerto < 40% com pelo menos 5 questões)
    let alunosPrecisandoAjuda = 0
    for (const aluno of alunosAtivos) {
      if (aluno.questoes_sessao >= 5 && aluno.taxa_acerto < 40) {
        alunosPrecisandoAjuda++
      }
    }

    const estatisticas: EstatisticasTempoReal = {
      alunos_ativos_agora: idsAtivos.size,
      alunos_inativos: alunosInativos.length,
      total_alunos_turma: totalAlunosTurma,
      questoes_ultimos_5min: batch.count5min,
      questoes_ultimos_30min: batch.count5min + batch.countAnteriores, // 5min + 5-30min
      questoes_periodo_total: respostasFiltradas.length,
      taxa_acerto_tempo_real: taxaAcertoTempoReal,
      taxa_participacao: taxaParticipacao,
      usando_tutor: usandoTutor,
      fazendo_desafio: desafiosEmAndamento,
      fazendo_revisao: fazendoRevisao,
      mapas_curtidos: totalCurtidas,
      mapas_baixados: totalDownloads,
      media_nota_ativos: mediaNotaAtivos,
      // Novas métricas avançadas
      tempo_medio_segundos: tempoMedioSegundos,
      temas_com_dificuldade: temasComDificuldade,
      tendencia_acerto: tendenciaAcerto,
      alunos_precisando_ajuda: alunosPrecisandoAjuda,
      por_turma: porTurma,
    }

    // 10. Resposta final
    const resposta: RespostaAtividadesTempoReal = {
      sucesso: true,
      atividades: atividades.slice(0, MAX_ATIVIDADES),
      alunos_ativos: alunosAtivos,
      alunos_ociosos: alunosOciosos,
      alunos_inativos: alunosInativos,
      estatisticas,
      turmas_disponiveis: turmasDisponiveis,
      colegios_disponiveis: colegiosDisponiveis,
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

// Função auxiliar para buscar turmas e colégios com cache
async function getTurmasEColegiosDisponiveis(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<{ turmas: string[]; colegios: string[] }> {
  const agora = Date.now()

  if (turmasColegiosCache && (agora - turmasColegiosCache.timestamp) < TURMAS_CACHE_TTL) {
    return { turmas: turmasColegiosCache.turmas, colegios: turmasColegiosCache.colegios }
  }

  const { data: usuariosData } = await supabase
    .from('usuarios')
    .select('turma, colegio')
    .eq('tipo', 'estudante')
    .eq('ativo', true)

  const isTurmaEM = (t: string) => /^[123]/.test(t)
  const turmas = [...new Set((usuariosData || []).map(u => u.turma).filter(Boolean))].filter(isTurmaEM).sort()
  const colegios = [...new Set((usuariosData || []).map(u => u.colegio).filter(Boolean))].sort() as string[]

  turmasColegiosCache = { turmas, colegios, timestamp: agora }

  return { turmas, colegios }
}
