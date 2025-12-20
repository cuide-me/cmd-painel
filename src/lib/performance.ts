/**
 * ═══════════════════════════════════════════════════════════
 * PERFORMANCE MONITORING
 * ═══════════════════════════════════════════════════════════
 * Métricas de performance do sistema
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;

  /**
   * Inicia medição de performance
   */
  start(name: string): () => void {
    const startTime = Date.now();
    
    return (metadata?: Record<string, any>) => {
      const duration = Date.now() - startTime;
      this.record({
        name,
        duration,
        timestamp: new Date(),
        metadata
      });
    };
  }

  /**
   * Registra uma métrica
   */
  private record(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Manter apenas as últimas N métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log de métricas lentas
    if (metric.duration > 1000) {
      console.warn(`[Performance] Operação lenta: ${metric.name} levou ${metric.duration}ms`);
    }
  }

  /**
   * Obtém estatísticas de uma operação
   */
  getStats(name: string) {
    const filtered = this.metrics.filter(m => m.name === name);
    
    if (filtered.length === 0) {
      return null;
    }

    const durations = filtered.map(m => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count: filtered.length,
      avg: sum / filtered.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99)
    };
  }

  /**
   * Calcula percentil
   */
  private percentile(arr: number[], p: number): number {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * Obtém todas as métricas
   */
  getAllMetrics() {
    return this.metrics;
  }

  /**
   * Limpa métricas antigas
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Relatório resumido
   */
  getReport() {
    const groupedByName = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.duration);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(groupedByName).map(([name, durations]) => ({
      operation: name,
      count: durations.length,
      avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      minMs: Math.min(...durations),
      maxMs: Math.max(...durations)
    }));
  }
}

// Singleton
export const perfMonitor = new PerformanceMonitor();

/**
 * Decorator para medir performance de funções
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name?: string
): T {
  return ((...args: any[]) => {
    const end = perfMonitor.start(name || fn.name);
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => end());
    }
    
    end();
    return result;
  }) as T;
}

/**
 * Hook para medir performance de operações
 */
export function usePerfMeasure(operationName: string) {
  return {
    measure: <T>(fn: () => T): T => {
      const end = perfMonitor.start(operationName);
      const result = fn();
      
      if (result instanceof Promise) {
        return result.finally(() => end()) as T;
      }
      
      end();
      return result;
    }
  };
}
