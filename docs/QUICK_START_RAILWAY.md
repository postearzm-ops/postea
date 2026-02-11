# 🚀 Guía Rápida: Desplegar en Railway en 10 Minutos

## ✅ Checklist Pre-Despliegue

- [ ] Cuenta en Railway.app (gratis)
- [ ] Cuenta en GitHub
- [ ] Repositorio creado en GitHub
- [ ] API Keys obtenidas (todo gratis):
  - [ ] Groq API Key
  - [ ] NewsAPI Key
  - [ ] GNews API Key
  - [ ] LinkedIn Developer App

## 📝 Paso 1: Obtener API Keys (5 minutos)

### 1.1 Groq (LLM - Reemplazo de Ollama)
```
1. Ve a: https://console.groq.com
2. Haz clic en "Sign Up" (gratis)
3. Verifica tu email
4. Ve a "API Keys" en el menú lateral
5. Haz clic en "Create API Key"
6. Copia la key: gsk_...
```
✅ **Tier gratuito**: 30 req/min, 14,400 req/día - GRATIS PERMANENTEMENTE

### 1.2 NewsAPI
```
1. Ve a: https://newsapi.org/register
2. Llena el formulario (gratis)
3. Verifica tu email
4. Copia tu API Key
```
✅ **Tier gratuito**: 100 requests/día

### 1.3 GNews
```
1. Ve a: https://gnews.io/register
2. Regístrate gratis
3. Copia tu API Token
```
✅ **Tier gratuito**: 100 requests/día

### 1.4 LinkedIn Developer
```
1. Ve a: https://www.linkedin.com/developers/apps
2. Haz clic en "Create App"
3. Completa el formulario
4. En "Auth", copia:
   - Client ID
   - Client Secret
5. Agrega Redirect URL (temporal): http://localhost:3000/auth/linkedin/callback
6. En "Products", habilita "Sign In with LinkedIn"
```
⚠️ Actualizaremos la Redirect URL después del deploy

## 🔧 Paso 2: Preparar el Proyecto (2 minutos)

```bash
# Ejecutar script de inicialización
chmod +x railway-init.sh
./railway-init.sh

# Editar .env con tus API Keys
nano .env
# Pega tus keys:
# - GROQ_API_KEY=gsk_...
# - NEWSAPI_KEY=...
# - GNEWS_KEY=...
# - LINKEDIN_CLIENT_ID=...
# - LINKEDIN_CLIENT_SECRET=...

# Subir a GitHub
git init
git add .
git commit -m "Initial commit for Railway"
git branch -M main
git remote add origin https://github.com/tu-usuario/linkedin-automation.git
git push -u origin main
```

## 🚂 Paso 3: Desplegar en Railway (3 minutos)

### 3.1 Crear Proyecto
```
1. Ve a: https://railway.app
2. Haz clic en "Start a New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza Railway en GitHub
5. Selecciona tu repositorio
```

### 3.2 Agregar Base de Datos
```
1. En tu proyecto, haz clic en "+ New"
2. Selecciona "Database" → "Add PostgreSQL"
3. Haz clic en "+ New" otra vez
4. Selecciona "Database" → "Add Redis"
```
✅ Railway configura DATABASE_URL y REDIS_URL automáticamente

### 3.3 Configurar Variables de Entorno
```
1. Haz clic en tu servicio "backend"
2. Ve a la pestaña "Variables"
3. Haz clic en "RAW Editor"
4. Copia TODAS las variables de .env.railway
5. Reemplaza los valores placeholder con tus API Keys reales:

NODE_ENV=production
LLM_PROVIDER=groq
GROQ_API_KEY=tu_groq_key_aqui
NEWSAPI_KEY=tu_newsapi_key_aqui
GNEWS_KEY=tu_gnews_key_aqui
LINKEDIN_CLIENT_ID=tu_linkedin_client_id
LINKEDIN_CLIENT_SECRET=tu_linkedin_client_secret
JWT_SECRET=genera_random_32_chars
LLM_MODEL=llama-3.1-70b-versatile
ENABLE_AUTO_PUBLISH=true

6. Haz clic en "Save"
```

### 3.4 Deploy Inicial
```
Railway desplegará automáticamente.
Espera 2-3 minutos...
```

## 🔗 Paso 4: Configuración Post-Deploy (2 minutos)

### 4.1 Obtener URLs de Railway
```
1. En tu servicio backend, ve a "Settings"
2. Copia el dominio: algo-como-production-xxxx.up.railway.app
3. Haz lo mismo con el frontend
```

### 4.2 Actualizar Variables de Entorno
```
1. En "Variables" del backend, actualiza:

FRONTEND_URL=https://tu-frontend-url.up.railway.app
LINKEDIN_REDIRECT_URI=https://tu-backend-url.up.railway.app/auth/linkedin/callback
CORS_ORIGIN=https://tu-frontend-url.up.railway.app

2. Haz clic en "Save"
3. Railway redesplegará automáticamente
```

### 4.3 Actualizar LinkedIn App
```
1. Ve a tu LinkedIn App: https://www.linkedin.com/developers/apps
2. Ve a "Auth" → "OAuth 2.0 settings"
3. En "Redirect URLs", REEMPLAZA la URL temporal con:
   https://tu-backend-url.up.railway.app/auth/linkedin/callback
4. Guarda los cambios
```

## ✨ Paso 5: Verificar Funcionamiento

### 5.1 Health Check
```bash
# Abre en tu navegador:
https://tu-backend-url.up.railway.app/health

# Deberías ver:
{
  "status": "ok",
  "timestamp": "2026-02-10T...",
  "uptime": 123.45
}
```

### 5.2 Acceder a la App
```
1. Abre: https://tu-frontend-url.up.railway.app
2. Deberías ver el dashboard
3. Haz clic en "Conectar LinkedIn"
4. Autoriza la app
5. ¡Listo! Ya puedes crear tópicos
```

## 📊 Monitoreo

### Ver Logs en Tiempo Real
```
1. En Railway, haz clic en tu servicio
2. Ve a la pestaña "Deployments"
3. Haz clic en el último deployment
4. Verás logs en tiempo real
```

### Verificar Métricas
```
1. En la pestaña "Metrics"
2. Puedes ver:
   - Uso de CPU
   - Uso de memoria
   - Requests
   - Response times
```

## 🎯 Uso Básico

### Crear un Tópico
```
1. En el dashboard, haz clic en "+ Nuevo"
2. Nombre: "Inteligencia Artificial"
3. Keywords: AI, machine learning, deep learning
4. Haz clic en "Crear"
```

### El Sistema Automáticamente:
```
✅ Busca noticias cada 4 horas
✅ Analiza relevancia con IA (Groq)
✅ Genera posts optimizados
✅ Publica a las 9 AM y 2 PM
```

## 💰 Costos

**Todo GRATIS:**
- Railway: $5 crédito/mes (uso ~$3/mes = $2 sobrantes)
- Groq: GRATIS (14,400 requests/día)
- NewsAPI: GRATIS (100 requests/día)
- GNews: GRATIS (100 requests/día)
- LinkedIn API: GRATIS
- PostgreSQL: GRATIS (Railway)
- Redis: GRATIS (Railway)

**Total: $0/mes** 🎉

## 🐛 Troubleshooting Común

### Error: "Application failed to respond"
```bash
# Verifica logs en Railway
# Probablemente falta una variable de entorno
```

### Error: "Database connection failed"
```bash
# En Variables, verifica que DATABASE_URL esté configurada
# Railway la configura automáticamente al agregar PostgreSQL
```

### Error: LinkedIn OAuth no funciona
```bash
# Verifica que LINKEDIN_REDIRECT_URI coincida EXACTAMENTE
# con la configurada en tu LinkedIn App
```

### Posts no se publican
```bash
# Verifica en logs:
1. ¿Se están buscando noticias? (cada 4h)
2. ¿Hay noticias en la BD?
3. ¿Los cron jobs están corriendo?
4. ¿El token de LinkedIn está vigente?
```

## 📚 Recursos

- [Documentación Railway](https://docs.railway.app)
- [Groq API Docs](https://console.groq.com/docs)
- [LinkedIn API](https://docs.microsoft.com/en-us/linkedin/)
- [Soporte](https://discord.gg/railway)

## 🎊 ¡Felicidades!

Tu sistema de automatización de LinkedIn está desplegado y corriendo en la nube de forma completamente gratuita.

**Próximos pasos:**
- Invita usuarios de prueba
- Monitorea el engagement
- Ajusta los horarios de publicación
- Experimenta con diferentes tópicos

---

**¿Necesitas ayuda?** Revisa RAILWAY_DEPLOYMENT.md para documentación detallada.
