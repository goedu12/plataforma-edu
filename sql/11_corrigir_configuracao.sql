-- ═══════════════════════════════════════════════════════════════════════════
-- STUDÃO - Script de Correção Automática
-- Execute este script APÓS o diagnóstico para corrigir problemas
-- ═══════════════════════════════════════════════════════════════════════════

-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 1. CRIAR TABELA configuracoes_plataforma (se não existir)              │
-- └─────────────────────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS configuracoes_plataforma (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(50) DEFAULT 'texto',
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_por UUID REFERENCES usuarios(id)
);

-- Inserir configurações padrão
INSERT INTO configuracoes_plataforma (chave, valor, tipo, descricao)
VALUES
  ('nome_plataforma', 'Studão', 'texto', 'Nome da plataforma'),
  ('versao', '4.0', 'texto', 'Versão atual do sistema'),
  ('nome_instituicao', 'Colégio Cora Coralina', 'texto', 'Nome da instituição'),
  ('logo_url', NULL, 'url', 'URL do logo da plataforma no Supabase Storage')
ON CONFLICT (chave) DO NOTHING;

SELECT '✅ Tabela configuracoes_plataforma criada/verificada' AS status;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 2. CRIAR BUCKET logos (se não existir)                                 │
-- └─────────────────────────────────────────────────────────────────────────┘

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('logos', 'logos', true, 2097152)
ON CONFLICT (id) DO UPDATE SET public = true;

SELECT '✅ Bucket logos criado/atualizado para público' AS status;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 3. CRIAR POLÍTICAS DE STORAGE                                          │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Remover políticas antigas (se existirem) para recriar
DROP POLICY IF EXISTS "Logos publicos" ON storage.objects;
DROP POLICY IF EXISTS "Upload logos autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Delete logos autenticado" ON storage.objects;
DROP POLICY IF EXISTS "Update logos autenticado" ON storage.objects;

-- Política 1: Leitura pública (qualquer um pode ver os logos)
CREATE POLICY "Logos publicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Política 2: Upload para usuários autenticados
CREATE POLICY "Upload logos autenticado"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos');

-- Política 3: Delete para usuários autenticados
CREATE POLICY "Delete logos autenticado"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos');

-- Política 4: Update para usuários autenticados
CREATE POLICY "Update logos autenticado"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos');

SELECT '✅ Políticas de storage criadas' AS status;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 4. ADICIONAR CAMPO ano NA TABELA usuarios (se não existir)             │
-- └─────────────────────────────────────────────────────────────────────────┘

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios' AND column_name = 'ano'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN ano INTEGER;
    RAISE NOTICE '✅ Campo ano adicionado à tabela usuarios';
  ELSE
    RAISE NOTICE '✅ Campo ano já existe na tabela usuarios';
  END IF;
END $$;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 5. ATUALIZAR CAMPO ano BASEADO NA TURMA (OPCIONAL)                     │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Atualiza o campo 'ano' baseado no primeiro caractere da turma
-- Ex: turma '1A' -> ano = 1, turma '2B' -> ano = 2, turma '3C' -> ano = 3

UPDATE usuarios
SET ano = CASE
  WHEN turma LIKE '1%' THEN 1
  WHEN turma LIKE '2%' THEN 2
  WHEN turma LIKE '3%' THEN 3
  ELSE NULL
END
WHERE tipo = 'estudante' AND ano IS NULL;

SELECT '✅ Campo ano atualizado para estudantes baseado na turma' AS status;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 6. CRIAR ÍNDICES PARA PERFORMANCE                                      │
-- └─────────────────────────────────────────────────────────────────────────┘

-- Índice para busca de configurações por chave
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes_plataforma(chave);

-- Índice para filtro de mapas por série
CREATE INDEX IF NOT EXISTS idx_mapas_serie ON mapas_mentais(serie);

-- Índice para filtro de usuários por ano
CREATE INDEX IF NOT EXISTS idx_usuarios_ano ON usuarios(ano) WHERE tipo = 'estudante';

SELECT '✅ Índices criados' AS status;


-- ┌─────────────────────────────────────────────────────────────────────────┐
-- │ 7. VERIFICAÇÃO FINAL                                                   │
-- └─────────────────────────────────────────────────────────────────────────┘

SELECT '═══════════════════════════════════════════════════════════════' AS linha;
SELECT '              CORREÇÃO CONCLUÍDA - VERIFICAÇÃO FINAL            ' AS titulo;
SELECT '═══════════════════════════════════════════════════════════════' AS linha;

SELECT
  (SELECT COUNT(*)::text FROM configuracoes_plataforma) AS "Configs",
  (SELECT CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'logos' AND public = true) THEN '✅ Público' ELSE '❌' END) AS "Bucket",
  (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND (qual::text LIKE '%logos%' OR policyname LIKE '%logos%')) AS "Políticas",
  (SELECT COUNT(*)::text FROM usuarios WHERE tipo = 'estudante' AND ano IS NOT NULL) AS "Estudantes c/ Ano",
  (SELECT COUNT(*)::text FROM mapas_mentais) AS "Mapas";

SELECT '🎉 Configuração concluída! O upload de logo deve funcionar agora.' AS mensagem_final;
