#!/bin/bash
# scripts/setup.sh
# Script de configuración inicial para Postea

set -e

echo "🚀 Configurando Postea..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "Por favor instala Node.js >= 20.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION detectada${NC}"
    echo "Se requiere Node.js >= 20.0.0"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detectado${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm $(npm -v) detectado${NC}"
echo ""

# Instalar dependencias
echo "📦 Instalando dependencias..."
echo ""

echo "→ Instalando dependencias raíz..."
npm install

echo "→ Instalando dependencias del backend..."
cd packages/backend && npm install && cd ../..

echo "→ Instalando dependencias del frontend..."
cd packages/frontend && npm install && cd ../..

echo -e "${GREEN}✓ Dependencias instaladas${NC}"
echo ""

# Configurar variables de entorno
if [ ! -f .env ]; then
    echo "⚙️ Configurando variables de entorno..."
    cp .env.example .env
    
    # Generar JWT secret
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i "s/GENERA_UN_STRING_ALEATORIO_SEGURO_AQUI_MIN_32_CHARS/$JWT_SECRET/" .env
        echo -e "${GREEN}✓ JWT_SECRET generado automáticamente${NC}"
    else
        echo -e "${YELLOW}⚠ openssl no disponible. Genera manualmente JWT_SECRET${NC}"
    fi
    
    echo -e "${GREEN}✓ Archivo .env creado${NC}"
    echo -e "${YELLOW}⚠ IMPORTANTE: Configura tus API Keys en .env${NC}"
else
    echo -e "${YELLOW}⚠ .env ya existe, omitiendo...${NC}"
fi

echo ""

# Generar cliente de Prisma
echo "🗄️ Generando cliente de Prisma..."
cd packages/backend && npx prisma generate && cd ../..
echo -e "${GREEN}✓ Cliente de Prisma generado${NC}"
echo ""

# Resumen
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   ✅ Configuración completada${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Configura tus API Keys en .env:"
echo "   - GROQ_API_KEY (https://console.groq.com)"
echo "   - TELEGRAM_BOT_TOKEN (@BotFather en Telegram)"
echo "   - NEWSAPI_KEY (https://newsapi.org)"
echo "   - GNEWS_KEY (https://gnews.io)"
echo "   - LINKEDIN_CLIENT_ID y SECRET"
echo "   - TWITTER_CLIENT_ID y SECRET"
echo ""
echo "2. Para desarrollo local:"
echo "   - Inicia PostgreSQL y Redis"
echo "   - Ejecuta: npm run prisma:migrate"
echo "   - Ejecuta: npm run dev"
echo ""
echo "3. Para deployment en Railway:"
echo "   - Sigue: docs/QUICK_START_RAILWAY.md"
echo ""
echo -e "${YELLOW}📚 Documentación completa en: docs/${NC}"
echo ""
