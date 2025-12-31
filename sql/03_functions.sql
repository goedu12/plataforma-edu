-- ═══════════════════════════════════════════════════════════════════════════
-- PLATAFORMA EDUCACIONAL - FUNÇÕES E TRIGGERS
-- Colégio Estadual Cora Coralina
-- Versão: 1.0
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Atualizar nível baseado em pontos
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION calcular_nivel(pontos INTEGER)
RETURNS VARCHAR(30) AS $$
BEGIN
    RETURN CASE
        WHEN pontos >= 6000 THEN 'Gênio'
        WHEN pontos >= 4000 THEN 'Mestre'
        WHEN pontos >= 2500 THEN 'Expert'
        WHEN pontos >= 1500 THEN 'Avançado'
        WHEN pontos >= 1000 THEN 'Dedicado'
        WHEN pontos >= 600 THEN 'Estudioso'
        WHEN pontos >= 300 THEN 'Aprendiz'
        WHEN pontos >= 100 THEN 'Curioso'
        ELSE 'Iniciante'
    END;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Calcular pontos por resposta
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION calcular_pontos_resposta(
    p_correta BOOLEAN,
    p_usou_dica BOOLEAN,
    p_tempo_segundos INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    pontos INTEGER := 0;
BEGIN
    IF p_correta THEN
        IF p_usou_dica THEN
            pontos := 5;
        ELSE
            pontos := 10;
        END IF;

        -- Bônus de velocidade (< 30 segundos)
        IF p_tempo_segundos < 30 THEN
            pontos := pontos + 2;
        END IF;
    END IF;

    RETURN pontos;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Registrar resposta e atualizar progresso
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION registrar_resposta(
    p_usuario_id UUID,
    p_questao_id UUID,
    p_componente VARCHAR(15),
    p_resposta_dada CHAR(1),
    p_tempo_segundos INTEGER,
    p_usou_dica BOOLEAN
)
RETURNS TABLE(
    correta BOOLEAN,
    pontos_ganhos INTEGER,
    explicacao TEXT,
    novo_nivel VARCHAR(30),
    nova_pontuacao INTEGER
) AS $$
DECLARE
    v_resposta_correta CHAR(1);
    v_explicacao TEXT;
    v_correta BOOLEAN;
    v_pontos INTEGER;
    v_nivel VARCHAR(30);
    v_pontos_atuais INTEGER;
    v_pontos_novos INTEGER;
    v_data_hoje DATE := CURRENT_DATE;
    v_ultimo_estudo DATE;
    v_sequencia INTEGER;
BEGIN
    -- Buscar dados da questão
    SELECT resposta_correta, q.explicacao
    INTO v_resposta_correta, v_explicacao
    FROM questoes q
    WHERE q.id = p_questao_id;

    -- Verificar se acertou
    v_correta := (UPPER(p_resposta_dada) = v_resposta_correta);

    -- Calcular pontos
    v_pontos := calcular_pontos_resposta(v_correta, p_usou_dica, p_tempo_segundos);

    -- Inserir resposta
    INSERT INTO respostas (usuario_id, questao_id, componente, resposta_dada, correta, tempo_segundos, usou_dica, pontos_ganhos)
    VALUES (p_usuario_id, p_questao_id, p_componente, UPPER(p_resposta_dada), v_correta, p_tempo_segundos, p_usou_dica, v_pontos);

    -- Atualizar progresso do usuário baseado no componente
    IF p_componente = 'fisica' THEN
        -- Buscar dados atuais
        SELECT fis_pontos, fis_ultimo_estudo, fis_sequencia_dias
        INTO v_pontos_atuais, v_ultimo_estudo, v_sequencia
        FROM usuarios WHERE id = p_usuario_id;

        -- Calcular nova sequência
        IF v_ultimo_estudo IS NULL OR v_ultimo_estudo < v_data_hoje - 1 THEN
            v_sequencia := 1;
        ELSIF v_ultimo_estudo = v_data_hoje - 1 THEN
            v_sequencia := v_sequencia + 1;
        END IF;

        -- Bônus de sequência de 7 dias
        IF v_sequencia = 7 THEN
            v_pontos := v_pontos + 50;
        END IF;

        v_pontos_novos := v_pontos_atuais + v_pontos;
        v_nivel := calcular_nivel(v_pontos_novos);

        UPDATE usuarios SET
            fis_pontos = v_pontos_novos,
            fis_questoes_total = fis_questoes_total + 1,
            fis_questoes_corretas = fis_questoes_corretas + CASE WHEN v_correta THEN 1 ELSE 0 END,
            fis_nivel = v_nivel,
            fis_ultimo_estudo = v_data_hoje,
            fis_sequencia_dias = v_sequencia
        WHERE id = p_usuario_id;

    ELSE -- matematica
        SELECT mat_pontos, mat_ultimo_estudo, mat_sequencia_dias
        INTO v_pontos_atuais, v_ultimo_estudo, v_sequencia
        FROM usuarios WHERE id = p_usuario_id;

        IF v_ultimo_estudo IS NULL OR v_ultimo_estudo < v_data_hoje - 1 THEN
            v_sequencia := 1;
        ELSIF v_ultimo_estudo = v_data_hoje - 1 THEN
            v_sequencia := v_sequencia + 1;
        END IF;

        IF v_sequencia = 7 THEN
            v_pontos := v_pontos + 50;
        END IF;

        v_pontos_novos := v_pontos_atuais + v_pontos;
        v_nivel := calcular_nivel(v_pontos_novos);

        UPDATE usuarios SET
            mat_pontos = v_pontos_novos,
            mat_questoes_total = mat_questoes_total + 1,
            mat_questoes_corretas = mat_questoes_corretas + CASE WHEN v_correta THEN 1 ELSE 0 END,
            mat_nivel = v_nivel,
            mat_ultimo_estudo = v_data_hoje,
            mat_sequencia_dias = v_sequencia
        WHERE id = p_usuario_id;
    END IF;

    RETURN QUERY SELECT v_correta, v_pontos, v_explicacao, v_nivel, v_pontos_novos;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Obter próxima questão não respondida
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION obter_proxima_questao(
    p_usuario_id UUID,
    p_componente VARCHAR(15),
    p_ano INTEGER
)
RETURNS TABLE(
    id UUID,
    tema VARCHAR(100),
    subtema VARCHAR(100),
    dificuldade VARCHAR(10),
    enunciado TEXT,
    alternativa_a TEXT,
    alternativa_b TEXT,
    alternativa_c TEXT,
    alternativa_d TEXT,
    dica TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        q.tema,
        q.subtema,
        q.dificuldade,
        q.enunciado,
        q.alternativa_a,
        q.alternativa_b,
        q.alternativa_c,
        q.alternativa_d,
        q.dica
    FROM questoes q
    WHERE q.componente = p_componente
      AND q.ano = p_ano
      AND q.status = 'ativa'
      AND NOT EXISTS (
          SELECT 1 FROM respostas r
          WHERE r.questao_id = q.id
            AND r.usuario_id = p_usuario_id
      )
    ORDER BY
        CASE q.dificuldade
            WHEN 'facil' THEN 1
            WHEN 'medio' THEN 2
            WHEN 'dificil' THEN 3
        END,
        RANDOM()
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Verificar e incrementar uso da IA
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION verificar_uso_ia(
    p_usuario_id UUID,
    p_componente VARCHAR(15)
)
RETURNS TABLE(
    permitido BOOLEAN,
    uso_atual INTEGER,
    limite INTEGER
) AS $$
DECLARE
    v_uso_hoje INTEGER;
    v_data_uso DATE;
    v_limite INTEGER := 5;
    v_data_hoje DATE := CURRENT_DATE;
BEGIN
    IF p_componente = 'fisica' THEN
        SELECT fis_uso_ia_hoje, fis_data_uso_ia
        INTO v_uso_hoje, v_data_uso
        FROM usuarios WHERE id = p_usuario_id;
    ELSE
        SELECT mat_uso_ia_hoje, mat_data_uso_ia
        INTO v_uso_hoje, v_data_uso
        FROM usuarios WHERE id = p_usuario_id;
    END IF;

    -- Resetar contador se for um novo dia
    IF v_data_uso IS NULL OR v_data_uso < v_data_hoje THEN
        v_uso_hoje := 0;
    END IF;

    -- Verificar se pode usar
    IF v_uso_hoje < v_limite THEN
        -- Incrementar uso
        IF p_componente = 'fisica' THEN
            UPDATE usuarios SET
                fis_uso_ia_hoje = v_uso_hoje + 1,
                fis_data_uso_ia = v_data_hoje
            WHERE id = p_usuario_id;
        ELSE
            UPDATE usuarios SET
                mat_uso_ia_hoje = v_uso_hoje + 1,
                mat_data_uso_ia = v_data_hoje
            WHERE id = p_usuario_id;
        END IF;

        RETURN QUERY SELECT TRUE, v_uso_hoje + 1, v_limite;
    ELSE
        RETURN QUERY SELECT FALSE, v_uso_hoje, v_limite;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Verificar e desbloquear conquistas
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION verificar_conquistas(
    p_usuario_id UUID,
    p_componente VARCHAR(15)
)
RETURNS TABLE(
    conquista_id UUID,
    nome VARCHAR(100),
    descricao TEXT,
    icone VARCHAR(10)
) AS $$
DECLARE
    v_pontos INTEGER;
    v_questoes INTEGER;
    v_sequencia INTEGER;
    v_taxa_acerto NUMERIC;
BEGIN
    -- Buscar dados do usuário
    IF p_componente = 'fisica' THEN
        SELECT fis_pontos, fis_questoes_total, fis_sequencia_dias,
               CASE WHEN fis_questoes_total > 0
                    THEN (fis_questoes_corretas::numeric / fis_questoes_total) * 100
                    ELSE 0 END
        INTO v_pontos, v_questoes, v_sequencia, v_taxa_acerto
        FROM usuarios WHERE id = p_usuario_id;
    ELSE
        SELECT mat_pontos, mat_questoes_total, mat_sequencia_dias,
               CASE WHEN mat_questoes_total > 0
                    THEN (mat_questoes_corretas::numeric / mat_questoes_total) * 100
                    ELSE 0 END
        INTO v_pontos, v_questoes, v_sequencia, v_taxa_acerto
        FROM usuarios WHERE id = p_usuario_id;
    END IF;

    -- Retornar conquistas que podem ser desbloqueadas
    RETURN QUERY
    SELECT c.id, c.nome, c.descricao, c.icone
    FROM conquistas c
    WHERE (c.componente IS NULL OR c.componente = p_componente)
      AND NOT EXISTS (
          SELECT 1 FROM conquistas_usuarios cu
          WHERE cu.conquista_id = c.id
            AND cu.usuario_id = p_usuario_id
            AND cu.componente = p_componente
      )
      AND (
          (c.requisito_tipo = 'pontos' AND v_pontos >= c.requisito_valor) OR
          (c.requisito_tipo = 'questoes' AND v_questoes >= c.requisito_valor) OR
          (c.requisito_tipo = 'sequencia' AND v_sequencia >= c.requisito_valor) OR
          (c.requisito_tipo = 'acertos' AND v_taxa_acerto >= c.requisito_valor AND v_questoes >= 20)
      );
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Desbloquear conquista
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION desbloquear_conquista(
    p_usuario_id UUID,
    p_conquista_id UUID,
    p_componente VARCHAR(15)
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO conquistas_usuarios (usuario_id, conquista_id, componente)
    VALUES (p_usuario_id, p_conquista_id, p_componente)
    ON CONFLICT (usuario_id, conquista_id, componente) DO NOTHING;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Obter ranking por turma
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION obter_ranking(
    p_componente VARCHAR(15),
    p_turma VARCHAR(10)
)
RETURNS TABLE(
    posicao BIGINT,
    usuario_id UUID,
    nome VARCHAR(100),
    pontos INTEGER,
    nivel VARCHAR(30),
    questoes_total INTEGER,
    taxa_acerto INTEGER
) AS $$
BEGIN
    IF p_componente = 'fisica' THEN
        RETURN QUERY
        SELECT
            ROW_NUMBER() OVER (ORDER BY u.fis_pontos DESC) as posicao,
            u.id as usuario_id,
            u.nome,
            u.fis_pontos as pontos,
            u.fis_nivel as nivel,
            u.fis_questoes_total as questoes_total,
            CASE
                WHEN u.fis_questoes_total > 0
                THEN ROUND((u.fis_questoes_corretas::numeric / u.fis_questoes_total) * 100)::integer
                ELSE 0
            END as taxa_acerto
        FROM usuarios u
        WHERE u.turma = p_turma
          AND u.tipo = 'estudante'
          AND u.ativo = true
          AND 'fisica' = ANY(u.componentes)
        ORDER BY u.fis_pontos DESC;
    ELSE
        RETURN QUERY
        SELECT
            ROW_NUMBER() OVER (ORDER BY u.mat_pontos DESC) as posicao,
            u.id as usuario_id,
            u.nome,
            u.mat_pontos as pontos,
            u.mat_nivel as nivel,
            u.mat_questoes_total as questoes_total,
            CASE
                WHEN u.mat_questoes_total > 0
                THEN ROUND((u.mat_questoes_corretas::numeric / u.mat_questoes_total) * 100)::integer
                ELSE 0
            END as taxa_acerto
        FROM usuarios u
        WHERE u.turma = p_turma
          AND u.tipo = 'estudante'
          AND u.ativo = true
          AND 'matematica' = ANY(u.componentes)
        ORDER BY u.mat_pontos DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Estatísticas do professor
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION obter_estatisticas_professor()
RETURNS TABLE(
    componente VARCHAR(15),
    total_estudantes BIGINT,
    total_respostas BIGINT,
    taxa_acerto NUMERIC,
    ativos_semana BIGINT,
    media_pontos NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    -- Estatísticas de Física
    SELECT
        'fisica'::VARCHAR(15) as componente,
        COUNT(*) FILTER (WHERE 'fisica' = ANY(componentes)) as total_estudantes,
        COALESCE(SUM(fis_questoes_total) FILTER (WHERE 'fisica' = ANY(componentes)), 0) as total_respostas,
        CASE
            WHEN SUM(fis_questoes_total) FILTER (WHERE 'fisica' = ANY(componentes)) > 0
            THEN ROUND((SUM(fis_questoes_corretas) FILTER (WHERE 'fisica' = ANY(componentes))::numeric /
                        SUM(fis_questoes_total) FILTER (WHERE 'fisica' = ANY(componentes))) * 100, 1)
            ELSE 0
        END as taxa_acerto,
        COUNT(*) FILTER (WHERE fis_ultimo_estudo >= CURRENT_DATE - 7 AND 'fisica' = ANY(componentes)) as ativos_semana,
        COALESCE(ROUND(AVG(fis_pontos) FILTER (WHERE 'fisica' = ANY(componentes)), 1), 0) as media_pontos
    FROM usuarios
    WHERE tipo = 'estudante' AND ativo = true

    UNION ALL

    -- Estatísticas de Matemática
    SELECT
        'matematica'::VARCHAR(15) as componente,
        COUNT(*) FILTER (WHERE 'matematica' = ANY(componentes)) as total_estudantes,
        COALESCE(SUM(mat_questoes_total) FILTER (WHERE 'matematica' = ANY(componentes)), 0) as total_respostas,
        CASE
            WHEN SUM(mat_questoes_total) FILTER (WHERE 'matematica' = ANY(componentes)) > 0
            THEN ROUND((SUM(mat_questoes_corretas) FILTER (WHERE 'matematica' = ANY(componentes))::numeric /
                        SUM(mat_questoes_total) FILTER (WHERE 'matematica' = ANY(componentes))) * 100, 1)
            ELSE 0
        END as taxa_acerto,
        COUNT(*) FILTER (WHERE mat_ultimo_estudo >= CURRENT_DATE - 7 AND 'matematica' = ANY(componentes)) as ativos_semana,
        COALESCE(ROUND(AVG(mat_pontos) FILTER (WHERE 'matematica' = ANY(componentes)), 1), 0) as media_pontos
    FROM usuarios
    WHERE tipo = 'estudante' AND ativo = true;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- FUNÇÃO: Obter alertas de estudantes
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION obter_alertas_estudantes()
RETURNS TABLE(
    usuario_id UUID,
    nome VARCHAR(100),
    turma VARCHAR(10),
    componente VARCHAR(15),
    tipo_alerta VARCHAR(20),
    descricao TEXT
) AS $$
BEGIN
    -- Inativos há mais de 7 dias
    RETURN QUERY
    SELECT
        u.id,
        u.nome,
        u.turma,
        'fisica'::VARCHAR(15),
        'inativo'::VARCHAR(20),
        ('Inativo há ' || (CURRENT_DATE - u.fis_ultimo_estudo) || ' dias')::TEXT
    FROM usuarios u
    WHERE u.tipo = 'estudante'
      AND u.ativo = true
      AND 'fisica' = ANY(u.componentes)
      AND u.fis_ultimo_estudo < CURRENT_DATE - 7

    UNION ALL

    SELECT
        u.id,
        u.nome,
        u.turma,
        'matematica'::VARCHAR(15),
        'inativo'::VARCHAR(20),
        ('Inativo há ' || (CURRENT_DATE - u.mat_ultimo_estudo) || ' dias')::TEXT
    FROM usuarios u
    WHERE u.tipo = 'estudante'
      AND u.ativo = true
      AND 'matematica' = ANY(u.componentes)
      AND u.mat_ultimo_estudo < CURRENT_DATE - 7

    UNION ALL

    -- Baixo desempenho (< 40% de acerto com 10+ questões)
    SELECT
        u.id,
        u.nome,
        u.turma,
        'fisica'::VARCHAR(15),
        'baixo_desempenho'::VARCHAR(20),
        ('Taxa de acerto: ' || ROUND((u.fis_questoes_corretas::numeric / u.fis_questoes_total) * 100) || '%')::TEXT
    FROM usuarios u
    WHERE u.tipo = 'estudante'
      AND u.ativo = true
      AND 'fisica' = ANY(u.componentes)
      AND u.fis_questoes_total >= 10
      AND (u.fis_questoes_corretas::numeric / u.fis_questoes_total) < 0.4

    UNION ALL

    SELECT
        u.id,
        u.nome,
        u.turma,
        'matematica'::VARCHAR(15),
        'baixo_desempenho'::VARCHAR(20),
        ('Taxa de acerto: ' || ROUND((u.mat_questoes_corretas::numeric / u.mat_questoes_total) * 100) || '%')::TEXT
    FROM usuarios u
    WHERE u.tipo = 'estudante'
      AND u.ativo = true
      AND 'matematica' = ANY(u.componentes)
      AND u.mat_questoes_total >= 10
      AND (u.mat_questoes_corretas::numeric / u.mat_questoes_total) < 0.4

    ORDER BY tipo_alerta, turma, nome;
END;
$$ LANGUAGE plpgsql;
