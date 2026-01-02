import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { chatComTutor } from '@/lib/gemini'
import {
  revisarConteudoProfissional,
  aplicarMelhorias,
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

    // Chamar o tutor IA
    const resultado = await chatComTutor(componente as Componente, mensagem, historico || [])

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

    // Submeter resposta para revisão por 3 profissionais
    const resultadoRevisao = revisarConteudoProfissional(
      resultado.resposta,
      componente as 'fisica' | 'matematica',
      anoEscolar
    )

    // Aplicar melhorias automáticas baseadas no feedback dos revisores
    let respostaFinal = resultado.resposta
    if (!resultadoRevisao.aprovado) {
      respostaFinal = aplicarMelhorias(resultado.resposta, resultadoRevisao, primeiroNome)
    }

    // Log para análise de qualidade (pode ser salvo no banco futuramente)
    console.log(`[Revisão IA] Nota: ${resultadoRevisao.notaMedia}/100, Aprovado: ${resultadoRevisao.aprovado}`)

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
        content: mensagem,
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
