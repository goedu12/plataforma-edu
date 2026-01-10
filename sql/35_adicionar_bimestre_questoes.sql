-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Adicionar coluna bimestre à tabela questoes
-- Permite filtrar questões por série (ano) E bimestre
-- ═══════════════════════════════════════════════════════════════════════════

-- Adicionar coluna bimestre (opcional, NULL para questões sem bimestre específico)
ALTER TABLE questoes
ADD COLUMN IF NOT EXISTS bimestre INTEGER CHECK (bimestre IS NULL OR bimestre BETWEEN 1 AND 4);

-- Criar índice para filtrar por bimestre
CREATE INDEX IF NOT EXISTS idx_questoes_bimestre ON questoes(bimestre);

-- Criar índice composto para busca otimizada
CREATE INDEX IF NOT EXISTS idx_questoes_componente_ano_bimestre
ON questoes(componente, ano, bimestre)
WHERE status = 'ativa';

-- Comentário explicativo
COMMENT ON COLUMN questoes.bimestre IS 'Bimestre da questão (1-4). NULL = disponível em todos os bimestres';

-- ═══════════════════════════════════════════════════════════════════════════
-- EXPLICAÇÃO DO SISTEMA DE FILTRO:
--
-- Quando bimestre = NULL: questão aparece em TODOS os bimestres
-- Quando bimestre = 1,2,3,4: questão aparece APENAS no bimestre especificado
--
-- A query deve usar: WHERE (bimestre IS NULL OR bimestre = :bimestre_atual)
-- ═══════════════════════════════════════════════════════════════════════════
