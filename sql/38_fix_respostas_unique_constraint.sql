-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRAÇÃO: Corrigir tabela respostas
-- 1. Adicionar constraint UNIQUE para upsert
-- 2. Permitir opção 'E' nas respostas
-- 3. Adicionar campo 'modo' para diferenciar estudo/desafio/revisao
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Corrigir constraint de resposta_dada para permitir 'E'
ALTER TABLE respostas DROP CONSTRAINT IF EXISTS respostas_resposta_dada_check;
ALTER TABLE respostas ADD CONSTRAINT respostas_resposta_dada_check
    CHECK (resposta_dada IN ('A', 'B', 'C', 'D', 'E'));

-- 2. Adicionar coluna 'modo' se não existir
ALTER TABLE respostas
ADD COLUMN IF NOT EXISTS modo VARCHAR(20) DEFAULT 'estudo'
    CHECK (modo IN ('estudo', 'desafio', 'revisao'));

-- 3. Adicionar coluna atualizado_em se não existir
ALTER TABLE respostas
ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ;

-- 4. Adicionar constraint UNIQUE para upsert funcionar
DO $$
BEGIN
    -- Verificar se a constraint já existe
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'respostas_usuario_questao_unique'
    ) THEN
        -- Primeiro, remover duplicatas se existirem (manter a mais recente)
        DELETE FROM respostas a
        USING respostas b
        WHERE a.id < b.id
        AND a.usuario_id = b.usuario_id
        AND a.questao_id = b.questao_id;

        -- Agora adicionar a constraint
        ALTER TABLE respostas
        ADD CONSTRAINT respostas_usuario_questao_unique
        UNIQUE (usuario_id, questao_id);

        RAISE NOTICE 'Constraint UNIQUE adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Constraint UNIQUE já existe';
    END IF;
END $$;

-- 5. Criar índice composto para melhor performance
CREATE INDEX IF NOT EXISTS idx_respostas_usuario_questao
ON respostas(usuario_id, questao_id);

-- Comentários
COMMENT ON COLUMN respostas.modo IS 'estudo = modo normal, desafio = modo desafio, revisao = refazer questões';
