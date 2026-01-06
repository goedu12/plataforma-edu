-- ═══════════════════════════════════════════════════════════════════════════
-- STUDÃO - Script de Verificação e Diagnóstico
-- Execute este script no Supabase SQL Editor para verificar a configuração
-- ═══════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 1. VERIFICAR TABELA configuracoes_plataforma                           │
-- └─────────────────────────────────────────────────────────────────────────┘

SELECT '═══ VERIFICAÇÃO: Tabela configuracoes_plataforma ═══' AS diagnostico;

-- Verificar se a tabela existe
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuracoes_plataforma')
    THEN '✅ Tabela configuracoes_plataforma EXISTE'
    ELSE '❌ Tabela configuracoes_plataforma NÃO EXISTE - Execute o script de criação!'
  END AS status_tabela;

-- Listar registros da tabela (se existir)
SELECT
  chave,
  CASE
    WHEN valor IS NULL THEN '(vazio)'
    WHEN LENGTH(valor) > 50 THEN SUBSTRING(valor, 1, 50) || '...'
    ELSE valor
  END AS valor,
  tipo,
  atualizado_em
FROM configuracoes_plataforma
ORDER BY chave;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 2. VERIFICAR BUCKET DE STORAGE (logos)                                 │
-- └─────────────────────────────────────────────────────────────────────────┘

SELECT '═══ VERIFICAÇÃO: Bucket de Storage ═══' AS diagnostico;

-- Verificar buckets existentes
SELECT
  id AS bucket_id,
  name AS bucket_name,
  public AS is_public,
  created_at
FROM storage.buckets
WHERE name = 'logos';

-- Verificar se o bucket logos existe
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'logos')
    THEN '✅ Bucket "logos" EXISTE'
    ELSE '❌ Bucket "logos" NÃO EXISTE - Crie manualmente!'
  END AS status_bucket;

-- Verificar se o bucket é público
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'logos' AND public = true)
    THEN '✅ Bucket "logos" está PÚBLICO'
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'logos' AND public = false)
    THEN '⚠️ Bucket "logos" está PRIVADO - Altere para público!'
    ELSE '❌ Bucket "logos" não encontrado'
  END AS status_bucket_publico;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 3. VERIFICAR POLÍTICAS DE STORAGE                                      │
-- └─────────────────────────────────────────────────────────────────────────┘

SELECT '═══ VERIFICAÇÃO: Políticas de Storage ═══' AS diagnostico;

-- Listar todas as políticas do bucket logos
SELECT
  policyname AS nome_politica,
  permissive,
  roles,
  cmd AS operacao,
  qual AS condicao
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (qual::text LIKE '%logos%' OR policyname LIKE '%logos%' OR policyname LIKE '%Logos%');


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 4. VERIFICAR ARQUIVOS NO BUCKET                                        │
-- └─────────────────────────────────────────────────────────────────────────┘

SELECT '═══ VERIFICAÇÃO: Arquivos no Bucket logos ═══' AS diagnostico;

-- Listar arquivos no bucket logos
SELECT
  name AS nome_arquivo,
  bucket_id,
  created_at,
  updated_at,
  ROUND(metadata->>'size'::numeric / 1024, 2) AS tamanho_kb
FROM storage.objects
WHERE bucket_id = 'logos'
ORDER BY created_at DESC
LIMIT 10;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 5. VERIFICAR TABELA USUARIOS (campo ano para filtro de mapas)          │
-- └─────────────────────────────────────────────────────────────────────────┘

SELECT '═══ VERIFICAÇÃO: Campo "ano" na tabela usuarios ═══' AS diagnostico;

-- Verificar se o campo ano existe
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'usuarios' AND column_name = 'ano'
    )
    THEN '✅ Campo "ano" EXISTE na tabela usuarios'
    ELSE '❌ Campo "ano" NÃO EXISTE - Adicione com: ALTER TABLE usuarios ADD COLUMN ano INTEGER;'
  END AS status_campo_ano;

-- Verificar distribuição de anos dos estudantes
SELECT
  ano,
  COUNT(*) AS quantidade_estudantes
FROM usuarios
WHERE tipo = 'estudante' AND ano IS NOT NULL
GROUP BY ano
ORDER BY ano;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 6. VERIFICAR TABELA MAPAS MENTAIS                                      │
-- └─────────────────────────────────────────────────────────────────────────┘

SELECT '═══ VERIFICAÇÃO: Mapas Mentais por Série ═══' AS diagnostico;

-- Verificar distribuição de mapas por série
SELECT
  serie,
  COUNT(*) AS quantidade_mapas,
  COUNT(DISTINCT componente) AS componentes
FROM mapas_mentais
GROUP BY serie
ORDER BY serie;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 7. RESUMO FINAL                                                        │
-- └─────────────────────────────────────────────────────────────────────────┘

SELECT '═══════════════════════════════════════════════════════════════' AS linha;
SELECT '                    RESUMO DO DIAGNÓSTICO                       ' AS titulo;
SELECT '═══════════════════════════════════════════════════════════════' AS linha;

SELECT
  (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'configuracoes_plataforma') THEN '✅' ELSE '❌' END) AS "Tabela Config",
  (SELECT CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'logos') THEN '✅' ELSE '❌' END) AS "Bucket Logos",
  (SELECT CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'logos' AND public = true) THEN '✅' ELSE '⚠️' END) AS "Bucket Público",
  (SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'ano') THEN '✅' ELSE '❌' END) AS "Campo Ano",
  (SELECT COUNT(*)::text FROM mapas_mentais) AS "Total Mapas",
  (SELECT COUNT(*)::text FROM usuarios WHERE tipo = 'estudante') AS "Total Estudantes";
