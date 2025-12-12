/**
 * 用户数据全局状态管理
 */

import { create } from 'zustand';

interface UserInfo {
  address: string | null;
  level: number;
  levelName: string;
  inviteCode: string | null;
  invitedBy: string | null;
  mailQuota: number;
  xp: number;
  xp_level: number;
  usage: {
    ai: { today: number; limit: number | 'unlimited' };
  };
}

interface UserState {
  userInfo: UserInfo | null;
  loading: boolean;
  lastFetch: number;
  
  // 获取用户数据
  fetchUserInfo: (authHeader: string | null) => Promise<void>;
  
  // 清空用户数据
  clearUserInfo: () => void;
  
  // 手动更新部分数据
  updateUserInfo: (partial: Partial<UserInfo>) => void;
}

const CORE_API = 'https://core.free-node.xyz';
const CACHE_DURATION = 5000; // 5秒缓存

export const useUserStore = create<UserState>((set, get) => ({
  userInfo: null,
  loading: false,
  lastFetch: 0,

  fetchUserInfo: async (authHeader: string | null) => {
    const now = Date.now();
    const { lastFetch, loading } = get();
    
    // 防抖：5秒内不重复请求
    if (loading || (now - lastFetch < CACHE_DURATION)) {
      return;
    }

    set({ loading: true });
    
    try {
      const headers: HeadersInit = authHeader ? { 'X-Wallet-Auth': authHeader } : {};
      const response = await fetch(`${CORE_API}/api/user`, { headers });
      
      if (response.ok) {
        const data = await response.json();
        set({ userInfo: data, lastFetch: now });
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    } finally {
      set({ loading: false });
    }
  },

  clearUserInfo: () => {
    set({ userInfo: null, lastFetch: 0 });
  },

  updateUserInfo: (partial: Partial<UserInfo>) => {
    const { userInfo } = get();
    if (userInfo) {
      set({ userInfo: { ...userInfo, ...partial } });
    }
  },
}));
