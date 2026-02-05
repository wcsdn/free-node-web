/**
 * 市场 Hook
 * React Hook for market functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { marketApi, MarketItem, ResourceType, TradeAction, ResourcePrice } from '../services/api/marketApi';

// 市场 Hook
export function useMarket() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [trading, setTrading] = useState<number | null>(null);
  const [resourcePrices, setResourcePrices] = useState<ResourcePrice[]>([]);

  // 加载市场列表
  const loadItems = useCallback(async (searchKeyword?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await marketApi.getItems(page, pageSize, searchKeyword || keyword);
      if (res.success) {
        setItems(res.data.items);
        setTotalCount(res.data.totalCount);
      } else {
        setError(res.message || '加载市场列表失败');
      }
    } catch (err) {
      console.error('Failed to load market items:', err);
      setError('加载市场列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, keyword]);

  // 加载资源价格
  const loadResourcePrices = useCallback(async () => {
    try {
      const res = await marketApi.getResourcePrices();
      if (res.success) {
        setResourcePrices(res.data);
      }
    } catch (err) {
      console.error('Failed to load resource prices:', err);
    }
  }, []);

  // 购买物品
  const buyItem = useCallback(async (item: MarketItem, quantity: number) => {
    setTrading(item.id);
    
    try {
      const res = await marketApi.buy({
        itemId: item.itemId,
        action: 'buy',
        quantity,
      });
      
      if (res.success) {
        return { success: true, message: `成功购买 ${item.itemName} x${quantity}` };
      } else {
        return { success: false, message: res.message || '购买失败' };
      }
    } catch (err) {
      console.error('Failed to buy item:', err);
      return { success: false, message: '购买失败' };
    } finally {
      setTrading(null);
    }
  }, []);

  // 卖出物品
  const sellItem = useCallback(async (item: MarketItem, quantity: number, unitPrice: number) => {
    setTrading(item.id);
    
    try {
      const res = await marketApi.sell({
        itemId: item.itemId,
        action: 'sell',
        quantity,
        unitPrice,
      });
      
      if (res.success) {
        return { success: true, message: `成功上架 ${item.itemName} x${quantity}` };
      } else {
        return { success: false, message: res.message || '上架失败' };
      }
    } catch (err) {
      console.error('Failed to sell item:', err);
      return { success: false, message: '上架失败' };
    } finally {
      setTrading(null);
    }
  }, []);

  // 快速交易资源
  const tradeResource = useCallback(async (
    resourceType: ResourceType,
    action: TradeAction,
    amount: number
  ) => {
    setTrading(0);
    
    try {
      if (action === 'buy') {
        const res = await marketApi.buyResource(resourceType, amount);
        if (res.success) {
          return { success: true, message: `成功买入 ${amount} ${resourceType}` };
        }
        return { success: false, message: res.message || '购买失败' };
      } else {
        const res = await marketApi.sellResource(resourceType, amount);
        if (res.success) {
          return { success: true, message: `成功卖出 ${amount} ${resourceType}` };
        }
        return { success: false, message: res.message || '卖出失败' };
      }
    } catch (err) {
      console.error('Failed to trade resource:', err);
      return { success: false, message: '交易失败' };
    } finally {
      setTrading(null);
    }
  }, []);

  // 搜索
  const search = useCallback((keyword: string) => {
    setKeyword(keyword);
    setPage(1);
    loadItems(keyword);
  }, [loadItems]);

  // 翻页
  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
    loadItems();
  }, [loadItems]);

  // 初始加载
  useEffect(() => {
    loadItems();
    loadResourcePrices();
  }, []);

  return {
    items,
    loading,
    error,
    page,
    pageSize,
    totalCount,
    trading,
    resourcePrices,
    loadItems,
    buyItem,
    sellItem,
    tradeResource,
    search,
    changePage,
    refresh: () => loadItems(),
  };
}

// 资源配置
export const RESOURCE_CONFIG: Record<ResourceType, { id: ResourceType; name: string; icon: string; unit: string }> = {
  food: { id: 'food', name: '粮食', icon: '/jx/Web/img/4/3.gif', unit: '石' },
  money: { id: 'money', name: '银两', icon: '/jx/Web/img/4/2.gif', unit: '两' },
  population: { id: 'population', name: '人口', icon: '/jx/Web/img/4/1.gif', unit: '人' },
};
