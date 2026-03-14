-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO: QUESTÕES ENEM 2013
-- Padronizar para o formato de 2024/2025
-- Execute no Supabase SQL Editor APÓS rodar o diagnóstico
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- BACKUP: Criar tabela de backup antes de qualquer alteração
-- ═══════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS questoes_enem_2013_backup;
CREATE TABLE questoes_enem_2013_backup AS
SELECT * FROM questoes_enem WHERE ano = 2013;

SELECT 'Backup criado com ' || COUNT(*) || ' questões' as status
FROM questoes_enem_2013_backup;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO 1: Padronizar nomes das áreas
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ CORREÇÃO 1: Padronizando áreas ═══' as etapa;

-- Verificar áreas atuais
SELECT DISTINCT area, COUNT(*) as qtd
FROM questoes_enem WHERE ano = 2013
GROUP BY area;

-- Corrigir áreas para o formato padrão
UPDATE questoes_enem
SET area = CASE
    WHEN LOWER(area) LIKE '%linguag%' OR LOWER(area) LIKE '%código%' OR LOWER(area) LIKE '%lc%'
        THEN 'Linguagens, Códigos e suas Tecnologias'
    WHEN LOWER(area) LIKE '%human%' OR LOWER(area) LIKE '%ch%'
        THEN 'Ciências Humanas e suas Tecnologias'
    WHEN LOWER(area) LIKE '%natureza%' OR LOWER(area) LIKE '%cn%'
        THEN 'Ciências da Natureza e suas Tecnologias'
    WHEN LOWER(area) LIKE '%matemát%' OR LOWER(area) LIKE '%mt%'
        THEN 'Matemática e suas Tecnologias'
    ELSE area
END
WHERE ano = 2013
  AND area NOT IN (
    'Linguagens, Códigos e suas Tecnologias',
    'Ciências Humanas e suas Tecnologias',
    'Ciências da Natureza e suas Tecnologias',
    'Matemática e suas Tecnologias'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO 2: Definir DIA correto baseado na área
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ CORREÇÃO 2: Definindo dias ═══' as etapa;

-- Dia 1: Linguagens + Ciências Humanas
-- Dia 2: Ciências da Natureza + Matemática
UPDATE questoes_enem
SET dia = CASE
    WHEN area IN ('Linguagens, Códigos e suas Tecnologias', 'Ciências Humanas e suas Tecnologias')
        THEN 1
    WHEN area IN ('Ciências da Natureza e suas Tecnologias', 'Matemática e suas Tecnologias')
        THEN 2
    ELSE dia
END
WHERE ano = 2013
  AND (dia IS NULL OR dia NOT IN (1, 2));

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO 3: Atualizar flag tem_imagem
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ CORREÇÃO 3: Atualizando flag tem_imagem ═══' as etapa;

-- Marcar tem_imagem = true se houver elemento do tipo 'imagem'
UPDATE questoes_enem q
SET tem_imagem = true
WHERE q.ano = 2013
  AND q.tem_imagem = false
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(q.elementos) e
    WHERE e->>'tipo' = 'imagem'
      AND e->>'arquivo' IS NOT NULL
      AND TRIM(e->>'arquivo') != ''
  );

-- Verificar também por URLs de imagem nos elementos
UPDATE questoes_enem q
SET tem_imagem = true
WHERE q.ano = 2013
  AND q.tem_imagem = false
  AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(q.elementos) e
    WHERE e->>'conteudo' LIKE '%<img%'
       OR e->>'conteudo' LIKE '%![%](%'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO 4: Atualizar flag tem_imagem_alternativa
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ CORREÇÃO 4: Atualizando flag tem_imagem_alternativa ═══' as etapa;

UPDATE questoes_enem
SET tem_imagem_alternativa = true
WHERE ano = 2013
  AND tem_imagem_alternativa = false
  AND (
    (alt_a_imagem IS NOT NULL AND TRIM(alt_a_imagem) != '')
    OR (alt_b_imagem IS NOT NULL AND TRIM(alt_b_imagem) != '')
    OR (alt_c_imagem IS NOT NULL AND TRIM(alt_c_imagem) != '')
    OR (alt_d_imagem IS NOT NULL AND TRIM(alt_d_imagem) != '')
    OR (alt_e_imagem IS NOT NULL AND TRIM(alt_e_imagem) != '')
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO 5: Atualizar flag tem_formula
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ CORREÇÃO 5: Atualizando flag tem_formula ═══' as etapa;

-- Detectar fórmulas no comando ou elementos
UPDATE questoes_enem q
SET tem_formula = true
WHERE q.ano = 2013
  AND q.tem_formula = false
  AND (
    -- Fórmulas no comando
    q.comando ~ '[²³⁴⁵⁶⁷⁸⁹⁰₀₁₂₃₄₅₆₇₈₉]'
    OR q.comando ~ '\\$.*\\$'
    OR q.comando ~ '\\\\frac|\\\\sqrt|\\\\sum|\\\\int'
    OR q.comando ~ '[±×÷≤≥≠≈∞∆Δπ]'
    OR q.comando ~ '\d+\s*[×·]\s*10'
    -- Fórmulas químicas
    OR q.comando ~ '[A-Z][a-z]?[₂₃₄₅₆₇₈₉]'
    OR q.comando ~ 'H2O|CO2|NaCl|H2SO4|NaOH|HCl'
    -- Fórmulas físicas
    OR q.comando ~ 'F\s*=\s*m\s*[×·]\s*a|E\s*=\s*m\s*[×·]\s*c²|v\s*=\s*d/t'
    -- Fórmulas nos elementos
    OR EXISTS (
        SELECT 1 FROM jsonb_array_elements(q.elementos) e
        WHERE e->>'conteudo' ~ '[²³⁴⁵⁶⁷⁸⁹⁰₀₁₂₃₄₅₆₇₈₉±×÷≤≥≠≈∞∆Δπ]'
           OR e->>'conteudo' ~ '\\$.*\\$'
           OR e->>'conteudo' ~ '[A-Z][a-z]?[₂₃₄₅₆₇₈₉]'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO 6: Separar FONTE que está misturada no texto
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ CORREÇÃO 6: Separando fontes do texto ═══' as etapa;

-- Identificar questões com fonte misturada
WITH fontes_misturadas AS (
    SELECT
        q.id,
        q.elementos,
        (
            SELECT jsonb_agg(
                CASE
                    WHEN e->>'tipo' = 'texto' AND (
                        e->>'conteudo' ~ '\n(Disponível em:|Acesso em:|Adaptado de|FONTE:|Fonte:)'
                        OR e->>'conteudo' ~ '\n[A-Z][A-Z\s,\.]+\.\s+[^\.]+\.\s+[^\.]+,\s*\d{4}'
                    )
                    THEN jsonb_build_object(
                        'tipo', 'texto',
                        'conteudo', regexp_replace(
                            e->>'conteudo',
                            '\n(Disponível em:.*|Acesso em:.*|Adaptado de.*|FONTE:.*|Fonte:.*|[A-Z][A-Z\s,\.]+\.\s+[^\.]+\.\s+[^\.]+,\s*\d{4}.*)$',
                            '',
                            'gi'
                        ),
                        'ordem', e->>'ordem'
                    )
                    ELSE e
                END
            )
            FROM jsonb_array_elements(q.elementos) e
        ) as elementos_limpos,
        (
            SELECT string_agg(
                regexp_replace(
                    e->>'conteudo',
                    '^.*\n((Disponível em:.*|Acesso em:.*|Adaptado de.*|FONTE:.*|Fonte:.*|[A-Z][A-Z\s,\.]+\.\s+[^\.]+\.\s+[^\.]+,\s*\d{4}.*))$',
                    '\1',
                    'gi'
                ),
                ' '
            )
            FROM jsonb_array_elements(q.elementos) e
            WHERE e->>'tipo' = 'texto'
              AND e->>'conteudo' ~ '\n(Disponível em:|Acesso em:|Adaptado de|FONTE:|Fonte:|[A-Z][A-Z\s,\.]+\.\s+[^\.]+\.\s+[^\.]+,\s*\d{4})'
        ) as fonte_extraida
    FROM questoes_enem q
    WHERE q.ano = 2013
      AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(q.elementos) e
          WHERE e->>'tipo' = 'texto'
            AND e->>'conteudo' ~ '\n(Disponível em:|Acesso em:|Adaptado de|FONTE:|Fonte:)'
      )
)
UPDATE questoes_enem q
SET elementos = fm.elementos_limpos || jsonb_build_array(
    jsonb_build_object(
        'tipo', 'fonte',
        'conteudo', fm.fonte_extraida,
        'ordem', jsonb_array_length(fm.elementos_limpos) + 1
    )
)
FROM fontes_misturadas fm
WHERE q.id = fm.id
  AND fm.fonte_extraida IS NOT NULL
  AND LENGTH(fm.fonte_extraida) > 5;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO 7: Garantir que todas têm pelo menos 1 elemento
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ CORREÇÃO 7: Criando elementos para questões sem ═══' as etapa;

-- Se questão tem comando mas não tem elementos, criar elemento de comando
UPDATE questoes_enem
SET elementos = jsonb_build_array(
    jsonb_build_object(
        'tipo', 'comando',
        'conteudo', comando,
        'ordem', 1
    )
)
WHERE ano = 2013
  AND comando IS NOT NULL
  AND TRIM(comando) != ''
  AND (elementos IS NULL OR jsonb_array_length(elementos) = 0);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO 8: Limpar valores inválidos de imagem
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ CORREÇÃO 8: Limpando URLs de imagem inválidas ═══' as etapa;

UPDATE questoes_enem
SET
    alt_a_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_a_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_a_imagem END,
    alt_b_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_b_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_b_imagem END,
    alt_c_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_c_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_c_imagem END,
    alt_d_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_d_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_d_imagem END,
    alt_e_imagem = CASE WHEN LOWER(TRIM(COALESCE(alt_e_imagem, ''))) IN ('nan', 'none', 'null', 'undefined', '') THEN NULL ELSE alt_e_imagem END
WHERE ano = 2013;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO 9: Remover prefixos de alternativas (A), B), etc.)
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ CORREÇÃO 9: Removendo prefixos de alternativas ═══' as etapa;

UPDATE questoes_enem
SET
    alt_a_texto = CASE WHEN alt_a_texto ~ '^[Aa][\.\)\-]\s*' THEN TRIM(regexp_replace(alt_a_texto, '^[Aa][\.\)\-]\s*', '')) ELSE alt_a_texto END,
    alt_b_texto = CASE WHEN alt_b_texto ~ '^[Bb][\.\)\-]\s*' THEN TRIM(regexp_replace(alt_b_texto, '^[Bb][\.\)\-]\s*', '')) ELSE alt_b_texto END,
    alt_c_texto = CASE WHEN alt_c_texto ~ '^[Cc][\.\)\-]\s*' THEN TRIM(regexp_replace(alt_c_texto, '^[Cc][\.\)\-]\s*', '')) ELSE alt_c_texto END,
    alt_d_texto = CASE WHEN alt_d_texto ~ '^[Dd][\.\)\-]\s*' THEN TRIM(regexp_replace(alt_d_texto, '^[Dd][\.\)\-]\s*', '')) ELSE alt_d_texto END,
    alt_e_texto = CASE WHEN alt_e_texto ~ '^[Ee][\.\)\-]\s*' THEN TRIM(regexp_replace(alt_e_texto, '^[Ee][\.\)\-]\s*', '')) ELSE alt_e_texto END
WHERE ano = 2013
  AND (
    alt_a_texto ~ '^[Aa][\.\)\-]'
    OR alt_b_texto ~ '^[Bb][\.\)\-]'
    OR alt_c_texto ~ '^[Cc][\.\)\-]'
    OR alt_d_texto ~ '^[Dd][\.\)\-]'
    OR alt_e_texto ~ '^[Ee][\.\)\-]'
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORREÇÃO 10: Definir caderno padrão se ausente
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ CORREÇÃO 10: Definindo caderno padrão ═══' as etapa;

UPDATE questoes_enem
SET caderno = 'Azul'
WHERE ano = 2013
  AND (caderno IS NULL OR TRIM(caderno) = '');

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT '═══ VERIFICAÇÃO FINAL ═══' as etapa;

SELECT
    'Total questões 2013' as metrica,
    COUNT(*) as valor
FROM questoes_enem WHERE ano = 2013
UNION ALL
SELECT
    'Com elementos preenchidos' as metrica,
    COUNT(*) as valor
FROM questoes_enem WHERE ano = 2013 AND elementos IS NOT NULL AND jsonb_array_length(elementos) > 0
UNION ALL
SELECT
    'Com comando preenchido' as metrica,
    COUNT(*) as valor
FROM questoes_enem WHERE ano = 2013 AND comando IS NOT NULL AND TRIM(comando) != ''
UNION ALL
SELECT
    'Com gabarito' as metrica,
    COUNT(*) as valor
FROM questoes_enem WHERE ano = 2013 AND gabarito IS NOT NULL
UNION ALL
SELECT
    'Com todas alternativas' as metrica,
    COUNT(*) as valor
FROM questoes_enem WHERE ano = 2013
  AND alt_a_texto IS NOT NULL
  AND alt_b_texto IS NOT NULL
  AND alt_c_texto IS NOT NULL
  AND alt_d_texto IS NOT NULL
  AND alt_e_texto IS NOT NULL
UNION ALL
SELECT
    'Com dia definido' as metrica,
    COUNT(*) as valor
FROM questoes_enem WHERE ano = 2013 AND dia IS NOT NULL
UNION ALL
SELECT
    'Com área padronizada' as metrica,
    COUNT(*) as valor
FROM questoes_enem WHERE ano = 2013 AND area IN (
    'Linguagens, Códigos e suas Tecnologias',
    'Ciências Humanas e suas Tecnologias',
    'Ciências da Natureza e suas Tecnologias',
    'Matemática e suas Tecnologias'
);

-- Comparar com 2024/2025
SELECT '═══ COMPARAÇÃO FINAL COM 2024/2025 ═══' as etapa;

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
    )::numeric / COUNT(*) * 100, 1) as pct_completas
FROM questoes_enem
WHERE ano IN (2013, 2024, 2025)
GROUP BY ano
ORDER BY ano;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '  CORREÇÕES APLICADAS COM SUCESSO!';
    RAISE NOTICE '════════════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '  Um backup foi criado em: questoes_enem_2013_backup';
    RAISE NOTICE '  Para reverter: DELETE FROM questoes_enem WHERE ano = 2013;';
    RAISE NOTICE '                 INSERT INTO questoes_enem SELECT * FROM questoes_enem_2013_backup;';
    RAISE NOTICE '';
END $$;
