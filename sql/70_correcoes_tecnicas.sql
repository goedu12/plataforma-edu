-- ═══════════════════════════════════════════════════════════════════════════
-- CORREÇÕES TÉCNICAS - Incrementos Atômicos e Consistência
-- ═══════════════════════════════════════════════════════════════════════════
-- Este script implementa RPCs para operações atômicas nos contadores,
-- evitando race conditions e lost updates em acessos concorrentes.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC: Incrementar visualizações de mapa mental (atômico)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION incrementar_visualizacao_mapa(mapa_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  novo_valor INTEGER;
BEGIN
  UPDATE mapas_mentais
  SET visualizacoes = COALESCE(visualizacoes, 0) + 1
  WHERE id = mapa_id
  RETURNING visualizacoes INTO novo_valor;

  RETURN COALESCE(novo_valor, 0);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC: Incrementar downloads de mapa mental (atômico)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION incrementar_download_mapa(mapa_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  novo_valor INTEGER;
BEGIN
  UPDATE mapas_mentais
  SET downloads = COALESCE(downloads, 0) + 1
  WHERE id = mapa_id
  RETURNING downloads INTO novo_valor;

  RETURN COALESCE(novo_valor, 0);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC: Incrementar curtidas de mapa mental (atômico)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION incrementar_curtida_mapa(mapa_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  novo_valor INTEGER;
BEGIN
  UPDATE mapas_mentais
  SET curtidas = COALESCE(curtidas, 0) + 1
  WHERE id = mapa_id
  RETURNING curtidas INTO novo_valor;

  RETURN COALESCE(novo_valor, 0);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC: Decrementar curtidas de mapa mental (atômico, mínimo 0)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION decrementar_curtida_mapa(mapa_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  novo_valor INTEGER;
BEGIN
  UPDATE mapas_mentais
  SET curtidas = GREATEST(COALESCE(curtidas, 0) - 1, 0)
  WHERE id = mapa_id
  RETURNING curtidas INTO novo_valor;

  RETURN COALESCE(novo_valor, 0);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC: Atualizar dia ativo com incrementos atômicos
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION atualizar_dia_ativo(
  p_usuario_id UUID,
  p_componente TEXT,
  p_data DATE,
  p_questoes INTEGER DEFAULT 1,
  p_acertos INTEGER DEFAULT 0,
  p_pontos INTEGER DEFAULT 0,
  p_tempo_segundos INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO dias_ativos (
    usuario_id, componente, data, questoes, acertos, pontos, tempo_total_segundos
  ) VALUES (
    p_usuario_id, p_componente, p_data, p_questoes, p_acertos, p_pontos, p_tempo_segundos
  )
  ON CONFLICT (usuario_id, componente, data)
  DO UPDATE SET
    questoes = dias_ativos.questoes + EXCLUDED.questoes,
    acertos = dias_ativos.acertos + EXCLUDED.acertos,
    pontos = dias_ativos.pontos + EXCLUDED.pontos,
    tempo_total_segundos = dias_ativos.tempo_total_segundos + EXCLUDED.tempo_total_segundos,
    atualizado_em = NOW();
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Permissões para as RPCs
-- ═══════════════════════════════════════════════════════════════════════════
GRANT EXECUTE ON FUNCTION incrementar_visualizacao_mapa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION incrementar_download_mapa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION incrementar_curtida_mapa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrementar_curtida_mapa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION atualizar_dia_ativo(UUID, TEXT, DATE, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION incrementar_visualizacao_mapa(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION incrementar_download_mapa(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION incrementar_curtida_mapa(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION decrementar_curtida_mapa(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION atualizar_dia_ativo(UUID, TEXT, DATE, INTEGER, INTEGER, INTEGER, INTEGER) TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- Adicionar campo 'modo' na tabela respostas se não existir
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'respostas' AND column_name = 'modo'
  ) THEN
    ALTER TABLE respostas ADD COLUMN modo TEXT DEFAULT 'estudo';
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Adicionar campos de conquistas combinadas se não existirem
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  -- Adicionar req_pontos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conquistas' AND column_name = 'req_pontos'
  ) THEN
    ALTER TABLE conquistas ADD COLUMN req_pontos INTEGER;
  END IF;

  -- Adicionar req_questoes_corretas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conquistas' AND column_name = 'req_questoes_corretas'
  ) THEN
    ALTER TABLE conquistas ADD COLUMN req_questoes_corretas INTEGER;
  END IF;

  -- Adicionar req_sequencia_dias
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conquistas' AND column_name = 'req_sequencia_dias'
  ) THEN
    ALTER TABLE conquistas ADD COLUMN req_sequencia_dias INTEGER;
  END IF;

  -- Adicionar ordem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conquistas' AND column_name = 'ordem'
  ) THEN
    ALTER TABLE conquistas ADD COLUMN ordem INTEGER DEFAULT 0;
  END IF;
END $$;

-- Atualizar constraint de requisito_tipo para incluir 'combinado'
-- Primeiro remover a constraint antiga se existir, depois criar nova
DO $$
BEGIN
  -- Tentar dropar constraint existente (ignora erro se não existir)
  BEGIN
    ALTER TABLE conquistas DROP CONSTRAINT IF EXISTS conquistas_requisito_tipo_check;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Adicionar nova constraint que inclui 'combinado'
  ALTER TABLE conquistas ADD CONSTRAINT conquistas_requisito_tipo_check
    CHECK (requisito_tipo IN ('pontos', 'questoes', 'sequencia', 'acertos', 'combinado'));
EXCEPTION WHEN OTHERS THEN
  -- Se falhar (constraint pode já estar correta), ignorar
  NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Comentários para documentação
-- ═══════════════════════════════════════════════════════════════════════════
COMMENT ON FUNCTION incrementar_visualizacao_mapa IS 'Incrementa atomicamente o contador de visualizações de um mapa mental';
COMMENT ON FUNCTION incrementar_download_mapa IS 'Incrementa atomicamente o contador de downloads de um mapa mental';
COMMENT ON FUNCTION incrementar_curtida_mapa IS 'Incrementa atomicamente o contador de curtidas de um mapa mental';
COMMENT ON FUNCTION decrementar_curtida_mapa IS 'Decrementa atomicamente o contador de curtidas (mínimo 0)';
COMMENT ON FUNCTION atualizar_dia_ativo IS 'Atualiza ou insere registro de dia ativo com incrementos atômicos usando UPSERT';
