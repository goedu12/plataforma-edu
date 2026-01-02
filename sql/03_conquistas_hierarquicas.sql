-- ═══════════════════════════════════════════════════════════════════════════
-- CONQUISTAS HIERÁRQUICAS - Plataforma Educacional
-- Sistema de conquistas organizado por categorias e níveis
-- ═══════════════════════════════════════════════════════════════════════════

-- Limpar conquistas antigas (se quiser resetar)
-- DELETE FROM conquistas_usuarios;
-- DELETE FROM conquistas;

-- ═══════════════════════════════════════════════════════════════════════════
-- CATEGORIA: INICIANTE (Primeiros Passos)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor) VALUES
('FIRST_ANSWER', 'Primeiro Passo', 'Respondeu sua primeira questão', '🎯', NULL, 'questoes', 1),
('FIVE_ANSWERS', 'Aquecendo', 'Respondeu 5 questões', '🔥', NULL, 'questoes', 5),
('TEN_ANSWERS', 'Pegando o Ritmo', 'Respondeu 10 questões', '💪', NULL, 'questoes', 10)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone;

-- ═══════════════════════════════════════════════════════════════════════════
-- CATEGORIA: ESTUDANTE DEDICADO (Por quantidade de questões)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor) VALUES
('STUDENT_25', 'Estudante Aplicado', 'Respondeu 25 questões', '📚', NULL, 'questoes', 25),
('STUDENT_50', 'Estudante Dedicado', 'Respondeu 50 questões', '📖', NULL, 'questoes', 50),
('STUDENT_100', 'Estudante Exemplar', 'Respondeu 100 questões', '🎓', NULL, 'questoes', 100),
('STUDENT_200', 'Mestre do Estudo', 'Respondeu 200 questões', '👨‍🎓', NULL, 'questoes', 200),
('STUDENT_500', 'Lenda do Conhecimento', 'Respondeu 500 questões', '🏆', NULL, 'questoes', 500)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone;

-- ═══════════════════════════════════════════════════════════════════════════
-- CATEGORIA: PONTUAÇÃO (Por pontos acumulados)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor) VALUES
('POINTS_100', 'Centenário', 'Acumulou 100 pontos', '💯', NULL, 'pontos', 100),
('POINTS_250', 'Escalando', 'Acumulou 250 pontos', '📈', NULL, 'pontos', 250),
('POINTS_500', 'Meio Milhar', 'Acumulou 500 pontos', '🌟', NULL, 'pontos', 500),
('POINTS_1000', 'Milionário do Saber', 'Acumulou 1000 pontos', '💰', NULL, 'pontos', 1000),
('POINTS_2000', 'Elite Acadêmica', 'Acumulou 2000 pontos', '👑', NULL, 'pontos', 2000),
('POINTS_5000', 'Lenda Suprema', 'Acumulou 5000 pontos', '🌈', NULL, 'pontos', 5000)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone;

-- ═══════════════════════════════════════════════════════════════════════════
-- CATEGORIA: SEQUÊNCIA (Dias consecutivos)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor) VALUES
('STREAK_3', 'Começando Bem', '3 dias seguidos estudando', '🔥', NULL, 'sequencia', 3),
('STREAK_7', 'Uma Semana!', '7 dias seguidos estudando', '🗓️', NULL, 'sequencia', 7),
('STREAK_14', 'Duas Semanas!', '14 dias seguidos estudando', '⚡', NULL, 'sequencia', 14),
('STREAK_30', 'Um Mês Inteiro!', '30 dias seguidos estudando', '🏅', NULL, 'sequencia', 30),
('STREAK_60', 'Imbatível', '60 dias seguidos estudando', '🦁', NULL, 'sequencia', 60)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone;

-- ═══════════════════════════════════════════════════════════════════════════
-- CATEGORIA: PRECISÃO (Taxa de acerto - mínimo 20 questões)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor) VALUES
('ACC_50', 'Na Média', 'Taxa de acerto de 50%', '🎯', NULL, 'acertos', 50),
('ACC_70', 'Bom Desempenho', 'Taxa de acerto de 70%', '✅', NULL, 'acertos', 70),
('ACC_80', 'Excelente!', 'Taxa de acerto de 80%', '🌟', NULL, 'acertos', 80),
('ACC_90', 'Quase Perfeito', 'Taxa de acerto de 90%', '💎', NULL, 'acertos', 90),
('ACC_95', 'Perfeccionista', 'Taxa de acerto de 95%', '🏆', NULL, 'acertos', 95)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone;

-- ═══════════════════════════════════════════════════════════════════════════
-- CATEGORIA: FÍSICA (Específicas)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor) VALUES
('FIS_INICIANTE', 'Aprendiz de Newton', 'Respondeu 10 questões de Física', '🔬', 'fisica', 'questoes', 10),
('FIS_AVANCADO', 'Físico em Formação', 'Respondeu 50 questões de Física', '⚛️', 'fisica', 'questoes', 50),
('FIS_EXPERT', 'Einstein Mirim', 'Respondeu 100 questões de Física', '🧪', 'fisica', 'questoes', 100),
('FIS_MESTRE', 'Mestre da Física', 'Respondeu 200 questões de Física', '🔭', 'fisica', 'questoes', 200)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone;

-- ═══════════════════════════════════════════════════════════════════════════
-- CATEGORIA: MATEMÁTICA (Específicas)
-- ═══════════════════════════════════════════════════════════════════════════
INSERT INTO conquistas (codigo, nome, descricao, icone, componente, requisito_tipo, requisito_valor) VALUES
('MAT_INICIANTE', 'Aprendiz de Pitágoras', 'Respondeu 10 questões de Matemática', '🔢', 'matematica', 'questoes', 10),
('MAT_AVANCADO', 'Matemático em Formação', 'Respondeu 50 questões de Matemática', '📐', 'matematica', 'questoes', 50),
('MAT_EXPERT', 'Gauss Mirim', 'Respondeu 100 questões de Matemática', '📊', 'matematica', 'questoes', 100),
('MAT_MESTRE', 'Mestre da Matemática', 'Respondeu 200 questões de Matemática', '🧮', 'matematica', 'questoes', 200)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone;

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEW: Conquistas com progresso (para exibir na interface)
-- ═══════════════════════════════════════════════════════════════════════════
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
  CASE
    WHEN c.requisito_tipo = 'questoes' THEN 'Questões'
    WHEN c.requisito_tipo = 'pontos' THEN 'Pontos'
    WHEN c.requisito_tipo = 'sequencia' THEN 'Dias'
    WHEN c.requisito_tipo = 'acertos' THEN 'Taxa %'
    ELSE 'N/A'
  END as tipo_label,
  CASE
    WHEN c.componente = 'fisica' THEN 'Física'
    WHEN c.componente = 'matematica' THEN 'Matemática'
    ELSE 'Geral'
  END as componente_label
FROM conquistas c
ORDER BY
  CASE c.requisito_tipo
    WHEN 'questoes' THEN 1
    WHEN 'pontos' THEN 2
    WHEN 'sequencia' THEN 3
    WHEN 'acertos' THEN 4
  END,
  c.requisito_valor;

-- Comentário
COMMENT ON TABLE conquistas IS 'Sistema de conquistas hierárquicas organizado por categorias';
