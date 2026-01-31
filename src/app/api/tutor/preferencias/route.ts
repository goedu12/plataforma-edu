export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// ═══════════════════════════════════════════════════════════
// API DE PREFERÊNCIAS DE APRENDIZAGEM
// Personaliza a experiência do tutor IA
// ═══════════════════════════════════════════════════════════

export interface PreferenciasEstudante {
  prefere_analogias: boolean
  prefere_formulas: boolean
  prefere_exemplos: boolean
  prefere_visual: boolean
  prefere_passo_a_passo: boolean
  nivel_detalhe: 'minimo' | 'medio' | 'maximo'
  tom_conversa: 'formal' | 'amigavel' | 'descontraido'
  velocidade: 'lento' | 'normal' | 'rapido'
  usar_exemplos_brasileiros: boolean
}

const PREFERENCIAS_PADRAO: PreferenciasEstudante = {
  prefere_analogias: true,
  prefere_formulas: true,
  prefere_exemplos: true,
  prefere_visual: true,
  prefere_passo_a_passo: true,
  nivel_detalhe: 'medio',
  tom_conversa: 'amigavel',
  velocidade: 'normal',
  usar_exemplos_brasileiros: true,
}

// GET - Obter preferências do estudante
export async function GET() {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    const { data: preferencias, error } = await supabase
      .from('estudante_preferencias')
      .select('*')
      .eq('usuario_id', sessaoAuth.userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('[Preferências] Erro ao buscar:', error)
      return NextResponse.json({ sucesso: false, erro: 'Erro ao buscar preferências' }, { status: 500 })
    }

    // Retornar preferências existentes ou padrão
    return NextResponse.json({
      sucesso: true,
      preferencias: preferencias || PREFERENCIAS_PADRAO,
      existente: !!preferencias,
    })
  } catch (error) {
    console.error('[Preferências] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar ou atualizar preferências
export async function POST(request: NextRequest) {
  try {
    const sessaoAuth = await obterSessao()
    if (!sessaoAuth) {
      return NextResponse.json({ sucesso: false, erro: 'Não autenticado' }, { status: 401 })
    }

    const dados = await request.json()

    // Validar campos
    const preferenciasValidas: Partial<PreferenciasEstudante> = {}

    if (typeof dados.prefere_analogias === 'boolean') {
      preferenciasValidas.prefere_analogias = dados.prefere_analogias
    }
    if (typeof dados.prefere_formulas === 'boolean') {
      preferenciasValidas.prefere_formulas = dados.prefere_formulas
    }
    if (typeof dados.prefere_exemplos === 'boolean') {
      preferenciasValidas.prefere_exemplos = dados.prefere_exemplos
    }
    if (typeof dados.prefere_visual === 'boolean') {
      preferenciasValidas.prefere_visual = dados.prefere_visual
    }
    if (typeof dados.prefere_passo_a_passo === 'boolean') {
      preferenciasValidas.prefere_passo_a_passo = dados.prefere_passo_a_passo
    }
    if (['minimo', 'medio', 'maximo'].includes(dados.nivel_detalhe)) {
      preferenciasValidas.nivel_detalhe = dados.nivel_detalhe
    }
    if (['formal', 'amigavel', 'descontraido'].includes(dados.tom_conversa)) {
      preferenciasValidas.tom_conversa = dados.tom_conversa
    }
    if (['lento', 'normal', 'rapido'].includes(dados.velocidade)) {
      preferenciasValidas.velocidade = dados.velocidade
    }
    if (typeof dados.usar_exemplos_brasileiros === 'boolean') {
      preferenciasValidas.usar_exemplos_brasileiros = dados.usar_exemplos_brasileiros
    }

    const supabase = getSupabaseAdmin()

    // Upsert (criar ou atualizar)
    const { data: preferencias, error } = await supabase
      .from('estudante_preferencias')
      .upsert({
        usuario_id: sessaoAuth.userId,
        ...PREFERENCIAS_PADRAO,
        ...preferenciasValidas,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'usuario_id',
      })
      .select()
      .single()

    if (error) {
      console.error('[Preferências] Erro ao salvar:', error)
      return NextResponse.json({ sucesso: false, erro: 'Erro ao salvar preferências' }, { status: 500 })
    }

    return NextResponse.json({
      sucesso: true,
      preferencias,
      mensagem: 'Preferências salvas com sucesso',
    })
  } catch (error) {
    console.error('[Preferências] Erro:', error)
    return NextResponse.json({ sucesso: false, erro: 'Erro interno' }, { status: 500 })
  }
}
