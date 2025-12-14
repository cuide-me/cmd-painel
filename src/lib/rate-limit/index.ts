import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api/errors';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  remaining?: number;
  limit: number;
  windowMs: number;
  key: string;
}

export interface RateLimiter {
  consume(key: string): RateLimitResult;
}

class InMemoryRateLimiter implements RateLimiter {
  private store = new Map<string, { count: number; windowStart: number }>();
  constructor(
    private windowMs: number,
    private max: number
  ) {}
  consume(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || now - entry.windowStart > this.windowMs) {
      this.store.set(key, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: this.max - 1,
        limit: this.max,
        windowMs: this.windowMs,
        key,
      };
    }
    entry.count += 1;
    if (entry.count > this.max) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((entry.windowStart + this.windowMs - now) / 1000),
        remaining: 0,
        limit: this.max,
        windowMs: this.windowMs,
        key,
      };
    }
    return {
      allowed: true,
      remaining: this.max - entry.count,
      limit: this.max,
      windowMs: this.windowMs,
      key,
    };
  }
}

let globalLimiter: RateLimiter | null = null;
const routeLimiters = new Map<string, RateLimiter>();

/**
 * Configurações de rate limit por padrão de rota
 * Rotas mais específicas devem vir antes das genéricas
 */
export const ROUTE_RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/auth/login': { max: 5, windowMs: 60_000 }, // 5 tentativas/min
  '/api/auth/register': { max: 3, windowMs: 60_000 }, // 3 registros/min
  '/api/payments/': { max: 10, windowMs: 60_000 }, // 10 pagamentos/min
  '/api/admin/': { max: 100, windowMs: 60_000 }, // 100 req/min para admin
  '/api/': { max: 50, windowMs: 60_000 }, // 50 req/min para outras APIs
};

export function getRateLimiter(): RateLimiter {
  if (globalLimiter) return globalLimiter;
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const max = Number(process.env.RATE_LIMIT_MAX ?? 5);
  globalLimiter = new InMemoryRateLimiter(windowMs, max);
  return globalLimiter;
}

/**
 * Obtém rate limiter específico para uma rota
 */
export function getRateLimiterForRoute(pathname: string): RateLimiter {
  // Encontra a configuração mais específica que corresponde ao pathname
  let matchedConfig = { max: 50, windowMs: 60_000 }; // Default
  let matchedPattern = '';

  for (const [pattern, config] of Object.entries(ROUTE_RATE_LIMITS)) {
    if (pathname.startsWith(pattern) && pattern.length > matchedPattern.length) {
      matchedConfig = config;
      matchedPattern = pattern;
    }
  }

  const key = `route:${matchedPattern || 'default'}`;
  let limiter = routeLimiters.get(key);

  if (!limiter) {
    limiter = new InMemoryRateLimiter(matchedConfig.windowMs, matchedConfig.max);
    routeLimiters.set(key, limiter);
  }

  return limiter;
}

export function enforceRateLimit(key: string, pathname?: string): NextResponse | null {
  const limiter = pathname ? getRateLimiterForRoute(pathname) : getRateLimiter();
  const res = limiter.consume(key);
  if (!res.allowed) {
    const response = errorResponse(429, 'rate_limited', 'Limite de requisições excedido', {
      retryAfterSeconds: res.retryAfterSeconds,
      limit: res.limit,
      windowMs: res.windowMs,
      key: res.key,
    });
    if (res.retryAfterSeconds) {
      response.headers.set('Retry-After', res.retryAfterSeconds.toString());
    }
    return response;
  }
  return null;
}
