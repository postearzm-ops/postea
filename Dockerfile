FROM node:20

WORKDIR /app

# Package files + prisma
COPY package.json package-lock.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma/
COPY packages/frontend/package*.json ./packages/frontend/

# npm ci
RUN npm ci --ignore-scripts

# Prisma ✅ YA FUNCIONA
RUN cd packages/backend && NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma@6.15.0 generate --schema=prisma/schema.prisma

# Copia TODO
COPY . .

# ✅ SOLO backend build
RUN cd packages/backend && npm run build

# Backend producción
WORKDIR /app/packages/backend
EXPOSE 3000
CMD ["npm", "start"]

