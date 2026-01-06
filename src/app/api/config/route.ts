import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Valores padrão para quando a tabela não existir ou houver erro
const CONFIGURACOES_PADRAO = {
  nome_plataforma: 'Studão',
  versao: '4.0',
  nome_instituicao: 'Colégio Cora Coralina',
  logo_url: null,
  logo_largura: '280',
  logo_altura: '100',
  cor_primaria: '#22c55e',
  cor_secundaria: '#8b5cf6'
}

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Usar anon key para configurações públicas (mais confiável)
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

// GET - Obter configurações públicas da plataforma
export async function GET() {
  try {
    const supabase = getSupabase()

    // Se não há conexão com Supabase, retorna valores padrão
    if (!supabase) {
      return NextResponse.json({
        sucesso: true,
        configuracoes: CONFIGURACOES_PADRAO
      })
    }

    const { data, error } = await supabase
      .from('configuracoes_plataforma')
      .select('chave, valor, tipo')
      .in('chave', [
        'nome_plataforma',
        'versao',
        'nome_instituicao',
        'logo_url',
        'logo_largura',
        'logo_altura',
        'cor_primaria',
        'cor_secundaria'
      ])

    if (error) {
      console.error('Erro ao buscar configurações:', error)
      // Retorna valores padrão se a tabela não existir
      return NextResponse.json({
        sucesso: true,
        configuracoes: CONFIGURACOES_PADRAO
      })
    }

    // Transformar array em objeto
    const configuracoes: Record<string, string | null> = { ...CONFIGURACOES_PADRAO }
    data?.forEach(item => {
      configuracoes[item.chave] = item.valor
    })

    return NextResponse.json({
      sucesso: true,
      configuracoes
    })
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json({
      sucesso: true,
      configuracoes: CONFIGURACOES_PADRAO
    })
  }
}
