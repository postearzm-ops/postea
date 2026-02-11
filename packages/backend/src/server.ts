// packages/backend/src/server.ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import healthRoutes from './routes/health.routes';
import telegramRoutes from './routes/telegram.routes';
import jobScheduler from './jobs/scheduler';
import telegramService from './services/telegram.service';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas
app.use('/', healthRoutes);
app.use('/api/telegram', telegramRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    name: 'Postea API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      telegram: '/api/telegram',
    }
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Inicializar servicios
    console.log('🚀 Iniciando Postea API...');
    
    // Configurar webhook de Telegram si está en producción
    if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_BOT_TOKEN) {
      const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || 
        `${process.env.BACKEND_URL || process.env.FRONTEND_URL}/api/telegram/webhook`;
      
      console.log('⚙️ Configurando webhook de Telegram...');
      await telegramService.setWebhook(webhookUrl);
    }
    
    // Iniciar cron jobs
    console.log('📅 Iniciando cron jobs...');
    jobScheduler.init();
    
    // Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📝 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar
startServer();

export default app;
