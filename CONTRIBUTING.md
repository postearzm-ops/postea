# Contribuir a Postea

¡Gracias por tu interés en contribuir a Postea! Este documento te guiará en el proceso.

## 🚀 Cómo Contribuir

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/TU-USUARIO/postea.git
cd postea
```

### 2. Configurar el Entorno

```bash
# Ejecutar script de setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# Configurar .env con tus credenciales de desarrollo
cp .env.example .env
# Edita .env con tus API keys
```

### 3. Crear una Rama

```bash
# Crear rama desde main
git checkout -b feature/mi-nueva-funcionalidad
# o
git checkout -b fix/mi-bug-fix
```

Nombres de ramas sugeridos:
- `feature/` - Nuevas funcionalidades
- `fix/` - Corrección de bugs
- `docs/` - Cambios en documentación
- `refactor/` - Refactorización de código
- `test/` - Añadir o mejorar tests

### 4. Hacer Cambios

```bash
# Desarrolla tu funcionalidad o fix
# Asegúrate de seguir las guías de estilo

# Ejecutar tests
npm run test

# Verificar linting
npm run lint

# Formatear código
npm run format
```

### 5. Commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: agregar soporte para Instagram"
git commit -m "fix: corregir error en publicación de Twitter"
git commit -m "docs: actualizar guía de instalación"
```

Tipos de commit:
- `feat:` - Nueva funcionalidad
- `fix:` - Corrección de bug
- `docs:` - Cambios en documentación
- `style:` - Cambios de formato (no afectan código)
- `refactor:` - Refactorización
- `test:` - Añadir o modificar tests
- `chore:` - Cambios en build, dependencias, etc.

### 6. Push y Pull Request

```bash
# Push a tu fork
git push origin feature/mi-nueva-funcionalidad

# Crear Pull Request en GitHub
# Describe claramente los cambios y por qué son necesarios
```

## 📋 Guías de Código

### TypeScript

- Usa tipos explícitos siempre que sea posible
- Evita `any`, usa tipos específicos o `unknown`
- Documenta funciones públicas con JSDoc

```typescript
/**
 * Genera un post para la plataforma especificada
 * @param newsItem - Noticia de origen
 * @param platform - Plataforma de destino
 * @returns Post generado
 */
async function generatePost(newsItem: NewsItem, platform: Platform): Promise<GeneratedPost> {
  // ...
}
```

### Estructura de Archivos

```
packages/backend/src/
├── controllers/    # Lógica de controladores
├── services/       # Lógica de negocio
├── routes/         # Definición de rutas
├── middleware/     # Middleware de Express
├── jobs/           # Cron jobs y tareas
├── lib/            # Utilidades y helpers
└── config/         # Configuración
```

### Estilo de Código

- Indentación: 2 espacios
- Comillas: simples (`'`)
- Punto y coma: sí
- Longitud de línea: 100 caracteres
- Nombres de archivos: kebab-case (`user-service.ts`)
- Nombres de clases: PascalCase (`UserService`)
- Nombres de funciones: camelCase (`getUserById`)
- Nombres de constantes: UPPER_SNAKE_CASE (`MAX_RETRIES`)

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
npm run test

# Backend
npm run test:backend

# Frontend
npm run test:frontend

# Con coverage
npm run test:coverage
```

### Escribir Tests

```typescript
// Example test
describe('PostOrchestratorService', () => {
  it('should generate post for LinkedIn', async () => {
    const result = await orchestrator.generatePost({
      newsItemId: 'test-id',
      platform: 'LINKEDIN'
    });
    
    expect(result).toBeDefined();
    expect(result.platform).toBe('LINKEDIN');
  });
});
```

## 📝 Documentación

### Actualizar Documentación

Si tu PR añade o cambia funcionalidad:

1. Actualiza el README.md si es necesario
2. Actualiza la documentación en `docs/`
3. Añade comentarios JSDoc en el código
4. Actualiza el CHANGELOG.md

### Escribir Documentación

- Usa Markdown
- Incluye ejemplos de código
- Añade screenshots si es relevante
- Mantén un tono claro y conciso

## 🐛 Reportar Bugs

### Antes de Reportar

1. Verifica que no exista un issue similar
2. Asegúrate de usar la última versión
3. Intenta reproducir el bug

### Crear un Issue

Incluye:
- Descripción clara del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots (si aplica)
- Versión de Node.js y npm
- Sistema operativo

Ejemplo:

```markdown
## Descripción
Los posts no se publican en Twitter cuando contienen emojis.

## Pasos para Reproducir
1. Crear tópico para Twitter
2. Generar post con emoji 🚀
3. Aprobar en Telegram
4. Observar error en logs

## Comportamiento Esperado
Post se publica correctamente con emoji

## Comportamiento Actual
Error: "Invalid character in tweet"

## Entorno
- Node.js: v20.10.0
- npm: 10.2.3
- OS: macOS 14.0
```

## 💡 Sugerir Funcionalidades

### Antes de Sugerir

1. Verifica que no exista una sugerencia similar
2. Asegúrate de que encaja con el scope del proyecto
3. Piensa en el valor que aporta

### Crear una Sugerencia

Incluye:
- Descripción clara de la funcionalidad
- Caso de uso
- Beneficio para los usuarios
- Posible implementación (opcional)
- Mockups o ejemplos (si aplica)

## 🎯 Áreas que Necesitan Ayuda

Buscamos contribuciones especialmente en:

- 🐛 **Bug fixes** - Siempre bienvenidos
- 📚 **Documentación** - Mejorar guías y tutoriales
- 🌍 **Traducciones** - Traducir documentación
- ✨ **Features** - Nuevas integraciones (Instagram, etc.)
- 🧪 **Tests** - Aumentar cobertura de tests
- 🎨 **UI/UX** - Mejorar interfaz de usuario
- ⚡ **Performance** - Optimizaciones

## 📞 Preguntas

¿Tienes preguntas? Puedes:

1. Abrir un [Discussion](https://github.com/tu-usuario/postea/discussions)
2. Preguntar en nuestro [Discord](#) (próximamente)
3. Crear un issue con la etiqueta `question`

## 📜 Código de Conducta

### Nuestro Compromiso

Nos comprometemos a hacer de la participación en nuestro proyecto una experiencia libre de acoso para todos, independientemente de edad, tamaño corporal, discapacidad, etnia, identidad de género, nivel de experiencia, nacionalidad, apariencia personal, raza, religión o identidad y orientación sexual.

### Comportamiento Esperado

- Usa lenguaje acogedor e inclusivo
- Respeta diferentes puntos de vista
- Acepta críticas constructivas con gracia
- Enfócate en lo que es mejor para la comunidad
- Muestra empatía hacia otros miembros

### Comportamiento Inaceptable

- Lenguaje o imágenes sexualizadas
- Trolling, comentarios insultantes/despectivos
- Acoso público o privado
- Publicar información privada de otros
- Otra conducta inapropiada

## 🎉 Reconocimiento

Los contribuidores serán:

- Listados en el README.md
- Mencionados en el CHANGELOG.md
- Reconocidos en nuestras redes sociales

## 📄 Licencia

Al contribuir, aceptas que tus contribuciones se licencien bajo la misma licencia MIT que el proyecto.

---

**¡Gracias por contribuir a Postea!** 🚀
