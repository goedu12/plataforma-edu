# PLANO ESTRATEGICO - SIMULADO ENEM COMPLETO
## Plataforma Studao - Versao 2.0

**Data:** 2026-01-06
**Versao:** 2.0 (Revisada)
**Status:** Em Analise

---

# PARTE 1: REUNIAO DE ESPECIALISTAS

## Participantes da Reuniao

| Papel | Responsabilidade |
|-------|------------------|
| **Arquiteto de Software** | Decisoes tecnicas e estrutura |
| **DBA (Admin Banco)** | Modelagem e performance |
| **Product Owner** | Visao do produto e prioridades |
| **UX Designer** | Experiencia do usuario |
| **Professor Consultor** | Realidade pedagogica |

---

## PAUTA 1: Escopo das Areas do ENEM

### Arquiteto de Software:
> "A API enem.dev fornece questoes de todas as 4 areas do ENEM. Precisamos decidir: importamos tudo ou focamos no que ja temos?"

### Professor Consultor:
> "O Studao hoje atende Fisica e Matematica. Para o ENEM, temos:
> - **Ciencias da Natureza**: Fisica (JA TEMOS), Quimica, Biologia
> - **Matematica**: JA TEMOS
> - **Linguagens**: Portugues, Ingles/Espanhol, Artes
> - **Ciencias Humanas**: Historia, Geografia, Filosofia, Sociologia
>
> Minha sugestao: comecar com CN e Matematica, que se alinham ao nosso foco."

### Product Owner:
> "Concordo, mas a estrutura deve permitir expansao futura. Nao queremos refazer tudo quando adicionarmos outras areas."

### DBA:
> "Entao o schema deve ser generico o suficiente para todas as areas, mesmo que inicialmente populemos apenas CN e Mat."

### **DECISAO 1:**
**Importar TODAS as areas do ENEM para o banco, mas liberar acesso gradualmente:**
- **Fase 1:** Ciencias da Natureza + Matematica (alinhado ao Studao atual)
- **Fase 2:** Linguagens (futuro)
- **Fase 3:** Ciencias Humanas (futuro)

---

## PAUTA 2: Separacao dos Bancos de Questoes

### DBA:
> "Temos duas opcoes para a arquitetura:
>
> **Opcao A - Tabela Unica Expandida:**
> Adicionar colunas na tabela `questoes` existente para suportar ENEM.
>
> **Opcao B - Banco Separado:**
> Criar tabelas completamente separadas: `questoes_enem` e `respostas_enem`."

### Arquiteto de Software:
> "Opcao A parece mais simples, mas cria acoplamento. Se a API ENEM mudar ou tivermos problemas, afeta todo o sistema."

### Professor Consultor:
> "As questoes do ENEM sao diferentes pedagogicamente:
> - 5 alternativas (vs 4 no sistema atual)
> - Contextos longos com imagens
> - Sem explicacao/dica (ENEM nao fornece)
> - Sem classificacao por 'ano escolar' - e por area
> - Nao devem gerar pontos no sistema gamificado"

### UX Designer:
> "O fluxo do usuario tambem e diferente. No modo Estudar, o aluno quer evoluir. No Simulado ENEM, quer se preparar para a prova real. Sao experiencias distintas."

### Product Owner:
> "Precisamos de metricas separadas tambem. Quero saber: 'Quantos alunos fizeram simulado?' sem misturar com questoes normais."

### **DECISAO 2:**
**Opcao B - Banco Completamente Separado:**
- `questoes_enem` - Questoes importadas da API
- `respostas_enem` - Respostas dos alunos
- `estatisticas_enem` - Metricas agregadas (opcional)

**Justificativas:**
1. Isolamento de falhas (problema no ENEM nao afeta sistema principal)
2. Estruturas diferentes (5 alternativas, imagens, sem dica)
3. Metricas independentes
4. Facilidade de manutencao
5. Possibilidade de desativar modulo sem impacto

---

## PAUTA 3: Restricao por Serie

### Professor Consultor:
> "ENEM e para quem vai fazer a prova - 3a serie. Mas e os alunos da 1a e 2a serie que querem praticar?"

### Product Owner:
> "Temos duas perspectivas:
> 1. **Restritiva:** So 3a serie (foco no publico-alvo real)
> 2. **Aberta:** Todas as series do EM (democratiza o acesso)"

### UX Designer:
> "Podemos ter um meio-termo: liberar para todos do EM, mas dar destaque visual para 3a serie. Tipo um badge 'Recomendado para voce' na 3a serie."

### Professor Consultor:
> "Na pratica, alunos de 1a e 2a serie que quiserem praticar vao encontrar um jeito. Melhor oferecer oficialmente com orientacao pedagogica."

### **DECISAO 3:**
**Acesso para todo Ensino Medio (1a, 2a, 3a serie):**
- Destaque visual para 3a serie ("Prepare-se para o ENEM!")
- Aviso para 1a/2a serie ("Conteudo avancado - desafie-se!")
- Ensino Fundamental NAO tera acesso (conteudo incompativel)

---

## PAUTA 4: Sistema de Pontuacao

### Arquiteto de Software:
> "O sistema atual tem gamificacao: pontos, niveis, conquistas. O Simulado ENEM deve participar disso?"

### Professor Consultor:
> "NAO. O objetivo do ENEM e diferente. Se dermos pontos, o aluno pode 'farmar' questoes ENEM ao inves de estudar o conteudo estruturado. Distorce o proposito."

### Product Owner:
> "Mas precisamos de alguma motivacao. Sugestao: estatisticas proprias do ENEM, sem afetar o sistema principal."

### UX Designer:
> "Podemos criar um 'Painel ENEM' proprio:
> - Taxa de acerto por area
> - Comparativo com media nacional (se tivermos dados)
> - Evolucao ao longo do tempo
> - Simulacao de nota TRI (futuro)"

### **DECISAO 4:**
**Sistema de Metricas Separado:**
- NAO afeta pontos/nivel/conquistas do sistema principal
- Estatisticas proprias: acertos por area, evolucao temporal
- Feedback imediato apos cada questao
- Relatorio de desempenho por area

---

## PAUTA 5: Interface e Experiencia

### UX Designer:
> "O componente de questao ENEM precisa:
> - Suportar 5 alternativas (A-E)
> - Exibir imagens no contexto e nas alternativas
> - Textos longos (ENEM tem enunciados extensos)
> - Modo 'expandir imagem' para ver detalhes
> - Timer opcional (simular pressao do exame)
> - Visual alinhado ao Studao (mesmas cores, fontes)"

### Arquiteto de Software:
> "O componente enviado pelo cliente ja tem boa parte disso. Precisamos adaptar:
> - Trocar cores hardcoded por CSS Variables do Studao
> - Integrar com sistema de autenticacao
> - Conectar com APIs de dados"

### Professor Consultor:
> "Importante: apos responder, NAO mostrar explicacao (ENEM nao tem). Apenas indicar certo/errado e a alternativa correta."

### **DECISAO 5:**
**Componente QuestaoENEM Customizado:**
- Baseado no design enviado
- Cores do Studao (CSS Variables)
- 5 alternativas com suporte a imagem
- Feedback simples (certo/errado)
- Sem explicacao detalhada
- Responsivo (mobile-first)

---

## PAUTA 6: Importacao e Atualizacao

### DBA:
> "A API enem.dev tem questoes de 2009-2023. Sao ~2.700 questoes. Como gerenciar?"

### Arquiteto de Software:
> "Opcoes:
> 1. **Cache Local:** Importar tudo uma vez, atualizar anualmente
> 2. **Tempo Real:** Buscar da API a cada requisicao
> 3. **Hibrido:** Cache com verificacao periodica"

### Product Owner:
> "Cache local e melhor. Nao dependemos da API estar online, e mais rapido, e podemos classificar manualmente (ex: marcar questoes de Fisica)."

### Professor Consultor:
> "Precisamos classificar as questoes de CN por subarea (Fisica, Quimica, Biologia). A API nao faz isso automaticamente."

### DBA:
> "Podemos criar um campo `subarea` e preencher manualmente ou com heuristica (palavras-chave no enunciado)."

### **DECISAO 6:**
**Importacao em Cache Local:**
- Importar anos 2019-2023 inicialmente (provas mais recentes)
- Armazenar no Supabase
- Campo `subarea` para classificacao manual (Fisica/Quimica/Bio)
- Script de atualizacao anual (quando ENEM novo sair)
- Nao depender da API em tempo real

---

## PAUTA 7: Filtragem por Conteudo

### Professor Consultor:
> "Os alunos precisam estudar por CONTEUDO especifico. Por exemplo:
> - Fisica: Mecanica, Termologia, Optica, Eletromagnetismo, Fisica Moderna
> - Quimica: Quimica Organica, Inorganica, Fisico-Quimica
> - Matematica: Geometria, Algebra, Estatistica, Funcoes
>
> Isso permite estudo direcionado para dificuldades especificas."

### DBA:
> "Podemos criar um campo `conteudo` com tags multiplas (array). Uma questao de Fisica pode envolver 'Mecanica' E 'Energia', por exemplo."

### UX Designer:
> "Na interface, teremos filtros em cascata:
> 1. Area (CN, Mat)
> 2. Subarea (Fisica, Quimica, Bio)
> 3. Conteudo (Mecanica, Termologia...)
>
> O aluno seleciona progressivamente para refinar a busca."

### Arquiteto de Software:
> "Precisaremos de uma tabela auxiliar `conteudos_enem` para padronizar os nomes e facilitar a busca."

### **DECISAO 7:**
**Filtragem por Conteudo Especifico:**
- Campo `conteudos` (array de strings) em cada questao
- Tabela auxiliar `conteudos_enem` com lista padronizada
- Interface com filtros em cascata (Area -> Subarea -> Conteudo)
- Classificacao manual/semi-automatica (palavras-chave)

**Conteudos Iniciais:**

| Subarea | Conteudos |
|---------|-----------|
| **Fisica** | Mecanica, Termologia, Optica, Ondulatoria, Eletricidade, Magnetismo, Fisica Moderna |
| **Quimica** | Quimica Geral, Fisico-Quimica, Quimica Organica, Quimica Inorganica, Quimica Ambiental |
| **Biologia** | Citologia, Genetica, Ecologia, Fisiologia, Evolucao, Botanica, Zoologia |
| **Matematica** | Algebra, Geometria Plana, Geometria Espacial, Funcoes, Estatistica, Probabilidade, Trigonometria |

---

## PAUTA 8: Navegacao e Acesso

### UX Designer:
> "Onde o Simulado ENEM aparece no app?"

### Product Owner:
> "Opcoes:
> 1. Novo item no menu lateral
> 2. Dentro de cada componente (Fisica -> Simulado ENEM)
> 3. Pagina independente no menu principal"

### Arquiteto de Software:
> "Como temos Fisica E Matematica, e o ENEM tem CN (inclui Fisica) e Matematica, faz sentido ter acesso em ambos os componentes."

### Professor Consultor:
> "O aluno de Fisica quer praticar CN. O aluno de Matematica quer praticar Mat. Faz sentido contextualizar."

### **DECISAO 8:**
**Acesso Contextualizado por Componente:**
- `/fisica/simulado-enem` -> Foco em Ciencias da Natureza
- `/matematica/simulado-enem` -> Foco em Matematica

**Menu:**
- Novo item "Simulado ENEM" no menu de cada componente
- Badge "NOVO" por 30 dias apos lancamento
- Icone distintivo (ex: documento com estrela)

---

## RESUMO DAS DECISOES

| # | Decisao | Justificativa |
|---|---------|---------------|
| 1 | Importar todas as areas, liberar gradualmente | Flexibilidade futura |
| 2 | Banco separado (questoes_enem, respostas_enem) | Isolamento e manutencao |
| 3 | Acesso para todo EM (1a, 2a, 3a) | Democratizacao |
| 4 | Metricas separadas, sem pontos | Proposito diferente |
| 5 | Componente customizado com visual Studao | Consistencia UX |
| 6 | Cache local com atualizacao anual | Performance e independencia |
| 7 | **Filtragem por conteudo especifico** | **Estudo direcionado** |
| 8 | Acesso contextualizado por componente | Relevancia para usuario |

---

# PARTE 2: ARQUITETURA TECNICA

## 2.1 Diagrama de Contexto

```
┌─────────────────────────────────────────────────────────────────┐
│                        STUDAO PLATFORM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐         ┌─────────────────────────────┐   │
│  │  BANCO ATUAL    │         │     BANCO ENEM (NOVO)       │   │
│  │                 │         │                             │   │
│  │  - questoes     │         │  - questoes_enem            │   │
│  │  - respostas    │         │  - respostas_enem           │   │
│  │  - usuarios     │◄───────►│                             │   │
│  │  - conquistas   │   FK    │                             │   │
│  │  - dias_ativos  │         │                             │   │
│  └─────────────────┘         └─────────────────────────────┘   │
│           │                              │                      │
│           ▼                              ▼                      │
│  ┌─────────────────┐         ┌─────────────────────────────┐   │
│  │ /estudar        │         │ /simulado-enem              │   │
│  │ /revisao        │         │                             │   │
│  │ /desafio        │         │ - Questoes 5 alternativas   │   │
│  │                 │         │ - Imagens                   │   │
│  │ - 4 alternativas│         │ - Sem pontos                │   │
│  │ - Pontos/Niveis │         │ - Estatisticas separadas    │   │
│  └─────────────────┘         └─────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   API ENEM.DEV      │
                    │   (Importacao)      │
                    │                     │
                    │   - 2.700+ questoes │
                    │   - 2009-2023       │
                    │   - Gratuita        │
                    └─────────────────────┘
```

## 2.2 Schema do Banco ENEM

### Tabela: questoes_enem

```sql
-- ================================================================
-- SIMULADO ENEM - BANCO SEPARADO
-- ================================================================

-- Tabela principal de questoes
CREATE TABLE questoes_enem (
    -- Identificacao
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_api VARCHAR(50) UNIQUE,              -- ID original da API (para evitar duplicatas)

    -- Dados da prova
    ano_prova INTEGER NOT NULL,             -- 2019, 2020, 2021, 2022, 2023
    numero_questao INTEGER NOT NULL,        -- Numero na prova original
    caderno VARCHAR(10),                    -- Azul, Amarelo, etc (se aplicavel)

    -- Classificacao ENEM
    area VARCHAR(50) NOT NULL,              -- 'ciencias-natureza', 'matematica', 'linguagens', 'ciencias-humanas'
    area_nome VARCHAR(100),                 -- Nome por extenso
    subarea VARCHAR(50),                    -- 'fisica', 'quimica', 'biologia', 'portugues', etc
    idioma VARCHAR(20),                     -- 'portugues', 'ingles', 'espanhol' (para Linguagens)

    -- Conteudo da questao
    titulo VARCHAR(255),                    -- "Questao 142 - ENEM 2023"
    contexto TEXT NOT NULL,                 -- Enunciado completo (suporta Markdown)
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

    -- Classificacao por Conteudo (NOVO)
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
    importado_por UUID,                       -- Usuario que importou (professor)

    -- Constraint unica
    UNIQUE(ano_prova, numero_questao, area)
);

-- Indices otimizados
CREATE INDEX idx_enem_ano ON questoes_enem(ano_prova);
CREATE INDEX idx_enem_area ON questoes_enem(area);
CREATE INDEX idx_enem_subarea ON questoes_enem(subarea);
CREATE INDEX idx_enem_status ON questoes_enem(status);
CREATE INDEX idx_enem_area_subarea ON questoes_enem(area, subarea);
CREATE INDEX idx_enem_ano_area ON questoes_enem(ano_prova, area);
CREATE INDEX idx_enem_conteudo ON questoes_enem(conteudo_principal);
CREATE INDEX idx_enem_conteudos ON questoes_enem USING gin(conteudos);

-- Full-text search no contexto
CREATE INDEX idx_enem_contexto_fts ON questoes_enem
    USING gin(to_tsvector('portuguese', contexto));
```

### Tabela: conteudos_enem (Catalogo de Conteudos)

```sql
-- Tabela auxiliar para padronizar conteudos
CREATE TABLE conteudos_enem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Hierarquia
    area VARCHAR(50) NOT NULL,              -- 'ciencias-natureza', 'matematica'
    subarea VARCHAR(50) NOT NULL,           -- 'fisica', 'quimica', 'biologia', 'matematica'

    -- Conteudo
    codigo VARCHAR(50) NOT NULL UNIQUE,     -- 'mecanica', 'termologia', etc
    nome VARCHAR(100) NOT NULL,             -- 'Mecânica'
    descricao TEXT,                         -- Descricao do conteudo

    -- Palavras-chave para classificacao automatica
    palavras_chave TEXT[],                  -- ['força', 'movimento', 'velocidade', 'aceleração']

    -- Ordem de exibicao
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,

    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_conteudos_area ON conteudos_enem(area);
CREATE INDEX idx_conteudos_subarea ON conteudos_enem(subarea);
CREATE INDEX idx_conteudos_ativo ON conteudos_enem(ativo);

-- Dados iniciais
INSERT INTO conteudos_enem (area, subarea, codigo, nome, palavras_chave, ordem) VALUES
-- FISICA
('ciencias-natureza', 'fisica', 'mecanica', 'Mecânica', ARRAY['força', 'movimento', 'velocidade', 'aceleração', 'newton', 'atrito', 'inércia'], 1),
('ciencias-natureza', 'fisica', 'termologia', 'Termologia', ARRAY['temperatura', 'calor', 'dilatação', 'termodinâmica', 'entropia'], 2),
('ciencias-natureza', 'fisica', 'optica', 'Óptica', ARRAY['luz', 'espelho', 'lente', 'refração', 'reflexão', 'difração'], 3),
('ciencias-natureza', 'fisica', 'ondulatoria', 'Ondulatória', ARRAY['onda', 'frequência', 'período', 'som', 'acústica', 'ressonância'], 4),
('ciencias-natureza', 'fisica', 'eletricidade', 'Eletricidade', ARRAY['corrente', 'tensão', 'resistência', 'circuito', 'elétrico', 'potência'], 5),
('ciencias-natureza', 'fisica', 'magnetismo', 'Magnetismo', ARRAY['campo magnético', 'ímã', 'indução', 'eletromagnetismo'], 6),
('ciencias-natureza', 'fisica', 'fisica-moderna', 'Física Moderna', ARRAY['quântica', 'relatividade', 'fóton', 'einstein', 'átomo'], 7),

-- QUIMICA
('ciencias-natureza', 'quimica', 'quimica-geral', 'Química Geral', ARRAY['átomo', 'molécula', 'ligação', 'tabela periódica'], 1),
('ciencias-natureza', 'quimica', 'fisico-quimica', 'Físico-Química', ARRAY['reação', 'equilíbrio', 'cinética', 'termoquímica', 'eletroquímica'], 2),
('ciencias-natureza', 'quimica', 'quimica-organica', 'Química Orgânica', ARRAY['carbono', 'hidrocarboneto', 'álcool', 'éster', 'polímero'], 3),
('ciencias-natureza', 'quimica', 'quimica-inorganica', 'Química Inorgânica', ARRAY['ácido', 'base', 'sal', 'óxido', 'metal'], 4),
('ciencias-natureza', 'quimica', 'quimica-ambiental', 'Química Ambiental', ARRAY['poluição', 'meio ambiente', 'efeito estufa', 'chuva ácida'], 5),

-- BIOLOGIA
('ciencias-natureza', 'biologia', 'citologia', 'Citologia', ARRAY['célula', 'membrana', 'núcleo', 'mitocôndria', 'organela'], 1),
('ciencias-natureza', 'biologia', 'genetica', 'Genética', ARRAY['dna', 'gene', 'cromossomo', 'hereditário', 'mendel'], 2),
('ciencias-natureza', 'biologia', 'ecologia', 'Ecologia', ARRAY['ecossistema', 'cadeia alimentar', 'biodiversidade', 'sustentabilidade'], 3),
('ciencias-natureza', 'biologia', 'fisiologia', 'Fisiologia', ARRAY['digestão', 'respiração', 'circulação', 'sistema nervoso'], 4),
('ciencias-natureza', 'biologia', 'evolucao', 'Evolução', ARRAY['darwin', 'seleção natural', 'especiação', 'adaptação'], 5),

-- MATEMATICA
('matematica', 'matematica', 'algebra', 'Álgebra', ARRAY['equação', 'inequação', 'polinômio', 'fatoração'], 1),
('matematica', 'matematica', 'geometria-plana', 'Geometria Plana', ARRAY['triângulo', 'círculo', 'área', 'perímetro', 'polígono'], 2),
('matematica', 'matematica', 'geometria-espacial', 'Geometria Espacial', ARRAY['cubo', 'esfera', 'cone', 'pirâmide', 'volume'], 3),
('matematica', 'matematica', 'funcoes', 'Funções', ARRAY['função', 'gráfico', 'domínio', 'imagem', 'exponencial', 'logaritmo'], 4),
('matematica', 'matematica', 'estatistica', 'Estatística', ARRAY['média', 'mediana', 'moda', 'desvio', 'gráfico', 'tabela'], 5),
('matematica', 'matematica', 'probabilidade', 'Probabilidade', ARRAY['probabilidade', 'chance', 'evento', 'combinação', 'arranjo'], 6),
('matematica', 'matematica', 'trigonometria', 'Trigonometria', ARRAY['seno', 'cosseno', 'tangente', 'ângulo', 'radiano'], 7);
```

### Tabela: respostas_enem

```sql
-- Respostas dos alunos no simulado
CREATE TABLE respostas_enem (
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

    -- Modo de pratica
    modo VARCHAR(20) DEFAULT 'livre' CHECK (modo IN ('livre', 'simulado', 'revisao')),
    sessao_id UUID,                          -- Para agrupar questoes de um simulado

    -- Timestamps
    criado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Evitar resposta duplicada para mesma questao
    UNIQUE(usuario_id, questao_id)
);

-- Indices
CREATE INDEX idx_resp_enem_usuario ON respostas_enem(usuario_id);
CREATE INDEX idx_resp_enem_questao ON respostas_enem(questao_id);
CREATE INDEX idx_resp_enem_area ON respostas_enem(area);
CREATE INDEX idx_resp_enem_subarea ON respostas_enem(subarea);
CREATE INDEX idx_resp_enem_usuario_area ON respostas_enem(usuario_id, area);
CREATE INDEX idx_resp_enem_data ON respostas_enem(criado_em);
```

### Tabela: sessoes_simulado (Opcional - Fase 2)

```sql
-- Para simulados cronometrados
CREATE TABLE sessoes_simulado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Configuracao
    area VARCHAR(50) NOT NULL,              -- Area selecionada
    ano_prova INTEGER,                      -- Ano especifico ou NULL para misto
    quantidade_questoes INTEGER DEFAULT 45, -- Padrao ENEM: 45 questoes por area
    tempo_limite_minutos INTEGER DEFAULT 180, -- 3 horas (simulando prova real)

    -- Status
    questoes_ids UUID[],                    -- IDs das questoes selecionadas
    respostas_ids UUID[],                   -- IDs das respostas dadas
    status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'completo', 'abandonado', 'tempo_esgotado')),

    -- Resultado
    total_questoes INTEGER,
    acertos INTEGER,
    nota_estimada DECIMAL(4,2),             -- Estimativa baseada em TRI (futuro)

    -- Timestamps
    iniciado_em TIMESTAMPTZ DEFAULT NOW(),
    finalizado_em TIMESTAMPTZ,

    CONSTRAINT tempo_valido CHECK (tempo_limite_minutos > 0 AND tempo_limite_minutos <= 300)
);
```

### RLS Policies

```sql
-- Habilitar RLS
ALTER TABLE questoes_enem ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_enem ENABLE ROW LEVEL SECURITY;

-- Questoes: leitura publica para questoes ativas
CREATE POLICY "questoes_enem_leitura" ON questoes_enem
    FOR SELECT USING (status = 'ativa');

-- Questoes: apenas professores podem modificar
CREATE POLICY "questoes_enem_escrita" ON questoes_enem
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE id = auth.uid() AND tipo = 'professor'
        )
    );

-- Respostas: usuario ve apenas suas proprias
CREATE POLICY "respostas_enem_leitura" ON respostas_enem
    FOR SELECT USING (usuario_id = auth.uid());

-- Respostas: usuario insere apenas suas proprias
CREATE POLICY "respostas_enem_insercao" ON respostas_enem
    FOR INSERT WITH CHECK (usuario_id = auth.uid());
```

---

## 2.3 Tipos TypeScript

```typescript
// ================================================================
// TIPOS ENEM - Adicionar em src/types/index.ts
// ================================================================

// Alternativas ENEM (5 opcoes)
export type AlternativaENEM = 'A' | 'B' | 'C' | 'D' | 'E'

// Areas do ENEM
export type AreaENEM =
  | 'ciencias-natureza'
  | 'matematica'
  | 'linguagens'
  | 'ciencias-humanas'

// Subareas (disciplinas especificas)
export type SubareaENEM =
  // Ciencias da Natureza
  | 'fisica'
  | 'quimica'
  | 'biologia'
  // Matematica
  | 'matematica'
  // Linguagens
  | 'portugues'
  | 'literatura'
  | 'ingles'
  | 'espanhol'
  | 'artes'
  // Ciencias Humanas
  | 'historia'
  | 'geografia'
  | 'filosofia'
  | 'sociologia'

// Questao ENEM
export interface QuestaoENEM {
  id: string
  id_api?: string
  ano_prova: number
  numero_questao: number
  caderno?: string
  area: AreaENEM
  area_nome?: string
  subarea?: SubareaENEM
  idioma?: string
  titulo: string
  contexto: string
  comando?: string
  imagem_principal?: string
  imagens_extras?: string[]
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  imagem_a?: string
  imagem_b?: string
  imagem_c?: string
  imagem_d?: string
  imagem_e?: string
  resposta_correta: AlternativaENEM
  conteudos?: string[]           // Array de conteudos relacionados
  conteudo_principal?: string    // Conteudo dominante
  dificuldade?: Dificuldade
  tags?: string[]
  status: StatusQuestao
  importado_em: string
}

// Resposta ENEM
export interface RespostaENEM {
  id: string
  usuario_id: string
  questao_id: string
  resposta_dada: AlternativaENEM
  correta: boolean
  tempo_segundos: number
  ano_prova: number
  area: AreaENEM
  subarea?: SubareaENEM
  modo: 'livre' | 'simulado' | 'revisao'
  sessao_id?: string
  criado_em: string
}

// Estatisticas do aluno
export interface EstatisticasENEM {
  total_questoes: number
  total_corretas: number
  taxa_acerto: number
  tempo_medio_segundos: number

  por_area: {
    [key in AreaENEM]?: {
      total: number
      corretas: number
      taxa: number
    }
  }

  por_subarea: {
    [key in SubareaENEM]?: {
      total: number
      corretas: number
      taxa: number
    }
  }

  por_ano: {
    [ano: number]: {
      total: number
      corretas: number
      taxa: number
    }
  }

  evolucao_semanal: {
    semana: string
    questoes: number
    acertos: number
    taxa: number
  }[]
}

// Conteudo (para filtragem)
export interface ConteudoENEM {
  id: string
  area: AreaENEM
  subarea: SubareaENEM
  codigo: string
  nome: string
  descricao?: string
  palavras_chave?: string[]
  ordem: number
  ativo: boolean
}

// Filtros para busca (COM CONTEUDO)
export interface FiltrosENEM {
  ano_prova?: number
  area?: AreaENEM
  subarea?: SubareaENEM
  conteudo?: string            // Codigo do conteudo (ex: 'mecanica')
  conteudos?: string[]         // Multiplos conteudos
  dificuldade?: Dificuldade
  apenas_nao_respondidas?: boolean
}

// Constantes
export const ENEM_CONFIG = {
  ANOS_DISPONIVEIS: [2019, 2020, 2021, 2022, 2023] as const,

  AREAS: {
    'ciencias-natureza': {
      nome: 'Ciencias da Natureza',
      cor: '#22c55e', // Verde
      icone: '🔬',
      subareas: ['fisica', 'quimica', 'biologia']
    },
    'matematica': {
      nome: 'Matematica',
      cor: '#3b82f6', // Azul
      icone: '📐',
      subareas: ['matematica']
    },
    'linguagens': {
      nome: 'Linguagens',
      cor: '#8b5cf6', // Roxo
      icone: '📚',
      subareas: ['portugues', 'literatura', 'ingles', 'espanhol', 'artes']
    },
    'ciencias-humanas': {
      nome: 'Ciencias Humanas',
      cor: '#f59e0b', // Amarelo
      icone: '🌍',
      subareas: ['historia', 'geografia', 'filosofia', 'sociologia']
    }
  },

  QUESTOES_POR_AREA: 45,    // ENEM tem 45 questoes por area
  TEMPO_PROVA_MINUTOS: 180, // 3 horas por caderno

  // Mapeamento Studao -> ENEM
  COMPONENTE_TO_AREA: {
    'fisica': 'ciencias-natureza',
    'matematica': 'matematica'
  } as Record<Componente, AreaENEM>,

  NIVEL_MINIMO: 'EM' as const, // Apenas Ensino Medio
} as const
```

---

## 2.4 API Routes

### Estrutura de Arquivos

```
src/app/api/enem/
├── route.ts                    # GET: Buscar proxima questao
├── responder/
│   └── route.ts               # POST: Submeter resposta
├── estatisticas/
│   └── route.ts               # GET: Estatisticas do usuario
├── importar/
│   └── route.ts               # POST: Importar da API (professor)
└── [ano]/
    └── route.ts               # GET: Questoes de um ano especifico
```

### GET /api/enem - Buscar Questao

```typescript
// Parametros
interface QueryParams {
  area?: AreaENEM           // Filtrar por area
  subarea?: SubareaENEM     // Filtrar por subarea (ex: 'fisica')
  ano?: number              // Filtrar por ano da prova
  modo?: 'aleatorio' | 'sequencial' | 'nao_respondidas'
}

// Response
interface Response {
  sucesso: boolean
  status: 'OK' | 'SEM_QUESTOES' | 'ACESSO_NEGADO' | 'ERRO'
  questao?: QuestaoENEM    // Sem resposta_correta
  estatisticas: {
    total_area: number
    respondidas: number
    restantes: number
    taxa_acerto: number
  }
  filtros_aplicados: QueryParams
}
```

### POST /api/enem/responder - Submeter Resposta

```typescript
// Request
interface Request {
  questao_id: string
  resposta: AlternativaENEM
  tempo_segundos: number
  modo?: 'livre' | 'simulado'
  sessao_id?: string
}

// Response
interface Response {
  sucesso: boolean
  correta: boolean
  resposta_correta: AlternativaENEM
  estatisticas_atualizadas: {
    total_questoes: number
    total_corretas: number
    taxa_acerto: number
    taxa_area: number
  }
}
```

---

## 2.5 Componentes React

### QuestaoENEM.tsx

```typescript
interface QuestaoENEMProps {
  questao: QuestaoENEM
  onResponder: (resposta: AlternativaENEM) => void
  mostrarResultado: boolean
  respostaUsuario?: AlternativaENEM
  carregando?: boolean
}
```

**Adaptacoes para Studao:**
- Usar `var(--color-fisica)` ou `var(--color-matematica)` baseado no componente
- Usar `var(--bg-surface)`, `var(--bg-elevated)`, `var(--border-default)`
- Usar `var(--text-primary)`, `var(--text-secondary)`
- Usar `var(--success)`, `var(--error)` para feedback
- Fonte: Outfit (ja carregada)

---

# PARTE 3: PLANO DE EXECUCAO

## Fase 1: Infraestrutura (2-3 horas)
- [ ] Criar arquivo SQL com schema completo
- [ ] Executar no Supabase
- [ ] Testar indices e policies
- [ ] Adicionar tipos TypeScript

## Fase 2: Importacao (2-3 horas)
- [ ] Criar rota `/api/enem/importar`
- [ ] Script para buscar da API enem.dev
- [ ] Importar anos 2019-2023
- [ ] Classificar subareas (Fisica/Quimica/Bio) - manual ou heuristica

## Fase 3: APIs (3-4 horas)
- [ ] GET `/api/enem` - Buscar questao
- [ ] POST `/api/enem/responder` - Submeter resposta
- [ ] GET `/api/enem/estatisticas` - Metricas do usuario
- [ ] Testes das rotas

## Fase 4: Componente Visual (3-4 horas)
- [ ] Criar `QuestaoENEM.tsx`
- [ ] Adaptar cores para Studao
- [ ] Implementar 5 alternativas
- [ ] Suporte a imagens (contexto e alternativas)
- [ ] Feedback visual (certo/errado)
- [ ] Responsividade mobile

## Fase 5: Pagina Simulado (2-3 horas)
- [ ] Criar `/[componente]/simulado-enem/page.tsx`
- [ ] Filtros (ano, subarea)
- [ ] Contador de progresso
- [ ] Painel de estatisticas
- [ ] Restricao nivel EM

## Fase 6: Integracao Menu (1 hora)
- [ ] Adicionar item "Simulado ENEM" no menu
- [ ] Badge "NOVO"
- [ ] Condicional para nivel EM

## Fase 7: Testes e Deploy (2-3 horas)
- [ ] Testar fluxo completo
- [ ] Testar diferentes series
- [ ] Testar filtros
- [ ] Deploy para producao

---

# PARTE 4: ESTIMATIVAS

| Fase | Horas | Prioridade |
|------|-------|------------|
| Infraestrutura | 2-3h | ALTA |
| Importacao | 2-3h | ALTA |
| APIs | 3-4h | ALTA |
| Componente | 3-4h | ALTA |
| Pagina | 2-3h | ALTA |
| Menu | 1h | MEDIA |
| Testes | 2-3h | ALTA |
| **TOTAL** | **15-21h** | - |

---

# PARTE 5: RISCOS E MITIGACOES

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| API enem.dev fora do ar | Baixa | Alto | Cache local, nao depender em tempo real |
| Imagens externas quebrarem | Media | Medio | Fallback para "imagem indisponivel" |
| Performance com muitas questoes | Baixa | Medio | Indices otimizados, paginacao |
| Classificacao subarea incorreta | Media | Baixo | Revisao manual pelo professor |

---

# PARTE 6: APROVACAO

## Itens para Decisao do Cliente

1. [ ] Aprovar escopo: todas as areas com liberacao gradual
2. [ ] Aprovar restricao: apenas Ensino Medio
3. [ ] Aprovar metricas: separadas do sistema principal
4. [ ] Aprovar estimativa: 15-21 horas
5. [ ] Definir prioridade: CN+Mat primeiro, outras areas depois

## Proximos Passos

Apos aprovacao:
1. Criar branch `feature/simulado-enem`
2. Implementar Fase 1 (Infraestrutura)
3. Review e merge incrementais

---

**Documento elaborado por:** Claude Code (Analista Senior)
**Para:** Equipe Studao - Colegio Estadual Cora Coralina
**Data:** 2026-01-06
