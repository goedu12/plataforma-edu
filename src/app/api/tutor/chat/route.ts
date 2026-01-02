import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { chatComTutor } from '@/lib/gemini'
import {
  revisarAteNota10,
} from '@/lib/revisao-profissional'
import type { Componente, MensagemChat } from '@/types'
import { PONTUACAO } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao) {
      return NextResponse.json(
        { sucesso: false, erro: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { componente, mensagem, historico, nomeEstudante } = await request.json()

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

    // Chamar o tutor IA com valores validados
    const resultado = await chatComTutor(componente as Componente, mensagemValidada, historicoValidado)

    if (!resultado.sucesso || !resultado.resposta) {
      return NextResponse.json({
        sucesso: false,
        erro: resultado.erro || 'Erro ao gerar resposta',
      })
    }

    // ═══════════════════════════════════════════════════════════
    // SISTEMA DE REVISÃO PROFISSIONAL - 3 Revisores
    // ═══════════════════════════════════════════════════════════

    // Determinar ano escolar baseado na turma (ex: "1A" -> 1º ano)
    const anoEscolar = parseInt(usuario.turma?.charAt(0) || '1', 10)
    const primeiroNome = nomeEstudante || usuario.nome?.split(' ')[0] || 'Estudante'

    // Submeter resposta para revisão por 3 profissionais até atingir nota 10
    const resultadoRevisao = revisarAteNota10(
      resultado.resposta,
      componente as 'fisica' | 'matematica',
      primeiroNome,
      3 // máximo de iterações
    )

    // Usar conteúdo revisado ou original
    const respostaFinal = resultadoRevisao.conteudoRevisado || resultado.resposta

    // Log para análise de qualidade (pode ser salvo no banco futuramente)
    console.log(`[Revisão IA] Nota: ${resultadoRevisao.notaMedia}/10 (escala 0–10), Aprovado: ${resultadoRevisao.aprovado}, Iterações: ${resultadoRevisao.iteracoes || 1}`)

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
      // Dados de revisão para debug/admin (opcional)
      revisao: {
        nota: resultadoRevisao.notaMedia,
        aprovado: resultadoRevisao.aprovado,
        iteracoes: resultadoRevisao.iteracoes || 1,
      },
    })
  } catch (error) {
    console.error('Erro no chat com tutor:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
