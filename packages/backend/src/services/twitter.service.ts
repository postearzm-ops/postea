// packages/backend/src/services/twitter.service.ts
// Servicio para integración con Twitter/X API v2

import axios from 'axios';
import crypto from 'crypto';

interface TwitterOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
}

interface TweetData {
  text: string;
}

interface TweetResponse {
  id: string;
  url: string;
}

export class TwitterService {
  private readonly apiBaseUrl = 'https://api.twitter.com/2';
  private readonly oauthUrl = 'https://twitter.com/i/oauth2/authorize';
  private readonly tokenUrl = 'https://api.twitter.com/2/oauth2/token';
  
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private codeVerifier: string = '';

  constructor() {
    this.clientId = process.env.TWITTER_CLIENT_ID || '';
    this.clientSecret = process.env.TWITTER_CLIENT_SECRET || '';
    this.redirectUri = process.env.TWITTER_REDIRECT_URI || '';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️ Twitter OAuth credentials no configuradas');
    }
  }

  /**
   * Genera la URL de autorización OAuth 2.0 PKCE
   */
  generateAuthUrl(state: string): string {
    // Generar code verifier y challenge para PKCE
    this.codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(this.codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state: state,
      scope: 'tweet.read tweet.write users.read offline.access',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    return `${this.oauthUrl}?${params.toString()}`;
  }

  /**
   * Intercambia el código de autorización por tokens
   */
  async exchangeCodeForTokens(code: string): Promise<TwitterOAuthTokens> {
    try {
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        this.tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          code_verifier: this.codeVerifier
        }),
        {
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error: any) {
      console.error('Error intercambiando código por tokens:', error.response?.data);
      throw new Error('No se pudo obtener el token de acceso de Twitter');
    }
  }

  /**
   * Refresca el token de acceso
   */
  async refreshAccessToken(refreshToken: string): Promise<TwitterOAuthTokens> {
    try {
      const basicAuth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        this.tokenUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }),
        {
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      throw new Error('No se pudo refrescar el token de Twitter');
    }
  }

  /**
   * Obtiene información del usuario autenticado
   */
  async getUserInfo(accessToken: string): Promise<TwitterUser> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/users/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return {
        id: response.data.data.id,
        username: response.data.data.username,
        name: response.data.data.name
      };
    } catch (error) {
      throw new Error('No se pudo obtener información del usuario de Twitter');
    }
  }

  /**
   * Publica un tweet
   */
  async publishTweet(
    accessToken: string,
    tweetData: TweetData
  ): Promise<TweetResponse> {
    try {
      // Twitter limita tweets a 280 caracteres (4000 para Twitter Blue)
      // Truncar si es necesario
      let text = tweetData.text;
      if (text.length > 280) {
        text = text.substring(0, 277) + '...';
        console.warn('⚠️ Tweet truncado a 280 caracteres');
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/tweets`,
        { text },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const tweetId = response.data.data.id;
      
      // Obtener el username para construir la URL
      const userInfo = await this.getUserInfo(accessToken);
      
      return {
        id: tweetId,
        url: `https://twitter.com/${userInfo.username}/status/${tweetId}`
      };
    } catch (error: any) {
      console.error('Error publicando tweet:', error.response?.data);
      
      if (error.response?.status === 401) {
        throw new Error('Token de Twitter expirado o inválido');
      }
      
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para publicar tweets');
      }
      
      if (error.response?.data?.errors) {
        const errorMsg = error.response.data.errors[0]?.message || 'Error desconocido';
        throw new Error(`Twitter API: ${errorMsg}`);
      }
      
      throw new Error('No se pudo publicar el tweet');
    }
  }

  /**
   * Publica un tweet con imagen
   */
  async publishTweetWithMedia(
    accessToken: string,
    tweetData: TweetData,
    imageUrl: string
  ): Promise<TweetResponse> {
    try {
      // 1. Descargar la imagen
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });

      // 2. Subir la imagen a Twitter (requiere OAuth 1.0a)
      // Nota: Esto es más complejo y requiere OAuth 1.0a para el upload endpoint
      // Por ahora, publicamos sin imagen
      console.warn('⚠️ Publicación de imágenes en Twitter requiere configuración adicional');
      
      return await this.publishTweet(accessToken, tweetData);
    } catch (error) {
      throw new Error('No se pudo publicar el tweet con imagen');
    }
  }

  /**
   * Elimina un tweet
   */
  async deleteTweet(accessToken: string, tweetId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.apiBaseUrl}/tweets/${tweetId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
    } catch (error) {
      throw new Error('No se pudo eliminar el tweet');
    }
  }

  /**
   * Obtiene métricas de un tweet
   */
  async getTweetMetrics(accessToken: string, tweetId: string): Promise<{
    impressions: number;
    likes: number;
    retweets: number;
    replies: number;
  }> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/tweets/${tweetId}`,
        {
          params: {
            'tweet.fields': 'public_metrics'
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const metrics = response.data.data.public_metrics;

      return {
        impressions: metrics.impression_count || 0,
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0
      };
    } catch (error) {
      console.error('Error obteniendo métricas del tweet:', error);
      return {
        impressions: 0,
        likes: 0,
        retweets: 0,
        replies: 0
      };
    }
  }

  /**
   * Valida si un token de acceso es válido
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      await this.getUserInfo(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Genera un code verifier para PKCE
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Genera un code challenge a partir del verifier
   */
  private generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url');
  }

  /**
   * Formatea contenido para Twitter
   * Twitter tiene límites diferentes que LinkedIn
   */
  formatContentForTwitter(content: string, hashtags: string[]): string {
    let tweetText = content;

    // Agregar hashtags al final
    if (hashtags.length > 0) {
      const hashtagsText = hashtags
        .slice(0, 3) // Máximo 3 hashtags para Twitter
        .map(tag => `#${tag.replace(/^#/, '')}`)
        .join(' ');
      
      tweetText = `${content}\n\n${hashtagsText}`;
    }

    // Asegurar que no exceda 280 caracteres
    if (tweetText.length > 280) {
      // Truncar contenido pero mantener al menos un hashtag
      const mainHashtag = hashtags.length > 0 ? `\n\n#${hashtags[0]}` : '';
      const maxContentLength = 280 - mainHashtag.length - 3; // -3 para "..."
      
      tweetText = content.substring(0, maxContentLength) + '...' + mainHashtag;
    }

    return tweetText;
  }

  /**
   * Verifica el estado del servicio
   */
  async checkHealth(): Promise<boolean> {
    if (!this.clientId || !this.clientSecret) {
      return false;
    }

    // Twitter no tiene un endpoint público de health check
    // Retornamos true si las credenciales están configuradas
    return true;
  }

  /**
   * Obtiene información de la configuración
   */
  getServiceInfo(): {
    configured: boolean;
    clientId: string;
    redirectUri: string;
  } {
    return {
      configured: !!(this.clientId && this.clientSecret),
      clientId: this.clientId ? this.clientId.substring(0, 10) + '...' : 'not configured',
      redirectUri: this.redirectUri
    };
  }
}

export default new TwitterService();
