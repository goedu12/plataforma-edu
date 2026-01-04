import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  // BLOQUEADO em produção - expõe informações sensíveis
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint desabilitado em produção' },
      { status: 403 }
    )
  }

  const resultados: {
    item: string
    status: 'OK' | 'ERRO'
    detalhes?: string
  }[] = []

  // Verificar variáveis de ambiente
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'GEMINI_API_KEY',
    'JWT_SECRET'
  ]

  for (const env of envVars) {
    resultados.push({
      item: `Variável ${env}`,
      status: process.env[env] ? 'OK' : 'ERRO',
      detalhes: process.env[env] ? 'Configurada' : 'NÃO ENCONTRADA'
    })
  }

  // Conectar ao Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      sucesso: false,
      mensagem: 'Variáveis do Supabase não configuradas',
      resultados
    })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Verificar tabelas
  const tabelas = ['usuarios', 'questoes', 'respostas', 'conquistas', 'conquistas_usuarios', 'historico_chat']

  for (const tabela of tabelas) {
    try {
      const { count, error } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true })

      if (error) {
        resultados.push({
          item: `Tabela: ${tabela}`,
          status: 'ERRO',
          detalhes: error.message
        })
      } else {
        resultados.push({
          item: `Tabela: ${tabela}`,
          status: 'OK',
          detalhes: `${count ?? 0} registros`
        })
      }
    } catch (e) {
      resultados.push({
        item: `Tabela: ${tabela}`,
        status: 'ERRO',
        detalhes: String(e)
      })
    }
  }

  // Verificar se há professor cadastrado
  try {
    const { data: professor, error } = await supabase
      .from('usuarios')
      .select('email, nome')
      .eq('tipo', 'professor')
      .single()

    if (error || !professor) {
      resultados.push({
        item: 'Professor cadastrado',
        status: 'ERRO',
        detalhes: 'Nenhum professor encontrado'
      })
    } else {
      resultados.push({
        item: 'Professor cadastrado',
        status: 'OK',
        detalhes: `${professor.nome} (${professor.email})`
      })
    }
  } catch (e) {
    resultados.push({
      item: 'Professor cadastrado',
      status: 'ERRO',
      detalhes: String(e)
    })
  }

  // Verificar se há estudantes cadastrados
  try {
    const { count, error } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'estudante')

    resultados.push({
      item: 'Estudantes cadastrados',
      status: (count ?? 0) > 0 ? 'OK' : 'ERRO',
      detalhes: `${count ?? 0} estudantes`
    })
  } catch (e) {
    resultados.push({
      item: 'Estudantes cadastrados',
      status: 'ERRO',
      detalhes: String(e)
    })
  }

  // Verificar questões
  try {
    const { data: questoes, error } = await supabase
      .from('questoes')
      .select('componente')

    if (error) {
      resultados.push({
        item: 'Questões cadastradas',
        status: 'ERRO',
        detalhes: error.message
      })
    } else {
      const fisica = questoes?.filter(q => q.componente === 'fisica').length ?? 0
      const matematica = questoes?.filter(q => q.componente === 'matematica').length ?? 0
      resultados.push({
        item: 'Questões cadastradas',
        status: (fisica + matematica) > 0 ? 'OK' : 'ERRO',
        detalhes: `Física: ${fisica}, Matemática: ${matematica}`
      })
    }
  } catch (e) {
    resultados.push({
      item: 'Questões cadastradas',
      status: 'ERRO',
      detalhes: String(e)
    })
  }

  // Verificar conquistas
  try {
    const { count, error } = await supabase
      .from('conquistas')
      .select('*', { count: 'exact', head: true })

    resultados.push({
      item: 'Conquistas cadastradas',
      status: (count ?? 0) > 0 ? 'OK' : 'ERRO',
      detalhes: `${count ?? 0} conquistas`
    })
  } catch (e) {
    resultados.push({
      item: 'Conquistas cadastradas',
      status: 'ERRO',
      detalhes: String(e)
    })
  }

  // Verificar Gemini API
  try {
    const geminiKey = process.env.GEMINI_API_KEY
    if (geminiKey && geminiKey.startsWith('AIza')) {
      resultados.push({
        item: 'Gemini API Key',
        status: 'OK',
        detalhes: 'Formato válido (AIza...)'
      })
    } else {
      resultados.push({
        item: 'Gemini API Key',
        status: 'ERRO',
        detalhes: 'Formato inválido'
      })
    }
  } catch (e) {
    resultados.push({
      item: 'Gemini API Key',
      status: 'ERRO',
      detalhes: String(e)
    })
  }

  // Resumo
  const totalOk = resultados.filter(r => r.status === 'OK').length
  const totalErro = resultados.filter(r => r.status === 'ERRO').length
  const sucesso = totalErro === 0

  return NextResponse.json({
    sucesso,
    mensagem: sucesso
      ? '✅ TUDO CONFIGURADO CORRETAMENTE!'
      : `⚠️ ${totalErro} problema(s) encontrado(s)`,
    resumo: {
      total: resultados.length,
      ok: totalOk,
      erros: totalErro
    },
    resultados
    // REMOVIDO: credenciais_teste - nunca expor senhas em endpoints
  })
}
