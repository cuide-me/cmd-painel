/**
 * Logger utility for structured logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel = 'info';

  constructor() {
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
    if (envLogLevel && this.isValidLogLevel(envLogLevel)) {
      this.logLevel = envLogLevel as LogLevel;
    }
  }

  private isValidLogLevel(level: string): boolean {
    return ['debug', 'info', 'warn', 'error'].includes(level);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const output = JSON.stringify(entry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | Record<string, any>, context?: Record<string, any>): void {
    if (error && !(error instanceof Error)) {
      // Se o segundo parâmetro não é um Error, trate como contexto
      this.log('error', message, error as Record<string, any>);
    } else {
      this.log('error', message, context, error as Error);
    }
  }

  request(method: string, path: string, context?: Record<string, any>): void {
    this.info(`${method} ${path}`, context);
  }

  integration(integration: string, operation: string, context?: Record<string, any>): void {
    this.info(`Integration: ${integration} - ${operation}`, context);
  }

  startTimer(): { end: () => number } {
    const startTime = Date.now();
    return {
      end: () => Date.now() - startTime,
    };
  }
}

export const logger = new Logger();
