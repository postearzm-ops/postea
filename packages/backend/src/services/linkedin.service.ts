// packages/backend/src/services/linkedin.service.ts

import axios from 'axios';

interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
}

interface PostData {
  content: string;
  hashtags?: string[];
  imageUrl?: string;
}

interface LinkedInPostResponse {
  id: string;
  urn: string;
}

export class LinkedInService {
  private readonly apiBaseUrl = 'https://api.linkedin.com/v2';
  
  /**
   * Intercambia el código de autorización por tokens de acceso
   */
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        null,
        {
          params: {
            grant_type: 'authorization_code',
            code: code,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error: any) {
      console.error('Error intercambiando código por tokens:', error.response?.data);
      throw new Error('No se pudo obtener el token de acceso de LinkedIn');
    }
  }

  /**
   * Refresca el token de acceso usando el refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await axios.post(
        'https://www.linkedin.com/oauth/v2/accessToken',
        null,
        {
          params: {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          },
        }
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in,
      };
    } catch (error) {
      throw new Error('No se pudo refrescar el token de acceso');
    }
  }

  /**
   * Obtiene el perfil del usuario de LinkedIn
   */
  async getUserProfile(accessToken: string): Promise<LinkedInProfile> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        id: response.data.id,
        firstName: response.data.localizedFirstName || response.data.firstName?.localized?.en_US,
        lastName: response.data.localizedLastName || response.data.lastName?.localized?.en_US,
      };
    } catch (error) {
      throw new Error('No se pudo obtener el perfil de LinkedIn');
    }
  }

  /**
   * Publica un post de texto en LinkedIn
   */
  async publishPost(
    accessToken: string,
    linkedinUserId: string,
    postData: PostData
  ): Promise<LinkedInPostResponse> {
    try {
      // Preparar el contenido con hashtags
      let fullContent = postData.content;
      
      if (postData.hashtags && postData.hashtags.length > 0) {
        const hashtagsFormatted = postData.hashtags
          .map(tag => `#${tag.replace(/^#/, '')}`)
          .join(' ');
        fullContent = `${postData.content}\n\n${hashtagsFormatted}`;
      }

      // Estructura del post según LinkedIn API v2
      const postPayload = {
        author: `urn:li:person:${linkedinUserId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: fullContent,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await axios.post(
        `${this.apiBaseUrl}/ugcPosts`,
        postPayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      return {
        id: response.data.id,
        urn: response.headers['x-restli-id'] || response.data.id,
      };
    } catch (error: any) {
      console.error('Error publicando en LinkedIn:', error.response?.data);
      
      if (error.response?.status === 401) {
        throw new Error('Token de LinkedIn expirado o inválido');
      }
      
      throw new Error('No se pudo publicar el post en LinkedIn');
    }
  }

  /**
   * Publica un post con imagen en LinkedIn
   */
  async publishPostWithImage(
    accessToken: string,
    linkedinUserId: string,
    postData: PostData
  ): Promise<LinkedInPostResponse> {
    try {
      if (!postData.imageUrl) {
        throw new Error('URL de imagen requerida');
      }

      // 1. Registrar la imagen
      const registerResponse = await this.registerImage(accessToken, linkedinUserId);
      const uploadUrl = registerResponse.uploadUrl;
      const asset = registerResponse.asset;

      // 2. Subir la imagen
      await this.uploadImage(uploadUrl, postData.imageUrl);

      // 3. Crear el post con la imagen
      let fullContent = postData.content;
      
      if (postData.hashtags && postData.hashtags.length > 0) {
        const hashtagsFormatted = postData.hashtags
          .map(tag => `#${tag.replace(/^#/, '')}`)
          .join(' ');
        fullContent = `${postData.content}\n\n${hashtagsFormatted}`;
      }

      const postPayload = {
        author: `urn:li:person:${linkedinUserId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: fullContent,
            },
            shareMediaCategory: 'IMAGE',
            media: [
              {
                status: 'READY',
                media: asset,
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await axios.post(
        `${this.apiBaseUrl}/ugcPosts`,
        postPayload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      return {
        id: response.data.id,
        urn: response.headers['x-restli-id'] || response.data.id,
      };
    } catch (error) {
      throw new Error('No se pudo publicar el post con imagen en LinkedIn');
    }
  }

  /**
   * Registra una imagen para subir
   */
  private async registerImage(
    accessToken: string,
    linkedinUserId: string
  ): Promise<{ uploadUrl: string; asset: string }> {
    const registerPayload = {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: `urn:li:person:${linkedinUserId}`,
        serviceRelationships: [
          {
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          },
        ],
      },
    };

    const response = await axios.post(
      `${this.apiBaseUrl}/assets?action=registerUpload`,
      registerPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      uploadUrl: response.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl,
      asset: response.data.value.asset,
    };
  }

  /**
   * Sube una imagen a LinkedIn
   */
  private async uploadImage(uploadUrl: string, imageUrl: string): Promise<void> {
    // Descargar la imagen
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });

    // Subir a LinkedIn
    await axios.put(uploadUrl, imageResponse.data, {
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });
  }

  /**
   * Obtiene estadísticas de un post
   */
  async getPostStatistics(
    accessToken: string,
    postUrn: string
  ): Promise<{
    impressions: number;
    reactions: number;
    comments: number;
    shares: number;
  }> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/socialActions/${postUrn}/likes`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Nota: Esta es una implementación simplificada
      // LinkedIn API tiene endpoints específicos para diferentes métricas
      return {
        impressions: 0, // Requiere LinkedIn Analytics API
        reactions: response.data.paging?.total || 0,
        comments: 0, // Requiere endpoint separado
        shares: 0, // Requiere endpoint separado
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas del post:', error);
      return {
        impressions: 0,
        reactions: 0,
        comments: 0,
        shares: 0,
      };
    }
  }

  /**
   * Elimina un post de LinkedIn
   */
  async deletePost(accessToken: string, postUrn: string): Promise<void> {
    try {
      await axios.delete(`${this.apiBaseUrl}/ugcPosts/${postUrn}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      throw new Error('No se pudo eliminar el post de LinkedIn');
    }
  }

  /**
   * Genera la URL de autorización de LinkedIn
   */
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI!,
      state: state,
      scope: 'w_member_social r_liteprofile',
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Verifica si un token de acceso es válido
   */
  async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      await this.getUserProfile(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new LinkedInService();
