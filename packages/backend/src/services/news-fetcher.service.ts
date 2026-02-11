// packages/backend/src/services/news-fetcher.service.ts

import axios from 'axios';
import Parser from 'rss-parser';

interface NewsArticle {
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage?: string;
  source: string;
  author?: string;
  publishedAt: Date;
}

interface FetchNewsParams {
  keywords: string[];
  language?: string;
  fromDate?: Date;
  pageSize?: number;
}

export class NewsFetcherService {
  private newsApiKey: string;
  private gNewsApiKey: string;
  private rssParser: Parser;

  constructor() {
    this.newsApiKey = process.env.NEWSAPI_KEY || '';
    this.gNewsApiKey = process.env.GNEWS_KEY || '';
    this.rssParser = new Parser({
      customFields: {
        item: ['media:content', 'content:encoded']
      }
    });
  }

  /**
   * Obtiene noticias de múltiples fuentes
   */
  async fetchNews(params: FetchNewsParams): Promise<NewsArticle[]> {
    const allNews: NewsArticle[] = [];

    // Obtener de diferentes fuentes en paralelo
    const sources = await Promise.allSettled([
      this.fetchFromNewsAPI(params),
      this.fetchFromGNews(params),
      this.fetchFromRSS(params),
    ]);

    // Combinar resultados exitosos
    sources.forEach(result => {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      } else {
        console.error('Error fetching from source:', result.reason);
      }
    });

    // Eliminar duplicados basados en URL
    const uniqueNews = this.removeDuplicates(allNews);

    // Ordenar por fecha de publicación (más reciente primero)
    return uniqueNews.sort((a, b) => 
      b.publishedAt.getTime() - a.publishedAt.getTime()
    );
  }

  /**
   * Obtiene noticias de NewsAPI.org
   */
  private async fetchFromNewsAPI(params: FetchNewsParams): Promise<NewsArticle[]> {
    if (!this.newsApiKey) {
      console.warn('NewsAPI key no configurada');
      return [];
    }

    try {
      const query = params.keywords.join(' OR ');
      const language = params.language || 'es';
      const pageSize = params.pageSize || 20;
      
      const fromDate = params.fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const from = fromDate.toISOString().split('T')[0];

      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: query,
          language,
          from,
          pageSize,
          sortBy: 'publishedAt',
          apiKey: this.newsApiKey,
        },
        timeout: 10000,
      });

      return response.data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || '',
        content: article.content,
        url: article.url,
        urlToImage: article.urlToImage,
        source: article.source?.name || 'NewsAPI',
        author: article.author,
        publishedAt: new Date(article.publishedAt),
      }));
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.error('NewsAPI rate limit excedido');
      } else {
        console.error('Error fetching from NewsAPI:', error.message);
      }
      return [];
    }
  }

  /**
   * Obtiene noticias de GNews API
   */
  private async fetchFromGNews(params: FetchNewsParams): Promise<NewsArticle[]> {
    if (!this.gNewsApiKey) {
      console.warn('GNews API key no configurada');
      return [];
    }

    try {
      const query = params.keywords.join(' OR ');
      const language = params.language || 'es';
      const max = params.pageSize || 10;

      const response = await axios.get('https://gnews.io/api/v4/search', {
        params: {
          q: query,
          lang: language,
          max,
          apikey: this.gNewsApiKey,
          sortby: 'publishedAt',
        },
        timeout: 10000,
      });

      return response.data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || '',
        content: article.content,
        url: article.url,
        urlToImage: article.image,
        source: article.source?.name || 'GNews',
        author: null,
        publishedAt: new Date(article.publishedAt),
      }));
    } catch (error: any) {
      console.error('Error fetching from GNews:', error.message);
      return [];
    }
  }

  /**
   * Obtiene noticias de feeds RSS
   */
  private async fetchFromRSS(params: FetchNewsParams): Promise<NewsArticle[]> {
    const rssFeeds = this.getRSSFeedsForKeywords(params.keywords);
    const allArticles: NewsArticle[] = [];

    for (const feedUrl of rssFeeds) {
      try {
        const feed = await this.rssParser.parseURL(feedUrl);
        
        const articles = feed.items
          .filter(item => {
            // Filtrar por fecha si se especifica
            if (params.fromDate && item.pubDate) {
              return new Date(item.pubDate) >= params.fromDate;
            }
            return true;
          })
          .map(item => ({
            title: item.title || '',
            description: item.contentSnippet || item.description || '',
            content: item['content:encoded'] || item.content,
            url: item.link || '',
            urlToImage: this.extractImageFromItem(item),
            source: feed.title || 'RSS Feed',
            author: item.creator || item.author,
            publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          }));

        allArticles.push(...articles);
      } catch (error) {
        console.error(`Error parsing RSS feed ${feedUrl}:`, error);
      }
    }

    return allArticles;
  }

  /**
   * Obtiene feeds RSS relevantes basados en keywords
   */
  private getRSSFeedsForKeywords(keywords: string[]): string[] {
    const feeds: string[] = [];

    // Google News RSS
    keywords.forEach(keyword => {
      const encodedKeyword = encodeURIComponent(keyword);
      feeds.push(`https://news.google.com/rss/search?q=${encodedKeyword}&hl=es&gl=ES&ceid=ES:es`);
    });

    // Feeds RSS genéricos de tecnología (español)
    feeds.push(
      'https://www.xataka.com/index.xml',
      'https://www.genbeta.com/index.xml',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada',
      'https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml'
    );

    return feeds;
  }

  /**
   * Extrae imagen de un item RSS
   */
  private extractImageFromItem(item: any): string | undefined {
    // Intentar extraer de diferentes campos
    if (item.enclosure?.url) {
      return item.enclosure.url;
    }
    
    if (item['media:content']?.$?.url) {
      return item['media:content'].$.url;
    }

    // Intentar extraer de content HTML
    if (item.content) {
      const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) {
        return imgMatch[1];
      }
    }

    return undefined;
  }

  /**
   * Elimina noticias duplicadas
   */
  private removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      const normalized = this.normalizeUrl(article.url);
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
  }

  /**
   * Normaliza URLs para comparación
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remover parámetros de tracking
      urlObj.searchParams.delete('utm_source');
      urlObj.searchParams.delete('utm_medium');
      urlObj.searchParams.delete('utm_campaign');
      return urlObj.toString().toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  }

  /**
   * Filtra noticias por relevancia usando palabras clave
   */
  filterByRelevance(articles: NewsArticle[], keywords: string[]): NewsArticle[] {
    return articles.filter(article => {
      const searchText = `${article.title} ${article.description}`.toLowerCase();
      
      // Al menos una keyword debe aparecer
      return keywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
    });
  }

  /**
   * Obtiene noticias trending (más populares)
   */
  async fetchTrendingNews(
    category?: string,
    language: string = 'es'
  ): Promise<NewsArticle[]> {
    if (!this.newsApiKey) {
      return [];
    }

    try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: {
          category,
          language,
          pageSize: 20,
          apiKey: this.newsApiKey,
        },
        timeout: 10000,
      });

      return response.data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || '',
        content: article.content,
        url: article.url,
        urlToImage: article.urlToImage,
        source: article.source?.name || 'NewsAPI',
        author: article.author,
        publishedAt: new Date(article.publishedAt),
      }));
    } catch (error) {
      console.error('Error fetching trending news:', error);
      return [];
    }
  }

  /**
   * Verifica la salud de las APIs
   */
  async checkAPIsHealth(): Promise<{
    newsApi: boolean;
    gNews: boolean;
  }> {
    const results = {
      newsApi: false,
      gNews: false,
    };

    // Test NewsAPI
    if (this.newsApiKey) {
      try {
        await axios.get('https://newsapi.org/v2/top-headlines', {
          params: {
            country: 'us',
            pageSize: 1,
            apiKey: this.newsApiKey,
          },
          timeout: 5000,
        });
        results.newsApi = true;
      } catch (error) {
        console.error('NewsAPI health check failed');
      }
    }

    // Test GNews
    if (this.gNewsApiKey) {
      try {
        await axios.get('https://gnews.io/api/v4/top-headlines', {
          params: {
            lang: 'en',
            max: 1,
            apikey: this.gNewsApiKey,
          },
          timeout: 5000,
        });
        results.gNews = true;
      } catch (error) {
        console.error('GNews health check failed');
      }
    }

    return results;
  }
}

export default new NewsFetcherService();
