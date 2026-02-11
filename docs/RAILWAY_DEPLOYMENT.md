# Guía de Despliegue en Railway (Cloud Gratuita) 🚂

## ¿Por qué Railway?

Railway ofrece el mejor tier gratuito para este proyecto:
- ✅ **$5 de crédito gratis al mes** (suficiente para uso moderado)
- ✅ **PostgreSQL incluido** (sin configuración adicional)
- ✅ **Redis incluido** (gratis)
- ✅ **Despliegue desde GitHub** automático
- ✅ **Variables de entorno** fáciles de configurar
- ✅ **Dominio HTTPS** gratuito
- ✅ **Logs en tiempo real**
- ✅ **No requiere tarjeta de crédito** inicialmente

**Alternativas consideradas:**
- Render: Solo 750h/mes gratis, duerme después de inactividad
- Fly.io: Más complejo de configurar
- Vercel/Netlify: No soportan servicios backend largos

## 📋 Requisitos Previos

1. Cuenta en [Railway.app](https://railway.app)
2. Cuenta en GitHub
3. API Keys gratuitas:
   - [NewsAPI](https://newsapi.org/register)
   - [GNews](https://gnews.io/register)
   - [LinkedIn Developer App](https://www.linkedin.com/developers/apps)

## 🚀 Pasos de Despliegue

### Paso 1: Preparar el Repositorio

```bash
# Clonar o crear tu repositorio
git clone https://github.com/tu-usuario/linkedin-automation.git
cd linkedin-automation

# Asegurarte de tener todos los archivos
git add .
git commit -m "Preparar para Railway"
git push origin main
```

### Paso 2: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz clic en "Start a New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway y selecciona tu repositorio
5. Railway detectará automáticamente tu aplicación

### Paso 3: Agregar Servicios

En tu proyecto de Railway:

#### A. PostgreSQL
1. Clic en "+ New Service"
2. Selecciona "Database" → "PostgreSQL"
3. Railway creará automáticamente la base de datos
4. La variable `DATABASE_URL` se agregará automáticamente

#### B. Redis
1. Clic en "+ New Service"
2. Selecciona "Database" → "Redis"
3. La variable `REDIS_URL` se agregará automáticamente

### Paso 4: Configurar Variables de Entorno

En la pestaña "Variables" de tu servicio backend, agrega:

```bash
# Node Environment
NODE_ENV=production
PORT=3000

# Frontend URL (Railway te asignará un dominio)
FRONTEND_URL=https://tu-app.up.railway.app

# JWT Configuration
JWT_SECRET=genera_un_string_aleatorio_de_32_caracteres_aqui
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=tu_linkedin_client_id
LINKEDIN_CLIENT_SECRET=tu_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://tu-app-backend.up.railway.app/auth/linkedin/callback

# News APIs
NEWSAPI_KEY=tu_newsapi_key
GNEWS_KEY=tu_gnews_key

# LLM Configuration (usar Groq en lugar de Ollama local)
LLM_PROVIDER=groq
GROQ_API_KEY=tu_groq_api_key
LLM_MODEL=llama-3.1-70b-versatile

# Scheduler Configuration
FETCH_NEWS_CRON=0 */4 * * *
ANALYZE_NEWS_CRON=0 */6 * * *
PUBLISH_POSTS_CRON=0 9,14 * * *

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Security
BCRYPT_ROUNDS=10
CORS_ORIGIN=https://tu-app.up.railway.app

# Features
ENABLE_AUTO_PUBLISH=true
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_ANALYTICS=true

# System Limits
MAX_TOPICS_PER_USER=10
MAX_POSTS_PER_DAY=5
NEWS_RETENTION_DAYS=30
```

### Paso 5: Obtener Groq API Key (Reemplazo de Ollama)

Como Railway no soporta Ollama (requiere GPU), usaremos Groq:

1. Ve a [console.groq.com](https://console.groq.com)
2. Crea una cuenta gratuita
3. Ve a "API Keys" y genera una nueva
4. **Tier gratuito de Groq:**
   - 30 requests/minuto
   - 14,400 requests/día
   - GRATIS permanentemente

### Paso 6: Actualizar Redirect URI en LinkedIn

1. Ve a tu [LinkedIn App](https://www.linkedin.com/developers/apps)
2. En "Auth" → "Redirect URLs"
3. Agrega: `https://tu-dominio-backend.up.railway.app/auth/linkedin/callback`
4. Guarda los cambios

### Paso 7: Desplegar

Railway desplegará automáticamente cuando hagas push a GitHub:

```bash
git add .
git commit -m "Configurar para Railway"
git push origin main
```

Railway comenzará el build automáticamente. Puedes ver el progreso en el dashboard.

## 📁 Archivos Necesarios para Railway

Railway detectará automáticamente el proyecto si tienes estos archivos:

### railway.json (Configuración de Railway)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start:migrate",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### nixpacks.toml (Configuración de Build)

```toml
[phases.setup]
nixPkgs = ['nodejs-20_x', 'npm-9_x']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm run start:migrate'
```

## 🔧 Scripts de package.json Actualizados

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/server.js",
    "start:migrate": "npx prisma migrate deploy && npm run start",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "test": "jest",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

## 🌐 Arquitectura en Railway

```
┌─────────────────────────────────────────────────┐
│           Railway Project                       │
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Frontend   │  │   Backend    │            │
│  │   (React)    │  │  (Node.js)   │            │
│  │              │  │              │            │
│  │ Port: 5173   │  │ Port: 3000   │            │
│  └──────┬───────┘  └──────┬───────┘            │
│         │                 │                     │
│         │                 │                     │
│         │         ┌───────┴────────┐            │
│         │         │                │            │
│         │    ┌────▼─────┐   ┌──────▼──────┐    │
│         │    │PostgreSQL│   │    Redis    │    │
│         │    │  (Free)  │   │   (Free)    │    │
│         │    └──────────┘   └─────────────┘    │
│         │                                       │
│         └──────────────────────────────────────┤
│                                                 │
│  External Services:                            │
│  • Groq API (LLM)                              │
│  • NewsAPI                                     │
│  • GNews                                       │
│  • LinkedIn API                                │
└─────────────────────────────────────────────────┘
```

## 💰 Estimación de Costos (Gratis!)

**Railway Free Tier:**
- $5 crédito/mes
- Uso estimado:
  - Backend: ~$2/mes
  - Frontend: ~$1/mes
  - PostgreSQL: $0 (incluido)
  - Redis: $0 (incluido)
  - **Total: ~$3/mes = GRATIS con crédito**

**APIs Externas:**
- Groq: GRATIS (14,400 requests/día)
- NewsAPI: GRATIS (100 requests/día)
- GNews: GRATIS (100 requests/día)
- LinkedIn API: GRATIS

**Total: $0/mes** 🎉

## 📊 Monitoreo en Railway

Railway proporciona:
- ✅ Logs en tiempo real
- ✅ Métricas de CPU y memoria
- ✅ Health checks automáticos
- ✅ Alertas de errores
- ✅ Historial de despliegues

Accede en: `https://railway.app/project/[tu-proyecto]/service/[tu-servicio]`

## 🔒 Seguridad

Railway proporciona:
- HTTPS automático
- Variables de entorno encriptadas
- Aislamiento de servicios
- Backups automáticos de base de datos

## 🚨 Troubleshooting

### Error: "Out of Memory"
```bash
# En railway.json, ajusta:
{
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

### Error: "Build Failed"
```bash
# Verifica que package.json tenga:
"engines": {
  "node": ">=20.0.0",
  "npm": ">=9.0.0"
}
```

### Error: Prisma no puede conectar a DB
```bash
# Asegúrate de que la variable DATABASE_URL esté configurada
# Railway la configura automáticamente al agregar PostgreSQL
```

### Migrations no se ejecutan
```bash
# Agrega al script start:
"start:migrate": "npx prisma migrate deploy && npm run start"
```

## 📈 Escalar

Si superas el tier gratuito:

**Opción 1: Hobby Plan ($5/mes)**
- Sin límite de crédito
- Todo ilimitado

**Opción 2: Optimizar**
```bash
# Reducir uso:
- Aumentar intervalo de cron jobs
- Implementar cache más agresivo
- Limitar número de requests a APIs
```

## 🔄 CI/CD Automático

Railway despliega automáticamente:
1. Haces push a GitHub
2. Railway detecta cambios
3. Ejecuta build
4. Ejecuta migraciones
5. Despliega nueva versión
6. Todo sin downtime

## 🎯 Próximos Pasos

1. ✅ Desplegar en Railway
2. ✅ Configurar dominio personalizado (opcional)
3. ✅ Configurar monitoring
4. ✅ Configurar backups automáticos
5. ✅ Invitar usuarios de prueba

## 📚 Recursos

- [Railway Docs](https://docs.railway.app)
- [Groq Documentation](https://console.groq.com/docs)
- [Prisma on Railway](https://railway.app/templates/prisma)

---

¿Problemas? Abre un issue o contacta en el [Discord de Railway](https://discord.gg/railway)
