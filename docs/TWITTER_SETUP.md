# 🐦 Guía de Configuración de Twitter/X

## 📋 Requisitos Previos

- Cuenta de Twitter/X
- Acceso al [Developer Portal](https://developer.twitter.com/en/portal/dashboard)
- Aplicación desplegada en Railway (necesitarás la URL)

## 🔧 Paso 1: Crear App en Twitter Developer Portal

### 1.1 Acceder al Portal

```
1. Ve a: https://developer.twitter.com/en/portal/dashboard
2. Inicia sesión con tu cuenta de Twitter
3. Haz clic en "Create App" o "Create Project"
```

### 1.2 Completar Información Básica

```
App name: LinkedIn/Twitter Automation
App description: Automated post management system
Website URL: https://tu-app.up.railway.app
```

### 1.3 Configurar OAuth 2.0

```
1. En tu app, ve a "User authentication settings"
2. Haz clic en "Set up"
3. Selecciona:
   ☑️ OAuth 2.0
   ☐ OAuth 1.0a (no necesario)

4. Type of App: Web App

5. App permissions:
   ☑️ Read and write
   
6. Callback URI / Redirect URL:
   https://tu-app-backend.up.railway.app/auth/twitter/callback
   
7. Website URL:
   https://tu-app.up.railway.app
```

### 1.4 Obtener Credenciales

Después de configurar, verás:

```
Client ID: ejemplo_abc123...
Client Secret: ejemplo_xyz789... (¡guárdalo! solo se muestra una vez)
```

⚠️ **IMPORTANTE**: Guarda el Client Secret inmediatamente. No se mostrará de nuevo.

## 🔐 Paso 2: Configurar Variables de Entorno

### 2.1 En Railway

```bash
# OAuth 2.0 Credentials
TWITTER_CLIENT_ID=tu_client_id_aqui
TWITTER_CLIENT_SECRET=tu_client_secret_aqui
TWITTER_REDIRECT_URI=https://tu-app-backend.up.railway.app/auth/twitter/callback
```

### 2.2 En .env (desarrollo local)

```bash
TWITTER_CLIENT_ID=tu_client_id_aqui
TWITTER_CLIENT_SECRET=tu_client_secret_aqui
TWITTER_REDIRECT_URI=http://localhost:3000/auth/twitter/callback
```

## 🔗 Paso 3: Conectar Twitter en la App

### 3.1 Desde el Dashboard

```
1. Inicia sesión en tu cuenta
2. Ve a Configuración → Cuentas Conectadas
3. Haz clic en "Conectar Twitter"
4. Autoriza la aplicación en Twitter
5. Serás redirigido de vuelta
```

### 3.2 Flujo de Autenticación

```
Usuario → Botón "Conectar Twitter"
  ↓
Backend genera URL de autorización
  ↓
Usuario es redirigido a Twitter
  ↓
Usuario autoriza la app
  ↓
Twitter redirige a callback con código
  ↓
Backend intercambia código por tokens
  ↓
Tokens guardados en BD
  ↓
✅ Twitter conectado
```

## 📝 Paso 4: Configurar Tópicos para Twitter

### 4.1 Al Crear un Tópico

```
Nombre: Tecnología
Keywords: AI, machine learning, tech
Plataformas: 
  ☑️ LinkedIn
  ☑️ Twitter  ← Seleccionar ambas
```

### 4.2 Diferencias LinkedIn vs Twitter

| Característica | LinkedIn | Twitter |
|----------------|----------|---------|
| Límite caracteres | ~3000 | 280 (4000 con Premium) |
| Hashtags | 3-5 separados | 1-2 inline |
| Tono | Profesional | Más casual |
| Links | Permitidos | Acortar recomendado |

El sistema adapta automáticamente el contenido para cada plataforma.

## 🎯 Paso 5: Publicar en Twitter

### 5.1 Flujo Automático

```
1. Sistema genera post adaptado para Twitter
2. Post enviado a Telegram para aprobación
3. Mensaje muestra: 🐦 "Nuevo Post para Twitter/X"
4. Apruebas con ✅
5. Post publicado en Twitter
6. Recibes confirmación con link al tweet
```

### 5.2 Adaptación Automática

El sistema automáticamente:
- ✅ Trunca a 280 caracteres si es necesario
- ✅ Usa hashtags inline (en el texto)
- ✅ Optimiza para engagement en Twitter
- ✅ Mantiene el mensaje claro y conciso

**Ejemplo:**

```
Original (LinkedIn):
"La inteligencia artificial está revolucionando 
la industria tecnológica con avances sin 
precedentes en machine learning y procesamiento 
de lenguaje natural.

#AI #MachineLearning #Technology #Innovation #Future"

Adaptado (Twitter):
"La IA está revolucionando la tech con avances 
sin precedentes en ML y NLP 🚀

#AI #MachineLearning #TechNews"
(276 caracteres)
```

## 🔄 Paso 6: Renovación de Tokens

Los tokens de Twitter expiran. El sistema los renueva automáticamente:

```typescript
// Automático en el servicio
if (tokenExpired) {
  newTokens = await refreshAccessToken(refreshToken);
  // Guardados automáticamente en BD
}
```

Si falla la renovación:
1. Recibes notificación en Telegram
2. Debes reconectar Twitter manualmente
3. Ve a Configuración → Reconectar Twitter

## 📊 Paso 7: Métricas de Twitter

El sistema recopila automáticamente:
- 👁️ Impresiones
- ❤️ Likes (reacciones)
- 🔄 Retweets
- 💬 Respuestas (replies)

Ver en Dashboard → Analytics → Twitter

## 🚨 Troubleshooting

### Problema: "Error de autorización"

**Causas:**
- Redirect URI no coincide
- App no aprobada en Twitter
- Permisos incorrectos

**Solución:**
```
1. Verifica Redirect URI en:
   - Twitter Developer Portal
   - Variables de entorno (TWITTER_REDIRECT_URI)
   
2. Asegúrate que sean IDÉNTICAS
   Correcto: https://app.railway.app/auth/twitter/callback
   Incorrecto: http://app.railway.app/auth/twitter/callback
                (http vs https)
```

### Problema: "Tweet excede límite de caracteres"

**Solución:**
El sistema trunca automáticamente, pero si quieres más control:

```typescript
// En tu configuración
MAX_TWEET_LENGTH=280  // Estándar
// o
MAX_TWEET_LENGTH=4000 // Si tienes Twitter Blue/Premium
```

### Problema: "Token expirado"

**Solución:**
```
1. Ve a Configuración → Cuentas
2. Haz clic en "Reconectar Twitter"
3. Autoriza de nuevo
```

### Problema: "No puedo publicar"

**Verificar:**
```
1. Permisos de la app:
   - Developer Portal → App → Permissions
   - Debe ser "Read and Write"
   
2. Cuenta suspendida:
   - Verifica que tu cuenta de Twitter esté activa
   
3. Rate limits:
   - Twitter tiene límites de publicación
   - Espera unos minutos e intenta de nuevo
```

## 📱 Límites de Twitter

### Rate Limits (Free Tier)

```
Posts: 50 tweets/día (2000 con Premium)
Read: 500 tweets/día (10,000 con Premium)
```

El sistema respeta estos límites automáticamente.

### Mejores Prácticas

```
✅ Publica en horarios de pico (8-10 AM, 5-7 PM)
✅ Usa 1-2 hashtags máximo
✅ Incluye emojis estratégicamente 🚀
✅ Mantén tweets concisos y directos
✅ Usa hilos para contenido largo
❌ No hagas spam
❌ No uses muchos hashtags
❌ No publiques contenido duplicado
```

## 🎨 Personalización

### Formato de Tweets

Edita `twitter.service.ts`:

```typescript
formatContentForTwitter(content: string, hashtags: string[]): string {
  // Personaliza aquí
  // Ejemplo: agregar emoji al inicio
  let tweet = `🚀 ${content}`;
  
  // Agregar hashtags
  const tags = hashtags.slice(0, 2).join(' ');
  tweet += `\n\n${tags}`;
  
  return tweet;
}
```

### Templates por Categoría

```typescript
const templates = {
  tech: "💻 {content}\n\n#TechNews #Innovation",
  business: "📊 {content}\n\n#Business #Startup",
  science: "🔬 {content}\n\n#Science #Research"
};
```

## 🔐 Seguridad

### Mejores Prácticas:

1. **Nunca compartas Client Secret**
2. **Usa HTTPS siempre** (Railway lo hace automático)
3. **Rota tokens regularmente**
4. **Monitorea actividad sospechosa**
5. **Configura 2FA en tu cuenta de Twitter**

### Revocar Acceso:

```
1. Ve a Twitter → Settings → Security
2. Apps and sessions
3. Encuentra tu app
4. Haz clic en "Revoke access"
```

## 📊 Análisis de Rendimiento

### Métricas Clave:

```
Engagement Rate = (Likes + RTs + Replies) / Impresiones × 100

Ejemplo:
1000 impresiones
50 likes + 20 RTs + 10 replies = 80 interacciones
Engagement = 80/1000 × 100 = 8%

✅ Buen engagement: >2%
⚡ Excelente: >5%
🔥 Viral: >10%
```

## 🎯 Optimización

### A/B Testing

El sistema puede generar variaciones:

```typescript
// Generar 3 versiones del tweet
const variations = await generatePostVariations(news, 3);

// Cada una con tono diferente:
// 1. Profesional
// 2. Casual
// 3. Humor/Emoji-heavy
```

### Horarios Óptimos

Configura en tu tópico:

```
Horarios preferidos para Twitter:
- 8:00 AM (commute)
- 12:00 PM (lunch)
- 5:00 PM (after work)
- 9:00 PM (evening)
```

## 📚 Recursos

- [Twitter API Docs](https://developer.twitter.com/en/docs/twitter-api)
- [OAuth 2.0 Guide](https://developer.twitter.com/en/docs/authentication/oauth-2-0)
- [Rate Limits](https://developer.twitter.com/en/docs/twitter-api/rate-limits)
- [Best Practices](https://developer.twitter.com/en/docs/twitter-api/best-practices)

## 🆘 Soporte

### Recursos de Twitter:

- [Developer Forum](https://twittercommunity.com/)
- [Status Page](https://api.twitterstat.us/)
- [Developer Portal](https://developer.twitter.com/en/portal/dashboard)

### En la App:

```
1. Logs en Railway: railway logs
2. Health check: GET /api/twitter/health
3. Test conexión: POST /api/twitter/test-tweet
```

---

**¡Todo listo!** Ya puedes publicar en Twitter automáticamente con aprobación por Telegram. 🎉
