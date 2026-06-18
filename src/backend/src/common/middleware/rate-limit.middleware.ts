import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

// Request counter per IP — use Redis-backed ThrottlerGuard in production for distributed rate limiting
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();

    const record = requestCounts.get(ip);
    if (!record || record.resetAt < now) {
      requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return next();
    }

    record.count += 1;
    if (record.count > MAX_REQUESTS) {
      res.status(429).json({
        statusCode: 429,
        message: 'Too many requests',
        resetAt: new Date(record.resetAt).toISOString(),
      });
      return;
    }

    next();
  }
}
