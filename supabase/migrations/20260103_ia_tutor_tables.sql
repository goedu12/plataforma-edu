-- ═══════════════════════════════════════════════════════════════════════════
-- PLATAFORMA-EDU: TABELAS DO SISTEMA IA TUTOR INTELIGENTE
-- Data: 2026-01-03
-- Descrição: Cria tabelas para sessões, mensagens, mapas mentais,
--            dificuldades, preferências e estado emocional do estudante
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. SESSÕES DE ESTUDO COM IA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ia_sessoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(20) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    topico_principal VARCHAR(100),
    modo_predominante VARCHAR(20) CHECK (modo_predominante IN (
        'DIRETO', 'PASSO_A_PASSO', 'MAPA_MENTAL', 'ESTIMULAR', 'SOCRATICO', 'CONVERSACIONAL'
    )),
    inicio TIMESTAMPTZ DEFAULT NOW(),
    fim TIMESTAMPTZ,
    msgs_trocadas INTEGER DEFAULT 0,
    questoes_resolvidas INTEGER DEFAULT 0,
    satisfacao INTEGER CHECK (satisfacao >= 1 AND satisfacao <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para sessões
CREATE INDEX IF NOT EXISTS idx_ia_sessoes_usuario ON ia_sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ia_sessoes_componente ON ia_sessoes(componente);
CREATE INDEX IF NOT EXISTS idx_ia_sessoes_inicio ON ia_sessoes(inicio DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. HISTÓRICO DE MENSAGENS DA IA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ia_mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessao_id UUID REFERENCES ia_sessoes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(20) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    modo VARCHAR(20) CHECK (modo IN (
        'DIRETO', 'PASSO_A_PASSO', 'MAPA_MENTAL', 'ESTIMULAR', 'SOCRATICO', 'CONVERSACIONAL'
    )),
    topico VARCHAR(100),
    tokens_usados INTEGER DEFAULT 0,
    tempo_resposta_ms INTEGER, -- Tempo de resposta da IA em ms
    modelo_usado VARCHAR(50), -- Ex: 'gemini-2.0-flash-lite'
    revisao_nota INTEGER, -- Nota da revisão profissional (0-100)
    revisao_aprovado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mensagens
CREATE INDEX IF NOT EXISTS idx_ia_mensagens_usuario ON ia_mensagens(usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ia_mensagens_sessao ON ia_mensagens(sessao_id);
CREATE INDEX IF NOT EXISTS idx_ia_mensagens_componente ON ia_mensagens(componente);
CREATE INDEX IF NOT EXISTS idx_ia_mensagens_modo ON ia_mensagens(modo);
CREATE INDEX IF NOT EXISTS idx_ia_mensagens_topico ON ia_mensagens(topico);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. MAPAS MENTAIS GERADOS
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ia_mapas_mentais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(20) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    topico VARCHAR(100) NOT NULL,
    titulo VARCHAR(200),
    conteudo_texto TEXT NOT NULL, -- Mapa mental em formato texto
    conteudo_json JSONB, -- Estrutura em JSON para renderização
    favorito BOOLEAN DEFAULT FALSE,
    visualizacoes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mapas mentais
CREATE INDEX IF NOT EXISTS idx_ia_mapas_usuario ON ia_mapas_mentais(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ia_mapas_topico ON ia_mapas_mentais(topico);
CREATE INDEX IF NOT EXISTS idx_ia_mapas_componente ON ia_mapas_mentais(componente);
CREATE INDEX IF NOT EXISTS idx_ia_mapas_favorito ON ia_mapas_mentais(usuario_id, favorito) WHERE favorito = TRUE;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. RESOLUÇÕES PASSO A PASSO
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ia_resolucoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(20) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    questao_id UUID REFERENCES questoes(id) ON DELETE SET NULL,
    enunciado TEXT NOT NULL,
    resolucao_passos JSONB NOT NULL, -- Array de passos [{passo: 1, descricao: '...', calculo: '...'}]
    resposta_final TEXT,
    estudante_acompanhou BOOLEAN DEFAULT TRUE,
    tempo_resolucao_segundos INTEGER,
    dificuldade_percebida INTEGER CHECK (dificuldade_percebida >= 1 AND dificuldade_percebida <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para resoluções
CREATE INDEX IF NOT EXISTS idx_ia_resolucoes_usuario ON ia_resolucoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ia_resolucoes_questao ON ia_resolucoes(questao_id);
CREATE INDEX IF NOT EXISTS idx_ia_resolucoes_componente ON ia_resolucoes(componente);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. DIFICULDADES MAPEADAS POR TÓPICO
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS estudante_dificuldades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    componente VARCHAR(20) NOT NULL CHECK (componente IN ('fisica', 'matematica')),
    topico VARCHAR(100) NOT NULL,
    subtopico VARCHAR(100),
    nivel_dificuldade INTEGER DEFAULT 3 CHECK (nivel_dificuldade >= 1 AND nivel_dificuldade <= 5),
    -- 1 = Fácil, 2 = Normal, 3 = Médio, 4 = Difícil, 5 = Muito Difícil
    erros_consecutivos INTEGER DEFAULT 0,
    acertos_total INTEGER DEFAULT 0,
    erros_total INTEGER DEFAULT 0,
    taxa_acerto DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN (acertos_total + erros_total) > 0
        THEN (acertos_total::DECIMAL / (acertos_total + erros_total) * 100)
        ELSE 0 END
    ) STORED,
    ultima_interacao TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, componente, topico, subtopico)
);

-- Índices para dificuldades
CREATE INDEX IF NOT EXISTS idx_dificuldades_usuario ON estudante_dificuldades(usuario_id);
CREATE INDEX IF NOT EXISTS idx_dificuldades_componente ON estudante_dificuldades(componente);
CREATE INDEX IF NOT EXISTS idx_dificuldades_topico ON estudante_dificuldades(topico);
CREATE INDEX IF NOT EXISTS idx_dificuldades_nivel ON estudante_dificuldades(nivel_dificuldade DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. PREFERÊNCIAS DE APRENDIZAGEM
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS estudante_preferencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE UNIQUE,

    -- Estilo de explicação preferido
    prefere_analogias BOOLEAN DEFAULT TRUE,
    prefere_formulas BOOLEAN DEFAULT TRUE,
    prefere_exemplos BOOLEAN DEFAULT TRUE,
    prefere_visual BOOLEAN DEFAULT TRUE,
    prefere_passo_a_passo BOOLEAN DEFAULT TRUE,

    -- Nível de detalhe
    nivel_detalhe VARCHAR(20) DEFAULT 'medio' CHECK (nivel_detalhe IN ('minimo', 'medio', 'maximo')),

    -- Tom da conversa
    tom_conversa VARCHAR(20) DEFAULT 'amigavel' CHECK (tom_conversa IN ('formal', 'amigavel', 'descontraido')),

    -- Velocidade de explicação
    velocidade VARCHAR(20) DEFAULT 'normal' CHECK (velocidade IN ('lento', 'normal', 'rapido')),

    -- Idioma/Região
    usar_exemplos_brasileiros BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para preferências
CREATE INDEX IF NOT EXISTS idx_preferencias_usuario ON estudante_preferencias(usuario_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. ESTADO EMOCIONAL / ENGAJAMENTO
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS estudante_estado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    sessao_id UUID REFERENCES ia_sessoes(id) ON DELETE SET NULL,
    componente VARCHAR(20) NOT NULL CHECK (componente IN ('fisica', 'matematica')),

    -- Níveis (1-10)
    nivel_engajamento INTEGER DEFAULT 5 CHECK (nivel_engajamento >= 1 AND nivel_engajamento <= 10),
    nivel_frustacao INTEGER DEFAULT 1 CHECK (nivel_frustacao >= 1 AND nivel_frustacao <= 10),
    nivel_confianca INTEGER DEFAULT 5 CHECK (nivel_confianca >= 1 AND nivel_confianca <= 10),

    -- Flags
    precisa_motivacao BOOLEAN DEFAULT FALSE,
    modo_passivo BOOLEAN DEFAULT FALSE, -- Estudante não está interagindo

    -- Sequências
    sequencia_acertos INTEGER DEFAULT 0,
    sequencia_erros INTEGER DEFAULT 0,

    -- Timestamps
    ultimo_acerto TIMESTAMPTZ,
    ultimo_erro TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(usuario_id, componente)
);

-- Índices para estado
CREATE INDEX IF NOT EXISTS idx_estado_usuario ON estudante_estado(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estado_componente ON estudante_estado(componente);
CREATE INDEX IF NOT EXISTS idx_estado_frustacao ON estudante_estado(nivel_frustacao DESC) WHERE nivel_frustacao >= 7;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. FEEDBACK DO ESTUDANTE SOBRE RESPOSTAS DA IA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ia_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensagem_id UUID REFERENCES ia_mensagens(id) ON DELETE CASCADE,

    -- Avaliação
    util BOOLEAN, -- A resposta foi útil?
    clareza INTEGER CHECK (clareza >= 1 AND clareza <= 5), -- 1-5 estrelas
    precisao INTEGER CHECK (precisao >= 1 AND precisao <= 5), -- 1-5 estrelas

    -- Comentário opcional
    comentario TEXT,

    -- Tipo de problema (se houver)
    tipo_problema VARCHAR(50) CHECK (tipo_problema IN (
        'incorreto', 'confuso', 'incompleto', 'muito_longo', 'muito_curto', 'outro'
    )),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para feedback
CREATE INDEX IF NOT EXISTS idx_feedback_usuario ON ia_feedback(usuario_id);
CREATE INDEX IF NOT EXISTS idx_feedback_mensagem ON ia_feedback(mensagem_id);
CREATE INDEX IF NOT EXISTS idx_feedback_util ON ia_feedback(util);

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. VIEWS ÚTEIS
-- ═══════════════════════════════════════════════════════════════════════════

-- View: Perfil completo do estudante para IA
CREATE OR REPLACE VIEW v_estudante_perfil_ia AS
SELECT
    u.id,
    u.nome,
    u.turma,
    u.email,
    -- Notas atuais
    COALESCE(nf.nota_total, 0) as nota_fisica,
    COALESCE(nm.nota_total, 0) as nota_matematica,
    -- Preferências
    p.prefere_analogias,
    p.prefere_formulas,
    p.prefere_exemplos,
    p.prefere_visual,
    p.prefere_passo_a_passo,
    p.nivel_detalhe,
    p.tom_conversa,
    p.velocidade,
    -- Estado emocional (Física)
    ef.nivel_engajamento as engajamento_fisica,
    ef.nivel_frustacao as frustacao_fisica,
    ef.precisa_motivacao as motivacao_fisica,
    ef.sequencia_erros as erros_consecutivos_fisica,
    -- Estado emocional (Matemática)
    em.nivel_engajamento as engajamento_matematica,
    em.nivel_frustacao as frustacao_matematica,
    em.precisa_motivacao as motivacao_matematica,
    em.sequencia_erros as erros_consecutivos_matematica,
    -- Estatísticas de uso
    u.fis_uso_ia_hoje,
    u.mat_uso_ia_hoje,
    -- Dificuldades principais (JSON)
    (
        SELECT json_agg(json_build_object(
            'componente', d.componente,
            'topico', d.topico,
            'nivel', d.nivel_dificuldade,
            'taxa_acerto', d.taxa_acerto
        ))
        FROM estudante_dificuldades d
        WHERE d.usuario_id = u.id
        AND d.nivel_dificuldade >= 4
        ORDER BY d.nivel_dificuldade DESC
        LIMIT 5
    ) as dificuldades_principais
FROM usuarios u
LEFT JOIN estudante_preferencias p ON u.id = p.usuario_id
LEFT JOIN estudante_estado ef ON u.id = ef.usuario_id AND ef.componente = 'fisica'
LEFT JOIN estudante_estado em ON u.id = em.usuario_id AND em.componente = 'matematica'
LEFT JOIN notas nf ON u.id = nf.usuario_id AND nf.componente = 'fisica' AND nf.ano_letivo = EXTRACT(YEAR FROM NOW())
LEFT JOIN notas nm ON u.id = nm.usuario_id AND nm.componente = 'matematica' AND nm.ano_letivo = EXTRACT(YEAR FROM NOW())
WHERE u.tipo = 'estudante';

-- View: Contexto recente da conversa (últimas 2 horas)
CREATE OR REPLACE VIEW v_contexto_recente AS
SELECT
    usuario_id,
    componente,
    json_agg(
        json_build_object(
            'role', role,
            'content', content,
            'modo', modo,
            'topico', topico,
            'created_at', created_at
        ) ORDER BY created_at
    ) as mensagens_recentes,
    COUNT(*) as total_mensagens
FROM ia_mensagens
WHERE created_at > NOW() - INTERVAL '2 hours'
GROUP BY usuario_id, componente;

-- View: Estatísticas de uso da IA por estudante
CREATE OR REPLACE VIEW v_estatisticas_ia AS
SELECT
    u.id as usuario_id,
    u.nome,
    u.turma,
    COUNT(DISTINCT s.id) as total_sessoes,
    COUNT(m.id) as total_mensagens,
    COUNT(DISTINCT mm.id) as mapas_mentais_criados,
    COUNT(DISTINCT r.id) as resolucoes_passo_a_passo,
    AVG(s.satisfacao) as satisfacao_media,
    -- Modos mais usados
    (
        SELECT modo FROM ia_mensagens
        WHERE usuario_id = u.id AND role = 'assistant' AND modo IS NOT NULL
        GROUP BY modo ORDER BY COUNT(*) DESC LIMIT 1
    ) as modo_mais_usado,
    -- Tópico mais estudado
    (
        SELECT topico FROM ia_mensagens
        WHERE usuario_id = u.id AND topico IS NOT NULL
        GROUP BY topico ORDER BY COUNT(*) DESC LIMIT 1
    ) as topico_mais_estudado
FROM usuarios u
LEFT JOIN ia_sessoes s ON u.id = s.usuario_id
LEFT JOIN ia_mensagens m ON u.id = m.usuario_id
LEFT JOIN ia_mapas_mentais mm ON u.id = mm.usuario_id
LEFT JOIN ia_resolucoes r ON u.id = r.usuario_id
WHERE u.tipo = 'estudante'
GROUP BY u.id, u.nome, u.turma;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. FUNÇÕES AUXILIARES
-- ═══════════════════════════════════════════════════════════════════════════

-- Função: Atualizar estado do estudante após resposta
CREATE OR REPLACE FUNCTION atualizar_estado_estudante(
    p_usuario_id UUID,
    p_componente VARCHAR(20),
    p_acertou BOOLEAN
) RETURNS VOID AS $$
BEGIN
    -- Inserir ou atualizar estado
    INSERT INTO estudante_estado (usuario_id, componente, nivel_engajamento, nivel_frustacao, sequencia_acertos, sequencia_erros, ultimo_acerto, ultimo_erro)
    VALUES (p_usuario_id, p_componente, 5, 1, 0, 0, NULL, NULL)
    ON CONFLICT (usuario_id, componente) DO UPDATE SET
        nivel_engajamento = CASE
            WHEN p_acertou THEN LEAST(10, estudante_estado.nivel_engajamento + 1)
            ELSE GREATEST(1, estudante_estado.nivel_engajamento - 1)
        END,
        nivel_frustacao = CASE
            WHEN p_acertou THEN GREATEST(1, estudante_estado.nivel_frustacao - 1)
            ELSE LEAST(10, estudante_estado.nivel_frustacao + 1)
        END,
        sequencia_acertos = CASE WHEN p_acertou THEN estudante_estado.sequencia_acertos + 1 ELSE 0 END,
        sequencia_erros = CASE WHEN NOT p_acertou THEN estudante_estado.sequencia_erros + 1 ELSE 0 END,
        ultimo_acerto = CASE WHEN p_acertou THEN NOW() ELSE estudante_estado.ultimo_acerto END,
        ultimo_erro = CASE WHEN NOT p_acertou THEN NOW() ELSE estudante_estado.ultimo_erro END,
        precisa_motivacao = CASE WHEN NOT p_acertou AND estudante_estado.sequencia_erros >= 2 THEN TRUE ELSE FALSE END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Função: Atualizar dificuldade em tópico
CREATE OR REPLACE FUNCTION atualizar_dificuldade_topico(
    p_usuario_id UUID,
    p_componente VARCHAR(20),
    p_topico VARCHAR(100),
    p_acertou BOOLEAN
) RETURNS VOID AS $$
DECLARE
    v_novo_nivel INTEGER;
BEGIN
    -- Inserir ou atualizar dificuldade
    INSERT INTO estudante_dificuldades (usuario_id, componente, topico, acertos_total, erros_total, erros_consecutivos)
    VALUES (p_usuario_id, p_componente, p_topico,
        CASE WHEN p_acertou THEN 1 ELSE 0 END,
        CASE WHEN NOT p_acertou THEN 1 ELSE 0 END,
        CASE WHEN NOT p_acertou THEN 1 ELSE 0 END
    )
    ON CONFLICT (usuario_id, componente, topico, subtopico) DO UPDATE SET
        acertos_total = estudante_dificuldades.acertos_total + CASE WHEN p_acertou THEN 1 ELSE 0 END,
        erros_total = estudante_dificuldades.erros_total + CASE WHEN NOT p_acertou THEN 1 ELSE 0 END,
        erros_consecutivos = CASE
            WHEN p_acertou THEN 0
            ELSE estudante_dificuldades.erros_consecutivos + 1
        END,
        ultima_interacao = NOW(),
        updated_at = NOW();

    -- Recalcular nível de dificuldade baseado na taxa de acerto
    UPDATE estudante_dificuldades
    SET nivel_dificuldade = CASE
        WHEN taxa_acerto >= 80 THEN 1  -- Fácil
        WHEN taxa_acerto >= 60 THEN 2  -- Normal
        WHEN taxa_acerto >= 40 THEN 3  -- Médio
        WHEN taxa_acerto >= 20 THEN 4  -- Difícil
        ELSE 5                          -- Muito Difícil
    END
    WHERE usuario_id = p_usuario_id
    AND componente = p_componente
    AND topico = p_topico;
END;
$$ LANGUAGE plpgsql;

-- Função: Iniciar nova sessão de IA
CREATE OR REPLACE FUNCTION iniciar_sessao_ia(
    p_usuario_id UUID,
    p_componente VARCHAR(20)
) RETURNS UUID AS $$
DECLARE
    v_sessao_id UUID;
BEGIN
    -- Finalizar sessões anteriores abertas
    UPDATE ia_sessoes
    SET fim = NOW(), updated_at = NOW()
    WHERE usuario_id = p_usuario_id
    AND componente = p_componente
    AND fim IS NULL;

    -- Criar nova sessão
    INSERT INTO ia_sessoes (usuario_id, componente)
    VALUES (p_usuario_id, p_componente)
    RETURNING id INTO v_sessao_id;

    RETURN v_sessao_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Finalizar sessão de IA
CREATE OR REPLACE FUNCTION finalizar_sessao_ia(
    p_sessao_id UUID,
    p_satisfacao INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE ia_sessoes
    SET
        fim = NOW(),
        satisfacao = p_satisfacao,
        msgs_trocadas = (SELECT COUNT(*) FROM ia_mensagens WHERE sessao_id = p_sessao_id),
        updated_at = NOW()
    WHERE id = p_sessao_id;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Trigger: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas com updated_at
DO $$
BEGIN
    -- ia_sessoes
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_ia_sessoes') THEN
        CREATE TRIGGER set_updated_at_ia_sessoes
        BEFORE UPDATE ON ia_sessoes
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    END IF;

    -- ia_mapas_mentais
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_ia_mapas') THEN
        CREATE TRIGGER set_updated_at_ia_mapas
        BEFORE UPDATE ON ia_mapas_mentais
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    END IF;

    -- estudante_dificuldades
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_dificuldades') THEN
        CREATE TRIGGER set_updated_at_dificuldades
        BEFORE UPDATE ON estudante_dificuldades
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    END IF;

    -- estudante_preferencias
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_preferencias') THEN
        CREATE TRIGGER set_updated_at_preferencias
        BEFORE UPDATE ON estudante_preferencias
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    END IF;

    -- estudante_estado
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_estado') THEN
        CREATE TRIGGER set_updated_at_estado
        BEFORE UPDATE ON estudante_estado
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. POLÍTICAS RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════════════════

-- Habilitar RLS nas tabelas
ALTER TABLE ia_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_mapas_mentais ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_resolucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudante_dificuldades ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudante_preferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE estudante_estado ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas para estudantes (podem ver apenas seus próprios dados)
CREATE POLICY IF NOT EXISTS "Estudantes veem suas sessoes" ON ia_sessoes
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY IF NOT EXISTS "Estudantes veem suas mensagens" ON ia_mensagens
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY IF NOT EXISTS "Estudantes veem seus mapas" ON ia_mapas_mentais
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY IF NOT EXISTS "Estudantes veem suas resolucoes" ON ia_resolucoes
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY IF NOT EXISTS "Estudantes veem suas dificuldades" ON estudante_dificuldades
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY IF NOT EXISTS "Estudantes gerenciam preferencias" ON estudante_preferencias
    FOR ALL USING (auth.uid() = usuario_id);

CREATE POLICY IF NOT EXISTS "Estudantes veem seu estado" ON estudante_estado
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY IF NOT EXISTS "Estudantes enviam feedback" ON ia_feedback
    FOR ALL USING (auth.uid() = usuario_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. DADOS INICIAIS / SEED
-- ═══════════════════════════════════════════════════════════════════════════

-- Inserir preferências padrão para estudantes existentes que não têm
INSERT INTO estudante_preferencias (usuario_id)
SELECT id FROM usuarios
WHERE tipo = 'estudante'
AND id NOT IN (SELECT usuario_id FROM estudante_preferencias)
ON CONFLICT DO NOTHING;

-- Inserir estado inicial para estudantes existentes
INSERT INTO estudante_estado (usuario_id, componente)
SELECT u.id, c.componente
FROM usuarios u
CROSS JOIN (VALUES ('fisica'), ('matematica')) AS c(componente)
WHERE u.tipo = 'estudante'
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- COMENTÁRIOS DAS TABELAS
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE ia_sessoes IS 'Sessões de estudo com a IA Tutor';
COMMENT ON TABLE ia_mensagens IS 'Histórico de mensagens trocadas com a IA';
COMMENT ON TABLE ia_mapas_mentais IS 'Mapas mentais gerados pela IA para revisão';
COMMENT ON TABLE ia_resolucoes IS 'Resoluções passo a passo de questões';
COMMENT ON TABLE estudante_dificuldades IS 'Mapeamento de dificuldades por tópico';
COMMENT ON TABLE estudante_preferencias IS 'Preferências de aprendizagem do estudante';
COMMENT ON TABLE estudante_estado IS 'Estado emocional e engajamento do estudante';
COMMENT ON TABLE ia_feedback IS 'Feedback dos estudantes sobre respostas da IA';

-- ═══════════════════════════════════════════════════════════════════════════
-- FIM DA MIGRAÇÃO
-- ═══════════════════════════════════════════════════════════════════════════
