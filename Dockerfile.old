# Railway ignorará Nixpacks automáticamente al ver Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copia package.json raíz primero (cache)
COPY package.json package-lock.json* ./
RUN npm ci --only=production --no-optional --no-audit

# Instala backend
COPY packages/backend ./packages/backend
WORKDIR /app/packages/backend
RUN npx prisma generate
RUN npm ci --only=production --no-optional --no-audit
RUN npm run build

# Instala frontend (solo build)
WORKDIR /app/packages/frontend
RUN npm ci --only=production --no-optional --no-audit
RUN npm run build

# Vuelve al backend para start
WORKDIR /app/packages/backend

# Puerto dinámico de Railway
EXPOSE $PORT

CMD ["npm", "run", "start:migrate"]

