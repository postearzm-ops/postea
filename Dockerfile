FROM node:20-slim

WORKDIR /app

# ✅ SOLO package files PRIMERO
COPY package.json package-lock.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/

# ✅ npm ci ejecuta postinstall → prisma@6.15.0 generate
RUN npm ci

# ✅ UNA SOLA VEZ: copia TODO (incluye packages/backend/prisma/)
COPY . .

# Build
RUN npm run build

# Backend en producción
WORKDIR /app/packages/backend
EXPOSE 3000
CMD ["npm", "start"]

