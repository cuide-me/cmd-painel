/**
 * ────────────────────────────────────
 * OBSERVABILITY: STRUCTURED LOGGER
 * ────────────────────────────────────
 * Logger estruturado para produção
 * Substitui console.log/error/warn com logs JSON
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogMetadata {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  metadata?: LogMetadata;
  correlationId?: string;
  service?: string;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
}

class Logger {
  private correlationId: string | null = null;
  private service: string = 'torre-de-controle';

  /**
   * Define correlation ID para rastrear requests
   */
  setCorrelationId(id: string) {
    this.correlationId = id;
  }

  /**
   * Define nome do serviço
   */
  setService(name: string) {
    this.service = name;
  }

  /**
   * Cria entrada de log estruturada
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      service: this.service,
    };

    if (this.correlationId) {
      entry.correlationId = this.correlationId;
    }

    if (metadata) {
      entry.metadata = metadata;
    }

    if (error) {
      entry.error = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
    }

    return entry;
  }

  /**
   * Envia log para saída apropriada
   */
  private write(entry: LogEntry) {
    const json = JSON.stringify(entry);

    switch (entry.level) {
      case 'debug':
      case 'info':
        console.log(json);
        break;
      case 'warn':
        console.warn(json);
        break;
      case 'error':
      case 'fatal':
        console.error(json);
        break;
    }
  }

  /**
   * Log nível DEBUG
   */
  debug(message: string, metadata?: LogMetadata) {
    const entry = this.createLogEntry('debug', message, metadata);
    this.write(entry);
  }

  /**
   * Log nível INFO
   */
  info(message: string, metadata?: LogMetadata) {
    const entry = this.createLogEntry('info', message, metadata);
    this.write(entry);
  }

  /**
   * Log nível WARN
   */
  warn(message: string, metadata?: LogMetadata) {
    const entry = this.createLogEntry('warn', message, metadata);
    this.write(entry);
  }

  /**
   * Log nível ERROR
   */
  error(message: string, error?: Error, metadata?: LogMetadata) {
    const entry = this.createLogEntry('error', message, metadata, error);
    this.write(entry);
  }

  /**
   * Log nível FATAL (erro crítico)
   */
  fatal(message: string, error?: Error, metadata?: LogMetadata) {
    const entry = this.createLogEntry('fatal', message, metadata, error);
    this.write(entry);
  }

  /**
   * Helper para timing de operações
   */
  startTimer(operationName: string) {
    const startTime = Date.now();
    
    return {
      end: (metadata?: LogMetadata) => {
        const duration = Date.now() - startTime;
        this.info(`${operationName} completed`, {
          ...metadata,
          duration,
          durationMs: duration,
        });
        return duration;
      },
    };
  }
}

// Singleton instance
export const logger = new Logger();

// Helper para criar logger com contexto específico
export function createLogger(service: string, correlationId?: string): Logger {
  const instance = new Logger();
  instance.setService(service);
  if (correlationId) {
    instance.setCorrelationId(correlationId);
  }
  return instance;
}

// Export default
export default logger;
