# Procedimentos de Recuperação de Dados - seu10.com

## Visão Geral do Sistema de Proteção

O sistema mantém backups automáticos de todos os dados dos estudantes através de triggers no banco de dados. **Nenhum dado é perdido**, mesmo que:

- Questões sejam alteradas ou deletadas
- O sistema de notas seja modificado
- Registros sejam deletados por engano

---

## Tabelas de Backup

| Tabela | Descrição |
|--------|-----------|
| `historico_notas` | Snapshots de todas as notas antes de alterações |
| `backup_respostas` | Cópia de todas as respostas com dados da questão no momento |
| `backup_tempo_uso` | Backup de todo o tempo de uso registrado |
| `log_alteracoes_sistema` | Log de alterações importantes no sistema |

---

## Procedimentos

### 1. Antes de Qualquer Alteração Grande

Sempre criar um snapshot completo antes de:
- Alterar questões
- Modificar o sistema de notas
- Fazer manutenção no banco

```sql
SELECT * FROM criar_snapshot_completo('Motivo: Antes de atualizar questões de física');
```

Retorna: quantidade de usuários, notas, respostas e tempos salvos.

---

### 2. Backup de Um Usuário Específico

Para fazer backup dos dados de um estudante específico:

```sql
SELECT * FROM criar_snapshot_usuario(
  'uuid-do-usuario-aqui',
  'Motivo: Backup antes de correção'
);
```

---

### 3. Ver Histórico de Notas de um Usuário

```sql
SELECT
  id,
  componente,
  bimestre,
  ano,
  nota_final,
  operacao,
  motivo,
  criado_em
FROM historico_notas
WHERE usuario_id = 'uuid-do-usuario'
ORDER BY criado_em DESC;
```

---

### 4. Ver Histórico de Respostas de um Usuário

```sql
SELECT
  id,
  questao_id,
  resposta_dada,
  correta,
  questao_enunciado,
  operacao,
  criado_em
FROM backup_respostas
WHERE usuario_id = 'uuid-do-usuario'
ORDER BY criado_em DESC;
```

---

### 5. Restaurar uma Nota de um Snapshot

Primeiro, encontre o ID do snapshot desejado:

```sql
SELECT id, nota_final, criado_em, motivo
FROM historico_notas
WHERE usuario_id = 'uuid-do-usuario'
  AND componente = 'fisica'
  AND bimestre = 1
ORDER BY criado_em DESC;
```

Depois, restaure usando o ID:

```sql
SELECT restaurar_nota_snapshot(
  123,  -- ID do historico_notas
  'Motivo: Restaurando após erro no sistema'
);
```

---

### 6. Exportar Todos os Dados de um Usuário

Para exportar todos os dados em JSON (útil para análise ou backup externo):

```sql
SELECT exportar_dados_usuario('uuid-do-usuario');
```

Retorna um JSON completo com:
- Notas atuais
- Todas as respostas com dados das questões
- Tempo de uso
- Histórico de notas
- Backup de respostas

---

### 7. Ver Log de Alterações do Sistema

```sql
SELECT
  tipo_alteracao,
  descricao,
  criado_em
FROM log_alteracoes_sistema
ORDER BY criado_em DESC
LIMIT 50;
```

---

## Cenários de Recuperação

### Cenário 1: Deletaram Notas por Engano

1. Identifique o usuário e período afetado
2. Busque no histórico:
```sql
SELECT * FROM historico_notas
WHERE usuario_id = 'uuid'
  AND operacao = 'DELETE'
ORDER BY criado_em DESC;
```
3. Restaure usando `restaurar_nota_snapshot(id_do_historico)`

### Cenário 2: Sistema de Notas foi Alterado e Notas Ficaram Erradas

1. Crie um snapshot antes de corrigir (para ter mais um ponto de restauração)
2. Busque os snapshots anteriores à mudança:
```sql
SELECT * FROM historico_notas
WHERE criado_em < '2026-01-20'  -- data antes da mudança
  AND operacao = 'SNAPSHOT'
ORDER BY criado_em DESC;
```
3. Restaure as notas necessárias

### Cenário 3: Questão foi Alterada e Preciso Ver a Resposta Original

As respostas são salvas com o enunciado e resposta correta da questão no momento:

```sql
SELECT
  questao_enunciado,
  questao_resposta_correta,
  resposta_dada,
  correta,
  criado_em
FROM backup_respostas
WHERE usuario_id = 'uuid'
  AND questao_id = 123
ORDER BY criado_em DESC;
```

### Cenário 4: Preciso Recalcular Todas as Notas de um Período

1. Primeiro, faça um snapshot completo:
```sql
SELECT * FROM criar_snapshot_completo('Antes de recalcular notas do 1º bimestre');
```
2. Execute o recálculo no sistema
3. Se algo der errado, restaure usando os snapshots

---

## Manutenção Recomendada

### Snapshot Semanal (Recomendado)
```sql
SELECT * FROM criar_snapshot_completo('Backup semanal automático');
```

### Antes de Cada Bimestre
```sql
SELECT * FROM criar_snapshot_completo('Início do 2º bimestre 2026');
```

### Limpeza (Apenas se Necessário)
**NUNCA delete dados das tabelas de backup sem consultar a equipe.**

Se necessário limpar dados muito antigos (mais de 2 anos):
```sql
-- CUIDADO! Verifique antes de executar
DELETE FROM historico_notas WHERE criado_em < NOW() - INTERVAL '2 years';
DELETE FROM backup_respostas WHERE criado_em < NOW() - INTERVAL '2 years';
```

---

## Contato para Emergências

Em caso de perda de dados ou necessidade de recuperação urgente:
1. NÃO execute mais alterações no banco
2. Documente o que aconteceu
3. Consulte este documento para os procedimentos de recuperação

---

## Checklist Pré-Aulas (20 de Janeiro)

- [ ] Executar `criar_snapshot_completo('Backup pré-início das aulas 2026')`
- [ ] Verificar se triggers estão ativos: `SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trigger_backup%';`
- [ ] Testar restauração com um usuário de teste
- [ ] Confirmar que tabelas de backup existem e estão vazias ou com dados de teste

---

*Documento criado em: Janeiro 2026*
*Sistema: seu10.com*
