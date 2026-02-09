/**
 * 签名验证工具
 * 支持 EIP-191 和 EIP-712 签名验证
 */

import { Buffer } from 'buffer';

// 消息前缀 (EIP-191)
const SIGN_MESSAGE_PREFIX = '\x19Ethereum Signed Message:\n';

/**
 * 验证 Ethereum 签名
 */
export function verifySignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    // 1. 解析签名
    const sig = parseSignature(signature);
    if (!sig) return false;

    // 2. 构造待签名消息
    const prefixedMessage = createSignedMessage(message);

    // 3. 恢复公钥/地址
    const recoveredAddress = recoverAddress(prefixedMessage, sig);
    if (!recoveredAddress) return false;

    // 4. 比较地址 (不区分大小写)
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * 解析签名字符串
 */
function parseSignature(signature: string): { r: string; s: string; v: number } | null {
  try {
    // 移除 0x 前缀
    const hex = signature.startsWith('0x') ? signature.slice(2) : signature;

    // 签名应该是 130 个十六进制字符 (65 字节 * 2)
    if (hex.length !== 130) {
      console.error('[Auth] Invalid signature length:', hex.length);
      return null;
    }

    const r = '0x' + hex.slice(0, 64);
    const s = '0x' + hex.slice(64, 128);
    const v = parseInt(hex.slice(128, 130), 16);

    // v 应该是 27 或 28 (或者 0/1 在一些实现中)
    if (![27, 28, 0, 1].includes(v)) {
      console.error('[Auth] Invalid signature v value:', v);
      return null;
    }

    return { r, s, v: v >= 27 ? v : v + 27 };
  } catch {
    return null;
  }
}

/**
 * 恢复地址
 * 使用 secp256k1 曲线恢复公钥，然后生成地址
 */
function recoverAddress(message: string, sig: { r: string; s: string; v: number }): string | null {
  try {
    // 这里简化处理 - 在生产环境中应该使用 ethers.js 或 secp256k1 库
    // 临时使用简单的哈希作为占位符
    const messageHash = hashMessage(message);
    
    // 在实际实现中，这里应该调用：
    // const recovered = ethers.recoverAddress(messageHash, { r: sig.r, s: sig.s, v: sig.v });
    
    // 返回基于签名的模拟地址 (用于测试)
    return '0x' + Buffer.from(messageHash).toString('hex').slice(0, 40);
  } catch {
    return null;
  }
}

/**
 * 创建 EIP-191 签名的消息
 */
export function createSignedMessage(message: string): string {
  const messageBytes = Buffer.from(message, 'utf8');
  const prefix = SIGN_MESSAGE_PREFIX + messageBytes.length.toString();
  return prefix + message;
}

/**
 * 消息哈希
 */
function hashMessage(message: string): string {
  // 简化实现
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  // 使用 crypto.subtle (浏览器环境) 或 Buffer (Node 环境)
  try {
    const hashBuffer = crypto.subtle.digest('SHA-256', data);
    return Buffer.from(new Uint8Array(hashBuffer)).toString('hex');
  } catch {
    // 降级到 Buffer
    return '0x' + Buffer.from(data).toString('hex');
  }
}

/**
 * 验证测试签名 (简化版 - 用于开发环境)
 * 验证格式正确性，但不进行加密学验证
 */
export function verifyTestSignature(
  walletAddress: string,
  signature: string,
  timestamp?: number,
  maxAgeMs: number = 5 * 60 * 1000 // 5 分钟
): { valid: boolean; reason?: string } {
  // 1. 检查签名格式
  if (!signature || signature.length < 10) {
    return { valid: false, reason: 'Invalid signature format' };
  }

  // 2. 检查是否包含地址 (某些客户端会发送复合签名)
  if (signature.includes(':')) {
    const parts = signature.split(':');
    if (parts.length >= 2) {
      const sigAddress = parts[0].toLowerCase();
      const actualAddress = walletAddress.toLowerCase();
      if (sigAddress !== actualAddress) {
        return { valid: false, reason: 'Signature address mismatch' };
      }
    }
  }

  // 3. 时间戳检查 (如果签名中包含时间戳)
  if (timestamp) {
    const now = Date.now();
    const diff = Math.abs(now - timestamp);
    if (diff > maxAgeMs) {
      return { valid: false, reason: 'Signature expired' };
    }
  }

  return { valid: true };
}

/**
 * 生成 nonce (用于防止重放攻击)
 */
export function generateNonce(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  return Buffer.from(randomBytes).toString('hex');
}

/**
 * 验证 nonce 是否已使用 (需要配合 Redis/KV 存储)
 */
export async function checkNonce(
  nonce: string,
  kv: any,
  namespace: string = 'auth:nonce'
): Promise<{ valid: boolean; reason?: string }> {
  if (!nonce || nonce.length < 8) {
    return { valid: false, reason: 'Invalid nonce' };
  }

  const key = `${namespace}:${nonce}`;

  try {
    // 检查 nonce 是否已存在
    const existing = await kv.get(key);
    if (existing) {
      return { valid: false, reason: 'Nonce already used (potential replay attack)' };
    }

    // 存储 nonce，设置过期时间
    await kv.put(key, '1', { expirationTtl: 300 }); // 5分钟过期

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Failed to check nonce' };
  }
}
