/**
 * 城市数据 Hook
 * 封装城市相关的 API 调用和状态管理
 */
import { useState, useCallback, useEffect } from 'react';
import { cityApi } from '../services/api/cityApi';
import { getApiBase, getAuthHeaders } from '../utils/api';

// 城市信息接口
export interface CityInfo {
  id: number;
  wallet_address: string;
  name: string;
  position: number;
  prosperity: number;
  money: number;
  food: number;
  population: number;
  money_rate: number;
  food_rate: number;
  population_rate: number;
  map_image: string;
  last_collect: string;
  created_at: string;
}

// 建筑信息接口
export interface BuildingInfo {
  id: number;
  city_id: number;
  config_id: number;
  level: number;
  position: number;
  status: number;
}

// 城市状态 Hook 返回值
export interface UseCityReturn {
  cityInfo: CityInfo | null;
  buildings: BuildingInfo[];
  loading: boolean;
  error: string | null;
  refreshCity: () => Promise<void>;
  refreshBuildings: () => Promise<void>;
  collectResources: () => Promise<boolean>;
  getBuildingIcon: (configId: number, level: number) => string;
  getBuildingName: (configId: number) => string;
}

/**
 * useCity - 城市数据管理 Hook
 */
export function useCity(cityId?: number): UseCityReturn {
  const [cityInfo, setCityInfo] = useState<CityInfo | null>(null);
  const [buildings, setBuildings] = useState<BuildingInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取城市信息
  const refreshCity = useCallback(async () => {
    if (!cityId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await cityApi.getCityInfo(cityId);
      if (res.success && res.data) {
        setCityInfo(res.data);
      } else {
        setError(res.error || '获取城市信息失败');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  // 获取建筑列表
  const refreshBuildings = useCallback(async () => {
    if (!cityId) return;
    
    setLoading(true);
    
    try {
      const res = await cityApi.getBuildingList(cityId);
      if (res.success && res.data) {
        setBuildings(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch buildings:', err);
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  // 收集资源
  const collectResources = useCallback(async (): Promise<boolean> => {
    if (!cityId) return false;
    
    try {
      const res = await cityApi.collect(cityId);
      if (res.success) {
        await refreshCity();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to collect resources:', err);
      return false;
    }
  }, [cityId, refreshCity]);

  // 获取建筑图标路径
  const getBuildingIcon = useCallback((configId: number, level: number): string => {
    let prefix = '';
    let fileName = level;
    
    if (level >= 6 && level <= 10) {
      prefix = 'a';
    } else if (level >= 11 && level <= 15) {
      prefix = 'b';
    } else if (level >= 16 && level <= 20) {
      prefix = 'c';
    } else if (level > 20) {
      prefix = 'c';
      fileName = 20;
    }
    
    return `2/b/m/${prefix}${fileName}.GIF`;
  }, []);

  // 获取建筑名称
  const getBuildingName = useCallback((configId: number): string => {
    const names: Record<number, string> = {
      1: '聚义厅',
      2: '民心设施',
      3: '银库',
      4: '粮仓',
      5: '民居',
      6: '市场',
      7: '铁匠铺',
      8: '客栈',
      9: '兵营',
      10: '校场',
      11: '马厩',
      12: '工坊',
      13: '祭坛',
      14: '驿站',
      15: '仓库',
      16: '城墙',
    };
    return names[configId] || '未知建筑';
  }, []);

  // 初始化加载
  useEffect(() => {
    if (cityId) {
      refreshCity();
      refreshBuildings();
    }
  }, [cityId]);

  return {
    cityInfo,
    buildings,
    loading,
    error,
    refreshCity,
    refreshBuildings,
    collectResources,
    getBuildingIcon,
    getBuildingName,
  };
}

/**
 * 批量城市 Hook - 管理多个城市
 */
export function useCities() {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCities = useCallback(async () => {
    setLoading(true);
    
    try {
      const res = await fetch(`${getApiBase()}/api/game/city/list`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      
      if (data.success && data.data) {
        setCities(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch cities:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cities,
    loading,
    fetchCities,
  };
}
