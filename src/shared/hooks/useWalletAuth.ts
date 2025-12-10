/**
 * useWalletAuth - 钱包认证 Hook
 * 
 * 用于生成 X-Wallet-Auth 头，让后端识别用户身份
 * 格式: "0xAddress:signature"
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

const AUTH_STORAGE_KEY = 'ghost_wallet_auth';
const REF_STORAGE_KEY = 'ghost_ref_code';
const AUTH_MESSAGE = 'Sign in to Free-Node\n\nThis signature proves you own this wallet.';

// 检测 URL 中的邀请码并存储
function captureRefCode(): void {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref && /^FN-[A-Z0-9]{6}$/.test(ref)) {
    localStorage.setItem(REF_STORAGE_KEY, ref);
    // 清除 URL 参数，保持干净
    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url.toString());
  }
}

// 静默绑定邀请码
async function silentBindRefCode(authHeader: string): Promise<void> {
  const refCode = localStorage.getItem(REF_STORAGE_KEY);
  if (!refCode) return;
  
  try {
    const response = await fetch('https://core.free-node.xyz/api/user/bind-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Auth': authHeader,
      },
      body: JSON.stringify({ inviteCode: refCode }),
    });
    
    if (response.ok) {
      console.log('Referral code bound successfully:', refCode);
    }
    // 无论成功失败都清除，避免重复尝试
    localStorage.removeItem(REF_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to bind referral code:', err);
  }
}

// 页面加载时捕获邀请码
if (typeof window !== 'undefined') {
  captureRefCode();
}

interface WalletAuth {
  address: string;
  signature: string;
  timestamp: number;
}

interface UseWalletAuthReturn {
  /** 认证头字符串 "0xAddress:signature" */
  authHeader: string | null;
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 是否正在签名 */
  isSigning: boolean;
  /** 用户等级 (从后端获取) */
  userLevel: number;
  /** 触发签名认证 */
  authenticate: () => Promise<boolean>;
  /** 清除认证 */
  clearAuth: () => void;
}

export function useWalletAuth(): UseWalletAuthReturn {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [authHeader, setAuthHeader] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [userLevel, setUserLevel] = useState(0);

  // 从 localStorage 恢复认证
  useEffect(() => {
    if (!address) {
      setAuthHeader(null);
      setUserLevel(0);
      return;
    }

    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const auth: WalletAuth = JSON.parse(stored);
        // 检查是否是同一个地址，且未过期 (7天)
        if (
          auth.address.toLowerCase() === address.toLowerCase() &&
          Date.now() - auth.timestamp < 7 * 24 * 60 * 60 * 1000
        ) {
          setAuthHeader(`${auth.address}:${auth.signature}`);
          setUserLevel(1); // 已连接钱包至少是 Lv1
          return;
        }
      } catch {
        // 忽略解析错误
      }
    }
    
    // 没有有效认证
    setAuthHeader(null);
  }, [address]);

  // 触发签名认证
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!address || !isConnected) return false;
    if (isSigning) return false;

    setIsSigning(true);
    try {
      const signature = await signMessageAsync({ message: AUTH_MESSAGE });
      
      const auth: WalletAuth = {
        address: address.toLowerCase(),
        signature,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
      const newAuthHeader = `${auth.address}:${signature}`;
      setAuthHeader(newAuthHeader);
      setUserLevel(1);
      
      // 静默绑定邀请码 (如果有)
      silentBindRefCode(newAuthHeader);
      
      return true;
    } catch (err) {
      console.error('Wallet auth failed:', err);
      return false;
    } finally {
      setIsSigning(false);
    }
  }, [address, isConnected, isSigning, signMessageAsync]);

  // 清除认证
  const clearAuth = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthHeader(null);
    setUserLevel(0);
  }, []);

  // 断开钱包时清除认证
  useEffect(() => {
    if (!isConnected) {
      clearAuth();
    }
  }, [isConnected, clearAuth]);

  return {
    authHeader,
    isAuthenticated: !!authHeader,
    isSigning,
    userLevel,
    authenticate,
    clearAuth,
  };
}
