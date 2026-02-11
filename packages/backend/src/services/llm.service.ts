// packages/backend/src/services/llm.service.ts
// Adaptado para Railway - Usa Groq API en lugar de Ollama

import axios from 'axios';

interface NewsContent {
  title: string;
  description: string;
  url: string;
  content?: string;
}

interface GeneratedPost {
  content: string;
  hashtags: string[];
}

export class LLMService {
  private provider: 'groq' | 'ollama';
  private groqApiKey: string;
  private groqUrl: string = 'https://api.groq.com/openai/v1';
  private ollamaUrl: string;
  private model: string;

  constructor() {
    // Determinar proveedor basado en configuración
    this.provider = (process.env.LLM_PROVIDER as 'groq' | 'ollama') || 'groq';
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    
    // Modelos según proveedor
    if (this.provider === 'groq') {
      this.model = process.env.LLM_MODEL || 'llama-3.1-70b-versatile';
    } else {
      this.model = process.env.LLM_MODEL || 'llama3.1';
    }
  }

  /**
   * Genera un post de LinkedIn a partir de una noticia
   */
  async generateLinkedInPost(news: NewsContent, userPreferences?: any): Promise<GeneratedPost> {
    const prompt = this.buildPrompt(news, userPreferences);
    
    try {
      const response = this.provider === 'groq' 
        ? await this.callGroq(prompt)
        : await this.callOllama(prompt);
        
      return this.parseResponse(response);
    } catch (error) {
      console.error('Error generando post con LLM:', error);
      throw new Error('No se pudo generar el post');
    }
  }

  /**
   * Construye el prompt optimizado para generar posts de LinkedIn
   */
  private buildPrompt(news: NewsContent, preferences?: any): string {
    const tone = preferences?.tone || 'profesional pero cercano';
    const maxWords = preferences?.maxWords || 250;
    
    return `Eres un experto en marketing de contenidos y creador de posts para LinkedIn. 
Tu objetivo es crear posts atractivos, profesionales y que generen engagement.

NOTICIA:
Título: ${news.title}
Descripción: ${news.description}
URL: ${news.url}
${news.content ? `Contenido adicional: ${news.content.substring(0, 500)}...` : ''}

INSTRUCCIONES:
1. Crea un post de LinkedIn de ${maxWords} palabras máximo
2. Comienza con un hook impactante que capture la atención
3. Usa un tono ${tone}
4. Estructura el contenido en 3-4 párrafos cortos
5. Incluye insights, aprendizajes clave o implicaciones de la noticia
6. Termina con una pregunta o call-to-action que invite al debate
7. NO uses emojis excesivamente (máximo 2-3 en total)
8. Escribe en español
9. NO incluyas hashtags en el cuerpo del post

FORMATO DE SALIDA (IMPORTANTE):
Responde ÚNICAMENTE en el siguiente formato JSON:
{
  "content": "El contenido completo del post aquí",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

Genera exactamente 5 hashtags relevantes para la noticia.
NO incluyas texto adicional fuera del JSON.`;
  }

  /**
   * Llama a Groq API para generar texto
   */
  private async callGroq(prompt: string): Promise<string> {
    if (!this.groqApiKey) {
      throw new Error('GROQ_API_KEY no configurada. Obtén una gratis en console.groq.com');
    }

    try {
      const response = await axios.post(
        `${this.groqUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'Eres un experto en marketing de contenidos para LinkedIn. Siempre respondes en formato JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Límite de rate de Groq alcanzado. Espera un momento.');
      }
      if (error.response?.status === 401) {
        throw new Error('API Key de Groq inválida. Verifica tu configuración.');
      }
      console.error('Error llamando a Groq:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Llama a Ollama para generar texto (para uso local)
   */
  private async callOllama(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
          }
        },
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.response;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('No se puede conectar con Ollama. Asegúrate de que esté corriendo.');
      }
      throw error;
    }
  }

  /**
   * Parsea la respuesta del LLM extrayendo el JSON
   */
  private parseResponse(response: string): GeneratedPost {
    try {
      // Intentar extraer JSON del texto
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return this.createFallbackPost(response);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.content || !parsed.hashtags) {
        return this.createFallbackPost(response);
      }

      // Limpiar hashtags
      const cleanHashtags = parsed.hashtags.map((tag: string) => 
        tag.replace(/^#/, '').trim()
      );

      return {
        content: parsed.content.trim(),
        hashtags: cleanHashtags.slice(0, 5)
      };
    } catch (error) {
      console.error('Error parseando respuesta LLM:', error);
      return this.createFallbackPost(response);
    }
  }

  /**
   * Crea un post fallback cuando el parsing falla
   */
  private createFallbackPost(response: string): GeneratedPost {
    const hashtagRegex = /#(\w+)/g;
    const foundHashtags = [];
    let match;
    
    while ((match = hashtagRegex.exec(response)) !== null) {
      foundHashtags.push(match[1]);
    }

    const content = response.replace(hashtagRegex, '').trim();

    return {
      content: content || response,
      hashtags: foundHashtags.length > 0 
        ? foundHashtags.slice(0, 5) 
        : ['LinkedIn', 'Noticias', 'Actualidad', 'Tendencias', 'Innovación']
    };
  }

  /**
   * Calcula el score de relevancia de una noticia usando LLM
   */
  async calculateRelevanceScore(
    news: NewsContent, 
    topicKeywords: string[]
  ): Promise<number> {
    const prompt = `Eres un analista de contenido. Evalúa qué tan relevante es esta noticia para los siguientes temas de interés.

NOTICIA:
Título: ${news.title}
Descripción: ${news.description}

TEMAS DE INTERÉS (palabras clave):
${topicKeywords.join(', ')}

INSTRUCCIONES:
1. Analiza la relevancia de la noticia respecto a los temas
2. Responde ÚNICAMENTE con un número del 0 al 100
   - 0: Completamente irrelevante
   - 50: Moderadamente relevante
   - 100: Extremadamente relevante
3. NO incluyas explicaciones, solo el número

RESPUESTA:`;

    try {
      const response = this.provider === 'groq'
        ? await this.callGroq(prompt)
        : await this.callOllama(prompt);
        
      const score = parseInt(response.trim());
      
      if (isNaN(score) || score < 0 || score > 100) {
        return 50;
      }
      
      return score;
    } catch (error) {
      console.error('Error calculando relevancia:', error);
      return 50;
    }
  }

  /**
   * Analiza el sentimiento de una noticia
   */
  async analyzeSentiment(news: NewsContent): Promise<'positive' | 'neutral' | 'negative'> {
    const prompt = `Analiza el sentimiento de esta noticia:

Título: ${news.title}
Descripción: ${news.description}

Responde ÚNICAMENTE con una palabra: positive, neutral, o negative`;

    try {
      const response = this.provider === 'groq'
        ? await this.callGroq(prompt)
        : await this.callOllama(prompt);
        
      const sentiment = response.trim().toLowerCase();
      
      if (sentiment.includes('positive')) return 'positive';
      if (sentiment.includes('negative')) return 'negative';
      return 'neutral';
    } catch (error) {
      return 'neutral';
    }
  }

  /**
   * Genera variaciones de un post para A/B testing
   */
  async generatePostVariations(
    news: NewsContent, 
    count: number = 3
  ): Promise<GeneratedPost[]> {
    const variations: GeneratedPost[] = [];
    
    const tones = [
      'profesional y formal',
      'cercano y conversacional',
      'inspirador y motivador'
    ];

    for (let i = 0; i < Math.min(count, tones.length); i++) {
      try {
        const post = await this.generateLinkedInPost(news, { tone: tones[i] });
        variations.push(post);
      } catch (error) {
        console.error(`Error generando variación ${i + 1}:`, error);
      }
    }

    return variations;
  }

  /**
   * Mejora un post existente
   */
  async improvePost(originalPost: string): Promise<GeneratedPost> {
    const prompt = `Eres un experto en marketing de contenidos de LinkedIn. Mejora el siguiente post para aumentar el engagement:

POST ORIGINAL:
${originalPost}

INSTRUCCIONES:
1. Mantén la idea principal pero hazlo más atractivo
2. Mejora el hook inicial
3. Optimiza la estructura
4. Añade un mejor call-to-action
5. Máximo 250 palabras

FORMATO DE SALIDA (JSON):
{
  "content": "El post mejorado aquí",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`;

    try {
      const response = this.provider === 'groq'
        ? await this.callGroq(prompt)
        : await this.callOllama(prompt);
        
      return this.parseResponse(response);
    } catch (error) {
      throw new Error('No se pudo mejorar el post');
    }
  }

  /**
   * Verifica la salud del servicio LLM
   */
  async checkHealth(): Promise<boolean> {
    try {
      if (this.provider === 'groq') {
        // Test simple con Groq
        const response = await axios.post(
          `${this.groqUrl}/chat/completions`,
          {
            model: this.model,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 5
          },
          {
            headers: {
              'Authorization': `Bearer ${this.groqApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          }
        );
        return response.status === 200;
      } else {
        // Test con Ollama
        const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
          timeout: 5000
        });
        return response.status === 200;
      }
    } catch (error) {
      console.error('LLM health check failed:', error);
      return false;
    }
  }

  /**
   * Obtiene información sobre el proveedor actual
   */
  getProviderInfo(): {
    provider: string;
    model: string;
    status: string;
  } {
    return {
      provider: this.provider,
      model: this.model,
      status: this.provider === 'groq' && this.groqApiKey ? 'configured' : 
              this.provider === 'ollama' ? 'local' : 'not configured'
    };
  }
}

export default new LLMService();
