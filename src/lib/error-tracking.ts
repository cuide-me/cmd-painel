/**
 * ────────────────────────────────────────────────────────────────────────────
 * ERROR TRACKING - Monitoramento de Erros
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Sistema centralizado para tracking e reporting de erros.
 * Integra com Sentry (se configurado) ou usa logging local.
 * 
 * USAGE:
 * ```ts
 * import { captureError, captureException } from '@/lib/error-tracking';
 * 
 * try {
 *   // risky operation
 * } catch (error) {
 *   captureException(error, { context: 'payment-processing' });
 *   throw error;
 * }
 * ```
 */

import { logger } from './logger';

// ────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ────────────────────────────────────────────────────────────────────────────

const SENTRY_ENABLED = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';

// ────────────────────────────────────────────────────────────────────────────
// ERROR CONTEXT
// ────────────────────────────────────────────────────────────────────────────

export interface ErrorContext {
  [key: string]: any;
  user?: {
    id?: string;
    email?: string;
    role?: string;
  };
  request?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
  tags?: Record<string, string>;
}

export interface ErrorMetadata {
  severity: 'fatal' | 'error' | 'warning' | 'info';
  context?: ErrorContext;
  fingerprint?: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// SENTRY INTEGRATION (Placeholder)
// ────────────────────────────────────────────────────────────────────────────

// In production, you would initialize Sentry here:
// import * as Sentry from '@sentry/nextjs';
// Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, ... });

function initSentry() {
  if (!SENTRY_ENABLED) return;
  
  // Placeholder for actual Sentry initialization
  // Sentry.init({
  //   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  //   environment: ENVIRONMENT,
  //   release: APP_VERSION,
  //   tracesSampleRate: 1.0,
  // });
  
  logger.info('Sentry initialized', { environment: ENVIRONMENT });
}

// ────────────────────────────────────────────────────────────────────────────
// ERROR CAPTURE
// ────────────────────────────────────────────────────────────────────────────

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error | unknown,
  metadata?: ErrorMetadata
): string {
  const errorId = generateErrorId();
  
  // Extract error details
  const errorDetails = {
    id: errorId,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    name: error instanceof Error ? error.name : 'Unknown',
    severity: metadata?.severity || 'error',
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    version: APP_VERSION,
    context: metadata?.context,
  };
  
  // Log to console/structured logs
  logger.error('Exception captured', errorDetails);
  
  // Send to Sentry if enabled
  if (SENTRY_ENABLED) {
    // Sentry.captureException(error, {
    //   level: metadata?.severity || 'error',
    //   contexts: metadata?.context,
    //   fingerprint: metadata?.fingerprint,
    //   tags: metadata?.context?.tags,
    // });
  }
  
  return errorId;
}

/**
 * Capture a custom error message
 */
export function captureError(
  message: string,
  metadata?: ErrorMetadata
): string {
  const errorId = generateErrorId();
  
  const errorDetails = {
    id: errorId,
    message,
    severity: metadata?.severity || 'error',
    timestamp: new Date().toISOString(),
    environment: ENVIRONMENT,
    version: APP_VERSION,
    context: metadata?.context,
  };
  
  logger.error('Error captured', errorDetails);
  
  if (SENTRY_ENABLED) {
    // Sentry.captureMessage(message, {
    //   level: metadata?.severity || 'error',
    //   contexts: metadata?.context,
    //   fingerprint: metadata?.fingerprint,
    //   tags: metadata?.context?.tags,
    // });
  }
  
  return errorId;
}

/**
 * Capture API error with request context
 */
export function captureAPIError(
  error: Error | unknown,
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  },
  metadata?: Omit<ErrorMetadata, 'context'>
): string {
  return captureException(error, {
    severity: 'error',
    ...metadata,
    context: {
      request: {
        method: request.method,
        url: request.url,
        headers: sanitizeHeaders(request.headers),
      },
      requestBody: sanitizeBody(request.body),
    },
  });
}

/**
 * Capture integration error
 */
export function captureIntegrationError(
  integration: string,
  operation: string,
  error: Error | unknown,
  metadata?: ErrorMetadata
): string {
  return captureException(error, {
    severity: 'error',
    ...metadata,
    context: {
      ...metadata?.context,
      integration,
      operation,
      tags: {
        ...metadata?.context?.tags,
        integration,
        operation,
      },
    },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// ERROR BOUNDARIES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Wrap async function with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error, { severity: 'error', context });
      throw error;
    }
  }) as T;
}

/**
 * Wrap sync function with error tracking
 */
export function withErrorTrackingSync<T extends (...args: any[]) => any>(
  fn: T,
  context?: ErrorContext
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      captureException(error, { severity: 'error', context });
      throw error;
    }
  }) as T;
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function sanitizeHeaders(headers?: Record<string, string>): Record<string, string> {
  if (!headers) return {};
  
  const sanitized = { ...headers };
  
  // Remove sensitive headers
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

function sanitizeBody(body?: any): any {
  if (!body) return undefined;
  
  // Clone and remove sensitive fields
  const sanitized = JSON.parse(JSON.stringify(body));
  
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  
  function redactSensitive(obj: any): void {
    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redactSensitive(obj[key]);
      }
    }
  }
  
  redactSensitive(sanitized);
  return sanitized;
}

// ────────────────────────────────────────────────────────────────────────────
// BREADCRUMBS (Activity trail before error)
// ────────────────────────────────────────────────────────────────────────────

interface Breadcrumb {
  timestamp: string;
  category: string;
  message: string;
  data?: Record<string, any>;
}

const breadcrumbs: Breadcrumb[] = [];
const MAX_BREADCRUMBS = 50;

export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>
): void {
  breadcrumbs.push({
    timestamp: new Date().toISOString(),
    category,
    message,
    data,
  });
  
  // Keep only last N breadcrumbs
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
  
  if (SENTRY_ENABLED) {
    // Sentry.addBreadcrumb({
    //   timestamp: Date.now() / 1000,
    //   category,
    //   message,
    //   data,
    // });
  }
}

export function getBreadcrumbs(): Breadcrumb[] {
  return [...breadcrumbs];
}

export function clearBreadcrumbs(): void {
  breadcrumbs.length = 0;
}

// ────────────────────────────────────────────────────────────────────────────
// USER CONTEXT
// ────────────────────────────────────────────────────────────────────────────

let currentUser: ErrorContext['user'] | null = null;

export function setUser(user: ErrorContext['user']): void {
  currentUser = user;
  
  if (SENTRY_ENABLED && user) {
    // Sentry.setUser({
    //   id: user.id,
    //   email: user.email,
    //   role: user.role,
    // });
  }
}

export function clearUser(): void {
  currentUser = null;
  
  if (SENTRY_ENABLED) {
    // Sentry.setUser(null);
  }
}

export function getUser(): ErrorContext['user'] | null {
  return currentUser;
}

// ────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ────────────────────────────────────────────────────────────────────────────

if (SENTRY_ENABLED) {
  initSentry();
} else {
  logger.info('Error tracking using local logging (Sentry not configured)');
}

// Global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    captureException(event.error, {
      severity: 'error',
      context: {
        type: 'uncaught-error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    captureException(event.reason, {
      severity: 'error',
      context: {
        type: 'unhandled-rejection',
      },
    });
  });
}
