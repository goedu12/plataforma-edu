-- =====================================================
-- SISTEMA DE POOL DE QUESTÕES - OTIMIZAÇÃO DE VELOCIDADE
-- =====================================================
-- Este sistema pré-gera questões em pool para entrega instantânea
-- Garante unicidade através de seleção aleatória + rastreamento de uso

-- 1. TABELA DE POOL DE QUESTÕES
-- Pool de 15-20 questões pré-geradas por (série, semana)
CREATE TABLE IF NOT EXISTS questoes_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serie VARCHAR(10) NOT NULL,          -- '1EM', '2EM', '3EM', '6EF', '7EF', '8EF', '9EF'
  semana INTEGER NOT NULL,             -- 1-40
  tema VARCHAR(200),                   -- Tema da semana
  subtema VARCHAR(200),                -- Subtema
  questoes JSONB NOT NULL DEFAULT '[]', -- Array de questões pré-geradas
  total_questoes INTEGER DEFAULT 0,    -- Contador para fácil verificação
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT questoes_pool_serie_semana_unique UNIQUE(serie, semana)
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_questoes_pool_serie ON questoes_pool(serie);
CREATE INDEX IF NOT EXISTS idx_questoes_pool_semana ON questoes_pool(semana);
CREATE INDEX IF NOT EXISTS idx_questoes_pool_total ON questoes_pool(total_questoes);

-- 2. TABELA DE QUESTÕES USADAS POR USUÁRIO
-- Rastreia quais questões cada usuário já viu (evita repetição)
CREATE TABLE IF NOT EXISTS questoes_usadas (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questao_hash VARCHAR(64) NOT NULL,   -- SHA256 do enunciado (identificador único)
  serie VARCHAR(10) NOT NULL,
  semana INTEGER NOT NULL,
  usada_em TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT questoes_usadas_usuario_hash_unique UNIQUE(usuario_id, questao_hash)
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_questoes_usadas_usuario ON questoes_usadas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_questoes_usadas_serie_semana ON questoes_usadas(serie, semana);

-- 3. FUNÇÃO PARA ADICIONAR QUESTÕES AO POOL
CREATE OR REPLACE FUNCTION adicionar_questoes_pool(
  p_serie VARCHAR(10),
  p_semana INTEGER,
  p_tema VARCHAR(200),
  p_subtema VARCHAR(200),
  p_questoes JSONB
) RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  INSERT INTO questoes_pool (serie, semana, tema, subtema, questoes, total_questoes)
  VALUES (
    p_serie,
    p_semana,
    p_tema,
    p_subtema,
    p_questoes,
    jsonb_array_length(p_questoes)
  )
  ON CONFLICT (serie, semana)
  DO UPDATE SET
    questoes = questoes_pool.questoes || p_questoes,
    total_questoes = jsonb_array_length(questoes_pool.questoes || p_questoes),
    tema = COALESCE(p_tema, questoes_pool.tema),
    subtema = COALESCE(p_subtema, questoes_pool.subtema),
    atualizado_em = NOW();

  SELECT total_questoes INTO v_total
  FROM questoes_pool
  WHERE serie = p_serie AND semana = p_semana;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO PARA BUSCAR QUESTÕES DO POOL (exclui já usadas pelo usuário)
CREATE OR REPLACE FUNCTION buscar_questoes_pool(
  p_usuario_id UUID,
  p_serie VARCHAR(10),
  p_semana INTEGER,
  p_quantidade INTEGER DEFAULT 5
) RETURNS JSONB AS $$
DECLARE
  v_pool JSONB;
  v_usadas TEXT[];
  v_disponiveis JSONB;
  v_selecionadas JSONB;
BEGIN
  -- Buscar pool da série/semana
  SELECT questoes INTO v_pool
  FROM questoes_pool
  WHERE serie = p_serie AND semana = p_semana;

  IF v_pool IS NULL OR jsonb_array_length(v_pool) = 0 THEN
    RETURN NULL;
  END IF;

  -- Buscar hashes das questões já usadas pelo usuário
  SELECT ARRAY_AGG(questao_hash) INTO v_usadas
  FROM questoes_usadas
  WHERE usuario_id = p_usuario_id
    AND serie = p_serie
    AND semana = p_semana;

  -- Filtrar questões não usadas
  IF v_usadas IS NOT NULL THEN
    SELECT jsonb_agg(q) INTO v_disponiveis
    FROM jsonb_array_elements(v_pool) AS q
    WHERE NOT (md5(q->>'enunciado') = ANY(v_usadas));
  ELSE
    v_disponiveis := v_pool;
  END IF;

  IF v_disponiveis IS NULL OR jsonb_array_length(v_disponiveis) = 0 THEN
    RETURN NULL;
  END IF;

  -- Selecionar aleatoriamente p_quantidade questões
  SELECT jsonb_agg(q) INTO v_selecionadas
  FROM (
    SELECT q
    FROM jsonb_array_elements(v_disponiveis) AS q
    ORDER BY random()
    LIMIT p_quantidade
  ) sub;

  RETURN v_selecionadas;
END;
$$ LANGUAGE plpgsql;

-- 5. FUNÇÃO PARA REGISTRAR USO DE QUESTÕES
CREATE OR REPLACE FUNCTION registrar_questoes_usadas(
  p_usuario_id UUID,
  p_serie VARCHAR(10),
  p_semana INTEGER,
  p_questoes JSONB
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_questao JSONB;
  v_hash VARCHAR(64);
BEGIN
  FOR v_questao IN SELECT * FROM jsonb_array_elements(p_questoes)
  LOOP
    v_hash := md5(v_questao->>'enunciado');

    INSERT INTO questoes_usadas (usuario_id, questao_hash, serie, semana)
    VALUES (p_usuario_id, v_hash, p_serie, p_semana)
    ON CONFLICT (usuario_id, questao_hash) DO NOTHING;

    IF FOUND THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 6. FUNÇÃO PARA VERIFICAR STATUS DO POOL
CREATE OR REPLACE FUNCTION verificar_status_pool()
RETURNS TABLE (
  serie VARCHAR(10),
  semana INTEGER,
  total_questoes INTEGER,
  tema VARCHAR(200),
  atualizado_em TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    qp.serie,
    qp.semana,
    qp.total_questoes,
    qp.tema,
    qp.atualizado_em
  FROM questoes_pool qp
  ORDER BY qp.serie, qp.semana;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNÇÃO PARA LIMPAR POOL ANTIGO (manutenção)
CREATE OR REPLACE FUNCTION limpar_pool_antigo(p_dias INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM questoes_pool
  WHERE atualizado_em < NOW() - (p_dias || ' days')::INTERVAL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE questoes_pool IS 'Pool de questões pré-geradas para entrega instantânea';
COMMENT ON TABLE questoes_usadas IS 'Rastreamento de questões já vistas por cada usuário';
COMMENT ON FUNCTION adicionar_questoes_pool IS 'Adiciona questões ao pool (merge se já existir)';
COMMENT ON FUNCTION buscar_questoes_pool IS 'Busca questões do pool excluindo as já usadas pelo usuário';
COMMENT ON FUNCTION registrar_questoes_usadas IS 'Registra quais questões o usuário já viu';
