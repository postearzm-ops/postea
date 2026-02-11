FROM node:20-alpine

WORKDIR /app

# Copia raíz primero (cache)
COPY package.json package-lock.json* ./
RUN npm ci --only=production --no-optional --no-audit

# Backend - PRIMERO copia el código, DESPUÉS instala sus dependencias, DESPUÉS prisma
COPY packages/backend ./packages/backend
WORKDIR /app/packages/backend

# 🔧 INSTALAR DEPENDENCIAS DEL BACKEND PRIMERO (incluye @prisma/client)
RUN npm ci --only=production --no-optional --no-audit

# 🔧 AHORA sí prisma generate funciona
RUN npx prisma generate --schema=./prisma/schema.prisma

# Build backend
RUN npm run build

# Frontend (si lo necesitas en la misma imagen)
WORKDIR /app/packages/frontend
COPY packages/frontend ./packages/frontend
RUN npm ci --only=production --no-optional --no-audit
RUN npm run build

# Start en backend
WORKDIR /app/packages/backend
EXPOSE $PORT

CMD ["npm", "run", "start:migrate"]

