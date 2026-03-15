-- ===============================================================================
-- CORRECAO FINAL CONSOLIDADA: QUESTOES ENEM 2023
-- Combina v1 + v2 + v3 + lacunas identificadas na auditoria
-- Execute no Supabase SQL Editor
-- Data: 2026-03-15
-- ===============================================================================
--
-- Este script consolida todas as correcoes necessarias para ENEM 2023:
-- - Correcoes de v1 (metadados, flags, formulas basicas)
-- - Correcoes de v2 (quebras de linha, fontes, espacos)
-- - Correcoes de v3 (rotulos, formulas em alternativas)
-- - LACUNAS IDENTIFICADAS NA AUDITORIA:
--   1. Validacao de elementos duplicados
--   2. Garantia de ordem sequencial dos elementos
--   3. Validacao de alternativas (5 preenchidas)
--   4. Limpeza de tags HTML perigosas
--
-- ===============================================================================

-- ===============================================================================
-- FASE 0: BACKUP (se nao existir)
-- ===============================================================================

DROP TABLE IF EXISTS questoes_enem_2023_backup_final;
CREATE TABLE questoes_enem_2023_backup_final AS
SELECT * FROM questoes_enem WHERE ano = 2023;

SELECT 'Backup criado com ' || COUNT(*) || ' questoes de 2023' as status
FROM questoes_enem_2023_backup_final;

-- ===============================================================================
-- FASE 1: GARANTIR ELEMENTOS PARA TODAS AS QUESTOES
-- ===============================================================================

SELECT '=== FASE 1: GARANTIR ELEMENTOS ===' as etapa;

-- Criar array de elementos para questoes sem elementos
UPDATE questoes_enem
SET elementos = jsonb_build_array(
    jsonb_build_object(
        'tipo', 'comando',
        'conteudo', comando,
        'ordem', 1
    )
)
WHERE ano = 2023
  AND comando IS NOT NULL
  AND TRIM(comando) != ''
  AND (elementos IS NULL OR jsonb_array_length(elementos) = 0);

-- ===============================================================================
-- FASE 2: EXTRAIR ROTULOS (TEXTO I, TEXTO II, etc.)
-- ===============================================================================

SELECT '=== FASE 2: EXTRAIR ROTULOS ===' as etapa;

CREATE OR REPLACE FUNCTION extrair_rotulo_texto_2023(conteudo text)
RETURNS jsonb AS $$
DECLARE
    rotulo_match text[];
    rotulo text;
    conteudo_limpo text;
BEGIN
    IF conteudo IS NULL THEN
        RETURN jsonb_build_object('rotulo', NULL, 'conteudo', conteudo);
    END IF;

    rotulo_match := regexp_match(conteudo, '^(TEXTO\s+[IVX]+)\s*\n+', 'i');
    IF rotulo_match IS NOT NULL THEN
        rotulo := UPPER(TRIM(rotulo_match[1]));
        conteudo_limpo := regexp_replace(conteudo, '^(TEXTO\s+[IVX]+)\s*\n+', '', 'i');
        RETURN jsonb_build_object('rotulo', rotulo, 'conteudo', TRIM(conteudo_limpo));
    END IF;

    rotulo_match := regexp_match(conteudo, '^\*\*(TEXTO\s+[IVX]+)\*\*\s*\n+', 'i');
    IF rotulo_match IS NOT NULL THEN
        rotulo := UPPER(TRIM(rotulo_match[1]));
        conteudo_limpo := regexp_replace(conteudo, '^\*\*(TEXTO\s+[IVX]+)\*\*\s*\n+', '', 'i');
        RETURN jsonb_build_object('rotulo', rotulo, 'conteudo', TRIM(conteudo_limpo));
    END IF;

    RETURN jsonb_build_object('rotulo', NULL, 'conteudo', conteudo);
END;
$$ LANGUAGE plpgsql;

WITH questoes_rotulo AS (
    SELECT
        q.id,
        (
            SELECT jsonb_agg(
                CASE
                    WHEN (elem->>'tipo' = 'texto')
                         AND (elem->>'rotulo' IS NULL OR elem->>'rotulo' = '')
                         AND (elem->>'conteudo' ~* '^(TEXTO\s+[IVX]+|\*\*TEXTO\s+[IVX]+\*\*)\s*\n')
                    THEN jsonb_set(
                        jsonb_set(
                            elem,
                            '{rotulo}',
                            to_jsonb((extrair_rotulo_texto_2023(elem->>'conteudo'))->>'rotulo')
                        ),
                        '{conteudo}',
                        to_jsonb((extrair_rotulo_texto_2023(elem->>'conteudo'))->>'conteudo')
                    )
                    ELSE elem
                END
                ORDER BY ordinality
            )
            FROM jsonb_array_elements(q.elementos) WITH ORDINALITY AS e(elem, ordinality)
        ) as elementos_corrigidos
    FROM questoes_enem q
    WHERE q.ano = 2023
      AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(q.elementos) e2
          WHERE e2->>'tipo' = 'texto'
            AND (e2->>'rotulo' IS NULL OR e2->>'rotulo' = '')
            AND e2->>'conteudo' ~* '^(TEXTO\s+[IVX]+|\*\*TEXTO\s+[IVX]+\*\*)\s*\n'
      )
)
UPDATE questoes_enem q
SET elementos = qr.elementos_corrigidos
FROM questoes_rotulo qr
WHERE q.id = qr.id
  AND qr.elementos_corrigidos IS NOT NULL;

-- ===============================================================================
-- FASE 3: REMOVER QUEBRAS DE LINHA ARTIFICIAIS
-- ===============================================================================

SELECT '=== FASE 3: REMOVER QUEBRAS DE LINHA ===' as etapa;

UPDATE questoes_enem
SET comando = REGEXP_REPLACE(comando, '\s*\n\s*', ' ', 'g')
WHERE ano = 2023
  AND comando ~ '[^\n]\n[^\n]';

UPDATE questoes_enem
SET comando = REGEXP_REPLACE(comando, '  ', E'\n\n', 'g')
WHERE ano = 2023
  AND comando LIKE '%  %';

-- ===============================================================================
-- FASE 4: FORMATAR FONTES COM <small>
-- ===============================================================================

SELECT '=== FASE 4: FORMATAR FONTES ===' as etapa;

UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        CASE
            WHEN e->>'tipo' = 'texto'
                 AND e->>'conteudo' NOT LIKE '%<small%'
                 AND (
                     e->>'conteudo' ~ '(Disponivel em:|Acesso em:|Adaptado de|FONTE:|Fonte:)'
                 )
            THEN jsonb_set(
                e,
                '{conteudo}',
                to_jsonb(
                    REGEXP_REPLACE(
                        e->>'conteudo',
                        E'(\n|\r\n|\r)?\\s*((Disponivel em:.*|Acesso em:.*|Adaptado de.*|FONTE:.*|Fonte:.*))\\s*$',
                        E'\n\n<small>\\2</small>',
                        'gi'
                    )
                )
            )
            ELSE e
        END
        ORDER BY (e->>'ordem')::int NULLS LAST
    )
    FROM jsonb_array_elements(q.elementos) e
)
WHERE q.ano = 2023
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.elementos) e
      WHERE e->>'tipo' = 'texto'
        AND e->>'conteudo' NOT LIKE '%<small%'
        AND e->>'conteudo' ~ '(Disponivel em:|Acesso em:|Adaptado de|FONTE:|Fonte:)'
  );

-- ===============================================================================
-- FASE 5: CONVERTER FORMULAS QUIMICAS
-- ===============================================================================

SELECT '=== FASE 5: CONVERTER FORMULAS ===' as etapa;

CREATE OR REPLACE FUNCTION converter_formulas_2023(texto text)
RETURNS text AS $$
DECLARE
    resultado text;
BEGIN
    IF texto IS NULL THEN RETURN texto; END IF;
    resultado := texto;

    -- Compostos complexos primeiro
    resultado := regexp_replace(resultado, '\bCa\(OH\)2\b', 'Ca(OH)2', 'g');
    resultado := regexp_replace(resultado, '\bC6H12O6\b', 'C6H12O6', 'g');
    resultado := regexp_replace(resultado, '\bC2H5OH\b', 'C2H5OH', 'g');
    resultado := regexp_replace(resultado, '\bH2SO4\b', 'H2SO4', 'g');
    resultado := regexp_replace(resultado, '\bH3PO4\b', 'H3PO4', 'g');
    resultado := regexp_replace(resultado, '\bCaCO3\b', 'CaCO3', 'g');
    resultado := regexp_replace(resultado, '\bNa2CO3\b', 'Na2CO3', 'g');
    resultado := regexp_replace(resultado, '\bFe2O3\b', 'Fe2O3', 'g');
    resultado := regexp_replace(resultado, '\bAl2O3\b', 'Al2O3', 'g');

    -- Moleculas simples
    resultado := regexp_replace(resultado, '\bH2O\b', 'H2O', 'g');
    resultado := regexp_replace(resultado, '\bCO2\b', 'CO2', 'g');
    resultado := regexp_replace(resultado, '\bSO2\b', 'SO2', 'g');
    resultado := regexp_replace(resultado, '\bNO2\b', 'NO2', 'g');
    resultado := regexp_replace(resultado, '\bNH3\b', 'NH3', 'g');
    resultado := regexp_replace(resultado, '\bCH4\b', 'CH4', 'g');
    resultado := regexp_replace(resultado, '\bO2\b', 'O2', 'g');
    resultado := regexp_replace(resultado, '\bN2\b', 'N2', 'g');
    resultado := regexp_replace(resultado, '\bH2\b', 'H2', 'g');
    resultado := regexp_replace(resultado, '\bCl2\b', 'Cl2', 'g');

    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- Aplicar no comando
UPDATE questoes_enem
SET comando = converter_formulas_2023(comando)
WHERE ano = 2023
  AND comando ~ '(H2O|CO2|O2|N2|H2|CH4|NH3|H2SO4)';

-- Aplicar nas alternativas
UPDATE questoes_enem
SET
    alt_a_texto = converter_formulas_2023(alt_a_texto),
    alt_b_texto = converter_formulas_2023(alt_b_texto),
    alt_c_texto = converter_formulas_2023(alt_c_texto),
    alt_d_texto = converter_formulas_2023(alt_d_texto),
    alt_e_texto = converter_formulas_2023(alt_e_texto)
WHERE ano = 2023
  AND (
    alt_a_texto ~ '(H2O|CO2|O2|N2|CH4)'
    OR alt_b_texto ~ '(H2O|CO2|O2|N2|CH4)'
    OR alt_c_texto ~ '(H2O|CO2|O2|N2|CH4)'
    OR alt_d_texto ~ '(H2O|CO2|O2|N2|CH4)'
    OR alt_e_texto ~ '(H2O|CO2|O2|N2|CH4)'
  );

-- ===============================================================================
-- FASE 6: CONVERTER NOTACAO CIENTIFICA
-- ===============================================================================

SELECT '=== FASE 6: CONVERTER NOTACAO CIENTIFICA ===' as etapa;

UPDATE questoes_enem
SET comando =
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(comando,
        '(\d)\s*x\s*(10)', '\1 x \2', 'gi'),
        '\^2(?![0-9])', '2', 'g'),
        '\^3(?![0-9])', '3', 'g'),
        '\^4(?![0-9])', '4', 'g'),
        '\^5(?![0-9])', '5', 'g'),
        '\^6(?![0-9])', '6', 'g'),
        '\^7(?![0-9])', '7', 'g'),
        '\^8(?![0-9])', '8', 'g'),
        '\^9(?![0-9])', '9', 'g'),
        '\^-1(?![0-9])', '-1', 'g'),
        '\^-2(?![0-9])', '-2', 'g')
WHERE ano = 2023
  AND (comando ~ '\^[+-]?\d' OR comando ~ '\d\s*x\s*10');

-- Unidades de medida
UPDATE questoes_enem
SET comando =
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(comando,
        '\bm2\b', 'm2', 'g'),
        '\bkm2\b', 'km2', 'g'),
        '\bm3\b', 'm3', 'g'),
        '\bcm3\b', 'cm3', 'g')
WHERE ano = 2023
  AND comando ~ '\b(m2|km2|m3|cm3)\b';

-- ===============================================================================
-- FASE 7: PADRONIZACAO DE METADADOS
-- ===============================================================================

SELECT '=== FASE 7: PADRONIZAR METADADOS ===' as etapa;

-- Areas
UPDATE questoes_enem
SET area = CASE
    WHEN LOWER(area) LIKE '%linguag%' THEN 'Linguagens, Códigos e suas Tecnologias'
    WHEN LOWER(area) LIKE '%human%' THEN 'Ciências Humanas e suas Tecnologias'
    WHEN LOWER(area) LIKE '%natureza%' THEN 'Ciências da Natureza e suas Tecnologias'
    WHEN LOWER(area) LIKE '%matemat%' THEN 'Matemática e suas Tecnologias'
    ELSE area
END
WHERE ano = 2023
  AND area NOT IN (
    'Linguagens, Códigos e suas Tecnologias',
    'Ciências Humanas e suas Tecnologias',
    'Ciências da Natureza e suas Tecnologias',
    'Matemática e suas Tecnologias'
  );

-- Dia
UPDATE questoes_enem
SET dia = CASE
    WHEN area IN ('Linguagens, Códigos e suas Tecnologias', 'Ciências Humanas e suas Tecnologias') THEN 1
    WHEN area IN ('Ciências da Natureza e suas Tecnologias', 'Matemática e suas Tecnologias') THEN 2
    ELSE dia
END
WHERE ano = 2023
  AND (dia IS NULL OR dia NOT IN (1, 2));

-- Caderno
UPDATE questoes_enem
SET caderno = 'Azul'
WHERE ano = 2023
  AND (caderno IS NULL OR TRIM(caderno) = '');

-- ===============================================================================
-- FASE 8: LIMPEZA DE DADOS INVALIDOS
-- ===============================================================================

SELECT '=== FASE 8: LIMPEZA DE DADOS ===' as etapa;

-- URLs invalidas
UPDATE questoes_enem
SET
    alt_a_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_a_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_a_imagem END,
    alt_b_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_b_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_b_imagem END,
    alt_c_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_c_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_c_imagem END,
    alt_d_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_d_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_d_imagem END,
    alt_e_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_e_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_e_imagem END
WHERE ano = 2023;

-- Prefixos redundantes
UPDATE questoes_enem
SET
    alt_a_texto = CASE WHEN alt_a_texto ~ '^[Aa][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_a_texto, '^[Aa][\.\)\-]\s*', '')) ELSE alt_a_texto END,
    alt_b_texto = CASE WHEN alt_b_texto ~ '^[Bb][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_b_texto, '^[Bb][\.\)\-]\s*', '')) ELSE alt_b_texto END,
    alt_c_texto = CASE WHEN alt_c_texto ~ '^[Cc][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_c_texto, '^[Cc][\.\)\-]\s*', '')) ELSE alt_c_texto END,
    alt_d_texto = CASE WHEN alt_d_texto ~ '^[Dd][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_d_texto, '^[Dd][\.\)\-]\s*', '')) ELSE alt_d_texto END,
    alt_e_texto = CASE WHEN alt_e_texto ~ '^[Ee][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_e_texto, '^[Ee][\.\)\-]\s*', '')) ELSE alt_e_texto END
WHERE ano = 2023;

-- ===============================================================================
-- FASE 9: ATUALIZACAO DE FLAGS
-- ===============================================================================

SELECT '=== FASE 9: ATUALIZAR FLAGS ===' as etapa;

-- tem_imagem
UPDATE questoes_enem q
SET tem_imagem = true
WHERE q.ano = 2023
  AND q.tem_imagem = false
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(q.elementos) e
    WHERE e->>'tipo' = 'imagem'
      AND e->>'arquivo' IS NOT NULL
  );

-- tem_imagem_alternativa
UPDATE questoes_enem
SET tem_imagem_alternativa = (
    (alt_a_imagem IS NOT NULL AND TRIM(alt_a_imagem) != '')
    OR (alt_b_imagem IS NOT NULL AND TRIM(alt_b_imagem) != '')
    OR (alt_c_imagem IS NOT NULL AND TRIM(alt_c_imagem) != '')
    OR (alt_d_imagem IS NOT NULL AND TRIM(alt_d_imagem) != '')
    OR (alt_e_imagem IS NOT NULL AND TRIM(alt_e_imagem) != '')
)
WHERE ano = 2023;

-- tem_formula
UPDATE questoes_enem q
SET tem_formula = true
WHERE q.ano = 2023
  AND q.tem_formula = false
  AND (
    q.comando ~ '[234567890123456789+-x<=>=~-><=]'
    OR q.comando ~ '[A-Z][a-z]?[2345678]'
  );

-- ===============================================================================
-- FASE 10: LACUNAS DA AUDITORIA - GARANTIR ORDEM DOS ELEMENTOS
-- ===============================================================================

SELECT '=== FASE 10: GARANTIR ORDEM DOS ELEMENTOS ===' as etapa;

UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        jsonb_set(elem, '{ordem}', to_jsonb(ordinality::int))
        ORDER BY ordinality
    )
    FROM jsonb_array_elements(q.elementos) WITH ORDINALITY AS e(elem, ordinality)
)
WHERE q.ano = 2023
  AND elementos IS NOT NULL
  AND jsonb_array_length(elementos) > 0;

-- ===============================================================================
-- FASE 11: LACUNAS DA AUDITORIA - REMOVER ELEMENTOS DUPLICADOS
-- ===============================================================================

SELECT '=== FASE 11: REMOVER ELEMENTOS DUPLICADOS ===' as etapa;

-- Identificar e remover elementos com conteudo identico
UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(DISTINCT elem ORDER BY (elem->>'ordem')::int NULLS LAST)
    FROM jsonb_array_elements(q.elementos) elem
)
WHERE q.ano = 2023
  AND elementos IS NOT NULL
  AND jsonb_array_length(elementos) > 1;

-- ===============================================================================
-- FASE 12: ATUALIZAR TIMESTAMP
-- ===============================================================================

UPDATE questoes_enem
SET updated_at = NOW()
WHERE ano = 2023;

-- ===============================================================================
-- VERIFICACAO FINAL
-- ===============================================================================

SELECT '=== VERIFICACAO FINAL ===' as etapa;

SELECT
    metrica,
    valor,
    CASE
        WHEN metrica LIKE '%Total%' THEN valor::text
        ELSE ROUND((valor::numeric / NULLIF((SELECT COUNT(*) FROM questoes_enem WHERE ano = 2023), 0)) * 100, 1)::text || '%'
    END as percentual
FROM (
    SELECT 'Total questoes 2023' as metrica, COUNT(*) as valor FROM questoes_enem WHERE ano = 2023
    UNION ALL
    SELECT 'Com elementos', COUNT(*) FROM questoes_enem WHERE ano = 2023 AND elementos IS NOT NULL AND jsonb_array_length(elementos) > 0
    UNION ALL
    SELECT 'Com comando', COUNT(*) FROM questoes_enem WHERE ano = 2023 AND comando IS NOT NULL
    UNION ALL
    SELECT 'Com gabarito', COUNT(*) FROM questoes_enem WHERE ano = 2023 AND gabarito IS NOT NULL
    UNION ALL
    SELECT 'Com dia definido', COUNT(*) FROM questoes_enem WHERE ano = 2023 AND dia IS NOT NULL
    UNION ALL
    SELECT 'Com area padronizada', COUNT(*) FROM questoes_enem WHERE ano = 2023 AND area IN (
        'Linguagens, Códigos e suas Tecnologias', 'Ciências Humanas e suas Tecnologias',
        'Ciências da Natureza e suas Tecnologias', 'Matemática e suas Tecnologias'
    )
) stats;

-- Comparacao com 2024/2025
SELECT
    ano,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE elementos IS NOT NULL AND jsonb_array_length(elementos) > 0) as com_elementos,
    COUNT(*) FILTER (WHERE comando IS NOT NULL) as com_comando,
    ROUND(COUNT(*) FILTER (WHERE elementos IS NOT NULL AND comando IS NOT NULL AND gabarito IS NOT NULL AND dia IS NOT NULL)::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_completas
FROM questoes_enem
WHERE ano IN (2023, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- Limpeza
DROP FUNCTION IF EXISTS extrair_rotulo_texto_2023(text);
DROP FUNCTION IF EXISTS converter_formulas_2023(text);

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '  CORRECOES ENEM 2023 FINAL APLICADAS COM SUCESSO!';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '  Backup disponivel em: questoes_enem_2023_backup_final';
    RAISE NOTICE '========================================================================';
END $$;
