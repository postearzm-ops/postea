FROM node:20-slim

# Instala dependencias necesarias para Prisma WASM
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia archivos de dependencias PRIMERO
COPY package*.json ./
COPY prisma ./prisma/

# Instala TODO con versión fija ANTES de generar
RUN npm ci
RUN npm install prisma@6.15.0 @prisma/engines@6.15.0 --save-dev --save-exact

# ❌ ELIMINA esta línea problemática:
# RUN npx prisma generate --schema=./prisma/schema.prisma

# Genera Prisma con VERSIÓN FIJA (IMPORTANTE)
RUN npx prisma@6.15.0 generate --schema=./prisma/schema.prisma

# Copia resto del código
COPY . .

# Build si tienes TypeScript
RUN npm run build || echo "No build script"

EXPOSE 3000
CMD ["npm", "start"]

