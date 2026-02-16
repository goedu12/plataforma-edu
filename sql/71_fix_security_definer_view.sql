-- ================================================================
-- FIX: Remover view questao_completa com SECURITY DEFINER
-- ================================================================
-- A view questao_completa foi criada com SECURITY DEFINER, o que
-- faz queries executarem com permissões do criador da view,
-- ignorando RLS policies do usuário autenticado.
--
-- Linter Supabase: security_definer_view (0010)
-- https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view
--
-- A API já usa a tabela questoes_enem diretamente como fallback,
-- então a view pode ser recriada sem SECURITY DEFINER.
-- ================================================================

-- Opção 1: Recriar sem SECURITY DEFINER (recomendado se precisar da view)
-- Primeiro, dropar a view existente
DROP VIEW IF EXISTS public.questao_completa;

-- Recriar com SECURITY INVOKER (respeita RLS do usuário)
CREATE OR REPLACE VIEW public.questao_completa
WITH (security_invoker = true)
AS
SELECT
    q.*,
    -- Campos extras que a view original agregava
    CASE
        WHEN q.enunciado_html IS NOT NULL THEN
            (SELECT jsonb_agg(jsonb_build_object(
                'texto', elem
            ))
            FROM unnest(
                regexp_split_to_array(
                    regexp_replace(q.enunciado_html, '<[^>]+>', '', 'g'),
                    '\n\n+'
                )
            ) AS elem
            WHERE trim(elem) != '')
        ELSE NULL
    END AS textos_motivadores_json,
    CASE
        WHEN q.imagem_principal IS NOT NULL OR (q.imagens_extras IS NOT NULL AND array_length(q.imagens_extras, 1) > 0) THEN
            (SELECT jsonb_agg(jsonb_build_object(
                'url', img,
                'tipo', 'imagem'
            ))
            FROM (
                SELECT q.imagem_principal AS img
                WHERE q.imagem_principal IS NOT NULL AND q.imagem_principal != ''
                UNION ALL
                SELECT unnest(q.imagens_extras) AS img
            ) sub
            WHERE img IS NOT NULL AND img != '' AND lower(trim(img)) NOT IN ('nan', 'none', 'null', 'undefined'))
        ELSE NULL
    END AS imagens_json
FROM questoes_enem q
WHERE q.status = 'ativa' OR q.status IS NULL;

-- Dar permissão de leitura
GRANT SELECT ON public.questao_completa TO authenticated;

-- ================================================================
-- VERIFICAÇÃO
-- ================================================================
DO $$
DECLARE
    v_has_definer BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM pg_views
        WHERE viewname = 'questao_completa'
        AND schemaname = 'public'
    ) INTO v_has_definer;

    IF v_has_definer THEN
        RAISE NOTICE '✅ View questao_completa recriada com SECURITY INVOKER';
    ELSE
        RAISE NOTICE '⚠️ View questao_completa não encontrada';
    END IF;
END $$;
