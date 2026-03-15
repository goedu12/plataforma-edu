-- ===============================================================================
-- CORRECAO COMPLETA: QUESTOES ENEM 2022
-- Padronizar para o formato de 2024/2025
-- Execute no Supabase SQL Editor APOS rodar o diagnostico
-- Data: 2026-03-15
-- ===============================================================================
--
-- PROBLEMAS CORRIGIDOS:
-- 1. Elementos JSONB vazios ou nulos
-- 2. Quebras de linha artificiais (\n) no meio de paragrafos
-- 3. Campo "fonte" dentro dos elementos - formatado com <small>
-- 4. Formulas quimicas em texto simples (H2O -> H2O)
-- 5. Notacao cientifica (10^5 -> 10^5, m^2 -> m^2)
-- 6. Flags desatualizadas (tem_formula, tem_imagem, etc.)
-- 7. Rotulos TEXTO I/II misturados no conteudo
-- 8. Prefixos redundantes em alternativas
-- 9. URLs de imagem invalidas
-- 10. Metadados faltantes (dia, caderno, area)
--
-- ===============================================================================

-- ===============================================================================
-- FASE 0: BACKUP
-- ===============================================================================

DROP TABLE IF EXISTS questoes_enem_2022_backup;
CREATE TABLE questoes_enem_2022_backup AS
SELECT * FROM questoes_enem WHERE ano = 2022;

SELECT 'Backup criado com ' || COUNT(*) || ' questoes de 2022' as status
FROM questoes_enem_2022_backup;

-- ===============================================================================
-- FASE 1: CRIAR ELEMENTOS PARA QUESTOES SEM ELEMENTOS
-- ===============================================================================

SELECT '=== FASE 1: CRIAR ELEMENTOS PARA QUESTOES SEM ELEMENTOS ===' as etapa;

-- 1.1 Criar array de elementos para questoes que tem comando mas nao tem elementos
UPDATE questoes_enem
SET elementos = jsonb_build_array(
    jsonb_build_object(
        'tipo', 'comando',
        'conteudo', comando,
        'ordem', 1
    )
)
WHERE ano = 2022
  AND comando IS NOT NULL
  AND TRIM(comando) != ''
  AND (elementos IS NULL OR jsonb_array_length(elementos) = 0);

SELECT 'Elementos criados para questoes sem elementos: ' || COUNT(*) as resultado
FROM questoes_enem
WHERE ano = 2022
  AND elementos IS NOT NULL
  AND jsonb_array_length(elementos) > 0;

-- ===============================================================================
-- FASE 2: EXTRAIR ROTULOS (TEXTO I, TEXTO II, etc.)
-- ===============================================================================

SELECT '=== FASE 2: EXTRAIR ROTULOS ===' as etapa;

-- Criar funcao para extrair rotulo do conteudo
CREATE OR REPLACE FUNCTION extrair_rotulo_texto_2022(conteudo text)
RETURNS jsonb AS $$
DECLARE
    rotulo_match text[];
    rotulo text;
    conteudo_limpo text;
BEGIN
    IF conteudo IS NULL THEN
        RETURN jsonb_build_object('rotulo', NULL, 'conteudo', conteudo);
    END IF;

    -- Padroes de rotulo no inicio: TEXTO I, TEXTO II, etc.
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
                            to_jsonb((extrair_rotulo_texto_2022(elem->>'conteudo'))->>'rotulo')
                        ),
                        '{conteudo}',
                        to_jsonb((extrair_rotulo_texto_2022(elem->>'conteudo'))->>'conteudo')
                    )
                    ELSE elem
                END
                ORDER BY ordinality
            )
            FROM jsonb_array_elements(q.elementos) WITH ORDINALITY AS e(elem, ordinality)
        ) as elementos_corrigidos
    FROM questoes_enem q
    WHERE q.ano = 2022
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
WHERE ano = 2022
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(elementos) e
      WHERE e->>'rotulo' IS NOT NULL
        AND e->>'rotulo' != ''
  );

-- ===============================================================================
-- FASE 3: REMOVER QUEBRAS DE LINHA ARTIFICIAIS
-- ===============================================================================

SELECT '=== FASE 3: REMOVER QUEBRAS DE LINHA ARTIFICIAIS ===' as etapa;

-- 3.1 Limpar comando: remover \n no meio de frases (manter apenas \n\n para paragrafos)
UPDATE questoes_enem
SET comando = REGEXP_REPLACE(comando, '\s*\n\s*', ' ', 'g')
WHERE ano = 2022
  AND comando ~ '[^\n]\n[^\n]';

-- Restaurar quebras de paragrafo duplas (foram convertidas para dois espacos)
UPDATE questoes_enem
SET comando = REGEXP_REPLACE(comando, '  ', E'\n\n', 'g')
WHERE ano = 2022
  AND comando LIKE '%  %';

-- 3.2 Limpar elementos: remover \n artificiais dentro do conteudo
UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        CASE
            WHEN e->>'tipo' IN ('texto', 'comando') AND e->>'conteudo' ~ '[^\n]\n[^\n]'
            THEN jsonb_set(
                e,
                '{conteudo}',
                to_jsonb(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(e->>'conteudo', '(?<!\n)\n(?!\n)', ' ', 'g'),
                        '\s{2,}', ' ', 'g'
                    )
                )
            )
            ELSE e
        END
        ORDER BY (e->>'ordem')::int NULLS LAST
    )
    FROM jsonb_array_elements(q.elementos) e
)
WHERE q.ano = 2022
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.elementos) e
      WHERE e->>'tipo' IN ('texto', 'comando')
        AND e->>'conteudo' ~ '[^\n]\n[^\n]'
  );

-- ===============================================================================
-- FASE 4: EXTRAIR E FORMATAR FONTES COM <small>
-- ===============================================================================

SELECT '=== FASE 4: FORMATAR FONTES COM <small> ===' as etapa;

-- 4.1 Extrair campo "fonte" de dentro de elementos e converter para <small>
UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        CASE
            -- Se o elemento tem campo "fonte", adicionar como <small> no final do conteudo
            WHEN e->>'fonte' IS NOT NULL AND TRIM(e->>'fonte') != ''
            THEN jsonb_build_object(
                'tipo', e->>'tipo',
                'conteudo', COALESCE(e->>'conteudo', '') || E'\n\n<small>' || TRIM(e->>'fonte') || '</small>',
                'ordem', e->>'ordem'
            )
            ELSE e - 'fonte'  -- Remover campo fonte se existir vazio
        END
        ORDER BY (e->>'ordem')::int NULLS LAST
    )
    FROM jsonb_array_elements(q.elementos) e
)
WHERE q.ano = 2022
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.elementos) e
      WHERE e->>'fonte' IS NOT NULL AND TRIM(e->>'fonte') != ''
  );

-- 4.2 Formatar fontes que estao misturadas no texto (padrao brasileiro de referencia)
UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        CASE
            WHEN e->>'tipo' = 'texto'
                 AND e->>'conteudo' NOT LIKE '%<small%'
                 AND (
                     e->>'conteudo' ~ '(Disponivel em:|Acesso em:|Adaptado de|FONTE:|Fonte:)'
                     OR e->>'conteudo' ~ '\([A-Z][A-Za-z\s,\.]+,\s*\d{4}'
                 )
            THEN jsonb_set(
                e,
                '{conteudo}',
                to_jsonb(
                    REGEXP_REPLACE(
                        e->>'conteudo',
                        E'(\n|\r\n|\r)?\\s*((Disponivel em:.*|Acesso em:.*|Adaptado de.*|FONTE:.*|Fonte:.*|\\([A-Z][^)]+\\)))\\s*$',
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
WHERE q.ano = 2022
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.elementos) e
      WHERE e->>'tipo' = 'texto'
        AND e->>'conteudo' NOT LIKE '%<small%'
        AND (
            e->>'conteudo' ~ '(Disponivel em:|Acesso em:|Adaptado de|FONTE:|Fonte:)'
            OR e->>'conteudo' ~ '\([A-Z][A-Za-z\s,\.]+,\s*\d{4}'
        )
  );

-- ===============================================================================
-- FASE 5: CONVERTER FORMULAS QUIMICAS PARA UNICODE
-- ===============================================================================

SELECT '=== FASE 5: CONVERTER FORMULAS QUIMICAS ===' as etapa;

-- Criar funcao para converter formulas
CREATE OR REPLACE FUNCTION converter_formulas_quimicas_2022(texto text)
RETURNS text AS $$
DECLARE
    resultado text;
BEGIN
    IF texto IS NULL THEN
        RETURN texto;
    END IF;

    resultado := texto;

    -- Compostos com parenteses (fazer primeiro)
    resultado := regexp_replace(resultado, '\bCa\(OH\)2\b', 'Ca(OH)2', 'g');
    resultado := regexp_replace(resultado, '\bMg\(OH\)2\b', 'Mg(OH)2', 'g');
    resultado := regexp_replace(resultado, '\bAl\(OH\)3\b', 'Al(OH)3', 'g');
    resultado := regexp_replace(resultado, '\bFe\(OH\)3\b', 'Fe(OH)3', 'g');

    -- Organicos complexos
    resultado := regexp_replace(resultado, '\bC6H12O6\b', 'C6H12O6', 'g');
    resultado := regexp_replace(resultado, '\bC2H5OH\b', 'C2H5OH', 'g');
    resultado := regexp_replace(resultado, '\bCH3COOH\b', 'CH3COOH', 'g');

    -- Acidos
    resultado := regexp_replace(resultado, '\bH2SO4\b', 'H2SO4', 'g');
    resultado := regexp_replace(resultado, '\bH2CO3\b', 'H2CO3', 'g');
    resultado := regexp_replace(resultado, '\bH3PO4\b', 'H3PO4', 'g');
    resultado := regexp_replace(resultado, '\bHNO3\b', 'HNO3', 'g');

    -- Sais
    resultado := regexp_replace(resultado, '\bCaCO3\b', 'CaCO3', 'g');
    resultado := regexp_replace(resultado, '\bNa2CO3\b', 'Na2CO3', 'g');
    resultado := regexp_replace(resultado, '\bNaHCO3\b', 'NaHCO3', 'g');

    -- Oxidos
    resultado := regexp_replace(resultado, '\bFe2O3\b', 'Fe2O3', 'g');
    resultado := regexp_replace(resultado, '\bAl2O3\b', 'Al2O3', 'g');
    resultado := regexp_replace(resultado, '\bSiO2\b', 'SiO2', 'g');

    -- Gases e moleculas simples
    resultado := regexp_replace(resultado, '\bH2O\b', 'H2O', 'g');
    resultado := regexp_replace(resultado, '\bCO2\b', 'CO2', 'g');
    resultado := regexp_replace(resultado, '\bSO2\b', 'SO2', 'g');
    resultado := regexp_replace(resultado, '\bSO3\b', 'SO3', 'g');
    resultado := regexp_replace(resultado, '\bNO2\b', 'NO2', 'g');
    resultado := regexp_replace(resultado, '\bN2O\b', 'N2O', 'g');
    resultado := regexp_replace(resultado, '\bNH3\b', 'NH3', 'g');
    resultado := regexp_replace(resultado, '\bCH4\b', 'CH4', 'g');
    resultado := regexp_replace(resultado, '\bH2S\b', 'H2S', 'g');
    resultado := regexp_replace(resultado, '\bO2\b', 'O2', 'g');
    resultado := regexp_replace(resultado, '\bN2\b', 'N2', 'g');
    resultado := regexp_replace(resultado, '\bH2\b', 'H2', 'g');
    resultado := regexp_replace(resultado, '\bCl2\b', 'Cl2', 'g');
    resultado := regexp_replace(resultado, '\bO3\b', 'O3', 'g');

    -- Hidrocarbonetos
    resultado := regexp_replace(resultado, '\bC2H6\b', 'C2H6', 'g');
    resultado := regexp_replace(resultado, '\bC2H4\b', 'C2H4', 'g');
    resultado := regexp_replace(resultado, '\bC2H2\b', 'C2H2', 'g');
    resultado := regexp_replace(resultado, '\bC3H8\b', 'C3H8', 'g');
    resultado := regexp_replace(resultado, '\bC6H6\b', 'C6H6', 'g');

    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- Aplicar conversao de formulas no comando
UPDATE questoes_enem
SET comando = converter_formulas_quimicas_2022(comando)
WHERE ano = 2022
  AND comando ~ '(H2O|CO2|O2|N2|H2|CH4|NH3|H2SO4|CaCO3|Fe2O3)';

-- Aplicar conversao de formulas nos elementos
UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        CASE
            WHEN elem->>'tipo' IN ('texto', 'comando', 'titulo')
                 AND elem->>'conteudo' ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
            THEN jsonb_set(
                elem,
                '{conteudo}',
                to_jsonb(converter_formulas_quimicas_2022(elem->>'conteudo'))
            )
            ELSE elem
        END
        ORDER BY ordinality
    )
    FROM jsonb_array_elements(q.elementos) WITH ORDINALITY AS e(elem, ordinality)
)
WHERE q.ano = 2022
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.elementos) e2
      WHERE e2->>'tipo' IN ('texto', 'comando', 'titulo')
        AND e2->>'conteudo' ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
  );

-- Converter nas alternativas
UPDATE questoes_enem
SET
    alt_a_texto = converter_formulas_quimicas_2022(alt_a_texto),
    alt_b_texto = converter_formulas_quimicas_2022(alt_b_texto),
    alt_c_texto = converter_formulas_quimicas_2022(alt_c_texto),
    alt_d_texto = converter_formulas_quimicas_2022(alt_d_texto),
    alt_e_texto = converter_formulas_quimicas_2022(alt_e_texto)
WHERE ano = 2022
  AND (
    alt_a_texto ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
    OR alt_b_texto ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
    OR alt_c_texto ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
    OR alt_d_texto ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
    OR alt_e_texto ~ '(H2O|CO2|O2|N2|H2SO4|NH3|CH4)'
  );

-- ===============================================================================
-- FASE 6: CONVERTER NOTACAO CIENTIFICA E EXPOENTES PARA UNICODE
-- ===============================================================================

SELECT '=== FASE 6: CONVERTER NOTACAO CIENTIFICA ===' as etapa;

-- 6.1 Converter expoentes no comando
UPDATE questoes_enem
SET comando =
    -- Converter x para x em multiplicacao cientifica
    REGEXP_REPLACE(
    -- Expoentes positivos
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
    -- Expoentes negativos
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
        '\^0(?![0-9])', '0', 'g'),
        '\^1(?![0-9])', '1', 'g'),
        '\^2(?![0-9])', '2', 'g'),
        '\^3(?![0-9])', '3', 'g'),
        '\^4(?![0-9])', '4', 'g'),
        '\^5(?![0-9])', '5', 'g'),
        '\^6(?![0-9])', '6', 'g'),
        '\^7(?![0-9])', '7', 'g'),
        '\^8(?![0-9])', '8', 'g'),
        '\^9(?![0-9])', '9', 'g'),
        '\^-1(?![0-9])', '-1', 'g'),
        '\^-2(?![0-9])', '-2', 'g'),
        '\^-3(?![0-9])', '-3', 'g'),
        '\^-4(?![0-9])', '-4', 'g'),
        '\^-5(?![0-9])', '-5', 'g'),
        '\^-6(?![0-9])', '-6', 'g'),
        '\^-7(?![0-9])', '-7', 'g'),
        '\^-8(?![0-9])', '-8', 'g'),
        '\^-9(?![0-9])', '-9', 'g')
WHERE ano = 2022
  AND (comando ~ '\^[+-]?\d' OR comando ~ '\d\s*x\s*10');

-- 6.2 Converter unidades de medida comuns (m2, km2, cm2, etc.)
UPDATE questoes_enem
SET comando =
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(comando,
        '\bm2\b', 'm2', 'g'),
        '\bkm2\b', 'km2', 'g'),
        '\bcm2\b', 'cm2', 'g'),
        '\bmm2\b', 'mm2', 'g'),
        '\bm3\b', 'm3', 'g'),
        '\bcm3\b', 'cm3', 'g')
WHERE ano = 2022
  AND comando ~ '\b(m2|km2|cm2|mm2|m3|cm3)\b';

-- ===============================================================================
-- FASE 7: PADRONIZACAO DE METADADOS
-- ===============================================================================

SELECT '=== FASE 7: PADRONIZACAO DE METADADOS ===' as etapa;

-- 7.1 Padronizar nomes das areas
UPDATE questoes_enem
SET area = CASE
    WHEN LOWER(area) LIKE '%linguag%' OR LOWER(area) LIKE '%codigo%' OR area ILIKE '%LC%'
        THEN 'Linguagens, Codigos e suas Tecnologias'
    WHEN LOWER(area) LIKE '%human%' OR area ILIKE '%CH%'
        THEN 'Ciencias Humanas e suas Tecnologias'
    WHEN LOWER(area) LIKE '%natureza%' OR area ILIKE '%CN%'
        THEN 'Ciencias da Natureza e suas Tecnologias'
    WHEN LOWER(area) LIKE '%matemat%' OR area ILIKE '%MT%'
        THEN 'Matematica e suas Tecnologias'
    ELSE area
END
WHERE ano = 2022
  AND area NOT IN (
    'Linguagens, Codigos e suas Tecnologias',
    'Ciencias Humanas e suas Tecnologias',
    'Ciencias da Natureza e suas Tecnologias',
    'Matematica e suas Tecnologias'
  );

-- 7.2 Definir DIA correto baseado na area
UPDATE questoes_enem
SET dia = CASE
    WHEN area IN ('Linguagens, Codigos e suas Tecnologias', 'Ciencias Humanas e suas Tecnologias')
        THEN 1
    WHEN area IN ('Ciencias da Natureza e suas Tecnologias', 'Matematica e suas Tecnologias')
        THEN 2
    ELSE dia
END
WHERE ano = 2022
  AND (dia IS NULL OR dia NOT IN (1, 2));

-- 7.3 Definir caderno padrao (Azul) se ausente
UPDATE questoes_enem
SET caderno = 'Azul'
WHERE ano = 2022
  AND (caderno IS NULL OR TRIM(caderno) = '');

-- ===============================================================================
-- FASE 8: ATUALIZACAO DE FLAGS
-- ===============================================================================

SELECT '=== FASE 8: ATUALIZACAO DE FLAGS ===' as etapa;

-- 8.1 Flag tem_imagem
UPDATE questoes_enem q
SET tem_imagem = true
WHERE q.ano = 2022
  AND q.tem_imagem = false
  AND (
    EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'tipo' = 'imagem'
          AND e->>'arquivo' IS NOT NULL
          AND TRIM(e->>'arquivo') != ''
    )
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' LIKE '%<img%'
           OR e->>'conteudo' LIKE '%![%](%'
    )
  );

-- 8.2 Flag tem_imagem_alternativa
UPDATE questoes_enem
SET tem_imagem_alternativa = true
WHERE ano = 2022
  AND tem_imagem_alternativa = false
  AND (
    (alt_a_imagem IS NOT NULL AND TRIM(alt_a_imagem) NOT IN ('', 'nan', 'null', 'none', 'undefined'))
    OR (alt_b_imagem IS NOT NULL AND TRIM(alt_b_imagem) NOT IN ('', 'nan', 'null', 'none', 'undefined'))
    OR (alt_c_imagem IS NOT NULL AND TRIM(alt_c_imagem) NOT IN ('', 'nan', 'null', 'none', 'undefined'))
    OR (alt_d_imagem IS NOT NULL AND TRIM(alt_d_imagem) NOT IN ('', 'nan', 'null', 'none', 'undefined'))
    OR (alt_e_imagem IS NOT NULL AND TRIM(alt_e_imagem) NOT IN ('', 'nan', 'null', 'none', 'undefined'))
  );

-- 8.3 Flag tem_formula (apos conversoes Unicode)
UPDATE questoes_enem q
SET tem_formula = true
WHERE q.ano = 2022
  AND q.tem_formula = false
  AND (
    -- Formulas Unicode ja formatadas
    q.comando ~ '[234567890123456789+-x<=>=~-><=]'
    -- Formulas quimicas formatadas
    OR q.comando ~ '[A-Z][a-z]?[2345678]'
    -- Notacao cientifica
    OR q.comando ~ '\d\s*x\s*10'
    -- Nos elementos
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '[234567890123456789+-x<=>=~-><=]'
           OR e->>'conteudo' ~ '[A-Z][a-z]?[2345678]'
           OR e->>'conteudo' ~ '\d\s*x\s*10'
    )
    -- Nas alternativas
    OR alt_a_texto ~ '[234567890123456789+-x<=>=~-><=]'
    OR alt_b_texto ~ '[234567890123456789+-x<=>=~-><=]'
    OR alt_c_texto ~ '[234567890123456789+-x<=>=~-><=]'
    OR alt_d_texto ~ '[234567890123456789+-x<=>=~-><=]'
    OR alt_e_texto ~ '[234567890123456789+-x<=>=~-><=]'
  );

-- ===============================================================================
-- FASE 9: LIMPEZA DE DADOS INVALIDOS
-- ===============================================================================

SELECT '=== FASE 9: LIMPEZA DE DADOS INVALIDOS ===' as etapa;

-- 9.1 Limpar URLs de imagem invalidas
UPDATE questoes_enem
SET
    alt_a_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_a_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_a_imagem END,
    alt_b_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_b_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_b_imagem END,
    alt_c_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_c_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_c_imagem END,
    alt_d_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_d_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_d_imagem END,
    alt_e_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_e_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_e_imagem END
WHERE ano = 2022;

-- 9.2 Remover prefixos redundantes das alternativas
UPDATE questoes_enem
SET
    alt_a_texto = CASE WHEN alt_a_texto ~ '^[Aa][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_a_texto, '^[Aa][\.\)\-]\s*', '')) ELSE alt_a_texto END,
    alt_b_texto = CASE WHEN alt_b_texto ~ '^[Bb][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_b_texto, '^[Bb][\.\)\-]\s*', '')) ELSE alt_b_texto END,
    alt_c_texto = CASE WHEN alt_c_texto ~ '^[Cc][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_c_texto, '^[Cc][\.\)\-]\s*', '')) ELSE alt_c_texto END,
    alt_d_texto = CASE WHEN alt_d_texto ~ '^[Dd][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_d_texto, '^[Dd][\.\)\-]\s*', '')) ELSE alt_d_texto END,
    alt_e_texto = CASE WHEN alt_e_texto ~ '^[Ee][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_e_texto, '^[Ee][\.\)\-]\s*', '')) ELSE alt_e_texto END
WHERE ano = 2022
  AND (
    alt_a_texto ~ '^[Aa][\.\)\-]'
    OR alt_b_texto ~ '^[Bb][\.\)\-]'
    OR alt_c_texto ~ '^[Cc][\.\)\-]'
    OR alt_d_texto ~ '^[Dd][\.\)\-]'
    OR alt_e_texto ~ '^[Ee][\.\)\-]'
  );

-- 9.3 Recalcular flag tem_imagem_alternativa apos limpeza
UPDATE questoes_enem
SET tem_imagem_alternativa = (
    (alt_a_imagem IS NOT NULL AND TRIM(alt_a_imagem) != '')
    OR (alt_b_imagem IS NOT NULL AND TRIM(alt_b_imagem) != '')
    OR (alt_c_imagem IS NOT NULL AND TRIM(alt_c_imagem) != '')
    OR (alt_d_imagem IS NOT NULL AND TRIM(alt_d_imagem) != '')
    OR (alt_e_imagem IS NOT NULL AND TRIM(alt_e_imagem) != '')
)
WHERE ano = 2022;

-- 9.4 Limpar espacos extras e normalizar texto
UPDATE questoes_enem
SET comando = TRIM(REGEXP_REPLACE(comando, '\s{2,}', ' ', 'g'))
WHERE ano = 2022
  AND comando ~ '\s{2,}';

-- ===============================================================================
-- FASE 10: GARANTIR ORDEM DOS ELEMENTOS
-- ===============================================================================

SELECT '=== FASE 10: GARANTIR ORDEM DOS ELEMENTOS ===' as etapa;

-- Garantir que todos os elementos tem campo 'ordem' sequencial
UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        jsonb_set(elem, '{ordem}', to_jsonb(ordinality::int))
        ORDER BY ordinality
    )
    FROM jsonb_array_elements(q.elementos) WITH ORDINALITY AS e(elem, ordinality)
)
WHERE q.ano = 2022
  AND elementos IS NOT NULL
  AND jsonb_array_length(elementos) > 0;

-- ===============================================================================
-- FASE 11: ATUALIZAR TIMESTAMP
-- ===============================================================================

UPDATE questoes_enem
SET updated_at = NOW()
WHERE ano = 2022;

-- ===============================================================================
-- VERIFICACAO FINAL
-- ===============================================================================

SELECT '=== VERIFICACAO FINAL ===' as etapa;

SELECT
    metrica,
    valor,
    CASE
        WHEN metrica LIKE '%Total%' THEN valor::text
        WHEN valor = (SELECT COUNT(*) FROM questoes_enem WHERE ano = 2022) THEN '100%'
        ELSE ROUND((valor::numeric / NULLIF((SELECT COUNT(*) FROM questoes_enem WHERE ano = 2022), 0)) * 100, 1)::text || '%'
    END as percentual
FROM (
    SELECT 'Total questoes 2022' as metrica, COUNT(*) as valor FROM questoes_enem WHERE ano = 2022
    UNION ALL
    SELECT 'Com elementos' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2022 AND elementos IS NOT NULL AND jsonb_array_length(elementos) > 0
    UNION ALL
    SELECT 'Com comando' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2022 AND comando IS NOT NULL AND TRIM(comando) != ''
    UNION ALL
    SELECT 'Com gabarito' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2022 AND gabarito IS NOT NULL
    UNION ALL
    SELECT 'Com todas alternativas' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2022
        AND alt_a_texto IS NOT NULL AND alt_b_texto IS NOT NULL AND alt_c_texto IS NOT NULL AND alt_d_texto IS NOT NULL AND alt_e_texto IS NOT NULL
    UNION ALL
    SELECT 'Com dia definido' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2022 AND dia IS NOT NULL
    UNION ALL
    SELECT 'Com area padronizada' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2022 AND area IN (
        'Linguagens, Codigos e suas Tecnologias', 'Ciencias Humanas e suas Tecnologias',
        'Ciencias da Natureza e suas Tecnologias', 'Matematica e suas Tecnologias'
    )
    UNION ALL
    SELECT 'Com flag tem_imagem' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2022 AND tem_imagem = true
    UNION ALL
    SELECT 'Com flag tem_formula' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2022 AND tem_formula = true
) stats
ORDER BY
    CASE metrica
        WHEN 'Total questoes 2022' THEN 1
        WHEN 'Com elementos' THEN 2
        WHEN 'Com comando' THEN 3
        WHEN 'Com gabarito' THEN 4
        WHEN 'Com todas alternativas' THEN 5
        WHEN 'Com dia definido' THEN 6
        WHEN 'Com area padronizada' THEN 7
        WHEN 'Com flag tem_imagem' THEN 8
        WHEN 'Com flag tem_formula' THEN 9
    END;

-- Comparacao final com 2024/2025
SELECT '=== COMPARACAO COM 2024/2025 ===' as etapa;

SELECT
    ano,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE elementos IS NOT NULL AND jsonb_array_length(elementos) > 0) as com_elementos,
    COUNT(*) FILTER (WHERE comando IS NOT NULL) as com_comando,
    COUNT(*) FILTER (WHERE gabarito IS NOT NULL) as com_gabarito,
    COUNT(*) FILTER (WHERE tem_imagem = true) as com_imagem,
    COUNT(*) FILTER (WHERE tem_formula = true) as com_formula,
    ROUND(COUNT(*) FILTER (WHERE
        elementos IS NOT NULL AND jsonb_array_length(elementos) > 0
        AND comando IS NOT NULL
        AND gabarito IS NOT NULL
        AND dia IS NOT NULL
    )::numeric / NULLIF(COUNT(*), 0) * 100, 1) as pct_completas
FROM questoes_enem
WHERE ano IN (2022, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- ===============================================================================
-- LIMPEZA DE FUNCOES TEMPORARIAS
-- ===============================================================================

DROP FUNCTION IF EXISTS extrair_rotulo_texto_2022(text);
DROP FUNCTION IF EXISTS converter_formulas_quimicas_2022(text);

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '  CORRECOES ENEM 2022 APLICADAS COM SUCESSO!';
    RAISE NOTICE '========================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '  Correcoes aplicadas:';
    RAISE NOTICE '    - Elementos criados para questoes sem elementos';
    RAISE NOTICE '    - Rotulos extraidos (TEXTO I, II, etc.)';
    RAISE NOTICE '    - Quebras de linha artificiais removidas';
    RAISE NOTICE '    - Fontes formatadas com tag <small>';
    RAISE NOTICE '    - Formulas quimicas convertidas (H2O, CO2, etc.)';
    RAISE NOTICE '    - Notacao cientifica convertida (10^5, m2, etc.)';
    RAISE NOTICE '    - Flags atualizadas (tem_formula, tem_imagem)';
    RAISE NOTICE '    - Metadados padronizados (area, dia, caderno)';
    RAISE NOTICE '    - URLs de imagem invalidas limpas';
    RAISE NOTICE '    - Prefixos redundantes removidos das alternativas';
    RAISE NOTICE '';
    RAISE NOTICE '  Backup disponivel em: questoes_enem_2022_backup';
    RAISE NOTICE '';
    RAISE NOTICE '  Para reverter todas as alteracoes:';
    RAISE NOTICE '    DELETE FROM questoes_enem WHERE ano = 2022;';
    RAISE NOTICE '    INSERT INTO questoes_enem SELECT * FROM questoes_enem_2022_backup;';
    RAISE NOTICE '';
    RAISE NOTICE '  As questoes de 2022 agora seguem o mesmo padrao de 2024/2025';
    RAISE NOTICE '';
END $$;
