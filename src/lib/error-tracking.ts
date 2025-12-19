/**
 * Error Tracking & Monitoring
 * Centralized error capture and tracking
 */

export interface ErrorMetadata {
  context?: Record<string, any>;
  severity?: 'info' | 'warning' | 'error' | 'fatal';
  fingerprint?: string[];
}

export interface ErrorContext {
  [key: string]: any;
}

/**
 * Capture an exception
 */
export function captureException(error: Error, metadata?: ErrorMetadata): string {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.error('[ERROR]', {
    id: errorId,
    message: error.message,
    stack: error.stack,
    severity: metadata?.severity || 'error',
    context: metadata?.context,
    timestamp: new Date().toISOString(),
  });
  
  return errorId;
}

/**
 * Capture API-specific errors
 */
export function captureAPIError(
  error: Error,
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
  },
  metadata?: ErrorMetadata
): string {
  return captureException(error, {
    ...metadata,
    context: {
      ...metadata?.context,
      api: {
        method: request.method,
        url: request.url,
        headers: request.headers,
      },
    },
  });
}

/**
 * Add breadcrumb for activity trail
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>
): void {
  console.debug('[BREADCRUMB]', {
    category,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Capture a custom error
 */
export function captureError(error: Error, metadata?: ErrorMetadata): string {
  return captureException(error, metadata);
}
