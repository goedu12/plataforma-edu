-- ═══════════════════════════════════════════════════════════
-- ADICIONAR CAMPO COLÉGIO À TABELA USUARIOS
-- Data: 2026-01-14
-- ═══════════════════════════════════════════════════════════

-- Adicionar coluna colegio (opcional)
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS colegio VARCHAR(200) DEFAULT NULL;

-- Comentário descritivo
COMMENT ON COLUMN usuarios.colegio IS 'Nome do colégio/escola do estudante';

-- Índice para buscas por colégio
CREATE INDEX IF NOT EXISTS idx_usuarios_colegio ON usuarios(colegio) WHERE colegio IS NOT NULL;
