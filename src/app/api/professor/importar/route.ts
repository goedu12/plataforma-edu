import { NextRequest, NextResponse } from 'next/server'
import { obterSessao, hashSenha, validarTurma, validarComponenteNivel } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizarTexto } from '@/lib/utils'
import * as XLSX from 'xlsx'

interface LinhaImportacao {
  nome: string
  turma: string
  componente: string
}

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      return NextResponse.json(
        { sucesso: false, erro: 'Acesso não autorizado' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('arquivo') as File

    if (!file) {
      return NextResponse.json(
        { sucesso: false, erro: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Ler arquivo
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const dados: LinhaImportacao[] = XLSX.utils.sheet_to_json(worksheet)

    if (dados.length === 0) {
      return NextResponse.json(
        { sucesso: false, erro: 'Arquivo vazio ou formato inválido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const senhaHash = await hashSenha('@estudante')

    const resultados = {
      total: dados.length,
      novos: 0,
      atualizados: 0,
      erros: 0,
      detalhes: [] as Array<{
        nome: string
        turma: string
        componente: string
        status: 'novo' | 'atualizar' | 'erro'
        erro?: string
      }>,
    }

    // Agrupar por nome+turma para consolidar componentes
    const estudantesPorChave = new Map<string, {
      nome: string
      turma: string
      componentes: string[]
    }>()

    for (const linha of dados) {
      const nome = linha.nome?.trim()
      const turma = linha.turma?.toString().trim().toUpperCase()
      const componente = linha.componente?.toString().trim().toLowerCase()

      // Validações básicas
      if (!nome || !turma || !componente) {
        resultados.erros++
        resultados.detalhes.push({
          nome: nome || '?',
          turma: turma || '?',
          componente: componente || '?',
          status: 'erro',
          erro: 'Campos obrigatórios faltando',
        })
        continue
      }

      // Validar turma
      const validacao = validarTurma(turma)
      if (!validacao.valida) {
        resultados.erros++
        resultados.detalhes.push({
          nome,
          turma,
          componente,
          status: 'erro',
          erro: validacao.erro,
        })
        continue
      }

      // Normalizar componente
      const compNormalizado = componente === 'física' || componente === 'fisica' ? 'fisica' :
                             componente === 'matemática' || componente === 'matematica' ? 'matematica' : null

      if (!compNormalizado) {
        resultados.erros++
        resultados.detalhes.push({
          nome,
          turma,
          componente,
          status: 'erro',
          erro: 'Componente inválido (use: fisica ou matematica)',
        })
        continue
      }

      // Validar componente para o nível
      if (!validarComponenteNivel(compNormalizado, validacao.nivel!)) {
        resultados.erros++
        resultados.detalhes.push({
          nome,
          turma,
          componente,
          status: 'erro',
          erro: 'Física disponível apenas para Ensino Médio',
        })
        continue
      }

      // Agrupar componentes por estudante
      const chave = `${normalizarTexto(nome)}@${turma.toLowerCase()}`
      if (estudantesPorChave.has(chave)) {
        const existente = estudantesPorChave.get(chave)!
        if (!existente.componentes.includes(compNormalizado)) {
          existente.componentes.push(compNormalizado)
        }
      } else {
        estudantesPorChave.set(chave, {
          nome,
          turma,
          componentes: [compNormalizado],
        })
      }
    }

    // Processar estudantes agrupados
    for (const [email, dados] of estudantesPorChave) {
      const validacao = validarTurma(dados.turma)

      try {
        // Verificar se já existe
        const { data: existente } = await supabase
          .from('usuarios')
          .select('id, componentes')
          .eq('email', email)
          .single()

        if (existente) {
          // Atualizar componentes
          const componentesUnicos = [...new Set([...existente.componentes, ...dados.componentes])]

          await supabase
            .from('usuarios')
            .update({ componentes: componentesUnicos })
            .eq('id', existente.id)

          resultados.atualizados++
          resultados.detalhes.push({
            nome: dados.nome,
            turma: dados.turma,
            componente: dados.componentes.join(', '),
            status: 'atualizar',
          })
        } else {
          // Criar novo
          await supabase.from('usuarios').insert({
            email,
            senha_hash: senhaHash,
            nome: dados.nome,
            turma: dados.turma,
            ano: validacao.ano!,
            nivel: validacao.nivel!,
            componentes: dados.componentes,
            tipo: 'estudante',
          })

          resultados.novos++
          resultados.detalhes.push({
            nome: dados.nome,
            turma: dados.turma,
            componente: dados.componentes.join(', '),
            status: 'novo',
          })
        }
      } catch (error) {
        console.error('Erro ao processar estudante:', error)
        resultados.erros++
        resultados.detalhes.push({
          nome: dados.nome,
          turma: dados.turma,
          componente: dados.componentes.join(', '),
          status: 'erro',
          erro: 'Erro ao salvar no banco de dados',
        })
      }
    }

    return NextResponse.json({
      sucesso: true,
      ...resultados,
    })
  } catch (error) {
    console.error('Erro na importação:', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao processar arquivo' },
      { status: 500 }
    )
  }
}
