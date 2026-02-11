FROM node:20-slim

WORKDIR /app

# Copia SOLO package files del monorepo PRIMERO
COPY package.json package-lock.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/

# Instala dependencias (postinstall ejecuta prisma generate AUTOMÁTICAMENTE)
RUN npm ci

# Copia TODO el código DESPUÉS (incluye prisma/ si existe)
COPY . .

# Build completo
RUN npm run build

# Ejecuta backend en producción
WORKDIR /app/packages/backend
EXPOSE 3000
CMD ["npm", "start"]

