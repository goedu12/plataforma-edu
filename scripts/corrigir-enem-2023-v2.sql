-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO COMPLETA: QUESTÕES ENEM 2023 - VERSÃO 2.0
-- Padronizar para o formato de 2024/2025
-- Execute no Supabase SQL Editor APÓS rodar o diagnóstico
-- Data: 2026-03-14
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- PROBLEMAS CORRIGIDOS:
-- 1. Quebras de linha artificiais (\n) no meio de parágrafos
-- 2. Campo "fonte" dentro dos elementos - formatado com <small>
-- 3. Comando com \n - limpar para texto corrido
-- 4. Fórmulas químicas em texto simples (H2O → H₂O)
-- 5. Notação científica (10^5 → 10⁵, m^2 → m²)
-- 6. Flags desatualizadas (tem_formula, tem_imagem, etc.)
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 0: BACKUP
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS questoes_enem_2023_backup_v2;
CREATE TABLE questoes_enem_2023_backup_v2 AS
SELECT * FROM questoes_enem WHERE ano = 2023;

SELECT 'Backup criado com ' || COUNT(*) || ' questões de 2023' as status
FROM questoes_enem_2023_backup_v2;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 1: REMOVER QUEBRAS DE LINHA ARTIFICIAIS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 1: REMOVER QUEBRAS DE LINHA ARTIFICIAIS ═══' as etapa;

-- 1.1 Limpar comando: remover \n no meio de frases (manter apenas \n\n para parágrafos)
SELECT '→ 1.1 Limpando quebras de linha no comando...' as acao;

-- Primeiro: remover espaços extras ao redor de \n
UPDATE questoes_enem
SET comando = REGEXP_REPLACE(comando, '\s*\n\s*', ' ', 'g')
WHERE ano = 2023
  AND comando ~ '[^\n]\n[^\n]';

-- Restaurar quebras de parágrafo duplas (foram convertidas para dois espaços)
UPDATE questoes_enem
SET comando = REGEXP_REPLACE(comando, '  ', E'\n\n', 'g')
WHERE ano = 2023
  AND comando LIKE '%  %';

-- 1.2 Limpar elementos: remover \n artificiais dentro do conteúdo
SELECT '→ 1.2 Limpando quebras de linha nos elementos...' as acao;

UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        CASE
            WHEN e->>'tipo' IN ('texto', 'comando') AND e->>'conteudo' ~ '[^\n]\n[^\n]'
            THEN jsonb_set(
                e,
                '{conteudo}',
                to_jsonb(
                    -- Remover quebras simples, manter duplas
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
WHERE q.ano = 2023
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.elementos) e
      WHERE e->>'tipo' IN ('texto', 'comando')
        AND e->>'conteudo' ~ '[^\n]\n[^\n]'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 2: EXTRAIR E FORMATAR FONTES COM <small>
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 2: FORMATAR FONTES COM <small> ═══' as etapa;

-- 2.1 Extrair campo "fonte" de dentro de elementos e converter para <small>
SELECT '→ 2.1 Extraindo campo "fonte" dos elementos...' as acao;

UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        CASE
            -- Se o elemento tem campo "fonte", adicionar como <small> no final do conteúdo
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
WHERE q.ano = 2023
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.elementos) e
      WHERE e->>'fonte' IS NOT NULL AND TRIM(e->>'fonte') != ''
  );

-- 2.2 Formatar fontes que estão misturadas no texto (padrão brasileiro de referência)
SELECT '→ 2.2 Formatando fontes misturadas no texto...' as acao;

UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        CASE
            WHEN e->>'tipo' = 'texto'
                 AND e->>'conteudo' NOT LIKE '%<small%'
                 AND (
                     e->>'conteudo' ~ '(Disponível em:|Acesso em:|Adaptado de|FONTE:|Fonte:)'
                     OR e->>'conteudo' ~ '\([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-Za-záàâãéêíóôõúç\s,\.]+,\s*\d{4}'
                 )
            THEN jsonb_set(
                e,
                '{conteudo}',
                to_jsonb(
                    -- Envolver referências bibliográficas com <small>
                    REGEXP_REPLACE(
                        e->>'conteudo',
                        E'(\n|\r\n|\r)?\\s*((Disponível em:.*|Acesso em:.*|Adaptado de.*|FONTE:.*|Fonte:.*|\\([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^)]+\\)))\\s*$',
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
        AND (
            e->>'conteudo' ~ '(Disponível em:|Acesso em:|Adaptado de|FONTE:|Fonte:)'
            OR e->>'conteudo' ~ '\([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-Za-záàâãéêíóôõúç\s,\.]+,\s*\d{4}'
        )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 3: CONVERTER FÓRMULAS QUÍMICAS PARA UNICODE
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 3: CONVERTER FÓRMULAS QUÍMICAS ═══' as etapa;

-- 3.1 Fórmulas no comando
SELECT '→ 3.1 Convertendo fórmulas químicas no comando...' as acao;

-- Lista expandida de fórmulas químicas comuns
UPDATE questoes_enem
SET comando =
    -- Compostos comuns (em ordem de tamanho para evitar substituições parciais)
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
        '\bCa\(OH\)2\b', 'Ca(OH)₂', 'g'),
        '\bMg\(OH\)2\b', 'Mg(OH)₂', 'g'),
        '\bAl\(OH\)3\b', 'Al(OH)₃', 'g'),
        '\bFe\(OH\)3\b', 'Fe(OH)₃', 'g'),
        '\bC6H12O6\b', 'C₆H₁₂O₆', 'g'),
        '\bC2H5OH\b', 'C₂H₅OH', 'g'),
        '\bCH3COOH\b', 'CH₃COOH', 'g'),
        '\bH2SO4\b', 'H₂SO₄', 'g'),
        '\bH2CO3\b', 'H₂CO₃', 'g'),
        '\bH3PO4\b', 'H₃PO₄', 'g'),
        '\bHNO3\b', 'HNO₃', 'g'),
        '\bCaCO3\b', 'CaCO₃', 'g'),
        '\bNa2CO3\b', 'Na₂CO₃', 'g'),
        '\bFe2O3\b', 'Fe₂O₃', 'g'),
        '\bAl2O3\b', 'Al₂O₃', 'g'),
        '\bMgCl2\b', 'MgCl₂', 'g'),
        '\bCaCl2\b', 'CaCl₂', 'g'),
        '\bC3H8\b', 'C₃H₈', 'g'),
        '\bC2H6\b', 'C₂H₆', 'g'),
        '\bC2H4\b', 'C₂H₄', 'g'),
        '\bC2H2\b', 'C₂H₂', 'g'),
        '\bH2O\b', 'H₂O', 'g'),
        '\bCO2\b', 'CO₂', 'g'),
        '\bSO2\b', 'SO₂', 'g'),
        '\bSO3\b', 'SO₃', 'g'),
        '\bNO2\b', 'NO₂', 'g'),
        '\bNH3\b', 'NH₃', 'g'),
        '\bCH4\b', 'CH₄', 'g'),
        '\bH2S\b', 'H₂S', 'g'),
        '\bO2\b', 'O₂', 'g'),
        '\bN2\b', 'N₂', 'g'),
        '\bH2\b', 'H₂', 'g'),
        '\bCl2\b', 'Cl₂', 'g')
WHERE ano = 2023
  AND comando ~ '\b(H2O|CO2|O2|N2|H2|CH4|NH3|H2S|SO2|SO3|NO2|C2H6|C2H4|C2H2|C3H8|H2SO4|H2CO3|H3PO4|HNO3|CaCO3|Na2CO3|Fe2O3|Al2O3|MgCl2|CaCl2|C6H12O6|C2H5OH|CH3COOH|Ca\(OH\)2|Mg\(OH\)2|Al\(OH\)3|Fe\(OH\)3|Cl2)\b';

-- 3.2 Fórmulas nos elementos
SELECT '→ 3.2 Convertendo fórmulas químicas nos elementos...' as acao;

UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        CASE
            WHEN e->>'conteudo' ~ '\b(H2O|CO2|O2|N2|H2|CH4|NH3|SO2|SO3|NO2|C2H6|C2H4|C3H8|H2SO4|CaCO3|Fe2O3|Cl2)\b'
            THEN jsonb_set(
                e,
                '{conteudo}',
                to_jsonb(
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
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(e->>'conteudo',
                        '\bH2SO4\b', 'H₂SO₄', 'g'),
                        '\bCaCO3\b', 'CaCO₃', 'g'),
                        '\bFe2O3\b', 'Fe₂O₃', 'g'),
                        '\bC3H8\b', 'C₃H₈', 'g'),
                        '\bC2H6\b', 'C₂H₆', 'g'),
                        '\bC2H4\b', 'C₂H₄', 'g'),
                        '\bH2O\b', 'H₂O', 'g'),
                        '\bCO2\b', 'CO₂', 'g'),
                        '\bSO2\b', 'SO₂', 'g'),
                        '\bSO3\b', 'SO₃', 'g'),
                        '\bNO2\b', 'NO₂', 'g'),
                        '\bNH3\b', 'NH₃', 'g'),
                        '\bCH4\b', 'CH₄', 'g'),
                        '\bO2\b', 'O₂', 'g'),
                        '\bN2\b', 'N₂', 'g'),
                        '\bH2\b', 'H₂', 'g'),
                        '\bCl2\b', 'Cl₂', 'g')
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
      WHERE e->>'conteudo' ~ '\b(H2O|CO2|O2|N2|H2|CH4|NH3|SO2|SO3|NO2|C2H6|C2H4|C3H8|H2SO4|CaCO3|Fe2O3|Cl2)\b'
  );

-- 3.3 Fórmulas nas alternativas
SELECT '→ 3.3 Convertendo fórmulas químicas nas alternativas...' as acao;

UPDATE questoes_enem
SET
    alt_a_texto = REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(
        alt_a_texto, '\bH2O\b', 'H₂O', 'g'), '\bCO2\b', 'CO₂', 'g'), '\bO2\b', 'O₂', 'g'), '\bN2\b', 'N₂', 'g'), '\bCH4\b', 'CH₄', 'g'), '\bNH3\b', 'NH₃', 'g'), '\bH2SO4\b', 'H₂SO₄', 'g'), '\bCaCO3\b', 'CaCO₃', 'g'),
    alt_b_texto = REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(
        alt_b_texto, '\bH2O\b', 'H₂O', 'g'), '\bCO2\b', 'CO₂', 'g'), '\bO2\b', 'O₂', 'g'), '\bN2\b', 'N₂', 'g'), '\bCH4\b', 'CH₄', 'g'), '\bNH3\b', 'NH₃', 'g'), '\bH2SO4\b', 'H₂SO₄', 'g'), '\bCaCO3\b', 'CaCO₃', 'g'),
    alt_c_texto = REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(
        alt_c_texto, '\bH2O\b', 'H₂O', 'g'), '\bCO2\b', 'CO₂', 'g'), '\bO2\b', 'O₂', 'g'), '\bN2\b', 'N₂', 'g'), '\bCH4\b', 'CH₄', 'g'), '\bNH3\b', 'NH₃', 'g'), '\bH2SO4\b', 'H₂SO₄', 'g'), '\bCaCO3\b', 'CaCO₃', 'g'),
    alt_d_texto = REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(
        alt_d_texto, '\bH2O\b', 'H₂O', 'g'), '\bCO2\b', 'CO₂', 'g'), '\bO2\b', 'O₂', 'g'), '\bN2\b', 'N₂', 'g'), '\bCH4\b', 'CH₄', 'g'), '\bNH3\b', 'NH₃', 'g'), '\bH2SO4\b', 'H₂SO₄', 'g'), '\bCaCO3\b', 'CaCO₃', 'g'),
    alt_e_texto = REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(
        alt_e_texto, '\bH2O\b', 'H₂O', 'g'), '\bCO2\b', 'CO₂', 'g'), '\bO2\b', 'O₂', 'g'), '\bN2\b', 'N₂', 'g'), '\bCH4\b', 'CH₄', 'g'), '\bNH3\b', 'NH₃', 'g'), '\bH2SO4\b', 'H₂SO₄', 'g'), '\bCaCO3\b', 'CaCO₃', 'g')
WHERE ano = 2023
  AND (
    alt_a_texto ~ '\b(H2O|CO2|O2|N2|CH4|NH3|H2SO4|CaCO3)\b'
    OR alt_b_texto ~ '\b(H2O|CO2|O2|N2|CH4|NH3|H2SO4|CaCO3)\b'
    OR alt_c_texto ~ '\b(H2O|CO2|O2|N2|CH4|NH3|H2SO4|CaCO3)\b'
    OR alt_d_texto ~ '\b(H2O|CO2|O2|N2|CH4|NH3|H2SO4|CaCO3)\b'
    OR alt_e_texto ~ '\b(H2O|CO2|O2|N2|CH4|NH3|H2SO4|CaCO3)\b'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 4: CONVERTER NOTAÇÃO CIENTÍFICA E EXPOENTES PARA UNICODE
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 4: CONVERTER NOTAÇÃO CIENTÍFICA ═══' as etapa;

-- 4.1 Converter expoentes positivos no comando
SELECT '→ 4.1 Convertendo expoentes no comando...' as acao;

UPDATE questoes_enem
SET comando =
    -- Expoentes negativos (fazer primeiro para evitar conflito)
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
    -- Converter x para × em multiplicação científica
    REGEXP_REPLACE(comando,
        '(\d)\s*x\s*(10)', '\1 × \2', 'gi'),
        '\^0(?![0-9])', '⁰', 'g'),
        '\^1(?![0-9])', '¹', 'g'),
        '\^2(?![0-9])', '²', 'g'),
        '\^3(?![0-9])', '³', 'g'),
        '\^4(?![0-9])', '⁴', 'g'),
        '\^5(?![0-9])', '⁵', 'g'),
        '\^6(?![0-9])', '⁶', 'g'),
        '\^7(?![0-9])', '⁷', 'g'),
        '\^8(?![0-9])', '⁸', 'g'),
        '\^9(?![0-9])', '⁹', 'g'),
        '\^-1(?![0-9])', '⁻¹', 'g'),
        '\^-2(?![0-9])', '⁻²', 'g'),
        '\^-3(?![0-9])', '⁻³', 'g'),
        '\^-4(?![0-9])', '⁻⁴', 'g'),
        '\^-5(?![0-9])', '⁻⁵', 'g'),
        '\^-6(?![0-9])', '⁻⁶', 'g'),
        '\^-7(?![0-9])', '⁻⁷', 'g'),
        '\^-8(?![0-9])', '⁻⁸', 'g'),
        '\^-9(?![0-9])', '⁻⁹', 'g')
WHERE ano = 2023
  AND (comando ~ '\^[+-]?\d' OR comando ~ '\d\s*x\s*10');

-- 4.2 Converter expoentes nos elementos
SELECT '→ 4.2 Convertendo expoentes nos elementos...' as acao;

UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        CASE
            WHEN e->>'conteudo' ~ '\^[+-]?\d'
            THEN jsonb_set(
                e,
                '{conteudo}',
                to_jsonb(
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
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(
                    REGEXP_REPLACE(e->>'conteudo',
                        '\^0(?![0-9])', '⁰', 'g'),
                        '\^1(?![0-9])', '¹', 'g'),
                        '\^2(?![0-9])', '²', 'g'),
                        '\^3(?![0-9])', '³', 'g'),
                        '\^4(?![0-9])', '⁴', 'g'),
                        '\^5(?![0-9])', '⁵', 'g'),
                        '\^6(?![0-9])', '⁶', 'g'),
                        '\^7(?![0-9])', '⁷', 'g'),
                        '\^8(?![0-9])', '⁸', 'g'),
                        '\^9(?![0-9])', '⁹', 'g'),
                        '\^-1(?![0-9])', '⁻¹', 'g'),
                        '\^-2(?![0-9])', '⁻²', 'g'),
                        '\^-3(?![0-9])', '⁻³', 'g'),
                        '\^-4(?![0-9])', '⁻⁴', 'g'),
                        '\^-5(?![0-9])', '⁻⁵', 'g'),
                        '\^-6(?![0-9])', '⁻⁶', 'g'),
                        '\^-7(?![0-9])', '⁻⁷', 'g'),
                        '\^-8(?![0-9])', '⁻⁸', 'g'),
                        '\^-9(?![0-9])', '⁻⁹', 'g')
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
      WHERE e->>'conteudo' ~ '\^[+-]?\d'
  );

-- 4.3 Converter unidades de medida comuns (m², km², cm², etc.)
SELECT '→ 4.3 Convertendo unidades de medida...' as acao;

UPDATE questoes_enem
SET comando =
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(
    REGEXP_REPLACE(comando,
        '\bm2\b', 'm²', 'g'),
        '\bkm2\b', 'km²', 'g'),
        '\bcm2\b', 'cm²', 'g'),
        '\bmm2\b', 'mm²', 'g'),
        '\bm3\b', 'm³', 'g'),
        '\bcm3\b', 'cm³', 'g')
WHERE ano = 2023
  AND comando ~ '\b(m2|km2|cm2|mm2|m3|cm3)\b';

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 5: PADRONIZAÇÃO DE METADADOS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 5: PADRONIZAÇÃO DE METADADOS ═══' as etapa;

-- 5.1 Padronizar nomes das áreas
SELECT '→ 5.1 Padronizando nomes das áreas...' as acao;

UPDATE questoes_enem
SET area = CASE
    WHEN LOWER(area) LIKE '%linguag%' OR LOWER(area) LIKE '%código%' OR area ILIKE '%LC%'
        THEN 'Linguagens, Códigos e suas Tecnologias'
    WHEN LOWER(area) LIKE '%human%' OR area ILIKE '%CH%'
        THEN 'Ciências Humanas e suas Tecnologias'
    WHEN LOWER(area) LIKE '%natureza%' OR area ILIKE '%CN%'
        THEN 'Ciências da Natureza e suas Tecnologias'
    WHEN LOWER(area) LIKE '%matemát%' OR area ILIKE '%MT%'
        THEN 'Matemática e suas Tecnologias'
    ELSE area
END
WHERE ano = 2023
  AND area NOT IN (
    'Linguagens, Códigos e suas Tecnologias',
    'Ciências Humanas e suas Tecnologias',
    'Ciências da Natureza e suas Tecnologias',
    'Matemática e suas Tecnologias'
  );

-- 5.2 Definir DIA correto baseado na área
SELECT '→ 5.2 Definindo dias corretos...' as acao;

UPDATE questoes_enem
SET dia = CASE
    WHEN area IN ('Linguagens, Códigos e suas Tecnologias', 'Ciências Humanas e suas Tecnologias')
        THEN 1
    WHEN area IN ('Ciências da Natureza e suas Tecnologias', 'Matemática e suas Tecnologias')
        THEN 2
    ELSE dia
END
WHERE ano = 2023
  AND (dia IS NULL OR dia NOT IN (1, 2));

-- 5.3 Definir caderno padrão (Azul) se ausente
SELECT '→ 5.3 Definindo caderno padrão...' as acao;

UPDATE questoes_enem
SET caderno = 'Azul'
WHERE ano = 2023
  AND (caderno IS NULL OR TRIM(caderno) = '');

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 6: ATUALIZAÇÃO DE FLAGS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 6: ATUALIZAÇÃO DE FLAGS ═══' as etapa;

-- 6.1 Flag tem_imagem
SELECT '→ 6.1 Atualizando flag tem_imagem...' as acao;

UPDATE questoes_enem q
SET tem_imagem = true
WHERE q.ano = 2023
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

-- 6.2 Flag tem_imagem_alternativa
SELECT '→ 6.2 Atualizando flag tem_imagem_alternativa...' as acao;

UPDATE questoes_enem
SET tem_imagem_alternativa = true
WHERE ano = 2023
  AND tem_imagem_alternativa = false
  AND (
    (alt_a_imagem IS NOT NULL AND TRIM(alt_a_imagem) NOT IN ('', 'nan', 'null', 'none', 'undefined'))
    OR (alt_b_imagem IS NOT NULL AND TRIM(alt_b_imagem) NOT IN ('', 'nan', 'null', 'none', 'undefined'))
    OR (alt_c_imagem IS NOT NULL AND TRIM(alt_c_imagem) NOT IN ('', 'nan', 'null', 'none', 'undefined'))
    OR (alt_d_imagem IS NOT NULL AND TRIM(alt_d_imagem) NOT IN ('', 'nan', 'null', 'none', 'undefined'))
    OR (alt_e_imagem IS NOT NULL AND TRIM(alt_e_imagem) NOT IN ('', 'nan', 'null', 'none', 'undefined'))
  );

-- 6.3 Flag tem_formula (após conversões Unicode)
SELECT '→ 6.3 Atualizando flag tem_formula...' as acao;

UPDATE questoes_enem q
SET tem_formula = true
WHERE q.ano = 2023
  AND q.tem_formula = false
  AND (
    -- Fórmulas Unicode já formatadas
    q.comando ~ '[²³⁴⁵⁶⁷⁸⁹⁰¹₀₁₂₃₄₅₆₇₈₉⁺⁻±×÷≤≥≠≈∞∆Δπ→⇌]'
    -- Fórmulas químicas formatadas
    OR q.comando ~ '[A-Z][a-z]?[₂₃₄₅₆₇₈₉]'
    -- Notação científica
    OR q.comando ~ '\d\s*×\s*10'
    -- Nos elementos
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '[²³⁴⁵⁶⁷⁸⁹⁰¹₀₁₂₃₄₅₆₇₈₉±×÷≤≥≠≈∞∆Δπ→⇌]'
           OR e->>'conteudo' ~ '[A-Z][a-z]?[₂₃₄₅₆₇₈₉]'
           OR e->>'conteudo' ~ '\d\s*×\s*10'
    )
    -- Nas alternativas
    OR alt_a_texto ~ '[²³⁴⁵⁶⁷⁸⁹⁰¹₀₁₂₃₄₅₆₇₈₉±×÷≤≥≠≈∞∆Δπ→⇌]'
    OR alt_b_texto ~ '[²³⁴⁵⁶⁷⁸⁹⁰¹₀₁₂₃₄₅₆₇₈₉±×÷≤≥≠≈∞∆Δπ→⇌]'
    OR alt_c_texto ~ '[²³⁴⁵⁶⁷⁸⁹⁰¹₀₁₂₃₄₅₆₇₈₉±×÷≤≥≠≈∞∆Δπ→⇌]'
    OR alt_d_texto ~ '[²³⁴⁵⁶⁷⁸⁹⁰¹₀₁₂₃₄₅₆₇₈₉±×÷≤≥≠≈∞∆Δπ→⇌]'
    OR alt_e_texto ~ '[²³⁴⁵⁶⁷⁸⁹⁰¹₀₁₂₃₄₅₆₇₈₉±×÷≤≥≠≈∞∆Δπ→⇌]'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 7: LIMPEZA DE DADOS INVÁLIDOS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 7: LIMPEZA DE DADOS INVÁLIDOS ═══' as etapa;

-- 7.1 Limpar URLs de imagem inválidas
SELECT '→ 7.1 Limpando URLs de imagem inválidas...' as acao;

UPDATE questoes_enem
SET
    alt_a_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_a_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_a_imagem END,
    alt_b_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_b_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_b_imagem END,
    alt_c_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_c_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_c_imagem END,
    alt_d_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_d_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_d_imagem END,
    alt_e_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_e_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_e_imagem END
WHERE ano = 2023;

-- 7.2 Remover prefixos redundantes das alternativas
SELECT '→ 7.2 Removendo prefixos redundantes das alternativas...' as acao;

UPDATE questoes_enem
SET
    alt_a_texto = CASE WHEN alt_a_texto ~ '^[Aa][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_a_texto, '^[Aa][\.\)\-]\s*', '')) ELSE alt_a_texto END,
    alt_b_texto = CASE WHEN alt_b_texto ~ '^[Bb][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_b_texto, '^[Bb][\.\)\-]\s*', '')) ELSE alt_b_texto END,
    alt_c_texto = CASE WHEN alt_c_texto ~ '^[Cc][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_c_texto, '^[Cc][\.\)\-]\s*', '')) ELSE alt_c_texto END,
    alt_d_texto = CASE WHEN alt_d_texto ~ '^[Dd][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_d_texto, '^[Dd][\.\)\-]\s*', '')) ELSE alt_d_texto END,
    alt_e_texto = CASE WHEN alt_e_texto ~ '^[Ee][\.\)\-]\s*' THEN TRIM(REGEXP_REPLACE(alt_e_texto, '^[Ee][\.\)\-]\s*', '')) ELSE alt_e_texto END
WHERE ano = 2023
  AND (
    alt_a_texto ~ '^[Aa][\.\)\-]'
    OR alt_b_texto ~ '^[Bb][\.\)\-]'
    OR alt_c_texto ~ '^[Cc][\.\)\-]'
    OR alt_d_texto ~ '^[Dd][\.\)\-]'
    OR alt_e_texto ~ '^[Ee][\.\)\-]'
  );

-- 7.3 Recalcular flag tem_imagem_alternativa após limpeza
SELECT '→ 7.3 Recalculando flag tem_imagem_alternativa...' as acao;

UPDATE questoes_enem
SET tem_imagem_alternativa = (
    (alt_a_imagem IS NOT NULL AND TRIM(alt_a_imagem) != '')
    OR (alt_b_imagem IS NOT NULL AND TRIM(alt_b_imagem) != '')
    OR (alt_c_imagem IS NOT NULL AND TRIM(alt_c_imagem) != '')
    OR (alt_d_imagem IS NOT NULL AND TRIM(alt_d_imagem) != '')
    OR (alt_e_imagem IS NOT NULL AND TRIM(alt_e_imagem) != '')
)
WHERE ano = 2023;

-- 7.4 Limpar espaços extras e normalizar texto
SELECT '→ 7.4 Normalizando espaços no comando...' as acao;

UPDATE questoes_enem
SET comando = TRIM(REGEXP_REPLACE(comando, '\s{2,}', ' ', 'g'))
WHERE ano = 2023
  AND comando ~ '\s{2,}';

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 8: GARANTIR INTEGRIDADE
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 8: INTEGRIDADE DOS DADOS ═══' as etapa;

-- 8.1 Garantir que todas têm pelo menos 1 elemento
SELECT '→ 8.1 Criando elementos para questões sem elementos...' as acao;

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

-- 8.2 Atualizar timestamp de modificação
SELECT '→ 8.2 Atualizando timestamp...' as acao;

UPDATE questoes_enem
SET updated_at = NOW()
WHERE ano = 2023;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ VERIFICAÇÃO FINAL ═══' as etapa;

SELECT
    metrica,
    valor,
    CASE
        WHEN metrica LIKE '%Total%' THEN valor::text
        WHEN valor = (SELECT COUNT(*) FROM questoes_enem WHERE ano = 2023) THEN '100%'
        ELSE ROUND((valor::numeric / NULLIF((SELECT COUNT(*) FROM questoes_enem WHERE ano = 2023), 0)) * 100, 1)::text || '%'
    END as percentual
FROM (
    SELECT 'Total questões 2023' as metrica, COUNT(*) as valor FROM questoes_enem WHERE ano = 2023
    UNION ALL
    SELECT 'Com elementos' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2023 AND elementos IS NOT NULL AND jsonb_array_length(elementos) > 0
    UNION ALL
    SELECT 'Com comando' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2023 AND comando IS NOT NULL AND TRIM(comando) != ''
    UNION ALL
    SELECT 'Com gabarito' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2023 AND gabarito IS NOT NULL
    UNION ALL
    SELECT 'Com todas alternativas' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2023
        AND alt_a_texto IS NOT NULL AND alt_b_texto IS NOT NULL AND alt_c_texto IS NOT NULL AND alt_d_texto IS NOT NULL AND alt_e_texto IS NOT NULL
    UNION ALL
    SELECT 'Com dia definido' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2023 AND dia IS NOT NULL
    UNION ALL
    SELECT 'Com área padronizada' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2023 AND area IN (
        'Linguagens, Códigos e suas Tecnologias', 'Ciências Humanas e suas Tecnologias',
        'Ciências da Natureza e suas Tecnologias', 'Matemática e suas Tecnologias'
    )
    UNION ALL
    SELECT 'Com flag tem_imagem' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2023 AND tem_imagem = true
    UNION ALL
    SELECT 'Com flag tem_formula' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2023 AND tem_formula = true
    UNION ALL
    SELECT 'Com fontes formatadas (<small>)' as metrica, COUNT(DISTINCT q.id) FROM questoes_enem q, jsonb_array_elements(q.elementos) e WHERE q.ano = 2023 AND e->>'conteudo' LIKE '%<small%'
    UNION ALL
    SELECT 'Com fórmulas Unicode (₂₃)' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2023 AND (comando ~ '[₀₁₂₃₄₅₆₇₈₉]' OR comando ~ '[²³⁴⁵⁶⁷⁸⁹]')
) stats
ORDER BY
    CASE metrica
        WHEN 'Total questões 2023' THEN 1
        WHEN 'Com elementos' THEN 2
        WHEN 'Com comando' THEN 3
        WHEN 'Com gabarito' THEN 4
        WHEN 'Com todas alternativas' THEN 5
        WHEN 'Com dia definido' THEN 6
        WHEN 'Com área padronizada' THEN 7
        WHEN 'Com flag tem_imagem' THEN 8
        WHEN 'Com flag tem_formula' THEN 9
        WHEN 'Com fontes formatadas (<small>)' THEN 10
        WHEN 'Com fórmulas Unicode (₂₃)' THEN 11
    END;

-- Comparação final com 2024/2025
SELECT '═══ COMPARAÇÃO COM 2024/2025 ═══' as etapa;

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
WHERE ano IN (2023, 2024, 2025)
GROUP BY ano
ORDER BY ano;

-- Verificar se ainda há problemas residuais
SELECT '═══ PROBLEMAS RESIDUAIS ═══' as etapa;

SELECT
    'Fórmulas químicas não convertidas (H2O, CO2, etc.)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2023
  AND (
    comando ~ '\b(H2O|CO2|O2|N2|CH4)\b'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(elementos) e
        WHERE e->>'conteudo' ~ '\b(H2O|CO2|O2|N2|CH4)\b'
    )
  )
UNION ALL
SELECT
    'Expoentes não convertidos (^2, ^3, etc.)' as problema,
    COUNT(*) as quantidade
FROM questoes_enem
WHERE ano = 2023
  AND (
    comando ~ '\^[0-9]'
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(elementos) e
        WHERE e->>'conteudo' ~ '\^[0-9]'
    )
  )
UNION ALL
SELECT
    'Fontes sem tag <small>' as problema,
    COUNT(DISTINCT q.id) as quantidade
FROM questoes_enem q
WHERE q.ano = 2023
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.elementos) e
      WHERE e->>'tipo' = 'texto'
        AND e->>'conteudo' NOT LIKE '%<small%'
        AND (
            e->>'conteudo' ~ '(Disponível em:|Acesso em:|Adaptado de)'
        )
  );

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  CORREÇÕES ENEM 2023 V2.0 APLICADAS COM SUCESSO!';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '  Correções aplicadas:';
    RAISE NOTICE '    ✓ Quebras de linha artificiais removidas';
    RAISE NOTICE '    ✓ Fontes formatadas com tag <small>';
    RAISE NOTICE '    ✓ Fórmulas químicas convertidas (H₂O, CO₂, etc.)';
    RAISE NOTICE '    ✓ Notação científica convertida (10⁵, m², etc.)';
    RAISE NOTICE '    ✓ Flags atualizadas (tem_formula, tem_imagem)';
    RAISE NOTICE '    ✓ Metadados padronizados (área, dia, caderno)';
    RAISE NOTICE '';
    RAISE NOTICE '  Backup disponível em: questoes_enem_2023_backup_v2';
    RAISE NOTICE '';
    RAISE NOTICE '  Para reverter todas as alterações:';
    RAISE NOTICE '    DELETE FROM questoes_enem WHERE ano = 2023;';
    RAISE NOTICE '    INSERT INTO questoes_enem SELECT * FROM questoes_enem_2023_backup_v2;';
    RAISE NOTICE '';
    RAISE NOTICE '  As questões de 2023 agora seguem o mesmo padrão de 2024/2025';
    RAISE NOTICE '';
END $$;
