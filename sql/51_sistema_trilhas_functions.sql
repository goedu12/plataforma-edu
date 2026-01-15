-- ============================================================================
-- 51_SISTEMA_TRILHAS_FUNCTIONS.SQL
-- Funcoes para o Sistema de Trilhas
--
-- PONTO DE RESTAURACAO: tag v1.0-pre-trilhas
-- Criado em: 2025-01-15
-- ============================================================================

-- ============================================================================
-- 1. FUNCAO: INICIAR TRILHA
-- Inicia uma nova trilha para o usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION iniciar_trilha(
    p_usuario_id UUID,
    p_trilha_id VARCHAR(50),
    p_serie VARCHAR(10),
    p_data_prova DATE DEFAULT NULL,
    p_temas_prova TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trilha trilhas%ROWTYPE;
    v_usuario_trilha_id BIGINT;
    v_ja_existe BOOLEAN;
BEGIN
    -- Validar trilha
    SELECT * INTO v_trilha FROM trilhas WHERE id = p_trilha_id AND ativa = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'erro', 'Trilha não encontrada ou inativa'
        );
    END IF;

    -- Verificar se ja existe trilha ativa para essa serie
    SELECT EXISTS(
        SELECT 1 FROM usuario_trilha
        WHERE usuario_id = p_usuario_id
            AND serie = p_serie
            AND ativa = TRUE
    ) INTO v_ja_existe;

    -- Pausar trilhas anteriores da mesma serie
    UPDATE usuario_trilha
    SET ativa = FALSE,
        pausada_em = NOW()
    WHERE usuario_id = p_usuario_id
        AND serie = p_serie
        AND ativa = TRUE;

    -- Criar ou reativar trilha
    INSERT INTO usuario_trilha (
        usuario_id,
        trilha_id,
        serie,
        ativa,
        iniciada_em,
        semana_atual,
        data_prova,
        temas_prova
    ) VALUES (
        p_usuario_id,
        p_trilha_id,
        p_serie,
        TRUE,
        NOW(),
        1,
        p_data_prova,
        p_temas_prova
    )
    ON CONFLICT (usuario_id, trilha_id, serie)
    DO UPDATE SET
        ativa = TRUE,
        pausada_em = NULL,
        ultimo_acesso = NOW(),
        updated_at = NOW()
    RETURNING id INTO v_usuario_trilha_id;

    -- Desbloquear primeira semana
    INSERT INTO progresso_semanal (
        usuario_id,
        trilha_id,
        serie,
        semana,
        status,
        desbloqueada_em
    ) VALUES (
        p_usuario_id,
        p_trilha_id,
        p_serie,
        1,
        'disponivel',
        NOW()
    )
    ON CONFLICT (usuario_id, trilha_id, serie, semana, ano_letivo)
    DO UPDATE SET
        status = CASE
            WHEN progresso_semanal.status = 'bloqueada' THEN 'disponivel'
            ELSE progresso_semanal.status
        END,
        desbloqueada_em = COALESCE(progresso_semanal.desbloqueada_em, NOW());

    RETURN jsonb_build_object(
        'sucesso', TRUE,
        'trilha_id', v_trilha.id,
        'trilha_nome', v_trilha.nome,
        'trilha_icone', v_trilha.icone,
        'serie', p_serie,
        'semana_inicial', 1,
        'mensagem', 'Trilha ' || v_trilha.nome || ' iniciada! Boa sorte! 🚀'
    );
END;
$$;

COMMENT ON FUNCTION iniciar_trilha IS 'Inicia ou reativa uma trilha para o usuario';

-- ============================================================================
-- 2. FUNCAO: BUSCAR QUESTOES DA SEMANA
-- Retorna questoes da semana atual para a trilha do usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION buscar_questoes_semana_trilha(
    p_usuario_id UUID,
    p_serie VARCHAR(10),
    p_semana INTEGER DEFAULT NULL
)
RETURNS TABLE (
    questao_id BIGINT,
    ordem INTEGER,
    tipo_questao VARCHAR(50),
    enunciado TEXT,
    alternativas JSONB,
    dica TEXT,
    dificuldade VARCHAR(20),
    tema VARCHAR(100),
    subtema TEXT,
    contexto VARCHAR(50),
    is_desafio BOOLEAN,
    ja_respondida BOOLEAN,
    resposta_usuario VARCHAR(1),
    acertou BOOLEAN,
    tempo_resposta INTEGER,
    usou_dica BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trilha_id VARCHAR(50);
    v_semana_atual INTEGER;
    v_ano_letivo INTEGER;
BEGIN
    v_ano_letivo := EXTRACT(YEAR FROM NOW())::INTEGER;

    -- Buscar trilha ativa do usuario
    SELECT ut.trilha_id, ut.semana_atual
    INTO v_trilha_id, v_semana_atual
    FROM usuario_trilha ut
    WHERE ut.usuario_id = p_usuario_id
        AND ut.serie = p_serie
        AND ut.ativa = TRUE
    LIMIT 1;

    -- Se nao tem trilha ativa, retornar vazio
    IF v_trilha_id IS NULL THEN
        RETURN;
    END IF;

    -- Usar semana passada ou atual
    IF p_semana IS NOT NULL THEN
        v_semana_atual := p_semana;
    END IF;

    -- Atualizar ultimo acesso
    UPDATE usuario_trilha
    SET ultimo_acesso = NOW()
    WHERE usuario_id = p_usuario_id
        AND trilha_id = v_trilha_id
        AND serie = p_serie;

    -- Retornar questoes
    RETURN QUERY
    SELECT
        q.id AS questao_id,
        q.ordem,
        q.tipo_questao,
        q.enunciado,
        q.alternativas,
        CASE
            WHEN rt.id IS NULL THEN q.dica
            ELSE NULL::TEXT
        END AS dica,
        q.dificuldade,
        q.tema,
        q.subtema,
        q.contexto_cotidiano AS contexto,
        q.is_desafio,
        (rt.id IS NOT NULL) AS ja_respondida,
        rt.resposta_dada AS resposta_usuario,
        rt.correta AS acertou,
        rt.tempo_segundos AS tempo_resposta,
        COALESCE(rt.usou_dica, FALSE) AS usou_dica
    FROM questoes_trilha q
    LEFT JOIN respostas_trilha rt ON (
        rt.questao_id = q.id
        AND rt.usuario_id = p_usuario_id
    )
    WHERE q.serie = p_serie
        AND q.semana = v_semana_atual
        AND q.ano_letivo = v_ano_letivo
        AND q.ativa = TRUE
    ORDER BY q.is_desafio ASC, q.ordem ASC;
END;
$$;

COMMENT ON FUNCTION buscar_questoes_semana_trilha IS 'Retorna questoes da semana atual para a trilha ativa do usuario';

-- ============================================================================
-- 3. FUNCAO: RESPONDER QUESTAO
-- Registra resposta e atualiza progresso
-- ============================================================================

CREATE OR REPLACE FUNCTION responder_questao_trilha(
    p_usuario_id UUID,
    p_questao_id BIGINT,
    p_resposta VARCHAR(1),
    p_tempo_segundos INTEGER DEFAULT 0,
    p_usou_dica BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_questao questoes_trilha%ROWTYPE;
    v_correta BOOLEAN;
    v_pontos INTEGER;
    v_trilha_id VARCHAR(50);
    v_config JSONB;
    v_corretas_semana INTEGER;
    v_total_semana INTEGER;
    v_pode_avancar BOOLEAN;
    v_proxima_semana INTEGER;
    v_feedback JSONB;
    v_ja_respondida BOOLEAN;
    v_acerto_necessario INTEGER;
BEGIN
    -- Buscar questao
    SELECT * INTO v_questao FROM questoes_trilha WHERE id = p_questao_id AND ativa = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'erro', 'Questão não encontrada'
        );
    END IF;

    -- Verificar se ja respondeu
    SELECT EXISTS(
        SELECT 1 FROM respostas_trilha
        WHERE usuario_id = p_usuario_id AND questao_id = p_questao_id
    ) INTO v_ja_respondida;

    IF v_ja_respondida THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'erro', 'Você já respondeu esta questão'
        );
    END IF;

    -- Buscar trilha do usuario
    SELECT ut.trilha_id, t.config
    INTO v_trilha_id, v_config
    FROM usuario_trilha ut
    JOIN trilhas t ON t.id = ut.trilha_id
    WHERE ut.usuario_id = p_usuario_id
        AND ut.serie = v_questao.serie
        AND ut.ativa = TRUE;

    IF v_trilha_id IS NULL THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'erro', 'Você não tem uma trilha ativa para esta série'
        );
    END IF;

    -- Verificar resposta
    v_correta := (UPPER(p_resposta) = UPPER(v_questao.resposta_correta));

    -- Calcular pontos
    v_pontos := CASE
        WHEN v_correta AND NOT p_usou_dica THEN 10
        WHEN v_correta AND p_usou_dica THEN 5
        ELSE 0
    END;

    -- Bonus por velocidade (menos de 30 segundos)
    IF v_correta AND p_tempo_segundos > 0 AND p_tempo_segundos < 30 THEN
        v_pontos := v_pontos + 2;
    END IF;

    -- Registrar resposta
    INSERT INTO respostas_trilha (
        usuario_id,
        questao_id,
        trilha_id,
        resposta_dada,
        correta,
        tempo_segundos,
        usou_dica,
        pontos_ganhos
    ) VALUES (
        p_usuario_id,
        p_questao_id,
        v_trilha_id,
        UPPER(p_resposta),
        v_correta,
        p_tempo_segundos,
        p_usou_dica,
        v_pontos
    );

    -- Atualizar progresso semanal
    UPDATE progresso_semanal
    SET questoes_respondidas = questoes_respondidas + 1,
        questoes_corretas = questoes_corretas + (CASE WHEN v_correta THEN 1 ELSE 0 END),
        tempo_total_segundos = tempo_total_segundos + p_tempo_segundos,
        pontos_semana = pontos_semana + v_pontos,
        status = CASE
            WHEN status = 'disponivel' THEN 'em_progresso'
            ELSE status
        END,
        iniciada_em = COALESCE(iniciada_em, NOW())
    WHERE usuario_id = p_usuario_id
        AND trilha_id = v_trilha_id
        AND serie = v_questao.serie
        AND semana = v_questao.semana;

    -- Atualizar totais na usuario_trilha
    UPDATE usuario_trilha
    SET questoes_total = questoes_total + 1,
        questoes_corretas = questoes_corretas + (CASE WHEN v_correta THEN 1 ELSE 0 END),
        pontos_trilha = pontos_trilha + v_pontos,
        ultimo_acesso = NOW()
    WHERE usuario_id = p_usuario_id
        AND trilha_id = v_trilha_id
        AND serie = v_questao.serie;

    -- Contar progresso na semana (excluindo desafio)
    SELECT
        COUNT(*) FILTER (WHERE correta = TRUE),
        COUNT(*)
    INTO v_corretas_semana, v_total_semana
    FROM respostas_trilha rt
    JOIN questoes_trilha q ON rt.questao_id = q.id
    WHERE rt.usuario_id = p_usuario_id
        AND q.serie = v_questao.serie
        AND q.semana = v_questao.semana
        AND q.is_desafio = FALSE;

    -- Determinar acerto necessario (padrao 4 de 5 = 80%)
    v_acerto_necessario := COALESCE((v_config->>'acerto_avancar')::INTEGER, 60);
    v_pode_avancar := (v_corretas_semana::FLOAT / NULLIF(v_total_semana, 0) * 100) >= v_acerto_necessario;

    -- Se pode avancar, desbloquear proxima semana
    v_proxima_semana := v_questao.semana + 1;

    IF v_pode_avancar AND v_proxima_semana <= 40 THEN
        -- Marcar semana atual como concluida
        UPDATE progresso_semanal
        SET status = 'concluida',
            concluida_em = NOW(),
            desafio_disponivel = TRUE,
            bonus_100_porcento = (v_corretas_semana = v_total_semana)
        WHERE usuario_id = p_usuario_id
            AND trilha_id = v_trilha_id
            AND serie = v_questao.serie
            AND semana = v_questao.semana;

        -- Desbloquear proxima semana
        INSERT INTO progresso_semanal (
            usuario_id,
            trilha_id,
            serie,
            semana,
            status,
            desbloqueada_em
        ) VALUES (
            p_usuario_id,
            v_trilha_id,
            v_questao.serie,
            v_proxima_semana,
            'disponivel',
            NOW()
        )
        ON CONFLICT (usuario_id, trilha_id, serie, semana, ano_letivo)
        DO UPDATE SET
            status = 'disponivel',
            desbloqueada_em = COALESCE(progresso_semanal.desbloqueada_em, NOW());

        -- Atualizar semana atual do usuario
        UPDATE usuario_trilha
        SET semana_atual = v_proxima_semana
        WHERE usuario_id = p_usuario_id
            AND trilha_id = v_trilha_id
            AND serie = v_questao.serie;
    END IF;

    -- Montar feedback
    v_feedback := v_questao.feedback;

    RETURN jsonb_build_object(
        'sucesso', TRUE,
        'correta', v_correta,
        'resposta_certa', v_questao.resposta_correta,
        'resposta_dada', UPPER(p_resposta),
        'pontos', v_pontos,
        'feedback', v_feedback,
        'progresso', jsonb_build_object(
            'corretas_semana', v_corretas_semana,
            'total_semana', v_total_semana,
            'percentual', ROUND((v_corretas_semana::NUMERIC / NULLIF(v_total_semana, 0)) * 100, 1)
        ),
        'pode_avancar', v_pode_avancar,
        'proxima_semana', CASE WHEN v_pode_avancar THEN v_proxima_semana ELSE NULL END,
        'mensagem', CASE
            WHEN v_correta AND v_pode_avancar THEN '🎉 Correto! Semana ' || v_proxima_semana || ' desbloqueada!'
            WHEN v_correta THEN '✅ Correto! Continue assim!'
            ELSE '❌ Não foi dessa vez. Veja a explicação!'
        END
    );
END;
$$;

COMMENT ON FUNCTION responder_questao_trilha IS 'Registra resposta do usuario e atualiza progresso';

-- ============================================================================
-- 4. FUNCAO: BUSCAR PROGRESSO DO USUARIO
-- Retorna progresso geral do usuario em todas as trilhas
-- ============================================================================

CREATE OR REPLACE FUNCTION buscar_progresso_trilha(
    p_usuario_id UUID,
    p_serie VARCHAR(10) DEFAULT NULL
)
RETURNS TABLE (
    trilha_id VARCHAR(50),
    trilha_nome VARCHAR(100),
    trilha_icone VARCHAR(10),
    trilha_cor VARCHAR(7),
    serie VARCHAR(10),
    semana_atual INTEGER,
    questoes_total INTEGER,
    questoes_corretas INTEGER,
    percentual_acerto NUMERIC,
    pontos INTEGER,
    sequencia_dias INTEGER,
    status_semana VARCHAR(20),
    iniciada_em TIMESTAMPTZ,
    ultimo_acesso TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ut.trilha_id,
        t.nome AS trilha_nome,
        t.icone AS trilha_icone,
        t.cor AS trilha_cor,
        ut.serie,
        ut.semana_atual,
        ut.questoes_total,
        ut.questoes_corretas,
        CASE
            WHEN ut.questoes_total > 0
            THEN ROUND((ut.questoes_corretas::NUMERIC / ut.questoes_total) * 100, 1)
            ELSE 0
        END AS percentual_acerto,
        ut.pontos_trilha AS pontos,
        ut.sequencia_dias,
        COALESCE(ps.status, 'disponivel') AS status_semana,
        ut.iniciada_em,
        ut.ultimo_acesso
    FROM usuario_trilha ut
    JOIN trilhas t ON ut.trilha_id = t.id
    LEFT JOIN progresso_semanal ps ON (
        ps.usuario_id = ut.usuario_id
        AND ps.trilha_id = ut.trilha_id
        AND ps.serie = ut.serie
        AND ps.semana = ut.semana_atual
    )
    WHERE ut.usuario_id = p_usuario_id
        AND ut.ativa = TRUE
        AND (p_serie IS NULL OR ut.serie = p_serie);
END;
$$;

COMMENT ON FUNCTION buscar_progresso_trilha IS 'Retorna progresso do usuario nas trilhas ativas';

-- ============================================================================
-- 5. FUNCAO: VERIFICAR DESBLOQUEIO DE SEMANA
-- Verifica se usuario pode avancar para proxima semana
-- ============================================================================

CREATE OR REPLACE FUNCTION verificar_desbloqueio_semana(
    p_usuario_id UUID,
    p_serie VARCHAR(10),
    p_semana INTEGER
)
RETURNS TABLE (
    semana INTEGER,
    questoes_respondidas INTEGER,
    questoes_corretas INTEGER,
    percentual_acerto NUMERIC,
    pode_avancar BOOLEAN,
    proxima_desbloqueada BOOLEAN,
    desafio_disponivel BOOLEAN,
    mensagem TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trilha_id VARCHAR(50);
    v_total INTEGER;
    v_corretas INTEGER;
    v_percentual NUMERIC;
    v_pode BOOLEAN;
    v_config JSONB;
    v_acerto_necessario INTEGER;
BEGIN
    -- Buscar trilha ativa
    SELECT ut.trilha_id, t.config
    INTO v_trilha_id, v_config
    FROM usuario_trilha ut
    JOIN trilhas t ON t.id = ut.trilha_id
    WHERE ut.usuario_id = p_usuario_id
        AND ut.serie = p_serie
        AND ut.ativa = TRUE;

    IF v_trilha_id IS NULL THEN
        RETURN QUERY SELECT
            p_semana,
            0,
            0,
            0::NUMERIC,
            FALSE,
            FALSE,
            FALSE,
            'Nenhuma trilha ativa'::TEXT;
        RETURN;
    END IF;

    -- Contar questoes da semana (excluindo desafio)
    SELECT COUNT(*), COUNT(*) FILTER (WHERE rt.correta = TRUE)
    INTO v_total, v_corretas
    FROM questoes_trilha q
    LEFT JOIN respostas_trilha rt ON (
        rt.questao_id = q.id
        AND rt.usuario_id = p_usuario_id
    )
    WHERE q.serie = p_serie
        AND q.semana = p_semana
        AND q.is_desafio = FALSE
        AND q.ativa = TRUE;

    -- Calcular percentual
    v_percentual := CASE
        WHEN v_total > 0 THEN ROUND((v_corretas::NUMERIC / v_total) * 100, 1)
        ELSE 0
    END;

    -- Verificar se pode avancar
    v_acerto_necessario := COALESCE((v_config->>'acerto_avancar')::INTEGER, 60);
    v_pode := v_percentual >= v_acerto_necessario;

    RETURN QUERY SELECT
        p_semana,
        v_total,
        v_corretas,
        v_percentual,
        v_pode,
        EXISTS(
            SELECT 1 FROM progresso_semanal
            WHERE usuario_id = p_usuario_id
                AND trilha_id = v_trilha_id
                AND serie = p_serie
                AND semana = p_semana + 1
                AND status != 'bloqueada'
        ),
        v_pode,  -- desafio disponivel se pode avancar
        CASE
            WHEN v_pode THEN '🎉 Parabéns! Você pode avançar para a semana ' || (p_semana + 1)
            ELSE '📚 Acerte mais ' || CEIL(v_acerto_necessario * v_total / 100.0 - v_corretas) || ' questão(ões) para avançar'
        END::TEXT;
END;
$$;

COMMENT ON FUNCTION verificar_desbloqueio_semana IS 'Verifica se usuario pode avancar para proxima semana';

-- ============================================================================
-- 6. FUNCAO: BUSCAR QUESTOES POR SIMILARIDADE (RAG)
-- Busca semantica usando embeddings
-- ============================================================================

CREATE OR REPLACE FUNCTION buscar_questoes_similares(
    p_embedding VECTOR(768),
    p_serie VARCHAR(10) DEFAULT NULL,
    p_tema VARCHAR(100) DEFAULT NULL,
    p_dificuldade VARCHAR(20) DEFAULT NULL,
    p_limite INTEGER DEFAULT 5
)
RETURNS TABLE (
    questao_id BIGINT,
    enunciado TEXT,
    alternativas JSONB,
    resposta_correta VARCHAR(1),
    tema VARCHAR(100),
    subtema TEXT,
    dificuldade VARCHAR(20),
    similaridade FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id AS questao_id,
        q.enunciado,
        q.alternativas,
        q.resposta_correta,
        q.tema,
        q.subtema,
        q.dificuldade,
        (1 - (q.embedding <=> p_embedding))::FLOAT AS similaridade
    FROM questoes_trilha q
    WHERE q.ativa = TRUE
        AND q.embedding IS NOT NULL
        AND (p_serie IS NULL OR q.serie = p_serie)
        AND (p_tema IS NULL OR q.tema = p_tema)
        AND (p_dificuldade IS NULL OR q.dificuldade = p_dificuldade)
    ORDER BY q.embedding <=> p_embedding
    LIMIT p_limite;
END;
$$;

COMMENT ON FUNCTION buscar_questoes_similares IS 'Busca questoes similares usando embeddings (RAG)';

-- ============================================================================
-- 7. FUNCAO: LISTAR TRILHAS DISPONIVEIS
-- Retorna todas as trilhas com status do usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION listar_trilhas(
    p_usuario_id UUID DEFAULT NULL,
    p_serie VARCHAR(10) DEFAULT NULL
)
RETURNS TABLE (
    trilha_id VARCHAR(50),
    nome VARCHAR(100),
    icone VARCHAR(10),
    cor VARCHAR(7),
    descricao TEXT,
    descricao_curta VARCHAR(100),
    config JSONB,
    ordem INTEGER,
    usuario_ativa BOOLEAN,
    usuario_semana INTEGER,
    usuario_pontos INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id AS trilha_id,
        t.nome,
        t.icone,
        t.cor,
        t.descricao,
        t.descricao_curta,
        t.config,
        t.ordem,
        COALESCE(ut.ativa, FALSE) AS usuario_ativa,
        ut.semana_atual AS usuario_semana,
        ut.pontos_trilha AS usuario_pontos
    FROM trilhas t
    LEFT JOIN usuario_trilha ut ON (
        ut.trilha_id = t.id
        AND ut.usuario_id = p_usuario_id
        AND (p_serie IS NULL OR ut.serie = p_serie)
    )
    WHERE t.ativa = TRUE
    ORDER BY t.ordem;
END;
$$;

COMMENT ON FUNCTION listar_trilhas IS 'Lista todas as trilhas disponiveis com status do usuario';

-- ============================================================================
-- 8. FUNCAO: PAUSAR TRILHA
-- Pausa a trilha atual do usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION pausar_trilha(
    p_usuario_id UUID,
    p_serie VARCHAR(10)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trilha_id VARCHAR(50);
    v_trilha_nome VARCHAR(100);
BEGIN
    -- Buscar trilha ativa
    SELECT ut.trilha_id, t.nome
    INTO v_trilha_id, v_trilha_nome
    FROM usuario_trilha ut
    JOIN trilhas t ON t.id = ut.trilha_id
    WHERE ut.usuario_id = p_usuario_id
        AND ut.serie = p_serie
        AND ut.ativa = TRUE;

    IF v_trilha_id IS NULL THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'erro', 'Nenhuma trilha ativa encontrada'
        );
    END IF;

    -- Pausar trilha
    UPDATE usuario_trilha
    SET ativa = FALSE,
        pausada_em = NOW()
    WHERE usuario_id = p_usuario_id
        AND trilha_id = v_trilha_id
        AND serie = p_serie;

    RETURN jsonb_build_object(
        'sucesso', TRUE,
        'trilha_id', v_trilha_id,
        'trilha_nome', v_trilha_nome,
        'mensagem', 'Trilha ' || v_trilha_nome || ' pausada. Seu progresso foi salvo!'
    );
END;
$$;

COMMENT ON FUNCTION pausar_trilha IS 'Pausa a trilha ativa do usuario';

-- ============================================================================
-- 9. FUNCAO: ESTATISTICAS DA TRILHA
-- Retorna estatisticas detalhadas da trilha do usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION estatisticas_trilha(
    p_usuario_id UUID,
    p_serie VARCHAR(10)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trilha_id VARCHAR(50);
    v_resultado JSONB;
BEGIN
    -- Buscar trilha ativa
    SELECT trilha_id INTO v_trilha_id
    FROM usuario_trilha
    WHERE usuario_id = p_usuario_id
        AND serie = p_serie
        AND ativa = TRUE;

    IF v_trilha_id IS NULL THEN
        RETURN jsonb_build_object('erro', 'Nenhuma trilha ativa');
    END IF;

    SELECT jsonb_build_object(
        'trilha_id', v_trilha_id,
        'serie', p_serie,
        'totais', (
            SELECT jsonb_build_object(
                'questoes_respondidas', COALESCE(SUM(questoes_respondidas), 0),
                'questoes_corretas', COALESCE(SUM(questoes_corretas), 0),
                'pontos', COALESCE(SUM(pontos_semana), 0),
                'tempo_total_minutos', ROUND(COALESCE(SUM(tempo_total_segundos), 0) / 60.0, 1)
            )
            FROM progresso_semanal
            WHERE usuario_id = p_usuario_id
                AND trilha_id = v_trilha_id
                AND serie = p_serie
        ),
        'por_semana', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'semana', semana,
                    'status', status,
                    'corretas', questoes_corretas,
                    'total', questoes_respondidas,
                    'pontos', pontos_semana
                ) ORDER BY semana
            ), '[]'::jsonb)
            FROM progresso_semanal
            WHERE usuario_id = p_usuario_id
                AND trilha_id = v_trilha_id
                AND serie = p_serie
        ),
        'por_tipo', (
            SELECT COALESCE(jsonb_object_agg(
                tipo_questao,
                jsonb_build_object(
                    'total', total,
                    'corretas', corretas,
                    'percentual', ROUND(corretas::NUMERIC / NULLIF(total, 0) * 100, 1)
                )
            ), '{}'::jsonb)
            FROM (
                SELECT
                    q.tipo_questao,
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE rt.correta = TRUE) AS corretas
                FROM respostas_trilha rt
                JOIN questoes_trilha q ON rt.questao_id = q.id
                WHERE rt.usuario_id = p_usuario_id
                    AND rt.trilha_id = v_trilha_id
                    AND q.serie = p_serie
                GROUP BY q.tipo_questao
            ) sub
        ),
        'por_tema', (
            SELECT COALESCE(jsonb_object_agg(
                tema,
                jsonb_build_object(
                    'total', total,
                    'corretas', corretas,
                    'percentual', ROUND(corretas::NUMERIC / NULLIF(total, 0) * 100, 1)
                )
            ), '{}'::jsonb)
            FROM (
                SELECT
                    q.tema,
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE rt.correta = TRUE) AS corretas
                FROM respostas_trilha rt
                JOIN questoes_trilha q ON rt.questao_id = q.id
                WHERE rt.usuario_id = p_usuario_id
                    AND rt.trilha_id = v_trilha_id
                    AND q.serie = p_serie
                GROUP BY q.tema
            ) sub
        )
    ) INTO v_resultado;

    RETURN v_resultado;
END;
$$;

COMMENT ON FUNCTION estatisticas_trilha IS 'Retorna estatisticas detalhadas da trilha do usuario';

-- ============================================================================
-- 10. FUNCAO: RANKING SEMANAL (TRILHA DESAFIO)
-- Retorna ranking da semana para a trilha desafio
-- ============================================================================

CREATE OR REPLACE FUNCTION ranking_semanal(
    p_serie VARCHAR(10),
    p_semana INTEGER DEFAULT NULL,
    p_limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    posicao INTEGER,
    usuario_id UUID,
    usuario_nome VARCHAR(100),
    pontos INTEGER,
    questoes_corretas INTEGER,
    tempo_segundos INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_semana INTEGER;
BEGIN
    -- Determinar semana
    v_semana := COALESCE(p_semana, CEIL(EXTRACT(WEEK FROM NOW()) - 5)::INTEGER);
    IF v_semana < 1 THEN v_semana := 1; END IF;
    IF v_semana > 40 THEN v_semana := 40; END IF;

    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY ps.pontos_semana DESC, ps.tempo_total_segundos ASC)::INTEGER AS posicao,
        ps.usuario_id,
        u.nome AS usuario_nome,
        ps.pontos_semana AS pontos,
        ps.questoes_corretas,
        ps.tempo_total_segundos AS tempo_segundos
    FROM progresso_semanal ps
    JOIN usuarios u ON u.id = ps.usuario_id
    WHERE ps.serie = p_serie
        AND ps.semana = v_semana
        AND ps.trilha_id = 'desafio'
    ORDER BY ps.pontos_semana DESC, ps.tempo_total_segundos ASC
    LIMIT p_limite;
END;
$$;

COMMENT ON FUNCTION ranking_semanal IS 'Retorna ranking semanal da trilha desafio';

-- ============================================================================
-- FIM DAS FUNCOES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Funcoes de trilhas criadas com sucesso!';
    RAISE NOTICE 'Funcoes: iniciar_trilha, buscar_questoes_semana_trilha,';
    RAISE NOTICE '         responder_questao_trilha, buscar_progresso_trilha,';
    RAISE NOTICE '         verificar_desbloqueio_semana, buscar_questoes_similares,';
    RAISE NOTICE '         listar_trilhas, pausar_trilha, estatisticas_trilha,';
    RAISE NOTICE '         ranking_semanal';
    RAISE NOTICE '============================================';
END $$;
