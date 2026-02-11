FROM node:20-bullseye-slim

WORKDIR /app

# Copia raíz primero (cache)
COPY package.json package-lock.json* ./
RUN npm ci --only=production --no-optional --no-audit

# Backend
COPY packages/backend ./packages/backend
WORKDIR /app/packages/backend

# 🔧 Instalar dependencias del backend PRIMERO
RUN npm ci --only=production --no-optional --no-audit

# 🔧 Prisma generate (funciona en Debian)
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build backend
RUN npm run build

# Frontend (si lo necesitas)
WORKDIR /app/packages/frontend
COPY packages/frontend ./packages/frontend
RUN npm ci --only=production --no-optional --no-audit
RUN npm run build

# Start en backend
WORKDIR /app/packages/backend
EXPOSE $PORT

CMD ["npm", "run", "start:migrate"]

