-- =====================================================
-- SCRIPT DE CORREÇÃO - IMAGENS FALTANTES
-- =====================================================
-- Data: 2026-02-20
-- Questões afetadas: Q127 (2025), Q168 (2024), Q177 (2025)
-- =====================================================

-- =====================================================
-- 1. CORREÇÃO Q127 (ENEM 2025 D2)
-- Situação: Já possui 5 imagens nas alternativas, mas flag está false
-- =====================================================

UPDATE questoes_enem
SET tem_imagem_alternativa = true
WHERE ano = 2025
  AND dia = 2
  AND numero = 127;

-- Verificar:
-- SELECT id, tem_imagem, tem_imagem_alternativa
-- FROM questoes_enem
-- WHERE ano = 2025 AND dia = 2 AND numero = 127;

-- =====================================================
-- 2. CORREÇÃO Q168 (ENEM 2024 D2)
-- Situação: Já possui 5 imagens nas alternativas, mas flag está false
-- =====================================================

UPDATE questoes_enem
SET tem_imagem_alternativa = true
WHERE ano = 2024
  AND dia = 2
  AND numero = 168;

-- Verificar:
-- SELECT id, tem_imagem, tem_imagem_alternativa
-- FROM questoes_enem
-- WHERE ano = 2024 AND dia = 2 AND numero = 168;

-- =====================================================
-- 3. CORREÇÃO Q177 (ENEM 2025 D2)
-- Situação: Falta a imagem da medalha no enunciado
--
-- IMPORTANTE: Antes de executar este UPDATE, faça upload da imagem:
-- 1. Acesse Supabase Dashboard > Storage > enem-imagens
-- 2. Navegue ou crie: 2025/d2/enunciados/
-- 3. Faça upload do arquivo como: q177_figura.png
-- =====================================================

-- Primeiro, verificar estrutura atual dos elementos:
-- SELECT elementos FROM questoes_enem WHERE ano = 2025 AND dia = 2 AND numero = 177;

-- Adicionar a imagem da medalha aos elementos:
UPDATE questoes_enem
SET
  tem_imagem = true,
  elementos = COALESCE(elementos, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'tipo', 'imagem',
      'arquivo', 'https://qjrjkjknesacrurvcthu.supabase.co/storage/v1/object/public/enem-imagens/2025/d2/enunciados/q177_figura.png',
      'ordem', 3,
      'legenda', 'Medalha comemorativa - cilindro de 6 cm de diâmetro e 3 mm de espessura'
    )
  )
WHERE ano = 2025
  AND dia = 2
  AND numero = 177;

-- =====================================================
-- 4. VERIFICAÇÃO FINAL
-- =====================================================

SELECT
  id,
  ano,
  dia,
  numero,
  tem_imagem,
  tem_imagem_alternativa,
  jsonb_array_length(COALESCE(elementos, '[]'::jsonb)) as total_elementos
FROM questoes_enem
WHERE (ano = 2025 AND dia = 2 AND numero IN (127, 177))
   OR (ano = 2024 AND dia = 2 AND numero = 168)
ORDER BY ano, numero;
