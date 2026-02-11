// packages/backend/src/jobs/scheduler.ts
// Sistema de cron jobs para automatización

import cron from 'node-cron';
import newsFetcherService from '../services/news-fetcher.service';
import llmService from '../services/llm.service';
import postOrchestratorService from '../services/post-orchestrator.service';
import prisma from '../lib/prisma';

class JobScheduler {
  /**
   * Inicializa todos los cron jobs
   */
  init() {
    console.log('📅 Inicializando sistema de cron jobs...');

    // Job 1: Fetch de noticias - cada 4 horas
    cron.schedule(process.env.FETCH_NEWS_CRON || '0 */4 * * *', async () => {
      console.log('📰 [CRON] Iniciando búsqueda de noticias...');
      await this.fetchNewsJob();
    });

    // Job 2: Análisis y generación de posts - cada 6 horas
    cron.schedule(process.env.ANALYZE_NEWS_CRON || '0 */6 * * *', async () => {
      console.log('🤖 [CRON] Iniciando análisis de noticias...');
      await this.analyzeNewsJob();
    });

    // Job 3: Publicación de posts aprobados - cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('📤 [CRON] Procesando posts aprobados...');
      await this.publishApprovedPostsJob();
    });

    // Job 4: Expirar aprobaciones pendientes - cada 6 horas
    cron.schedule('0 */6 * * *', async () => {
      console.log('⏰ [CRON] Expirando aprobaciones pendientes...');
      await this.expirePendingApprovalsJob();
    });

    // Job 5: Actualizar métricas - cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('📊 [CRON] Actualizando métricas...');
      await this.updateMetricsJob();
    });

    // Job 6: Limpieza de datos antiguos - diariamente a las 3 AM
    cron.schedule('0 3 * * *', async () => {
      console.log('🧹 [CRON] Limpiando datos antiguos...');
      await this.cleanupOldDataJob();
    });

    console.log('✅ Sistema de cron jobs iniciado correctamente');
  }

  /**
   * Job: Buscar noticias de todas las fuentes
   */
  private async fetchNewsJob() {
    try {
      // Obtener todos los tópicos activos
      const topics = await prisma.topic.findMany({
        where: { isActive: true },
        include: { user: true }
      });

      console.log(`🔍 Buscando noticias para ${topics.length} tópicos activos...`);

      for (const topic of topics) {
        try {
          // Buscar noticias para este tópico
          const news = await newsFetcherService.fetchNews({
            keywords: topic.keywords,
            language: topic.language,
            fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
            pageSize: 10
          });

          console.log(`  📰 ${news.length} noticias encontradas para "${topic.name}"`);

          // Guardar noticias en la BD
          for (const article of news) {
            // Verificar si ya existe (por URL)
            const existing = await prisma.newsItem.findFirst({
              where: {
                url: article.url,
                topicId: topic.id
              }
            });

            if (!existing) {
              await prisma.newsItem.create({
                data: {
                  topicId: topic.id,
                  title: article.title,
                  description: article.description,
                  content: article.content,
                  url: article.url,
                  urlToImage: article.urlToImage,
                  source: article.source,
                  author: article.author,
                  publishedAt: article.publishedAt,
                  fetchedAt: new Date()
                }
              });
            }
          }
        } catch (error) {
          console.error(`Error buscando noticias para tópico ${topic.id}:`, error);
        }
      }

      console.log('✅ Búsqueda de noticias completada');
    } catch (error) {
      console.error('❌ Error en job de búsqueda de noticias:', error);
    }
  }

  /**
   * Job: Analizar noticias y generar posts
   */
  private async analyzeNewsJob() {
    try {
      // Obtener noticias sin procesar
      const unprocessedNews = await prisma.newsItem.findMany({
        where: {
          isProcessed: false,
          relevanceScore: null // Aún no analizadas
        },
        include: {
          topic: true
        },
        take: 50 // Procesar máximo 50 a la vez
      });

      console.log(`🔬 Analizando ${unprocessedNews.length} noticias...`);

      for (const newsItem of unprocessedNews) {
        try {
          // Calcular score de relevancia
          const relevanceScore = await llmService.calculateRelevanceScore(
            {
              title: newsItem.title,
              description: newsItem.description || '',
              url: newsItem.url
            },
            newsItem.topic.keywords
          );

          // Analizar sentimiento
          const sentiment = await llmService.analyzeSentiment({
            title: newsItem.title,
            description: newsItem.description || '',
            url: newsItem.url
          });

          // Actualizar noticia
          await prisma.newsItem.update({
            where: { id: newsItem.id },
            data: {
              relevanceScore,
              sentiment
            }
          });

          console.log(`  ✓ Noticia analizada: ${newsItem.title.substring(0, 50)}... (score: ${relevanceScore})`);
        } catch (error) {
          console.error(`Error analizando noticia ${newsItem.id}:`, error);
        }
      }

      // Generar posts automáticamente
      await postOrchestratorService.autoGeneratePosts();

      console.log('✅ Análisis de noticias completado');
    } catch (error) {
      console.error('❌ Error en job de análisis:', error);
    }
  }

  /**
   * Job: Publicar posts aprobados
   */
  private async publishApprovedPostsJob() {
    try {
      await postOrchestratorService.processApprovedPosts();
      console.log('✅ Posts aprobados procesados');
    } catch (error) {
      console.error('❌ Error en job de publicación:', error);
    }
  }

  /**
   * Job: Expirar aprobaciones pendientes
   */
  private async expirePendingApprovalsJob() {
    try {
      await postOrchestratorService.expirePendingApprovals();
      console.log('✅ Aprobaciones expiradas procesadas');
    } catch (error) {
      console.error('❌ Error en job de expiración:', error);
    }
  }

  /**
   * Job: Actualizar métricas de posts publicados
   */
  private async updateMetricsJob() {
    try {
      // Obtener posts publicados en las últimas 24 horas
      const recentPosts = await prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        include: { user: true }
      });

      console.log(`📊 Actualizando métricas de ${recentPosts.length} posts...`);

      // TODO: Implementar obtención de métricas de LinkedIn y Twitter
      // Por ahora solo lo registramos

      console.log('✅ Métricas actualizadas');
    } catch (error) {
      console.error('❌ Error en job de métricas:', error);
    }
  }

  /**
   * Job: Limpiar datos antiguos
   */
  private async cleanupOldDataJob() {
    try {
      const retentionDays = parseInt(process.env.NEWS_RETENTION_DAYS || '30');
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      // Eliminar noticias antiguas procesadas
      const deletedNews = await prisma.newsItem.deleteMany({
        where: {
          isProcessed: true,
          fetchedAt: {
            lt: cutoffDate
          }
        }
      });

      // Eliminar logs antiguos
      const deletedLogs = await prisma.systemLog.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 días
          }
        }
      });

      // Eliminar mensajes de Telegram antiguos
      const deletedMessages = await prisma.telegramMessage.deleteMany({
        where: {
          sentAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 días
          }
        }
      });

      console.log(`🧹 Limpieza completada:`);
      console.log(`  - ${deletedNews.count} noticias antiguas`);
      console.log(`  - ${deletedLogs.count} logs antiguos`);
      console.log(`  - ${deletedMessages.count} mensajes de Telegram`);
    } catch (error) {
      console.error('❌ Error en job de limpieza:', error);
    }
  }
}

export default new JobScheduler();
