// packages/backend/src/routes/telegram.routes.ts
// Rutas para webhook de Telegram

import { Router, Request, Response } from 'express';
import telegramService from '../services/telegram.service';
import { body, validationResult } from 'express-validator';

const router = Router();

/**
 * Webhook para recibir updates de Telegram
 * Telegram enviará POST requests a esta ruta
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const update = req.body;

    // Telegram espera una respuesta rápida (200 OK)
    // Procesamos el update de forma asíncrona
    res.status(200).send('OK');

    // Procesar el update en background
    await telegramService.processUpdate(update);
  } catch (error) {
    console.error('Error procesando webhook de Telegram:', error);
    res.status(200).send('OK'); // Siempre respondemos OK a Telegram
  }
});

/**
 * Configurar el webhook de Telegram
 * POST /api/telegram/setup-webhook
 */
router.post(
  '/setup-webhook',
  [
    body('webhookUrl').isURL().withMessage('URL del webhook inválida')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { webhookUrl } = req.body;
      const success = await telegramService.setWebhook(webhookUrl);

      if (success) {
        res.json({
          success: true,
          message: 'Webhook configurado correctamente',
          webhookUrl
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error configurando webhook'
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * Obtener información del webhook actual
 * GET /api/telegram/webhook-info
 */
router.get('/webhook-info', async (req: Request, res: Response) => {
  try {
    const info = await telegramService.getWebhookInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Eliminar el webhook
 * DELETE /api/telegram/webhook
 */
router.delete('/webhook', async (req: Request, res: Response) => {
  try {
    const success = await telegramService.deleteWebhook();
    
    if (success) {
      res.json({
        success: true,
        message: 'Webhook eliminado correctamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error eliminando webhook'
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Obtener información del bot
 * GET /api/telegram/bot-info
 */
router.get('/bot-info', async (req: Request, res: Response) => {
  try {
    const info = await telegramService.getBotInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Health check del bot
 * GET /api/telegram/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await telegramService.checkHealth();
    
    if (isHealthy) {
      res.json({
        success: true,
        status: 'healthy',
        message: 'Bot de Telegram funcionando correctamente'
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: 'Bot de Telegram no disponible'
      });
    }
  } catch (error: any) {
    res.status(503).json({
      success: false,
      status: 'error',
      message: error.message
    });
  }
});

/**
 * Enviar mensaje de prueba
 * POST /api/telegram/test-message
 */
router.post(
  '/test-message',
  [
    body('chatId').notEmpty().withMessage('Chat ID requerido'),
    body('message').notEmpty().withMessage('Mensaje requerido')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { chatId, message } = req.body;
      
      await telegramService.sendMessage({
        chatId,
        text: message
      });

      res.json({
        success: true,
        message: 'Mensaje enviado correctamente'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;
