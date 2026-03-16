-- ===============================================================================
-- SCRIPT PARA LIMPAR QUESTOES DO ENEM 2022 E 2023
-- Execute este script no SQL Editor do Supabase
-- ===============================================================================

-- PASSO 1: Verificar quantas questoes serao afetadas
SELECT 'ANTES DA LIMPEZA' as status;

SELECT
    ano,
    COUNT(*) as total_questoes
FROM questoes_enem
WHERE ano IN (2022, 2023)
GROUP BY ano
ORDER BY ano;

SELECT
    'Total a deletar: ' || COUNT(*) as resumo
FROM questoes_enem
WHERE ano IN (2022, 2023);

-- ===============================================================================
-- PASSO 2: Criar backup antes de deletar (opcional mas recomendado)
-- ===============================================================================

-- Backup das questoes de 2022
DROP TABLE IF EXISTS questoes_enem_2022_backup_limpeza;
CREATE TABLE questoes_enem_2022_backup_limpeza AS
SELECT * FROM questoes_enem WHERE ano = 2022;

-- Backup das questoes de 2023
DROP TABLE IF EXISTS questoes_enem_2023_backup_limpeza;
CREATE TABLE questoes_enem_2023_backup_limpeza AS
SELECT * FROM questoes_enem WHERE ano = 2023;

SELECT 'Backups criados: questoes_enem_2022_backup_limpeza e questoes_enem_2023_backup_limpeza' as status;

-- ===============================================================================
-- PASSO 3: DELETAR as questoes de 2022 e 2023
-- ===============================================================================

DELETE FROM questoes_enem WHERE ano = 2022;
DELETE FROM questoes_enem WHERE ano = 2023;

-- ===============================================================================
-- PASSO 4: Verificar resultado
-- ===============================================================================

SELECT 'APOS A LIMPEZA' as status;

SELECT
    ano,
    COUNT(*) as total_questoes
FROM questoes_enem
GROUP BY ano
ORDER BY ano;

SELECT 'Limpeza concluida! Questoes de 2022 e 2023 removidas.' as resultado;

-- ===============================================================================
-- CASO PRECISE RESTAURAR (descomente as linhas abaixo):
-- ===============================================================================
-- INSERT INTO questoes_enem SELECT * FROM questoes_enem_2022_backup_limpeza;
-- INSERT INTO questoes_enem SELECT * FROM questoes_enem_2023_backup_limpeza;
-- DROP TABLE questoes_enem_2022_backup_limpeza;
-- DROP TABLE questoes_enem_2023_backup_limpeza;
