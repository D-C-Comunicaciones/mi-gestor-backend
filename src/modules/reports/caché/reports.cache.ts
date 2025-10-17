import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class ReportsCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly ttl = 1000 * 60 * 30; // 30 minutos

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, value: T, ttl?: number) {
    const expiresAt = Date.now() + (ttl ?? this.ttl);
    this.cache.set(key, { data: value, expiresAt });
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}
