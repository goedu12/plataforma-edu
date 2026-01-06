-- =====================================================
-- CONFIGURAÇÕES DA PLATAFORMA - STUDÃO
-- Sistema de configurações dinâmicas incluindo logo
-- =====================================================

-- Tabela de configurações da plataforma
CREATE TABLE IF NOT EXISTS configuracoes_plataforma (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json, url
  descricao TEXT,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_por UUID REFERENCES usuarios(id)
);

-- Índice para busca rápida por chave
CREATE INDEX IF NOT EXISTS idx_config_chave ON configuracoes_plataforma(chave);

-- Inserir configurações padrão
INSERT INTO configuracoes_plataforma (chave, valor, tipo, descricao) VALUES
  ('nome_plataforma', 'Studão', 'string', 'Nome da plataforma exibido no sistema'),
  ('versao', '4.0', 'string', 'Versão atual da plataforma'),
  ('nome_instituicao', 'Colégio Cora Coralina', 'string', 'Nome da instituição'),
  ('logo_url', NULL, 'url', 'URL do logo da plataforma no Supabase Storage'),
  ('logo_largura', '280', 'number', 'Largura do logo em pixels'),
  ('logo_altura', '100', 'number', 'Altura do logo em pixels'),
  ('cor_primaria', '#22c55e', 'string', 'Cor primária do tema'),
  ('cor_secundaria', '#8b5cf6', 'string', 'Cor secundária do tema')
ON CONFLICT (chave) DO NOTHING;

-- Função para atualizar configuração
CREATE OR REPLACE FUNCTION atualizar_configuracao(
  p_chave VARCHAR(100),
  p_valor TEXT,
  p_usuario_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE configuracoes_plataforma
  SET
    valor = p_valor,
    atualizado_em = NOW(),
    atualizado_por = p_usuario_id
  WHERE chave = p_chave;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter configuração
CREATE OR REPLACE FUNCTION obter_configuracao(p_chave VARCHAR(100))
RETURNS TEXT AS $$
DECLARE
  v_valor TEXT;
BEGIN
  SELECT valor INTO v_valor
  FROM configuracoes_plataforma
  WHERE chave = p_chave;

  RETURN v_valor;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter todas as configurações públicas (para frontend)
CREATE OR REPLACE FUNCTION obter_configuracoes_publicas()
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_object_agg(chave, valor)
    FROM configuracoes_plataforma
    WHERE chave IN ('nome_plataforma', 'versao', 'nome_instituicao', 'logo_url', 'logo_largura', 'logo_altura')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STORAGE BUCKET PARA LOGOS
-- Execute no Supabase Dashboard > Storage
-- =====================================================

-- Criar bucket para logos (executar via dashboard ou API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Políticas de acesso ao bucket de logos
-- Permitir leitura pública
-- CREATE POLICY "Logos são públicos" ON storage.objects
--   FOR SELECT USING (bucket_id = 'logos');

-- Permitir upload/delete apenas para professores
-- CREATE POLICY "Professores podem gerenciar logos" ON storage.objects
--   FOR ALL USING (
--     bucket_id = 'logos'
--     AND auth.role() = 'authenticated'
--     AND EXISTS (
--       SELECT 1 FROM usuarios
--       WHERE id = auth.uid()
--       AND tipo = 'professor'
--     )
--   );

-- RLS
ALTER TABLE configuracoes_plataforma ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler configurações
CREATE POLICY "Todos podem ler configuracoes" ON configuracoes_plataforma
  FOR SELECT USING (true);

-- Política: Apenas professores podem atualizar
CREATE POLICY "Professores podem atualizar configuracoes" ON configuracoes_plataforma
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND tipo = 'professor'
    )
  );

-- Grant para funções
GRANT EXECUTE ON FUNCTION atualizar_configuracao TO authenticated;
GRANT EXECUTE ON FUNCTION obter_configuracao TO anon, authenticated;
GRANT EXECUTE ON FUNCTION obter_configuracoes_publicas TO anon, authenticated;

COMMENT ON TABLE configuracoes_plataforma IS 'Configurações dinâmicas da plataforma Studão';
