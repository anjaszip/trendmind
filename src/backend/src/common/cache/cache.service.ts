import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const CACHE_TTLS = {
  TREND_DATA: 3600,
  PREDICTION_SCORES: 1800,
  AI_INSIGHTS: 86400,
  DASHBOARD: 1800,
} as const;

@Injectable()
export class CacheService {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD'),
      db: configService.get<number>('REDIS_CACHE_DB', 0),
      lazyConnect: true,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async invalidate(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return;
    const pipeline = this.redis.pipeline();
    for (const key of keys) {
      pipeline.del(key);
    }
    await pipeline.exec();
  }
}
