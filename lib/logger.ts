/**
 * Structured logging utility for Wingside
 * Provides consistent logging across the application with support for different log levels
 *
 * Features:
 * - Environment-aware: Debug logs disabled in production by default
 * - Structured context: Attach metadata to log entries
 * - Namespaced loggers: Pre-configured for different domains (Auth, Payment, etc.)
 * - Configurable via LOG_LEVEL environment variable
 *
 * @example
 * ```typescript
 * import { loggers } from '@/lib/logger';
 *
 * // In production: This won't log anything
 * loggers.payment.debug('Processing payment', { orderId: '123' });
 *
 * // In production: This will log
 * loggers.payment.error('Payment failed', error, { orderId: '123' });
 * ```
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Check if running in production environment
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if running in development environment
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

export interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

/**
 * Get configured log level from environment
 * Default: 'info' in production, 'debug' in development
 */
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

  if (envLevel && validLevels.includes(envLevel as LogLevel)) {
    return envLevel as LogLevel;
  }

  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = getLogLevel();
const currentLogLevelValue = LOG_LEVELS[currentLogLevel];

/**
 * Check if a log level should be logged based on current configuration
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLogLevelValue;
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const parts = [
    entry.timestamp,
    `[${entry.level.toUpperCase()}]`,
    entry.message,
  ];

  if (entry.context && Object.keys(entry.context).length > 0) {
    parts.push(JSON.stringify(entry.context));
  }

  return parts.join(' ');
}

/**
 * Create a logger instance with optional namespace
 */
export function createLogger(namespace?: string) {
  const prefix = namespace ? `[${namespace}]` : '';

  return {
    /**
     * Debug level logging - verbose information for development
     */
    debug(message: string, context?: LogContext): void {
      if (!shouldLog('debug')) return;

      const entry: LogEntry = {
        level: 'debug',
        message: `${prefix} ${message}`.trim(),
        timestamp: new Date().toISOString(),
        context,
      };

      console.debug(formatLogEntry(entry));
    },

    /**
     * Info level logging - general information about application flow
     */
    info(message: string, context?: LogContext): void {
      if (!shouldLog('info')) return;

      const entry: LogEntry = {
        level: 'info',
        message: `${prefix} ${message}`.trim(),
        timestamp: new Date().toISOString(),
        context,
      };

      console.info(formatLogEntry(entry));
    },

    /**
     * Warning level logging - non-critical issues that should be addressed
     */
    warn(message: string, context?: LogContext): void {
      if (!shouldLog('warn')) return;

      const entry: LogEntry = {
        level: 'warn',
        message: `${prefix} ${message}`.trim(),
        timestamp: new Date().toISOString(),
        context,
      };

      console.warn(formatLogEntry(entry));
    },

    /**
     * Error level logging - critical issues that need immediate attention
     */
    error(message: string, error?: Error | unknown, context?: LogContext): void {
      if (!shouldLog('error')) return;

      const errorContext: LogContext = {
        ...context,
      };

      if (error instanceof Error) {
        errorContext.error = error.message;
        errorContext.stack = error.stack;
      } else if (error) {
        errorContext.error = String(error);
      }

      const entry: LogEntry = {
        level: 'error',
        message: `${prefix} ${message}`.trim(),
        timestamp: new Date().toISOString(),
        context: errorContext,
      };

      console.error(formatLogEntry(entry));
    },
  };
}

/**
 * Default logger instance for general use
 */
export const logger = createLogger();

/**
 * Pre-configured loggers for specific domains
 */
export const loggers = {
  auth: createLogger('Auth'),
  payment: createLogger('Payment'),
  order: createLogger('Order'),
  webhook: createLogger('Webhook'),
  database: createLogger('Database'),
  cache: createLogger('Cache'),
  email: createLogger('Email'),
  sms: createLogger('SMS'),
  api: createLogger('API'),
  admin: createLogger('Admin'),
  wallet: createLogger('Wallet'),
  rewards: createLogger('Rewards'),
  streak: createLogger('Streak'),
  integrations: createLogger('Integrations'),
};

/**
 * Backward compatibility: export as default
 */
export default logger;

/**
 * Safe console wrapper that respects environment
 * Use this instead of raw console.log/console.debug in production code
 *
 * @example
 * ```typescript
 * import { safeConsole } from '@/lib/logger';
 *
 * // Only logs in development
 * safeConsole.debug('This is debug info');
 *
 * // Always logs (even in production)
 * safeConsole.error('Critical error');
 * ```
 */
export const safeConsole = {
  /**
   * Debug logging - suppressed in production
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Log - suppressed in production (use logger.info instead)
   */
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Info - logs in all environments
   */
  info: (...args: unknown[]): void => {
    console.info(...args);
  },

  /**
   * Warning - logs in all environments
   */
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },

  /**
   * Error - logs in all environments
   */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
