-- ================================================================
-- FIX: Permitir questões externas (API) no respostas_enem
-- ================================================================
-- A tabela respostas_enem foi criada com questao_id NOT NULL,
-- mas questões da API externa não têm ID local.
--
-- Este script:
-- 1. Adiciona coluna id_api_questao para referência
-- 2. Torna questao_id nullable
-- 3. Adiciona constraint para garantir que pelo menos um existe
-- ================================================================

-- 1. Adicionar coluna id_api_questao (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'respostas_enem' AND column_name = 'id_api_questao'
    ) THEN
        ALTER TABLE respostas_enem ADD COLUMN id_api_questao VARCHAR(100);
        RAISE NOTICE '✅ Coluna id_api_questao adicionada';
    ELSE
        RAISE NOTICE '⏭️ Coluna id_api_questao já existe';
    END IF;
END $$;

-- 2. Tornar questao_id nullable (para questões externas)
-- Primeiro remover a constraint NOT NULL (se existir)
DO $$
BEGIN
    -- Alterar para nullable
    ALTER TABLE respostas_enem ALTER COLUMN questao_id DROP NOT NULL;
    RAISE NOTICE '✅ Coluna questao_id agora é nullable';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⏭️ questao_id já era nullable ou outro erro: %', SQLERRM;
END $$;

-- 3. Remover foreign key constraint antiga (se existir)
DO $$
DECLARE
    fk_name TEXT;
BEGIN
    SELECT constraint_name INTO fk_name
    FROM information_schema.table_constraints
    WHERE table_name = 'respostas_enem'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%questao_id%';

    IF fk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE respostas_enem DROP CONSTRAINT %I', fk_name);
        RAISE NOTICE '✅ Foreign key removida: %', fk_name;
    END IF;
END $$;

-- 4. Recriar foreign key com ON DELETE SET NULL
DO $$
BEGIN
    ALTER TABLE respostas_enem
    ADD CONSTRAINT fk_respostas_enem_questao
    FOREIGN KEY (questao_id)
    REFERENCES questoes_enem(id)
    ON DELETE SET NULL;
    RAISE NOTICE '✅ Foreign key recriada com ON DELETE SET NULL';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro ao criar foreign key: %', SQLERRM;
END $$;

-- 5. Adicionar índice para id_api_questao
CREATE INDEX IF NOT EXISTS idx_resp_enem_id_api ON respostas_enem(id_api_questao);

-- 6. Adicionar constraint CHECK para garantir que tem referência
-- (pelo menos questao_id OU id_api_questao deve estar preenchido)
DO $$
BEGIN
    ALTER TABLE respostas_enem
    ADD CONSTRAINT chk_respostas_enem_referencia
    CHECK (questao_id IS NOT NULL OR id_api_questao IS NOT NULL);
    RAISE NOTICE '✅ Constraint de referência adicionada';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE '⏭️ Constraint de referência já existe';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro ao criar constraint: %', SQLERRM;
END $$;

-- 7. Remover constraint UNIQUE antiga que impede questões externas
DO $$
BEGIN
    ALTER TABLE respostas_enem DROP CONSTRAINT IF EXISTS respostas_enem_usuario_id_questao_id_key;
    RAISE NOTICE '✅ Constraint UNIQUE antiga removida';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⏭️ Constraint já removida ou não existe';
END $$;

-- 8. Criar nova constraint UNIQUE que considera ambos os casos
-- Para questões locais: usuario_id + questao_id
-- Para questões externas: usuario_id + id_api_questao
CREATE UNIQUE INDEX IF NOT EXISTS idx_resp_enem_usuario_questao_local
ON respostas_enem(usuario_id, questao_id)
WHERE questao_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_resp_enem_usuario_questao_api
ON respostas_enem(usuario_id, id_api_questao)
WHERE id_api_questao IS NOT NULL;

-- ================================================================
-- VERIFICAÇÃO
-- ================================================================
DO $$
DECLARE
    v_columns TEXT;
BEGIN
    SELECT string_agg(column_name || ' (' || is_nullable || ')', ', ')
    INTO v_columns
    FROM information_schema.columns
    WHERE table_name = 'respostas_enem'
    AND column_name IN ('questao_id', 'id_api_questao');

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '              RESPOSTAS_ENEM ATUALIZADA                      ';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Colunas de referência: %', v_columns;
    RAISE NOTICE '';
    RAISE NOTICE 'Agora a tabela suporta:';
    RAISE NOTICE '  - Questões locais (questao_id preenchido)';
    RAISE NOTICE '  - Questões da API externa (id_api_questao preenchido)';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;
