-- ============================================================================
-- MIGRATION: Fix Security Issues from Supabase Linter
-- Date: 2026-01-25
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON TABLES (CRITICAL - ERROR level)
-- ============================================================================

-- Enable RLS on questoes_fisica
ALTER TABLE public.questoes_fisica ENABLE ROW LEVEL SECURITY;

-- Enable RLS on questoes_pool
ALTER TABLE public.questoes_pool ENABLE ROW LEVEL SECURITY;

-- Enable RLS on questoes_usadas
ALTER TABLE public.questoes_usadas ENABLE ROW LEVEL SECURITY;

-- Enable RLS on questoes (if exists)
ALTER TABLE public.questoes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CREATE RLS POLICIES FOR QUESTOES TABLES
-- ============================================================================

-- questoes_fisica: Leitura para usuarios autenticados, escrita para service_role
DROP POLICY IF EXISTS "questoes_fisica_select" ON public.questoes_fisica;
CREATE POLICY "questoes_fisica_select" ON public.questoes_fisica
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "questoes_fisica_insert" ON public.questoes_fisica;
CREATE POLICY "questoes_fisica_insert" ON public.questoes_fisica
    FOR INSERT TO service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS "questoes_fisica_update" ON public.questoes_fisica;
CREATE POLICY "questoes_fisica_update" ON public.questoes_fisica
    FOR UPDATE TO service_role
    USING (true);

DROP POLICY IF EXISTS "questoes_fisica_delete" ON public.questoes_fisica;
CREATE POLICY "questoes_fisica_delete" ON public.questoes_fisica
    FOR DELETE TO service_role
    USING (true);

-- questoes_pool: Leitura para autenticados, escrita restrita
DROP POLICY IF EXISTS "questoes_pool_select" ON public.questoes_pool;
CREATE POLICY "questoes_pool_select" ON public.questoes_pool
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "questoes_pool_insert" ON public.questoes_pool;
CREATE POLICY "questoes_pool_insert" ON public.questoes_pool
    FOR INSERT TO service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS "questoes_pool_update" ON public.questoes_pool;
CREATE POLICY "questoes_pool_update" ON public.questoes_pool
    FOR UPDATE TO service_role
    USING (true);

DROP POLICY IF EXISTS "questoes_pool_delete" ON public.questoes_pool;
CREATE POLICY "questoes_pool_delete" ON public.questoes_pool
    FOR DELETE TO service_role
    USING (true);

-- questoes_usadas: Usuario pode ver/inserir suas proprias questoes usadas
DROP POLICY IF EXISTS "questoes_usadas_select" ON public.questoes_usadas;
CREATE POLICY "questoes_usadas_select" ON public.questoes_usadas
    FOR SELECT TO authenticated
    USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "questoes_usadas_insert" ON public.questoes_usadas;
CREATE POLICY "questoes_usadas_insert" ON public.questoes_usadas
    FOR INSERT TO authenticated
    WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "questoes_usadas_service" ON public.questoes_usadas;
CREATE POLICY "questoes_usadas_service" ON public.questoes_usadas
    FOR ALL TO service_role
    USING (true);

-- questoes: Leitura para autenticados, escrita para service_role
DROP POLICY IF EXISTS "questoes_select" ON public.questoes;
CREATE POLICY "questoes_select" ON public.questoes
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "questoes_insert" ON public.questoes;
CREATE POLICY "questoes_insert" ON public.questoes
    FOR INSERT TO service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS "questoes_update" ON public.questoes;
CREATE POLICY "questoes_update" ON public.questoes
    FOR UPDATE TO service_role
    USING (true);

DROP POLICY IF EXISTS "questoes_delete" ON public.questoes;
CREATE POLICY "questoes_delete" ON public.questoes
    FOR DELETE TO service_role
    USING (true);

-- ============================================================================
-- 3. FIX RLS POLICY ON questoes_trilha (replace always true)
-- ============================================================================

DROP POLICY IF EXISTS "questoes_trilha_insert" ON public.questoes_trilha;
CREATE POLICY "questoes_trilha_insert" ON public.questoes_trilha
    FOR INSERT TO authenticated
    WITH CHECK (usuario_id = auth.uid());

-- ============================================================================
-- 4. FIX FUNCTION SEARCH_PATH (Security Definer Functions)
-- ============================================================================

-- Fix incrementar_visualizacao_mapa
ALTER FUNCTION public.incrementar_visualizacao_mapa SET search_path = public;

-- Fix verificar_status_pool
ALTER FUNCTION public.verificar_status_pool SET search_path = public;

-- Fix registrar_questoes_usadas
ALTER FUNCTION public.registrar_questoes_usadas SET search_path = public;

-- Fix get_segunda_feira_semana
ALTER FUNCTION public.get_segunda_feira_semana SET search_path = public;

-- Fix iniciar_trilha
ALTER FUNCTION public.iniciar_trilha SET search_path = public;

-- Fix avancar_semana_trilha
ALTER FUNCTION public.avancar_semana_trilha SET search_path = public;

-- Fix gerar_email_estudante
ALTER FUNCTION public.gerar_email_estudante SET search_path = public;

-- Fix incrementar_download_mapa
ALTER FUNCTION public.incrementar_download_mapa SET search_path = public;

-- Fix calcular_bonus_frequencia
ALTER FUNCTION public.calcular_bonus_frequencia SET search_path = public;

-- Fix listar_trilhas
ALTER FUNCTION public.listar_trilhas SET search_path = public;

-- Fix atualizar_dia_ativo
ALTER FUNCTION public.atualizar_dia_ativo SET search_path = public;

-- Fix auto_definir_nivel_ensino
ALTER FUNCTION public.auto_definir_nivel_ensino SET search_path = public;

-- Fix atualizar_updated_at
ALTER FUNCTION public.atualizar_updated_at SET search_path = public;

-- Fix incrementar_questoes_semana
ALTER FUNCTION public.incrementar_questoes_semana SET search_path = public;

-- Fix decrementar_curtida_mapa
ALTER FUNCTION public.decrementar_curtida_mapa SET search_path = public;

-- Fix update_updated_at_column
ALTER FUNCTION public.update_updated_at_column SET search_path = public;

-- Fix buscar_questoes_semana_trilha
ALTER FUNCTION public.buscar_questoes_semana_trilha SET search_path = public;

-- Fix incrementar_curtida_mapa
ALTER FUNCTION public.incrementar_curtida_mapa SET search_path = public;

-- Fix adicionar_questoes_pool
ALTER FUNCTION public.adicionar_questoes_pool SET search_path = public;

-- Fix responder_questao_trilha
ALTER FUNCTION public.responder_questao_trilha SET search_path = public;

-- Fix buscar_questoes_pool
ALTER FUNCTION public.buscar_questoes_pool SET search_path = public;

-- Fix validar_resposta_alternativas
ALTER FUNCTION public.validar_resposta_alternativas SET search_path = public;

-- ============================================================================
-- 5. MOVE EXTENSIONS TO DEDICATED SCHEMA (Optional - requires superuser)
-- Note: This may need to be run manually with superuser privileges
-- ============================================================================

-- Create extensions schema if not exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Note: Moving extensions requires dropping and recreating them
-- This is commented out because it may break existing functionality
-- and requires careful planning

-- To move unaccent:
-- DROP EXTENSION IF EXISTS unaccent;
-- CREATE EXTENSION unaccent SCHEMA extensions;

-- To move vector:
-- DROP EXTENSION IF EXISTS vector;
-- CREATE EXTENSION vector SCHEMA extensions;

-- ============================================================================
-- 6. CREATE INDEX FOR PERFORMANCE (from query analysis)
-- ============================================================================

-- Index on mapas_mentais.serie for better query performance
CREATE INDEX IF NOT EXISTS idx_mapas_mentais_serie
    ON public.mapas_mentais (serie);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_mapas_mentais_componente_ativo_serie
    ON public.mapas_mentais (componente, ativo, serie);

-- ============================================================================
-- VERIFICATION QUERIES (run after migration to verify)
-- ============================================================================

-- Check RLS status:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('questoes_fisica', 'questoes_pool', 'questoes_usadas', 'questoes');

-- Check function search_path:
-- SELECT proname, proconfig
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
-- AND proname IN ('incrementar_visualizacao_mapa', 'verificar_status_pool');
