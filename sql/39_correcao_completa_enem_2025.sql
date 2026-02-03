-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║                                                                              ║
-- ║   SCRIPT DE CORREÇÃO COMPLETA - QUESTÕES ENEM 2025                          ║
-- ║   Versão: 1.0.0                                                              ║
-- ║   Autor: Analista Sênior                                                     ║
-- ║   Data: 2025                                                                 ║
-- ║                                                                              ║
-- ║   Este script realiza diagnóstico e correção completa das questões          ║
-- ║   ENEM 2025, incluindo formatação HTML, limpeza de dados corrompidos        ║
-- ║   e padronização conforme layout oficial da prova.                          ║
-- ║                                                                              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- SEÇÃO 0: CONFIGURAÇÃO E BACKUP
-- ============================================================================

-- 0.1 Criar tabela de backup antes de qualquer alteração
CREATE TABLE IF NOT EXISTS questoes_enem_backup_2025 AS
SELECT * FROM questoes_enem WHERE ano_prova = 2025;

-- 0.2 Criar tabela de log para auditoria
CREATE TABLE IF NOT EXISTS log_correcoes_enem (
    id SERIAL PRIMARY KEY,
    numero_questao INTEGER,
    campo_alterado VARCHAR(50),
    valor_anterior TEXT,
    valor_novo TEXT,
    tipo_correcao VARCHAR(100),
    data_correcao TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SEÇÃO 1: DIAGNÓSTICO COMPLETO
-- ============================================================================

-- 1.1 Visão geral de todas as questões
SELECT
    '═══════════════════════════════════════════════════════════════' as separador;
SELECT 'DIAGNÓSTICO COMPLETO - QUESTÕES ENEM 2025' as titulo;
SELECT '═══════════════════════════════════════════════════════════════' as separador;

SELECT
    numero_questao AS q,
    area,
    COALESCE(subarea, '-') AS subarea,
    LENGTH(COALESCE(contexto, '')) AS chars_contexto,
    LENGTH(COALESCE(comando, '')) AS chars_comando,
    CASE
        WHEN contexto IS NULL OR contexto = '' THEN '❌ VAZIO'
        WHEN contexto ~ '(ENEM2025){2,}' THEN '🔴 CORROMPIDO'
        WHEN LENGTH(contexto) < 50 THEN '⚠️ MUITO CURTO'
        WHEN contexto LIKE '%<strong>%' AND contexto LIKE '%<small>%' THEN '✅ COMPLETO'
        WHEN contexto LIKE '%<small>%' THEN '🔵 TEM FONTE'
        WHEN contexto LIKE '%<strong>%' THEN '🟡 TEM TÍTULO'
        WHEN contexto ~ 'Disponível em:|Acesso em:' THEN '🟠 FONTE SEM TAG'
        ELSE '⚪ SEM FORMATAÇÃO'
    END AS status_contexto,
    CASE
        WHEN comando IS NULL OR comando = '' THEN '❌ VAZIO'
        WHEN comando ~ '(ENEM2025){2,}' THEN '🔴 CORROMPIDO'
        WHEN LENGTH(comando) < 20 THEN '⚠️ CURTO'
        ELSE '✅ OK'
    END AS status_comando
FROM questoes_enem
WHERE ano_prova = 2025
ORDER BY numero_questao;

-- 1.2 Estatísticas por status
SELECT
    '═══════════════════════════════════════════════════════════════' as separador;
SELECT 'ESTATÍSTICAS POR STATUS' as titulo;

SELECT
    CASE
        WHEN contexto IS NULL OR contexto = '' THEN 'VAZIO'
        WHEN contexto ~ '(ENEM2025){2,}' THEN 'CORROMPIDO'
        WHEN LENGTH(contexto) < 50 THEN 'MUITO CURTO'
        WHEN contexto LIKE '%<strong>%' AND contexto LIKE '%<small>%' THEN 'COMPLETO'
        WHEN contexto LIKE '%<small>%' THEN 'TEM FONTE'
        WHEN contexto LIKE '%<strong>%' THEN 'TEM TÍTULO'
        WHEN contexto ~ 'Disponível em:|Acesso em:' THEN 'FONTE SEM TAG'
        ELSE 'SEM FORMATAÇÃO'
    END AS status,
    COUNT(*) AS quantidade,
    ROUND(COUNT(*) * 100.0 / 90, 1) AS percentual
FROM questoes_enem
WHERE ano_prova = 2025
GROUP BY 1
ORDER BY quantidade DESC;

-- 1.3 Questões corrompidas (padrão ENEM2025 repetitivo)
SELECT
    '═══════════════════════════════════════════════════════════════' as separador;
SELECT 'QUESTÕES CORROMPIDAS (PADRÃO REPETITIVO)' as titulo;

SELECT
    numero_questao,
    area,
    'CONTEXTO' AS campo,
    LEFT(contexto, 100) AS preview
FROM questoes_enem
WHERE ano_prova = 2025 AND contexto ~ '(ENEM2025){2,}'
UNION ALL
SELECT
    numero_questao,
    area,
    'COMANDO' AS campo,
    LEFT(comando, 100) AS preview
FROM questoes_enem
WHERE ano_prova = 2025 AND comando ~ '(ENEM2025){2,}'
ORDER BY numero_questao;

-- 1.4 Questões com fontes não formatadas
SELECT
    '═══════════════════════════════════════════════════════════════' as separador;
SELECT 'QUESTÕES COM FONTES SEM FORMATAÇÃO <small>' as titulo;

SELECT
    numero_questao,
    area,
    RIGHT(contexto, 200) AS final_texto
FROM questoes_enem
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND (
      contexto ~ 'Disponível em:' OR
      contexto ~ 'Acesso em:' OR
      contexto ~ '[A-Z]{2,},\s+[A-Z][a-z]+\.' OR
      contexto ~ '\d{4}\s*\(adaptado\)'
  )
ORDER BY numero_questao;

-- ============================================================================
-- SEÇÃO 2: LIMPEZA DE DADOS CORROMPIDOS
-- ============================================================================

SELECT '═══════════════════════════════════════════════════════════════' as separador;
SELECT 'INICIANDO CORREÇÕES...' as titulo;

-- 2.1 Remover padrão ENEM2025 repetitivo do CONTEXTO
UPDATE questoes_enem
SET contexto = TRIM(REGEXP_REPLACE(
    contexto,
    '(ENEM2025){2,}[ENEM2025ENEN0-9]*',
    '',
    'gi'
))
WHERE ano_prova = 2025
  AND contexto ~ '(ENEM2025){2,}';

-- 2.2 Remover padrão ENEM2025 repetitivo do COMANDO
UPDATE questoes_enem
SET comando = TRIM(REGEXP_REPLACE(
    comando,
    '(ENEM2025){2,}[ENEM2025ENEN0-9]*',
    '',
    'gi'
))
WHERE ano_prova = 2025
  AND comando ~ '(ENEM2025){2,}';

-- 2.3 Remover padrão ENEM2025 das ALTERNATIVAS (JSONB)
UPDATE questoes_enem
SET alternativas = (
    SELECT jsonb_object_agg(
        key,
        TRIM(REGEXP_REPLACE(value::text, '(ENEM2025){2,}[ENEM2025ENEN0-9]*', '', 'gi'), '"')
    )
    FROM jsonb_each(alternativas)
)
WHERE ano_prova = 2025
  AND alternativas::text ~ '(ENEM2025){2,}';

-- ============================================================================
-- SEÇÃO 3: FORMATAÇÃO DE FONTES COM <small>
-- ============================================================================

-- 3.1 Padrão: AUTOR. Disponível em: URL. Acesso em: DATA (adaptado).
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    E'([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][A-ZÀÁÂÃÉÊÍÓÔÕÚÇ\\s,\\.;]+\\.\\s*Disponível em:[^\\n]+(?:Acesso em:[^\\n]+)?(?:\\(adaptado\\))?\\.?)\\s*$',
    E'\n\n<small>\\1</small>',
    'g'
)
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND contexto ~ '[A-Z]{2,}.*Disponível em:';

-- 3.2 Padrão simples: Disponível em: URL. Acesso em: DATA.
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    E'(Disponível em:\\s*[^\\n]+(?:\\n[^\\n]*)?Acesso em:[^\\n]+(?:\\(adaptado\\))?\\.?)\\s*$',
    E'\n\n<small>\\1</small>',
    'g'
)
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND contexto ~ 'Disponível em:';

-- 3.3 Padrão livro: AUTOR. Título. Cidade: Editora, ANO.
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    E'([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]+,\\s*[A-Z]\\.[^.]+\\.[^.]+:\\s*[^,]+,\\s*(?:19|20)\\d{2}[^\\n]*(?:\\(adaptado\\))?\\.?)\\s*$',
    E'\n\n<small>\\1</small>',
    'g'
)
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND contexto ~ '[A-Z]{2,},\s+[A-Z]\.'
  AND contexto ~ '(19|20)\d{2}';

-- 3.4 Padrão revista/jornal: Revista/Jornal Nome, n. X, mês ANO.
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    E'((Revista|Jornal)[^,]+,\\s*n\\.\\s*\\d+[^\\n]+(?:19|20)\\d{2}[^\\n]*(?:\\(adaptado\\))?\\.?)\\s*$',
    E'\n\n<small>\\1</small>',
    'gi'
)
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND contexto ~* '(revista|jornal).*n\.\s*\d+';

-- 3.5 Padrão fonte em múltiplas linhas (quebra antes de "Disponível")
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    E'\\n([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][A-ZÀÁÂÃÉÊÍÓÔÕÚÇ,\\.\\s]+\\n?\\s*Disponível em:[^\\n]*\\n?[^\\n]*Acesso em:[^\\n]+)\\s*$',
    E'\n\n<small>\\1</small>',
    'g'
)
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND contexto ~ 'Disponível em:';

-- 3.6 Padrão: apenas "Disponível em:" no final (última tentativa)
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    E'(Disponível em:[^<]+)$',
    E'<small>\\1</small>',
    'g'
)
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND contexto ~ 'Disponível em:[^<]+$';

-- ============================================================================
-- SEÇÃO 4: CORREÇÕES ESPECÍFICAS POR QUESTÃO
-- ============================================================================

-- 4.1 Questão 44 - Fonte específica
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    E'(Disponível em: www\\.huffpost\\.com\\.br\\.\\s*\\nAcesso em: 22 maio 2018 \\(adaptado\\)\\.)\\s*$',
    E'\n\n<small>\\1</small>',
    'g'
)
WHERE ano_prova = 2025
  AND numero_questao = 44
  AND contexto NOT LIKE '%<small>%';

-- 4.2 Questão 59 - Fonte específica
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    E'(BORGES, T\\.[^<]+Acesso em:[^\\n]+)\\s*$',
    E'\n\n<small>\\1</small>',
    'g'
)
WHERE ano_prova = 2025
  AND numero_questao = 59
  AND contexto NOT LIKE '%<small>%';

-- 4.3 Questão 67 - Fonte específica
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(
    contexto,
    E'(BARROS, C\\. J\\.[^<]+Acesso em:[^\\n]+)\\s*$',
    E'\n\n<small>\\1</small>',
    'g'
)
WHERE ano_prova = 2025
  AND numero_questao = 67
  AND contexto NOT LIKE '%<small>%';

-- ============================================================================
-- SEÇÃO 5: LIMPEZA E PADRONIZAÇÃO
-- ============================================================================

-- 5.1 Remover múltiplas quebras de linha (mais de 2)
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(contexto, E'\\n{3,}', E'\n\n', 'g')
WHERE ano_prova = 2025
  AND contexto ~ '\n{3,}';

-- 5.2 Remover espaços em branco excessivos
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(contexto, E'[ \\t]{2,}', ' ', 'g')
WHERE ano_prova = 2025
  AND contexto ~ '[ \t]{2,}';

-- 5.3 Trim em todos os campos de texto
UPDATE questoes_enem
SET
    contexto = TRIM(contexto),
    comando = TRIM(comando)
WHERE ano_prova = 2025;

-- 5.4 Corrigir tags <small> duplicadas ou aninhadas
UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(contexto, '<small>\\s*<small>', '<small>', 'gi')
WHERE ano_prova = 2025 AND contexto ~ '<small>\\s*<small>';

UPDATE questoes_enem
SET contexto = REGEXP_REPLACE(contexto, '</small>\\s*</small>', '</small>', 'gi')
WHERE ano_prova = 2025 AND contexto ~ '</small>\\s*</small>';

-- 5.5 Garantir que tags <small> estão fechadas
UPDATE questoes_enem
SET contexto = contexto || '</small>'
WHERE ano_prova = 2025
  AND contexto LIKE '%<small>%'
  AND contexto NOT LIKE '%</small>%';

-- ============================================================================
-- SEÇÃO 6: INSERÇÃO DE QUESTÕES COM CONTEXTO VAZIO/CORROMPIDO
-- ============================================================================

-- Nota: As questões abaixo foram identificadas como vazias ou corrompidas.
-- Execute estas atualizações apenas se os contextos estiverem vazios.

-- 6.1 Questão 5 (Inglês) - Copos de café
UPDATE questoes_enem
SET contexto = '<em>[Imagem: Três copos de café em tamanhos diferentes, dispostos lado a lado em uma cafeteria. Cada copo possui uma etiqueta com uma frase em inglês:]</em>

<strong>Copo pequeno (8 oz):</strong> "Slept 8-10 hours"
<strong>Copo médio (12 oz):</strong> "Slept 5-7 hours"
<strong>Copo grande (16 oz):</strong> "What is sleep?"

<small>Disponível em: https://pt.foursquare.com. Acesso em: 14 maio 2024.</small>'
WHERE ano_prova = 2025
  AND numero_questao = 5
  AND subarea = 'ingles'
  AND (contexto IS NULL OR LENGTH(contexto) < 100 OR contexto NOT LIKE '%<strong>%');

-- 6.2 Questões 6-10 (Crônica "De próprio punho")
UPDATE questoes_enem
SET contexto = '<strong>De próprio punho</strong>

<em>A escrita e suas tecnologias sofrem interessantes metamorfoses, numa ciranda que vai do simples bilhete aos originais de um livro</em>

Estranhei muito na primeira vez que escutei a expressão "de próprio punho". Parecia que eu ia bater em alguém. Não era bem o caso. Foi numa situação bancária, dessas bem burocráticas, e eu devia escrever algo bem breve, mas com minhas mãos. Na verdade, o que importava era a autenticidade da minha caligrafia, que à época ainda era mais fluente e firme. Depois dos teclados de computador, ela rateia bastante. Minha letra, hoje, tem uma espécie de alternância: dia sim, dia não, trêmula e firme, forte e fraca, mais rotunda e mais cheia de arestas.

É claro que já escrevi muito mais de próprio punho ou, numa palavra mais bonita, manuscrevi (prefiro a mão ao punho, embora ele também seja usado na tarefa). Mas isso não é um feito individual. Em larga medida, é social. Muita gente sente o mesmo que eu, isto é, escreve bem menos usando as mãos, ou melhor, empregando algum tipo de tecnologia (lápis, caneta etc.) para escrever com grafite ou tinta ou giz ou carvão ou sangue e o que mais. É importante lembrar que ainda há gente que não sabe escrever neste país, neste planeta, mas muita gente sabe e tem um combo de tecnologias mais ou menos à disposição para isso. Sou dessas pessoas privilegiadas que têm várias possibilidades, e uma delas nunca deixou de ser o uso das minhas mãos. Ainda hoje, são elas que batucam meu teclado de computador ou que tocam suavemente duas ou três telas sensíveis. Mas não expressam mais a minha letra. No lugar, aparecem Times New Roman, Arial, Calibri e mais uma centena de "letras" à minha escolha. Eu e Deus e o mundo.

A despeito desse rol de chances e ferramentas para escrever, o manuscrito nunca deixou de pintar aqui e ali, muitas vezes como obrigação. Na escola, por exemplo, até hoje ele é soberano. No Enem também. Curioso, não? Fico pensando em que espaços e ocasiões ainda uso minha letra. Olhando ao redor, na minha casa, minha letra está em espaços muito delimitados e específicos: bilhetes. Eles estão principalmente na cozinha, em especial na porta da geladeira, a fim de manter a comunicação com meus coabitantes, sempre muito esquecidos ou relapsos. Mas também há bilhetes em post its na minha mesa do escritório, textinhos em garranchos por meio dos quais me comunico comigo mesma, a evitar um comportamento esquecido e relapso.

No escritório, costumo ser mais suave comigo mesma, mas também muito mais lacônica, a ponto de nem eu me entender, se passar o tempo. Em todos os casos vai minha letra, menos e mais redonda, a lápis e a tinta azul, em post its rosa-choque, colados precariamente, e todos com destino à lixeira, em breve. Justo porque eles funcionam como lembretes de tarefas e coisas que devem ser vencidas e, claro, substituídas por outras, num fluxo infinito, às vezes ansiogênico, com que a maioria dos adultos (e mais ainda as adultas) precisa conviver.

As formas de escrever mudam, as necessidades também, e o resultado é um elenco complexo, em que nada dispensa nada, a depender da tarefa ou da importância das coisas ou de suas funções, claro. A escrita e suas tecnologias incríveis vão se reposicionando, mudando de status, numa ciranda interessante e importante que pode ser vista à luz de certa diversidade que encontra suas oportunidades e seus efeitos, aqui e ali. Não adianta muito pensar sempre como se tudo fosse excludente. Estão aí minha farta comunicação por bilhetes, minha gaveta alegre de post its de toda cor, esperando para serem usados, e o cheque do cartório, em que quase tudo já é digital. "Do punho ao pixel" não é uma frase filosoficamente correta. O negócio é mais "o punho e o pixel".

<small>RIBEIRO, A. E. Disponível em: https://rascunho.com.br. Acesso em: 16 jan. 2024 (adaptado).</small>'
WHERE ano_prova = 2025
  AND numero_questao IN (6, 7, 8, 9, 10)
  AND subarea = 'portugues';

-- 6.3 Questão 14 - Cartaz Bienal do Livro
UPDATE questoes_enem
SET contexto = '<em>[Cartaz publicitário da 26ª Bienal Internacional do Livro de São Paulo]</em>

<strong>"Você entra Fernando.
E sai Pessoa."</strong>

<em>[Ilustração estilizada do rosto de Fernando Pessoa, parte fotografia e parte desenho colorido com elementos portugueses]</em>

<em>"Todo mundo sai melhor do que entrou."</em>

26ª BIENAL INTERNACIONAL DO LIVRO DE SÃO PAULO
02 a 10 de julho | Novo local: EXPO CENTER NORTE

<small>Disponível em: www.publishnews.com.br. Acesso em: 19 set. 2024.</small>'
WHERE ano_prova = 2025
  AND numero_questao = 14
  AND (contexto IS NULL OR contexto NOT LIKE '%<strong>%');

-- 6.4 Questão 16 - Soneto "Símbolos"
UPDATE questoes_enem
SET contexto = '<strong>Símbolos</strong>

Eu e tu, ante a noite e o amplo desdobramento
do mar, fero, a estourar de encontro à rocha nua...
Um símbolo descubro aqui, neste momento
esta rocha, este mar... a minha vida e a tua.

O mar vem, o mar vai, nele há o gesto violento
de quem maltrata e, após, se arrepende e recua.
Como compreendo bem da rocha o sentimento!
São muito iguais, por certo, a minha mágoa e a sua.

Contemplo neste quadro a nossa triste vida;
tu és dúbio mar que, na sua inconsciência,
tem carinhos de amor e fúrias de demência!

Eu sou a dor estanque, a dor empedernida,
sou rocha a emergir de um côncavo de areia,
imóvel, muda, isenta e alheia ao mar, alheia.

<small>MACHADO, G. Poesia completa. Rio de Janeiro: Cátedra/MEC, 1978.</small>'
WHERE ano_prova = 2025
  AND numero_questao = 16
  AND (contexto IS NULL OR contexto NOT LIKE '%<strong>%' OR contexto ~ '(ENEM2025){2,}');

-- 6.5 Questão 24 - Cartaz UNICEF
UPDATE questoes_enem
SET contexto = '<em>[Cartaz de campanha da UNICEF Brasil]</em>

<em>[Imagem de duas crianças lado a lado:]</em>

<strong>Carlos Pataxicoré, aos 36 anos,</strong> médico e o futuro todo pela frente.
<strong>Quézia Silva, aos 29 anos,</strong> advogada e o futuro todo pela frente.

<strong>EM UM MUNDO DE DIFERENÇAS ENXERGUE A IGUALDADE</strong>

<em>O Brasil tem 31 milhões de crianças negras e indígenas. A maioria sofre com discriminação racial, sem ter acesso à educação, à saúde e ao desenvolvimento. Ajude a mudar essa realidade. Contribua para uma infância sem racismo.</em>

<small>Disponível em: www.unicef.org.br. Acesso em: 15 jan. 2024 (adaptado).</small>'
WHERE ano_prova = 2025
  AND numero_questao = 24
  AND (contexto IS NULL OR contexto NOT LIKE '%<strong>%');

-- 6.6 Questão 33 - Infográfico TJDFT
UPDATE questoes_enem
SET contexto = '<em>[Infográfico do TJDFT - Tribunal de Justiça do Distrito Federal e dos Territórios]</em>

<strong>Por que falar sobre violência contra mulheres na escola?</strong>

Logo: #DESAFIO... igualdade

<em>A violência de gênero afeta a vida de meninas e meninos em vários aspectos e hoje é um dos grandes empecilhos para que vivam plenamente, com segurança e qualidade de vida.</em>

Fonte citada na imagem: Anuário Brasileiro de Segurança Pública 2019

<small>Disponível em: www.tjdft.jus.br. Acesso em: 15 out. 2024 (adaptado).</small>'
WHERE ano_prova = 2025
  AND numero_questao = 33
  AND (contexto IS NULL OR contexto NOT LIKE '%<strong>%');

-- 6.7 Questão 34 - Capa Revista Galileu
UPDATE questoes_enem
SET contexto = '<em>[Capa da Revista GALILEU - Edição 371, Fevereiro de 2023]</em>

<strong>VOCÊ (NÃO) ESTÁ SOZINHO</strong>

<em>[Ilustração de um globo terrestre com várias pessoas realizando atividades diferentes conectadas por linhas vermelhas]</em>

NO BRASIL, METADE DA POPULAÇÃO SE SENTE SOLITÁRIA, E A MESMA SENSAÇÃO CRESCE EM OUTRAS PARTES DO MUNDO. POR QUE DEVEMOS REPENSAR NOSSAS RELAÇÕES?

<small>Disponível em: https://revistagalileu.globo.com. Acesso em: 18 jun. 2024 (adaptado).</small>'
WHERE ano_prova = 2025
  AND numero_questao = 34
  AND (contexto IS NULL OR contexto NOT LIKE '%<strong>%');

-- ============================================================================
-- SEÇÃO 7: VALIDAÇÃO E RELATÓRIO FINAL
-- ============================================================================

SELECT '═══════════════════════════════════════════════════════════════' as separador;
SELECT 'RELATÓRIO FINAL - APÓS CORREÇÕES' as titulo;
SELECT '═══════════════════════════════════════════════════════════════' as separador;

-- 7.1 Resumo estatístico
SELECT
    'Total de questões 2025' AS metrica,
    COUNT(*) AS valor
FROM questoes_enem
WHERE ano_prova = 2025

UNION ALL

SELECT
    'Com tag <small> (fonte formatada)',
    COUNT(*)
FROM questoes_enem
WHERE ano_prova = 2025 AND contexto LIKE '%<small>%'

UNION ALL

SELECT
    'Com tag <strong> (título formatado)',
    COUNT(*)
FROM questoes_enem
WHERE ano_prova = 2025 AND contexto LIKE '%<strong>%'

UNION ALL

SELECT
    'Com tag <em> (descrição formatada)',
    COUNT(*)
FROM questoes_enem
WHERE ano_prova = 2025 AND contexto LIKE '%<em>%'

UNION ALL

SELECT
    'Ainda com padrão ENEM2025 corrompido',
    COUNT(*)
FROM questoes_enem
WHERE ano_prova = 2025 AND (contexto ~ '(ENEM2025){2,}' OR comando ~ '(ENEM2025){2,}')

UNION ALL

SELECT
    'Contexto vazio ou muito curto (<50 chars)',
    COUNT(*)
FROM questoes_enem
WHERE ano_prova = 2025 AND (contexto IS NULL OR LENGTH(contexto) < 50)

UNION ALL

SELECT
    'Sem nenhuma formatação HTML',
    COUNT(*)
FROM questoes_enem
WHERE ano_prova = 2025
  AND contexto NOT LIKE '%<small>%'
  AND contexto NOT LIKE '%<strong>%'
  AND contexto NOT LIKE '%<em>%';

-- 7.2 Lista de questões que ainda precisam de atenção
SELECT '═══════════════════════════════════════════════════════════════' as separador;
SELECT 'QUESTÕES QUE AINDA PRECISAM DE ATENÇÃO' as titulo;

SELECT
    numero_questao,
    area,
    subarea,
    CASE
        WHEN contexto IS NULL OR contexto = '' THEN 'CONTEXTO VAZIO'
        WHEN contexto ~ '(ENEM2025){2,}' THEN 'PADRÃO CORROMPIDO'
        WHEN LENGTH(contexto) < 50 THEN 'CONTEXTO MUITO CURTO'
        WHEN contexto NOT LIKE '%<small>%' AND contexto ~ 'Disponível em:' THEN 'FONTE SEM <small>'
        ELSE 'VERIFICAR MANUALMENTE'
    END AS problema,
    LEFT(contexto, 80) AS preview
FROM questoes_enem
WHERE ano_prova = 2025
  AND (
      contexto IS NULL
      OR contexto = ''
      OR contexto ~ '(ENEM2025){2,}'
      OR LENGTH(contexto) < 50
      OR (contexto NOT LIKE '%<small>%' AND contexto ~ 'Disponível em:')
  )
ORDER BY numero_questao;

-- 7.3 Verificação final de integridade
SELECT '═══════════════════════════════════════════════════════════════' as separador;
SELECT 'VERIFICAÇÃO DE INTEGRIDADE' as titulo;

SELECT
    numero_questao,
    CASE WHEN contexto IS NOT NULL AND LENGTH(contexto) > 50 THEN '✅' ELSE '❌' END AS contexto_ok,
    CASE WHEN comando IS NOT NULL AND LENGTH(comando) > 10 THEN '✅' ELSE '❌' END AS comando_ok,
    CASE WHEN alternativas IS NOT NULL AND jsonb_typeof(alternativas) = 'object' THEN '✅' ELSE '❌' END AS alternativas_ok,
    CASE WHEN resposta_correta IS NOT NULL AND resposta_correta IN ('A','B','C','D','E') THEN '✅' ELSE '❌' END AS resposta_ok
FROM questoes_enem
WHERE ano_prova = 2025
ORDER BY numero_questao;

-- ============================================================================
-- SEÇÃO 8: FUNÇÕES ÚTEIS PARA MANUTENÇÃO FUTURA
-- ============================================================================

-- 8.1 Função para formatar fonte automaticamente
CREATE OR REPLACE FUNCTION formatar_fonte_enem(texto TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Se já tem <small>, retorna como está
    IF texto LIKE '%<small>%' THEN
        RETURN texto;
    END IF;

    -- Tenta formatar padrão "Disponível em:"
    IF texto ~ 'Disponível em:' THEN
        RETURN REGEXP_REPLACE(
            texto,
            E'((?:[A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][A-ZÀÁÂÃÉÊÍÓÔÕÚÇ,\\.\\s]*\\.\\s*)?Disponível em:[^\\n]+(?:Acesso em:[^\\n]+)?(?:\\(adaptado\\))?\\.?)\\s*$',
            E'\n\n<small>\\1</small>',
            'g'
        );
    END IF;

    -- Tenta formatar padrão livro
    IF texto ~ '[A-Z]{2,},\s+[A-Z]\.' AND texto ~ '(19|20)\d{2}' THEN
        RETURN REGEXP_REPLACE(
            texto,
            E'([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][A-ZÀÁÂÃÉÊÍÓÔÕÚÇ]+,[^.]+\\.[^.]+(?:19|20)\\d{2}[^\\n]*\\.?)\\s*$',
            E'\n\n<small>\\1</small>',
            'g'
        );
    END IF;

    RETURN texto;
END;
$$ LANGUAGE plpgsql;

-- 8.2 Função para verificar qualidade da questão
CREATE OR REPLACE FUNCTION verificar_qualidade_questao(p_numero INTEGER, p_ano INTEGER DEFAULT 2025)
RETURNS TABLE (
    campo VARCHAR(20),
    status VARCHAR(10),
    detalhe TEXT
) AS $$
DECLARE
    v_questao RECORD;
BEGIN
    SELECT * INTO v_questao FROM questoes_enem
    WHERE numero_questao = p_numero AND ano_prova = p_ano;

    -- Verificar contexto
    campo := 'contexto';
    IF v_questao.contexto IS NULL OR v_questao.contexto = '' THEN
        status := '❌ ERRO';
        detalhe := 'Contexto vazio';
    ELSIF v_questao.contexto ~ '(ENEM2025){2,}' THEN
        status := '❌ ERRO';
        detalhe := 'Padrão corrompido detectado';
    ELSIF LENGTH(v_questao.contexto) < 50 THEN
        status := '⚠️ ALERTA';
        detalhe := 'Contexto muito curto (' || LENGTH(v_questao.contexto) || ' chars)';
    ELSE
        status := '✅ OK';
        detalhe := LENGTH(v_questao.contexto) || ' caracteres';
    END IF;
    RETURN NEXT;

    -- Verificar comando
    campo := 'comando';
    IF v_questao.comando IS NULL OR v_questao.comando = '' THEN
        status := '❌ ERRO';
        detalhe := 'Comando vazio';
    ELSIF v_questao.comando ~ '(ENEM2025){2,}' THEN
        status := '❌ ERRO';
        detalhe := 'Padrão corrompido detectado';
    ELSE
        status := '✅ OK';
        detalhe := LENGTH(v_questao.comando) || ' caracteres';
    END IF;
    RETURN NEXT;

    -- Verificar formatação
    campo := 'formatacao';
    IF v_questao.contexto LIKE '%<small>%' THEN
        status := '✅ OK';
        detalhe := 'Fonte formatada com <small>';
    ELSIF v_questao.contexto ~ 'Disponível em:' THEN
        status := '⚠️ ALERTA';
        detalhe := 'Fonte presente mas sem tag <small>';
    ELSE
        status := 'ℹ️ INFO';
        detalhe := 'Sem fonte bibliográfica';
    END IF;
    RETURN NEXT;

    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso:
-- SELECT * FROM verificar_qualidade_questao(44, 2025);

-- ============================================================================
-- SEÇÃO 9: ROLLBACK (CASO NECESSÁRIO)
-- ============================================================================

-- Para reverter todas as alterações, execute:
--
-- TRUNCATE questoes_enem;
-- INSERT INTO questoes_enem SELECT * FROM questoes_enem_backup_2025;
-- DROP TABLE questoes_enem_backup_2025;
-- DROP TABLE log_correcoes_enem;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================

SELECT '╔══════════════════════════════════════════════════════════════════════════════╗';
SELECT '║                     SCRIPT EXECUTADO COM SUCESSO!                           ║';
SELECT '║                                                                              ║';
SELECT '║  • Backup criado em: questoes_enem_backup_2025                              ║';
SELECT '║  • Padrões corrompidos removidos                                            ║';
SELECT '║  • Fontes formatadas com <small>                                            ║';
SELECT '║  • Questões específicas corrigidas                                          ║';
SELECT '║  • Funções auxiliares criadas                                               ║';
SELECT '║                                                                              ║';
SELECT '║  Para reverter: execute a SEÇÃO 9 (ROLLBACK)                                ║';
SELECT '╚══════════════════════════════════════════════════════════════════════════════╝';
