/**
 * useShop - 商店购买 Hook
 */
import { useState, useCallback, useEffect } from 'react';
import type { ShopItem } from '../types/game.types';
import { shopApi } from '../services/game.api';

interface ShopState {
  items: ShopItem[];
  loading: boolean;
  error: string | null;
}

export function useShop(shopType = 1) {
  const [state, setState] = useState<ShopState>({
    items: [],
    loading: false,
    error: null,
  });

  const loadShop = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await shopApi.getShopList(shopType);
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
          error: result.error || 'Failed to load shop',
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }));
    }
  }, [shopType]);

  const buyItem = useCallback(async (itemId: number, count = 1): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const result = await shopApi.buyItem(itemId, count);
      if (result.success) {
        await loadShop();
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [loadShop]);

  const refreshShop = useCallback(async (): Promise<boolean> => {
    try {
      const result = await shopApi.refreshShop(shopType);
      if (result.success) {
        await loadShop();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [shopType, loadShop]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  return {
    ...state,
    loadShop,
    buyItem,
    refreshShop,
  };
}
