// packages/backend/src/routes/health.ts
// Endpoint de health check para Railway

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import redis from '../lib/redis';
import llmService from '../services/llm.service';

const router = Router();

/**
 * Health check simple para Railway
 */
router.get('/health', async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Health check detallado con verificación de servicios
 */
router.get('/health/detailed', async (req: Request, res: Response) => {
  const healthStatus: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      llm: 'unknown',
    },
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // Check Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.services.database = 'healthy';
  } catch (error) {
    healthStatus.services.database = 'unhealthy';
    healthStatus.status = 'degraded';
  }

  // Check Redis
  try {
    const redisClient = await redis.getClient();
    await redisClient.ping();
    healthStatus.services.redis = 'healthy';
  } catch (error) {
    healthStatus.services.redis = 'unhealthy';
    healthStatus.status = 'degraded';
  }

  // Check LLM Service
  try {
    const llmHealthy = await llmService.checkHealth();
    healthStatus.services.llm = llmHealthy ? 'healthy' : 'unhealthy';
    if (!llmHealthy) {
      healthStatus.status = 'degraded';
    }
  } catch (error) {
    healthStatus.services.llm = 'unhealthy';
    healthStatus.status = 'degraded';
  }

  // Determinar código de estado HTTP
  const statusCode = healthStatus.status === 'ok' ? 200 : 503;

  res.status(statusCode).json(healthStatus);
});

/**
 * Readiness check - verifica si la app está lista para recibir tráfico
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Verificar que la base de datos esté accesible
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: 'Database not accessible',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Liveness check - verifica que la app esté viva
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
  });
});

export default router;
