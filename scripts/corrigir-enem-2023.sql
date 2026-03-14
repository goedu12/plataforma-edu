-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO COMPLETA: QUESTÕES ENEM 2023
-- Padronizar para o formato de 2024/2025
-- Execute no Supabase SQL Editor APÓS rodar o diagnóstico
-- Data: 2026-03-14
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 0: BACKUP
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS questoes_enem_2023_backup;
CREATE TABLE questoes_enem_2023_backup AS
SELECT * FROM questoes_enem WHERE ano = 2023;

SELECT 'Backup criado com ' || COUNT(*) || ' questões de 2023' as status
FROM questoes_enem_2023_backup;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 1: PADRONIZAÇÃO DE METADADOS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 1: PADRONIZAÇÃO DE METADADOS ═══' as etapa;

-- 1.1 Padronizar nomes das áreas
SELECT '→ 1.1 Padronizando nomes das áreas...' as acao;

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

-- 1.2 Definir DIA correto baseado na área
-- ENEM: Dia 1 = Linguagens + Humanas, Dia 2 = Natureza + Matemática
SELECT '→ 1.2 Definindo dias corretos...' as acao;

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

-- 1.3 Definir caderno padrão (Azul) se ausente
SELECT '→ 1.3 Definindo caderno padrão...' as acao;

UPDATE questoes_enem
SET caderno = 'Azul'
WHERE ano = 2023
  AND (caderno IS NULL OR TRIM(caderno) = '');

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 2: ATUALIZAÇÃO DE FLAGS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 2: ATUALIZAÇÃO DE FLAGS ═══' as etapa;

-- 2.1 Flag tem_imagem
SELECT '→ 2.1 Atualizando flag tem_imagem...' as acao;

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

-- 2.2 Flag tem_imagem_alternativa
SELECT '→ 2.2 Atualizando flag tem_imagem_alternativa...' as acao;

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

-- 2.3 Flag tem_formula
SELECT '→ 2.3 Atualizando flag tem_formula...' as acao;

UPDATE questoes_enem q
SET tem_formula = true
WHERE q.ano = 2023
  AND q.tem_formula = false
  AND (
    -- Fórmulas Unicode já formatadas
    q.comando ~ '[²³⁴⁵⁶⁷⁸⁹⁰₀₁₂₃₄₅₆₇₈₉⁺⁻±×÷≤≥≠≈∞∆Δπ→⇌]'
    -- Expoentes com ^
    OR q.comando ~ '\^[+-]?\d+'
    -- Frações TeX
    OR q.comando ~ '\\frac|\\sqrt|\\sum|\\int'
    -- Fórmulas químicas comuns
    OR q.comando ~ '\b(H2O|CO2|O2|N2|H2|CH4|H2SO4|NaOH|HCl|NaCl|CaCO3|NH3|Fe2O3)\b'
    OR q.comando ~ '[A-Z][a-z]?[₂₃₄₅₆₇₈₉]'
    -- Notação científica
    OR q.comando ~ '\d\s*[×x]\s*10'
    -- Nos elementos
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '[²³⁴⁵⁶⁷⁸⁹⁰₀₁₂₃₄₅₆₇₈₉±×÷≤≥≠≈∞∆Δπ→⇌]'
           OR e->>'conteudo' ~ '\^[+-]?\d+'
           OR e->>'conteudo' ~ '\b(H2O|CO2|O2|N2|H2|CH4|H2SO4|NaOH|HCl|NaCl)\b'
           OR e->>'conteudo' ~ '\d\s*[×x]\s*10'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 3: FORMATAÇÃO DE FÓRMULAS QUÍMICAS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 3: FORMATAÇÃO DE FÓRMULAS ═══' as etapa;

-- 3.1 Fórmulas no comando
SELECT '→ 3.1 Formatando fórmulas no comando...' as acao;

UPDATE questoes_enem
SET comando =
    -- Fórmulas químicas comuns
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
        '\bH2O\b', 'H₂O', 'g'),
        '\bCO2\b', 'CO₂', 'g'),
        '\bO2\b', 'O₂', 'g'),
        '\bN2\b', 'N₂', 'g'),
        '\bH2\b', 'H₂', 'g'),
        '\bCH4\b', 'CH₄', 'g'),
        '\bNH3\b', 'NH₃', 'g'),
        '\bH2S\b', 'H₂S', 'g'),
        '\bSO2\b', 'SO₂', 'g'),
        '\bSO3\b', 'SO₃', 'g'),
        '\bNO2\b', 'NO₂', 'g'),
        '\bC2H6\b', 'C₂H₆', 'g'),
        '\bC2H4\b', 'C₂H₄', 'g'),
        '\bC3H8\b', 'C₃H₈', 'g'),
        '\bH2SO4\b', 'H₂SO₄', 'g'),
        '\bH2CO3\b', 'H₂CO₃', 'g'),
        '\bH3PO4\b', 'H₃PO₄', 'g'),
        '\bCaCO3\b', 'CaCO₃', 'g'),
        '\bFe2O3\b', 'Fe₂O₃', 'g'),
        '\bAl2O3\b', 'Al₂O₃', 'g')
WHERE ano = 2023
  AND comando ~ '\b(H2O|CO2|O2|N2|H2|CH4|NH3|H2S|SO2|SO3|NO2|C2H6|C2H4|C3H8|H2SO4|H2CO3|H3PO4|CaCO3|Fe2O3|Al2O3)\b';

-- 3.2 Fórmulas nas alternativas
SELECT '→ 3.2 Formatando fórmulas nas alternativas...' as acao;

UPDATE questoes_enem
SET
    alt_a_texto = REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(
        alt_a_texto, '\bH2O\b', 'H₂O', 'g'), '\bCO2\b', 'CO₂', 'g'), '\bO2\b', 'O₂', 'g'), '\bN2\b', 'N₂', 'g'), '\bCH4\b', 'CH₄', 'g'),
    alt_b_texto = REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(
        alt_b_texto, '\bH2O\b', 'H₂O', 'g'), '\bCO2\b', 'CO₂', 'g'), '\bO2\b', 'O₂', 'g'), '\bN2\b', 'N₂', 'g'), '\bCH4\b', 'CH₄', 'g'),
    alt_c_texto = REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(
        alt_c_texto, '\bH2O\b', 'H₂O', 'g'), '\bCO2\b', 'CO₂', 'g'), '\bO2\b', 'O₂', 'g'), '\bN2\b', 'N₂', 'g'), '\bCH4\b', 'CH₄', 'g'),
    alt_d_texto = REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(
        alt_d_texto, '\bH2O\b', 'H₂O', 'g'), '\bCO2\b', 'CO₂', 'g'), '\bO2\b', 'O₂', 'g'), '\bN2\b', 'N₂', 'g'), '\bCH4\b', 'CH₄', 'g'),
    alt_e_texto = REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(REGEXP_REPLACE(
        alt_e_texto, '\bH2O\b', 'H₂O', 'g'), '\bCO2\b', 'CO₂', 'g'), '\bO2\b', 'O₂', 'g'), '\bN2\b', 'N₂', 'g'), '\bCH4\b', 'CH₄', 'g')
WHERE ano = 2023
  AND (
    alt_a_texto ~ '\b(H2O|CO2|O2|N2|CH4)\b'
    OR alt_b_texto ~ '\b(H2O|CO2|O2|N2|CH4)\b'
    OR alt_c_texto ~ '\b(H2O|CO2|O2|N2|CH4)\b'
    OR alt_d_texto ~ '\b(H2O|CO2|O2|N2|CH4)\b'
    OR alt_e_texto ~ '\b(H2O|CO2|O2|N2|CH4)\b'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 4: FORMATAÇÃO DE NOTAÇÃO CIENTÍFICA
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 4: NOTAÇÃO CIENTÍFICA ═══' as etapa;

-- 4.1 Converter expoentes ^N para Unicode no comando
SELECT '→ 4.1 Convertendo expoentes no comando...' as acao;

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
        '\^0\b', '⁰', 'g'),
        '\^1\b', '¹', 'g'),
        '\^2\b', '²', 'g'),
        '\^3\b', '³', 'g'),
        '\^4\b', '⁴', 'g'),
        '\^5\b', '⁵', 'g'),
        '\^6\b', '⁶', 'g'),
        '\^7\b', '⁷', 'g'),
        '\^8\b', '⁸', 'g'),
        '\^9\b', '⁹', 'g'),
        '\^-1\b', '⁻¹', 'g'),
        '\^-2\b', '⁻²', 'g'),
        '\^-3\b', '⁻³', 'g'),
        '\^-4\b', '⁻⁴', 'g'),
        '\^-5\b', '⁻⁵', 'g'),
        '\^-6\b', '⁻⁶', 'g'),
        '\^-7\b', '⁻⁷', 'g'),
        '\^-8\b', '⁻⁸', 'g'),
        '\^-9\b', '⁻⁹', 'g'),
        -- x → × para multiplicação
        '(\d)\s*x\s*(10)', '\1×\2', 'gi')
WHERE ano = 2023
  AND comando ~ '\^[+-]?\d+|\dx\s*10';

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 5: SEPARAÇÃO DE FONTES
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 5: SEPARAÇÃO DE FONTES ═══' as etapa;

-- 5.1 Adicionar tag <small> para fontes em elementos de texto
SELECT '→ 5.1 Formatando fontes com tag <small>...' as acao;

-- Atualizar elementos com fonte misturada no texto
UPDATE questoes_enem q
SET elementos = (
    SELECT jsonb_agg(
        CASE
            WHEN e->>'tipo' = 'texto' AND e->>'conteudo' NOT LIKE '%<small%'
                 AND (
                     e->>'conteudo' ~ '\n\s*(Disponível em:|Acesso em:|Adaptado de|FONTE:|Fonte:)'
                     OR e->>'conteudo' ~ '\n\s*\(?[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s,\.]+\.\s+[^\.]+\.\s*\d{4}'
                 )
            THEN jsonb_set(
                e,
                '{conteudo}',
                to_jsonb(
                    -- Separar texto principal da fonte com tag <small>
                    REGEXP_REPLACE(
                        e->>'conteudo',
                        '\n\s*((Disponível em:.*|Acesso em:.*|Adaptado de.*|FONTE:.*|Fonte:.*|\(?[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s,\.]+\.\s+[^\.]+\.\s*\d{4}.*))$',
                        E'\n\n<small>\\1</small>',
                        'gi'
                    )
                )
            )
            ELSE e
        END
    )
    FROM jsonb_array_elements(q.elementos) e
)
WHERE q.ano = 2023
  AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(q.elementos) e
      WHERE e->>'tipo' = 'texto'
        AND e->>'conteudo' NOT LIKE '%<small%'
        AND (
            e->>'conteudo' ~ '\n\s*(Disponível em:|Acesso em:|Adaptado de|FONTE:|Fonte:)'
            OR e->>'conteudo' ~ '\n\s*\(?[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s,\.]+\.\s+[^\.]+\.\s*\d{4}'
        )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 6: LIMPEZA DE DADOS INVÁLIDOS
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 6: LIMPEZA DE DADOS ═══' as etapa;

-- 6.1 Limpar URLs de imagem inválidas
SELECT '→ 6.1 Limpando URLs de imagem inválidas...' as acao;

UPDATE questoes_enem
SET
    alt_a_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_a_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_a_imagem END,
    alt_b_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_b_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_b_imagem END,
    alt_c_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_c_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_c_imagem END,
    alt_d_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_d_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_d_imagem END,
    alt_e_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_e_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_e_imagem END
WHERE ano = 2023;

-- 6.2 Remover prefixos redundantes das alternativas (A), B), etc.)
SELECT '→ 6.2 Removendo prefixos redundantes das alternativas...' as acao;

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

-- 6.3 Atualizar flag tem_imagem_alternativa após limpeza
SELECT '→ 6.3 Recalculando flag tem_imagem_alternativa...' as acao;

UPDATE questoes_enem
SET tem_imagem_alternativa = (
    (alt_a_imagem IS NOT NULL AND TRIM(alt_a_imagem) != '')
    OR (alt_b_imagem IS NOT NULL AND TRIM(alt_b_imagem) != '')
    OR (alt_c_imagem IS NOT NULL AND TRIM(alt_c_imagem) != '')
    OR (alt_d_imagem IS NOT NULL AND TRIM(alt_d_imagem) != '')
    OR (alt_e_imagem IS NOT NULL AND TRIM(alt_e_imagem) != '')
)
WHERE ano = 2023;

-- ═══════════════════════════════════════════════════════════════════════════════
-- FASE 7: GARANTIR INTEGRIDADE
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ FASE 7: INTEGRIDADE DOS DADOS ═══' as etapa;

-- 7.1 Garantir que todas têm pelo menos 1 elemento
SELECT '→ 7.1 Criando elementos para questões sem elementos...' as acao;

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

-- 7.2 Atualizar timestamp de modificação
SELECT '→ 7.2 Atualizando timestamp...' as acao;

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
        ELSE ROUND((valor::numeric / (SELECT COUNT(*) FROM questoes_enem WHERE ano = 2023)) * 100, 1)::text || '%'
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
    SELECT 'Com flag tem_imagem correta' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2023 AND tem_imagem = true
    UNION ALL
    SELECT 'Com flag tem_formula correta' as metrica, COUNT(*) FROM questoes_enem WHERE ano = 2023 AND tem_formula = true
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
        WHEN 'Com flag tem_imagem correta' THEN 8
        WHEN 'Com flag tem_formula correta' THEN 9
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

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  CORREÇÕES ENEM 2023 APLICADAS COM SUCESSO!';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '  Backup disponível em: questoes_enem_2023_backup';
    RAISE NOTICE '';
    RAISE NOTICE '  Para reverter todas as alterações:';
    RAISE NOTICE '    DELETE FROM questoes_enem WHERE ano = 2023;';
    RAISE NOTICE '    INSERT INTO questoes_enem SELECT * FROM questoes_enem_2023_backup;';
    RAISE NOTICE '';
    RAISE NOTICE '  As questões de 2023 agora seguem o mesmo padrão de 2024/2025';
    RAISE NOTICE '';
END $$;
