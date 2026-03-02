/**
 * ═══════════════════════════════════════════════════════════
 * CACHE SERVICE
 * ═══════════════════════════════════════════════════════════
 * Sistema de cache em memória com TTL
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

class CacheService {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Armazena um valor no cache
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    };

    this.cache.set(key, entry);
  }

  /**
   * Recupera um valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Remove um item do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalida cache por padrão (usando regex)
   */
  invalidatePattern(pattern: RegExp): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      memoryEstimate: this.cache.size * 100 // Estimativa básica em bytes
    };
  }

  /**
   * Limpeza automática de itens expirados
   */
  private startCleanup(): void {
    // Executar a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`[Cache] Limpeza automática: ${cleaned} itens removidos`);
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Para a limpeza automática
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Wrapper para buscar com cache automático
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    // Tentar obter do cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Se não estiver no cache, buscar
    const data = await fetchFn();
    this.set(key, data, ttlSeconds);
    return data;
  }
}

// Singleton
export const cache = new CacheService();

// Cache keys helpers
export const CacheKeys = {
  pipeline: (dateRange?: string) => `pipeline:${dateRange || 'default'}`,
  marketplace: (dateRange?: string) => `marketplace:${dateRange || 'default'}`,
  familias: () => 'familias:data',
  cuidadores: () => 'cuidadores:data',
  confianca: () => 'confianca:data',
  friccao: () => 'friccao:data',
  serviceDesk: () => 'service-desk:data',
  notifications: (userId?: string) => `notifications:${userId || 'admin'}`,
  stats: (module: string) => `stats:${module}`,
} as const;

// TTL presets (em segundos)
export const CacheTTL = {
  SHORT: 60,        // 1 minuto
  MEDIUM: 300,      // 5 minutos
  LONG: 900,        // 15 minutos
  HOUR: 3600,       // 1 hora
  DAY: 86400        // 24 horas
} as const;
