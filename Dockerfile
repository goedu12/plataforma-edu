# ══════════════════════════════════════════════════════════════════════════════
# Dockerfile - Plataforma Educacional
# Otimizado para Google Cloud Run
# ══════════════════════════════════════════════════════════════════════════════

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar apenas arquivos de dependências primeiro (melhor cache)
COPY package.json package-lock.json* ./

# Instalar dependências com cache limpo
RUN npm ci --prefer-offline

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilitar telemetria do Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build da aplicação
RUN npm run build

# Stage 3: Runner (otimizado para Cloud Run)
FROM node:20-alpine AS runner
WORKDIR /app

# Variáveis de ambiente para produção
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root (segurança)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar assets públicos
COPY --from=builder /app/public ./public

# Criar diretório .next com permissões corretas
RUN mkdir .next && chown nextjs:nodejs .next

# Copiar output standalone (menor tamanho de imagem)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Usar usuário não-root
USER nextjs

# Porta padrão do Cloud Run
EXPOSE 3000

# Configurações de rede para Cloud Run
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Iniciar servidor
CMD ["node", "server.js"]
