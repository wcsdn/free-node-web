/**
 * 日志工具
 * 统一管理应用日志
 */

import { env } from '@/config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // 生产环境只记录 error 和 warn
    if (env.isProd && (level === 'info' || level === 'debug')) {
      return false;
    }
    return true;
  }

  /**
   * 信息日志
   */
  info(message: string, data?: any): void {
    if (!this.shouldLog('info')) return;
    console.log(`[INFO] ${message}`, data || '');
  }

  /**
   * 警告日志
   */
  warn(message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;
    console.warn(`[WARN] ${message}`, data || '');
  }

  /**
   * 错误日志
   */
  error(message: string, error?: any): void {
    if (!this.shouldLog('error')) return;
    console.error(`[ERROR] ${message}`, error || '');
    
    // 生产环境可以发送到错误追踪服务
    if (env.isProd && env.features.enableAnalytics) {
      // TODO: 发送到 Sentry 或其他错误追踪服务
      // this.sendToErrorTracking(message, error);
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;
    console.debug(`[DEBUG] ${message}`, data || '');
  }
}

export const logger = new Logger();
