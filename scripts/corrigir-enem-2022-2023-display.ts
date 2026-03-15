/**
 * ================================================================
 * CORREÇÃO DE DADOS: QUESTÕES ENEM 2022/2023
 * Padronizar para o formato de 2024/2025
 * ================================================================
 *
 * Uso:
 *   npx tsx scripts/corrigir-enem-2022-2023-display.ts
 *   npx tsx scripts/corrigir-enem-2022-2023-display.ts --dry-run
 *
 * Variáveis de ambiente necessárias:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY (ou SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const DRY_RUN = process.argv.includes('--dry-run')

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas.')
  console.error('   NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_KEY são obrigatórias.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Mapeamento de áreas sem acento -> com acento (padrão 2024/2025)
const AREA_CORRECOES: Record<string, string> = {
  'Linguagens, Codigos e suas Tecnologias': 'Linguagens, Códigos e suas Tecnologias',
  'Ciencias Humanas e suas Tecnologias': 'Ciências Humanas e suas Tecnologias',
  'Ciencias da Natureza e suas Tecnologias': 'Ciências da Natureza e suas Tecnologias',
  'Matematica e suas Tecnologias': 'Matemática e suas Tecnologias',
}

const AREAS_CORRETAS = [
  'Linguagens, Códigos e suas Tecnologias',
  'Ciências Humanas e suas Tecnologias',
  'Ciências da Natureza e suas Tecnologias',
  'Matemática e suas Tecnologias',
]

const IMAGEM_INVALIDA = /^(nan|none|null|undefined|\s*)$/i

interface Questao {
  id: string
  ano: number
  area: string
  comando: string | null
  elementos: unknown[] | null
  alt_a_imagem: string | null
  alt_b_imagem: string | null
  alt_c_imagem: string | null
  alt_d_imagem: string | null
  alt_e_imagem: string | null
  tem_imagem: boolean
  tem_imagem_alternativa: boolean
}

async function diagnostico() {
  console.log('\n📊 DIAGNÓSTICO ENEM 2022/2023\n')

  for (const ano of [2022, 2023]) {
    const { data: questoes, error } = await supabase
      .from('questoes_enem')
      .select('id, ano, area, comando, elementos, alt_a_imagem, alt_b_imagem, alt_c_imagem, alt_d_imagem, alt_e_imagem, tem_imagem, tem_imagem_alternativa')
      .eq('ano', ano)

    if (error) {
      console.error(`❌ Erro ao buscar questões ${ano}:`, error.message)
      continue
    }

    const total = questoes?.length || 0
    const semElementos = questoes?.filter(q =>
      !q.elementos || !Array.isArray(q.elementos) || q.elementos.length === 0 ||
      q.elementos.every(e => e === null)
    ).length || 0
    const areasErradas = questoes?.filter(q => !AREAS_CORRETAS.includes(q.area)).length || 0
    const imagensInvalidas = questoes?.filter(q =>
      [q.alt_a_imagem, q.alt_b_imagem, q.alt_c_imagem, q.alt_d_imagem, q.alt_e_imagem]
        .some(img => img && IMAGEM_INVALIDA.test(img.trim()))
    ).length || 0

    console.log(`  ENEM ${ano}: ${total} questões`)
    console.log(`    - Sem elementos válidos: ${semElementos}`)
    console.log(`    - Áreas não padronizadas: ${areasErradas}`)
    console.log(`    - Com imagens inválidas nas alternativas: ${imagensInvalidas}`)
    console.log()
  }
}

async function corrigirAreas() {
  console.log('🔧 Corrigindo nomes de áreas...')
  let totalCorrigidas = 0

  for (const [errada, correta] of Object.entries(AREA_CORRECOES)) {
    if (DRY_RUN) {
      const { count } = await supabase
        .from('questoes_enem')
        .select('id', { count: 'exact', head: true })
        .in('ano', [2022, 2023])
        .eq('area', errada)
      console.log(`  [DRY-RUN] "${errada}" → "${correta}": ${count || 0} questões`)
      totalCorrigidas += count || 0
    } else {
      const { data, error } = await supabase
        .from('questoes_enem')
        .update({ area: correta })
        .in('ano', [2022, 2023])
        .eq('area', errada)
        .select('id')

      const qtd = data?.length || 0
      if (error) {
        console.error(`  ❌ Erro ao corrigir "${errada}":`, error.message)
      } else if (qtd > 0) {
        console.log(`  ✅ "${errada}" → "${correta}": ${qtd} questões corrigidas`)
        totalCorrigidas += qtd
      }
    }
  }

  console.log(`  Total: ${totalCorrigidas} questões com área corrigida\n`)
  return totalCorrigidas
}

async function corrigirElementosVazios() {
  console.log('🔧 Criando elementos para questões sem elementos...')

  const { data: questoes, error } = await supabase
    .from('questoes_enem')
    .select('id, comando, elementos')
    .in('ano', [2022, 2023])
    .not('comando', 'is', null)

  if (error) {
    console.error('  ❌ Erro:', error.message)
    return 0
  }

  const semElementos = questoes?.filter(q =>
    !q.elementos || !Array.isArray(q.elementos) || q.elementos.length === 0 ||
    q.elementos.every((e: unknown) => e === null)
  ) || []

  if (semElementos.length === 0) {
    console.log('  ✅ Todas as questões já possuem elementos\n')
    return 0
  }

  console.log(`  Encontradas ${semElementos.length} questões sem elementos`)

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] ${semElementos.length} questões seriam atualizadas\n`)
    return semElementos.length
  }

  let corrigidas = 0
  for (const q of semElementos) {
    const elementos = [{ tipo: 'comando', conteudo: q.comando, ordem: 1 }]
    const { error: updateError } = await supabase
      .from('questoes_enem')
      .update({ elementos })
      .eq('id', q.id)

    if (updateError) {
      console.error(`  ❌ Erro Q${q.id}:`, updateError.message)
    } else {
      corrigidas++
    }
  }

  console.log(`  ✅ ${corrigidas} questões agora possuem elementos\n`)
  return corrigidas
}

async function limparImagensInvalidas() {
  console.log('🔧 Limpando URLs de imagem inválidas...')

  const { data: questoes, error } = await supabase
    .from('questoes_enem')
    .select('id, alt_a_imagem, alt_b_imagem, alt_c_imagem, alt_d_imagem, alt_e_imagem')
    .in('ano', [2022, 2023])

  if (error) {
    console.error('  ❌ Erro:', error.message)
    return 0
  }

  let corrigidas = 0
  for (const q of questoes || []) {
    const updates: Record<string, null> = {}
    for (const campo of ['alt_a_imagem', 'alt_b_imagem', 'alt_c_imagem', 'alt_d_imagem', 'alt_e_imagem'] as const) {
      const valor = q[campo as keyof typeof q] as string | null
      if (valor && IMAGEM_INVALIDA.test(valor.trim())) {
        updates[campo] = null
      }
    }

    if (Object.keys(updates).length > 0) {
      if (DRY_RUN) {
        console.log(`  [DRY-RUN] Q${q.id}: limparia ${Object.keys(updates).join(', ')}`)
        corrigidas++
      } else {
        const { error: updateError } = await supabase
          .from('questoes_enem')
          .update(updates)
          .eq('id', q.id)

        if (!updateError) corrigidas++
      }
    }
  }

  console.log(`  ✅ ${corrigidas} questões com imagens inválidas limpas\n`)
  return corrigidas
}

async function atualizarFlags() {
  console.log('🔧 Atualizando flags tem_imagem_alternativa...')

  const { data: questoes, error } = await supabase
    .from('questoes_enem')
    .select('id, alt_a_imagem, alt_b_imagem, alt_c_imagem, alt_d_imagem, alt_e_imagem, tem_imagem_alternativa')
    .in('ano', [2022, 2023])

  if (error) {
    console.error('  ❌ Erro:', error.message)
    return 0
  }

  let corrigidas = 0
  for (const q of questoes || []) {
    const temImgAlt = [q.alt_a_imagem, q.alt_b_imagem, q.alt_c_imagem, q.alt_d_imagem, q.alt_e_imagem]
      .some(img => img && img.trim() !== '' && !IMAGEM_INVALIDA.test(img.trim()))

    if (temImgAlt !== q.tem_imagem_alternativa) {
      if (!DRY_RUN) {
        await supabase
          .from('questoes_enem')
          .update({ tem_imagem_alternativa: temImgAlt })
          .eq('id', q.id)
      }
      corrigidas++
    }
  }

  console.log(`  ✅ ${corrigidas} flags atualizadas\n`)
  return corrigidas
}

async function verificacaoFinal() {
  console.log('📋 VERIFICAÇÃO FINAL\n')

  for (const ano of [2022, 2023, 2024, 2025]) {
    const { count: total } = await supabase
      .from('questoes_enem')
      .select('id', { count: 'exact', head: true })
      .eq('ano', ano)

    const { count: comElementos } = await supabase
      .from('questoes_enem')
      .select('id', { count: 'exact', head: true })
      .eq('ano', ano)
      .not('elementos', 'is', null)

    const { count: areaOk } = await supabase
      .from('questoes_enem')
      .select('id', { count: 'exact', head: true })
      .eq('ano', ano)
      .in('area', AREAS_CORRETAS)

    console.log(`  ENEM ${ano}: ${total} total | ${comElementos} com elementos | ${areaOk} área OK`)
  }
  console.log()
}

async function main() {
  console.log('═══════════════════════════════════════════════════')
  console.log(' CORREÇÃO ENEM 2022/2023 - Padronizar Display')
  console.log(DRY_RUN ? ' [MODO DRY-RUN - Nenhuma alteração será feita]' : ' [MODO EXECUÇÃO - Alterações serão aplicadas]')
  console.log('═══════════════════════════════════════════════════')

  await diagnostico()

  await corrigirAreas()
  await corrigirElementosVazios()
  await limparImagensInvalidas()
  await atualizarFlags()

  await verificacaoFinal()

  console.log(DRY_RUN
    ? '✅ Dry-run concluído. Execute sem --dry-run para aplicar.'
    : '✅ Correções aplicadas com sucesso!'
  )
}

main().catch(err => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})
