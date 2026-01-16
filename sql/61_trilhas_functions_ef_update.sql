-- ============================================================================
-- 61_TRILHAS_FUNCTIONS_EF_UPDATE.SQL
-- Atualizacao das funcoes do sistema de trilhas para suportar EF (6o-9o ano)
--
-- IMPORTANTE: Executar DEPOIS do 60_trilhas_matematica_ef.sql
--
-- Criado em: 2025-01-15
-- Autor: Sistema Claude - Analista Master Senior
-- ============================================================================

-- ============================================================================
-- 1. FUNCAO: INICIAR TRILHA (ATUALIZADA PARA EF)
-- Agora suporta series 6EF-9EF e define componente automaticamente
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
    v_componente VARCHAR(20);
BEGIN
    -- Validar trilha
    SELECT * INTO v_trilha FROM trilhas WHERE id = p_trilha_id AND ativa = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'erro', 'Trilha nao encontrada ou inativa'
        );
    END IF;

    -- Validar serie (EF ou EM)
    IF p_serie NOT IN ('6EF', '7EF', '8EF', '9EF', '1EM', '2EM', '3EM') THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'erro', 'Serie invalida. Use: 6EF, 7EF, 8EF, 9EF, 1EM, 2EM ou 3EM'
        );
    END IF;

    -- Determinar componente baseado na serie
    IF p_serie IN ('6EF', '7EF', '8EF', '9EF') THEN
        v_componente := 'matematica';
    ELSE
        v_componente := 'fisica';
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
        componente,
        ativa,
        iniciada_em,
        semana_atual,
        data_prova,
        temas_prova
    ) VALUES (
        p_usuario_id,
        p_trilha_id,
        p_serie,
        v_componente,
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
        componente = v_componente,
        ultimo_acesso = NOW(),
        updated_at = NOW()
    RETURNING id INTO v_usuario_trilha_id;

    -- Desbloquear primeira semana
    INSERT INTO progresso_semanal (
        usuario_id,
        trilha_id,
        serie,
        componente,
        semana,
        status,
        desbloqueada_em
    ) VALUES (
        p_usuario_id,
        p_trilha_id,
        p_serie,
        v_componente,
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
        componente = v_componente,
        desbloqueada_em = COALESCE(progresso_semanal.desbloqueada_em, NOW());

    RETURN jsonb_build_object(
        'sucesso', TRUE,
        'trilha_id', v_trilha.id,
        'trilha_nome', v_trilha.nome,
        'trilha_icone', v_trilha.icone,
        'serie', p_serie,
        'componente', v_componente,
        'semana_inicial', 1,
        'mensagem', 'Trilha ' || v_trilha.nome || ' iniciada! Boa sorte!'
    );
END;
$$;

COMMENT ON FUNCTION iniciar_trilha IS 'Inicia ou reativa uma trilha para o usuario (suporta EF e EM)';

-- ============================================================================
-- 2. FUNCAO: BUSCAR QUESTOES DA SEMANA (ATUALIZADA)
-- Retorna info sobre nivel_ensino e num_alternativas
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
    usou_dica BOOLEAN,
    num_alternativas INTEGER,
    nivel_ensino VARCHAR(5),
    componente VARCHAR(20)
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

    -- Retornar questoes com info de alternativas
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
        COALESCE(rt.usou_dica, FALSE) AS usou_dica,
        COALESCE(q.num_alternativas, 5) AS num_alternativas,
        COALESCE(q.nivel_ensino, 'EM') AS nivel_ensino,
        COALESCE(q.componente, 'fisica') AS componente
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

COMMENT ON FUNCTION buscar_questoes_semana_trilha IS 'Retorna questoes da semana (suporta EF com 4 alternativas e EM com 5)';

-- ============================================================================
-- 3. FUNCAO: RESPONDER QUESTAO (ATUALIZADA)
-- Valida resposta baseado no num_alternativas
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
    v_num_alternativas INTEGER;
BEGIN
    -- Buscar questao
    SELECT * INTO v_questao FROM questoes_trilha WHERE id = p_questao_id AND ativa = TRUE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'erro', 'Questao nao encontrada'
        );
    END IF;

    -- Pegar numero de alternativas
    v_num_alternativas := COALESCE(v_questao.num_alternativas, 5);

    -- Validar resposta baseado no numero de alternativas
    IF v_num_alternativas = 4 AND UPPER(p_resposta) NOT IN ('A', 'B', 'C', 'D') THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'erro', 'Resposta invalida. Para esta questao, use A, B, C ou D'
        );
    ELSIF v_num_alternativas = 5 AND UPPER(p_resposta) NOT IN ('A', 'B', 'C', 'D', 'E') THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'erro', 'Resposta invalida. Use A, B, C, D ou E'
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
            'erro', 'Voce ja respondeu esta questao'
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
            'erro', 'Voce nao tem uma trilha ativa para esta serie'
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

    -- Determinar acerto necessario (padrao 60%)
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
            componente,
            semana,
            status,
            desbloqueada_em
        ) VALUES (
            p_usuario_id,
            v_trilha_id,
            v_questao.serie,
            COALESCE(v_questao.componente, 'fisica'),
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
        'num_alternativas', v_num_alternativas,
        'mensagem', CASE
            WHEN v_correta AND v_pode_avancar THEN 'Correto! Semana ' || v_proxima_semana || ' desbloqueada!'
            WHEN v_correta THEN 'Correto! Continue assim!'
            ELSE 'Nao foi dessa vez. Veja a explicacao!'
        END
    );
END;
$$;

COMMENT ON FUNCTION responder_questao_trilha IS 'Registra resposta do usuario (suporta 4 ou 5 alternativas)';

-- ============================================================================
-- 4. FUNCAO: AVANCAR SEMANA
-- Verifica e avanca para proxima semana se atingiu o minimo
-- ============================================================================

CREATE OR REPLACE FUNCTION avancar_semana_trilha(
    p_usuario_id UUID,
    p_serie VARCHAR(10)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_trilha_id VARCHAR(50);
    v_config JSONB;
    v_semana_atual INTEGER;
    v_corretas INTEGER;
    v_total INTEGER;
    v_taxa_acerto NUMERIC;
    v_acerto_necessario INTEGER;
    v_pode_avancar BOOLEAN;
    v_proxima_semana INTEGER;
    v_componente VARCHAR(20);
BEGIN
    -- Buscar trilha ativa
    SELECT ut.trilha_id, ut.semana_atual, ut.componente, t.config
    INTO v_trilha_id, v_semana_atual, v_componente, v_config
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

    -- Contar acertos da semana atual
    SELECT
        COUNT(*) FILTER (WHERE rt.correta = TRUE),
        COUNT(*)
    INTO v_corretas, v_total
    FROM respostas_trilha rt
    JOIN questoes_trilha q ON rt.questao_id = q.id
    WHERE rt.usuario_id = p_usuario_id
        AND q.serie = p_serie
        AND q.semana = v_semana_atual
        AND q.is_desafio = FALSE;

    -- Calcular taxa de acerto
    v_taxa_acerto := CASE
        WHEN v_total > 0 THEN ROUND((v_corretas::NUMERIC / v_total) * 100, 1)
        ELSE 0
    END;

    -- Verificar se atingiu minimo
    v_acerto_necessario := COALESCE((v_config->>'acerto_avancar')::INTEGER, 60);
    v_pode_avancar := v_taxa_acerto >= v_acerto_necessario;
    v_proxima_semana := v_semana_atual + 1;

    IF v_pode_avancar AND v_proxima_semana <= 40 THEN
        -- Marcar semana como concluida
        UPDATE progresso_semanal
        SET status = 'concluida',
            concluida_em = NOW(),
            bonus_100_porcento = (v_corretas = v_total)
        WHERE usuario_id = p_usuario_id
            AND trilha_id = v_trilha_id
            AND serie = p_serie
            AND semana = v_semana_atual;

        -- Desbloquear proxima semana
        INSERT INTO progresso_semanal (
            usuario_id, trilha_id, serie, componente, semana, status, desbloqueada_em
        ) VALUES (
            p_usuario_id, v_trilha_id, p_serie, v_componente, v_proxima_semana, 'disponivel', NOW()
        )
        ON CONFLICT (usuario_id, trilha_id, serie, semana, ano_letivo)
        DO UPDATE SET status = 'disponivel';

        -- Atualizar semana atual
        UPDATE usuario_trilha
        SET semana_atual = v_proxima_semana
        WHERE usuario_id = p_usuario_id
            AND trilha_id = v_trilha_id
            AND serie = p_serie;

        RETURN jsonb_build_object(
            'sucesso', TRUE,
            'avancou', TRUE,
            'mensagem', 'Parabens! Voce avancou para a semana ' || v_proxima_semana,
            'progresso', jsonb_build_object(
                'semana_atual', v_proxima_semana,
                'semana_anterior', v_semana_atual,
                'taxa_acerto', v_taxa_acerto,
                'corretas', v_corretas,
                'total', v_total,
                'avancou', TRUE
            )
        );
    ELSIF NOT v_pode_avancar THEN
        -- Resetar questoes da semana para tentar novamente
        DELETE FROM respostas_trilha
        WHERE usuario_id = p_usuario_id
            AND questao_id IN (
                SELECT id FROM questoes_trilha
                WHERE serie = p_serie
                    AND semana = v_semana_atual
                    AND is_desafio = FALSE
            );

        -- Resetar progresso semanal
        UPDATE progresso_semanal
        SET questoes_respondidas = 0,
            questoes_corretas = 0,
            pontos_semana = 0,
            tempo_total_segundos = 0,
            status = 'disponivel',
            iniciada_em = NULL
        WHERE usuario_id = p_usuario_id
            AND trilha_id = v_trilha_id
            AND serie = p_serie
            AND semana = v_semana_atual;

        RETURN jsonb_build_object(
            'sucesso', TRUE,
            'avancou', FALSE,
            'mensagem', 'Voce precisa de ' || v_acerto_necessario || '% para avancar. Tente novamente!',
            'progresso', jsonb_build_object(
                'semana_atual', v_semana_atual,
                'taxa_acerto', v_taxa_acerto,
                'minimo_necessario', v_acerto_necessario,
                'corretas', v_corretas,
                'total', v_total,
                'avancou', FALSE,
                'semana_resetada', TRUE
            )
        );
    ELSE
        RETURN jsonb_build_object(
            'sucesso', TRUE,
            'avancou', FALSE,
            'mensagem', 'Voce ja esta na ultima semana!',
            'progresso', jsonb_build_object(
                'semana_atual', v_semana_atual,
                'taxa_acerto', v_taxa_acerto,
                'avancou', FALSE
            )
        );
    END IF;
END;
$$;

COMMENT ON FUNCTION avancar_semana_trilha IS 'Verifica e avanca para proxima semana se atingiu o minimo';

-- ============================================================================
-- 5. FUNCAO: BUSCAR PROGRESSO (ATUALIZADA)
-- Inclui componente no retorno
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
    componente VARCHAR(20),
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
        COALESCE(ut.componente, 'fisica')::VARCHAR(20) AS componente,
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

COMMENT ON FUNCTION buscar_progresso_trilha IS 'Retorna progresso do usuario nas trilhas ativas (com componente)';

-- ============================================================================
-- FIM DAS ATUALIZACOES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Funcoes atualizadas para suporte EF!';
    RAISE NOTICE '';
    RAISE NOTICE 'Funcoes modificadas:';
    RAISE NOTICE '  - iniciar_trilha (suporta 6EF-9EF)';
    RAISE NOTICE '  - buscar_questoes_semana_trilha (retorna num_alternativas)';
    RAISE NOTICE '  - responder_questao_trilha (valida 4 ou 5 alternativas)';
    RAISE NOTICE '  - avancar_semana_trilha (nova funcao)';
    RAISE NOTICE '  - buscar_progresso_trilha (retorna componente)';
    RAISE NOTICE '';
    RAISE NOTICE 'EF (6o-9o): Matematica, 4 alternativas';
    RAISE NOTICE 'EM (1o-3o): Fisica, 5 alternativas';
    RAISE NOTICE '============================================';
END $$;
