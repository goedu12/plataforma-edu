import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { chatComTutor, type ContextoEstudante } from '@/lib/gemini'
import type { Componente, MensagemChat } from '@/types'
import { PONTUACAO } from '@/types'
import { getPeriodoAtual } from '@/lib/sistema-notas'

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

    console.log('[Tutor IA] Contexto:', JSON.stringify(contextoEstudante))

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

    // Salvar no histórico com dados de revisão
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
        // Metadados de revisão (se a coluna existir)
        // revisao_nota: resultadoRevisao.notaMedia,
        // revisao_aprovado: resultadoRevisao.aprovado,
      },
    ])

    return NextResponse.json({
      sucesso: true,
      resposta: respostaFinal,
      uso_hoje: novoUso,
      limite: PONTUACAO.LIMITE_IA_DIARIO,
      modo: resultado.modo,
      topico: resultado.topico,
    })
  } catch (error) {
    console.error('Erro no chat com tutor:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
