FROM node:20-alpine

WORKDIR /app

# Copia package files primero
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependencias SIN postinstall para evitar conflictos
RUN npm ci --ignore-scripts --only=production
RUN npm ci --only=dev

# Genera Prisma ANTES de build
RUN npx prisma@6.15.0 generate --schema=./prisma/schema.prisma

# Copia resto del código
COPY . .

# Build (si usas TypeScript)
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]

