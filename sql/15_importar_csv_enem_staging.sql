-- ================================================================
-- IMPORTAÇÃO CSV ENEM - MÉTODO STAGING
-- ================================================================
-- Este método usa uma tabela intermediária com todas as colunas
-- como TEXT para evitar problemas de compatibilidade do Supabase UI.
--
-- PASSO 1: Execute este script para criar a tabela de staging
-- PASSO 2: Importe o CSV pelo Supabase UI para 'enem_staging'
-- PASSO 3: Execute o script de transformação (PASSO 3 abaixo)
-- ================================================================


-- ████████████████████████████████████████████████████████████████
-- PASSO 1: CRIAR TABELA DE STAGING
-- ████████████████████████████████████████████████████████████████

-- Remover tabela se existir (para reimportações)
DROP TABLE IF EXISTS enem_staging;

-- Criar tabela com TODAS as colunas como TEXT
-- Isso garante compatibilidade com qualquer formato de CSV
CREATE TABLE enem_staging (
    -- Colunas do formato HuggingFace/processado
    id TEXT,
    exam TEXT,
    "IU" TEXT,
    ledor TEXT,
    question TEXT,
    description TEXT,

    -- Alternativas (formato separado)
    "A" TEXT,
    "B" TEXT,
    "C" TEXT,
    "D" TEXT,
    "E" TEXT,

    -- Alternativas (formato lista) - caso o CSV tenha essa coluna
    alternatives TEXT,

    -- Resposta e metadados
    label TEXT,
    level TEXT,
    language TEXT,
    vestibular TEXT,
    area TEXT,
    figures TEXT,
    ano TEXT
);

-- Permitir inserção sem autenticação (temporário para import)
ALTER TABLE enem_staging DISABLE ROW LEVEL SECURITY;

RAISE NOTICE '';
RAISE NOTICE '════════════════════════════════════════════════════════════';
RAISE NOTICE '  ✅ TABELA enem_staging CRIADA!';
RAISE NOTICE '════════════════════════════════════════════════════════════';
RAISE NOTICE '';
RAISE NOTICE '  PRÓXIMO PASSO:';
RAISE NOTICE '  1. Vá em Table Editor → enem_staging';
RAISE NOTICE '  2. Clique em "Import data from CSV"';
RAISE NOTICE '  3. Selecione seu arquivo CSV';
RAISE NOTICE '  4. IMPORTANTE: Desmarque colunas que não existem no seu CSV';
RAISE NOTICE '  5. Clique em "Import"';
RAISE NOTICE '';
RAISE NOTICE '  Depois de importar, execute o PASSO 3 (transformação)';
RAISE NOTICE '════════════════════════════════════════════════════════════';
