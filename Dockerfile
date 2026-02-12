FROM node:20
WORKDIR /app

# Cache de dependencias
COPY package.json package-lock.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma/
COPY packages/frontend/package*.json ./packages/frontend/

RUN npm ci --ignore-scripts

# Prisma generate
WORKDIR /app/packages/backend
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma@6.15.0 generate

# Build completo
WORKDIR /app
COPY . .
RUN cd packages/backend && npm run build

# Runtime - CORREGIDO al archivo REAL
WORKDIR /app/packages/backend
EXPOSE 8080
CMD ["node", "dist/server.js"]

