# Como Importar 2700 Questões do ENEM

Este guia explica como popular o banco de dados do Supabase com todas as questões do ENEM disponíveis na API.

## Opção 1: Importar 60 Questões de Exemplo (Rápido)

Se você só precisa de questões para teste, execute o SQL com 60 questões de exemplo:

1. Acesse o **Supabase Dashboard** > **SQL Editor**
2. Cole e execute o conteúdo de `sql/28_questoes_enem_ampliado.sql`
3. Isso adicionará 60 questões (15 por área)

## Opção 2: Importar Todas as 2700 Questões

### Passo 1: Executar o Script de Importação

O script vai buscar todas as questões da API api.enem.dev e gerar um arquivo SQL.

**Requisitos:**
- Node.js 18+ instalado
- Conexão com a internet (sem proxy que bloqueie a API)

**Execute no terminal:**

```bash
cd plataforma-edu
node scripts/importar-questoes-enem.mjs
```

O script irá:
- Buscar questões de todos os anos (2009-2023)
- Validar as alternativas
- Gerar o arquivo `sql/questoes_enem_completo.sql`

**Tempo estimado:** ~20-30 minutos (devido ao rate limit da API de 1 req/seg)

### Passo 2: Importar no Supabase

1. O arquivo gerado pode ser grande (5-10 MB)
2. Acesse o **Supabase Dashboard** > **SQL Editor**
3. Se o arquivo for muito grande, divida em partes menores

**Alternativa - Via CLI:**

```bash
# Instale a CLI do Supabase se não tiver
npm install -g supabase

# Faça login
supabase login

# Execute o SQL
supabase db push --db-url "postgresql://..." < sql/questoes_enem_completo.sql
```

## Estrutura das Questões

Cada questão importada contém:

| Campo | Descrição |
|-------|-----------|
| id_api | ID único (ex: enem-2023-45) |
| ano_prova | Ano do ENEM (2009-2023) |
| numero_questao | Número na prova original |
| area | ciencias-natureza, matematica, linguagens, ciencias-humanas |
| area_nome | Nome por extenso |
| subarea | fisica, quimica, biologia, matematica, portugues, etc |
| contexto | Enunciado completo da questão |
| comando | Texto antes das alternativas |
| alternativa_a a e | Textos das 5 alternativas |
| imagem_a a e | URLs das imagens das alternativas (se houver) |
| resposta_correta | A, B, C, D ou E |

## Verificação

Após importar, verifique a quantidade de questões:

```sql
SELECT
    area,
    COUNT(*) as total
FROM questoes_enem
WHERE status = 'ativa'
GROUP BY area
ORDER BY area;
```

Resultado esperado (aproximado):
- ciencias-humanas: ~675 questões
- ciencias-natureza: ~675 questões
- linguagens: ~675 questões
- matematica: ~675 questões

## Troubleshooting

### Erro "API bloqueada"
A API pode estar bloqueada em alguns ambientes (proxy corporativo, etc). Execute o script em um ambiente sem restrições de rede.

### Erro "too many requests"
O script já implementa rate limiting (1 req/seg), mas se necessário, aumente o delay no código.

### Arquivo SQL muito grande
Divida o arquivo em partes menores (por ano) ou use a CLI do Supabase para importação direta.

## Manutenção

Para atualizar as questões quando houver novos ENEMs:

```bash
# Edite ANOS no script para incluir novos anos
# Re-execute o script
node scripts/importar-questoes-enem.mjs
```

As questões existentes serão atualizadas (não duplicadas) graças ao `ON CONFLICT`.
