# PLANO DE IMPLEMENTACAO - SIMULADO ENEM
## Plataforma Studao - 3a Serie do Ensino Medio

**Versao:** 1.0
**Data:** 2026-01-06
**Analista:** Claude Code (Senior)
**Prioridade:** Alta

---

## 1. RESUMO EXECUTIVO

### Objetivo
Implementar um modulo de **Simulado ENEM** exclusivo para alunos da **3a serie do Ensino Medio**, integrando questoes reais do ENEM (2019-2023) da area de **Ciencias da Natureza** (Fisica, Quimica, Biologia) adaptado a identidade visual do Studao.

### Escopo
- Integracao com API ENEM (enem.dev) - GRATUITA
- Foco: Questoes de Ciencias da Natureza
- Publico: Apenas 3a serie EM
- Visual: Identidade Studao (CSS Variables existentes)

### Principais Diferencas do Sistema Atual
| Aspecto | Sistema Atual | ENEM |
|---------|---------------|------|
| Alternativas | 4 (A-D) | 5 (A-E) |
| Imagens | Nao suportado | URLs externas |
| Contexto | Enunciado simples | Texto + Imagens |
| Fonte | Banco proprio | API externa |

---

## 2. ARQUITETURA PROPOSTA

### 2.1 Fluxo de Dados
```
API ENEM (enem.dev)
       |
       v
/api/enem/importar (cron/manual)
       |
       v
Supabase: questoes_enem
       |
       v
/api/enem/questoes (GET)
       |
       v
/fisica/simulado-enem (Page)
```

### 2.2 Nova Estrutura de Arquivos
```
src/
├── app/
│   ├── (estudante)/
│   │   └── [componente]/
│   │       └── simulado-enem/
│   │           └── page.tsx        # Nova pagina
│   └── api/
│       └── enem/
│           ├── route.ts            # GET questoes ENEM
│           ├── responder/
│           │   └── route.ts        # POST resposta ENEM
│           └── importar/
│               └── route.ts        # POST importar da API
├── components/
│   └── QuestaoENEM.tsx             # Componente visual ENEM
├── types/
│   └── index.ts                    # + tipos ENEM
└── sql/
    └── 12_questoes_enem.sql        # Schema ENEM
```

---

## 3. DATABASE SCHEMA

### 3.1 Nova Tabela: questoes_enem

```sql
-- ================================================================
-- TABELA: questoes_enem
-- Questoes do ENEM para simulado (3a serie)
-- ================================================================
CREATE TABLE questoes_enem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Dados da API ENEM
    ano_prova INTEGER NOT NULL,           -- 2019, 2020, 2021, 2022, 2023
    numero_questao INTEGER NOT NULL,      -- Index da questao na prova
    disciplina VARCHAR(50) NOT NULL,      -- 'ciencias-natureza', 'matematica'

    -- Conteudo
    titulo VARCHAR(255),                  -- "Questao 142 - ENEM 2023"
    contexto TEXT NOT NULL,               -- Enunciado/contexto (Markdown)
    comando TEXT,                         -- Introducao das alternativas
    imagem_url TEXT,                      -- URL da imagem principal
    imagens_extras TEXT[],                -- URLs de imagens adicionais

    -- Alternativas (5 opcoes no ENEM)
    alternativa_a TEXT NOT NULL,
    alternativa_b TEXT NOT NULL,
    alternativa_c TEXT NOT NULL,
    alternativa_d TEXT NOT NULL,
    alternativa_e TEXT NOT NULL,
    imagem_alt_a TEXT,                    -- URL imagem alternativa A
    imagem_alt_b TEXT,
    imagem_alt_c TEXT,
    imagem_alt_d TEXT,
    imagem_alt_e TEXT,

    -- Resposta
    resposta_correta CHAR(1) NOT NULL CHECK (resposta_correta IN ('A','B','C','D','E')),

    -- Classificacao
    area VARCHAR(100),                    -- 'Fisica', 'Quimica', 'Biologia'
    tema VARCHAR(200),                    -- Tema especifico (Mecanica, Termodinamica)
    dificuldade VARCHAR(20) DEFAULT 'medio',

    -- Metadados
    fonte VARCHAR(100) DEFAULT 'ENEM',
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint unica: ano + numero
    UNIQUE(ano_prova, numero_questao)
);

-- Indices para performance
CREATE INDEX idx_enem_ano ON questoes_enem(ano_prova);
CREATE INDEX idx_enem_disciplina ON questoes_enem(disciplina);
CREATE INDEX idx_enem_area ON questoes_enem(area);
CREATE INDEX idx_enem_status ON questoes_enem(status);
CREATE INDEX idx_enem_ano_area ON questoes_enem(ano_prova, area);

-- RLS Policies
ALTER TABLE questoes_enem ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Questoes ENEM - leitura publica"
ON questoes_enem FOR SELECT
USING (status = 'ativa');
```

### 3.2 Nova Tabela: respostas_enem

```sql
-- ================================================================
-- TABELA: respostas_enem
-- Respostas dos alunos no simulado ENEM
-- ================================================================
CREATE TABLE respostas_enem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    questao_id UUID NOT NULL REFERENCES questoes_enem(id) ON DELETE CASCADE,

    -- Resposta
    resposta_dada CHAR(1) NOT NULL CHECK (resposta_dada IN ('A','B','C','D','E')),
    correta BOOLEAN NOT NULL,
    tempo_segundos INTEGER DEFAULT 0,

    -- Metadados
    ano_prova INTEGER NOT NULL,           -- Desnormalizado para queries
    area VARCHAR(100),                    -- 'Fisica', 'Quimica', 'Biologia'
    modo VARCHAR(20) DEFAULT 'simulado',  -- 'simulado', 'pratica'
    criado_em TIMESTAMPTZ DEFAULT NOW(),

    -- Evitar duplicatas
    UNIQUE(usuario_id, questao_id)
);

-- Indices
CREATE INDEX idx_resp_enem_usuario ON respostas_enem(usuario_id);
CREATE INDEX idx_resp_enem_questao ON respostas_enem(questao_id);
CREATE INDEX idx_resp_enem_area ON respostas_enem(area);
CREATE INDEX idx_resp_enem_usuario_area ON respostas_enem(usuario_id, area);

-- RLS
ALTER TABLE respostas_enem ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuario ve suas respostas ENEM"
ON respostas_enem FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Usuario insere suas respostas ENEM"
ON respostas_enem FOR INSERT
WITH CHECK (usuario_id = auth.uid());
```

---

## 4. TYPESCRIPT INTERFACES

### 4.1 Adicionar em src/types/index.ts

```typescript
// ===============================================================
// INTERFACE: QuestaoENEM
// Questoes do ENEM para simulado (3a serie)
// ===============================================================
export type AlternativaENEM = 'A' | 'B' | 'C' | 'D' | 'E'

export interface QuestaoENEM {
  id: string
  ano_prova: number
  numero_questao: number
  disciplina: 'ciencias-natureza' | 'matematica'
  titulo: string
  contexto: string
  comando?: string
  imagem_url?: string
  imagens_extras?: string[]
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  imagem_alt_a?: string
  imagem_alt_b?: string
  imagem_alt_c?: string
  imagem_alt_d?: string
  imagem_alt_e?: string
  resposta_correta: AlternativaENEM
  area?: 'Fisica' | 'Quimica' | 'Biologia'
  tema?: string
  dificuldade: Dificuldade
  status: StatusQuestao
  criado_em: string
}

export interface RespostaENEM {
  id: string
  usuario_id: string
  questao_id: string
  resposta_dada: AlternativaENEM
  correta: boolean
  tempo_segundos: number
  ano_prova: number
  area?: string
  modo: 'simulado' | 'pratica'
  criado_em: string
}

// Estatisticas do aluno no ENEM
export interface EstatisticasENEM {
  total_questoes: number
  acertos: number
  taxa_acerto: number
  por_area: {
    fisica: { total: number; acertos: number; taxa: number }
    quimica: { total: number; acertos: number; taxa: number }
    biologia: { total: number; acertos: number; taxa: number }
  }
  por_ano: Record<number, { total: number; acertos: number; taxa: number }>
}

// Constantes ENEM
export const ENEM = {
  ANOS_DISPONIVEIS: [2019, 2020, 2021, 2022, 2023],
  AREAS: ['Fisica', 'Quimica', 'Biologia'] as const,
  SERIE_MINIMA: 3, // Apenas 3a serie
} as const
```

---

## 5. API ROUTES

### 5.1 GET /api/enem - Buscar Questao

**Arquivo:** `src/app/api/enem/route.ts`

**Parametros Query:**
- `ano` (opcional): Filtrar por ano da prova
- `area` (opcional): 'Fisica', 'Quimica', 'Biologia'
- `modo` (opcional): 'aleatorio', 'sequencial'

**Response:**
```json
{
  "sucesso": true,
  "status": "OK",
  "questao": { ... },
  "total_disponiveis": 45,
  "respondidas": 12,
  "estatisticas": {
    "taxa_acerto_geral": 65,
    "por_area": { ... }
  }
}
```

**Logica:**
1. Verificar autenticacao
2. Verificar se usuario e 3a serie (OBRIGATORIO)
3. Buscar questoes nao respondidas
4. Filtrar por ano/area se especificado
5. Retornar questao (sem resposta_correta)

### 5.2 POST /api/enem/responder - Submeter Resposta

**Arquivo:** `src/app/api/enem/responder/route.ts`

**Request Body:**
```json
{
  "questao_id": "uuid",
  "resposta": "A",
  "tempo_segundos": 120
}
```

**Response:**
```json
{
  "sucesso": true,
  "correta": true,
  "resposta_correta": "A",
  "estatisticas": {
    "total_questoes": 13,
    "acertos": 9,
    "taxa_acerto": 69.2
  }
}
```

**Nota:** Simulado ENEM NAO da pontos no sistema principal (e pratica).

### 5.3 POST /api/enem/importar - Importar da API

**Arquivo:** `src/app/api/enem/importar/route.ts`

**Acesso:** Apenas professores

**Funcao:** Busca questoes da API enem.dev e insere no banco

---

## 6. COMPONENTE VISUAL

### 6.1 QuestaoENEM.tsx

Adaptar o componente enviado para usar as CSS Variables do Studao:

```typescript
// Mapeamento de cores
const cores = {
  '--cor-primaria': 'var(--color-fisica)',      // Verde Studao
  '--cor-fundo': 'var(--bg-base)',
  '--cor-card': 'var(--bg-surface)',
  '--cor-borda': 'var(--border-default)',
  '--cor-texto': 'var(--text-primary)',
  '--cor-texto-secundario': 'var(--text-secondary)',
  '--cor-sucesso': 'var(--success)',
  '--cor-erro': 'var(--error)',
}
```

**Principais Adaptacoes:**
1. Usar fonte `Outfit` (ja presente no projeto)
2. Usar CSS Variables existentes
3. Adicionar 5a alternativa (E)
4. Suporte a imagens nas alternativas
5. Responsividade mobile-first

---

## 7. PAGINA SIMULADO ENEM

### 7.1 Rota e Acesso

**Rota:** `/fisica/simulado-enem` (ou `/matematica/simulado-enem`)

**Restricao:**
- Apenas usuarios com `ano === 3` e `nivel === 'EM'`
- Mostrar mensagem para outras series

### 7.2 Layout da Pagina

```
+------------------------------------------+
| <- Voltar        SIMULADO ENEM     2023  |
| [Badge: Ciencias da Natureza]            |
+------------------------------------------+
|                                          |
|  [Filtros: Ano | Area | Todas]           |
|                                          |
|  +------------------------------------+  |
|  |       QUESTAO ENEM COMPONENT       |  |
|  |                                    |  |
|  |  Contexto com imagem               |  |
|  |                                    |  |
|  |  [A] Alternativa                   |  |
|  |  [B] Alternativa                   |  |
|  |  [C] Alternativa                   |  |
|  |  [D] Alternativa                   |  |
|  |  [E] Alternativa                   |  |
|  |                                    |  |
|  |  [ CONFIRMAR RESPOSTA ]            |  |
|  +------------------------------------+  |
|                                          |
|  Progresso: 12/45 questoes               |
|  Taxa de Acerto: 67%                     |
+------------------------------------------+
```

### 7.3 Funcionalidades

1. **Filtros**
   - Por ano da prova (2019-2023)
   - Por area (Fisica, Quimica, Biologia, Todas)

2. **Progresso**
   - Contador de questoes respondidas
   - Taxa de acerto geral
   - Grafico por area (opcional)

3. **Feedback**
   - Mostrar resposta correta
   - NAO mostrar explicacao (ENEM nao tem)
   - Mostrar estatisticas atualizadas

---

## 8. PLANO DE EXECUCAO

### Fase 1: Database (1-2 horas)
- [ ] Criar arquivo SQL `12_questoes_enem.sql`
- [ ] Executar no Supabase
- [ ] Verificar indices e policies

### Fase 2: Types & Interfaces (30 min)
- [ ] Adicionar interfaces em `src/types/index.ts`
- [ ] Criar constantes ENEM

### Fase 3: API Routes (2-3 horas)
- [ ] `/api/enem/route.ts` - GET questao
- [ ] `/api/enem/responder/route.ts` - POST resposta
- [ ] `/api/enem/importar/route.ts` - Importar API

### Fase 4: Componente Visual (2-3 horas)
- [ ] Criar `QuestaoENEM.tsx`
- [ ] Adaptar CSS para Studao
- [ ] Suporte a 5 alternativas
- [ ] Suporte a imagens

### Fase 5: Pagina (2-3 horas)
- [ ] Criar `simulado-enem/page.tsx`
- [ ] Implementar filtros
- [ ] Implementar progresso
- [ ] Restricao 3a serie

### Fase 6: Importacao (1-2 horas)
- [ ] Script de importacao
- [ ] Classificar questoes por area (Fisica/Quimica/Bio)
- [ ] Popular banco com anos 2019-2023

### Fase 7: Testes & Deploy (1-2 horas)
- [ ] Testar fluxo completo
- [ ] Testar restricao de serie
- [ ] Deploy

**Estimativa Total:** 10-15 horas de desenvolvimento

---

## 9. CONSIDERACOES IMPORTANTES

### 9.1 API ENEM (enem.dev)
- **Gratuita** e sem autenticacao
- Limite de requests nao documentado (usar cache)
- Dados até 2023

### 9.2 Restricao de Serie
```typescript
// Verificar no inicio da pagina
if (usuario.ano !== 3 || usuario.nivel !== 'EM') {
  return <AcessoNegado mensagem="Simulado ENEM disponivel apenas para 3a serie" />
}
```

### 9.3 Imagens
- URLs externas do enem.dev
- Verificar CORS e next.config.js
- Adicionar dominio: `enem.dev`

### 9.4 Pontuacao
- Simulado ENEM NAO afeta pontuacao do sistema principal
- E apenas para pratica e preparacao
- Estatisticas separadas

---

## 10. MENU DE NAVEGACAO

Adicionar entrada no menu do estudante (apenas 3a serie):

```typescript
// Em algum lugar do menu
{usuario.ano === 3 && usuario.nivel === 'EM' && (
  <MenuItem
    href={`/${componente}/simulado-enem`}
    icon={<BookOpen />}
    label="Simulado ENEM"
    badge="NOVO"
  />
)}
```

---

## 11. APROVACAO

Este plano requer aprovacao antes da implementacao.

**Itens para decisao:**
1. Confirmar foco apenas em Ciencias da Natureza
2. Confirmar restricao apenas 3a serie
3. Definir se quer estatisticas detalhadas ou simples
4. Aprovar estimativa de tempo

---

**Documento preparado por:** Claude Code
**Para:** Equipe Studao - Colegio Cora Coralina
