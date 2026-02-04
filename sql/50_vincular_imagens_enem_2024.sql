-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  VINCULAÇÃO DE IMAGENS - QUESTÕES ENEM 2024                                  ║
-- ║  URLs do Supabase Storage: exam-assets/enem/2024/1/azul                      ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- Base URL do storage
-- https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/

-- ============================================================================
-- QUESTÃO 01
-- ============================================================================
UPDATE questoes_enem SET
  imagem_principal = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q01/stem/p02_img00.jpeg'
WHERE ano_prova = 2024 AND numero_questao = 1;

-- ============================================================================
-- QUESTÃO 03
-- ============================================================================
UPDATE questoes_enem SET
  imagem_principal = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q03/stem/p02_img01.jpeg'
WHERE ano_prova = 2024 AND numero_questao = 3;

-- ============================================================================
-- QUESTÃO 05
-- ============================================================================
UPDATE questoes_enem SET
  imagem_principal = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q05/stem/p03_img00.jpeg'
WHERE ano_prova = 2024 AND numero_questao = 5;

-- ============================================================================
-- QUESTÃO 21
-- ============================================================================
UPDATE questoes_enem SET
  imagem_principal = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q21/stem/p10_img00.jpeg'
WHERE ano_prova = 2024 AND numero_questao = 21;

-- ============================================================================
-- QUESTÃO 25
-- ============================================================================
UPDATE questoes_enem SET
  imagem_principal = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q25/stem/p11_img00.jpeg'
WHERE ano_prova = 2024 AND numero_questao = 25;

-- ============================================================================
-- QUESTÃO 33
-- ============================================================================
UPDATE questoes_enem SET
  imagem_principal = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q33/stem/p14_img00.jpeg'
WHERE ano_prova = 2024 AND numero_questao = 33;

-- ============================================================================
-- QUESTÃO 36 (com 2 imagens)
-- ============================================================================
UPDATE questoes_enem SET
  imagem_principal = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q36/stem/p15_img00.jpeg',
  imagens_extras = ARRAY['https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q36/stem/p15_img01.jpeg']
WHERE ano_prova = 2024 AND numero_questao = 36;

-- ============================================================================
-- QUESTÃO 43
-- ============================================================================
UPDATE questoes_enem SET
  imagem_principal = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q43/stem/p18_img00.png'
WHERE ano_prova = 2024 AND numero_questao = 43;

-- ============================================================================
-- QUESTÃO 53
-- ============================================================================
UPDATE questoes_enem SET
  imagem_principal = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q53/stem/p21_img00.png'
WHERE ano_prova = 2024 AND numero_questao = 53;

-- ============================================================================
-- QUESTÃO 77
-- ============================================================================
UPDATE questoes_enem SET
  imagem_principal = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q77/stem/p28_img00.jpeg'
WHERE ano_prova = 2024 AND numero_questao = 77;

-- ============================================================================
-- QUESTÃO 86 (com 2 imagens)
-- ============================================================================
UPDATE questoes_enem SET
  imagem_principal = 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q86/stem/p30_img00.jpeg',
  imagens_extras = ARRAY['https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/exam-assets/enem/2024/1/azul/q86/stem/p30_img01.jpeg']
WHERE ano_prova = 2024 AND numero_questao = 86;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
SELECT
  numero_questao,
  CASE
    WHEN imagem_principal IS NOT NULL AND imagem_principal != '' THEN '✓'
    ELSE '✗'
  END as img_principal,
  CASE
    WHEN imagens_extras IS NOT NULL AND array_length(imagens_extras, 1) > 0
    THEN array_length(imagens_extras, 1)::text || ' extras'
    ELSE '-'
  END as extras,
  LEFT(imagem_principal, 80) as url_preview
FROM questoes_enem
WHERE ano_prova = 2024
  AND numero_questao IN (1, 3, 5, 21, 25, 33, 36, 43, 53, 77, 86)
ORDER BY numero_questao;
