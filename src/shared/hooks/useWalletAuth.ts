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
    // 只在第一次访问时存储，避免重复处理
    const stored = localStorage.getItem(REF_STORAGE_KEY);
    if (!stored || stored !== ref) {
      localStorage.setItem(REF_STORAGE_KEY, ref);
    }
    
    // 使用 replaceState 清除 URL 参数（不会触发页面刷新）
    // 但要确保在 React 渲染完成后执行
    if (typeof window !== 'undefined' && window.history.replaceState) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('ref');
        window.history.replaceState({}, '', url.toString());
      } catch (err) {
        // 静默失败，不影响功能
        console.warn('Failed to clean URL:', err);
      }
    }
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

// 签名有效期：1 天
const AUTH_EXPIRY = 24 * 60 * 60 * 1000;

// 直接从 localStorage 读取，不用 state
function getAuthHeader(address: string | undefined): string | null {
  if (!address) return null;
  
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const auth: WalletAuth = JSON.parse(stored);
    // 检查是否是同一个地址，且未过期 (1天)
    if (
      auth.address.toLowerCase() === address.toLowerCase() &&
      Date.now() - auth.timestamp < AUTH_EXPIRY
    ) {
      return `${auth.address}:${auth.signature}`;
    }
  } catch {
    // 忽略解析错误
  }
  
  return null;
}

export function useWalletAuth(): UseWalletAuthReturn {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [isSigning, setIsSigning] = useState(false);
  const [, setRefreshKey] = useState(0); // 用于强制刷新
  
  // 直接从 localStorage 读取，不缓存
  const authHeader = getAuthHeader(address);
  const isAuthenticated = !!authHeader;
  const userLevel = isAuthenticated ? 1 : 0;

  // 监听认证变化，强制刷新
  useEffect(() => {
    const handleAuthChange = () => setRefreshKey(k => k + 1);
    window.addEventListener('wallet-auth-changed', handleAuthChange);
    return () => window.removeEventListener('wallet-auth-changed', handleAuthChange);
  }, []);

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
      
      // 触发自定义事件，通知所有组件刷新
      window.dispatchEvent(new CustomEvent('wallet-auth-changed'));
      
      // 静默绑定邀请码 (如果有)
      const newAuthHeader = `${auth.address}:${signature}`;
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
    window.dispatchEvent(new CustomEvent('wallet-auth-changed'));
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
