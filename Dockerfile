FROM node:20
WORKDIR /app

# Copia archivos de dependencias primero (para cache)
COPY package.json package-lock.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma/
COPY packages/frontend/package*.json ./packages/frontend/

RUN npm ci --ignore-scripts

# Genera Prisma client
RUN cd packages/backend && NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma@6.15.0 generate --schema=prisma/schema.prisma

# Copia código fuente y build
COPY . .
RUN cd packages/backend && npm run build

# Cambia al directorio correcto para runtime
WORKDIR /app/packages/backend

EXPOSE 8080

# CMD corregido: directo al ejecutable sin shell
CMD ["node", "dist/index.js"]

