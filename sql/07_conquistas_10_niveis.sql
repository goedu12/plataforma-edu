-- ═══════════════════════════════════════════════════════════════════════════
-- SISTEMA DE CONQUISTAS - 10 NÍVEIS COM REQUISITOS COMBINADOS
-- Plataforma Educacional - Colégio Estadual Cora Coralina
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 1: Adicionar novas colunas para requisitos combinados
-- ═══════════════════════════════════════════════════════════════════════════

-- Adicionar colunas para requisitos múltiplos
ALTER TABLE conquistas ADD COLUMN IF NOT EXISTS req_pontos INTEGER;
ALTER TABLE conquistas ADD COLUMN IF NOT EXISTS req_questoes_corretas INTEGER;
ALTER TABLE conquistas ADD COLUMN IF NOT EXISTS req_sequencia_dias INTEGER;
ALTER TABLE conquistas ADD COLUMN IF NOT EXISTS dificuldade VARCHAR(20) DEFAULT 'facil'
  CHECK (dificuldade IN ('facil', 'medio', 'dificil', 'muito_dificil', 'lendario'));
ALTER TABLE conquistas ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 2: Limpar conquistas antigas
-- ═══════════════════════════════════════════════════════════════════════════

-- Remover conquistas dos usuários (reset)
DELETE FROM conquistas_usuarios;

-- Remover conquistas antigas
DELETE FROM conquistas;

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 3: Inserir as 10 novas conquistas
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- FÁCEIS (3) - Requisito único, conquistáveis em 1-2 semanas
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor, dificuldade, ordem) VALUES
('NIVEL_01_AQUECIMENTO', 'Aquecimento', 'Respondeu 25 questões', '🎯', NULL, 'questoes', 25, 'facil', 1);

INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor, dificuldade, ordem) VALUES
('NIVEL_02_PONTUADOR', 'Pontuador', 'Alcançou 200 pontos', '⭐', NULL, 'pontos', 200, 'facil', 2);

INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor, dificuldade, ordem) VALUES
('NIVEL_03_FOCO', 'Foco Inicial', 'Estudou 7 dias consecutivos', '🔥', NULL, 'sequencia', 7, 'facil', 3);

-- ═══════════════════════════════════════════════════════════════════════════
-- MÉDIOS (3) - Requisitos combinados, conquistáveis em 1-2 meses
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor, req_pontos, req_questoes_corretas, req_sequencia_dias, dificuldade, ordem) VALUES
('NIVEL_04_DEDICADO', 'Estudante Dedicado', '500 pontos + 50 questões corretas + 14 dias seguidos', '📚', NULL, 'combinado', 0, 500, 50, 14, 'medio', 4);

INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor, req_pontos, req_questoes_corretas, req_sequencia_dias, dificuldade, ordem) VALUES
('NIVEL_05_ASCENSAO', 'Ascensão', '1000 pontos + 100 questões corretas + 21 dias seguidos', '💫', NULL, 'combinado', 0, 1000, 100, 21, 'medio', 5);

INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor, req_pontos, req_questoes_corretas, req_sequencia_dias, dificuldade, ordem) VALUES
('NIVEL_06_DISCIPLINADO', 'Disciplinado', '1500 pontos + 150 questões corretas + 30 dias seguidos', '🏆', NULL, 'combinado', 0, 1500, 150, 30, 'medio', 6);

-- ═══════════════════════════════════════════════════════════════════════════
-- DIFÍCEIS (2) - Requisitos combinados elevados, 3-4 meses
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor, req_pontos, req_questoes_corretas, req_sequencia_dias, dificuldade, ordem) VALUES
('NIVEL_07_VETERANO', 'Veterano', '3000 pontos + 300 questões corretas + 45 dias seguidos', '🎖️', NULL, 'combinado', 0, 3000, 300, 45, 'dificil', 7);

INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor, req_pontos, req_questoes_corretas, req_sequencia_dias, dificuldade, ordem) VALUES
('NIVEL_08_ELITE', 'Elite', '4500 pontos + 450 questões corretas + 60 dias seguidos', '💎', NULL, 'combinado', 0, 4500, 450, 60, 'dificil', 8);

-- ═══════════════════════════════════════════════════════════════════════════
-- BEM DIFÍCIL (1) - Requisitos extremos, 4-6 meses
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor, req_pontos, req_questoes_corretas, req_sequencia_dias, dificuldade, ordem) VALUES
('NIVEL_09_INCANSAVEL', 'Incansável', '6000 pontos + 600 questões corretas + 90 dias seguidos', '👑', NULL, 'combinado', 0, 6000, 600, 90, 'muito_dificil', 9);

-- ═══════════════════════════════════════════════════════════════════════════
-- LENDÁRIO (1) - O mais difícil, ~1 ano letivo
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor, req_pontos, req_questoes_corretas, req_sequencia_dias, dificuldade, ordem) VALUES
('NIVEL_10_LENDA', 'Lenda', '10000 pontos + 1000 questões corretas + 120 dias seguidos', '🧠', NULL, 'combinado', 0, 10000, 1000, 120, 'lendario', 10);

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 4: Atualizar constraint do requisito_tipo para incluir 'combinado'
-- ═══════════════════════════════════════════════════════════════════════════

-- Remover constraint antiga
ALTER TABLE conquistas DROP CONSTRAINT IF EXISTS conquistas_requisito_tipo_check;

-- Adicionar nova constraint
ALTER TABLE conquistas ADD CONSTRAINT conquistas_requisito_tipo_check
  CHECK (requisito_tipo IN ('pontos', 'questoes', 'sequencia', 'acertos', 'combinado'));

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 5: Criar índice para ordenação
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_conquistas_ordem ON conquistas(ordem);
CREATE INDEX IF NOT EXISTS idx_conquistas_dificuldade ON conquistas(dificuldade);

-- ═══════════════════════════════════════════════════════════════════════════
-- PASSO 6: View atualizada para conquistas com progresso
-- ═══════════════════════════════════════════════════════════════════════════

DROP VIEW IF EXISTS conquistas_com_progresso;

CREATE OR REPLACE VIEW conquistas_com_progresso AS
SELECT
  c.id,
  c.codigo,
  c.nome,
  c.descricao,
  c.icone,
  c.componente,
  c.requisito_tipo,
  c.requisito_valor,
  c.req_pontos,
  c.req_questoes_corretas,
  c.req_sequencia_dias,
  c.dificuldade,
  c.ordem,
  CASE c.dificuldade
    WHEN 'facil' THEN 'Fácil'
    WHEN 'medio' THEN 'Médio'
    WHEN 'dificil' THEN 'Difícil'
    WHEN 'muito_dificil' THEN 'Muito Difícil'
    WHEN 'lendario' THEN 'Lendário'
    ELSE 'N/A'
  END as dificuldade_label,
  CASE c.componente
    WHEN 'fisica' THEN 'Física'
    WHEN 'matematica' THEN 'Matemática'
    ELSE 'Geral'
  END as componente_label
FROM conquistas c
ORDER BY c.ordem;

-- Comentário
COMMENT ON TABLE conquistas IS 'Sistema de 10 conquistas com requisitos combinados - níveis fácil a lendário';
