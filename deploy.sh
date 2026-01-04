#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# DEPLOY AUTOMÁTICO - PLATAFORMA EDU
# Google Cloud Run
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Configurações (altere conforme necessário)
PROJECT_ID="${GCP_PROJECT_ID:-plataforma-edu}"
SERVICE_NAME="${CLOUD_RUN_SERVICE:-plataforma-edu}"
REGION="${GCP_REGION:-southamerica-east1}"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DEPLOY - PLATAFORMA EDU${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"

# Verificar se gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Erro: gcloud CLI não está instalado${NC}"
    echo "Instale: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar se está autenticado
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}Autenticando no Google Cloud...${NC}"
    gcloud auth login
fi

# Definir projeto
echo -e "${YELLOW}Configurando projeto: ${PROJECT_ID}${NC}"
gcloud config set project ${PROJECT_ID}

# Verificar variáveis de ambiente obrigatórias
echo -e "${YELLOW}Verificando variáveis de ambiente...${NC}"

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "JWT_SECRET"
    "GEMINI_API_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}Erro: Variáveis de ambiente faltando:${NC}"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo ""
    echo "Configure as variáveis antes de executar o deploy:"
    echo "export NEXT_PUBLIC_SUPABASE_URL='https://xxx.supabase.co'"
    echo "export NEXT_PUBLIC_SUPABASE_ANON_KEY='eyJ...'"
    echo "export SUPABASE_SERVICE_ROLE_KEY='eyJ...'"
    echo "export JWT_SECRET='sua-chave-secreta'"
    echo "export GEMINI_API_KEY='sua-api-key'"
    exit 1
fi

echo -e "${GREEN}✓ Todas as variáveis configuradas${NC}"

# Build da imagem
echo -e "${YELLOW}Construindo imagem Docker...${NC}"
gcloud builds submit --tag ${IMAGE_NAME}:latest .

# Deploy para Cloud Run
echo -e "${YELLOW}Fazendo deploy para Cloud Run...${NC}"
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:latest \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --port 3000 \
    --set-env-vars "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}" \
    --set-env-vars "NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    --set-env-vars "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}" \
    --set-env-vars "JWT_SECRET=${JWT_SECRET}" \
    --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY}" \
    --set-env-vars "NODE_ENV=production"

# Obter URL do serviço
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "URL do serviço: ${GREEN}${SERVICE_URL}${NC}"
echo ""
echo "Testando endpoints:"
echo -e "  ${YELLOW}curl ${SERVICE_URL}/api/ping${NC}"
echo -e "  ${YELLOW}curl ${SERVICE_URL}/api/debug${NC}"
echo ""
