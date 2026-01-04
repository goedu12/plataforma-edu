import { NextRequest, NextResponse } from 'next/server'
import { obterSessao, hashSenha, validarTurma, validarComponenteNivel } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { normalizarTexto } from '@/lib/utils'
import { logger } from '@/lib/logger'
import * as XLSX from 'xlsx'

// Limites de segurança
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_LINHAS = 1000

interface LinhaImportacao {
  nome: string
  turma: string
  componente: string
}

export async function POST(request: NextRequest) {
  try {
    const sessao = await obterSessao()
    if (!sessao || sessao.tipo !== 'professor') {
      logger.warn('Tentativa de importação sem autorização')
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

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      logger.warn(`Arquivo muito grande: ${file.size} bytes`)
      return NextResponse.json(
        {
          sucesso: false,
          erro: `Arquivo muito grande. Máximo permitido: ${MAX_FILE_SIZE / 1024 / 1024}MB`
        },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv'
    ]
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json(
        { sucesso: false, erro: 'Tipo de arquivo inválido. Use .xlsx, .xls ou .csv' },
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

    // Validar limite de linhas
    if (dados.length > MAX_LINHAS) {
      logger.warn(`Arquivo com muitas linhas: ${dados.length}`)
      return NextResponse.json(
        {
          sucesso: false,
          erro: `Arquivo tem ${dados.length} linhas. Máximo permitido: ${MAX_LINHAS}`
        },
        { status: 400 }
      )
    }

    logger.info(`Importação iniciada: ${dados.length} linhas`)

    const supabase = getSupabaseAdmin()
    const senhaHash = await hashSenha('@estudante')

    const resultados = {
      total: dados.length,
      novos: 0,
      atualizados: 0,
      erros: 0,
      ignorados: 0,
      detalhes: [] as Array<{
        linha: number
        nome: string
        turma: string
        componente: string
        status: 'novo' | 'atualizado' | 'ignorado' | 'erro'
        erro?: string
      }>,
    }

    // Agrupar por nome+turma para consolidar componentes
    const estudantesPorChave = new Map<string, {
      nome: string
      turma: string
      componentes: string[]
      linhas: number[]
    }>()

    for (let i = 0; i < dados.length; i++) {
      const linha = dados[i]
      const numLinha = i + 2 // +2 porque linha 1 é cabeçalho

      const nome = linha.nome?.trim()
      const turma = linha.turma?.toString().trim().toUpperCase()
      const componente = linha.componente?.toString().trim().toLowerCase()

      // Validações básicas
      if (!nome || !turma || !componente) {
        resultados.erros++
        resultados.detalhes.push({
          linha: numLinha,
          nome: nome || '?',
          turma: turma || '?',
          componente: componente || '?',
          status: 'erro',
          erro: 'Campos obrigatórios faltando (nome, turma, componente)',
        })
        continue
      }

      // Validar turma
      const validacao = validarTurma(turma)
      if (!validacao.valida) {
        resultados.erros++
        resultados.detalhes.push({
          linha: numLinha,
          nome,
          turma,
          componente,
          status: 'erro',
          erro: validacao.erro || 'Turma inválida',
        })
        continue
      }

      // Normalizar componente
      const compNormalizado = componente === 'física' || componente === 'fisica' ? 'fisica' :
                             componente === 'matemática' || componente === 'matematica' ? 'matematica' : null

      if (!compNormalizado) {
        resultados.erros++
        resultados.detalhes.push({
          linha: numLinha,
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
          linha: numLinha,
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
        existente.linhas.push(numLinha)
        if (!existente.componentes.includes(compNormalizado)) {
          existente.componentes.push(compNormalizado)
        }
      } else {
        estudantesPorChave.set(chave, {
          nome,
          turma,
          componentes: [compNormalizado],
          linhas: [numLinha],
        })
      }
    }

    // Processar estudantes agrupados
    for (const [email, dadosEstudante] of estudantesPorChave) {
      const validacao = validarTurma(dadosEstudante.turma)
      const primeiraLinha = dadosEstudante.linhas[0]

      try {
        // Verificar se já existe (upsert por email)
        const { data: existente } = await supabase
          .from('usuarios')
          .select('id, componentes')
          .eq('email', email)
          .single()

        if (existente) {
          // Verificar se há novos componentes
          const componentesAtuais = existente.componentes || []
          const novosComponentes = dadosEstudante.componentes.filter(
            c => !componentesAtuais.includes(c)
          )

          if (novosComponentes.length === 0) {
            // Já existe com os mesmos componentes - ignorar
            resultados.ignorados++
            resultados.detalhes.push({
              linha: primeiraLinha,
              nome: dadosEstudante.nome,
              turma: dadosEstudante.turma,
              componente: dadosEstudante.componentes.join(', '),
              status: 'ignorado',
            })
          } else {
            // Atualizar componentes (upsert)
            const componentesUnicos = [...new Set([...componentesAtuais, ...dadosEstudante.componentes])]

            await supabase
              .from('usuarios')
              .update({ componentes: componentesUnicos })
              .eq('id', existente.id)

            resultados.atualizados++
            resultados.detalhes.push({
              linha: primeiraLinha,
              nome: dadosEstudante.nome,
              turma: dadosEstudante.turma,
              componente: dadosEstudante.componentes.join(', '),
              status: 'atualizado',
            })
          }
        } else {
          // Criar novo
          await supabase.from('usuarios').insert({
            email,
            senha_hash: senhaHash,
            nome: dadosEstudante.nome,
            turma: dadosEstudante.turma,
            ano: validacao.ano!,
            nivel: validacao.nivel!,
            componentes: dadosEstudante.componentes,
            tipo: 'estudante',
          })

          resultados.novos++
          resultados.detalhes.push({
            linha: primeiraLinha,
            nome: dadosEstudante.nome,
            turma: dadosEstudante.turma,
            componente: dadosEstudante.componentes.join(', '),
            status: 'novo',
          })
        }
      } catch (error) {
        logger.error('Erro ao processar estudante', error)
        resultados.erros++
        resultados.detalhes.push({
          linha: primeiraLinha,
          nome: dadosEstudante.nome,
          turma: dadosEstudante.turma,
          componente: dadosEstudante.componentes.join(', '),
          status: 'erro',
          erro: 'Erro ao salvar no banco de dados',
        })
      }
    }

    logger.info(`Importação concluída: ${resultados.novos} novos, ${resultados.atualizados} atualizados, ${resultados.ignorados} ignorados, ${resultados.erros} erros`)

    return NextResponse.json({
      sucesso: resultados.erros === 0,
      mensagem: `Importação concluída: ${resultados.novos} novos, ${resultados.atualizados} atualizados, ${resultados.ignorados} já existiam, ${resultados.erros} erros`,
      ...resultados,
    })
  } catch (error) {
    logger.error('Erro na importação', error)
    return NextResponse.json(
      { sucesso: false, erro: 'Erro ao processar arquivo. Verifique o formato.' },
      { status: 500 }
    )
  }
}
