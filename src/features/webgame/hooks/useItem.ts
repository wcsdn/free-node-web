/**
 * useItem - 物品管理 Hook
 */
import { useState, useCallback, useEffect } from 'react';
import { itemApi } from '../services/game.api';

export interface ItemData {
  id: number;
  configId: number;
  name: string;
  type: number;
  count: number;
  equipped: boolean;
}

interface ItemState {
  items: ItemData[];
  loading: boolean;
  error: string | null;
}

export function useItem(_walletAddress: string) {
  const [state, setState] = useState<ItemState>({
    items: [],
    loading: false,
    error: null,
  });

  const loadItems = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await itemApi.getItems();
      if (result.success && result.data) {
        setState({
          items: result.data,
          loading: false,
          error: null,
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || 'Failed to load items',
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }, []);

  const useItemCallback = useCallback(async (itemId: number, count = 1): Promise<boolean> => {
    try {
      const result = await itemApi.useItem(itemId, count);
      if (result.success) {
        await loadItems();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [loadItems]);

  const equipItem = useCallback(async (itemId: number, heroId: number): Promise<boolean> => {
    try {
      const result = await itemApi.equipItem(itemId, heroId);
      if (result.success) {
        await loadItems();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [loadItems]);

  const unequipItem = useCallback(async (itemId: number): Promise<boolean> => {
    try {
      const result = await itemApi.unequipItem(itemId);
      if (result.success) {
        await loadItems();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [loadItems]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return {
    ...state,
    loadItems,
    useItem: useItemCallback,
    equipItem,
    unequipItem,
  };
}
