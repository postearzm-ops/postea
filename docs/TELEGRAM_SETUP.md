# 🤖 Guía de Configuración del Bot de Telegram

## ¿Por Qué Telegram?

El bot de Telegram te permite:
- ✅ Revisar posts generados antes de publicarlos
- ✅ Aprobar o rechazar con un simple botón
- ✅ Recibir notificaciones en tiempo real
- ✅ Controlar publicaciones desde tu móvil
- ✅ Sistema 100% gratuito

## 📋 Paso 1: Crear el Bot de Telegram

### 1.1 Hablar con BotFather

```
1. Abre Telegram
2. Busca: @BotFather
3. Envía: /start
4. Envía: /newbot
5. Nombre del bot: "Post Approval Bot" (o el que quieras)
6. Username: "tu_usuario_post_bot" (debe terminar en "bot")
7. BotFather te dará un TOKEN
   Ejemplo: 6234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
```

### 1.2 Guardar el Token

```bash
# En tu archivo .env o variables de Railway
TELEGRAM_BOT_TOKEN=6234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
```

⚠️ **IMPORTANTE**: Nunca compartas este token públicamente.

## 📲 Paso 2: Obtener tu Chat ID

### 2.1 Iniciar conversación con tu bot

```
1. Busca tu bot en Telegram (el username que configuraste)
2. Haz clic en "Start" o envía: /start
3. El bot te responderá con tu Chat ID
```

### 2.2 Configurar Chat ID en la aplicación

```
1. Inicia sesión en tu cuenta
2. Ve a Configuración → Notificaciones
3. Pega tu Chat ID
4. Activa "Aprobación por Telegram"
5. Guarda
```

## 🔧 Paso 3: Configurar Webhook (Railway)

### 3.1 Automático (Recomendado)

El sistema configurará el webhook automáticamente al iniciar en Railway usando tu dominio:

```
https://tu-app.up.railway.app/api/telegram/webhook
```

### 3.2 Manual (Si es necesario)

```bash
# Usando curl
curl -X POST "https://api.telegram.org/bot<TU_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tu-app.up.railway.app/api/telegram/webhook"}'

# O desde la app
POST /api/telegram/setup-webhook
{
  "webhookUrl": "https://tu-app.up.railway.app/api/telegram/webhook"
}
```

### 3.3 Verificar Webhook

```bash
curl "https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo"
```

Deberías ver:
```json
{
  "ok": true,
  "result": {
    "url": "https://tu-app.up.railway.app/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## 💬 Paso 4: Uso del Bot

### 4.1 Comandos Disponibles

```
/start  - Iniciar bot y obtener Chat ID
/status - Ver posts pendientes de aprobación
/help   - Ayuda y comandos disponibles
```

### 4.2 Aprobación de Posts

Cuando se genere un post, recibirás un mensaje como este:

```
💼 Nuevo Post para LinkedIn

📰 Noticia: La IA revoluciona la industria...

📝 Contenido del Post:
La inteligencia artificial está transformando
radicalmente la forma en que trabajamos...

#AI #Innovation #TechTrends #FutureOfWork

⏰ Fecha: 10/02/2026 14:30

¿Aprobar publicación?
```

Con botones:
- ✅ **Aprobar** - Publica el post inmediatamente
- ❌ **Rechazar** - Descarta el post
- ✏️ **Editar** - Editar antes de publicar (próximamente)
- ⏰ **Programar** - Programar para más tarde (próximamente)

### 4.3 Respuestas Rápidas

También puedes responder con texto:
- `SI` o `SÍ` → Aprueba el último post pendiente
- `NO` → Rechaza el último post pendiente

## 🔐 Seguridad

### Recomendaciones:

1. **Nunca compartas tu Bot Token**
2. **Solo tú debes tener acceso al bot**
3. **Revisa el Chat ID configurado**
4. **Usa HTTPS siempre** (Railway lo hace automáticamente)

### Verificar que el bot es tuyo:

```
1. En Telegram, busca @BotFather
2. Envía: /mybots
3. Selecciona tu bot
4. Verifica que sea el correcto
```

## 🎯 Flujo Completo

```
1. Sistema encuentra noticia relevante
2. LLM genera contenido del post
3. Post se envía a Telegram para aprobación
   ↓
4. Recibes mensaje en Telegram
5. Revisas el contenido
6. Haces clic en "✅ Aprobar" o "❌ Rechazar"
   ↓
7a. Si apruebas → Post se publica automáticamente
7b. Si rechazas → Post se descarta
   ↓
8. Recibes confirmación en Telegram
```

## ⚙️ Configuración Avanzada

### Variables de Entorno Adicionales

```bash
# Tiempo de expiración de aprobaciones (en horas)
APPROVAL_TIMEOUT_HOURS=24

# Auto-publicar si no hay respuesta (true/false)
AUTO_PUBLISH_ON_TIMEOUT=false

# Enviar resumen diario
TELEGRAM_DAILY_SUMMARY=true
TELEGRAM_SUMMARY_TIME=09:00
```

### Personalizar Mensajes

Puedes modificar los mensajes del bot editando:
```
packages/backend/src/services/telegram.service.ts
```

## 🐛 Troubleshooting

### Problema: "Bot no responde"

**Solución:**
```bash
# Verificar token
curl "https://api.telegram.org/bot<TU_TOKEN>/getMe"

# Debe responder con información del bot
```

### Problema: "No recibo mensajes"

**Verificar:**
1. Chat ID correcto en configuración
2. Bot iniciado en Telegram (/start)
3. Webhook configurado correctamente
4. Logs del servidor

```bash
# Ver logs en Railway
railway logs

# Buscar errores de Telegram
```

### Problema: "Webhook no funciona"

**Solución:**
```bash
# 1. Eliminar webhook actual
curl -X POST "https://api.telegram.org/bot<TU_TOKEN>/deleteWebhook"

# 2. Configurar nuevo webhook
curl -X POST "https://api.telegram.org/bot<TU_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tu-app.up.railway.app/api/telegram/webhook"}'

# 3. Verificar
curl "https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo"
```

### Problema: "Botones no funcionan"

**Causas comunes:**
- Chat ID no configurado en la base de datos
- Usuario no vinculado al post
- Timeout de mensaje (más de 48 horas)

**Solución:**
Usa respuestas de texto: `SI` o `NO`

## 📊 Monitoreo

### Ver mensajes enviados:

```sql
-- En Prisma Studio o directamente en PostgreSQL
SELECT * FROM telegram_messages 
ORDER BY sent_at DESC 
LIMIT 10;
```

### Ver estadísticas de aprobación:

```sql
SELECT 
  approval_status,
  COUNT(*) as total
FROM posts
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY approval_status;
```

## 🔄 Actualizar Bot

Si cambias el token del bot:

```bash
# 1. Actualizar variable en Railway
TELEGRAM_BOT_TOKEN=nuevo_token_aqui

# 2. Reconfigurar webhook
POST /api/telegram/setup-webhook
{
  "webhookUrl": "https://tu-app.up.railway.app/api/telegram/webhook"
}

# 3. Reiniciar aplicación
railway restart
```

## 📱 Múltiples Usuarios

Cada usuario puede tener su propio Chat ID:

```
Usuario 1: Chat ID = 123456789
Usuario 2: Chat ID = 987654321
```

Cada uno recibirá solo sus propias notificaciones.

## 🎨 Personalización

### Emojis Personalizados

Edita `telegram.service.ts`:

```typescript
// LinkedIn
const platformEmoji = '💼';

// Twitter
const platformEmoji = '🐦';

// Puedes cambiarlos por:
// 🚀 📱 💡 ⚡ 🎯 📊
```

### Mensajes Personalizados

```typescript
let message = `${platformEmoji} *Nuevo Post*\n\n`;
// Cambia a:
let message = `🎉 *Tienes un nuevo post listo!*\n\n`;
```

## 📚 Recursos

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
- [Webhook Guide](https://core.telegram.org/bots/webhooks)

## 🆘 Soporte

¿Problemas?
1. Revisa los logs en Railway
2. Verifica configuración del webhook
3. Prueba comandos básicos: `/start`, `/status`
4. Consulta la documentación de Telegram

---

**¡Felicidades!** Ya tienes tu bot de Telegram configurado y funcionando. 🎉
