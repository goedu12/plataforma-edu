import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { chatComTutor } from '@/lib/gemini'
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

    const { componente, mensagem, historico } = await request.json()

    if (!componente || !mensagem) {
      return NextResponse.json(
        { sucesso: false, erro: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verificar uso diário da IA
    const campoUso = componente === 'fisica' ? 'fis_uso_ia_hoje' : 'mat_uso_ia_hoje'
    const campoData = componente === 'fisica' ? 'fis_data_uso_ia' : 'mat_data_uso_ia'

    const { data: usuario } = await supabase
      .from('usuarios')
      .select(`${campoUso}, ${campoData}`)
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

    if (!resultado.sucesso) {
      return NextResponse.json({
        sucesso: false,
        erro: resultado.erro,
      })
    }

    // Incrementar uso
    const novoUso = usoHoje + 1
    await supabase
      .from('usuarios')
      .update({
        [campoUso]: novoUso,
        [campoData]: hoje,
      })
      .eq('id', sessao.userId)

    // Salvar no histórico
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
        content: resultado.resposta,
      },
    ])

    return NextResponse.json({
      sucesso: true,
      resposta: resultado.resposta,
      uso_hoje: novoUso,
      limite: PONTUACAO.LIMITE_IA_DIARIO,
    })
  } catch (error) {
    console.error('Erro no chat com tutor:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
