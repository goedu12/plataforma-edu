-- ═══════════════════════════════════════════════════════════════════════════
-- TEMPLATE: IMPORTAÇÃO DE ESTUDANTES DE MATEMÁTICA - COLÉGIO CORA CORALINA
--
-- INSTRUÇÕES:
-- 1. Substitua os dados de exemplo pelos dados reais dos estudantes
-- 2. O formato do email é: primeiro_nome.ultimo_sobrenome@turma
-- 3. A senha padrão é: @estudante
-- 4. Execute no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar extensão pgcrypto se não existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 2A - 2ª SÉRIE MATEMÁTICA (exemplo com 5 alunos)
-- Substitua pelos dados reais
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO usuarios (email, senha_hash, nome, turma, colegio, ano, nivel, componentes, tipo, ativo, senha_alterada)
VALUES
  -- Formato: ('email@turma', senha, 'Nome Completo', 'Turma', 'Colegio', ano, 'nivel', ARRAY['componente'], 'tipo', ativo, senha_alterada)
  ('exemplo.aluno1@2a', crypt('@estudante', gen_salt('bf')), 'Nome Completo do Aluno 1', '2A', 'Cora Coralina', 2, 'EM', ARRAY['matematica'], 'estudante', true, false),
  ('exemplo.aluno2@2a', crypt('@estudante', gen_salt('bf')), 'Nome Completo do Aluno 2', '2A', 'Cora Coralina', 2, 'EM', ARRAY['matematica'], 'estudante', true, false),
  ('exemplo.aluno3@2a', crypt('@estudante', gen_salt('bf')), 'Nome Completo do Aluno 3', '2A', 'Cora Coralina', 2, 'EM', ARRAY['matematica'], 'estudante', true, false),
  ('exemplo.aluno4@2a', crypt('@estudante', gen_salt('bf')), 'Nome Completo do Aluno 4', '2A', 'Cora Coralina', 2, 'EM', ARRAY['matematica'], 'estudante', true, false),
  ('exemplo.aluno5@2a', crypt('@estudante', gen_salt('bf')), 'Nome Completo do Aluno 5', '2A', 'Cora Coralina', 2, 'EM', ARRAY['matematica'], 'estudante', true, false)
ON CONFLICT (email) DO UPDATE SET
  componentes = CASE
    WHEN NOT ('matematica' = ANY(usuarios.componentes))
    THEN array_append(usuarios.componentes, 'matematica')
    ELSE usuarios.componentes
  END;

-- ═══════════════════════════════════════════════════════════════════════════
-- TURMA 2B - 2ª SÉRIE MATEMÁTICA (exemplo com 5 alunos)
-- Substitua pelos dados reais
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO usuarios (email, senha_hash, nome, turma, colegio, ano, nivel, componentes, tipo, ativo, senha_alterada)
VALUES
  ('exemplo.aluno1@2b', crypt('@estudante', gen_salt('bf')), 'Nome Completo do Aluno 1', '2B', 'Cora Coralina', 2, 'EM', ARRAY['matematica'], 'estudante', true, false),
  ('exemplo.aluno2@2b', crypt('@estudante', gen_salt('bf')), 'Nome Completo do Aluno 2', '2B', 'Cora Coralina', 2, 'EM', ARRAY['matematica'], 'estudante', true, false),
  ('exemplo.aluno3@2b', crypt('@estudante', gen_salt('bf')), 'Nome Completo do Aluno 3', '2B', 'Cora Coralina', 2, 'EM', ARRAY['matematica'], 'estudante', true, false),
  ('exemplo.aluno4@2b', crypt('@estudante', gen_salt('bf')), 'Nome Completo do Aluno 4', '2B', 'Cora Coralina', 2, 'EM', ARRAY['matematica'], 'estudante', true, false),
  ('exemplo.aluno5@2b', crypt('@estudante', gen_salt('bf')), 'Nome Completo do Aluno 5', '2B', 'Cora Coralina', 2, 'EM', ARRAY['matematica'], 'estudante', true, false)
ON CONFLICT (email) DO UPDATE SET
  componentes = CASE
    WHEN NOT ('matematica' = ANY(usuarios.componentes))
    THEN array_append(usuarios.componentes, 'matematica')
    ELSE usuarios.componentes
  END;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO FINAL
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  turma,
  COUNT(*) as total_alunos
FROM usuarios
WHERE colegio = 'Cora Coralina'
  AND 'matematica' = ANY(componentes)
  AND tipo = 'estudante'
GROUP BY turma
ORDER BY turma;

-- Total geral
SELECT
  COUNT(*) as total_estudantes_matematica
FROM usuarios
WHERE colegio = 'Cora Coralina'
  AND 'matematica' = ANY(componentes)
  AND tipo = 'estudante';
