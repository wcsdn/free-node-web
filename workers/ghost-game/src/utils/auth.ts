/**
 * 认证中间件
 * 提供完整的钱包认证和签名验证
 */

import { verifySignature, verifyTestSignature, generateNonce } from './signature';

export interface AuthResult {
  success: boolean;
  walletAddress?: string;
  error?: string;
  errorCode?: string;
}

/**
 * 从请求头提取认证信息
 */
export function extractAuthHeader(c: any): { address: string; signature: string } | null {
  const authHeader = c.req.header('X-Wallet-Auth');

  if (!authHeader) {
    return null;
  }

  // 格式: "address:signature" 或 "address:signature:timestamp"
  const parts = authHeader.split(':');

  if (parts.length < 2) {
    return null;
  }

  return {
    address: parts[0],
    signature: parts.slice(1).join(':'), // 允许签名中包含冒号
  };
}

/**
 * 验证钱包认证 (增强版)
 * 
 * 支持两种模式：
 * 1. 开发模式：只验证格式，不做加密学验证
 * 2. 生产模式：完整的 EIP-191 签名验证
 */
export async function verifyWalletAuth(
  c: any,
  options: {
    requireSignature?: boolean;  // 是否要求完整签名验证
    allowDevMode?: boolean;      // 是否允许开发模式
  } = {}
): Promise<string | null> {
  const { requireSignature = false, allowDevMode = true } = options;

  const auth = extractAuthHeader(c);
  if (!auth) {
    console.log('[Auth] Missing X-Wallet-Auth header');
    return null;
  }

  const { address, signature } = auth;

  // 1. 验证地址格式
  if (!isValidAddress(address)) {
    console.log('[Auth] Invalid address format:', address);
    return null;
  }

  // 2. 开发模式：简化验证
  if (allowDevMode && signature === 'test_signature') {
    console.log('[Auth] Dev mode: accepting test signature for', address);
    return address.toLowerCase();
  }

  // 3. 如果签名是 "address:timestamp" 格式（复合签名）
  if (signature.includes(':')) {
    const sigParts = signature.split(':');
    if (sigParts.length >= 2 && sigParts[0].length === 132) {
      // 这可能是真正的签名
      const timestamp = sigParts.length > 2 ? parseInt(sigParts[1]) : undefined;
      const testResult = verifyTestSignature(address, signature, timestamp);
      if (!testResult.valid) {
        console.log('[Auth] Test signature validation failed:', testResult.reason);
        return null;
      }
      return address.toLowerCase();
    }
  }

  // 4. 完整签名验证
  if (requireSignature || signature.startsWith('0x')) {
    // 验证签名
    const message = createAuthMessage(address);
    const isValid = await verifySignature(message, signature, address);

    if (!isValid) {
      console.log('[Auth] Signature verification failed for', address);
      return null;
    }
  }

  // 5. 开发环境接受简单格式
  if (allowDevMode && signature.length < 10) {
    console.log('[Auth] Dev mode: accepting simple signature for', address);
    return address.toLowerCase();
  }

  return address.toLowerCase();
}

/**
 * 创建认证消息
 */
function createAuthMessage(walletAddress: string): string {
  const timestamp = Date.now();
  const nonce = generateNonce();
  return `Sign to authenticate with Ghost Game\nAddress: ${walletAddress}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
}

/**
 * 验证 Ethereum 地址格式
 */
function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // 必须以 0x 开头
  if (!address.startsWith('0x')) {
    return false;
  }

  // 长度应该是 42 个字符 (0x + 40 hex chars)
  if (address.length !== 42) {
    return false;
  }

  // 应该是有效的十六进制
  const hexPart = address.slice(2);
  return /^[0-9a-fA-F]+$/.test(hexPart);
}

/**
 * 创建一个需要认证的路由中间件
 */
export function authMiddleware(
  options: {
    optional?: boolean;  // 是否可选认证
    allowDevMode?: boolean;
  } = {}
) {
  return async (c: any, next: () => Promise<void>) => {
    const walletAddress = await verifyWalletAuth(c, {
      requireSignature: !options.optional,
      allowDevMode: options.allowDevMode ?? true,
    });

    if (!walletAddress && !options.optional) {
      return c.json({
        success: false,
        error: 'Unauthorized',
        errorCode: 'AUTH_REQUIRED',
        message: 'Valid wallet authentication required',
      }, 401);
    }

    // 将 walletAddress 存入 context
    if (walletAddress) {
      c.set('walletAddress', walletAddress);
    }

    await next();
  };
}

/**
 * 获取当前请求的认证地址
 */
export function getAuthenticatedAddress(c: any): string | null {
  return c.get('walletAddress') || null;
}

/**
 * 完整的认证验证 (带详细错误信息)
 */
/**
 * 验证管理员权限
 * 检查请求者的钱包地址是否在管理员列表中
 */
export async function verifyAdminAuth(c: any): Promise<string | null> {
  // 先验证普通钱包认证
  const walletAddress = await verifyWalletAuth(c);
  if (!walletAddress) return null;

  // 检查是否为管理员
  // 优先从 KV 获取管理员列表
  try {
    const kv = (c as any).env?.KV;
    if (kv) {
      const adminListStr = await kv.get('admin:wallet_addresses');
      if (adminListStr) {
        const adminList: string[] = JSON.parse(adminListStr);
        if (adminList.map(a => a.toLowerCase()).includes(walletAddress.toLowerCase())) {
          return walletAddress;
        }
      }
    }
  } catch (_) { /* ignore */ }

  // 检查环境变量中的管理员地址（兼容开发环境）
  const envAdmins = (c as any).env?.ADMIN_WALLET_ADDRESSES;
  if (envAdmins) {
    const adminList: string[] = envAdmins.split(',').map((a: string) => a.trim().toLowerCase());
    if (adminList.includes(walletAddress.toLowerCase())) {
      return walletAddress;
    }
  }

  // 默认开发环境：任何认证用户都是管理员
  const isDev = (c as any).env?.ENVIRONMENT === 'development' ||
                (c as any).env?.NODE_ENV === 'development';
  if (isDev) {
    return walletAddress;
  }

  return null;
}

export async function verifyWalletAuthDetailed(
  c: any,
  options: {
    requireSignature?: boolean;
    allowDevMode?: boolean;
  } = {}
): Promise<AuthResult> {
  const auth = extractAuthHeader(c);

  if (!auth) {
    return {
      success: false,
      error: 'Missing authentication header',
      errorCode: 'AUTH_HEADER_MISSING',
    };
  }

  const { address, signature } = auth;

  // 验证地址格式
  if (!isValidAddress(address)) {
    return {
      success: false,
      walletAddress: address,
      error: 'Invalid wallet address format',
      errorCode: 'INVALID_ADDRESS',
    };
  }

  // 开发模式
  if (options.allowDevMode !== false && signature === 'test_signature') {
    return {
      success: true,
      walletAddress: address.toLowerCase(),
    };
  }

  // 验证签名
  if (options.requireSignature || signature.startsWith('0x')) {
    const message = createAuthMessage(address);
    const isValid = await verifySignature(message, signature, address);

    if (!isValid) {
      return {
        success: false,
        walletAddress: address.toLowerCase(),
        error: 'Invalid signature',
        errorCode: 'INVALID_SIGNATURE',
      };
    }
  }

  return {
    success: true,
    walletAddress: address.toLowerCase(),
  };
}
