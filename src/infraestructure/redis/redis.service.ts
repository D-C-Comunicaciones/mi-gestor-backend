import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';

export interface RedisModuleOptions {
  host: string;
  port: number;
  password?: string;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: RedisClient;

  constructor(
    @Inject('REDIS_OPTIONS') private readonly options: RedisModuleOptions,
  ) {
    this.client = new Redis({
      host: options.host,
      port: options.port,
      password: options.password,
    });
    // Conexión diferida
    this.client.connect().catch((err) => {
      // Log básico (sustituir por logger centralizado)
      console.error('Redis connection error:', err.message);
    });
  }

  getClient(): RedisClient {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      return this.client.set(key, value, 'EX', ttlSeconds);
    }
    return this.client.set(key, value);
  }

  async del(key: string | string[]) {
    return this.client.del(Array.isArray(key) ? key : [key]);
  }

  async publish(channel: string, message: string) {
    return this.client.publish(channel, message);
  }

  async subscribe(channel: string, listener: (message: string) => void) {
    const sub = new Redis(this.client.options);
    await sub.subscribe(channel);
    sub.on('message', (_ch, msg) => listener(msg));
    return sub;
  }

  async onModuleDestroy() {
    if (this.client.status !== 'end') {
      await this.client.quit();
    }
  }
}
