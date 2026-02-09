/**
 * useBuilding - 建筑操作 Hook
 * 原则：封装数据获取和状态管理，不包含 UI 逻辑
 */
import { useState, useCallback, useEffect } from 'react';
import type { Building } from '../types/game.types';
import { buildingApi } from '../services/game.api';

interface BuildingState {
  buildings: Building[];
  loading: boolean;
  error: string | null;
}

export function useBuilding(cityId: number) {
  const [state, setState] = useState<BuildingState>({
    buildings: [],
    loading: false,
    error: null,
  });

  const loadBuildings = useCallback(async () => {
    if (!cityId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await buildingApi.getBuildings(cityId);
      if (result.success && result.data) {
        setState({
          buildings: result.data.buildings,
          loading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to load buildings',
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }, [cityId]);

  const upgradeBuilding = useCallback(async (buildingId: number): Promise<boolean> => {
    try {
      const result = await buildingApi.upgradeBuilding(buildingId);
      if (result.success) {
        await loadBuildings();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [loadBuildings]);

  const buildBuilding = useCallback(async (
    configId: number,
    position: number
  ): Promise<boolean> => {
    try {
      const result = await buildingApi.buildBuilding(cityId, configId, position);
      if (result.success) {
        await loadBuildings();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [cityId, loadBuildings]);

  const demolishBuilding = useCallback(async (buildingId: number): Promise<boolean> => {
    try {
      const result = await buildingApi.demolishBuilding(buildingId);
      if (result.success) {
        await loadBuildings();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [loadBuildings]);

  useEffect(() => {
    loadBuildings();
  }, [loadBuildings]);

  return {
    ...state,
    loadBuildings,
    upgradeBuilding,
    buildBuilding,
    demolishBuilding,
  };
}
