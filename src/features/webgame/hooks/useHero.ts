/**
 * 武将数据 Hook
 * 封装武将相关的 API 调用和状态管理
 */
import { useState, useCallback, useEffect } from 'react';
import { gameApi } from '../services/gameApi';

// 武将信息接口
export interface HeroInfo {
  id: number;
  static_index: number;
  name: string;
  quality: number;
  level: number;
  exp: number;
  attack: number;
  defense: number;
  hp: number;
  skill_points: number;
  hero_state: number;
  weapon_id: number;
  armor_id: number;
  accessory_id: number;
  mount_id: number;
  soldiers: number;
  soldiers_max: number;
  created_at: string;
  skill_ids?: number[];
}

// 武将列表 Hook 返回值
export interface UseHeroesReturn {
  heroes: HeroInfo[];
  loading: boolean;
  error: string | null;
  refreshHeroes: () => Promise<void>;
  getHeroDetail: (heroId: number) => Promise<HeroInfo | null>;
  upgradeHero: (heroId: number) => Promise<boolean>;
  dismissHero: (heroId: number) => Promise<boolean>;
}

/**
 * useHeroes - 武将列表 Hook
 */
export function useHeroes(): UseHeroesReturn {
  const [heroes, setHeroes] = useState<HeroInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取武将列表
  const refreshHeroes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await gameApi.getHeroList();
      
      if (res.success && res.data) {
        setHeroes(res.data);
      } else {
        setError(res.error || '获取武将列表失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取武将详情
  const getHeroDetail = useCallback(async (heroId: number): Promise<HeroInfo | null> => {
    try {
      const res = await gameApi.getHeroDetail(heroId);
      
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to get hero detail:', err);
      return null;
    }
  }, []);

  // 升级武将
  const upgradeHero = useCallback(async (heroId: number): Promise<boolean> => {
    try {
      const res = await gameApi.upgradeHero(heroId);
      
      if (res.success) {
        await refreshHeroes();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to upgrade hero:', err);
      return false;
    }
  }, [refreshHeroes]);

  // 解雇武将
  const dismissHero = useCallback(async (heroId: number): Promise<boolean> => {
    try {
      const res = await gameApi.dismissHero(heroId);
      
      if (res.success) {
        await refreshHeroes();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to dismiss hero:', err);
      return false;
    }
  }, [refreshHeroes]);

  // 初始化加载
  useEffect(() => {
    refreshHeroes();
  }, []);

  return {
    heroes,
    loading,
    error,
    refreshHeroes,
    getHeroDetail,
    upgradeHero,
    dismissHero,
  };
}

/**
 * useHeroDetail - 单个武将详情 Hook
 */
export function useHeroDetail(heroId: number | null) {
  const [hero, setHero] = useState<HeroInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!heroId) return;
    
    setLoading(true);
    
    try {
      const res = await gameApi.getHeroDetail(heroId);
      
      if (res.success && res.data) {
        setHero(res.data);
      }
    } catch (err) {
      console.error('Failed to get hero detail:', err);
    } finally {
      setLoading(false);
    }
  }, [heroId]);

  useEffect(() => {
    if (heroId) {
      refresh();
    }
  }, [heroId]);

  return {
    hero,
    loading,
    refresh,
  };
}

/**
 * 武将品质等级映射
 */
export const HERO_QUALITY_COLORS: Record<number, string> = {
  1: '#808080',  // 灰色 - 普通
  2: '#4CAF50',  // 绿色 - 优秀
  3: '#2196F3',  // 蓝色 - 稀有
  4: '#9C27B0',  // 紫色 - 史诗
  5: '#FF9800',  // 橙色 - 传说
  6: '#F44336',  // 红色 - 神话
};

/**
 * 获取武将品质颜色
 */
export function getHeroQualityColor(quality: number): string {
  return HERO_QUALITY_COLORS[quality] || '#808080';
}
