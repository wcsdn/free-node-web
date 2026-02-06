/**
 * 认证工具
 */

export interface JWTPayload {
  address: string;
  iat: number;
  exp: number;
}

/**
 * 验证钱包认证
 */
export async function verifyWalletAuth(c: any): Promise<string | null> {
  const authHeader = c.req.header('X-Wallet-Auth');
  
  if (!authHeader) {
    return null;
  }

  try {
    const [address, signature] = authHeader.split(':');
    
    // 简化验证：检查地址格式
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return null;
    }

    return address.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * 生成签名（用于测试）
 */
export function generateSignature(address: string): string {
  const timestamp = Date.now().toString();
  // 简化实现：使用 btoa
  return btoa(`${address}:${timestamp}`);
}
