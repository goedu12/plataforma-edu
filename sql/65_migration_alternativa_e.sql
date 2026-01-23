-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Adicionar coluna alternativa_e à tabela questoes
-- Permite questões com 5 alternativas (A, B, C, D, E)
-- Execute este script ANTES de inserir questões com alternativa_e
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 1: Adicionar coluna alternativa_e (opcional, pode ser NULL)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE questoes
ADD COLUMN IF NOT EXISTS alternativa_e TEXT;

COMMENT ON COLUMN questoes.alternativa_e IS 'Quinta alternativa (opcional). Use NULL para questões com apenas 4 alternativas.';

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 2: Remover constraint antiga de resposta_correta
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE questoes DROP CONSTRAINT IF EXISTS questoes_resposta_correta_check;

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 3: Adicionar nova constraint que aceita A, B, C, D ou E
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE questoes
ADD CONSTRAINT questoes_resposta_correta_check
CHECK (resposta_correta IN ('A', 'B', 'C', 'D', 'E'));

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 4: Garantir que a coluna bimestre existe
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE questoes
ADD COLUMN IF NOT EXISTS bimestre INTEGER CHECK (bimestre IS NULL OR bimestre BETWEEN 1 AND 4);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_questoes_bimestre ON questoes(bimestre);
CREATE INDEX IF NOT EXISTS idx_questoes_componente_ano_bimestre
ON questoes(componente, ano, bimestre) WHERE status = 'ativa';

COMMENT ON COLUMN questoes.bimestre IS 'Bimestre da questão (1-4). NULL = disponível em todos os bimestres';

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 5: Atualizar constraint de resposta na tabela respostas (se necessário)
-- ═══════════════════════════════════════════════════════════════════════════
ALTER TABLE respostas DROP CONSTRAINT IF EXISTS respostas_resposta_dada_check;

ALTER TABLE respostas
ADD CONSTRAINT respostas_resposta_dada_check
CHECK (resposta_dada IN ('A', 'B', 'C', 'D', 'E'));

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════════════════

-- Verificar estrutura da tabela questoes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'questoes'
ORDER BY ordinal_position;

-- Verificar constraints
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'questoes'::regclass;

-- ═══════════════════════════════════════════════════════════════════════════
-- RESULTADO ESPERADO:
-- ✅ Coluna alternativa_e adicionada
-- ✅ Constraint resposta_correta aceita A, B, C, D, E
-- ✅ Coluna bimestre existe
-- ✅ Índices criados para performance
-- ═══════════════════════════════════════════════════════════════════════════
