-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRAÇÃO: Suporte ao Modo Revisão
-- Adiciona colunas necessárias para o modo revisão funcionar corretamente
-- ═══════════════════════════════════════════════════════════════════════════

-- Adicionar coluna 'modo' na tabela respostas
-- Valores: 'estudo', 'desafio', 'revisao'
ALTER TABLE respostas
ADD COLUMN IF NOT EXISTS modo VARCHAR(20) DEFAULT 'estudo' CHECK (modo IN ('estudo', 'desafio', 'revisao'));

-- Adicionar coluna 'atualizado_em' para tracking de atualizações em revisão
ALTER TABLE respostas
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE;

-- Criar índice para buscar respostas por modo
CREATE INDEX IF NOT EXISTS idx_respostas_modo ON respostas(modo);

-- Criar índice composto para queries de revisão (usuario + componente + correta)
CREATE INDEX IF NOT EXISTS idx_respostas_revisao ON respostas(usuario_id, componente, correta, criado_em DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- COMENTÁRIOS
-- ═══════════════════════════════════════════════════════════════════════════
COMMENT ON COLUMN respostas.modo IS 'Modo em que a resposta foi dada: estudo, desafio ou revisao';
COMMENT ON COLUMN respostas.atualizado_em IS 'Data/hora da última atualização (usado no modo revisão)';
