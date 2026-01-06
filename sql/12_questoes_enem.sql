-- ================================================================
-- SIMULADO ENEM - BANCO SEPARADO
-- Plataforma Studao - v2.0
-- Data: 2026-01-06
-- ================================================================

-- ================================================================
-- TABELA: questoes_enem
-- Questoes importadas da API enem.dev
-- ================================================================

CREATE TABLE IF NOT EXISTS questoes_enem (
    -- Identificacao
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_api VARCHAR(50) UNIQUE,              -- ID original da API (para evitar duplicatas)

    -- Dados da prova
    ano_prova INTEGER NOT NULL,             -- 2009-2023
    numero_questao INTEGER NOT NULL,        -- Numero na prova original
    caderno VARCHAR(10),                    -- Azul, Amarelo, etc (se aplicavel)

    -- Classificacao ENEM
    area VARCHAR(50) NOT NULL,              -- 'ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas'
    area_nome VARCHAR(100),                 -- Nome por extenso
    subarea VARCHAR(50),                    -- 'fisica', 'quimica', 'biologia', 'portugues', etc
    idioma VARCHAR(20),                     -- 'portugues', 'ingles', 'espanhol' (para Linguagens)

    -- Conteudo da questao
    titulo VARCHAR(255),                    -- "Questao 142 - ENEM 2023"
    contexto TEXT NOT NULL,                 -- Enunciado completo (suporta Markdown/HTML)
    comando TEXT,                           -- Texto antes das alternativas

    -- Imagens
    imagem_principal TEXT,                  -- URL da imagem do contexto
    imagens_extras TEXT[],                  -- Array de URLs adicionais

    -- Alternativas (5 no ENEM)
    alternativa_a TEXT NOT NULL,
    alternativa_b TEXT NOT NULL,
    alternativa_c TEXT NOT NULL,
    alternativa_d TEXT NOT NULL,
    alternativa_e TEXT NOT NULL,

    -- Imagens das alternativas (quando houver)
    imagem_a TEXT,
    imagem_b TEXT,
    imagem_c TEXT,
    imagem_d TEXT,
    imagem_e TEXT,

    -- Resposta
    resposta_correta CHAR(1) NOT NULL CHECK (resposta_correta IN ('A','B','C','D','E')),

    -- Classificacao por Conteudo
    conteudos TEXT[],                         -- Array de conteudos: ['Mecanica', 'Energia']
    conteudo_principal VARCHAR(100),          -- Conteudo dominante da questao

    -- Metadados
    fonte VARCHAR(50) DEFAULT 'ENEM',
    dificuldade VARCHAR(20) DEFAULT 'medio',  -- Estimativa baseada em estatisticas
    tags TEXT[],                              -- Tags para busca
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'revisao')),

    -- Auditoria
    importado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),
    importado_por UUID REFERENCES usuarios(id),  -- Usuario que importou (professor)

    -- Constraint unica
    UNIQUE(ano_prova, numero_questao, area)
);

-- Comentarios da tabela
COMMENT ON TABLE questoes_enem IS 'Questoes do ENEM importadas da API enem.dev - banco separado do sistema principal';
COMMENT ON COLUMN questoes_enem.area IS 'ciencias-natureza, matematica, linguagens, ciencias-humanas';
COMMENT ON COLUMN questoes_enem.subarea IS 'fisica, quimica, biologia, matematica, portugues, etc';
COMMENT ON COLUMN questoes_enem.conteudos IS 'Array de conteudos relacionados para filtragem especifica';

-- ================================================================
-- INDICES OTIMIZADOS - questoes_enem
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_enem_ano ON questoes_enem(ano_prova);
CREATE INDEX IF NOT EXISTS idx_enem_area ON questoes_enem(area);
CREATE INDEX IF NOT EXISTS idx_enem_subarea ON questoes_enem(subarea);
CREATE INDEX IF NOT EXISTS idx_enem_status ON questoes_enem(status);
CREATE INDEX IF NOT EXISTS idx_enem_area_subarea ON questoes_enem(area, subarea);
CREATE INDEX IF NOT EXISTS idx_enem_ano_area ON questoes_enem(ano_prova, area);
CREATE INDEX IF NOT EXISTS idx_enem_conteudo ON questoes_enem(conteudo_principal);
CREATE INDEX IF NOT EXISTS idx_enem_conteudos ON questoes_enem USING gin(conteudos);

-- Full-text search no contexto (para busca por palavras)
CREATE INDEX IF NOT EXISTS idx_enem_contexto_fts ON questoes_enem
    USING gin(to_tsvector('portuguese', contexto));

-- ================================================================
-- TABELA: conteudos_enem
-- Catalogo de conteudos para padronizacao e filtragem
-- ================================================================

CREATE TABLE IF NOT EXISTS conteudos_enem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Hierarquia
    area VARCHAR(50) NOT NULL,              -- 'ciencias-natureza', 'matematica'
    subarea VARCHAR(50) NOT NULL,           -- 'fisica', 'quimica', 'biologia', 'matematica'

    -- Conteudo
    codigo VARCHAR(50) NOT NULL UNIQUE,     -- 'mecanica', 'termologia', etc
    nome VARCHAR(100) NOT NULL,             -- 'Mecanica'
    descricao TEXT,                         -- Descricao do conteudo

    -- Palavras-chave para classificacao automatica
    palavras_chave TEXT[],                  -- ['forca', 'movimento', 'velocidade', 'aceleracao']

    -- Ordem de exibicao
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,

    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE conteudos_enem IS 'Catalogo padronizado de conteudos para filtragem de questoes ENEM';
COMMENT ON COLUMN conteudos_enem.palavras_chave IS 'Palavras-chave para classificacao semi-automatica de questoes';

-- Indices
CREATE INDEX IF NOT EXISTS idx_conteudos_area ON conteudos_enem(area);
CREATE INDEX IF NOT EXISTS idx_conteudos_subarea ON conteudos_enem(subarea);
CREATE INDEX IF NOT EXISTS idx_conteudos_ativo ON conteudos_enem(ativo);

-- ================================================================
-- DADOS INICIAIS - conteudos_enem
-- ================================================================

INSERT INTO conteudos_enem (area, subarea, codigo, nome, palavras_chave, ordem) VALUES
-- FISICA
('ciencias-natureza', 'fisica', 'mecanica', 'Mecânica', ARRAY['força', 'movimento', 'velocidade', 'aceleração', 'newton', 'atrito', 'inércia', 'queda livre', 'lançamento', 'trabalho', 'energia cinética', 'momento', 'colisão'], 1),
('ciencias-natureza', 'fisica', 'termologia', 'Termologia', ARRAY['temperatura', 'calor', 'dilatação', 'termodinâmica', 'entropia', 'gás', 'pressão', 'volume', 'kelvin', 'celsius', 'calorimetria'], 2),
('ciencias-natureza', 'fisica', 'optica', 'Óptica', ARRAY['luz', 'espelho', 'lente', 'refração', 'reflexão', 'difração', 'prisma', 'cor', 'visão', 'olho', 'imagem'], 3),
('ciencias-natureza', 'fisica', 'ondulatoria', 'Ondulatória', ARRAY['onda', 'frequência', 'período', 'som', 'acústica', 'ressonância', 'comprimento de onda', 'amplitude', 'interferência', 'doppler'], 4),
('ciencias-natureza', 'fisica', 'eletricidade', 'Eletricidade', ARRAY['corrente', 'tensão', 'resistência', 'circuito', 'elétrico', 'potência', 'voltagem', 'ampere', 'ohm', 'watts', 'energia elétrica', 'carga'], 5),
('ciencias-natureza', 'fisica', 'magnetismo', 'Magnetismo', ARRAY['campo magnético', 'ímã', 'indução', 'eletromagnetismo', 'faraday', 'lenz', 'motor', 'gerador', 'polo'], 6),
('ciencias-natureza', 'fisica', 'fisica-moderna', 'Física Moderna', ARRAY['quântica', 'relatividade', 'fóton', 'einstein', 'átomo', 'núcleo', 'radioatividade', 'efeito fotoelétrico', 'planck'], 7),

-- QUIMICA
('ciencias-natureza', 'quimica', 'quimica-geral', 'Química Geral', ARRAY['átomo', 'molécula', 'ligação', 'tabela periódica', 'elemento', 'composto', 'substância', 'mistura', 'íon'], 1),
('ciencias-natureza', 'quimica', 'fisico-quimica', 'Físico-Química', ARRAY['reação', 'equilíbrio', 'cinética', 'termoquímica', 'eletroquímica', 'pilha', 'eletrólise', 'ph', 'velocidade de reação'], 2),
('ciencias-natureza', 'quimica', 'quimica-organica', 'Química Orgânica', ARRAY['carbono', 'hidrocarboneto', 'álcool', 'éster', 'polímero', 'cadeia carbônica', 'função orgânica', 'isomeria', 'petróleo'], 3),
('ciencias-natureza', 'quimica', 'quimica-inorganica', 'Química Inorgânica', ARRAY['ácido', 'base', 'sal', 'óxido', 'metal', 'neutralização', 'hidróxido', 'reação inorgânica'], 4),
('ciencias-natureza', 'quimica', 'quimica-ambiental', 'Química Ambiental', ARRAY['poluição', 'meio ambiente', 'efeito estufa', 'chuva ácida', 'ozônio', 'aquecimento global', 'reciclagem', 'sustentabilidade'], 5),
('ciencias-natureza', 'quimica', 'estequiometria', 'Estequiometria', ARRAY['mol', 'massa molar', 'balanceamento', 'proporção', 'rendimento', 'reagente limitante', 'avogadro'], 6),

-- BIOLOGIA
('ciencias-natureza', 'biologia', 'citologia', 'Citologia', ARRAY['célula', 'membrana', 'núcleo', 'mitocôndria', 'organela', 'ribossomo', 'citoplasma', 'procarionte', 'eucarionte'], 1),
('ciencias-natureza', 'biologia', 'genetica', 'Genética', ARRAY['dna', 'gene', 'cromossomo', 'hereditário', 'mendel', 'dominante', 'recessivo', 'genótipo', 'fenótipo', 'mutação'], 2),
('ciencias-natureza', 'biologia', 'ecologia', 'Ecologia', ARRAY['ecossistema', 'cadeia alimentar', 'biodiversidade', 'sustentabilidade', 'bioma', 'população', 'comunidade', 'nicho', 'habitat'], 3),
('ciencias-natureza', 'biologia', 'fisiologia', 'Fisiologia', ARRAY['digestão', 'respiração', 'circulação', 'sistema nervoso', 'excreção', 'hormônio', 'coração', 'pulmão', 'sangue'], 4),
('ciencias-natureza', 'biologia', 'evolucao', 'Evolução', ARRAY['darwin', 'seleção natural', 'especiação', 'adaptação', 'origem das espécies', 'ancestral comum', 'lamarck', 'fóssil'], 5),
('ciencias-natureza', 'biologia', 'microbiologia', 'Microbiologia', ARRAY['bactéria', 'vírus', 'fungo', 'protozoário', 'vacina', 'antibiótico', 'doença', 'infecção', 'imunidade'], 6),
('ciencias-natureza', 'biologia', 'botanica', 'Botânica', ARRAY['planta', 'fotossíntese', 'clorofila', 'raiz', 'caule', 'folha', 'flor', 'fruto', 'semente'], 7),

-- MATEMATICA
('matematica', 'matematica', 'algebra', 'Álgebra', ARRAY['equação', 'inequação', 'polinômio', 'fatoração', 'expressão', 'sistema linear', 'variável', 'incógnita'], 1),
('matematica', 'matematica', 'geometria-plana', 'Geometria Plana', ARRAY['triângulo', 'círculo', 'área', 'perímetro', 'polígono', 'quadrilátero', 'ângulo', 'teorema de pitágoras', 'semelhança'], 2),
('matematica', 'matematica', 'geometria-espacial', 'Geometria Espacial', ARRAY['cubo', 'esfera', 'cone', 'pirâmide', 'volume', 'cilindro', 'prisma', 'tronco', 'área total', 'área lateral'], 3),
('matematica', 'matematica', 'funcoes', 'Funções', ARRAY['função', 'gráfico', 'domínio', 'imagem', 'exponencial', 'logaritmo', 'afim', 'quadrática', 'raiz'], 4),
('matematica', 'matematica', 'estatistica', 'Estatística', ARRAY['média', 'mediana', 'moda', 'desvio', 'gráfico', 'tabela', 'frequência', 'amostra', 'variância'], 5),
('matematica', 'matematica', 'probabilidade', 'Probabilidade', ARRAY['probabilidade', 'chance', 'evento', 'combinação', 'arranjo', 'permutação', 'fatorial', 'princípio fundamental'], 6),
('matematica', 'matematica', 'trigonometria', 'Trigonometria', ARRAY['seno', 'cosseno', 'tangente', 'ângulo', 'radiano', 'círculo trigonométrico', 'identidade', 'arco'], 7),
('matematica', 'matematica', 'geometria-analitica', 'Geometria Analítica', ARRAY['plano cartesiano', 'reta', 'circunferência', 'distância', 'ponto médio', 'coeficiente angular', 'cônicas'], 8),
('matematica', 'matematica', 'razao-proporcao', 'Razão e Proporção', ARRAY['razão', 'proporção', 'regra de três', 'porcentagem', 'escala', 'grandeza', 'diretamente proporcional', 'inversamente proporcional'], 9),
('matematica', 'matematica', 'matematica-financeira', 'Matemática Financeira', ARRAY['juros', 'composto', 'simples', 'capital', 'montante', 'taxa', 'desconto', 'prestação'], 10)
ON CONFLICT (codigo) DO NOTHING;

-- ================================================================
-- TABELA: respostas_enem
-- Respostas dos alunos no simulado
-- ================================================================

CREATE TABLE IF NOT EXISTS respostas_enem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Referencias
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    questao_id UUID NOT NULL REFERENCES questoes_enem(id) ON DELETE CASCADE,

    -- Resposta
    resposta_dada CHAR(1) NOT NULL CHECK (resposta_dada IN ('A','B','C','D','E')),
    correta BOOLEAN NOT NULL,
    tempo_segundos INTEGER DEFAULT 0,

    -- Contexto (desnormalizado para queries rapidas)
    ano_prova INTEGER NOT NULL,
    area VARCHAR(50) NOT NULL,
    subarea VARCHAR(50),
    conteudo_principal VARCHAR(100),

    -- Modo de pratica
    modo VARCHAR(20) DEFAULT 'livre' CHECK (modo IN ('livre', 'simulado', 'revisao')),
    sessao_id UUID,                          -- Para agrupar questoes de um simulado

    -- Timestamps
    criado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Evitar resposta duplicada para mesma questao
    UNIQUE(usuario_id, questao_id)
);

-- Comentarios
COMMENT ON TABLE respostas_enem IS 'Respostas dos alunos no simulado ENEM - separado do sistema de pontos';
COMMENT ON COLUMN respostas_enem.modo IS 'livre = pratica avulsa, simulado = prova cronometrada, revisao = refazer erros';

-- Indices
CREATE INDEX IF NOT EXISTS idx_resp_enem_usuario ON respostas_enem(usuario_id);
CREATE INDEX IF NOT EXISTS idx_resp_enem_questao ON respostas_enem(questao_id);
CREATE INDEX IF NOT EXISTS idx_resp_enem_area ON respostas_enem(area);
CREATE INDEX IF NOT EXISTS idx_resp_enem_subarea ON respostas_enem(subarea);
CREATE INDEX IF NOT EXISTS idx_resp_enem_conteudo ON respostas_enem(conteudo_principal);
CREATE INDEX IF NOT EXISTS idx_resp_enem_usuario_area ON respostas_enem(usuario_id, area);
CREATE INDEX IF NOT EXISTS idx_resp_enem_data ON respostas_enem(criado_em);
CREATE INDEX IF NOT EXISTS idx_resp_enem_correta ON respostas_enem(usuario_id, correta);

-- ================================================================
-- RLS POLICIES
-- ================================================================

-- Habilitar RLS
ALTER TABLE questoes_enem ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteudos_enem ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_enem ENABLE ROW LEVEL SECURITY;

-- QUESTOES_ENEM

-- Leitura: todos podem ver questoes ativas
DROP POLICY IF EXISTS "questoes_enem_leitura_publica" ON questoes_enem;
CREATE POLICY "questoes_enem_leitura_publica" ON questoes_enem
    FOR SELECT USING (status = 'ativa');

-- Escrita: apenas professores podem inserir/atualizar
DROP POLICY IF EXISTS "questoes_enem_escrita_professor" ON questoes_enem;
CREATE POLICY "questoes_enem_escrita_professor" ON questoes_enem
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND tipo = 'professor'
        )
    );

-- CONTEUDOS_ENEM

-- Leitura: todos podem ver conteudos ativos
DROP POLICY IF EXISTS "conteudos_enem_leitura_publica" ON conteudos_enem;
CREATE POLICY "conteudos_enem_leitura_publica" ON conteudos_enem
    FOR SELECT USING (ativo = true);

-- Escrita: apenas professores
DROP POLICY IF EXISTS "conteudos_enem_escrita_professor" ON conteudos_enem;
CREATE POLICY "conteudos_enem_escrita_professor" ON conteudos_enem
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND tipo = 'professor'
        )
    );

-- RESPOSTAS_ENEM

-- Leitura: usuario ve apenas suas proprias
DROP POLICY IF EXISTS "respostas_enem_leitura_usuario" ON respostas_enem;
CREATE POLICY "respostas_enem_leitura_usuario" ON respostas_enem
    FOR SELECT USING (usuario_id = auth.uid());

-- Professor pode ver todas (para relatorios)
DROP POLICY IF EXISTS "respostas_enem_leitura_professor" ON respostas_enem;
CREATE POLICY "respostas_enem_leitura_professor" ON respostas_enem
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND tipo = 'professor'
        )
    );

-- Insercao: usuario insere apenas suas proprias
DROP POLICY IF EXISTS "respostas_enem_insercao_usuario" ON respostas_enem;
CREATE POLICY "respostas_enem_insercao_usuario" ON respostas_enem
    FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- ================================================================
-- FUNCAO: Atualizar timestamp
-- ================================================================

CREATE OR REPLACE FUNCTION atualizar_timestamp_enem()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para questoes_enem
DROP TRIGGER IF EXISTS tr_questoes_enem_atualizar ON questoes_enem;
CREATE TRIGGER tr_questoes_enem_atualizar
    BEFORE UPDATE ON questoes_enem
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp_enem();

-- ================================================================
-- FUNCAO: Buscar questao aleatoria nao respondida
-- ================================================================

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

-- ================================================================
-- FUNCAO: Estatisticas do usuario no ENEM
-- ================================================================

CREATE OR REPLACE FUNCTION estatisticas_enem_usuario(p_usuario_id UUID)
RETURNS JSON AS $$
DECLARE
    v_resultado JSON;
BEGIN
    SELECT json_build_object(
        'total_questoes', COUNT(*),
        'total_corretas', COUNT(*) FILTER (WHERE correta = true),
        'taxa_acerto', ROUND(
            (COUNT(*) FILTER (WHERE correta = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1
        ),
        'tempo_medio', ROUND(AVG(tempo_segundos)),
        'por_area', (
            SELECT json_object_agg(
                area,
                json_build_object(
                    'total', COUNT(*),
                    'corretas', COUNT(*) FILTER (WHERE correta = true),
                    'taxa', ROUND((COUNT(*) FILTER (WHERE correta = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                )
            )
            FROM respostas_enem
            WHERE usuario_id = p_usuario_id
            GROUP BY area
        ),
        'por_subarea', (
            SELECT json_object_agg(
                subarea,
                json_build_object(
                    'total', COUNT(*),
                    'corretas', COUNT(*) FILTER (WHERE correta = true),
                    'taxa', ROUND((COUNT(*) FILTER (WHERE correta = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                )
            )
            FROM respostas_enem
            WHERE usuario_id = p_usuario_id AND subarea IS NOT NULL
            GROUP BY subarea
        ),
        'por_ano', (
            SELECT json_object_agg(
                ano_prova,
                json_build_object(
                    'total', COUNT(*),
                    'corretas', COUNT(*) FILTER (WHERE correta = true),
                    'taxa', ROUND((COUNT(*) FILTER (WHERE correta = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1)
                )
            )
            FROM respostas_enem
            WHERE usuario_id = p_usuario_id
            GROUP BY ano_prova
        )
    ) INTO v_resultado
    FROM respostas_enem
    WHERE usuario_id = p_usuario_id;

    RETURN COALESCE(v_resultado, '{"total_questoes": 0, "total_corretas": 0, "taxa_acerto": 0}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================

GRANT ALL ON questoes_enem TO authenticated;
GRANT ALL ON conteudos_enem TO authenticated;
GRANT ALL ON respostas_enem TO authenticated;

-- ================================================================
-- VERIFICACAO FINAL
-- ================================================================

DO $$
DECLARE
    v_tabelas_criadas INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_tabelas_criadas
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('questoes_enem', 'conteudos_enem', 'respostas_enem');

    IF v_tabelas_criadas = 3 THEN
        RAISE NOTICE '✅ Todas as tabelas ENEM criadas com sucesso!';
        RAISE NOTICE '   - questoes_enem: Questoes importadas da API';
        RAISE NOTICE '   - conteudos_enem: Catalogo de conteudos para filtragem';
        RAISE NOTICE '   - respostas_enem: Respostas dos alunos';
    ELSE
        RAISE EXCEPTION 'Erro: Apenas % de 3 tabelas foram criadas', v_tabelas_criadas;
    END IF;
END $$;
