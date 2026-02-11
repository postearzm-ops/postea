# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [2.0.0] - 2026-02-10

### Añadido

- 🐦 **Soporte para Twitter/X**: Publicación automática en Twitter
- 📱 **Bot de Telegram**: Aprobación de posts vía Telegram
- 🎯 **Multi-plataforma**: Selección de LinkedIn, Twitter o ambas por tópico
- ✨ **Adaptación automática**: Contenido adaptado a cada plataforma
- 🔔 **Notificaciones**: Confirmaciones de éxito/error en Telegram
- 📊 **Analytics mejorado**: Métricas por plataforma
- 🔄 **Estados de aprobación**: PENDING, APPROVED, REJECTED, AUTO_APPROVED, EXPIRED
- ⚙️ **Configuración flexible**: Auto-publicar o requerir aprobación
- 📝 **Comandos de Telegram**: /start, /status, /help
- 🤖 **Respuestas rápidas**: Aprobar/rechazar con "SI" o "NO"

### Cambiado

- ♻️ Refactorización completa del orquestador de posts
- 🗄️ Schema de base de datos mejorado con nuevas tablas
- 📋 Cron jobs actualizados para nuevos flujos
- 🎨 UI mejorada con soporte multi-plataforma
- 📚 Documentación completamente reescrita

### Mejorado

- ⚡ Rendimiento en generación de posts
- 🔒 Seguridad en OAuth flows
- 🐛 Corrección de bugs en renovación de tokens
- 📊 Sistema de analytics más completo

## [1.0.0] - 2026-01-15

### Añadido

- 🚀 Lanzamiento inicial
- 💼 Soporte para LinkedIn
- 🤖 Generación de contenido con IA (Groq/Ollama)
- 📰 Recopilación de noticias (NewsAPI, GNews, RSS)
- 📅 Programación de publicaciones
- 🎯 Gestión de tópicos
- 📊 Analytics básico
- 🔐 OAuth 2.0 con LinkedIn
- 💾 PostgreSQL + Redis
- 🐳 Soporte Docker
- ☁️ Deploy en Railway

### Cambiado

- N/A (lanzamiento inicial)

### Deprecated

- N/A

### Removed

- N/A

### Fixed

- N/A

### Security

- N/A

---

## [Unreleased]

### En Desarrollo

- Instagram integration
- Facebook Pages
- Edición de posts desde Telegram
- Generación de imágenes con IA
- A/B testing automático
- Machine Learning para optimizar horarios

---

## Tipos de Cambios

- `Añadido` - Nuevas funcionalidades
- `Cambiado` - Cambios en funcionalidad existente
- `Deprecated` - Funcionalidad que será removida
- `Removed` - Funcionalidad removida
- `Fixed` - Corrección de bugs
- `Security` - Vulnerabilidades corregidas
