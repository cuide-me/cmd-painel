/**
 * ────────────────────────────────────────────────────────────────────────────
 * LOGGER - Sistema de Logging Estruturado
 * ────────────────────────────────────────────────────────────────────────────
 * 
 * Logger centralizado com suporte a:
 * - Níveis de log (debug, info, warn, error)
 * - Contexto estruturado (metadata)
 * - Performance tracking
 * - Integração com Vercel/Datadog/Sentry
 * 
 * USAGE:
 * ```ts
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 * logger.error('API error', { error, endpoint: '/api/users' });
 * 
 * // Performance tracking
 * const timer = logger.startTimer();
 * // ... do work
 * timer.done({ message: 'Query completed', query: 'SELECT *' });
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  durationMs?: number;
}

// ────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ────────────────────────────────────────────────────────────────────────────

const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const SHOULD_LOG_TO_CONSOLE = process.env.LOG_TO_CONSOLE !== 'false';
const SHOULD_LOG_TO_EXTERNAL = process.env.NODE_ENV === 'production';

// ────────────────────────────────────────────────────────────────────────────
// FORMATTING
// ────────────────────────────────────────────────────────────────────────────

const LOG_COLORS = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',
};

const LOG_ICONS = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

function formatLogEntry(entry: LogEntry): string {
  const { level, message, timestamp, context, durationMs } = entry;
  
  const parts = [
    `[${timestamp}]`,
    `[${level.toUpperCase()}]`,
    message,
  ];
  
  if (durationMs !== undefined) {
    parts.push(`(${durationMs}ms)`);
  }
  
  if (context && Object.keys(context).length > 0) {
    parts.push(JSON.stringify(context));
  }
  
  return parts.join(' ');
}

function formatConsoleLog(entry: LogEntry): void {
  const { level, message, context, durationMs } = entry;
  const color = LOG_COLORS[level];
  const icon = LOG_ICONS[level];
  const reset = LOG_COLORS.reset;
  
  const prefix = `${color}${icon} [${level.toUpperCase()}]${reset}`;
  
  if (context || durationMs !== undefined) {
    const metadata: any = { ...context };
    if (durationMs !== undefined) {
      metadata._durationMs = durationMs;
    }
    console[level === 'debug' ? 'log' : level](prefix, message, metadata);
  } else {
    console[level === 'debug' ? 'log' : level](prefix, message);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// EXTERNAL LOGGING (Vercel, Datadog, Sentry, etc)
// ────────────────────────────────────────────────────────────────────────────

function logToExternal(entry: LogEntry): void {
  if (!SHOULD_LOG_TO_EXTERNAL) return;
  
  // Example: Send to external logging service
  // In production, you might integrate with:
  // - Vercel Analytics
  // - Datadog
  // - Sentry (for errors)
  // - CloudWatch
  
  // For now, just structure it for JSON logging
  if (typeof window === 'undefined') {
    // Server-side: Vercel automatically captures console.log as structured logs
    console.log(JSON.stringify({
      ...entry,
      service: 'cmd-painel',
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
    }));
  }
}

// ────────────────────────────────────────────────────────────────────────────
// CORE LOGGER
// ────────────────────────────────────────────────────────────────────────────

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL];
}

function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) return;
  
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
  
  if (SHOULD_LOG_TO_CONSOLE) {
    formatConsoleLog(entry);
  }
  
  logToExternal(entry);
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────────────────────

export const logger = {
  debug(message: string, context?: LogContext): void {
    log('debug', message, context);
  },
  
  info(message: string, context?: LogContext): void {
    log('info', message, context);
  },
  
  warn(message: string, context?: LogContext): void {
    log('warn', message, context);
  },
  
  error(message: string, context?: LogContext): void {
    log('error', message, context);
  },
  
  /**
   * Start a performance timer
   */
  startTimer() {
    const startTime = Date.now();
    
    return {
      done(options: { message: string; context?: LogContext; level?: LogLevel }) {
        const durationMs = Date.now() - startTime;
        const { message, context, level = 'info' } = options;
        
        if (!shouldLog(level)) return;
        
        const entry: LogEntry = {
          level,
          message,
          timestamp: new Date().toISOString(),
          context,
          durationMs,
        };
        
        if (SHOULD_LOG_TO_CONSOLE) {
          formatConsoleLog(entry);
        }
        
        logToExternal(entry);
      },
    };
  },
  
  /**
   * Log an HTTP request
   */
  request(method: string, path: string, context?: LogContext): void {
    log('info', `${method} ${path}`, {
      type: 'http-request',
      ...context,
    });
  },
  
  /**
   * Log an HTTP response
   */
  response(method: string, path: string, status: number, durationMs: number, context?: LogContext): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    
    if (!shouldLog(level)) return;
    
    const entry: LogEntry = {
      level,
      message: `${method} ${path} ${status}`,
      timestamp: new Date().toISOString(),
      context: {
        type: 'http-response',
        status,
        ...context,
      },
      durationMs,
    };
    
    if (SHOULD_LOG_TO_CONSOLE) {
      formatConsoleLog(entry);
    }
    
    logToExternal(entry);
  },
  
  /**
   * Log an integration call
   */
  integration(integration: string, operation: string, context?: LogContext): void {
    log('debug', `[${integration}] ${operation}`, {
      type: 'integration',
      integration,
      operation,
      ...context,
    });
  },
  
  /**
   * Log a feature flag check
   */
  featureFlag(flag: string, enabled: boolean, context?: LogContext): void {
    log('debug', `Feature flag: ${flag} = ${enabled}`, {
      type: 'feature-flag',
      flag,
      enabled,
      ...context,
    });
  },
};

// ────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ────────────────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV === 'development') {
  logger.info('Logger initialized', {
    logLevel: LOG_LEVEL,
    toConsole: SHOULD_LOG_TO_CONSOLE,
    toExternal: SHOULD_LOG_TO_EXTERNAL,
  });
}
