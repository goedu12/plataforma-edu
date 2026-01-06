#!/usr/bin/env node
/**
 * ================================================================
 * SCRIPT DE IMPORTAÇÃO DE QUESTÕES DO ENEM
 * Busca todas as questões da API enem.dev e gera SQL para Supabase
 *
 * Uso: node scripts/importar-questoes-enem.mjs
 * ================================================================
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE = 'https://api.enem.dev/v1'

// Anos disponíveis na API (2009-2023)
const ANOS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009]

// Mapeamento de disciplinas para áreas
const DISCIPLINA_PARA_AREA = {
  'Ciências Humanas e suas Tecnologias': { area: 'ciencias-humanas', subarea: 'historia' },
  'Ciências da Natureza e suas Tecnologias': { area: 'ciencias-natureza', subarea: 'fisica' },
  'Linguagens, Códigos e suas Tecnologias': { area: 'linguagens', subarea: 'portugues' },
  'Matemática e suas Tecnologias': { area: 'matematica', subarea: 'matematica' },
}

// Função para escapar strings para SQL
function escaparSQL(str) {
  if (!str) return ''
  return str
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
}

// Função para aguardar (rate limit 1 req/s)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Buscar questões de um ano
async function buscarQuestoesAno(ano) {
  const todas = []
  let offset = 0
  const limit = 50

  while (true) {
    try {
      console.log(`  📥 Buscando ano ${ano}, offset ${offset}...`)

      const url = `${API_BASE}/exams/${ano}/questions?limit=${limit}&offset=${offset}`
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })

      if (!response.ok) {
        console.log(`  ⚠️ Erro HTTP ${response.status} para ano ${ano}`)
        break
      }

      const data = await response.json()
      const questoes = data.questions || []

      if (questoes.length === 0) break

      todas.push(...questoes)
      offset += limit

      // Rate limit: aguardar 1.1 segundos entre requisições
      await sleep(1100)

      // Se recebeu menos que o limite, acabaram as questões
      if (questoes.length < limit) break

    } catch (error) {
      console.error(`  ❌ Erro ao buscar ano ${ano}:`, error.message || error)
      break
    }
  }

  return todas
}

// Converter questão da API para formato SQL
function converterQuestao(q) {
  // Verificar alternativas
  const altA = q.alternatives?.find(a => a.letter === 'A')
  const altB = q.alternatives?.find(a => a.letter === 'B')
  const altC = q.alternatives?.find(a => a.letter === 'C')
  const altD = q.alternatives?.find(a => a.letter === 'D')
  const altE = q.alternatives?.find(a => a.letter === 'E')

  // Validar que todas as alternativas existem e têm texto
  if (!altA?.text || !altB?.text || !altC?.text || !altD?.text || !altE?.text) {
    return null // Questão inválida
  }

  // Mapear disciplina para área/subárea
  const mapping = DISCIPLINA_PARA_AREA[q.discipline] || { area: 'outros', subarea: 'outros' }

  return {
    id_api: `enem-${q.year}-${q.index}`,
    ano_prova: q.year,
    numero_questao: q.index,
    area: mapping.area,
    area_nome: q.discipline,
    subarea: mapping.subarea,
    titulo: q.title || `Questão ${q.index} - ENEM ${q.year}`,
    contexto: q.context || '',
    comando: q.alternativesIntroduction || null,
    imagem_principal: q.files && q.files.length > 0 ? q.files[0] : null,
    alternativa_a: altA.text,
    alternativa_b: altB.text,
    alternativa_c: altC.text,
    alternativa_d: altD.text,
    alternativa_e: altE.text,
    imagem_a: altA.file || null,
    imagem_b: altB.file || null,
    imagem_c: altC.file || null,
    imagem_d: altD.file || null,
    imagem_e: altE.file || null,
    resposta_correta: (q.correctAlternative || 'A').toUpperCase(),
  }
}

// Gerar SQL INSERT para uma questão
function gerarInsertSQL(q) {
  return `(
    '${escaparSQL(q.id_api)}',
    ${q.ano_prova},
    ${q.numero_questao},
    '${escaparSQL(q.area)}',
    '${escaparSQL(q.area_nome)}',
    '${escaparSQL(q.subarea)}',
    '${escaparSQL(q.titulo)}',
    '${escaparSQL(q.contexto)}',
    ${q.comando ? `'${escaparSQL(q.comando)}'` : 'NULL'},
    ${q.imagem_principal ? `'${escaparSQL(q.imagem_principal)}'` : 'NULL'},
    '${escaparSQL(q.alternativa_a)}',
    '${escaparSQL(q.alternativa_b)}',
    '${escaparSQL(q.alternativa_c)}',
    '${escaparSQL(q.alternativa_d)}',
    '${escaparSQL(q.alternativa_e)}',
    ${q.imagem_a ? `'${escaparSQL(q.imagem_a)}'` : 'NULL'},
    ${q.imagem_b ? `'${escaparSQL(q.imagem_b)}'` : 'NULL'},
    ${q.imagem_c ? `'${escaparSQL(q.imagem_c)}'` : 'NULL'},
    ${q.imagem_d ? `'${escaparSQL(q.imagem_d)}'` : 'NULL'},
    ${q.imagem_e ? `'${escaparSQL(q.imagem_e)}'` : 'NULL'},
    '${escaparSQL(q.resposta_correta)}',
    'API-ENEM',
    'ativa'
  )`
}

// Função principal
async function main() {
  console.log('🚀 Iniciando importação de questões do ENEM...\n')
  console.log(`📅 Anos a buscar: ${ANOS.join(', ')}\n`)

  const todasQuestoes = []
  const estatisticas = {}

  for (const ano of ANOS) {
    console.log(`\n📆 Processando ano ${ano}...`)

    const questoesAPI = await buscarQuestoesAno(ano)
    console.log(`  📊 Encontradas ${questoesAPI.length} questões`)

    let validasAno = 0
    for (const q of questoesAPI) {
      const convertida = converterQuestao(q)
      if (convertida) {
        todasQuestoes.push(convertida)
        validasAno++

        // Contabilizar por área
        const area = convertida.area
        estatisticas[area] = (estatisticas[area] || 0) + 1
      }
    }

    console.log(`  ✅ ${validasAno} questões válidas`)
  }

  console.log('\n' + '='.repeat(60))
  console.log(`📊 RESUMO DA IMPORTAÇÃO`)
  console.log('='.repeat(60))
  console.log(`\nTotal de questões válidas: ${todasQuestoes.length}`)
  console.log('\nPor área:')
  for (const [area, count] of Object.entries(estatisticas).sort()) {
    console.log(`  - ${area}: ${count} questões`)
  }

  // Gerar arquivo SQL
  console.log('\n📝 Gerando arquivo SQL...')

  const sqlHeader = `-- ================================================================
-- IMPORTAÇÃO DE QUESTÕES DO ENEM
-- Gerado automaticamente em: ${new Date().toISOString()}
-- Total de questões: ${todasQuestoes.length}
-- ================================================================

-- Limpar questões com problemas antes de inserir
DELETE FROM respostas_enem WHERE questao_id IN (
    SELECT id FROM questoes_enem WHERE alternativa_a = '' OR alternativa_a IS NULL
);
DELETE FROM questoes_enem WHERE alternativa_a = '' OR alternativa_a IS NULL;

-- Inserir questões
INSERT INTO questoes_enem (
    id_api,
    ano_prova,
    numero_questao,
    area,
    area_nome,
    subarea,
    titulo,
    contexto,
    comando,
    imagem_principal,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    alternativa_e,
    imagem_a,
    imagem_b,
    imagem_c,
    imagem_d,
    imagem_e,
    resposta_correta,
    fonte,
    status
) VALUES
`

  const sqlValues = todasQuestoes.map(q => gerarInsertSQL(q)).join(',\n')

  const sqlFooter = `
ON CONFLICT (id_api) DO UPDATE SET
    contexto = EXCLUDED.contexto,
    comando = EXCLUDED.comando,
    imagem_principal = EXCLUDED.imagem_principal,
    alternativa_a = EXCLUDED.alternativa_a,
    alternativa_b = EXCLUDED.alternativa_b,
    alternativa_c = EXCLUDED.alternativa_c,
    alternativa_d = EXCLUDED.alternativa_d,
    alternativa_e = EXCLUDED.alternativa_e,
    imagem_a = EXCLUDED.imagem_a,
    imagem_b = EXCLUDED.imagem_b,
    imagem_c = EXCLUDED.imagem_c,
    imagem_d = EXCLUDED.imagem_d,
    imagem_e = EXCLUDED.imagem_e,
    resposta_correta = EXCLUDED.resposta_correta,
    status = 'ativa',
    atualizado_em = NOW();

-- ================================================================
-- VERIFICAÇÃO
-- ================================================================

SELECT
    area,
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE status = 'ativa') as ativas
FROM questoes_enem
GROUP BY area
ORDER BY area;

SELECT 'Total de questões importadas:' as info, COUNT(*) as total FROM questoes_enem;
`

  const sqlCompleto = sqlHeader + sqlValues + sqlFooter

  // Salvar arquivo
  const outputPath = path.join(__dirname, '..', 'sql', 'questoes_enem_completo.sql')
  fs.writeFileSync(outputPath, sqlCompleto, 'utf-8')

  console.log(`\n✅ Arquivo SQL gerado: ${outputPath}`)
  console.log(`📏 Tamanho: ${(sqlCompleto.length / 1024 / 1024).toFixed(2)} MB`)
  console.log('\n🎯 Próximo passo: Execute o arquivo SQL no Supabase SQL Editor')
}

// Executar
main().catch(console.error)
