-- ═══════════════════════════════════════════════════════════════════════════
-- PLATAFORMA EDUCACIONAL - NOVAS FUNCIONALIDADES
-- Versão: 2.0
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: desafios
-- Histórico do Modo Desafio (5 questões em 5 minutos)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS desafios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(15) NOT NULL CHECK (componente IN ('fisica', 'matematica')),

    -- Resultados
    questoes_total INTEGER NOT NULL DEFAULT 5,
    acertos INTEGER NOT NULL DEFAULT 0,
    tempo_total_segundos INTEGER NOT NULL DEFAULT 0,
    pontos_ganhos INTEGER NOT NULL DEFAULT 0,
    bonus_perfeito BOOLEAN DEFAULT FALSE,

    -- Questões do desafio (array de IDs)
    questoes_ids UUID[] DEFAULT '{}',
    respostas_dadas CHAR(1)[] DEFAULT '{}',

    -- Controle
    status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'completo', 'timeout', 'abandonado')),
    iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finalizado_em TIMESTAMP WITH TIME ZONE,

    -- Limite: 1 desafio por dia por componente
    data_desafio DATE DEFAULT CURRENT_DATE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_desafios_usuario ON desafios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_desafios_data ON desafios(data_desafio);
CREATE INDEX IF NOT EXISTS idx_desafios_status ON desafios(status);

-- Constraint: máximo 1 desafio completo por dia por componente
CREATE UNIQUE INDEX IF NOT EXISTS idx_desafios_diario
ON desafios(usuario_id, componente, data_desafio)
WHERE status = 'completo';

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: dias_ativos
-- Rastreamento de dias de estudo para cálculo de frequência
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS dias_ativos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(15) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    data DATE NOT NULL,

    -- Estatísticas do dia
    questoes INTEGER DEFAULT 0,
    acertos INTEGER DEFAULT 0,
    pontos INTEGER DEFAULT 0,
    tempo_total_segundos INTEGER DEFAULT 0,
    usou_tutor BOOLEAN DEFAULT FALSE,
    fez_desafio BOOLEAN DEFAULT FALSE,
    fez_revisao BOOLEAN DEFAULT FALSE,

    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(usuario_id, componente, data)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dias_ativos_usuario ON dias_ativos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_dias_ativos_data ON dias_ativos(data);
CREATE INDEX IF NOT EXISTS idx_dias_ativos_componente ON dias_ativos(componente);

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: notas_bimestrais
-- Sistema de notas automáticas por bimestre
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notas_bimestrais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(15) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    ano INTEGER NOT NULL, -- 2025, 2026...
    bimestre INTEGER NOT NULL CHECK (bimestre BETWEEN 1 AND 4),

    -- Dados do cálculo
    questoes_total INTEGER DEFAULT 0,
    questoes_corretas INTEGER DEFAULT 0,
    dias_ativos INTEGER DEFAULT 0,

    -- Notas parciais (0 a 10)
    nota_desempenho DECIMAL(4,2) DEFAULT 0,
    nota_participacao DECIMAL(4,2) DEFAULT 0,
    nota_frequencia DECIMAL(4,2) DEFAULT 0,

    -- Nota final
    nota_calculada DECIMAL(4,2) DEFAULT 0,
    nota_final DECIMAL(4,2) DEFAULT 0, -- Pode ser ajustada pelo professor

    -- Status
    bloqueio VARCHAR(30), -- 'desempenho_baixo', 'participacao_baixa', NULL
    status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'fechado')),

    criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(usuario_id, componente, ano, bimestre)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notas_usuario ON notas_bimestrais(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_bimestre ON notas_bimestrais(ano, bimestre);
CREATE INDEX IF NOT EXISTS idx_notas_componente ON notas_bimestrais(componente);

-- ═══════════════════════════════════════════════════════════════════════════
-- MODIFICAÇÃO: Adicionar campo modo na tabela respostas
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'respostas' AND column_name = 'modo'
    ) THEN
        ALTER TABLE respostas
        ADD COLUMN modo VARCHAR(20) DEFAULT 'estudo'
        CHECK (modo IN ('estudo', 'revisao', 'desafio'));
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- POLÍTICAS DE SEGURANÇA (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar RLS nas novas tabelas
ALTER TABLE desafios ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_ativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas_bimestrais ENABLE ROW LEVEL SECURITY;

-- Política: Service role tem acesso total
CREATE POLICY IF NOT EXISTS "Service role full access" ON desafios FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "Service role full access" ON dias_ativos FOR ALL TO service_role USING (true);
CREATE POLICY IF NOT EXISTS "Service role full access" ON notas_bimestrais FOR ALL TO service_role USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEW: questoes_para_revisao
-- Questões que o usuário errou e ainda não acertou
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW questoes_para_revisao AS
SELECT DISTINCT ON (r.usuario_id, r.questao_id)
    r.usuario_id,
    r.questao_id,
    r.componente,
    q.tema,
    q.dificuldade,
    r.criado_em as errou_em
FROM respostas r
JOIN questoes q ON q.id = r.questao_id
WHERE r.correta = false
  AND q.status = 'ativa'
  AND NOT EXISTS (
    -- Não existe resposta correta posterior
    SELECT 1 FROM respostas r2
    WHERE r2.usuario_id = r.usuario_id
      AND r2.questao_id = r.questao_id
      AND r2.correta = true
      AND r2.criado_em > r.criado_em
  )
ORDER BY r.usuario_id, r.questao_id, r.criado_em DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEW: estatisticas_bimestre
-- Estatísticas por bimestre para cálculo de notas
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW estatisticas_bimestre AS
SELECT
    r.usuario_id,
    r.componente,
    EXTRACT(YEAR FROM r.criado_em)::INTEGER as ano,
    CASE
        WHEN EXTRACT(MONTH FROM r.criado_em) BETWEEN 2 AND 4 THEN 1
        WHEN EXTRACT(MONTH FROM r.criado_em) BETWEEN 5 AND 7 THEN 2
        WHEN EXTRACT(MONTH FROM r.criado_em) BETWEEN 8 AND 10 THEN 3
        WHEN EXTRACT(MONTH FROM r.criado_em) IN (11, 12, 1) THEN 4
    END as bimestre,
    COUNT(*) as questoes_total,
    SUM(CASE WHEN r.correta THEN 1 ELSE 0 END) as questoes_corretas,
    ROUND(AVG(CASE WHEN r.correta THEN 100 ELSE 0 END)::numeric, 2) as taxa_acerto
FROM respostas r
WHERE r.modo = 'estudo'
GROUP BY r.usuario_id, r.componente,
         EXTRACT(YEAR FROM r.criado_em),
         CASE
            WHEN EXTRACT(MONTH FROM r.criado_em) BETWEEN 2 AND 4 THEN 1
            WHEN EXTRACT(MONTH FROM r.criado_em) BETWEEN 5 AND 7 THEN 2
            WHEN EXTRACT(MONTH FROM r.criado_em) BETWEEN 8 AND 10 THEN 3
            WHEN EXTRACT(MONTH FROM r.criado_em) IN (11, 12, 1) THEN 4
         END;

-- ═══════════════════════════════════════════════════════════════════════════
-- VIEW: temas_dificeis
-- Temas com menor taxa de acerto (para relatório do professor)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW temas_dificeis AS
SELECT
    q.componente,
    q.tema,
    q.ano,
    COUNT(r.id) as total_respostas,
    SUM(CASE WHEN r.correta THEN 1 ELSE 0 END) as acertos,
    ROUND((SUM(CASE WHEN r.correta THEN 1 ELSE 0 END)::numeric / COUNT(r.id)) * 100, 1) as taxa_acerto
FROM questoes q
JOIN respostas r ON r.questao_id = q.id
WHERE q.status = 'ativa'
GROUP BY q.componente, q.tema, q.ano
HAVING COUNT(r.id) >= 5 -- Mínimo de respostas para ser considerado
ORDER BY taxa_acerto ASC;

-- Comentários nas novas tabelas
COMMENT ON TABLE desafios IS 'Histórico do Modo Desafio (5 questões em 5 minutos)';
COMMENT ON TABLE dias_ativos IS 'Rastreamento de dias de estudo';
COMMENT ON TABLE notas_bimestrais IS 'Sistema de notas automáticas por bimestre';
