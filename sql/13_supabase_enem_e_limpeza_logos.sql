-- ================================================================
-- SUPABASE - SIMULADO ENEM + LIMPEZA STORAGE LOGOS
-- Plataforma Studao - v2.0
-- Data: 2026-01-06
--
-- INSTRUCOES:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Secao 1: Cria tabelas do ENEM
-- 3. Secao 2: Remove storage de logos (agora estatico)
-- ================================================================


-- ████████████████████████████████████████████████████████████████
-- SECAO 1: SIMULADO ENEM - TABELAS E CONFIGURACOES
-- ████████████████████████████████████████████████████████████████


-- ================================================================
-- 1.1 TABELA: questoes_enem
-- Questoes importadas da API enem.dev
-- ================================================================

CREATE TABLE IF NOT EXISTS questoes_enem (
    -- Identificacao
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_api VARCHAR(50) UNIQUE,

    -- Dados da prova
    ano_prova INTEGER NOT NULL,
    numero_questao INTEGER NOT NULL,
    caderno VARCHAR(10),

    -- Classificacao ENEM
    area VARCHAR(50) NOT NULL,
    area_nome VARCHAR(100),
    subarea VARCHAR(50),
    idioma VARCHAR(20),

    -- Conteudo da questao
    titulo VARCHAR(255),
    contexto TEXT NOT NULL,
    comando TEXT,

    -- Imagens
    imagem_principal TEXT,
    imagens_extras TEXT[],

    -- Alternativas (5 no ENEM)
    alternativa_a TEXT NOT NULL,
    alternativa_b TEXT NOT NULL,
    alternativa_c TEXT NOT NULL,
    alternativa_d TEXT NOT NULL,
    alternativa_e TEXT NOT NULL,

    -- Imagens das alternativas
    imagem_a TEXT,
    imagem_b TEXT,
    imagem_c TEXT,
    imagem_d TEXT,
    imagem_e TEXT,

    -- Resposta
    resposta_correta CHAR(1) NOT NULL CHECK (resposta_correta IN ('A','B','C','D','E')),

    -- Classificacao por Conteudo
    conteudos TEXT[],
    conteudo_principal VARCHAR(100),

    -- Metadados
    fonte VARCHAR(50) DEFAULT 'ENEM',
    dificuldade VARCHAR(20) DEFAULT 'medio',
    tags TEXT[],
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'revisao')),

    -- Auditoria
    importado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    importado_por UUID REFERENCES usuarios(id),

    -- Constraint unica
    UNIQUE(ano_prova, numero_questao, area)
);

COMMENT ON TABLE questoes_enem IS 'Questoes do ENEM - banco separado do sistema principal';


-- ================================================================
-- 1.2 INDICES - questoes_enem
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_enem_ano ON questoes_enem(ano_prova);
CREATE INDEX IF NOT EXISTS idx_enem_area ON questoes_enem(area);
CREATE INDEX IF NOT EXISTS idx_enem_subarea ON questoes_enem(subarea);
CREATE INDEX IF NOT EXISTS idx_enem_status ON questoes_enem(status);
CREATE INDEX IF NOT EXISTS idx_enem_area_subarea ON questoes_enem(area, subarea);
CREATE INDEX IF NOT EXISTS idx_enem_ano_area ON questoes_enem(ano_prova, area);
CREATE INDEX IF NOT EXISTS idx_enem_conteudo ON questoes_enem(conteudo_principal);
CREATE INDEX IF NOT EXISTS idx_enem_conteudos ON questoes_enem USING gin(conteudos);
CREATE INDEX IF NOT EXISTS idx_enem_contexto_fts ON questoes_enem USING gin(to_tsvector('portuguese', contexto));


-- ================================================================
-- 1.3 TABELA: conteudos_enem
-- Catalogo de conteudos para filtragem
-- ================================================================

CREATE TABLE IF NOT EXISTS conteudos_enem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area VARCHAR(50) NOT NULL,
    subarea VARCHAR(50) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    palavras_chave TEXT[],
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE conteudos_enem IS 'Catalogo de conteudos para filtragem de questoes ENEM';

CREATE INDEX IF NOT EXISTS idx_conteudos_area ON conteudos_enem(area);
CREATE INDEX IF NOT EXISTS idx_conteudos_subarea ON conteudos_enem(subarea);
CREATE INDEX IF NOT EXISTS idx_conteudos_ativo ON conteudos_enem(ativo);


-- ================================================================
-- 1.4 DADOS INICIAIS - conteudos_enem
-- ================================================================

INSERT INTO conteudos_enem (area, subarea, codigo, nome, palavras_chave, ordem) VALUES
-- FISICA
('ciencias-natureza', 'fisica', 'mecanica', 'Mecânica', ARRAY['força', 'movimento', 'velocidade', 'aceleração', 'newton', 'atrito', 'inércia', 'queda livre', 'trabalho', 'energia cinética', 'momento'], 1),
('ciencias-natureza', 'fisica', 'termologia', 'Termologia', ARRAY['temperatura', 'calor', 'dilatação', 'termodinâmica', 'entropia', 'gás', 'pressão', 'volume', 'calorimetria'], 2),
('ciencias-natureza', 'fisica', 'optica', 'Óptica', ARRAY['luz', 'espelho', 'lente', 'refração', 'reflexão', 'difração', 'prisma', 'cor', 'visão', 'imagem'], 3),
('ciencias-natureza', 'fisica', 'ondulatoria', 'Ondulatória', ARRAY['onda', 'frequência', 'período', 'som', 'acústica', 'ressonância', 'comprimento de onda', 'doppler'], 4),
('ciencias-natureza', 'fisica', 'eletricidade', 'Eletricidade', ARRAY['corrente', 'tensão', 'resistência', 'circuito', 'elétrico', 'potência', 'voltagem', 'energia elétrica', 'carga'], 5),
('ciencias-natureza', 'fisica', 'magnetismo', 'Magnetismo', ARRAY['campo magnético', 'ímã', 'indução', 'eletromagnetismo', 'faraday', 'motor', 'gerador'], 6),
('ciencias-natureza', 'fisica', 'fisica-moderna', 'Física Moderna', ARRAY['quântica', 'relatividade', 'fóton', 'einstein', 'átomo', 'núcleo', 'radioatividade', 'efeito fotoelétrico'], 7),

-- QUIMICA
('ciencias-natureza', 'quimica', 'quimica-geral', 'Química Geral', ARRAY['átomo', 'molécula', 'ligação', 'tabela periódica', 'elemento', 'composto', 'substância', 'mistura'], 1),
('ciencias-natureza', 'quimica', 'fisico-quimica', 'Físico-Química', ARRAY['reação', 'equilíbrio', 'cinética', 'termoquímica', 'eletroquímica', 'pilha', 'eletrólise', 'ph'], 2),
('ciencias-natureza', 'quimica', 'quimica-organica', 'Química Orgânica', ARRAY['carbono', 'hidrocarboneto', 'álcool', 'éster', 'polímero', 'cadeia carbônica', 'isomeria', 'petróleo'], 3),
('ciencias-natureza', 'quimica', 'quimica-inorganica', 'Química Inorgânica', ARRAY['ácido', 'base', 'sal', 'óxido', 'metal', 'neutralização', 'hidróxido'], 4),
('ciencias-natureza', 'quimica', 'quimica-ambiental', 'Química Ambiental', ARRAY['poluição', 'meio ambiente', 'efeito estufa', 'chuva ácida', 'ozônio', 'aquecimento global'], 5),
('ciencias-natureza', 'quimica', 'estequiometria', 'Estequiometria', ARRAY['mol', 'massa molar', 'balanceamento', 'proporção', 'rendimento', 'avogadro'], 6),

-- BIOLOGIA
('ciencias-natureza', 'biologia', 'citologia', 'Citologia', ARRAY['célula', 'membrana', 'núcleo', 'mitocôndria', 'organela', 'citoplasma'], 1),
('ciencias-natureza', 'biologia', 'genetica', 'Genética', ARRAY['dna', 'gene', 'cromossomo', 'hereditário', 'mendel', 'genótipo', 'fenótipo', 'mutação'], 2),
('ciencias-natureza', 'biologia', 'ecologia', 'Ecologia', ARRAY['ecossistema', 'cadeia alimentar', 'biodiversidade', 'bioma', 'população', 'comunidade'], 3),
('ciencias-natureza', 'biologia', 'fisiologia', 'Fisiologia', ARRAY['digestão', 'respiração', 'circulação', 'sistema nervoso', 'excreção', 'hormônio'], 4),
('ciencias-natureza', 'biologia', 'evolucao', 'Evolução', ARRAY['darwin', 'seleção natural', 'especiação', 'adaptação', 'ancestral comum', 'fóssil'], 5),
('ciencias-natureza', 'biologia', 'microbiologia', 'Microbiologia', ARRAY['bactéria', 'vírus', 'fungo', 'vacina', 'antibiótico', 'doença', 'imunidade'], 6),
('ciencias-natureza', 'biologia', 'botanica', 'Botânica', ARRAY['planta', 'fotossíntese', 'clorofila', 'raiz', 'caule', 'folha', 'flor'], 7),

-- MATEMATICA
('matematica', 'matematica', 'algebra', 'Álgebra', ARRAY['equação', 'inequação', 'polinômio', 'fatoração', 'sistema linear', 'variável'], 1),
('matematica', 'matematica', 'geometria-plana', 'Geometria Plana', ARRAY['triângulo', 'círculo', 'área', 'perímetro', 'polígono', 'ângulo', 'pitágoras'], 2),
('matematica', 'matematica', 'geometria-espacial', 'Geometria Espacial', ARRAY['cubo', 'esfera', 'cone', 'pirâmide', 'volume', 'cilindro', 'prisma'], 3),
('matematica', 'matematica', 'funcoes', 'Funções', ARRAY['função', 'gráfico', 'domínio', 'imagem', 'exponencial', 'logaritmo', 'quadrática'], 4),
('matematica', 'matematica', 'estatistica', 'Estatística', ARRAY['média', 'mediana', 'moda', 'desvio', 'gráfico', 'tabela', 'frequência'], 5),
('matematica', 'matematica', 'probabilidade', 'Probabilidade', ARRAY['probabilidade', 'chance', 'evento', 'combinação', 'arranjo', 'permutação'], 6),
('matematica', 'matematica', 'trigonometria', 'Trigonometria', ARRAY['seno', 'cosseno', 'tangente', 'ângulo', 'radiano', 'círculo trigonométrico'], 7),
('matematica', 'matematica', 'geometria-analitica', 'Geometria Analítica', ARRAY['plano cartesiano', 'reta', 'circunferência', 'distância', 'coeficiente angular'], 8),
('matematica', 'matematica', 'razao-proporcao', 'Razão e Proporção', ARRAY['razão', 'proporção', 'regra de três', 'porcentagem', 'escala'], 9),
('matematica', 'matematica', 'matematica-financeira', 'Matemática Financeira', ARRAY['juros', 'composto', 'simples', 'capital', 'montante', 'taxa'], 10)
ON CONFLICT (codigo) DO NOTHING;


-- ================================================================
-- 1.5 TABELA: respostas_enem
-- Respostas dos alunos no simulado
-- ================================================================

CREATE TABLE IF NOT EXISTS respostas_enem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    questao_id UUID NOT NULL REFERENCES questoes_enem(id) ON DELETE CASCADE,
    resposta_dada CHAR(1) NOT NULL CHECK (resposta_dada IN ('A','B','C','D','E')),
    correta BOOLEAN NOT NULL,
    tempo_segundos INTEGER DEFAULT 0,
    ano_prova INTEGER NOT NULL,
    area VARCHAR(50) NOT NULL,
    subarea VARCHAR(50),
    conteudo_principal VARCHAR(100),
    modo VARCHAR(20) DEFAULT 'livre' CHECK (modo IN ('livre', 'simulado', 'revisao')),
    sessao_id UUID,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(usuario_id, questao_id)
);

COMMENT ON TABLE respostas_enem IS 'Respostas dos alunos no simulado ENEM - separado do sistema de pontos';

CREATE INDEX IF NOT EXISTS idx_resp_enem_usuario ON respostas_enem(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resp_enem_questao ON respostas_enem(questao_id);
CREATE INDEX IF NOT EXISTS idx_resp_enem_area ON respostas_enem(area);
CREATE INDEX IF NOT EXISTS idx_resp_enem_subarea ON respostas_enem(subarea);
CREATE INDEX IF NOT EXISTS idx_resp_enem_conteudo ON respostas_enem(conteudo_principal);
CREATE INDEX IF NOT EXISTS idx_resp_enem_usuario_area ON respostas_enem(usuario_id, area);
CREATE INDEX IF NOT EXISTS idx_resp_enem_data ON respostas_enem(criado_em);
CREATE INDEX IF NOT EXISTS idx_resp_enem_correta ON respostas_enem(usuario_id, correta);


-- ================================================================
-- 1.6 RLS POLICIES - ENEM
-- ================================================================

-- Habilitar RLS
ALTER TABLE questoes_enem ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteudos_enem ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_enem ENABLE ROW LEVEL SECURITY;

-- QUESTOES_ENEM
DROP POLICY IF EXISTS "questoes_enem_leitura_publica" ON questoes_enem;
CREATE POLICY "questoes_enem_leitura_publica" ON questoes_enem
    FOR SELECT USING (status = 'ativa');

DROP POLICY IF EXISTS "questoes_enem_escrita_professor" ON questoes_enem;
CREATE POLICY "questoes_enem_escrita_professor" ON questoes_enem
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo = 'professor')
    );

-- CONTEUDOS_ENEM
DROP POLICY IF EXISTS "conteudos_enem_leitura_publica" ON conteudos_enem;
CREATE POLICY "conteudos_enem_leitura_publica" ON conteudos_enem
    FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "conteudos_enem_escrita_professor" ON conteudos_enem;
CREATE POLICY "conteudos_enem_escrita_professor" ON conteudos_enem
    FOR ALL USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo = 'professor')
    );

-- RESPOSTAS_ENEM
DROP POLICY IF EXISTS "respostas_enem_leitura_usuario" ON respostas_enem;
CREATE POLICY "respostas_enem_leitura_usuario" ON respostas_enem
    FOR SELECT USING (usuario_id = auth.uid());

DROP POLICY IF EXISTS "respostas_enem_leitura_professor" ON respostas_enem;
CREATE POLICY "respostas_enem_leitura_professor" ON respostas_enem
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND tipo = 'professor')
    );

DROP POLICY IF EXISTS "respostas_enem_insercao_usuario" ON respostas_enem;
CREATE POLICY "respostas_enem_insercao_usuario" ON respostas_enem
    FOR INSERT WITH CHECK (usuario_id = auth.uid());


-- ================================================================
-- 1.7 FUNCOES AUXILIARES - ENEM
-- ================================================================

-- Atualizar timestamp
CREATE OR REPLACE FUNCTION atualizar_timestamp_enem()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_questoes_enem_atualizar ON questoes_enem;
CREATE TRIGGER tr_questoes_enem_atualizar
    BEFORE UPDATE ON questoes_enem
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp_enem();

-- Buscar questao aleatoria
CREATE OR REPLACE FUNCTION buscar_questao_enem_aleatoria(
    p_usuario_id UUID,
    p_area VARCHAR DEFAULT NULL,
    p_subarea VARCHAR DEFAULT NULL,
    p_ano INTEGER DEFAULT NULL,
    p_conteudo VARCHAR DEFAULT NULL
)
RETURNS questoes_enem AS $$
DECLARE
    v_questao questoes_enem;
BEGIN
    SELECT q.* INTO v_questao
    FROM questoes_enem q
    WHERE q.status = 'ativa'
    AND (p_area IS NULL OR q.area = p_area)
    AND (p_subarea IS NULL OR q.subarea = p_subarea)
    AND (p_ano IS NULL OR q.ano_prova = p_ano)
    AND (p_conteudo IS NULL OR q.conteudo_principal = p_conteudo OR p_conteudo = ANY(q.conteudos))
    AND NOT EXISTS (
        SELECT 1 FROM respostas_enem r
        WHERE r.questao_id = q.id AND r.usuario_id = p_usuario_id
    )
    ORDER BY RANDOM()
    LIMIT 1;
    RETURN v_questao;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Estatisticas do usuario
CREATE OR REPLACE FUNCTION estatisticas_enem_usuario(p_usuario_id UUID)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'total_questoes', COUNT(*),
        'total_corretas', COUNT(*) FILTER (WHERE correta = true),
        'taxa_acerto', ROUND((COUNT(*) FILTER (WHERE correta = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1),
        'tempo_medio', ROUND(AVG(tempo_segundos)),
        'por_area', (
            SELECT json_object_agg(area, json_build_object(
                'total', COUNT(*),
                'corretas', COUNT(*) FILTER (WHERE correta = true),
                'taxa', ROUND((COUNT(*) FILTER (WHERE correta = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
            ))
            FROM respostas_enem WHERE usuario_id = p_usuario_id GROUP BY area
        )
    ) INTO v_resultado
    FROM respostas_enem WHERE usuario_id = p_usuario_id;
    RETURN COALESCE(v_resultado, '{"total_questoes": 0, "total_corretas": 0, "taxa_acerto": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ================================================================
-- 1.8 PERMISSOES
-- ================================================================

GRANT ALL ON questoes_enem TO authenticated;
GRANT ALL ON conteudos_enem TO authenticated;
GRANT ALL ON respostas_enem TO authenticated;


-- ████████████████████████████████████████████████████████████████
-- SECAO 2: LIMPEZA DO STORAGE DE LOGOS
-- (Logo agora e estatico, nao precisa mais de upload)
-- ████████████████████████████████████████████████████████████████


-- ================================================================
-- 2.1 REMOVER COLUNA logo_url DA TABELA configuracoes
-- (Se existir)
-- ================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'configuracoes' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE configuracoes DROP COLUMN logo_url;
        RAISE NOTICE '✅ Coluna logo_url removida da tabela configuracoes';
    ELSE
        RAISE NOTICE '⏭️ Coluna logo_url nao existe em configuracoes (ja removida ou nunca existiu)';
    END IF;
END $$;


-- ================================================================
-- 2.2 REMOVER POLICIES DO BUCKET 'logos'
-- ================================================================

-- Listar e remover todas as policies relacionadas ao bucket logos
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Remover policies de storage.objects relacionadas a logos
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'objects'
        AND schemaname = 'storage'
        AND (policyname ILIKE '%logo%' OR policyname ILIKE '%logos%')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policyname);
        RAISE NOTICE '✅ Policy removida: %', policy_record.policyname;
    END LOOP;
END $$;

-- Remover policies especificas conhecidas (caso existam)
DROP POLICY IF EXISTS "logos_leitura_publica" ON storage.objects;
DROP POLICY IF EXISTS "logos_escrita_professor" ON storage.objects;
DROP POLICY IF EXISTS "logos_update_professor" ON storage.objects;
DROP POLICY IF EXISTS "logos_delete_professor" ON storage.objects;
DROP POLICY IF EXISTS "logo_leitura_publica" ON storage.objects;
DROP POLICY IF EXISTS "logo_escrita_professor" ON storage.objects;
DROP POLICY IF EXISTS "Permitir leitura publica de logos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de logos por professores" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualizacao de logos por professores" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusao de logos por professores" ON storage.objects;


-- ================================================================
-- 2.3 ESVAZIAR E REMOVER BUCKET 'logos'
-- (Nota: Isso precisa ser feito pelo Dashboard do Supabase
--  ou usando a API de Storage. O SQL nao pode deletar buckets diretamente.)
-- ================================================================

-- Remover referencia do bucket na tabela storage.buckets
-- CUIDADO: Isso NAO deleta os arquivos fisicos, apenas a referencia
DO $$
BEGIN
    -- Primeiro, deletar os objetos do bucket
    DELETE FROM storage.objects WHERE bucket_id = 'logos';
    RAISE NOTICE '✅ Objetos do bucket logos removidos';

    -- Depois, deletar o bucket
    DELETE FROM storage.buckets WHERE id = 'logos';
    RAISE NOTICE '✅ Bucket logos removido';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Nao foi possivel remover bucket logos via SQL. Remova manualmente pelo Dashboard do Supabase.';
END $$;


-- ████████████████████████████████████████████████████████████████
-- SECAO 3: VERIFICACAO FINAL
-- ████████████████████████████████████████████████████████████████

DO $$
DECLARE
    v_tabelas_enem INTEGER;
    v_conteudos INTEGER;
    v_bucket_logos BOOLEAN;
BEGIN
    -- Verificar tabelas ENEM
    SELECT COUNT(*) INTO v_tabelas_enem
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('questoes_enem', 'conteudos_enem', 'respostas_enem');

    -- Verificar conteudos inseridos
    SELECT COUNT(*) INTO v_conteudos FROM conteudos_enem;

    -- Verificar se bucket logos ainda existe
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'logos') INTO v_bucket_logos;

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '                    RESULTADO DA EXECUCAO                    ';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';

    IF v_tabelas_enem = 3 THEN
        RAISE NOTICE '✅ ENEM: Todas as 3 tabelas criadas com sucesso!';
        RAISE NOTICE '   - questoes_enem: Questoes do ENEM';
        RAISE NOTICE '   - conteudos_enem: % conteudos cadastrados', v_conteudos;
        RAISE NOTICE '   - respostas_enem: Respostas dos alunos';
    ELSE
        RAISE NOTICE '❌ ENEM: Apenas % de 3 tabelas foram criadas', v_tabelas_enem;
    END IF;

    RAISE NOTICE '';

    IF NOT v_bucket_logos THEN
        RAISE NOTICE '✅ LOGOS: Bucket removido com sucesso!';
    ELSE
        RAISE NOTICE '⚠️ LOGOS: Bucket ainda existe. Remova manualmente pelo Dashboard.';
        RAISE NOTICE '   Storage > logos > Delete bucket';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;
