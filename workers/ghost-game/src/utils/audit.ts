/**
 * 审计日志中间件
 * 记录所有 API 请求用于安全审计
 */

export interface AuditLogEntry {
  timestamp: string;
  walletAddress?: string;
  method: string;
  path: string;
  status: number;
  duration: number;
  ip?: string;
  userAgent?: string;
  requestBody?: Record<string, any>;
  error?: string;
}

export interface AuditLogger {
  log: (entry: AuditLogEntry) => void;
  warn: (message: string, data?: Record<string, any>) => void;
  error: (message: string, data?: Record<string, any>) => void;
}

/**
 * 创建审计日志中间件
 */
export function auditMiddleware(
  logger: AuditLogger,
  options: {
    sensitivePaths?: string[];  // 跳过记录敏感路径
    logBody?: boolean;          // 是否记录请求体
    sampleRate?: number;        // 采样率 (0-1)
  } = {}
) {
  const { 
    sensitivePaths = ['/health', '/favicon.ico'], 
    logBody = false,
    sampleRate = 1 
  } = options;

  return async (c: any, next: () => Promise<void>) => {
    const start = Date.now();
    const path = c.req.path;

    // 采样
    if (Math.random() > sampleRate) {
      await next();
      return;
    }

    // 跳过某些路径
    if (sensitivePaths.some(p => path.startsWith(p))) {
      await next();
      return;
    }

    // 捕获请求信息
    const walletAddress = c.get('walletAddress');
    const method = c.req.method;
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For');
    const userAgent = c.req.header('User-Agent');

    try {
      await next();
    } catch (err: any) {
      // 记录错误
      logger.error('Request failed', {
        method,
        path,
        walletAddress,
        error: err.message,
      });
      throw err;
    }

    // 记录完成
    const duration = Date.now() - start;
    const status = c.res?.status || 200;

    logger.log({
      timestamp: new Date().toISOString(),
      walletAddress,
      method,
      path,
      status,
      duration,
      ip,
      userAgent,
    });
  };
}

/**
 * 创建控制台审计日志器
 */
export function createConsoleLogger(prefix: string = '[Audit]'): AuditLogger {
  return {
    log: (entry) => {
      console.log(
        `${prefix} ${entry.timestamp} ${entry.method} ${entry.path} ${entry.status} ${entry.duration}ms ${entry.walletAddress || 'anonymous'}`
      );
    },
    warn: (message, data) => {
      console.warn(`${prefix} WARN: ${message}`, data || '');
    },
    error: (message, data) => {
      console.error(`${prefix} ERROR: ${message}`, data || '');
    },
  };
}

/**
 * 创建 KV 审计日志器 (生产环境)
 */
export function createKVLogger(kv: any, namespace: string = 'audit'): AuditLogger {
  return {
    log: async (entry) => {
      const key = `${namespace}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
      try {
        await kv.put(key, JSON.stringify(entry), {
          expirationTtl: 86400 * 7, // 7天过期
        });
      } catch (e) {
        console.error('Failed to write audit log to KV:', e);
      }
    },
    warn: async (message, data) => {
      await createConsoleLogger().warn(message, data);
    },
    error: async (message, data) => {
      await createConsoleLogger().error(message, data);
    },
  };
}

/**
 * 安全事件日志
 */
export function logSecurityEvent(
  logger: AuditLogger,
  event: string,
  data: {
    walletAddress?: string;
    path?: string;
    details?: Record<string, any>;
  }
) {
  logger.warn(`SECURITY: ${event}`, {
    ...data,
    timestamp: new Date().toISOString(),
  });
}
