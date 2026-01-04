# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2026-01-04

### Adicionado
- Endpoint `/api/health` seguro para health checks do Cloud Run
- Utilitário de logging seguro com mascaramento de PII (`src/lib/logger.ts`)
- Funções de timezone para America/Sao_Paulo (`src/lib/timezone.ts`)
- Validação de limites na importação de alunos (5MB, 1000 linhas)
- Checklist de regressão (`REGRESSION_CHECKLIST.md`)
- Seeds idempotentes com ON CONFLICT DO NOTHING

### Alterado
- `/api/verificar` bloqueado em produção (403)
- `/api/ping` bloqueado em produção (403)
- Revisão de questões agora pula questões inativas automaticamente
- Dockerfile otimizado para Google Cloud Run
- Datas padronizadas para fuso America/Sao_Paulo

### Segurança
- SUPABASE_SERVICE_KEY blindado com auditoria automática
- Logs não expõem mais dados sensíveis (emails, senhas, chaves)
- Credenciais de teste removidas de endpoints públicos

## [1.0.1] - 2026-01-03

### Corrigido
- Scripts `typecheck` e `validate` adicionados ao package.json
- Endpoint `/api/ping` forçado como dinâmico (sem cache)
- Build do Docker com instalação completa de dependências

### Alterado
- Next.js atualizado para 14.2.35 (patch de segurança)
- Aceita `SUPABASE_SERVICE_ROLE_KEY` como alternativa

## [1.0.0] - 2025-12-01

### Adicionado
- Sistema de questões com física e matemática
- Autenticação JWT com cookies HttpOnly
- Perfis de estudante e professor
- Sistema de conquistas
- Tutor IA com Gemini
- Importação de alunos via planilha
- Sistema de notas bimestrais 2025
- Rankings e relatórios
