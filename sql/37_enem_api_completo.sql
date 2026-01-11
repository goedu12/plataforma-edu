-- ================================================================
-- ENEM API - Configuração completa para API enem.dev
-- Plataforma Studao - v2.0
-- Data: 2026-01-11
-- ================================================================

-- ================================================================
-- AJUSTES NA TABELA respostas_enem
-- Tornar campos opcionais para questões externas
-- ================================================================

ALTER TABLE respostas_enem
    ALTER COLUMN ano_prova DROP NOT NULL,
    ALTER COLUMN area DROP NOT NULL;

-- ================================================================
-- CONTEÚDOS: LINGUAGENS
-- ================================================================

INSERT INTO conteudos_enem (area, subarea, codigo, nome, palavras_chave, ordem) VALUES
-- PORTUGUÊS
('linguagens', 'portugues', 'interpretacao', 'Interpretação de Texto', ARRAY['texto', 'interpretação', 'compreensão', 'leitura', 'sentido', 'contexto', 'inferência'], 1),
('linguagens', 'portugues', 'gramatica', 'Gramática', ARRAY['gramática', 'sintaxe', 'morfologia', 'verbo', 'pronome', 'concordância', 'regência', 'pontuação'], 2),
('linguagens', 'portugues', 'redacao', 'Redação', ARRAY['redação', 'argumentação', 'dissertação', 'texto dissertativo', 'proposta de intervenção'], 3),
('linguagens', 'portugues', 'generos-textuais', 'Gêneros Textuais', ARRAY['gênero', 'texto', 'narrativo', 'dissertativo', 'descritivo', 'jornalístico', 'propaganda'], 4),
('linguagens', 'portugues', 'figuras-linguagem', 'Figuras de Linguagem', ARRAY['metáfora', 'metonímia', 'ironia', 'hipérbole', 'antítese', 'figura de linguagem'], 5),
('linguagens', 'portugues', 'variacao-linguistica', 'Variação Linguística', ARRAY['variação', 'dialeto', 'regionalismo', 'norma culta', 'coloquial', 'formal', 'informal'], 6),

-- LITERATURA
('linguagens', 'literatura', 'literatura-brasileira', 'Literatura Brasileira', ARRAY['literatura', 'brasileiro', 'romance', 'poesia', 'conto', 'autor', 'obra literária'], 1),
('linguagens', 'literatura', 'escolas-literarias', 'Escolas Literárias', ARRAY['romantismo', 'realismo', 'naturalismo', 'modernismo', 'parnasianismo', 'simbolismo', 'barroco', 'arcadismo'], 2),
('linguagens', 'literatura', 'literatura-portuguesa', 'Literatura Portuguesa', ARRAY['portugal', 'camões', 'fernando pessoa', 'lusíadas', 'literatura portuguesa'], 3),

-- INGLÊS
('linguagens', 'ingles', 'ingles-interpretacao', 'Interpretação em Inglês', ARRAY['english', 'text', 'reading', 'comprehension', 'interpretation'], 1),
('linguagens', 'ingles', 'ingles-vocabulario', 'Vocabulário em Inglês', ARRAY['vocabulary', 'words', 'meaning', 'synonym', 'antonym'], 2),
('linguagens', 'ingles', 'ingles-gramatica', 'Gramática em Inglês', ARRAY['grammar', 'verb', 'tense', 'preposition', 'article'], 3),

-- ESPANHOL
('linguagens', 'espanhol', 'espanhol-interpretacao', 'Interpretação em Espanhol', ARRAY['español', 'texto', 'lectura', 'comprensión', 'interpretación'], 1),
('linguagens', 'espanhol', 'espanhol-vocabulario', 'Vocabulário em Espanhol', ARRAY['vocabulario', 'palabras', 'significado', 'sinónimo', 'antónimo'], 2),
('linguagens', 'espanhol', 'espanhol-gramatica', 'Gramática em Espanhol', ARRAY['gramática', 'verbo', 'tiempo', 'preposición', 'artículo'], 3),

-- ARTES
('linguagens', 'artes', 'artes-visuais', 'Artes Visuais', ARRAY['pintura', 'escultura', 'arte', 'artista', 'obra', 'movimento artístico', 'impressionismo', 'cubismo'], 1),
('linguagens', 'artes', 'musica', 'Música', ARRAY['música', 'som', 'instrumento', 'compositor', 'ritmo', 'melodia'], 2),
('linguagens', 'artes', 'cultura', 'Cultura e Manifestações', ARRAY['cultura', 'folclore', 'manifestação cultural', 'patrimônio', 'tradição'], 3)

ON CONFLICT (codigo) DO NOTHING;

-- ================================================================
-- CONTEÚDOS: CIÊNCIAS HUMANAS
-- ================================================================

INSERT INTO conteudos_enem (area, subarea, codigo, nome, palavras_chave, ordem) VALUES
-- HISTÓRIA
('ciencias-humanas', 'historia', 'brasil-colonia', 'Brasil Colônia', ARRAY['colônia', 'colonização', 'escravidão', 'índio', 'portugal', 'descobrimento', 'pau-brasil'], 1),
('ciencias-humanas', 'historia', 'brasil-imperio', 'Brasil Império', ARRAY['império', 'independência', 'dom pedro', 'monarquia', 'regência', 'abolição'], 2),
('ciencias-humanas', 'historia', 'brasil-republica', 'Brasil República', ARRAY['república', 'vargas', 'ditadura', 'democracia', 'constituição', 'golpe'], 3),
('ciencias-humanas', 'historia', 'historia-geral', 'História Geral', ARRAY['revolução', 'guerra', 'antiguidade', 'medieval', 'moderna', 'contemporânea'], 4),
('ciencias-humanas', 'historia', 'guerras-mundiais', 'Guerras Mundiais', ARRAY['guerra mundial', 'nazismo', 'fascismo', 'hitler', 'holocausto', 'aliados'], 5),
('ciencias-humanas', 'historia', 'guerra-fria', 'Guerra Fria', ARRAY['guerra fria', 'capitalismo', 'socialismo', 'urss', 'estados unidos', 'bipolar'], 6),

-- GEOGRAFIA
('ciencias-humanas', 'geografia', 'geografia-brasil', 'Geografia do Brasil', ARRAY['brasil', 'região', 'estado', 'população', 'território brasileiro'], 1),
('ciencias-humanas', 'geografia', 'geopolitica', 'Geopolítica', ARRAY['geopolítica', 'globalização', 'conflito', 'fronteira', 'território', 'poder'], 2),
('ciencias-humanas', 'geografia', 'meio-ambiente', 'Meio Ambiente', ARRAY['meio ambiente', 'sustentabilidade', 'desmatamento', 'poluição', 'aquecimento global', 'recursos naturais'], 3),
('ciencias-humanas', 'geografia', 'urbanizacao', 'Urbanização', ARRAY['cidade', 'urbano', 'urbanização', 'metrópole', 'favela', 'segregação'], 4),
('ciencias-humanas', 'geografia', 'cartografia', 'Cartografia', ARRAY['mapa', 'escala', 'projeção', 'coordenadas', 'latitude', 'longitude', 'cartografia'], 5),
('ciencias-humanas', 'geografia', 'agraria', 'Questão Agrária', ARRAY['agricultura', 'agronegócio', 'reforma agrária', 'rural', 'latifúndio', 'minifúndio', 'mst'], 6),

-- FILOSOFIA
('ciencias-humanas', 'filosofia', 'filosofia-antiga', 'Filosofia Antiga', ARRAY['sócrates', 'platão', 'aristóteles', 'grécia', 'filosofia grega', 'maiêutica'], 1),
('ciencias-humanas', 'filosofia', 'filosofia-moderna', 'Filosofia Moderna', ARRAY['descartes', 'kant', 'iluminismo', 'razão', 'empirismo', 'racionalismo'], 2),
('ciencias-humanas', 'filosofia', 'filosofia-contemporanea', 'Filosofia Contemporânea', ARRAY['nietzsche', 'marx', 'existencialismo', 'fenomenologia', 'pós-modernismo'], 3),
('ciencias-humanas', 'filosofia', 'etica', 'Ética', ARRAY['ética', 'moral', 'valor', 'virtude', 'bem', 'mal', 'justiça'], 4),
('ciencias-humanas', 'filosofia', 'politica', 'Filosofia Política', ARRAY['política', 'estado', 'democracia', 'poder', 'cidadania', 'contrato social'], 5),

-- SOCIOLOGIA
('ciencias-humanas', 'sociologia', 'classicos-sociologia', 'Clássicos da Sociologia', ARRAY['durkheim', 'weber', 'marx', 'comte', 'sociologia clássica'], 1),
('ciencias-humanas', 'sociologia', 'cultura-sociedade', 'Cultura e Sociedade', ARRAY['cultura', 'sociedade', 'identidade', 'diversidade', 'etnocentrismo', 'relativismo'], 2),
('ciencias-humanas', 'sociologia', 'trabalho', 'Trabalho e Sociedade', ARRAY['trabalho', 'emprego', 'desemprego', 'capitalismo', 'proletariado', 'mais-valia'], 3),
('ciencias-humanas', 'sociologia', 'movimentos-sociais', 'Movimentos Sociais', ARRAY['movimento social', 'protesto', 'reivindicação', 'direitos', 'ativismo'], 4),
('ciencias-humanas', 'sociologia', 'desigualdade', 'Desigualdade Social', ARRAY['desigualdade', 'pobreza', 'exclusão', 'classe social', 'estratificação'], 5),
('ciencias-humanas', 'sociologia', 'educacao', 'Sociologia da Educação', ARRAY['educação', 'escola', 'ensino', 'aprendizagem', 'capital cultural'], 6)

ON CONFLICT (codigo) DO NOTHING;

-- ================================================================
-- VERIFICAÇÃO FINAL
-- ================================================================

DO $$
DECLARE
    v_total_conteudos INTEGER;
    v_areas TEXT[];
BEGIN
    SELECT COUNT(*) INTO v_total_conteudos FROM conteudos_enem;
    SELECT ARRAY_AGG(DISTINCT area) INTO v_areas FROM conteudos_enem;

    RAISE NOTICE '✅ Conteúdos ENEM configurados!';
    RAISE NOTICE '   Total de conteúdos: %', v_total_conteudos;
    RAISE NOTICE '   Áreas: %', v_areas;
END $$;

-- ================================================================
-- INSTRUÇÕES DE USO
-- ================================================================

/*
Para importar questões da API enem.dev:

1. Acesse como professor
2. Use o endpoint POST /api/enem/importar com:

   {
     "anos": [2023, 2022, 2021, 2020, 2019],
     "areas": ["todas"],  // ou ["matematica", "ciencias-natureza", etc]
     "limite": 500
   }

3. Para verificar estatísticas: GET /api/enem/importar

4. Para estudantes da 3ª série acessarem: GET /api/enem
   - Filtros opcionais: ?ano=2023&area=matematica&subarea=fisica
*/
