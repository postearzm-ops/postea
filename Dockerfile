FROM node:20
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma/
COPY packages/frontend/package*.json ./packages/frontend/

RUN npm ci --ignore-scripts

# ✅ RUTA COMPLETA DEL SCHEMA
RUN cd packages/backend && NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma@6.15.0 generate --schema=prisma/schema.prisma

COPY . .
RUN cd packages/backend && npm run build

WORKDIR /app
EXPOSE 8080
CMD ["node", "packages/backend/dist/index.js"]

