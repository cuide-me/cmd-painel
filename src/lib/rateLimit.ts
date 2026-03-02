/**
 * ═══════════════════════════════════════════════════════════
 * RATE LIMIT MIDDLEWARE
 * ═══════════════════════════════════════════════════════════
 * Proteção contra abuso de APIs
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.requests = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Verifica se uma requisição pode ser processada
   */
  check(
    identifier: string,
    maxRequests: number = 100,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // Se não existe ou expirou, criar nova entrada
    if (!entry || now > entry.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetIn: windowMs
      };
    }

    // Incrementar contador
    entry.count++;

    // Verificar se excedeu o limite
    if (entry.count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: entry.resetTime - now
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetIn: entry.resetTime - now
    };
  }

  /**
   * Reseta o contador de um identificador
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Limpa todos os contadores
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * Obtém estatísticas
   */
  getStats() {
    return {
      totalIdentifiers: this.requests.size,
      activeRequests: Array.from(this.requests.values()).reduce(
        (sum, entry) => sum + entry.count,
        0
      )
    };
  }

  /**
   * Limpeza automática de entradas expiradas
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.requests.entries()) {
        if (now > entry.resetTime) {
          this.requests.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[RateLimit] Limpeza: ${cleaned} entradas removidas`);
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton
export const rateLimiter = new RateLimiter();

// Presets de rate limit
export const RateLimitPresets = {
  STRICT: { maxRequests: 10, windowMs: 60000 },      // 10 req/min
  MODERATE: { maxRequests: 30, windowMs: 60000 },    // 30 req/min
  RELAXED: { maxRequests: 100, windowMs: 60000 },    // 100 req/min
  GENEROUS: { maxRequests: 300, windowMs: 60000 },   // 300 req/min
  WEBHOOK: { maxRequests: 1000, windowMs: 3600000 }, // 1000 req/hora
} as const;

/**
 * Helper para obter identificador da requisição
 */
export function getRequestIdentifier(request: Request): string {
  // Tentar obter IP real (considerando proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Para admin, usar também o user agent
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const hash = simpleHash(userAgent);
  
  return `${ip}:${hash}`;
}

/**
 * Hash simples para user agent
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
