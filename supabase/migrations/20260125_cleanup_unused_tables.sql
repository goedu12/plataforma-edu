-- ============================================================================
-- MIGRATION: Limpeza de Tabelas Não Utilizadas
-- Data: 2026-01-25
-- Descrição: Remove tabelas que foram criadas mas não têm funcionalidade
--            implementada no código da aplicação
-- ============================================================================

-- ============================================================================
-- 1. TABELAS LEGADAS/SUBSTITUÍDAS (SEGURO REMOVER)
-- ============================================================================

-- notas_bimestrais foi substituída por notas_2025
-- Verificar se tem dados antes de dropar
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verificar notas_bimestrais
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notas_bimestrais') THEN
        SELECT COUNT(*) INTO v_count FROM notas_bimestrais;
        IF v_count = 0 THEN
            DROP TABLE IF EXISTS notas_bimestrais CASCADE;
            RAISE NOTICE 'Tabela notas_bimestrais removida (estava vazia)';
        ELSE
            RAISE NOTICE 'Tabela notas_bimestrais tem % registros - NÃO removida', v_count;
        END IF;
    END IF;
END $$;

-- questoes_fisica parece ser tabela legada
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questoes_fisica') THEN
        SELECT COUNT(*) INTO v_count FROM questoes_fisica;
        IF v_count = 0 THEN
            DROP TABLE IF EXISTS questoes_fisica CASCADE;
            RAISE NOTICE 'Tabela questoes_fisica removida (estava vazia)';
        ELSE
            RAISE NOTICE 'Tabela questoes_fisica tem % registros - NÃO removida', v_count;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 2. TABELAS DE TRILHAS NÃO IMPLEMENTADAS
-- Estas tabelas têm schema mas o código não as utiliza
-- COMENTADAS por segurança - descomentar após confirmar
-- ============================================================================

-- respostas_trilha - criada mas usada apenas parcialmente
-- NÃO remover pois está sendo usada pela trilha curiosidade

-- trilha_temas_curiosidade - USADA pela trilha curiosidade
-- NÃO remover

-- trilha_ranking - USADA pelo ranking semanal
-- NÃO remover

-- ============================================================================
-- 3. TABELAS DE IA TUTOR (MANTER PARA FUNCIONALIDADE NOVA)
-- Estas tabelas agora estão sendo usadas pelo IA Tutor Avançado
-- ============================================================================

-- ia_sessoes - USADA
-- ia_mensagens - USADA
-- ia_feedback - USADA
-- estudante_preferencias - USADA
-- estudante_estado - USADA
-- estudante_dificuldades - USADA

-- Tabelas de IA ainda não totalmente implementadas (manter para futuro):
-- ia_mapas_mentais - pode ser usada para geração automática de mapas
-- ia_resolucoes - pode ser usada para histórico de resoluções

-- ============================================================================
-- 4. CRIAR ÍNDICES FALTANTES PARA PERFORMANCE
-- ============================================================================

-- Índices para tabelas de IA que agora estão em uso
CREATE INDEX IF NOT EXISTS idx_ia_sessoes_usuario ON ia_sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ia_sessoes_componente ON ia_sessoes(componente);
CREATE INDEX IF NOT EXISTS idx_ia_sessoes_ativa ON ia_sessoes(usuario_id, componente) WHERE fim IS NULL;

CREATE INDEX IF NOT EXISTS idx_ia_mensagens_sessao ON ia_mensagens(sessao_id);
CREATE INDEX IF NOT EXISTS idx_ia_mensagens_usuario ON ia_mensagens(usuario_id);

CREATE INDEX IF NOT EXISTS idx_ia_feedback_usuario ON ia_feedback(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ia_feedback_data ON ia_feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_estudante_preferencias_usuario ON estudante_preferencias(usuario_id);

CREATE INDEX IF NOT EXISTS idx_estudante_estado_usuario_comp ON estudante_estado(usuario_id, componente);

CREATE INDEX IF NOT EXISTS idx_estudante_dificuldades_usuario ON estudante_dificuldades(usuario_id, componente);
CREATE INDEX IF NOT EXISTS idx_estudante_dificuldades_nivel ON estudante_dificuldades(nivel_dificuldade DESC);

-- ============================================================================
-- 5. VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
    v_tabelas_ia INTEGER;
    v_tabelas_trilhas INTEGER;
BEGIN
    -- Contar tabelas de IA
    SELECT COUNT(*) INTO v_tabelas_ia
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE 'ia_%' OR table_name LIKE 'estudante_%';

    -- Contar tabelas de trilhas
    SELECT COUNT(*) INTO v_tabelas_trilhas
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND (table_name LIKE 'trilha%' OR table_name LIKE '%_trilha%');

    RAISE NOTICE '============================================';
    RAISE NOTICE 'Limpeza concluída!';
    RAISE NOTICE 'Tabelas de IA ativas: %', v_tabelas_ia;
    RAISE NOTICE 'Tabelas de Trilhas ativas: %', v_tabelas_trilhas;
    RAISE NOTICE '============================================';
END $$;
