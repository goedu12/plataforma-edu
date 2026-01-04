# Checklist de Regressão - Plataforma Educacional

**Como usar:**
- Rode este checklist **antes do merge** (local/CI) e **depois do deploy** (homologação/produção)
- Registre resultado: `[x]` OK | `[ ]` Falhou | `[-]` Não se aplica
- Documente evidências em `REGRESSION_LOG.md`

---

## 1. Checklist Técnico (Build e Qualidade)

### 1.1 Instalação e Build
```bash
npm ci && npm run validate
```

- [ ] `npm ci` finaliza sem erro
- [ ] `npm run lint` sem erros críticos
- [ ] `npm run typecheck` (tsc --noEmit) sem erros
- [ ] `npm test` passa (Jest)
- [ ] `npm run build` passa
- [ ] `npm start` sobe e responde páginas básicas

### 1.2 Variáveis de Ambiente

- [ ] `.env.example` cobre todas as variáveis usadas
- [ ] Em produção, nenhum endpoint expõe variáveis sensíveis
- [ ] `SUPABASE_SERVICE_KEY` não aparece no bundle client

### 1.3 Docker / Deploy

```bash
docker build -t plataforma-edu .
docker run -p 3000:3000 --env-file .env plataforma-edu
```

- [ ] Build do Docker conclui
- [ ] Container sobe com PORT do ambiente
- [ ] Healthcheck `/api/health` retorna 200 `{status:"ok"}`
- [ ] Logs sem vazamento de chaves/PII

---

## 2. Checklist de Segurança

- [ ] `/api/ping` retorna 403 em produção
- [ ] `/api/verificar` retorna 403 em produção
- [ ] Não há credenciais de teste expostas em produção
- [ ] Rotas de professor exigem autenticação
- [ ] Uploads têm limite de tamanho (5MB) e validação

---

## 3. Checklist Funcional - Fluxo do Estudante

### 3.1 Acesso e Perfil

- [ ] Estudante consegue fazer login
- [ ] Estudante visualiza nome/turma/ano corretamente
- [ ] **Foto de perfil:**
  - [ ] Upload funciona
  - [ ] Imagem aparece após recarregar
  - [ ] Não grava base64 no banco (apenas URL)

### 3.2 Resolver Questões

- [ ] Estudante abre uma questão ativa
- [ ] Responde e recebe feedback (correta/incorreta)
- [ ] Pontuação atualiza corretamente
- [ ] Nível/progressão atualiza (se existir)
- [ ] Duplo clique não duplica pontos/resposta

### 3.3 Revisão

- [ ] "Revisão" retorna uma questão ativa
- [ ] Se as últimas estiverem inativas, seleciona outra
- [ ] Se não houver nenhuma ativa, retorna "sem revisão"

### 3.4 Desafios / Dias Ativos / Conquistas

- [ ] Desafio do dia carrega
- [ ] "Dia ativo" funciona no fuso America/Sao_Paulo
- [ ] Streak não quebra na virada do dia
- [ ] Conquistas são concedidas sem duplicar

### 3.5 Tutor/IA

- [ ] Endpoint de chat responde (200)
- [ ] Limite diário funciona (se configurado)
- [ ] Erro de API key tratado com mensagem clara
- [ ] Logs não imprimem conversa completa

---

## 4. Checklist Funcional - Fluxo do Professor

### 4.1 Autenticação e Painel

- [ ] Professor consegue fazer login
- [ ] Vê turmas e alunos vinculados
- [ ] Consegue abrir relatórios básicos

### 4.2 Importação de Alunos

```
Arquivo: nome,turma,componente
```

- [ ] Importa arquivo válido (CSV/XLSX)
- [ ] Relatório retorna: inseridos, atualizados, ignorados, erros por linha
- [ ] Reimportar mesmo arquivo não duplica alunos
- [ ] Arquivo muito grande é bloqueado (>5MB ou >1000 linhas)

### 4.3 Gestão de Questões

- [ ] Professor cria/edita questão
- [ ] Consegue ativar/desativar questão
- [ ] Questão inativa não aparece para estudante

### 4.4 Notas Bimestrais

- [ ] Registrar nota do bimestre funciona
- [ ] Validação de bimestre (1–4) funciona
- [ ] Relatório por bimestre aparece corretamente

---

## 5. Checklist de Banco de Dados

### 5.1 Integridade e Regras

- [ ] Migrações aplicam sem erro
- [ ] Seeds são idempotentes (rodar 2x não quebra)
- [ ] Constraints funcionam:
  - [ ] `nivel` válido (EF/EM)
  - [ ] `ano` coerente com nivel
  - [ ] `conquistas.codigo` é único

### 5.2 RLS e Políticas

- [ ] Tabelas sensíveis com RLS habilitado
- [ ] `service_role` usado apenas no servidor
- [ ] Policies consistentes com `auth.uid()`

---

## 6. Checklist de UX/Qualidade

- [ ] Tempo de carregamento aceitável em mobile
- [ ] Fluxo "login → questão → resposta" sem travamentos
- [ ] Mensagens de erro são pedagógicas
- [ ] Sem páginas quebradas (404 inesperado)
- [ ] Sem dados vazando (emails completos em tela/log)

---

## Registro de Execução

| Data | Ambiente | Executor | Resultado | Observações |
|------|----------|----------|-----------|-------------|
| YYYY-MM-DD | local/homolog/prod | Nome | OK/FALHOU | Link do log |

---

## Em Caso de Falha

1. Abrir issue: "Regressão – [função]"
2. Linkar commit/PR causador
3. **NÃO promover para produção** até corrigir
4. Documentar correção neste arquivo
