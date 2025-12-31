# 📚 Tutorial de Instalação - Plataforma EDU

## Guia Completo de Instalação e Configuração

**Versão:** 1.0
**Última atualização:** Dezembro 2025

---

## 📋 Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Instalação Local](#2-instalação-local)
3. [Configuração do Supabase](#3-configuração-do-supabase)
4. [Configuração do Gemini AI](#4-configuração-do-gemini-ai)
5. [Variáveis de Ambiente](#5-variáveis-de-ambiente)
6. [Execução Local](#6-execução-local)
7. [Deploy na Koyeb](#7-deploy-na-koyeb)
8. [Verificação e Testes](#8-verificação-e-testes)
9. [Solução de Problemas](#9-solução-de-problemas)

---

## 1. Pré-requisitos

### Software Necessário

| Software | Versão Mínima | Download |
|----------|---------------|----------|
| Node.js | 18.17.0+ | [nodejs.org](https://nodejs.org) |
| npm | 9.0.0+ | Incluído com Node.js |
| Git | 2.30.0+ | [git-scm.com](https://git-scm.com) |

### Contas Necessárias (Gratuitas)

- **Supabase**: [supabase.com](https://supabase.com) - Banco de dados PostgreSQL
- **Google AI Studio**: [aistudio.google.com](https://aistudio.google.com) - API Gemini
- **Koyeb** (opcional): [koyeb.com](https://koyeb.com) - Deploy em produção

### Verificar Instalação

```bash
# Verificar Node.js
node --version
# Deve retornar v18.17.0 ou superior

# Verificar npm
npm --version
# Deve retornar 9.0.0 ou superior

# Verificar Git
git --version
# Deve retornar 2.30.0 ou superior
```

---

## 2. Instalação Local

### 2.1 Clonar o Repositório

```bash
# Clonar repositório
git clone <URL_DO_REPOSITORIO> plataforma-edu
cd plataforma-edu
```

### 2.2 Instalar Dependências

```bash
# Instalar todas as dependências
npm install
```

### 2.3 Criar Arquivo de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env
```

---

## 3. Configuração do Supabase

### 3.1 Criar Projeto no Supabase

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Faça login ou crie uma conta
3. Clique em **"New Project"**
4. Preencha:
   - **Name**: plataforma-edu
   - **Database Password**: (anote a senha)
   - **Region**: South America (São Paulo)
5. Clique em **"Create new project"**
6. Aguarde a criação (pode levar alguns minutos)

### 3.2 Obter Credenciais

1. No painel do Supabase, vá em **Settings > API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY`

### 3.3 Executar Scripts SQL

1. No Supabase, vá em **SQL Editor**
2. Clique em **"New query"**
3. Execute os scripts na ordem:

**Passo 1 - Schema (estrutura do banco):**
```bash
# Copie o conteúdo de sql/01_schema.sql e execute no SQL Editor
```

**Passo 2 - Seeds (dados iniciais):**
```bash
# Copie o conteúdo de sql/02_seeds.sql e execute no SQL Editor
```

**Passo 3 - Functions (funções auxiliares):**
```bash
# Copie o conteúdo de sql/03_functions.sql e execute no SQL Editor
```

### 3.4 Verificar Tabelas

No Supabase, vá em **Table Editor** e verifique se as tabelas foram criadas:
- ✅ usuarios
- ✅ questoes
- ✅ respostas
- ✅ conquistas
- ✅ conquistas_usuarios
- ✅ historico_chat

---

## 4. Configuração do Gemini AI

### 4.1 Obter API Key

1. Acesse [Google AI Studio](https://aistudio.google.com)
2. Faça login com sua conta Google
3. Clique em **"Get API Key"** no menu lateral
4. Clique em **"Create API key"**
5. Copie a chave gerada → `GEMINI_API_KEY`

### 4.2 Limites da API Gratuita

- **15 requisições por minuto**
- **1.500 requisições por dia**
- Suficiente para uso escolar

---

## 5. Variáveis de Ambiente

### 5.1 Editar Arquivo .env

Abra o arquivo `.env` e preencha:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT (obrigatório - gere uma chave aleatória de 32 caracteres)
JWT_SECRET=sua-chave-super-secreta-com-32-caracteres-minimo

# Gemini AI (obrigatório para tutores IA)
GEMINI_API_KEY=AIzaSyB...

# App (opcional em desenvolvimento)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 5.2 Gerar JWT_SECRET

```bash
# Gerar chave aleatória no terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 6. Execução Local

### 6.1 Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

### 6.2 Acessar Aplicação

Abra no navegador: **http://localhost:3000**

### 6.3 Credenciais de Teste

**Professor:**
- Email: `professor@admin`
- Senha: `@professor123`

**Estudantes de Exemplo:**
- Email: `mariasilvasantos@1a`
- Senha: `@estudante`

---

## 7. Deploy na Koyeb

### 7.1 Criar Conta na Koyeb

1. Acesse [koyeb.com](https://www.koyeb.com)
2. Crie uma conta gratuita

### 7.2 Conectar Repositório

1. No dashboard, clique em **"Create App"**
2. Selecione **"GitHub"**
3. Conecte seu repositório
4. Selecione a branch principal

### 7.3 Configurar Build

- **Builder**: Dockerfile
- **Instance type**: Nano (gratuito)
- **Port**: 3000

### 7.4 Adicionar Variáveis de Ambiente

Na seção **"Environment variables"**, adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=sua-chave-secreta
GEMINI_API_KEY=AIza...
NEXT_PUBLIC_APP_URL=https://seu-app.koyeb.app
NODE_ENV=production
```

### 7.5 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (5-10 minutos)
3. Acesse a URL fornecida

---

## 8. Verificação e Testes

### 8.1 Executar Testes Automatizados

```bash
# Executar todos os testes
npm test

# Executar testes com cobertura
npm run test:coverage

# Executar testes em modo watch
npm run test:watch
```

### 8.2 Verificar Build de Produção

```bash
# Criar build de produção
npm run build

# Iniciar em modo produção
npm start
```

### 8.3 Checklist de Verificação

#### Login e Autenticação
- [ ] Login do professor funciona
- [ ] Login do estudante funciona
- [ ] Logout funciona
- [ ] Redirecionamento correto após login

#### Área do Estudante
- [ ] Seleção de componente funciona
- [ ] Menu principal carrega
- [ ] Questões são exibidas
- [ ] Respostas são salvas
- [ ] Pontos são calculados
- [ ] Ranking é exibido
- [ ] Conquistas são mostradas

#### Tutor IA
- [ ] Chat inicia corretamente
- [ ] Tutor responde
- [ ] Limite diário funciona
- [ ] Histórico é mantido

#### Área do Professor
- [ ] Dashboard carrega
- [ ] Estatísticas são exibidas
- [ ] Lista de alunos funciona
- [ ] Reset de senha funciona
- [ ] Importação de CSV funciona

---

## 9. Solução de Problemas

### Erro: "Module not found"

```bash
# Limpar cache e reinstalar
rm -rf node_modules
rm package-lock.json
npm install
```

### Erro: "Supabase connection failed"

1. Verifique as variáveis de ambiente
2. Confirme que o projeto Supabase está ativo
3. Verifique se o IP está permitido (Settings > Database > Network)

### Erro: "Invalid JWT"

1. Verifique se JWT_SECRET tem pelo menos 32 caracteres
2. Limpe os cookies do navegador
3. Faça login novamente

### Erro: "Gemini API error"

1. Verifique se a API key está correta
2. Confirme que a API está habilitada no Google Cloud
3. Verifique os limites de uso

### Build falha no deploy

1. Verifique se todas as variáveis de ambiente estão configuradas
2. Verifique os logs de build
3. Tente fazer build local primeiro

### Banco de dados vazio

1. Verifique se os scripts SQL foram executados
2. Execute os seeds novamente
3. Verifique as tabelas no Supabase

---

## 📞 Suporte

- **Documentação**: Este arquivo
- **Issues**: Abra uma issue no repositório
- **Contato**: Prof. Leonardo

---

## 📄 Licença

Este projeto é de uso educacional para o Colégio Estadual Cora Coralina.

---

**Plataforma EDU v1.0** - Desenvolvido com ❤️ para a educação
