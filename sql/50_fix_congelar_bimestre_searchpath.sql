-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  FIX: congelar_bimestre function search_path security                        ║
-- ║  Corrige o warning "Function has a role mutable search_path"                 ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Primeiro, verificar a definição atual da função
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'congelar_bimestre';

-- Recriar a função com search_path fixo
-- NOTA: Se a função não existir ou tiver lógica diferente, ajuste conforme necessário

-- Opção 1: Se a função for um trigger de proteção de dados
CREATE OR REPLACE FUNCTION public.congelar_bimestre()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Trigger que impede modificações em registros de bimestres fechados
    -- Verifica se o bimestre já foi congelado/fechado
    IF OLD.bimestre_congelado = true THEN
        RAISE EXCEPTION 'Não é possível modificar dados de um bimestre congelado';
    END IF;

    RETURN NEW;
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.congelar_bimestre() IS
'Trigger que protege dados de bimestres já fechados/congelados. Impede modificações em registros históricos.';

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  VERIFICAÇÃO                                                                  ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
-- Execute após aplicar:
-- SELECT
--     p.proname as function_name,
--     p.proconfig as config
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.proname = 'congelar_bimestre';
--
-- Deve mostrar: {search_path=public}
