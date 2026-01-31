export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════════════════════
// API ENEM - Importar lote de questões
// POST /api/enem/importar/lote
// ═══════════════════════════════════════════════════════════════════════════

interface QuestaoImport {
  id_api: string
  ano_prova: number
  numero_questao: number
  area: string
  subarea: string
  titulo?: string | null
  contexto: string
  comando?: string | null
  imagem_principal?: string | null
  imagens_extras?: string[]
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  imagem_a?: string | null
  imagem_b?: string | null
  imagem_c?: string | null
  imagem_d?: string | null
  imagem_e?: string | null
  resposta_correta: string
  fonte?: string
  status?: string
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

    const supabase = getSupabaseAdmin()

    // Verificar se é professor
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('tipo')
      .eq('id', sessao.userId)
      .single()

    if (!usuario || usuario.tipo !== 'professor') {
      return NextResponse.json({
        sucesso: false,
        erro: 'Apenas professores podem importar questões.',
      }, { status: 403 })
    }

    const body = await request.json()
    const questoes: QuestaoImport[] = body.questoes || []

    if (questoes.length === 0) {
      return NextResponse.json({
        sucesso: false,
        erro: 'Nenhuma questão enviada',
      }, { status: 400 })
    }

    // Preparar dados para inserção
    const dadosParaInserir = questoes.map(q => ({
      id_api: q.id_api,
      ano_prova: q.ano_prova,
      numero_questao: q.numero_questao,
      area: q.area,
      subarea: q.subarea,
      titulo: q.titulo || null,
      contexto: q.contexto,
      comando: q.comando || null,
      imagem_principal: q.imagem_principal || null,
      imagens_extras: q.imagens_extras || [],
      alternativa_a: q.alternativa_a,
      alternativa_b: q.alternativa_b,
      alternativa_c: q.alternativa_c,
      alternativa_d: q.alternativa_d,
      alternativa_e: q.alternativa_e,
      imagem_a: q.imagem_a || null,
      imagem_b: q.imagem_b || null,
      imagem_c: q.imagem_c || null,
      imagem_d: q.imagem_d || null,
      imagem_e: q.imagem_e || null,
      resposta_correta: q.resposta_correta?.toUpperCase() || 'A',
      fonte: q.fonte || 'ENEM',
      status: q.status || 'ativa',
    }))

    // Inserir em lote (ignorando duplicatas)
    const { data, error } = await supabase
      .from('questoes_enem')
      .upsert(dadosParaInserir, {
        onConflict: 'id_api',
        ignoreDuplicates: true
      })
      .select('id')

    if (error) {
      console.error('Erro ao inserir lote:', error)
      return NextResponse.json({
        sucesso: false,
        erro: error.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      sucesso: true,
      importadas: data?.length || dadosParaInserir.length,
      ignoradas: dadosParaInserir.length - (data?.length || 0),
    })
  } catch (error) {
    console.error('Erro ao importar lote:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
