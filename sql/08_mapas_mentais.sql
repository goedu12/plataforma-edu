-- ═══════════════════════════════════════════════════════════════════════════
-- SISTEMA DE MAPAS MENTAIS - Plataforma Educacional
-- Resumos visuais por série e bimestre com curtidas e compartilhamento
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: mapas_mentais
-- Armazena os mapas mentais/resumos visuais
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mapas_mentais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Classificação
    componente VARCHAR(15) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    serie INTEGER NOT NULL CHECK (serie BETWEEN 1 AND 3),  -- 1ª, 2ª, 3ª série EM
    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),

    -- Conteúdo
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    tema VARCHAR(100),  -- Ex: Cinemática, Dinâmica, Termologia

    -- Imagens (WebP otimizado)
    imagem_url TEXT NOT NULL,      -- URL da imagem principal
    thumbnail_url TEXT,            -- Versão reduzida para preview

    -- Métricas
    curtidas INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    visualizacoes INTEGER DEFAULT 0,

    -- Status
    ativo BOOLEAN DEFAULT TRUE,
    destaque BOOLEAN DEFAULT FALSE,  -- Para destacar na home

    -- Metadados
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mapas_componente ON mapas_mentais(componente);
CREATE INDEX IF NOT EXISTS idx_mapas_serie ON mapas_mentais(serie);
CREATE INDEX IF NOT EXISTS idx_mapas_bimestre ON mapas_mentais(bimestre);
CREATE INDEX IF NOT EXISTS idx_mapas_ativo ON mapas_mentais(ativo);
CREATE INDEX IF NOT EXISTS idx_mapas_destaque ON mapas_mentais(destaque);

-- Índice composto para filtros comuns
CREATE INDEX IF NOT EXISTS idx_mapas_filtro ON mapas_mentais(componente, serie, bimestre, ativo);

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: mapas_curtidas
-- Registra curtidas por usuário (evita curtir múltiplas vezes)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mapas_curtidas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mapa_id UUID NOT NULL REFERENCES mapas_mentais(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Evitar duplicatas
    UNIQUE(mapa_id, usuario_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_curtidas_mapa ON mapas_curtidas(mapa_id);
CREATE INDEX IF NOT EXISTS idx_curtidas_usuario ON mapas_curtidas(usuario_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: mapas_downloads
-- Registra downloads para estatísticas
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mapas_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mapa_id UUID NOT NULL REFERENCES mapas_mentais(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_downloads_mapa ON mapas_downloads(mapa_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER: Atualizar timestamp
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION atualizar_timestamp_mapa()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_atualizar_mapa ON mapas_mentais;
CREATE TRIGGER trigger_atualizar_mapa
    BEFORE UPDATE ON mapas_mentais
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp_mapa();

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Incrementar curtidas
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION incrementar_curtida_mapa(p_mapa_id UUID, p_usuario_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_existe BOOLEAN;
BEGIN
    -- Verificar se já curtiu
    SELECT EXISTS(
        SELECT 1 FROM mapas_curtidas
        WHERE mapa_id = p_mapa_id AND usuario_id = p_usuario_id
    ) INTO v_existe;

    IF v_existe THEN
        -- Remover curtida
        DELETE FROM mapas_curtidas
        WHERE mapa_id = p_mapa_id AND usuario_id = p_usuario_id;

        UPDATE mapas_mentais
        SET curtidas = GREATEST(curtidas - 1, 0)
        WHERE id = p_mapa_id;

        RETURN FALSE; -- Descurtiu
    ELSE
        -- Adicionar curtida
        INSERT INTO mapas_curtidas (mapa_id, usuario_id)
        VALUES (p_mapa_id, p_usuario_id);

        UPDATE mapas_mentais
        SET curtidas = curtidas + 1
        WHERE id = p_mapa_id;

        RETURN TRUE; -- Curtiu
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Registrar download
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION registrar_download_mapa(p_mapa_id UUID, p_usuario_id UUID DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
    -- Registrar download
    INSERT INTO mapas_downloads (mapa_id, usuario_id)
    VALUES (p_mapa_id, p_usuario_id);

    -- Incrementar contador
    UPDATE mapas_mentais
    SET downloads = downloads + 1
    WHERE id = p_mapa_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE mapas_mentais ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapas_curtidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mapas_downloads ENABLE ROW LEVEL SECURITY;

-- Service role tem acesso total
CREATE POLICY "Service role full access mapas" ON mapas_mentais FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access curtidas" ON mapas_curtidas FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access downloads" ON mapas_downloads FOR ALL TO service_role USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEW: Mapas com estatísticas
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW mapas_com_stats AS
SELECT
    m.*,
    CASE m.componente
        WHEN 'fisica' THEN 'Física'
        WHEN 'matematica' THEN 'Matemática'
    END as componente_label,
    m.serie || 'ª Série' as serie_label,
    m.bimestre || 'º Bimestre' as bimestre_label
FROM mapas_mentais m
WHERE m.ativo = true
ORDER BY m.serie, m.bimestre, m.criado_em DESC;

-- Comentários
COMMENT ON TABLE mapas_mentais IS 'Mapas mentais e resumos visuais por série e bimestre';
COMMENT ON TABLE mapas_curtidas IS 'Registro de curtidas dos usuários nos mapas';
COMMENT ON TABLE mapas_downloads IS 'Histórico de downloads dos mapas';
