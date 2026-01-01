-- ═══════════════════════════════════════════════════════════════════════════
-- OTIMIZAÇÃO DE PERFORMANCE - Plataforma Educacional
-- Índices e otimizações para suportar 11.000+ estudantes
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES PARA TABELA USUARIOS
-- ═══════════════════════════════════════════════════════════════════════════

-- Índice para busca por email (login)
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Índice para busca por turma (ranking por turma)
CREATE INDEX IF NOT EXISTS idx_usuarios_turma ON usuarios(turma);

-- Índice para ranking de física (ordenado por pontos)
CREATE INDEX IF NOT EXISTS idx_usuarios_fis_pontos ON usuarios(fis_pontos DESC) WHERE ativo = true;

-- Índice para ranking de matemática (ordenado por pontos)
CREATE INDEX IF NOT EXISTS idx_usuarios_mat_pontos ON usuarios(mat_pontos DESC) WHERE ativo = true;

-- Índice composto para ranking por turma e pontos
CREATE INDEX IF NOT EXISTS idx_usuarios_turma_fis ON usuarios(turma, fis_pontos DESC) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_usuarios_turma_mat ON usuarios(turma, mat_pontos DESC) WHERE ativo = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES PARA TABELA RESPOSTAS
-- ═══════════════════════════════════════════════════════════════════════════

-- Índice para buscar respostas por usuário e componente (mais comum)
CREATE INDEX IF NOT EXISTS idx_respostas_usuario_comp ON respostas(usuario_id, componente);

-- Índice para buscar respostas por questão
CREATE INDEX IF NOT EXISTS idx_respostas_questao ON respostas(questao_id);

-- Índice para buscar respostas por data (notas bimestrais)
CREATE INDEX IF NOT EXISTS idx_respostas_data ON respostas(criado_em);

-- Índice composto para revisão (erros não corrigidos)
CREATE INDEX IF NOT EXISTS idx_respostas_revisao ON respostas(usuario_id, componente, correta, questao_id);

-- Índice para modo de resposta
CREATE INDEX IF NOT EXISTS idx_respostas_modo ON respostas(modo) WHERE modo IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES PARA TABELA QUESTOES
-- ═══════════════════════════════════════════════════════════════════════════

-- Índice para buscar questões por componente e ano
CREATE INDEX IF NOT EXISTS idx_questoes_comp_ano ON questoes(componente, ano) WHERE status = 'ativa';

-- Índice para buscar questões por tema
CREATE INDEX IF NOT EXISTS idx_questoes_tema ON questoes(componente, tema) WHERE status = 'ativa';

-- Índice para buscar questões por dificuldade
CREATE INDEX IF NOT EXISTS idx_questoes_dif ON questoes(componente, dificuldade) WHERE status = 'ativa';

-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES PARA TABELA CONQUISTAS_USUARIOS
-- ═══════════════════════════════════════════════════════════════════════════

-- Índice para buscar conquistas por usuário
CREATE INDEX IF NOT EXISTS idx_conquistas_usuario ON conquistas_usuarios(usuario_id);

-- Índice composto para verificar conquista específica
CREATE INDEX IF NOT EXISTS idx_conquistas_usuario_conq ON conquistas_usuarios(usuario_id, conquista_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES PARA TABELA DIAS_ATIVOS (se existir)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_dias_ativos_usuario ON dias_ativos(usuario_id, componente);
CREATE INDEX IF NOT EXISTS idx_dias_ativos_data ON dias_ativos(data);

-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES PARA TABELA NOTAS_BIMESTRAIS (se existir)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_notas_usuario ON notas_bimestrais(usuario_id, componente);
CREATE INDEX IF NOT EXISTS idx_notas_bimestre ON notas_bimestrais(ano, bimestre);

-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES PARA TABELA DESAFIOS (se existir)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_desafios_usuario ON desafios(usuario_id, componente);
CREATE INDEX IF NOT EXISTS idx_desafios_data ON desafios(data_desafio);

-- ═══════════════════════════════════════════════════════════════════════════
-- CONFIGURAÇÕES DE PERFORMANCE DO SUPABASE
-- ═══════════════════════════════════════════════════════════════════════════

-- Atualizar estatísticas das tabelas para melhor planejamento de queries
ANALYZE usuarios;
ANALYZE respostas;
ANALYZE questoes;
ANALYZE conquistas;
ANALYZE conquistas_usuarios;

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEW OTIMIZADA: Ranking com índices
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop view existente se houver
DROP VIEW IF EXISTS ranking_fisica_turma;
DROP VIEW IF EXISTS ranking_matematica_turma;

-- View para ranking de física por turma (mais performático)
CREATE VIEW ranking_fisica_turma AS
SELECT
  u.id as usuario_id,
  u.nome,
  u.turma,
  u.fis_pontos as pontos,
  u.fis_nivel as nivel,
  u.fis_questoes_total as questoes_total,
  CASE
    WHEN u.fis_questoes_total > 0
    THEN ROUND((u.fis_questoes_corretas::numeric / u.fis_questoes_total) * 100, 1)
    ELSE 0
  END as taxa_acerto,
  ROW_NUMBER() OVER (PARTITION BY u.turma ORDER BY u.fis_pontos DESC) as posicao_turma,
  ROW_NUMBER() OVER (ORDER BY u.fis_pontos DESC) as posicao_geral
FROM usuarios u
WHERE u.ativo = true AND u.tipo = 'estudante'
ORDER BY u.fis_pontos DESC;

-- View para ranking de matemática por turma
CREATE VIEW ranking_matematica_turma AS
SELECT
  u.id as usuario_id,
  u.nome,
  u.turma,
  u.mat_pontos as pontos,
  u.mat_nivel as nivel,
  u.mat_questoes_total as questoes_total,
  CASE
    WHEN u.mat_questoes_total > 0
    THEN ROUND((u.mat_questoes_corretas::numeric / u.mat_questoes_total) * 100, 1)
    ELSE 0
  END as taxa_acerto,
  ROW_NUMBER() OVER (PARTITION BY u.turma ORDER BY u.mat_pontos DESC) as posicao_turma,
  ROW_NUMBER() OVER (ORDER BY u.mat_pontos DESC) as posicao_geral
FROM usuarios u
WHERE u.ativo = true AND u.tipo = 'estudante'
ORDER BY u.mat_pontos DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Limitar resultados de ranking para performance
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION obter_ranking_turma(
  p_componente TEXT,
  p_turma TEXT,
  p_limite INT DEFAULT 50
)
RETURNS TABLE (
  usuario_id UUID,
  nome TEXT,
  turma TEXT,
  pontos INT,
  nivel TEXT,
  questoes_total INT,
  taxa_acerto NUMERIC,
  posicao INT
) AS $$
BEGIN
  IF p_componente = 'fisica' THEN
    RETURN QUERY
    SELECT
      r.usuario_id::UUID,
      r.nome::TEXT,
      r.turma::TEXT,
      r.pontos::INT,
      r.nivel::TEXT,
      r.questoes_total::INT,
      r.taxa_acerto::NUMERIC,
      r.posicao_turma::INT
    FROM ranking_fisica_turma r
    WHERE r.turma = p_turma
    LIMIT p_limite;
  ELSE
    RETURN QUERY
    SELECT
      r.usuario_id::UUID,
      r.nome::TEXT,
      r.turma::TEXT,
      r.pontos::INT,
      r.nivel::TEXT,
      r.questoes_total::INT,
      r.taxa_acerto::NUMERIC,
      r.posicao_turma::INT
    FROM ranking_matematica_turma r
    WHERE r.turma = p_turma
    LIMIT p_limite;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Comentário
COMMENT ON VIEW ranking_fisica_turma IS 'View otimizada para ranking de física com posições por turma e geral';
COMMENT ON VIEW ranking_matematica_turma IS 'View otimizada para ranking de matemática com posições por turma e geral';
