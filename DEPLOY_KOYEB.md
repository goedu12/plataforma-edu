# Deploy da Plataforma EDU no Koyeb

Tutorial completo para configurar e publicar a plataforma educacional do zero.

---

## Pré-requisitos

- Conta no [GitHub](https://github.com)
- Conta no [Supabase](https://supabase.com) (gratuito)
- Conta no [Koyeb](https://koyeb.com) (gratuito)
- Conta no [Google AI Studio](https://ai.google.dev) (gratuito)

---

## Passo 1: Configurar o Supabase (Banco de Dados)

### 1.1 Criar Projeto

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** `plataforma-edu`
   - **Database Password:** (anote essa senha!)
   - **Region:** South America (São Paulo) ou mais próximo
4. Clique em **"Create new project"**
5. Aguarde 2-3 minutos para o projeto ser criado

### 1.2 Obter Credenciais

1. No painel do Supabase, vá em **Settings** (engrenagem) → **API**
2. Copie e guarde:
   - **Project URL** → será `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → será `SUPABASE_SERVICE_KEY`

### 1.3 Criar as Tabelas

1. No Supabase, vá em **SQL Editor** (ícone de código)
2. Clique em **"New query"**
3. Cole o conteúdo do arquivo `sql/01_schema.sql`
4. Clique em **"Run"** (ou Ctrl+Enter)
5. Deve aparecer "Success. No rows returned"

### 1.4 Inserir Dados Iniciais

1. Ainda no SQL Editor, crie uma nova query
2. Cole o conteúdo do arquivo `sql/02_seeds.sql`
3. Clique em **"Run"**
4. Isso criará:
   - 1 professor de teste
   - 7 estudantes de exemplo
   - 12 conquistas
   - 18+ questões de Física e Matemática

### 1.5 Verificar Instalação

Execute esta query para confirmar:

```sql
SELECT
  (SELECT COUNT(*) FROM usuarios) as usuarios,
  (SELECT COUNT(*) FROM questoes) as questoes,
  (SELECT COUNT(*) FROM conquistas) as conquistas;
```

Deve retornar algo como: `8, 18, 12`

---

## Passo 2: Obter Chave do Google Gemini (Tutor IA)

1. Acesse [ai.google.dev](https://ai.google.dev)
2. Clique em **"Get API key"** ou **"Começar"**
3. Faça login com sua conta Google
4. Clique em **"Create API key"**
5. Selecione um projeto ou crie um novo
6. Copie a chave gerada (começa com `AIzaSy...`)
7. Guarde essa chave → será `GEMINI_API_KEY`

---

## Passo 3: Preparar o Repositório no GitHub

### 3.1 Fork ou Push do Projeto

**Opção A - Se você tem o código local:**
```bash
# Criar repositório no GitHub primeiro, depois:
git remote add origin https://github.com/SEU_USUARIO/plataforma-edu.git
git branch -M main
git push -u origin main
```

**Opção B - Se é um fork:**
1. Vá no repositório original no GitHub
2. Clique em **"Fork"**
3. Escolha sua conta

### 3.2 Verificar Arquivos Essenciais

Certifique-se que estes arquivos existem no repositório:
- `package.json`
- `next.config.js`
- `tsconfig.json`
- `.env.example` (NÃO o `.env` real!)

---

## Passo 4: Deploy no Koyeb

### 4.1 Criar Conta e App

1. Acesse [koyeb.com](https://koyeb.com) e faça login (pode usar GitHub)
2. Clique em **"Create App"**
3. Selecione **"GitHub"** como método de deploy

### 4.2 Conectar Repositório

1. Autorize o Koyeb a acessar seus repositórios
2. Selecione o repositório `plataforma-edu`
3. Branch: `main` (ou sua branch principal)

### 4.3 Configurar Build

Na seção **"Build and deployment settings"**:

| Campo | Valor |
|-------|-------|
| Builder | Buildpack |
| Build command | `npm run build` |
| Run command | `npm start` |
| Port | `3000` |

### 4.4 Configurar Variáveis de Ambiente

Clique em **"Environment variables"** e adicione:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (sua anon key) |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOi...` (sua service key) |
| `JWT_SECRET` | `sua-chave-secreta-minimo-32-caracteres` |
| `GEMINI_API_KEY` | `AIzaSy...` (sua chave do Google) |
| `NEXT_PUBLIC_APP_URL` | `https://seu-app.koyeb.app` |
| `NODE_ENV` | `production` |

> **Dica:** Para `JWT_SECRET`, gere uma string aleatória segura com 32+ caracteres.
> Você pode usar: `openssl rand -base64 32`

### 4.5 Configurar Recursos

Na seção **"Instance"**:
- **Instance type:** Free (Nano - 512MB RAM)
- **Regions:** Washington, D.C. (mais próximo da América do Sul com tier free)

### 4.6 Nomear e Criar

1. **App name:** `plataforma-edu` (ou outro nome)
2. Clique em **"Deploy"**

### 4.7 Aguardar Deploy

O primeiro deploy leva 3-5 minutos. Você verá:
1. Building... (compilando o projeto)
2. Deploying... (enviando para o servidor)
3. Healthy (pronto!)

---

## Passo 5: Testar a Aplicação

### 5.1 Acessar a URL

Após o deploy, sua URL será algo como:
```
https://plataforma-edu-seu-usuario.koyeb.app
```

### 5.2 Testar Login

**Como Professor:**
- Email: `professor@prof`
- Senha: `@professor`

**Como Estudante:**
- Email: `mariasantos@1a`
- Senha: `@estudante`

### 5.3 Verificar Funcionalidades

- [ ] Login funciona
- [ ] Seleção de componente (Física/Matemática)
- [ ] Questões carregam
- [ ] Tutor IA responde
- [ ] Ranking mostra dados
- [ ] Dashboard do professor funciona

---

## Passo 6: Atualizar a URL Correta

Após o deploy, atualize a variável `NEXT_PUBLIC_APP_URL`:

1. No Koyeb, vá em **Settings** → **Environment variables**
2. Edite `NEXT_PUBLIC_APP_URL` com a URL real do seu app
3. Clique em **"Redeploy"**

---

## Solução de Problemas

### Erro: "Application failed to start"

1. Verifique os logs no Koyeb (aba "Logs")
2. Confira se todas as variáveis de ambiente estão corretas
3. Verifique se o Supabase está acessível

### Erro: "Database connection failed"

1. Confira `NEXT_PUBLIC_SUPABASE_URL` (deve incluir `https://`)
2. Verifique se as chaves do Supabase estão corretas
3. No Supabase, vá em Settings → Database e verifique se está ativo

### Erro: "Tutor não responde"

1. Verifique se `GEMINI_API_KEY` está correta
2. A chave deve começar com `AIzaSy`
3. Verifique os limites de uso em [ai.google.dev](https://ai.google.dev)

### Erro: "Login falha"

1. Verifique se o schema SQL foi executado
2. Verifique se os seeds foram inseridos
3. Confira `JWT_SECRET` (mínimo 32 caracteres)

---

## Comandos Úteis

### Verificar dados no Supabase

```sql
-- Contar registros
SELECT 'usuarios' as tabela, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'questoes', COUNT(*) FROM questoes
UNION ALL
SELECT 'conquistas', COUNT(*) FROM conquistas;

-- Listar usuários
SELECT nome, email, turma, tipo FROM usuarios;

-- Ver questões por componente
SELECT componente, COUNT(*) as total FROM questoes GROUP BY componente;
```

### Resetar senha de usuário (no Supabase)

```sql
UPDATE usuarios
SET senha_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H9Q0OKmqTqT7.5o5o5o5o5o5o5o'
WHERE email = 'usuario@turma';
-- Isso define a senha para '@estudante'
```

---

## Custos

| Serviço | Plano | Custo |
|---------|-------|-------|
| Koyeb | Free (Nano) | Gratuito |
| Supabase | Free | Gratuito |
| Google Gemini | Free tier | Gratuito |
| **Total** | | **R$ 0/mês** |

### Limites do Plano Gratuito

- **Koyeb Free:** 1 app, 512MB RAM, sleep após 5min inativo
- **Supabase Free:** 500MB database, 1GB bandwidth/mês
- **Gemini Free:** 60 requests/minuto

---

## Próximos Passos

1. **Adicionar mais questões** - Use o SQL Editor do Supabase
2. **Importar alunos reais** - Use a função de importação CSV no dashboard do professor
3. **Configurar domínio próprio** - Disponível no Koyeb (plano pago)

---

## Suporte

- **Problemas técnicos:** Abra uma issue no GitHub
- **Dúvidas sobre Koyeb:** [docs.koyeb.com](https://docs.koyeb.com)
- **Dúvidas sobre Supabase:** [supabase.com/docs](https://supabase.com/docs)

---

*Última atualização: Janeiro 2026*
