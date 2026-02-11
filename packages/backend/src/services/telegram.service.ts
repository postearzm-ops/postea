// packages/backend/src/services/telegram.service.ts
// Servicio para integración con Telegram Bot

import axios from 'axios';
import prisma from '../lib/prisma';

interface SendMessageOptions {
  chatId: string;
  text: string;
  replyMarkup?: any;
  parseMode?: 'Markdown' | 'HTML';
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      username?: string;
      first_name: string;
    };
    chat: {
      id: number;
    };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      username?: string;
    };
    message: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data: string;
  };
}

export class TelegramService {
  private botToken: string;
  private apiUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    if (!this.botToken) {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN no configurado. Bot de Telegram deshabilitado.');
    }
  }

  /**
   * Envía un post para aprobación a Telegram
   */
  async sendPostForApproval(
    chatId: string,
    postId: string,
    content: string,
    platform: 'LINKEDIN' | 'TWITTER',
    newsTitle?: string
  ): Promise<number | null> {
    if (!this.botToken) {
      console.error('Bot de Telegram no configurado');
      return null;
    }

    try {
      const platformEmoji = platform === 'LINKEDIN' ? '💼' : '🐦';
      const platformName = platform === 'LINKEDIN' ? 'LinkedIn' : 'Twitter/X';
      
      let message = `${platformEmoji} *Nuevo Post para ${platformName}*\n\n`;
      
      if (newsTitle) {
        message += `📰 *Noticia:* ${this.escapeMarkdown(newsTitle)}\n\n`;
      }
      
      message += `📝 *Contenido del Post:*\n${this.escapeMarkdown(content)}\n\n`;
      message += `⏰ *Fecha:* ${new Date().toLocaleString('es-ES')}\n\n`;
      message += `¿Aprobar publicación?`;

      const response = await this.sendMessage({
        chatId,
        text: message,
        parseMode: 'Markdown',
        replyMarkup: {
          inline_keyboard: [
            [
              { text: '✅ Aprobar', callback_data: `approve:${postId}` },
              { text: '❌ Rechazar', callback_data: `reject:${postId}` }
            ],
            [
              { text: '✏️ Editar', callback_data: `edit:${postId}` },
              { text: '⏰ Programar', callback_data: `schedule:${postId}` }
            ]
          ]
        }
      });

      if (response) {
        // Guardar el mensaje en la BD
        await prisma.telegramMessage.create({
          data: {
            chatId,
            messageId: response.message_id,
            postId,
            messageType: 'approval_request',
            text: message,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
          }
        });

        return response.message_id;
      }

      return null;
    } catch (error: any) {
      console.error('Error enviando post a Telegram:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Envía un mensaje a Telegram
   */
  async sendMessage(options: SendMessageOptions): Promise<any> {
    try {
      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: options.chatId,
        text: options.text,
        parse_mode: options.parseMode || 'Markdown',
        reply_markup: options.replyMarkup,
        disable_web_page_preview: true
      });

      return response.data.result;
    } catch (error: any) {
      console.error('Error en Telegram API:', error.response?.data);
      throw error;
    }
  }

  /**
   * Procesa una actualización (update) de Telegram
   */
  async processUpdate(update: TelegramUpdate): Promise<void> {
    try {
      // Procesar callback queries (botones inline)
      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
        return;
      }

      // Procesar mensajes de texto
      if (update.message?.text) {
        await this.handleTextMessage(update.message);
        return;
      }
    } catch (error) {
      console.error('Error procesando update de Telegram:', error);
    }
  }

  /**
   * Maneja las respuestas de los botones inline
   */
  private async handleCallbackQuery(callback: any): Promise<void> {
    const data = callback.data;
    const [action, postId] = data.split(':');

    try {
      switch (action) {
        case 'approve':
          await this.approvePost(postId, callback.from.username || callback.from.id.toString());
          await this.answerCallbackQuery(callback.id, '✅ Post aprobado');
          await this.editMessageReplyMarkup(
            callback.message.chat.id,
            callback.message.message_id,
            null // Remover botones
          );
          break;

        case 'reject':
          await this.rejectPost(postId, callback.from.username || callback.from.id.toString());
          await this.answerCallbackQuery(callback.id, '❌ Post rechazado');
          await this.editMessageReplyMarkup(
            callback.message.chat.id,
            callback.message.message_id,
            null
          );
          break;

        case 'edit':
          await this.answerCallbackQuery(callback.id, '✏️ Función de edición próximamente');
          break;

        case 'schedule':
          await this.answerCallbackQuery(callback.id, '⏰ Función de programación próximamente');
          break;

        default:
          await this.answerCallbackQuery(callback.id, '❓ Acción desconocida');
      }
    } catch (error) {
      console.error('Error manejando callback query:', error);
      await this.answerCallbackQuery(callback.id, '❌ Error procesando acción');
    }
  }

  /**
   * Maneja mensajes de texto simples (SI/NO)
   */
  private async handleTextMessage(message: any): Promise<void> {
    const text = message.text.toLowerCase().trim();
    const chatId = message.chat.id.toString();

    // Comando /start
    if (text === '/start') {
      await this.sendMessage({
        chatId,
        text: `🤖 *Bot de Aprobación de Posts*\n\n` +
              `¡Bienvenido! Este bot te enviará posts para aprobar.\n\n` +
              `*Comandos:*\n` +
              `/start - Este mensaje\n` +
              `/status - Ver posts pendientes\n` +
              `/help - Ayuda\n\n` +
              `Tu Chat ID es: \`${chatId}\`\n` +
              `Configúralo en tu cuenta para recibir notificaciones.`,
        parseMode: 'Markdown'
      });
      return;
    }

    // Comando /status
    if (text === '/status') {
      const pendingPosts = await prisma.post.count({
        where: {
          approvalStatus: 'PENDING',
          user: {
            telegramChatId: chatId
          }
        }
      });

      await this.sendMessage({
        chatId,
        text: `📊 *Estado de Posts*\n\nPosts pendientes de aprobación: ${pendingPosts}`,
        parseMode: 'Markdown'
      });
      return;
    }

    // Respuestas SI/NO para el último post pendiente
    if (text === 'si' || text === 'sí' || text === 'yes') {
      const lastPendingPost = await this.getLastPendingPostForChat(chatId);
      if (lastPendingPost) {
        await this.approvePost(lastPendingPost.id, message.from.username || message.from.id.toString());
        await this.sendMessage({
          chatId,
          text: '✅ Post aprobado correctamente'
        });
      } else {
        await this.sendMessage({
          chatId,
          text: '❌ No hay posts pendientes de aprobación'
        });
      }
      return;
    }

    if (text === 'no') {
      const lastPendingPost = await this.getLastPendingPostForChat(chatId);
      if (lastPendingPost) {
        await this.rejectPost(lastPendingPost.id, message.from.username || message.from.id.toString());
        await this.sendMessage({
          chatId,
          text: '❌ Post rechazado'
        });
      } else {
        await this.sendMessage({
          chatId,
          text: '❌ No hay posts pendientes de aprobación'
        });
      }
      return;
    }
  }

  /**
   * Aprueba un post
   */
  private async approvePost(postId: string, approvedBy: string): Promise<void> {
    await prisma.post.update({
      where: { id: postId },
      data: {
        approvalStatus: 'APPROVED',
        status: 'SCHEDULED',
        approvedAt: new Date(),
        approvedBy
      }
    });

    // Marcar mensaje como respondido
    await prisma.telegramMessage.updateMany({
      where: { postId },
      data: {
        responseReceived: true,
        responseText: 'APPROVED',
        responseAt: new Date()
      }
    });

    console.log(`✅ Post ${postId} aprobado por ${approvedBy}`);
  }

  /**
   * Rechaza un post
   */
  private async rejectPost(postId: string, rejectedBy: string): Promise<void> {
    await prisma.post.update({
      where: { id: postId },
      data: {
        approvalStatus: 'REJECTED',
        status: 'REJECTED',
        rejectedAt: new Date(),
        approvedBy: rejectedBy,
        rejectionReason: `Rechazado manualmente por ${rejectedBy}`
      }
    });

    // Marcar mensaje como respondido
    await prisma.telegramMessage.updateMany({
      where: { postId },
      data: {
        responseReceived: true,
        responseText: 'REJECTED',
        responseAt: new Date()
      }
    });

    console.log(`❌ Post ${postId} rechazado por ${rejectedBy}`);
  }

  /**
   * Obtiene el último post pendiente para un chat
   */
  private async getLastPendingPostForChat(chatId: string): Promise<any> {
    return await prisma.post.findFirst({
      where: {
        approvalStatus: 'PENDING',
        user: {
          telegramChatId: chatId
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Responde a un callback query
   */
  private async answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/answerCallbackQuery`, {
        callback_query_id: callbackQueryId,
        text,
        show_alert: false
      });
    } catch (error) {
      console.error('Error respondiendo callback query:', error);
    }
  }

  /**
   * Edita el markup de un mensaje (para remover botones)
   */
  private async editMessageReplyMarkup(
    chatId: number,
    messageId: number,
    replyMarkup: any
  ): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/editMessageReplyMarkup`, {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: replyMarkup
      });
    } catch (error) {
      console.error('Error editando markup:', error);
    }
  }

  /**
   * Escapa caracteres especiales de Markdown
   */
  private escapeMarkdown(text: string): string {
    return text
      .replace(/_/g, '\\_')
      .replace(/\*/g, '\\*')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/~/g, '\\~')
      .replace(/`/g, '\\`')
      .replace(/>/g, '\\>')
      .replace(/#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/-/g, '\\-')
      .replace(/=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/!/g, '\\!');
  }

  /**
   * Configura el webhook de Telegram
   */
  async setWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.apiUrl}/setWebhook`, {
        url: webhookUrl,
        allowed_updates: ['message', 'callback_query']
      });

      console.log('✅ Webhook de Telegram configurado:', webhookUrl);
      return response.data.ok;
    } catch (error) {
      console.error('Error configurando webhook:', error);
      return false;
    }
  }

  /**
   * Obtiene información del webhook actual
   */
  async getWebhookInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/getWebhookInfo`);
      return response.data.result;
    } catch (error) {
      console.error('Error obteniendo info del webhook:', error);
      return null;
    }
  }

  /**
   * Elimina el webhook (para usar polling)
   */
  async deleteWebhook(): Promise<boolean> {
    try {
      const response = await axios.post(`${this.apiUrl}/deleteWebhook`);
      return response.data.ok;
    } catch (error) {
      console.error('Error eliminando webhook:', error);
      return false;
    }
  }

  /**
   * Verifica el estado del bot
   */
  async checkHealth(): Promise<boolean> {
    if (!this.botToken) return false;

    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);
      return response.data.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene información del bot
   */
  async getBotInfo(): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);
      return response.data.result;
    } catch (error) {
      console.error('Error obteniendo info del bot:', error);
      return null;
    }
  }

  /**
   * Envía notificación de publicación exitosa
   */
  async notifyPublicationSuccess(
    chatId: string,
    platform: 'LINKEDIN' | 'TWITTER',
    postUrl: string
  ): Promise<void> {
    const emoji = platform === 'LINKEDIN' ? '💼' : '🐦';
    const platformName = platform === 'LINKEDIN' ? 'LinkedIn' : 'Twitter/X';
    
    await this.sendMessage({
      chatId,
      text: `${emoji} *Post Publicado*\n\n` +
            `Tu post ha sido publicado exitosamente en ${platformName}.\n\n` +
            `🔗 [Ver post](${postUrl})`,
      parseMode: 'Markdown'
    });
  }

  /**
   * Envía notificación de error
   */
  async notifyPublicationError(
    chatId: string,
    platform: 'LINKEDIN' | 'TWITTER',
    error: string
  ): Promise<void> {
    const emoji = platform === 'LINKEDIN' ? '💼' : '🐦';
    const platformName = platform === 'LINKEDIN' ? 'LinkedIn' : 'Twitter/X';
    
    await this.sendMessage({
      chatId,
      text: `❌ *Error en Publicación*\n\n` +
            `Hubo un error al publicar en ${platformName}:\n\n` +
            `\`${error}\``,
      parseMode: 'Markdown'
    });
  }
}

export default new TelegramService();
