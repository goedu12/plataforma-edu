-- ============================================================
-- SISTEMA DE PROTEÇÃO DE DADOS - BACKUP E AUDITORIA
-- Garante que dados dos estudantes nunca sejam perdidos
-- ============================================================

-- 1. TABELA DE HISTÓRICO DE NOTAS
-- Armazena snapshots de todas as notas, mesmo após alterações
CREATE TABLE IF NOT EXISTS historico_notas (
    id SERIAL PRIMARY KEY,

    -- Referência original
    nota_id INTEGER,
    usuario_id UUID NOT NULL,
    componente VARCHAR(20) NOT NULL,
    bimestre INTEGER NOT NULL,
    ano INTEGER NOT NULL,

    -- Dados da nota no momento do snapshot
    nota_acertos DECIMAL(4,2) DEFAULT 0,
    nota_tempo DECIMAL(4,2) DEFAULT 0,
    nota_final DECIMAL(4,2) DEFAULT 0,
    total_questoes INTEGER DEFAULT 0,
    total_acertos INTEGER DEFAULT 0,
    tempo_total_minutos INTEGER DEFAULT 0,

    -- Detalhes por modo
    questoes_estudo INTEGER DEFAULT 0,
    acertos_estudo INTEGER DEFAULT 0,
    questoes_desafio INTEGER DEFAULT 0,
    acertos_desafio INTEGER DEFAULT 0,
    questoes_revisao INTEGER DEFAULT 0,
    acertos_revisao INTEGER DEFAULT 0,

    -- Metadados de auditoria
    operacao VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'SNAPSHOT'
    motivo TEXT, -- Razão do snapshot (ex: 'backup_diario', 'antes_alteracao_sistema')
    dados_extras JSONB, -- Dados adicionais que podem ser úteis

    -- Timestamps
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    nota_criada_em TIMESTAMPTZ,
    nota_atualizada_em TIMESTAMPTZ
);

-- Índices para histórico de notas
CREATE INDEX IF NOT EXISTS idx_historico_notas_usuario ON historico_notas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historico_notas_data ON historico_notas(criado_em);
CREATE INDEX IF NOT EXISTS idx_historico_notas_operacao ON historico_notas(operacao);
CREATE INDEX IF NOT EXISTS idx_historico_notas_ano_bim ON historico_notas(ano, bimestre);

-- 2. TABELA DE BACKUP DE RESPOSTAS
-- Mantém cópia de todas as respostas, mesmo as deletadas
CREATE TABLE IF NOT EXISTS backup_respostas (
    id SERIAL PRIMARY KEY,

    -- Referência original
    resposta_id INTEGER,
    usuario_id UUID NOT NULL,
    questao_id INTEGER NOT NULL,

    -- Dados da resposta
    resposta_dada CHAR(1),
    correta BOOLEAN,
    tempo_resposta INTEGER, -- em segundos
    modo VARCHAR(20),

    -- Dados da questão no momento (para não perder contexto se questão mudar)
    questao_enunciado TEXT,
    questao_resposta_correta CHAR(1),
    questao_serie INTEGER,
    questao_componente VARCHAR(20),
    questao_assunto TEXT,

    -- Metadados de auditoria
    operacao VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'SNAPSHOT'
    motivo TEXT,

    -- Timestamps
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    resposta_criada_em TIMESTAMPTZ,
    resposta_atualizada_em TIMESTAMPTZ
);

-- Índices para backup de respostas
CREATE INDEX IF NOT EXISTS idx_backup_respostas_usuario ON backup_respostas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_backup_respostas_questao ON backup_respostas(questao_id);
CREATE INDEX IF NOT EXISTS idx_backup_respostas_data ON backup_respostas(criado_em);
CREATE INDEX IF NOT EXISTS idx_backup_respostas_operacao ON backup_respostas(operacao);

-- 3. TABELA DE BACKUP DE TEMPO DE USO
CREATE TABLE IF NOT EXISTS backup_tempo_uso (
    id SERIAL PRIMARY KEY,

    -- Referência original
    tempo_id INTEGER,
    usuario_id UUID NOT NULL,
    componente VARCHAR(20) NOT NULL,

    -- Dados do tempo
    minutos INTEGER NOT NULL,
    data DATE NOT NULL,

    -- Metadados
    operacao VARCHAR(20) NOT NULL,
    motivo TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_tempo_usuario ON backup_tempo_uso(usuario_id);
CREATE INDEX IF NOT EXISTS idx_backup_tempo_data ON backup_tempo_uso(criado_em);

-- 4. TABELA DE LOG DE ALTERAÇÕES DO SISTEMA
-- Registra todas as alterações importantes no sistema
CREATE TABLE IF NOT EXISTS log_alteracoes_sistema (
    id SERIAL PRIMARY KEY,
    tipo_alteracao VARCHAR(50) NOT NULL, -- 'QUESTAO_ALTERADA', 'SISTEMA_NOTAS', 'BACKUP_MANUAL', etc
    descricao TEXT NOT NULL,
    dados_antes JSONB,
    dados_depois JSONB,
    usuario_responsavel TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_alteracoes_tipo ON log_alteracoes_sistema(tipo_alteracao);
CREATE INDEX IF NOT EXISTS idx_log_alteracoes_data ON log_alteracoes_sistema(criado_em);

-- ============================================================
-- TRIGGERS AUTOMÁTICOS DE BACKUP
-- ============================================================

-- 5. TRIGGER PARA BACKUP DE NOTAS
CREATE OR REPLACE FUNCTION backup_nota_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO historico_notas (
            nota_id, usuario_id, componente, bimestre, ano,
            nota_acertos, nota_tempo, nota_final,
            total_questoes, total_acertos, tempo_total_minutos,
            questoes_estudo, acertos_estudo,
            questoes_desafio, acertos_desafio,
            questoes_revisao, acertos_revisao,
            operacao, motivo,
            nota_criada_em, nota_atualizada_em
        ) VALUES (
            OLD.id, OLD.usuario_id, OLD.componente, OLD.bimestre, OLD.ano,
            OLD.nota_acertos, OLD.nota_tempo, OLD.nota_final,
            OLD.total_questoes, OLD.total_acertos, OLD.tempo_total_minutos,
            COALESCE(OLD.questoes_estudo, 0), COALESCE(OLD.acertos_estudo, 0),
            COALESCE(OLD.questoes_desafio, 0), COALESCE(OLD.acertos_desafio, 0),
            COALESCE(OLD.questoes_revisao, 0), COALESCE(OLD.acertos_revisao, 0),
            'DELETE', 'Registro deletado',
            OLD.criado_em, OLD.atualizado_em
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Só faz backup se houve mudança significativa na nota
        IF OLD.nota_final IS DISTINCT FROM NEW.nota_final
           OR OLD.total_acertos IS DISTINCT FROM NEW.total_acertos THEN
            INSERT INTO historico_notas (
                nota_id, usuario_id, componente, bimestre, ano,
                nota_acertos, nota_tempo, nota_final,
                total_questoes, total_acertos, tempo_total_minutos,
                questoes_estudo, acertos_estudo,
                questoes_desafio, acertos_desafio,
                questoes_revisao, acertos_revisao,
                operacao, motivo,
                nota_criada_em, nota_atualizada_em
            ) VALUES (
                OLD.id, OLD.usuario_id, OLD.componente, OLD.bimestre, OLD.ano,
                OLD.nota_acertos, OLD.nota_tempo, OLD.nota_final,
                OLD.total_questoes, OLD.total_acertos, OLD.tempo_total_minutos,
                COALESCE(OLD.questoes_estudo, 0), COALESCE(OLD.acertos_estudo, 0),
                COALESCE(OLD.questoes_desafio, 0), COALESCE(OLD.acertos_desafio, 0),
                COALESCE(OLD.questoes_revisao, 0), COALESCE(OLD.acertos_revisao, 0),
                'UPDATE', 'Nota atualizada - valor anterior',
                OLD.criado_em, OLD.atualizado_em
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela notas
DROP TRIGGER IF EXISTS trigger_backup_nota ON notas;
CREATE TRIGGER trigger_backup_nota
    BEFORE UPDATE OR DELETE ON notas
    FOR EACH ROW EXECUTE FUNCTION backup_nota_trigger();

-- 6. TRIGGER PARA BACKUP DE RESPOSTAS
CREATE OR REPLACE FUNCTION backup_resposta_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_questao RECORD;
BEGIN
    -- Buscar dados da questão
    SELECT enunciado, resposta_correta, serie, componente, assunto
    INTO v_questao
    FROM questoes
    WHERE id = COALESCE(OLD.questao_id, NEW.questao_id);

    IF TG_OP = 'DELETE' THEN
        INSERT INTO backup_respostas (
            resposta_id, usuario_id, questao_id,
            resposta_dada, correta, tempo_resposta, modo,
            questao_enunciado, questao_resposta_correta, questao_serie,
            questao_componente, questao_assunto,
            operacao, motivo,
            resposta_criada_em, resposta_atualizada_em
        ) VALUES (
            OLD.id, OLD.usuario_id, OLD.questao_id,
            OLD.resposta_dada, OLD.correta, OLD.tempo_resposta, OLD.modo,
            v_questao.enunciado, v_questao.resposta_correta, v_questao.serie,
            v_questao.componente, v_questao.assunto,
            'DELETE', 'Resposta deletada',
            OLD.criado_em, OLD.atualizado_em
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Backup antes de atualizar
        INSERT INTO backup_respostas (
            resposta_id, usuario_id, questao_id,
            resposta_dada, correta, tempo_resposta, modo,
            questao_enunciado, questao_resposta_correta, questao_serie,
            questao_componente, questao_assunto,
            operacao, motivo,
            resposta_criada_em, resposta_atualizada_em
        ) VALUES (
            OLD.id, OLD.usuario_id, OLD.questao_id,
            OLD.resposta_dada, OLD.correta, OLD.tempo_resposta, OLD.modo,
            v_questao.enunciado, v_questao.resposta_correta, v_questao.serie,
            v_questao.componente, v_questao.assunto,
            'UPDATE', 'Resposta atualizada - valor anterior',
            OLD.criado_em, OLD.atualizado_em
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela respostas
DROP TRIGGER IF EXISTS trigger_backup_resposta ON respostas;
CREATE TRIGGER trigger_backup_resposta
    BEFORE UPDATE OR DELETE ON respostas
    FOR EACH ROW EXECUTE FUNCTION backup_resposta_trigger();

-- 7. TRIGGER PARA BACKUP DE TEMPO DE USO
CREATE OR REPLACE FUNCTION backup_tempo_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO backup_tempo_uso (
            tempo_id, usuario_id, componente, minutos, data,
            operacao, motivo
        ) VALUES (
            OLD.id, OLD.usuario_id, OLD.componente, OLD.minutos, OLD.data,
            'DELETE', 'Tempo deletado'
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.minutos IS DISTINCT FROM NEW.minutos THEN
            INSERT INTO backup_tempo_uso (
                tempo_id, usuario_id, componente, minutos, data,
                operacao, motivo
            ) VALUES (
                OLD.id, OLD.usuario_id, OLD.componente, OLD.minutos, OLD.data,
                'UPDATE', 'Tempo atualizado - valor anterior'
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela tempo_uso
DROP TRIGGER IF EXISTS trigger_backup_tempo ON tempo_uso;
CREATE TRIGGER trigger_backup_tempo
    BEFORE UPDATE OR DELETE ON tempo_uso
    FOR EACH ROW EXECUTE FUNCTION backup_tempo_trigger();

-- ============================================================
-- FUNÇÕES DE BACKUP MANUAL E SNAPSHOT
-- ============================================================

-- 8. FUNÇÃO PARA CRIAR SNAPSHOT COMPLETO DE UM USUÁRIO
CREATE OR REPLACE FUNCTION criar_snapshot_usuario(
    p_usuario_id UUID,
    p_motivo TEXT DEFAULT 'Snapshot manual'
)
RETURNS TABLE(notas_salvas INTEGER, respostas_salvas INTEGER, tempos_salvos INTEGER) AS $$
DECLARE
    v_notas INTEGER := 0;
    v_respostas INTEGER := 0;
    v_tempos INTEGER := 0;
    v_questao RECORD;
    r RECORD;
BEGIN
    -- Snapshot de notas
    INSERT INTO historico_notas (
        nota_id, usuario_id, componente, bimestre, ano,
        nota_acertos, nota_tempo, nota_final,
        total_questoes, total_acertos, tempo_total_minutos,
        questoes_estudo, acertos_estudo,
        questoes_desafio, acertos_desafio,
        questoes_revisao, acertos_revisao,
        operacao, motivo,
        nota_criada_em, nota_atualizada_em
    )
    SELECT
        n.id, n.usuario_id, n.componente, n.bimestre, n.ano,
        n.nota_acertos, n.nota_tempo, n.nota_final,
        n.total_questoes, n.total_acertos, n.tempo_total_minutos,
        COALESCE(n.questoes_estudo, 0), COALESCE(n.acertos_estudo, 0),
        COALESCE(n.questoes_desafio, 0), COALESCE(n.acertos_desafio, 0),
        COALESCE(n.questoes_revisao, 0), COALESCE(n.acertos_revisao, 0),
        'SNAPSHOT', p_motivo,
        n.criado_em, n.atualizado_em
    FROM notas n
    WHERE n.usuario_id = p_usuario_id;

    GET DIAGNOSTICS v_notas = ROW_COUNT;

    -- Snapshot de respostas (com dados da questão)
    FOR r IN SELECT * FROM respostas WHERE usuario_id = p_usuario_id
    LOOP
        SELECT enunciado, resposta_correta, serie, componente, assunto
        INTO v_questao
        FROM questoes
        WHERE id = r.questao_id;

        INSERT INTO backup_respostas (
            resposta_id, usuario_id, questao_id,
            resposta_dada, correta, tempo_resposta, modo,
            questao_enunciado, questao_resposta_correta, questao_serie,
            questao_componente, questao_assunto,
            operacao, motivo,
            resposta_criada_em, resposta_atualizada_em
        ) VALUES (
            r.id, r.usuario_id, r.questao_id,
            r.resposta_dada, r.correta, r.tempo_resposta, r.modo,
            v_questao.enunciado, v_questao.resposta_correta, v_questao.serie,
            v_questao.componente, v_questao.assunto,
            'SNAPSHOT', p_motivo,
            r.criado_em, r.atualizado_em
        );
        v_respostas := v_respostas + 1;
    END LOOP;

    -- Snapshot de tempo de uso
    INSERT INTO backup_tempo_uso (
        tempo_id, usuario_id, componente, minutos, data,
        operacao, motivo
    )
    SELECT
        t.id, t.usuario_id, t.componente, t.minutos, t.data,
        'SNAPSHOT', p_motivo
    FROM tempo_uso t
    WHERE t.usuario_id = p_usuario_id;

    GET DIAGNOSTICS v_tempos = ROW_COUNT;

    RETURN QUERY SELECT v_notas, v_respostas, v_tempos;
END;
$$ LANGUAGE plpgsql;

-- 9. FUNÇÃO PARA CRIAR SNAPSHOT DE TODOS OS USUÁRIOS
CREATE OR REPLACE FUNCTION criar_snapshot_completo(
    p_motivo TEXT DEFAULT 'Backup completo do sistema'
)
RETURNS TABLE(total_usuarios INTEGER, total_notas INTEGER, total_respostas INTEGER, total_tempos INTEGER) AS $$
DECLARE
    v_usuarios INTEGER := 0;
    v_notas INTEGER := 0;
    v_respostas INTEGER := 0;
    v_tempos INTEGER := 0;
    r RECORD;
    resultado RECORD;
BEGIN
    -- Registrar no log de alterações
    INSERT INTO log_alteracoes_sistema (tipo_alteracao, descricao)
    VALUES ('BACKUP_COMPLETO', p_motivo);

    -- Iterar por todos os usuários que têm dados
    FOR r IN
        SELECT DISTINCT usuario_id
        FROM (
            SELECT usuario_id FROM notas
            UNION
            SELECT usuario_id FROM respostas
            UNION
            SELECT usuario_id FROM tempo_uso
        ) usuarios
    LOOP
        SELECT * INTO resultado FROM criar_snapshot_usuario(r.usuario_id, p_motivo);
        v_usuarios := v_usuarios + 1;
        v_notas := v_notas + resultado.notas_salvas;
        v_respostas := v_respostas + resultado.respostas_salvas;
        v_tempos := v_tempos + resultado.tempos_salvos;
    END LOOP;

    RETURN QUERY SELECT v_usuarios, v_notas, v_respostas, v_tempos;
END;
$$ LANGUAGE plpgsql;

-- 10. FUNÇÃO PARA EXPORTAR DADOS DE UM USUÁRIO EM JSON
CREATE OR REPLACE FUNCTION exportar_dados_usuario(p_usuario_id UUID)
RETURNS JSONB AS $$
DECLARE
    resultado JSONB;
BEGIN
    SELECT jsonb_build_object(
        'usuario_id', p_usuario_id,
        'exportado_em', NOW(),
        'notas', (
            SELECT COALESCE(jsonb_agg(row_to_json(n)), '[]'::jsonb)
            FROM notas n WHERE n.usuario_id = p_usuario_id
        ),
        'respostas', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'questao_id', r.questao_id,
                    'resposta_dada', r.resposta_dada,
                    'correta', r.correta,
                    'tempo_resposta', r.tempo_resposta,
                    'modo', r.modo,
                    'criado_em', r.criado_em,
                    'questao', (
                        SELECT row_to_json(q)
                        FROM questoes q WHERE q.id = r.questao_id
                    )
                )
            ), '[]'::jsonb)
            FROM respostas r WHERE r.usuario_id = p_usuario_id
        ),
        'tempo_uso', (
            SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
            FROM tempo_uso t WHERE t.usuario_id = p_usuario_id
        ),
        'historico_notas', (
            SELECT COALESCE(jsonb_agg(row_to_json(h)), '[]'::jsonb)
            FROM historico_notas h WHERE h.usuario_id = p_usuario_id
        ),
        'backup_respostas', (
            SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb)
            FROM backup_respostas b WHERE b.usuario_id = p_usuario_id
        )
    ) INTO resultado;

    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- 11. FUNÇÃO PARA RESTAURAR NOTA DE UM SNAPSHOT ESPECÍFICO
CREATE OR REPLACE FUNCTION restaurar_nota_snapshot(
    p_historico_id INTEGER,
    p_motivo TEXT DEFAULT 'Restauração de snapshot'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_historico RECORD;
BEGIN
    -- Buscar dados do histórico
    SELECT * INTO v_historico
    FROM historico_notas
    WHERE id = p_historico_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Registrar no log
    INSERT INTO log_alteracoes_sistema (tipo_alteracao, descricao, dados_antes, dados_depois)
    SELECT
        'RESTAURACAO_NOTA',
        p_motivo,
        row_to_json(n)::jsonb,
        row_to_json(v_historico)::jsonb
    FROM notas n
    WHERE n.usuario_id = v_historico.usuario_id
      AND n.componente = v_historico.componente
      AND n.bimestre = v_historico.bimestre
      AND n.ano = v_historico.ano;

    -- Atualizar ou inserir a nota
    INSERT INTO notas (
        usuario_id, componente, bimestre, ano,
        nota_acertos, nota_tempo, nota_final,
        total_questoes, total_acertos, tempo_total_minutos,
        questoes_estudo, acertos_estudo,
        questoes_desafio, acertos_desafio,
        questoes_revisao, acertos_revisao,
        atualizado_em
    ) VALUES (
        v_historico.usuario_id, v_historico.componente, v_historico.bimestre, v_historico.ano,
        v_historico.nota_acertos, v_historico.nota_tempo, v_historico.nota_final,
        v_historico.total_questoes, v_historico.total_acertos, v_historico.tempo_total_minutos,
        v_historico.questoes_estudo, v_historico.acertos_estudo,
        v_historico.questoes_desafio, v_historico.acertos_desafio,
        v_historico.questoes_revisao, v_historico.acertos_revisao,
        NOW()
    )
    ON CONFLICT (usuario_id, componente, bimestre, ano)
    DO UPDATE SET
        nota_acertos = EXCLUDED.nota_acertos,
        nota_tempo = EXCLUDED.nota_tempo,
        nota_final = EXCLUDED.nota_final,
        total_questoes = EXCLUDED.total_questoes,
        total_acertos = EXCLUDED.total_acertos,
        tempo_total_minutos = EXCLUDED.tempo_total_minutos,
        questoes_estudo = EXCLUDED.questoes_estudo,
        acertos_estudo = EXCLUDED.acertos_estudo,
        questoes_desafio = EXCLUDED.questoes_desafio,
        acertos_desafio = EXCLUDED.acertos_desafio,
        questoes_revisao = EXCLUDED.questoes_revisao,
        acertos_revisao = EXCLUDED.acertos_revisao,
        atualizado_em = NOW();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- POLÍTICAS RLS PARA TABELAS DE BACKUP
-- ============================================================

-- Habilitar RLS nas tabelas de backup
ALTER TABLE historico_notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_tempo_uso ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_alteracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Políticas para historico_notas (usuários veem só seus dados, admins veem tudo)
DROP POLICY IF EXISTS "Usuarios veem seu historico de notas" ON historico_notas;
CREATE POLICY "Usuarios veem seu historico de notas" ON historico_notas
    FOR SELECT USING (
        auth.uid() = usuario_id
        OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo IN ('professor', 'admin'))
    );

-- Políticas para backup_respostas
DROP POLICY IF EXISTS "Usuarios veem seu backup de respostas" ON backup_respostas;
CREATE POLICY "Usuarios veem seu backup de respostas" ON backup_respostas
    FOR SELECT USING (
        auth.uid() = usuario_id
        OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo IN ('professor', 'admin'))
    );

-- Políticas para backup_tempo_uso
DROP POLICY IF EXISTS "Usuarios veem seu backup de tempo" ON backup_tempo_uso;
CREATE POLICY "Usuarios veem seu backup de tempo" ON backup_tempo_uso
    FOR SELECT USING (
        auth.uid() = usuario_id
        OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo IN ('professor', 'admin'))
    );

-- Log de alterações - só admins
DROP POLICY IF EXISTS "Apenas admins veem log de alteracoes" ON log_alteracoes_sistema;
CREATE POLICY "Apenas admins veem log de alteracoes" ON log_alteracoes_sistema
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo IN ('professor', 'admin'))
    );

-- ============================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================

COMMENT ON TABLE historico_notas IS 'Histórico completo de todas as alterações em notas. Nunca é deletado.';
COMMENT ON TABLE backup_respostas IS 'Backup de todas as respostas com dados da questão no momento. Nunca é deletado.';
COMMENT ON TABLE backup_tempo_uso IS 'Backup de todo o tempo de uso registrado. Nunca é deletado.';
COMMENT ON TABLE log_alteracoes_sistema IS 'Log de todas as alterações importantes no sistema.';

COMMENT ON FUNCTION criar_snapshot_usuario IS 'Cria snapshot completo dos dados de um usuário específico.';
COMMENT ON FUNCTION criar_snapshot_completo IS 'Cria snapshot de todos os usuários do sistema. Use antes de grandes alterações.';
COMMENT ON FUNCTION exportar_dados_usuario IS 'Exporta todos os dados de um usuário em formato JSON.';
COMMENT ON FUNCTION restaurar_nota_snapshot IS 'Restaura uma nota a partir de um snapshot do histórico.';

-- ============================================================
-- INSTRUÇÕES DE USO
-- ============================================================
/*
COMO USAR ESTE SISTEMA DE PROTEÇÃO:

1. BACKUP AUTOMÁTICO:
   - Os triggers fazem backup automático de qualquer UPDATE ou DELETE
   - Não é necessário nenhuma ação manual

2. ANTES DE GRANDES MUDANÇAS (ex: alterar questões, sistema de notas):
   SELECT * FROM criar_snapshot_completo('Antes de atualizar questões de física');

3. BACKUP DE UM USUÁRIO ESPECÍFICO:
   SELECT * FROM criar_snapshot_usuario('uuid-do-usuario', 'Backup antes de correção');

4. EXPORTAR DADOS DE UM USUÁRIO (para download/análise):
   SELECT exportar_dados_usuario('uuid-do-usuario');

5. RESTAURAR UMA NOTA DE UM SNAPSHOT:
   -- Primeiro, encontre o snapshot:
   SELECT * FROM historico_notas WHERE usuario_id = 'uuid' ORDER BY criado_em DESC;
   -- Depois restaure:
   SELECT restaurar_nota_snapshot(123, 'Restaurando após erro');

6. VER HISTÓRICO DE UM USUÁRIO:
   SELECT * FROM historico_notas WHERE usuario_id = 'uuid' ORDER BY criado_em DESC;
   SELECT * FROM backup_respostas WHERE usuario_id = 'uuid' ORDER BY criado_em DESC;

7. VER LOG DE ALTERAÇÕES DO SISTEMA:
   SELECT * FROM log_alteracoes_sistema ORDER BY criado_em DESC;
*/
