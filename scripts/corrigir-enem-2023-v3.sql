-- ═══════════════════════════════════════════════════════════════════════════════
-- CORRECAO ENEM 2023 - VERSAO 3 (INDIVIDUAL)
-- Execute no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Correcoes aplicadas:
-- 1. Extrair TEXTO I/II do conteudo para campo rotulo
-- 2. Converter formulas quimicas para Unicode
-- 3. Formatar fontes com <small> tags (ja feito na v2)
-- 4. Corrigir URLs de imagens relativas
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 1: DIAGNOSTICO - Ver estado atual
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ DIAGNOSTICO INICIAL - ENEM 2023 ═══' as secao;

-- Contar questoes com TEXTO I/II no conteudo (problema a corrigir)
SELECT
    'Questoes com TEXTO I/II no conteudo (sem rotulo)' as metrica,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND e->>'tipo' = 'texto'
  AND (e->>'rotulo' IS NULL OR e->>'rotulo' = '')
  AND (
    e->>'conteudo' ~* '^TEXTO\s+[IVX]+\s*\n'
    OR e->>'conteudo' ~* '^Texto\s+[IVX]+\s*\n'
    OR e->>'conteudo' ~* '^\*\*TEXTO\s+[IVX]+\*\*\s*\n'
  );

-- Contar questoes com formulas quimicas nao convertidas
SELECT
    'Questoes com formulas quimicas ASCII' as metrica,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND e->>'tipo' IN ('texto', 'comando')
  AND (
    e->>'conteudo' ~ '\bH2O\b'
    OR e->>'conteudo' ~ '\bCO2\b'
    OR e->>'conteudo' ~ '\bO2\b'
    OR e->>'conteudo' ~ '\bN2\b'
    OR e->>'conteudo' ~ '\bH2SO4\b'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 2: EXTRAIR ROTULOS (TEXTO I, TEXTO II, etc.)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 2: EXTRAIR ROTULOS ═══' as secao;

-- Criar funcao para extrair rotulo do conteudo
CREATE OR REPLACE FUNCTION extrair_rotulo_texto(conteudo text)
RETURNS jsonb AS $$
DECLARE
    rotulo_match text[];
    rotulo text;
    conteudo_limpo text;
BEGIN
    IF conteudo IS NULL THEN
        RETURN jsonb_build_object('rotulo', NULL, 'conteudo', conteudo);
    END IF;

    -- Padroes de rotulo no inicio
    -- TEXTO I, TEXTO II, etc.
    rotulo_match := regexp_match(conteudo, '^(TEXTO\s+[IVX]+)\s*\n+', 'i');
    IF rotulo_match IS NOT NULL THEN
        rotulo := UPPER(TRIM(rotulo_match[1]));
        conteudo_limpo := regexp_replace(conteudo, '^(TEXTO\s+[IVX]+)\s*\n+', '', 'i');
        RETURN jsonb_build_object('rotulo', rotulo, 'conteudo', TRIM(conteudo_limpo));
    END IF;

    -- **TEXTO I** formato markdown
    rotulo_match := regexp_match(conteudo, '^\*\*(TEXTO\s+[IVX]+)\*\*\s*\n+', 'i');
    IF rotulo_match IS NOT NULL THEN
        rotulo := UPPER(TRIM(rotulo_match[1]));
        conteudo_limpo := regexp_replace(conteudo, '^\*\*(TEXTO\s+[IVX]+)\*\*\s*\n+', '', 'i');
        RETURN jsonb_build_object('rotulo', rotulo, 'conteudo', TRIM(conteudo_limpo));
    END IF;

    -- Sem rotulo encontrado
    RETURN jsonb_build_object('rotulo', NULL, 'conteudo', conteudo);
END;
$$ LANGUAGE plpgsql;

-- Aplicar extracao de rotulos
WITH questoes_rotulo AS (
    SELECT
        q.id,
        q.numero,
        q.elementos,
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
                            to_jsonb((extrair_rotulo_texto(elem->>'conteudo'))->>'rotulo')
                        ),
                        '{conteudo}',
                        to_jsonb((extrair_rotulo_texto(elem->>'conteudo'))->>'conteudo')
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
  AND qr.elementos_corrigidos IS NOT NULL
  AND qr.elementos_corrigidos != q.elementos;

SELECT 'Rotulos extraidos' as acao, COUNT(*) as questoes_afetadas
FROM questoes_enem
WHERE ano = 2023
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(elementos) e
      WHERE e->>'rotulo' IS NOT NULL
        AND e->>'rotulo' != ''
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 3: CONVERTER FORMULAS QUIMICAS PARA UNICODE
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 3: CONVERTER FORMULAS QUIMICAS ═══' as secao;

-- Criar funcao para converter formulas
CREATE OR REPLACE FUNCTION converter_formulas_quimicas(texto text)
RETURNS text AS $$
DECLARE
    resultado text;
BEGIN
    IF texto IS NULL THEN
        RETURN texto;
    END IF;

    resultado := texto;

    -- Gases simples
    resultado := regexp_replace(resultado, '\bH2O\b', 'H₂O', 'g');
    resultado := regexp_replace(resultado, '\bCO2\b', 'CO₂', 'g');
    resultado := regexp_replace(resultado, '\bO2\b', 'O₂', 'g');
    resultado := regexp_replace(resultado, '\bN2\b', 'N₂', 'g');
    resultado := regexp_replace(resultado, '\bH2\b', 'H₂', 'g');
    resultado := regexp_replace(resultado, '\bCl2\b', 'Cl₂', 'g');
    resultado := regexp_replace(resultado, '\bO3\b', 'O₃', 'g');
    resultado := regexp_replace(resultado, '\bNH3\b', 'NH₃', 'g');
    resultado := regexp_replace(resultado, '\bCH4\b', 'CH₄', 'g');
    resultado := regexp_replace(resultado, '\bSO2\b', 'SO₂', 'g');
    resultado := regexp_replace(resultado, '\bSO3\b', 'SO₃', 'g');
    resultado := regexp_replace(resultado, '\bNO2\b', 'NO₂', 'g');
    resultado := regexp_replace(resultado, '\bN2O\b', 'N₂O', 'g');

    -- Acidos
    resultado := regexp_replace(resultado, '\bH2SO4\b', 'H₂SO₄', 'g');
    resultado := regexp_replace(resultado, '\bHNO3\b', 'HNO₃', 'g');
    resultado := regexp_replace(resultado, '\bH3PO4\b', 'H₃PO₄', 'g');
    resultado := regexp_replace(resultado, '\bH2CO3\b', 'H₂CO₃', 'g');

    -- Oxidos
    resultado := regexp_replace(resultado, '\bFe2O3\b', 'Fe₂O₃', 'g');
    resultado := regexp_replace(resultado, '\bAl2O3\b', 'Al₂O₃', 'g');
    resultado := regexp_replace(resultado, '\bSiO2\b', 'SiO₂', 'g');

    -- Sais
    resultado := regexp_replace(resultado, '\bCaCO3\b', 'CaCO₃', 'g');
    resultado := regexp_replace(resultado, '\bNa2CO3\b', 'Na₂CO₃', 'g');
    resultado := regexp_replace(resultado, '\bNaHCO3\b', 'NaHCO₃', 'g');

    -- Organicos
    resultado := regexp_replace(resultado, '\bC2H5OH\b', 'C₂H₅OH', 'g');
    resultado := regexp_replace(resultado, '\bC2H6\b', 'C₂H₆', 'g');
    resultado := regexp_replace(resultado, '\bC6H12O6\b', 'C₆H₁₂O₆', 'g');
    resultado := regexp_replace(resultado, '\bC6H6\b', 'C₆H₆', 'g');

    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- Aplicar conversao de formulas
WITH questoes_formula AS (
    SELECT
        q.id,
        (
            SELECT jsonb_agg(
                CASE
                    WHEN elem->>'tipo' IN ('texto', 'comando', 'titulo')
                         AND elem->>'conteudo' ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
                    THEN jsonb_set(
                        elem,
                        '{conteudo}',
                        to_jsonb(converter_formulas_quimicas(elem->>'conteudo'))
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
          WHERE e2->>'tipo' IN ('texto', 'comando', 'titulo')
            AND e2->>'conteudo' ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
      )
)
UPDATE questoes_enem q
SET elementos = qf.elementos_corrigidos
FROM questoes_formula qf
WHERE q.id = qf.id
  AND qf.elementos_corrigidos IS NOT NULL;

-- Converter tambem no campo comando
UPDATE questoes_enem
SET comando = converter_formulas_quimicas(comando)
WHERE ano = 2023
  AND comando ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)';

-- Converter nas alternativas
UPDATE questoes_enem
SET
    alt_a_texto = converter_formulas_quimicas(alt_a_texto),
    alt_b_texto = converter_formulas_quimicas(alt_b_texto),
    alt_c_texto = converter_formulas_quimicas(alt_c_texto),
    alt_d_texto = converter_formulas_quimicas(alt_d_texto),
    alt_e_texto = converter_formulas_quimicas(alt_e_texto)
WHERE ano = 2023
  AND (
    alt_a_texto ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
    OR alt_b_texto ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
    OR alt_c_texto ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
    OR alt_d_texto ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
    OR alt_e_texto ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
  );

SELECT 'Formulas convertidas em elementos' as acao, COUNT(*) as questoes_afetadas
FROM questoes_enem
WHERE ano = 2023
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(elementos) e
      WHERE e->>'conteudo' ~ '(H₂O|CO₂|O₂|N₂|H₂SO₄)'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 4: VERIFICACAO FINAL
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ VERIFICACAO FINAL ═══' as secao;

-- Questoes com rotulo preenchido
SELECT
    'Questoes com rotulo preenchido' as metrica,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND e->>'rotulo' IS NOT NULL
  AND e->>'rotulo' != '';

-- Questoes ainda com TEXTO I/II no conteudo
SELECT
    'Questoes ainda com TEXTO I/II no conteudo' as metrica,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND e->>'tipo' = 'texto'
  AND (e->>'rotulo' IS NULL OR e->>'rotulo' = '')
  AND e->>'conteudo' ~* 'TEXTO\s+[IVX]+'
  AND e->>'conteudo' !~* 'no texto|do texto|o texto|este texto';

-- Questoes com formulas Unicode
SELECT
    'Questoes com formulas Unicode' as metrica,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q,
     jsonb_array_elements(q.elementos) e
WHERE q.ano = 2023
  AND e->>'conteudo' ~ '[₀₁₂₃₄₅₆₇₈₉]';

-- Comparar com 2024/2025
SELECT
    ano,
    COUNT(*) as total_questoes,
    COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(elementos) e
        WHERE e->>'rotulo' IS NOT NULL AND e->>'rotulo' != ''
    )) as com_rotulo,
    COUNT(*) FILTER (WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(elementos) e
        WHERE e->>'conteudo' ~ '[₀₁₂₃₄₅₆₇₈₉]'
    )) as com_unicode_subscrito
FROM questoes_enem
WHERE ano IN (2023, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- ═══════════════════════════════════════════════════════════════════════════════
-- LIMPEZA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Remover funcoes temporarias (opcional)
-- DROP FUNCTION IF EXISTS extrair_rotulo_texto(text);
-- DROP FUNCTION IF EXISTS converter_formulas_quimicas(text);

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  CORRECAO ENEM 2023 V3 CONCLUIDA';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
END $$;
