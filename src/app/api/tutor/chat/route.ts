import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { chatComTutor, type ContextoEstudante } from '@/lib/gemini'
import type { Componente, MensagemChat } from '@/types'
import { PONTUACAO } from '@/types'
import { getPeriodoAtual } from '@/lib/sistema-notas'

// ═══════════════════════════════════════════════════════════
// TIPOS PARA PREFERÊNCIAS E ESTADO
// ═══════════════════════════════════════════════════════════
interface PreferenciasEstudante {
  prefere_analogias: boolean
  prefere_formulas: boolean
  prefere_exemplos: boolean
  prefere_visual: boolean
  prefere_passo_a_passo: boolean
  nivel_detalhe: 'minimo' | 'medio' | 'maximo'
  tom_conversa: 'formal' | 'amigavel' | 'descontraido'
  velocidade: 'lento' | 'normal' | 'rapido'
}

interface EstadoEstudante {
  nivel_engajamento: number
  nivel_frustacao: number
  nivel_confianca: number
  precisa_motivacao: boolean
  sequencia_erros: number
}

// ═══════════════════════════════════════════════════════════
// FUNCAO PARA BUSCAR CONTEXTO AVANÇADO DO ESTUDANTE
// ═══════════════════════════════════════════════════════════
async function buscarContextoAvancado(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  usuarioId: string,
  componente: Componente
): Promise<{ preferencias: PreferenciasEstudante | null; estado: EstadoEstudante | null; dificuldades: string[] }> {
  try {
    // Buscar preferências
    const { data: preferencias } = await supabase
      .from('estudante_preferencias')
      .select('*')
      .eq('usuario_id', usuarioId)
      .single()

    // Buscar estado emocional
    const { data: estado } = await supabase
      .from('estudante_estado')
      .select('*')
      .eq('usuario_id', usuarioId)
      .eq('componente', componente)
      .single()

    // Buscar top 3 dificuldades
    const { data: dificuldades } = await supabase
      .from('estudante_dificuldades')
      .select('topico')
      .eq('usuario_id', usuarioId)
      .eq('componente', componente)
      .gte('nivel_dificuldade', 4)
      .order('nivel_dificuldade', { ascending: false })
      .limit(3)

    return {
      preferencias: preferencias as PreferenciasEstudante | null,
      estado: estado as EstadoEstudante | null,
      dificuldades: dificuldades?.map(d => d.topico) || [],
    }
  } catch (error) {
    console.error('[Contexto Avançado] Erro:', error)
    return { preferencias: null, estado: null, dificuldades: [] }
  }
}

// ═══════════════════════════════════════════════════════════
// FUNCAO PARA BUSCAR/CRIAR SESSÃO DE IA
// ═══════════════════════════════════════════════════════════
async function obterOuCriarSessao(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  usuarioId: string,
  componente: Componente
): Promise<string | null> {
  try {
    // Buscar sessão ativa (aberta nas últimas 2 horas)
    const duasHorasAtras = new Date()
    duasHorasAtras.setHours(duasHorasAtras.getHours() - 2)

    const { data: sessaoAtiva } = await supabase
      .from('ia_sessoes')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('componente', componente)
      .is('fim', null)
      .gte('inicio', duasHorasAtras.toISOString())
      .order('inicio', { ascending: false })
      .limit(1)
      .single()

    if (sessaoAtiva) {
      return sessaoAtiva.id
    }

    // Criar nova sessão
    const { data: novaSessao, error } = await supabase
      .from('ia_sessoes')
      .insert({
        usuario_id: usuarioId,
        componente,
        inicio: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Sessão IA] Erro ao criar:', error)
      return null
    }

    return novaSessao.id
  } catch (error) {
    console.error('[Sessão IA] Erro:', error)
    return null
  }
}

// ═══════════════════════════════════════════════════════════
// FUNCAO PARA BUSCAR CONTEXTO DO ESTUDANTE
// ═══════════════════════════════════════════════════════════
async function buscarContextoEstudante(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  usuarioId: string,
  componente: Componente,
  turma: string | null
): Promise<ContextoEstudante> {
  const contexto: ContextoEstudante = {}

  try {
    // Serie do estudante (1, 2 ou 3)
    contexto.serie = parseInt(turma?.charAt(0) || '1', 10)

    // Buscar ultimas 50 respostas para analise de dificuldade
    const { data: respostas } = await supabase
      .from('respostas')
      .select('correta, tema')
      .eq('usuario_id', usuarioId)
      .eq('componente', componente)
      .order('created_at', { ascending: false })
      .limit(50)

    if (respostas && respostas.length > 0) {
      // Calcular percentual de acertos
      const acertos = respostas.filter(r => r.correta).length
      contexto.percentualAcertos = Math.round((acertos / respostas.length) * 100)
      contexto.questoesRespondidas = respostas.length

      // Identificar temas com dificuldade (mais de 50% de erro)
      const errosPorTema: Record<string, { erros: number; total: number }> = {}
      respostas.forEach(r => {
        if (r.tema) {
          if (!errosPorTema[r.tema]) errosPorTema[r.tema] = { erros: 0, total: 0 }
          errosPorTema[r.tema].total++
          if (!r.correta) errosPorTema[r.tema].erros++
        }
      })

      contexto.temasComDificuldade = Object.entries(errosPorTema)
        .filter(([, stats]) => stats.total >= 3 && (stats.erros / stats.total) > 0.5)
        .map(([tema]) => tema)
        .slice(0, 3) // Max 3 temas
    }

    // Buscar nota do bimestre atual
    const periodo = getPeriodoAtual()
    if (periodo) {
      const ano = new Date().getFullYear()
      const campoAcertos = componente === 'fisica' ? 'fis_acertos' : 'mat_acertos'
      const campoTempo = componente === 'fisica' ? 'fis_tempo_uso' : 'mat_tempo_uso'

      const { data: nota } = await supabase
        .from(`notas_${ano}`)
        .select(`${campoAcertos}, ${campoTempo}`)
        .eq('usuario_id', usuarioId)
        .eq('bimestre', periodo.bimestre)
        .single()

      if (nota) {
        const acertos = (nota[campoAcertos as keyof typeof nota] as number) || 0
        const tempo = (nota[campoTempo as keyof typeof nota] as number) || 0
        contexto.notaBimestre = acertos + tempo
        contexto.metaBimestre = periodo.config.regular.meta
      }
    }

    // Buscar sequencia de dias
    const campoSequencia = componente === 'fisica' ? 'fis_sequencia_dias' : 'mat_sequencia_dias'
    const { data: usuario } = await supabase
      .from('usuarios')
      .select(campoSequencia)
      .eq('id', usuarioId)
      .single()

    if (usuario) {
      contexto.sequenciaDias = (usuario[campoSequencia as keyof typeof usuario] as number) || 0
    }

    // Buscar conquista mais recente (ultima semana)
    const umaSemanaAtras = new Date()
    umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7)

    const { data: conquistas } = await supabase
      .from('conquistas_usuarios')
      .select('conquistas(nome)')
      .eq('usuario_id', usuarioId)
      .gte('desbloqueada_em', umaSemanaAtras.toISOString())
      .order('desbloqueada_em', { ascending: false })
      .limit(1)

    if (conquistas && conquistas.length > 0) {
      const conquista = conquistas[0] as unknown as { conquistas: { nome: string } | null }
      contexto.conquistaRecente = conquista.conquistas?.nome
    }

  } catch (error) {
    console.error('[Contexto] Erro ao buscar contexto:', error)
    // Retorna contexto parcial em caso de erro
  }

  return contexto
}

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { componente, mensagem, historico, nomeEstudante, imagem } = await request.json()

    if (!componente || !mensagem) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Validar e limitar tamanho da mensagem
    const mensagemValidada = typeof mensagem === 'string'
      ? mensagem.trim().slice(0, 2000) // Limite de 2000 caracteres
      : ''

    if (!mensagemValidada) {
      return NextResponse.json(
        { sucesso: false, erro: 'Mensagem inválida' },
        { status: 400 }
      )
    }

    // Limitar histórico para evitar crescimento indefinido
    // Máximo de 10 mensagens (5 trocas) para controlar custo e tempo
    const MAX_HISTORICO = 10
    const historicoValidado: MensagemChat[] = Array.isArray(historico)
      ? historico
          .slice(-MAX_HISTORICO) // Pegar apenas as últimas mensagens
          .filter((msg): msg is MensagemChat =>
            typeof msg === 'object' &&
            msg !== null &&
            typeof msg.role === 'string' &&
            typeof msg.content === 'string' &&
            ['user', 'assistant'].includes(msg.role) &&
            msg.content.length <= 5000 // Limitar tamanho de cada mensagem
          )
          .map(msg => ({
            ...msg,
            content: msg.content.slice(0, 5000) // Truncar se necessário
          }))
      : []

    const supabase = getSupabaseAdmin()

    // Buscar dados do usuário incluindo turma para determinar ano escolar
    const campoUso = componente === 'fisica' ? 'fis_uso_ia_hoje' : 'mat_uso_ia_hoje'
    const campoData = componente === 'fisica' ? 'fis_data_uso_ia' : 'mat_data_uso_ia'

    const { data: usuario } = await supabase
      .from('usuarios')
      .select(`${campoUso}, ${campoData}, turma, nome`)
      .eq('id', sessao.userId)
      .single()

    if (!usuario) {
      return NextResponse.json(
        { sucesso: false, erro: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const hoje = new Date().toISOString().split('T')[0]
    const dataUso = usuario[campoData as keyof typeof usuario] as string | null
    let usoHoje = (usuario[campoUso as keyof typeof usuario] as number) || 0

    // Resetar contador se for um novo dia
    if (!dataUso || dataUso !== hoje) {
      usoHoje = 0
    }

    // Verificar limite
    if (usoHoje >= PONTUACAO.LIMITE_IA_DIARIO) {
      return NextResponse.json({
        sucesso: false,
        erro: `Limite diário de ${PONTUACAO.LIMITE_IA_DIARIO} interações atingido`,
        uso_hoje: usoHoje,
        limite: PONTUACAO.LIMITE_IA_DIARIO,
      })
    }

    // Validar imagem se enviada (deve ser base64 válido)
    const imagemValidada = typeof imagem === 'string' && imagem.length > 0 && imagem.length < 2_000_000
      ? imagem
      : undefined

    // ═══════════════════════════════════════════════════════════
    // BUSCAR CONTEXTO PERSONALIZADO DO ESTUDANTE
    // ═══════════════════════════════════════════════════════════
    const contextoEstudante = await buscarContextoEstudante(
      supabase,
      sessao.userId,
      componente as Componente,
      usuario.turma
    )

    // ═══════════════════════════════════════════════════════════
    // BUSCAR CONTEXTO AVANÇADO (preferências, estado, dificuldades)
    // ═══════════════════════════════════════════════════════════
    const { preferencias, estado, dificuldades } = await buscarContextoAvancado(
      supabase,
      sessao.userId,
      componente as Componente
    )

    // Enriquecer contexto com dados avançados
    if (preferencias) {
      contextoEstudante.preferencias = {
        usarAnalogias: preferencias.prefere_analogias,
        usarFormulas: preferencias.prefere_formulas,
        usarExemplos: preferencias.prefere_exemplos,
        preferePasso: preferencias.prefere_passo_a_passo,
        nivelDetalhe: preferencias.nivel_detalhe,
        tomConversa: preferencias.tom_conversa,
      }
    }

    if (estado) {
      contextoEstudante.estadoEmocional = {
        engajamento: estado.nivel_engajamento,
        frustacao: estado.nivel_frustacao,
        confianca: estado.nivel_confianca,
        precisaMotivacao: estado.precisa_motivacao,
        sequenciaErros: estado.sequencia_erros,
      }
    }

    if (dificuldades.length > 0) {
      contextoEstudante.temasComDificuldade = dificuldades
    }

    // Obter ou criar sessão de IA
    const sessaoIaId = await obterOuCriarSessao(
      supabase,
      sessao.userId,
      componente as Componente
    )

    console.log('[Tutor IA] Contexto:', JSON.stringify(contextoEstudante))
    console.log('[Tutor IA] Sessão:', sessaoIaId)

    // Chamar o tutor IA com valores validados e contexto personalizado
    const resultado = await chatComTutor(
      componente as Componente,
      mensagemValidada,
      historicoValidado,
      contextoEstudante,
      imagemValidada // imagem em base64 (opcional)
    )

    if (!resultado.sucesso || !resultado.resposta) {
      return NextResponse.json({
        sucesso: false,
        erro: resultado.erro || 'Erro ao gerar resposta',
      })
    }

    // Log do modo detectado para análise
    console.log(`[Tutor IA] Modo: ${resultado.modo}, Tópico: ${resultado.topico}`)

    // ═══════════════════════════════════════════════════════════
    // USAR RESPOSTA DIRETA DA IA (sem sistema de revisao que adiciona frases)
    // O prompt ja foi otimizado com principios de neurociencia
    // ═══════════════════════════════════════════════════════════
    const respostaFinal = resultado.resposta

    // Incrementar uso
    const novoUso = usoHoje + 1
    await supabase
      .from('usuarios')
      .update({
        [campoUso]: novoUso,
        [campoData]: hoje,
      })
      .eq('id', sessao.userId)

    // Salvar no histórico legado (compatibilidade)
    await supabase.from('historico_chat').insert([
      {
        usuario_id: sessao.userId,
        componente,
        role: 'user',
        content: mensagemValidada,
      },
      {
        usuario_id: sessao.userId,
        componente,
        role: 'assistant',
        content: respostaFinal,
      },
    ])

    // ═══════════════════════════════════════════════════════════
    // SALVAR MENSAGENS NA TABELA AVANÇADA (ia_mensagens)
    // ═══════════════════════════════════════════════════════════
    if (sessaoIaId) {
      try {
        // Salvar mensagem do usuário
        await supabase.from('ia_mensagens').insert({
          sessao_id: sessaoIaId,
          usuario_id: sessao.userId,
          componente,
          role: 'user',
          content: mensagemValidada,
          topico: resultado.topico || null,
        })

        // Salvar resposta do assistente
        await supabase.from('ia_mensagens').insert({
          sessao_id: sessaoIaId,
          usuario_id: sessao.userId,
          componente,
          role: 'assistant',
          content: respostaFinal,
          modo: resultado.modo || null,
          topico: resultado.topico || null,
          modelo_usado: 'gemini-2.0-flash-lite',
        })

        // Atualizar sessão com modo/tópico predominante
        if (resultado.modo || resultado.topico) {
          await supabase
            .from('ia_sessoes')
            .update({
              modo_predominante: resultado.modo || null,
              topico_principal: resultado.topico || null,
              msgs_trocadas: novoUso,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessaoIaId)
        }
      } catch (error) {
        // Não falhar se erro ao salvar mensagens avançadas
        console.error('[IA Mensagens] Erro ao salvar:', error)
      }
    }

    return NextResponse.json({
      sucesso: true,
      resposta: respostaFinal,
      uso_hoje: novoUso,
      limite: PONTUACAO.LIMITE_IA_DIARIO,
      modo: resultado.modo,
      topico: resultado.topico,
      sessaoId: sessaoIaId,
    })
  } catch (error) {
    console.error('Erro no chat com tutor:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
