// packages/backend/src/services/post-orchestrator.service.ts
// Orquestador principal que coordina todo el flujo de posts

import prisma from '../lib/prisma';
import llmService from './llm.service';
import linkedinService from './linkedin.service';
import twitterService from './twitter.service';
import telegramService from './telegram.service';

interface GeneratePostOptions {
  newsItemId: string;
  userId: string;
  platforms: ('LINKEDIN' | 'TWITTER')[];
  requireApproval?: boolean;
}

interface PostResult {
  postId: string;
  platform: 'LINKEDIN' | 'TWITTER';
  status: string;
  telegramMessageId?: number;
}

export class PostOrchestratorService {
  /**
   * Genera posts para una noticia en las plataformas especificadas
   */
  async generatePostsFromNews(options: GeneratePostOptions): Promise<PostResult[]> {
    const results: PostResult[] = [];

    // Obtener la noticia
    const newsItem = await prisma.newsItem.findUnique({
      where: { id: options.newsItemId },
      include: {
        topic: true
      }
    });

    if (!newsItem) {
      throw new Error('Noticia no encontrada');
    }

    // Obtener usuario
    const user = await prisma.user.findUnique({
      where: { id: options.userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Generar contenido base con LLM
    const generatedContent = await llmService.generateLinkedInPost({
      title: newsItem.title,
      description: newsItem.description || '',
      url: newsItem.url,
      content: newsItem.content || undefined
    });

    // Crear posts para cada plataforma
    for (const platform of options.platforms) {
      try {
        let content = generatedContent.content;
        let hashtags = generatedContent.hashtags;

        // Adaptar contenido según la plataforma
        if (platform === 'TWITTER') {
          content = twitterService.formatContentForTwitter(
            generatedContent.content,
            generatedContent.hashtags
          );
          // Twitter usa hashtags inline, no separados
          hashtags = [];
        }

        // Crear el post en la BD
        const post = await prisma.post.create({
          data: {
            userId: options.userId,
            newsItemId: options.newsItemId,
            content,
            hashtags,
            platform,
            status: 'DRAFT',
            approvalStatus: options.requireApproval ? 'PENDING' : 'AUTO_APPROVED'
          }
        });

        // Si requiere aprobación y Telegram está habilitado, enviar a Telegram
        if (options.requireApproval && user.telegramEnabled && user.telegramChatId) {
          const messageId = await telegramService.sendPostForApproval(
            user.telegramChatId,
            post.id,
            content,
            platform,
            newsItem.title
          );

          if (messageId) {
            // Actualizar post con ID del mensaje de Telegram
            await prisma.post.update({
              where: { id: post.id },
              data: {
                telegramMessageId: messageId,
                status: 'PENDING_APPROVAL'
              }
            });

            results.push({
              postId: post.id,
              platform,
              status: 'PENDING_APPROVAL',
              telegramMessageId: messageId
            });
          } else {
            // Si falla Telegram, marcar para publicación automática
            await prisma.post.update({
              where: { id: post.id },
              data: {
                approvalStatus: 'AUTO_APPROVED',
                status: 'SCHEDULED'
              }
            });

            results.push({
              postId: post.id,
              platform,
              status: 'SCHEDULED'
            });
          }
        } else {
          // Auto-aprobar y programar
          await prisma.post.update({
            where: { id: post.id },
            data: {
              approvalStatus: 'AUTO_APPROVED',
              status: 'SCHEDULED',
              scheduledFor: this.getNextScheduledTime()
            }
          });

          results.push({
            postId: post.id,
            platform,
            status: 'SCHEDULED'
          });
        }
      } catch (error) {
        console.error(`Error generando post para ${platform}:`, error);
      }
    }

    return results;
  }

  /**
   * Publica un post aprobado
   */
  async publishPost(postId: string): Promise<void> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true,
        newsItem: true
      }
    });

    if (!post) {
      throw new Error('Post no encontrado');
    }

    // Verificar que esté aprobado
    if (post.approvalStatus !== 'APPROVED' && post.approvalStatus !== 'AUTO_APPROVED') {
      throw new Error('El post no está aprobado para publicación');
    }

    try {
      // Actualizar estado a PUBLISHING
      await prisma.post.update({
        where: { id: postId },
        data: { status: 'PUBLISHING' }
      });

      let postUrl = '';

      // Publicar según la plataforma
      if (post.platform === 'LINKEDIN') {
        await this.publishToLinkedIn(post);
        postUrl = `https://www.linkedin.com/feed/update/${post.linkedinUrn}`;
      } else if (post.platform === 'TWITTER') {
        await this.publishToTwitter(post);
        postUrl = post.twitterUrl || '';
      }

      // Marcar como publicado
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      });

      // Notificar éxito en Telegram
      if (post.user.telegramEnabled && post.user.telegramChatId) {
        await telegramService.notifyPublicationSuccess(
          post.user.telegramChatId,
          post.platform,
          postUrl
        );
      }

      console.log(`✅ Post ${postId} publicado exitosamente en ${post.platform}`);
    } catch (error: any) {
      // Marcar como fallido
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          retryCount: { increment: 1 }
        }
      });

      // Notificar error en Telegram
      if (post.user.telegramEnabled && post.user.telegramChatId) {
        await telegramService.notifyPublicationError(
          post.user.telegramChatId,
          post.platform,
          error.message
        );
      }

      console.error(`❌ Error publicando post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Publica en LinkedIn
   */
  private async publishToLinkedIn(post: any): Promise<void> {
    const user = post.user;

    // Verificar token
    if (!user.linkedinAccessToken || !user.linkedinUserId) {
      throw new Error('Usuario no tiene LinkedIn conectado');
    }

    // Verificar si el token está expirado
    if (user.linkedinTokenExpiry && new Date(user.linkedinTokenExpiry) < new Date()) {
      // Intentar refrescar
      if (user.linkedinRefreshToken) {
        const tokens = await linkedinService.refreshAccessToken(user.linkedinRefreshToken);
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            linkedinAccessToken: tokens.accessToken,
            linkedinTokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000)
          }
        });

        user.linkedinAccessToken = tokens.accessToken;
      } else {
        throw new Error('Token de LinkedIn expirado');
      }
    }

    // Publicar
    const result = await linkedinService.publishPost(
      user.linkedinAccessToken,
      user.linkedinUserId,
      {
        content: post.content,
        hashtags: post.hashtags
      }
    );

    // Actualizar post con datos de LinkedIn
    await prisma.post.update({
      where: { id: post.id },
      data: {
        linkedinPostId: result.id,
        linkedinUrn: result.urn
      }
    });
  }

  /**
   * Publica en Twitter
   */
  private async publishToTwitter(post: any): Promise<void> {
    const user = post.user;

    // Verificar token
    if (!user.twitterAccessToken || !user.twitterUserId) {
      throw new Error('Usuario no tiene Twitter conectado');
    }

    // Verificar si el token está expirado
    if (user.twitterTokenExpiry && new Date(user.twitterTokenExpiry) < new Date()) {
      // Intentar refrescar
      if (user.twitterRefreshToken) {
        const tokens = await twitterService.refreshAccessToken(user.twitterRefreshToken);
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twitterAccessToken: tokens.accessToken,
            twitterRefreshToken: tokens.refreshToken,
            twitterTokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000)
          }
        });

        user.twitterAccessToken = tokens.accessToken;
      } else {
        throw new Error('Token de Twitter expirado');
      }
    }

    // Publicar
    const result = await twitterService.publishTweet(
      user.twitterAccessToken,
      { text: post.content }
    );

    // Actualizar post con datos de Twitter
    await prisma.post.update({
      where: { id: post.id },
      data: {
        twitterPostId: result.id,
        twitterUrl: result.url
      }
    });
  }

  /**
   * Procesa posts aprobados pendientes de publicación
   */
  async processApprovedPosts(): Promise<void> {
    // Obtener posts aprobados que están programados para ahora o antes
    const approvedPosts = await prisma.post.findMany({
      where: {
        status: 'SCHEDULED',
        approvalStatus: {
          in: ['APPROVED', 'AUTO_APPROVED']
        },
        scheduledFor: {
          lte: new Date()
        }
      },
      include: {
        user: true
      }
    });

    console.log(`📤 Procesando ${approvedPosts.length} posts aprobados...`);

    for (const post of approvedPosts) {
      try {
        await this.publishPost(post.id);
      } catch (error) {
        console.error(`Error publicando post ${post.id}:`, error);
      }
    }
  }

  /**
   * Marca posts pendientes de aprobación como expirados
   */
  async expirePendingApprovals(): Promise<void> {
    const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas

    const expiredPosts = await prisma.post.updateMany({
      where: {
        status: 'PENDING_APPROVAL',
        createdAt: {
          lt: expirationTime
        }
      },
      data: {
        approvalStatus: 'EXPIRED',
        status: 'CANCELLED'
      }
    });

    if (expiredPosts.count > 0) {
      console.log(`⏰ ${expiredPosts.count} posts marcados como expirados`);
    }
  }

  /**
   * Obtiene el próximo horario de publicación
   */
  private getNextScheduledTime(): Date {
    const now = new Date();
    const preferredHours = [9, 14, 18]; // 9 AM, 2 PM, 6 PM
    
    const currentHour = now.getHours();
    
    // Encontrar el próximo horario preferido
    let nextHour = preferredHours.find(h => h > currentHour);
    
    if (!nextHour) {
      // Si ya pasaron todos los horarios de hoy, usar el primero de mañana
      nextHour = preferredHours[0];
      now.setDate(now.getDate() + 1);
    }
    
    now.setHours(nextHour, 0, 0, 0);
    
    return now;
  }

  /**
   * Genera automáticamente posts para todos los tópicos activos
   */
  async autoGeneratePosts(): Promise<void> {
    console.log('🤖 Iniciando generación automática de posts...');

    // Obtener todos los usuarios con tópicos activos
    const users = await prisma.user.findMany({
      where: {
        topics: {
          some: {
            isActive: true
          }
        }
      },
      include: {
        topics: {
          where: { isActive: true },
          include: {
            newsItems: {
              where: {
                isProcessed: false,
                relevanceScore: {
                  gte: 70 // Solo noticias muy relevantes
                }
              },
              orderBy: {
                relevanceScore: 'desc'
              },
              take: 1 // Una noticia por tópico
            }
          }
        }
      }
    });

    for (const user of users) {
      for (const topic of user.topics) {
        if (topic.newsItems.length === 0) continue;

        const newsItem = topic.newsItems[0];

        try {
          await this.generatePostsFromNews({
            newsItemId: newsItem.id,
            userId: user.id,
            platforms: topic.platforms,
            requireApproval: !user.autoPublishEnabled
          });

          // Marcar noticia como procesada
          await prisma.newsItem.update({
            where: { id: newsItem.id },
            data: { isProcessed: true }
          });

          console.log(`✅ Posts generados para tópico "${topic.name}" del usuario ${user.email}`);
        } catch (error) {
          console.error(`Error generando posts para tópico ${topic.id}:`, error);
        }
      }
    }
  }
}

export default new PostOrchestratorService();
