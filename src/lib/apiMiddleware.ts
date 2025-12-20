/**
 * ═══════════════════════════════════════════════════════════
 * API MIDDLEWARE HELPERS
 * ═══════════════════════════════════════════════════════════
 * Middlewares reutilizáveis para APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, getRequestIdentifier, RateLimitPresets } from './rateLimit';

/**
 * Middleware de rate limiting
 */
export function withRateLimit(
  preset: keyof typeof RateLimitPresets = 'MODERATE'
) {
  return (request: NextRequest) => {
    const identifier = getRequestIdentifier(request);
    const { maxRequests, windowMs } = RateLimitPresets[preset];
    
    const result = rateLimiter.check(identifier, maxRequests, windowMs);

    if (!result.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(result.resetIn / 1000)}s`,
          retryAfter: Math.ceil(result.resetIn / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + result.resetIn).toISOString(),
            'Retry-After': Math.ceil(result.resetIn / 1000).toString()
          }
        }
      );
    }

    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + result.resetIn).toISOString()
      }
    };
  };
}

/**
 * Middleware de compressão de response (gzip simulation)
 */
export function withCompression(response: NextResponse): NextResponse {
  // Note: Next.js já faz compressão automática em produção
  // Este middleware adiciona headers informativos
  response.headers.set('X-Compression-Available', 'true');
  return response;
}

/**
 * Middleware de CORS
 */
export function withCORS(
  response: NextResponse,
  options: {
    origin?: string;
    methods?: string[];
    headers?: string[];
  } = {}
): NextResponse {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization']
  } = options;

  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
  response.headers.set('Access-Control-Allow-Headers', headers.join(', '));
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 horas

  return response;
}

/**
 * Middleware de security headers
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  return response;
}

/**
 * Middleware de cache headers
 */
export function withCacheHeaders(
  response: NextResponse,
  maxAge: number = 300 // 5 minutos padrão
): NextResponse {
  response.headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`
  );
  response.headers.set('CDN-Cache-Control', `max-age=${maxAge}`);
  response.headers.set('Vercel-CDN-Cache-Control', `max-age=${maxAge}`);

  return response;
}

/**
 * Helper para combinar múltiplos middlewares
 */
export function composeMiddlewares(
  response: NextResponse,
  middlewares: Array<(res: NextResponse) => NextResponse>
): NextResponse {
  return middlewares.reduce((res, middleware) => middleware(res), response);
}
