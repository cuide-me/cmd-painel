/**
 * ────────────────────────────────────────────────────────────────────────────
 * MONITORING UTILITIES - Exemplo de Uso Integrado
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Este arquivo demonstra como usar todas as ferramentas de observabilidade.
 * 
 * FEATURES:
 * - Feature flags para controle de rollout
 * - Logging estruturado para debugging
 * - Error tracking para monitoramento
 * - Validação Zod para type safety
 * - Performance tracking
 * 
 * EXAMPLE API ROUTE:
 * ```ts
 * import { withMonitoring } from '@/lib/monitoring';
 * 
 * export const GET = withMonitoring(async (request) => {
 *   // Your API logic here
 *   return NextResponse.json({ data: '...' });
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { captureException, captureAPIError, addBreadcrumb } from './error-tracking';
import { isFeatureEnabled, FEATURES } from './feature-flags';
import { validateResponse } from './schemas';
import { z } from 'zod';

// ────────────────────────────────────────────────────────────────────────────
// API WRAPPER WITH MONITORING
// ────────────────────────────────────────────────────────────────────────────

export interface MonitoringOptions {
  /**
   * Feature flag required for this endpoint
   */
  requiredFeature?: string;
  
  /**
   * Zod schema for response validation
   */
  responseSchema?: z.ZodSchema;
  
  /**
   * Log level for successful requests
   */
  logLevel?: 'debug' | 'info';
  
  /**
   * Custom context for error tracking
   */
  errorContext?: Record<string, any>;
}

/**
 * Wrap API route with monitoring, logging, and error tracking
 */
export function withMonitoring<T = any>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  options: MonitoringOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const timer = logger.startTimer();
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    
    // Add breadcrumb for activity trail
    addBreadcrumb('http.request', `${method} ${path}`, {
      url: path,
      method,
      searchParams: Object.fromEntries(url.searchParams),
    });
    
    // Log request
    logger.request(method, path, {
      searchParams: Object.fromEntries(url.searchParams),
      userAgent: request.headers.get('user-agent') || undefined,
    });
    
    try {
      // Feature flag check
      if (options.requiredFeature && !isFeatureEnabled(options.requiredFeature as any)) {
        logger.warn('Feature disabled', {
          feature: options.requiredFeature,
          path,
        });
        
        return NextResponse.json(
          {
            error: 'Feature not available',
            message: `This feature (${options.requiredFeature}) is currently disabled.`,
          },
          { status: 503 }
        );
      }
      
      // Execute handler
      const response = await handler(request);
      
      // Validate response if schema provided
      if (options.responseSchema && response.status === 200) {
        try {
          const data = await response.clone().json();
          const validation = validateResponse(options.responseSchema, data);
          
          if (!validation.success) {
            logger.warn('Response validation failed', {
              path,
              error: validation.error,
            });
            
            // Don't fail in production, just log
            if (process.env.NODE_ENV === 'development') {
              throw new Error(`Response validation failed: ${validation.error}`);
            }
          }
        } catch (validationError) {
          logger.error('Response validation error', {
            path,
            error: validationError instanceof Error ? validationError.message : String(validationError),
          });
        }
      }
      
      // Log successful response
      const duration = timer.end();
      logger.info(`${method} ${path} ${response.status}`, {
        status: response.status,
        duration,
        contentType: response.headers.get('content-type') || undefined,
      });
      
      addBreadcrumb('http.response', `${method} ${path} ${response.status}`, {
        status: response.status,
      });
      
      return response;
      
    } catch (error) {
      // Capture error with full context
      const errorId = captureAPIError(
        error as Error,
        {
          method,
          url: path,
          headers: Object.fromEntries(request.headers),
        },
        {
          severity: 'error',
          fingerprint: options.errorContext ? [JSON.stringify(options.errorContext)] : undefined,
        }
      )
      
      const duration = timer.end();
      logger.error(`${method} ${path} ERROR`, {
        errorId,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      
      // Return error response
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          errorId, // Include for support
        },
        { status: 500 }
      );
    }
  };
}

// ────────────────────────────────────────────────────────────────────────────
// INTEGRATION WRAPPER
// ────────────────────────────────────────────────────────────────────────────

/**
 * Wrap integration calls with error tracking and logging
 */
export async function withIntegrationTracking<T>(
  integration: string,
  operation: string,
  fn: () => Promise<T>,
  options?: {
    logResult?: boolean;
    context?: Record<string, any>;
  }
): Promise<T> {
  const timer = logger.startTimer();
  
  logger.integration(integration, operation, options?.context);
  
  addBreadcrumb('integration', `${integration}.${operation}`, options?.context);
  
  try {
    const result = await fn();
    
    const duration = timer.end();
    logger.debug(`[${integration}] ${operation} succeeded`, {
      duration,
      ...(options?.logResult ? { result } : {}),
    });
    
    return result;
    
  } catch (error) {
    const duration = timer.end();
    logger.error(`[${integration}] ${operation} failed`, {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    captureException(error as Error, {
      severity: 'error',
      context: {
        integration,
        operation,
        ...options?.context,
      },
    });
    
    throw error;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// FEATURE FLAG MIDDLEWARE
// ────────────────────────────────────────────────────────────────────────────

/**
 * Check feature flag and return 503 if disabled
 */
export function requireFeature(feature: string) {
  return (request: NextRequest): NextResponse | null => {
    if (!isFeatureEnabled(feature as any)) {
      logger.warn('Feature disabled', { feature, path: request.url });
      
      return NextResponse.json(
        {
          error: 'Feature not available',
          message: `This feature (${feature}) is currently disabled.`,
        },
        { status: 503 }
      );
    }
    
    return null;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// PERFORMANCE MONITORING
// ────────────────────────────────────────────────────────────────────────────

const performanceMetrics: Map<string, number[]> = new Map();

export function trackPerformance(operation: string, durationMs: number): void {
  if (!performanceMetrics.has(operation)) {
    performanceMetrics.set(operation, []);
  }
  
  const metrics = performanceMetrics.get(operation)!;
  metrics.push(durationMs);
  
  // Keep only last 100 measurements
  if (metrics.length > 100) {
    metrics.shift();
  }
}

export function getPerformanceStats(operation: string): {
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
} | null {
  const metrics = performanceMetrics.get(operation);
  if (!metrics || metrics.length === 0) return null;
  
  const sorted = [...metrics].sort((a, b) => a - b);
  const count = sorted.length;
  
  return {
    count,
    avg: sorted.reduce((a, b) => a + b, 0) / count,
    min: sorted[0],
    max: sorted[count - 1],
    p50: sorted[Math.floor(count * 0.5)],
    p95: sorted[Math.floor(count * 0.95)],
    p99: sorted[Math.floor(count * 0.99)],
  };
}

export function getAllPerformanceStats(): Record<string, ReturnType<typeof getPerformanceStats>> {
  const stats: Record<string, ReturnType<typeof getPerformanceStats>> = {};
  
  for (const [operation] of performanceMetrics) {
    stats[operation] = getPerformanceStats(operation);
  }
  
  return stats;
}

// ────────────────────────────────────────────────────────────────────────────
// EXAMPLE USAGE
// ────────────────────────────────────────────────────────────────────────────

/**
 * Example: Protected API route with monitoring
 * 
 * ```ts
 * import { withMonitoring } from '@/lib/monitoring';
 * import { TorreV2Schema } from '@/lib/schemas';
 * import { FEATURES } from '@/lib/feature-flags';
 * 
 * export const GET = withMonitoring(
 *   async (request: NextRequest) => {
 *     const data = await fetchTorreData();
 *     return NextResponse.json(data);
 *   },
 *   {
 *     requiredFeature: FEATURES.TORRE_V2,
 *     responseSchema: TorreV2Schema,
 *     errorContext: { module: 'torre-v2' },
 *   }
 * );
 * ```
 */

/**
 * Example: Integration call with tracking
 * 
 * ```ts
 * import { withIntegrationTracking } from '@/lib/monitoring';
 * 
 * const users = await withIntegrationTracking(
 *   'firebase',
 *   'getUserGrowth',
 *   async () => {
 *     return await getUserGrowth({ startDate, endDate });
 *   },
 *   { context: { startDate, endDate } }
 * );
 * ```
 */
