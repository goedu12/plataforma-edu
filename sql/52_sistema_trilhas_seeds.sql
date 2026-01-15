-- ============================================================================
-- 52_SISTEMA_TRILHAS_SEEDS.SQL
-- Dados iniciais para o Sistema de Trilhas
--
-- PONTO DE RESTAURACAO: tag v1.0-pre-trilhas
-- Criado em: 2025-01-15
-- ============================================================================

-- ============================================================================
-- 1. INSERIR AS 6 TRILHAS DE APRENDIZADO
-- ============================================================================

INSERT INTO trilhas (id, nome, icone, cor, descricao, descricao_curta, config, ordem) VALUES

-- TRILHA 1: PASSAR DE ANO
('passar_ano', 'Passar de Ano', '🎓', '#4CAF50',
'Acompanhe o conteúdo da sua série semana a semana, no ritmo da escola. Ideal para quem quer manter as notas em dia sem stress.',
'Acompanhe a escola',
'{
    "questoes_semana": 5,
    "dificuldade": {"facil": 30, "medio": 50, "dificil": 20},
    "tipos": ["conceitual", "calculo_direto", "situacao_problema"],
    "segue_calendario": true,
    "acerto_avancar": 60,
    "permite_adiantar": false,
    "revisao_automatica": true,
    "pontos_por_questao": {"normal": 10, "com_dica": 5},
    "bonus_100": true
}'::jsonb, 1),

-- TRILHA 2: ENEM/VESTIBULAR
('enem', 'ENEM/Vestibular', '🏆', '#2196F3',
'Preparação intensiva para o ENEM e vestibulares. Questões no estilo das provas, simulados mensais e foco nos temas mais cobrados.',
'Conquistar a vaga',
'{
    "questoes_semana": 15,
    "dificuldade": {"facil": 10, "medio": 40, "dificil": 50},
    "tipos": ["todos"],
    "usa_banco_enem": true,
    "simulados_mensais": true,
    "acerto_avancar": 70,
    "foco_competencias": true,
    "cronometrado": true,
    "meta_nota": 700
}'::jsonb, 2),

-- TRILHA 3: RECUPERACAO
('recuperacao', 'Recuperação', '🔧', '#FF9800',
'Volte do básico e construa uma base sólida. Sem pressão, no seu ritmo. O sistema identifica suas lacunas e monta um plano personalizado.',
'Voltar do básico',
'{
    "questoes_semana": null,
    "dificuldade": {"facil": 60, "medio": 35, "dificil": 5},
    "tipos": ["conceitual", "calculo_direto"],
    "diagnostico_obrigatorio": true,
    "acerto_avancar": 80,
    "sem_limite_tentativas": true,
    "dicas_sempre_visiveis": true,
    "permite_ver_resolucao": true,
    "sem_penalizacao_erro": true,
    "repeticao_espacada": true
}'::jsonb, 3),

-- TRILHA 4: DESAFIO TOTAL
('desafio', 'Desafio Total', '🚀', '#9C27B0',
'Para quem quer ir além e se destacar! Questões difíceis, nível olimpíada, ranking semanal e competições. Mostre que você é fera!',
'Ir além da escola',
'{
    "questoes_semana": 15,
    "dificuldade": {"facil": 5, "medio": 25, "dificil": 50, "olimpiada": 20},
    "tipos": ["todos", "olimpiada"],
    "ranking": true,
    "competicoes": true,
    "desafio_relampago": true,
    "acerto_avancar": 60,
    "questoes_olimpiadas": true,
    "bonus_velocidade": true,
    "conquistas_especiais": true
}'::jsonb, 4),

-- TRILHA 5: CURIOSIDADE
('curiosidade', 'Curiosidade', '🔬', '#00BCD4',
'Descubra a física escondida no seu dia-a-dia! Aprenda como funciona o celular, o futebol, a cozinha... Sem pressão, pura curiosidade.',
'Entender o mundo',
'{
    "questoes_semana": null,
    "dificuldade": {"facil": 40, "medio": 40, "dificil": 20},
    "tipos": ["conceitual", "analise_fenomeno"],
    "organizado_por_tema": true,
    "sem_pressao": true,
    "experimentos_caseiros": true,
    "curiosidades": true,
    "sem_limite_tempo": true
}'::jsonb, 5),

-- TRILHA 6: PRESSA
('pressa', 'Pressa', '⚡', '#F44336',
'Tem prova semana que vem? Modo turbo ativado! Revisão rápida, resumos expressos e questões focadas no que vai cair na prova.',
'Prova chegando!',
'{
    "questoes_semana": null,
    "dificuldade": {"facil": 20, "medio": 60, "dificil": 20},
    "tipos": ["calculo_direto", "conceitual"],
    "modo_emergencial": true,
    "resumos_rapidos": true,
    "formulas_para_imprimir": true,
    "temporario": true,
    "planos_emergenciais": {
        "7_dias": ["revisao_teoria", "exercicios", "simulado", "revisao_erros"],
        "3_dias": ["resumo_formulas", "questoes_essenciais", "simulado_rapido"],
        "1_dia": ["resumao_visual", "10_questoes_chave", "revisao_formulas"]
    }
}'::jsonb, 6)

ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    icone = EXCLUDED.icone,
    cor = EXCLUDED.cor,
    descricao = EXCLUDED.descricao,
    descricao_curta = EXCLUDED.descricao_curta,
    config = EXCLUDED.config,
    ordem = EXCLUDED.ordem,
    updated_at = NOW();

-- ============================================================================
-- 2. INSERIR TEMAS DE CURIOSIDADE
-- ============================================================================

INSERT INTO trilha_temas_curiosidade (id, nome, icone, descricao, conteudos_fisica, total_questoes, ordem) VALUES

('fisica_celular', 'Física do Celular', '📱',
'Como seu celular funciona? Ondas, tela touch, bateria, GPS... Tudo é física!',
ARRAY['ondas', 'eletromagnetismo', 'circuitos', 'luz', 'energia'],
20, 1),

('fisica_futebol', 'Física do Futebol', '⚽',
'Gol de falta, efeito na bola, chute potente... A física explica tudo no futebol!',
ARRAY['cinematica', 'dinamica', 'energia', 'movimento_circular'],
15, 2),

('fisica_cozinha', 'Física da Cozinha', '🍳',
'Panela de pressão, micro-ondas, geladeira... Sua cozinha é um laboratório!',
ARRAY['termologia', 'calorimetria', 'ondas', 'pressao'],
15, 3),

('fisica_musica', 'Física da Música', '🎵',
'Por que algumas músicas são graves e outras agudas? Como funciona o som?',
ARRAY['ondas', 'acustica', 'frequencia', 'ressonancia'],
15, 4),

('fisica_espaco', 'Física do Espaço', '🚀',
'Foguetes, satélites, buracos negros... A física que nos leva às estrelas!',
ARRAY['gravitacao', 'orbitas', 'relatividade', 'astronomia'],
20, 5),

('fisica_corpo', 'Física do Corpo', '🏃',
'Seu corpo é uma máquina incrível! Entenda a física por trás de cada movimento.',
ARRAY['mecanica', 'pressao', 'termoregulacao', 'optica', 'acustica'],
15, 6),

('fisica_transporte', 'Física do Transporte', '🚌',
'Ônibus, carro, moto, bicicleta... Por que freamos para frente? Por que a curva joga pro lado?',
ARRAY['cinematica', 'dinamica', 'atrito', 'inercia'],
15, 7),

('fisica_eletricidade', 'Física da Eletricidade', '⚡',
'Conta de luz, choque, raio, tomada... Entenda a eletricidade que está em todo lugar!',
ARRAY['eletrostatica', 'eletrodinamica', 'circuitos', 'potencia'],
20, 8)

ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    icone = EXCLUDED.icone,
    descricao = EXCLUDED.descricao,
    conteudos_fisica = EXCLUDED.conteudos_fisica,
    total_questoes = EXCLUDED.total_questoes,
    ordem = EXCLUDED.ordem;

-- ============================================================================
-- 3. VERIFICACAO
-- ============================================================================

DO $$
DECLARE
    v_trilhas INTEGER;
    v_temas INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_trilhas FROM trilhas WHERE ativa = TRUE;
    SELECT COUNT(*) INTO v_temas FROM trilha_temas_curiosidade WHERE ativo = TRUE;

    RAISE NOTICE '============================================';
    RAISE NOTICE 'Seeds inseridos com sucesso!';
    RAISE NOTICE 'Trilhas ativas: %', v_trilhas;
    RAISE NOTICE 'Temas curiosidade: %', v_temas;
    RAISE NOTICE '============================================';
END $$;

-- Listar trilhas inseridas
SELECT id, nome, icone, descricao_curta, ordem
FROM trilhas
WHERE ativa = TRUE
ORDER BY ordem;
