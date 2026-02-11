// packages/backend/src/lib/redis.ts
import { createClient } from 'redis';

class RedisClient {
  private client: ReturnType<typeof createClient> | null = null;
  private isConnecting = false;

  async getClient() {
    if (this.client && this.client.isOpen) {
      return this.client;
    }

    if (this.isConnecting) {
      // Esperar a que termine la conexión actual
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getClient();
    }

    this.isConnecting = true;

    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('✅ Redis conectado');
      });

      await this.client.connect();
      this.isConnecting = false;
      return this.client;
    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Error conectando a Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
      this.client = null;
    }
  }
}

export default new RedisClient();
