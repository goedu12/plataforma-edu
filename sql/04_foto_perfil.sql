-- ═══════════════════════════════════════════════════════════════════════════
-- FOTO DE PERFIL - Plataforma Educacional
-- Adiciona suporte para foto de perfil dos usuários
-- ═══════════════════════════════════════════════════════════════════════════

-- Adicionar coluna de foto na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Criar bucket de storage para fotos de perfil (executar via Dashboard Supabase)
-- Storage > New bucket > Nome: avatars > Public: true

-- Política para permitir upload de avatar (próprio usuário)
-- Storage > Policies > avatars bucket:

-- CREATE POLICY "Usuários podem fazer upload do próprio avatar"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'avatars' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- CREATE POLICY "Usuários podem atualizar próprio avatar"
-- ON storage.objects FOR UPDATE
-- USING (
--   bucket_id = 'avatars' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- CREATE POLICY "Avatars são públicos para leitura"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'avatars');

-- CREATE POLICY "Usuários podem deletar próprio avatar"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'avatars' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Comentário
COMMENT ON COLUMN usuarios.foto_url IS 'URL da foto de perfil do usuário no storage';
