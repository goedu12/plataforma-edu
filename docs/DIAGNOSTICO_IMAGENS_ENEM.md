# Diagnóstico e Correção de Imagens - ENEM

Este documento descreve os problemas identificados com imagens nas questões ENEM e as soluções implementadas.

## Problemas Identificados

### 1. URLs Inválidas no Banco de Dados
- Valores `nan`, `None`, `null`, `undefined` armazenados como strings
- URLs vazias ou com espaços
- URLs localhost ou file://
- Objetos JavaScript serializados incorretamente (`[object Object]`)
- Tags HTML em vez de URLs

### 2. Configuração Next.js Incompleta
- Domínio `api.enem.dev` não estava corretamente configurado em `remotePatterns`
- Faltavam CDNs comuns (Cloudinary, S3, Google)

### 3. Falta de Tratamento de Erros
- O componente `Image` falhava silenciosamente com URLs inválidas
- Não havia validação de URL antes da renderização

## Soluções Implementadas

### 1. Scripts de Diagnóstico

#### Script TypeScript (`scripts/diagnostico-imagens-supabase.ts`)
```bash
# Diagnóstico básico
npx tsx scripts/diagnostico-imagens-supabase.ts

# Com teste de URLs HTTP
npx tsx scripts/diagnostico-imagens-supabase.ts --test-urls

# Corrigir problemas de formato
npx tsx scripts/diagnostico-imagens-supabase.ts --fix

# Limpar URLs quebradas
npx tsx scripts/diagnostico-imagens-supabase.ts --clean-broken

# Testar API ENEM
npx tsx scripts/diagnostico-imagens-supabase.ts --api-diag
```

#### Scripts SQL
- `sql/19_diagnostico_correcao_imagens.sql` - Diagnóstico completo
- `sql/20_correcao_imagens_enem.sql` - Correção automática

### 2. API de Diagnóstico

**Endpoint:** `GET /api/admin/diagnostico-imagens`

```typescript
// Diagnóstico básico
GET /api/admin/diagnostico-imagens

// Com teste HTTP de URLs
GET /api/admin/diagnostico-imagens?testar_http=true&limite=100

// Testar URL específica
POST /api/admin/diagnostico-imagens
{ "url": "https://api.enem.dev/..." }

// Limpar URLs inválidas
DELETE /api/admin/diagnostico-imagens
{ "modo": "formato_invalido" }
```

### 3. Configuração Next.js Corrigida

`next.config.js`:
```javascript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/**' },
    { protocol: 'https', hostname: 'api.enem.dev', pathname: '/**' },
    { protocol: 'https', hostname: 'enem.dev', pathname: '/**' },
    { protocol: 'https', hostname: '*.cloudinary.com' },
    { protocol: 'https', hostname: '*.amazonaws.com' },
    { protocol: 'https', hostname: '*.googleusercontent.com' },
    { protocol: 'https', hostname: 'i.imgur.com' },
  ],
}
```

### 4. Componente SafeImage

Novo componente `src/components/ui/SafeImage.tsx`:

- Valida URLs antes de renderizar
- Trata erros de carregamento graciosamente
- Mostra placeholder opcional para imagens faltando
- Suporta Data URIs (base64)

```tsx
import SafeImage, { isValidImageUrl } from './ui/SafeImage'

// Uso básico
<SafeImage
  src={questao.imagem_principal}
  alt="Imagem da questão"
  width={600}
  height={400}
  showPlaceholder
/>

// Validação manual
if (isValidImageUrl(url)) {
  // URL é válida
}
```

### 5. Componente QuestaoENEM Atualizado

- Usa `SafeImage` em vez de `Image` diretamente
- Valida URLs com `isValidImageUrl()` antes de renderizar
- Mostra fallback amigável para imagens indisponíveis

## Como Executar o Diagnóstico

### 1. Via Terminal (Recomendado)

```bash
# Configurar variáveis de ambiente
export NEXT_PUBLIC_SUPABASE_URL='https://xxx.supabase.co'
export SUPABASE_SERVICE_KEY='eyJ...'

# Executar diagnóstico
npx tsx scripts/diagnostico-imagens-supabase.ts

# Ver resultado
cat diagnostico-imagens-*.json
```

### 2. Via SQL Editor (Supabase Dashboard)

1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Cole o conteúdo de `sql/19_diagnostico_correcao_imagens.sql`
4. Execute

### 3. Via API (Para Desenvolvedores)

```bash
# Precisa estar autenticado como professor
curl -X GET "https://app.studao.com/api/admin/diagnostico-imagens"
```

## Como Corrigir Problemas

### Correção Automática

```bash
# Corrigir formato inválido (nan, None, etc)
npx tsx scripts/diagnostico-imagens-supabase.ts --fix

# Ou via SQL
# Execute sql/20_correcao_imagens_enem.sql no Supabase Dashboard
```

### O Que É Corrigido

1. **Valores `nan`/`None`/`null`/`undefined`** → Definidos como `NULL`
2. **Strings vazias** → Definidas como `NULL`
3. **URLs localhost/file://** → Definidas como `NULL`
4. **Objetos `[object Object]`** → Definidos como `NULL`
5. **Tags HTML** → Definidas como `NULL`
6. **Arrays com valores inválidos** → Filtrados

## Padrões de URL Válidos

URLs aceitas pelo sistema:

- `https://api.enem.dev/*` - API oficial ENEM
- `https://*.supabase.co/storage/*` - Supabase Storage
- `https://*.cloudinary.com/*` - Cloudinary CDN
- `https://*.amazonaws.com/*` - AWS S3
- `https://*.googleusercontent.com/*` - Google
- `https://i.imgur.com/*` - Imgur
- `data:image/*;base64,...` - Data URIs

## Manutenção

### Verificação Periódica

Recomenda-se executar o diagnóstico periodicamente:

```bash
# Agendar via cron (exemplo: todo domingo às 3h)
0 3 * * 0 cd /app && npx tsx scripts/diagnostico-imagens-supabase.ts --test-urls >> /logs/diagnostico.log 2>&1
```

### Após Importações

Sempre execute o diagnóstico após importar novas questões:

```bash
# Após importar
npx tsx scripts/diagnostico-imagens-supabase.ts --fix
```

## Arquivos Criados/Modificados

### Novos Arquivos
- `scripts/diagnostico-imagens-supabase.ts` - Script de diagnóstico principal
- `src/app/api/admin/diagnostico-imagens/route.ts` - API de diagnóstico
- `src/components/ui/SafeImage.tsx` - Componente de imagem segura
- `sql/19_diagnostico_correcao_imagens.sql` - Diagnóstico SQL
- `sql/20_correcao_imagens_enem.sql` - Correção SQL
- `docs/DIAGNOSTICO_IMAGENS_ENEM.md` - Esta documentação

### Arquivos Modificados
- `next.config.js` - Adicionados domínios de imagem
- `src/components/QuestaoENEM.tsx` - Usa SafeImage com validação

## Troubleshooting

### Imagens Ainda Não Carregam

1. Verifique se a URL está nos `remotePatterns` do `next.config.js`
2. Teste a URL diretamente no navegador
3. Use o endpoint de diagnóstico para testar: `POST /api/admin/diagnostico-imagens`

### Erro "Invalid src prop"

O Next.js rejeitou a URL. Verifique:
- O domínio está configurado em `remotePatterns`
- A URL é HTTPS (HTTP não é aceito por padrão)

### Performance Lenta

- Limite o número de URLs testadas: `--max-urls 50`
- Use cache: URLs testadas são cacheadas por 15 minutos

## Contato

Para problemas ou dúvidas, abra uma issue em: https://github.com/goedu12/plataforma-edu
