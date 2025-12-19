/**
 * Performance Monitoring Service
 * Rastreia métricas de performance de APIs e serviços
 */

interface PerformanceMetric {
  endpoint: string;
  method: string;
  duration: number; // ms
  status: number;
  timestamp: Date;
  error?: string;
}

interface EndpointStats {
  endpoint: string;
  totalRequests: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  errorCount: number;
  lastError?: string;
  lastRequest: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Manter últimos 1000 requests

  /**
   * Registra uma métrica de performance
   */
  track(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Limitar tamanho do array
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log se for lento (> 2s)
    if (metric.duration > 2000) {
      console.warn(
        `[Performance] Slow request: ${metric.method} ${metric.endpoint} - ${metric.duration}ms`
      );
    }

    // Log se houver erro
    if (metric.status >= 400) {
      console.error(
        `[Performance] Error: ${metric.method} ${metric.endpoint} - ${metric.status} - ${metric.error}`
      );
    }
  }

  /**
   * Calcula estatísticas por endpoint
   */
  getStats(): EndpointStats[] {
    const grouped = new Map<string, PerformanceMetric[]>();

    // Agrupar por endpoint
    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    // Calcular estatísticas
    const stats: EndpointStats[] = [];
    for (const [key, metrics] of grouped) {
      const durations = metrics.map(m => m.duration);
      const errors = metrics.filter(m => m.status >= 400);
      const successes = metrics.filter(m => m.status < 400);

      const lastMetric = metrics[metrics.length - 1];
      const lastError = errors.length > 0 ? errors[errors.length - 1].error : undefined;

      stats.push({
        endpoint: key,
        totalRequests: metrics.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        successRate: (successes.length / metrics.length) * 100,
        errorCount: errors.length,
        lastError,
        lastRequest: lastMetric.timestamp,
      });
    }

    // Ordenar por total de requests (mais usados primeiro)
    return stats.sort((a, b) => b.totalRequests - a.totalRequests);
  }

  /**
   * Retorna endpoints com problemas
   */
  getProblematicEndpoints(): EndpointStats[] {
    return this.getStats().filter(stat => {
      return (
        stat.successRate < 95 || // Taxa de sucesso < 95%
        stat.avgDuration > 1000 || // Média > 1s
        stat.errorCount > 0 // Tem erros
      );
    });
  }

  /**
   * Limpa métricas antigas
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Retorna métricas brutas (para debug)
   */
  getRawMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Helper para medir tempo de execução de uma função
 */
export async function measurePerformance<T>(
  endpoint: string,
  method: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  let status = 200;
  let error: string | undefined;

  try {
    const result = await fn();
    return result;
  } catch (err: any) {
    status = 500;
    error = err.message || 'Unknown error';
    throw err;
  } finally {
    const duration = performance.now() - startTime;
    performanceMonitor.track({
      endpoint,
      method,
      duration,
      status,
      timestamp: new Date(),
      error,
    });
  }
}

/**
 * Middleware para Next.js API routes
 */
export function withPerformanceTracking(
  handler: (req: any, res: any) => Promise<any>,
  endpoint: string
) {
  return async (req: any, res: any) => {
    const startTime = performance.now();
    let status = 200;
    let error: string | undefined;

    try {
      const result = await handler(req, res);
      status = res.statusCode || 200;
      return result;
    } catch (err: any) {
      status = 500;
      error = err.message;
      throw err;
    } finally {
      const duration = performance.now() - startTime;
      performanceMonitor.track({
        endpoint,
        method: req.method || 'GET',
        duration,
        status,
        timestamp: new Date(),
        error,
      });
    }
  };
}
