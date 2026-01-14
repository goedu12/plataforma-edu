-- ═══════════════════════════════════════════════════════════
-- PREVIEW DA MIGRAÇÃO DE ESTUDANTES
-- Execute no Supabase SQL Editor para ver como ficará
-- ═══════════════════════════════════════════════════════════

-- 1. FUNÇÃO AUXILIAR PARA GERAR NOVO EMAIL
-- Formato: primeironome.ultimonome@turma
CREATE OR REPLACE FUNCTION gerar_email_estudante(nome TEXT, turma TEXT)
RETURNS TEXT AS $$
DECLARE
  partes TEXT[];
  primeiro_nome TEXT;
  ultimo_nome TEXT;
  nome_email TEXT;
  nome_limpo TEXT;
BEGIN
  -- Normalizar: minúsculas, remover acentos
  nome_limpo := lower(unaccent(nome));

  -- Remover caracteres especiais exceto espaços
  nome_limpo := regexp_replace(nome_limpo, '[^a-z\s]', '', 'g');

  -- Separar em partes e remover preposições
  partes := ARRAY(
    SELECT unnest
    FROM unnest(string_to_array(trim(nome_limpo), ' '))
    WHERE unnest NOT IN ('da', 'de', 'do', 'das', 'dos', 'e')
    AND length(unnest) > 0
  );

  -- Pegar primeiro e último nome
  IF array_length(partes, 1) >= 1 THEN
    primeiro_nome := partes[1];
  ELSE
    primeiro_nome := '';
  END IF;

  IF array_length(partes, 1) >= 2 THEN
    ultimo_nome := partes[array_length(partes, 1)];
  ELSE
    ultimo_nome := '';
  END IF;

  -- Montar email
  IF ultimo_nome != '' THEN
    nome_email := primeiro_nome || '.' || ultimo_nome;
  ELSE
    nome_email := primeiro_nome;
  END IF;

  RETURN nome_email || '@' || lower(turma);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════
-- 2. PREVIEW: VER COMO FICARÁ CADA ESTUDANTE
-- ═══════════════════════════════════════════════════════════
SELECT
  nome,
  turma,
  email AS email_atual,
  gerar_email_estudante(nome, turma) AS email_novo,
  CASE
    WHEN email = gerar_email_estudante(nome, turma) THEN '✅ OK'
    ELSE '🔄 Atualizar'
  END AS status
FROM usuarios
WHERE tipo = 'estudante' AND ativo = true
ORDER BY nome;

-- ═══════════════════════════════════════════════════════════
-- 3. RESUMO DA MIGRAÇÃO
-- ═══════════════════════════════════════════════════════════
SELECT
  COUNT(*) AS total_estudantes,
  COUNT(*) FILTER (WHERE email = gerar_email_estudante(nome, turma)) AS ja_corretos,
  COUNT(*) FILTER (WHERE email != gerar_email_estudante(nome, turma)) AS precisam_atualizar
FROM usuarios
WHERE tipo = 'estudante' AND ativo = true;

-- ═══════════════════════════════════════════════════════════
-- 4. APLICAR MIGRAÇÃO (EXECUTE APENAS SE QUISER APLICAR!)
-- ⚠️  CUIDADO: Este comando ALTERA os dados!
-- ═══════════════════════════════════════════════════════════

/*
-- Primeiro, adicione a coluna colégio se não existir
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS colegio VARCHAR(200) DEFAULT NULL;

-- Depois, atualize emails e senhas
-- Senha: @estudante (hash bcrypt)
UPDATE usuarios
SET
  email = gerar_email_estudante(nome, turma),
  senha_hash = '$2a$10$Kxq8kQ9K9K9K9K9K9K9K9OuXxXxXxXxXxXxXxXxXxXxXxXxXxXx', -- Hash de @estudante
  senha_alterada = false
WHERE tipo = 'estudante'
  AND ativo = true
  AND email != gerar_email_estudante(nome, turma);

-- Verificar resultado
SELECT
  nome,
  email AS novo_email,
  turma
FROM usuarios
WHERE tipo = 'estudante' AND ativo = true
ORDER BY nome;
*/

-- ═══════════════════════════════════════════════════════════
-- NOTA: Para gerar o hash correto da senha @estudante,
-- use a API: POST /api/admin/migrar-estudantes
-- Ou execute no Node.js: bcrypt.hash('@estudante', 10)
-- ═══════════════════════════════════════════════════════════
