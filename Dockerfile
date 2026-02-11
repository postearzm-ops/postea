FROM node:20-slim

WORKDIR /app

# Copia root package.json y workspaces PRIMERO (crucial para monorepo)
COPY package.json package-lock.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/
COPY prisma ./prisma/

# Instala TODO el monorepo con postinstall automático
RUN npm ci

# ✅ NO uses npx prisma generate aquí - postinstall ya lo hizo

# Copia código backend/frontend
COPY packages/backend ./packages/backend
COPY packages/frontend ./packages/frontend
COPY prisma ./prisma

# Build completo del monorepo
RUN npm run build

# Solo ejecuta backend en Railway
WORKDIR /app/packages/backend
EXPOSE 3000
CMD ["npm", "start"]

