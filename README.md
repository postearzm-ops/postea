# Postea - Automatización Inteligente de Redes Sociales 🚀

Sistema completo de automatización que genera y publica posts en **LinkedIn** y **Twitter/X** basados en noticias relevantes, con **aprobación por Telegram** y usando IA. 100% gratuito y open source.

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Railway-purple.svg)

## ✨ Nuevas Características v2.0

### 🎯 Multi-Plataforma
- ✅ **LinkedIn** - Posts profesionales optimizados
- ✅ **Twitter/X** - Tweets concisos y atractivos (280 caracteres)
- ✅ Adaptación automática del contenido a cada plataforma
- ✅ Publicación simultánea o selectiva

### 📱 Aprobación por Telegram
- ✅ **Bot de Telegram** integrado
- ✅ Revisión de posts antes de publicar
- ✅ Aprobación con un solo clic (✅ o ❌)
- ✅ Notificaciones en tiempo real
- ✅ Control total desde el móvil

### 🤖 Flujo Inteligente
```
Noticia → IA genera post → Telegram aprueba → Publica automáticamente
```

## 🎬 Demo del Flujo Completo

### 1. Sistema encuentra noticia relevante
```
📰 "La IA revoluciona la industria tecnológica..."
```

### 2. IA genera contenido optimizado
```
💼 LinkedIn (profesional):
"La inteligencia artificial está transformando 
radicalmente la forma en que trabajamos. Los 
últimos avances en machine learning..."

#AI #Innovation #Technology #FutureOfWork

🐦 Twitter (conciso):
"La IA está revolucionando la tech con avances 
sin precedentes en ML y NLP 🚀

#AI #MachineLearning"
```

### 3. Recibes en Telegram
```
💼 Nuevo Post para LinkedIn

📰 Noticia: La IA revoluciona...

📝 Contenido: [post generado]

¿Aprobar publicación?

[✅ Aprobar] [❌ Rechazar]
```

### 4. Apruebas con un clic

### 5. Se publica automáticamente

### 6. Recibes confirmación
```
✅ Post Publicado

Tu post ha sido publicado en LinkedIn.
🔗 Ver post
```

## 🛠 Stack Tecnológico

### Backend
- **Node.js** 20+ con TypeScript
- **Express** - API REST
- **Prisma** - ORM
- **Bull** + **Redis** - Colas de trabajo
- **Node-cron** - Tareas programadas

### Frontend
- **React** 18+ con TypeScript
- **Vite** - Build tool
- **TailwindCSS** - Estilos
- **React Query** - Estado

### Integraciones
- **Groq API** - LLM (Llama 3.1) - GRATIS
- **LinkedIn API** - OAuth 2.0
- **Twitter API v2** - OAuth 2.0 PKCE
- **Telegram Bot API** - Webhooks
- **NewsAPI + GNews** - Noticias - GRATIS

### Infraestructura
- **Railway** - Hosting - GRATIS ($5 crédito/mes)
- **PostgreSQL** - Base de datos
- **Redis** - Cache y colas

## 🚀 Inicio Rápido (10 minutos)

### 1. Obtener API Keys (5 min)

```bash
# Groq (LLM) - GRATIS
https://console.groq.com
→ Sign up → API Keys → Create

# NewsAPI - GRATIS
https://newsapi.org/register
→ Get API Key

# GNews - GRATIS
https://gnews.io/register
→ Get API Token

# Telegram Bot - GRATIS
Telegram → @BotFather → /newbot
→ Copiar token

# LinkedIn Developer
https://www.linkedin.com/developers/apps
→ Create App → Get Client ID & Secret

# Twitter Developer
https://developer.twitter.com/en/portal/dashboard
→ Create App → OAuth 2.0 → Get Client ID & Secret
```

### 2. Deploy en Railway (3 min)

```bash
# 1. Fork/clone repo
git clone https://github.com/tu-usuario/postea.git

# 2. Conectar con Railway
railway login
railway init
railway link

# 3. Agregar servicios
railway add # PostgreSQL
railway add # Redis

# 4. Configurar variables
railway variables set GROQ_API_KEY=tu_key
railway variables set TELEGRAM_BOT_TOKEN=tu_token
# ... (ver .env.railway.updated para lista completa)

# 5. Deploy
git push
```

### 3. Configurar Telegram (2 min)

```
1. Busca tu bot en Telegram
2. Envía: /start
3. Copia tu Chat ID
4. En la app: Configuración → Pega Chat ID → Guardar
```

¡Listo! Sistema funcionando 24/7.

## 📋 Guías Detalladas

- 📘 **[RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)** - Despliegue completo
- 🤖 **[TELEGRAM_SETUP.md](TELEGRAM_SETUP.md)** - Configurar bot de Telegram
- 🐦 **[TWITTER_SETUP.md](TWITTER_SETUP.md)** - Configurar Twitter/X
- ⚡ **[QUICK_START_RAILWAY.md](QUICK_START_RAILWAY.md)** - Inicio rápido

## 🎯 Características Principales

### 🤖 Generación Inteligente de Contenido
- IA analiza noticias y genera posts optimizados
- Adaptación automática LinkedIn vs Twitter:
  - LinkedIn: ~300 palabras, tono profesional, 3-5 hashtags
  - Twitter: 280 caracteres, conciso, 1-2 hashtags
- Múltiples variaciones para A/B testing
- Cálculo de relevancia y sentimiento

### 📱 Control Total por Telegram
- **Aprobación manual**: Revisa antes de publicar
- **Aprobación automática**: Publica sin revisar (opcional)
- **Botones interactivos**: Aprobar/Rechazar con un clic
- **Respuestas rápidas**: Escribe "SI" o "NO"
- **Notificaciones**: Éxito, errores, métricas
- **Comandos útiles**:
  - `/start` - Iniciar y obtener Chat ID
  - `/status` - Ver posts pendientes
  - `/help` - Ayuda

### 📊 Analytics Completo
- Métricas por plataforma:
  - LinkedIn: Impresiones, reacciones, comentarios, shares
  - Twitter: Impresiones, likes, retweets, replies
- Tasa de aprobación/rechazo
- Tiempo promedio de aprobación
- Engagement rate
- Dashboard visual

### ⚙️ Automatización Configurable

**Cron Jobs:**
```
Cada 4h → Buscar noticias
Cada 6h → Analizar y generar posts
Cada 1h → Publicar posts aprobados
```

**Por Tópico:**
- Palabras clave personalizables
- Plataformas de destino (LinkedIn, Twitter, ambas)
- Horarios preferidos de publicación
- Frecuencia de posts

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                      │
│     Dashboard | Topics | Posts | Analytics | Config     │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Express + TypeScript)             │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │   Auth   │  │  Topics  │  │  Posts   │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                         │
│  ┌──────────────────────────────────────────┐          │
│  │        Post Orchestrator Service          │          │
│  │  (Coordina todo el flujo de publicación) │          │
│  └──────────────────────────────────────────┘          │
│                                                         │
│  ┌──────┐  ┌──────┐  ┌─────┐  ┌─────────┐            │
│  │ News │  │ LLM  │  │ LI  │  │Telegram │            │
│  │Fetch │  │(Groq)│  │&    │  │  Bot    │            │
│  │      │  │      │  │ TW  │  │         │            │
│  └───┬──┘  └───┬──┘  └──┬──┘  └────┬────┘            │
│      │         │        │          │                  │
└──────┼─────────┼────────┼──────────┼──────────────────┘
       │         │        │          │
       ▼         ▼        ▼          ▼
   ┌──────┐  ┌──────┐  ┌────┐  ┌─────────┐
   │ News │  │ Groq │  │ LI │  │Telegram │
   │ APIs │  │ API  │  │API │  │   API   │
   └──────┘  └──────┘  │ TW │  └─────────┘
                       │API │
                       └────┘
       │                              │
       ▼                              ▼
   PostgreSQL                      Redis
   (Datos)                      (Cache/Queues)
```

## 💰 Costos (100% GRATIS)

| Servicio | Plan Gratuito | Costo |
|----------|---------------|-------|
| **Railway** | $5 crédito/mes | $0 |
| **Groq API** | 14,400 req/día | $0 |
| **NewsAPI** | 100 req/día | $0 |
| **GNews** | 100 req/día | $0 |
| **Telegram Bot** | Ilimitado | $0 |
| **LinkedIn API** | Ilimitado | $0 |
| **Twitter API** | Free tier | $0 |
| **PostgreSQL** | Railway incluye | $0 |
| **Redis** | Railway incluye | $0 |
| **TOTAL** | | **$0/mes** |

## 📖 Uso

### Crear un Tópico

```typescript
POST /api/topics
{
  "name": "Inteligencia Artificial",
  "keywords": ["AI", "machine learning", "deep learning"],
  "platforms": ["LINKEDIN", "TWITTER"], // Una o ambas
  "language": "es",
  "postFrequency": 2 // Posts por día
}
```

### Flujo Automático

```
1. Sistema busca noticias cada 4 horas
2. Analiza relevancia (score 0-100)
3. Genera posts para plataformas seleccionadas
4. Envía a Telegram para aprobación
5. Espera respuesta (✅ o ❌)
6. Si apruebas → Publica automáticamente
7. Notifica resultado
```

### Flujo Manual

```typescript
// Generar post manualmente
POST /api/posts/generate
{
  "newsItemId": "uuid-noticia",
  "platforms": ["LINKEDIN", "TWITTER"],
  "requireApproval": true
}

// Aprobar/rechazar programáticamente
PATCH /api/posts/:id/approve
PATCH /api/posts/:id/reject
```

## 🔐 Seguridad

- ✅ OAuth 2.0 con LinkedIn y Twitter
- ✅ JWT tokens con expiración
- ✅ Passwords hasheados (bcrypt)
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Helmet.js headers
- ✅ Variables de entorno encriptadas (Railway)
- ✅ HTTPS automático
- ✅ Telegram webhook seguro

## 🐛 Troubleshooting

### Bot de Telegram no responde

```bash
# Verificar token
curl "https://api.telegram.org/bot<TOKEN>/getMe"

# Verificar webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Reconfigurar webhook
POST /api/telegram/setup-webhook
{
  "webhookUrl": "https://tu-app.railway.app/api/telegram/webhook"
}
```

### Twitter no publica

```bash
# Verificar credenciales
GET /api/twitter/health

# Ver logs
railway logs | grep twitter

# Reconectar cuenta
Dashboard → Configuración → Reconectar Twitter
```

### Posts no se generan

```bash
# Verificar Groq
GET /health/detailed

# Ver logs de LLM
railway logs | grep -i groq

# Test manual
POST /api/posts/generate
{
  "newsItemId": "test-id",
  "platforms": ["TWITTER"]
}
```

## 📊 Estructura del Proyecto

```
postea/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── services/
│   │   │   │   ├── llm.service.ts           # Groq/Ollama
│   │   │   │   ├── linkedin.service.ts      # LinkedIn API
│   │   │   │   ├── twitter.service.ts       # Twitter API
│   │   │   │   ├── telegram.service.ts      # Telegram Bot
│   │   │   │   ├── news-fetcher.service.ts  # Noticias
│   │   │   │   └── post-orchestrator.service.ts  # Orquestador
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── posts.routes.ts
│   │   │   │   ├── telegram.routes.ts
│   │   │   │   └── twitter.routes.ts
│   │   │   ├── jobs/
│   │   │   │   └── scheduler.ts             # Cron jobs
│   │   │   └── prisma/
│   │   │       └── schema.prisma            # DB schema
│   │   └── package.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── Dashboard.tsx
│       │   │   ├── TopicManager.tsx
│       │   │   ├── PostEditor.tsx
│       │   │   └── Analytics.tsx
│       │   └── App.tsx
│       └── package.json
│
├── railway.json                   # Railway config
├── nixpacks.toml                  # Build config
├── .env.railway.updated           # Variables
├── RAILWAY_DEPLOYMENT.md          # Guía Railway
├── TELEGRAM_SETUP.md              # Guía Telegram
├── TWITTER_SETUP.md               # Guía Twitter
└── README.md                      # Este archivo
```

## 🎯 Roadmap

### v2.1 (Próximamente)
- [ ] Edición de posts desde Telegram
- [ ] Programación flexible desde Telegram
- [ ] Generación de imágenes con IA
- [ ] Hilos de Twitter automáticos
- [ ] Analytics predictivo

### v2.2
- [ ] Instagram integration
- [ ] Facebook Pages
- [ ] Multi-cuenta
- [ ] Templates personalizados
- [ ] A/B testing automático

### v3.0
- [ ] Machine Learning para optimizar horarios
- [ ] Análisis de competencia
- [ ] Sugerencias automáticas de tópicos
- [ ] Integración con CRM
- [ ] White-label

## 🤝 Contribuir

Las contribuciones son bienvenidas!

```bash
# Fork el proyecto
git clone https://github.com/tu-usuario/postea.git

# Crear rama
git checkout -b feature/nueva-funcionalidad

# Commit
git commit -m 'Add: nueva funcionalidad'

# Push
git push origin feature/nueva-funcionalidad

# Abrir Pull Request
```

## 📝 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.

## 👥 Autores

- Tu Nombre - [@tu-usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- [Groq](https://groq.com/) - LLM ultra-rápido
- [Railway](https://railway.app/) - Hosting gratuito
- [Telegram](https://telegram.org/) - Bot API
- [NewsAPI](https://newsapi.org/) - Noticias
- LinkedIn & Twitter/X - APIs

## 🆘 Soporte

### Documentación
- [Deployment Guide](RAILWAY_DEPLOYMENT.md)
- [Telegram Setup](TELEGRAM_SETUP.md)
- [Twitter Setup](TWITTER_SETUP.md)
- [Quick Start](QUICK_START_RAILWAY.md)

### Comunidad
- [Issues](https://github.com/tu-usuario/repo/issues)
- [Discussions](https://github.com/tu-usuario/repo/discussions)
- [Discord](#) (próximamente)

### Contacto
- Email: tu-email@example.com
- Twitter: [@tu-usuario](https://twitter.com/tu-usuario)

---

⭐ Si te gusta el proyecto, ¡dale una estrella en GitHub!

**Hecho con ❤️ y ☕**
