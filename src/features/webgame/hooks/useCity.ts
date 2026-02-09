/**
 * useCity - 城市状态 Hook
 * 原则：封装数据获取和状态管理，不包含 UI 逻辑
 */
import { useState, useCallback, useEffect } from 'react';
import { cityApi } from '../services/game.api';

interface CityData {
  id: number;
  name: string;
  money: number;
  food: number;
  population: number;
  prosperity?: number;
}

interface BuildingData {
  id: number;
  configId: number;
  name: string;
  type: string;
  level: number;
  position: number;
  state: number;
}

interface CityState {
  city: CityData | null;
  buildings: BuildingData[];
  loading: boolean;
  error: string | null;
}

export function useCity(cityId?: number) {
  const [state, setState] = useState<CityState>({
    city: null,
    buildings: [],
    loading: false,
    error: null,
  });

  const targetId = cityId || 1;

  // 加载城市数据
  const loadCity = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // 首先获取城市基本信息
      const cityResult = await cityApi.getCity();
      
      if (cityResult.success && cityResult.data) {
        // 获取建筑列表
        const buildingResult = await cityApi.getBuildings(targetId);

        setState({
          city: cityResult.data as CityData,
          buildings: (buildingResult.data as any)?.buildings || [],
          loading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: cityResult.error || 'Failed to load city',
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }, [targetId]);

  // 初始加载
  useEffect(() => {
    loadCity();
  }, [loadCity]);

  // 收集资源
  const collect = useCallback(async () => {
    if (!state.city) return false;

    try {
      const result = await cityApi.collectResources(state.city.id);
      const data = result.data as { total?: { money?: number; food?: number } } | undefined;
      const total = data?.total;
      if (result.success && total) {
        setState(prev => ({
          ...prev,
          city: prev.city ? {
            ...prev.city,
            money: total.money ?? prev.city.money,
            food: total.food ?? prev.city.food,
          } : null,
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [state.city]);

  return {
    ...state,
    loadCity,
    collect,
  };
}
